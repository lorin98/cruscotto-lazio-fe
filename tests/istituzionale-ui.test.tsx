// Test dei componenti dell'istituzionale (green-fe step5): un test L2 per componente (render su MSW, ruoli e stati
// accessibili) e un test a11y con axe-core diretto. ECharts e' il grafico finto di src/shared/test/setup.ts (jsdom non
// disegna). Le letture sono dichiarate da ogni test (il server dei test non monta i mock generati dell'istituzionale e
// dell'elenco) e rispondono come il backend ai parametri della query (fixture dell'istituzionale).
import { createRef } from 'react';
import type { ReactElement } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { createMemoryRouter, RouterProvider, useParams } from 'react-router';
import { server } from '../src/shared/api/mock/server';
import { expectNoA11yViolations } from '../src/shared/testing/axe';
import { graficoDi, tabellaDi, trovaCard } from '../src/shared/testing/card-grafico';
import { clicSulDato } from '../src/shared/testing/grafico-finto';
import { problema } from '../src/shared/testing/msw';
import { renderPagina } from '../src/shared/testing/render-pagina';
import { renderConQuery } from '../src/shared/testing/render';
import { DettaglioIntervento, OutputRegionale, VerificaSmpNonSigc } from '../src/features/istituzionale';
import { OUTPUT, SRA01_OUTPUT, SRD01, VALORI, VERIFICA, outputPer, verificaPer } from '../src/features/istituzionale/testing/fixture';
import { AnteprimaOutput } from '../src/features/istituzionale/ui/AnteprimaOutput';
import { CellaDato, ValoriNonDisponibili } from '../src/features/istituzionale/ui/comuni';
import { TabellaOutput } from '../src/features/istituzionale/ui/TabellaOutput';
import { TabellaVerifica } from '../src/features/istituzionale/ui/TabellaVerifica';
import { DATI_VERIFICA } from '../src/features/istituzionale/lib/verifica';
import type { StatoQuery } from '../src/shared/ui';
import type { ValoriFiltriElenco } from '../src/features/istituzionale/api';

const testo = (s: string | null | undefined) => (s ?? '').replace(/\s/g, ' ');
const profilo = (roles: string[]) =>
  server.use(http.get('*/auth/status', () => HttpResponse.json({ authenticated: true, user: { username: 'U', profile: 'p3-funzionario-area-ist', roles } })));

/** TX-0016, TX-0017 e TX-0060 come il backend (le righe dei filtri della query); TX-0060 in errore con `valori` null. */
function servi(valori: object | null = VALORI) {
  const lette = { verifica: [] as string[], output: [] as string[], filtri: 0 };
  server.use(
    http.get('*/api/istituzionale/verifica-smp-non-sigc', ({ request }) => {
      const u = new URL(request.url);
      lette.verifica.push(u.search);
      return HttpResponse.json(verificaPer(VERIFICA, u.searchParams));
    }),
    http.get('*/api/istituzionale/output-regionale', ({ request }) => {
      const u = new URL(request.url);
      lette.output.push(u.search);
      return HttpResponse.json(outputPer(OUTPUT, u.searchParams));
    }),
    http.get('*/api/elenco-operativo/filtri', () => {
      lette.filtri += 1;
      return valori ? HttpResponse.json(valori) : HttpResponse.json(problema(503, 'CAPACITA_ESAURITA'), { status: 503 });
    }),
  );
  return lette;
}

function PaginaDettaglio() {
  const { codice } = useParams();
  return <DettaglioIntervento codice={codice} />;
}

function apriDettaglio(indirizzo: string) {
  const router = createMemoryRouter(
    [
      { path: '/istituzionale/interventi/:codice', Component: PaginaDettaglio },
      { path: '*', element: <p>altra pagina</p> },
    ],
    { initialEntries: [indirizzo] },
  );
  return { ...renderConQuery(<RouterProvider router={router} />), router };
}

function inRouter(ui: ReactElement) {
  const router = createMemoryRouter([{ path: '*', element: ui }], { initialEntries: ['/'] });
  return { ...render(<RouterProvider router={router} />), router };
}

