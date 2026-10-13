// controlli — controlli del pannello dei filtri dell'interrogazione (ADR 0029: si applicano dal vivo, nessun "Applica").
// Bootstrap Italia per i campi e le caselle (classi form-*, ui-opzione), chip a pressione (aria-pressed) per le scelte
// brevi, <details> per i gruppi a scomparsa: nessun comportamento ARIA complesso, quindi niente react-aria qui.
// Il debounce di TUTTI i controlli sta in useCriteri (review v1 V-15): i campi di testo passano subito un valore valido e
// non mandano mai un valore che il backend rifiuterebbe (testo sotto i 3 caratteri o con caratteri di controllo, importo
// non leggibile, fascia rovesciata): lo dicono accanto al campo (aria-invalid).
import { useState } from 'react';
import type { ReactNode } from 'react';
import { filtraRighe } from '../../../shared/lib';

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

/** Bozza del campo: un cambio esterno (chip tolto, "Azzera") la riallinea; un valore valido e diverso passa subito. */
function useBozza(valore: string, valido: (s: string) => boolean, onCambia: (s: string) => void) {
  const [bozza, setBozza] = useState(valore);
  const [valorePrima, setValorePrima] = useState(valore);
  if (valore !== valorePrima) {
    setValorePrima(valore);
    setBozza(valore);
  }
  const scrivi = (s: string) => {
    setBozza(s);
    if (s !== valore && valido(s)) onCambia(s);
  };
  return [bozza, scrivi] as const;
}

function descrittoDa(id: string, conAiuto: boolean, nonValido: boolean): string | undefined {
  const ids = [conAiuto ? `${id}-aiuto` : null, nonValido ? `${id}-errore` : null].filter(Boolean);
  return ids.length > 0 ? ids.join(' ') : undefined;
}

/**
 * Campo di testo di un filtro: un valore valido passa subito a `onCambia` (che lo applica col debounce dell'interrogazione);
 * un cambio esterno (chip tolto, "Azzera") riallinea il campo. `aiuto` spiega il formato; un valore non valido lo dice
 * (aria-invalid) e non parte.
 */
export function CampoFiltro({
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
  const [bozza, scrivi] = useBozza(valore, valido, onCambia);
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
        onChange={(e) => scrivi(e.target.value)}
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
