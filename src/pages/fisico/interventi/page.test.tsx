// Pagina /fisico/interventi/:codice (green-fe step7; flusso intervento approvato il 30/10/2026): describe taggati coi REQ
// della route (RF017, RF018, RF030, RA006), dati dagli scenari del backend e dai valori del wireframe (fixture del fisico)
// con letture che rispondono ai parametri della query, MSW seminato con onUnhandledRequest 'error' (ogni lettura e'
// dichiarata qui), axe-core diretto. ECharts e' il grafico finto del setup. Coprono i link della testata (visibili col grant
// della destinazione, nascosti senza), le letture per scheda, gli stati (caricamento, errore, intervento senza dati,
// codice non valido, dati mancanti detti in testo) e la tastiera nelle schede.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { server } from '../../../shared/api/mock/server';
import { expectNoA11yViolations } from '../../../shared/testing/axe';
import { descrizioneDi, tabellaDi, trovaCard } from '../../../shared/testing/card-grafico';
import { problema, trattenuta } from '../../../shared/testing/msw';
import { renderConQuery } from '../../../shared/testing/render';
import { pngDelGrafico } from '../../../shared/ui/grafici/echarts';
import { OUTPUT, SUPERFICI_INTERVENTI, outputPer } from '../../../features/fisico/testing/fixture';
import { lettureFisico } from '../../../features/fisico/testing/letture';
import Pagina from './page';

const PERCORSO = '/fisico/interventi/:codice';
const testo = (s: string | null | undefined) => (s ?? '').replace(/\s/g, ' ');
const profilo = (roles: string[]) =>
  server.use(http.get('*/auth/status', () => HttpResponse.json({ authenticated: true, user: { username: 'U', profile: 'p3-funzionario-area-fis', roles } })));

function servi(basi?: Parameters<typeof lettureFisico>[0]) {
  const { handlers, lette } = lettureFisico(basi);
  server.use(...handlers);
  return lette;
}

/** La pagina nel router dei test; l'indirizzo puo' portare lo state della navigazione (il link dalle Unit Amount). */
function apri(indirizzo: string | { pathname: string; state: unknown }) {
  const router = createMemoryRouter(
    [
      { path: PERCORSO, Component: Pagina },
      { path: '*', element: <p>altra pagina</p> },
    ],
    { initialEntries: [indirizzo] },
  );
  return { ...renderConQuery(<RouterProvider router={router} />), router };
}

const kpi = (nome: string | RegExp) => screen.findByRole('region', { name: nome });
/**
 * Un nome che comincia col prefisso dato. Al posto di un'espressione regolare con un apostrofo: lo stripper dei commenti
 * del self-check di step7 (char-aware sulle stringhe, non sulle espressioni regolari) la leggerebbe come una stringa aperta.
 */
const iniziaCon = (prefisso: string) => (nome: string) => nome.startsWith(prefisso);
const TABELLA_UA = "Unit Amount dell'intervento SRD01 per esercizio e codice";
const schede = () => screen.getAllByRole('tab').map((t) => t.textContent);
const UNA_SEZIONE = 'Una sezione della pagina non si è caricata.';
const NON_CARICATI = "Dati non caricati: l'avviso in cima alla pagina dice il motivo e permette di riprovare.";
const OUTPUT_SRA01 = 'Output programmato e realizzato per anno (ettari)';
const SUPERFICI_CARD = 'Superficie DS e DP per campagna (ettari)';

afterEach(() => vi.restoreAllMocks());

