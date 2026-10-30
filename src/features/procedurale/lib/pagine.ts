// pagine.ts — pagine del procedurale per il menu e la Home (layer app, decisione G1), visibili per grant: gate di UX,
// l'enforcement resta del backend. Percorsi e voci sono quelli dei wireframe approvati (menu del flusso panoramica); una
// pagina compare con almeno una delle letture dei suoi report (la panoramica ne ha quattro, le sottofasi due), sempre fra
// i grant della visibility della sua route in src/app/route-table.json (un test li confronta). Il dettaglio
// dell'intervento non e' una voce di menu: ci si arriva dai report. Col riallineamento degli ambiti del 29/10/2026 esce
// Unit Amount (al fisico) ed entrano, ultima voce, le determine di una domanda (dal fisico): senza filtri, la voce non
// prende i criteri dei report (scelta raccomandata dal dossier dei wireframe e presa dall'utente il 30/10/2026). PURO.
import { ricercaDeiCriteri } from './criteri';
import { GRANT } from './grant';

export const PERCORSI = {
  panoramica: '/procedurale',
  statiSostegno: '/procedurale/stati-sostegno',
  statiPagamento: '/procedurale/stati-pagamento',
  ammesse: '/procedurale/ammesse',
  sottofasi: '/procedurale/sottofasi',
  riepilogo: '/procedurale/riepilogo',
  /** Ingresso dal menu della route /procedurale/determine/:codice? (il codice e' facoltativo: senza, il solo modulo di ricerca). */
  determine: '/procedurale/determine',
  /** Base della route /procedurale/interventi/:codice (il dettaglio dell'intervento). */
  interventi: '/procedurale/interventi',
} as const;

export interface PaginaProcedurale {
  percorso: string;
  voceMenu: string;
  /** Le letture dei report della pagina: la voce compare col grant di almeno una. */
  grant: readonly string[];
  /** La voce di menu vale anche per i sottopercorsi (le determine di una domanda: /procedurale/determine/<codice>). */
  conSottopercorsi?: boolean;
  /** La voce non prende i criteri dei report passando dal menu (le determine di una domanda non hanno filtri). */
  senzaRicercaConservata?: boolean;
}

/** Le pagine nell'ordine del menu dei wireframe approvati. */
export const PAGINE_PROCEDURALE: readonly PaginaProcedurale[] = [
  { percorso: PERCORSI.panoramica, voceMenu: 'Panoramica', grant: [GRANT.ammesse, GRANT.statiSostegno, GRANT.statiPagamento, GRANT.riepilogo] },
  { percorso: PERCORSI.statiSostegno, voceMenu: 'Stati delle domande di sostegno', grant: [GRANT.statiSostegno] },
  { percorso: PERCORSI.statiPagamento, voceMenu: 'Stati delle domande di pagamento', grant: [GRANT.statiPagamento] },
  { percorso: PERCORSI.ammesse, voceMenu: 'Domande ammesse', grant: [GRANT.ammesse] },
  { percorso: PERCORSI.sottofasi, voceMenu: 'Sottofasi di ammissibilità', grant: [GRANT.sottofasiSostegno, GRANT.sottofasiPagamento] },
  { percorso: PERCORSI.riepilogo, voceMenu: 'Riepilogo per intervento', grant: [GRANT.riepilogo] },
  { percorso: PERCORSI.determine, voceMenu: 'Determine di una domanda', grant: [GRANT.determine], conSottopercorsi: true, senzaRicercaConservata: true },
];

/** Le pagine che il profilo puo' aprire, nell'ordine del menu. */
export function pagineVisibili(haGrant: (grant: string) => boolean): PaginaProcedurale[] {
  return PAGINE_PROCEDURALE.filter((p) => p.grant.some(haGrant));
}

/**
 * La parte dell'indirizzo che resta passando dal menu da una pagina all'altra del procedurale: i criteri dei report
 * (intervento, OS, OG, OP e stato), gli stessi in tutte le pagine dei report, sottofasi comprese (wireframe del pannello);
 * non le determine di una domanda (senzaRicercaConservata).
 */
export const ricercaConservata: (search: string) => string = ricercaDeiCriteri;
