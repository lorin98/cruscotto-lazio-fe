// avvisi.ts — canale minimo fra la MutationCache globale (query-client.ts) e la shell (layout.tsx): un diniego 403
// ACCESSO_NEGATO di una mutation diventa un avviso visibile a tutta l'app, senza un onError per wrapper.
export const EVENTO_ACCESSO_NEGATO = 'csr:accesso-negato';

export function segnalaAccessoNegato(): void {
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent(EVENTO_ACCESSO_NEGATO));
}
