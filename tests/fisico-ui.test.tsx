// Test dei componenti del fisico (green-fe step5): un test L2 per componente (render su MSW, ruoli e stati accessibili) e
// un test a11y con axe-core diretto. Dal 29/10/2026 anche l'output regionale e le Unit Amount; dal 30/10/2026 il dettaglio
// dell'intervento (flusso intervento) e i link dei drawer verso di lui. Le determine di una domanda sono del procedurale. ECharts e' il grafico finto di src/shared/test/setup.ts (jsdom non disegna). Le
// letture sono dichiarate da ogni test (il server dei test non monta i mock generati del fisico e dell'elenco).
import type { ReactElement } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { createMemoryRouter, RouterProvider, useParams } from 'react-router';
import { server } from '../src/shared/api/mock/server';
import { expectNoA11yViolations } from '../src/shared/testing/axe';
import { graficoDi, tabellaDi, trovaCard } from '../src/shared/testing/card-grafico';
import { clicSulCodice, clicSulDato } from '../src/shared/testing/grafico-finto';
import { problema } from '../src/shared/testing/msw';
import { renderPagina } from '../src/shared/testing/render-pagina';
import { renderConQuery } from '../src/shared/testing/render';
import { DettaglioIntervento, OutputRegionale, SuperficiAmmissibili, UnitAmount } from '../src/features/fisico';
import { OUTPUT, SRA01_OUTPUT, SUPERFICI, VALORI, superficiPer } from '../src/features/fisico/testing/fixture';
import { lettureFisico } from '../src/features/fisico/testing/letture';
import { AnteprimaOutput } from '../src/features/fisico/ui/AnteprimaOutput';
import { TabellaOutput } from '../src/features/fisico/ui/TabellaOutput';
import type { SuperficieAmmissibile } from '../src/features/fisico/api';

const testo = (s: string | null | undefined) => (s ?? '').replace(/\s/g, ' ');

/** TX-0018 risponde come il backend ai criteri della query (review V2); TX-0060 coi valori, oppure in errore (null). */
function serviSuperfici(corpo: SuperficieAmmissibile = SUPERFICI, valori: object | null = VALORI) {
  const lette: string[] = [];
  server.use(
    http.get('*/api/fisico/superficie-ammissibile', ({ request }) => {
      const u = new URL(request.url);
      lette.push(u.search);
      return HttpResponse.json(superficiPer(corpo, u.searchParams));
    }),
    http.get('*/api/elenco-operativo/filtri', () => (valori ? HttpResponse.json(valori) : HttpResponse.json(problema(503, 'CAPACITA_ESAURITA'), { status: 503 }))),
  );
  return lette;
}

function inRouter(ui: ReactElement) {
  const router = createMemoryRouter([{ path: '*', element: ui }], { initialEntries: ['/'] });
  return { ...render(<RouterProvider router={router} />), router };
}

/** Un componente che legge il profilo (useAuthStatus) in un router, con il QueryClient dei test. */
function inRouterConQuery(ui: ReactElement) {
  const router = createMemoryRouter([{ path: '*', element: ui }], { initialEntries: ['/'] });
  return { ...renderConQuery(<RouterProvider router={router} />), router };
}

const profilo = (roles: string[]) => server.use(http.get('*/auth/status', () => HttpResponse.json({ authenticated: true, user: { username: 'U', profile: 'p3-funzionario-area-fis', roles } })));

