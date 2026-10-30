import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { server } from '../src/shared/api/mock/server';
import { problema } from '../src/shared/testing/msw';
import { handlersEsempio } from '../src/features/fisico/api/mock/esempio';
import { esportaOutputRegionale, esportaSuperfici, esportaUnitAmount, useOutputRegionale, useSuperfici, useUnitAmount, useValoriFiltri } from '../src/features/fisico/api';
import { eProblema } from '../src/shared/api/problem/e-problema';
import { useValoriFiltri as useValoriFiltriElenco } from '../src/features/elenco-operativo/api';

function wrapper(client = new QueryClient({ defaultOptions: { queries: { retry: false } } })) {
  return ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

const SUPERFICI = { campagna: null, perimetro: 'REGIONALE', righe: [], ultimiDatiSincronizzati: [] };
const OUTPUT = { annoInizio: 2023, annoFine: 2029, perimetro: 'REGIONALE', realizzatoNonSigcCumulativo: true, righe: [], ultimiDatiSincronizzati: [] };

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

  // l'output regionale (dall'istituzionale) e le Unit Amount (dal procedurale) sono del fisico dal 29/10/2026
  it('useOutputRegionale manda i filtri ripetuti, senza anno (TX-0017)', async () => {
    let query = '';
    server.use(
      http.get('*/api/fisico/output-regionale', ({ request }) => {
        query = new URL(request.url).search;
        return HttpResponse.json(OUTPUT);
      }),
    );
    const { result } = renderHook(() => useOutputRegionale({ intervento: ['SRA01'], og: ['OG1'], op: ['OP2'], azione: ['3'] }), { wrapper: wrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(query).toBe('?intervento=SRA01&og=OG1&op=OP2&azione=3');
    expect(result.current.data?.annoFine).toBe(2029);
  });

  it('useUnitAmount manda intervento e obiettivi (TX-0030); le letture non abilitate non chiamano il backend', async () => {
    let query = '';
    server.use(
      http.get('*/api/fisico/unit-amount', ({ request }) => {
        query = new URL(request.url).search;
        return HttpResponse.json({ perimetro: 'REGIONALE', righe: [], ultimiDatiSincronizzati: [] });
      }),
    );
    const { result } = renderHook(() => useUnitAmount({ intervento: ['SRD01'], os: ['OS4'] }), { wrapper: wrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(query).toBe('?intervento=SRD01&os=OS4');
    const output = renderHook(() => useOutputRegionale({}, { abilitato: false }), { wrapper: wrapper() });
    const unitAmount = renderHook(() => useUnitAmount({}, { abilitato: false }), { wrapper: wrapper() });
    expect([output.result.current.fetchStatus, unitAmount.result.current.fetchStatus]).toEqual(['idle', 'idle']);
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

  it("le esportazioni chiedono il file del formato con gli stessi criteri della lettura (D-06), con X-Requested-With", async () => {
    const richieste: string[] = [];
    const registra = ({ request }: { request: Request }) => {
      const u = new URL(request.url);
      richieste.push(`${u.pathname}${u.search} ${request.headers.get('X-Requested-With') ?? ''}`);
      return new HttpResponse('a;b', { headers: { 'Content-Type': 'text/csv' } });
    };
    server.use(http.get('*/api/fisico/superficie-ammissibile/:formato', registra), http.get('*/api/fisico/output-regionale/:formato', registra), http.get('*/api/fisico/unit-amount/:formato', registra));
    expect(await esportaSuperfici('xlsx', { intervento: ['SRB01'], campagna: 2025 })).toBeInstanceOf(Blob);
    expect(await esportaOutputRegionale('xlsx', { intervento: ['SRD01'], os: ['OS4'] })).toBeInstanceOf(Blob);
    expect(await esportaUnitAmount('csv', { intervento: ['SRD01'] })).toBeInstanceOf(Blob);
    expect(richieste).toEqual([
      '/api/fisico/superficie-ammissibile/xlsx?intervento=SRB01&campagna=2025 XMLHttpRequest',
      '/api/fisico/output-regionale/xlsx?intervento=SRD01&os=OS4 XMLHttpRequest',
      '/api/fisico/unit-amount/csv?intervento=SRD01 XMLHttpRequest',
    ]);
  });

  it("il 400 dell'esportazione oltre il limite si riconosce dal corpo JSON del Blob d'errore", async () => {
    server.use(
      http.get('*/api/fisico/superficie-ammissibile/:formato', () => HttpResponse.json(problema(400, 'DATO_NON_VALIDO', 'oltre 5000 righe'), { status: 400 })),
    );
    const errore = await esportaSuperfici('csv', {}).catch((e: unknown) => e);
    expect(eProblema(errore, 'invalid-data')).toBe(true);
  });
});

// il mock del dev server risponde come il backend: superfici filtrate, output regionale e Unit Amount filtrati, i file
describe('mock di esempio del dev server del fisico', () => {
  it('superfici filtrate per intervento e campagna; output e Unit Amount per intervento e obiettivi, nessuna riga con l azione', async () => {
    server.use(...handlersEsempio);
    const s = (await (await fetch('http://localhost/api/fisico/superficie-ammissibile?intervento=SRA29&campagna=2024')).json()) as { campagna: number; righe: Array<{ campagne: unknown[] }> };
    expect(s.campagna).toBe(2024);
    expect(s.righe).toHaveLength(1);
    expect(s.righe[0].campagne).toHaveLength(1);
    type Righe = { righe: Array<{ codiceIntervento: string }> };
    const leggi = async (q: string) => ((await (await fetch(`http://localhost/api/fisico/${q}`)).json()) as Righe).righe.map((r) => r.codiceIntervento);
    expect(await leggi('output-regionale?azione=3')).toEqual([]);
    expect(await leggi('output-regionale?intervento=SRA01&intervento=SRA16')).toEqual(['SRA01', 'SRA16']);
    expect(await leggi('unit-amount?os=OS4')).toEqual(['SRD01']);
    expect((await fetch('http://localhost/api/fisico/output-regionale/csv')).status).toBe(200);
    expect((await fetch('http://localhost/api/fisico/unit-amount/xlsx')).status).toBe(200);
    // le determine di una domanda sono del procedurale dal 29/10/2026: nessun handler d'esempio del fisico
    expect(handlersEsempio.some((h) => JSON.stringify(h.info).includes('determina'))).toBe(false);
  });
});
