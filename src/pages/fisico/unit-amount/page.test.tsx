// Pagina /fisico/unit-amount (green-fe step7; dal procedurale col riallineamento degli ambiti del 29/10/2026, con gli stessi
// casi della pagina /procedurale/unit-amount): describe taggati coi REQ della route (RF030, RA006), dati dagli scenari del
// backend (fixture del fisico) con letture che rispondono ai parametri della query, MSW seminato con onUnhandledRequest
// 'error' (ogni lettura e' dichiarata qui), axe-core diretto. ECharts e' il grafico finto del setup. I valori dei filtri
// vengono da TX-0060 (G2) e non da TX-0024 del procedurale; dal 30/10/2026 (wireframe unit-amount approvato) i filtri dei
// report fisici con l'azione portante (SC-FS_UNIT_AMOUNT_AZIONE), la descrizione dell'intervento e il link al dettaglio
// dell'intervento del fisico nel drawer.
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
import { VALORI_PROGRAMMA, unitAmountPer } from '../../../features/fisico/testing/fixture';
import { lettureFisico } from '../../../features/fisico/testing/letture';
import Pagina from './page';

const PERCORSO = '/fisico/unit-amount';
const TITOLO = 'Fisico: pagamenti per Unit Amount';
const CARD = 'Percentuale pagata per Unit Amount';
const testo = (s: string | null | undefined) => (s ?? '').replace(/\s/g, ' ');

function servi(basi?: Parameters<typeof lettureFisico>[0]) {
  const { handlers, lette } = lettureFisico(basi);
  server.use(...handlers);
  return lette;
}

const apri = (indirizzo = PERCORSO) => renderPagina(Pagina, PERCORSO, indirizzo);
const h1 = () => screen.getByRole('heading', { level: 1, name: TITOLO });
const tabella = () => screen.findByRole('table', { name: /^Unit Amount degli interventi selezionati/ });

afterEach(() => vi.restoreAllMocks());

