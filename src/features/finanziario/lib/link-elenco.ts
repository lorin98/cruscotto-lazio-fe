// link-elenco.ts — funzioni PURE della feature finanziario (zero React): indirizzi del drill-down verso l'elenco operativo
// (uiplan links[] con target_feature elenco-operativo, ADR 0028 §7; D-2 di MIN-20261012).
// Ogni link porta i filtri correnti del finanziario piu' i criteri del punto cliccato, limitati ai parametri che il link
// dichiara nello uiplan (`query`, sottoinsieme degli url_params della route dell'elenco): un parametro non dichiarato
// non esce mai, anche se il chiamante lo passa.

import { ANNO_SENZA, ETICHETTE_ANNUALITA, ETICHETTE_ESITO_PAGAMENTO, GRANT_DELLA_PAGINA, PERCORSO_ELENCO_DOMANDE, PERCORSO_ELENCO_PAGAMENTI } from '../../../entities/domanda';
import type { Annualita, DestinazioneElenco, EsitoPagamentoDomanda, EsitoRigaElenco } from '../../../entities/domanda';
import { scriviRipetuti } from '../../../shared/lib';
import { valoreFiltroValido, type Filtri } from './filtri';

/** Criteri del punto cliccato, nei valori dei parametri di TX-0056/TX-0059 (descrizioni della spec dell'elenco). */
export interface CriteriLink {
  presentata?: boolean;
  sigc?: boolean;
  /** Anno di raccolta; null = la barra delle domande senza anno (SENZA). */
  anno?: (number | null)[];
  annualita?: Annualita[];
  pagamento?: EsitoPagamentoDomanda[];
  esito?: EsitoRigaElenco[];
  /** Intervento della riga o del dettaglio: sostituisce il filtro per intervento corrente. */
  intervento?: string;
}

/** Criteri del punto cliccato come valori dei parametri (vuoto = parametro assente). */
function valoriDeiCriteri(c: CriteriLink): Record<string, string[]> {
  return {
    presentata: c.presentata ? ['true'] : [],
    sigc: c.sigc ? ['true'] : [],
    anno: (c.anno ?? []).map((a) => (a === null ? ANNO_SENZA : String(a))),
    annualita: [...(c.annualita ?? [])],
    pagamento: [...(c.pagamento ?? [])],
    esito: [...(c.esito ?? [])],
  };
}

/** Valori dei parametri: filtri correnti (gia' validati da filtriDaRicerca) e criteri del punto cliccato. */
export function parametriLink(filtri: Filtri, criteri: CriteriLink = {}): Record<string, string[]> {
  const p: Record<string, string[]> = {};
  for (const [chiave, valori] of Object.entries(filtri)) if (valori && valori.length > 0) p[chiave] = [...valori];
  if (criteri.intervento !== undefined) {
    // un codice fuori formato non entra nell'indirizzo; il filtro corrente decade comunque (il clic e' su quell'intervento)
    delete p.intervento;
    if (valoreFiltroValido('intervento', criteri.intervento)) p.intervento = [criteri.intervento];
  }
  for (const [chiave, valori] of Object.entries(valoriDeiCriteri(criteri))) if (valori.length > 0) p[chiave] = valori;
  return p;
}

/**
 * Indirizzo del link: destinazione e query string con i soli parametri dichiarati dal link (nell'ordine di `query`),
 * chiave ripetuta per ogni valore, senza doppioni, al piu' MAX_VALORI_PARAMETRO valori per chiave (shared/lib).
 */
export function indirizzoLink(
  destinazione: DestinazioneElenco,
  query: readonly string[],
  parametri: Record<string, string[]>,
): string {
  const s = scriviRipetuti(query, (chiave) => parametri[chiave]);
  return s ? `${destinazione}?${s}` : destinazione;
}

// ---------------------------------------------------------------- i 12 link dello uiplan (verbatim)

interface DefinizioneLink {
  destinazione: DestinazioneElenco;
  query: readonly string[];
}

const FILTRI_CORRENTI = ['intervento', 'os', 'og', 'op', 'azione'] as const;
const DOMANDE: DestinazioneElenco = PERCORSO_ELENCO_DOMANDE;

/** I link dello uiplan del finanziario verso l'elenco operativo: destinazione e `query` copiati da `links[]`. */
export const LINK_ELENCO = {
  'elenco-presentate-panoramica': { destinazione: DOMANDE, query: ['presentata', ...FILTRI_CORRENTI] },
  'elenco-presentate-intervento': { destinazione: DOMANDE, query: ['presentata', ...FILTRI_CORRENTI] },
  'elenco-anno-intervento': { destinazione: DOMANDE, query: ['presentata', 'anno', 'annualita', ...FILTRI_CORRENTI] },
  'elenco-sigc-intervento': { destinazione: DOMANDE, query: ['sigc', 'pagamento', ...FILTRI_CORRENTI] },
  'elenco-presentate-riga': { destinazione: DOMANDE, query: ['presentata', 'intervento'] },
  'elenco-pagamenti-riga': { destinazione: PERCORSO_ELENCO_PAGAMENTI, query: ['esito', 'intervento'] },
  'elenco-presentate-domande': { destinazione: DOMANDE, query: ['presentata', ...FILTRI_CORRENTI] },
  'elenco-prima-annualita': { destinazione: DOMANDE, query: ['presentata', 'annualita', ...FILTRI_CORRENTI] },
  'elenco-anno-annualita': { destinazione: DOMANDE, query: ['presentata', 'anno', 'annualita', ...FILTRI_CORRENTI] },
  'elenco-anno': { destinazione: DOMANDE, query: ['presentata', 'anno', ...FILTRI_CORRENTI] },
  'elenco-sigc': { destinazione: DOMANDE, query: ['sigc', 'pagamento', ...FILTRI_CORRENTI] },
  'elenco-sigc-importi': { destinazione: DOMANDE, query: ['sigc', ...FILTRI_CORRENTI] },
} as const satisfies Record<string, DefinizioneLink>;

