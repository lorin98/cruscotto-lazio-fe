import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { App } from './App';
import { segnalaAccessoNegato } from './avvisi';
import { createQueryClient } from './query-client';
import 'bootstrap-italia/dist/css/bootstrap-italia.min.css';

// MutationCache globale: intercetta il 403 ACCESSO_NEGATO delle mutation come rete di sicurezza (query-client.ts) e
// lo rende con l'avviso della shell (layout.tsx).
const queryClient = createQueryClient(segnalaAccessoNegato);

async function enableMocking(): Promise<void> {
  // `npm run dev:be` (mode "be"): backend vero dietro il proxy di Vite (vite.config.ts), niente MSW.
  if (!import.meta.env.DEV || import.meta.env.MODE === 'be') return;
  const { worker } = await import('../shared/api/mock/browser');
  // 'error' come per setupServer nei test (auth-runtime-pattern.md §3): la feature deve essere
  // interamente mockata su MSW; una richiesta non gestita e' un buco, non da ignorare.
  await worker.start({ onUnhandledRequest: 'error' });
}

void enableMocking().then(() => {
  const el = document.getElementById('root');
  if (!el) throw new Error('root non trovato');
  createRoot(el).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </StrictMode>,
  );
});
