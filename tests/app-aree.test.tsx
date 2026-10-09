// app-aree.test.tsx — catalogo unico delle aree (review step9 H-22): la Home e il menu laterale lo iterano, le pagine
// di un'area vengono dal barrel della feature e sono route della route-table, le aree future stanno in una sola lista.
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { QueryClientProvider } from '@tanstack/react-query';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { http, HttpResponse } from 'msw';
import { server } from '../src/shared/api/mock/server';
import { AREE, AREE_FUTURE, areeVisibili } from '../src/app/aree';
import { appRoutes } from '../src/app/routes';
import routeTable from '../src/app/route-table.json';
import { PAGINE_FINANZIARIO, pagineVisibili } from '../src/features/finanziario';
import { clientApp } from './app-client';

function apriHomeCon(ruoli: string[]) {
  server.use(http.get('*/auth/status', () => HttpResponse.json({ authenticated: true, user: { username: 'U', roles: ruoli } })));
  const router = createMemoryRouter(appRoutes(), { initialEntries: ['/'] });
  return render(
    <QueryClientProvider client={clientApp()}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
}

describe('catalogo delle aree', () => {
  it('le pagine di ogni area, per un profilo con tutti i grant, sono route della route-table', () => {
    const percorsi = new Set(routeTable.routes.map((r) => r.path));
    for (const area of AREE) {
      const pagine = area.pagineVisibili(() => true);
      expect(pagine.length).toBeGreaterThan(0);
      for (const p of pagine) expect(percorsi.has(p.percorso)).toBe(true);
    }
  });

  it('il finanziario prende le pagine visibili dal barrel della feature', () => {
    expect(AREE.find((a) => a.chiave === 'finanziario')?.pagineVisibili).toBe(pagineVisibili);
    expect(areeVisibili(() => true).map((a) => a.pagine)).toEqual([PAGINE_FINANZIARIO]);
    expect(areeVisibili(() => false)).toEqual([]);
  });

  it('una ricerca conservata porta solo i filtri del finanziario', () => {
    const finanziario = AREE.find((a) => a.chiave === 'finanziario');
    expect(finanziario?.ricercaConservata?.('?intervento=SRA01&pagina=3')).toBe('intervento=SRA01');
  });

  it('le aree future non sono aree realizzate', () => {
    expect(AREE_FUTURE.filter((f) => AREE.some((a) => a.titolo === f))).toEqual([]);
  });
});

describe('Home e menu dallo stesso catalogo', () => {
  it("profilo col solo riepilogo: la card dell'area porta alla prima pagina visibile, il menu ha la sola voce", async () => {
    apriHomeCon(['csr.tx-0011.read']);
    const card = await screen.findByRole('region', { name: 'Finanziario' });
    expect(within(card).getByRole('link', { name: 'Finanziario' }).getAttribute('href')).toBe('/finanziario/riepilogo');
    const menu = screen.getByRole('navigation', { name: 'Navigazione principale' });
    expect(within(menu).getAllByRole('link').map((l) => l.textContent)).toEqual(['Riepilogo per intervento']);
    for (const futura of AREE_FUTURE) {
      expect(screen.getByRole('region', { name: `${futura}: presto disponibile` })).toBeTruthy();
      expect(menu.textContent).toContain(`${futura}presto`);
    }
  });

  it('profilo senza pagine in nessuna area: la Home lo dice, il menu ha solo le aree future', async () => {
    apriHomeCon(['altro']);
    expect(await screen.findByText('Il tuo profilo non ha ancora aree del cruscotto da consultare.')).toBeTruthy();
    const menu = screen.getByRole('navigation', { name: 'Navigazione principale' });
    expect(within(menu).queryAllByRole('button')).toHaveLength(0);
    expect(within(menu).queryAllByRole('link')).toHaveLength(0);
    expect(menu.textContent).toContain('Primo pilastropresto');
  });
});