describe('SuperficiAmmissibili (pagina delle superfici, componente)', () => {
  it('barra coi chip e le pill, KPI della campagna di riferimento, tre card grafico e nessuna violazione axe', async () => {
    serviSuperfici();
    const { container } = renderPagina(SuperficiAmmissibili, '/fisico/superfici', '/fisico/superfici?intervento=SRB01');
    expect(await screen.findByRole('heading', { level: 2, name: 'Totali della campagna 2025' })).toBeTruthy();
    const barra = screen.getByRole('region', { name: 'Filtri attivi' });
    expect(within(barra).getByRole('button', { name: 'Togli il filtro Intervento SRB01' })).toBeTruthy();
    expect(within(barra).getByText('Perimetro: regionale')).toBeTruthy();
    expect(within(barra).getByRole('button', { name: /^Ultimo dato sincronizzato: dati al 02\/03\/2026 per tutti i flussi/ })).toBeTruthy();
    const ds = screen.getByRole('region', { name: 'Superficie ammissibile DS: superficie delle domande di sostegno, campagna 2025' });
    expect(testo(ds.textContent)).toContain('15,50 ha');
    expect(testo(ds.textContent)).toContain('2 domande di sostegno');
    expect(testo(screen.getByRole('region', { name: /^Domande con DP oltre la DS/ }).textContent)).toContain('su 3 domande di pagamento: 33,3 %');
    await trovaCard('Superficie DS e DP per intervento, campagna 2025');
    await trovaCard('Superficie DS e DP per campagna');
    await trovaCard('Verifica incrociata: differenza DP - DS per intervento, campagna 2025');
    await expectNoA11yViolations(container);
  });

  it('vista Tabella: una riga per intervento e campagna, un totale per campagna, nessuna violazione axe', async () => {
    serviSuperfici();
    const { container } = renderPagina(SuperficiAmmissibili, '/fisico/superfici');
    const gruppo = await screen.findByRole('group', { name: 'Vista delle superfici' });
    await userEvent.click(within(gruppo).getByRole('button', { name: 'Tabella' }));
    const tabella = screen.getByRole('table', { name: /^Superficie ammissibile DS e DP per intervento e campagna/ });
    const intestazioni = within(tabella).getAllByRole('rowheader').map((c) => c.textContent);
    // ordine del wireframe approvato: dalla campagna piu' recente, l'intervento senza superfici in fondo (X3)
    expect(intestazioni).toEqual(['SRB01', 'SRB01', 'SRA29', 'Totale campagna 2025 (1 intervento con superfici)', 'Totale campagna 2024 (1 intervento con superfici)']);
    const campagne = within(tabella).getAllByRole('rowgroup')[1].querySelectorAll('tr');
    expect(Array.from(campagne).map((r) => r.querySelectorAll('td')[0]?.textContent)).toEqual(['2025', '2024', 'nessuna superficie in nessuna campagna (non valorizzato: intervento non a superficie o non SIGC)']);
    expect(within(tabella).getByRole('button', { name: /^Campagna/ }).closest('th')?.getAttribute('aria-sort')).toBe('descending');
    expect(tabella.textContent).toContain('nessuna superficie in nessuna campagna (non valorizzato: intervento non a superficie o non SIGC)');
    expect(within(screen.getByRole('group', { name: 'Scarica la tabella Superfici per intervento e campagna' })).getAllByRole('button').map((b) => b.textContent)).toEqual(['CSV', 'XLSX']);
    await expectNoA11yViolations(container);
  });
});

