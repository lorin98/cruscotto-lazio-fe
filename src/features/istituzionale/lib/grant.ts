// grant.ts — grant VERBATIM dell'authz-catalog per le letture dell'istituzionale e i predicati di visibilita' (PURO). Sono
// GATE DI UX (hide-by-role), MAI enforcement: il backend ridecide su ogni lettura (403 ACCESSO_NEGATO). Il predicato e'
// hasGrant: il grant e' fra i roles[] di /auth/status (come nel fisico e nell'elenco operativo).
import { GRANT_ELENCO } from '../../../entities/domanda';
import { hasGrant } from '../../../shared/api/auth/stato';
import type { AuthStatus } from '../../../shared/api/auth/stato';

export const GRANT = {
  /** TX-0016 (RF016): verifica SMP non SIGC; apre la sua pagina e la scheda Verifica del dettaglio dell'intervento. */
  verifica: 'csr.tx-0016.read',
  /** TX-0060 dell'elenco operativo (RA006, decisione G2): valori del pannello dei filtri, descrizione dell'intervento. */
  filtri: GRANT_ELENCO.filtri,
  /** TX-0056 dell'elenco operativo: destinazione dei link "Apri nell'elenco" delle domande ricevute (OP-IS-09). */
  elencoDomande: GRANT_ELENCO.domande,
  /** TX-0059 dell'elenco operativo: destinazione dei link "Apri nei pagamenti" della spesa erogata (OP-IS-09). */
  elencoPagamenti: GRANT_ELENCO.pagamenti,
  /**
   * TX-0015 (RF015): verifica SMP SIGC, dal finanziario all'istituzionale col riallineamento degli ambiti del 29/10/2026;
   * apre la sua pagina e la frase con il link dalla verifica SMP non SIGC.
   */
  verificaSigc: 'csr.tx-0015.read',
} as const;

export type Lettura = keyof typeof GRANT;

/** Il profilo puo' fare la lettura (stato assente = no: in caricamento non si mostra un link che porterebbe a un 403). */
export function puoLeggere(status: AuthStatus | undefined, lettura: Lettura): boolean {
  return hasGrant(status, GRANT[lettura]);
}
