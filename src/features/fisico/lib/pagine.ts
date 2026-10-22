// pagine.ts — pagine del fisico per il menu e la Home (layer app, OP-FIS-07), visibili per grant: gate di UX,
// l'enforcement resta del backend. Percorsi e grant sono quelli di src/app/route-table.json (un test li confronta). PURO.
import { GRANT } from './grant';

export const PERCORSI = {
  superfici: '/fisico/superfici',
  /** Ingresso dal menu della route /fisico/determine/:codice? (il codice e' facoltativo: senza, il solo modulo di ricerca). */
  determine: '/fisico/determine',
} as const;

export interface PaginaFisico {
  percorso: string;
  voceMenu: string;
  /** Titolo della pagina (h1 e titolo del documento) quando la pagina non ne ha uno suo (es. il codice della domanda). */
  titolo: string;
  grant: string;
  /** La voce di menu vale anche per i sottopercorsi (le determine di una domanda: /fisico/determine/<codice>). */
  conSottopercorsi?: boolean;
}

export const PAGINE_FISICO: readonly PaginaFisico[] = [
  { percorso: PERCORSI.superfici, voceMenu: 'Superfici ammissibili', titolo: 'Superfici ammissibili per intervento', grant: GRANT.superfici },
  { percorso: PERCORSI.determine, voceMenu: 'Determine di una domanda', titolo: 'Determine di una domanda', grant: GRANT.determine, conSottopercorsi: true },
];

/** Le pagine che il profilo puo' aprire, nell'ordine del menu. */
export function pagineVisibili(haGrant: (grant: string) => boolean): PaginaFisico[] {
  return PAGINE_FISICO.filter((p) => haGrant(p.grant));
}
