// Pagina /istituzionale/output-regionale (green-fe step7): describe taggati coi REQ della route (RF017, RA006), dati dagli
// scenari del backend (fixture dell'istituzionale) con letture che rispondono ai parametri della query, MSW seminato con
// onUnhandledRequest 'error' (ogni lettura e' dichiarata qui), axe-core diretto. ECharts e' il grafico finto del setup.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '../../../shared/api/mock/server';
import { expectNoA11yViolations } from '../../../shared/testing/axe';
import { tabellaDi, trovaCard } from '../../../shared/testing/card-grafico';
import { problema, trattenuta } from '../../../shared/testing/msw';
import { renderPagina } from '../../../shared/testing/render-pagina';
import { OUTPUT } from '../../../features/istituzionale/testing/fixture';
import { lettureIstituzionale } from '../../../features/istituzionale/testing/letture';
import Pagina from './page';

const PERCORSO = '/istituzionale/output-regionale';
const TITOLO = 'Istituzionale: output regionale programmato e realizzato';
const testo = (s: string | null | undefined) => (s ?? '').replace(/\s/g, ' ');
const profilo = (roles: string[]) =>
  server.use(http.get('*/auth/status', () => HttpResponse.json({ authenticated: true, user: { username: 'U', profile: 'p3-funzionario-area-ist', roles } })));
const intestazioni = (t: HTMLElement) => within(t).getAllByRole('columnheader').map((c) => c.textContent?.replace(/[▲▼↕]/g, '').trim());

function servi(basi?: Parameters<typeof lettureIstituzionale>[0]) {
  const { handlers, lette } = lettureIstituzionale(basi);
  server.use(...handlers);
  return lette;
}

const apri = (indirizzo = PERCORSO) => renderPagina(Pagina, PERCORSO, indirizzo);
const h1 = () => screen.getByRole('heading', { level: 1, name: TITOLO });
const tabella = (misura = 'programmato') => screen.findByRole('table', { name: new RegExp(`^Output ${misura} per anno`) });

afterEach(() => vi.restoreAllMocks());

