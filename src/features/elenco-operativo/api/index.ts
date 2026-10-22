// api/index.ts — confine api/ della feature elenco-operativo (green-fe step3): wrapper React Query sopra il client
// orval sigillato della slice elenco-operativo (TX-0056..TX-0060, tutte letture; gli hook generati portano
// l'operationId TX-00NN). I componenti importano da qui, mai dal generato.
// - Query-key: quelle delle factory generate (dentro gli hook orval). Nessuna mutation: le esportazioni (CSV e XLSX
//   delle domande e dei pagamenti, dal backend) sono funzioni che restituiscono il file; l'esito lo mostra chi le chiama.
// - Errori: nessun onError qui. I componenti li rendono con getErrorMessage (problem-type del backend); il 404
//   NOT_FOUND della scheda (domanda inesistente, chiusa o fuori perimetro: stesso corpo, D-06) e' riconosciuto da
//   rispostaDomandaAssente.
// - Criteri: tutti i parametri sono ripetibili e testuali nel contratto (D-02); il mutator li serializza ripetuti e
//   mette in coda le letture oltre il tetto del backend, nella STESSA coda del finanziario (app/tetti-letture: il tetto
//   per utente del backend e' unico per le due aree, review v1 V-04).
// - Movimento (ADR 0029): elenco, sinottico e pagamenti tengono la risposta precedente mentre arriva quella dei
//   criteri nuovi (placeholderData), cosi' i numeri si aggiornano senza svuotare la pagina.
import { keepPreviousData } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { classifyProblem } from '../../../shared/api/problem/problem-types';
import { riferimentoValido } from '../lib/collegamenti';
import {
  getApiElencoOperativoDomandeFormato,
  getApiElencoOperativoPagamentiFormato,
  useTx0056,
  useTx0057,
  useTx0058,
  useTx0059,
} from '../../../shared/api/generated/elenco-operativo/elenco-operativo/elenco-operativo';
import type {
  Tx0056Params,
  Tx0057Params,
  Tx0059Params,
} from '../../../shared/api/generated/elenco-operativo/aRSCSRBootstrapPostgresAPI.schemas';

export type {
  AnomaliaDellaDomanda,
  DeterminaDellaDomandaElenco,
  DettaglioDomanda,
  DomandaCollegata,
  DomandaElenco,
  Importo,
  PagamentoElenco,
  PaginaDomande,
  PaginaPagamenti,
  Problema,
  RecuperoDellaDomanda,
  ResponsabileProcedimento,
  SinotticoElenco,
  SommaElenco,
  StatoSianElenco,
  SuperficieElenco,
  TotaliPagamenti,
  UltimoDatoSincronizzato,
  ValoriFiltriElenco,
  VoceFiltro,
  VoceRipartizione,
} from '../../../shared/api/generated/elenco-operativo/aRSCSRBootstrapPostgresAPI.schemas';

/** Criteri dell'elenco delle domande (TX-0056): filtri dell'interrogazione libera, pagina, dimensione e ordina. */
export type CriteriDomande = Tx0056Params;
/** Criteri del sinottico (TX-0057): gli stessi filtri dell'elenco, senza pagina, dimensione e ordina. */
export type CriteriSinottico = Tx0057Params;
/** Criteri dell'elenco dei pagamenti (TX-0059): i filtri delle domande piu' decreto ed esito. */
export type CriteriPagamenti = Tx0059Params;

// TX-0060 (RA006): valori dei filtri nel perimetro del chiamante. `abilitato` falso: nessuna lettura (profilo senza il
// grant dei filtri, dove servono solo come descrizioni dei chip). La lettura e' comune con il fisico (decisione G2):
// sta in entities/filtri, con la stessa query-key e la stessa cache; qui resta riesportata per i componenti dell'elenco.
export { useValoriFiltri } from '../../../entities/filtri';

