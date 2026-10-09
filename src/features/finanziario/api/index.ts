// api/index.ts — confine api/ della feature finanziario (green-fe step3): wrapper React Query sopra il client orval
// sigillato della slice finanziario (TX-0001..TX-0015, tutte letture; gli hook generati portano l'operationId TX-00NN).
// I componenti importano da qui, mai dal generato.
// - Query-key: quelle delle factory generate (dentro gli hook orval). L'unica mutation e' l'esportazione CSV, che non
//   modifica dati: nessuna invalidazione.
// - Errori: nessun onError qui. I componenti li rendono con getErrorMessage (problem-type del backend); il 404
//   NOT_FOUND della riserva e' uno stato vuoto (anno senza movimenti), riconosciuto da rispostaRiservaAssente.
// - Filtri: gli stessi cinque filtri ripetibili (RF001) per tutti i report; il mutator li serializza ripetuti e mette
//   in coda le letture oltre il tetto del backend (2 per utente, configurato dall'app: app/tetti-letture.ts).
// - Retry: nessuna opzione qui (review step9 H-18). La politica (solo rete assente e 503 CAPACITA_ESAURITA, con
//   Retry-After) e' generica e sta nei defaultOptions del QueryClient di produzione (app/query-client.ts).
// - Perimetro: perimetriInCache legge quello delle risposte gia' in cache con le key factory generate (review N-07):
//   chi lo mostra non conosce la forma delle chiavi.
import { hashKey, useMutation } from '@tanstack/react-query';
import type { Query, QueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { classifyProblem } from '../../../shared/api/problem/problem-types';
import {
  getApiFinanziarioRiepilogoCsv,
  getTx0002QueryKey,
  getTx0003QueryKey,
  getTx0004QueryKey,
  getTx0005QueryKey,
  getTx0006QueryKey,
  getTx0007QueryKey,
  getTx0008QueryKey,
  getTx0009QueryKey,
  getTx0010QueryKey,
  getTx0011QueryKey,
  getTx0012QueryKey,
  getTx0013QueryKey,
  getTx0014QueryKey,
  getTx0015QueryKey,
  useTx0001,
  useTx0002,
  useTx0003,
  useTx0004,
  useTx0005,
  useTx0006,
  useTx0007,
  useTx0008,
  useTx0009,
  useTx0010,
  useTx0011,
  useTx0012,
  useTx0013,
  useTx0014,
  useTx0015,
} from '../../../shared/api/generated/finanziario/finanziario/finanziario';
import type {
  AvanzamentoPagamenti,
  AvanzamentoStanziato,
  DistribuzioneDotazione,
  DomandePerAnno,
  DomandeSigc,
  ImportiPerAnno,
  ImportiSigc,
  MonitoraggioRiserva,
  ResiduoSuImpegni,
  ResiduoSuPagamenti,
  RiepilogoFinanziario,
  SpesaPerIntervento,
  TotaleDomande,
  Tx0011Params,
  VerificaSmp,
} from '../../../shared/api/generated/finanziario/aRSCSRBootstrapPostgresAPI.schemas';

export type {
  AvanzamentoPagamenti,
  AvanzamentoStanziato,
  DistribuzioneDotazione,
  DomandePerAnno,
  DomandePerAnnoRiga,
  DomandeSigc,
  FiltriFinanziari,
  Importo,
  ImportiPerAnno,
  ImportiPerAnnoRiga,
  ImportiSigc,
  MonitoraggioRiserva,
  Problema,
  ResiduoSuImpegni,
  ResiduoSuPagamenti,
  RiepilogoFinanziario,
  RiepilogoFinanziarioRiga,
  SpesaPerIntervento,
  SpesaPerInterventoRiga,
  TotaleDomande,
  UtilizzoRiserva,
  VerificaSmp,
  VerificaSmpRiga,
  VoceFiltro,
} from '../../../shared/api/generated/finanziario/aRSCSRBootstrapPostgresAPI.schemas';

/** I cinque filtri ripetibili di RF001 (intervento, os, og, op, azione), uguali per tutti i report. */
export type FiltriReport = Tx0011Params;

/** `abilitato` falso: nessuna lettura (profilo senza csr.tx-0001.read, dove servono solo come descrizioni). */
export const useFiltri = (abilitato = true) => useTx0001({ query: { enabled: abilitato } });

// TX-0011 (RF011)
export const useRiepilogo = (filtri: FiltriReport) => useTx0011(filtri);
/** Esportazione CSV del riepilogo con gli stessi filtri (TX-0011, D-08): mutation che restituisce il Blob da salvare. */
// meta.erroreInLinea: il componente mostra ogni errore dell'esportazione (403 compreso) accanto al pulsante.
export const useEsportaRiepilogoCsv = () =>
  useMutation({
    mutationFn: (filtri: FiltriReport): Promise<Blob> => getApiFinanziarioRiepilogoCsv(filtri),
    meta: { erroreInLinea: true },
  });

// TX-0002, TX-0003 (RF002, RF003)
/** `abilitato` falso: nessuna lettura (es. profilo senza il grant di TX-0002 quando serve solo come segnale). */
export const useSpesaPerIntervento = (filtri: FiltriReport, abilitato = true) =>
  useTx0002(filtri, { query: { enabled: abilitato } });
export const useDistribuzioneDotazione = (filtri: FiltriReport) => useTx0003(filtri);

// TX-0004..TX-0007 (RF004-RF007)
export const useStanziato = (filtri: FiltriReport) => useTx0004(filtri);
export const usePagamentiSuImpegnato = (filtri: FiltriReport) => useTx0005(filtri);
export const useResiduoImpegni = (filtri: FiltriReport) => useTx0006(filtri);
export const useResiduoPagamenti = (filtri: FiltriReport) => useTx0007(filtri);

// TX-0008..TX-0010 (RF008-RF010)
export const useDomandePerAnno = (filtri: FiltriReport) => useTx0008(filtri);
export const useTotaleDomande = (filtri: FiltriReport) => useTx0009(filtri);
export const useImportiPerAnno = (filtri: FiltriReport) => useTx0010(filtri);

// TX-0012, TX-0013 (RF012, RF013)
export const useSigcDomande = (filtri: FiltriReport, abilitato = true) =>
  useTx0012(filtri, { query: { enabled: abilitato } });
export const useSigcImporti = (filtri: FiltriReport) => useTx0013(filtri);

// TX-0014 (RF014): anno obbligatorio nel path; senza anno nessuna richiesta (enabled guard).
export const useRiserva = (anno: number | undefined) =>
  useTx0014(anno ?? 0, { query: { enabled: anno !== undefined } });

/** Vero se l'errore della riserva e' il 404 NOT_FOUND "anno senza movimenti" (problem-type, non il solo status). */
export function rispostaRiservaAssente(errore: unknown): boolean {
  return isAxiosError(errore) && classifyProblem(errore.response?.status ?? 0, errore.response?.data).kind === 'not-found';
}

// TX-0015 (RF015): esercizio obbligatorio; senza esercizio nessuna richiesta (enabled guard).
export const useVerificaSmp = (filtri: FiltriReport, esercizio: number | undefined) =>
  useTx0015({ ...filtri, esercizio: esercizio ?? 0 }, { query: { enabled: esercizio !== undefined } });

// Risposte che dichiarano il perimetro: tutte le letture tranne i filtri (TX-0001).
type RispostaConPerimetro =
  | SpesaPerIntervento
  | DistribuzioneDotazione
  | AvanzamentoStanziato
  | AvanzamentoPagamenti
  | ResiduoSuImpegni
  | ResiduoSuPagamenti
  | DomandePerAnno
  | TotaleDomande
  | ImportiPerAnno
  | RiepilogoFinanziario
  | DomandeSigc
  | ImportiSigc
  | MonitoraggioRiserva
  | VerificaSmp;

// Chiavi generate senza parametri: prefisso delle chiavi di ogni combinazione di filtri della stessa lettura.
const prefissiConPerimetro = () => [
  getTx0002QueryKey(),
  getTx0003QueryKey(),
  getTx0004QueryKey(),
  getTx0005QueryKey(),
  getTx0006QueryKey(),
  getTx0007QueryKey(),
  getTx0008QueryKey(),
  getTx0009QueryKey(),
  getTx0010QueryKey(),
  getTx0011QueryKey(),
  getTx0012QueryKey(),
  getTx0013QueryKey(),
  getTx0015QueryKey(),
];

// TX-0014: l'anno sta nel percorso, quindi la chiave non fa da prefisso. Una query e' della riserva se la factory,
// con l'anno in fondo alla sua chiave, rigenera la stessa chiave.
function eRiserva(q: Query): boolean {
  const percorso = q.queryKey[0];
  if (typeof percorso !== 'string') return false;
  const anno = Number(percorso.slice(percorso.lastIndexOf('/') + 1));
  return Number.isInteger(anno) && q.queryHash === hashKey(getTx0014QueryKey(anno));
}

/** Perimetri dichiarati dalle risposte del finanziario gia' in cache (nessuna lettura): uno per risposta. */
export function perimetriInCache(client: QueryClient): string[] {
  const dati = [
    ...prefissiConPerimetro().flatMap((queryKey) => client.getQueriesData<RispostaConPerimetro>({ queryKey })),
    ...client.getQueriesData<RispostaConPerimetro>({ predicate: eRiserva }),
  ];
  return dati.flatMap(([, risposta]) => (risposta?.perimetro ? [risposta.perimetro] : []));
}
