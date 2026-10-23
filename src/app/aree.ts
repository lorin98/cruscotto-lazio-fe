// aree.ts — catalogo unico degli ambiti del cruscotto (review step9 H-22): la Home (home.tsx) e il menu laterale
// (menu.tsx) lo iterano, invece di scrivere ciascuno a mano le aree realizzate e quelle future. Le pagine di un'area e
// la loro visibilita' per grant (solo UX, l'enforcement resta del backend) le espone il barrel della feature; le route
// restano in route-table.json. Una nuova area si aggiunge qui con le funzioni del suo barrel e si toglie da AREE_FUTURE.
// Gli ambiti sono quattro (finanziario, fisico, procedurale, istituzionale), ognuno col suo colore; i dati del primo
// pilastro (Extra CSR) non hanno un ambito nel frontend (scelta dell'utente del 12/10/2026). Le card descrivono il
// contenuto reale delle feature (decisione G1 dell'utente del 21/10/2026): ogni pagina sta nella feature della sua slice.
import type { ComponentType, ReactNode } from 'react';
import { ricercaDeiSoliFiltri } from '../entities/filtri';
import { pagineVisibili as pagineElenco } from '../features/elenco-operativo';
import { AnteprimaFinanziario, pagineVisibili as pagineFinanziario } from '../features/finanziario';
import { pagineVisibili as pagineFisico } from '../features/fisico';
import { pagineVisibili as pagineIstituzionale, ricercaConservata as ricercaIstituzionale } from '../features/istituzionale';
import type { NomeIcona } from '../shared/ui';

/** Una pagina di un'area, come la espone il barrel della feature. */
export interface PaginaArea {
  percorso: string;
  /** Voce breve del menu laterale. */
  voceMenu: string;
  /** La voce del menu e' corrente anche nei sottopercorsi (es. /fisico/determine/<codice>); di norma solo sul percorso. */
  conSottopercorsi?: boolean;
}

/** Colore dell'ambito nella Home (classi ui-ambito--<tono> di tema.css). */
export type TonoArea = 'blu' | 'verde' | 'arancio' | 'viola';

/** Cio' che serve alla card della Home, per le aree realizzate e per quelle future. */
export interface SchedaArea {
  /** Identificativo stabile (chiavi React, id del DOM). */
  chiave: string;
  titolo: string;
  /** Testo della card dell'area nella Home. */
  descrizione: string;
  icona: NomeIcona;
  tono: TonoArea;
  /** Cosa si trova nell'area (requisiti dell'ambito), in breve: la card lo elenca. */
  contenuti: readonly string[];
}

export interface Area extends SchedaArea {
  /** Pagine dell'area visibili per i grant dell'utente, nell'ordine del menu: la prima e' l'ingresso dalla Home. */
  pagineVisibili: (haGrant: (grant: string) => boolean) => PaginaArea[];
  /** Parte dell'indirizzo (senza "?") che resta passando da una pagina all'altra dell'area: per esempio i filtri. */
  ricercaConservata?: (search: string) => string;
  /** Numeri chiave dell'area nella card della Home (letture con i grant dell'utente); senza i grant, `altrimenti`. */
  Anteprima?: ComponentType<{ altrimenti: ReactNode }>;
}

