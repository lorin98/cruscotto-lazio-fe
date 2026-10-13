// controlli — controlli del pannello dei filtri dell'interrogazione (ADR 0029: si applicano dal vivo, nessun "Applica").
// Bootstrap Italia per i campi e le caselle (classi form-*, ui-opzione), chip a pressione (aria-pressed) per le scelte
// brevi, <details> per i gruppi a scomparsa: nessun comportamento ARIA complesso, quindi niente react-aria qui.
// Il debounce di TUTTI i controlli sta in useCriteri (review v1 V-15): i campi di testo passano subito un valore valido e
// non mandano mai un valore che il backend rifiuterebbe (testo sotto i 3 caratteri o con caratteri di controllo, importo
// non leggibile, fascia rovesciata): lo dicono accanto al campo (aria-invalid). Il campo non riscrive mai cio' che l'utente
// sta scrivendo (review v2 X-01: "10.000" resta "10.000", non diventa "10,0" a meta'); un valore tornato non valido ritira
// la sua parte di bozza (H-01). I due estremi di una fascia di importo sono una bozza sola (A-02): la coppia parte insieme.
import { useState } from 'react';
import type { ReactNode } from 'react';
import { filtraRighe } from '../../../shared/lib';
import { leggiFascia } from '../lib/criteri';

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

/** Bozza del campo (review v2 X-01, H-01): un cambio esterno (chip tolto) la riallinea, ma non se vale gia' quel valore
 *  (`equivale`) ne' se e' un valore non valido in corso; un valore valido e diverso passa subito, uno non valido si ritira. */
function useBozza(valore: string, valido: (s: string) => boolean, equivale: (bozza: string, valore: string) => boolean, onCambia: (s: string) => void, onNonValido?: () => void) {
  const [bozza, setBozza] = useState(valore);
  const [valorePrima, setValorePrima] = useState(valore);
  if (valore !== valorePrima) {
    setValorePrima(valore);
    const inCorso = bozza.trim() !== '' && !valido(bozza);
    if (!inCorso && !equivale(bozza, valore)) setBozza(valore);
  }
  const scrivi = (s: string) => {
    setBozza(s);
    if (!valido(s)) onNonValido?.();
    else if (!equivale(s, valore)) onCambia(s);
  };
  return [bozza, scrivi] as const;
}

function descrittoDa(id: string, conAiuto: boolean, nonValido: boolean): string | undefined {
  const ids = [conAiuto ? `${id}-aiuto` : null, nonValido ? `${id}-errore` : null].filter(Boolean);
  return ids.length > 0 ? ids.join(' ') : undefined;
}

interface PropsCampo {
  id: string;
  etichetta: string;
  aiuto?: string;
  errore: string;
  tipo?: 'search' | 'text';
  modo?: 'decimal';
}

/** Il campo come si vede: etichetta, input, aiuto e, se non valido, l'errore (aria-invalid, aria-describedby). */
function Campo({ id, etichetta, aiuto, errore, tipo = 'search', modo, valore, nonValido, onScrivi }: PropsCampo & { valore: string; nonValido: boolean; onScrivi: (s: string) => void }) {
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
        value={valore}
        aria-invalid={nonValido || undefined}
        aria-describedby={descritto}
        onChange={(e) => onScrivi(e.target.value)}
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

const stessoTesto = (a: string, b: string) => a.trim() === b.trim();

/**
 * Campo di testo di un filtro: un valore valido passa subito a `onCambia` (che lo applica col debounce dell'interrogazione);
 * un cambio esterno (chip tolto) riallinea il campo. `aiuto` spiega il formato; un valore non valido lo dice (aria-invalid),
 * non parte e chiama `onNonValido` (ritira la bozza del filtro, review v2 H-01).
 */
export function CampoFiltro({
  valore,
  valido,
  onCambia,
  onNonValido,
  equivale = stessoTesto,
  ...campo
}: PropsCampo & {
  valore: string;
  valido: (s: string) => boolean;
  onCambia: (s: string) => void;
  onNonValido?: () => void;
  equivale?: (bozza: string, valore: string) => boolean;
}) {
  const [bozza, scrivi] = useBozza(valore, valido, equivale, onCambia, onNonValido);
  return <Campo {...campo} valore={bozza} nonValido={bozza.trim() !== '' && !valido(bozza)} onScrivi={scrivi} />;
}

/** Estremo del contratto (punto decimale) come si scrive nel campo (virgola decimale). */
const inCampo = (v: string | undefined) => (v ? v.replace('.', ',') : '');

/**
 * Fascia di importo (review v2 A-02): i due estremi sono una bozza sola. Ogni tasto rilegge la coppia: valida e diversa da
 * quella applicata parte insieme (un estremo scartato perche' rovesciava la fascia parte quando l'altro la raddrizza), non
 * valida non parte e ritira la fascia dalla bozza (`onNonValida`). Un cambio esterno riallinea i campi, ma non una coppia
 * che vale gia' quei valori (X-01) ne' una non valida in corso. Rovesciata: l'errore e' sul campo appena scritto.
 */
export function CampiFascia({
  id,
  legenda,
  da,
  a,
  errore,
  onCambia,
  onNonValida,
}: {
  id: string;
  legenda: string;
  /** Estremi nel formato del contratto (applicati o in bozza). */
  da: string | undefined;
  a: string | undefined;
  errore: string;
  onCambia: (da: string | null, a: string | null) => void;
  onNonValida: () => void;
}) {
  const [testi, setTesti] = useState(() => ({ da: inCampo(da), a: inCampo(a) }));
  const [ultimo, setUltimo] = useState<'da' | 'a'>('a');
  const [prima, setPrima] = useState({ da, a });
  if (prima.da !== da || prima.a !== a) {
    setPrima({ da, a });
    const e = leggiFascia(testi.da, testi.a);
    if (e.valida && (e.da !== (da ?? null) || e.a !== (a ?? null))) setTesti({ da: inCampo(da), a: inCampo(a) });
  }
  const esito = leggiFascia(testi.da, testi.a);
  const nonValido = (campo: 'da' | 'a') => !esito.valida && (esito.motivo === 'rovesciata' ? campo === ultimo : esito.campi.includes(campo));
  const scrivi = (campo: 'da' | 'a') => (s: string) => {
    const t = { ...testi, [campo]: s };
    setTesti(t);
    setUltimo(campo);
    const e = leggiFascia(t.da, t.a);
    if (!e.valida) onNonValida();
    else if (e.da !== (da ?? null) || e.a !== (a ?? null)) onCambia(e.da, e.a);
  };
  return (
    <fieldset>
      <legend>{legenda}</legend>
      <div className="ui-intervallo">
        <Campo id={`${id}-da`} etichetta="Da" tipo="text" modo="decimal" errore={errore} valore={testi.da} nonValido={nonValido('da')} onScrivi={scrivi('da')} />
        <Campo id={`${id}-a`} etichetta="Fino a" tipo="text" modo="decimal" errore={errore} valore={testi.a} nonValido={nonValido('a')} onScrivi={scrivi('a')} />
      </div>
    </fieldset>
  );
}
