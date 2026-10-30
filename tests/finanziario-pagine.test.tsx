import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClientProvider } from '@tanstack/react-query';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { http, HttpResponse } from 'msw';
import { server } from '../src/shared/api/mock/server';
import { expectNoA11yViolations } from '../src/shared/testing/axe';
import { rispondi } from '../src/shared/testing/msw';
import { renderPagina } from '../src/shared/testing/render-pagina';
import { DETTAGLIO_INTERVENTO } from '../src/features/finanziario';
import { PAGINE_FINANZIARIO } from '../src/features/finanziario/lib/report';
import PaginaDotazione from '../src/pages/finanziario/dotazione/page';
import PaginaRiepilogo from '../src/pages/finanziario/riepilogo/page';
import PaginaRiserva from '../src/pages/finanziario/sigc/riserva/page';
import { pngDelGrafico } from '../src/shared/ui/grafici/echarts';

// la route-table e' del progetto (piu' feature, ADR 0028): qui solo le route del finanziario, dai path del suo uiplan
import { ROTTE_FINANZIARIO } from './rotte-finanziario';
import * as F from '../src/features/finanziario/testing/fixture';
import { tabellaDelRiepilogo } from '../src/features/finanziario/testing/riepilogo';
import { appRoutes } from '../src/app/routes';
import { clientApp } from './app-client';

