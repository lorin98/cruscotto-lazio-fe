// Testata — percorso (Home > area > pagina) e titolo delle pagine (UI v2), uguali per tutte le aree: l'h1 riceve il focus a
// ogni cambio di pagina e da' il titolo al documento (useFocusTitolo, WCAG 2.4.2 e 2.4.3). Prima ogni area aveva la sua
// copia (widget del finanziario, testata dell'elenco operativo); le voci e il titolo del documento li decide la pagina.
import type { ReactNode, RefObject } from 'react';
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
