// use-auth-status.ts — wrapper React Query del canale auth /auth/status (fuori-codegen).
// I componenti consumano da QUI, non da auth-status.ts diretto: il wrapper e' il confine
// (query-key stabile + staleTime alto) e ri-esporta i predicati di dominio con la loro dottrina.
import { useQuery } from '@tanstack/react-query';
import { AUTH_STATUS_QUERY_KEY, fetchAuthStatus } from './auth-status';

// Lo stato auth cambia di rado in una sessione BFF: staleTime alto evita un refetch a ogni mount.
export function useAuthStatus() {
  return useQuery({
    queryKey: AUTH_STATUS_QUERY_KEY,
    queryFn: fetchAuthStatus,
    staleTime: 5 * 60 * 1000,
  });
}

// Un unico punto d'import per i componenti. NB DOTTRINA (auth-runtime-pattern.md):
// - `hasGrant` = gate di UX (hide-by-role, fine||coarse sui roles additivi), NON enforcement.
// - `projection` = FAIL-OPEN e security-inert -> pilota SOLO la UX (banner/hint per-tipo-ente),
//   MAI un controllo d'accesso: una projection assente/manomessa APRIREBBE, non chiuderebbe.
//   L'enforcement e' server-side; la FE non lo replica.
export { hasGrant, projection } from './auth-status';
export type { AuthStatus, AuthUser } from './auth-status';
