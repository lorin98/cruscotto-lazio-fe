// Test dei componenti del procedurale (green-fe step5): un test L2 per componente (render su MSW, ruoli e stati
// accessibili) e un test a11y con axe-core diretto. ECharts e' il grafico finto di src/shared/test/setup.ts (jsdom non
// disegna): i clic sulle barre sono quelli del dato disegnato. Le letture sono dichiarate da ogni test con le letture di
// prova del procedurale (il server dei test non monta i mock generati) e rispondono come il backend ai parametri della
// query; i link verso l'elenco operativo si controllano col grant di arrivo (TX-0056) e senza.
import type { ReactElement } from 'react';
import { describe, expect, it } from 'vitest';
import { render, renderHook, screen, waitFor, within } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { createMemoryRouter, RouterProvider, useParams } from 'react-router';
import { server } from '../src/shared/api/mock/server';
import { expectNoA11yViolations } from '../src/shared/testing/axe';
import { graficoDi, tabellaDi, trovaCard } from '../src/shared/testing/card-grafico';
import { clicSulCodice } from '../src/shared/testing/grafico-finto';
import { renderPagina } from '../src/shared/testing/render-pagina';
import { DettaglioIntervento, DomandeAmmesse, Panoramica, Riepilogo, Sottofasi, StatiPagamento, StatiSostegno, UnitAmount } from '../src/features/procedurale';
import { ammessePer, sottofasiSostegnoPer, statiPer } from '../src/features/procedurale/testing/fixture';
import { lettureProcedurale } from '../src/features/procedurale/testing/letture';
import type { Basi } from '../src/features/procedurale/testing/letture';
import { apreLaVoce, indirizzoElenco, puntoDelloStato, testiLinkStato } from '../src/features/procedurale/lib/collegamenti';
import { vociDegliStati } from '../src/features/procedurale/lib/stati';
import { TabellaVoci } from '../src/features/procedurale/ui/comuni';
import { useLettureColGrant } from '../src/features/procedurale/ui/navigazione';
import { TabellaStatiInterventi } from '../src/features/procedurale/ui/TabellaStatiInterventi';
import { clientDiTest } from '../src/shared/testing/render';

const testo = (s: string | null | undefined) => (s ?? '').replace(/\s/g, ' ');
const intestazioni = (t: HTMLElement) => within(t).getAllByRole('columnheader').map((c) => c.textContent?.replace(/[▲▼↕]/g, '').trim());

/** I grant di lettura del procedurale (TX-0024..TX-0032). */
const PROCEDURALE = ['24', '25', '26', '27', '28', '29', '30', '31', '32'].map((n) => `csr.tx-00${n}.read`);

const profilo = (roles: string[]) =>
  server.use(http.get('*/auth/status', () => HttpResponse.json({ authenticated: true, user: { username: 'U', profile: 'p3-funzionario-area-pro', roles } })));

/** Le letture del procedurale come il backend, registrate per i controlli sui parametri. */
function servi(basi?: Basi) {
  const { handlers, lette } = lettureProcedurale(basi);
  server.use(...handlers);
  return lette;
}

const dove = (router: { state: { location: { pathname: string; search: string } } }) => `${router.state.location.pathname}${router.state.location.search}`;

function PaginaDettaglio() {
  const { codice } = useParams();
  return <DettaglioIntervento codice={codice} />;
}

function apriDettaglio(indirizzo: string) {
  return renderPagina(PaginaDettaglio, '/procedurale/interventi/:codice', indirizzo);
}

function inRouter(ui: ReactElement) {
  const router = createMemoryRouter([{ path: '*', element: ui }], { initialEntries: ['/'] });
  return { ...render(<RouterProvider router={router} />), router };
}

const apriFiltri = async () => userEvent.click(within(screen.getByRole('region', { name: 'Filtri attivi' })).getByRole('button', { name: /^Filtri/ }));

