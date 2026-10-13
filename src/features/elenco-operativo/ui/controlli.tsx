// controlli — controlli del pannello dei filtri dell'interrogazione (ADR 0029: si applicano dal vivo, nessun "Applica").
// Bootstrap Italia per i campi e le caselle (classi form-*, ui-opzione), chip a pressione (aria-pressed) per le scelte
// brevi, <details> per i gruppi a scomparsa: nessun comportamento ARIA complesso, quindi niente react-aria qui.
// I campi di testo aspettano RITARDO_MS dall'ultima battuta prima di cambiare l'indirizzo (debounce) e non mandano un
// valore che il backend rifiuterebbe (testo sotto i 3 caratteri, importo non leggibile): lo dicono accanto al campo.
import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { filtraRighe } from '../../../shared/lib';

export const RITARDO_MS = 300;

export interface Opzione {
  valore: string;
  etichetta: string;
}

export function Gruppo({ titolo, scelti, aperto = false, children }: { titolo: string; scelti: number; aperto?: boolean; children: ReactNode }) {
  return (
    <details className="ui-gruppo-filtro" open={aperto}>
      <summary>
        {titolo}
        {scelti > 0 && <span className="ui-gruppo-filtro__conta">{scelti === 1 ? '1 scelto' : `${scelti} scelti`}</span>}
      </summary>
      <div className="ui-gruppo-filtro__corpo">{children}</div>
    </details>
  );
}

/** Caselle di un filtro ripetibile, con la ricerca fra le voci quando sono piu' di 8. */
export function Caselle({ id, etichetta, opzioni, scelti, onCambia }: { id: string; etichetta: string; opzioni: Opzione[]; scelti: readonly string[]; onCambia: (v: string[]) => void }) {
  const [cercato, setCercato] = useState('');
  const visibili = filtraRighe(opzioni, cercato, (o) => `${o.valore} ${o.etichetta}`);
  return (
    <fieldset>
      <legend className="visually-hidden">{etichetta}</legend>
      {opzioni.length > 8 && (
        <>
          <label className="visually-hidden" htmlFor={`${id}-cerca`}>{`Cerca in ${etichetta}`}</label>
          <input id={`${id}-cerca`} className="ui-campo-cerca" type="search" placeholder="Cerca" value={cercato} onChange={(e) => setCercato(e.target.value)} />
        </>
      )}
      <div className="ui-opzioni">
        {visibili.map((o) => (
          <label key={o.valore} className="ui-opzione">
            <input type="checkbox" checked={scelti.includes(o.valore)} onChange={(e) => onCambia(e.target.checked ? [...scelti, o.valore] : scelti.filter((v) => v !== o.valore))} />
            <span>{o.etichetta}</span>
          </label>
        ))}
        {opzioni.length === 0 && <p className="small text-muted mb-0">Nessun valore nel tuo perimetro.</p>}
        {opzioni.length > 0 && visibili.length === 0 && <p className="small text-muted mb-0">Nessuna voce corrisponde alla ricerca.</p>}
      </div>
    </fieldset>
  );
}

/** Scelte brevi come chip a pressione: ripetibili (piu' valori in alternativa) o esclusive (un solo valore, ri-clic toglie). */
export function Scelte({ etichetta, opzioni, scelti, esclusive = false, onCambia }: { etichetta: string; opzioni: Opzione[]; scelti: readonly string[]; esclusive?: boolean; onCambia: (v: string[]) => void }) {
  const commuta = (valore: string, attivo: boolean): string[] => {
    if (attivo) return scelti.filter((v) => v !== valore);
    return esclusive ? [valore] : [...scelti, valore];
  };
  return (
    <div className="ui-toggle-chips" role="group" aria-label={etichetta}>
      {opzioni.map((o) => {
        const attivo = scelti.includes(o.valore);
        return (
          <button key={o.valore} type="button" className="ui-toggle-chip" aria-pressed={attivo} onClick={() => onCambia(commuta(o.valore, attivo))}>
            {o.etichetta}
          </button>
        );
      })}
    </div>
  );
}

/** Bozza del campo: un cambio esterno (chip tolto, "Azzera") la riallinea; un valore valido parte dopo RITARDO_MS. */
function useBozzaRitardata(valore: string, valido: (s: string) => boolean, onCambia: (s: string) => void) {
  const [bozza, setBozza] = useState(valore);
  const [valorePrima, setValorePrima] = useState(valore);
  if (valore !== valorePrima) {
    setValorePrima(valore);
    setBozza(valore);
  }
  const cambia = useRef(onCambia);
  useEffect(() => {
    cambia.current = onCambia;
  }, [onCambia]);
  useEffect(() => {
    if (bozza === valore || !valido(bozza)) return undefined;
    const timer = setTimeout(() => cambia.current(bozza), RITARDO_MS);
    return () => clearTimeout(timer);
  }, [bozza, valore, valido]);
  return [bozza, setBozza] as const;
}

function descrittoDa(id: string, conAiuto: boolean, nonValido: boolean): string | undefined {
  const ids = [conAiuto ? `${id}-aiuto` : null, nonValido ? `${id}-errore` : null].filter(Boolean);
  return ids.length > 0 ? ids.join(' ') : undefined;
}

/**
 * Campo di testo che porta il valore nell'indirizzo RITARDO_MS dopo l'ultima battuta, se `valido`; un cambio esterno
 * (chip tolto, "Azzera") riallinea il campo. `aiuto` spiega il formato; un valore non valido lo dice (aria-invalid).
 */
export function CampoRitardato({
  id,
  etichetta,
  valore,
  valido,
  onCambia,
  aiuto,
  errore,
  tipo = 'search',
  modo,
}: {
  id: string;
  etichetta: string;
  valore: string;
  valido: (s: string) => boolean;
  onCambia: (s: string) => void;
  aiuto?: string;
  errore: string;
  tipo?: 'search' | 'text';
  modo?: 'decimal';
}) {
  const [bozza, setBozza] = useBozzaRitardata(valore, valido, onCambia);
  const nonValido = bozza.trim() !== '' && !valido(bozza);
  const descritto = descrittoDa(id, Boolean(aiuto), nonValido);
  return (
    <div className="ui-campo">
      <label className="form-label" htmlFor={id}>
        {etichetta}
      </label>
      <input
        id={id}
        className={nonValido ? 'form-control is-invalid' : 'form-control'}
        type={tipo}
        inputMode={modo}
        value={bozza}
        aria-invalid={nonValido || undefined}
        aria-describedby={descritto}
        onChange={(e) => setBozza(e.target.value)}
      />
      {aiuto && (
        <p id={`${id}-aiuto`} className="form-text">
          {aiuto}
        </p>
      )}
      {nonValido && (
        <p id={`${id}-errore`} className="invalid-feedback d-block">
          {errore}
        </p>
      )}
    </div>
  );
}