describe('RF030: pagamenti per Unit Amount degli interventi selezionati (TX-0030)', () => {
  it('una lettura coi filtri dell indirizzo (l azione senza il legame non si applica e il chip lo dice); un solo h1 col focus; perimetro e Dati al della risposta; nessuna violazione axe', async () => {
    const lette = servi();
    const { container } = apri(`${PERCORSO}?intervento=SRD01&os=OS4&azione=3`);
    const t = await tabella();
    expect(lette.unitAmount).toEqual(['?intervento=SRD01&os=OS4']);
    expect(within(t).getAllByRole('rowheader').map((c) => c.textContent)).toEqual(['UA1', 'UA2', 'UA1']);
    expect(document.activeElement).toBe(h1());
    expect(document.title).toBe('Unit Amount - Fisico - Cruscotto CSR 2023-2027');
    const barra = screen.getByRole('region', { name: 'Filtri attivi' });
    expect(within(barra).getByText('Perimetro: regionale')).toBeTruthy();
    expect(within(barra).getByRole('button', { name: /^Ultimo dato sincronizzato: dati al 02\/03\/2026/ })).toBeTruthy();
    // il legame interventi - azioni non c'e' (legameAzioniDisponibile falso in TX-0060): l'azione resta nell'indirizzo, non si applica
    expect(within(barra).getByText(/3 \(non applicato: il legame con le azioni portanti viene da una fonte non attiva\)/)).toBeTruthy();
    await trovaCard(CARD);
    await expectNoA11yViolations(container);
  });

  it('pagato senza fonte (il caso reale): la nota unica sopra la tabella e "non disponibile" breve nelle celle; il grafico non disponibile', async () => {
    servi();
    apri();
    const t = await tabella();
    expect(screen.getByText('Importo pagato, percentuale pagata sul richiesto e base storica: non disponibili per tutte le Unit Amount (fonte pagato per Unit Amount non attiva). Nelle celle: "non disponibile".')).toBeTruthy();
    expect(testo(within(t).getByRole('row', { name: "Apri l'anteprima della Unit Amount UA1 di SRD01, esercizio 2025" }).textContent)).toBe('SRD01UA1Seminativi2025150,00 €10non disponibilenon disponibilenon disponibile');
    const card = await trovaCard(CARD);
    expect(testo(card.textContent)).toContain("Grafico non disponibile: nessuna Unit Amount ha ancora l'importo pagato (fonte pagato per Unit Amount non attiva).");
    // la tabella della card, subito sotto il testo che dice il motivo: "non disponibile" in breve (scelta 8)
    expect(testo(within(within(card).getByRole('table')).getByRole('row', { name: /^UA1 \(SRD01, esercizio 2025\)/ }).textContent)).toBe('UA1 (SRD01, esercizio 2025)non disponibilenon disponibile');
    expect(screen.getByText(/^Dati di programma dall'import CSR-UA, regionali per ogni profilo/)).toBeTruthy();
  });

  it('pagato senza fonte: l anteprima (un dialogo, lontano dalla nota della tabella) dice il motivo per i tre dati', async () => {
    servi();
    apri();
    const riga = within(await tabella()).getByRole('row', { name: "Apri l'anteprima della Unit Amount UA1 di SRD01, esercizio 2025" });
    riga.focus();
    await userEvent.keyboard('{Enter}');
    const drawer = testo((await screen.findByRole('dialog', { name: 'Anteprima: UA1 (SRD01, esercizio 2025)' })).textContent);
    for (const dato of ['Importo pagato', 'Pagato sul richiesto', 'Base storica']) expect(drawer).toContain(`${dato}non disponibilefonte pagato per Unit Amount non attiva`);
  });

  it('col pagato: il grafico, il clic su una barra apre l anteprima; la riga con Invio; Esc chiude e il focus torna alla riga', async () => {
    servi({ pagato: true });
    apri();
    clicSulCodice(graficoDi(await trovaCard(CARD)), 'SRD01|UA1|2025');
    expect(await screen.findByRole('dialog', { name: 'Anteprima: UA1 (SRD01, esercizio 2025)' })).toBeTruthy();
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    const riga = within(await tabella()).getByRole('row', { name: "Apri l'anteprima della Unit Amount UA2 di SRD01, esercizio 2024" });
    riga.focus();
    await userEvent.keyboard('{Enter}');
    const drawer = await screen.findByRole('dialog', { name: 'Anteprima: UA2 (SRD01, esercizio 2024)' });
    expect(testo(drawer.textContent)).toContain('Importo unitarionon valorizzatoil dato non è presente nella fonte');
    // il dettaglio dell'intervento del fisico (link dettaglio-intervento-unit-amount, 30/10/2026)
    expect(within(drawer).getByRole('link', { name: "Apri il dettaglio dell'intervento" }).getAttribute('href')).toBe('/fisico/interventi/SRD01');
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(document.activeElement).toBe(within(screen.getByRole('table', { name: /^Unit Amount degli interventi selezionati/ })).getByRole('row', { name: "Apri l'anteprima della Unit Amount UA2 di SRD01, esercizio 2024" })));
  });

  it('CSV e XLSX dal backend con intervento e obiettivi della pagina, con X-Requested-With', async () => {
    const lette = servi();
    URL.createObjectURL = vi.fn(() => 'blob:prova');
    URL.revokeObjectURL = vi.fn();
    const clic = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    apri(`${PERCORSO}?intervento=SRD01`);
    await tabella();
    await userEvent.click(screen.getByRole('button', { name: 'Scarica la tabella Unit Amount degli interventi selezionati in XLSX' }));
    await waitFor(() => expect(clic).toHaveBeenCalledTimes(1));
    expect((clic.mock.contexts.at(-1) as HTMLAnchorElement).download).toBe('unit-amount-degli-interventi-selezionati-tx-0030.xlsx');
    expect(lette.file).toEqual(['/api/fisico/unit-amount/xlsx?intervento=SRD01 XMLHttpRequest']);
  });
});

describe('RA006: filtri della pagina delle Unit Amount (voci da TX-0060, decisione G2)', () => {
  it('il pannello dei report fisici con l azione portante (non disponibile senza il legame); Azzera e Applica tolgono i filtri e rileggono', async () => {
    const lette = servi();
    const { router } = apri(`${PERCORSO}?intervento=SRD01`);
    await tabella();
    await userEvent.click(screen.getByRole('button', { name: /^Filtri/ }));
    const pannello = await screen.findByRole('dialog', { name: 'Filtri dei report fisici' });
    expect(within(pannello).getByText("Non disponibile finché nessun intervento è collegato a un'azione portante.")).toBeTruthy();
    expect(within(pannello).getByRole('checkbox', { name: 'SRD01 Investimenti produttivi agricoli per la competitività' })).toBeTruthy();
    await userEvent.click(within(pannello).getByRole('button', { name: 'Azzera' }));
    await userEvent.click(within(pannello).getByRole('button', { name: 'Applica i filtri' }));
    await waitFor(() => expect(router.state.location.search).toBe(''));
    await waitFor(() => expect(lette.unitAmount.at(-1)).toBe(''));
  });

  it("SC-FS_UNIT_AMOUNT_AZIONE: col legame interventi - azioni l'azione portante va alla lettura e al file; senza Unit Amount collegate il vuoto lo dice", async () => {
    const lette = servi({ valori: { ...VALORI_PROGRAMMA, legameAzioniDisponibile: true } });
    apri(`${PERCORSO}?intervento=SRD01&azione=3`);
    const vuoto = (await screen.findByText("Nessuna Unit Amount per i filtri scelti (per esempio un'azione portante senza interventi collegati).")).closest('[role="status"]') as HTMLElement;
    expect(lette.unitAmount).toEqual(['?intervento=SRD01&azione=3']);
    const barra = screen.getByRole('region', { name: 'Filtri attivi' });
    expect(within(barra).getByRole('button', { name: /^Togli il filtro Azione portante/ })).toBeTruthy();
    // Modifica i filtri apre il pannello, con l'azione scelta fra le voci di TX-0060
    await userEvent.click(within(vuoto).getByRole('button', { name: 'Modifica i filtri' }));
    const pannello = await screen.findByRole('dialog', { name: 'Filtri dei report fisici' });
    expect((within(pannello).getByRole('checkbox', { name: /Azione portante 3/ }) as HTMLInputElement).checked).toBe(true);
  });

  it('TX-0060 in errore: lo stato dei valori con Riprova; le Unit Amount si leggono', async () => {
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
      http.get('*/api/fisico/unit-amount', async ({ request }) => {
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
    server.use(http.get('*/api/fisico/unit-amount', () => HttpResponse.json(problema(403, 'ACCESSO_NEGATO'), { status: 403 })));
    apri();
    const avviso = await screen.findByRole('alert');
    expect(screen.getAllByRole('alert')).toHaveLength(1);
    expect(within(avviso).getByRole('button', { name: 'Riprova' })).toBeTruthy();
  });

  it('vuoto: nessuna Unit Amount per i filtri scelti, con Modifica i filtri; senza filtri non parla di filtri', async () => {
    servi();
    const filtrata = apri(`${PERCORSO}?intervento=SRA01`);
    const vuoto = (await screen.findByText("Nessuna Unit Amount per i filtri scelti (per esempio un'azione portante senza interventi collegati).")).closest('[role="status"]') as HTMLElement;
    expect(within(vuoto).getByRole('button', { name: 'Modifica i filtri' })).toBeTruthy();
    filtrata.unmount();
    servi();
    server.use(http.get('*/api/fisico/unit-amount', () => HttpResponse.json({ perimetro: 'REGIONALE', righe: [], ultimiDatiSincronizzati: [] })));
    apri();
    expect(await screen.findByText('Nessuna Unit Amount.')).toBeTruthy();
  });
});