// TX-0056 (RA002): una pagina dell'elenco delle domande; `abilitato` falso (profilo senza il grant): nessuna lettura.
export const useDomande = (criteri: CriteriDomande, { abilitato = true }: { abilitato?: boolean } = {}) =>
  useTx0056(criteri, { query: { placeholderData: keepPreviousData, enabled: abilitato } });

// TX-0057 (RA006): sinottico dell'intero insieme filtrato (mai una somma della pagina, D-05).
export const useSinottico = (criteri: CriteriSinottico, { abilitato = true }: { abilitato?: boolean } = {}) =>
  useTx0057(criteri, { query: { placeholderData: keepPreviousData, enabled: abilitato } });

// TX-0058 (RA004): scheda della domanda. Tipo e codice a barre arrivano dal percorso della pagina: si legge SOLO con un
// riferimento valido (lib/collegamenti), e i segmenti entrano nell'URL codificati, cosi' un indirizzo costruito ad arte
// ('..%2F..%2F') non puo' mandare la richiesta verso un altro endpoint dell'API (review v1 A-01).
export const useDettaglioDomanda = (tipo: string | undefined, codiceABarre: string | undefined) => {
  const valido = riferimentoValido(tipo, codiceABarre);
  return useTx0058(valido ? encodeURIComponent(tipo ?? '') : '', valido ? encodeURIComponent(codiceABarre ?? '') : '', { query: { enabled: valido } });
};

// TX-0059 (RA002, D-1 di MIN-20261012): una pagina dell'elenco dei pagamenti con i totali dell'insieme filtrato.
export const usePagamenti = (criteri: CriteriPagamenti, { abilitato = true }: { abilitato?: boolean } = {}) =>
  useTx0059(criteri, { query: { placeholderData: keepPreviousData, enabled: abilitato } });

/** Vero se l'errore della scheda e' il 404 NOT_FOUND (problem-type, non il solo status): stesso esito per domanda
 *  inesistente, chiusa o fuori perimetro (D-06). */
export function rispostaDomandaAssente(errore: unknown): boolean {
  return isAxiosError(errore) && classifyProblem(errore.response?.status ?? 0, errore.response?.data).kind === 'not-found';
}

/** Vero se la risposta e' un 400 (per un'esportazione con l'insieme oltre il limite di NFR-06: D-09 del backend). */
export function rispostaRichiestaNonValida(errore: unknown): boolean {
  return isAxiosError(errore) && errore.response?.status === 400;
}

/** Vero se l'errore della scheda e' il 400 DATO_NON_VALIDO sul tipo o sul codice a barre: la pagina lo dice come un
 *  riferimento non valido, con il ritorno all'elenco (stato 400 del wireframe approvato). */
export function rispostaRiferimentoNonValido(errore: unknown): boolean {
  return isAxiosError(errore) && classifyProblem(errore.response?.status ?? 0, errore.response?.data).kind === 'invalid-data';
}

// Esportazioni (D-09): il file CSV o XLSX lo scrive il backend, con gli stessi criteri e lo stesso ordinamento della
// consultazione (senza pagina e dimensione), l'intestazione e la registrazione in AUDIT_ESPORTAZIONE; oltre il limite di
// NFR-06 risponde 400 (2.173 righe di domande, 2.777 di pagamenti). Funzioni e non mutation, come nel finanziario.
export type FormatoEsportazione = 'csv' | 'xlsx';
/** Righe al piu' di un file (NFR-06, 50.000 celle sulle colonne del file: D-09 Rev. 1 del backend, dichiarato nel contratto). */
export const LIMITE_ESPORTAZIONE = { domande: 2173, pagamenti: 2777 } as const;
type SenzaPagina<T> = Omit<T, 'pagina' | 'dimensione'>;
export const esportaDomande = (formato: FormatoEsportazione, criteri: SenzaPagina<CriteriDomande>): Promise<Blob> =>
  getApiElencoOperativoDomandeFormato(formato, criteri);
export const esportaPagamenti = (formato: FormatoEsportazione, criteri: SenzaPagina<CriteriPagamenti>): Promise<Blob> =>
  getApiElencoOperativoPagamentiFormato(formato, criteri);
