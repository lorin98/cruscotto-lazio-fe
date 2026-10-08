// PaginaFinanziario — impaginazione comune delle pagine del finanziario (wireframe approvati): breadcrumb, h1 (con le
// sigle intatte) che riceve il focus e da' il titolo al documento, ultimo dato sincronizzato (NFR-25), filtri attivi con
// "Modifica filtri" (che ricorda il report d'origine), contenuto, link agli altri report visibili per i grant dell'utente
// (solo UX). Titoli e percorsi
// vengono dal catalogo della feature; i filtri vivono nella query string e i report li ricevono come props.
import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router';
import {
  FiltriAttivi,
  PAGINA_FILTRI,
  UltimoAggiornamento,
  daPer,
  filtriDaRicerca,
  reportVisibili,
  ricercaDaFiltri,
  titoloH1,
  voceDi,
} from '../../../features/finanziario';
import type { Filtri } from '../../../features/finanziario';
import { hasGrant, useAuthStatus } from '../../../shared/api/auth/use-auth-status';
import { useFocusTitolo } from '../../../shared/ui';

function conQuery(percorso: string, query: string): string {
  return query ? `${percorso}?${query}` : percorso;
}

export function PaginaFinanziario({ percorso, conFiltri = true, children }: {
  percorso: string;
  /** Falso dove i filtri del finanziario non si applicano (pagina dei filtri, riserva). */
  conFiltri?: boolean;
  children: (filtri: Filtri) => ReactNode;
}) {
  const { search } = useLocation();
  const { data: auth } = useAuthStatus();
  const titolo = voceDi(percorso)?.titolo ?? 'Finanziario';
  const filtri = filtriDaRicerca(search);
  const query = ricercaDaFiltri(filtri);
  const h1 = useFocusTitolo<HTMLHeadingElement>(`${titolo} - Finanziario`);
  const home = percorso === PAGINA_FILTRI.percorso;
  const modifica = conQuery(PAGINA_FILTRI.percorso, [query, `da=${encodeURIComponent(daPer(percorso, search))}`].filter(Boolean).join('&'));
  const altri = reportVisibili((g) => hasGrant(auth, g)).filter((r) => r.percorso !== percorso);
  return (
    <main className="container my-4" id="contenuto">
      <nav className="breadcrumb-container" aria-label="Percorso">
        <ol className="breadcrumb">
          <li className="breadcrumb-item">
            <Link to="/">Home</Link>
          </li>
          <li className={`breadcrumb-item${home ? ' active' : ''}`} aria-current={home ? 'page' : undefined}>
            {home ? 'Finanziario' : <Link to={conQuery(PAGINA_FILTRI.percorso, query)}>Finanziario</Link>}
          </li>
          {!home && (
            <li className="breadcrumb-item active" aria-current="page">
              {titolo}
            </li>
          )}
        </ol>
      </nav>
      <h1 ref={h1} tabIndex={-1} className="mb-3">
        {titoloH1(titolo)}
      </h1>
      <UltimoAggiornamento />
      {conFiltri && <FiltriAttivi filtri={filtri} modifica={<Link to={modifica}>Modifica filtri</Link>} />}
      {children(filtri)}
      <nav className="my-4" aria-label={home ? 'Report del finanziario' : 'Altri report del finanziario'}>
        <h2 className="h5">{home ? 'Report del finanziario' : 'Altri report del finanziario'}</h2>
        <ul className="list-inline">
          {altri.map((r) => (
            <li key={r.percorso} className="list-inline-item my-1">
              <Link className="btn btn-outline-primary btn-sm" to={conQuery(r.percorso, query)}>
                {r.titolo}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </main>
  );
}
