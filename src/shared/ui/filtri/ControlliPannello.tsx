// ControlliPannello — controlli senza dominio dei pannelli dei filtri (UI v2): gruppo a scomparsa col numero di valori
// scelti, caselle di un filtro ripetibile con la ricerca fra le voci oltre 8, scelte brevi come chip a pressione
// (ripetibili, o a scelta singola: ri-clic toglie). Prima erano copiati nel pannello dell'elenco operativo e nei gruppi del
// programma di entities/filtri, con una terza variante nel pannello delle superfici del fisico (review del fisico H1): ora
// una sola copia, qui. Controlli bootstrap-italia nativi (details/summary, fieldset/legend, caselle, bottoni con
// aria-pressed): nessun comportamento ARIA complesso, quindi niente react-aria; il focus trap e' del PannelloLaterale.
import { useState } from 'react';
import type { ReactNode } from 'react';
import { filtraRighe } from '../../lib';

/**
 * Una voce di un filtro: il valore da rimandare e come si legge, `etichetta` (il testo intero, es. "SRB01 - Montagna")
 * oppure il valore come codice con la `descrizione` accanto.
 */
export interface OpzioneFiltro {
  valore: string;
  etichetta?: string;
  descrizione?: string;
}

/** Un gruppo del pannello: titolo con il numero di valori scelti, aperto o chiuso. */
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

/** Il testo di una casella: l'etichetta, oppure il codice e la descrizione in due parti. */
function TestoCasella({ o }: { o: OpzioneFiltro }) {
  if (o.etichetta !== undefined) return <span>{o.etichetta}</span>;
  return (
    <span>
      <span className="ui-opzione__codice">{o.valore}</span> {o.descrizione && <span className="ui-opzione__descr">{o.descrizione}</span>}
    </span>
  );
}

interface PropsCaselle {
  id: string;
  etichetta: string;
  opzioni: readonly OpzioneFiltro[];
  scelti: readonly string[];
  onCambia: (v: string[]) => void;
  /** Fieldset disabilitato (es. le azioni portanti senza il legame con gli interventi). */
  disabilitato?: boolean;
  /** Segnaposto della ricerca fra le voci. */
  segnaposto?: string;
  /** Testo della lista senza voci (es. "Nessun valore nel tuo perimetro."); assente, la lista vuota non dice nulla. */
  vuoto?: string;
}

/** Caselle di un filtro ripetibile, con la ricerca fra le voci oltre 8 (come la tabella interattiva: senza maiuscole e accenti). */
export function Caselle({ id, etichetta, opzioni, scelti, onCambia, disabilitato, segnaposto = 'Cerca', vuoto }: PropsCaselle) {
  const [cercato, setCercato] = useState('');
  const visibili = filtraRighe(opzioni, cercato, (o) => `${o.valore} ${o.etichetta ?? ''} ${o.descrizione ?? ''}`);
  const commuta = (valore: string, scelto: boolean) => onCambia(scelto ? [...scelti, valore] : scelti.filter((v) => v !== valore));
  return (
    <fieldset disabled={disabilitato}>
      <legend className="visually-hidden">{etichetta}</legend>
      {opzioni.length > 8 && (
        <>
          <label className="visually-hidden" htmlFor={`${id}-cerca`}>{`Cerca in ${etichetta}`}</label>
          <input id={`${id}-cerca`} className="ui-campo-cerca" type="search" placeholder={segnaposto} value={cercato} onChange={(e) => setCercato(e.target.value)} />
        </>
      )}
      <div className="ui-opzioni">
        {visibili.map((o) => (
          <label key={o.valore} className="ui-opzione">
            <input type="checkbox" checked={scelti.includes(o.valore)} onChange={(e) => commuta(o.valore, e.target.checked)} />
            <TestoCasella o={o} />
          </label>
        ))}
        {opzioni.length === 0 && vuoto && <p className="small text-muted mb-0">{vuoto}</p>}
        {/* solo dopo una ricerca: una lista vuota senza ricerca non e' una ricerca fallita (review del fisico X4) */}
        {opzioni.length > 0 && visibili.length === 0 && <p className="small text-muted mb-0">Nessuna voce corrisponde alla ricerca.</p>}
      </div>
    </fieldset>
  );
}

/** Il testo di un chip: l'etichetta, oppure "codice - descrizione". */
function testoScelta(o: OpzioneFiltro): string {
  if (o.etichetta !== undefined) return o.etichetta;
  return o.descrizione ? `${o.valore} - ${o.descrizione}` : o.valore;
}

/** Scelte brevi come chip a pressione: ripetibili (piu' valori in alternativa) o esclusive (un solo valore, ri-clic toglie). */
export function Scelte({ etichetta, opzioni, scelti, esclusive = false, onCambia }: { etichetta: string; opzioni: readonly OpzioneFiltro[]; scelti: readonly string[]; esclusive?: boolean; onCambia: (v: string[]) => void }) {
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
            {testoScelta(o)}
          </button>
        );
      })}
    </div>
  );
}
