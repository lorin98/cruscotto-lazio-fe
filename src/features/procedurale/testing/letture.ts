// letture.ts — le letture del procedurale nei test (MSW): TX-0024..TX-0032 rispondono come il backend ai parametri della
// query (le funzioni della fixture calcolano i report dalle domande degli scenari coi filtri intervento, os, og, op e
// stato), mai lo stesso corpo per ogni query (lezione della review del fisico), e registrano cosa e' stato chiesto; le
// esportazioni rispondono con un file e registrano percorso, query e X-Requested-With. Ogni test monta solo cio' che gli
// serve (il server dei test non monta i mock generati del procedurale).
import { http, HttpResponse } from 'msw';
import type { RequestHandler } from 'msw';
import type { FiltriProcedurali, StatiAreaProgrammazione } from '../api';
import { STATI_AREA, VALORI, ammessePer, riepilogoPer, sottofasiPagamentoPer, sottofasiSostegnoPer, statiPer, unitAmountPer } from './fixture';
import type { Varianti } from './fixture';

export interface Lette {
  filtri: number;
  statiArea: number;
  ammesse: string[];
  sostegno: string[];
  pagamento: string[];
  riepilogo: string[];
  unitAmount: string[];
  sottofasiSostegno: string[];
  sottofasiPagamento: string[];
  file: string[];
}

export interface Basi {
  /** I valori di TX-0024; null = TX-0024 in errore (503 CAPACITA_ESAURITA). */
  valori?: FiltriProcedurali | null;
  /** I valori di TX-0025; null = TX-0025 in errore. */
  statiArea?: StatiAreaProgrammazione | null;
  /** Le varianti dei report per domanda (non rilasciate, atto di concessione). */
  varianti?: Varianti;
  /** Il pagato delle Unit Amount con la fonte attiva (di norma no: il caso reale). */
  pagato?: boolean;
}

/** 503 CAPACITA_ESAURITA, il corpo del backend. */
export const indisponibile = () => HttpResponse.json({ type: 'urn:cruscottocsr:problem:capacita-esaurita', title: 'Errore', status: 503, errorCode: 'CAPACITA_ESAURITA' }, { status: 503 });

const ESPORTAZIONI = ['domande-ammesse', 'stati-sostegno', 'stati-pagamento', 'riepilogo', 'unit-amount', 'sottofasi-sostegno', 'sottofasi-pagamento'];

/** Gli handler delle letture e dei file del procedurale, con le basi date (di norma quelle della fixture). */
export function lettureProcedurale({ valori = VALORI, statiArea = STATI_AREA, varianti = {}, pagato = false }: Basi = {}): { handlers: RequestHandler[]; lette: Lette } {
  const lette: Lette = { filtri: 0, statiArea: 0, ammesse: [], sostegno: [], pagamento: [], riepilogo: [], unitAmount: [], sottofasiSostegno: [], sottofasiPagamento: [], file: [] };
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
    report('unit-amount', lette.unitAmount, (p) => unitAmountPer(p, { pagato })),
    report('sottofasi-sostegno', lette.sottofasiSostegno, () => sottofasiSostegnoPer()),
    report('sottofasi-pagamento', lette.sottofasiPagamento, (p) => sottofasiPagamentoPer(p)),
  ];
  return { handlers, lette };
}
