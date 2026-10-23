// pagine.ts — pagine del procedurale per il menu e la Home (layer app, decisione G1), visibili per grant: gate di UX,
// l'enforcement resta del backend. Percorsi e voci sono quelli dei wireframe approvati (menu del flusso panoramica); una
// pagina compare con almeno una delle letture dei suoi report (la panoramica ne ha quattro, le sottofasi due), sempre fra
// i grant della visibility della sua route in src/app/route-table.json (un test li confronta). Il dettaglio
// dell'intervento non e' una voce di menu: ci si arriva dai report. PURO.
import { ricercaDeiCriteri } from './criteri';
import { GRANT } from './grant';

export const PERCORSI = {
  panoramica: '/procedurale',
  statiSostegno: '/procedurale/stati-sostegno',
  statiPagamento: '/procedurale/stati-pagamento',
  ammesse: '/procedurale/ammesse',
  sottofasi: '/procedurale/sottofasi',
  unitAmount: '/procedurale/unit-amount',
  riepilogo: '/procedurale/riepilogo',
  /** Base della route /procedurale/interventi/:codice (il dettaglio dell'intervento). */
  interventi: '/procedurale/interventi',
} as const;

export interface PaginaProcedurale {
  percorso: string;
  voceMenu: string;
  /** Le letture dei report della pagina: la voce compare col grant di almeno una. */
  grant: readonly string[];
}

/** Le pagine nell'ordine del menu dei wireframe approvati. */
export const PAGINE_PROCEDURALE: readonly PaginaProcedurale[] = [
  { percorso: PERCORSI.panoramica, voceMenu: 'Panoramica', grant: [GRANT.ammesse, GRANT.statiSostegno, GRANT.statiPagamento, GRANT.riepilogo] },
  { percorso: PERCORSI.statiSostegno, voceMenu: 'Stati delle domande di sostegno', grant: [GRANT.statiSostegno] },
  { percorso: PERCORSI.statiPagamento, voceMenu: 'Stati delle domande di pagamento', grant: [GRANT.statiPagamento] },
  { percorso: PERCORSI.ammesse, voceMenu: 'Domande ammesse', grant: [GRANT.ammesse] },
  { percorso: PERCORSI.sottofasi, voceMenu: 'Sottofasi di ammissibilità', grant: [GRANT.sottofasiSostegno, GRANT.sottofasiPagamento] },
  { percorso: PERCORSI.unitAmount, voceMenu: 'Unit Amount', grant: [GRANT.unitAmount] },
  { percorso: PERCORSI.riepilogo, voceMenu: 'Riepilogo per intervento', grant: [GRANT.riepilogo] },
];

/** Le pagine che il profilo puo' aprire, nell'ordine del menu. */
export function pagineVisibili(haGrant: (grant: string) => boolean): PaginaProcedurale[] {
  return PAGINE_PROCEDURALE.filter((p) => p.grant.some(haGrant));
}

/**
 * La parte dell'indirizzo che resta passando dal menu da una pagina all'altra del procedurale: i criteri dei report
 * (intervento, OS, OG, OP e stato), gli stessi in tutte le pagine, sottofasi comprese (wireframe del pannello).
 */
export const ricercaConservata: (search: string) => string = ricercaDeiCriteri;
