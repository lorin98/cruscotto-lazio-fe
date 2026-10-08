// PaginaFinanziario — impaginazione comune delle pagine del finanziario (UI v2, wireframe v2 approvati): barra dei filtri
// a chip con il pannello laterale e la data dell'ultimo dato, breadcrumb, titolo (o testata di dettaglio) che riceve il
// focus e da' il titolo al documento, contenuto. I filtri vivono nella query string: le pagine li ricevono come props e
// "Applica" li riscrive conservando i parametri di pagina (anno, esercizio).
import { useState } from 'react';
import type { ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { CHIAVI_FILTRO, PannelloFiltri, UltimoAggiornamento, filtriDaRicerca, ricercaDaFiltri, titoloH1, voceDi } from '../../../features/finanziario';
import type { Filtri } from '../../../features/finanziario';
import { hasGrant, useAuthStatus } from '../../../shared/api/auth/use-auth-status';
import { BarraFiltri, useFocusTitolo } from '../../../shared/ui';
import type { ChipFiltro } from '../../../shared/ui';

const ETICHETTE = { intervento: 'Intervento', os: 'OS', og: 'OG', op: 'OP', azione: 'Azione portante' } as const;
const PARAMETRI_DI_PAGINA = ['anno', 'esercizio'];

/** Indirizzo con i filtri dati e i parametri di pagina dell'indirizzo corrente. */
function conFiltri(percorso: string, ricerca: string, filtri: Filtri): string {
  const corrente = new URLSearchParams(ricerca);
  const pagina = new URLSearchParams();
  for (const k of PARAMETRI_DI_PAGINA) {
    const v = corrente.get(k);
    if (v) pagina.set(k, v);
  }
  const q = [ricercaDaFiltri(filtri), pagina.toString()].filter(Boolean).join('&');
  return q ? `${percorso}?${q}` : percorso;
}

export function PaginaFinanziario({
  percorso,
  conBarraFiltri = true,
  briciole,
  sottotitolo,
  senzaTitolo = false,
  azioni,
  children,
}: {
  percorso: string;
  /** Falso dove i filtri del finanziario non si applicano (riserva, OP-FE-03). */
  conBarraFiltri?: boolean;
  /** Voci intermedie del percorso (dopo Home e Finanziario). */
  briciole?: Array<{ etichetta: string; a?: string }>;
  sottotitolo?: string;
  /** Il contenuto rende la propria testata con l'h1 (dettaglio): niente titolo standard. */
  senzaTitolo?: boolean;
  azioni?: ReactNode;
  children: (filtri: Filtri) => ReactNode;
}) {
  const { pathname, search } = useLocation();
  const naviga = useNavigate();
  const { data: auth } = useAuthStatus();
  const [pannello, setPannello] = useState(false);
  const titolo = voceDi(percorso)?.titolo ?? 'Finanziario';
  const filtri = filtriDaRicerca(search);
  const h1 = useFocusTitolo<HTMLHeadingElement>(senzaTitolo ? undefined : `${titolo} - Finanziario`);
  const vai = (f: Filtri) => void naviga(conFiltri(pathname, search, f));

  const chip: ChipFiltro[] = CHIAVI_FILTRO.flatMap((k) =>
    (filtri[k] ?? []).map((v) => ({
      chiave: `${k}:${v}`,
      etichetta: ETICHETTE[k],
      valore: v,
      onTogli: () => vai({ ...filtri, [k]: (filtri[k] ?? []).filter((x) => x !== v) }),
    })),
  );
  const conPannello = hasGrant(auth, 'csr.tx-0001.read');
  const voci = briciole ?? (percorso === '/finanziario' ? [] : [{ etichetta: titolo }]);
  const queryFiltri = ricercaDaFiltri(filtri);

  return (
    <>
      {conBarraFiltri && (
        <BarraFiltri
          chip={chip}
          onApri={conPannello ? () => setPannello(true) : undefined}
          onTogliTutti={() => vai({})}
          vuoto="Nessun filtro: tutti gli interventi del perimetro"
          destra={<UltimoAggiornamento />}
        />
      )}
      <main className="ui-pagina" id="contenuto">
        <nav className="ui-briciole" aria-label="Percorso">
          <ol>
            <li>
              <Link to="/">Home</Link>
            </li>
            <li aria-current={voci.length === 0 ? 'page' : undefined}>
              {voci.length === 0 ? 'Finanziario' : <Link to={queryFiltri ? `/finanziario?${queryFiltri}` : '/finanziario'}>Finanziario</Link>}
            </li>
            {voci.map((v, i) => (
              <li key={v.etichetta} aria-current={i === voci.length - 1 ? 'page' : undefined}>
                {v.a ? <Link to={v.a}>{v.etichetta}</Link> : v.etichetta}
              </li>
            ))}
          </ol>
        </nav>
        {!senzaTitolo && (
          <div className="ui-titolo">
            <div>
              <h1 ref={h1} tabIndex={-1}>
                {titoloH1(titolo)}
              </h1>
              {sottotitolo && <p>{sottotitolo}</p>}
            </div>
            {azioni && <div className="ui-titolo__azioni">{azioni}</div>}
          </div>
        )}
        {children(filtri)}
      </main>
      {conBarraFiltri && conPannello && (
        <PannelloFiltri
          aperto={pannello}
          valori={filtri}
          onChiudi={() => setPannello(false)}
          onApplica={(f) => {
            setPannello(false);
            vai(f);
          }}
        />
      )}
    </>
  );
}
