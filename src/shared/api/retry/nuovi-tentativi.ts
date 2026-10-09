// nuovi-tentativi.ts — politica di retry delle letture, comune a tutte le aree (review step9 H-18): dipende solo dal
// problem-type del backend e dall'header Retry-After, non da una feature. La monta il QueryClient di produzione nei
// defaultOptions (app/query-client.ts); i wrapper delle feature non la ripetono, cosi' un client di test senza retry
// vale anche per loro.
import { isAxiosError } from 'axios';
import { classifyProblem } from '../problem/problem-types';

/** Tentativi oltre il primo, al massimo. */
export const MASSIMO_NUOVI_TENTATIVI = 3;

// Si riprova solo cio' che e' transitorio: rete assente e 503 CAPACITA_ESAURITA ("da riprovare", con Retry-After).
// Un 4xx (filtri non validi, accesso negato, riserva assente) o il 503 TEMPO_SCADUTO (la stessa lettura tornerebbe a
// scadere: il messaggio invita a restringere i filtri) non cambiano riprovando.
export function soloTransitori(tentativi: number, errore: unknown): boolean {
  if (tentativi >= MASSIMO_NUOVI_TENTATIVI || !isAxiosError(errore)) return false;
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