export const AREE: readonly Area[] = [
  {
    chiave: 'finanziario',
    titolo: 'Finanziario',
    descrizione: 'Dotazione, pagamenti, domande e SIGC per intervento, con il dettaglio di ogni intervento.',
    icona: 'it-chart-line',
    tono: 'blu',
    contenuti: ['Dotazione, impegni e pagamenti per intervento', 'Domande e importi per anno di raccolta', 'SIGC, riserva di efficacia e verifica SMP'],
    pagineVisibili: pagineFinanziario,
    ricercaConservata: ricercaDeiSoliFiltri,
    Anteprima: AnteprimaFinanziario,
  },
  {
    // G1: superfici ammissibili (TX-0018) e determine di una domanda (TX-0020); le due pagine non condividono filtri
    chiave: 'fisico',
    titolo: 'Fisico',
    descrizione: 'Superfici ammissibili delle domande di sostegno e di pagamento per intervento e campagna, e determine di una domanda.',
    icona: 'it-map-marker',
    tono: 'verde',
    contenuti: ['Superfici ammissibili di sostegno e di pagamento per intervento e campagna', 'Verifica incrociata fra superficie di pagamento e di sostegno', 'Determine da cui una domanda prende le informazioni'],
    pagineVisibili: pagineFisico,
  },
  {
    // G1: verifica SMP non SIGC (TX-0016) e output regionale programmato e realizzato (TX-0017); i due report hanno gli
    // stessi filtri, che restano passando dall'uno all'altro (come nel finanziario). Il dettaglio dell'intervento non e'
    // una voce di menu: ci si arriva dai report.
    chiave: 'istituzionale',
    titolo: 'Istituzionale',
    descrizione: 'Dati ASR non SIGC a confronto con SMP - Data Platform e output regionale programmato e realizzato.',
    icona: 'it-pa',
    tono: 'viola',
    contenuti: ['Verifica SMP dei dati ASR non SIGC', 'Output regionale programmato e realizzato per intervento e anno'],
    pagineVisibili: pagineIstituzionale,
    ricercaConservata: ricercaIstituzionale,
  },
];

/** Aree non ancora realizzate: la Home e il menu le dichiarano "presto", senza link. */
export const AREE_FUTURE: readonly SchedaArea[] = [
  {
    // G1: stati e sottofasi delle domande, ammesse con atto e contributo, riepilogo, Unit Amount (TX-0024..TX-0032)
    chiave: 'procedurale',
    titolo: 'Procedurale',
    descrizione: 'Stati e sottofasi delle domande di sostegno e di pagamento, domande ammesse e pagamenti per Unit Amount.',
    icona: 'it-file-signed',
    tono: 'arancio',
    contenuti: ['Stati e sottofasi delle domande', 'Domande ammesse con atto di concessione e contributo', 'Riepilogo per intervento e pagamenti per Unit Amount'],
  },
];

/**
 * Strumenti trasversali agli ambiti (OP-EO-04): l'elenco operativo delle domande e dei pagamenti. Non sono un ambito
 * (la griglia della Home resta di quattro): menu e Home li mostrano in una sezione propria.
 */
export const STRUMENTI: readonly Area[] = [
  {
    chiave: 'elenco-operativo',
    titolo: 'Elenco operativo',
    descrizione: 'Tutte le domande e i pagamenti del tuo perimetro: filtri liberi, sinottico e totali sempre aggiornati, scheda di ogni domanda.',
    icona: 'it-list',
    tono: 'blu',
    contenuti: ['Domande di sostegno e di pagamento con il beneficiario', 'Righe degli elenchi di liquidazione', 'Scheda della domanda con determine, pagamenti e recuperi'],
    pagineVisibili: pagineElenco,
  },
];

/** Vero per un'area realizzata (con le sue pagine), falso per una scheda di un'area futura. */
export function eRealizzata(a: Area | SchedaArea): a is Area {
  return 'pagineVisibili' in a;
}

/** L'ordine dei quattro ambiti nella Home e nel menu, fisso: un'area che si realizza non cambia di posto. */
const ORDINE_AMBITI = ['finanziario', 'fisico', 'procedurale', 'istituzionale'];

/** I quattro ambiti, realizzati e futuri, nell'ordine del catalogo (finanziario, fisico, procedurale, istituzionale). */
export const AMBITI: readonly (Area | SchedaArea)[] = [...AREE, ...AREE_FUTURE].sort((a, b) => ORDINE_AMBITI.indexOf(a.chiave) - ORDINE_AMBITI.indexOf(b.chiave));

/** Le aree (o gli strumenti) con almeno una pagina visibile per i grant dell'utente, ognuna con le sue pagine visibili. */
export function areeVisibili(haGrant: (grant: string) => boolean, aree: readonly Area[] = AREE): { area: Area; pagine: PaginaArea[] }[] {
  return aree.map((area) => ({ area, pagine: area.pagineVisibili(haGrant) })).filter((a) => a.pagine.length > 0);
}
