// render-pagina.tsx — render di una pagina nei test: router in memoria (la pagina legge l'indirizzo) e QueryClient
// senza retry di default. Le altre route finiscono su un segnaposto: i test di navigazione guardano router.state.
import type { ComponentType } from 'react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { renderConQuery } from './render';

function Altrove() {
  return <p>altra pagina</p>;
}

export function renderPagina(Pagina: ComponentType, percorso: string, indirizzo: string = percorso) {
  const router = createMemoryRouter(
    [
      { path: percorso, Component: Pagina },
      { path: '*', Component: Altrove },
    ],
    { initialEntries: [indirizzo] },
  );
  return { ...renderConQuery(<RouterProvider router={router} />), router };
}
