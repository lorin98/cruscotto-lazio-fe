// Pagina /procedurale/stati-sostegno (green-fe step7): describe taggati coi REQ della route (RF024, RF025, RF027), dati
// dagli scenari del backend (fixture del procedurale) con letture che rispondono ai parametri della query, MSW seminato
// con onUnhandledRequest 'error' (ogni lettura e' dichiarata qui), axe-core diretto. ECharts e' il grafico finto del
// setup: i clic sulle barre sono quelli del dato disegnato.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '../../../shared/api/mock/server';
import { expectNoA11yViolations } from '../../../shared/testing/axe';
import { graficoDi, tabellaDi, trovaCard } from '../../../shared/testing/card-grafico';
import { clicSulCodice } from '../../../shared/testing/grafico-finto';
import { problema, trattenuta } from '../../../shared/testing/msw';
import { renderPagina } from '../../../shared/testing/render-pagina';
import { statiPer } from '../../../features/procedurale/testing/fixture';
import { lettureProcedurale } from '../../../features/procedurale/testing/letture';
import type { Basi } from '../../../features/procedurale/testing/letture';
import Pagina from './page';

const PERCORSO = '/procedurale/stati-sostegno';
const TITOLO = 'Procedurale: stati delle domande di sostegno';
const CARD = 'Domande di sostegno per stato';
const testo = (s: string | null | undefined) => (s ?? '').replace(/\s/g, ' ');
const profilo = (roles: string[]) =>
  server.use(http.get('*/auth/status', () => HttpResponse.json({ authenticated: true, user: { username: 'U', profile: 'p3-funzionario-area-pro', roles } })));

function servi(basi?: Basi) {
  const { handlers, lette } = lettureProcedurale(basi);
  server.use(...handlers);
  return lette;
}

