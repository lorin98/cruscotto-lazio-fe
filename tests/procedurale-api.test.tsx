import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { server } from '../src/shared/api/mock/server';
import { problema } from '../src/shared/testing/msw';
import { eProblema } from '../src/shared/api/problem/e-problema';
import { OLTRE_IL_LIMITE_DELL_ESPORTAZIONE, messaggioOltreIlLimite } from '../src/shared/ui';
import {
  esportaReport,
  rispostaDatoNonValido,
  rispostaDomandaAssente,
  useDetermine,
  useDomandeAmmesse,
  useRiepilogo,
  useSottofasiPagamento,
  useSottofasiSostegno,
  useStatiAreaProgrammazione,
  useStatiPagamento,
  useStatiSostegno,
  useValoriFiltri,
} from '../src/features/procedurale/api';
import type { ReportProcedurale } from '../src/features/procedurale/api';
import { handlersEsempio } from '../src/features/procedurale/api/mock/esempio';
import { PROBLEM_TYPES } from '../src/shared/api/problem/problem-types';

function wrapper(client = new QueryClient({ defaultOptions: { queries: { retry: false } } })) {
  return ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

/** Un handler che registra la query di ogni richiesta del percorso e risponde col corpo dato. */
function registra(percorso: string, corpo: object) {
  const query: string[] = [];
  server.use(
    http.get(`*/api/procedurale/${percorso}`, ({ request }) => {
      query.push(new URL(request.url).search);
      return HttpResponse.json(corpo);
    }),
  );
  return query;
}

const CRITERI = { intervento: ['SRD01', 'SRA01'], os: ['OS4'], og: ['OG2'], op: ['OP1'], stato: ['AMMESSA', 'SENZA_STATO'] };
const QUERY = '?intervento=SRD01&intervento=SRA01&os=OS4&og=OG2&op=OP1&stato=AMMESSA&stato=SENZA_STATO';

describe('feature procedurale, wrapper api (step3) su MSW', () => {
  it.each([
    ['domande-ammesse', 'TX-0026', useDomandeAmmesse],
    ['stati-sostegno', 'TX-0027', useStatiSostegno],
    ['stati-pagamento', 'TX-0028', useStatiPagamento],
    ['riepilogo', 'TX-0029', useRiepilogo],
    ['sottofasi-sostegno', 'TX-0031', useSottofasiSostegno],
    ['sottofasi-pagamento', 'TX-0032', useSottofasiPagamento],
  ] as const)('%s (%s) manda i cinque filtri ripetuti, stato compreso, mai azione', async (percorso, _tx, hook) => {
    const query = registra(percorso, { perimetro: 'REGIONALE' });
    const { result } = renderHook(() => hook(CRITERI), { wrapper: wrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(query).toEqual([QUERY]);
  });

  // le determine di una domanda (TX-0020) sono del procedurale dal 29/10/2026, gli stessi casi del fisico; le Unit Amount
  // (TX-0030) sono del fisico
  it('useDetermine senza codice non chiama il backend; con il codice lo mette nel percorso codificato (TX-0020)', async () => {
    const senza = renderHook(() => useDetermine(null), { wrapper: wrapper() });
    expect(senza.result.current.fetchStatus).toBe('idle');
    const percorsi: string[] = [];
    server.use(
      http.get('*/api/procedurale/domande/:codice/determina', ({ request }) => {
        percorsi.push(new URL(request.url).pathname);
        return HttpResponse.json({ codiceABarre: '54810769585', tipoDomanda: 'PAGAMENTO', domandaChiusa: false, perimetro: 'REGIONALE', corrente: { valore: null, motivo: 'NON_VALORIZZATO' }, elenco: [] });
      }),
    );
    const { result } = renderHook(() => useDetermine('54810769585'), { wrapper: wrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.corrente.motivo).toBe('NON_VALORIZZATO');
    // senza encodeURIComponent '1/../x' diventerebbe un altro segmento (A-01 della scheda dell'elenco)
    const costruito = renderHook(() => useDetermine('1/../x'), { wrapper: wrapper() });
    await waitFor(() => expect(costruito.result.current.isSuccess).toBe(true));
    expect(percorsi).toEqual(['/api/procedurale/domande/54810769585/determina', '/api/procedurale/domande/1%2F..%2Fx/determina']);
  });

  it('il 404 e il 400 di TX-0020 si riconoscono dal problem-type, non dal solo status', async () => {
    server.use(http.get('*/api/procedurale/domande/:codice/determina', () => HttpResponse.json(problema(404, 'NOT_FOUND'), { status: 404 })));
    const assente = renderHook(() => useDetermine('99999999999'), { wrapper: wrapper() });
    await waitFor(() => expect(assente.result.current.isError).toBe(true));
    expect(rispostaDomandaAssente(assente.result.current.error)).toBe(true);
    expect(rispostaDatoNonValido(assente.result.current.error)).toBe(false);
    server.use(http.get('*/api/procedurale/domande/:codice/determina', () => new HttpResponse(null, { status: 404 })));
    const senzaTipo = renderHook(() => useDetermine('11111111111'), { wrapper: wrapper() });
    await waitFor(() => expect(senzaTipo.result.current.isError).toBe(true));
    expect(rispostaDomandaAssente(senzaTipo.result.current.error)).toBe(false);
    server.use(http.get('*/api/procedurale/domande/:codice/determina', () => HttpResponse.json(problema(400, 'DATO_NON_VALIDO', 'codiceABarre: solo cifre'), { status: 400 })));
    const nonValido = renderHook(() => useDetermine('22222222222'), { wrapper: wrapper() });
    await waitFor(() => expect(nonValido.result.current.isError).toBe(true));
    expect(rispostaDatoNonValido(nonValido.result.current.error)).toBe(true);
  });

  it('TX-0024 e TX-0025 senza parametri; nessuna lettura non abilitata chiama il backend', async () => {
    const filtri = registra('filtri', { perimetro: 'REGIONALE', interventi: [], ultimiDatiSincronizzati: [] });
    const stati = registra('filtri/stati-area-programmazione', { perimetro: 'REGIONALE', valori: [] });
    const valori = renderHook(() => useValoriFiltri(), { wrapper: wrapper() });
    const area = renderHook(() => useStatiAreaProgrammazione(), { wrapper: wrapper() });
    await waitFor(() => expect(valori.result.current.isSuccess && area.result.current.isSuccess).toBe(true));
    expect([filtri, stati]).toEqual([[''], ['']]);
    const spenti = [
      renderHook(() => useValoriFiltri(false), { wrapper: wrapper() }),
      renderHook(() => useStatiAreaProgrammazione(false), { wrapper: wrapper() }),
      renderHook(() => useDomandeAmmesse({}, { abilitato: false }), { wrapper: wrapper() }),
      renderHook(() => useSottofasiPagamento({}, { abilitato: false }), { wrapper: wrapper() }),
    ];
    expect(spenti.map((h) => h.result.current.fetchStatus)).toEqual(['idle', 'idle', 'idle', 'idle']);
  });

  it('il 400 DATO_NON_VALIDO si riconosce dal problem-type, non dal solo status', async () => {
    server.use(http.get('*/api/procedurale/stati-sostegno', () => HttpResponse.json(problema(400, 'DATO_NON_VALIDO', 'stato: valore non ammesso'), { status: 400 })));
    const nonValido = renderHook(() => useStatiSostegno({ stato: ['BOH'] }), { wrapper: wrapper() });
    await waitFor(() => expect(nonValido.result.current.isError).toBe(true));
    expect(eProblema(nonValido.result.current.error, 'invalid-data')).toBe(true);
    server.use(http.get('*/api/procedurale/riepilogo', () => new HttpResponse(null, { status: 400 })));
    const senzaTipo = renderHook(() => useRiepilogo({}), { wrapper: wrapper() });
    await waitFor(() => expect(senzaTipo.result.current.isError).toBe(true));
    expect(eProblema(senzaTipo.result.current.error, 'invalid-data')).toBe(false);
  });

  it('i sei export chiedono il file del formato con i criteri della lettura (D-10), con X-Requested-With; il riepilogo in CSV e quello storico', async () => {
    const richieste: string[] = [];
    server.use(
      http.get('*/api/procedurale/:report/:formato', ({ request }) => {
        const u = new URL(request.url);
        richieste.push(`${u.pathname}${u.search} ${request.headers.get('X-Requested-With') ?? ''}`);
        return new HttpResponse('a;b', { headers: { 'Content-Type': 'text/csv' } });
      }),
    );
    const report: ReportProcedurale[] = ['domandeAmmesse', 'statiSostegno', 'statiPagamento', 'riepilogo', 'sottofasiSostegno', 'sottofasiPagamento'];
    for (const r of report) expect(await esportaReport(r, 'csv', { intervento: ['SRD01'], stato: ['AMMESSA'] })).toBeInstanceOf(Blob);
    expect(richieste).toEqual([
      '/api/procedurale/domande-ammesse/csv?intervento=SRD01&stato=AMMESSA XMLHttpRequest',
      '/api/procedurale/stati-sostegno/csv?intervento=SRD01&stato=AMMESSA XMLHttpRequest',
      '/api/procedurale/stati-pagamento/csv?intervento=SRD01&stato=AMMESSA XMLHttpRequest',
      '/api/procedurale/riepilogo/csv?intervento=SRD01&stato=AMMESSA XMLHttpRequest',
      '/api/procedurale/sottofasi-sostegno/csv?intervento=SRD01&stato=AMMESSA XMLHttpRequest',
      '/api/procedurale/sottofasi-pagamento/csv?intervento=SRD01&stato=AMMESSA XMLHttpRequest',
    ]);
  });

  it("il 400 dell'esportazione oltre il limite si riconosce dal corpo JSON del Blob d'errore", async () => {
    server.use(http.get('*/api/procedurale/domande-ammesse/:formato', () => HttpResponse.json(problema(400, 'DATO_NON_VALIDO', 'oltre 5000 righe'), { status: 400 })));
    const errore = await esportaReport('domandeAmmesse', 'xlsx', {}).catch((e: unknown) => e);
    expect(eProblema(errore, 'invalid-data')).toBe(true);
    expect(messaggioOltreIlLimite(errore)).toBe(OLTRE_IL_LIMITE_DELL_ESPORTAZIONE);
  });
});

// il mock del dev server risponde come il backend: righe degli interventi dei filtri, stato area, non rilasciate di SRD01
describe('mock di esempio del dev server del procedurale', () => {
  it('righe filtrate per intervento, obiettivi e stato; le non rilasciate di SRD01; le determine per codice; i file', async () => {
    server.use(...handlersEsempio);
    const leggi = async <T,>(q: string) => (await (await fetch(`http://localhost/api/procedurale/${q}`)).json()) as T;
    type Stati = { righe: { codiceIntervento: string; stati: { totale: number; domandeNonRilasciate: number } }[] };
    const sostegno = await leggi<Stati>('stati-sostegno?intervento=SRD01');
    expect(sostegno.righe.map((r) => [r.codiceIntervento, r.stati.totale, r.stati.domandeNonRilasciate])).toEqual([['SRD01', 9, 5]]);
    expect((await leggi<Stati>('stati-sostegno?os=OS5')).righe.map((r) => r.codiceIntervento)).toEqual(['SRD02']);
    type Ammesse = { righe: { codiceIntervento: string; domandeAmmesse: number }[] };
    expect((await leggi<Ammesse>('domande-ammesse?stato=REVOCATA')).righe.map((r) => r.domandeAmmesse)).toEqual([0, 0, 0]);
    expect((await leggi<{ elenco: unknown[] }>('domande/54810769585/determina')).elenco).toHaveLength(3);
    const assente = await fetch('http://localhost/api/procedurale/domande/99999999999/determina');
    expect([assente.status, ((await assente.json()) as { type: string }).type]).toEqual([404, PROBLEM_TYPES.NON_TROVATO]);
    expect((await fetch('http://localhost/api/procedurale/domande/5481A/determina')).status).toBe(400);
    // le Unit Amount sono del fisico: il mock del procedurale non le ha
    expect(handlersEsempio.some((h) => JSON.stringify(h.info).includes('unit-amount'))).toBe(false);
    expect((await leggi<{ interventi: unknown[] }>('filtri')).interventi).toHaveLength(3);
    expect((await fetch('http://localhost/api/procedurale/riepilogo/xlsx')).status).toBe(200);
  });
});
