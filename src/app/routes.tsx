import type { ComponentType } from 'react';
import { Link, createBrowserRouter } from 'react-router';
import { hasGrant, useAuthStatus } from '../shared/api/auth/use-auth-status';
import { resolveLoginPath } from '../shared/config/base-path';
import { NOME_APPLICAZIONE, useFocusTitolo } from '../shared/ui';
import { Layout } from './layout';
import { RequireGrant } from './require-grant';
import { SessioneNonVerificabile } from './sessione-non-verificabile';
import routeTable from './route-table.json';

// routes.tsx — GENERICO: step6-page NON lo rigenera. Aggiunge le feature come voci di
// route-table.json (la SINGLE SOURCE dichiarativa) e i moduli pagina sotto src/pages/**. La stessa
// route-table.json e' proiettata (jq -S) in route-manifest.json: as-built == manifest per costruzione.

// Home: porta d'ingresso dell'applicazione (dopo il login il BFF torna su "/"). Elenca le aree della route-table
// (la voce di primo livello di ogni feature, es. /finanziario) visibili per i grant dell'utente: hide-by-role di sola
// UX, l'enforcement resta server-side. Non e' una feature (nessuna authz-surface propria): resta fuori dal manifest.
const ETICHETTE_AREE: Record<string, string> = { '/finanziario': 'Finanziario' };

function Home() {
  const { data: auth, isLoading, isError, refetch } = useAuthStatus();
  const h1 = useFocusTitolo<HTMLHeadingElement>('Home');
  if (isLoading) return <p role="status">Caricamento…</p>;
  // stato della sessione non verificabile: come RequireGrant, niente invito ad accedere che rimanderebbe al giro login -> /
  if (isError && auth === undefined) {
    return (
      <main className="container my-4" id="contenuto">
        <h1 ref={h1} tabIndex={-1}>
          {NOME_APPLICAZIONE}
        </h1>
        <SessioneNonVerificabile onRiprova={() => void refetch()} />
      </main>
    );
  }
  const aree = (routeTable.routes as RouteEntry[]).filter(
    (r) => r.path.split('/').length === 2 && r.visibility.some((g) => hasGrant(auth, g)),
  );
  return (
    <main className="container my-4" id="contenuto">
      <h1 ref={h1} tabIndex={-1}>
        {NOME_APPLICAZIONE}
      </h1>
      {!auth?.authenticated ? (
        <>
          <p>Per consultare il cruscotto devi accedere con le tue credenziali.</p>
          <a className="btn btn-primary" href={resolveLoginPath()}>
            Accedi
          </a>
        </>
      ) : aree.length === 0 ? (
        <p role="status">Il tuo profilo non ha ancora aree del cruscotto da consultare.</p>
      ) : (
        <nav aria-label="Aree del cruscotto">
          <ul className="list-unstyled">
            {aree.map((a) => (
              <li key={a.path} className="mb-2">
                <Link className="btn btn-primary" to={a.path}>
                  {ETICHETTE_AREE[a.path] ?? a.path}
                </Link>
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

// Tutte le route sotto la shell (layout.tsx: skip-link, intestazione con utente ed Esci, piè di pagina).
export function appRoutes() {
  return [{ Component: Layout, children: [{ index: true, Component: Home }, ...featureRoutes] }];
}

export function createAppRouter() {
  return createBrowserRouter(appRoutes());
}