describe('PaginaProcedurale e PannelloFiltriProcedurale (impaginazione e filtri delle pagine)', () => {
  it('barra coi chip dell indirizzo, pill del perimetro e Dati al, percorso, un solo h1 col focus; nessuna violazione axe', async () => {
    servi();
    const { container } = renderPagina(Panoramica, '/procedurale', '/procedurale?intervento=SRD01&stato=AMMESSA');
    await trovaCard('Domande di sostegno per stato');
    const barra = screen.getByRole('region', { name: 'Filtri attivi' });
    expect(within(barra).getByRole('button', { name: 'Togli il filtro Intervento SRD01' })).toBeTruthy();
    expect(await within(barra).findByRole('button', { name: 'Togli il filtro Stato area programmazione Ammessa' })).toBeTruthy();
    expect(within(barra).getByText('Perimetro: regionale')).toBeTruthy();
    expect(within(barra).getByRole('button', { name: /^Ultimo dato sincronizzato: dati al 02\/03\/2026/ })).toBeTruthy();
    const percorso = screen.getByRole('navigation', { name: 'Percorso' });
    expect(within(percorso).getByRole('link', { name: 'Home' })).toBeTruthy();
    expect(within(percorso).queryByRole('link', { name: 'Procedurale' })).toBeNull();
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(document.activeElement).toBe(screen.getByRole('heading', { level: 1, name: 'Procedurale: panoramica' }));
    expect(document.title).toBe('Panoramica - Procedurale - Cruscotto CSR 2023-2027');
    await expectNoA11yViolations(container);
  });

  it('il pannello: voci di TX-0024 senza azione portante, il gruppo dello stato di TX-0025; Applica porta la scelta nell indirizzo', async () => {
    servi();
    const { router } = renderPagina(Panoramica, '/procedurale');
    await trovaCard('Domande di sostegno per stato');
    await apriFiltri();
    const pannello = await screen.findByRole('dialog', { name: 'Filtri dei report procedurali' });
    expect(within(pannello).queryByText(/azione portante/i)).toBeNull();
    expect(within(pannello).getByRole('checkbox', { name: 'Revocata (stato osservato fuori catalogo)' })).toBeTruthy();
    expect(within(pannello).getByRole('checkbox', { name: 'Senza stato area programmazione (nessuna determina aperta)' })).toBeTruthy();
    await expectNoA11yViolations(pannello);
    await userEvent.click(within(pannello).getByRole('checkbox', { name: 'SRD01 Investimenti produttivi agricoli per la competitività' }));
    await userEvent.click(within(pannello).getByRole('checkbox', { name: 'Ammessa' }));
    await userEvent.click(within(pannello).getByRole('button', { name: 'Applica i filtri' }));
    await waitFor(() => expect(dove(router)).toBe('/procedurale?intervento=SRD01&stato=AMMESSA'));
  });

  it('Unit Amount: la pill dello stato non applicato, nessun gruppo dello stato; Azzera lascia lo stato nell indirizzo', async () => {
    const lette = servi();
    const { router } = renderPagina(UnitAmount, '/procedurale/unit-amount', '/procedurale/unit-amount?intervento=SRD01&stato=AMMESSA');
    await screen.findByRole('table', { name: /^Unit Amount degli interventi selezionati/ });
    const barra = screen.getByRole('region', { name: 'Filtri attivi' });
    expect(within(barra).getByText('Il filtro per stato area programmazione non si applica alle Unit Amount')).toBeTruthy();
    expect(within(barra).getByText('Perimetro: regionale (dati di programma, uguali per ogni profilo)')).toBeTruthy();
    expect(within(barra).queryByRole('button', { name: /^Togli il filtro Stato area programmazione/ })).toBeNull();
    expect(lette.unitAmount).toEqual(['?intervento=SRD01']);
    expect(lette.statiArea).toBe(0);
    await apriFiltri();
    const pannello = await screen.findByRole('dialog', { name: 'Filtri dei report procedurali' });
    expect(within(pannello).queryByRole('checkbox', { name: 'Ammessa' })).toBeNull();
    await userEvent.click(within(pannello).getByRole('button', { name: 'Azzera' }));
    await userEvent.click(within(pannello).getByRole('button', { name: 'Applica i filtri' }));
    await waitFor(() => expect(dove(router)).toBe('/procedurale/unit-amount?stato=AMMESSA'));
  });

  it('TX-0024 e TX-0025 in errore: lo stato dei valori non disponibili con Riprova, le voci dalla risposta e dall indirizzo', async () => {
    servi({ valori: null, statiArea: null });
    renderPagina(Panoramica, '/procedurale', '/procedurale?stato=AMMESSA');
    const stato = await screen.findByText(/^Valori dei filtri non disponibili: /);
    expect(within(stato.closest('[role="status"]') as HTMLElement).getByRole('button', { name: 'Riprova' })).toBeTruthy();
    const barra = screen.getByRole('region', { name: 'Filtri attivi' });
    expect(within(barra).getByText('Ultimo dato sincronizzato: non disponibile')).toBeTruthy();
    expect(within(barra).getByRole('button', { name: 'Togli il filtro Stato area programmazione AMMESSA' })).toBeTruthy();
    await trovaCard('Domande di sostegno per stato');
    await apriFiltri();
    const pannello = await screen.findByRole('dialog', { name: 'Filtri dei report procedurali' });
    expect(within(pannello).getByRole('checkbox', { name: 'SRD01' })).toBeTruthy();
    expect(within(pannello).getByText("Valori dello stato area programmazione non disponibili: restano le voci dell'indirizzo.")).toBeTruthy();
    expect((within(pannello).getByRole('checkbox', { name: 'AMMESSA' }) as HTMLInputElement).checked).toBe(true);
  });
});

