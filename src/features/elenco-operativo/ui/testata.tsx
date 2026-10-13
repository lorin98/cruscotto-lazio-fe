// testata — percorso (Home > Elenco operativo > pagina) e titolo delle pagine dell'elenco operativo: l'h1 riceve il focus
// al cambio di pagina e da' il titolo al documento (useFocusTitolo, WCAG 2.4.2 e 2.4.3), come nel finanziario.
import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { useFocusTitolo } from '../../../shared/ui';
import { PERCORSO_DOMANDE } from '../lib/collegamenti';

export interface Briciola {
  etichetta: string;
  a?: string;
  /** State del link (le scelte della pagina dell'elenco da ritrovare: review v2 V-02). */
  stato?: unknown;
}

export function Briciole({ voci }: { voci: Briciola[] }) {
  return (
    <nav className="ui-briciole" aria-label="Percorso">
      <ol>
        <li>
          <Link to="/">Home</Link>
        </li>
        <li>
          <Link to={PERCORSO_DOMANDE}>Elenco operativo</Link>
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

export function TestaPagina({ titolo, titoloDocumento, sottotitolo, azioni }: { titolo: string; titoloDocumento: string; sottotitolo?: string; azioni?: ReactNode }) {
  const h1 = useFocusTitolo<HTMLHeadingElement>(`${titoloDocumento} - Elenco operativo`);
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
