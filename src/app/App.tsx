import { useMemo } from 'react';
import { RouterProvider } from 'react-router';
import { createAppRouter } from './routes';

// Shell dell'app: monta il router react-router sulla tabella-route (routes.tsx <- route-table.json).
// La Home (in routes.tsx) prova che il runtime auth e' navigabile su MSW. step5-ui/step6-page NON
// toccano questo file: generano le pagine sotto src/pages/** e le voci di route-table.json.
export function App() {
  const router = useMemo(() => createAppRouter(), []);
  return <RouterProvider router={router} />;
}
