// Pagina /istituzionale/interventi/:codice (green-fe step7): describe taggati coi REQ della route (RF016, RF017, RA006),
// dati dagli scenari del backend (fixture dell'istituzionale) con letture che rispondono ai parametri della query, MSW
// seminato con onUnhandledRequest 'error' (ogni lettura e' dichiarata qui), axe-core diretto. ECharts e' il grafico finto.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '../../../shared/api/mock/server';
import { expectNoA11yViolations } from '../../../shared/testing/axe';
import { descrizioneDi, tabellaDi, trovaCard } from '../../../shared/testing/card-grafico';
import { problema, trattenuta } from '../../../shared/testing/msw';
import { renderPagina } from '../../../shared/testing/render-pagina';
import { pngDelGrafico } from '../../../shared/ui/grafici/echarts';
import { OUTPUT, VERIFICA, verificaPer } from '../../../features/istituzionale/testing/fixture';
import { lettureIstituzionale } from '../../../features/istituzionale/testing/letture';
import Pagina from './page';

const PERCORSO = '/istituzionale/interventi/:codice';
const testo = (s: string | null | undefined) => (s ?? '').replace(/\s/g, ' ');
const profilo = (roles: string[]) =>
  server.use(http.get('*/auth/status', () => HttpResponse.json({ authenticated: true, user: { username: 'U', profile: 'p3-funzionario-area-ist', roles } })));

function servi(basi?: Parameters<typeof lettureIstituzionale>[0]) {
  const { handlers, lette } = lettureIstituzionale(basi);
  server.use(...handlers);
  return lette;
}

