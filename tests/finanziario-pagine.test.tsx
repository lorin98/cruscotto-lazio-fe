import { describe, expect, it } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '../src/shared/api/mock/server';
import { expectNoA11yViolations } from '../src/shared/testing/axe';
import { rispondi } from '../src/shared/testing/msw';
import { renderPagina } from '../src/shared/testing/render-pagina';
import { DETTAGLIO_INTERVENTO, PAGINE_FINANZIARIO } from '../src/features/finanziario';
import PaginaRiepilogo from '../src/pages/finanziario/riepilogo/page';
import PaginaVerificaSmp from '../src/pages/finanziario/sigc/verifica-smp/page';
import routeTable from '../src/app/route-table.json';
import * as F from '../src/shared/testing/fixture-finanziario';

// Impaginazione comune delle pagine (widget PaginaFinanziario, UI v2) e coerenza del catalogo delle pagine con la
// route-table. I comportamenti di ogni pagina sono nei page.test.tsx accanto alle pagine; menu e intestazione nei test
// della shell.
describe('pagine del finanziario (step6)', () => {
  it('route-table: le 9 route dello uiplan v2, ognuna col suo modulo pagina', () => {
    expect(routeTable.routes.map((r) => [r.path, r.component])).toEqual([
      ['/finanziario', 'src/pages/finanziario/panoramica/page.tsx'],
      ['/finanziario/interventi/:codice', 'src/pages/finanziario/interventi/page.tsx'],
      ['/finanziario/riepilogo', 'src/pages/finanziario/riepilogo/page.tsx'],
      ['/finanziario/dotazione', 'src/pages/finanziario/dotazione/page.tsx'],
      ['/finanziario/avanzamento', 'src/pages/finanziario/avanzamento/page.tsx'],
      ['/finanziario/domande', 'src/pages/finanziario/domande/page.tsx'],
      ['/finanziario/sigc', 'src/pages/finanziario/sigc/page.tsx'],
      ['/finanziario/sigc/riserva', 'src/pages/finanziario/sigc/riserva/page.tsx'],
      ['/finanziario/sigc/verifica-smp', 'src/pages/finanziario/sigc/verifica-smp/page.tsx'],
    ]);
  });

  it('catalogo delle pagine = route-table: stessi percorsi e stessi grant di visibilita', () => {
    const perPercorso = (a: { path: string }, b: { path: string }) => a.path.localeCompare(b.path);
    const catalogo = [...PAGINE_FINANZIARIO, DETTAGLIO_INTERVENTO].map((r) => ({ path: r.percorso, grant: [...r.grant].sort() })).sort(perPercorso);
    const rotte = routeTable.routes.map((r) => ({ path: r.path, grant: [...r.visibility].sort() })).sort(perPercorso);
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
    await screen.findByRole('table', { name: /^Riepilogo per intervento \(RF011\)/ });
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

  it('togliere un filtro o tutti conserva i parametri di pagina (esercizio della verifica SMP)', async () => {
    server.use(rispondi('/api/finanziario/filtri', F.FILTRI), rispondi('/api/finanziario/sigc/verifica-smp', F.VERIFICA_SMP));
    const { router } = renderPagina(PaginaVerificaSmp, '/finanziario/sigc/verifica-smp', '/finanziario/sigc/verifica-smp?intervento=SRA01&og=OG2&esercizio=2025');
    const barra = screen.getByRole('region', { name: 'Filtri attivi' });
    await userEvent.click(within(barra).getByRole('button', { name: 'Togli il filtro OG OG2' }));
    await waitFor(() => expect(router.state.location.search).toBe('?intervento=SRA01&esercizio=2025'));
    await userEvent.click(within(barra).getByRole('button', { name: 'Togli tutti' }));
    await waitFor(() => expect(router.state.location.search).toBe('?esercizio=2025'));
    expect(within(barra).getByText('Nessun filtro: tutti gli interventi del perimetro')).toBeTruthy();
  });

  it('Applica dal pannello dei filtri conserva i parametri di pagina', async () => {
    server.use(rispondi('/api/finanziario/filtri', F.FILTRI), rispondi('/api/finanziario/sigc/verifica-smp', F.VERIFICA_SMP));
    const { router } = renderPagina(PaginaVerificaSmp, '/finanziario/sigc/verifica-smp', '/finanziario/sigc/verifica-smp?esercizio=2025');
    await userEvent.click(await screen.findByRole('button', { name: /^Filtri/ }));
    const pannello = await screen.findByRole('dialog', { name: 'Filtri' });
    await userEvent.click(await within(pannello).findByRole('checkbox', { name: 'SRA01 Intervento di prova A' }));
    await userEvent.click(within(pannello).getByRole('button', { name: 'Applica i filtri' }));
    await waitFor(() => expect(router.state.location.search).toBe('?intervento=SRA01&esercizio=2025'));
  });

  it('a11y della pagina completa: zero violazioni axe', async () => {
    server.use(rispondi('/api/finanziario/riepilogo', F.RIEPILOGO), rispondi('/api/finanziario/filtri', F.FILTRI));
    const { container } = renderPagina(PaginaRiepilogo, '/finanziario/riepilogo', '/finanziario/riepilogo?intervento=SRA01');
    await screen.findByRole('table', { name: /^Riepilogo per intervento \(RF011\)/ });
    await screen.findByRole('button', { name: /^Ultimo dato sincronizzato/ });
    await expectNoA11yViolations(container);
  });
});
