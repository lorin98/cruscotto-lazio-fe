// Pagina /istituzionale/verifica-smp-sigc (green-fe step7; dal finanziario col riallineamento degli ambiti del 29/10/2026,
// wireframe verifica-smp-sigc approvato il 30/10/2026): describe taggati coi REQ della route (RF015, RA006). I casi sono
// quelli della pagina /finanziario/sigc/verifica-smp e di VerificaSmpReport, sulla resa della verifica non SIGC della
// stessa area (riferimenti, card del grafico, tabella "Dati per intervento"); letture che rispondono ai parametri della
// query, MSW seminato con onUnhandledRequest 'error' (ogni lettura e' dichiarata qui), axe-core diretto. ECharts e' il
// grafico finto del setup.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '../../../shared/api/mock/server';
import { expectNoA11yViolations } from '../../../shared/testing/axe';
import { graficoDi, opzioniDi, trovaCard } from '../../../shared/testing/card-grafico';
import { clicSulDato, graficiVivi } from '../../../shared/testing/grafico-finto';
import { problema, trattenuta } from '../../../shared/testing/msw';
import { renderPagina } from '../../../shared/testing/render-pagina';
import { VERIFICA_SMP, dato, nd, nv, rigaSmp, verificaSigcPer } from '../../../features/istituzionale/testing/fixture';
import { lettureIstituzionale } from '../../../features/istituzionale/testing/letture';
import Pagina from './page';

const PERCORSO = '/istituzionale/verifica-smp-sigc';
const CARD = 'Spesa erogata nella campagna precedente per intervento';
const TABELLA = /^Verifica SMP SIGC, esercizio \d{4}: /;
const testo = (s: string | null | undefined) => (s ?? '').replace(/\s/g, ' ');

function servi(basi?: Parameters<typeof lettureIstituzionale>[0]) {
  const { handlers, lette } = lettureIstituzionale(basi);
  server.use(...handlers);
  return lette;
}

const apri = (indirizzo = PERCORSO) => renderPagina(Pagina, PERCORSO, indirizzo);
const tabella = () => screen.findByRole('table', { name: TABELLA });
const ricerca = () => screen.getByRole('searchbox', { name: 'Cerca nella tabella' }) as HTMLInputElement;
const righeCorpo = (t: HTMLElement) => Array.from((t as HTMLTableElement).tBodies[0].rows, (r) => r.cells[0].textContent);
const valoreDi = (t: HTMLElement, voce: string) => testo(within(t).getByRole('rowheader', { name: voce }).nextElementSibling?.textContent);
const indirizzo = (router: ReturnType<typeof apri>['router']) => `${router.state.location.pathname}${router.state.location.search}`;

afterEach(() => vi.restoreAllMocks());