const apri = (indirizzo: string) => renderPagina(Pagina, PERCORSO, indirizzo);
const kpi = (nome: string) => screen.findByRole('region', { name: nome });
const voci = () => screen.findByRole('table', { name: /^I dati ASR non SIGC dell'intervento/ });
/** La riga della voce con l'etichetta data (intestazione di riga esatta). */
const voce = (t: HTMLElement, etichetta: string) => within(t).getByRole('rowheader', { name: etichetta }).closest('tr') as HTMLElement;
const UNA_SEZIONE = 'Una sezione della pagina non si è caricata.';
const NON_CARICATI = "Dati non caricati: l'avviso in cima alla pagina dice il motivo e permette di riprovare.";

afterEach(() => vi.restoreAllMocks());

describe("RF017: output programmato e realizzato dell'intervento per anno (TX-0017 filtrata sull'intervento)", () => {
  it('le letture col solo intervento della route, una per transazione anche aprendo le schede; testata, badge, KPI e le tre schede nell ordine del wireframe', async () => {
    const lette = servi();
    apri('/istituzionale/interventi/SRA01');
    expect(await screen.findByRole('heading', { level: 1, name: 'Produzione integrata' })).toBeTruthy();
    expect(testo((await kpi('Target di fine periodo')).textContent)).toContain('1500 ettari al 2029');
    expect(lette.output).toEqual(['?intervento=SRA01']);
    expect(lette.verifica).toEqual(['?intervento=SRA01']);
    expect(screen.getByText('Istituzionale - intervento SRA01')).toBeTruthy();
    expect(within(screen.getByRole('list', { name: 'Dati principali' })).getAllByRole('listitem').map((l) => l.textContent)).toEqual(['Perimetro regionale', 'Indicatore di output O.14 (ettari)']);
    // SRA01 e' SIGC: zero domande e zero spesa non SIGC, conteggi veri
    expect(testo((await kpi('Domande ricevute non SIGC')).textContent)).toContain('0');
    expect(screen.getAllByRole('tab').map((t) => [t.textContent, t.getAttribute('aria-selected')])).toEqual([
      ['Output per anno', 'true'],
      ['Verifica SMP non SIGC', 'false'],
      ['Importi unitari', 'false'],
    ]);
    // decisione D2 (review X2): TX-0016 e TX-0017 si leggono all'apertura della pagina, per KPI e badge; le schede leggono
    // dalla stessa cache, nessuna lettura in piu'
    await userEvent.click(screen.getByRole('tab', { name: 'Verifica SMP non SIGC' }));
    await voci();
    await userEvent.click(screen.getByRole('tab', { name: 'Importi unitari' }));
    await screen.findByRole('table', { name: /^Importo unitario per Unit Amount/ });
    await userEvent.click(screen.getByRole('tab', { name: 'Output per anno' }));
    await trovaCard('Output programmato e realizzato per anno (ettari)');
    expect(lette.verifica).toEqual(['?intervento=SRA01']);
    expect(lette.output).toEqual(['?intervento=SRA01']);
  });

  it('un solo h1 col focus e il titolo del documento dal codice; la barra dei riferimenti; nessuna violazione axe', async () => {
    servi();
    const { container } = apri('/istituzionale/interventi/SRD01');
    await kpi('Domande ricevute non SIGC');
    const h1 = screen.getByRole('heading', { level: 1, name: 'Investimenti produttivi agricoli per la competitività' });
    expect(document.activeElement).toBe(h1);
    expect(document.title).toBe('Intervento SRD01 - Istituzionale - Cruscotto CSR 2023-2027');
    const barra = screen.getByRole('region', { name: 'Riferimenti dei dati' });
    expect(within(barra).getByText('Perimetro: regionale (i report istituzionali non hanno perimetro ADA)')).toBeTruthy();
    expect(within(barra).getByRole('button', { name: /^Ultimo dato sincronizzato: dati al 02\/03\/2026/ })).toBeTruthy();
    await trovaCard('Output programmato e realizzato per anno (numero di operazioni)');
    await expectNoA11yViolations(container);
  });

  it('il grafico per anno ha il target come riferimento e come riga della tabella equivalente; CSV e XLSX dicono l intervento, il PNG il grafico', async () => {
    servi();
    apri('/istituzionale/interventi/SRA01');
    const card = await trovaCard('Output programmato e realizzato per anno (ettari)');
    expect(descrizioneDi(card)).toMatch(/Target di fine periodo: 1500 ettari al 2029\.$/);
    // review X3: il PNG contiene solo l'immagine del grafico, CSV e XLSX l'output e gli importi unitari (low-fi approvato)
    expect(within(card).getAllByRole('button', { name: /^Scarica / }).map((b) => b.getAttribute('aria-label'))).toEqual([
      'Scarica il grafico Output programmato e realizzato per anno (ettari) in PNG',
      "Scarica l'output e gli importi unitari dell'intervento SRA01 in CSV",
      "Scarica l'output e gli importi unitari dell'intervento SRA01 in XLSX",
    ]);
    const t = await tabellaDi(card);
    expect(within(t).getAllByRole('rowheader').at(-1)?.textContent).toBe('Target di fine periodo');
    expect(card.textContent).toContain('2023, programmato: non valorizzato (il dato non è presente nella fonte)');
  });

  it('il PNG della scheda Output dichiara i soli filtri di TX-0017: l anno di riferimento della verifica no (NFR-50)', async () => {
    servi();
    URL.createObjectURL = vi.fn(() => 'blob:prova');
    URL.revokeObjectURL = vi.fn();
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    const png = vi.mocked(pngDelGrafico);
    png.mockClear();
    apri('/istituzionale/interventi/SRA01?anno=2024');
    const card = await trovaCard('Output programmato e realizzato per anno (ettari)');
    await userEvent.click(within(card).getByRole('button', { name: / in PNG$/ }));
    await waitFor(() => expect(png).toHaveBeenCalledTimes(1));
    const intestazione = png.mock.calls[0][1].intestazione;
    expect(intestazione).toContain('Filtri applicati: Intervento: SRA01');
    expect(intestazione.join('\n')).not.toContain('Anno di riferimento');
  });

  it('il CSV della scheda Output e quello di TX-0017 dell intervento; il CSV della verifica ha anche l anno scelto', async () => {
    const lette = servi();
    URL.createObjectURL = vi.fn(() => 'blob:prova');
    URL.revokeObjectURL = vi.fn();
    const clic = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    apri('/istituzionale/interventi/SRD01?anno=2024');
    await userEvent.click(await screen.findByRole('button', { name: "Scarica l'output e gli importi unitari dell'intervento SRD01 in CSV" }));
    await waitFor(() => expect(clic).toHaveBeenCalledTimes(1));
    expect((clic.mock.contexts.at(-1) as HTMLAnchorElement).download).toBe('output-srd01-tx-0017.csv');
    await userEvent.click(screen.getByRole('tab', { name: 'Verifica SMP non SIGC' }));
    await userEvent.click(await screen.findByRole('button', { name: "Scarica la verifica SMP non SIGC dell'intervento SRD01 in XLSX" }));
    await waitFor(() => expect(clic).toHaveBeenCalledTimes(2));
    expect(lette.file).toEqual([
      '/api/istituzionale/output-regionale/csv?intervento=SRD01 XMLHttpRequest',
      '/api/istituzionale/verifica-smp-non-sigc/xlsx?intervento=SRD01&anno=2024 XMLHttpRequest',
    ]);
  });

  it('scheda Importi unitari in ordine di esercizio e di codice; un intervento senza Unit Amount lo dice', async () => {
    servi();
    apri('/istituzionale/interventi/SRA01');
    await userEvent.click(await screen.findByRole('tab', { name: 'Importi unitari' }));
    const importi = await screen.findByRole('table', { name: /^Importo unitario per Unit Amount/ });
    expect(Array.from(importi.querySelectorAll('tbody tr')).map((r) => testo(r.textContent))).toEqual([
      expect.stringMatching(/^UA01Seminativi2024250,00/),
      expect.stringMatching(/^UA02Seminativi2024180,00/),
      expect.stringMatching(/^UA01Seminativi2025260,00/),
    ]);
  });

  it('scheda Importi unitari di un intervento strutturale (nessuna Unit Amount): lo stato dichiarato', async () => {
    servi();
    apri('/istituzionale/interventi/SRD01');
    await userEvent.click(await screen.findByRole('tab', { name: 'Importi unitari' }));
    expect((await screen.findByText(/^Intervento senza Unit Amount/)).closest('[role="status"]')).not.toBeNull();
  });

  it('le schede da tastiera: le frecce cambiano scheda (tablist di react-aria)', async () => {
    servi();
    apri('/istituzionale/interventi/SRD01');
    const prima = await screen.findByRole('tab', { name: 'Output per anno' });
    act(() => prima.focus());
    await userEvent.keyboard('{ArrowRight}');
    const seconda = screen.getByRole('tab', { name: 'Verifica SMP non SIGC' });
    expect(document.activeElement).toBe(seconda);
    expect(seconda.getAttribute('aria-selected')).toBe('true');
    expect(await voci()).toBeTruthy();
  });

  it('solo col grant di TX-0017: niente scheda Verifica, nessuna lettura di TX-0016, nessun pulsante verso la verifica', async () => {
    profilo(['csr.tx-0017.read', 'csr.tx-0060.read']);
    const lette = servi();
    apri('/istituzionale/interventi/SRA01');
    await kpi('Target di fine periodo');
    expect(screen.getAllByRole('tab').map((t) => t.textContent)).toEqual(['Output per anno', 'Importi unitari']);
    expect(screen.queryByRole('region', { name: 'Domande ricevute non SIGC' })).toBeNull();
    expect(screen.queryByRole('link', { name: 'Verifica SMP non SIGC filtrata su questo intervento' })).toBeNull();
    expect(lette.verifica).toEqual([]);
  });
});

describe("RF016: la verifica SMP non SIGC dell'intervento (TX-0016 filtrata sull'intervento)", () => {
  it('le venti voci con l intestazione di riga, i link verso l elenco e la didascalia con l anno; nessuna violazione axe', async () => {
    servi();
    const { container } = apri('/istituzionale/interventi/SRD01');
    await userEvent.click(await screen.findByRole('tab', { name: 'Verifica SMP non SIGC' }));
    const t = await voci();
    expect(t.querySelector('caption')?.textContent).toContain('(anno di riferimento 2025)');
    expect(within(t).getAllByRole('rowheader')).toHaveLength(20);
    const ricevute = voce(t, 'Domande ricevute');
    expect(within(ricevute).getByRole('link', { name: "Apri nell'elenco operativo le domande di sostegno correnti dell'intervento SRD01" }).getAttribute('href')).toBe('/elenco-operativo/domande?tipo=SOSTEGNO&intervento=SRD01');
    const spesa = voce(t, 'Spesa pubblica erogata (anticipi inclusi, al lordo dei recuperi)');
    expect(within(spesa).getByRole('link', { name: /^Apri nei pagamenti: / }).getAttribute('href')).toBe('/elenco-operativo/pagamenti?esito=PAGATA&sigc=false&intervento=SRD01');
    // l'unita' dell'indicatore (TX-0017) accanto alle quantita' di TX-0016
    expect(testo(voce(t, 'Output atteso delle domande finanziate').textContent)).toContain('40 numero di operazioni');
    expect(testo(voce(t, 'La dotazione include top-up').textContent)).toContain('sì');
    await expectNoA11yViolations(container);
  });

  it('l anno si sceglie con Mostra: una lettura nuova con l anno, i dati di prima restano e il focus resta su Mostra', async () => {
    const lette = servi();
    const { router } = apri('/istituzionale/interventi/SRD01');
    await userEvent.click(await screen.findByRole('tab', { name: 'Verifica SMP non SIGC' }));
    await voci();
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Anno di riferimento del monitoraggio SMP non SIGC' }), '2024');
    const mostra = screen.getByRole('button', { name: 'Mostra' });
    await userEvent.click(mostra);
    await waitFor(() => expect(router.state.location.search).toBe('?anno=2024'));
    await waitFor(() => expect(lette.verifica.at(-1)).toBe('?intervento=SRD01&anno=2024'));
    await waitFor(async () => expect((await voci()).querySelector('caption')?.textContent).toContain('(anno di riferimento 2024)'));
    expect(document.activeElement).toBe(mostra);
    expect(testo(voce(await voci(), 'Dotazione degli avvisi').textContent)).toContain("non disponibile per l'anno scelto");
    // i pulsanti della testata portano l'anno scelto verso la verifica, non verso l'output
    expect(screen.getByRole('link', { name: 'Verifica SMP non SIGC filtrata su questo intervento' }).getAttribute('href')).toBe('/istituzionale/verifica-smp-non-sigc?intervento=SRD01&anno=2024');
    expect(screen.getByRole('link', { name: 'Output regionale filtrato su questo intervento' }).getAttribute('href')).toBe('/istituzionale/output-regionale?intervento=SRD01');
  });

  it('durante la lettura di un altro anno i dati di prima restano con lo stato detto in role=status e aria-busy', async () => {
    servi();
    const t = trattenuta();
    server.use(
      http.get('*/api/istituzionale/verifica-smp-non-sigc', async ({ request }) => {
        const p = new URL(request.url).searchParams;
        if (p.has('anno')) await t.attesa;
        return HttpResponse.json(verificaPer(VERIFICA, p));
      }),
    );
    apri('/istituzionale/interventi/SRD01');
    await userEvent.click(await screen.findByRole('tab', { name: 'Verifica SMP non SIGC' }));
    await voci();
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Anno di riferimento del monitoraggio SMP non SIGC' }), '2024');
    await userEvent.click(screen.getByRole('button', { name: 'Mostra' }));
    // lo stato dice l'anno dei dati che restano, lo stesso della didascalia, non "l'anno precedente" (review X1)
    const stato = await screen.findByText("Lettura dell'anno 2024 in corso: restano i dati dell'anno di riferimento 2025.");
    expect(stato.getAttribute('role')).toBe('status');
    const risultati = (await voci()).closest('.ui-risultati') as HTMLElement;
    expect(risultati.getAttribute('aria-busy')).toBe('true');
    expect((await voci()).querySelector('caption')?.textContent).toContain('(anno di riferimento 2025)');
    await act(async () => t.libera());
    await waitFor(async () => expect((await voci()).querySelector('caption')?.textContent).toContain('(anno di riferimento 2024)'));
    expect(stato.textContent).toBe('');
    expect(risultati.getAttribute('aria-busy')).toBeNull();
  });

  it('il codice del percorso e codificato: un valore con / non manda richieste e la pagina lo dice', async () => {
    const lette = servi();
    apri('/istituzionale/interventi/SR%2F..%2FA01');
    expect(screen.getByRole('heading', { level: 1, name: 'Intervento non valido' })).toBeTruthy();
    expect(screen.getByRole('alert').textContent).toMatch(/^Il codice nell'indirizzo non è un codice di intervento/);
    await act(async () => new Promise((r) => setTimeout(r, 30)));
    expect(lette.verifica).toEqual([]);
    expect(lette.output).toEqual([]);
    expect(lette.filtri).toBe(0);
  });

  it('intervento senza dati nei report (AT001): lo stato dichiarato col ritorno all output regionale', async () => {
    servi();
    const { router } = apri('/istituzionale/interventi/AT001');
    const stato = (await screen.findByText(/^Nessun dato per questo intervento nei report istituzionali/)).closest('[role="status"]') as HTMLElement;
    expect(screen.queryAllByRole('tab')).toHaveLength(0);
    await userEvent.click(within(stato).getByRole('link', { name: "Torna all'output regionale" }));
    await waitFor(() => expect(router.state.location.pathname).toBe('/istituzionale/output-regionale'));
  });

  it('intervento senza dati col solo grant di TX-0016: il ritorno e alla verifica SMP non SIGC, nessuna lettura di TX-0017', async () => {
    profilo(['csr.tx-0016.read']);
    const lette = servi();
    apri('/istituzionale/interventi/AT001');
    const stato = (await screen.findByText(/^Nessun dato per questo intervento nei report istituzionali/)).closest('[role="status"]') as HTMLElement;
    expect(within(stato).getByRole('link', { name: 'Torna alla verifica SMP non SIGC' }).getAttribute('href')).toBe('/istituzionale/verifica-smp-non-sigc');
    expect(within(stato).queryByRole('link', { name: "Torna all'output regionale" })).toBeNull();
    expect(lette.output).toEqual([]);
    expect(lette.verifica).toEqual(['?intervento=AT001']);
  });

  it('caricamento con lo scheletro e aria-live, poi i dati', async () => {
    const t = trattenuta();
    servi();
    server.use(
      http.get('*/api/istituzionale/output-regionale', async () => {
        await t.attesa;
        return HttpResponse.json(OUTPUT);
      }),
    );
    apri('/istituzionale/interventi/SRA01');
    const caricamento = await screen.findByText('Caricamento in corso…');
    expect(caricamento.closest('[role="status"]')?.getAttribute('aria-live')).toBe('polite');
    await act(async () => t.libera());
    await kpi('Target di fine periodo');
  });

  it('errore di entrambe le letture: un solo avviso della pagina con Riprova, che le rilegge', async () => {
    servi();
    let tentativi = 0;
    const errore = () => {
      tentativi += 1;
      return tentativi <= 2 ? HttpResponse.json(problema(503, 'TEMPO_SCADUTO', 'lettura oltre il tetto di durata'), { status: 503 }) : null;
    };
    server.use(
      http.get('*/api/istituzionale/verifica-smp-non-sigc', () => errore() ?? HttpResponse.json(VERIFICA)),
      http.get('*/api/istituzionale/output-regionale', () => errore() ?? HttpResponse.json(OUTPUT)),
    );
    apri('/istituzionale/interventi/SRA01');
    const avviso = await screen.findByRole('alert');
    expect(screen.getAllByRole('alert')).toHaveLength(1);
    expect(avviso.textContent).toContain('2 sezioni della pagina non si sono caricate.');
    expect(within(screen.getByRole('region', { name: 'Riferimenti dei dati' })).getByText('Ultimo dato sincronizzato: non disponibile')).toBeTruthy();
    await userEvent.click(within(avviso).getByRole('button', { name: 'Riprova' }));
    await kpi('Target di fine periodo');
  });

  it('errore di TX-0016: i dati di TX-0017 restano; l avviso dice una sezione, prima e dopo l apertura della scheda, e il testo statico e uno', async () => {
    servi();
    server.use(http.get('*/api/istituzionale/verifica-smp-non-sigc', () => HttpResponse.json(problema(403, 'ACCESSO_NEGATO'), { status: 403 })));
    apri('/istituzionale/interventi/SRA01');
    await kpi('Target di fine periodo');
    // l'avviso c'e' subito, anche con la scheda della verifica chiusa; i KPI di TX-0016 no
    expect((await screen.findByRole('alert')).textContent).toContain(UNA_SEZIONE);
    expect(screen.queryByRole('region', { name: 'Domande ricevute non SIGC' })).toBeNull();
    await userEvent.click(screen.getByRole('tab', { name: 'Verifica SMP non SIGC' }));
    const scheda = await screen.findByRole('tabpanel', { name: 'Verifica SMP non SIGC' });
    expect(within(scheda).getByText(NON_CARICATI)).toBeTruthy();
    // review H1: la lettura ha un solo proprietario del suo errore, anche con la sua scheda aperta
    expect(screen.getAllByRole('alert')).toHaveLength(1);
    expect(screen.getByRole('alert').textContent).toContain(UNA_SEZIONE);
    expect(screen.getAllByText(NON_CARICATI)).toHaveLength(1);
  });

  it('errore di TX-0017: la scheda iniziale Output dice il testo statico una volta, l avviso una sezione', async () => {
    servi();
    server.use(http.get('*/api/istituzionale/output-regionale', () => HttpResponse.json(problema(403, 'ACCESSO_NEGATO'), { status: 403 })));
    apri('/istituzionale/interventi/SRD01');
    await kpi('Domande ricevute non SIGC');
    const scheda = screen.getByRole('tabpanel', { name: 'Output per anno' });
    expect(within(scheda).getByText(NON_CARICATI)).toBeTruthy();
    expect(screen.getAllByText(NON_CARICATI)).toHaveLength(1);
    expect(screen.getAllByRole('alert')).toHaveLength(1);
    expect(screen.getByRole('alert').textContent).toContain(UNA_SEZIONE);
    expect(screen.queryByRole('region', { name: 'Target di fine periodo' })).toBeNull();
  });

  it('dopo l errore di TX-0016 Riprova rilegge nella sua scheda: i KPI di TX-0017 e la scheda Verifica scelta restano', async () => {
    servi();
    const t = trattenuta();
    let tentativi = 0;
    server.use(
      http.get('*/api/istituzionale/verifica-smp-non-sigc', async ({ request }) => {
        tentativi += 1;
        if (tentativi === 1) return HttpResponse.json(problema(503, 'TEMPO_SCADUTO', 'lettura oltre il tetto di durata'), { status: 503 });
        await t.attesa;
        return HttpResponse.json(verificaPer(VERIFICA, new URL(request.url).searchParams));
      }),
    );
    apri('/istituzionale/interventi/SRD01');
    await kpi('Target di fine periodo');
    await userEvent.click(screen.getByRole('tab', { name: 'Verifica SMP non SIGC' }));
    await userEvent.click(within(await screen.findByRole('alert')).getByRole('button', { name: 'Riprova' }));
    // review X1: la lettura che riparte mostra lo scheletro nella sua scheda, la pagina resta
    expect(await within(screen.getByRole('tabpanel', { name: 'Verifica SMP non SIGC' })).findByText('Caricamento in corso…')).toBeTruthy();
    expect(screen.getByRole('region', { name: 'Target di fine periodo' })).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'Verifica SMP non SIGC' }).getAttribute('aria-selected')).toBe('true');
    await act(async () => t.libera());
    expect(await voci()).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'Verifica SMP non SIGC' }).getAttribute('aria-selected')).toBe('true');
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('dopo l errore di TX-0016 un altro anno con Mostra: la scheda Verifica resta scelta e il focus resta su Mostra', async () => {
    servi();
    let tentativi = 0;
    server.use(
      http.get('*/api/istituzionale/verifica-smp-non-sigc', ({ request }) => {
        tentativi += 1;
        if (tentativi === 1) return HttpResponse.json(problema(503, 'TEMPO_SCADUTO', 'lettura oltre il tetto di durata'), { status: 503 });
        return HttpResponse.json(verificaPer(VERIFICA, new URL(request.url).searchParams));
      }),
    );
    const { router } = apri('/istituzionale/interventi/SRD01');
    await kpi('Target di fine periodo');
    await userEvent.click(screen.getByRole('tab', { name: 'Verifica SMP non SIGC' }));
    await userEvent.selectOptions(await screen.findByRole('combobox', { name: 'Anno di riferimento del monitoraggio SMP non SIGC' }), '2024');
    const mostra = screen.getByRole('button', { name: 'Mostra' });
    await userEvent.click(mostra);
    await waitFor(() => expect(router.state.location.search).toBe('?anno=2024'));
    await waitFor(async () => expect((await voci()).querySelector('caption')?.textContent).toContain('(anno di riferimento 2024)'));
    expect(screen.getByRole('tab', { name: 'Verifica SMP non SIGC' }).getAttribute('aria-selected')).toBe('true');
    expect(document.activeElement).toBe(mostra);
  });
});

describe("RA006: la descrizione dell'intervento da TX-0060 dell'elenco operativo (decisione G2)", () => {
  it('senza il grant csr.tx-0060.read: nessuna lettura di TX-0060, il titolo e "Intervento <codice>"', async () => {
    profilo(['csr.tx-0016.read', 'csr.tx-0017.read']);
    const lette = servi();
    apri('/istituzionale/interventi/SRD01');
    expect(await screen.findByRole('heading', { level: 1, name: 'Intervento SRD01' })).toBeTruthy();
    await kpi('Domande ricevute non SIGC');
    expect(lette.filtri).toBe(0);
  });

  it('TX-0060 in errore: il titolo resta il codice e la pagina si legge', async () => {
    servi({ valori: null });
    apri('/istituzionale/interventi/SRD01');
    await kpi('Domande ricevute non SIGC');
    expect(screen.getByRole('heading', { level: 1, name: 'Intervento SRD01' })).toBeTruthy();
  });
});
