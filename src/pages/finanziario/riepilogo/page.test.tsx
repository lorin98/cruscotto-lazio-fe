import { describe, expect, it } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '../../../shared/api/mock/server';
import { expectNoA11yViolations } from '../../../shared/testing/axe';
import { FILTRI, RIEPILOGO } from '../../../shared/testing/fixture-finanziario';
import { renderPagina } from '../../../shared/testing/render-pagina';
import Pagina from './page';

describe('RF011: tabella di riepilogo per intervento con i nove campi finanziari', () => {
  it('una riga per intervento, i nove campi e le assenze dichiarate', async () => {
    server.use(http.get('*/api/finanziario/riepilogo', () => HttpResponse.json(RIEPILOGO)));
    renderPagina(Pagina, '/finanziario/riepilogo');
    const tabella = await screen.findByRole('table', { name: /nove campi finanziari/ });
    expect(within(tabella).getAllByRole('columnheader')).toHaveLength(10);
    expect(within(tabella).getAllByRole('rowheader').map((c) => c.textContent)).toEqual(['SRA01', 'SRA03']);
    expect(tabella.textContent).toContain('fonte impegni non attiva');
    expect(screen.getByRole('table', { name: 'Valore fuori tabella, indipendente dai filtri' }).textContent).toContain('Dotazione assistenza tecnica (AT001');
  });

  it('vuoto ed errore sono rami distinti', async () => {
    server.use(http.get('*/api/finanziario/riepilogo', () => HttpResponse.json({ perimetro: 'REGIONALE', righe: [] })));
    const vuoto = renderPagina(Pagina, '/finanziario/riepilogo');
    expect((await screen.findByText(/Nessun intervento per i filtri scelti/)).closest('[role]')?.getAttribute('role')).toBe('status');
    expect(screen.queryByRole('alert')).toBeNull();
    vuoto.unmount();
    server.use(
      http.get('*/api/finanziario/riepilogo', () =>
        HttpResponse.json({ type: 'urn:cruscottocsr:problem:accesso-negato', title: 'Forbidden', status: 403, errorCode: 'ACCESSO_NEGATO' }, { status: 403 }),
      ),
    );
    renderPagina(Pagina, '/finanziario/riepilogo');
    expect((await screen.findByRole('alert')).textContent).toContain('Non hai i permessi');
  });

  it('nessuna violazione axe', async () => {
    server.use(http.get('*/api/finanziario/riepilogo', () => HttpResponse.json(RIEPILOGO)));
    const { container } = renderPagina(Pagina, '/finanziario/riepilogo');
    await screen.findByRole('table', { name: /nove campi finanziari/ });
    await expectNoA11yViolations(container);
  });
});

describe('RF001: i filtri valgono per il riepilogo e per gli altri report', () => {
  it("i filtri dell'indirizzo arrivano al backend e restano nei link", async () => {
    let query = '';
    server.use(
      http.get('*/api/finanziario/riepilogo', ({ request }) => {
        query = new URL(request.url).search;
        return HttpResponse.json(RIEPILOGO);
      }),
      http.get('*/api/finanziario/filtri', () => HttpResponse.json(FILTRI)),
    );
    renderPagina(Pagina, '/finanziario/riepilogo', '/finanziario/riepilogo?intervento=SRA01&op=OP2');
    await screen.findByRole('table', { name: /nove campi finanziari/ });
    await waitFor(() => expect(query).toBe('?intervento=SRA01&op=OP2'));
    expect(await screen.findByText(/Filtri attivi: Intervento SRA01 - Intervento di prova A; OP OP2; OS, OG e azioni portanti: tutti\./)).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Domande e importi per anno' }).getAttribute('href')).toBe(
      '/finanziario/domande?intervento=SRA01&op=OP2',
    );
  });
});
