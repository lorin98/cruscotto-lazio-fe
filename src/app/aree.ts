// aree.ts — catalogo unico delle aree del cruscotto (review step9 H-22): la Home (routes.tsx) e il menu laterale
// (menu.tsx) lo iterano, invece di scrivere ciascuno a mano le aree realizzate e quelle future. Le pagine di un'area e
// la loro visibilita' per grant (solo UX, l'enforcement resta del backend) le espone il barrel della feature; le route
// restano in route-table.json. Una nuova area si aggiunge qui con le funzioni del suo barrel e si toglie da AREE_FUTURE.
import { filtriDaRicerca, pagineVisibili as pagineFinanziario, ricercaDaFiltri } from '../features/finanziario';
import type { NomeIcona } from '../shared/ui';

/** Una pagina di un'area, come la espone il barrel della feature. */
export interface PaginaArea {
  percorso: string;
  /** Voce breve del menu laterale. */
  voceMenu: string;
}

export interface Area {
  /** Identificativo stabile (chiavi React, id del DOM). */
  chiave: string;
  titolo: string;
  /** Testo della card dell'area nella Home. */
  descrizione: string;
  icona: NomeIcona;
  /** Pagine dell'area visibili per i grant dell'utente, nell'ordine del menu: la prima e' l'ingresso dalla Home. */
  pagineVisibili: (haGrant: (grant: string) => boolean) => PaginaArea[];
  /** Parte dell'indirizzo (senza "?") che resta passando da una pagina all'altra dell'area: per esempio i filtri. */
  ricercaConservata?: (search: string) => string;
}

export const AREE: readonly Area[] = [
  {
    chiave: 'finanziario',
    titolo: 'Finanziario',
    descrizione: 'Dotazione, pagamenti, domande e SIGC per intervento, con il dettaglio di ogni intervento.',
    icona: 'it-chart-line',
    pagineVisibili: pagineFinanziario,
    ricercaConservata: (search) => ricercaDaFiltri(filtriDaRicerca(search)),
  },
];

/** Aree non ancora realizzate: la Home e il menu le dichiarano "presto", senza link. */
export const AREE_FUTURE: readonly string[] = ['Fisico', 'Procedurale', 'Istituzionale', 'Primo pilastro'];

/** Le aree con almeno una pagina visibile per i grant dell'utente, ognuna con le sue pagine visibili. */
export function areeVisibili(haGrant: (grant: string) => boolean): { area: Area; pagine: PaginaArea[] }[] {
  return AREE.map((area) => ({ area, pagine: area.pagineVisibili(haGrant) })).filter((a) => a.pagine.length > 0);
}
