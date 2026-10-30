// grant.ts — grant VERBATIM dell'authz-catalog per le transazioni dell'elenco operativo e i predicati di visibilita'
// (PURO). Sono GATE DI UX (hide-by-role), MAI enforcement: il backend ridecide su ogni lettura (403).
import { GRANT_DETERMINE_DELLA_DOMANDA, GRANT_ELENCO } from '../../../entities/domanda';
import { hasGrant } from '../../../shared/api/auth/stato';
import type { AuthStatus } from '../../../shared/api/auth/stato';

// i grant sono del contratto dell'indirizzo condiviso con il finanziario (entities/domanda): una sola fonte
export const GRANT = GRANT_ELENCO;

export type Lettura = keyof typeof GRANT;

/** Il profilo puo' fare la lettura (stato assente = no: in caricamento non si mostra un link che porterebbe a un 403). */
export function puoLeggere(status: AuthStatus | undefined, lettura: Lettura): boolean {
  return hasGrant(status, GRANT[lettura]);
}

/** Il profilo apre le determine di una domanda nel procedurale (link determine-della-domanda della scheda, TX-0020): il
 *  grant e' del contratto dell'indirizzo condiviso (entities/domanda). Stato assente = no, come puoLeggere. */
export function puoAprireLeDetermine(status: AuthStatus | undefined): boolean {
  return hasGrant(status, GRANT_DETERMINE_DELLA_DOMANDA);
}
