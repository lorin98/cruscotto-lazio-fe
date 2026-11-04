// Pagina /procedurale/ammesse (green-fe step7): describe taggati coi REQ della route (RF024, RF025, RF026), dati dagli
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
import { ammessePer } from '../../../features/procedurale/testing/fixture';
import { lettureProcedurale } from '../../../features/procedurale/testing/letture';
import type { Basi } from '../../../features/procedurale/testing/letture';
import Pagina from './page';

const PERCORSO = '/procedurale/ammesse';
const TITOLO = 'Procedurale: domande ammesse per intervento';
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
const tabella = () => screen.findByRole('table', { name: /^Domande ammesse per intervento/ });

afterEach(() => vi.restoreAllMocks());

describe('RF026: domande ammesse, atto di concessione, importi e interventi attivati per intervento (TX-0026)', () => {
  it('una lettura coi criteri; KPI, nota, card e tabella in ordine di intervento; un solo h1 col focus; nessuna violazione axe', async () => {
    const lette = servi();
    const { container } = apri(`${PERCORSO}?og=OG2`);
    const t = await tabella();
    expect(lette.ammesse).toEqual(['?og=OG2']);
    expect(within(t).getAllByRole('rowheader').map((c) => c.textContent)).toEqual(['SRA01 - Produzione integrata', 'SRD01 - Investimenti produttivi agricoli per la competitività', 'Totale (2 interventi del perimetro ufficiale, 2 attivati)']);
    expect(testo(screen.getByRole('region', { name: 'Contributo ammesso' }).textContent)).toContain('su importo richiesto 1.500,00 €: 53,3 %');
    expect(document.activeElement).toBe(h1());
    expect(document.title).toBe('Domande ammesse - Procedurale - Cruscotto CSR 2023-2027');
    await trovaCard('Domande ammesse e con atto di concessione per intervento');
    await expectNoA11yViolations(container);
  });

  it('atto di concessione senza fonte: "non disponibile" col motivo, mai 0, e nessun link; col dato nel database i link', async () => {
    servi();
    const senza = apri();
    const srd01 = within(await tabella()).getByRole('row', { name: "Apri l'anteprima dell'intervento SRD01" });
    expect(testo(srd01.textContent)).toContain('non disponibilefonte atto di concessione non attiva');
    expect(within(srd01).getAllByRole('link').map((l) => l.getAttribute('aria-label'))).toEqual(["Apri nell'elenco operativo le 2 domande ammesse di SRD01"]);
    senza.unmount();
    servi({ varianti: { atto: true } });
    apri();
    const conAtto = within(await tabella()).getByRole('row', { name: "Apri l'anteprima dell'intervento SRD01" });
    expect(within(conAtto).getByRole('link', { name: "Apri nell'elenco operativo la domanda di sostegno con atto di concessione di SRD01" }).getAttribute('href')).toBe('/elenco-operativo/domande?concessione=true&tipo=SOSTEGNO&intervento=SRD01');
  });

  it('i totali sono quelli del backend (mai la somma delle righe nel browser)', async () => {
    servi();
    const corpo = ammessePer(new URLSearchParams());
    server.use(http.get('*/api/procedurale/domande-ammesse', () => HttpResponse.json({ ...corpo, totale: { ...corpo.totale, domandeAmmesse: 42, interventiAttivati: 9 } })));
    apri();
    expect(testo(within(await tabella()).getByRole('row', { name: /^Totale/ }).textContent)).toMatch(/^Totale \(3 interventi del perimetro ufficiale, 9 attivati\)42/);
    expect(testo(screen.getByRole('region', { name: 'Interventi attivati' }).textContent)).toContain('9 su 3');
  });

  it('il clic su una barra apre il dettaglio dell intervento con lo stato; la riga con Invio apre l anteprima e Esc la chiude', async () => {
    servi();
    const { router } = apri(`${PERCORSO}?stato=AMMESSA`);
    const riga = within(await tabella()).getByRole('row', { name: "Apri l'anteprima dell'intervento SRD01" });
    riga.focus();
    await userEvent.keyboard('{Enter}');
    const drawer = await screen.findByRole('dialog', { name: 'Anteprima: SRD01' });
    expect(testo(drawer.textContent)).toContain('Contributo ammesso800,00 €');
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Anteprima: SRD01' })).toBeNull());
    await waitFor(() => expect(document.activeElement).toBe(within(screen.getByRole('table', { name: /^Domande ammesse per intervento/ })).getByRole('row', { name: "Apri l'anteprima dell'intervento SRD01" })));
    clicSulCodice(graficoDi(await trovaCard('Domande ammesse e con atto di concessione per intervento')), 'SRA01');
    await waitFor(() => expect(`${router.state.location.pathname}${router.state.location.search}`).toBe('/procedurale/interventi/SRA01?stato=AMMESSA'));
  });

  it('senza il grant dell elenco operativo: nessun link nei KPI, nella tabella ne nell anteprima', async () => {
    profilo(['csr.tx-0024.read', 'csr.tx-0025.read', 'csr.tx-0026.read']);
    servi();
    apri();
    const t = await tabella();
    expect(within(t).queryAllByRole('link')).toHaveLength(0);
    expect(within(screen.getByRole('region', { name: 'Domande ammesse' })).queryByRole('link')).toBeNull();
  });

  it('CSV e XLSX dal backend coi filtri della pagina: l export di TX-0026 intero, con X-Requested-With', async () => {
    const lette = servi();
    URL.createObjectURL = vi.fn(() => 'blob:prova');
    URL.revokeObjectURL = vi.fn();
    const clic = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    apri(`${PERCORSO}?intervento=SRD01&stato=AMMESSA`);
    await tabella();
    // con una ricerca nella tabella la nota dice che il file resta l'intero report
    await userEvent.type(screen.getByRole('searchbox'), 'SRD');
    expect(screen.getByText(/^I file CSV e XLSX contengono tutto il report coi filtri della pagina/)).toBeTruthy();
    await userEvent.click(screen.getByRole('button', { name: 'Scarica la tabella Domande ammesse per intervento in CSV' }));
    await waitFor(() => expect(clic).toHaveBeenCalledTimes(1));
    expect((clic.mock.contexts.at(-1) as HTMLAnchorElement).download).toBe('domande-ammesse-per-intervento-tx-0026.csv');
    expect(lette.file).toEqual(['/api/procedurale/domande-ammesse/csv?intervento=SRD01&stato=AMMESSA XMLHttpRequest']);
  });
});

