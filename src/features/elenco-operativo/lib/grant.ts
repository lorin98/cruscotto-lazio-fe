// grant.ts — grant VERBATIM dell'authz-catalog per le transazioni dell'elenco operativo e i predicati di visibilita'
// (PURO). Sono GATE DI UX (hide-by-role), MAI enforcement: il backend ridecide su ogni lettura (403).
import { hasGrant } from '../../../shared/api/auth/stato';
import type { AuthStatus } from '../../../shared/api/auth/stato';

export const GRANT = {
  domande: 'csr.tx-0056.read',
  sinottico: 'csr.tx-0057.read',
  dettaglio: 'csr.tx-0058.read',
  pagamenti: 'csr.tx-0059.read',
  filtri: 'csr.tx-0060.read',
} as const;

export type Lettura = keyof typeof GRANT;

/** Il profilo puo' fare la lettura (stato assente = no: in caricamento non si mostra un link che porterebbe a un 403). */
export function puoLeggere(status: AuthStatus | undefined, lettura: Lettura): boolean {
  return hasGrant(status, GRANT[lettura]);
}
