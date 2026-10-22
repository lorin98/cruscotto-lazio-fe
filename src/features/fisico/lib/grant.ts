// grant.ts — grant VERBATIM dell'authz-catalog per le letture del fisico e i predicati di visibilita' (PURO). Sono GATE DI
// UX (hide-by-role), MAI enforcement: il backend ridecide su ogni lettura (403 ACCESSO_NEGATO). Il predicato e' hasGrant:
// il grant e' fra i roles[] di /auth/status (come nell'elenco operativo).
import { GRANT_ELENCO } from '../../../entities/domanda';
import { hasGrant } from '../../../shared/api/auth/stato';
import type { AuthStatus } from '../../../shared/api/auth/stato';

export const GRANT = {
  /** TX-0018 (RF018): superfici ammissibili; apre la pagina delle superfici. */
  superfici: 'csr.tx-0018.read',
  /** TX-0020 (RF020): determine di una domanda; apre la pagina delle determine. */
  determine: 'csr.tx-0020.read',
  /** TX-0060 dell'elenco operativo (RA006, decisione G2): valori del pannello dei filtri delle superfici. */
  filtri: GRANT_ELENCO.filtri,
  /** TX-0058 dell'elenco operativo: la scheda della domanda, destinazione del link scheda-domanda delle determine. */
  schedaDomanda: GRANT_ELENCO.dettaglio,
} as const;

export type Lettura = keyof typeof GRANT;

/** Il profilo puo' fare la lettura (stato assente = no: in caricamento non si mostra un link che porterebbe a un 403). */
export function puoLeggere(status: AuthStatus | undefined, lettura: Lettura): boolean {
  return hasGrant(status, GRANT[lettura]);
}
