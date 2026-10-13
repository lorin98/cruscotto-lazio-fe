// aree.ts — catalogo unico degli ambiti del cruscotto (review step9 H-22): la Home (home.tsx) e il menu laterale
// (menu.tsx) lo iterano, invece di scrivere ciascuno a mano le aree realizzate e quelle future. Le pagine di un'area e
// la loro visibilita' per grant (solo UX, l'enforcement resta del backend) le espone il barrel della feature; le route
// restano in route-table.json. Una nuova area si aggiunge qui con le funzioni del suo barrel e si toglie da AREE_FUTURE.
// Gli ambiti sono quattro (finanziario, fisico, procedurale, istituzionale), ognuno col suo colore; i dati del primo
// pilastro (Extra CSR) non hanno un ambito nel frontend (scelta dell'utente del 12/10/2026).
import type { ComponentType, ReactNode } from 'react';
import { pagineVisibili as pagineElenco } from '../features/elenco-operativo';
import { AnteprimaFinanziario, filtriDaRicerca, pagineVisibili as pagineFinanziario, ricercaDaFiltri } from '../features/finanziario';
import type { NomeIcona } from '../shared/ui';

/** Una pagina di un'area, come la espone il barrel della feature. */
export interface PaginaArea {
  percorso: string;
  /** Voce breve del menu laterale. */
  voceMenu: string;
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
    ricercaConservata: (search) => ricercaDaFiltri(filtriDaRicerca(search)),
    Anteprima: AnteprimaFinanziario,
  },
];

/** Aree non ancora realizzate: la Home e il menu le dichiarano "presto", senza link. */
export const AREE_FUTURE: readonly SchedaArea[] = [
  {
    chiave: 'fisico',
    titolo: 'Fisico',
    descrizione: 'Output programmati e realizzati per intervento e superfici ammissibili delle domande.',
    icona: 'it-map-marker',
    tono: 'verde',
    contenuti: ['Output programmato e realizzato dal 2023 al 2029', 'Superfici ammissibili di sostegno e di pagamento', 'Pagamenti per Unit Amount'],
  },
  {
    chiave: 'procedurale',
    titolo: 'Procedurale',
    descrizione: 'Stati delle domande di sostegno e di pagamento, determine e atti di concessione.',
    icona: 'it-file-signed',
    tono: 'arancio',
    contenuti: ['Stati e sottofasi delle domande', 'Determine, responsabili e ADA di riferimento', 'Domande con atto di concessione e contributo ammesso'],
  },
  {
    chiave: 'istituzionale',
    titolo: 'Istituzionale',
    descrizione: 'Dati dei file ASR a confronto con SMP - Data Platform e output regionali.',
    icona: 'it-pa',
    tono: 'viola',
    contenuti: ['Dati ASR SIGC e non SIGC da confrontare con SMP', 'Avvisi attivati e chiusi, concessioni previste', 'Output regionale per intervento'],
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

/** Le aree (o gli strumenti) con almeno una pagina visibile per i grant dell'utente, ognuna con le sue pagine visibili. */
export function areeVisibili(haGrant: (grant: string) => boolean, aree: readonly Area[] = AREE): { area: Area; pagine: PaginaArea[] }[] {
  return aree.map((area) => ({ area, pagine: area.pagineVisibili(haGrant) })).filter((a) => a.pagine.length > 0);
}
