// pagine.ts — pagine dell'istituzionale per il menu e la Home (layer app, OP-IS-05 e decisione G1), visibili per grant:
// gate di UX, l'enforcement resta del backend. Percorsi e grant sono quelli di src/app/route-table.json (un test li
// confronta). Dal riallineamento degli ambiti del 29/10/2026 le due verifiche SMP, prima la non SIGC (l'ingresso dalla
// Home) e poi la SIGC venuta dal finanziario; l'output regionale e' del fisico. Il dettaglio dell'intervento non e' una
// voce di menu: ci si arriva dai report. PURO.
import { ricercaDeiSoliFiltri } from '../../../entities/filtri';
import { GRANT } from './grant';

export const PERCORSI = {
  verifica: '/istituzionale/verifica-smp-non-sigc',
  verificaSigc: '/istituzionale/verifica-smp-sigc',
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
  { percorso: PERCORSI.verificaSigc, voceMenu: 'Verifica SMP SIGC', grant: GRANT.verificaSigc },
];

/**
 * Il dettaglio dell'intervento si apre col grant della verifica SMP non SIGC, l'unica lettura che compone (visibility della
 * route); la scheda della verifica SIGC (TX-0015) e' dei passi successivi.
 */
export const GRANT_DETTAGLIO: readonly string[] = [GRANT.verifica];

/** Le pagine che il profilo puo' aprire, nell'ordine del menu. */
export function pagineVisibili(haGrant: (grant: string) => boolean): PaginaIstituzionale[] {
  return PAGINE_ISTITUZIONALE.filter((p) => haGrant(p.grant));
}

/**
 * La parte dell'indirizzo che resta passando dal menu da un report all'altro dell'area: i filtri del programma, gli stessi
 * nei due report (come nel finanziario, la stessa funzione di entities/filtri). L'anno di riferimento del file e
 * l'esercizio no: sono periodi diversi, uno per verifica.
 */
export const ricercaConservata: (search: string) => string = ricercaDeiSoliFiltri;
