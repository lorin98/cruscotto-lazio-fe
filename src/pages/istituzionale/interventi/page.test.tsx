// Pagina /istituzionale/interventi/:codice (green-fe step7): describe taggati coi REQ della route (RF016, RF015, RA006; RF017 e'
// del fisico dal riallineamento degli ambiti del 29/10/2026), dati dagli scenari del backend (fixture dell'istituzionale)
// con letture che rispondono ai parametri della query, MSW seminato con onUnhandledRequest 'error' (ogni lettura e'
// dichiarata qui), axe-core diretto.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '../../../shared/api/mock/server';
import { expectNoA11yViolations } from '../../../shared/testing/axe';
import { problema, trattenuta } from '../../../shared/testing/msw';
import { renderPagina } from '../../../shared/testing/render-pagina';
import { VERIFICA, VERIFICA_SMP, verificaPer, verificaSigcPer } from '../../../features/istituzionale/testing/fixture';
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
const NON_CARICATI = "Dati non caricati: l'avviso in cima alla pagina dice il motivo e permette di riprovare.";

afterEach(() => vi.restoreAllMocks());

describe("RF016: testata, KPI e scheda dell'intervento (TX-0016 filtrata sull'intervento; TX-0017 al fisico dal 29/10/2026)", () => {
  it('la lettura col solo intervento della route; testata, badge, KPI e la scheda della verifica', async () => {
    const lette = servi();
    apri('/istituzionale/interventi/SRA01');
    expect(await screen.findByRole('heading', { level: 1, name: 'Produzione integrata' })).toBeTruthy();
    expect(lette.verifica).toEqual(['?intervento=SRA01']);
    expect(screen.getByText('Istituzionale - intervento SRA01')).toBeTruthy();
    expect(within(screen.getByRole('list', { name: 'Dati principali' })).getAllByRole('listitem').map((l) => l.textContent)).toEqual(['Perimetro regionale']);
    // SRA01 e' SIGC: zero domande e zero spesa non SIGC, conteggi veri
    expect(testo((await kpi('Domande ricevute non SIGC')).textContent)).toContain('0');
    // l'output regionale (TX-0017: KPI del target, schede Output per anno e Importi unitari) e' del fisico
    expect(screen.queryByRole('region', { name: 'Target di fine periodo' })).toBeNull();
    expect(screen.getAllByRole('tab').map((t) => [t.textContent, t.getAttribute('aria-selected')])).toEqual([
      ['Verifica SMP non SIGC', 'true'],
      ['Verifica SMP SIGC', 'false'],
    ]);
    expect(screen.queryByRole('link', { name: 'Output regionale filtrato su questo intervento' })).toBeNull();
    await voci();
    expect(lette.verifica).toEqual(['?intervento=SRA01']);
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
    await voci();
    await expectNoA11yViolations(container);
  });

  it('il CSV della verifica e quello di TX-0016 dell intervento con l anno scelto', async () => {
    const lette = servi();
    URL.createObjectURL = vi.fn(() => 'blob:prova');
    URL.revokeObjectURL = vi.fn();
    const clic = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
    apri('/istituzionale/interventi/SRD01?anno=2025');
    await voci();
    await userEvent.click(screen.getByRole('button', { name: "Scarica la verifica SMP non SIGC dell'intervento SRD01 in CSV" }));
    await waitFor(() => expect(lette.file).toEqual(['/api/istituzionale/verifica-smp-non-sigc/csv?intervento=SRD01&anno=2025 XMLHttpRequest']));
    expect((clic.mock.contexts.at(-1) as HTMLAnchorElement).download).toBe('verifica-smp-non-sigc-srd01-tx-0016.csv');
  });
});

