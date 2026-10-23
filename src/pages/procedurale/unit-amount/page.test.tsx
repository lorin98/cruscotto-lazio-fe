// Pagina /procedurale/unit-amount (green-fe step7): describe taggati coi REQ della route (RF024, RF030), dati dagli
// scenari del backend (fixture del procedurale) con letture che rispondono ai parametri della query, MSW seminato con
// onUnhandledRequest 'error' (ogni lettura e' dichiarata qui), axe-core diretto. ECharts e' il grafico finto del setup.
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
import { unitAmountPer } from '../../../features/procedurale/testing/fixture';
import { lettureProcedurale } from '../../../features/procedurale/testing/letture';
import type { Basi } from '../../../features/procedurale/testing/letture';
import Pagina from './page';

const PERCORSO = '/procedurale/unit-amount';
const TITOLO = 'Procedurale: pagamenti per Unit Amount';
const CARD = 'Percentuale pagata per Unit Amount';
const testo = (s: string | null | undefined) => (s ?? '').replace(/\s/g, ' ');

function servi(basi?: Basi) {
  const { handlers, lette } = lettureProcedurale(basi);
  server.use(...handlers);
  return lette;
}

const apri = (indirizzo = PERCORSO) => renderPagina(Pagina, PERCORSO, indirizzo);
const h1 = () => screen.getByRole('heading', { level: 1, name: TITOLO });
const tabella = () => screen.findByRole('table', { name: /^Unit Amount degli interventi selezionati/ });

afterEach(() => vi.restoreAllMocks());

