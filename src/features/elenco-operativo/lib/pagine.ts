// pagine.ts — pagine dell'elenco operativo per il menu e la Home (layer app, OP-EO-04), visibili per grant: gate di UX,
// l'enforcement resta del backend. PURO.
import { PERCORSO_DOMANDE, PERCORSO_PAGAMENTI } from './collegamenti';
import { GRANT } from './grant';

export interface PaginaElenco {
  percorso: string;
  voceMenu: string;
  grant: string;
}

export const PAGINE_ELENCO: readonly PaginaElenco[] = [
  { percorso: PERCORSO_DOMANDE, voceMenu: 'Domande', grant: GRANT.domande },
  { percorso: PERCORSO_PAGAMENTI, voceMenu: 'Pagamenti', grant: GRANT.pagamenti },
];

/** Le pagine che il profilo puo' aprire, nell'ordine del menu. */
export function pagineVisibili(haGrant: (grant: string) => boolean): PaginaElenco[] {
  return PAGINE_ELENCO.filter((p) => haGrant(p.grant));
}
