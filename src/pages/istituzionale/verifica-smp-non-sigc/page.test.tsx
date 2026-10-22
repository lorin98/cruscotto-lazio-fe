// Pagina /istituzionale/verifica-smp-non-sigc (green-fe step7): describe taggati coi REQ della route (RF016, RA006), dati
// dagli scenari del backend (fixture dell'istituzionale) con letture che rispondono ai parametri della query, MSW seminato
// con onUnhandledRequest 'error' (ogni lettura e' dichiarata qui), axe-core diretto. ECharts e' il grafico finto del setup.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '../../../shared/api/mock/server';
import { expectNoA11yViolations } from '../../../shared/testing/axe';
import { graficoDi, trovaCard } from '../../../shared/testing/card-grafico';
import { clicSulDato } from '../../../shared/testing/grafico-finto';
import { problema, trattenuta } from '../../../shared/testing/msw';
import { renderPagina } from '../../../shared/testing/render-pagina';
import { VALORI, VERIFICA } from '../../../features/istituzionale/testing/fixture';
import { lettureIstituzionale } from '../../../features/istituzionale/testing/letture';
import Pagina from './page';

const PERCORSO = '/istituzionale/verifica-smp-non-sigc';
const TITOLO = 'Istituzionale: verifica SMP non SIGC';
const CARD = 'Spesa pubblica erogata per intervento (anticipi inclusi)';
const testo = (s: string | null | undefined) => (s ?? '').replace(/\s/g, ' ');
const profilo = (roles: string[]) =>
  server.use(http.get('*/auth/status', () => HttpResponse.json({ authenticated: true, user: { username: 'U', profile: 'p3-funzionario-area-ist', roles } })));
// p3-funzionario-area-ist: i report istituzionali e l'elenco, non TX-0015 (G4)
const P3_IST = ['csr.tx-0016.read', 'csr.tx-0017.read', 'csr.tx-0056.read', 'csr.tx-0059.read', 'csr.tx-0060.read'];

function servi(basi?: Parameters<typeof lettureIstituzionale>[0]) {
  const { handlers, lette } = lettureIstituzionale(basi);
  server.use(...handlers);
  return lette;
}

const apri = (indirizzo = PERCORSO) => renderPagina(Pagina, PERCORSO, indirizzo);
const h1 = () => screen.getByRole('heading', { level: 1, name: TITOLO });
const tabella = () => screen.findByRole('table', { name: /^Verifica SMP non SIGC: / });

afterEach(() => vi.restoreAllMocks());