// Impaginazione comune delle pagine (widget PaginaFinanziario, UI v2) e coerenza del catalogo delle pagine con la
// route-table. I comportamenti di ogni pagina sono nei page.test.tsx accanto alle pagine; menu e intestazione nei test
// della shell.
describe('pagine del finanziario (step6)', () => {
  it('route-table: le 8 route dello uiplan v2, ognuna col suo modulo pagina', () => {
    expect(ROTTE_FINANZIARIO.map((r) => [r.path, r.component])).toEqual([
      ['/finanziario', 'src/pages/finanziario/panoramica/page.tsx'],
      ['/finanziario/interventi/:codice', 'src/pages/finanziario/interventi/page.tsx'],
      ['/finanziario/riepilogo', 'src/pages/finanziario/riepilogo/page.tsx'],
      ['/finanziario/dotazione', 'src/pages/finanziario/dotazione/page.tsx'],
      ['/finanziario/avanzamento', 'src/pages/finanziario/avanzamento/page.tsx'],
      ['/finanziario/domande', 'src/pages/finanziario/domande/page.tsx'],
      ['/finanziario/sigc', 'src/pages/finanziario/sigc/page.tsx'],
      ['/finanziario/sigc/riserva', 'src/pages/finanziario/sigc/riserva/page.tsx'],
    ]);
  });

  it('catalogo delle pagine = route-table: stessi percorsi e stessi grant di visibilita', () => {
    const perPercorso = (a: { path: string }, b: { path: string }) => a.path.localeCompare(b.path);
    const catalogo = [...PAGINE_FINANZIARIO, DETTAGLIO_INTERVENTO].map((r) => ({ path: r.percorso, grant: [...r.grant].sort() })).sort(perPercorso);
    const rotte = ROTTE_FINANZIARIO.map((r) => ({ path: r.path, grant: [...r.visibility].sort() })).sort(perPercorso);
    expect(catalogo).toEqual(rotte);
  });

  it('riepilogo: titolo e focus, briciole, filtri dall indirizzo verso il backend, chip, data dell ultimo dato', async () => {
    let query = '';
    server.use(
      http.get('*/api/finanziario/riepilogo', ({ request }) => {
        query = new URL(request.url).search;
        return HttpResponse.json(F.RIEPILOGO);
      }),
      rispondi('/api/finanziario/filtri', F.FILTRI),
    );
    renderPagina(PaginaRiepilogo, '/finanziario/riepilogo', '/finanziario/riepilogo?intervento=SRA01&os=SO4&intervento=%3Cx%3E');
    const h1 = screen.getByRole('heading', { level: 1, name: 'Finanziario: riepilogo per intervento' });
    await waitFor(() => expect(document.activeElement).toBe(h1));
    expect(document.title).toBe('Riepilogo per intervento - Finanziario - Cruscotto CSR 2023-2027');
    await tabellaDelRiepilogo();
    expect(query).toBe('?intervento=SRA01&os=SO4');
    const barra = screen.getByRole('region', { name: 'Filtri attivi' });
    expect(within(barra).getAllByRole('button', { name: /^Togli il filtro/ }).map((b) => b.getAttribute('aria-label'))).toEqual([
      'Togli il filtro Intervento SRA01',
      'Togli il filtro OS SO4',
    ]);
    // NFR-25 (b), OP-FE-04: nella barra la data fino a cui tutti i flussi sono aggiornati (la meno recente)
    expect(await within(barra).findByRole('button', { name: /^Ultimo dato sincronizzato: dati al 02\/03\/2026 per tutti i flussi/ })).toBeTruthy();
    const briciole = screen.getByRole('navigation', { name: 'Percorso' });
    expect(within(briciole).getAllByRole('listitem').map((v) => v.textContent)).toEqual(['Home', 'Finanziario', 'Riepilogo per intervento']);
    expect(within(briciole).getByRole('link', { name: 'Finanziario' }).getAttribute('href')).toBe('/finanziario?intervento=SRA01&os=SO4');
    expect(within(briciole).getByText('Riepilogo per intervento').getAttribute('aria-current')).toBe('page');
  });

  // dal 29/10/2026 la verifica SMP SIGC (che aveva l'esercizio) e' dell'istituzionale: il parametro di pagina della prova
  // e' l'anno, sulla pagina del riepilogo (la regola dell'indirizzo e' la stessa per ogni pagina con la barra)
  it('togliere un filtro o tutti conserva i parametri di pagina (anno)', async () => {
    server.use(rispondi('/api/finanziario/filtri', F.FILTRI), rispondi('/api/finanziario/riepilogo', F.RIEPILOGO));
    const { router } = renderPagina(PaginaRiepilogo, '/finanziario/riepilogo', '/finanziario/riepilogo?intervento=SRA01&og=OG2&anno=2025');
    const barra = screen.getByRole('region', { name: 'Filtri attivi' });
    await userEvent.click(within(barra).getByRole('button', { name: 'Togli il filtro OG OG2' }));
    await waitFor(() => expect(router.state.location.search).toBe('?intervento=SRA01&anno=2025'));
    await userEvent.click(within(barra).getByRole('button', { name: 'Togli tutti' }));
    await waitFor(() => expect(router.state.location.search).toBe('?anno=2025'));
    expect(within(barra).getByText('Nessun filtro: tutti gli interventi del perimetro')).toBeTruthy();
  });

  it('Applica dal pannello dei filtri conserva i parametri di pagina', async () => {
    server.use(rispondi('/api/finanziario/filtri', F.FILTRI), rispondi('/api/finanziario/riepilogo', F.RIEPILOGO));
    const { router } = renderPagina(PaginaRiepilogo, '/finanziario/riepilogo', '/finanziario/riepilogo?anno=2025');
    await userEvent.click(await screen.findByRole('button', { name: /^Filtri/ }));
    const pannello = await screen.findByRole('dialog', { name: 'Filtri' });
    await userEvent.click(await within(pannello).findByRole('checkbox', { name: 'SRA01 Intervento di prova A' }));
    await userEvent.click(within(pannello).getByRole('button', { name: 'Applica i filtri' }));
    await waitFor(() => expect(router.state.location.search).toBe('?intervento=SRA01&anno=2025'));
  });

  it("PNG di un grafico con l'intestazione di NFR-50: filtri della barra, profilo, ultimo dato sincronizzato (review v3 V-01)", async () => {
    server.use(
      http.get('*/auth/status', () =>
        HttpResponse.json({ authenticated: true, user: { username: 'U', profile: 'P1', roles: ['csr.tx-0001.read', 'csr.tx-0002.read', 'csr.tx-0003.read'] } }),
      ),
      rispondi('/api/finanziario/filtri', F.FILTRI),
      rispondi('/api/finanziario/spesa-per-intervento', F.SPESA),
      rispondi('/api/finanziario/distribuzione-dotazione', F.DISTRIBUZIONE),
    );
    const clic = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    const png = vi.mocked(pngDelGrafico);
    png.mockClear();
    renderPagina(PaginaDotazione, '/finanziario/dotazione', '/finanziario/dotazione?intervento=SRA01');
    // la data dell'ultimo dato arriva con TX-0001: la pill la mostra quando la lettura e' in cache
    await screen.findByRole('button', { name: /^Ultimo dato sincronizzato: dati al/ });
    await userEvent.click(await screen.findByRole('button', { name: 'Scarica il grafico Dotazione e pagamenti per intervento in PNG' }));
    const intestazione = png.mock.calls[0][1].intestazione;
    expect(intestazione.slice(0, 5)).toEqual([
      'Cruscotto CSR Lazio - Dotazione e pagamenti per intervento',
      'Fonte: TX-0002 · Perimetro REGIONALE',
      'Filtri applicati: Intervento: SRA01',
      'Profilo: P1',
      'Ultimo dato sincronizzato: DS-12 02/03/2026 10:15; PROSA DS-04 03/03/2026 09:30',
    ]);
    expect((clic.mock.contexts[0] as HTMLAnchorElement).download).toBe('dotazione-e-pagamenti-per-intervento-tx-0002.png');
    clic.mockRestore();
  });

  it("PNG della riserva: l'anno della pagina fra i filtri applicati, come nei file del backend (review v3 N-02)", async () => {
    server.use(
      http.get('*/auth/status', () => HttpResponse.json({ authenticated: true, user: { username: 'U', profile: 'P1', roles: ['csr.tx-0014.read'] } })),
      rispondi('/api/finanziario/riserva/2025', F.RISERVA),
    );
    const clic = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    const png = vi.mocked(pngDelGrafico);
    png.mockClear();
    renderPagina(PaginaRiserva, '/finanziario/sigc/riserva', '/finanziario/sigc/riserva?anno=2025');
    await userEvent.click(await screen.findByRole('button', { name: 'Scarica il grafico Utilizzo progressivo cumulato della riserva in PNG' }));
    await waitFor(() => expect(png).toHaveBeenCalledTimes(1));
    expect(png.mock.calls[0][1].intestazione).toContain('Filtri applicati: Anno: 2025');
    clic.mockRestore();
  });

  it('a11y della pagina completa: zero violazioni axe', async () => {
    server.use(rispondi('/api/finanziario/riepilogo', F.RIEPILOGO), rispondi('/api/finanziario/filtri', F.FILTRI));
    const { container } = renderPagina(PaginaRiepilogo, '/finanziario/riepilogo', '/finanziario/riepilogo?intervento=SRA01');
    await tabellaDelRiepilogo();
    await screen.findByRole('button', { name: /^Ultimo dato sincronizzato/ });
    await expectNoA11yViolations(container);
  });
});

// riallineamento degli ambiti (verbale del 29/10/2026, A-1 e A-4; OP-FE-10): la verifica SMP SIGC (TX-0015) e' una
// pagina dell'istituzionale e la vecchia route del finanziario non ha alias, nemmeno per chi ha csr.tx-0015.read
describe('pagine del finanziario: nessun alias della verifica SMP (A-4, OP-FE-10)', () => {
  it('/finanziario/sigc/verifica-smp apre Pagina non trovata e resta su quell indirizzo', async () => {
    server.use(http.get('*/auth/status', () => HttpResponse.json({ authenticated: true, user: { username: 'U', roles: ['csr.tx-0012.read', 'csr.tx-0013.read', 'csr.tx-0015.read'] } })));
    const router = createMemoryRouter(appRoutes(), { initialEntries: ['/finanziario/sigc/verifica-smp?esercizio=2025'] });
    render(
      <QueryClientProvider client={clientApp()}>
        <RouterProvider router={router} />
      </QueryClientProvider>,
    );
    expect(await screen.findByRole('heading', { level: 1, name: 'Pagina non trovata' })).toBeTruthy();
    expect(router.state.location.pathname).toBe('/finanziario/sigc/verifica-smp');
  });
});