describe('PannelloFiltriSuperfici (componente)', () => {
  it('voci di TX-0060 e campagne della risposta; Applica porta i criteri nell indirizzo; nessuna violazione axe', async () => {
    serviSuperfici();
    const { router } = renderPagina(SuperficiAmmissibili, '/fisico/superfici');
    await screen.findByRole('heading', { level: 2, name: 'Totali della campagna 2025' });
    await userEvent.click(screen.getByRole('button', { name: /^Filtri/ }));
    const pannello = await screen.findByRole('dialog', { name: 'Filtri delle superfici ammissibili' });
    await userEvent.click(within(pannello).getByRole('checkbox', { name: 'SRB01 Sostegno zone con svantaggi naturali montagna' }));
    const campagna = within(pannello).getByRole('group', { name: 'Campagna' });
    expect(within(campagna).getAllByRole('button').map((b) => b.textContent)).toEqual(['Tutte le campagne', '2025', '2024']);
    await userEvent.click(within(campagna).getByRole('button', { name: '2024' }));
    await expectNoA11yViolations(pannello);
    await userEvent.click(within(pannello).getByRole('button', { name: 'Applica i filtri' }));
    await waitFor(() => expect(router.state.location.search).toBe('?intervento=SRB01&campagna=2024'));
  });

  it('senza i valori di TX-0060 (in errore) lo dice in testo e propone i codici della risposta', async () => {
    serviSuperfici(SUPERFICI, null);
    renderPagina(SuperficiAmmissibili, '/fisico/superfici');
    await screen.findByRole('heading', { level: 2, name: 'Totali della campagna 2025' });
    await userEvent.click(screen.getByRole('button', { name: /^Filtri/ }));
    const pannello = await screen.findByRole('dialog', { name: 'Filtri delle superfici ammissibili' });
    expect(within(pannello).getByRole('status').textContent).toMatch(/^Valori dei filtri non disponibili/);
    expect(within(pannello).getByRole('checkbox', { name: 'SRA29' })).toBeTruthy();
    expect(within(pannello).getByRole('checkbox', { name: 'SRB01' })).toBeTruthy();
  });

  it('senza i valori di TX-0060 e senza righe nella risposta il gruppo Intervento dice che i valori mancano, non una ricerca (X4)', async () => {
    serviSuperfici({ ...SUPERFICI, righe: [] }, null);
    renderPagina(SuperficiAmmissibili, '/fisico/superfici', '/fisico/superfici?intervento=SRB09');
    await userEvent.click(await screen.findByRole('button', { name: 'Modifica i filtri' }));
    const pannello = await screen.findByRole('dialog', { name: 'Filtri delle superfici ammissibili' });
    const intervento = within(pannello).getByText('Intervento', { selector: 'summary' }).closest('details');
    if (!intervento) throw new Error('gruppo Intervento assente');
    expect(intervento.textContent).toContain('Nessuna voce: valori dei filtri non disponibili.');
    expect(within(pannello).queryByText('Nessuna voce corrisponde alla ricerca.')).toBeNull();
    expect(within(intervento).queryAllByRole('checkbox')).toHaveLength(0);
  });
});

describe('AnteprimaIntervento (componente)', () => {
  it('il clic su una barra apre l anteprima con la descrizione di TX-0060; Mostra solo mette il filtro; nessuna violazione axe', async () => {
    serviSuperfici();
    const { router } = renderPagina(SuperficiAmmissibili, '/fisico/superfici');
    const card = await trovaCard('Superficie DS e DP per intervento, campagna 2025');
    const grafico = graficoDi(card);
    expect(grafico).toBeDefined();
    if (grafico) clicSulDato(grafico, 0, 0);
    const anteprima = await screen.findByRole('dialog', { name: 'SRB01' });
    expect(anteprima.textContent).toContain('SRB01 - Sostegno zone con svantaggi naturali montagna');
    expect(testo(anteprima.textContent)).toContain('Superficie DS, campagna 202515,50 ha');
    expect(anteprima.textContent).toContain('fonte quantità richiesta a premio non attiva');
    // link dettaglio-intervento-superfici (30/10/2026): il dettaglio dell'intervento del fisico
    expect((await within(anteprima).findByRole('link', { name: "Apri il dettaglio dell'intervento" })).getAttribute('href')).toBe('/fisico/interventi/SRB01');
    await expectNoA11yViolations(anteprima);
    await userEvent.click(within(anteprima).getByRole('button', { name: 'Mostra solo SRB01' }));
    await waitFor(() => expect(router.state.location.search).toBe('?intervento=SRB01'));
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'SRB01' })).toBeNull());
  });
});