describe('TessereKpi, TabellaVoci e le card delle distribuzioni (CardStati, CardArea) nella panoramica', () => {
  it('quattro KPI dal totale di TX-0026 col link delle ammesse; nessun link con la fonte dell atto non attiva', async () => {
    servi();
    renderPagina(Panoramica, '/procedurale', '/procedurale?intervento=SRD01');
    const ammesse = await screen.findByRole('region', { name: 'Domande ammesse' });
    expect(testo(ammesse.textContent)).toContain('2');
    expect(within(ammesse).getByRole('link', { name: "Apri nell'elenco operativo le domande ammesse" }).getAttribute('href')).toBe('/elenco-operativo/domande?voceProgrammazione=AMMESSA&intervento=SRD01');
    const atto = screen.getByRole('region', { name: 'Domande con atto di concessione' });
    expect(testo(atto.textContent)).toContain('Non disponibile: fonte atto di concessione non attiva');
    expect(within(atto).queryByRole('link')).toBeNull();
    expect(testo(screen.getByRole('region', { name: 'Contributo ammesso' }).textContent)).toContain('su importo richiesto 1500,00 €: 53,3 %');
    expect(testo(screen.getByRole('region', { name: 'Interventi attivati' }).textContent)).toContain('1 su 1');
  });

  it('senza il grant dell elenco: nessun link nei KPI e la tabella equivalente generata (senza la colonna Elenco operativo)', async () => {
    profilo(PROCEDURALE);
    servi();
    renderPagina(Panoramica, '/procedurale');
    const ammesse = await screen.findByRole('region', { name: 'Domande ammesse' });
    expect(within(ammesse).queryByRole('link')).toBeNull();
    const tabella = await tabellaDi(await trovaCard('Domande per stato area programmazione'));
    expect(intestazioni(tabella)).not.toContain('Elenco operativo');
    expect(within(tabella).queryByRole('link')).toBeNull();
  });

  it('stati: il clic su una barra e il link della card aprono la pagina degli stati coi filtri; nessuna violazione axe', async () => {
    servi();
    const { router, container } = renderPagina(Panoramica, '/procedurale', '/procedurale?intervento=SRD01');
    const card = await trovaCard('Domande di sostegno per stato');
    expect(within(card).getByRole('link', { name: 'Apri gli stati delle domande di sostegno' }).getAttribute('href')).toBe('/procedurale/stati-sostegno?intervento=SRD01');
    expect(within(card).getAllByRole('button', { name: /^Scarica / }).map((b) => b.getAttribute('aria-label'))).toEqual([
      'Scarica il grafico Domande di sostegno per stato in PNG',
      'Scarica i dati degli stati delle domande di sostegno in CSV',
      'Scarica i dati degli stati delle domande di sostegno in XLSX',
    ]);
    await expectNoA11yViolations(container);
    clicSulCodice(graficoDi(card), 'RILASCIATO');
    await waitFor(() => expect(dove(router)).toBe('/procedurale/stati-sostegno?intervento=SRD01'));
  });

  it('area programmazione: il clic su una barra filtra la pagina per lo stato; la tabella equivalente apre l elenco per voce', async () => {
    servi();
    const { router } = renderPagina(Panoramica, '/procedurale');
    const card = await trovaCard('Domande per stato area programmazione');
    const tabella = await tabellaDi(card);
    expect(intestazioni(tabella)).toEqual(['Stato area programmazione', 'Domande', 'Elenco operativo']);
    expect(within(tabella).getByRole('link', { name: "Apri nell'elenco operativo le 3 domande con stato area programmazione Ammessa" }).getAttribute('href')).toBe('/elenco-operativo/domande?voceProgrammazione=AMMESSA');
    expect(within(tabella).getByRole('link', { name: "Apri nell'elenco operativo le 3 domande senza stato area programmazione" }).getAttribute('href')).toBe('/elenco-operativo/domande?voceProgrammazione=SENZA_STATO');
    expect(testo(within(tabella).getByRole('row', { name: /^Presentata/ }).textContent)).toContain('nessuna domanda');
    await userEvent.click(within(card).getByRole('button', { name: 'Grafico' }));
    clicSulCodice(graficoDi(card), 'AMMESSA');
    await waitFor(() => expect(dove(router)).toBe('/procedurale?stato=AMMESSA'));
  });

  it('TabellaVoci: la voce senza fonte col motivo (mai 0), il perche senza link, la parte rilasciata nel link, il totale del backend', () => {
    const totale = statiPer('SOSTEGNO', new URLSearchParams('intervento=SRD01'), { nonRilasciate: true }).totale;
    const senzaFonte = statiPer('SOSTEGNO', new URLSearchParams('intervento=SRD01')).totale;
    const link = (v: Parameters<typeof apreLaVoce>[0]) => ({ indirizzo: apreLaVoce(v) ? indirizzoElenco('elenco-stato-sostegno', {}, puntoDelloStato('SOSTEGNO', v.chiave)) : null, testi: testiLinkStato(v, 'SOSTEGNO') });
    const { container } = inRouter(
      <>
        <TabellaVoci caption="Con le non rilasciate" intestazione="Stato" voci={vociDegliStati(totale)} conNonRilasciate link={link} totale={{ domande: 99, nonRilasciate: 5 }} />
        <TabellaVoci caption="Senza fonte" intestazione="Stato" voci={vociDegliStati(senzaFonte)} conNonRilasciate link={link} />
      </>,
    );
    const con = screen.getByRole('table', { name: 'Con le non rilasciate' });
    expect(testo(within(con).getByRole('row', { name: /^In compilazione/ }).textContent)).toBe('In compilazione22nessuna domanda rilasciata');
    const stampato = within(con).getByRole('row', { name: /^Stampato/ });
    expect(within(stampato).getByRole('link', { name: "Apri nell'elenco (1 rilasciata): apri nell'elenco operativo la domanda di sostegno rilasciata nello stato Stampato" }).getAttribute('href')).toBe('/elenco-operativo/domande?statoSostegno=STAMPATO');
    expect(testo(within(con).getByRole('row', { name: /^Firmata/ }).textContent)).toBe('Firmata00nessuna domanda');
    expect(testo(within(con).getByRole('row', { name: /^Totale/ }).textContent)).toBe('Totale995');
    const senza = screen.getByRole('table', { name: 'Senza fonte' });
    expect(testo(within(senza).getByRole('row', { name: /^In compilazione/ }).textContent)).toBe('In compilazionenon disponibilefonte domande in compilazione non attivanon disponibilenessun link (fonte non attiva)');
    return expectNoA11yViolations(container);
  });
});

