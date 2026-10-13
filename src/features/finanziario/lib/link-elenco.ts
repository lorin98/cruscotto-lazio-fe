// link-elenco.ts — funzioni PURE della feature finanziario (zero React): indirizzi del drill-down verso l'elenco operativo
// (uiplan links[] con target_feature elenco-operativo, ADR 0028 §7; D-2 di MIN-20261012).
// Ogni link porta i filtri correnti del finanziario piu' i criteri del punto cliccato, limitati ai parametri che il link
// dichiara nello uiplan (`query`, sottoinsieme degli url_params della route dell'elenco): un parametro non dichiarato
// non esce mai, anche se il chiamante lo passa.

import { MAX_VALORI_FILTRO, valoreFiltroValido, type Filtri } from './filtri';

export type DestinazioneElenco = '/elenco-operativo/domande' | '/elenco-operativo/pagamenti';
export type Annualita = 'PRIMA' | 'ALTRE' | 'NON_CLASSIFICATE';
export type EsitoPagamentoDomanda = 'PAGATA' | 'DA_PAGARE' | 'SENZA_IMPORTI';
export type EsitoRigaElenco = 'PAGATA' | 'ESCLUSA';

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
    anno: (c.anno ?? []).map((a) => (a === null ? 'SENZA' : String(a))),
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
 * chiave ripetuta per ogni valore, senza doppioni, al piu' MAX_VALORI_FILTRO valori per chiave.
 */
export function indirizzoLink(
  destinazione: DestinazioneElenco,
  query: readonly string[],
  parametri: Record<string, string[]>,
): string {
  const ricerca = new URLSearchParams();
  for (const chiave of new Set(query)) {
    const valori = Array.from(new Set(parametri[chiave] ?? [])).slice(0, MAX_VALORI_FILTRO);
    for (const v of valori) ricerca.append(chiave, v);
  }
  const s = ricerca.toString();
  return s ? `${destinazione}?${s}` : destinazione;
}