describe('TabellaSuperfici (componente)', () => {
  it('la riga apre l anteprima dell intervento (clic o Invio)', async () => {
    serviSuperfici();
    renderPagina(SuperficiAmmissibili, '/fisico/superfici');
    await userEvent.click(within(await screen.findByRole('group', { name: 'Vista delle superfici' })).getByRole('button', { name: 'Tabella' }));
    const riga = screen.getByRole('row', { name: "Apri l'anteprima dell'intervento SRB01, campagna 2024" });
    riga.focus();
    await userEvent.keyboard('{Enter}');
    expect(await screen.findByRole('dialog', { name: 'SRB01' })).toBeTruthy();
  });
});

// l'output regionale (dall'istituzionale) e le Unit Amount (dal procedurale) sono del fisico dal 29/10/2026: gli stessi casi
// dei test dei componenti delle aree da cui vengono
describe('OutputRegionale, TabellaOutput e AnteprimaOutput (output regionale)', () => {
  const intestazioni = (t: HTMLElement) => within(t).getAllByRole('columnheader').map((c) => c.textContent?.replace(/[▲▼↕]/g, '').trim());

  it('barra con periodo, interruttore della misura con la didascalia, anni dalla risposta; nessuna violazione axe', async () => {
    server.use(...lettureFisico().handlers);
    const { container } = renderPagina(OutputRegionale, '/fisico/output-regionale');
    const misura = await screen.findByRole('group', { name: 'Misura mostrata negli anni' });
    expect(within(screen.getByRole('region', { name: 'Filtri attivi' })).getByText('Periodo: 2023 - 2029')).toBeTruthy();
    expect(within(misura).getAllByRole('button').map((b) => [b.textContent, b.getAttribute('aria-pressed')])).toEqual([
      ['Programmato', 'true'],
      ['Realizzato SIGC', 'false'],
      ['Realizzato non SIGC (cumulativo)', 'false'],
    ]);
    const tabella = screen.getByRole('table', { name: /^Output programmato per anno/ });
    expect(intestazioni(tabella)).toEqual(['Intervento', 'Indicatore di output', 'Unità di misura', 'Target di fine periodo', 'Anno del target', '2023', '2024', '2025', '2026', '2027', '2028', '2029']);
    const sra01 = within(tabella).getByRole('row', { name: "Apri l'anteprima dell'intervento SRA01" });
    expect(testo(sra01.textContent)).toContain('1500 ettari');
    expect(testo(sra01.textContent)).toContain('500 ettari');
    await userEvent.click(within(misura).getByRole('button', { name: 'Realizzato SIGC' }));
    expect(screen.getByRole('table', { name: /^Output realizzato SIGC per anno/ })).toBeTruthy();
    expect(document.activeElement).toBe(within(misura).getByRole('button', { name: 'Realizzato SIGC' }));
    await expectNoA11yViolations(container);
  });

  it('TabellaOutput: indicatore, unita, target e anno del target assenti in badge, mai uno zero', () => {
    inRouter(<TabellaOutput d={OUTPUT} misura="realizzatoNonSigc" scaricamenti={[]} onRiga={() => undefined} />);
    const srg01 = screen.getByRole('row', { name: "Apri l'anteprima dell'intervento SRG01" });
    expect(testo(srg01.textContent)).toContain('non valorizzatonessun target');
    expect(within(srg01).getAllByText('non valorizzato').length).toBeGreaterThanOrEqual(4);
    const srd01 = screen.getByRole('row', { name: "Apri l'anteprima dell'intervento SRD01" });
    expect(testo(srd01.textContent)).toContain('12 numero di operazioni');
  });

  it('AnteprimaOutput: descrizione, voci, mini grafico senza PNG con la tabella equivalente e Apri il dettaglio (dettaglio-intervento-output); nessuna violazione axe', async () => {
    const onChiudi = vi.fn();
    inRouterConQuery(<AnteprimaOutput riga={SRA01_OUTPUT} cumulativo descrizione="Produzione integrata" onChiudi={onChiudi} />);
    const drawer = await screen.findByRole('dialog', { name: 'Anteprima: SRA01' });
    expect(within(drawer).getByText('SRA01 - Produzione integrata')).toBeTruthy();
    expect(testo(drawer.textContent)).toContain('O.14 (ettari)');
    expect(testo(drawer.textContent)).toContain('1500 ettari al 2029');
    const card = await trovaCard('Output di SRA01 per anno');
    expect(within(card).queryByRole('group', { name: /^Scarica/ })).toBeNull();
    expect(within(await tabellaDi(card)).getAllByRole('rowheader').map((c) => c.textContent)).toContain('Target di fine periodo');
    expect((await within(drawer).findByRole('link', { name: 'Apri il dettaglio' })).getAttribute('href')).toBe('/fisico/interventi/SRA01');
    await expectNoA11yViolations(drawer);
    await userEvent.click(within(drawer).getByRole('button', { name: 'Chiudi: Anteprima: SRA01' }));
    expect(onChiudi).toHaveBeenCalled();
  });

  it('AnteprimaOutput senza nessuno dei grant del dettaglio: niente link; senza le voci di TX-0060 il solo codice', async () => {
    profilo(['csr.tx-0060.read']);
    inRouterConQuery(<AnteprimaOutput riga={SRA01_OUTPUT} cumulativo onChiudi={() => undefined} />);
    const drawer = await screen.findByRole('dialog', { name: 'Anteprima: SRA01' });
    await trovaCard('Output di SRA01 per anno');
    expect(within(drawer).getByText('SRA01')).toBeTruthy();
    expect(within(drawer).queryByRole('link')).toBeNull();
  });
});

