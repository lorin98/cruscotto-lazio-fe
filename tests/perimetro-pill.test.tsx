import type { ComponentType, ReactNode } from 'react';
import { createElement } from 'react';
import { afterAll, afterEach, describe, expect, it } from 'vitest';
import { renderHook, screen, waitFor, within } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import type { QueryClient } from '@tanstack/react-query';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { delay, http, HttpResponse } from 'msw';
import type { JsonBodyType } from 'msw';
import { server } from '../src/shared/api/mock/server';
import { expectNoA11yViolations } from '../src/shared/testing/axe';
import { FILTRI, PAGAMENTI, RESIDUO_IMPEGNI, RESIDUO_PAGAMENTI, RIEPILOGO, RISERVA, SPESA, STANZIATO } from '../src/features/finanziario/testing/fixture';
import { problema, rispondi } from '../src/shared/testing/msw';
import { clientDiTest, renderConQuery } from '../src/shared/testing/render';
import { perimetriInCache, useRiserva } from '../src/features/finanziario/api';
import PaginaRiepilogo from '../src/pages/finanziario/riepilogo/page';
import PaginaAvanzamento from '../src/pages/finanziario/avanzamento/page';

// Pill del perimetro dentro una pagina del finanziario (review step9 V-20, N-07): legge le risposte gia' in cache
// attraverso il confine api/ (perimetriInCache) e le combina con lib/perimetro.ts; ADA prevale su REGIONALE.

// richieste del finanziario arrivate al backend finto: nessuna deve finire sui dati inventati degli handler generati,
// che dichiarano un perimetro a caso
let richieste: string[] = [];
const registra = ({ request }: { request: Request }) => {
  const { pathname } = new URL(request.url);
  if (pathname.includes('/api/finanziario/')) richieste.push(pathname);
};
server.events.on('request:start', registra);
afterEach(() => {
  richieste = [];
});
afterAll(() => server.events.removeListener('request:start', registra));
const soloServite = (...percorsi: string[]) => expect([...new Set(richieste)].sort()).toEqual(percorsi.map((p) => `/api/finanziario/${p}`).sort());

function apri(Pagina: ComponentType, percorso: string, client = clientDiTest()) {
  const router = createMemoryRouter([{ path: percorso, Component: Pagina }], { initialEntries: [percorso] });
  renderConQuery(<RouterProvider router={router} />, client);
  return client;
}
const barra = () => screen.getByRole('region', { name: 'Filtri attivi' });
const pill = () => within(barra()).queryByText(/^Perimetro:/);
const conPerimetro = (corpo: Record<string, unknown>, perimetro: string): JsonBodyType => ({ ...corpo, perimetro });

describe('PerimetroPill: perimetro dichiarato dalle risposte in cache (V-20, N-07)', () => {
  it('risposta REGIONALE: "Perimetro: regionale", senza evidenza; nessuna violazione a11y', async () => {
    server.use(rispondi('/api/finanziario/filtri', FILTRI), rispondi('/api/finanziario/riepilogo', RIEPILOGO));
    apri(PaginaRiepilogo, '/finanziario/riepilogo');
    const regionale = await within(barra()).findByText('Perimetro: regionale');
    expect(regionale.classList.contains('ui-pill')).toBe(true);
    expect(regionale.classList.contains('ui-pill--evidenza')).toBe(false);
    soloServite('filtri', 'riepilogo');
    await expectNoA11yViolations(barra());
  });

  it('risposta ADA: "Perimetro: la tua area (ADA)", in evidenza; nessuna violazione a11y', async () => {
    server.use(rispondi('/api/finanziario/filtri', FILTRI), rispondi('/api/finanziario/riepilogo', conPerimetro(RIEPILOGO, 'ADA')));
    apri(PaginaRiepilogo, '/finanziario/riepilogo');
    const ada = await within(barra()).findByText('Perimetro: la tua area (ADA)');
    expect(ada.classList.contains('ui-pill--evidenza')).toBe(true);
    soloServite('filtri', 'riepilogo');
    await expectNoA11yViolations(barra());
  });

  it('ADA prevale su REGIONALE in cache, anche se le sezioni regionali arrivano dopo', async () => {
    const lente = (path: string, corpo: JsonBodyType) =>
      http.get(`*${path}`, async () => {
        await delay(30);
        return HttpResponse.json(corpo);
      });
    server.use(
      rispondi('/api/finanziario/filtri', FILTRI),
      rispondi('/api/finanziario/stanziato', conPerimetro(STANZIATO, 'ADA')),
      lente('/api/finanziario/pagamenti-su-impegnato', PAGAMENTI),
      lente('/api/finanziario/residuo-impegni', RESIDUO_IMPEGNI),
      lente('/api/finanziario/residuo-pagamenti', RESIDUO_PAGAMENTI),
      lente('/api/finanziario/spesa-per-intervento', SPESA),
    );
    const client = apri(PaginaAvanzamento, '/finanziario/avanzamento');
    await within(barra()).findByText('Perimetro: la tua area (ADA)');
    // arrivate anche le regionali: in cache ci sono entrambi i perimetri, la pill resta ADA
    await waitFor(() => expect(perimetriInCache(client)).toContain('REGIONALE'));
    expect(perimetriInCache(client)).toContain('ADA');
    expect(pill()?.textContent).toBe('Perimetro: la tua area (ADA)');
    soloServite('filtri', 'stanziato', 'pagamenti-su-impegnato', 'residuo-impegni', 'residuo-pagamenti', 'spesa-per-intervento');
  });

  it('nessuna pill senza risposte: prima che arrivino e quando la lettura fallisce', async () => {
    server.use(
      rispondi('/api/finanziario/filtri', FILTRI),
      http.get('*/api/finanziario/riepilogo', async () => {
        await delay(30);
        return HttpResponse.json(problema(503, 'TEMPO_SCADUTO'), { status: 503 });
      }),
    );
    apri(PaginaRiepilogo, '/finanziario/riepilogo');
    expect(pill()).toBeNull();
    await screen.findByRole('alert');
    expect(pill()).toBeNull();
    soloServite('filtri', 'riepilogo');
  });
});

describe('perimetriInCache: le key factory generate, non la forma delle chiavi (N-07)', () => {
  const wrapper = (client: QueryClient) =>
    function Con({ children }: { children: ReactNode }) {
      return createElement(QueryClientProvider, { client }, children);
    };

  it("la riserva (TX-0014, l'anno nel percorso) conta; le altre chiavi della cache no", async () => {
    server.use(rispondi('/api/finanziario/riserva/2025', conPerimetro(RISERVA, 'ADA')));
    const client = clientDiTest();
    client.setQueryData(['/api/finanziario/riepilogo/csv'], { perimetro: 'REGIONALE' });
    client.setQueryData(['report'], { perimetro: 'REGIONALE' });
    const { result } = renderHook(() => useRiserva(2025), { wrapper: wrapper(client) });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(perimetriInCache(client)).toEqual(['ADA']);
  });

  it('cache vuota: nessun perimetro', () => {
    expect(perimetriInCache(clientDiTest())).toEqual([]);
  });
});
