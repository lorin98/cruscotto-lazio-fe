// letture.ts — le letture del procedurale nei test (MSW): TX-0024..TX-0032 (TX-0030 e' del fisico dal 29/10/2026) e
// TX-0020 (determine di una domanda, dal fisico: le risposte degli scenari per codice, 404 per gli altri, 400 per un codice
// senza cifre) rispondono come il backend ai parametri della query (le funzioni della fixture calcolano i report dalle domande degli scenari coi filtri intervento, os, og, op e
// stato), mai lo stesso corpo per ogni query (lezione della review del fisico), e registrano cosa e' stato chiesto; le
// esportazioni rispondono con un file e registrano percorso, query e X-Requested-With. Ogni test monta solo cio' che gli
// serve (il server dei test non monta i mock generati del procedurale).
import { http, HttpResponse } from 'msw';
import type { RequestHandler } from 'msw';
import { PROBLEM_TYPES } from '../../../shared/api/problem/problem-types';
import type { FiltriProcedurali, StatiAreaProgrammazione } from '../api';
import { DETERMINE, DETERMINE_CHIUSA, DETERMINE_NESSUNA, STATI_AREA, VALORI, ammessePer, riepilogoPer, sottofasiPagamentoPer, sottofasiSostegnoPer, statiPer } from './fixture';
import type { Varianti } from './fixture';

export interface Lette {
  filtri: number;
  statiArea: number;
  ammesse: string[];
  sostegno: string[];
  pagamento: string[];
  riepilogo: string[];
  sottofasiSostegno: string[];
  sottofasiPagamento: string[];
  /** I codici delle determine chieste (TX-0020). */
  determine: string[];
  file: string[];
}

export interface Basi {
  /** I valori di TX-0024; null = TX-0024 in errore (503 CAPACITA_ESAURITA). */
  valori?: FiltriProcedurali | null;
  /** I valori di TX-0025; null = TX-0025 in errore. */
  statiArea?: StatiAreaProgrammazione | null;
  /** Le varianti dei report per domanda (non rilasciate, atto di concessione). */
  varianti?: Varianti;
}

/** 503 CAPACITA_ESAURITA, il corpo del backend. */
export const indisponibile = () => HttpResponse.json({ type: 'urn:cruscottocsr:problem:capacita-esaurita', title: 'Errore', status: 503, errorCode: 'CAPACITA_ESAURITA' }, { status: 503 });

const ESPORTAZIONI = ['domande-ammesse', 'stati-sostegno', 'stati-pagamento', 'riepilogo', 'sottofasi-sostegno', 'sottofasi-pagamento'];

/** Le determine degli scenari per codice a barre (SC-PC_DETERMINA, SC-PC_DETERMINA_NESSUNA). */
const DETERMINE_PER_CODICE: Record<string, object> = Object.fromEntries([DETERMINE, DETERMINE_NESSUNA, DETERMINE_CHIUSA].map((d) => [d.codiceABarre, d]));
const problemaDi = (status: number, type: string, errorCode: string) => HttpResponse.json({ type, title: 'Errore', status, errorCode }, { status });

/** Gli handler delle letture e dei file del procedurale, con le basi date (di norma quelle della fixture). */
export function lettureProcedurale({ valori = VALORI, statiArea = STATI_AREA, varianti = {} }: Basi = {}): { handlers: RequestHandler[]; lette: Lette } {
  const lette: Lette = { filtri: 0, statiArea: 0, ammesse: [], sostegno: [], pagamento: [], riepilogo: [], sottofasiSostegno: [], sottofasiPagamento: [], determine: [], file: [] };
  const file = ({ request }: { request: Request }) => {
    const u = new URL(request.url);
    lette.file.push(`${u.pathname}${u.search} ${request.headers.get('X-Requested-With') ?? ''}`);
    return new HttpResponse('a;b', { headers: { 'Content-Type': 'text/csv' } });
  };
  const report = (percorso: string, registro: string[], corpo: (p: URLSearchParams) => object) =>
    http.get(`*/api/procedurale/${percorso}`, ({ request }) => {
      const u = new URL(request.url);
      registro.push(u.search);
      return HttpResponse.json(corpo(u.searchParams));
    });
  const handlers = [
    http.get('*/api/procedurale/filtri/stati-area-programmazione', () => {
      lette.statiArea += 1;
      return statiArea ? HttpResponse.json(statiArea) : indisponibile();
    }),
    http.get('*/api/procedurale/filtri', () => {
      lette.filtri += 1;
      return valori ? HttpResponse.json(valori) : indisponibile();
    }),
    ...ESPORTAZIONI.map((p) => http.get(`*/api/procedurale/${p}/:formato`, file)),
    report('domande-ammesse', lette.ammesse, (p) => ammessePer(p, varianti)),
    report('stati-sostegno', lette.sostegno, (p) => statiPer('SOSTEGNO', p, varianti)),
    report('stati-pagamento', lette.pagamento, (p) => statiPer('PAGAMENTO', p, varianti)),
    report('riepilogo', lette.riepilogo, (p) => riepilogoPer(p, varianti)),
    report('sottofasi-sostegno', lette.sottofasiSostegno, () => sottofasiSostegnoPer()),
    report('sottofasi-pagamento', lette.sottofasiPagamento, (p) => sottofasiPagamentoPer(p)),
    http.get('*/api/procedurale/domande/:codice/determina', ({ params }) => {
      const codice = String(params.codice);
      lette.determine.push(codice);
      if (!/^\d{1,30}$/.test(codice)) return problemaDi(400, PROBLEM_TYPES.DATO_NON_VALIDO, 'DATO_NON_VALIDO');
      const d = DETERMINE_PER_CODICE[codice];
      return d ? HttpResponse.json(d) : problemaDi(404, PROBLEM_TYPES.NON_TROVATO, 'NOT_FOUND');
    }),
  ];
  return { handlers, lette };
}
