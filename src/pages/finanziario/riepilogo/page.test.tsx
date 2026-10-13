import { describe, expect, it } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '../../../shared/api/mock/server';
import { expectNoA11yViolations } from '../../../shared/testing/axe';
import { FILTRI, RIEPILOGO } from '../../../features/finanziario/testing/fixture';
import { renderPagina } from '../../../shared/testing/render-pagina';
import Pagina from './page';

const TABELLA = /^Riepilogo per intervento \(RF011\): 2 righe\./;

describe('RF011: tabella di riepilogo per intervento con i nove campi finanziari', () => {
  it('una riga per intervento con i nove campi, le assenze spiegate, totali e Assistenza tecnica nel piede', async () => {
    server.use(http.get('*/api/finanziario/riepilogo', () => HttpResponse.json(RIEPILOGO)));
    renderPagina(Pagina, '/finanziario/riepilogo');
    const tabella = await screen.findByRole('table', { name: TABELLA });
    // ordinata per dotazione decrescente; la prima colonna e' l'intestazione di riga
    expect(within(tabella).getAllByRole('rowheader').map((c) => c.textContent)).toEqual([
      'SRA01',
      'SRA03',
      'Totale (2 interventi)',
      'Dotazione assistenza tecnica (AT001, intero programma: non dipende dai filtri)',
    ]);
    const intestazioni = within(tabella).getAllByRole('columnheader').map((c) => c.textContent?.replace(/[▲▼↕]/g, ''));
    expect(intestazioni[0]).toBe('Intervento');
    expect(intestazioni).toContain('Pagamenti al netto delle rettifiche');
    // tutte le colonne si vedono (wireframe riepilogo): le assenze dicono la fonte, mai uno zero
    expect(within(tabella).getByRole('columnheader', { name: /Importo stanziato/ })).toBeTruthy();
    expect(within(tabella).getAllByText('non disponibile').length).toBeGreaterThan(0);
    expect(tabella.textContent).toContain('fonte quadro sinottico non attiva');
    // la scelta delle colonne resta: si nasconde una colonna su richiesta
    await userEvent.click(screen.getByText('Colonne'));
    await userEvent.click(screen.getByRole('checkbox', { name: 'Importo stanziato' }));
    expect(within(tabella).queryByRole('columnheader', { name: /Importo stanziato/ })).toBeNull();
  });

  it("riga apribile: l'anteprima laterale porta al dettaglio dell'intervento, con la selezione nell'indirizzo", async () => {
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

  // X-03: senza il legame interventi - azioni il filtro per azione non si applica e il chip lo dice; finche' TX-0001 non
  // risponde il riepilogo non si legge (mai prima con l'azione e poi senza)
  it("filtro per azione senza il legame: riepilogo letto solo dopo TX-0001, senza l'azione, e il chip lo spiega", async () => {
    let rilascia: () => void = () => undefined;
    const pronti = new Promise<void>((r) => {
      rilascia = r;
    });
    const lette: string[] = [];
    server.use(
      http.get('*/api/finanziario/filtri', async () => {
        await pronti;
        return HttpResponse.json(FILTRI);
      }),
      http.get('*/api/finanziario/riepilogo', ({ request }) => {
        lette.push(new URL(request.url).search);
        return HttpResponse.json(RIEPILOGO);
      }),
    );
    renderPagina(Pagina, '/finanziario/riepilogo', '/finanziario/riepilogo?os=SO4&azione=1');
    expect(await screen.findByText('Verifica dei filtri in corso…')).toBeTruthy();
    expect(lette).toEqual([]);
    rilascia();
    await screen.findByRole('table', { name: TABELLA });
    expect(lette).toEqual(['?os=SO4']);
    expect(screen.getByText(/non applicato: il legame con le azioni portanti viene da una fonte non attiva/)).toBeTruthy();
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

describe("RA003: drill-down dal riepilogo all'elenco operativo", () => {
  it("celle Domande presentate e Pagamenti al netto: elenco delle domande e righe di pagamento (lordi) dell'intervento", async () => {
    server.use(http.get('*/api/finanziario/riepilogo', () => HttpResponse.json(RIEPILOGO)));
    renderPagina(Pagina, '/finanziario/riepilogo', '/finanziario/riepilogo?os=OS4');
    const tabella = await screen.findByRole('table', { name: TABELLA });
    expect(within(tabella).getByRole('link', { name: "Apri nell'elenco operativo le domande presentate dell'intervento SRA01" }).getAttribute('href')).toBe(
      '/elenco-operativo/domande?presentata=true&intervento=SRA01',
    );
    const pagamenti = within(tabella).getByRole('link', { name: "righe di pagamento, importi lordi: apri nell'elenco operativo le righe di pagamento dell'intervento SRA01" });
    expect(pagamenti.getAttribute('href')).toBe('/elenco-operativo/pagamenti?esito=PAGATA&intervento=SRA01');
    expect(screen.getByText(/i recuperi sono nella scheda di ogni domanda\.$/)).toBeTruthy();
    // la riga dell'Assistenza tecnica (piede) non ha link
    const piede = within(tabella).getByRole('rowheader', { name: /Dotazione assistenza tecnica/ }).closest('tr');
    expect(piede && within(piede).queryByRole('link')).toBeNull();
  });
  it("il link dentro la riga non apre l'anteprima; dall'anteprima i due link dell'intervento", async () => {
    server.use(http.get('*/api/finanziario/riepilogo', () => HttpResponse.json(RIEPILOGO)));
    const { router } = renderPagina(Pagina, '/finanziario/riepilogo');
    const tabella = await screen.findByRole('table', { name: TABELLA });
    await userEvent.click(within(tabella).getByRole('link', { name: "Apri nell'elenco operativo le domande presentate dell'intervento SRA01" }));
    await waitFor(() => expect(router.state.location.pathname).toBe('/elenco-operativo/domande'));
    expect(screen.queryByRole('dialog')).toBeNull();
  });
  it("dall'anteprima: domande presentate e righe di pagamento dell'intervento", async () => {
    server.use(http.get('*/api/finanziario/riepilogo', () => HttpResponse.json(RIEPILOGO)));
    renderPagina(Pagina, '/finanziario/riepilogo');
    const tabella = await screen.findByRole('table', { name: TABELLA });
    await userEvent.click(within(tabella).getByRole('row', { name: "Apri l'anteprima dell'intervento SRA01" }));
    const anteprima = await screen.findByRole('dialog');
    expect(within(anteprima).getByRole('link', { name: "domande presentate: apri nell'elenco operativo dell'intervento SRA01" }).getAttribute('href')).toBe(
      '/elenco-operativo/domande?presentata=true&intervento=SRA01',
    );
    expect(within(anteprima).getByRole('link', { name: /^righe di pagamento, importi lordi: / }).getAttribute('href')).toBe('/elenco-operativo/pagamenti?esito=PAGATA&intervento=SRA01');
  });
  it("anteprima: con il focus su un link Esc chiude il pannello e Tab resta nel pannello (focus trap)", async () => {
    server.use(http.get('*/api/finanziario/riepilogo', () => HttpResponse.json(RIEPILOGO)));
    renderPagina(Pagina, '/finanziario/riepilogo');
    const tabella = await screen.findByRole('table', { name: TABELLA });
    await userEvent.click(within(tabella).getByRole('row', { name: "Apri l'anteprima dell'intervento SRA01" }));
    let anteprima = await screen.findByRole('dialog');
    const ultimo = within(anteprima).getByRole('link', { name: /^righe di pagamento, importi lordi: / });
    ultimo.focus();
    await userEvent.tab();
    expect(anteprima.contains(document.activeElement)).toBe(true);
    within(anteprima).getByRole('link', { name: "domande presentate: apri nell'elenco operativo dell'intervento SRA01" }).focus();
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    // riaperta: Esc funziona anche dall'ultimo link
    await userEvent.click(within(tabella).getByRole('row', { name: "Apri l'anteprima dell'intervento SRA01" }));
    anteprima = await screen.findByRole('dialog');
    within(anteprima).getByRole('link', { name: /^righe di pagamento, importi lordi: / }).focus();
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });
  it("Invio sul link annidato nella riga naviga senza aprire l'anteprima; Invio sulla riga la apre ancora", async () => {
    server.use(http.get('*/api/finanziario/riepilogo', () => HttpResponse.json(RIEPILOGO)));
    const { router } = renderPagina(Pagina, '/finanziario/riepilogo');
    const tabella = await screen.findByRole('table', { name: TABELLA });
    within(tabella).getByRole('row', { name: "Apri l'anteprima dell'intervento SRA01" }).focus();
    await userEvent.keyboard('{Enter}');
    expect(await screen.findByRole('dialog')).toBeTruthy();
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    within(tabella).getByRole('link', { name: "Apri nell'elenco operativo le domande presentate dell'intervento SRA01" }).focus();
    await userEvent.keyboard('{Enter}');
    await waitFor(() => expect(router.state.location.pathname).toBe('/elenco-operativo/domande'));
    expect(router.state.location.search).toBe('?presentata=true&intervento=SRA01');
    expect(screen.queryByRole('dialog')).toBeNull();
  });
  it('col solo grant delle domande (TX-0056 senza TX-0059): resta il link delle domande, spariscono quello dei pagamenti e la nota sui lordi', async () => {
    server.use(
      http.get('*/api/finanziario/riepilogo', () => HttpResponse.json(RIEPILOGO)),
      http.get('*/auth/status', () => HttpResponse.json({ authenticated: true, user: { username: 'U', roles: ['csr.tx-0001.read', 'csr.tx-0002.read', 'csr.tx-0008.read', 'csr.tx-0009.read', 'csr.tx-0010.read', 'csr.tx-0011.read', 'csr.tx-0012.read', 'csr.tx-0013.read', 'csr.tx-0056.read'] } })),
    );
    renderPagina(Pagina, '/finanziario/riepilogo');
    const tabella = await screen.findByRole('table', { name: TABELLA });
    expect(within(tabella).getByRole('link', { name: "Apri nell'elenco operativo le domande presentate dell'intervento SRA01" })).toBeTruthy();
    expect(within(tabella).queryByRole('link', { name: /^righe di pagamento, importi lordi: / })).toBeNull();
    expect(screen.queryByText(/i recuperi sono nella scheda di ogni domanda\.$/)).toBeNull();
  });
  it("senza i grant dell'elenco nessun link", async () => {
    server.use(
      http.get('*/api/finanziario/riepilogo', () => HttpResponse.json(RIEPILOGO)),
      http.get('*/auth/status', () => HttpResponse.json({ authenticated: true, user: { username: 'U', roles: ['csr.tx-0001.read', 'csr.tx-0002.read', 'csr.tx-0008.read', 'csr.tx-0009.read', 'csr.tx-0010.read', 'csr.tx-0011.read', 'csr.tx-0012.read', 'csr.tx-0013.read'] } })),
    );
    renderPagina(Pagina, '/finanziario/riepilogo');
    const tabella = await screen.findByRole('table', { name: TABELLA });
    expect(within(tabella).queryByRole('link')).toBeNull();
  });
});
