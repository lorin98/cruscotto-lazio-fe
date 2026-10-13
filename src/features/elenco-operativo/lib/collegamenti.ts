// collegamenti.ts — indirizzi dei link dichiarati nello uiplan della feature (PURO): scheda della domanda, elenco dei
// pagamenti delle domande filtrate e ritorno, altre domande del beneficiario, ricerca di partenza della scheda. Ogni link
// porta i parametri della sua `query` nello uiplan (i filtri della domanda, drill-down procedurale compreso).
import { PERCORSO_ELENCO_DOMANDE, PERCORSO_ELENCO_PAGAMENTI } from '../../../entities/domanda';
import type { Criteri } from './criteri';
import { filtriDellaDomanda, ricercaDaCriteri } from './criteri';

// i percorsi sono del contratto dell'indirizzo condiviso con il finanziario (entities/domanda)
export const PERCORSO_DOMANDE = PERCORSO_ELENCO_DOMANDE;
export const PERCORSO_PAGAMENTI = PERCORSO_ELENCO_PAGAMENTI;

const TIPI = new Set(['SOSTEGNO', 'PAGAMENTO']);
const CODICE_A_BARRE = /^\d{1,30}$/;

/**
 * Tipo e codice a barre utilizzabili come riferimento della scheda (TX-0058): tipo SOSTEGNO o PAGAMENTO, codice di sole
 * cifre (al piu' 30). Vale per i link che l'app costruisce e per i parametri del percorso che arrivano dall'indirizzo:
 * un valore diverso non entra mai nell'URL di una lettura (review v1 A-01: niente '/', '..', '%' nel percorso dell'API).
 */
export function riferimentoValido(tipo: string | null | undefined, codiceABarre: string | null | undefined): boolean {
  return Boolean(tipo && TIPI.has(tipo) && codiceABarre && CODICE_A_BARRE.test(codiceABarre));
}

/** Scheda della domanda (link dettaglio-domanda, domanda-collegata, dettaglio-domanda-del-pagamento); null se tipo o codice
 *  non sono un riferimento valido. */
export function percorsoDettaglio(tipo: string | null | undefined, codiceABarre: string | null | undefined): string | null {
  if (!riferimentoValido(tipo, codiceABarre)) return null;
  return `${PERCORSO_DOMANDE}/${tipo}/${codiceABarre}`;
}

/** Link pagamenti-delle-domande: l'elenco dei pagamenti con i filtri della domanda (non pagina ne' ordinamento). */
export function percorsoPagamentiDelleDomande(criteri: Criteri): string {
  return `${PERCORSO_PAGAMENTI}${ricercaDaCriteri(filtriDellaDomanda(criteri), 'pagamenti')}`;
}

/** Link domande-dei-pagamenti: l'elenco delle domande con i filtri della domanda (decreto ed esito restano ai pagamenti). */
export function percorsoDomandeDeiPagamenti(criteri: Criteri): string {
  return `${PERCORSO_DOMANDE}${ricercaDaCriteri(filtriDellaDomanda(criteri), 'domande')}`;
}

/** Link domande-del-beneficiario: le domande col CUAA nel testo libero; null senza CUAA (o troppo corto per la ricerca). */
export function percorsoDomandeDelBeneficiario(cuaa: string | null | undefined): string | null {
  const c = cuaa?.trim();
  if (!c || c.length < 3) return null;
  return `${PERCORSO_DOMANDE}${ricercaDaCriteri({ testo: [c] }, 'domande')}`;
}

/** Stato di navigazione dei link verso la scheda: la ricerca da cui si e' partiti (link torna-all-elenco) e la vista per
 *  ambito dell'elenco delle domande, da ritrovare al ritorno (review v1 X-04). */
export interface StatoScheda {
  ricerca: string;
  vista?: string;
}

/** Lo stato da dare al link di ritorno all'elenco: la sola vista per ambito, se c'era (l'elenco la rilegge). */
export function statoDiRitorno(stato: unknown): { vista: string } | undefined {
  const vista = typeof stato === 'object' && stato !== null ? (stato as Partial<StatoScheda>).vista : undefined;
  return typeof vista === 'string' && /^[a-z]{1,20}$/.test(vista) ? { vista } : undefined;
}

/**
 * La ricerca di partenza portata dallo stato della navigazione (link torna-all-elenco, review v1 V-12): solo un indirizzo
 * dei due elenchi della feature, con la sua query string; qualunque altro valore (anche manipolato) vale l'elenco delle
 * domande senza filtri. Mai la cronologia del browser, che puo' portare fuori dall'applicazione.
 */
export function ritornoAllElenco(stato: unknown): string {
  const ricerca = typeof stato === 'object' && stato !== null ? (stato as Partial<StatoScheda>).ricerca : undefined;
  if (typeof ricerca !== 'string') return PERCORSO_DOMANDE;
  const ok = [PERCORSO_DOMANDE, PERCORSO_PAGAMENTI].some((p) => ricerca === p || ricerca.startsWith(`${p}?`));
  return ok && !ricerca.includes('#') ? ricerca : PERCORSO_DOMANDE;
}