describe("RF017: output programmato e realizzato dell'intervento per anno (TX-0017 filtrata sull'intervento)", () => {
  it('le letture col solo intervento della route (TX-0030 solo aprendo la sua scheda); testata, badge, KPI e le tre schede nell ordine del wireframe', async () => {
    const lette = servi();
    apri('/fisico/interventi/SRA01');
    expect(await screen.findByRole('heading', { level: 1, name: 'Produzione integrata' })).toBeTruthy();
    expect(testo((await kpi('Target di fine periodo')).textContent)).toContain('1500 ettari al 2029');
    expect(lette.output).toEqual(['?intervento=SRA01']);
    expect(lette.superfici).toEqual(['?intervento=SRA01']);
    expect(lette.unitAmount).toEqual([]);
    expect(screen.getByText('Fisico - intervento SRA01')).toBeTruthy();
    expect(within(screen.getByRole('list', { name: 'Dati principali' })).getAllByRole('listitem').map((l) => l.textContent)).toEqual(['Perimetro regionale', 'Indicatore di output O.14 (ettari)']);
    expect(screen.getAllByRole('tab').map((t) => [t.textContent, t.getAttribute('aria-selected')])).toEqual([
      ['Output per anno', 'true'],
      ['Superfici per campagna', 'false'],
      ['Unit Amount', 'false'],
    ]);
    // le schede di TX-0017 e TX-0018 leggono dalla cache della pagina; TX-0030 una volta, all'apertura della sua scheda
    await userEvent.click(screen.getByRole('tab', { name: 'Superfici per campagna' }));
    await trovaCard(SUPERFICI_CARD);
    await userEvent.click(screen.getByRole('tab', { name: 'Unit Amount' }));
    await screen.findByText(/^Intervento senza Unit Amount/);
    await userEvent.click(screen.getByRole('tab', { name: 'Output per anno' }));
    await trovaCard(OUTPUT_SRA01);
    await userEvent.click(screen.getByRole('tab', { name: 'Unit Amount' }));
    await screen.findByText(/^Intervento senza Unit Amount/);
    expect(lette.output).toEqual(['?intervento=SRA01']);
    expect(lette.superfici).toEqual(['?intervento=SRA01']);
    expect(lette.unitAmount).toEqual(['?intervento=SRA01']);
  });

  it('un solo h1 col focus e il titolo del documento dal codice; la barra dei riferimenti senza filtri; nessuna violazione axe', async () => {
    servi();
    const { container } = apri('/fisico/interventi/SRA01');
    await kpi('Target di fine periodo');
    const h1 = screen.getByRole('heading', { level: 1, name: 'Produzione integrata' });
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(document.activeElement).toBe(h1);
    expect(document.title).toBe('Intervento SRA01 - Fisico - Cruscotto CSR 2023-2027');
    const barra = screen.getByRole('region', { name: 'Riferimenti dei dati' });
    expect(within(barra).getByText('Perimetro: regionale')).toBeTruthy();
    expect(within(barra).getByRole('button', { name: /^Ultimo dato sincronizzato: dati al 02\/03\/2026/ })).toBeTruthy();
    expect(within(barra).queryByRole('button', { name: /^Filtri/ })).toBeNull();
    const percorso = screen.getByRole('navigation', { name: 'Percorso' });
    expect(within(percorso).getByRole('link', { name: 'Fisico' }).getAttribute('href')).toBe('/fisico/superfici');
    await trovaCard(OUTPUT_SRA01);
    await expectNoA11yViolations(container);
  });

  it('il grafico per anno ha il target come riferimento e come riga della tabella equivalente; PNG, CSV e XLSX dicono il grafico e l intervento', async () => {
    servi();
    apri('/fisico/interventi/SRA01');
    const card = await trovaCard(OUTPUT_SRA01);
    expect(descrizioneDi(card)).toMatch(/Target di fine periodo: 1500 ettari al 2029\.$/);
    expect(within(card).getAllByRole('button', { name: /^Scarica / }).map((b) => b.getAttribute('aria-label'))).toEqual([
      'Scarica il grafico Output programmato e realizzato per anno in PNG',
      "Scarica l'output e gli importi unitari dell'intervento SRA01 in CSV",
      "Scarica l'output e gli importi unitari dell'intervento SRA01 in XLSX",
    ]);
    const t = await tabellaDi(card);
    expect(within(t).getAllByRole('rowheader').at(-1)?.textContent).toBe('Target di fine periodo');
    // gli anni senza valore sono dichiarati col motivo, mai a zero
    expect(card.textContent).toContain('2023, programmato: non valorizzato (il dato non è presente nella fonte)');
  });

  it('il CSV della scheda Output e l export di TX-0017 dell intervento; il PNG dichiara il solo filtro Intervento (NFR-50)', async () => {
    const lette = servi();
    URL.createObjectURL = vi.fn(() => 'blob:prova');
    URL.revokeObjectURL = vi.fn();
    const clic = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    const png = vi.mocked(pngDelGrafico);
    png.mockClear();
    apri('/fisico/interventi/SRA01');
    const card = await trovaCard(OUTPUT_SRA01);
    await userEvent.click(within(card).getByRole('button', { name: "Scarica l'output e gli importi unitari dell'intervento SRA01 in CSV" }));
    await waitFor(() => expect(clic).toHaveBeenCalledTimes(1));
    expect((clic.mock.contexts.at(-1) as HTMLAnchorElement).download).toBe('output-sra01-tx-0017.csv');
    expect(lette.file).toEqual(['/api/fisico/output-regionale/csv?intervento=SRA01 XMLHttpRequest']);
    expect(await screen.findByText('File CSV scaricato.')).toBeTruthy();
    await userEvent.click(within(card).getByRole('button', { name: 'Scarica il grafico Output programmato e realizzato per anno in PNG' }));
    await waitFor(() => expect(png).toHaveBeenCalledTimes(1));
    expect(png.mock.calls[0][1].intestazione).toContain('Filtri applicati: Intervento: SRA01');
  });

  it('link output-regionale-intervento: il pulsante della testata apre l output regionale filtrato sull intervento', async () => {
    servi();
    const { router } = apri('/fisico/interventi/SRA01');
    await kpi('Target di fine periodo');
    const link = screen.getByRole('link', { name: 'Output regionale filtrato su questo intervento' });
    expect(link.getAttribute('href')).toBe('/fisico/output-regionale?intervento=SRA01');
    await userEvent.click(link);
    await waitFor(() => expect(router.state.location.pathname).toBe('/fisico/output-regionale'));
    expect(router.state.location.search).toBe('?intervento=SRA01');
  });

  it('dato mancante: senza indicatore, target e valori (SRG01) il badge, il KPI e la scheda lo dicono in testo, mai uno zero', async () => {
    servi();
    apri('/fisico/interventi/SRG01');
    expect(await screen.findByRole('heading', { level: 1, name: 'Sostegno ai gruppi operativi PEI AGRI' })).toBeTruthy();
    expect(testo((await kpi('Target di fine periodo')).textContent)).toContain('Non valorizzato: il dato non è presente nella fonte');
    expect(within(screen.getByRole('list', { name: 'Dati principali' })).getAllByRole('listitem').map((l) => l.textContent)).toEqual(['Perimetro regionale', 'Indicatore di output non valorizzato']);
    const card = await trovaCard('Output programmato e realizzato per anno');
    expect(testo(card.textContent)).toContain("Grafico non disponibile: nessun anno con un valore dell'output.");
    // SRG01 non e' nelle superfici: niente KPI delle superfici, la scheda lo dice
    expect(screen.queryByRole('region', { name: /^Superficie ammissibile DS/ })).toBeNull();
    await userEvent.click(screen.getByRole('tab', { name: 'Superfici per campagna' }));
    expect((await screen.findByText(/^Intervento senza superfici/)).closest('[role="status"]')).not.toBeNull();
  });

  it('solo col grant di TX-0018: niente scheda Output ne Unit Amount, nessuna lettura di TX-0017 e TX-0030, un solo pulsante della testata', async () => {
    profilo(['csr.tx-0018.read', 'csr.tx-0060.read']);
    const lette = servi();
    apri('/fisico/interventi/SRA01');
    await kpi(/^Superficie ammissibile DS, campagna 2025/);
    expect(schede()).toEqual(['Superfici per campagna']);
    expect(screen.queryByRole('region', { name: 'Target di fine periodo' })).toBeNull();
    expect(screen.queryByRole('link', { name: 'Output regionale filtrato su questo intervento' })).toBeNull();
    expect(screen.queryByRole('link', { name: 'Unit Amount di questo intervento' })).toBeNull();
    expect(screen.getByRole('link', { name: 'Superfici ammissibili filtrate su questo intervento' })).toBeTruthy();
    // senza la riga di TX-0017 il badge del solo perimetro
    expect(within(screen.getByRole('list', { name: 'Dati principali' })).getAllByRole('listitem').map((l) => l.textContent)).toEqual(['Perimetro regionale']);
    await trovaCard(SUPERFICI_CARD);
    expect(lette.output).toEqual([]);
    expect(lette.unitAmount).toEqual([]);
  });
});