export type IdLinkElenco = keyof typeof LINK_ELENCO;

/**
 * Grant VERBATIM della lettura che apre ogni destinazione (authz-catalog: TX-0056 l'elenco delle domande, TX-0059 quello
 * dei pagamenti): il link si mostra solo a chi lo ha, come la voce del menu. Gate di UX: il backend ridecide (403).
 */
export const GRANT_DESTINAZIONE: Readonly<Record<DestinazioneElenco, string>> = GRANT_DELLA_PAGINA;

/** Grant richiesto dal link. */
export function grantDelLink(id: IdLinkElenco): string {
  return GRANT_DESTINAZIONE[LINK_ELENCO[id].destinazione];
}

/**
 * Indirizzo del link `id` con i filtri correnti e i criteri del punto cliccato. Fail-closed: null se un criterio non si
 * puo' esprimere (un intervento fuori formato), mai un link verso un insieme piu' largo di quello che dichiara.
 */
export function indirizzoDelLink(id: IdLinkElenco, filtri: Filtri, criteri: CriteriLink = {}): string | null {
  if (criteri.intervento !== undefined && !valoreFiltroValido('intervento', criteri.intervento)) return null;
  const l: DefinizioneLink = LINK_ELENCO[id];
  return indirizzoLink(l.destinazione, l.query, parametriLink(filtri, criteri));
}

// ---------------------------------------------------------------- clic sui grafici

/**
 * Codici del contratto dei link nei dati dei grafici: i builder (lib/grafici) mettono nel dato del punto il codice
 * dell'annualita' (e l'anno) o della voce SIGC, e il clic si legge da li', mai dall'etichetta visibile della serie ne'
 * dall'ordine delle righe.
 */
const ANNUALITA_VALIDE: ReadonlySet<string> = new Set(Object.keys(ETICHETTE_ANNUALITA));

/** Codice della voce delle presentate fra le voci delle domande SIGC (le altre voci sono gli esiti del pagamento). */
export const VOCE_PRESENTATE = 'PRESENTATE';

/**
 * Esito del pagamento di una voce delle domande SIGC (codici di VOCI_DOMANDE_SIGC): i codici degli esiti dell'entity,
 * piu' le presentate, che non ne hanno. Derivato dal vocabolario: nessun codice riscritto qui (review v4 H-06).
 */
const PAGAMENTO_DELLA_VOCE: ReadonlyMap<string, EsitoPagamentoDomanda | null> = new Map<string, EsitoPagamentoDomanda | null>([
  [VOCE_PRESENTATE, null],
  ...(Object.keys(ETICHETTE_ESITO_PAGAMENTO) as EsitoPagamentoDomanda[]).map((e): [string, EsitoPagamentoDomanda] => [e, e]),
]);

/**
 * Criteri del clic su un segmento di Domande per anno di raccolta: le domande presentate dell'anno e dell'annualita' del
 * dato cliccato. Null (nessun link) per un clic fuori dai dati o su un dato senza codici riconosciuti.
 */
export function criteriDomandePerAnno(clic: { data?: unknown }): CriteriLink | null {
  const d = clic.data;
  if (typeof d !== 'object' || d === null) return null;
  const { codice, anno } = d as { codice?: unknown; anno?: unknown };
  if (typeof codice !== 'string' || !ANNUALITA_VALIDE.has(codice)) return null;
  if (anno !== null && !(typeof anno === 'number' && Number.isInteger(anno))) return null;
  return criteriAnnoAnnualita(anno, codice as Annualita);
}

/**
 * Criteri di una cella di Domande per anno (barra o cella della tabella): le domande presentate dell'anno (null = senza
 * anno, SENZA) e, se data, dell'annualita'; senza annualita' tutto l'anno (la cella del totale).
 */
export function criteriAnnoAnnualita(anno: number | null | undefined, annualita?: Annualita): CriteriLink {
  return { presentata: true, anno: [anno ?? null], ...(annualita ? { annualita: [annualita] } : {}) };
}

/**
 * Criteri di una voce delle domande SIGC (barra o riga della tabella), dal codice della voce: le SIGC, con l'esito del
 * pagamento della voce. Null per un codice sconosciuto (nessun link, mai tutte le domande).
 */
export function criteriVoceSigc(codice: string | undefined): CriteriLink | null {
  if (codice === undefined || !PAGAMENTO_DELLA_VOCE.has(codice)) return null;
  const pagamento = PAGAMENTO_DELLA_VOCE.get(codice);
  return { sigc: true, ...(pagamento ? { pagamento: [pagamento] } : {}) };
}
