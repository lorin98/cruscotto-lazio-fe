// Pagina /fisico/superfici (green-fe step7): describe taggati coi REQ della route (RF018, RA006), dati dagli scenari del
// backend (fixture del fisico), MSW seminato con onUnhandledRequest 'error' (ogni lettura e' dichiarata qui: il server dei
// test non monta i mock generati del fisico e dell'elenco), axe-core diretto. ECharts e' il grafico finto del setup.
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
import { SUPERFICI, SUPERFICI_SENZA, SUPERFICI_TRE, VALORI } from '../../../features/fisico/testing/fixture';
import Pagina from './page';

const PERCORSO = '/fisico/superfici';
const testo = (s: string | null | undefined) => (s ?? '').replace(/\s/g, ' ');
const profilo = (roles: string[]) =>
  server.use(http.get('*/auth/status', () => HttpResponse.json({ authenticated: true, user: { username: 'U', profile: 'p3-funzionario-area-fis', roles } })));

/** Le letture di TX-0018 (query string) e di TX-0060 dichiarate dal test. */
function servi(corpo: object = SUPERFICI, valori: object = VALORI) {
  const superfici: string[] = [];
  const filtri: number[] = [];
  server.use(
    http.get('*/api/fisico/superficie-ammissibile', ({ request }) => {
      superfici.push(new URL(request.url).search);
      return HttpResponse.json(corpo);
    }),
    http.get('*/api/elenco-operativo/filtri', () => {
      filtri.push(1);
      return HttpResponse.json(valori);
    }),
  );
  return { superfici, filtri };
}

const apri = (indirizzo = PERCORSO) => renderPagina(Pagina, PERCORSO, indirizzo);
const titoloKpi = (campagna: number) => screen.findByRole('heading', { level: 2, name: `Totali della campagna ${campagna}` });

afterEach(() => vi.restoreAllMocks());

