import { describe, expect, it } from 'vitest';
import { act, fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { server } from '../../../shared/api/mock/server';
import { expectNoA11yViolations } from '../../../shared/testing/axe';
import { DOMANDE_PER_ANNO, FILTRI, RIEPILOGO } from '../../../features/finanziario/testing/fixture';
import { tabellaDelRiepilogo } from '../../../features/finanziario/testing/riepilogo';
import { graficoDi, trovaCard } from '../../../shared/testing/card-grafico';
import { clicSulDato } from '../../../shared/testing/grafico-finto';
import { renderPagina } from '../../../shared/testing/render-pagina';
import { renderConQuery } from '../../../shared/testing/render';
import PaginaDettaglio from '../interventi/page';
import Pagina from './page';

const TABELLA = /^Riepilogo per intervento \(RF011\): 2 righe\./;

/** 12 interventi SRB01..SRB12 (due pagine con la ricerca «SRB») piu' SRA01. */
const RIEPILOGO_LUNGO = {
  ...RIEPILOGO,
  righe: [RIEPILOGO.righe[0], ...Array.from({ length: 12 }, (_, i) => ({ ...RIEPILOGO.righe[1], codiceIntervento: `SRB${String(i + 1).padStart(2, '0')}` }))],
};

const righeDi = (tabella: HTMLElement) =>
  within(tabella)
    .getAllByRole('rowheader')
    .map((c) => c.textContent)
    .filter((t) => t?.startsWith('SR'));

/** Riepilogo e dettaglio dell'intervento nello stesso router (il ritorno dal dettaglio al riepilogo). */
function renderRiepilogoEDettaglio(indirizzo: string) {
  const router = createMemoryRouter(
    [
      { path: '/finanziario/riepilogo', Component: Pagina },
      { path: '/finanziario/interventi/:codice', Component: PaginaDettaglio },
      { path: '*', Component: () => <p>altra pagina</p> },
    ],
    { initialEntries: [indirizzo] },
  );
  return { ...renderConQuery(<RouterProvider router={router} />), router };
}

describe('RF011: tabella di riepilogo per intervento con i nove campi finanziari', () => {
  it('senza una scelta salvata il riepilogo parte dal grafico, come ogni card (19/10/2026)', async () => {
    server.use(http.get('*/api/finanziario/riepilogo', () => HttpResponse.json(RIEPILOGO)));
    renderPagina(Pagina, '/finanziario/riepilogo');
    const gruppo = await screen.findByRole('group', { name: 'Vista del riepilogo' });
    expect(within(gruppo).getByRole('button', { name: 'Grafico' }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.queryByRole('table', { name: TABELLA })).toBeNull();
    // review delta 21/10 X3-b: Grafico | Tabella, nello stesso ordine dell'interruttore della card
    const card = await trovaCard('Dotazione e pagamenti per intervento');
    const ordine = (g: HTMLElement) => within(g).getAllByRole('button').map((b) => b.textContent);
    expect(ordine(gruppo)).toEqual(['Grafico', 'Tabella']);
    expect(ordine(within(card).getByRole('group', { name: 'Vista di Dotazione e pagamenti per intervento' }))).toEqual(['Grafico', 'Tabella']);
    // review delta 21/10 V6: il sottotitolo descrive la vista iniziale, non la tabella
    expect(screen.getByText("Grafico per intervento: clic su una barra per il dettaglio; nella vista Tabella cerca, ordina, scegli le colonne e apri l'anteprima.")).toBeTruthy();
  });

  it('una riga per intervento con i nove campi, le assenze spiegate, totali e Assistenza tecnica nel piede', async () => {
    server.use(http.get('*/api/finanziario/riepilogo', () => HttpResponse.json(RIEPILOGO)));
    renderPagina(Pagina, '/finanziario/riepilogo');
    const tabella = await tabellaDelRiepilogo(TABELLA);
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
    await tabellaDelRiepilogo(TABELLA);
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
    await tabellaDelRiepilogo(TABELLA);
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

  // review delta 21/10 V5: la pagina com'e' all'apertura (vista Grafico, interruttore di pagina e card del grafico)
  it('nessuna violazione axe sulla pagina appena aperta, nella vista Grafico', async () => {
    server.use(http.get('*/api/finanziario/riepilogo', () => HttpResponse.json(RIEPILOGO)));
    const { container } = renderPagina(Pagina, '/finanziario/riepilogo');
    const card = await trovaCard('Dotazione e pagamenti per intervento');
    expect(graficoDi(card)).toBeTruthy();
    expect(within(screen.getByRole('group', { name: 'Vista del riepilogo' })).getByRole('button', { name: 'Grafico' }).getAttribute('aria-pressed')).toBe('true');
    await expectNoA11yViolations(container);
  });

  it('nessuna violazione axe, anche con l anteprima aperta', async () => {
    server.use(http.get('*/api/finanziario/riepilogo', () => HttpResponse.json(RIEPILOGO)));
    const { container } = renderPagina(Pagina, '/finanziario/riepilogo');
    await tabellaDelRiepilogo(TABELLA);
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
    await tabellaDelRiepilogo(/^Riepilogo per intervento/);
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
    const tabella = await tabellaDelRiepilogo(TABELLA);
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
  // review v4 X-01: la navigazione e' intercettata, cosi' la pagina resta montata e si vede davvero se il clic sul link ha
  // aperto anche l'anteprima (dopo una navigazione vera la pagina e il pannello sono smontati e il test non proverebbe nulla)
  it("il link dentro la riga non apre l'anteprima (clic, Ctrl+clic, Invio); una cella senza link la apre ancora", async () => {
    server.use(http.get('*/api/finanziario/riepilogo', () => HttpResponse.json(RIEPILOGO)));
    const { router } = renderPagina(Pagina, '/finanziario/riepilogo');
    const tabella = await tabellaDelRiepilogo(TABELLA);
    const link = within(tabella).getByRole('link', { name: "Apri nell'elenco operativo le domande presentate dell'intervento SRA01" });
    link.addEventListener('click', (e) => e.preventDefault(), { capture: true });
    const nessunaAnteprima = () => expect(screen.findByRole('dialog', {}, { timeout: 200 })).rejects.toThrow();
    await userEvent.click(link);
    await nessunaAnteprima();
    // Ctrl+clic vero (review v4 iter3 A-01): con le API dirette di user-event Ctrl non resta premuto fra due chiamate
    let conCtrl = false;
    link.addEventListener('click', (e) => (conCtrl = e.ctrlKey), { capture: true });
    fireEvent.click(link, { ctrlKey: true });
    expect(conCtrl).toBe(true);
    await nessunaAnteprima();
    link.focus();
    await userEvent.keyboard('{Enter}');
    await nessunaAnteprima();
    expect(router.state.location.pathname).toBe('/finanziario/riepilogo');
    await userEvent.click(within(tabella).getByRole('rowheader', { name: 'SRA01' }));
    expect(await screen.findByRole('dialog', { name: 'SRA01' })).toBeTruthy();
  });
  it("dall'anteprima: domande presentate e righe di pagamento dell'intervento", async () => {
    server.use(http.get('*/api/finanziario/riepilogo', () => HttpResponse.json(RIEPILOGO)));
    renderPagina(Pagina, '/finanziario/riepilogo');
    const tabella = await tabellaDelRiepilogo(TABELLA);
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
    const tabella = await tabellaDelRiepilogo(TABELLA);
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
  it("Invio sulla riga apre l'anteprima; Invio sul link annidato naviga all'elenco con la sua query", async () => {
    server.use(http.get('*/api/finanziario/riepilogo', () => HttpResponse.json(RIEPILOGO)));
    const { router } = renderPagina(Pagina, '/finanziario/riepilogo');
    const tabella = await tabellaDelRiepilogo(TABELLA);
    within(tabella).getByRole('row', { name: "Apri l'anteprima dell'intervento SRA01" }).focus();
    await userEvent.keyboard('{Enter}');
    expect(await screen.findByRole('dialog')).toBeTruthy();
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    within(tabella).getByRole('link', { name: "Apri nell'elenco operativo le domande presentate dell'intervento SRA01" }).focus();
    await userEvent.keyboard('{Enter}');
    await waitFor(() => expect(router.state.location.pathname).toBe('/elenco-operativo/domande'));
    expect(router.state.location.search).toBe('?presentata=true&intervento=SRA01');
  });
  it('col solo grant delle domande (TX-0056 senza TX-0059): resta il link delle domande, spariscono quello dei pagamenti e la nota sui lordi', async () => {
    server.use(
      http.get('*/api/finanziario/riepilogo', () => HttpResponse.json(RIEPILOGO)),
      http.get('*/auth/status', () => HttpResponse.json({ authenticated: true, user: { username: 'U', roles: ['csr.tx-0001.read', 'csr.tx-0002.read', 'csr.tx-0008.read', 'csr.tx-0009.read', 'csr.tx-0010.read', 'csr.tx-0011.read', 'csr.tx-0012.read', 'csr.tx-0013.read', 'csr.tx-0056.read'] } })),
    );
    renderPagina(Pagina, '/finanziario/riepilogo');
    const tabella = await tabellaDelRiepilogo(TABELLA);
    expect(within(tabella).getByRole('link', { name: "Apri nell'elenco operativo le domande presentate dell'intervento SRA01" })).toBeTruthy();
    expect(within(tabella).queryByRole('link', { name: /^righe di pagamento, importi lordi: / })).toBeNull();
    expect(screen.queryByText(/i recuperi sono nella scheda di ogni domanda\.$/)).toBeNull();
  });
  it("tornando indietro dall'elenco operativo l'ordinamento della tabella e' quello scelto", async () => {
    server.use(http.get('*/api/finanziario/riepilogo', () => HttpResponse.json(RIEPILOGO)));
    const { router } = renderPagina(Pagina, '/finanziario/riepilogo');
    let tabella = await tabellaDelRiepilogo(TABELLA);
    await userEvent.click(within(within(tabella).getByRole('columnheader', { name: /^Intervento/ })).getByRole('button'));
    const verso = within(tabella).getByRole('columnheader', { name: /^Intervento/ }).getAttribute('aria-sort');
    expect(verso).not.toBe('none');
    await userEvent.click(within(tabella).getByRole('link', { name: "Apri nell'elenco operativo le domande presentate dell'intervento SRA01" }));
    await waitFor(() => expect(router.state.location.pathname).toBe('/elenco-operativo/domande'));
    await act(() => router.navigate(-1));
    tabella = await tabellaDelRiepilogo(TABELLA);
    expect(within(tabella).getByRole('columnheader', { name: /^Intervento/ }).getAttribute('aria-sort')).toBe(verso);
  });
  // review v4 V-03: la pagina vale per la sua ricerca; tornando indietro si ritrovano ricerca, pagina e quindi le stesse righe
  it("tornando indietro dall'elenco operativo ricerca e pagina sono quelle lasciate (stesse righe)", async () => {
    server.use(http.get('*/api/finanziario/riepilogo', () => HttpResponse.json(RIEPILOGO_LUNGO)));
    const { router } = renderPagina(Pagina, '/finanziario/riepilogo');
    await tabellaDelRiepilogo(/^Riepilogo per intervento \(RF011\): 13 righe\./);
    await userEvent.type(screen.getByRole('searchbox', { name: 'Cerca nella tabella' }), 'SRB');
    await userEvent.click(screen.getByRole('button', { name: 'Pagina 2' }));
    let tabella = screen.getByRole('table', { name: /^Riepilogo per intervento \(RF011\): 12 righe per «SRB»\./ });
    const righe = righeDi(tabella);
    expect(righe).toEqual(['SRB11', 'SRB12']);
    await userEvent.click(within(tabella).getByRole('link', { name: "Apri nell'elenco operativo le domande presentate dell'intervento SRB11" }));
    await waitFor(() => expect(router.state.location.pathname).toBe('/elenco-operativo/domande'));
    await act(() => router.navigate(-1));
    tabella = await screen.findByRole('table', { name: /^Riepilogo per intervento \(RF011\): 12 righe per «SRB»\./ });
    expect((screen.getByRole('searchbox', { name: 'Cerca nella tabella' }) as HTMLInputElement).value).toBe('SRB');
    expect(righeDi(tabella)).toEqual(righe);
  });
  // review v4 X-04: "Torna al riepilogo" e la briciola ritrovano ricerca, ordine e pagina, anche da tastiera; nel dettaglio
  // si cambiano scheda e vista prima di tornare, perche' lo stato del riepilogo deve sopravvivere alle navigazioni interne
  // (review v4 iter3 H-01)
  it('dal dettaglio "Torna al riepilogo" e la briciola ritrovano ricerca, ordine e pagina del riepilogo (da tastiera)', async () => {
    server.use(
      http.get('*/api/finanziario/riepilogo', () => HttpResponse.json(RIEPILOGO_LUNGO)),
      http.get('*/api/finanziario/filtri', () => HttpResponse.json(FILTRI)),
      http.get('*/api/finanziario/domande-per-anno', () => HttpResponse.json(DOMANDE_PER_ANNO)),
    );
    const { router } = renderRiepilogoEDettaglio('/finanziario/riepilogo?os=OS4');
    await tabellaDelRiepilogo(/^Riepilogo per intervento \(RF011\): 13 righe\./);
    await userEvent.type(screen.getByRole('searchbox', { name: 'Cerca nella tabella' }), 'SRB');
    const ordina = () => within(screen.getByRole('columnheader', { name: /^Intervento/ })).getByRole('button');
    // decrescente sul codice, cosi' l'ordine non e' quello iniziale (per dotazione)
    await userEvent.click(ordina());
    if (screen.getByRole('columnheader', { name: /^Intervento/ }).getAttribute('aria-sort') !== 'descending') await userEvent.click(ordina());
    const verso = screen.getByRole('columnheader', { name: /^Intervento/ }).getAttribute('aria-sort');
    expect(verso).toBe('descending');
    screen.getByRole('button', { name: 'Pagina 2' }).focus();
    await userEvent.keyboard('{Enter}');
    const prima = righeDi(screen.getByRole('table', { name: /12 righe per «SRB»/ }));
    expect(prima).toEqual(['SRB02', 'SRB01']);
    const apriDettaglio = async () => {
      screen.getByRole('row', { name: "Apri l'anteprima dell'intervento SRB02" }).focus();
      await userEvent.keyboard('{Enter}');
      within(await screen.findByRole('dialog', { name: 'SRB02' })).getByRole('link', { name: "Apri il dettaglio dell'intervento" }).focus();
      await userEvent.keyboard('{Enter}');
      await waitFor(() => expect(router.state.location.pathname).toBe('/finanziario/interventi/SRB02'));
      // navigazioni interne del dettaglio: scheda Domande e vista Tabella di Domande per anno
      await userEvent.click(await screen.findByRole('tab', { name: 'Domande' }));
      const card = await trovaCard('Domande per anno di raccolta');
      await userEvent.click(within(within(card).getByRole('group', { name: 'Vista di Domande per anno di raccolta' })).getByRole('button', { name: 'Tabella' }));
      await waitFor(() => expect(router.state.location.search).toContain('scheda=domande'));
    };
    const ritrovato = async () => {
      await waitFor(() => expect(router.state.location.pathname).toBe('/finanziario/riepilogo'));
      expect(router.state.location.search).toBe('?os=OS4');
      const tabella = await screen.findByRole('table', { name: /12 righe per «SRB»/ });
      expect((screen.getByRole('searchbox', { name: 'Cerca nella tabella' }) as HTMLInputElement).value).toBe('SRB');
      expect(within(tabella).getByRole('columnheader', { name: /^Intervento/ }).getAttribute('aria-sort')).toBe(verso);
      expect(righeDi(tabella)).toEqual(prima);
    };
    await apriDettaglio();
    (await screen.findAllByRole('link', { name: 'Torna al riepilogo' }))[0].focus();
    await userEvent.keyboard('{Enter}');
    await ritrovato();
    await apriDettaglio();
    within(screen.getByRole('navigation', { name: 'Percorso' })).getByRole('link', { name: 'Riepilogo per intervento' }).focus();
    await userEvent.keyboard('{Enter}');
    await ritrovato();
  });
  // review v4 iter3 X-01: aprendo il dettaglio dal grafico si torna sulla vista Grafico
  it('dal dettaglio aperto dal grafico "Torna al riepilogo" ritrova la vista Grafico', async () => {
    server.use(http.get('*/api/finanziario/riepilogo', () => HttpResponse.json(RIEPILOGO)), http.get('*/api/finanziario/filtri', () => HttpResponse.json(FILTRI)));
    const { router } = renderRiepilogoEDettaglio('/finanziario/riepilogo');
    await tabellaDelRiepilogo(TABELLA);
    const vistaRiepilogo = () => within(screen.getByRole('group', { name: 'Vista del riepilogo' }));
    await userEvent.click(vistaRiepilogo().getByRole('button', { name: 'Grafico' }));
    const grafico = graficoDi(await trovaCard('Dotazione e pagamenti per intervento'));
    expect(grafico).toBeTruthy();
    clicSulDato(grafico!, 0, 0);
    await waitFor(() => expect(router.state.location.pathname).toBe('/finanziario/interventi/SRA01'));
    (await screen.findAllByRole('link', { name: 'Torna al riepilogo' }))[0].focus();
    await userEvent.keyboard('{Enter}');
    await waitFor(() => expect(router.state.location.pathname).toBe('/finanziario/riepilogo'));
    await screen.findByRole('group', { name: 'Vista del riepilogo' });
    expect(vistaRiepilogo().getByRole('button', { name: 'Grafico' }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.queryByRole('table', { name: TABELLA })).toBeNull();
  });
  it("senza i grant dell'elenco nessun link", async () => {
    server.use(
      http.get('*/api/finanziario/riepilogo', () => HttpResponse.json(RIEPILOGO)),
      http.get('*/auth/status', () => HttpResponse.json({ authenticated: true, user: { username: 'U', roles: ['csr.tx-0001.read', 'csr.tx-0002.read', 'csr.tx-0008.read', 'csr.tx-0009.read', 'csr.tx-0010.read', 'csr.tx-0011.read', 'csr.tx-0012.read', 'csr.tx-0013.read'] } })),
    );
    renderPagina(Pagina, '/finanziario/riepilogo');
    const tabella = await tabellaDelRiepilogo(TABELLA);
    expect(within(tabella).queryByRole('link')).toBeNull();
  });
});
