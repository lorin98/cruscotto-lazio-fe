// collegamenti.ts — indirizzi dei link dichiarati nello uiplan della feature (PURO): scheda della domanda, elenco dei
// pagamenti delle domande filtrate e ritorno, altre domande del beneficiario, ricerca di partenza della scheda, determine
// della domanda nel procedurale. Ogni link porta i parametri della sua `query` nello uiplan (i filtri della domanda,
// drill-down procedurale compreso).
import {
  PERCORSO_ELENCO_DOMANDE,
  PERCORSO_ELENCO_PAGAMENTI,
  arrivoDallaScheda,
  percorsoDetermineDellaDomanda,
  percorsoSchedaDomanda,
  riferimentoDomandaValido,
} from '../../../entities/domanda';
import { conStatoSalvato, leggiStatoSalvato } from '../../../shared/lib';
import type { StatoSalvato } from '../../../shared/lib';
import type { Criteri } from './criteri';
import { filtriDellaDomanda, ricercaDaCriteri } from './criteri';

// i percorsi sono del contratto dell'indirizzo condiviso con il finanziario (entities/domanda)
export const PERCORSO_DOMANDE = PERCORSO_ELENCO_DOMANDE;
export const PERCORSO_PAGAMENTI = PERCORSO_ELENCO_PAGAMENTI;

/**
 * Tipo e codice a barre utilizzabili come riferimento della scheda (TX-0058), e la scheda della domanda (link
 * dettaglio-domanda, domanda-collegata, dettaglio-domanda-del-pagamento; null se il riferimento non e' valido): sono del
 * contratto dell'indirizzo condiviso con il fisico (entities/domanda, link scheda-domanda delle determine).
 */
export const riferimentoValido = riferimentoDomandaValido;
export const percorsoDettaglio = percorsoSchedaDomanda;

/** Link pagamenti-delle-domande: l'elenco dei pagamenti con i filtri della domanda (non pagina ne' ordinamento). */
export function percorsoPagamentiDelleDomande(criteri: Criteri): string {
  return `${PERCORSO_PAGAMENTI}${ricercaDaCriteri(filtriDellaDomanda(criteri), 'pagamenti')}`;
}

/** Link domande-dei-pagamenti: l'elenco delle domande con i filtri della domanda (decreto ed esito restano ai pagamenti). */
export function percorsoDomandeDeiPagamenti(criteri: Criteri): string {
  return `${PERCORSO_DOMANDE}${ricercaDaCriteri(filtriDellaDomanda(criteri), 'domande')}`;
}

/**
 * Link determine-della-domanda (scelta S-3 b dell'utente del 30/10/2026, OP-EO-07): le determine della domanda della scheda
 * nell'area Procedurale (/procedurale/determine/<codice a barre>), solo col grant della loro lettura (puoAprireLeDetermine,
 * csr.tx-0020.read). L'indirizzo e' del contratto condiviso (entities/domanda): nessun import dalla feature procedurale.
 * Gate di UX, l'enforcement e' del backend (per il P4 la scheda e' gia' nel suo perimetro: l'arrivo non risponde 404).
 * null = nessun link.
 */
export function percorsoDetermine(codiceABarre: string | null | undefined, conGrantDetermine: boolean): string | null {
  return conGrantDetermine ? percorsoDetermineDellaDomanda(codiceABarre) : null;
}

/**
 * State del link determine-della-domanda (decisione D1 dell'utente del 30/10/2026, review step9 EO-01): il tipo della
 * scheda, mai nell'indirizzo. TX-0020 ha solo il codice a barre: con un codice di due domande la pagina delle determine
 * avvisa se mostra quella dell'altro tipo. Contratto condiviso (entities/domanda): nessun import dal procedurale.
 */
export const statoDetermine = arrivoDallaScheda;

/** Link domande-del-beneficiario: le domande col CUAA nel testo libero; null senza CUAA (o troppo corto per la ricerca). */
export function percorsoDomandeDelBeneficiario(cuaa: string | null | undefined): string | null {
  const c = cuaa?.trim();
  if (!c || c.length < 3) return null;
  return `${PERCORSO_DOMANDE}${ricercaDaCriteri({ testo: [c] }, 'domande')}`;
}

/**
 * Scelte della pagina dell'elenco da ritrovare tornando dalla scheda (review v1 X-04, v2 V-03): la vista per ambito (solo
 * le domande) e le colonne nascoste dalla scelta "Colonne". Stanno nello state della voce di history sotto
 * CHIAVE_STATO_ELENCO, nella forma di useStatoNellaHistory del kit ({ firma, valore }), con una firma fissa: vista e
 * colonne non dipendono dai filtri (cambiare i filtri non le cambia; un link condiviso apre la vista generale, OP-EO-02).
 */
export const CHIAVE_STATO_ELENCO = 'elenco';
export const FIRMA_STATO_ELENCO = 'elenco-operativo';

export interface StatoElenco {
  vista?: string;
  nascoste?: string[];
}

type StatoElencoSalvato = StatoSalvato<StatoElenco>;

/** Convalida dello state (che e' `unknown`): vista e chiavi delle colonne come identificativi brevi, al piu' 50 colonne. */
export function statoElencoValido(v: unknown): v is StatoElenco {
  if (typeof v !== 'object' || v === null || Array.isArray(v)) return false;
  const { vista, nascoste } = v as Record<string, unknown>;
  const vistaOk = vista === undefined || (typeof vista === 'string' && /^[a-z]{1,20}$/.test(vista));
  const nascosteOk = nascoste === undefined || (Array.isArray(nascoste) && nascoste.length <= 50 && nascoste.every((c) => typeof c === 'string' && /^[A-Za-z]{1,40}$/.test(c)));
  return vistaOk && nascosteOk;
}

/** Stato di navigazione dei link verso la scheda: la ricerca da cui si e' partiti (link torna-all-elenco) e le scelte
 *  della pagina dell'elenco, da riportare indietro. */
export interface StatoScheda {
  ricerca: string;
  [CHIAVE_STATO_ELENCO]?: StatoElencoSalvato;
}

/** Lo state del link di ritorno all'elenco: le sole scelte della pagina (l'elenco le rilegge con useStatoNellaHistory). */
export type StatoRitorno = { [CHIAVE_STATO_ELENCO]: StatoElencoSalvato };

/** Le scelte dell'elenco dallo state di una voce di history (se valide): da portare alla scheda e da riportare all'elenco.
 *  Lettura e involucro sono quelli del kit (shared/lib stato-history), gli stessi di useStatoNellaHistory. */
export function statoDiRitorno(stato: unknown): StatoRitorno | undefined {
  const valore = leggiStatoSalvato(stato, CHIAVE_STATO_ELENCO, FIRMA_STATO_ELENCO, statoElencoValido);
  return valore === undefined ? undefined : (conStatoSalvato(undefined, CHIAVE_STATO_ELENCO, FIRMA_STATO_ELENCO, valore) as StatoRitorno);
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