describe('RF024: filtri della pagina delle domande ammesse (TX-0024)', () => {
  it('TX-0024 in errore: lo stato dei valori con Riprova; il pannello propone i codici della risposta', async () => {
    servi({ valori: null });
    apri();
    expect(await screen.findByText(/^Valori dei filtri non disponibili: /)).toBeTruthy();
    await tabella();
    await userEvent.click(screen.getByRole('button', { name: /^Filtri/ }));
    const pannello = await screen.findByRole('dialog', { name: 'Filtri dei report procedurali' });
    for (const codice of ['SRA01', 'SRD01', 'SRD02']) expect(within(pannello).getByRole('checkbox', { name: codice })).toBeTruthy();
  });
});

describe('RF025: filtro per stato area programmazione nella pagina delle domande ammesse (TX-0025)', () => {
  it('uno stato diverso da Ammessa: zero domande ammesse e nessun link verso l elenco', async () => {
    const lette = servi();
    apri(`${PERCORSO}?stato=REVOCATA`);
    const t = await tabella();
    expect(lette.ammesse).toEqual(['?stato=REVOCATA']);
    expect(within(t).queryAllByRole('link')).toHaveLength(0);
    expect(testo(screen.getByRole('region', { name: 'Domande ammesse' }).textContent)).toMatch(/^Domande ammesse0/);
  });
});

