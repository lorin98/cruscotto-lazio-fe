// pagine.ts — pagine del fisico per il menu e la Home (layer app, OP-FIS-07), visibili per grant: gate di UX,
// l'enforcement resta del backend. Percorsi e grant sono quelli di src/app/route-table.json (un test li confronta). Dal
// riallineamento degli ambiti del 29/10/2026 il menu e': Superfici ammissibili (l'ingresso dalla Home), Output regionale
// (dall'istituzionale), Unit Amount (dal procedurale); le determine di una domanda sono del procedurale. Il dettaglio
// dell'intervento (/fisico/interventi/:codice, 30/10/2026) non e' una voce di menu: ci si arriva dai drawer dei tre report.
// PURO.
import { GRANT, LETTURE_DETTAGLIO } from './grant';

export const PERCORSI = {
  superfici: '/fisico/superfici',
  output: '/fisico/output-regionale',
  unitAmount: '/fisico/unit-amount',
  /** Base della route /fisico/interventi/:codice (il dettaglio dell'intervento). */
  interventi: '/fisico/interventi',
} as const;

export interface PaginaFisico {
  percorso: string;
  voceMenu: string;
  grant: string;
}

export const PAGINE_FISICO: readonly PaginaFisico[] = [
  { percorso: PERCORSI.superfici, voceMenu: 'Superfici ammissibili', grant: GRANT.superfici },
  { percorso: PERCORSI.output, voceMenu: 'Output regionale', grant: GRANT.output },
  { percorso: PERCORSI.unitAmount, voceMenu: 'Unit Amount', grant: GRANT.unitAmount },
];

/** Il dettaglio dell'intervento si apre con almeno uno dei grant delle tre letture che compone (visibility della route). */
export const GRANT_DETTAGLIO: readonly string[] = LETTURE_DETTAGLIO.map((l) => GRANT[l]);

/** Le pagine che il profilo puo' aprire, nell'ordine del menu. */
export function pagineVisibili(haGrant: (grant: string) => boolean): PaginaFisico[] {
  return PAGINE_FISICO.filter((p) => haGrant(p.grant));
}