describe("RF016: la verifica SMP non SIGC dell'intervento (TX-0016 filtrata sull'intervento)", () => {
  it('le venti voci con l intestazione di riga, i link verso l elenco e la didascalia con l anno; nessuna violazione axe', async () => {
    servi();
    const { container } = apri('/istituzionale/interventi/SRD01');
    const t = await voci();
    expect(t.querySelector('caption')?.textContent).toContain('(anno di riferimento 2025)');
    expect(within(t).getAllByRole('rowheader')).toHaveLength(20);
    const ricevute = voce(t, 'Domande ricevute');
    expect(within(ricevute).getByRole('link', { name: "Apri nell'elenco operativo le domande di sostegno correnti dell'intervento SRD01" }).getAttribute('href')).toBe('/elenco-operativo/domande?tipo=SOSTEGNO&intervento=SRD01');
    const spesa = voce(t, 'Spesa pubblica erogata (anticipi inclusi, al lordo dei recuperi)');
    expect(within(spesa).getByRole('link', { name: /^Apri nei pagamenti: / }).getAttribute('href')).toBe('/elenco-operativo/pagamenti?esito=PAGATA&sigc=false&intervento=SRD01');
    // senza TX-0017 (al fisico) le quantita' di TX-0016 sono senza unita' di misura, col codice dell'indicatore (OP-IS-12)
    expect(testo(voce(t, 'Output atteso delle domande finanziate').lastElementChild?.textContent)).toBe('40 (indicatore O.20)');
    expect(testo(voce(t, 'Output atteso delle domande finanziate').textContent)).not.toContain('numero di operazioni');
    expect(testo(voce(t, 'La dotazione include top-up').textContent)).toContain('sì');
    await expectNoA11yViolations(container);
  });

  it('l anno si sceglie con Mostra: una lettura nuova con l anno, i dati di prima restano e il focus resta su Mostra', async () => {
    const lette = servi();
    const { router } = apri('/istituzionale/interventi/SRD01');
    await voci();
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Anno di riferimento del monitoraggio SMP non SIGC' }), '2024');
    const mostra = screen.getByRole('button', { name: 'Mostra' });
    await userEvent.click(mostra);
    await waitFor(() => expect(router.state.location.search).toBe('?anno=2024'));
    await waitFor(() => expect(lette.verifica.at(-1)).toBe('?intervento=SRD01&anno=2024'));
    await waitFor(async () => expect((await voci()).querySelector('caption')?.textContent).toContain('(anno di riferimento 2024)'));
    expect(document.activeElement).toBe(mostra);
    expect(testo(voce(await voci(), 'Dotazione degli avvisi').textContent)).toContain("non disponibile per l'anno scelto");
    // il pulsante della testata porta l'anno scelto verso la verifica
    expect(screen.getByRole('link', { name: 'Verifica SMP non SIGC filtrata su questo intervento' }).getAttribute('href')).toBe('/istituzionale/verifica-smp-non-sigc?intervento=SRD01&anno=2024');
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

  it('il codice del percorso e codificato: un valore con / non manda richieste e la pagina lo dice, con le due verifiche da cui sceglierlo', async () => {
    const lette = servi();
    apri('/istituzionale/interventi/SR%2F..%2FA01');
    expect(screen.getByRole('heading', { level: 1, name: 'Intervento non valido' })).toBeTruthy();
    expect(screen.getByRole('alert').textContent).toMatch(/^Il codice nell'indirizzo non è un codice di intervento/);
    // al dettaglio si arriva da entrambe le verifiche (review del riallineamento IST-09)
    expect(screen.getByRole('alert').textContent?.endsWith("Scegli l'intervento dalla verifica SMP non SIGC o dalla verifica SMP SIGC.")).toBe(true);
    await act(async () => new Promise((r) => setTimeout(r, 30)));
    expect(lette.verifica).toEqual([]);
    expect(lette.verificaSigc).toEqual([]);
    expect(lette.filtri).toBe(0);
  });

  it('intervento senza dati nel report (AT001): lo stato dichiarato col ritorno alla verifica SMP non SIGC', async () => {
    const lette = servi();
    const { router } = apri('/istituzionale/interventi/AT001');
    const stato = (await screen.findByText(/^Nessun dato per questo intervento nella verifica SMP/)).closest('[role="status"]') as HTMLElement;
    expect(screen.queryAllByRole('tab')).toHaveLength(0);
    expect(within(stato).queryByRole('link', { name: "Torna all'output regionale" })).toBeNull();
    expect(lette.verifica).toEqual(['?intervento=AT001']);
    await userEvent.click(within(stato).getByRole('link', { name: 'Torna alla verifica SMP non SIGC' }));
    await waitFor(() => expect(router.state.location.pathname).toBe('/istituzionale/verifica-smp-non-sigc'));
  });

  it('caricamento con lo scheletro e aria-live, poi i dati', async () => {
    const t = trattenuta();
    servi();
    server.use(
      http.get('*/api/istituzionale/verifica-smp-non-sigc', async ({ request }) => {
        await t.attesa;
        return HttpResponse.json(verificaPer(VERIFICA, new URL(request.url).searchParams));
      }),
    );
    apri('/istituzionale/interventi/SRA01');
    const caricamento = await screen.findByText('Caricamento in corso…');
    expect(caricamento.closest('[role="status"]')?.getAttribute('aria-live')).toBe('polite');
    await act(async () => t.libera());
    await kpi('Domande ricevute non SIGC');
  });

  it('errore della lettura: un solo avviso della pagina con Riprova, che la rilegge', async () => {
    servi();
    let tentativi = 0;
    server.use(
      http.get('*/api/istituzionale/verifica-smp-non-sigc', ({ request }) => {
        tentativi += 1;
        if (tentativi === 1) return HttpResponse.json(problema(503, 'TEMPO_SCADUTO', 'lettura oltre il tetto di durata'), { status: 503 });
        return HttpResponse.json(verificaPer(VERIFICA, new URL(request.url).searchParams));
      }),
    );
    apri('/istituzionale/interventi/SRA01');
    const avviso = await screen.findByRole('alert');
    expect(screen.getAllByRole('alert')).toHaveLength(1);
    expect(within(screen.getByRole('region', { name: 'Riferimenti dei dati' })).getByText('Ultimo dato sincronizzato: non disponibile')).toBeTruthy();
    await userEvent.click(within(avviso).getByRole('button', { name: 'Riprova' }));
    await kpi('Domande ricevute non SIGC');
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('errore di TX-0016 (403): un solo avviso, nessun KPI; la pagina non dice due volte il testo statico', async () => {
    servi();
    server.use(http.get('*/api/istituzionale/verifica-smp-non-sigc', () => HttpResponse.json(problema(403, 'ACCESSO_NEGATO'), { status: 403 })));
    apri('/istituzionale/interventi/SRA01');
    expect((await screen.findByRole('alert')).textContent).toBeTruthy();
    expect(screen.getAllByRole('alert')).toHaveLength(1);
    expect(screen.queryByRole('region', { name: 'Domande ricevute non SIGC' })).toBeNull();
    expect(screen.queryAllByText(NON_CARICATI).length).toBeLessThanOrEqual(1);
  });

  it('dopo l errore e Riprova un altro anno con Mostra: la scheda Verifica resta scelta e il focus resta su Mostra', async () => {
    servi();
    let tentativi = 0;
    server.use(
      http.get('*/api/istituzionale/verifica-smp-non-sigc', ({ request }) => {
        tentativi += 1;
        if (tentativi === 1) return HttpResponse.json(problema(503, 'TEMPO_SCADUTO', 'lettura oltre il tetto di durata'), { status: 503 });
        return HttpResponse.json(verificaPer(VERIFICA, new URL(request.url).searchParams));
      }),
    );
    const { router } = apri('/istituzionale/interventi/SRD01?anno=2025');
    await userEvent.click(within(await screen.findByRole('alert')).getByRole('button', { name: 'Riprova' }));
    await voci();
    await userEvent.selectOptions(await screen.findByRole('combobox', { name: 'Anno di riferimento del monitoraggio SMP non SIGC' }), '2024');
    const mostra = screen.getByRole('button', { name: 'Mostra' });
    await userEvent.click(mostra);
    await waitFor(() => expect(router.state.location.search).toBe('?anno=2024'));
    await waitFor(async () => expect((await voci()).querySelector('caption')?.textContent).toContain('(anno di riferimento 2024)'));
    expect(screen.getByRole('tab', { name: 'Verifica SMP non SIGC' }).getAttribute('aria-selected')).toBe('true');
    expect(document.activeElement).toBe(mostra);
  });
});

describe("RF015: la scheda Verifica SMP SIGC dell'intervento (TX-0015 filtrata sull'intervento, wireframe del 30/10/2026)", () => {
  const vociSigc = () => screen.findByRole('table', { name: /^I dati SIGC dell'intervento da confrontare con SMP/ });
  const valore = (t: HTMLElement, etichetta: string) => testo(voce(t, etichetta).lastElementChild?.textContent);

  it('dal clic della verifica SIGC (esercizio, senza anno) si apre la scheda SIGC e legge solo TX-0015: KPI della campagna n-1, riferimenti e venti voci; nessuna violazione axe', async () => {
    const lette = servi();
    const { container } = apri('/istituzionale/interventi/SRA01?esercizio=2025');
    const t = await vociSigc();
    expect(t.querySelector('caption')?.textContent).toBe("I dati SIGC dell'intervento da confrontare con SMP (esercizio 2025, domande della campagna 2024), con i valori assenti e il loro motivo");
    expect(screen.getAllByRole('tab').map((s) => [s.textContent, s.getAttribute('aria-selected')])).toEqual([
      ['Verifica SMP non SIGC', 'false'],
      ['Verifica SMP SIGC', 'true'],
    ]);
    expect([lette.verifica, lette.verificaSigc]).toEqual([[], ['?intervento=SRA01&esercizio=2025']]);
    // i KPI col periodo nel testo: campagna n-1 nell'etichetta, esercizio n nella nota
    expect(testo((await kpi('Domande ricevute SIGC (campagna 2024)')).textContent)).toContain('TX-0015, esercizio 2025');
    expect(testo((await kpi('Domande finanziate SIGC (campagna 2024)')).textContent)).toContain('100');
    expect(testo((await kpi('Spesa erogata SIGC, campagna 2024')).textContent)).toContain("TX-0015, pagata nell'esercizio 2025");
    expect(within(t).getAllByRole('rowheader')).toHaveLength(23);
    expect(valore(t, 'Esercizio')).toBe('2025 (dal 16/10/2024 al 15/10/2025)');
    expect(valore(t, "Pagamenti dell'intervento senza data di autorizzazione (esclusi dall'esercizio)")).toBe('3');
    expect(valore(t, "Si prevede di pagare importi entro l'esercizio")).toBe('non disponibilefonte previsione di pagamento non attiva');
    expect(valore(t, 'Ettari o UBA richiesti')).toBe('350,5');
    expect(valore(t, "Output erogato nell'esercizio (solo SIGC)")).toBe('non disponibile');
    // "Dati al" della risposta di TX-0015, la sola lettura partita
    expect(within(screen.getByRole('region', { name: 'Riferimenti dei dati' })).getByRole('button', { name: /^Ultimo dato sincronizzato: dati al 02\/03\/2026/ })).toBeTruthy();
    expect(screen.getByText(/^Definizioni del backend \(decisioni di finanziario richiamate da istituzionale\)/)).toBeTruthy();
    await expectNoA11yViolations(container);
  });

  it('le schede si scelgono da tastiera (frecce): la SIGC senza esercizio chiede di sceglierlo e non legge; poi Mostra legge, il focus resta su Mostra', async () => {
    const lette = servi();
    const { router } = apri('/istituzionale/interventi/SRA01');
    await voci();
    const nonSigc = screen.getByRole('tab', { name: 'Verifica SMP non SIGC' });
    act(() => nonSigc.focus());
    await userEvent.keyboard('{ArrowRight}');
    const sigc = screen.getByRole('tab', { name: 'Verifica SMP SIGC' });
    expect(document.activeElement).toBe(sigc);
    await waitFor(() => expect(sigc.getAttribute('aria-selected')).toBe('true'));
    expect((await screen.findByText("Scegli l'esercizio finanziario da consultare.")).closest('[role="status"]')).not.toBeNull();
    expect(lette.verificaSigc).toEqual([]);
    expect(screen.getByRole('combobox', { name: 'Esercizio finanziario' }).getAttribute('aria-describedby')).toBe('f-esercizio-intervento-aiuto');
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Esercizio finanziario' }), '2025');
    const mostra = screen.getByRole('button', { name: 'Mostra' });
    await userEvent.click(mostra);
    await waitFor(() => expect(router.state.location.search).toBe('?esercizio=2025'));
    await vociSigc();
    expect(lette.verificaSigc).toEqual(['?intervento=SRA01&esercizio=2025']);
    expect(document.activeElement).toBe(mostra);
    // la scheda non SIGC gia' aperta resta letta una volta sola; le frecce tornano indietro
    act(() => sigc.focus());
    await userEvent.keyboard('{ArrowLeft}');
    await waitFor(() => expect(nonSigc.getAttribute('aria-selected')).toBe('true'));
    await voci();
    expect(lette.verifica).toEqual(['?intervento=SRA01']);
  });

  it('un altro esercizio con Mostra: i dati di prima restano con lo stato detto in role=status e aria-busy, poi quelli nuovi', async () => {
    servi();
    const t = trattenuta();
    server.use(
      http.get('*/api/istituzionale/verifica-smp-sigc', async ({ request }) => {
        const p = new URL(request.url).searchParams;
        if (p.get('esercizio') === '2024') await t.attesa;
        return HttpResponse.json(verificaSigcPer(VERIFICA_SMP, p));
      }),
    );
    apri('/istituzionale/interventi/SRA01?esercizio=2025');
    await vociSigc();
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Esercizio finanziario' }), '2024');
    await userEvent.click(screen.getByRole('button', { name: 'Mostra' }));
    const stato = await screen.findByText("Lettura dell'esercizio 2024 in corso: restano i dati dell'esercizio 2025.");
    expect(stato.getAttribute('role')).toBe('status');
    const risultati = (await vociSigc()).closest('.ui-risultati') as HTMLElement;
    expect(risultati.getAttribute('aria-busy')).toBe('true');
    await act(async () => t.libera());
    await waitFor(async () => expect((await vociSigc()).querySelector('caption')?.textContent).toContain('(esercizio 2024, domande della campagna 2023)'));
    expect(risultati.getAttribute('aria-busy')).toBeNull();
  });

  it("intervento senza la riga SIGC dell'esercizio: lo dice la scheda, che resta col selettore (non il vuoto della pagina)", async () => {
    servi();
    apri('/istituzionale/interventi/SRD01?esercizio=2025');
    const vuoto = (await screen.findByText("Nessun dato SIGC per questo intervento nell'esercizio scelto. Scegli un altro esercizio.")).closest('[role="status"]') as HTMLElement;
    expect(vuoto.closest('[role="tabpanel"]')).not.toBeNull();
    expect(screen.getByRole('combobox', { name: 'Esercizio finanziario' })).toBeTruthy();
    expect(screen.getAllByRole('tab')).toHaveLength(2);
    expect(screen.queryByText(/^Nessun dato per questo intervento nella verifica SMP/)).toBeNull();
    expect(screen.queryByRole('region', { name: 'Domande ricevute SIGC (campagna 2024)' })).toBeNull();
  });

  it('il CSV della scheda SIGC: TX-0015 dell intervento con l esercizio, nome col codice e l esercizio', async () => {
    const lette = servi();
    URL.createObjectURL = vi.fn(() => 'blob:prova');
    URL.revokeObjectURL = vi.fn();
    const clic = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
    apri('/istituzionale/interventi/SRA01?esercizio=2025');
    await vociSigc();
    await userEvent.click(screen.getByRole('button', { name: "Scarica la verifica SMP SIGC dell'intervento SRA01, esercizio 2025 in CSV" }));
    await waitFor(() => expect(lette.file).toEqual(['/api/istituzionale/verifica-smp-sigc/csv?intervento=SRA01&esercizio=2025 XMLHttpRequest']));
    expect((clic.mock.contexts.at(-1) as HTMLAnchorElement).download).toBe('verifica-smp-sigc-sra01-esercizio-2025-tx-0015.csv');
    expect(await screen.findByText('File CSV scaricato.')).toBeTruthy();
  });

  it('errore di TX-0015: un solo avviso della pagina con Riprova, la scheda dice il testo statico; "Dati al" non disponibile', async () => {
    servi();
    let tentativi = 0;
    server.use(
      http.get('*/api/istituzionale/verifica-smp-sigc', ({ request }) => {
        tentativi += 1;
        if (tentativi === 1) return HttpResponse.json(problema(503, 'TEMPO_SCADUTO', 'lettura oltre il tetto di durata'), { status: 503 });
        return HttpResponse.json(verificaSigcPer(VERIFICA_SMP, new URL(request.url).searchParams));
      }),
    );
    apri('/istituzionale/interventi/SRA01?esercizio=2025');
    const avviso = await screen.findByRole('alert');
    expect(screen.getAllByRole('alert')).toHaveLength(1);
    expect(within(screen.getByRole('region', { name: 'Riferimenti dei dati' })).getByText('Ultimo dato sincronizzato: non disponibile')).toBeTruthy();
    await userEvent.click(within(avviso).getByRole('button', { name: 'Riprova' }));
    await vociSigc();
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('link verifica-smp-sigc-intervento: il pulsante della testata col grant di TX-0015 porta intervento ed esercizio; senza il grant ne pulsante ne scheda', async () => {
    servi();
    const { unmount } = apri('/istituzionale/interventi/SRA01?esercizio=2025');
    await vociSigc();
    expect(screen.getByRole('link', { name: 'Verifica SMP SIGC filtrata su questo intervento' }).getAttribute('href')).toBe('/istituzionale/verifica-smp-sigc?intervento=SRA01&esercizio=2025');
    expect(screen.getByRole('link', { name: 'Verifica SMP non SIGC filtrata su questo intervento' }).getAttribute('href')).toBe('/istituzionale/verifica-smp-non-sigc?intervento=SRA01');
    unmount();

    profilo(['csr.tx-0016.read', 'csr.tx-0060.read']);
    const lette = servi();
    apri('/istituzionale/interventi/SRA01?esercizio=2025');
    await voci();
    expect(screen.queryByRole('link', { name: 'Verifica SMP SIGC filtrata su questo intervento' })).toBeNull();
    expect(screen.getAllByRole('tab').map((s) => s.textContent)).toEqual(['Verifica SMP non SIGC']);
    expect(lette.verificaSigc).toEqual([]);
  });

  it('col solo grant di TX-0015: la sola scheda SIGC; senza esercizio la pagina mostra la scheda (nessuno scheletro) e non legge nulla', async () => {
    profilo(['csr.tx-0015.read', 'csr.tx-0060.read']);
    const lette = servi();
    apri('/istituzionale/interventi/SRA01');
    expect((await screen.findByText("Scegli l'esercizio finanziario da consultare.")).closest('[role="tabpanel"]')).not.toBeNull();
    expect(screen.getAllByRole('tab').map((s) => [s.textContent, s.getAttribute('aria-selected')])).toEqual([['Verifica SMP SIGC', 'true']]);
    expect(screen.queryByText('Caricamento in corso…')).toBeNull();
    expect(screen.queryByRole('link', { name: 'Verifica SMP non SIGC filtrata su questo intervento' })).toBeNull();
    expect(screen.getByRole('link', { name: 'Verifica SMP SIGC filtrata su questo intervento' }).getAttribute('href')).toBe('/istituzionale/verifica-smp-sigc?intervento=SRA01');
    expect([lette.verifica, lette.verificaSigc]).toEqual([[], []]);
  });
});

describe("RA006: la descrizione dell'intervento da TX-0060 dell'elenco operativo (decisione G2)", () => {
  it('senza il grant csr.tx-0060.read: nessuna lettura di TX-0060, il titolo e "Intervento <codice>"', async () => {
    profilo(['csr.tx-0016.read']);
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
