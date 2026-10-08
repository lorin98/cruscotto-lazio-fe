import { describe, expect, it } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '../src/shared/api/mock/server';
import { expectNoA11yViolations } from '../src/shared/testing/axe';
import { rispondi } from '../src/shared/testing/msw';
import { renderPagina } from '../src/shared/testing/render-pagina';
import { PAGINA_FILTRI, REPORT_FINANZIARIO } from '../src/features/finanziario';
import PaginaRiepilogo from '../src/pages/finanziario/riepilogo/page';
import routeTable from '../src/app/route-table.json';
import * as F from '../src/shared/testing/fixture-finanziario';

// Impaginazione comune delle pagine (widget PaginaFinanziario) e coerenza del catalogo dei report con la route-table.
// I comportamenti di ogni pagina sono nei page.test.tsx accanto alle pagine.
describe('pagine del finanziario (step6)', () => {
  it('route-table: le 8 route dello uiplan, ognuna col suo modulo pagina', () => {
    expect(routeTable.routes.map((r) => r.path)).toEqual([
      '/finanziario',
      '/finanziario/riepilogo',
      '/finanziario/dotazione',
      '/finanziario/avanzamento',
      '/finanziario/domande',
      '/finanziario/sigc',
      '/finanziario/sigc/riserva',
      '/finanziario/sigc/verifica-smp',
    ]);
  });

  it('catalogo dei report = route-table: stessi percorsi e stessi grant di visibilita', () => {
    const catalogo = [PAGINA_FILTRI, ...REPORT_FINANZIARIO].map((r) => ({ path: r.percorso, grant: [...r.grant].sort() }));
    const rotte = routeTable.routes.map((r) => ({ path: r.path, grant: [...r.visibility].sort() }));
    expect(catalogo).toEqual(rotte);
  });

  it('riepilogo: titolo e focus, filtri dall indirizzo verso il backend, Modifica filtri che ricorda il report, altri report', async () => {
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
    await screen.findByRole('table', { name: /nove campi finanziari/ });
    expect(query).toBe('?intervento=SRA01&os=SO4');
    expect(await screen.findByText(/Filtri attivi: Intervento SRA01 - Intervento di prova A; OS SO4; OG, OP e azioni portanti: tutti\./)).toBeTruthy();
    // NFR-25 (b), OP-FE-04: subito sotto il titolo, prima dei filtri attivi (wireframe riapprovati)
    const aggiornamento = screen.getByText(/^Ultimo dato sincronizzato: DS-12 02\/03\/2026 10:15; PROSA DS-04 03\/03\/2026 09:30\.$/);
    expect(h1.nextElementSibling).toBe(aggiornamento);
    expect(screen.getByRole('link', { name: 'Modifica filtri' }).getAttribute('href')).toBe('/finanziario?intervento=SRA01&os=SO4&da=%2Ffinanziario%2Friepilogo');
    const altri = await screen.findByRole('navigation', { name: 'Altri report del finanziario' });
    await waitFor(() => expect(within(altri).getByRole('link', { name: 'Avanzamento finanziario' }).getAttribute('href')).toBe('/finanziario/avanzamento?intervento=SRA01&os=SO4'));
    expect(within(altri).queryByRole('link', { name: 'Riepilogo per intervento' })).toBeNull();
  });

  it('altri report: solo quelli visibili per i grant dell utente (gate di UX)', async () => {
    server.use(
      rispondi('/api/finanziario/riepilogo', F.RIEPILOGO),
      rispondi('/api/finanziario/filtri', F.FILTRI),
      http.get('*/auth/status', () => HttpResponse.json({ authenticated: true, user: { username: 'U', roles: ['csr.tx-0011.read', 'csr.tx-0001.read', 'csr.tx-0013.read'] } })),
    );
    renderPagina(PaginaRiepilogo, '/finanziario/riepilogo');
    const altri = await screen.findByRole('navigation', { name: 'Altri report del finanziario' });
    await waitFor(() => expect(within(altri).getAllByRole('link').map((l) => l.textContent)).toEqual(['Domande e importi SIGC']));
  });

  it('a11y della pagina completa: zero violazioni axe', async () => {
    server.use(rispondi('/api/finanziario/riepilogo', F.RIEPILOGO), rispondi('/api/finanziario/filtri', F.FILTRI));
    const { container } = renderPagina(PaginaRiepilogo, '/finanziario/riepilogo');
    await screen.findByRole('table', { name: /nove campi finanziari/ });
    await expectNoA11yViolations(container);
  });
});
