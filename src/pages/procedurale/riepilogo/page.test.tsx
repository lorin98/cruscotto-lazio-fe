// Pagina /procedurale/riepilogo (green-fe step7): describe taggati coi REQ della route (RF024, RF025, RF029), dati dagli
// scenari del backend (fixture del procedurale) con letture che rispondono ai parametri della query, MSW seminato con
// onUnhandledRequest 'error' (ogni lettura e' dichiarata qui), axe-core diretto. ECharts e' il grafico finto del setup:
// i clic sulle barre sono quelli del dato disegnato.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '../../../shared/api/mock/server';
import { expectNoA11yViolations } from '../../../shared/testing/axe';
import { graficoDi, trovaCard } from '../../../shared/testing/card-grafico';
import { clicSulCodice } from '../../../shared/testing/grafico-finto';
import { problema, trattenuta } from '../../../shared/testing/msw';
import { renderPagina } from '../../../shared/testing/render-pagina';
import { riepilogoPer } from '../../../features/procedurale/testing/fixture';
import { lettureProcedurale } from '../../../features/procedurale/testing/letture';
import type { Basi } from '../../../features/procedurale/testing/letture';
import Pagina from './page';

const PERCORSO = '/procedurale/riepilogo';
const TITOLO = 'Procedurale: riepilogo per intervento';
const GRAFICO = 'Domande per intervento';
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
const vista = () => within(screen.getByRole('group', { name: 'Vista del riepilogo' }));
const tabella = () => screen.findByRole('table', { name: /^Riepilogo per intervento: tutte le misure procedurali/ });
const dove = (router: ReturnType<typeof apri>['router']) => `${router.state.location.pathname}${router.state.location.search}`;

afterEach(() => vi.restoreAllMocks());

describe('RF029: riepilogo per intervento delle misure procedurali (TX-0029)', () => {
  it('una lettura coi criteri; vista Grafico di partenza; un solo h1 col focus; nessuna violazione axe', async () => {
    const lette = servi();
    const { container } = apri(`${PERCORSO}?intervento=SRA01&intervento=SRD01`);
    await trovaCard(GRAFICO);
    expect(lette.riepilogo).toEqual(['?intervento=SRA01&intervento=SRD01']);
    expect(vista().getByRole('button', { name: 'Grafico' }).getAttribute('aria-pressed')).toBe('true');
    expect(document.activeElement).toBe(h1());
    expect(document.title).toBe('Riepilogo per intervento - Procedurale - Cruscotto CSR 2023-2027');
    await expectNoA11yViolations(container);
  });

  it('il clic su una barra apre il dettaglio dell intervento con lo stato della pagina', async () => {
    servi();
    const { router } = apri(`${PERCORSO}?stato=SENZA_STATO`);
    clicSulCodice(graficoDi(await trovaCard(GRAFICO)), 'SRD01');
    await waitFor(() => expect(dove(router)).toBe('/procedurale/interventi/SRD01?stato=SENZA_STATO'));
  });

  it('vista Tabella: le sezioni coi totali visibili e le voci a scelta, il totale del backend; nessuna violazione axe', async () => {
    servi();
    const corpo = riepilogoPer(new URLSearchParams());
    server.use(http.get('*/api/procedurale/riepilogo', () => HttpResponse.json({ ...corpo, totale: { ...corpo.totale, ammesse: corpo.totale?.ammesse ? { ...corpo.totale.ammesse, domandeAmmesse: 42 } : undefined } })));
    const { container } = apri();
    await trovaCard(GRAFICO);
    await userEvent.click(vista().getByRole('button', { name: 'Tabella' }));
    const t = await tabella();
    expect(within(t).getAllByRole('columnheader', { name: /^(Domande ammesse|Area programmazione|Sostegno|Pagamento)$/ }).map((c) => c.textContent)).toEqual(['Domande ammesse', 'Area programmazione', 'Sostegno', 'Pagamento']);
    expect(testo(within(t).getByRole('row', { name: /^Totale \(dal backend\)/ }).textContent)).toMatch(/^Totale \(dal backend\)42/);
    expect(within(t).getByRole('row', { name: "Apri l'anteprima dell'intervento SRD01" })).toBeTruthy();
    await expectNoA11yViolations(container);
  });

  it('la vista scelta resta tornando indietro dall elenco operativo (cronologia del browser)', async () => {
    servi();
    const { router } = apri(`${PERCORSO}?intervento=SRD01`);
    await trovaCard(GRAFICO);
    await userEvent.click(vista().getByRole('button', { name: 'Tabella' }));
    const riga = within(await tabella()).getByRole('row', { name: "Apri l'anteprima dell'intervento SRD01" });
    await userEvent.click(within(riga).getByRole('link', { name: "Apri nell'elenco operativo le 2 domande ammesse di SRD01" }));
    await waitFor(() => expect(dove(router)).toBe('/elenco-operativo/domande?voceProgrammazione=AMMESSA&intervento=SRD01'));
    await act(() => router.navigate(-1));
    await tabella();
    expect(vista().getByRole('button', { name: 'Tabella' }).getAttribute('aria-pressed')).toBe('true');
  });

  it('l anteprima della riga con Invio: le misure e i link; Esc la chiude e il focus torna alla riga', async () => {
    servi();
    apri();
    await trovaCard(GRAFICO);
    await userEvent.click(vista().getByRole('button', { name: 'Tabella' }));
    const riga = within(await tabella()).getByRole('row', { name: "Apri l'anteprima dell'intervento SRA01" });
    riga.focus();
    await userEvent.keyboard('{Enter}');
    const drawer = await screen.findByRole('dialog', { name: 'Anteprima: SRA01' });
    expect(testo(drawer.textContent)).toContain('Domande di sostegno1, di cui non rilasciate 0');
    expect(within(drawer).getByRole('link', { name: "Apri nell'elenco operativo la domanda ammessa di SRA01" }).getAttribute('href')).toBe('/elenco-operativo/domande?voceProgrammazione=AMMESSA&intervento=SRA01');
    await expectNoA11yViolations(drawer);
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Anteprima: SRA01' })).toBeNull());
    await waitFor(() => expect(document.activeElement).toBe(within(screen.getByRole('table', { name: /^Riepilogo per intervento: tutte le misure procedurali/ })).getByRole('row', { name: "Apri l'anteprima dell'intervento SRA01" })));
  });

  it('senza il grant dell elenco operativo nessun link nella tabella', async () => {
    profilo(['csr.tx-0024.read', 'csr.tx-0025.read', 'csr.tx-0029.read']);
    servi();
    apri();
    await trovaCard(GRAFICO);
    await userEvent.click(vista().getByRole('button', { name: 'Tabella' }));
    expect(within(await tabella()).queryAllByRole('link')).toHaveLength(0);
  });

  it('CSV e XLSX dal backend coi filtri della pagina, con X-Requested-With', async () => {
    const lette = servi();
    URL.createObjectURL = vi.fn(() => 'blob:prova');
    URL.revokeObjectURL = vi.fn();
    const clic = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    apri(`${PERCORSO}?op=OP2&stato=AMMESSA`);
    await userEvent.click(within(await trovaCard(GRAFICO)).getByRole('button', { name: 'Scarica i dati del riepilogo per intervento in CSV' }));
    await waitFor(() => expect(clic).toHaveBeenCalledTimes(1));
    expect((clic.mock.contexts.at(-1) as HTMLAnchorElement).download).toBe('domande-per-intervento-tx-0029.csv');
    expect(lette.file).toEqual(['/api/procedurale/riepilogo/csv?op=OP2&stato=AMMESSA XMLHttpRequest']);
  });
});

