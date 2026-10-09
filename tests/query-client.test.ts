import { createElement } from 'react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import type { QueryClient } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { AxiosError, AxiosHeaders } from 'axios';
import type { AxiosResponse } from 'axios';
import { createQueryClient, handleMutationError } from '../src/app/query-client';
import { PROBLEM_TYPES } from '../src/shared/api/problem/problem-types';
import { attesaPrimaDiRiprovare, soloTransitori } from '../src/shared/api/retry/nuovi-tentativi';
import { server } from '../src/shared/api/mock/server';
import { clientDiTest } from '../src/shared/testing/render';
import { RIEPILOGO } from '../src/shared/testing/fixture-finanziario';
import { problema } from '../src/shared/testing/msw';
import { useRiepilogo } from '../src/features/finanziario/api';

// Errore axios sintetico: isAxiosError() di axios riconosce un oggetto con isAxiosError===true.
function axiosErr(status: number, type?: string): unknown {
  return { isAxiosError: true, response: { status, data: type ? { type } : {} } };
}

// Errore axios vero, con status, corpo e header della risposta.
function erroreHttp(status: number, data?: unknown, headers: Record<string, string> = {}): AxiosError {
  const response = { status, data, statusText: '', headers, config: { headers: new AxiosHeaders() } } as AxiosResponse;
  return new AxiosError('richiesta fallita', 'ERR_BAD_RESPONSE', undefined, undefined, response);
}

describe('query-client — MutationCache boundary (rete di sicurezza mutation)', () => {
  it('intercetta SOLO access-denied (asse-dato/riga) come rete di sicurezza globale', () => {
    const spy = vi.fn();
    handleMutationError(axiosErr(403, PROBLEM_TYPES.ACCESSO_NEGATO), spy);
    expect(spy).toHaveBeenCalledTimes(1);
  });
  it('lascia INLINE gli altri errori (409 versione, 501, errore non-axios)', () => {
    const spy = vi.fn();
    handleMutationError(axiosErr(409, PROBLEM_TYPES.VERSIONE_SUPERATA), spy);
    handleMutationError(axiosErr(501), spy);
    handleMutationError(new Error('non-axios'), spy);
    expect(spy).not.toHaveBeenCalled();
  });
});

describe('query-client — politica di retry nei defaultOptions (review step9 H-18)', () => {
  it('retry e attesa vengono da shared/api/retry, per tutte le letture', () => {
    const { queries } = createQueryClient().getDefaultOptions();
    expect(queries?.retry).toBe(soloTransitori);
    expect(queries?.retryDelay).toBe(attesaPrimaDiRiprovare);
  });

  it('si riprova CAPACITA_ESAURITA, un 503 senza problem-type e la rete assente; non TEMPO_SCADUTO ne i 4xx', () => {
    expect(soloTransitori(0, erroreHttp(503, { type: PROBLEM_TYPES.CAPACITA_ESAURITA }))).toBe(true);
    expect(soloTransitori(0, erroreHttp(503))).toBe(true);
    expect(soloTransitori(0, new AxiosError('Network Error', 'ERR_NETWORK'))).toBe(true);
    expect(soloTransitori(0, erroreHttp(503, { type: PROBLEM_TYPES.TEMPO_SCADUTO }))).toBe(false);
    expect(soloTransitori(0, erroreHttp(403, { type: PROBLEM_TYPES.ACCESSO_NEGATO }))).toBe(false);
    expect(soloTransitori(0, new Error('non HTTP'))).toBe(false);
    expect(soloTransitori(3, erroreHttp(503))).toBe(false);
  });

  it('attesa dai secondi di Retry-After, altrimenti progressiva fino a 8 secondi', () => {
    expect(attesaPrimaDiRiprovare(0, erroreHttp(503, {}, { 'retry-after': '5' }))).toBe(5000);
    expect(attesaPrimaDiRiprovare(0, erroreHttp(503))).toBe(1000);
    expect(attesaPrimaDiRiprovare(2, erroreHttp(503))).toBe(4000);
    expect(attesaPrimaDiRiprovare(5, erroreHttp(503))).toBe(8000);
  });

  // un wrapper della feature su un 503 CAPACITA_ESAURITA seguito dal dato: quante letture e con quale esito
  async function leggiRiepilogo(client: QueryClient) {
    let letture = 0;
    server.use(
      http.get('*/api/finanziario/riepilogo', () =>
        ++letture === 1
          ? HttpResponse.json(problema(503, 'CAPACITA_ESAURITA'), { status: 503, headers: { 'Content-Type': 'application/problem+json' } })
          : HttpResponse.json(RIEPILOGO),
      ),
    );
    const wrapper = ({ children }: { children: ReactNode }) => createElement(QueryClientProvider, { client }, children);
    const { result } = renderHook(() => useRiepilogo({}), { wrapper });
    await waitFor(() => expect(result.current.isSuccess || result.current.isError).toBe(true));
    return { letture, esito: result.current.status };
  }

  it('i wrapper della feature non hanno un retry proprio: decide il client', async () => {
    const produzione = createQueryClient();
    produzione.setDefaultOptions({ queries: { ...produzione.getDefaultOptions().queries, retryDelay: 0 } });
    expect(await leggiRiepilogo(produzione)).toEqual({ letture: 2, esito: 'success' });
    // il client di test senza retry vale anche per la feature
    expect(await leggiRiepilogo(clientDiTest())).toEqual({ letture: 1, esito: 'error' });
  });
});