describe('VerificaSmpNonSigc (pagina della verifica SMP non SIGC, componente)', () => {
  it('barra con chip e pill, frase verso la verifica SIGC, riferimenti, card a barre, tabella; nessuna violazione axe', async () => {
    servi();
    const { container } = renderPagina(VerificaSmpNonSigc, '/istituzionale/verifica-smp-non-sigc', '/istituzionale/verifica-smp-non-sigc?intervento=SRD01');
    const card = await trovaCard('Spesa pubblica erogata per intervento (anticipi inclusi)');
    const barra = screen.getByRole('region', { name: 'Filtri attivi' });
    expect(within(barra).getByRole('button', { name: 'Togli il filtro Intervento SRD01' })).toBeTruthy();
    expect(within(barra).getByText('Perimetro: regionale (i report istituzionali non hanno perimetro ADA)')).toBeTruthy();
    expect(within(barra).getByText('Anno di riferimento del file SMP non SIGC: 2025')).toBeTruthy();
    expect(within(barra).getByRole('button', { name: /^Ultimo dato sincronizzato: dati al 02\/03\/2026 per tutti i flussi/ })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Verifica SMP SIGC' }).getAttribute('href')).toBe('/finanziario/sigc/verifica-smp');
    const riferimenti = screen.getByRole('table', { name: 'Riferimenti della risposta' });
    expect(testo(riferimenti.textContent)).toContain('2025 (ultimo anno con un file SMP non SIGC presente)');
    expect(within(card).getAllByRole('button', { name: /^Scarica / }).map((b) => b.textContent)).toEqual(['PNG', 'CSV', 'XLSX']);
    expect(within(card).getByRole('button', { name: 'Scarica i dati della verifica SMP non SIGC in CSV' })).toBeTruthy();
    expect(screen.getByRole('table', { name: /^Verifica SMP non SIGC: / })).toBeTruthy();
    await expectNoA11yViolations(container);
  });

  it('il clic su una barra apre il dettaglio dell intervento con l anno scelto (codice codificato)', async () => {
    servi();
    const { router } = renderPagina(VerificaSmpNonSigc, '/istituzionale/verifica-smp-non-sigc', '/istituzionale/verifica-smp-non-sigc?anno=2024');
    const grafico = graficoDi(await trovaCard('Spesa pubblica erogata per intervento (anticipi inclusi)'));
    if (!grafico) throw new Error('grafico assente');
    clicSulDato(grafico, 0, 2);
    await waitFor(() => expect(`${router.state.location.pathname}${router.state.location.search}`).toBe('/istituzionale/interventi/SRD01?anno=2024'));
  });

  it('valori dei filtri non disponibili (TX-0060 in errore): lo stato col motivo e Riprova, il report si legge', async () => {
    servi(null);
    renderPagina(VerificaSmpNonSigc, '/istituzionale/verifica-smp-non-sigc');
    const stato = await screen.findByText(/^Valori dei filtri non disponibili: /);
    expect(stato.closest('[role="status"]')).not.toBeNull();
    expect(within(stato.closest('[role="status"]') as HTMLElement).getByRole('button', { name: 'Riprova' })).toBeTruthy();
    await trovaCard('Spesa pubblica erogata per intervento (anticipi inclusi)');
  });
});

describe('TabellaVerifica e CellaDato (i ventuno dati di TX-0016)', () => {
  it('colonne visibili del wireframe, assenze col motivo in badge, link verso l elenco solo con un valore positivo', async () => {
    servi();
    const { container } = renderPagina(VerificaSmpNonSigc, '/istituzionale/verifica-smp-non-sigc');
    const tabella = await screen.findByRole('table', { name: /^Verifica SMP non SIGC: / });
    expect(within(tabella).getAllByRole('columnheader').map((c) => c.textContent?.replace(/[▲▼↕]/g, '').trim())).toEqual([
      'Intervento',
      'Avvisi attivati',
      'Avvisi chiusi',
      'Azioni attivate',
      'Dotazione avvisi',
      'Domande ricevute',
      'Spesa erogata (anticipi inclusi)',
      'Concessioni previste senza impegni',
      'Include top-up',
      'Importo top-up',
      'Output erogato (cumulativo)',
    ]);
    const srd01 = within(tabella).getByRole('row', { name: "Apri il dettaglio dell'intervento SRD01" });
    expect(within(srd01).getByRole('link', { name: "Apri nell'elenco operativo le domande di sostegno correnti dell'intervento SRD01" }).getAttribute('href')).toBe('/elenco-operativo/domande?tipo=SOSTEGNO&intervento=SRD01');
    expect(within(srd01).getByRole('link', { name: /^Apri nei pagamenti: / }).getAttribute('href')).toBe('/elenco-operativo/pagamenti?esito=PAGATA&sigc=false&intervento=SRD01');
    const sra01 = within(tabella).getByRole('row', { name: "Apri il dettaglio dell'intervento SRA01" });
    expect(within(sra01).queryByRole('link')).toBeNull();
    expect(testo(sra01.textContent)).toContain('non valorizzatoil dato non è presente nella fonte');
    const sra16 = within(tabella).getByRole('row', { name: "Apri il dettaglio dell'intervento SRA16" });
    expect(testo(sra16.textContent)).toContain('non attribuibileriga presente sia nel monitoraggio SIGC sia nel non SIGC');
    await expectNoA11yViolations(container);
  });

  it('la tabella parte ordinata per intervento anche con righe fuori ordine (la fixture e in ordine di codice come il backend)', () => {
    servi();
    const fuoriOrdine = { ...VERIFICA, righe: [...VERIFICA.righe].reverse() };
    expect(fuoriOrdine.righe.map((r) => r.codiceIntervento)).toEqual(['SRD01', 'SRA16', 'SRA01']);
    const router = createMemoryRouter([{ path: '*', element: <TabellaVerifica d={fuoriOrdine} scaricamenti={[]} onRiga={() => undefined} /> }], { initialEntries: ['/'] });
    renderConQuery(<RouterProvider router={router} />);
    const t = screen.getByRole('table', { name: /^Verifica SMP non SIGC: / });
    expect(within(t).getAllByRole('rowheader').map((c) => c.textContent)).toEqual(['SRA01', 'SRA16', 'SRD01']);
    expect(within(t).getByRole('columnheader', { name: /^Intervento/ }).getAttribute('aria-sort')).toBe('ascending');
  });

  it('senza il grant dell elenco la cella resta senza link; il si e no come testo', () => {
    const puo = () => false;
    const d = (campo: string) => DATI_VERIFICA.find((x) => x.campo === campo) as (typeof DATI_VERIFICA)[number];
    inRouter(
      <table>
        <tbody>
          <tr>
            <td>
              <CellaDato r={SRD01} d={d('domandeRicevute')} puo={puo} />
            </td>
            <td>
              <CellaDato r={SRD01} d={d('includeTopUp')} puo={puo} />
            </td>
            <td>
              <CellaDato r={SRD01} d={d('outputAttesoFinanziate')} unita="ettari" puo={() => true} />
            </td>
          </tr>
        </tbody>
      </table>,
    );
    expect(screen.queryByRole('link')).toBeNull();
    expect(screen.getAllByRole('cell').map((c) => c.textContent)).toEqual(['3', 'sì', '40 ettari']);
  });
});

describe('PannelloFiltriIstituzionale e ValoriNonDisponibili', () => {
  it('il pannello ha le voci di TX-0060 e l azione portante disabilitata senza il legame; nessuna violazione axe', async () => {
    servi();
    renderPagina(VerificaSmpNonSigc, '/istituzionale/verifica-smp-non-sigc');
    await trovaCard('Spesa pubblica erogata per intervento (anticipi inclusi)');
    await userEvent.click(screen.getByRole('button', { name: /^Filtri/ }));
    const pannello = await screen.findByRole('dialog', { name: 'Filtri dei report istituzionali' });
    expect(within(pannello).getByRole('checkbox', { name: 'SRD01 Investimenti produttivi agricoli per la competitività' })).toBeTruthy();
    expect(within(pannello).getByText("Non disponibile finché nessun intervento è collegato a un'azione portante.")).toBeTruthy();
    expect(within(pannello).getByText(/^Valori da TX-0060 dell'elenco operativo/)).toBeTruthy();
    await expectNoA11yViolations(pannello);
  });

  it('ValoriNonDisponibili: niente senza errore; con l errore lo stato e Riprova; sparito col bottone, il focus sull h1', async () => {
    const h1 = createRef<HTMLHeadingElement>();
    const refetch = vi.fn();
    const stato = (isError: boolean): StatoQuery<ValoriFiltriElenco> => ({ data: undefined, isPending: !isError, isError, fetchStatus: 'idle', error: null, refetch });
    const { rerender, container } = render(
      <>
        <h1 ref={h1} tabIndex={-1}>
          Titolo
        </h1>
        <ValoriNonDisponibili valori={stato(true)} h1={h1} />
      </>,
    );
    const riprova = screen.getByRole('button', { name: 'Riprova' });
    expect(riprova.closest('[role="status"]')?.textContent).toMatch(/^Valori dei filtri non disponibili: .+ I filtri dell'indirizzo restano applicati come chip rimovibili/);
    await expectNoA11yViolations(container);
    await userEvent.click(riprova);
    expect(refetch).toHaveBeenCalledTimes(1);
    rerender(
      <>
        <h1 ref={h1} tabIndex={-1}>
          Titolo
        </h1>
        <ValoriNonDisponibili valori={{ ...stato(false), data: VALORI }} h1={h1} />
      </>,
    );
    expect(screen.queryByRole('status')).toBeNull();
    expect(document.activeElement).toBe(h1.current);
    rerender(<ValoriNonDisponibili valori={null} h1={h1} />);
    expect(screen.queryByRole('status')).toBeNull();
  });
});

describe('OutputRegionale, TabellaOutput e AnteprimaOutput (output regionale)', () => {
  it('barra con periodo, interruttore della misura con la didascalia, anni dalla risposta; nessuna violazione axe', async () => {
    servi();
    const { container } = renderPagina(OutputRegionale, '/istituzionale/output-regionale');
    const misura = await screen.findByRole('group', { name: 'Misura mostrata negli anni' });
    expect(within(screen.getByRole('region', { name: 'Filtri attivi' })).getByText('Periodo: 2023 - 2029')).toBeTruthy();
    expect(within(misura).getAllByRole('button').map((b) => [b.textContent, b.getAttribute('aria-pressed')])).toEqual([
      ['Programmato', 'true'],
      ['Realizzato SIGC', 'false'],
      ['Realizzato non SIGC (cumulativo)', 'false'],
    ]);
    const tabella = screen.getByRole('table', { name: /^Output programmato per anno/ });
    expect(within(tabella).getAllByRole('columnheader').map((c) => c.textContent?.replace(/[▲▼↕]/g, '').trim())).toEqual([
      'Intervento',
      'Indicatore di output',
      'Unità di misura',
      'Target di fine periodo',
      'Anno del target',
      '2023',
      '2024',
      '2025',
      '2026',
      '2027',
      '2028',
      '2029',
    ]);
    const sra01 = within(tabella).getByRole('row', { name: "Apri l'anteprima dell'intervento SRA01" });
    expect(testo(sra01.textContent)).toContain('1500 ettari');
    expect(testo(sra01.textContent)).toContain('500 ettari');
    await userEvent.click(within(misura).getByRole('button', { name: 'Realizzato SIGC' }));
    expect(screen.getByRole('table', { name: /^Output realizzato SIGC per anno/ })).toBeTruthy();
    expect(document.activeElement).toBe(within(misura).getByRole('button', { name: 'Realizzato SIGC' }));
    await expectNoA11yViolations(container);
  });

  it('TabellaOutput: indicatore, unita, target e anno del target assenti in badge, mai uno zero', () => {
    inRouter(<TabellaOutput d={OUTPUT} misura="realizzatoNonSigc" scaricamenti={[]} onRiga={() => undefined} />);
    const srg01 = screen.getByRole('row', { name: "Apri l'anteprima dell'intervento SRG01" });
    expect(testo(srg01.textContent)).toContain('non valorizzatonessun target');
    expect(within(srg01).getAllByText('non valorizzato').length).toBeGreaterThanOrEqual(4);
    const srd01 = screen.getByRole('row', { name: "Apri l'anteprima dell'intervento SRD01" });
    expect(testo(srd01.textContent)).toContain('12 numero di operazioni');
  });

  it('AnteprimaOutput: voci, mini grafico senza PNG con la tabella equivalente, Apri il dettaglio; nessuna violazione axe', async () => {
    const onChiudi = vi.fn();
    inRouter(<AnteprimaOutput riga={SRA01_OUTPUT} cumulativo onChiudi={onChiudi} />);
    const drawer = await screen.findByRole('dialog', { name: 'Anteprima: SRA01' });
    expect(testo(drawer.textContent)).toContain('O.14 (ettari)');
    expect(testo(drawer.textContent)).toContain('1500 ettari al 2029');
    const card = await trovaCard('Output di SRA01 per anno');
    expect(within(card).queryByRole('group', { name: /^Scarica/ })).toBeNull();
    expect(within(await tabellaDi(card)).getAllByRole('rowheader').map((c) => c.textContent)).toContain('Target di fine periodo');
    expect(within(drawer).getByRole('link', { name: 'Apri il dettaglio' }).getAttribute('href')).toBe('/istituzionale/interventi/SRA01');
    await expectNoA11yViolations(drawer);
    await userEvent.click(within(drawer).getByRole('button', { name: 'Chiudi: Anteprima: SRA01' }));
    expect(onChiudi).toHaveBeenCalled();
  });
});

describe('DettaglioIntervento e SchedeIntervento (dettaglio dell intervento)', () => {
  it('testata con la descrizione di TX-0060, badge, pulsanti verso i report, KPI e tre schede; nessuna violazione axe', async () => {
    const lette = servi();
    const { container } = apriDettaglio('/istituzionale/interventi/SRD01');
    expect(await screen.findByRole('heading', { level: 1, name: 'Investimenti produttivi agricoli per la competitività' })).toBeTruthy();
    expect(screen.getByText('Istituzionale - intervento SRD01')).toBeTruthy();
    await screen.findByRole('region', { name: 'Domande ricevute non SIGC' });
    expect(within(screen.getByRole('list', { name: 'Dati principali' })).getAllByRole('listitem').map((l) => l.textContent)).toEqual([
      'Perimetro regionale',
      'Indicatore di output O.20 (numero di operazioni)',
      'Indicatore di risultato R.9',
    ]);
    expect(screen.getByRole('link', { name: 'Verifica SMP non SIGC filtrata su questo intervento' }).getAttribute('href')).toBe('/istituzionale/verifica-smp-non-sigc?intervento=SRD01');
    expect(screen.getByRole('link', { name: 'Output regionale filtrato su questo intervento' }).getAttribute('href')).toBe('/istituzionale/output-regionale?intervento=SRD01');
    expect(screen.getAllByRole('tab').map((t) => t.textContent)).toEqual(['Output per anno', 'Verifica SMP non SIGC', 'Importi unitari']);
    expect(lette.verifica).toEqual(['?intervento=SRD01']);
    expect(lette.output).toEqual(['?intervento=SRD01']);
    await trovaCard('Output programmato e realizzato per anno (numero di operazioni)');
    await expectNoA11yViolations(container);
  });

  it('scheda Verifica: le voci con i link e il selettore; scheda Importi: in ordine di esercizio e codice', async () => {
    servi();
    apriDettaglio('/istituzionale/interventi/SRA01');
    await userEvent.click(await screen.findByRole('tab', { name: 'Importi unitari' }));
    const importi = await screen.findByRole('table', { name: /^Importo unitario per Unit Amount/ });
    expect(within(importi).getAllByRole('rowheader').map((c) => c.textContent)).toEqual(['UA01', 'UA02', 'UA01']);
    await userEvent.click(screen.getByRole('tab', { name: 'Verifica SMP non SIGC' }));
    const voci = await screen.findByRole('table', { name: /^I dati ASR non SIGC dell'intervento/ });
    expect(within(voci).getAllByRole('rowheader')).toHaveLength(20);
    expect(screen.getByRole('combobox', { name: 'Anno di riferimento del monitoraggio SMP non SIGC' })).toBeTruthy();
  });

  it('codice non valido nel percorso (anche con /): nessuna lettura, la pagina lo dice', async () => {
    const lette = servi();
    apriDettaglio('/istituzionale/interventi/SR%2F..%2F01');
    expect(screen.getByRole('heading', { level: 1, name: 'Intervento non valido' })).toBeTruthy();
    expect(screen.getByRole('alert').textContent).toMatch(/^Il codice nell'indirizzo non è un codice di intervento/);
    await new Promise((r) => setTimeout(r, 50));
    expect(lette.verifica).toEqual([]);
    expect(lette.output).toEqual([]);
  });

  it('solo col grant di TX-0016: la sola scheda Verifica, nessuna lettura di TX-0017 ne pulsante verso l output', async () => {
    profilo(['csr.tx-0016.read', 'csr.tx-0060.read']);
    const lette = servi();
    apriDettaglio('/istituzionale/interventi/SRD01');
    await screen.findByRole('table', { name: /^I dati ASR non SIGC dell'intervento/ });
    expect(screen.getAllByRole('tab').map((t) => t.textContent)).toEqual(['Verifica SMP non SIGC']);
    expect(screen.queryByRole('link', { name: 'Output regionale filtrato su questo intervento' })).toBeNull();
    expect(lette.output).toEqual([]);
  });
});
