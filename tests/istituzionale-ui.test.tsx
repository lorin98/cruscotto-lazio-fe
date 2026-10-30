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
import { graficoDi, trovaCard } from '../src/shared/testing/card-grafico';
import { clicSulDato } from '../src/shared/testing/grafico-finto';
import { problema } from '../src/shared/testing/msw';
import { renderPagina } from '../src/shared/testing/render-pagina';
import { renderConQuery } from '../src/shared/testing/render';
import { DettaglioIntervento, VerificaSmpNonSigc } from '../src/features/istituzionale';
import { SRD01, VALORI, VERIFICA, VERIFICA_SMP, verificaPer, verificaSigcPer } from '../src/features/istituzionale/testing/fixture';
import { CellaDato } from '../src/features/istituzionale/ui/comuni';
import { ValoriFiltriNonDisponibili } from '../src/entities/filtri';
import { PaginaReport } from '../src/features/istituzionale/ui/PaginaReport';
import { useFiltriDellaPagina } from '../src/features/istituzionale/ui/useFiltriNellIndirizzo';
import { TabellaVerifica } from '../src/features/istituzionale/ui/TabellaVerifica';
import { DATI_VERIFICA } from '../src/features/istituzionale/lib/verifica';
import type { StatoQuery } from '../src/shared/ui';
import type { ValoriFiltriElenco } from '../src/features/istituzionale/api';

const testo = (s: string | null | undefined) => (s ?? '').replace(/\s/g, ' ');
const profilo = (roles: string[]) =>
  server.use(http.get('*/auth/status', () => HttpResponse.json({ authenticated: true, user: { username: 'U', profile: 'p3-funzionario-area-ist', roles } })));

