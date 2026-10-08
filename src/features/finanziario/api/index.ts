// api/index.ts — confine api/ della feature finanziario (green-fe step3): wrapper React Query sopra il client orval
// sigillato della slice finanziario (TX-0001..TX-0015, tutte letture; gli hook generati portano l'operationId TX-00NN).
// I componenti importano da qui, mai dal generato.
// - Query-key: quelle delle factory generate (dentro gli hook orval). L'unica mutation e' l'esportazione CSV, che non
//   modifica dati: nessuna invalidazione.
// - Errori: nessun onError qui. I componenti li rendono con getErrorMessage (problem-type del backend); il 404
//   NOT_FOUND della riserva e' uno stato vuoto (anno senza movimenti), riconosciuto da rispostaRiservaAssente.
// - Filtri: gli stessi cinque filtri ripetibili (RF001) per tutti i report; il mutator li serializza ripetuti e mette
//   in coda le letture oltre il tetto del backend (2 per utente).
import { useMutation } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { classifyProblem } from '../../../shared/api/problem/problem-types';
import {
  getApiFinanziarioRiepilogoCsv,
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
import type { Tx0011Params } from '../../../shared/api/generated/finanziario/aRSCSRBootstrapPostgresAPI.schemas';

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

// Si riprova solo cio' che e' transitorio: rete assente e 503 CAPACITA_ESAURITA ("da riprovare", con Retry-After).
// Un 4xx (filtri non validi, accesso negato, riserva assente) o il 503 TEMPO_SCADUTO (la stessa lettura tornerebbe a
// scadere: il messaggio invita a restringere i filtri) non cambiano riprovando.
export function soloTransitori(tentativi: number, errore: unknown): boolean {
  if (tentativi >= 3 || !isAxiosError(errore)) return false;
  const status = errore.response?.status;
  if (status === undefined) return true;
  const { kind } = classifyProblem(status, errore.response?.data);
  return kind === 'capacity-exhausted' || (status === 503 && kind === 'unknown');
}

// Attesa prima del nuovo tentativo: i secondi di Retry-After se il backend li indica, altrimenti 1, 2, 4 s (max 8).
export function attesaPrimaDiRiprovare(tentativi: number, errore: unknown): number {
  const secondi = isAxiosError(errore) ? Number(errore.response?.headers?.['retry-after']) : Number.NaN;
  if (Number.isFinite(secondi) && secondi > 0) return secondi * 1000;
  return Math.min(1000 * 2 ** tentativi, 8000);
}

const opzioni = { query: { retry: soloTransitori, retryDelay: attesaPrimaDiRiprovare } };

/** `abilitato` falso: nessuna lettura (profilo senza csr.tx-0001.read, dove servono solo come descrizioni). */
export const useFiltri = (abilitato = true) => useTx0001({ query: { ...opzioni.query, enabled: abilitato } });

// TX-0011 (RF011)
export const useRiepilogo = (filtri: FiltriReport) => useTx0011(filtri, opzioni);
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
  useTx0002(filtri, { query: { ...opzioni.query, enabled: abilitato } });
export const useDistribuzioneDotazione = (filtri: FiltriReport) =>
  useTx0003(filtri, opzioni);

// TX-0004..TX-0007 (RF004-RF007)
export const useStanziato = (filtri: FiltriReport) => useTx0004(filtri, opzioni);
export const usePagamentiSuImpegnato = (filtri: FiltriReport) =>
  useTx0005(filtri, opzioni);
export const useResiduoImpegni = (filtri: FiltriReport) => useTx0006(filtri, opzioni);
export const useResiduoPagamenti = (filtri: FiltriReport) => useTx0007(filtri, opzioni);

// TX-0008..TX-0010 (RF008-RF010)
export const useDomandePerAnno = (filtri: FiltriReport) => useTx0008(filtri, opzioni);
export const useTotaleDomande = (filtri: FiltriReport) => useTx0009(filtri, opzioni);
export const useImportiPerAnno = (filtri: FiltriReport) => useTx0010(filtri, opzioni);

// TX-0012, TX-0013 (RF012, RF013)
export const useSigcDomande = (filtri: FiltriReport, abilitato = true) =>
  useTx0012(filtri, { query: { ...opzioni.query, enabled: abilitato } });
export const useSigcImporti = (filtri: FiltriReport) => useTx0013(filtri, opzioni);

// TX-0014 (RF014): anno obbligatorio nel path; senza anno nessuna richiesta (enabled guard).
export const useRiserva = (anno: number | undefined) =>
  useTx0014(anno ?? 0, { query: { retry: soloTransitori, retryDelay: attesaPrimaDiRiprovare, enabled: anno !== undefined } });

/** Vero se l'errore della riserva e' il 404 NOT_FOUND "anno senza movimenti" (problem-type, non il solo status). */
export function rispostaRiservaAssente(errore: unknown): boolean {
  return isAxiosError(errore) && classifyProblem(errore.response?.status ?? 0, errore.response?.data).kind === 'not-found';
}

// TX-0015 (RF015): esercizio obbligatorio; senza esercizio nessuna richiesta (enabled guard).
export const useVerificaSmp = (filtri: FiltriReport, esercizio: number | undefined) =>
  useTx0015(
    { ...filtri, esercizio: esercizio ?? 0 },
    { query: { retry: soloTransitori, retryDelay: attesaPrimaDiRiprovare, enabled: esercizio !== undefined } },
  );
