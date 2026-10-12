import type { ComponentType } from 'react';
import { createBrowserRouter } from 'react-router';
import { ErroreDiPagina, PaginaNonTrovata } from './errori';
import { Home } from './home';
import { Layout } from './layout';
import { RequireGrant } from './require-grant';
import routeTable from './route-table.json';

// routes.tsx — GENERICO: step6-page NON lo rigenera. Aggiunge le feature come voci di
// route-table.json (la SINGLE SOURCE dichiarativa) e i moduli pagina sotto src/pages/**. La stessa
// route-table.json e' proiettata (jq -S) in route-manifest.json: as-built == manifest per costruzione.

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