describe('RF030: pagamenti per Unit Amount degli interventi selezionati (TX-0030)', () => {
  it('una lettura con intervento e obiettivi, mai lo stato; la pill che lo dice; un solo h1 col focus; nessuna violazione axe', async () => {
    const lette = servi();
    const { container } = apri(`${PERCORSO}?intervento=SRD01&os=OS4&stato=AMMESSA`);
    const t = await tabella();
    expect(lette.unitAmount).toEqual(['?intervento=SRD01&os=OS4']);
    expect(lette.statiArea).toBe(0);
    expect(screen.getByText('Il filtro per stato area programmazione non si applica alle Unit Amount')).toBeTruthy();
    expect(within(t).getAllByRole('rowheader').map((c) => c.textContent)).toEqual(['UA1', 'UA2', 'UA1']);
    expect(document.activeElement).toBe(h1());
    expect(document.title).toBe('Unit Amount - Procedurale - Cruscotto CSR 2023-2027');
    await trovaCard(CARD);
    await expectNoA11yViolations(container);
  });

  it('pagato senza fonte (il caso reale): la nota unica sopra la tabella e "non disponibile" breve nelle celle; il grafico non disponibile', async () => {
    servi();
    apri();
    const t = await tabella();
    expect(screen.getByText('Importo pagato, percentuale pagata sul richiesto e base storica: non disponibili per tutte le Unit Amount (fonte pagato per Unit Amount non attiva). Nelle celle: "non disponibile".')).toBeTruthy();
    expect(testo(within(t).getByRole('row', { name: "Apri l'anteprima della Unit Amount UA1 di SRD01, esercizio 2025" }).textContent)).toBe('SRD01UA1Seminativi2025150,00 €10non disponibilenon disponibilenon disponibile');
    expect(testo((await trovaCard(CARD)).textContent)).toContain("Grafico non disponibile: nessuna Unit Amount ha ancora l'importo pagato (fonte pagato per Unit Amount non attiva).");
    expect(screen.getByText(/^Dati di programma dall'import CSR-UA, regionali per ogni profilo/)).toBeTruthy();
  });

  it('col pagato: il grafico, il clic su una barra apre l anteprima; la riga con Invio; Esc chiude e il focus torna alla riga', async () => {
    servi({ pagato: true });
    const { router } = apri();
    clicSulCodice(graficoDi(await trovaCard(CARD)), 'SRD01|UA1|2025');
    expect(await screen.findByRole('dialog', { name: 'Anteprima: UA1 (SRD01, esercizio 2025)' })).toBeTruthy();
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    const riga = within(await tabella()).getByRole('row', { name: "Apri l'anteprima della Unit Amount UA2 di SRD01, esercizio 2024" });
    riga.focus();
    await userEvent.keyboard('{Enter}');
    const drawer = await screen.findByRole('dialog', { name: 'Anteprima: UA2 (SRD01, esercizio 2024)' });
    expect(testo(drawer.textContent)).toContain('Importo unitarionon valorizzatoil dato non è presente nella fonte');
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(document.activeElement).toBe(within(screen.getByRole('table', { name: /^Unit Amount degli interventi selezionati/ })).getByRole('row', { name: "Apri l'anteprima della Unit Amount UA2 di SRD01, esercizio 2024" })));
    await userEvent.keyboard('{Enter}');
    await userEvent.click(within(await screen.findByRole('dialog', { name: 'Anteprima: UA2 (SRD01, esercizio 2024)' })).getByRole('link', { name: "Apri il dettaglio dell'intervento" }));
    await waitFor(() => expect(`${router.state.location.pathname}${router.state.location.search}`).toBe('/procedurale/interventi/SRD01'));
  });

  it('CSV e XLSX dal backend con intervento e obiettivi della pagina (mai lo stato), con X-Requested-With', async () => {
    const lette = servi();
    URL.createObjectURL = vi.fn(() => 'blob:prova');
    URL.revokeObjectURL = vi.fn();
    const clic = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    apri(`${PERCORSO}?intervento=SRD01&stato=AMMESSA`);
    await tabella();
    await userEvent.click(screen.getByRole('button', { name: 'Scarica la tabella Unit Amount degli interventi selezionati in XLSX' }));
    await waitFor(() => expect(clic).toHaveBeenCalledTimes(1));
    expect((clic.mock.contexts.at(-1) as HTMLAnchorElement).download).toBe('unit-amount-degli-interventi-selezionati-tx-0030.xlsx');
    expect(lette.file).toEqual(['/api/procedurale/unit-amount/xlsx?intervento=SRD01 XMLHttpRequest']);
  });
});

describe('RF024: filtri della pagina delle Unit Amount (TX-0024)', () => {
  it('il pannello senza lo stato; Azzera e Applica lasciano lo stato nell indirizzo per le altre pagine', async () => {
    const lette = servi();
    const { router } = apri(`${PERCORSO}?intervento=SRD01&stato=AMMESSA`);
    await tabella();
    await userEvent.click(screen.getByRole('button', { name: /^Filtri/ }));
    const pannello = await screen.findByRole('dialog', { name: 'Filtri dei report procedurali' });
    expect(within(pannello).queryByRole('checkbox', { name: 'Ammessa' })).toBeNull();
    await userEvent.click(within(pannello).getByRole('button', { name: 'Azzera' }));
    await userEvent.click(within(pannello).getByRole('button', { name: 'Applica i filtri' }));
    await waitFor(() => expect(router.state.location.search).toBe('?stato=AMMESSA'));
    await waitFor(() => expect(lette.unitAmount.at(-1)).toBe(''));
  });

  it('TX-0024 in errore: lo stato dei valori con Riprova; le Unit Amount si leggono', async () => {
    servi({ valori: null });
    apri();
    expect(await screen.findByText(/^Valori dei filtri non disponibili: /)).toBeTruthy();
    await tabella();
  });
});

describe('RF030: stati della pagina delle Unit Amount (caricamento, errore, vuoto)', () => {
  it('caricamento con lo scheletro e aria-live, poi i dati', async () => {
    const t = trattenuta();
    servi();
    server.use(
      http.get('*/api/procedurale/unit-amount', async ({ request }) => {
        await t.attesa;
        return HttpResponse.json(unitAmountPer(new URL(request.url).searchParams));
      }),
    );
    apri();
    expect((await screen.findByText('Caricamento in corso…')).closest('[role="status"]')?.getAttribute('aria-live')).toBe('polite');
    await act(async () => t.libera());
    await tabella();
  });

  it('errore dal problem-type: un solo avviso della pagina con Riprova', async () => {
    servi();
    server.use(http.get('*/api/procedurale/unit-amount', () => HttpResponse.json(problema(403, 'ACCESSO_NEGATO'), { status: 403 })));
    apri();
    const avviso = await screen.findByRole('alert');
    expect(screen.getAllByRole('alert')).toHaveLength(1);
    expect(within(avviso).getByRole('button', { name: 'Riprova' })).toBeTruthy();
  });

  it('vuoto: nessuna Unit Amount per gli interventi scelti, con Modifica i filtri; senza filtri non parla di interventi scelti', async () => {
    servi();
    const filtrata = apri(`${PERCORSO}?intervento=SRA01&stato=AMMESSA`);
    const vuoto = (await screen.findByText('Nessuna Unit Amount per gli interventi scelti.')).closest('[role="status"]') as HTMLElement;
    expect(within(vuoto).getByRole('button', { name: 'Modifica i filtri' })).toBeTruthy();
    filtrata.unmount();
    servi();
    server.use(http.get('*/api/procedurale/unit-amount', () => HttpResponse.json({ perimetro: 'REGIONALE', righe: [] })));
    apri(`${PERCORSO}?stato=AMMESSA`);
    expect(await screen.findByText('Nessuna Unit Amount.')).toBeTruthy();
  });
});
