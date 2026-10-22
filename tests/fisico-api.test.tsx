import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { server } from '../src/shared/api/mock/server';
import { problema } from '../src/shared/testing/msw';
import { PROBLEM_TYPES } from '../src/shared/api/problem/problem-types';
import { handlersEsempio } from '../src/features/fisico/api/mock/esempio';
import { esportaSuperfici, rispostaDatoNonValido, rispostaDomandaAssente, useDetermine, useSuperfici, useValoriFiltri } from '../src/features/fisico/api';
import { useValoriFiltri as useValoriFiltriElenco } from '../src/features/elenco-operativo/api';

function wrapper(client = new QueryClient({ defaultOptions: { queries: { retry: false } } })) {
  return ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

const SUPERFICI = { campagna: null, perimetro: 'REGIONALE', righe: [], ultimiDatiSincronizzati: [] };

describe('feature fisico, wrapper api (step3) su MSW', () => {
  it('useSuperfici manda i filtri ripetuti e la campagna (TX-0018)', async () => {
    let query = '';
    server.use(
      http.get('*/api/fisico/superficie-ammissibile', ({ request }) => {
        query = new URL(request.url).search;
        return HttpResponse.json(SUPERFICI);
      }),
    );
    const { result } = renderHook(() => useSuperfici({ intervento: ['SRB01', 'SRA29'], os: ['OS4'], campagna: 2025 }), { wrapper: wrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(query).toBe('?intervento=SRB01&intervento=SRA29&os=OS4&campagna=2025');
    expect(result.current.data?.perimetro).toBe('REGIONALE');
  });

  it('useSuperfici non abilitato non chiama il backend', () => {
    const { result } = renderHook(() => useSuperfici({}, { abilitato: false }), { wrapper: wrapper() });
    expect(result.current.fetchStatus).toBe('idle');
  });

  it('useDetermine senza codice non chiama il backend; con il codice lo mette nel percorso codificato (TX-0020)', async () => {
    const senza = renderHook(() => useDetermine(null), { wrapper: wrapper() });
    expect(senza.result.current.fetchStatus).toBe('idle');
    let percorso = '';
    server.use(
      http.get('*/api/fisico/domande/:codice/determina', ({ request }) => {
        percorso = new URL(request.url).pathname;
        return HttpResponse.json({ codiceABarre: '54810769585', tipoDomanda: 'PAGAMENTO', domandaChiusa: false, corrente: { valore: null, motivo: 'NON_VALORIZZATO' }, elenco: [] });
      }),
    );
    const { result } = renderHook(() => useDetermine('54810769585'), { wrapper: wrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(percorso).toBe('/api/fisico/domande/54810769585/determina');
    expect(result.current.data?.corrente.motivo).toBe('NON_VALORIZZATO');
  });

  it('useDetermine codifica il codice nel percorso: un valore costruito ad arte resta un solo segmento (TX-0020, A-01)', async () => {
    // senza encodeURIComponent '1/../x' diventerebbe /api/fisico/domande/x/determina: un altro codice, un altro segmento
    const percorsi: string[] = [];
    server.use(
      http.get('*/api/fisico/domande/:codice/determina', ({ request }) => {
        percorsi.push(new URL(request.url).pathname);
        return HttpResponse.json({ codiceABarre: 'x', tipoDomanda: 'PAGAMENTO', domandaChiusa: false, corrente: { valore: null, motivo: 'NON_VALORIZZATO' }, elenco: [] });
      }),
    );
    const { result } = renderHook(() => useDetermine('1/../x'), { wrapper: wrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(percorsi).toEqual(['/api/fisico/domande/1%2F..%2Fx/determina']);
  });

  it('il 404 e il 400 di TX-0020 si riconoscono dal problem-type, non dal solo status', async () => {
    server.use(http.get('*/api/fisico/domande/:codice/determina', () => HttpResponse.json(problema(404, 'NOT_FOUND'), { status: 404 })));
    const assente = renderHook(() => useDetermine('99999999999'), { wrapper: wrapper() });
    await waitFor(() => expect(assente.result.current.isError).toBe(true));
    expect(rispostaDomandaAssente(assente.result.current.error)).toBe(true);
    expect(rispostaDatoNonValido(assente.result.current.error)).toBe(false);
    // un 404 senza il problem-type del contratto non e' "domanda assente"
    server.use(http.get('*/api/fisico/domande/:codice/determina', () => new HttpResponse(null, { status: 404 })));
    const senzaTipo = renderHook(() => useDetermine('11111111111'), { wrapper: wrapper() });
    await waitFor(() => expect(senzaTipo.result.current.isError).toBe(true));
    expect(rispostaDomandaAssente(senzaTipo.result.current.error)).toBe(false);
    server.use(http.get('*/api/fisico/domande/:codice/determina', () => HttpResponse.json(problema(400, 'DATO_NON_VALIDO', 'codiceABarre: solo cifre'), { status: 400 })));
    const nonValido = renderHook(() => useDetermine('22222222222'), { wrapper: wrapper() });
    await waitFor(() => expect(nonValido.result.current.isError).toBe(true));
    expect(rispostaDatoNonValido(nonValido.result.current.error)).toBe(true);
  });

  it('i valori dei filtri sono la lettura comune di TX-0060: stessa cache del pannello dell elenco (decisione G2)', async () => {
    let letture = 0;
    server.use(
      http.get('*/api/elenco-operativo/filtri', () => {
        letture += 1;
        return HttpResponse.json({ perimetro: 'REGIONALE', interventi: [{ chiave: 'SRB01', descrizione: 'Investimenti' }] });
      }),
    );
    const client = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity } } });
    const fisico = renderHook(() => useValoriFiltri(), { wrapper: wrapper(client) });
    await waitFor(() => expect(fisico.result.current.isSuccess).toBe(true));
    const elenco = renderHook(() => useValoriFiltriElenco(), { wrapper: wrapper(client) });
    expect(elenco.result.current.data?.interventi?.[0]?.chiave).toBe('SRB01');
    expect(letture).toBe(1);
    expect(useValoriFiltri).toBe(useValoriFiltriElenco);
  });

  it('senza il grant (abilitato falso) i valori dei filtri non si leggono', () => {
    const { result } = renderHook(() => useValoriFiltri(false), { wrapper: wrapper() });
    expect(result.current.fetchStatus).toBe('idle');
  });

  it("l'esportazione chiede il file del formato con gli stessi criteri della lettura (D-06)", async () => {
    let url = '';
    server.use(
      http.get('*/api/fisico/superficie-ammissibile/:formato', ({ request }) => {
        url = new URL(request.url).pathname + new URL(request.url).search;
        return new HttpResponse('a;b', { headers: { 'Content-Type': 'text/csv' } });
      }),
    );
    const file = await esportaSuperfici('xlsx', { intervento: ['SRB01'], campagna: 2025 });
    expect(url).toBe('/api/fisico/superficie-ammissibile/xlsx?intervento=SRB01&campagna=2025');
    expect(file).toBeInstanceOf(Blob);
  });

  it("il 400 dell'esportazione oltre il limite si riconosce dal corpo JSON del Blob d'errore", async () => {
    server.use(
      http.get('*/api/fisico/superficie-ammissibile/:formato', () => HttpResponse.json(problema(400, 'DATO_NON_VALIDO', 'oltre 5000 righe'), { status: 400 })),
    );
    const errore = await esportaSuperfici('csv', {}).catch((e: unknown) => e);
    expect(rispostaDatoNonValido(errore)).toBe(true);
  });
});

// il mock del dev server risponde come il backend: superfici filtrate, 404 e 400 di TX-0020 sul problem-type del contratto
describe('mock di esempio del dev server del fisico', () => {
  it('superfici filtrate per intervento e campagna; 404 per un codice sconosciuto, 400 per uno senza cifre', async () => {
    server.use(...handlersEsempio);
    const s = (await (await fetch('http://localhost/api/fisico/superficie-ammissibile?intervento=SRA29&campagna=2024')).json()) as { campagna: number; righe: Array<{ campagne: unknown[] }> };
    expect(s.campagna).toBe(2024);
    expect(s.righe).toHaveLength(1);
    expect(s.righe[0].campagne).toHaveLength(1);
    const assente = await fetch('http://localhost/api/fisico/domande/99999999999/determina');
    expect(assente.status).toBe(404);
    expect(await assente.json()).toMatchObject({ type: PROBLEM_TYPES.NON_TROVATO, errorCode: 'NOT_FOUND' });
    const nonValido = await fetch('http://localhost/api/fisico/domande/5481A/determina');
    expect(nonValido.status).toBe(400);
    expect(await nonValido.json()).toMatchObject({ type: PROBLEM_TYPES.DATO_NON_VALIDO });
    expect((await fetch('http://localhost/api/fisico/domande/54810769585/determina')).status).toBe(200);
  });
});
