// dettaglio.ts — lo stato di una pagina di dettaglio che compone piu' letture dei report filtrate sull'oggetto della route
// (il dettaglio dell'intervento dell'istituzionale e del procedurale) (PURO). Prima nel lib dell'istituzionale (review
// H1/X1 della sua v1): il dettaglio del procedurale ne ha bisogno uguale. La riga dell'intervento in una risposta, che
// conosce il campo codiceIntervento, sta in entities/filtri (review H2 del procedurale).

/** Quanto serve di una lettura per lo stato del dettaglio: la risposta (righe; assenti = nessuna) se c'e', e se e' in errore. */
export interface LetturaDettaglio {
  data?: { righe?: readonly unknown[] } | undefined;
  isError: boolean;
  /**
   * false: la lettura conta solo come risposta, non decide il vuoto della pagina (la sua parte dice da se' di non avere
   * la riga, es. la scheda SIGC dell'istituzionale, di un esercizio). Assente = decide (review del riallineamento IST-07).
   */
  decideIlVuoto?: false;
}

/** Una lettura col suo errore e il modo di riprovarla (l'avviso della pagina lo dice). */
export interface LetturaConErrore {
  data?: unknown;
  isError: boolean;
  error: unknown;
  refetch: () => unknown;
}

/** La lettura fatta (null = senza il grant) e' in errore senza dati: non ha risposto, mai uno zero al suo posto. */
export function senzaRisposta(l: Pick<LetturaConErrore, 'data' | 'isError'> | null | undefined): boolean {
  return l != null && l.isError && l.data === undefined;
}

/** Tutte le letture fatte hanno risposto, coi dati o con l'errore (nessuna lettura abilitata: no). */
export function tutteRisposte(letture: readonly LetturaDettaglio[]): boolean {
  return letture.length > 0 && letture.every((l) => l.data !== undefined || l.isError);
}

export type StatoDettaglio = 'caricamento' | 'errore' | 'vuoto' | 'dati';

/**
 * Lo stato del dettaglio dalle letture fatte (quelle col grant):
 * - 'caricamento' finche' nessuna e' abilitata (il profilo e' in caricamento: la route chiede almeno uno dei grant); alla
 *   prima apertura finche' non hanno risposto tutte (`giaRisposte` falso: KPI e schede arrivano insieme); poi solo se
 *   nessuna lettura ha dati e una e' in corso (es. Riprova dopo l'errore di tutte). Una lettura che riparte accanto a
 *   una coi dati (Riprova, un altro anno o un altro filtro dopo un errore) mostra lo scheletro nella sua parte: KPI,
 *   schede e scheda attiva restano (review H1/X1 dell'istituzionale);
 * - 'errore' se nessuna ha risposto coi dati (l'avviso della pagina lo dice);
 * - 'vuoto' se tutte hanno risposto senza la riga dell'intervento (es. AT001, che i report escludono); una lettura con
 *   `decideIlVuoto` falso non e' mai vuota per la pagina;
 * - altrimenti 'dati' (anche con una sola lettura riuscita: l'altra parte dice il suo errore o il suo caricamento).
 */
export function statoDelDettaglio(letture: readonly LetturaDettaglio[], giaRisposte: boolean): StatoDettaglio {
  if (letture.length === 0 || !(giaRisposte || tutteRisposte(letture))) return 'caricamento';
  const conDati = letture.filter((l) => l.data !== undefined);
  if (conDati.length === 0) return letture.every((l) => l.isError) ? 'errore' : 'caricamento';
  const vuota = (l: LetturaDettaglio) => l.decideIlVuoto !== false && (l.data?.righe ?? []).length === 0;
  return conDati.length === letture.length && conDati.every(vuota) ? 'vuoto' : 'dati';
}
