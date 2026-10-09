// use-auth-status.ts — wrapper React Query del canale auth /auth/status (fuori-codegen).
// I componenti consumano da QUI, non da auth-status.ts diretto: il wrapper e' il confine
// (query-key stabile + staleTime alto) e ri-esporta i predicati di dominio con la loro dottrina.
// I dati in cache e i grant valgono per l'utente che li ha letti (review X-06): se una nuova lettura di /auth/status
// trova un altro utente (nuovo accesso in un'altra scheda, senza un 401 qui), i dati del precedente lasciano la cache e
// la shell lo annuncia alle altre schede (EVENTO_UTENTE_CAMBIATO, app/inattivita.tsx).
import { hashKey, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Query, QueryClient } from '@tanstack/react-query';
import { AUTH_STATUS_QUERY_KEY, fetchAuthStatus } from './auth-status';
import type { AuthStatus } from './auth-status';

/** Evento della finestra: /auth/status ha restituito un utente diverso da quello in cache. */
export const EVENTO_UTENTE_CAMBIATO = 'csr:utente-cambiato';

const eStatoSessione = (q: Query) => q.queryHash === hashKey(AUTH_STATUS_QUERY_KEY);

/**
 * Legge /auth/status. Se in cache c'era un utente e ora l'utente e' un altro (o nessuno), toglie dalla cache ogni query
 * tranne lo stato della sessione: le pagine montate rileggono i propri dati come nuovo utente.
 */
export async function leggiStatoSessione(queryClient: QueryClient): Promise<AuthStatus> {
  const precedente = queryClient.getQueryData<AuthStatus>(AUTH_STATUS_QUERY_KEY)?.user?.username;
  const stato = await fetchAuthStatus();
  if (precedente !== undefined && precedente !== stato.user?.username) {
    queryClient.removeQueries({ predicate: (q) => !eStatoSessione(q) });
    if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent(EVENTO_UTENTE_CAMBIATO));
  }
  return stato;
}

// Lo stato auth cambia di rado in una sessione BFF: staleTime alto evita un refetch a ogni mount.
// `abilitato` falso: nessuna lettura (la shell a sessione scaduta, con la cache appena svuotata: non la ripopola).
export function useAuthStatus(abilitato = true) {
  const queryClient = useQueryClient();
  return useQuery({
    queryKey: AUTH_STATUS_QUERY_KEY,
    queryFn: () => leggiStatoSessione(queryClient),
    staleTime: 5 * 60 * 1000,
    enabled: abilitato,
  });
}

// Un unico punto d'import per i componenti. NB DOTTRINA (auth-runtime-pattern.md):
// - `hasGrant` = gate di UX (hide-by-role, fine||coarse sui roles additivi), NON enforcement.
// - `projection` = FAIL-OPEN e security-inert -> pilota SOLO la UX (banner/hint per-tipo-ente),
//   MAI un controllo d'accesso: una projection assente/manomessa APRIREBBE, non chiuderebbe.
//   L'enforcement e' server-side; la FE non lo replica.
export { hasGrant, projection } from './auth-status';
export type { AuthStatus, AuthUser } from './auth-status';
