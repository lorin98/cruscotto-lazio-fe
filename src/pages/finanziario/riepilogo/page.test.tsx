import { describe, expect, it } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '../../../shared/api/mock/server';
import { expectNoA11yViolations } from '../../../shared/testing/axe';
import { FILTRI, RIEPILOGO } from '../../../shared/testing/fixture-finanziario';
import { renderPagina } from '../../../shared/testing/render-pagina';
import Pagina from './page';

const TABELLA = /^Riepilogo per intervento \(RF011\): 2 righe\./;

describe('RF011: tabella di riepilogo per intervento con i nove campi finanziari', () => {
  it('una riga per intervento, le colonne con almeno un valore, le altre nascoste e dichiarate, le assenze spiegate', async () => {
    server.use(http.get('*/api/finanziario/riepilogo', () => HttpResponse.json(RIEPILOGO)));
    renderPagina(Pagina, '/finanziario/riepilogo');
    const tabella = await screen.findByRole('table', { name: TABELLA });
    // ordinata per dotazione decrescente; la prima colonna e' l'intestazione di riga
    expect(within(tabella).getAllByRole('rowheader').map((c) => c.textContent)).toEqual(['SRA01', 'SRA03', 'Totale (2 interventi)']);
    const intestazioni = within(tabella).getAllByRole('columnheader').map((c) => c.textContent?.replace(/[▲▼↕]/g, ''));
    expect(intestazioni[0]).toBe('Intervento');
    expect(intestazioni).toContain('Pagamenti al netto di rettifiche');
    expect(screen.getByText(/^Colonne nascoste perché nessun intervento ha un valore/).textContent).toContain('Importo stanziato');
    // le colonne nascoste si mostrano da "Colonne": le assenze dicono la fonte, mai uno zero
    await userEvent.click(screen.getByText('Colonne'));
    await userEvent.click(screen.getByRole('checkbox', { name: 'Importo stanziato' }));
    expect(within(tabella).getAllByText('non disponibile').length).toBeGreaterThan(0);
    expect(tabella.textContent).toContain('fonte quadro sinottico non attiva');
    expect(screen.getByRole('table', { name: 'Valore fuori tabella, indipendente dai filtri' }).textContent).toContain('Dotazione assistenza tecnica (AT001');
  });

  it("riga apribile: l'anteprima laterale porta al dettaglio dell'intervento con i filtri", async () => {
    server.use(http.get('*/api/finanziario/riepilogo', () => HttpResponse.json(RIEPILOGO)));
    const { router } = renderPagina(Pagina, '/finanziario/riepilogo', '/finanziario/riepilogo?os=SO4');
    await screen.findByRole('table', { name: TABELLA });
    await userEvent.click(screen.getByRole('row', { name: "Apri l'anteprima dell'intervento SRA01" }));
    const anteprima = await screen.findByRole('dialog', { name: 'SRA01' });
    expect(anteprima.textContent).toContain('Domande presentate');
    await userEvent.click(within(anteprima).getByRole('link', { name: "Apri il dettaglio dell'intervento" }));
    await waitFor(() => expect(router.state.location.pathname).toBe('/finanziario/interventi/SRA01'));
    expect(router.state.location.search).toBe('?os=SO4');
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

  it('nessuna violazione axe, anche con l anteprima aperta', async () => {
    server.use(http.get('*/api/finanziario/riepilogo', () => HttpResponse.json(RIEPILOGO)));
    const { container } = renderPagina(Pagina, '/finanziario/riepilogo');
    await screen.findByRole('table', { name: TABELLA });
    await expectNoA11yViolations(container);
    await userEvent.click(screen.getByRole('row', { name: "Apri l'anteprima dell'intervento SRA03" }));
    await expectNoA11yViolations(await screen.findByRole('dialog', { name: 'SRA03' }));
  });
});

describe('RF001: i filtri valgono per il riepilogo e per gli altri report', () => {
  it("i filtri dell'indirizzo arrivano al backend e si vedono come chip rimovibili", async () => {
    let query = '';
    server.use(
      http.get('*/api/finanziario/riepilogo', ({ request }) => {
        query = new URL(request.url).search;
        return HttpResponse.json(RIEPILOGO);
      }),
      http.get('*/api/finanziario/filtri', () => HttpResponse.json(FILTRI)),
    );
    const { router } = renderPagina(Pagina, '/finanziario/riepilogo', '/finanziario/riepilogo?intervento=SRA01&op=OP2&intervento=%3Cx%3E');
    await screen.findByRole('table', { name: /^Riepilogo per intervento/ });
    // il valore fuori formato non arriva al backend
    await waitFor(() => expect(query).toBe('?intervento=SRA01&op=OP2'));
    const barra = screen.getByRole('region', { name: 'Filtri attivi' });
    expect(within(barra).getByRole('button', { name: 'Togli il filtro Intervento SRA01' })).toBeTruthy();
    await userEvent.click(within(barra).getByRole('button', { name: 'Togli il filtro OP OP2' }));
    await waitFor(() => expect(router.state.location.search).toBe('?intervento=SRA01'));
    await waitFor(() => expect(query).toBe('?intervento=SRA01'));
    expect(screen.getByRole('link', { name: 'Finanziario' }).getAttribute('href')).toBe('/finanziario?intervento=SRA01');
  });
});
