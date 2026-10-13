import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { server } from '../src/shared/api/mock/server';
import {
  esportaDomande,
  rispostaDomandaAssente,
  useDettaglioDomanda,
  useDomande,
  usePagamenti,
  useSinottico,
  useValoriFiltri,
} from '../src/features/elenco-operativo/api';

function wrapper() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

describe('feature elenco-operativo, wrapper api (step3) su MSW', () => {
  it('useValoriFiltri legge i valori dei filtri (TX-0060)', async () => {
    server.use(
      http.get('*/api/elenco-operativo/filtri', () =>
        HttpResponse.json({ perimetro: 'REGIONALE', interventi: [{ chiave: 'SRA01', descrizione: 'Impegni' }], tipi: ['SOSTEGNO'] }),
      ),
    );
    const { result } = renderHook(() => useValoriFiltri(), { wrapper: wrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.interventi).toHaveLength(1);
    expect(result.current.data?.tipi).toEqual(['SOSTEGNO']);
  });

  it('useDomande manda criteri ripetuti, pagina e ordinamento (TX-0056)', async () => {
    let query = '';
    server.use(
      http.get('*/api/elenco-operativo/domande', ({ request }) => {
        query = new URL(request.url).search;
        return HttpResponse.json({ perimetro: 'REGIONALE', righe: [], totaleRighe: 0, pagina: 1, dimensione: 25 });
      }),
    );
    const { result } = renderHook(
      () => useDomande({ intervento: ['SRA01', 'SRD01'], pagina: ['1'], ordina: ['ammesso:desc'] }),
      { wrapper: wrapper() },
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(query).toBe('?intervento=SRA01&intervento=SRD01&pagina=1&ordina=ammesso:desc');
    expect(result.current.data?.totaleRighe).toBe(0);
  });

  it('useSinottico chiama il sinottico con gli stessi filtri (TX-0057)', async () => {
    let query = '';
    server.use(
      http.get('*/api/elenco-operativo/domande/sinottico', ({ request }) => {
        query = new URL(request.url).search;
        return HttpResponse.json({ perimetro: 'ADA', domande: 3 });
      }),
    );
    const { result } = renderHook(() => useSinottico({ sigc: ['true'] }), { wrapper: wrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(query).toBe('?sigc=true');
    expect(result.current.data?.domande).toBe(3);
  });

  it('useDettaglioDomanda senza tipo o codice non chiama il backend (TX-0058)', () => {
    const senzaCodice = renderHook(() => useDettaglioDomanda('SOSTEGNO', undefined), { wrapper: wrapper() });
    expect(senzaCodice.result.current.fetchStatus).toBe('idle');
    const senzaTipo = renderHook(() => useDettaglioDomanda(undefined, '04230000001'), { wrapper: wrapper() });
    expect(senzaTipo.result.current.fetchStatus).toBe('idle');
  });

  it("il 404 della scheda e' riconosciuto come domanda assente (stesso corpo per chiusa o fuori perimetro, D-06)", async () => {
    server.use(
      http.get('*/api/elenco-operativo/domande/:tipo/:codice', () =>
        HttpResponse.json(
          { type: 'urn:cruscottocsr:problem:not-found', title: 'Not Found', status: 404, errorCode: 'NOT_FOUND' },
          { status: 404 },
        ),
      ),
    );
    const { result } = renderHook(() => useDettaglioDomanda('SOSTEGNO', '04230000001'), { wrapper: wrapper() });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(rispostaDomandaAssente(result.current.error)).toBe(true);
  });

  it('usePagamenti manda decreto ed esito (TX-0059)', async () => {
    let query = '';
    server.use(
      http.get('*/api/elenco-operativo/pagamenti', ({ request }) => {
        query = new URL(request.url).search;
        return HttpResponse.json({ perimetro: 'REGIONALE', righe: [], totaleRighe: 0 });
      }),
    );
    const { result } = renderHook(() => usePagamenti({ decreto: ['D84-1'], esito: ['PAGATA'] }), { wrapper: wrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(query).toBe('?decreto=D84-1&esito=PAGATA');
  });

  it("l'esportazione delle domande chiede il file del formato con i criteri (D-09)", async () => {
    let url = '';
    server.use(
      http.get('*/api/elenco-operativo/domande/:formato', ({ request }) => {
        url = new URL(request.url).pathname + new URL(request.url).search;
        return new HttpResponse('a;b', { headers: { 'Content-Type': 'text/csv' } });
      }),
    );
    const file = await esportaDomande('csv', { intervento: ['SRA01'], ordina: ['cuaa:asc'] });
    expect(url).toBe('/api/elenco-operativo/domande/csv?intervento=SRA01&ordina=cuaa:asc');
    expect(file).toBeInstanceOf(Blob);
  });
});
