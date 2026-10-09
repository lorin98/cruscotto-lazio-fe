// app-client.ts — il QueryClient di produzione (createQueryClient: MutationCache del 403, staleTime, niente refetch al
// focus) senza retry, per i test sotto tests/ che montano la shell. src/shared/testing non puo' importarlo (FSD).
import type { QueryClient } from '@tanstack/react-query';
import { segnalaAccessoNegato } from '../src/app/avvisi';
import { createQueryClient } from '../src/app/query-client';

export function clientApp(): QueryClient {
  const client = createQueryClient(segnalaAccessoNegato);
  client.setDefaultOptions({ queries: { ...client.getDefaultOptions().queries, retry: false } });
  return client;
}