describe('RF017: output programmato e realizzato della Regione Lazio per intervento e anno (TX-0017)', () => {
  it('una lettura coi filtri dell indirizzo; una colonna per anno del periodo della risposta; l unita accanto ai valori', async () => {
    const lette = servi();
    apri(`${PERCORSO}?intervento=SRA01&intervento=SRD01`);
    const t = await tabella();
    expect(lette.output).toEqual(['?intervento=SRA01&intervento=SRD01']);
    expect(within(t).getAllByRole('rowheader').map((c) => c.textContent)).toEqual(['SRA01', 'SRD01']);
    expect(intestazioni(t).slice(5)).toEqual(['2023', '2024', '2025', '2026', '2027', '2028', '2029']);
    const sra01 = within(t).getByRole('row', { name: "Apri l'anteprima dell'intervento SRA01" });
    expect(testo(sra01.textContent)).toContain('1500 ettari');
    expect(testo(sra01.textContent)).toContain('500 ettari');
    expect(testo(sra01.textContent)).toContain('non valorizzatoil dato non è presente nella fonte');
    expect(screen.getByText('Periodo: 2023 - 2029')).toBeTruthy();
  });

  it('SC-IS_OUTPUT_ANNI_CONFIGURATI: con il periodo al 2030 la tabella ha otto anni', async () => {
    servi({ output: { ...OUTPUT, annoFine: 2030, righe: OUTPUT.righe.map((r) => ({ ...r, anni: [...r.anni, { anno: 2030, programmato: { valore: null, motivo: 'NON_VALORIZZATO', fonte: null }, realizzatoSigc: { valore: null, motivo: 'NON_VALORIZZATO', fonte: null }, realizzatoNonSigc: { valore: null, motivo: 'NON_VALORIZZATO', fonte: null } }] })) } });
    apri();
    const t = await tabella();
    expect(intestazioni(t).slice(5)).toHaveLength(8);
    expect(intestazioni(t).at(-1)).toBe('2030');
    expect(screen.getByText('Periodo: 2023 - 2030')).toBeTruthy();
  });

  it('un solo h1 col focus e il titolo del documento; nessuna card grafico in pagina; nessuna violazione axe', async () => {
    servi();
    const { container } = apri();
    expect(document.activeElement).toBe(h1());
    expect(document.title).toBe('Output regionale - Istituzionale - Cruscotto CSR 2023-2027');
    await tabella();
    expect(container.querySelector('[data-card-grafico]')).toBeNull();
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    await expectNoA11yViolations(container);
  });

  it('OP-IS-06: l interruttore della misura cambia valori e didascalia, non sposta il focus; FONTE_AMBIGUA detta come non attribuibile', async () => {
    servi();
    apri();
    await tabella();
    const gruppo = screen.getByRole('group', { name: 'Misura mostrata negli anni' });
    const sigc = within(gruppo).getByRole('button', { name: 'Realizzato SIGC' });
    await userEvent.click(sigc);
    expect(sigc.getAttribute('aria-pressed')).toBe('true');
    expect(document.activeElement).toBe(sigc);
    const t = await tabella('realizzato SIGC');
    expect(testo(within(t).getByRole('row', { name: "Apri l'anteprima dell'intervento SRA01" }).textContent)).toContain('400 ettari');
    expect(testo(within(t).getByRole('row', { name: "Apri l'anteprima dell'intervento SRA16" }).textContent)).toContain('non attribuibileriga presente sia nel monitoraggio SIGC sia nel non SIGC');
    await userEvent.click(within(gruppo).getByRole('button', { name: 'Realizzato non SIGC (cumulativo)' }));
    expect(testo(within(await tabella('realizzato non SIGC \\(cumulativo\\)')).getByRole('row', { name: "Apri l'anteprima dell'intervento SRD01" }).textContent)).toContain('12 numero di operazioni');
  });

  it('riga apribile con Invio: il drawer con le voci e il mini grafico; Esc lo chiude e il focus torna alla riga', async () => {
    servi();
    apri();
    const riga = within(await tabella()).getByRole('row', { name: "Apri l'anteprima dell'intervento SRA01" });
    riga.focus();
    await userEvent.keyboard('{Enter}');
    const drawer = await screen.findByRole('dialog', { name: 'Anteprima: SRA01' });
    expect(testo(drawer.textContent)).toContain('Target di fine periodo1500 ettari al 2029');
    const mini = await trovaCard('Output di SRA01 per anno');
    expect(within(await tabellaDi(mini)).getAllByRole('rowheader').map((c) => c.textContent)).toEqual(['2023', '2024', '2025', '2026', '2027', '2028', '2029', 'Target di fine periodo']);
    expect(within(mini).queryByRole('group', { name: /^Scarica/ })).toBeNull();
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Anteprima: SRA01' })).toBeNull());
    await waitFor(() => expect(document.activeElement).toBe(within(screen.getByRole('table', { name: /^Output programmato per anno/ })).getByRole('row', { name: "Apri l'anteprima dell'intervento SRA01" })));
  });

  it('Apri il dettaglio del drawer porta al dettaglio dell intervento (link:dettaglio-intervento-output, senza anno)', async () => {
    servi();
    const { router } = apri(`${PERCORSO}?os=OS5`);
    await userEvent.click(within(await tabella()).getByRole('row', { name: "Apri l'anteprima dell'intervento SRA16" }));
    const drawer = await screen.findByRole('dialog', { name: 'Anteprima: SRA16' });
    await userEvent.click(within(drawer).getByRole('link', { name: 'Apri il dettaglio' }));
    await waitFor(() => expect(`${router.state.location.pathname}${router.state.location.search}`).toBe('/istituzionale/interventi/SRA16'));
  });

  it('CSV e XLSX dal backend coi filtri della pagina e tutte le misure, con X-Requested-With', async () => {
    const lette = servi();
    URL.createObjectURL = vi.fn(() => 'blob:prova');
    URL.revokeObjectURL = vi.fn();
    const clic = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    apri(`${PERCORSO}?intervento=SRA01`);
    await tabella();
    await userEvent.click(within(screen.getByRole('group', { name: 'Misura mostrata negli anni' })).getByRole('button', { name: 'Realizzato SIGC' }));
    await userEvent.click(screen.getByRole('button', { name: "Scarica i dati dell'output regionale in XLSX" }));
    await waitFor(() => expect(clic).toHaveBeenCalledTimes(1));
    expect((clic.mock.contexts.at(-1) as HTMLAnchorElement).download).toBe('output-regionale-tx-0017.xlsx');
    expect(lette.file).toEqual(['/api/istituzionale/output-regionale/xlsx?intervento=SRA01 XMLHttpRequest']);
    expect(screen.getByText(/^I file CSV e XLSX contengono tutti gli interventi dei filtri/)).toBeTruthy();
  });

  it('vuoto: nessun intervento per i filtri, con Modifica i filtri; senza filtri non parla di filtri', async () => {
    servi({ output: { ...OUTPUT, righe: [] } });
    apri(`${PERCORSO}?os=OS4`);
    const vuoto = await screen.findByText("Nessun intervento per i filtri scelti (per esempio un'azione portante senza interventi collegati).");
    expect(vuoto.closest('[role="status"]')).not.toBeNull();
    expect(screen.queryByRole('alert')).toBeNull();
    expect(screen.getByRole('button', { name: 'Modifica i filtri' })).toBeTruthy();
  });

  it('vuoto senza filtri: lo stato non dice "per i filtri scelti"', async () => {
    servi({ output: { ...OUTPUT, righe: [] } });
    apri();
    expect(await screen.findByText('Nessun intervento nei report istituzionali.')).toBeTruthy();
    expect(document.body.textContent).not.toContain('per i filtri scelti');
  });

  it('caricamento con lo scheletro e aria-live, poi i dati', async () => {
    const t = trattenuta();
    servi();
    server.use(
      http.get('*/api/istituzionale/output-regionale', async () => {
        await t.attesa;
        return HttpResponse.json(OUTPUT);
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
      http.get('*/api/istituzionale/output-regionale', () => {
        tentativi += 1;
        return tentativi === 1 ? HttpResponse.json(problema(403, 'ACCESSO_NEGATO'), { status: 403 }) : HttpResponse.json(OUTPUT);
      }),
    );
    apri();
    const avviso = await screen.findByRole('alert');
    expect(screen.getAllByRole('alert')).toHaveLength(1);
    expect(avviso.textContent).not.toContain('403');
    expect(screen.getByText('Ultimo dato sincronizzato: non disponibile')).toBeTruthy();
    await userEvent.click(within(avviso).getByRole('button', { name: 'Riprova' }));
    await tabella();
  });

  it('Applica i filtri cambiati dal pannello aperto dallo stato vuoto: il focus va sul titolo della pagina', async () => {
    const lette = servi({ output: { ...OUTPUT, righe: [] } });
    const { router } = apri(`${PERCORSO}?os=OS4`);
    await userEvent.click(await screen.findByRole('button', { name: 'Modifica i filtri' }));
    const pannello = await screen.findByRole('dialog', { name: 'Filtri dei report istituzionali' });
    await userEvent.click(within(pannello).getByRole('button', { name: 'Azzera' }));
    await userEvent.click(within(pannello).getByRole('button', { name: 'Applica i filtri' }));
    await waitFor(() => expect(router.state.location.search).toBe(''));
    await waitFor(() => expect(lette.output.at(-1)).toBe(''));
    await waitFor(() => expect(document.activeElement).toBe(h1()));
  });
});

describe("RA006: valori dei filtri dell'output regionale da TX-0060 dell'elenco operativo (decisione G2)", () => {
  it('le voci del pannello vengono da TX-0060; i filtri applicati vanno nell indirizzo e nella lettura', async () => {
    const lette = servi();
    const { router } = apri();
    await tabella();
    await userEvent.click(screen.getByRole('button', { name: /^Filtri/ }));
    const pannello = await screen.findByRole('dialog', { name: 'Filtri dei report istituzionali' });
    await userEvent.click(within(pannello).getByRole('checkbox', { name: 'SRD01 Investimenti produttivi agricoli per la competitività' }));
    await userEvent.click(within(pannello).getByRole('button', { name: 'Applica i filtri' }));
    await waitFor(() => expect(router.state.location.search).toBe('?intervento=SRD01'));
    await waitFor(() => expect(lette.output.at(-1)).toBe('?intervento=SRD01'));
    expect(within(await tabella()).getAllByRole('rowheader').map((c) => c.textContent)).toEqual(['SRD01']);
    expect(lette.filtri).toBeGreaterThan(0);
  });

  it('senza il grant csr.tx-0060.read: nessuna lettura di TX-0060; il report si legge', async () => {
    profilo(['csr.tx-0017.read']);
    const lette = servi();
    apri();
    await tabella();
    expect(lette.filtri).toBe(0);
    expect(screen.queryByText(/^Valori dei filtri non disponibili: /)).toBeNull();
  });

  it('TX-0060 in errore: lo stato della pagina col motivo e Riprova, i chip dell indirizzo restano', async () => {
    servi({ valori: null });
    apri(`${PERCORSO}?intervento=SRA01`);
    const stato = (await screen.findByText(/^Valori dei filtri non disponibili: /)).closest('[role="status"]') as HTMLElement;
    expect(within(stato).getByRole('button', { name: 'Riprova' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Togli il filtro Intervento SRA01' })).toBeTruthy();
    expect(within(await tabella()).getAllByRole('rowheader').map((c) => c.textContent)).toEqual(['SRA01']);
  });
});