describe('RF015: i dati ASR dell ambito SIGC per il confronto con SMP - Data Platform (TX-0015)', () => {
  it("l'esercizio e' obbligatorio e va nell'indirizzo insieme ai filtri; senza, nessuna lettura", async () => {
    const lette = servi();
    const { router } = apri(`${PERCORSO}?intervento=SRA01`);
    expect(screen.getByRole('heading', { level: 1, name: 'Istituzionale: verifica SMP SIGC' })).toBeTruthy();
    expect(document.title).toBe('Verifica SMP SIGC - Istituzionale - Cruscotto CSR 2023-2027');
    expect((await screen.findByText("Scegli l'esercizio finanziario da consultare.")).closest('[role="status"]')).not.toBeNull();
    // l'esercizio 2030 (regola n+2) e' selezionabile, come nel finanziario
    expect(within(screen.getByLabelText('Esercizio finanziario')).getByRole('option', { name: '2030' })).toBeTruthy();
    expect(lette.verificaSigc).toEqual([]);
    await userEvent.selectOptions(screen.getByLabelText('Esercizio finanziario'), '2025');
    await userEvent.click(screen.getByRole('button', { name: 'Mostra' }));
    await waitFor(() => expect(router.state.location.search).toBe('?intervento=SRA01&esercizio=2025'));
    await tabella();
    expect(lette.verificaSigc).toEqual(['?intervento=SRA01&esercizio=2025']);
  });

  it("tabella con l'intervento come intestazione di riga, visibili le 11 colonne del low-fi (le altre da Colonne), mancanti 'non disponibile'; i riferimenti della risposta", async () => {
    servi();
    apri(`${PERCORSO}?esercizio=2025`);
    const t = await tabella();
    // il titolo senza l'indicatore dell'ordinamento
    expect(within(t).getAllByRole('columnheader').map((h) => (h.textContent ?? '').replace(/[▲▼↕]/g, ''))).toEqual([
      'Intervento',
      'Avvisi attivati',
      'Azioni attivate',
      'Domande ricevute',
      'Domande finanziate',
      "Domande pagate nell'esercizio",
      'Spesa erogata campagna precedente',
      'Spesa erogata campagne anteriori',
      "Si prevede di pagare nell'esercizio",
      'Include top-up',
      "Output erogato nell'esercizio",
    ]);
    expect(within(t).getByRole('rowheader').textContent).toBe('SRA01');
    expect(t.textContent).toContain('fonte previsione di pagamento non attiva');
    expect(t.textContent).not.toContain('non indicato');
    const riferimenti = screen.getByRole('table', { name: 'Riferimenti della risposta' });
    expect(valoreDi(riferimenti, 'Esercizio')).toBe('2025 (dal 16/10/2024 al 15/10/2025, estremi compresi)');
    expect(valoreDi(riferimenti, 'Anno delle domande')).toBe('2024');
    expect(valoreDi(riferimenti, "Pagamenti senza data di autorizzazione (esclusi dall'esercizio)")).toBe('3');
    expect(valoreDi(riferimenti, 'Perimetro')).toBe('regionale');
    // la barra: perimetro regionale, esercizio della risposta e "Dati al" della risposta di TX-0015
    const barra = screen.getByRole('region', { name: 'Filtri attivi' });
    expect(within(barra).getByText('Perimetro: regionale (i report istituzionali non hanno perimetro ADA)')).toBeTruthy();
    expect(within(barra).getByText('Esercizio finanziario: 2025 (dal 16/10/2024 al 15/10/2025)')).toBeTruthy();
    expect(within(barra).getByRole('button', { name: /^Ultimo dato sincronizzato: dati al 02\/03\/2026/ })).toBeTruthy();
  });

  // review delta 21/10 V1 del finanziario: la previsione di pagamento (D-11) e' provata con un valore, non solo quando la fonte manca
  it("avvisi e azioni attivate, top-up incluso e previsione di pagamento: il valore, oppure il motivo dell'assenza (D3, D15, D-11 del backend), mai uno 0 o un no inventati", async () => {
    const righe = [
      rigaSmp({ avvisiAttivati: nv(), azioniAttivate: nd('AVVISI_SMP'), includeTopUp: nv(), previsionePagamentoEsercizio: nv() }),
      rigaSmp({ codiceIntervento: 'SRA03', avvisiAttivati: dato(3), azioniAttivate: dato(0), includeTopUp: dato(true), previsionePagamentoEsercizio: dato(true) }),
      rigaSmp({ codiceIntervento: 'SRA29', includeTopUp: dato(false), previsionePagamentoEsercizio: dato(false) }),
      rigaSmp({ codiceIntervento: 'SRD01', previsionePagamentoEsercizio: nd('PREVISIONE_PAGAMENTO') }),
    ];
    servi({ verificaSigc: { ...VERIFICA_SMP, righe } });
    apri(`${PERCORSO}?esercizio=2025`);
    const t = await tabella();
    const intestazioni = within(t).getAllByRole('columnheader').map((h) => h.textContent ?? '');
    const cella = (intervento: string, colonna: string) => {
      const riga = within(t).getByRole('rowheader', { name: intervento }).closest('tr');
      return riga?.children[intestazioni.findIndex((x) => x.startsWith(colonna))]?.textContent ?? '';
    };
    expect(cella('SRA01', 'Avvisi attivati')).toBe('non valorizzatoil dato non è presente nella fonte');
    expect(cella('SRA01', 'Azioni attivate')).toBe('non disponibilefonte avvisi SMP non attiva');
    expect(cella('SRA01', 'Include top-up')).toBe('non valorizzatoil dato non è presente nella fonte');
    expect(cella('SRA03', 'Avvisi attivati')).toBe('3');
    expect(cella('SRA03', 'Azioni attivate')).toBe('0');
    expect(cella('SRA03', 'Include top-up')).toBe('sì');
    expect(cella('SRA29', 'Include top-up')).toBe('no');
    // la previsione di pagamento: si', no, non valorizzata con la fonte attiva, non disponibile senza la fonte
    const previsione = "Si prevede di pagare nell'esercizio";
    expect(cella('SRA03', previsione)).toBe('sì');
    expect(cella('SRA29', previsione)).toBe('no');
    expect(cella('SRA01', previsione)).toBe('non valorizzatoil dato non è presente nella fonte');
    expect(cella('SRD01', previsione)).toBe('non disponibilefonte previsione di pagamento non attiva');
  });

  // review delta 21/10 V2 del finanziario: la previsione e' una colonna di testo, non un numero
  it('previsione di pagamento e top-up incluso sono colonne di testo; i conteggi restano allineati come numeri', async () => {
    servi();
    apri(`${PERCORSO}?esercizio=2025`);
    const t = await tabella();
    const intestazioni = within(t).getAllByRole('columnheader');
    const colonna = (titolo: string) => intestazioni.findIndex((h) => (h.textContent ?? '').startsWith(titolo));
    const riga = within(t).getByRole('rowheader', { name: 'SRA01' }).closest('tr');
    const numerica = (titolo: string) => [intestazioni[colonna(titolo)], riga?.children[colonna(titolo)]].map((c) => c?.classList.contains('ui-num'));
    expect(numerica("Si prevede di pagare nell'esercizio")).toEqual([false, false]);
    expect(numerica('Include top-up')).toEqual([false, false]);
    expect(numerica('Avvisi attivati')).toEqual([true, true]);
  });

  it('valori facoltativi valorizzati e assenti nella stessa tabella; intervento senza importi omesso dal grafico', async () => {
    const riga = rigaSmp({ azioniAttivate: dato(2), includeTopUp: dato(true), indicatoreRisultato: 'R.1', outputErogatoEsercizio: 10 });
    servi({ verificaSigc: { ...VERIFICA_SMP, annoDomande: undefined, righe: [riga, { codiceIntervento: 'SRA03' }] } });
    apri(`${PERCORSO}?esercizio=2025`);
    const t = await tabella();
    expect(within(t).getAllByRole('rowheader').map((c) => c.textContent)).toEqual(['SRA01', 'SRA03']);
    expect(t.textContent).toContain('sì');
    // l'output erogato nell'esercizio e' l'ultima colonna visibile del low-fi; l'indicatore di risultato si vede da "Colonne"
    expect(within(t).getByRole('rowheader', { name: 'SRA01' }).closest('tr')?.lastElementChild?.textContent).toBe('10');
    expect(t.textContent).toContain('non disponibile');
    const card = await trovaCard(CARD);
    expect(within(card).getByText('SRA03, spesa erogata nella campagna precedente: non disponibile')).toBeTruthy();
  });

  it("nessuna riga per l'esercizio: lo stato vuoto (status) con Modifica i filtri, nessun grafico", async () => {
    servi({ verificaSigc: { ...VERIFICA_SMP, righe: [] } });
    apri(`${PERCORSO}?esercizio=2023`);
    const vuoto = await screen.findByText(/^Nessun dato SIGC per l'esercizio e i filtri scelti/);
    expect(vuoto.closest('[role="status"]')).not.toBeNull();
    expect(within(vuoto.closest('[role="status"]') as HTMLElement).getByRole('button', { name: 'Modifica i filtri' })).toBeTruthy();
    expect(graficiVivi()).toHaveLength(0);
  });

  it('togliere un filtro conserva l esercizio (parametro di pagina, come nel finanziario)', async () => {
    servi();
    const { router } = apri(`${PERCORSO}?intervento=SRA01&og=OG1&esercizio=2025`);
    await tabella();
    const barra = screen.getByRole('region', { name: 'Filtri attivi' });
    await userEvent.click(within(barra).getByRole('button', { name: 'Togli il filtro OG OG1' }));
    await waitFor(() => expect(router.state.location.search).toBe('?intervento=SRA01&esercizio=2025'));
    await userEvent.click(within(barra).getByRole('button', { name: 'Togli tutti' }));
    await waitFor(() => expect(router.state.location.search).toBe('?esercizio=2025'));
  });

  it("CSV e XLSX dal backend coi filtri e l'esercizio", async () => {
    const lette = servi();
    URL.createObjectURL = vi.fn(() => 'blob:prova');
    URL.revokeObjectURL = vi.fn();
    const clic = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    apri(`${PERCORSO}?intervento=SRA01&esercizio=2025`);
    // un pulsante per formato nella card del grafico e in quella della tabella, con lo stesso file
    const csv = await screen.findAllByRole('button', { name: 'Scarica i dati della verifica SMP SIGC, esercizio 2025 in CSV' });
    expect(csv).toHaveLength(2);
    await userEvent.click(csv[1]);
    await waitFor(() => expect(lette.file).toEqual(['/api/istituzionale/verifica-smp-sigc/csv?intervento=SRA01&esercizio=2025 XMLHttpRequest']));
    expect((clic.mock.contexts[0] as HTMLAnchorElement).download).toBe('verifica-smp-sigc-esercizio-2025-tx-0015.csv');
  });

  it('la nota sui file sopra la tabella, come nella verifica non SIGC (tutti gli interventi dei filtri e tutte le colonne); le definizioni sotto', async () => {
    servi();
    apri(`${PERCORSO}?esercizio=2025`);
    await tabella();
    const nota = 'I file CSV e XLSX contengono tutti gli interventi dei filtri e tutte le 21 colonne, non solo quelli trovati dalla ricerca o le colonne scelte.';
    expect(screen.getByText(nota)).toBeTruthy();
    expect(screen.getByText(/^Definizioni del backend \(decisioni di finanziario richiamate da istituzionale\)/)).toBeTruthy();
  });

  // V-16 del finanziario: TabellaInterattiva con ricerca e scelta delle colonne, come nel wireframe verifica-smp
  it('tabella interattiva: Intervento fisso, scelta delle altre 20 colonne (nascoste quelle fuori dal low-fi), ricerca per codice o indicatore, 20 righe per pagina', async () => {
    const righe = Array.from({ length: 25 }, (_, n) => ({ ...VERIFICA_SMP.righe[0], codiceIntervento: `SRB${10 + n}`, indicatoreRisultato: n === 24 ? 'R.1' : null }));
    servi({ verificaSigc: { ...VERIFICA_SMP, righe } });
    apri(`${PERCORSO}?esercizio=2025`);
    const t = await tabella();
    expect(righeCorpo(t)).toHaveLength(20);
    expect(screen.getByRole('navigation', { name: 'Pagine della tabella' }).textContent).toContain('Pagina 1 di 2');
    const colonne = within(screen.getByRole('group', { name: 'Colonne visibili' }));
    expect(colonne.getAllByRole('checkbox')).toHaveLength(20);
    expect(colonne.queryByRole('checkbox', { name: 'Intervento' })).toBeNull();
    await userEvent.click(screen.getByText('Colonne'));
    expect((colonne.getByRole('checkbox', { name: 'Indicatore di risultato' }) as HTMLInputElement).checked).toBe(false);
    await userEvent.click(colonne.getByRole('checkbox', { name: 'Indicatore di risultato' }));
    expect(within(t).getAllByRole('columnheader')).toHaveLength(12);
    expect(ricerca().placeholder).toBe('Cerca per codice o indicatore');
    await userEvent.type(ricerca(), 'r.1');
    expect(righeCorpo(t)).toEqual(['SRB34']);
    await userEvent.clear(ricerca());
    await userEvent.type(ricerca(), 'srb3');
    expect(righeCorpo(t)).toEqual(['SRB30', 'SRB31', 'SRB32', 'SRB33', 'SRB34']);
  });

  it("grafico della spesa erogata montato con la fonte e l'esercizio; la previsione di pagamento (D-11) non è nel grafico ma nella tabella", async () => {
    servi();
    apri(`${PERCORSO}?esercizio=2025`);
    const card = await trovaCard(CARD);
    await waitFor(() => expect(opzioniDi(graficoDi(card))?.series?.length).toBeGreaterThan(0));
    expect(within(card).queryByText(/previsione di pagamento/)).toBeNull();
    expect(within(card).getByText(/^Fonte: TX-0015, esercizio 2025\. La tabella equivalente mostra gli stessi valori/)).toBeTruthy();
    expect((await tabella()).textContent).toContain('fonte previsione di pagamento non attiva');
  });

  it("clic su una barra del grafico: il dettaglio dell'intervento dell'area con l'esercizio (link dettaglio-intervento-smp-sigc)", async () => {
    servi();
    const { router } = apri(`${PERCORSO}?og=OG1&esercizio=2025`);
    const grafico = graficoDi(await trovaCard(CARD));
    if (!grafico) throw new Error('grafico assente');
    act(() => clicSulDato(grafico, 0, 0));
    await waitFor(() => expect(indirizzo(router)).toBe('/istituzionale/interventi/SRA01?esercizio=2025'));
  });

  // N-14 del finanziario: il dettaglio si apre anche da tastiera, dalla riga della tabella
  it("Invio su una riga della tabella: il dettaglio dell'intervento, come il clic sulla barra", async () => {
    servi();
    const { router } = apri(`${PERCORSO}?esercizio=2025`);
    const riga = await screen.findByRole('row', { name: "Apri il dettaglio dell'intervento SRA01" });
    act(() => riga.focus());
    await userEvent.keyboard('{Enter}');
    await waitFor(() => expect(indirizzo(router)).toBe('/istituzionale/interventi/SRA01?esercizio=2025'));
  });

  it('nessuna violazione axe', async () => {
    servi();
    const { container } = apri(`${PERCORSO}?esercizio=2025`);
    await tabella();
    await expectNoA11yViolations(container);
  });
});

describe('RF015: link reciproci e stati della verifica SMP SIGC (wireframe verifica-smp-sigc del 30/10/2026)', () => {
  const profilo = (roles: string[]) =>
    server.use(http.get('*/auth/status', () => HttpResponse.json({ authenticated: true, user: { username: 'U', profile: 'p3-funzionario-area-ist', roles } })));

  it('link verifica-smp-non-sigc: col grant di TX-0016 la frase porta alla verifica non SIGC coi filtri comuni, non l esercizio; senza il grant non c e', async () => {
    servi();
    const { unmount } = apri(`${PERCORSO}?intervento=SRA01&op=OP1&esercizio=2025`);
    await tabella();
    const link = screen.getByRole('link', { name: 'Verifica SMP non SIGC' });
    expect(link.getAttribute('href')).toBe('/istituzionale/verifica-smp-non-sigc?intervento=SRA01&op=OP1');
    expect(link.closest('p')?.textContent).toBe('La stessa verifica per i dati ASR non SIGC, con gli stessi filtri: Verifica SMP non SIGC.');
    unmount();

    profilo(['csr.tx-0015.read', 'csr.tx-0060.read']);
    servi();
    apri(`${PERCORSO}?esercizio=2025`);
    await tabella();
    expect(screen.queryByRole('link', { name: 'Verifica SMP non SIGC' })).toBeNull();
    expect(document.body.textContent).not.toContain('La stessa verifica per i dati ASR non SIGC');
  });

  it('caricamento con lo scheletro e aria-live, poi i dati; errore: un solo avviso con Riprova, "Dati al" non disponibile', async () => {
    servi();
    const t = trattenuta();
    let tentativi = 0;
    server.use(
      http.get('*/api/istituzionale/verifica-smp-sigc', async ({ request }) => {
        tentativi += 1;
        await t.attesa;
        if (tentativi === 1) return HttpResponse.json(problema(503, 'TEMPO_SCADUTO', 'lettura oltre il tetto di durata'), { status: 503 });
        return HttpResponse.json(verificaSigcPer(VERIFICA_SMP, new URL(request.url).searchParams));
      }),
    );
    apri(`${PERCORSO}?esercizio=2025`);
    const caricamento = await screen.findByText('Caricamento in corso…');
    expect(caricamento.closest('[role="status"]')?.getAttribute('aria-live')).toBe('polite');
    await act(async () => t.libera());
    const avviso = await screen.findByRole('alert');
    expect(screen.getAllByRole('alert')).toHaveLength(1);
    expect(within(screen.getByRole('region', { name: 'Filtri attivi' })).getByText('Ultimo dato sincronizzato: non disponibile')).toBeTruthy();
    await userEvent.click(within(avviso).getByRole('button', { name: 'Riprova' }));
    await tabella();
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('file non scaricato: oltre il limite dell export il motivo in role=alert, il report resta', async () => {
    servi();
    server.use(http.get('*/api/istituzionale/verifica-smp-sigc/:formato', () => HttpResponse.json(problema(400, 'DATO_NON_VALIDO', 'oltre il limite di 5.000 righe'), { status: 400 })));
    apri(`${PERCORSO}?esercizio=2025`);
    await tabella();
    await userEvent.click(screen.getAllByRole('button', { name: 'Scarica i dati della verifica SMP SIGC, esercizio 2025 in CSV' })[1]);
    expect((await screen.findByRole('alert')).textContent).toMatch(/^File CSV non scaricato/);
    expect(screen.getByRole('table', { name: TABELLA })).toBeTruthy();
  });
});

describe('RA006: i valori dei filtri della verifica SMP SIGC da TX-0060 dell elenco operativo (decisione G2)', () => {
  it('chip con la descrizione dell intervento; TX-0060 in errore: lo stato col motivo e Riprova, i chip restano e il report si legge', async () => {
    const lette = servi();
    const { unmount } = apri(`${PERCORSO}?intervento=SRA01&esercizio=2025`);
    await tabella();
    const barra = screen.getByRole('region', { name: 'Filtri attivi' });
    await waitFor(() => expect(within(barra).getByRole('button', { name: /^Togli il filtro Intervento SRA01/ })).toBeTruthy());
    expect(lette.filtri).toBe(1);
    unmount();

    servi({ valori: null });
    apri(`${PERCORSO}?intervento=SRA01&esercizio=2025`);
    const stato = (await screen.findByText(/^Valori dei filtri non disponibili/)).closest('[role="status"]') as HTMLElement;
    expect(within(stato).getByRole('button', { name: 'Riprova' })).toBeTruthy();
    expect(within(screen.getByRole('region', { name: 'Filtri attivi' })).getByRole('button', { name: /^Togli il filtro Intervento SRA01/ })).toBeTruthy();
    await tabella();
  });
});