describe('StatiSostegno, StatiPagamento, TabellaStatiInterventi e AnteprimaStati (pagine degli stati)', () => {
  it('TabellaStatiInterventi: una riga senza la distribuzione dice "non disponibile", mai "-" (una sola cella numerica)', () => {
    render(<TabellaStatiInterventi titolo="Prova" righe={[{ codiceIntervento: 'SRD01' }]} totale={statiPer('SOSTEGNO', new URLSearchParams()).totale} valori={undefined} scaricamenti={[]} onRiga={() => undefined} />);
    const celle = Array.from(screen.getByRole('row', { name: "Apri l'anteprima dell'intervento SRD01" }).children).map((c) => c.textContent);
    // totale e di cui non rilasciate come le voci: la regola == null di NumeroONonDisponibile, come nel riepilogo
    expect(celle.slice(1, 4)).toEqual(['non disponibile', 'non disponibile', 'non disponibile']);
    expect(celle).not.toContain('-');
  });

  it('KPI, card, tabella per intervento con le voci di SR-01 e il totale del backend nel piede; nessuna violazione axe', async () => {
    const corpo = statiPer('SOSTEGNO', new URLSearchParams());
    // l'handler aggiunto dopo prevale su quello delle letture di prova
    servi();
    server.use(http.get('*/api/procedurale/stati-sostegno', () => HttpResponse.json({ ...corpo, totale: { ...corpo.totale, totale: 99 } })));
    const { container } = renderPagina(StatiSostegno, '/procedurale/stati-sostegno');
    const tabella = await screen.findByRole('table', { name: /^Domande di sostegno per intervento e stato/ });
    expect(testo(screen.getByRole('region', { name: 'Domande di sostegno' }).textContent)).toContain('99');
    expect(intestazioni(tabella)).toEqual([
      'Intervento',
      'Totale',
      'Di cui non rilasciate',
      'In compilazione',
      'Stampato',
      'Firmata',
      'Rilasciato',
      'In istruttoria',
      'Preso in carico',
      'Non ricevibile',
      'Ammissibile al finanziamento',
      'Non ammissibile al finanziamento',
      'Ricevibile',
      'Esito positivo su tutte le misure',
      'Altri stati',
    ]);
    expect(within(tabella).getByRole('button', { name: 'In istruttoria presso ente competente' })).toBeTruthy();
    const srd01 = within(tabella).getByRole('row', { name: "Apri l'anteprima dell'intervento SRD01" });
    expect(testo(srd01.textContent)).toBe('SRD01 - Investimenti produttivi agricoli per la competitività30non disponibile0020000001nessuno');
    expect(testo(within(tabella).getByRole('row', { name: /^Totale \(dal backend/ }).textContent)).toBe('Totale (dal backend, tutti gli interventi dei filtri)990non disponibile0020000001SOSPESA 1');
    expect(within(screen.getByRole('region', { name: 'Domande di sostegno per intervento e stato' })).getAllByRole('button', { name: /^Scarica / }).map((b) => b.textContent)).toEqual(['CSV', 'XLSX']);
    await expectNoA11yViolations(container);
  });

  it('il clic su una barra filtra la tabella sulla voce, col chip e Apri nell elenco; togliendo il chip il focus va sull h1', async () => {
    servi();
    renderPagina(StatiSostegno, '/procedurale/stati-sostegno');
    const card = await trovaCard('Domande di sostegno per stato');
    clicSulCodice(graficoDi(card), 'RILASCIATO');
    const filtro = await screen.findByRole('group', { name: 'Filtro della tabella dal grafico' });
    expect(within(filtro).getByRole('link', { name: "Apri nell'elenco operativo le 2 domande di sostegno nello stato Rilasciato" }).getAttribute('href')).toBe('/elenco-operativo/domande?statoSostegno=RILASCIATO');
    const tabella = screen.getByRole('table', { name: /^Domande di sostegno per intervento e stato/ });
    expect(within(tabella).getAllByRole('row', { name: /^Apri l'anteprima/ }).map((r) => r.getAttribute('aria-label'))).toEqual(["Apri l'anteprima dell'intervento SRD01"]);
    await userEvent.click(within(filtro).getByRole('button', { name: 'Togli il filtro Voce Rilasciato' }));
    expect(screen.queryByRole('group', { name: 'Filtro della tabella dal grafico' })).toBeNull();
    expect(within(tabella).getAllByRole('row', { name: /^Apri l'anteprima/ })).toHaveLength(3);
    await waitFor(() => expect(document.activeElement).toBe(screen.getByRole('heading', { level: 1 })));
  });

  it('con domande non rilasciate: il KPI, la voce che apre la sola parte rilasciata, la nota del filtro per stato', async () => {
    servi({ varianti: { nonRilasciate: true } });
    renderPagina(StatiSostegno, '/procedurale/stati-sostegno', '/procedurale/stati-sostegno?stato=SENZA_STATO');
    const kpi = await screen.findByRole('region', { name: 'Di cui non rilasciate' });
    expect(testo(kpi.textContent)).toContain('5');
    expect(testo(kpi.textContent)).toContain('contano solo se il filtro chiede le domande senza stato');
    clicSulCodice(graficoDi(await trovaCard('Domande di sostegno per stato')), 'STAMPATO');
    const filtro = await screen.findByRole('group', { name: 'Filtro della tabella dal grafico' });
    const link = within(filtro).getByRole('link', { name: /^Apri nell'elenco \(1 rilasciata\): / });
    expect(link.textContent).toBe("Apri nell'elenco (1 rilasciata)");
    expect(link.getAttribute('href')).toBe('/elenco-operativo/domande?statoSostegno=STAMPATO&voceProgrammazione=SENZA_STATO');
  });

  it('AnteprimaStati: le voci con domande e il loro link, il mini grafico senza scaricamenti, il dettaglio; Esc chiude', async () => {
    servi();
    renderPagina(StatiSostegno, '/procedurale/stati-sostegno', '/procedurale/stati-sostegno?stato=AMMESSA');
    const riga = await screen.findByRole('row', { name: "Apri l'anteprima dell'intervento SRD01" });
    await userEvent.click(riga);
    const drawer = await screen.findByRole('dialog', { name: 'Anteprima: SRD01' });
    expect(testo(drawer.textContent)).toContain('Domande di sostegno2, di cui non rilasciate 0');
    expect(within(drawer).getByRole('link', { name: "Apri nell'elenco operativo la domanda di sostegno di SRD01 nello stato Rilasciato" }).getAttribute('href')).toBe('/elenco-operativo/domande?statoSostegno=RILASCIATO&voceProgrammazione=AMMESSA&intervento=SRD01');
    expect(testo(drawer.textContent)).toContain('In compilazionenon disponibile');
    const mini = await trovaCard('Domande di sostegno di SRD01 per stato');
    expect(within(mini).queryByRole('group', { name: /^Scarica/ })).toBeNull();
    expect(within(drawer).getByRole('link', { name: "Apri il dettaglio dell'intervento" }).getAttribute('href')).toBe('/procedurale/interventi/SRD01?stato=AMMESSA');
    await expectNoA11yViolations(drawer);
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Anteprima: SRD01' })).toBeNull());
    await waitFor(() => expect(document.activeElement).toBe(screen.getByRole('row', { name: "Apri l'anteprima dell'intervento SRD01" })));
  });

  it('StatiPagamento: le cinque voci CSR-DP, la nota sulle domande SIGC, gli altri stati per codice; l anteprima senza mini grafico', async () => {
    servi();
    const { container } = renderPagina(StatiPagamento, '/procedurale/stati-pagamento');
    const tabella = await screen.findByRole('table', { name: /^Domande di pagamento per intervento e stato/ });
    expect(screen.getByText(/^Le domande SIGC \(ASR2-08, ASR2-20\)/)).toBeTruthy();
    expect(intestazioni(tabella)).toEqual(['Intervento', 'Totale', 'Di cui non rilasciate', 'In compilazione', 'Rilasciato', 'Da revisionare', 'Autorizzazione ente', 'Finanziato', 'Altri stati']);
    expect(testo(within(tabella).getByRole('row', { name: "Apri l'anteprima dell'intervento SRD01" }).textContent)).toContain('PROPOSTO AL PAGAMENTO-ESTRAZ. CAMPIONE-DA ESEGUIRE 1');
    await expectNoA11yViolations(container);
    await userEvent.click(within(tabella).getByRole('row', { name: "Apri l'anteprima dell'intervento SRD01" }));
    const drawer = await screen.findByRole('dialog', { name: 'Anteprima: SRD01' });
    expect(within(drawer).getByRole('link', { name: "Apri nell'elenco operativo la domanda di pagamento di SRD01 nello stato PROPOSTO AL PAGAMENTO-ESTRAZ. CAMPIONE-DA ESEGUIRE" }).getAttribute('href')).toBe(
      '/elenco-operativo/domande?statoPagamento=PROPOSTO+AL+PAGAMENTO-ESTRAZ.+CAMPIONE-DA+ESEGUIRE&intervento=SRD01',
    );
    expect(within(drawer).queryByRole('region', { name: /per stato$/ })).toBeNull();
  });
});

describe('DomandeAmmesse, CardAmmesse, TabellaAmmesse e AnteprimaAmmesse (domande ammesse)', () => {
  it('KPI, nota, due card, tabella col totale del backend; i link delle ammesse per riga; nessuna violazione axe', async () => {
    const corpo = ammessePer(new URLSearchParams());
    // l'handler aggiunto dopo prevale su quello delle letture di prova
    servi();
    server.use(http.get('*/api/procedurale/domande-ammesse', () => HttpResponse.json({ ...corpo, totale: { ...corpo.totale, domandeAmmesse: 42 } })));
    const { container } = renderPagina(DomandeAmmesse, '/procedurale/ammesse');
    const tabella = await screen.findByRole('table', { name: /^Domande ammesse per intervento/ });
    expect(screen.getByText(/^Domanda ammessa = domanda corrente di qualunque tipo/)).toBeTruthy();
    expect(intestazioni(tabella)).toEqual(['Intervento', 'Perimetro', 'Attivato', 'Domande ammesse', 'Con atto di concessione', 'Importo richiesto', 'Contributo ammesso']);
    const srd01 = within(tabella).getByRole('row', { name: "Apri l'anteprima dell'intervento SRD01" });
    expect(within(srd01).getByRole('link', { name: "Apri nell'elenco operativo le 2 domande ammesse di SRD01" }).getAttribute('href')).toBe('/elenco-operativo/domande?voceProgrammazione=AMMESSA&intervento=SRD01');
    expect(testo(srd01.textContent)).toContain('non disponibilefonte atto di concessione non attiva');
    const srd02 = within(tabella).getByRole('row', { name: "Apri l'anteprima dell'intervento SRD02" });
    expect(within(srd02).queryByRole('link')).toBeNull();
    expect(testo(within(tabella).getByRole('row', { name: /^Totale/ }).textContent)).toMatch(/^Totale \(3 interventi del perimetro ufficiale, 2 attivati\)42/);
    expect(testo(screen.getByRole('region', { name: 'Domande ammesse' }).textContent)).toContain('42');
    const conAtto = await trovaCard('Domande ammesse e con atto di concessione per intervento');
    expect(testo(conAtto.textContent)).toContain('Domande con atto di concessione: non disponibile (fonte atto di concessione non attiva) per tutti gli interventi');
    await expectNoA11yViolations(container);
  });

  it('con l atto di concessione nel database: i link delle domande con atto (KPI e riga), con la sola parte di sostegno', async () => {
    servi({ varianti: { atto: true } });
    renderPagina(DomandeAmmesse, '/procedurale/ammesse');
    const kpi = await screen.findByRole('region', { name: 'Domande con atto di concessione' });
    expect(within(kpi).getByRole('link', { name: "Apri nell'elenco operativo le domande di sostegno con atto di concessione" }).getAttribute('href')).toBe('/elenco-operativo/domande?concessione=true&tipo=SOSTEGNO');
    const srd01 = screen.getByRole('row', { name: "Apri l'anteprima dell'intervento SRD01" });
    expect(within(srd01).getByRole('link', { name: "Apri nell'elenco operativo la domanda di sostegno con atto di concessione di SRD01" }).getAttribute('href')).toBe('/elenco-operativo/domande?concessione=true&tipo=SOSTEGNO&intervento=SRD01');
    const tabella = await tabellaDi(await trovaCard('Domande ammesse e con atto di concessione per intervento'));
    expect(within(tabella).getByRole('link', { name: "Apri nell'elenco operativo la domanda di sostegno con atto di concessione di SRD01" })).toBeTruthy();
  });

  it('il clic su una barra degli importi apre il dettaglio con lo stato della pagina; l anteprima della riga', async () => {
    servi();
    const { router } = renderPagina(DomandeAmmesse, '/procedurale/ammesse', '/procedurale/ammesse?stato=AMMESSA');
    await userEvent.click(await screen.findByRole('row', { name: "Apri l'anteprima dell'intervento SRA01" }));
    const drawer = await screen.findByRole('dialog', { name: 'Anteprima: SRA01' });
    expect(within(drawer).getByRole('link', { name: "Apri nell'elenco operativo la domanda ammessa di SRA01" }).getAttribute('href')).toBe('/elenco-operativo/domande?voceProgrammazione=AMMESSA&intervento=SRA01');
    expect(testo(drawer.textContent)).toContain('Importo richiestonon valorizzatoil dato non è presente nella fonte');
    expect(within(drawer).getByRole('link', { name: "Apri il dettaglio dell'intervento" }).getAttribute('href')).toBe('/procedurale/interventi/SRA01?stato=AMMESSA');
    await expectNoA11yViolations(drawer);
    await userEvent.click(within(drawer).getByRole('button', { name: 'Chiudi: Anteprima: SRA01' }));
    clicSulCodice(graficoDi(await trovaCard('Importo richiesto e contributo ammesso per intervento')), 'SRD01');
    await waitFor(() => expect(dove(router)).toBe('/procedurale/interventi/SRD01?stato=AMMESSA'));
  });
});

describe('Sottofasi e CardSottofasi (sottofasi di ammissibilita)', () => {
  it('sostegno senza la fonte: il grafico non disponibile in testo e la tabella; pagamento: voce censita e altre sottofasi', async () => {
    const lette = servi();
    const { container } = renderPagina(Sottofasi, '/procedurale/sottofasi', '/procedurale/sottofasi?intervento=SRD01&stato=SENZA_STATO');
    const sostegno = await trovaCard('Domande di sostegno per sottofase di ammissibilità');
    expect(testo(sostegno.textContent)).toContain('Grafico non disponibile: nessuna domanda di sostegno è legata a una sottofase (fonte sottofasi della domanda non attiva).');
    expect(within(sostegno).getAllByRole('button', { name: /^Scarica / }).map((b) => b.textContent)).toEqual(['CSV', 'XLSX']);
    const pagamento = await trovaCard('Domande di pagamento per sottofase di ammissibilità');
    await userEvent.click(within(pagamento).getByRole('button', { name: 'Tabella' }));
    const voci = within(pagamento).getByRole('table', { name: /^Domande di pagamento per sottofase di ammissibilità: / });
    expect(intestazioni(voci)).toEqual(['Sottofase (SR-01)', "Censita nell'anagrafica", 'Esito', 'Domande della voce', 'Domande della sottofase censita']);
    expect(testo(within(voci).getByRole('row', { name: /^Antimafia/ }).textContent)).toBe('AntimafiaANTIMAFIA - Verifica antimafiaOK21');
    expect(testo(within(voci).getByRole('row', { name: /^Criteri di selezione/ }).textContent)).toBe('Criteri di selezionenon censitanon censitanon valorizzatoil dato non è presente nella fontenon censita');
    const altre = within(pagamento).getByRole('table', { name: /^Altre sottofasi dell'anagrafica/ });
    expect(within(altre).getAllByRole('row').slice(1).map((r) => r.firstElementChild?.textContent)).toEqual(['DURC', 'GAR', 'GAR2']);
    expect(lette.sottofasiSostegno).toEqual(['?intervento=SRD01&stato=SENZA_STATO']);
    expect(lette.sottofasiPagamento).toEqual(['?intervento=SRD01&stato=SENZA_STATO']);
    await expectNoA11yViolations(container);
  });

  it('nessuna domanda nei filtri: le voci restano con 0 e Modifica i filtri apre il pannello; anagrafica vuota: lo stato, nessun errore', async () => {
    const vuota = sottofasiSostegnoPer();
    // l'handler aggiunto dopo prevale su quello delle letture di prova
    servi();
    server.use(http.get('*/api/procedurale/sottofasi-sostegno', () => HttpResponse.json({ ...vuota, voci: vuota.voci?.map((v) => ({ ...v, censita: null })) })));
    renderPagina(Sottofasi, '/procedurale/sottofasi', '/procedurale/sottofasi?intervento=SRA01');
    expect(await screen.findByText(/^Anagrafica delle sottofasi vuota: tutte le voci risultano non censite/)).toBeTruthy();
    const stato = await screen.findByText('Nessuna domanda nelle sottofasi per i filtri scelti: le voci restano con 0.');
    await userEvent.click(within(stato.closest('[role="status"]') as HTMLElement).getByRole('button', { name: 'Modifica i filtri' }));
    expect(await screen.findByRole('dialog', { name: 'Filtri dei report procedurali' })).toBeTruthy();
    expect(screen.queryByRole('alert')).toBeNull();
  });
});

describe('UnitAmount, TabellaUnitAmount e l anteprima della Unit Amount', () => {
  it('la nota unica del pagato, le nove colonne in ordine di intervento, esercizio e codice; nessuna violazione axe', async () => {
    servi();
    const { container } = renderPagina(UnitAmount, '/procedurale/unit-amount');
    const tabella = await screen.findByRole('table', { name: /^Unit Amount degli interventi selezionati/ });
    expect(screen.getByText(/^Importo pagato, percentuale pagata sul richiesto e base storica: non disponibili per tutte le Unit Amount \(fonte pagato per Unit Amount non attiva\)/)).toBeTruthy();
    expect(intestazioni(tabella)).toEqual(['Intervento', 'Unit Amount', 'Gruppo colturale', 'Esercizio', 'Importo unitario', 'Output previsto', 'Importo pagato', 'Pagato sul richiesto', 'Base storica']);
    expect(within(tabella).getAllByRole('rowheader').map((c) => c.textContent)).toEqual(['UA1', 'UA2', 'UA1']);
    const ua2 = within(tabella).getByRole('row', { name: "Apri l'anteprima della Unit Amount UA2 di SRD01, esercizio 2024" });
    expect(testo(ua2.textContent)).toBe('SRD01UA2Ortive2024non valorizzatoil dato non è presente nella fonte5non disponibilenon disponibilenon disponibile');
    const card = await trovaCard('Percentuale pagata per Unit Amount');
    expect(testo(card.textContent)).toContain('Grafico non disponibile: nessuna Unit Amount ha ancora l\'importo pagato (fonte pagato per Unit Amount non attiva).');
    await expectNoA11yViolations(container);
  });

  it('col pagato: il clic su una barra apre l anteprima della riga; il dettaglio dell intervento senza lo stato', async () => {
    servi({ pagato: true });
    renderPagina(UnitAmount, '/procedurale/unit-amount', '/procedurale/unit-amount?stato=AMMESSA');
    clicSulCodice(graficoDi(await trovaCard('Percentuale pagata per Unit Amount')), 'SRD01|UA1|2024');
    const drawer = await screen.findByRole('dialog', { name: 'Anteprima: UA1 (SRD01, esercizio 2024)' });
    expect(testo(drawer.textContent)).toContain('Gruppo colturaleSeminativi');
    expect(within(drawer).getByRole('link', { name: "Apri il dettaglio dell'intervento" }).getAttribute('href')).toBe('/procedurale/interventi/SRD01');
    await expectNoA11yViolations(drawer);
  });
});

describe('Riepilogo, TabellaRiepilogo e AnteprimaRiepilogo (riepilogo per intervento)', () => {
  it('vista Grafico di partenza: il clic su una barra apre il dettaglio; vista Tabella a sezioni col totale del backend', async () => {
    servi();
    const { router, container } = renderPagina(Riepilogo, '/procedurale/riepilogo');
    const vista = await screen.findByRole('group', { name: 'Vista del riepilogo' });
    expect(within(vista).getAllByRole('button').map((b) => [b.textContent, b.getAttribute('aria-pressed')])).toEqual([
      ['Grafico', 'true'],
      ['Tabella', 'false'],
    ]);
    await trovaCard('Domande per intervento');
    await expectNoA11yViolations(container);
    await userEvent.click(within(vista).getByRole('button', { name: 'Tabella' }));
    const tabella = screen.getByRole('table', { name: /^Riepilogo per intervento: tutte le misure procedurali/ });
    expect(document.activeElement).toBe(within(vista).getByRole('button', { name: 'Tabella' }));
    expect(within(tabella).getAllByRole('rowheader').map((c) => c.textContent)).toEqual(['SRA01', 'SRD01', 'SRD02', 'Totale (dal backend)']);
    expect(within(tabella).getAllByRole('columnheader', { name: /^(Domande ammesse|Area programmazione|Sostegno|Pagamento)$/ })).toHaveLength(4);
    const srd01 = within(tabella).getByRole('row', { name: "Apri l'anteprima dell'intervento SRD01" });
    expect(within(srd01).getByRole('link', { name: "Apri nell'elenco operativo le 2 domande ammesse di SRD01" }).getAttribute('href')).toBe('/elenco-operativo/domande?voceProgrammazione=AMMESSA&intervento=SRD01');
    expect(testo(within(tabella).getByRole('row', { name: /^Totale \(dal backend\)/ }).textContent)).toContain('Totale (dal backend)3');
    await expectNoA11yViolations(container);
    await userEvent.click(srd01);
    const drawer = await screen.findByRole('dialog', { name: 'Anteprima: SRD01' });
    expect(testo(drawer.textContent)).toContain('Domande di sostegno3, di cui non rilasciate 0');
    expect(testo(drawer.textContent)).toContain('Senza stato area programmazione3');
    await userEvent.click(within(drawer).getByRole('link', { name: "Apri il dettaglio dell'intervento" }));
    await waitFor(() => expect(dove(router)).toBe('/procedurale/interventi/SRD01'));
  });

  it('il clic su una barra del grafico apre il dettaglio dell intervento con lo stato della pagina', async () => {
    servi();
    const { router } = renderPagina(Riepilogo, '/procedurale/riepilogo', '/procedurale/riepilogo?stato=AMMESSA');
    clicSulCodice(graficoDi(await trovaCard('Domande per intervento')), 'SRA01');
    await waitFor(() => expect(dove(router)).toBe('/procedurale/interventi/SRA01?stato=AMMESSA'));
  });
});

describe('useLettureColGrant: le letture di panoramica, sottofasi e dettaglio col loro grant (una forma sola)', () => {
  it('la lettura parte e resta solo col grant della sua transazione; senza, null', async () => {
    profilo(['csr.tx-0026.read']);
    const client = clientDiTest();
    const { result } = renderHook(() => useLettureColGrant(), { wrapper: ({ children }) => <QueryClientProvider client={client}>{children}</QueryClientProvider> });
    await waitFor(() => expect(result.current.puo('ammesse')).toBe(true));
    expect(result.current.puo('riepilogo')).toBe(false);
    const stato = { data: 1 };
    expect([result.current.conGrant('ammesse', stato), result.current.conGrant('riepilogo', stato)]).toEqual([stato, null]);
  });
});

describe('DettaglioIntervento e SchedeIntervento (dettaglio procedurale dell intervento)', () => {
  it('testata con la descrizione di TX-0024, badge, link verso la panoramica, KPI e quattro schede; nessuna violazione axe', async () => {
    const lette = servi();
    const { container } = apriDettaglio('/procedurale/interventi/SRD01');
    expect(await screen.findByRole('heading', { level: 1, name: 'SRD01 - Investimenti produttivi agricoli per la competitività' })).toBeTruthy();
    expect(screen.getByText('Intervento SRD01 - procedurale')).toBeTruthy();
    expect(within(await screen.findByRole('list', { name: 'Dati principali' })).getAllByRole('listitem').map((l) => l.textContent)).toEqual(['Perimetro: SIGC no', 'Attivato: sì']);
    expect(screen.getByRole('link', { name: 'Filtra i report procedurali su questo intervento' }).getAttribute('href')).toBe('/procedurale?intervento=SRD01');
    expect(screen.getByRole('link', { name: 'Torna alla panoramica' }).getAttribute('href')).toBe('/procedurale');
    expect(testo(screen.getByRole('region', { name: 'Domande di sostegno' }).textContent)).toContain('di cui non rilasciate 0; domande di pagamento 3');
    expect(screen.getAllByRole('tab').map((t) => t.textContent)).toEqual(['Stati delle domande', 'Area programmazione', 'Sottofasi', 'Unit Amount']);
    await trovaCard('Domande di sostegno per stato');
    expect(lette.ammesse).toEqual(['?intervento=SRD01']);
    expect(lette.sostegno).toEqual(['?intervento=SRD01']);
    expect(lette.pagamento).toEqual(['?intervento=SRD01']);
    expect(lette.riepilogo).toEqual([]);
    expect(document.title).toBe('Intervento SRD01 - Procedurale - Cruscotto CSR 2023-2027');
    await expectNoA11yViolations(container);
  });

  it('scheda Stati: il clic su una barra apre la parte rilasciata della voce nell elenco; la tabella equivalente ha i link', async () => {
    servi();
    const { router } = apriDettaglio('/procedurale/interventi/SRD01?stato=AMMESSA');
    const card = await trovaCard('Domande di sostegno per stato');
    const tabella = await tabellaDi(card);
    expect(within(tabella).getByRole('link', { name: "Apri nell'elenco operativo la domanda di sostegno di SRD01 nello stato Rilasciato" }).getAttribute('href')).toBe('/elenco-operativo/domande?statoSostegno=RILASCIATO&voceProgrammazione=AMMESSA&intervento=SRD01');
    expect(within(card).getByRole('button', { name: 'Scarica i dati degli stati delle domande di sostegno di SRD01 in CSV' })).toBeTruthy();
    await userEvent.click(within(card).getByRole('button', { name: 'Grafico' }));
    clicSulCodice(graficoDi(card), 'RILASCIATO');
    await waitFor(() => expect(dove(router)).toBe('/elenco-operativo/domande?statoSostegno=RILASCIATO&voceProgrammazione=AMMESSA&intervento=SRD01'));
  });

  it('le schede Area, Sottofasi e Unit Amount leggono quando si aprono; Unit Amount senza lo stato', async () => {
    const lette = servi();
    const { router } = apriDettaglio('/procedurale/interventi/SRD01?stato=SENZA_STATO');
    await userEvent.click(await screen.findByRole('tab', { name: 'Area programmazione' }));
    const area = await trovaCard('Domande per stato area programmazione');
    expect(lette.riepilogo).toEqual(['?intervento=SRD01&stato=SENZA_STATO']);
    await userEvent.click(await screen.findByRole('tab', { name: 'Sottofasi' }));
    await trovaCard('Domande di pagamento per sottofase di ammissibilità');
    expect(lette.sottofasiPagamento).toEqual(['?intervento=SRD01&stato=SENZA_STATO']);
    await userEvent.click(screen.getByRole('tab', { name: 'Unit Amount' }));
    expect(await screen.findByRole('table', { name: /^Unit Amount di SRD01/ })).toBeTruthy();
    expect(lette.unitAmount).toEqual(['?intervento=SRD01']);
    await userEvent.click(screen.getByRole('tab', { name: 'Area programmazione' }));
    clicSulCodice(graficoDi(await trovaCard('Domande per stato area programmazione')), 'SENZA_STATO');
    expect(area).toBeTruthy();
    await waitFor(() => expect(dove(router)).toBe('/elenco-operativo/domande?voceProgrammazione=SENZA_STATO&intervento=SRD01'));
  });

  it('codice non valido nel percorso (anche con /): nessuna lettura, la pagina lo dice', async () => {
    const lette = servi();
    apriDettaglio('/procedurale/interventi/SR%2F01');
    expect(screen.getByRole('heading', { level: 1, name: 'Intervento non valido' })).toBeTruthy();
    expect(screen.getByRole('alert').textContent).toMatch(/^Il codice nell'indirizzo non è un codice di intervento/);
    await new Promise((r) => setTimeout(r, 50));
    expect(lette.ammesse).toEqual([]);
    expect(lette.sostegno).toEqual([]);
    expect(lette.pagamento).toEqual([]);
  });

  it('solo coi grant di TX-0024, TX-0026 e TX-0030: la sola scheda Unit Amount, nessuna lettura degli stati', async () => {
    profilo(['csr.tx-0024.read', 'csr.tx-0026.read', 'csr.tx-0030.read']);
    const lette = servi();
    apriDettaglio('/procedurale/interventi/SRD01');
    await screen.findByRole('region', { name: 'Domande ammesse' });
    expect(screen.getAllByRole('tab').map((t) => t.textContent)).toEqual(['Unit Amount']);
    expect(screen.queryByRole('region', { name: 'Domande di sostegno' })).toBeNull();
    // la panoramica si apre con TX-0026: il link resta
    expect(screen.getByRole('link', { name: 'Torna alla panoramica' })).toBeTruthy();
    expect(lette.sostegno).toEqual([]);
    expect(lette.pagamento).toEqual([]);
  });

  it('nessuna domanda per lo stato scelto: Modifica i filtri apre il pannello del solo stato, con la voce scelta', async () => {
    servi();
    apriDettaglio('/procedurale/interventi/SRD01?stato=DECADENZA_TOTALE');
    const vuoto = await screen.findByText('Nessuna domanda di SRD01 per lo stato area programmazione scelto.');
    await userEvent.click(within(vuoto.closest('[role="status"]') as HTMLElement).getByRole('button', { name: 'Modifica i filtri' }));
    const pannello = await screen.findByRole('dialog', { name: "Filtri del dettaglio dell'intervento" });
    expect((within(pannello).getByRole('checkbox', { name: 'Decadenza totale' }) as HTMLInputElement).checked).toBe(true);
    expect(within(pannello).queryByRole('checkbox', { name: /^SRD01/ })).toBeNull();
    await expectNoA11yViolations(pannello);
  });
});
