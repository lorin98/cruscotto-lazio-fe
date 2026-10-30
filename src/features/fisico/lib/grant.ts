// grant.ts — grant VERBATIM dell'authz-catalog per le letture del fisico e i predicati di visibilita' (PURO). Sono GATE DI
// UX (hide-by-role), MAI enforcement: il backend ridecide su ogni lettura (403 ACCESSO_NEGATO). Il predicato e' hasGrant:
// il grant e' fra i roles[] di /auth/status (come nell'elenco operativo). Dal riallineamento degli ambiti del 29/10/2026
// entrano l'output regionale (dall'istituzionale) e le Unit Amount (dal procedurale); le determine di una domanda (TX-0020)
// sono del procedurale. Il dettaglio dell'intervento (flusso intervento del 30/10/2026) si apre con almeno una delle tre
// letture che compone.
import { GRANT_ELENCO } from '../../../entities/domanda';
import { hasGrant } from '../../../shared/api/auth/stato';
import type { AuthStatus } from '../../../shared/api/auth/stato';

export const GRANT = {
  /** TX-0018 (RF018): superfici ammissibili; apre la pagina delle superfici. */
  superfici: 'csr.tx-0018.read',
  /** TX-0017 (RF017): output regionale programmato e realizzato; apre la sua pagina. */
  output: 'csr.tx-0017.read',
  /** TX-0030 (RF030): pagamenti per Unit Amount; apre la sua pagina. */
  unitAmount: 'csr.tx-0030.read',
  /** TX-0060 dell'elenco operativo (RA006, decisione G2): valori del pannello dei filtri delle pagine del fisico. */
  filtri: GRANT_ELENCO.filtri,
} as const;

export type Lettura = keyof typeof GRANT;

/** Il profilo puo' fare la lettura (stato assente = no: in caricamento non si mostra un link che porterebbe a un 403). */
export function puoLeggere(status: AuthStatus | undefined, lettura: Lettura): boolean {
  return hasGrant(status, GRANT[lettura]);
}

/** Le letture che il dettaglio dell'intervento compone (TX-0017, TX-0018, TX-0030), nell'ordine delle sue schede. */
export const LETTURE_DETTAGLIO = ['output', 'superfici', 'unitAmount'] as const satisfies readonly Lettura[];

/**
 * Il profilo puo' aprire il dettaglio dell'intervento: ha almeno uno dei tre grant (visibility della route). Decide i link
 * "Apri il dettaglio" dei drawer delle tre pagine.
 */
export function puoAprireIntervento(status: AuthStatus | undefined): boolean {
  return LETTURE_DETTAGLIO.some((l) => puoLeggere(status, l));
}
