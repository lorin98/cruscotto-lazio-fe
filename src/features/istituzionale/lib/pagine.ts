// pagine.ts — pagine dell'istituzionale per il menu e la Home (layer app, OP-IS-05 e decisione G1), visibili per grant:
// gate di UX, l'enforcement resta del backend. Percorsi e grant sono quelli di src/app/route-table.json (un test li
// confronta). Il dettaglio dell'intervento non e' una voce di menu: ci si arriva dai due report. PURO.
import { ricercaDeiSoliFiltri } from '../../../entities/filtri';
import { GRANT } from './grant';

export const PERCORSI = {
  verifica: '/istituzionale/verifica-smp-non-sigc',
  output: '/istituzionale/output-regionale',
  /** Base della route /istituzionale/interventi/:codice (il dettaglio dell'intervento). */
  interventi: '/istituzionale/interventi',
} as const;

export interface PaginaIstituzionale {
  percorso: string;
  voceMenu: string;
  grant: string;
}

export const PAGINE_ISTITUZIONALE: readonly PaginaIstituzionale[] = [
  { percorso: PERCORSI.verifica, voceMenu: 'Verifica SMP non SIGC', grant: GRANT.verifica },
  { percorso: PERCORSI.output, voceMenu: 'Output regionale', grant: GRANT.output },
];

/** Il dettaglio dell'intervento si apre con uno dei due grant dei report (visibility della route: almeno uno). */
export const GRANT_DETTAGLIO: readonly string[] = [GRANT.verifica, GRANT.output];

/** Le pagine che il profilo puo' aprire, nell'ordine del menu. */
export function pagineVisibili(haGrant: (grant: string) => boolean): PaginaIstituzionale[] {
  return PAGINE_ISTITUZIONALE.filter((p) => haGrant(p.grant));
}

/**
 * La parte dell'indirizzo che resta passando dal menu da un report all'altro dell'area: i filtri del programma, gli stessi
 * nei due report (come nel finanziario, la stessa funzione di entities/filtri). L'anno di riferimento del file no:
 * l'output regionale non lo ha.
 */
export const ricercaConservata: (search: string) => string = ricercaDeiSoliFiltri;
