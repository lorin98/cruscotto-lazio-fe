// Testata — percorso (Home > area > pagina) e titolo delle pagine (UI v2), uguali per tutte le aree: l'h1 riceve il focus a
// ogni cambio di pagina e da' il titolo al documento (useFocusTitolo, WCAG 2.4.2 e 2.4.3). Prima ogni area aveva la sua
// copia (widget del finanziario, testata dell'elenco operativo); le voci e il titolo del documento li decide la pagina.
// Poi la testata delle pagine di dettaglio (hero), comune alla scheda della domanda e alle determine (review H6).
import type { ReactNode, Ref, RefObject } from 'react';
import { Link } from 'react-router';
import { useFocusTitolo } from '../focus';

export interface Briciola {
  etichetta: string;
  /** Indirizzo del link; assente = testo (la pagina corrente, o una voce senza pagina). */
  a?: string;
  /** State della navigazione del link (es. le scelte della pagina di partenza da ritrovare). */
  stato?: unknown;
}

/** Home e poi le voci date; l'ultima e' la pagina corrente (aria-current). */
export function Briciole({ voci }: { voci: readonly Briciola[] }) {
  return (
    <nav className="ui-briciole" aria-label="Percorso">
      <ol>
        <li>
          <Link to="/">Home</Link>
        </li>
        {voci.map((v, i) => (
          <li key={v.etichetta} aria-current={i === voci.length - 1 ? 'page' : undefined}>
            {v.a ? (
              <Link to={v.a} state={v.stato}>
                {v.etichetta}
              </Link>
            ) : (
              v.etichetta
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

interface PropsTestaPagina {
  titolo: string;
  /** Il titolo del documento (senza il nome dell'app). */
  titoloDocumento: string;
  sottotitolo?: string;
  azioni?: ReactNode;
  /** Il ref dell'h1, se la pagina ci riporta il focus (es. dopo un comando che sparisce col report: useFocusDopoIlCambio). */
  refTitolo?: RefObject<HTMLHeadingElement | null>;
}

interface PropsTestataDettaglio {
  /** Id dell'h1, che da' il nome alla sezione. */
  idTitolo: string;
  titolo: string;
  /** Il ref dell'h1 (tabIndex=-1): la pagina ci porta il focus a ogni cambio di route (useFocusTitolo). */
  h1: Ref<HTMLHeadingElement>;
  sopratitolo?: string;
  /** I badge in testo ("Dati principali"); assenti (senza dati) la lista non c'e'. */
  badge?: readonly string[];
  azioni?: ReactNode;
}

/**
 * Testata di una pagina di dettaglio (hero): sopratitolo, un solo h1, badge in testo e azioni; senza dati resta il solo
 * h1. Prima la scheda della domanda dell'elenco e le determine del fisico ne avevano una copia ciascuna (review H6).
 */
export function TestataDettaglio({ idTitolo, titolo, h1, sopratitolo, badge, azioni }: PropsTestataDettaglio) {
  return (
    <section className="ui-hero ui-dissolvenza" aria-labelledby={idTitolo}>
      {sopratitolo && <span className="ui-eyebrow">{sopratitolo}</span>}
      <h1 id={idTitolo} ref={h1} tabIndex={-1}>
        {titolo}
      </h1>
      {badge && (
        <ul className="ui-hero__badge-elenco" aria-label="Dati principali">
          {badge.map((b) => (
            <li key={b} className="ui-hero__badge">
              {b}
            </li>
          ))}
        </ul>
      )}
      {azioni && <div className="ui-hero__azioni">{azioni}</div>}
    </section>
  );
}

/** Titolo della pagina: l'h1 col focus al montaggio e il titolo del documento. */
export function TestaPagina({ titolo, titoloDocumento, sottotitolo, azioni, refTitolo }: PropsTestaPagina) {
  const h1 = useFocusTitolo<HTMLHeadingElement>(titoloDocumento, refTitolo);
  return (
    <div className="ui-titolo">
      <div>
        <h1 ref={h1} tabIndex={-1}>
          {titolo}
        </h1>
        {sottotitolo && <p>{sottotitolo}</p>}
      </div>
      {azioni && <div className="ui-titolo__azioni">{azioni}</div>}
    </div>
  );
}