describe('RF018: superficie ammissibile della domanda di sostegno e di pagamento per intervento (TX-0018)', () => {
  it('una lettura coi criteri dell indirizzo; KPI della campagna piu recente; le campagne non si sommano', async () => {
    const { superfici } = servi(SUPERFICI_TRE);
    apri(`${PERCORSO}?intervento=SRB01&intervento=SRB02&os=OS4`);
    await titoloKpi(2025);
    expect(superfici).toEqual(['?intervento=SRB01&intervento=SRB02&os=OS4']);
    // somme dentro la campagna 2025 (SRB01 + SRB02), mai con il 2024
    expect(testo(screen.getByRole('region', { name: /^Superficie ammissibile DS:/ }).textContent)).toContain('19,50 ha');
    expect(testo(screen.getByRole('region', { name: /^Superficie ammissibile DP:/ }).textContent)).toContain('19,90 ha');
    expect(testo(screen.getByRole('region', { name: /^Differenza DP - DS:/ }).textContent)).toContain('+0,40 ha');
    expect(testo(screen.getByRole('region', { name: /^Domande con DP oltre la DS:/ }).textContent)).toContain('su 5 domande di pagamento: 20 %');
  });

  it('un solo h1 col focus e il titolo del documento; le tre card partono dal grafico; nessuna violazione axe', async () => {
    servi();
    const { container } = apri();
    const h1 = screen.getByRole('heading', { level: 1, name: 'Fisico: superfici ammissibili per intervento' });
    expect(document.activeElement).toBe(h1);
    expect(document.title).toBe('Superfici ammissibili - Fisico - Cruscotto CSR 2023-2027');
    await titoloKpi(2025);
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    for (const titolo of ['Superficie DS e DP per intervento, campagna 2025', 'Superficie DS e DP per campagna', 'Verifica incrociata: differenza DP - DS per intervento, campagna 2025']) {
      const card = await trovaCard(titolo);
      expect(within(card).getByRole('button', { name: 'Grafico' }).getAttribute('aria-pressed')).toBe('true');
      expect(within(card).getAllByRole('button', { name: /^Scarica il grafico / }).map((b) => b.textContent)).toEqual(['PNG', 'CSV', 'XLSX']);
    }
    // l'intervento senza superfici e' fuori dal grafico e dichiarato, mai a zero
    const perIntervento = await trovaCard('Superficie DS e DP per intervento, campagna 2025');
    expect(perIntervento.textContent).toContain('1 voce non nel grafico');
    expect(perIntervento.textContent).toContain('SRA29: nessuna superficie in nessuna campagna');
    await expectNoA11yViolations(container);
  });

  it('con il filtro Campagna i KPI sono di quella campagna e la serie per campagna dice perche non si disegna', async () => {
    const soloIl2024 = { ...SUPERFICI, campagna: 2024, righe: [SUPERFICI.righe[0], { ...SUPERFICI.righe[1], campagne: [SUPERFICI.righe[1].campagne[0]] }] };
    const { superfici } = servi(soloIl2024);
    apri(`${PERCORSO}?campagna=2024`);
    await titoloKpi(2024);
    expect(superfici).toEqual(['?campagna=2024']);
    const serie = await trovaCard('Superficie DS e DP per campagna');
    expect(serie.getAttribute('data-card-grafico')).toBe('assente');
    expect(serie.textContent).toContain('togli il filtro Campagna per vedere tutte le campagne');
  });

  it('il clic su un punto della serie per campagna mette il filtro Campagna su quell anno (stessa pagina)', async () => {
    servi();
    const { router } = apri();
    const card = await trovaCard('Superficie DS e DP per campagna');
    const grafico = graficoDi(card);
    if (!grafico) throw new Error('grafico assente');
    clicSulDato(grafico, 0, 0);
    await waitFor(() => expect(router.state.location.search).toBe('?campagna=2024'));
    expect(router.state.location.pathname).toBe(PERCORSO);
  });

  it('vista Tabella: tutte le campagne, un totale per campagna sulle righe trovate, nessun totale generale', async () => {
    servi(SUPERFICI_TRE);
    apri();
    await userEvent.click(within(await screen.findByRole('group', { name: 'Vista delle superfici' })).getByRole('button', { name: 'Tabella' }));
    const tabella = screen.getByRole('table', { name: /^Superficie ammissibile DS e DP per intervento e campagna/ });
    const piede = () => within(tabella).getAllByRole('rowgroup')[2];
    expect(within(piede()).getAllByRole('rowheader').map((c) => c.textContent)).toEqual(['Totale campagna 2025 (2 interventi con superfici)', 'Totale campagna 2024 (2 interventi con superfici)']);
    await userEvent.type(screen.getByRole('searchbox', { name: 'Cerca nella tabella' }), 'SRB03');
    expect(within(piede()).getAllByRole('rowheader').map((c) => c.textContent)).toEqual(['Totale campagna 2024 (1 intervento con superfici)']);
    // l'interruttore resta nello stesso ordine di quello delle card
    expect(within(screen.getByRole('group', { name: 'Vista delle superfici' })).getAllByRole('button').map((b) => b.textContent)).toEqual(['Grafico', 'Tabella']);
  });

  it('CSV e XLSX dal backend: la card della campagna di riferimento con la sua campagna, la tabella coi filtri della pagina', async () => {
    servi();
    const richieste: string[] = [];
    server.use(
      http.get('*/api/fisico/superficie-ammissibile/:formato', ({ request }) => {
        const u = new URL(request.url);
        richieste.push(`${u.pathname}${u.search} ${request.headers.get('X-Requested-With') ?? ''}`);
        return new HttpResponse('a;b', { headers: { 'Content-Type': 'text/csv' } });
      }),
    );
    URL.createObjectURL = vi.fn(() => 'blob:prova');
    URL.revokeObjectURL = vi.fn();
    const clic = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    apri(`${PERCORSO}?intervento=SRB01`);
    await userEvent.click(await screen.findByRole('button', { name: 'Scarica il grafico Superficie DS e DP per intervento, campagna 2025 in CSV' }));
    await waitFor(() => expect(clic).toHaveBeenCalledTimes(1));
    expect((clic.mock.contexts.at(-1) as HTMLAnchorElement).download).toBe('superficie-ds-e-dp-per-intervento-campagna-2025-tx-0018.csv');
    await userEvent.click(screen.getByRole('button', { name: 'Scarica il grafico Superficie DS e DP per campagna in XLSX' }));
    await waitFor(() => expect(clic).toHaveBeenCalledTimes(2));
    await userEvent.click(within(screen.getByRole('group', { name: 'Vista delle superfici' })).getByRole('button', { name: 'Tabella' }));
    await userEvent.click(screen.getByRole('button', { name: 'Scarica la tabella Superfici per intervento e campagna in CSV' }));
    await waitFor(() => expect(clic).toHaveBeenCalledTimes(3));
    expect(richieste).toEqual([
      '/api/fisico/superficie-ammissibile/csv?intervento=SRB01&campagna=2025 XMLHttpRequest',
      '/api/fisico/superficie-ammissibile/xlsx?intervento=SRB01 XMLHttpRequest',
      '/api/fisico/superficie-ammissibile/csv?intervento=SRB01 XMLHttpRequest',
    ]);
  });

  it('il file oltre il limite dell esportazione: errore sotto i pulsanti col motivo (400 DATO_NON_VALIDO)', async () => {
    servi();
    server.use(http.get('*/api/fisico/superficie-ammissibile/:formato', () => HttpResponse.json(problema(400, 'DATO_NON_VALIDO', 'oltre 5000 righe'), { status: 400 })));
    apri();
    const pulsante = await screen.findByRole('button', { name: 'Scarica il grafico Superficie DS e DP per campagna in CSV' });
    await userEvent.click(pulsante);
    const card = await trovaCard('Superficie DS e DP per campagna');
    expect((await within(card).findByRole('alert')).textContent).toBe(
      "File CSV non scaricato. La tabella supera il limite dell'esportazione (5.000 righe o 50.000 celle): restringi i filtri e riprova.",
    );
    expect(document.activeElement).toBe(pulsante);
  });

  it('vuoto: nessun intervento per i filtri, con Modifica i filtri che apre il pannello', async () => {
    servi({ ...SUPERFICI, righe: [] });
    apri(`${PERCORSO}?intervento=SRB09`);
    const vuoto = await screen.findByText('Nessun intervento per i filtri scelti.');
    // ramo vuoto distinto dall'errore: informativo (role=status), mai un alert
    expect(vuoto.closest('[role="status"]')).not.toBeNull();
    expect(screen.queryByRole('alert')).toBeNull();
    await userEvent.click(await screen.findByRole('button', { name: 'Modifica i filtri' }));
    expect(await screen.findByRole('dialog', { name: 'Filtri delle superfici ammissibili' })).toBeTruthy();
  });

  it('nessuna superficie nella campagna scelta: lo stato lo dice (non valorizzato), mai una pagina di zeri', async () => {
    servi(SUPERFICI_SENZA);
    apri(`${PERCORSO}?campagna=2023`);
    expect(
      await screen.findByText('Nessuna superficie per gli interventi scelti nella campagna 2023: gli interventi non sono a superficie o non sono SIGC (non valorizzato).'),
    ).toBeTruthy();
    expect(screen.queryByRole('heading', { level: 2, name: /^Totali della campagna/ })).toBeNull();
  });

  it('caricamento con lo scheletro e aria-live, poi i dati', async () => {
    const t = trattenuta();
    server.use(
      http.get('*/api/elenco-operativo/filtri', () => HttpResponse.json(VALORI)),
      http.get('*/api/fisico/superficie-ammissibile', async () => {
        await t.attesa;
        return HttpResponse.json(SUPERFICI);
      }),
    );
    apri();
    const caricamento = await screen.findByText('Caricamento in corso…');
    expect(caricamento.closest('[role="status"]')?.getAttribute('aria-live')).toBe('polite');
    await act(async () => t.libera());
    await titoloKpi(2025);
  });

  it('errore dal problem-type: un solo avviso della pagina con Riprova; la pill dice che il dato non e disponibile', async () => {
    let tentativi = 0;
    server.use(
      http.get('*/api/elenco-operativo/filtri', () => HttpResponse.json(VALORI)),
      http.get('*/api/fisico/superficie-ammissibile', () => {
        tentativi += 1;
        return tentativi === 1 ? HttpResponse.json(problema(429, 'TROPPE_RICHIESTE'), { status: 429 }) : HttpResponse.json(SUPERFICI);
      }),
    );
    apri();
    const avviso = await screen.findByRole('alert');
    expect(avviso.textContent).toContain('Troppe richieste in poco tempo: riprova tra qualche secondo.');
    expect(screen.getAllByRole('alert')).toHaveLength(1);
    expect(screen.getByText('Ultimo dato sincronizzato: non disponibile')).toBeTruthy();
    await userEvent.click(within(avviso).getByRole('button', { name: 'Riprova' }));
    await titoloKpi(2025);
  });

  it("anteprima dell'intervento dalla riga (Invio), con la descrizione di TX-0060; Mostra solo resta nella pagina", async () => {
    servi();
    const { router } = apri(`${PERCORSO}?campagna=2025`);
    await userEvent.click(within(await screen.findByRole('group', { name: 'Vista delle superfici' })).getByRole('button', { name: 'Tabella' }));
    screen.getByRole('row', { name: "Apri l'anteprima dell'intervento SRB01, campagna 2025" }).focus();
    await userEvent.keyboard('{Enter}');
    const anteprima = await screen.findByRole('dialog', { name: 'SRB01' });
    expect(anteprima.textContent).toContain('Sostegno zone con svantaggi naturali montagna');
    await userEvent.click(within(anteprima).getByRole('button', { name: 'Mostra solo SRB01' }));
    await waitFor(() => expect(router.state.location.search).toBe('?intervento=SRB01&campagna=2025'));
    expect(router.state.location.pathname).toBe(PERCORSO);
  });
});

