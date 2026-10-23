// Pagina /procedurale/stati-pagamento (green-fe step7): describe taggati coi REQ della route (RF024, RF025, RF028), dati
// dagli scenari del backend (fixture del procedurale) con letture che rispondono ai parametri della query, MSW seminato
// con onUnhandledRequest 'error' (ogni lettura e' dichiarata qui), axe-core diretto. ECharts e' il grafico finto del
// setup: i clic sulle barre sono quelli del dato disegnato.
import { describe, expect, it } from 'vitest';
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

const PERCORSO = '/procedurale/stati-pagamento';
const TITOLO = 'Procedurale: stati delle domande di pagamento';
const CARD = 'Domande di pagamento per stato';
const testo = (s: string | null | undefined) => (s ?? '').replace(/\s/g, ' ');

function servi(basi?: Basi) {
  const { handlers, lette } = lettureProcedurale(basi);
  server.use(...handlers);
  return lette;
}

const apri = (indirizzo = PERCORSO) => renderPagina(Pagina, PERCORSO, indirizzo);
const h1 = () => screen.getByRole('heading', { level: 1, name: TITOLO });
const tabella = () => screen.findByRole('table', { name: /^Domande di pagamento per intervento e stato/ });

describe('RF028: stati della domanda di pagamento CSR-DP per intervento (TX-0028)', () => {
  it('una lettura coi criteri; la nota sulle domande SIGC; i cinque stati e gli altri per codice; nessuna violazione axe', async () => {
    const lette = servi();
    const { container } = apri(`${PERCORSO}?op=OP1`);
    const t = await tabella();
    expect(lette.pagamento).toEqual(['?op=OP1']);
    expect(lette.sostegno).toEqual([]);
    expect(screen.getByText(/^Le domande SIGC \(ASR2-08, ASR2-20\) e le domande minime dei decreti non hanno questi stati/)).toBeTruthy();
    expect(testo(within(t).getByRole('row', { name: "Apri l'anteprima dell'intervento SRD01" }).textContent)).toContain('PROPOSTO AL PAGAMENTO-ESTRAZ. CAMPIONE-DA ESEGUIRE 1');
    expect(testo(screen.getByRole('region', { name: 'Domande di pagamento' }).textContent)).toContain('CSR-DP: voci, altri stati e domande non rilasciate comprese');
    expect(document.activeElement).toBe(h1());
    expect(document.title).toBe('Stati delle domande di pagamento - Procedurale - Cruscotto CSR 2023-2027');
    await trovaCard(CARD);
    await expectNoA11yViolations(container);
  });

  it('un altro stato fuori catalogo: la voce del grafico e il suo link nell elenco col codice codificato', async () => {
    servi();
    apri();
    const card = await trovaCard(CARD);
    const t = await tabellaDi(card);
    expect(within(t).getByRole('link', { name: "Apri nell'elenco operativo la domanda di pagamento nello stato PROPOSTO AL PAGAMENTO-ESTRAZ. CAMPIONE-DA ESEGUIRE" }).getAttribute('href')).toBe(
      '/elenco-operativo/domande?statoPagamento=PROPOSTO+AL+PAGAMENTO-ESTRAZ.+CAMPIONE-DA+ESEGUIRE',
    );
    await userEvent.click(within(card).getByRole('button', { name: 'Grafico' }));
    clicSulCodice(graficoDi(card), 'PROPOSTA_DA_REVISIONARE');
    const filtro = await screen.findByRole('group', { name: 'Filtro della tabella dal grafico' });
    expect(within(filtro).getByRole('button', { name: 'Togli il filtro Voce Proposta al pagamento - da revisionare' })).toBeTruthy();
    expect(within(await tabella()).getAllByRole('row', { name: /^Apri l'anteprima/ })).toHaveLength(1);
  });

  it('l anteprima della riga: le voci con domande e i link, nessun mini grafico (solo per il sostegno)', async () => {
    servi();
    apri();
    await userEvent.click(within(await tabella()).getByRole('row', { name: "Apri l'anteprima dell'intervento SRD01" }));
    const drawer = await screen.findByRole('dialog', { name: 'Anteprima: SRD01' });
    expect(testo(drawer.textContent)).toContain('Domande di pagamento3, di cui non rilasciate 0');
    expect(within(drawer).getByRole('link', { name: "Apri nell'elenco operativo la domanda di pagamento di SRD01 nello stato Proposta al pagamento - da revisionare" })).toBeTruthy();
    expect(drawer.querySelector('[data-card-grafico]')).toBeNull();
    await expectNoA11yViolations(drawer);
  });
});

describe('RF024: filtri della pagina degli stati di pagamento (TX-0024)', () => {
  it('le voci del pannello da TX-0024; Applica porta i filtri nell indirizzo e nella lettura', async () => {
    const lette = servi();
    const { router } = apri();
    await tabella();
    await userEvent.click(screen.getByRole('button', { name: /^Filtri/ }));
    const pannello = await screen.findByRole('dialog', { name: 'Filtri dei report procedurali' });
    await userEvent.click(within(pannello).getByRole('checkbox', { name: 'SRD01 Investimenti produttivi agricoli per la competitività' }));
    await userEvent.click(within(pannello).getByRole('button', { name: 'Applica i filtri' }));
    await waitFor(() => expect(router.state.location.search).toBe('?intervento=SRD01'));
    await waitFor(() => expect(lette.pagamento.at(-1)).toBe('?intervento=SRD01'));
  });
});

describe('RF025: filtro per stato area programmazione nella pagina degli stati di pagamento (TX-0025)', () => {
  it('lo stato scelto restringe le domande lette (domanda revocata); il chip con la descrizione di TX-0025', async () => {
    const lette = servi();
    apri(`${PERCORSO}?stato=REVOCATA`);
    expect(await screen.findByRole('button', { name: 'Togli il filtro Stato area programmazione Revocata' })).toBeTruthy();
    const t = await tabella();
    expect(lette.pagamento).toEqual(['?stato=REVOCATA']);
    expect(testo(within(t).getByRole('row', { name: /^Totale/ }).textContent)).toMatch(/^Totale \(dal backend, tutti gli interventi dei filtri\)10/);
  });
});

describe('RF028: stati della pagina degli stati di pagamento (caricamento, errore, vuoto)', () => {
  it('caricamento con lo scheletro e aria-live, poi i dati', async () => {
    const t = trattenuta();
    servi();
    server.use(
      http.get('*/api/procedurale/stati-pagamento', async ({ request }) => {
        await t.attesa;
        return HttpResponse.json(statiPer('PAGAMENTO', new URL(request.url).searchParams));
      }),
    );
    apri();
    expect((await screen.findByText('Caricamento in corso…')).closest('[role="status"]')?.getAttribute('aria-live')).toBe('polite');
    await act(async () => t.libera());
    await tabella();
  });

  it('errore dal problem-type: un solo avviso della pagina con Riprova', async () => {
    servi();
    server.use(http.get('*/api/procedurale/stati-pagamento', () => HttpResponse.json(problema(503, 'CAPACITA_ESAURITA'), { status: 503 })));
    apri();
    const avviso = await screen.findByRole('alert');
    expect(screen.getAllByRole('alert')).toHaveLength(1);
    expect(within(avviso).getByRole('button', { name: 'Riprova' })).toBeTruthy();
    expect(avviso.textContent).not.toContain('503');
  });

  it('vuoto: nessuna domanda di pagamento CSR-DP per i filtri (un intervento SIGC), con Modifica i filtri', async () => {
    servi();
    apri(`${PERCORSO}?intervento=SRA01`);
    const vuoto = (await screen.findByText('Nessuna domanda di pagamento CSR-DP per i filtri scelti.')).closest('[role="status"]') as HTMLElement;
    expect(within(vuoto).getByRole('button', { name: 'Modifica i filtri' })).toBeTruthy();
    expect(screen.queryByRole('alert')).toBeNull();
  });
});
