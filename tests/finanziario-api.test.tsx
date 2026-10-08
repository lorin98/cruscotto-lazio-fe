import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { server } from '../src/shared/api/mock/server';
import {
  rispostaRiservaAssente,
  useFiltri,
  useRiepilogo,
  useRiserva,
  useVerificaSmp,
} from '../src/features/finanziario/api';

function wrapper() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

describe('feature finanziario, wrapper api (step3) su MSW', () => {
  it('useFiltri legge i valori dei filtri (TX-0001)', async () => {
    const { result } = renderHook(() => useFiltri(), { wrapper: wrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(Array.isArray(result.current.data?.interventi)).toBe(true);
  });

  it('useRiepilogo manda i filtri ripetuti (TX-0011)', async () => {
    let query = '';
    server.use(
      http.get('*/api/finanziario/riepilogo', ({ request }) => {
        query = new URL(request.url).search;
        return HttpResponse.json({ perimetro: 'REGIONALE', righe: [] });
      }),
    );
    const { result } = renderHook(() => useRiepilogo({ intervento: ['SRA01', 'SRA03'] }), { wrapper: wrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(query).toBe('?intervento=SRA01&intervento=SRA03');
    expect(result.current.data?.perimetro).toBe('REGIONALE');
  });

  it('useRiserva senza anno non chiama il backend (TX-0014)', () => {
    const { result } = renderHook(() => useRiserva(undefined), { wrapper: wrapper() });
    expect(result.current.fetchStatus).toBe('idle');
  });

  it("il 404 della riserva e' riconosciuto come anno senza movimenti", async () => {
    server.use(
      http.get('*/api/finanziario/riserva/:anno', () =>
        HttpResponse.json(
          { type: 'urn:cruscottocsr:problem:not-found', title: 'Not Found', status: 404, errorCode: 'NOT_FOUND' },
          { status: 404 },
        ),
      ),
    );
    const { result } = renderHook(() => useRiserva(2025), { wrapper: wrapper() });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(rispostaRiservaAssente(result.current.error)).toBe(true);
  });

  it('useVerificaSmp senza esercizio non chiama il backend (TX-0015)', () => {
    const { result } = renderHook(() => useVerificaSmp({}, undefined), { wrapper: wrapper() });
    expect(result.current.fetchStatus).toBe('idle');
  });
});