describe('RF016: i dati ASR non SIGC per intervento, da confrontare con SMP - Data Platform (TX-0016)', () => {
  it('una lettura coi criteri dell indirizzo; con l anno i dati dell avviso del file piu recente non ci sono (ANNO_NON_CONSERVATO)', async () => {
    const lette = servi();
    apri(`${PERCORSO}?intervento=SRD01&os=OS4&anno=2024`);
    const t = await tabella();
    expect(lette.verifica).toEqual(['?intervento=SRD01&os=OS4&anno=2024']);
    expect(within(t).getAllByRole('rowheader').map((c) => c.textContent)).toEqual(['SRD01']);
    const srd01 = within(t).getByRole('row', { name: "Apri il dettaglio dell'intervento SRD01" });
    expect(testo(srd01.textContent)).toContain("non disponibile per l'anno sceltol'avviso porta i dati del file più recente");
    expect(testo(srd01.textContent)).toContain('7');
    expect(testo(screen.getByRole('table', { name: 'Riferimenti della risposta' }).textContent)).toContain('Anno di riferimento2024');
    expect(screen.getByText('Anno di riferimento del file SMP non SIGC: 2024')).toBeTruthy();
  });

  it('un solo h1 col focus e il titolo del documento; card con PNG, CSV e XLSX; nessuna violazione axe', async () => {
    servi();
    const { container } = apri();
    expect(document.activeElement).toBe(h1());
    expect(document.title).toBe('Verifica SMP non SIGC - Istituzionale - Cruscotto CSR 2023-2027');
    const card = await trovaCard(CARD);
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(within(card).getByRole('button', { name: 'Grafico' }).getAttribute('aria-pressed')).toBe('true');
    expect(within(card).getAllByRole('button', { name: /^Scarica il grafico / }).map((b) => b.textContent)).toEqual(['PNG', 'CSV', 'XLSX']);
    // l'intervento senza spesa valorizzata e' fuori dal grafico e dichiarato; lo zero di SRA01 e' una barra vera
    expect(graficoDi(card)?.opzioni.length).toBeGreaterThan(0);
    await expectNoA11yViolations(container);
  });

  it('decisione G4: con csr.tx-0015.read la frase col link alla verifica SMP SIGC del finanziario, senza filtri portati', async () => {
    servi();
    apri(`${PERCORSO}?intervento=SRD01&anno=2024`);
    const link = await screen.findByRole('link', { name: 'Verifica SMP SIGC' });
    expect(link.getAttribute('href')).toBe('/finanziario/sigc/verifica-smp');
    expect(link.closest('p')?.textContent).toBe('I dati SIGC per lo stesso confronto sono nel Finanziario: Verifica SMP SIGC.');
  });

  it('decisione G4: senza csr.tx-0015.read (p3 dell area istituzionale) la frase non c e', async () => {
    profilo(P3_IST);
    servi();
    apri();
    await trovaCard(CARD);
    expect(screen.queryByRole('link', { name: 'Verifica SMP SIGC' })).toBeNull();
    expect(document.body.textContent).not.toContain('I dati SIGC per lo stesso confronto');
  });

  it('il selettore dell anno si applica con Mostra: l anno nell indirizzo coi filtri, una lettura nuova, il focus resta su Mostra', async () => {
    const lette = servi();
    const { router } = apri(`${PERCORSO}?intervento=SRD01`);
    await tabella();
    const select = screen.getByRole('combobox', { name: 'Anno di riferimento del monitoraggio SMP non SIGC' });
    expect(within(select).getAllByRole('option')[0].textContent).toBe('Ultimo anno con un file (predefinito)');
    expect(select.getAttribute('aria-describedby')).toBe('f-anno-smp-aiuto');
    await userEvent.selectOptions(select, '2024');
    expect(lette.verifica).toHaveLength(1);
    const mostra = screen.getByRole('button', { name: 'Mostra' });
    await userEvent.click(mostra);
    await waitFor(() => expect(router.state.location.search).toBe('?intervento=SRD01&anno=2024'));
    await waitFor(() => expect(lette.verifica.at(-1)).toBe('?intervento=SRD01&anno=2024'));
    await tabella();
    expect(document.activeElement).toBe(mostra);
  });

  it('riga apribile con Invio: il dettaglio dell intervento con l anno scelto; clic su una barra: lo stesso', async () => {
    servi();
    const { router } = apri(`${PERCORSO}?anno=2024`);
    const riga = within(await tabella()).getByRole('row', { name: "Apri il dettaglio dell'intervento SRA16" });
    riga.focus();
    await userEvent.keyboard('{Enter}');
    await waitFor(() => expect(`${router.state.location.pathname}${router.state.location.search}`).toBe('/istituzionale/interventi/SRA16?anno=2024'));
  });

  it('clic su una barra del grafico: il dettaglio dell intervento (senza anno scelto, nessun anno nell indirizzo)', async () => {
    servi();
    const { router } = apri();
    const grafico = graficoDi(await trovaCard(CARD));
    if (!grafico) throw new Error('grafico assente');
    clicSulDato(grafico, 0, 1);
    await waitFor(() => expect(`${router.state.location.pathname}${router.state.location.search}`).toBe('/istituzionale/interventi/SRD01'));
  });

  it('OP-IS-09: Apri nell elenco e Apri nei pagamenti solo con un valore positivo (zero: nessun link verso un elenco vuoto)', async () => {
    servi();
    apri();
    const srd01 = within(await tabella()).getByRole('row', { name: "Apri il dettaglio dell'intervento SRD01" });
    expect(within(srd01).getAllByRole('link').map((l) => l.getAttribute('href'))).toEqual([
      '/elenco-operativo/domande?tipo=SOSTEGNO&intervento=SRD01',
      '/elenco-operativo/pagamenti?esito=PAGATA&sigc=false&intervento=SRD01',
    ]);
    // SRA01 e' SIGC: zero domande e zero spesa non SIGC, nessun link verso un elenco vuoto
    expect(within(within(await tabella()).getByRole('row', { name: "Apri il dettaglio dell'intervento SRA01" })).queryAllByRole('link')).toHaveLength(0);
  });

  it('OP-IS-09: senza i grant di TX-0056 e TX-0059 le celle non hanno link verso l elenco', async () => {
    profilo(['csr.tx-0016.read', 'csr.tx-0060.read']);
    servi();
    apri();
    const t = await tabella();
    expect(within(t).queryAllByRole('link')).toHaveLength(0);
    expect(testo(within(t).getByRole('row', { name: "Apri il dettaglio dell'intervento SRD01" }).textContent)).toContain('3');
  });

  it('OP-IS-09: col solo grant di TX-0056 le domande ricevute portano all elenco, la spesa no', async () => {
    profilo(['csr.tx-0016.read', 'csr.tx-0056.read']);
    servi();
    apri();
    const srd01 = within(await tabella()).getByRole('row', { name: "Apri il dettaglio dell'intervento SRD01" });
    expect(within(srd01).getAllByRole('link').map((l) => l.getAttribute('href'))).toEqual(['/elenco-operativo/domande?tipo=SOSTEGNO&intervento=SRD01']);
    expect(within(srd01).queryByRole('link', { name: /^Apri nei pagamenti/ })).toBeNull();
  });

  it('OP-IS-09: col solo grant di TX-0059 la spesa porta ai pagamenti, le domande ricevute no', async () => {
    profilo(['csr.tx-0016.read', 'csr.tx-0059.read']);
    servi();
    apri();
    const srd01 = within(await tabella()).getByRole('row', { name: "Apri il dettaglio dell'intervento SRD01" });
    expect(within(srd01).getAllByRole('link').map((l) => l.getAttribute('href'))).toEqual(['/elenco-operativo/pagamenti?esito=PAGATA&sigc=false&intervento=SRD01']);
    expect(within(srd01).queryByRole('link', { name: /^Apri nell'elenco operativo/ })).toBeNull();
  });

  it('CSV e XLSX dal backend coi filtri e l anno della pagina, con X-Requested-With; nome del file', async () => {
    const lette = servi();
    URL.createObjectURL = vi.fn(() => 'blob:prova');
    URL.revokeObjectURL = vi.fn();
    const clic = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    apri(`${PERCORSO}?intervento=SRD01&anno=2024`);
    await userEvent.click(await screen.findByRole('button', { name: `Scarica il grafico ${CARD} in CSV` }));
    await waitFor(() => expect(clic).toHaveBeenCalledTimes(1));
    expect((clic.mock.contexts.at(-1) as HTMLAnchorElement).download).toBe('verifica-smp-non-sigc-2024-tx-0016.csv');
    await userEvent.click(screen.getByRole('button', { name: 'Scarica i dati della verifica SMP non SIGC in XLSX' }));
    await waitFor(() => expect(clic).toHaveBeenCalledTimes(2));
    expect(lette.file).toEqual([
      '/api/istituzionale/verifica-smp-non-sigc/csv?intervento=SRD01&anno=2024 XMLHttpRequest',
      '/api/istituzionale/verifica-smp-non-sigc/xlsx?intervento=SRD01&anno=2024 XMLHttpRequest',
    ]);
  });

  it('il file oltre il limite dell esportazione: errore sotto i pulsanti col motivo, il focus resta sul pulsante', async () => {
    servi();
    server.use(http.get('*/api/istituzionale/verifica-smp-non-sigc/:formato', () => HttpResponse.json(problema(400, 'DATO_NON_VALIDO', 'oltre 5000 righe'), { status: 400 })));
    apri();
    const t = await tabella();
    const pulsante = screen.getByRole('button', { name: 'Scarica i dati della verifica SMP non SIGC in CSV' });
    await userEvent.click(pulsante);
    const sezione = t.closest('section') as HTMLElement;
    expect((await within(sezione).findByRole('alert')).textContent).toBe("File CSV non scaricato. La tabella supera il limite dell'esportazione (5.000 righe o 50.000 celle): restringi i filtri e riprova.");
    expect(document.activeElement).toBe(pulsante);
  });

  it('nessun file SMP non SIGC (annoRiferimento null): lo stato dichiarato e i dati delle pratiche restano', async () => {
    servi({ verifica: { ...VERIFICA, annoRiferimento: null } });
    apri();
    const stato = await screen.findByText(/^Nessun file SMP non SIGC acquisito: /);
    expect(stato.closest('[role="status"]')).not.toBeNull();
    expect(screen.getByText('Anno di riferimento del file SMP non SIGC: nessun file')).toBeTruthy();
    expect(within(await tabella()).getAllByRole('rowheader')).toHaveLength(3);
  });

  it('vuoto: nessun intervento per i filtri (azione portante senza interventi collegati), con Modifica i filtri', async () => {
    servi({ valori: { ...VALORI, legameAzioniDisponibile: true } });
    apri(`${PERCORSO}?azione=3`);
    const vuoto = await screen.findByText("Nessun intervento per i filtri scelti (per esempio un'azione portante senza interventi collegati).");
    expect(vuoto.closest('[role="status"]')).not.toBeNull();
    expect(screen.queryByRole('alert')).toBeNull();
    await userEvent.click(screen.getByRole('button', { name: 'Modifica i filtri' }));
    expect(await screen.findByRole('dialog', { name: 'Filtri dei report istituzionali' })).toBeTruthy();
  });

  it('caricamento con lo scheletro e aria-live, poi i dati', async () => {
    const t = trattenuta();
    servi();
    server.use(
      http.get('*/api/istituzionale/verifica-smp-non-sigc', async () => {
        await t.attesa;
        return HttpResponse.json(VERIFICA);
      }),
    );
    apri();
    const caricamento = await screen.findByText('Caricamento in corso…');
    expect(caricamento.closest('[role="status"]')?.getAttribute('aria-live')).toBe('polite');
    await act(async () => t.libera());
    await tabella();
  });

  it('errore dal problem-type: un solo avviso della pagina con Riprova; la pill dice che il dato non e disponibile', async () => {
    let tentativi = 0;
    servi();
    server.use(
      http.get('*/api/istituzionale/verifica-smp-non-sigc', () => {
        tentativi += 1;
        return tentativi === 1 ? HttpResponse.json(problema(429, 'TROPPE_RICHIESTE'), { status: 429 }) : HttpResponse.json(VERIFICA);
      }),
    );
    apri();
    const avviso = await screen.findByRole('alert');
    expect(avviso.textContent).toContain('Troppe richieste in poco tempo: riprova tra qualche secondo.');
    expect(screen.getAllByRole('alert')).toHaveLength(1);
    expect(screen.getByText('Ultimo dato sincronizzato: non disponibile')).toBeTruthy();
    await userEvent.click(within(avviso).getByRole('button', { name: 'Riprova' }));
    await tabella();
  });

  it('Applica i filtri cambiati dal pannello aperto dallo stato vuoto: il focus va sul titolo; senza modifiche torna a Modifica i filtri', async () => {
    servi({ valori: { ...VALORI, legameAzioniDisponibile: true } });
    const { router } = apri(`${PERCORSO}?azione=3`);
    const bottone = await screen.findByRole('button', { name: 'Modifica i filtri' });
    await userEvent.click(bottone);
    let pannello = await screen.findByRole('dialog', { name: 'Filtri dei report istituzionali' });
    await userEvent.click(within(pannello).getByRole('button', { name: 'Applica i filtri' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(router.state.location.search).toBe('?azione=3');
    await waitFor(() => expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Modifica i filtri' })));
    await userEvent.click(screen.getByRole('button', { name: 'Modifica i filtri' }));
    pannello = await screen.findByRole('dialog', { name: 'Filtri dei report istituzionali' });
    await userEvent.click(within(pannello).getByRole('button', { name: 'Azzera' }));
    await userEvent.click(within(pannello).getByRole('button', { name: 'Applica i filtri' }));
    await waitFor(() => expect(router.state.location.search).toBe(''));
    await waitFor(() => expect(document.activeElement).toBe(h1()));
    await tabella();
    expect(document.activeElement).toBe(h1());
  });

  it('Applica i filtri del pannello aperto dalla barra: il focus torna al bottone Filtri, l anno resta', async () => {
    servi();
    const { router } = apri(`${PERCORSO}?anno=2024`);
    await tabella();
    const bottone = screen.getByRole('button', { name: /^Filtri/ });
    await userEvent.click(bottone);
    const pannello = await screen.findByRole('dialog', { name: 'Filtri dei report istituzionali' });
    await userEvent.click(within(pannello).getByRole('button', { name: 'OS4' }));
    await userEvent.click(within(pannello).getByRole('button', { name: 'Applica i filtri' }));
    await waitFor(() => expect(router.state.location.search).toBe('?os=OS4&anno=2024'));
    await waitFor(() => expect(document.activeElement).toBe(bottone));
  });
});

describe("RA006: valori dei filtri della verifica da TX-0060 dell'elenco operativo (decisione G2)", () => {
  it('le voci di Intervento e degli obiettivi vengono da TX-0060; l azione portante e disabilitata senza il legame', async () => {
    const lette = servi();
    apri();
    await tabella();
    await userEvent.click(screen.getByRole('button', { name: /^Filtri/ }));
    const pannello = await screen.findByRole('dialog', { name: 'Filtri dei report istituzionali' });
    expect(within(pannello).getByRole('checkbox', { name: 'SRA16 Conservazione agrobiodiversità' })).toBeTruthy();
    expect(within(pannello).getByRole('group', { name: 'Obiettivo specifico (OS)' })).toBeTruthy();
    expect(within(pannello).getByText("Non disponibile finché nessun intervento è collegato a un'azione portante.")).toBeTruthy();
    expect(lette.filtri).toBeGreaterThan(0);
    await expectNoA11yViolations(pannello);
  });

  it('senza il grant csr.tx-0060.read: nessuna lettura di TX-0060, il pannello lo dice e propone i codici della risposta', async () => {
    profilo(['csr.tx-0016.read']);
    const lette = servi();
    apri();
    await tabella();
    await userEvent.click(screen.getByRole('button', { name: /^Filtri/ }));
    const pannello = await screen.findByRole('dialog', { name: 'Filtri dei report istituzionali' });
    expect(within(pannello).getByRole('status').textContent).toMatch(/^Valori dei filtri non disponibili/);
    expect(within(pannello).getByRole('checkbox', { name: 'SRD01' })).toBeTruthy();
    expect(lette.filtri).toBe(0);
    expect(lette.verifica).toEqual(['']);
  });

  it('TX-0060 in errore: lo stato della pagina col motivo e Riprova; riuscito il nuovo tentativo lo stato sparisce e il focus va sul titolo', async () => {
    let tentativi = 0;
    servi();
    server.use(
      http.get('*/api/elenco-operativo/filtri', () => {
        tentativi += 1;
        return tentativi === 1 ? HttpResponse.json(problema(503, 'CAPACITA_ESAURITA'), { status: 503 }) : HttpResponse.json(VALORI);
      }),
    );
    apri(`${PERCORSO}?intervento=SRD01`);
    const riprova = await screen.findByRole('button', { name: 'Riprova' });
    const stato = riprova.closest('[role="status"]') as HTMLElement;
    expect(stato.textContent).toMatch(/^Valori dei filtri non disponibili: /);
    // i chip dell'indirizzo restano e il report si legge lo stesso
    expect(screen.getByRole('button', { name: 'Togli il filtro Intervento SRD01' })).toBeTruthy();
    await tabella();
    await userEvent.click(riprova);
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Riprova' })).toBeNull());
    await waitFor(() => expect(document.activeElement).toBe(h1()));
  });

  it("filtro per azione senza il legame: TX-0016 letta solo dopo TX-0060, senza l'azione, e il chip lo spiega", async () => {
    const t = trattenuta();
    const lette = servi();
    server.use(
      http.get('*/api/elenco-operativo/filtri', async () => {
        await t.attesa;
        return HttpResponse.json(VALORI);
      }),
    );
    apri(`${PERCORSO}?os=OS4&azione=3`);
    expect(await screen.findByText('Verifica dei filtri in corso…')).toBeTruthy();
    expect(lette.verifica).toEqual([]);
    await act(async () => t.libera());
    await tabella();
    expect(lette.verifica).toEqual(['?os=OS4']);
    expect(screen.getByText(/3 \(non applicato: il legame con le azioni portanti viene da una fonte non attiva\)/)).toBeTruthy();
  });

  it('i chip si tolgono uno alla volta (stessa pagina, nuova lettura, l anno resta) e il focus resta nella barra', async () => {
    const lette = servi();
    const { router } = apri(`${PERCORSO}?intervento=SRD01&os=OS4&anno=2024`);
    await tabella();
    await userEvent.click(screen.getByRole('button', { name: 'Togli il filtro OS OS4' }));
    await waitFor(() => expect(router.state.location.search).toBe('?intervento=SRD01&anno=2024'));
    await waitFor(() => expect(lette.verifica.at(-1)).toBe('?intervento=SRD01&anno=2024'));
    expect(screen.getByRole('region', { name: 'Filtri attivi' }).contains(document.activeElement)).toBe(true);
  });

  it('pannello da tastiera: Esc lo chiude e il focus torna al bottone Filtri', async () => {
    servi();
    apri();
    await tabella();
    const bottone = screen.getByRole('button', { name: /^Filtri/ });
    bottone.focus();
    await userEvent.keyboard('{Enter}');
    const pannello = await screen.findByRole('dialog', { name: 'Filtri dei report istituzionali' });
    expect(pannello.contains(document.activeElement)).toBe(true);
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Filtri dei report istituzionali' })).toBeNull());
    // react-aria riporta il focus dopo la chiusura del dialogo: si aspetta, come per gli altri cambi di focus
    await waitFor(() => expect(document.activeElement).toBe(bottone));
  });
});