describe("RF018: superfici ammissibili dell'intervento per campagna (TX-0018 filtrata sull'intervento)", () => {
  it('i KPI della campagna piu recente con le sigle sciolte nel nome e le domande nel testo; la campagna di riferimento detta sotto', async () => {
    servi();
    apri('/fisico/interventi/SRA01');
    const ds = await kpi('Superficie ammissibile DS, campagna 2025: superficie delle domande di sostegno');
    expect(testo(ds.textContent)).toContain('10,50 ha');
    expect(testo(ds.textContent)).toContain('TX-0018, 1 domanda di sostegno');
    const dp = screen.getByRole('region', { name: 'Superficie ammissibile DP, campagna 2025: superficie delle domande di pagamento' });
    expect(testo(dp.textContent)).toContain('10,20 ha');
    expect(testo(dp.textContent)).toContain('TX-0018, 2 domande di pagamento');
    const oltre = screen.getByRole('region', { name: 'Domande con DP oltre la DS, campagna 2025: domande di pagamento con superficie oltre quella di sostegno' });
    expect(testo(oltre.textContent)).toContain('TX-0018, su 2 domande di pagamento: 0 %');
    // nessuna barra della quota: la quota e' solo nel testo di supporto (wireframe)
    expect(within(oltre).queryByRole('img')).toBeNull();
    expect(screen.getByText(/^Campagna di riferimento dei KPI delle superfici: la più recente della risposta di TX-0018/)).toBeTruthy();
  });

  it('scheda Superfici per campagna: la linea, la tabella equivalente coi sette dati dalla piu recente, la quantita a premio detta; PNG, CSV e XLSX', async () => {
    const lette = servi();
    URL.createObjectURL = vi.fn(() => 'blob:prova');
    URL.revokeObjectURL = vi.fn();
    const clic = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    apri('/fisico/interventi/SRA01');
    await userEvent.click(await screen.findByRole('tab', { name: 'Superfici per campagna' }));
    const card = await trovaCard(SUPERFICI_CARD);
    expect(descrizioneDi(card)).toBe('Linee della superficie DS e DP di SRA01 per campagna dal 2024 al 2025 (2 campagne), superfici in ettari: nel 2025 DS 10,50 ha e DP 10,20 ha.');
    expect(testo(card.textContent)).toContain('Quantità richiesta a premio: non disponibile (fonte quantità richiesta a premio non attiva).');
    expect(within(card).getAllByRole('button', { name: /^Scarica / }).map((b) => b.getAttribute('aria-label'))).toEqual([
      'Scarica il grafico Superficie DS e DP per campagna in PNG',
      "Scarica le superfici dell'intervento SRA01 in CSV",
      "Scarica le superfici dell'intervento SRA01 in XLSX",
    ]);
    const t = await tabellaDi(card);
    expect(Array.from(t.querySelectorAll('tbody tr')).map((r) => Array.from(r.children).map((c) => c.textContent))).toEqual([
      ['2025', '2', '1', '10,50', '10,20', '-0,30', '0'],
      ['2024', '1', '1', '5,00', '6,00', '+1,00', '1'],
    ]);
    await userEvent.click(within(card).getByRole('button', { name: "Scarica le superfici dell'intervento SRA01 in XLSX" }));
    await waitFor(() => expect(clic).toHaveBeenCalledTimes(1));
    expect((clic.mock.contexts.at(-1) as HTMLAnchorElement).download).toBe('superfici-sra01-tx-0018.xlsx');
    expect(lette.file).toEqual(['/api/fisico/superficie-ammissibile/xlsx?intervento=SRA01 XMLHttpRequest']);
  });

  it('intervento senza superfici (SRD01, NON_VALORIZZATO): i tre KPI non valorizzati e la scheda lo dichiara, mai zero', async () => {
    servi();
    apri('/fisico/interventi/SRD01');
    const ds = await kpi('Superficie ammissibile DS: superficie delle domande di sostegno');
    expect(testo(ds.textContent)).toContain('Non valorizzato: intervento non a superficie o non SIGC');
    expect(testo(screen.getByRole('region', { name: 'Domande con DP oltre la DS: domande di pagamento con superficie oltre quella di sostegno' }).textContent)).not.toMatch(/\b0\b/);
    expect(screen.queryByText(/^Campagna di riferimento dei KPI/)).toBeNull();
    await userEvent.click(screen.getByRole('tab', { name: 'Superfici per campagna' }));
    const vuoto = (await screen.findByText(/^Intervento senza superfici \(non a superficie o non SIGC/)).closest('[role="status"]');
    expect(vuoto).not.toBeNull();
  });

  it('link superfici-intervento: il pulsante della testata apre le superfici filtrate sull intervento', async () => {
    servi();
    const { router } = apri('/fisico/interventi/SRA01');
    await kpi('Target di fine periodo');
    await userEvent.click(screen.getByRole('link', { name: 'Superfici ammissibili filtrate su questo intervento' }));
    await waitFor(() => expect(router.state.location.pathname).toBe('/fisico/superfici'));
    expect(router.state.location.search).toBe('?intervento=SRA01');
  });
});

describe("RF030: Unit Amount dell'intervento (TX-0030 filtrata sull'intervento)", () => {
  it('la scheda legge TX-0030 quando si apre: otto colonne, la Unit Amount intestazione di riga, la nota unica del pagato; CSV e XLSX', async () => {
    const lette = servi();
    URL.createObjectURL = vi.fn(() => 'blob:prova');
    URL.revokeObjectURL = vi.fn();
    const clic = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    const { container } = apri('/fisico/interventi/SRD01');
    await kpi('Target di fine periodo');
    expect(lette.unitAmount).toEqual([]);
    await userEvent.click(screen.getByRole('tab', { name: 'Unit Amount' }));
    const t = await screen.findByRole('table', { name: iniziaCon(TABELLA_UA) });
    expect(lette.unitAmount).toEqual(['?intervento=SRD01']);
    expect(within(t).getAllByRole('columnheader').map((c) => c.textContent)).toEqual(['Unit Amount', 'Gruppo colturale', 'Esercizio', 'Importo unitario', 'Output previsto', 'Importo pagato', 'Pagato sul richiesto', 'Base storica']);
    expect(within(t).getAllByRole('rowheader').map((c) => c.textContent)).toEqual(['UA1', 'UA2', 'UA1']);
    expect(testo(within(t).getAllByRole('row')[2].textContent)).toBe('UA2Ortive2024non valorizzatoil dato non è presente nella fonte5non disponibilenon disponibilenon disponibile');
    expect(screen.getByText(/^Importo pagato, percentuale pagata sul richiesto e base storica: non disponibili per tutte le Unit Amount/)).toBeTruthy();
    expect(screen.getByText(/^Fonte: TX-0030 con intervento = SRD01\./)).toBeTruthy();
    await userEvent.click(screen.getByRole('button', { name: "Scarica le Unit Amount dell'intervento SRD01 in CSV" }));
    await waitFor(() => expect(clic).toHaveBeenCalledTimes(1));
    expect((clic.mock.contexts.at(-1) as HTMLAnchorElement).download).toBe('unit-amount-srd01-tx-0030.csv');
    expect(lette.file).toEqual(['/api/fisico/unit-amount/csv?intervento=SRD01 XMLHttpRequest']);
    await expectNoA11yViolations(container);
  });

  it('dal drawer delle Unit Amount (state della navigazione) il dettaglio apre la scheda Unit Amount, senza parametri nell indirizzo', async () => {
    const lette = servi();
    const arrivo = apri({ pathname: '/fisico/interventi/SRD01', state: { scheda: 'unitAmount' } });
    await screen.findByRole('table', { name: iniziaCon(TABELLA_UA) });
    expect(screen.getByRole('tab', { name: 'Unit Amount' }).getAttribute('aria-selected')).toBe('true');
    expect(arrivo.router.state.location.search).toBe('');
    expect(lette.unitAmount).toEqual(['?intervento=SRD01']);
    arrivo.unmount();
    // uno state non valido non cambia la scheda iniziale
    apri({ pathname: '/fisico/interventi/SRA01', state: { scheda: 'importi' } });
    await trovaCard(OUTPUT_SRA01);
    expect(screen.getByRole('tab', { name: 'Output per anno' }).getAttribute('aria-selected')).toBe('true');
  });

  it('link unit-amount-intervento: il pulsante della testata apre le Unit Amount filtrate sull intervento', async () => {
    servi();
    const { router } = apri('/fisico/interventi/SRD01');
    await kpi('Target di fine periodo');
    await userEvent.click(screen.getByRole('link', { name: 'Unit Amount di questo intervento' }));
    await waitFor(() => expect(router.state.location.pathname).toBe('/fisico/unit-amount'));
    expect(router.state.location.search).toBe('?intervento=SRD01');
  });

  it('errore di TX-0030: l avviso della pagina dice una sezione, la scheda il testo statico; KPI e altre schede restano', async () => {
    servi();
    server.use(http.get('*/api/fisico/unit-amount', () => HttpResponse.json(problema(503, 'CAPACITA_ESAURITA'), { status: 503 })));
    apri('/fisico/interventi/SRA01');
    await kpi('Target di fine periodo');
    expect(screen.queryByRole('alert')).toBeNull();
    await userEvent.click(screen.getByRole('tab', { name: 'Unit Amount' }));
    expect((await screen.findByRole('alert')).textContent).toContain(UNA_SEZIONE);
    const scheda = screen.getByRole('tabpanel', { name: 'Unit Amount' });
    expect(within(scheda).getByText(NON_CARICATI)).toBeTruthy();
    expect(screen.getAllByRole('alert')).toHaveLength(1);
    await userEvent.click(screen.getByRole('tab', { name: 'Output per anno' }));
    await trovaCard(OUTPUT_SRA01);
    expect(screen.getByRole('region', { name: 'Target di fine periodo' })).toBeTruthy();
  });
});

describe('RA006: descrizione da TX-0060 e stati del dettaglio (caricamento, errore, senza dati, codice non valido)', () => {
  it('senza le voci di TX-0060 (in errore) il titolo e Intervento <codice>; il resto si legge', async () => {
    servi({ valori: null });
    apri('/fisico/interventi/SRA01');
    await kpi('Target di fine periodo');
    expect(screen.getByRole('heading', { level: 1, name: 'Intervento SRA01' })).toBeTruthy();
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('il codice del percorso e codificato: un valore con / non manda richieste e la pagina lo dice', async () => {
    const lette = servi();
    apri('/fisico/interventi/SR%2F..%2FA01');
    expect(screen.getByRole('heading', { level: 1, name: 'Intervento non valido' })).toBeTruthy();
    expect(screen.getByRole('alert').textContent?.startsWith("Il codice nell'indirizzo non è un codice di intervento")).toBe(true);
    expect(document.title).toBe('Intervento non valido - Fisico - Cruscotto CSR 2023-2027');
    await act(async () => new Promise((r) => setTimeout(r, 30)));
    expect(lette.output).toEqual([]);
    expect(lette.superfici).toEqual([]);
    expect(lette.unitAmount).toEqual([]);
    expect(lette.filtri).toBe(0);
  });

  it('intervento senza dati nei report (AT001): lo stato dichiarato col ritorno all output regionale', async () => {
    servi();
    const { router } = apri('/fisico/interventi/AT001');
    const stato = (await screen.findByText(/^Nessun dato per questo intervento nei report del fisico/)).closest('[role="status"]') as HTMLElement;
    expect(screen.queryAllByRole('tab')).toHaveLength(0);
    await userEvent.click(within(stato).getByRole('link', { name: "Torna all'output regionale" }));
    await waitFor(() => expect(router.state.location.pathname).toBe('/fisico/output-regionale'));
  });

  it('intervento senza dati col solo grant di TX-0018: il ritorno e alle superfici ammissibili', async () => {
    profilo(['csr.tx-0018.read']);
    const lette = servi();
    apri('/fisico/interventi/AT001');
    const stato = (await screen.findByText(/^Nessun dato per questo intervento nei report del fisico/)).closest('[role="status"]') as HTMLElement;
    expect(within(stato).getByRole('link', { name: 'Torna alle superfici ammissibili' }).getAttribute('href')).toBe('/fisico/superfici');
    expect(within(stato).queryByRole('link', { name: "Torna all'output regionale" })).toBeNull();
    expect(lette.output).toEqual([]);
    expect(lette.filtri).toBe(0);
  });

  it('caricamento con lo scheletro e aria-live, poi i dati', async () => {
    const t = trattenuta();
    servi();
    server.use(
      http.get('*/api/fisico/output-regionale', async ({ request }) => {
        await t.attesa;
        return HttpResponse.json(outputPer(OUTPUT, new URL(request.url).searchParams));
      }),
    );
    apri('/fisico/interventi/SRA01');
    expect((await screen.findByText('Caricamento in corso…')).closest('[role="status"]')?.getAttribute('aria-live')).toBe('polite');
    expect(screen.queryAllByRole('tab')).toHaveLength(0);
    await act(async () => t.libera());
    await kpi('Target di fine periodo');
  });

  it('errore di entrambe le letture della pagina: un solo avviso con Riprova, che le rilegge; la pill dice che il dato non c e', async () => {
    servi();
    let tentativi = 0;
    const errore = () => {
      tentativi += 1;
      return tentativi <= 2 ? HttpResponse.json(problema(503, 'TEMPO_SCADUTO', 'lettura oltre il tetto di durata'), { status: 503 }) : null;
    };
    server.use(
      http.get('*/api/fisico/output-regionale', ({ request }) => errore() ?? HttpResponse.json(outputPer(OUTPUT, new URL(request.url).searchParams))),
      http.get('*/api/fisico/superficie-ammissibile', () => errore() ?? HttpResponse.json(SUPERFICI_INTERVENTI)),
    );
    apri('/fisico/interventi/SRA01');
    const avviso = await screen.findByRole('alert');
    expect(screen.getAllByRole('alert')).toHaveLength(1);
    expect(avviso.textContent).toContain('2 sezioni della pagina non si sono caricate.');
    expect(within(screen.getByRole('region', { name: 'Riferimenti dei dati' })).getByText('Ultimo dato sincronizzato: non disponibile')).toBeTruthy();
    await userEvent.click(within(avviso).getByRole('button', { name: 'Riprova' }));
    await kpi('Target di fine periodo');
  });

  it('errore di TX-0018: i dati di TX-0017 restano; la scheda Superfici dice il testo statico e l avviso una sezione', async () => {
    servi();
    server.use(http.get('*/api/fisico/superficie-ammissibile', () => HttpResponse.json(problema(403, 'ACCESSO_NEGATO'), { status: 403 })));
    apri('/fisico/interventi/SRA01');
    await kpi('Target di fine periodo');
    expect((await screen.findByRole('alert')).textContent).toContain(UNA_SEZIONE);
    expect(screen.queryByRole('region', { name: /^Superficie ammissibile DS/ })).toBeNull();
    await userEvent.click(screen.getByRole('tab', { name: 'Superfici per campagna' }));
    expect(within(screen.getByRole('tabpanel', { name: 'Superfici per campagna' })).getByText(NON_CARICATI)).toBeTruthy();
    expect(screen.getAllByRole('alert')).toHaveLength(1);
  });

  it('le schede da tastiera: le frecce cambiano scheda (tablist di react-aria) e la scheda scelta si apre', async () => {
    servi();
    apri('/fisico/interventi/SRA01');
    const prima = await screen.findByRole('tab', { name: 'Output per anno' });
    act(() => prima.focus());
    await userEvent.keyboard('{ArrowRight}');
    const seconda = screen.getByRole('tab', { name: 'Superfici per campagna' });
    expect(document.activeElement).toBe(seconda);
    expect(seconda.getAttribute('aria-selected')).toBe('true');
    await trovaCard(SUPERFICI_CARD);
    await userEvent.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: 'Unit Amount' }).getAttribute('aria-selected')).toBe('true');
  });
});