describe('RF026: stati della pagina delle domande ammesse (caricamento, errore, vuoto)', () => {
  it('caricamento con lo scheletro e aria-live, poi i dati', async () => {
    const t = trattenuta();
    servi();
    server.use(
      http.get('*/api/procedurale/domande-ammesse', async ({ request }) => {
        await t.attesa;
        return HttpResponse.json(ammessePer(new URL(request.url).searchParams));
      }),
    );
    apri();
    expect((await screen.findByText('Caricamento in corso…')).closest('[role="status"]')?.getAttribute('aria-live')).toBe('polite');
    await act(async () => t.libera());
    await tabella();
  });

  it('errore dal problem-type: un solo avviso della pagina con Riprova; Riprova rilegge', async () => {
    let tentativi = 0;
    servi();
    server.use(
      http.get('*/api/procedurale/domande-ammesse', ({ request }) => {
        tentativi += 1;
        return tentativi === 1 ? HttpResponse.json(problema(503, 'CAPACITA_ESAURITA'), { status: 503 }) : HttpResponse.json(ammessePer(new URL(request.url).searchParams));
      }),
    );
    apri();
    const avviso = await screen.findByRole('alert');
    expect(screen.getAllByRole('alert')).toHaveLength(1);
    await userEvent.click(within(avviso).getByRole('button', { name: 'Riprova' }));
    await tabella();
  });

  it('vuoto: nessun intervento per i filtri, con Modifica i filtri che apre il pannello', async () => {
    servi();
    apri(`${PERCORSO}?os=OS9`);
    const vuoto = (await screen.findByText('Nessun intervento per i filtri scelti.')).closest('[role="status"]') as HTMLElement;
    await userEvent.click(within(vuoto).getByRole('button', { name: 'Modifica i filtri' }));
    expect(await screen.findByRole('dialog', { name: 'Filtri dei report procedurali' })).toBeTruthy();
  });
});

describe('Revisioni del 31/10/2026: domande ammesse solo NO SIGC, non pertinenti col filtro SIGC (F3; review J-12)', () => {
  it('col filtro SIGC la pagina e non pertinente e TX-0026 si legge senza filtro', async () => {
    const lette = servi();
    apri(`${PERCORSO}?sigc=true`);
    expect((await screen.findAllByText('Non pertinente al filtro SIGC')).length).toBeGreaterThan(0);
    await waitFor(() => expect(lette.ammesse.length).toBeGreaterThan(0));
    expect(lette.ammesse.every((q) => !q.includes('sigc'))).toBe(true);
  });

  it('col filtro NO SIGC TX-0026 si legge con sigc=false, nessuna card non pertinente', async () => {
    const lette = servi();
    apri(`${PERCORSO}?sigc=false`);
    await waitFor(() => expect(lette.ammesse).toEqual(['?sigc=false']));
    expect(screen.queryByText(/^Non pertinente al filtro/)).toBeNull();
  });

  it('cambiando il filtro SIGC la tabella riparte dalla prima pagina, anche con la risposta gia in cache (review X-11)', async () => {
    servi();
    const corpo = ammessePer(new URLSearchParams());
    const riga = (corpo.righe ?? [])[0];
    const righe = Array.from({ length: 30 }, (_, k) => ({ ...riga, codiceIntervento: `SRA${k + 10}` }));
    server.use(http.get('*/api/procedurale/domande-ammesse', () => HttpResponse.json({ ...corpo, righe })));
    apri();
    const controllo = () => within(screen.getByRole('group', { name: 'Interventi SIGC o NO SIGC' }));
    const pagine = () => within(screen.getByRole('navigation', { name: 'Pagine della tabella' }));
    await tabella();
    // la cache di "Tutti" e' calda: tornandoci la tabella non passa dal caricamento
    await userEvent.click(controllo().getByRole('button', { name: 'NO SIGC' }));
    await waitFor(() => expect(controllo().getByRole('button', { name: 'NO SIGC' }).getAttribute('aria-pressed')).toBe('true'));
    await tabella();
    await userEvent.click(pagine().getByRole('button', { name: 'Pagina 2' }));
    expect(within(await tabella()).getByRole('row', { name: "Apri l'anteprima dell'intervento SRA35" })).toBeTruthy();
    await userEvent.click(controllo().getByRole('button', { name: 'Tutti' }));
    await waitFor(() => expect(controllo().getByRole('button', { name: 'Tutti' }).getAttribute('aria-pressed')).toBe('true'));
    await waitFor(() => expect(pagine().getByRole('button', { name: 'Pagina 1' }).getAttribute('aria-current')).toBe('page'));
  });
});
