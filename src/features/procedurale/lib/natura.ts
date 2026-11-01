// natura.ts — la natura delle letture del procedurale col filtro SIGC (revisioni del 31/10/2026, F3; natura delle card
// scelta dall'utente il 01/11/2026), in un solo punto (review H-06 e X-12: prima scritta nelle pagine, nei criteri e nei
// link). L'area e' di fatto NO SIGC: col filtro SIGC stati, sottofasi e domande ammesse sono non pertinenti e si leggono
// senza filtro; la stessa decisione da' la non pertinenza della card, i criteri della lettura e il filtro SIGC dei suoi
// link verso l'elenco. Lo stato area programmazione e il riepilogo per intervento sono misti e si ricalcolano col filtro.
// I motivi sono i testi dei wireframe approvati (prima in ui/, review H-10).
import { letturaDelTipo } from '../../../shared/lib';
import type { LetturaDelTipo } from '../../../shared/lib';
import { criteriDelReport } from './criteri';
import type { CriteriProcedurali } from './criteri';

/** Le letture di soli dati NO SIGC e il motivo della loro non pertinenza col filtro SIGC. */
export const MOTIVI_NO_SIGC = {
  statiSostegno: 'Riguarda solo le domande di sostegno, che sono NO SIGC',
  statiPagamento: 'Riguarda solo le domande di pagamento NO SIGC (CSR-DP)',
  ammesse: 'Riguarda solo le domande ammesse in determina, che sono NO SIGC',
  sottofasi: 'Riguarda solo le domande NO SIGC',
} as const;

export type LetturaNoSigc = keyof typeof MOTIVI_NO_SIGC;

/**
 * Una lettura di soli dati NO SIGC: la non pertinenza della card (col filtro SIGC) e i criteri della lettura (col filtro
 * SIGC senza filtro, il dato reale; col filtro NO SIGC o senza filtro quelli del report).
 */
export function letturaNoSigc(c: CriteriProcedurali, lettura: LetturaNoSigc): LetturaDelTipo<CriteriProcedurali> {
  return letturaDelTipo(criteriDelReport(c), 'nosigc', MOTIVI_NO_SIGC[lettura]);
}
