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
  esportaUnitAmount,
  useDomandeAmmesse,
  useRiepilogo,
  useSottofasiPagamento,
  useSottofasiSostegno,
  useStatiAreaProgrammazione,
  useStatiPagamento,
  useStatiSostegno,
  useUnitAmount,
  useValoriFiltri,
} from '../src/features/procedurale/api';
import type { ReportProcedurale } from '../src/features/procedurale/api';

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

  it('unit-amount (TX-0030) manda intervento e obiettivi', async () => {
    const query = registra('unit-amount', { perimetro: 'REGIONALE', righe: [] });
    const { result } = renderHook(() => useUnitAmount({ intervento: ['SRD01'], os: ['OS4'] }), { wrapper: wrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(query).toEqual(['?intervento=SRD01&os=OS4']);
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
      renderHook(() => useUnitAmount({}, { abilitato: false }), { wrapper: wrapper() }),
      renderHook(() => useSottofasiPagamento({}, { abilitato: false }), { wrapper: wrapper() }),
    ];
    expect(spenti.map((h) => h.result.current.fetchStatus)).toEqual(['idle', 'idle', 'idle', 'idle', 'idle']);
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

  it('i sette export chiedono il file del formato con i criteri della lettura (D-10), con X-Requested-With; il riepilogo in CSV e quello storico', async () => {
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
    expect(await esportaUnitAmount('xlsx', { intervento: ['SRD01'], op: ['OP1'] })).toBeInstanceOf(Blob);
    expect(richieste).toEqual([
      '/api/procedurale/domande-ammesse/csv?intervento=SRD01&stato=AMMESSA XMLHttpRequest',
      '/api/procedurale/stati-sostegno/csv?intervento=SRD01&stato=AMMESSA XMLHttpRequest',
      '/api/procedurale/stati-pagamento/csv?intervento=SRD01&stato=AMMESSA XMLHttpRequest',
      '/api/procedurale/riepilogo/csv?intervento=SRD01&stato=AMMESSA XMLHttpRequest',
      '/api/procedurale/sottofasi-sostegno/csv?intervento=SRD01&stato=AMMESSA XMLHttpRequest',
      '/api/procedurale/sottofasi-pagamento/csv?intervento=SRD01&stato=AMMESSA XMLHttpRequest',
      '/api/procedurale/unit-amount/xlsx?intervento=SRD01&op=OP1 XMLHttpRequest',
    ]);
  });

  it("il 400 dell'esportazione oltre il limite si riconosce dal corpo JSON del Blob d'errore", async () => {
    server.use(http.get('*/api/procedurale/domande-ammesse/:formato', () => HttpResponse.json(problema(400, 'DATO_NON_VALIDO', 'oltre 5000 righe'), { status: 400 })));
    const errore = await esportaReport('domandeAmmesse', 'xlsx', {}).catch((e: unknown) => e);
    expect(eProblema(errore, 'invalid-data')).toBe(true);
    expect(messaggioOltreIlLimite(errore)).toBe(OLTRE_IL_LIMITE_DELL_ESPORTAZIONE);
  });
});
