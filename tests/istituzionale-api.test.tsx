import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { server } from '../src/shared/api/mock/server';
import { problema } from '../src/shared/testing/msw';
import {
  esportaOutputRegionale,
  esportaVerificaSmpNonSigc,
  rispostaDatoNonValido,
  useOutputRegionale,
  useValoriFiltri,
  useVerificaSmpNonSigc,
} from '../src/features/istituzionale/api';
import { useValoriFiltri as useValoriFiltriFisico } from '../src/features/fisico/api';

function wrapper(client = new QueryClient({ defaultOptions: { queries: { retry: false } } })) {
  return ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

const VERIFICA = { annoRiferimento: 2025, perimetro: 'REGIONALE', outputCumulativo: true, righe: [], ultimiDatiSincronizzati: [] };
const OUTPUT = { annoInizio: 2023, annoFine: 2029, perimetro: 'REGIONALE', realizzatoNonSigcCumulativo: true, righe: [], ultimiDatiSincronizzati: [] };

describe('feature istituzionale, wrapper api (step3) su MSW', () => {
  it('useVerificaSmpNonSigc manda i filtri ripetuti e l anno di riferimento (TX-0016)', async () => {
    let query = '';
    server.use(
      http.get('*/api/istituzionale/verifica-smp-non-sigc', ({ request }) => {
        query = new URL(request.url).search;
        return HttpResponse.json(VERIFICA);
      }),
    );
    const { result } = renderHook(() => useVerificaSmpNonSigc({ intervento: ['SRD01', 'SRA01'], os: ['OS4'], anno: 2024 }), { wrapper: wrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(query).toBe('?intervento=SRD01&intervento=SRA01&os=OS4&anno=2024');
    expect(result.current.data?.annoRiferimento).toBe(2025);
  });

  it('useOutputRegionale manda i filtri ripetuti, senza anno (TX-0017)', async () => {
    let query = '';
    server.use(
      http.get('*/api/istituzionale/output-regionale', ({ request }) => {
        query = new URL(request.url).search;
        return HttpResponse.json(OUTPUT);
      }),
    );
    const { result } = renderHook(() => useOutputRegionale({ intervento: ['SRA01'], og: ['OG1'], op: ['OP2'], azione: ['3'] }), { wrapper: wrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(query).toBe('?intervento=SRA01&og=OG1&op=OP2&azione=3');
    expect(result.current.data?.annoFine).toBe(2029);
  });

  it('le due letture non abilitate non chiamano il backend', () => {
    const verifica = renderHook(() => useVerificaSmpNonSigc({}, { abilitato: false }), { wrapper: wrapper() });
    const output = renderHook(() => useOutputRegionale({}, { abilitato: false }), { wrapper: wrapper() });
    expect(verifica.result.current.fetchStatus).toBe('idle');
    expect(output.result.current.fetchStatus).toBe('idle');
  });

  it('il 400 DATO_NON_VALIDO si riconosce dal problem-type, non dal solo status', async () => {
    server.use(http.get('*/api/istituzionale/verifica-smp-non-sigc', () => HttpResponse.json(problema(400, 'DATO_NON_VALIDO', 'anno: valore non ammesso'), { status: 400 })));
    const nonValido = renderHook(() => useVerificaSmpNonSigc({ anno: 2025 }), { wrapper: wrapper() });
    await waitFor(() => expect(nonValido.result.current.isError).toBe(true));
    expect(rispostaDatoNonValido(nonValido.result.current.error)).toBe(true);
    // un 400 senza il problem-type del contratto non e' DATO_NON_VALIDO
    server.use(http.get('*/api/istituzionale/output-regionale', () => new HttpResponse(null, { status: 400 })));
    const senzaTipo = renderHook(() => useOutputRegionale({}), { wrapper: wrapper() });
    await waitFor(() => expect(senzaTipo.result.current.isError).toBe(true));
    expect(rispostaDatoNonValido(senzaTipo.result.current.error)).toBe(false);
  });

  it('i valori dei filtri sono la lettura comune di TX-0060: stessa cache del fisico e dell elenco (decisione G2)', async () => {
    let letture = 0;
    server.use(
      http.get('*/api/elenco-operativo/filtri', () => {
        letture += 1;
        return HttpResponse.json({ perimetro: 'REGIONALE', interventi: [{ chiave: 'SRD01', descrizione: 'Investimenti produttivi' }] });
      }),
    );
    const client = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity } } });
    const istituzionale = renderHook(() => useValoriFiltri(), { wrapper: wrapper(client) });
    await waitFor(() => expect(istituzionale.result.current.isSuccess).toBe(true));
    const fisico = renderHook(() => useValoriFiltriFisico(), { wrapper: wrapper(client) });
    expect(fisico.result.current.data?.interventi?.[0]?.chiave).toBe('SRD01');
    expect(letture).toBe(1);
    expect(useValoriFiltri).toBe(useValoriFiltriFisico);
  });

  it("le esportazioni chiedono il file del formato con gli stessi criteri delle letture (D-07), con X-Requested-With", async () => {
    const richieste: string[] = [];
    const registra = ({ request }: { request: Request }) => {
      const u = new URL(request.url);
      richieste.push(`${u.pathname}${u.search} ${request.headers.get('X-Requested-With') ?? ''}`);
      return new HttpResponse('a;b', { headers: { 'Content-Type': 'text/csv' } });
    };
    server.use(http.get('*/api/istituzionale/verifica-smp-non-sigc/:formato', registra), http.get('*/api/istituzionale/output-regionale/:formato', registra));
    expect(await esportaVerificaSmpNonSigc('csv', { intervento: ['SRD01'], anno: 2025 })).toBeInstanceOf(Blob);
    expect(await esportaOutputRegionale('xlsx', { intervento: ['SRD01'], os: ['OS4'] })).toBeInstanceOf(Blob);
    expect(richieste).toEqual([
      '/api/istituzionale/verifica-smp-non-sigc/csv?intervento=SRD01&anno=2025 XMLHttpRequest',
      '/api/istituzionale/output-regionale/xlsx?intervento=SRD01&os=OS4 XMLHttpRequest',
    ]);
  });

  it("il 400 dell'esportazione oltre il limite si riconosce dal corpo JSON del Blob d'errore", async () => {
    server.use(http.get('*/api/istituzionale/output-regionale/:formato', () => HttpResponse.json(problema(400, 'DATO_NON_VALIDO', 'oltre 5000 righe'), { status: 400 })));
    const errore = await esportaOutputRegionale('csv', {}).catch((e: unknown) => e);
    expect(rispostaDatoNonValido(errore)).toBe(true);
  });
});
