import type { ComponentType } from 'react';
import { Link, createBrowserRouter } from 'react-router';
import { hasGrant, useAuthStatus } from '../shared/api/auth/use-auth-status';
import { resolveLoginPath } from '../shared/config/base-path';
import { NOME_APPLICAZIONE, useFocusTitolo } from '../shared/ui';
import { AREE_FUTURE, areeVisibili } from './aree';
import { ErroreDiPagina, PaginaNonTrovata } from './errori';
import { Layout } from './layout';
import { RequireGrant } from './require-grant';
import { SessioneNonVerificabile } from './sessione-non-verificabile';
import routeTable from './route-table.json';

// routes.tsx — GENERICO: step6-page NON lo rigenera. Aggiunge le feature come voci di
// route-table.json (la SINGLE SOURCE dichiarativa) e i moduli pagina sotto src/pages/**. La stessa
// route-table.json e' proiettata (jq -S) in route-manifest.json: as-built == manifest per costruzione.

// Home: porta d'ingresso dell'applicazione (dopo il login il BFF torna su "/"). Elenca le aree del catalogo (aree.ts,
// lo stesso del menu laterale) con almeno una pagina visibile per i grant dell'utente: hide-by-role di sola UX,
// l'enforcement resta server-side. La card porta alla prima pagina visibile dell'area. Non e' una feature (nessuna
// authz-surface propria): resta fuori dal manifest.

function Home() {
  const { data: auth, isLoading, isError, refetch } = useAuthStatus();
  const h1 = useFocusTitolo<HTMLHeadingElement>('Home');
  if (isLoading) return <p role="status">Caricamento…</p>;
  // stato della sessione non verificabile: come RequireGrant, niente invito ad accedere che rimanderebbe al giro login -> /
  if (isError && auth === undefined) {
    return (
      <main className="ui-pagina" id="contenuto">
        <div className="ui-titolo">
          <h1 ref={h1} tabIndex={-1}>
            {NOME_APPLICAZIONE}
          </h1>
        </div>
        <SessioneNonVerificabile onRiprova={() => void refetch()} />
      </main>
    );
  }
  const aree = areeVisibili((g) => hasGrant(auth, g));
  return (
    <main className="ui-pagina" id="contenuto">
      <div className="ui-titolo">
        <div>
          <h1 ref={h1} tabIndex={-1}>
            {NOME_APPLICAZIONE}
          </h1>
          <p>Monitoraggio del Complemento di Sviluppo Rurale 2023-2027 della Regione Lazio.</p>
        </div>
      </div>
      {!auth?.authenticated ? (
        <section className="ui-card">
          <p>Per consultare il cruscotto devi accedere con le tue credenziali.</p>
          <a className="btn btn-primary" href={resolveLoginPath()}>
            Accedi
          </a>
        </section>
      ) : aree.length === 0 ? (
        <p role="status">Il tuo profilo non ha ancora aree del cruscotto da consultare.</p>
      ) : (
        <nav aria-label="Aree del cruscotto">
          <ul className="ui-griglia ui-griglia--2 list-unstyled">
            {aree.map(({ area, pagine }) => (
              <li key={area.chiave}>
                <section className="ui-card ui-dissolvenza" aria-labelledby={`area-${area.chiave}`}>
                  <h2 id={`area-${area.chiave}`} className="h4">
                    {area.titolo}
                  </h2>
                  <p>{area.descrizione}</p>
                  <Link className="btn btn-primary" to={pagine[0].percorso}>
                    {area.titolo}
                  </Link>
                </section>
              </li>
            ))}
            {AREE_FUTURE.map((a) => (
              <li key={a}>
                <section className="ui-card" aria-label={`${a}: presto disponibile`}>
                  <h2 className="h4 text-muted">{a}</h2>
                  <p className="text-muted mb-0">Area in preparazione.</p>
                </section>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </main>
  );
}

// Moduli pagina scoperti STATICAMENTE da Vite (code-splitting per-route). Convenzione: ogni pagina
// e' src/pages/<...>/page.tsx con export default del componente.
const pageModules = import.meta.glob<{ default: ComponentType }>('../pages/**/page.tsx');

interface RouteEntry {
  path: string;
  flow: string;
  component: string;
  visibility: string[];
  actions: unknown[];
}

// component nel route-table e' il path src-relative del modulo (es. "src/pages/elementi/page.tsx");
// la chiave del glob e' relativa a questo file (src/app), quindi "../pages/...".
function toGlobKey(component: string): string {
  return `../${component.replace(/^src\//, '')}`;
}

const featureRoutes = (routeTable.routes as RouteEntry[]).map((entry) => ({
  path: entry.path,
  lazy: async () => {
    const load = pageModules[toGlobKey(entry.component)];
    if (!load) throw new Error(`modulo pagina non trovato per la route ${entry.path}: ${entry.component}`);
    const mod = await load();
    const Page = mod.default;
    // Route-guard con la visibility della voce: hide-by-role (solo UX). L'enforcement resta server-side.
    return {
      Component: () => (
        <RequireGrant visibility={entry.visibility}>
          <Page />
        </RequireGrant>
      ),
    };
  },
}));

// Tutte le route sotto la shell (layout.tsx: skip-link, intestazione con utente ed Esci, piè di pagina). La route senza
// path sotto Layout raccoglie gli errori di Home, pagine (anche il loro caricamento lazy) e indirizzi inesistenti: la
// shell resta e l'utente legge un testo in italiano, mai lo stack (errori.tsx, review step9 A-01). L'ErrorBoundary di
// Layout e' l'ultima rete, per un errore della shell stessa.
export function appRoutes() {
  return [
    {
      Component: Layout,
      ErrorBoundary: ErroreDiPagina,
      children: [
        {
          ErrorBoundary: ErroreDiPagina,
          children: [{ index: true, Component: Home }, ...featureRoutes, { path: '*', Component: PaginaNonTrovata }],
        },
      ],
    },
  ];
}

export function createAppRouter() {
  return createBrowserRouter(appRoutes());
}
