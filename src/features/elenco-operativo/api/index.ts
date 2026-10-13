// api/index.ts — confine api/ della feature elenco-operativo (green-fe step3): wrapper React Query sopra il client
// orval sigillato della slice elenco-operativo (TX-0056..TX-0060, tutte letture; gli hook generati portano
// l'operationId TX-00NN). I componenti importano da qui, mai dal generato.
// - Query-key: quelle delle factory generate (dentro gli hook orval). Nessuna mutation: le esportazioni (CSV e XLSX
//   delle domande e dei pagamenti, dal backend) sono funzioni che restituiscono il file; l'esito lo mostra chi le chiama.
// - Errori: nessun onError qui. I componenti li rendono con getErrorMessage (problem-type del backend); il 404
//   NOT_FOUND della scheda (domanda inesistente, chiusa o fuori perimetro: stesso corpo, D-06) e' riconosciuto da
//   rispostaDomandaAssente.
// - Criteri: tutti i parametri sono ripetibili e testuali nel contratto (D-02); il mutator li serializza ripetuti e
//   mette in coda le letture oltre il tetto del backend, come per il finanziario.
// - Movimento (ADR 0029): elenco, sinottico e pagamenti tengono la risposta precedente mentre arriva quella dei
//   criteri nuovi (placeholderData), cosi' i numeri si aggiornano senza svuotare la pagina.
import { keepPreviousData } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { classifyProblem } from '../../../shared/api/problem/problem-types';
import {
  getApiElencoOperativoDomandeFormato,
  getApiElencoOperativoPagamentiFormato,
  useTx0056,
  useTx0057,
  useTx0058,
  useTx0059,
  useTx0060,
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
// grant dei filtri, dove servono solo come descrizioni dei chip).
export const useValoriFiltri = (abilitato = true) => useTx0060({ query: { enabled: abilitato } });

// TX-0056 (RA002): una pagina dell'elenco delle domande.
export const useDomande = (criteri: CriteriDomande) =>
  useTx0056(criteri, { query: { placeholderData: keepPreviousData } });

// TX-0057 (RA006): sinottico dell'intero insieme filtrato (mai una somma della pagina, D-05).
export const useSinottico = (criteri: CriteriSinottico, { abilitato = true }: { abilitato?: boolean } = {}) =>
  useTx0057(criteri, { query: { placeholderData: keepPreviousData, enabled: abilitato } });

// TX-0058 (RA004): scheda della domanda; tipo e codice a barre obbligatori nel percorso (enabled guard).
export const useDettaglioDomanda = (tipo: string | undefined, codiceABarre: string | undefined) =>
  useTx0058(tipo ?? '', codiceABarre ?? '', { query: { enabled: Boolean(tipo) && Boolean(codiceABarre) } });

// TX-0059 (RA002, D-1 di MIN-20261012): una pagina dell'elenco dei pagamenti con i totali dell'insieme filtrato.
export const usePagamenti = (criteri: CriteriPagamenti) =>
  useTx0059(criteri, { query: { placeholderData: keepPreviousData } });

/** Vero se l'errore della scheda e' il 404 NOT_FOUND (problem-type, non il solo status): stesso esito per domanda
 *  inesistente, chiusa o fuori perimetro (D-06). */
export function rispostaDomandaAssente(errore: unknown): boolean {
  return isAxiosError(errore) && classifyProblem(errore.response?.status ?? 0, errore.response?.data).kind === 'not-found';
}

// Esportazioni (D-09): il file CSV o XLSX lo scrive il backend, con gli stessi criteri e lo stesso ordinamento della
// consultazione (senza pagina e dimensione), l'intestazione e la registrazione in AUDIT_ESPORTAZIONE; oltre il limite di
// NFR-06 risponde 400 (2.173 righe di domande, 2.777 di pagamenti). Funzioni e non mutation, come nel finanziario.
export type FormatoEsportazione = 'csv' | 'xlsx';
type SenzaPagina<T> = Omit<T, 'pagina' | 'dimensione'>;
export const esportaDomande = (formato: FormatoEsportazione, criteri: SenzaPagina<CriteriDomande>): Promise<Blob> =>
  getApiElencoOperativoDomandeFormato(formato, criteri);
export const esportaPagamenti = (formato: FormatoEsportazione, criteri: SenzaPagina<CriteriPagamenti>): Promise<Blob> =>
  getApiElencoOperativoPagamentiFormato(formato, criteri);
