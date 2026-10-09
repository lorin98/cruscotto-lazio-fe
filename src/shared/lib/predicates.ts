// predicates.ts — predicati PURI di UI (zero React). Sono GATE DI UX, MAI enforcement (il BE ridecide).
// SCAFFOLDING del template green-fe: nessun uso in produzione, fuori dal barrel di shared/lib (review v2 H-26).
// Si importa dal file quando una feature ne ha bisogno.
import { hasGrant } from '../api/auth/auth-status';
import type { AuthStatus } from '../api/auth/auth-status';

// Fabbrica di predicati ruolo (hide-by-role): fine || coarse sui grant VERBATIM dell'authz-catalog.
// Uno per grant, cosi' step5-ui compone la visibilita' senza logica inline nei componenti.
export function makeRolePredicate(grant: string): (status: AuthStatus | undefined) => boolean {
  return (status) => hasGrant(status, grant);
}

// disable-by-state: consuma il booleano SERVER-DERIVED (es. DTO.modificabile), NON ricostruisce la
// matrice di transizione lato client (dominio del BE). Flag assente -> read-only PRUDENZIALE
// (fail-safe verso la sola-lettura, mai verso l'abilitazione).
export function isEditable(record: { modificabile?: boolean } | null | undefined): boolean {
  return record?.modificabile === true;
}
