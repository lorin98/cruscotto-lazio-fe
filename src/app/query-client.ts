// query-client.ts — QueryClient con MutationCache GLOBALE (rete di sicurezza per le mutation).
// Divisione dei canali d'errore (orval-pipeline.md, error boundary):
//  - il 403 di ACCESSO-NEGATO (asse-dato/riga, ownership) viene intercettato UNA volta qui: un
//    wrapper che dimentica l'onError non lascia passare in silenzio un diniego di scope;
//  - ogni ALTRO errore resta INLINE nel componente (mutation.isError). Un onError per-wrapper
//    duplicherebbe il canale. Una mutation che rende gia' inline anche il 403 lo dichiara con
//    meta.erroreInLinea: la rete di sicurezza la salta, cosi' l'utente non riceve due avvisi (review step9 R-07).
// La discriminazione e' via classifyProblem (sul problem-type urn:cruscottocsr:problem:*, MAI sul solo status).
// Anche la politica di retry delle letture sta qui, nei defaultOptions (review step9 H-18): i wrapper delle feature non
// passano opzioni di retry, quindi un client di test con retry: false vale anche per loro.
import { MutationCache, QueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { classifyProblem } from '../shared/api/problem/problem-types';
import type { ClassifiedProblem } from '../shared/api/problem/problem-types';
import { attesaPrimaDiRiprovare, soloTransitori } from '../shared/api/retry/nuovi-tentativi';

export type AccessDeniedHandler = (problem: ClassifiedProblem) => void;

// Estratta per essere testabile senza montare una mutation reale: e' il cuore della rete di sicurezza.
export function handleMutationError(error: unknown, onAccessDenied: AccessDeniedHandler): void {
  if (!isAxiosError(error)) return; // non un errore HTTP dell'istanza axios -> inline
  const classified = classifyProblem(error.response?.status ?? 0, error.response?.data);
  if (classified.kind === 'access-denied') onAccessDenied(classified);
}

// Default no-op: l'app reale monta un toast/banner accessibile. Isolato per il test.
export function createQueryClient(onAccessDenied: AccessDeniedHandler = () => {}): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // report aggregati e pesanti, aggiornati dalle acquisizioni: non si rileggono a ogni ritorno sulla scheda
        staleTime: 5 * 60 * 1000,
        refetchOnWindowFocus: false,
        // si riprovano solo rete assente e 503 CAPACITA_ESAURITA, rispettando Retry-After (shared/api/retry)
        retry: soloTransitori,
        retryDelay: attesaPrimaDiRiprovare,
      },
    },
    mutationCache: new MutationCache({
      onError: (error, _variabili, _contesto, mutation) => {
        if (mutation.meta?.erroreInLinea === true) return;
        handleMutationError(error, onAccessDenied);
      },
    }),
  });
}