describe('UnitAmount, TabellaUnitAmount e l anteprima della Unit Amount', () => {
  const intestazioni = (t: HTMLElement) => within(t).getAllByRole('columnheader').map((c) => c.textContent?.replace(/[▲▼↕]/g, '').trim());

  it('la nota unica del pagato, le nove colonne in ordine di intervento, esercizio e codice; nessuna violazione axe', async () => {
    server.use(...lettureFisico().handlers);
    const { container } = renderPagina(UnitAmount, '/fisico/unit-amount');
    const tabella = await screen.findByRole('table', { name: /^Unit Amount degli interventi selezionati/ });
    expect(screen.getByText(/^Importo pagato, percentuale pagata sul richiesto e base storica: non disponibili per tutte le Unit Amount \(fonte pagato per Unit Amount non attiva\)/)).toBeTruthy();
    expect(intestazioni(tabella)).toEqual(['Intervento', 'Unit Amount', 'Gruppo colturale', 'Esercizio', 'Importo unitario', 'Output previsto', 'Importo pagato', 'Pagato sul richiesto', 'Base storica']);
    expect(within(tabella).getAllByRole('rowheader').map((c) => c.textContent)).toEqual(['UA1', 'UA2', 'UA1']);
    const ua2 = within(tabella).getByRole('row', { name: "Apri l'anteprima della Unit Amount UA2 di SRD01, esercizio 2024" });
    expect(testo(ua2.textContent)).toBe('SRD01UA2Ortive2024non valorizzatoil dato non è presente nella fonte5non disponibilenon disponibilenon disponibile');
    const card = await trovaCard('Percentuale pagata per Unit Amount');
    expect(testo(card.textContent)).toContain("Grafico non disponibile: nessuna Unit Amount ha ancora l'importo pagato (fonte pagato per Unit Amount non attiva).");
    await expectNoA11yViolations(container);
  });

  it('col pagato: il clic su una barra apre l anteprima della riga con la descrizione dell intervento; nessuna violazione axe', async () => {
    server.use(...lettureFisico({ pagato: true }).handlers);
    renderPagina(UnitAmount, '/fisico/unit-amount');
    clicSulCodice(graficoDi(await trovaCard('Percentuale pagata per Unit Amount')), 'SRD01|UA1|2024');
    const drawer = await screen.findByRole('dialog', { name: 'Anteprima: UA1 (SRD01, esercizio 2024)' });
    expect(testo(drawer.textContent)).toContain('Gruppo colturaleSeminativi');
    expect(await within(drawer).findByText('SRD01 - Investimenti produttivi agricoli per la competitività')).toBeTruthy();
    await expectNoA11yViolations(drawer);
  });

  it('la scheda Unit Amount del dettaglio compone le colonne della pagina (review FIS-08): stessi titoli e stesse celle, senza l Intervento; ogni riga della pagina si apre', async () => {
    server.use(...lettureFisico().handlers);
    const pagina = renderPagina(UnitAmount, '/fisico/unit-amount');
    const tabella = await screen.findByRole('table', { name: /^Unit Amount degli interventi selezionati/ });
    const titoliPagina = intestazioni(tabella);
    const cellePagina = within(tabella)
      .getAllByRole('row')
      .slice(1)
      .map((r) => Array.from(r.children).slice(1).map((c) => testo(c.textContent)));
    expect(within(tabella).getAllByRole('row', { name: /^Apri l'anteprima della Unit Amount / })).toHaveLength(3);
    pagina.unmount();

    server.use(...lettureFisico().handlers);
    apriDettaglio({ pathname: '/fisico/interventi/SRD01', state: { scheda: 'unitAmount' } });
    const scheda = await screen.findByRole('table', { name: /^Unit Amount dell'intervento SRD01/ });
    expect(intestazioni(scheda)).toEqual(titoliPagina.slice(1));
    expect(
      within(scheda)
        .getAllByRole('row')
        .slice(1)
        .map((r) => Array.from(r.children).map((c) => testo(c.textContent))),
    ).toEqual(cellePagina);
  });

  it("Apri il dettaglio dell'intervento (dettaglio-intervento-unit-amount): il dettaglio sulla scheda Unit Amount, con lo state della navigazione", async () => {
    server.use(...lettureFisico().handlers);
    const { router } = renderPagina(UnitAmount, '/fisico/unit-amount');
    const riga = within(await screen.findByRole('table', { name: /^Unit Amount degli interventi selezionati/ })).getByRole('row', { name: "Apri l'anteprima della Unit Amount UA1 di SRD01, esercizio 2025" });
    await userEvent.click(riga);
    const drawer = await screen.findByRole('dialog', { name: 'Anteprima: UA1 (SRD01, esercizio 2025)' });
    const link = within(drawer).getByRole('link', { name: "Apri il dettaglio dell'intervento" });
    expect(link.getAttribute('href')).toBe('/fisico/interventi/SRD01');
    await userEvent.click(link);
    await waitFor(() => expect(router.state.location.pathname).toBe('/fisico/interventi/SRD01'));
    expect(router.state.location.state).toEqual({ scheda: 'unitAmount' });
    expect(router.state.location.search).toBe('');
  });
});

/** La pagina del dettaglio nei test: il codice dal percorso, come src/pages/fisico/interventi/page.tsx. */
function PaginaDettaglio() {
  const { codice } = useParams();
  return <DettaglioIntervento codice={codice} />;
}

const apriDettaglio = (indirizzo: string | { pathname: string; state: unknown }) => {
  const router = createMemoryRouter(
    [
      { path: '/fisico/interventi/:codice', Component: PaginaDettaglio },
      { path: '*', element: <p>altra pagina</p> },
    ],
    { initialEntries: [indirizzo] },
  );
  return { ...renderConQuery(<RouterProvider router={router} />), router };
};

describe('DettaglioIntervento e SchedeIntervento (dettaglio dell intervento del fisico, flusso intervento)', () => {
  it('testata, badge, quattro KPI, tre schede; la scheda Output col grafico per anno; nessuna violazione axe', async () => {
    const { lette, handlers } = lettureFisico();
    server.use(...handlers);
    const { container } = apriDettaglio('/fisico/interventi/SRA01');
    expect(await screen.findByRole('heading', { level: 1, name: 'Produzione integrata' })).toBeTruthy();
    expect(screen.getByText('Fisico - intervento SRA01')).toBeTruthy();
    expect(within(screen.getByRole('list', { name: 'Dati principali' })).getAllByRole('listitem').map((l) => l.textContent)).toEqual(['Perimetro regionale', 'Indicatore di output O.14 (ettari)']);
    expect(testo((await screen.findByRole('region', { name: 'Target di fine periodo' })).textContent)).toContain('1500 ettari al 2029');
    expect(testo(screen.getByRole('region', { name: 'Superficie ammissibile DS, campagna 2025: superficie delle domande di sostegno' }).textContent)).toContain('10,50 ha');
    expect(screen.getAllByRole('tab').map((t) => [t.textContent, t.getAttribute('aria-selected')])).toEqual([
      ['Output per anno', 'true'],
      ['Superfici per campagna', 'false'],
      ['Unit Amount', 'false'],
    ]);
    const card = await trovaCard('Output programmato e realizzato per anno (ettari)');
    expect(within(card).getAllByRole('button', { name: /^Scarica / }).map((b) => b.getAttribute('aria-label'))).toEqual([
      'Scarica il grafico Output programmato e realizzato per anno in PNG',
      "Scarica l'output e gli importi unitari dell'intervento SRA01 in CSV",
      "Scarica l'output e gli importi unitari dell'intervento SRA01 in XLSX",
    ]);
    // TX-0030 si legge solo aprendo la sua scheda
    expect(lette.unitAmount).toEqual([]);
    await expectNoA11yViolations(container);
  });

  it('scheda Superfici per campagna: la linea e la tabella equivalente dalla campagna piu recente; scheda Unit Amount di un intervento senza Unit Amount', async () => {
    const { lette, handlers } = lettureFisico();
    server.use(...handlers);
    apriDettaglio('/fisico/interventi/SRA01');
    await userEvent.click(await screen.findByRole('tab', { name: 'Superfici per campagna' }));
    const card = await trovaCard('Superficie DS e DP per campagna (ettari)');
    const t = await tabellaDi(card);
    expect(within(t).getAllByRole('rowheader').map((c) => c.textContent)).toEqual(['2025', '2024']);
    await userEvent.click(screen.getByRole('tab', { name: 'Unit Amount' }));
    expect((await screen.findByText(/^Intervento senza Unit Amount/)).closest('[role="status"]')).not.toBeNull();
    expect(lette.unitAmount).toEqual(['?intervento=SRA01']);
  });

  it('scheda Unit Amount: otto colonne, la Unit Amount intestazione di riga, la nota unica del pagato; nessuna violazione axe', async () => {
    server.use(...lettureFisico().handlers);
    const { container } = apriDettaglio({ pathname: '/fisico/interventi/SRD01', state: { scheda: 'unitAmount' } });
    const t = await screen.findByRole('table', { name: /^Unit Amount dell'intervento SRD01 per esercizio e codice/ });
    expect(within(t).getAllByRole('columnheader').map((c) => c.textContent)).toEqual(['Unit Amount', 'Gruppo colturale', 'Esercizio', 'Importo unitario', 'Output previsto', 'Importo pagato', 'Pagato sul richiesto', 'Base storica']);
    expect(within(t).getAllByRole('rowheader').map((c) => c.textContent)).toEqual(['UA1', 'UA2', 'UA1']);
    expect(screen.getByText(/^Importo pagato, percentuale pagata sul richiesto e base storica: non disponibili per tutte le Unit Amount/)).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'Unit Amount' }).getAttribute('aria-selected')).toBe('true');
    await expectNoA11yViolations(container);
  });
});