describe("RA006: valori dei filtri delle superfici da TX-0060 dell'elenco operativo (decisione G2)", () => {
  it('le voci di Intervento e degli obiettivi vengono da TX-0060; la campagna dalle campagne della risposta', async () => {
    const { filtri } = servi();
    apri();
    await titoloKpi(2025);
    await userEvent.click(screen.getByRole('button', { name: /^Filtri/ }));
    const pannello = await screen.findByRole('dialog', { name: 'Filtri delle superfici ammissibili' });
    expect(within(pannello).getByRole('checkbox', { name: 'SRA29 Agricoltura biologica' })).toBeTruthy();
    expect(within(pannello).getByRole('group', { name: 'Obiettivo specifico (OS)' })).toBeTruthy();
    expect(within(pannello).getByText("Non disponibile finché nessun intervento è collegato a un'azione portante.")).toBeTruthy();
    expect(within(within(pannello).getByRole('group', { name: 'Campagna' })).getAllByRole('button').map((b) => b.textContent)).toEqual(['Tutte le campagne', '2025', '2024']);
    expect(filtri.length).toBeGreaterThan(0);
  });

  it('con una campagna nell indirizzo il pannello propone quella e Tutte le campagne, senza una seconda lettura di TX-0018', async () => {
    const soloIl2024 = { ...SUPERFICI, campagna: 2024, righe: [SUPERFICI.righe[0], { ...SUPERFICI.righe[1], campagne: [SUPERFICI.righe[1].campagne[0]] }] };
    const { superfici } = servi(soloIl2024);
    apri(`${PERCORSO}?campagna=2024`);
    await titoloKpi(2024);
    await userEvent.click(screen.getByRole('button', { name: /^Filtri/ }));
    const campagna = within(await screen.findByRole('dialog', { name: 'Filtri delle superfici ammissibili' })).getByRole('group', { name: 'Campagna' });
    expect(within(campagna).getAllByRole('button').map((b) => [b.textContent, b.getAttribute('aria-pressed')])).toEqual([
      ['Tutte le campagne', 'false'],
      ['2024', 'true'],
    ]);
    expect(superfici).toHaveLength(1);
  });

  it('senza il grant csr.tx-0060.read: nessuna lettura di TX-0060, lo stato lo dice e Intervento propone i codici della risposta', async () => {
    profilo(['csr.tx-0018.read']);
    const { filtri, superfici } = servi();
    apri();
    await titoloKpi(2025);
    await userEvent.click(screen.getByRole('button', { name: /^Filtri/ }));
    const pannello = await screen.findByRole('dialog', { name: 'Filtri delle superfici ammissibili' });
    expect(within(pannello).getByRole('status').textContent).toMatch(/^Valori dei filtri non disponibili/);
    expect(within(pannello).getByRole('checkbox', { name: 'SRB01' })).toBeTruthy();
    expect(within(pannello).getAllByText('Nessuna voce: valori dei filtri non disponibili.')).toHaveLength(4);
    expect(filtri).toEqual([]);
    expect(superfici).toEqual(['']);
  });

  it("filtro per azione senza il legame: TX-0018 letta solo dopo TX-0060, senza l'azione, e il chip lo spiega", async () => {
    const t = trattenuta();
    const superfici: string[] = [];
    server.use(
      http.get('*/api/elenco-operativo/filtri', async () => {
        await t.attesa;
        return HttpResponse.json(VALORI);
      }),
      http.get('*/api/fisico/superficie-ammissibile', ({ request }) => {
        superfici.push(new URL(request.url).search);
        return HttpResponse.json(SUPERFICI);
      }),
    );
    apri(`${PERCORSO}?os=OS4&azione=3`);
    expect(await screen.findByText('Verifica dei filtri in corso…')).toBeTruthy();
    expect(superfici).toEqual([]);
    await act(async () => t.libera());
    await titoloKpi(2025);
    expect(superfici).toEqual(['?os=OS4']);
    expect(screen.getByText(/3 \(non applicato: il legame con le azioni portanti viene da una fonte non attiva\)/)).toBeTruthy();
  });

  it('i chip della barra si tolgono uno alla volta (stessa pagina, nuova lettura) e il focus resta nella barra', async () => {
    const { superfici } = servi();
    const { router } = apri(`${PERCORSO}?intervento=SRB01&campagna=2025`);
    await titoloKpi(2025);
    const togli = screen.getByRole('button', { name: 'Togli il filtro Campagna 2025' });
    await userEvent.click(togli);
    await waitFor(() => expect(router.state.location.search).toBe('?intervento=SRB01'));
    await waitFor(() => expect(superfici.at(-1)).toBe('?intervento=SRB01'));
    expect(screen.getByRole('region', { name: 'Filtri attivi' }).contains(document.activeElement)).toBe(true);
  });

  it('pannello da tastiera: Esc lo chiude e il focus torna al bottone Filtri', async () => {
    servi();
    apri();
    await titoloKpi(2025);
    const bottone = screen.getByRole('button', { name: /^Filtri/ });
    bottone.focus();
    await userEvent.keyboard('{Enter}');
    const pannello = await screen.findByRole('dialog', { name: 'Filtri delle superfici ammissibili' });
    expect(pannello.contains(document.activeElement)).toBe(true);
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Filtri delle superfici ammissibili' })).toBeNull());
    expect(document.activeElement).toBe(bottone);
  });
});