const apri = (indirizzo = PERCORSO) => renderPagina(Pagina, PERCORSO, indirizzo);
const h1 = () => screen.getByRole('heading', { level: 1, name: TITOLO });
const tabella = () => screen.findByRole('table', { name: /^Domande di sostegno per intervento e stato/ });
const righe = (t: HTMLElement) => within(t).getAllByRole('row', { name: /^Apri l'anteprima/ }).map((r) => r.getAttribute('aria-label'));

afterEach(() => vi.restoreAllMocks());

describe('RF027: stati della domanda di sostegno per intervento (TX-0027)', () => {
  it('una lettura coi criteri dell indirizzo; KPI, card e tabella per intervento; un solo h1 col focus; nessuna violazione axe', async () => {
    const lette = servi();
    const { container } = apri(`${PERCORSO}?intervento=SRA01&intervento=SRD01&stato=AMMESSA`);
    const t = await tabella();
    expect(lette.sostegno).toEqual(['?intervento=SRA01&intervento=SRD01&stato=AMMESSA']);
    expect(righe(t)).toEqual(["Apri l'anteprima dell'intervento SRA01", "Apri l'anteprima dell'intervento SRD01"]);
    expect(testo(screen.getByRole('region', { name: 'Domande di sostegno' }).textContent)).toContain('3');
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(document.activeElement).toBe(h1());
    expect(document.title).toBe('Stati delle domande di sostegno - Procedurale - Cruscotto CSR 2023-2027');
    await trovaCard(CARD);
    await expectNoA11yViolations(container);
  });

  it('domande non ancora rilasciate: il KPI, la voce in compilazione con la fonte, il link della sola parte rilasciata', async () => {
    servi({ varianti: { nonRilasciate: true } });
    apri(`${PERCORSO}?intervento=SRD01`);
    expect(testo((await screen.findByRole('region', { name: 'Di cui non rilasciate' })).textContent)).toContain('5');
    const t = await tabellaDi(await trovaCard(CARD));
    expect(testo(within(t).getByRole('row', { name: /^In compilazione/ }).textContent)).toBe('In compilazione22nessuna domanda rilasciata');
    const stampato = within(within(t).getByRole('row', { name: /^Stampato/ })).getByRole('link');
    expect(stampato.textContent).toBe("Apri nell'elenco (1 rilasciata)");
    expect(stampato.getAttribute('href')).toBe('/elenco-operativo/domande?statoSostegno=STAMPATO&intervento=SRD01');
  });

  it('il clic su una barra filtra la tabella sulla voce; la voce resta mentre la lettura riparte; tolto il chip il focus va sul titolo', async () => {
    const lette = servi();
    apri(`${PERCORSO}?intervento=SRA01&intervento=SRD01`);
    clicSulCodice(graficoDi(await trovaCard(CARD)), 'ESITO_POSITIVO_TUTTE_LE_MISURE');
    const filtro = await screen.findByRole('group', { name: 'Filtro della tabella dal grafico' });
    expect(within(filtro).getByRole('link', { name: "Apri nell'elenco operativo la domanda di sostegno nello stato Istruttoria con esito positivo su tutte le misure" }).getAttribute('href')).toBe(
      '/elenco-operativo/domande?statoSostegno=ESITO_POSITIVO_TUTTE_LE_MISURE&intervento=SRA01&intervento=SRD01',
    );
    expect(righe(await tabella())).toEqual(["Apri l'anteprima dell'intervento SRD01"]);
    await userEvent.click(screen.getByRole('button', { name: 'Togli il filtro Intervento SRA01' }));
    await waitFor(() => expect(lette.sostegno.at(-1)).toBe('?intervento=SRD01'));
    const ancora = await screen.findByRole('group', { name: 'Filtro della tabella dal grafico' });
    await userEvent.click(within(ancora).getByRole('button', { name: 'Togli il filtro Voce Istruttoria con esito positivo su tutte le misure' }));
    await waitFor(() => expect(document.activeElement).toBe(h1()));
  });

  it('la voce scelta che sparisce dalla risposta con altri filtri si toglie: tornando ai filtri di prima niente chip ne filtro', async () => {
    const lette = servi();
    const { router } = apri();
    clicSulCodice(graficoDi(await trovaCard(CARD)), 'SOSPESA');
    await screen.findByRole('group', { name: 'Filtro della tabella dal grafico' });
    expect(righe(await tabella())).toEqual(["Apri l'anteprima dell'intervento SRA01"]);
    await act(() => router.navigate(`${PERCORSO}?intervento=SRD01`));
    await waitFor(() => expect(lette.sostegno.at(-1)).toBe('?intervento=SRD01'));
    await waitFor(async () => expect(righe(await tabella())).toEqual(["Apri l'anteprima dell'intervento SRD01"]));
    expect(screen.queryByRole('group', { name: 'Filtro della tabella dal grafico' })).toBeNull();
    await act(() => router.navigate(-1));
    await waitFor(async () => expect(righe(await tabella())).toHaveLength(3));
    expect(screen.queryByRole('group', { name: 'Filtro della tabella dal grafico' })).toBeNull();
  });

  it('riga apribile con Invio: il drawer con le voci e i loro link, il mini grafico, il dettaglio; Esc lo chiude e il focus torna', async () => {
    servi();
    const { router } = apri(`${PERCORSO}?stato=AMMESSA`);
    const riga = within(await tabella()).getByRole('row', { name: "Apri l'anteprima dell'intervento SRD01" });
    riga.focus();
    await userEvent.keyboard('{Enter}');
    const drawer = await screen.findByRole('dialog', { name: 'Anteprima: SRD01' });
    expect(within(drawer).getByRole('link', { name: "Apri nell'elenco operativo la domanda di sostegno di SRD01 nello stato Rilasciato" }).getAttribute('href')).toBe('/elenco-operativo/domande?statoSostegno=RILASCIATO&voceProgrammazione=AMMESSA&intervento=SRD01');
    await trovaCard('Domande di sostegno di SRD01 per stato');
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Anteprima: SRD01' })).toBeNull());
    await waitFor(() => expect(document.activeElement).toBe(within(screen.getByRole('table', { name: /^Domande di sostegno per intervento e stato/ })).getByRole('row', { name: "Apri l'anteprima dell'intervento SRD01" })));
    await userEvent.keyboard('{Enter}');
    await userEvent.click(within(await screen.findByRole('dialog', { name: 'Anteprima: SRD01' })).getByRole('link', { name: "Apri il dettaglio dell'intervento" }));
    await waitFor(() => expect(`${router.state.location.pathname}${router.state.location.search}`).toBe('/procedurale/interventi/SRD01?stato=AMMESSA'));
  });

  it('senza il grant dell elenco: la tabella equivalente generata, il chip della voce senza link, il drawer senza link', async () => {
    profilo(['csr.tx-0024.read', 'csr.tx-0025.read', 'csr.tx-0027.read']);
    servi();
    apri();
    const card = await trovaCard(CARD);
    expect(within(await tabellaDi(card)).queryByRole('link')).toBeNull();
    await userEvent.click(within(card).getByRole('button', { name: 'Grafico' }));
    clicSulCodice(graficoDi(card), 'RILASCIATO');
    expect(within(await screen.findByRole('group', { name: 'Filtro della tabella dal grafico' })).queryByRole('link')).toBeNull();
    await userEvent.click(within(await tabella()).getByRole('row', { name: "Apri l'anteprima dell'intervento SRD01" }));
    expect(within(await screen.findByRole('dialog', { name: 'Anteprima: SRD01' })).getAllByRole('link').map((l) => l.textContent)).toEqual(["Apri il dettaglio dell'intervento"]);
  });

  it('CSV e XLSX della tabella: l export dell intero report coi filtri della pagina, con X-Requested-With', async () => {
    const lette = servi();
    URL.createObjectURL = vi.fn(() => 'blob:prova');
    URL.revokeObjectURL = vi.fn();
    const clic = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    apri(`${PERCORSO}?intervento=SRD01&stato=AMMESSA`);
    await tabella();
    await userEvent.click(screen.getByRole('button', { name: 'Scarica la tabella Domande di sostegno per intervento e stato in XLSX' }));
    await waitFor(() => expect(clic).toHaveBeenCalledTimes(1));
    expect((clic.mock.contexts.at(-1) as HTMLAnchorElement).download).toBe('domande-di-sostegno-per-stato-tx-0027.xlsx');
    expect(lette.file).toEqual(['/api/procedurale/stati-sostegno/xlsx?intervento=SRD01&stato=AMMESSA XMLHttpRequest']);
  });
});

describe('RF024: filtri della pagina degli stati di sostegno (TX-0024)', () => {
  it('TX-0024 in errore: lo stato dei valori con Riprova, i chip dell indirizzo restano, la tabella si legge col codice', async () => {
    servi({ valori: null });
    apri(`${PERCORSO}?intervento=SRD01`);
    const stato = (await screen.findByText(/^Valori dei filtri non disponibili: /)).closest('[role="status"]') as HTMLElement;
    expect(within(stato).getByRole('button', { name: 'Riprova' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Togli il filtro Intervento SRD01' })).toBeTruthy();
    expect(testo(within(await tabella()).getByRole('row', { name: "Apri l'anteprima dell'intervento SRD01" }).textContent)).toMatch(/^SRD01\d/);
  });
});

describe('RF025: filtro per stato area programmazione nella pagina degli stati di sostegno (TX-0025)', () => {
  it('TX-0025 in errore: il chip con la chiave dell indirizzo, il pannello con le voci dell indirizzo da poter togliere', async () => {
    servi({ statiArea: null });
    apri(`${PERCORSO}?stato=AMMESSA`);
    expect(await screen.findByRole('button', { name: 'Togli il filtro Stato area programmazione AMMESSA' })).toBeTruthy();
    await tabella();
    await userEvent.click(screen.getByRole('button', { name: /^Filtri/ }));
    const pannello = await screen.findByRole('dialog', { name: 'Filtri dei report procedurali' });
    expect(within(pannello).getByText("Valori dello stato area programmazione non disponibili: restano le voci dell'indirizzo.")).toBeTruthy();
    expect((within(pannello).getByRole('checkbox', { name: 'AMMESSA' }) as HTMLInputElement).checked).toBe(true);
  });
});

describe('RF027: stati della pagina degli stati di sostegno (caricamento, errore, vuoto)', () => {
  it('caricamento con lo scheletro e aria-live, poi i dati', async () => {
    const t = trattenuta();
    servi();
    server.use(
      http.get('*/api/procedurale/stati-sostegno', async ({ request }) => {
        await t.attesa;
        return HttpResponse.json(statiPer('SOSTEGNO', new URL(request.url).searchParams));
      }),
    );
    apri();
    const caricamento = await screen.findByText('Caricamento in corso…');
    expect(caricamento.closest('[role="status"]')?.getAttribute('aria-live')).toBe('polite');
    await act(async () => t.libera());
    await tabella();
  });

  it('errore dal problem-type: un solo avviso della pagina con Riprova, la pill dell ultimo dato resta', async () => {
    let tentativi = 0;
    servi();
    server.use(
      http.get('*/api/procedurale/stati-sostegno', ({ request }) => {
        tentativi += 1;
        return tentativi === 1 ? HttpResponse.json(problema(403, 'ACCESSO_NEGATO'), { status: 403 }) : HttpResponse.json(statiPer('SOSTEGNO', new URL(request.url).searchParams));
      }),
    );
    apri();
    const avviso = await screen.findByRole('alert');
    expect(screen.getAllByRole('alert')).toHaveLength(1);
    expect(avviso.textContent).not.toContain('403');
    expect(screen.getByRole('button', { name: /^Ultimo dato sincronizzato: dati al 02\/03\/2026/ })).toBeTruthy();
    await userEvent.click(within(avviso).getByRole('button', { name: 'Riprova' }));
    await tabella();
  });

  it('vuoto: nessuna domanda di sostegno per i filtri, con Modifica i filtri; Applica dal pannello porta il focus sul titolo', async () => {
    servi();
    const { router } = apri(`${PERCORSO}?intervento=SRD02`);
    const vuoto = (await screen.findByText('Nessuna domanda di sostegno per i filtri scelti.')).closest('[role="status"]') as HTMLElement;
    expect(screen.queryByRole('alert')).toBeNull();
    await userEvent.click(within(vuoto).getByRole('button', { name: 'Modifica i filtri' }));
    const pannello = await screen.findByRole('dialog', { name: 'Filtri dei report procedurali' });
    await userEvent.click(within(pannello).getByRole('button', { name: 'Azzera' }));
    await userEvent.click(within(pannello).getByRole('button', { name: 'Applica i filtri' }));
    await waitFor(() => expect(router.state.location.search).toBe(''));
    await waitFor(() => expect(document.activeElement).toBe(h1()));
  });
});