/** TX-0016, TX-0015 e TX-0060 come il backend (le righe dei filtri della query); TX-0060 in errore con `valori` null. */
function servi(valori: object | null = VALORI) {
  const lette = { verifica: [] as string[], verificaSigc: [] as string[], filtri: 0 };
  server.use(
    http.get('*/api/istituzionale/verifica-smp-non-sigc', ({ request }) => {
      const u = new URL(request.url);
      lette.verifica.push(u.search);
      return HttpResponse.json(verificaPer(VERIFICA, u.searchParams));
    }),
    http.get('*/api/istituzionale/verifica-smp-sigc', ({ request }) => {
      const u = new URL(request.url);
      lette.verificaSigc.push(u.search);
      return HttpResponse.json(verificaSigcPer(VERIFICA_SMP, u.searchParams));
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
    // il link G4 verso la verifica SMP SIGC, nella stessa area dal 29/10/2026 (i filtri comuni li porta lo step6)
    expect(screen.getByRole('link', { name: 'Verifica SMP SIGC' }).getAttribute('href')).toBe('/istituzionale/verifica-smp-sigc');
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

describe('PannelloFiltriIstituzionale e ValoriFiltriNonDisponibili (entities/filtri, nato qui)', () => {
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

  it('ValoriFiltriNonDisponibili: niente senza errore; con l errore lo stato e Riprova; sparito col bottone, il focus sull h1', async () => {
    const h1 = createRef<HTMLHeadingElement>();
    const refetch = vi.fn();
    const stato = (isError: boolean): StatoQuery<ValoriFiltriElenco> => ({ data: undefined, isPending: !isError, isError, fetchStatus: 'idle', error: null, refetch });
    const { rerender, container } = render(
      <>
        <h1 ref={h1} tabIndex={-1}>
          Titolo
        </h1>
        <ValoriFiltriNonDisponibili letture={[stato(true)]} h1={h1} />
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
        <ValoriFiltriNonDisponibili letture={[{ ...stato(false), data: VALORI }]} h1={h1} />
      </>,
    );
    expect(screen.queryByRole('status')).toBeNull();
    expect(document.activeElement).toBe(h1.current);
    rerender(<ValoriFiltriNonDisponibili letture={[null]} h1={h1} />);
    expect(screen.queryByRole('status')).toBeNull();
  });
});

describe('DettaglioIntervento e SchedeIntervento (dettaglio dell intervento)', () => {
  it('testata con la descrizione di TX-0060, badge, pulsante verso la verifica, KPI e la scheda della verifica; nessuna violazione axe', async () => {
    const lette = servi();
    const { container } = apriDettaglio('/istituzionale/interventi/SRD01');
    expect(await screen.findByRole('heading', { level: 1, name: 'Investimenti produttivi agricoli per la competitività' })).toBeTruthy();
    expect(screen.getByText('Istituzionale - intervento SRD01')).toBeTruthy();
    await screen.findByRole('region', { name: 'Domande ricevute non SIGC' });
    expect(within(screen.getByRole('list', { name: 'Dati principali' })).getAllByRole('listitem').map((l) => l.textContent)).toEqual([
      'Perimetro regionale',
      'Indicatore di output O.20',
      'Indicatore di risultato R.9',
    ]);
    expect(screen.getByRole('link', { name: 'Verifica SMP non SIGC filtrata su questo intervento' }).getAttribute('href')).toBe('/istituzionale/verifica-smp-non-sigc?intervento=SRD01');
    // l'output regionale (TX-0017: schede Output per anno e Importi unitari, KPI del target) e' del fisico dal 29/10/2026
    expect(screen.queryByRole('link', { name: 'Output regionale filtrato su questo intervento' })).toBeNull();
    expect(screen.getAllByRole('tab').map((t) => t.textContent)).toEqual(['Verifica SMP non SIGC']);
    expect(screen.queryByRole('region', { name: 'Target di fine periodo' })).toBeNull();
    expect(lette.verifica).toEqual(['?intervento=SRD01']);
    await screen.findByRole('table', { name: /^I dati ASR non SIGC dell'intervento/ });
    await expectNoA11yViolations(container);
  });

  it('scheda Verifica: le voci con i link e il selettore', async () => {
    servi();
    apriDettaglio('/istituzionale/interventi/SRA01');
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
  });

  it('col grant di TX-0016 (P3 dell area istituzionale): la scheda Verifica; la verifica SIGC non si legge nel dettaglio (passi successivi)', async () => {
    profilo(['csr.tx-0015.read', 'csr.tx-0016.read', 'csr.tx-0060.read']);
    const lette = servi();
    apriDettaglio('/istituzionale/interventi/SRD01');
    await screen.findByRole('table', { name: /^I dati ASR non SIGC dell'intervento/ });
    expect(screen.getAllByRole('tab').map((t) => t.textContent)).toEqual(['Verifica SMP non SIGC']);
    expect(lette.verificaSigc).toEqual([]);
  });
});

describe('PaginaReport e useFiltriDellaPagina: l impaginazione comune dei due report istituzionali (review H6)', () => {
  const ULTIMI = [{ flusso: 'DS-12', conclusoIl: '2026-03-02T09:15:00Z' }];
  type Risposta = { righe: { codiceIntervento: string }[]; ultimiDatiSincronizzati: typeof ULTIMI };
  const stato = (parziale: Partial<StatoQuery<Risposta>>): StatoQuery<Risposta> => ({ data: undefined, isPending: false, isError: false, fetchStatus: 'idle', error: null, refetch: () => undefined, ...parziale });
  const risposta = (...codici: string[]): Risposta => ({ righe: codici.map((codiceIntervento) => ({ codiceIntervento })), ultimiDatiSincronizzati: ULTIMI });

  /** Un report di prova: la pagina passa solo testi, la pill della risposta, cosa sta sopra e il report. */
  const provaCon = (s: StatoQuery<Risposta>) =>
    function Prova() {
      const pagina = useFiltriDellaPagina('anno');
      return (
        <PaginaReport pagina={pagina} stato={s} briciola="Prova" titolo="Istituzionale: prova" titoloDocumento="Prova - Istituzionale" sottotitolo="Il sottotitolo." nota="La nota." pill={(d) => `Righe della risposta: ${d.righe.length}`} sopra={<p>sopra il report</p>}>
          {(d) => <p>{`report di ${d.righe.map((r) => r.codiceIntervento).join(', ')}`}</p>}
        </PaginaReport>
      );
    };

  it('barra coi chip dell indirizzo e le pill, percorso, un solo h1 col focus, nota, sopra e poi il report; pannello coi codici della risposta', async () => {
    servi(null);
    const { container } = renderPagina(provaCon(stato({ data: risposta('SRA01', 'SRD01') })), '/istituzionale/prova', '/istituzionale/prova?intervento=SRD01');
    const barra = screen.getByRole('region', { name: 'Filtri attivi' });
    expect(within(barra).getByRole('button', { name: 'Togli il filtro Intervento SRD01' })).toBeTruthy();
    expect(within(barra).getByText('Perimetro: regionale (i report istituzionali non hanno perimetro ADA)')).toBeTruthy();
    expect(within(barra).getByText('Righe della risposta: 2')).toBeTruthy();
    expect(within(barra).getByRole('button', { name: /^Ultimo dato sincronizzato: dati al 02\/03\/2026/ })).toBeTruthy();
    expect((await within(screen.getByRole('navigation', { name: 'Percorso' })).findByRole('link', { name: 'Istituzionale' })).getAttribute('href')).toBe('/istituzionale/verifica-smp-non-sigc');
    const h1 = screen.getByRole('heading', { level: 1, name: 'Istituzionale: prova' });
    expect(document.activeElement).toBe(h1);
    expect(document.title).toBe('Prova - Istituzionale - Cruscotto CSR 2023-2027');
    expect(screen.getByText('La nota.')).toBeTruthy();
    const sopra = screen.getByText('sopra il report');
    const report = screen.getByText('report di SRA01, SRD01');
    expect(sopra.compareDocumentPosition(report) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    // TX-0060 in errore: lo stato dei valori non disponibili; il pannello propone i codici della risposta
    expect(await screen.findByText(/^Valori dei filtri non disponibili: /)).toBeTruthy();
    await userEvent.click(within(barra).getByRole('button', { name: /^Filtri/ }));
    const pannello = await screen.findByRole('dialog', { name: 'Filtri dei report istituzionali' });
    expect(within(pannello).getByRole('checkbox', { name: 'SRA01' })).toBeTruthy();
    expect(within(pannello).getByRole('checkbox', { name: 'SRD01' })).toBeTruthy();
    await expectNoA11yViolations(container);
  });

  it('nessuna riga: il vuoto dei filtri con Modifica i filtri (apre il pannello); errore: un solo avviso della pagina', async () => {
    servi();
    const vuota = renderPagina(provaCon(stato({ data: risposta() })), '/istituzionale/prova', '/istituzionale/prova?intervento=SRD01');
    const vuoto = await screen.findByText(/^Nessun intervento per i filtri scelti/);
    await userEvent.click(within(vuoto.closest('[role="status"]') as HTMLElement).getByRole('button', { name: 'Modifica i filtri' }));
    expect(await screen.findByRole('dialog', { name: 'Filtri dei report istituzionali' })).toBeTruthy();
    vuota.unmount();
    renderPagina(provaCon(stato({ isError: true, error: new Error('rete') })), '/istituzionale/prova');
    expect(await screen.findAllByRole('alert')).toHaveLength(1);
    expect(screen.getByText(/^Dati non caricati: l'avviso in cima alla pagina/)).toBeTruthy();
    expect(within(screen.getByRole('region', { name: 'Filtri attivi' })).getByText('Ultimo dato sincronizzato: non disponibile')).toBeTruthy();
    expect(screen.queryByText('Righe della risposta', { exact: false })).toBeNull();
  });
});