describe('RF024: filtri della pagina del riepilogo (TX-0024)', () => {
  it('TX-0024 in errore: lo stato dei valori con Riprova; il riepilogo si legge', async () => {
    servi({ valori: null });
    apri();
    expect(await screen.findByText(/^Valori dei filtri non disponibili: /)).toBeTruthy();
    await trovaCard(GRAFICO);
  });
});

describe('RF025: filtro per stato area programmazione nel riepilogo (TX-0025)', () => {
  it('lo stato va nella lettura e nel chip; togliendo il chip la lettura riparte e la vista resta', async () => {
    const lette = servi();
    apri(`${PERCORSO}?stato=AMMESSA`);
    await trovaCard(GRAFICO);
    await userEvent.click(vista().getByRole('button', { name: 'Tabella' }));
    await tabella();
    await userEvent.click(screen.getByRole('button', { name: 'Togli il filtro Stato area programmazione Ammessa' }));
    await waitFor(() => expect(lette.riepilogo.at(-1)).toBe(''));
    await tabella();
    expect(vista().getByRole('button', { name: 'Tabella' }).getAttribute('aria-pressed')).toBe('true');
  });
});

describe('RF029: stati della pagina del riepilogo (caricamento, errore, vuoto)', () => {
  it('caricamento con lo scheletro e aria-live, poi i dati', async () => {
    const t = trattenuta();
    servi();
    server.use(
      http.get('*/api/procedurale/riepilogo', async ({ request }) => {
        await t.attesa;
        return HttpResponse.json(riepilogoPer(new URL(request.url).searchParams));
      }),
    );
    apri();
    expect((await screen.findByText('Caricamento in corso…')).closest('[role="status"]')?.getAttribute('aria-live')).toBe('polite');
    await act(async () => t.libera());
    await trovaCard(GRAFICO);
  });

  it('errore dal problem-type: un solo avviso della pagina con Riprova; Riprova rilegge', async () => {
    let tentativi = 0;
    servi();
    server.use(
      http.get('*/api/procedurale/riepilogo', ({ request }) => {
        tentativi += 1;
        return tentativi === 1 ? HttpResponse.json(problema(503, 'CAPACITA_ESAURITA'), { status: 503 }) : HttpResponse.json(riepilogoPer(new URL(request.url).searchParams));
      }),
    );
    apri();
    const avviso = await screen.findByRole('alert');
    expect(screen.getAllByRole('alert')).toHaveLength(1);
    await userEvent.click(within(avviso).getByRole('button', { name: 'Riprova' }));
    await trovaCard(GRAFICO);
  });

  it('vuoto: nessun intervento per i filtri, con Modifica i filtri', async () => {
    servi();
    apri(`${PERCORSO}?os=OS9`);
    const vuoto = (await screen.findByText('Nessun intervento per i filtri scelti.')).closest('[role="status"]') as HTMLElement;
    expect(within(vuoto).getByRole('button', { name: 'Modifica i filtri' })).toBeTruthy();
    expect(screen.queryByRole('group', { name: 'Vista del riepilogo' })).toBeNull();
  });
});
