import { afterEach, describe, expect, it, vi } from 'vitest';
import { useState } from 'react';
import type { ReactElement } from 'react';
import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import type { JsonBodyType } from 'msw';
import { createMemoryRouter, RouterProvider } from 'react-router';
import type { EChartsOption } from 'echarts';
import { server } from '../src/shared/api/mock/server';
import { AUTH_STATUS_QUERY_KEY } from '../src/shared/api/auth/auth-status';
import { expectNoA11yViolations } from '../src/shared/testing/axe';
import { trovaCard } from '../src/shared/testing/card-grafico';
import { clicSu, graficiVivi } from '../src/shared/testing/grafico-finto';
import type { GraficoFinto } from '../src/shared/testing/grafico-finto';
import { problema, rispondi } from '../src/shared/testing/msw';
import { clientDiTest, renderConQuery } from '../src/shared/testing/render';
import {
  AvanzamentoReport,
  CercaIntervento,
  DettaglioIntervento,
  DomandeReport,
  DotazioneReport,
  PannelloFiltri,
  Panoramica,
  RiepilogoReport,
  RiservaReport,
  SigcReport,
  UltimoAggiornamento,
  VerificaSmpReport,
} from '../src/features/finanziario';
import type { Filtri } from '../src/features/finanziario';
import { graficoQuotaFeasr } from '../src/features/finanziario/lib/grafici';
import * as F from '../src/shared/testing/fixture-finanziario';

// Test dei componenti del finanziario nella UI v2 (ADR 0027): card con grafico ECharts (sostituito nei test dal grafico
// finto di shared/testing) e tabella equivalente, KPI, pannelli laterali react-aria, tabella interattiva.

type Client = ReturnType<typeof clientDiTest>;

const testo = (s: string | null | undefined) => (s ?? '').replace(/\s/g, ' ');
const nessunaAzione = () => {};
const euro = (valore: number) => ({ valore, motivo: null, fonte: null });
const ZERO = euro(0);
const VUOTO_INTERVENTI = 'Nessun intervento per i filtri scelti. Modifica i filtri.';
const NON_DISPONIBILE_PROFILO = 'Sezione non disponibile per il tuo profilo.';

// Profilo ridotto (gate di UX R-09): /auth/status con i soli grant indicati.
const profilo = (...roles: string[]) =>
  server.use(http.get('*/auth/status', () => HttpResponse.json({ authenticated: true, user: { username: 'U', roles } })));
// Letture partite verso un path (in corso o concluse), lette dalla cache di React Query: deterministico, non dipende da
// quando MSW serve la richiesta.
const letture = (client: Client, path: string) =>
  client
    .getQueryCache()
    .getAll()
    .filter((q) => q.queryKey[0] === path && (q.state.fetchStatus !== 'idle' || q.state.dataUpdateCount > 0 || q.state.errorUpdateCount > 0));
const lettaConSuccesso = (client: Client, path: string) => letture(client, path).some((q) => q.state.status === 'success');
const sessioneLetta = (client: Client) => waitFor(() => expect(client.getQueryState(AUTH_STATUS_QUERY_KEY)?.status).toBe('success'));
// una risposta trattenuta finche' il test non la rilascia
function trattenuta(path: string, corpo: JsonBodyType) {
  let rilascia = () => {};
  const attesa = new Promise<void>((r) => (rilascia = r));
  server.use(
    http.get(`*${path}`, async () => {
      await attesa;
      return HttpResponse.json(corpo);
    }),
  );
  return () => act(async () => rilascia());
}
// lascia arrivare a React le notifiche della cache (notifyManager le pianifica su un timer a 0)
const notifiche = () => act(() => new Promise<void>((r) => setTimeout(r, 20)));

// Router in memoria (come shared/testing/render-pagina.tsx): il componente sta su ogni indirizzo non previsto, il
// dettaglio dell'intervento e la pagina SIGC sono segnaposti; i test di navigazione guardano router.state.
function conRouter(ui: ReactElement, indirizzo = '/prova', client: Client = clientDiTest()) {
  const router = createMemoryRouter(
    [
      { path: '/finanziario/interventi/:codice', element: <p>pagina del dettaglio</p> },
      { path: '/finanziario/sigc', element: <p>pagina SIGC</p> },
      { path: '*', element: ui },
    ],
    { initialEntries: [indirizzo] },
  );
  return { ...renderConQuery(<RouterProvider router={router} />, client), router };
}
const indirizzo = (router: ReturnType<typeof createMemoryRouter>) => `${router.state.location.pathname}${router.state.location.search}`;

// Grafico finto montato nella card con quel titolo (h2 o h3 della CardGrafico).
function graficoDi(titolo: string): GraficoFinto {
  const g = graficiVivi().find((x) => x.el.closest('section')?.querySelector('h2, h3')?.textContent === titolo);
  if (!g) throw new Error(`nessun grafico montato nella card "${titolo}"`);
  return g;
}
const ultimeOpzioni = (g: GraficoFinto) => g.opzioni[g.opzioni.length - 1] as EChartsOption;
const descrizione = (g: GraficoFinto) => (ultimeOpzioni(g).aria as { label?: { description?: string } } | undefined)?.label?.description ?? '';
const card = (titolo: string) => screen.getByRole('region', { name: titolo });
// Testo di una regione (KPI o sezione): attende il contenuto, perche' finche' si legge il profilo la stessa regione puo'
// essere il segnaposto di ConGrant (stesso nome, "Caricamento in corso…").
const regioneContiene = (nome: string, atteso: string) =>
  waitFor(() => expect(testo(screen.getByRole('region', { name: nome }).textContent)).toContain(atteso));
const sezioneNonDisponibile = (nome: string) => regioneContiene(nome, NON_DISPONIBILE_PROFILO);
// Mostra la tabella equivalente di una card con il grafico disegnato.
const vediTabella = (titolo: string) => userEvent.click(within(screen.getByRole('group', { name: `Vista di ${titolo}` })).getByRole('button', { name: 'Tabella' }));
// Valore accanto all'intestazione di riga di una tabella voce/valore.
const valoreDi = (tabella: HTMLElement, voce: string) => testo(within(tabella).getByRole('rowheader', { name: voce }).nextElementSibling?.textContent);
// Codici delle righe del corpo di una tabella (senza la riga dei totali).
const righeCorpo = (tabella: HTMLElement) => Array.from((tabella as HTMLTableElement).tBodies[0].rows, (r) => r.cells[0].textContent);

afterEach(() => vi.restoreAllMocks());

describe('PannelloFiltri (pannello laterale dei filtri, TX-0001)', () => {
  // la pagina apre il pannello dalla barra dei filtri, lo chiude con Applica, Chiudi o Esc
  function ConPulsante({ valori, onApplica }: { valori: Filtri; onApplica: (f: Filtri) => void }) {
    const [aperto, setAperto] = useState(false);
    return (
      <>
        <button type="button" onClick={() => setAperto(true)}>
          Apri i filtri
        </button>
        <PannelloFiltri
          aperto={aperto}
          valori={valori}
          onApplica={(f) => {
            onApplica(f);
            setAperto(false);
          }}
          onChiudi={() => setAperto(false)}
        />
      </>
    );
  }
  const apri = async () => {
    await userEvent.click(screen.getByRole('button', { name: 'Apri i filtri' }));
    return screen.findByRole('dialog', { name: 'Filtri' });
  };
  const gruppo = (nome: string) => screen.getByRole('group', { name: nome });

  it('chiuso non legge TX-0001; aperto mostra gli interventi del backend come caselle e applica la scelta', async () => {
    server.use(rispondi('/api/finanziario/filtri', F.FILTRI));
    const onApplica = vi.fn();
    const client = clientDiTest();
    renderConQuery(<ConPulsante valori={{}} onApplica={onApplica} />, client);
    await notifiche();
    expect(letture(client, '/api/finanziario/filtri')).toHaveLength(0);
    expect(screen.queryByRole('dialog')).toBeNull();
    await apri();
    const sra01 = await screen.findByRole('checkbox', { name: 'SRA01 Intervento di prova A' });
    expect(within(gruppo('Intervento')).getAllByRole('checkbox')).toHaveLength(2);
    // con poche voci niente ricerca
    expect(screen.queryByRole('searchbox', { name: 'Cerca in Intervento' })).toBeNull();
    await userEvent.click(sra01);
    await userEvent.click(screen.getByRole('checkbox', { name: 'SRA03 Intervento di prova B' }));
    expect(screen.getByText('2 scelti')).toBeTruthy();
    await userEvent.click(screen.getByRole('button', { name: 'Applica i filtri' }));
    expect(onApplica).toHaveBeenCalledWith({ intervento: ['SRA01', 'SRA03'] });
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });

  it("senza legame l'azione portante e disabilitata e spiegata, e non si applica anche se nell'indirizzo", async () => {
    server.use(rispondi('/api/finanziario/filtri', F.FILTRI));
    const onApplica = vi.fn();
    renderConQuery(<ConPulsante valori={{ azione: ['1'], os: ['OS4'] }} onApplica={onApplica} />);
    await apri();
    await screen.findByRole('checkbox', { name: /^SRA01/ });
    expect((gruppo('Azione portante') as HTMLFieldSetElement).disabled).toBe(true);
    expect(screen.getByText("Non disponibile finché nessun intervento è collegato a un'azione portante.")).toBeTruthy();
    await userEvent.click(screen.getByRole('button', { name: 'Applica i filtri' }));
    expect(onApplica).toHaveBeenCalledWith({ os: ['OS4'] });
  });

  it('Azzera svuota la bozza (caselle e chip); Applica porta i filtri vuoti', async () => {
    server.use(rispondi('/api/finanziario/filtri', F.FILTRI));
    const onApplica = vi.fn();
    renderConQuery(<ConPulsante valori={{ intervento: ['SRA03'], op: ['OP2'] }} onApplica={onApplica} />);
    await apri();
    const sra03 = (await screen.findByRole('checkbox', { name: /^SRA03/ })) as HTMLInputElement;
    const op2 = within(gruppo('Obiettivo di policy (OP)')).getByRole('button', { name: 'OP2' });
    expect(sra03.checked).toBe(true);
    expect(op2.getAttribute('aria-pressed')).toBe('true');
    await userEvent.click(screen.getByRole('button', { name: 'Azzera' }));
    expect(sra03.checked).toBe(false);
    expect(op2.getAttribute('aria-pressed')).toBe('false');
    await userEvent.click(screen.getByRole('button', { name: 'Applica i filtri' }));
    expect(onApplica).toHaveBeenCalledWith({});
  });

  it('OG, OS e OP come chip con aria-pressed (codice, o codice e descrizione); selezione multipla, il testo spiega O/E', async () => {
    server.use(rispondi('/api/finanziario/filtri', F.FILTRI));
    const onApplica = vi.fn();
    renderConQuery(<ConPulsante valori={{}} onApplica={onApplica} />);
    await apri();
    await screen.findByRole('checkbox', { name: /^SRA01/ });
    const op = within(gruppo('Obiettivo di policy (OP)')).getAllByRole('button');
    expect(op.map((b) => b.textContent)).toEqual(['OP1', 'OP2', 'OP4', 'OP5']);
    expect(op.every((b) => b.getAttribute('aria-pressed') === 'false')).toBe(true);
    expect(within(gruppo('Obiettivo generale (OG)')).getByRole('button').textContent).toBe('OG2');
    expect(within(gruppo('Obiettivo specifico (OS)')).getByRole('button').textContent).toBe('OS4');
    expect(screen.getByText(/Valori dello stesso filtro in alternativa \(O\); filtri diversi insieme \(E\)/)).toBeTruthy();
    await userEvent.click(op[1]);
    await userEvent.click(op[3]);
    expect(op[1].getAttribute('aria-pressed')).toBe('true');
    await userEvent.click(within(gruppo('Obiettivo generale (OG)')).getByRole('button', { name: 'OG2' }));
    await userEvent.click(screen.getByRole('button', { name: 'Applica i filtri' }));
    expect(onApplica).toHaveBeenCalledWith({ og: ['OG2'], op: ['OP2', 'OP5'] });
  });

  it('con piu di 8 interventi compare la ricerca; nessuna corrispondenza e detta', async () => {
    const interventi = Array.from({ length: 10 }, (_, n) => ({ chiave: `SRD${String(n + 1).padStart(2, '0')}`, descrizione: `Intervento di prova ${n + 1}` }));
    server.use(rispondi('/api/finanziario/filtri', { ...F.FILTRI, interventi }));
    renderConQuery(<ConPulsante valori={{}} onApplica={nessunaAzione} />);
    await apri();
    const cerca = await screen.findByRole('searchbox', { name: 'Cerca in Intervento' });
    expect(within(gruppo('Intervento')).getAllByRole('checkbox')).toHaveLength(10);
    await userEvent.type(cerca, 'srd07');
    expect(within(gruppo('Intervento')).getAllByRole('checkbox').map((c) => c.closest('label')?.textContent)).toEqual(['SRD07 Intervento di prova 7']);
    await userEvent.clear(cerca);
    await userEvent.type(cerca, 'nessuno');
    expect(within(gruppo('Intervento')).queryAllByRole('checkbox')).toHaveLength(0);
    expect(screen.getByText('Nessuna voce corrisponde alla ricerca.')).toBeTruthy();
  });

  it('Chiudi ed Esc non applicano; alla riapertura la bozza riparte dai filtri applicati e il focus torna al pulsante', async () => {
    server.use(rispondi('/api/finanziario/filtri', F.FILTRI));
    const onApplica = vi.fn();
    renderConQuery(<ConPulsante valori={{}} onApplica={onApplica} />);
    await apri();
    await userEvent.click(await screen.findByRole('checkbox', { name: /^SRA01/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Chiudi: Filtri' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    await waitFor(() => expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Apri i filtri' })));
    await apri();
    expect(((await screen.findByRole('checkbox', { name: /^SRA01/ })) as HTMLInputElement).checked).toBe(false);
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(onApplica).not.toHaveBeenCalled();
  });

  it('errore del backend: i report restano consultabili, messaggio leggibile e riprova', async () => {
    server.use(rispondi('/api/finanziario/filtri', problema(403, 'ACCESSO_NEGATO'), 403));
    renderConQuery(<ConPulsante valori={{}} onApplica={nessunaAzione} />);
    await apri();
    const avviso = await screen.findByRole('alert');
    expect(avviso.textContent).toContain('Valori dei filtri non disponibili: i report restano consultabili senza filtri.');
    expect(avviso.textContent).toContain('Non hai i permessi');
    expect(within(avviso).getByRole('button', { name: 'Riprova' })).toBeTruthy();
  });

  it('a11y: zero violazioni axe nel pannello aperto', async () => {
    server.use(rispondi('/api/finanziario/filtri', F.FILTRI));
    renderConQuery(<ConPulsante valori={{ intervento: ['SRA01'] }} onApplica={nessunaAzione} />);
    const dialogo = await apri();
    await screen.findByRole('checkbox', { name: /^SRA01/ });
    await expectNoA11yViolations(dialogo);
  });
});

describe('UltimoAggiornamento (pill "Dati al", NFR-25 b, OP-FE-04)', () => {
  it('la pill porta la data piu recente anche se non e l ultima voce; il popover ha una voce per flusso', async () => {
    server.use(rispondi('/api/finanziario/filtri', { ...F.FILTRI, ultimiDatiSincronizzati: [...F.FILTRI.ultimiDatiSincronizzati].reverse() }));
    renderConQuery(<UltimoAggiornamento />);
    const pill = await screen.findByRole('button', { name: 'Ultimo dato sincronizzato: dati al 03/03/2026. Mostra il dettaglio per flusso' });
    expect(pill.textContent).toBe('Dati al 03/03/2026');
    await userEvent.click(pill);
    const popover = await screen.findByRole('dialog', { name: "Ultimo dato sincronizzato per flusso d'import" });
    const voci = within(popover)
      .getAllByRole('listitem')
      .map((li) => Array.from(li.children, (c) => c.textContent));
    expect(voci).toEqual([
      ['PROSA DS-04', '03/03/2026 09:30'],
      ['DS-12', '02/03/2026 10:15'],
    ]);
  });
  it('senza acquisizioni concluse lo dichiara', async () => {
    server.use(rispondi('/api/finanziario/filtri', { ...F.FILTRI, ultimiDatiSincronizzati: [] }));
    renderConQuery(<UltimoAggiornamento />);
    expect(await screen.findByText('Ultimo dato sincronizzato: nessuna acquisizione conclusa')).toBeTruthy();
    expect(screen.queryByRole('button')).toBeNull();
  });
  it('errore di TX-0001: la data risulta non disponibile', async () => {
    server.use(rispondi('/api/finanziario/filtri', problema(500, 'ERRORE_INTERNO'), 500));
    renderConQuery(<UltimoAggiornamento />);
    expect(await screen.findByText('Ultimo dato sincronizzato: non disponibile')).toBeTruthy();
  });
  it('un backend senza il campo non fa dire "nessuna acquisizione conclusa": nessuna pill', async () => {
    const senza: Partial<typeof F.FILTRI> = { ...F.FILTRI };
    delete senza.ultimiDatiSincronizzati;
    server.use(rispondi('/api/finanziario/filtri', senza));
    const client = clientDiTest();
    const { container } = renderConQuery(<UltimoAggiornamento />, client);
    await waitFor(() => expect(lettaConSuccesso(client, '/api/finanziario/filtri')).toBe(true));
    await notifiche();
    expect(container.textContent).toBe('');
  });
  it('senza il grant di TX-0001 non legge e non mostra la pill', async () => {
    profilo('csr.tx-0011.read');
    server.use(rispondi('/api/finanziario/filtri', F.FILTRI));
    const client = clientDiTest();
    const { container } = renderConQuery(<UltimoAggiornamento />, client);
    await sessioneLetta(client);
    await notifiche();
    expect(letture(client, '/api/finanziario/filtri')).toHaveLength(0);
    expect(container.textContent).toBe('');
  });
  it('a11y: zero violazioni axe, con il popover chiuso e aperto', async () => {
    server.use(rispondi('/api/finanziario/filtri', F.FILTRI));
    const { container } = renderConQuery(<UltimoAggiornamento />);
    const pill = await screen.findByRole('button', { name: /^Ultimo dato sincronizzato: dati al/ });
    await expectNoA11yViolations(container);
    await userEvent.click(pill);
    await expectNoA11yViolations(await screen.findByRole('dialog'));
  });
});

describe('CercaIntervento (ricerca nella barra, TX-0001)', () => {
  const casella = () => screen.findByLabelText('Cerca un intervento per codice');
  it('Invio su un codice di TX-0001 apre il dettaglio dell intervento e svuota la ricerca', async () => {
    server.use(rispondi('/api/finanziario/filtri', F.FILTRI));
    const { router } = conRouter(<CercaIntervento />);
    const campo = (await casella()) as HTMLInputElement;
    await waitFor(() => expect(document.querySelectorAll('datalist option')).toHaveLength(2));
    await userEvent.type(campo, 'sra03 qualcosa{Enter}');
    await waitFor(() => expect(indirizzo(router)).toBe('/finanziario/interventi/SRA03'));
  });
  it('un codice che non e fra gli interventi resta in pagina con l errore annunciato', async () => {
    server.use(rispondi('/api/finanziario/filtri', F.FILTRI));
    const { router } = conRouter(<CercaIntervento />);
    const campo = await casella();
    await waitFor(() => expect(document.querySelectorAll('datalist option')).toHaveLength(2));
    await userEvent.type(campo, 'SRZ99{Enter}');
    expect((await screen.findByRole('alert')).textContent).toBe('Codice non trovato');
    expect(campo.getAttribute('aria-invalid')).toBe('true');
    expect(indirizzo(router)).toBe('/prova');
    await userEvent.type(campo, '1');
    expect(screen.queryByRole('alert')).toBeNull();
  });
  it('senza il grant di TX-0001 non legge e non si mostra', async () => {
    profilo('csr.tx-0011.read');
    server.use(rispondi('/api/finanziario/filtri', F.FILTRI));
    const client = clientDiTest();
    conRouter(<CercaIntervento />, '/prova', client);
    await sessioneLetta(client);
    await notifiche();
    expect(letture(client, '/api/finanziario/filtri')).toHaveLength(0);
    expect(screen.queryByRole('search')).toBeNull();
  });
  it('a11y: zero violazioni axe', async () => {
    server.use(rispondi('/api/finanziario/filtri', F.FILTRI));
    const { container } = conRouter(<CercaIntervento />);
    await casella();
    await expectNoA11yViolations(container);
  });
});

describe('Panoramica (route /finanziario: TX-0002, TX-0009, TX-0012, TX-0013)', () => {
  const servi = () =>
    server.use(
      rispondi('/api/finanziario/spesa-per-intervento', F.SPESA),
      rispondi('/api/finanziario/totale-domande', F.TOTALE_DOMANDE),
      rispondi('/api/finanziario/sigc/domande', F.SIGC_DOMANDE),
      rispondi('/api/finanziario/sigc/importi', F.SIGC_IMPORTI),
    );
  const CARD = ['Avanzamento per intervento', 'Dotazione per famiglia di intervento', 'Domande SIGC: dalla presentazione al pagamento', 'Importi SIGC'];
  it('KPI dai dati, perimetro dichiarato e quattro card con il grafico montato', async () => {
    servi();
    conRouter(<Panoramica filtri={{}} />);
    await regioneContiene('Dotazione spesa pubblica', '1,0 M€');
    await regioneContiene('Pagamenti totali', '0,2 M€');
    await regioneContiene('Pagato sulla dotazione', '20 %');
    await regioneContiene('Domande presentate', 'di cui prima annualità 400');
    expect(within(card('Pagato sulla dotazione')).getByRole('img', { name: '20%' })).toBeTruthy();
    expect(screen.getByText('Regionale: tutte le domande della regione')).toBeTruthy();
    await waitFor(() => expect(graficiVivi()).toHaveLength(4));
    for (const titolo of CARD) expect(graficoDi(titolo).opzioni.length).toBeGreaterThan(0);
    expect(screen.queryByText(/Grafico non disponibile/)).toBeNull();
  });

  it("tabella equivalente dalla card: stessi valori del grafico, il grafico resta montato ma nascosto", async () => {
    servi();
    conRouter(<Panoramica filtri={{}} />);
    await waitFor(() => expect(graficiVivi()).toHaveLength(4));
    const g = graficoDi('Avanzamento per intervento');
    await vediTabella('Avanzamento per intervento');
    const tabella = within(card('Avanzamento per intervento')).getByRole('table', { name: 'Pagato sulla dotazione di spesa pubblica per intervento' });
    expect(testo(within(tabella).getByRole('row', { name: /^SRA01/ }).textContent)).toContain('20 %');
    expect(g.dismesso).toBe(false);
    expect(g.el.parentElement?.hidden).toBe(true);
  });

  it('drill-down: clic su una barra apre il dettaglio dell intervento con i filtri; clic su una famiglia non naviga', async () => {
    servi();
    const { router } = conRouter(<Panoramica filtri={{ intervento: ['SRA01'] }} />);
    await waitFor(() => expect(graficiVivi()).toHaveLength(4));
    act(() => clicSu(graficoDi('Dotazione per famiglia di intervento'), { name: 'SRA', data: { name: 'SRA' } }));
    await notifiche();
    expect(indirizzo(router)).toBe('/prova');
    act(() => clicSu(graficoDi('Avanzamento per intervento'), { name: 'SRA01', dataIndex: 0, data: { codice: 'SRA01' } }));
    await waitFor(() => expect(indirizzo(router)).toBe('/finanziario/interventi/SRA01?intervento=SRA01'));
    expect(screen.getByText('pagina del dettaglio')).toBeTruthy();
  });

  it('drill-down: clic su un intervento della mappa apre il dettaglio, clic sull imbuto SIGC apre la pagina SIGC', async () => {
    servi();
    const primo = conRouter(<Panoramica filtri={{}} />);
    await waitFor(() => expect(graficiVivi()).toHaveLength(4));
    act(() => clicSu(graficoDi('Dotazione per famiglia di intervento'), { name: 'SRA01', data: { codice: 'SRA01' } }));
    await waitFor(() => expect(indirizzo(primo.router)).toBe('/finanziario/interventi/SRA01'));
    primo.unmount();
    servi();
    const secondo = conRouter(<Panoramica filtri={{ op: ['OP2'] }} />);
    await waitFor(() => expect(graficiVivi()).toHaveLength(4));
    act(() => clicSu(graficoDi('Domande SIGC: dalla presentazione al pagamento'), { name: 'Pagate', dataIndex: 1 }));
    await waitFor(() => expect(indirizzo(secondo.router)).toBe('/finanziario/sigc?op=OP2'));
  });

  it('perimetro ADA: avanzamento non confrontabile (grafico non disegnato, tabella subito) e KPI della quota dichiarato', async () => {
    servi();
    server.use(rispondi('/api/finanziario/spesa-per-intervento', { ...F.SPESA, perimetro: 'ADA' }));
    conRouter(<Panoramica filtri={{}} />);
    const avanzamento = await trovaCard('Avanzamento per intervento');
    expect(
      within(avanzamento).getByText("Grafico non disponibile: perimetro ADA: la dotazione è regionale, i pagamenti sono dell'area: la quota non è confrontabile."),
    ).toBeTruthy();
    expect(within(avanzamento).queryByRole('group', { name: /^Vista di/ })).toBeNull();
    expect(testo(within(avanzamento).getByRole('table').textContent)).toContain('non confrontabile (perimetro ADA)');
    await regioneContiene('Pagato sulla dotazione', 'Non confrontabile: dotazione regionale e pagamenti dell’area (perimetro ADA)');
    expect(screen.getByText('Area decentrata (ADA): solo le domande della propria area')).toBeTruthy();
    await waitFor(() => expect(graficiVivi()).toHaveLength(3));
  });

  it('selezione senza interventi: stato vuoto (status) al posto di KPI e grafici della spesa', async () => {
    servi();
    server.use(rispondi('/api/finanziario/spesa-per-intervento', { perimetro: 'REGIONALE', righe: [] }));
    const client = clientDiTest();
    conRouter(<Panoramica filtri={{ intervento: ['SRA99'] }} />, '/prova', client);
    const vuoto = await screen.findByText(VUOTO_INTERVENTI);
    expect(vuoto.closest('[role]')?.getAttribute('role')).toBe('status');
    expect(screen.queryByRole('region', { name: 'Dotazione spesa pubblica' })).toBeNull();
    expect(screen.queryByRole('region', { name: 'Avanzamento per intervento' })).toBeNull();
    await notifiche();
    // il KPI delle domande sta dentro la sezione della spesa: senza interventi non si legge
    expect(letture(client, '/api/finanziario/totale-domande')).toHaveLength(0);
  });

  it('senza il grant di TX-0002 la sezione della spesa lo dice e non legge TX-0002 ne TX-0009 (R-09)', async () => {
    servi();
    profilo('csr.tx-0012.read', 'csr.tx-0013.read', 'csr.tx-0009.read');
    const client = clientDiTest();
    conRouter(<Panoramica filtri={{}} />, '/prova', client);
    await sezioneNonDisponibile('Dotazione e pagamenti');
    await trovaCard('Importi SIGC');
    await waitFor(() => expect(graficiVivi()).toHaveLength(2));
    expect(letture(client, '/api/finanziario/spesa-per-intervento')).toHaveLength(0);
    expect(letture(client, '/api/finanziario/totale-domande')).toHaveLength(0);
  });

  it('senza il grant di TX-0009 il solo KPI delle domande lo dice e non legge TX-0009', async () => {
    servi();
    profilo('csr.tx-0002.read', 'csr.tx-0012.read', 'csr.tx-0013.read');
    const client = clientDiTest();
    conRouter(<Panoramica filtri={{}} />, '/prova', client);
    await sezioneNonDisponibile('Domande presentate');
    await regioneContiene('Dotazione spesa pubblica', '1,0 M€');
    await notifiche();
    expect(letture(client, '/api/finanziario/totale-domande')).toHaveLength(0);
  });

  // regressione R-09: le letture SIGC stanno nei figli di ConGrant (prima partivano anche senza grant)
  it('senza i grant di TX-0012 e TX-0013 le card SIGC lo dicono e non leggono (R-09)', async () => {
    servi();
    profilo('csr.tx-0002.read', 'csr.tx-0009.read');
    const client = clientDiTest();
    conRouter(<Panoramica filtri={{}} />, '/prova', client);
    await waitFor(() => expect(screen.getAllByText(NON_DISPONIBILE_PROFILO)).toHaveLength(2));
    await notifiche();
    expect(letture(client, '/api/finanziario/sigc/domande')).toHaveLength(0);
    expect(letture(client, '/api/finanziario/sigc/importi')).toHaveLength(0);
  });

  it('a11y: zero violazioni axe', async () => {
    servi();
    const { container } = conRouter(<Panoramica filtri={{}} />);
    await waitFor(() => expect(graficiVivi()).toHaveLength(4));
    await screen.findByRole('region', { name: 'Domande presentate' });
    await expectNoA11yViolations(container);
  });
});

describe('DettaglioIntervento (route /finanziario/interventi/:codice)', () => {
  const RIEPILOGO_SRA01 = { ...F.RIEPILOGO, righe: [F.RIEPILOGO.righe[0]] };
  const servi = () =>
    server.use(
      rispondi('/api/finanziario/filtri', F.FILTRI),
      rispondi('/api/finanziario/riepilogo', RIEPILOGO_SRA01),
      rispondi('/api/finanziario/spesa-per-intervento', F.SPESA),
      rispondi('/api/finanziario/domande-per-anno', F.DOMANDE_PER_ANNO),
      rispondi('/api/finanziario/importi-per-anno', F.IMPORTI_PER_ANNO),
      rispondi('/api/finanziario/sigc/domande', F.SIGC_DOMANDE),
      rispondi('/api/finanziario/sigc/importi', F.SIGC_IMPORTI),
    );

  it("testata con la descrizione di TX-0001 e il focus, letture filtrate sull'intervento, KPI dalla riga del riepilogo", async () => {
    servi();
    let query = '';
    server.use(
      http.get('*/api/finanziario/riepilogo', ({ request }) => {
        query = new URL(request.url).search;
        return HttpResponse.json(RIEPILOGO_SRA01);
      }),
    );
    const { router } = conRouter(<DettaglioIntervento codice="SRA01" />);
    const h1 = await screen.findByRole('heading', { level: 1, name: 'Intervento di prova A' });
    await waitFor(() => expect(document.activeElement).toBe(h1));
    expect(document.title).toBe('SRA01 - Finanziario - Cruscotto CSR 2023-2027');
    expect(query).toBe('?intervento=SRA01');
    expect(screen.getByText('Intervento SRA01')).toBeTruthy();
    expect(screen.getByText('Perimetro REGIONALE', { selector: '.ui-hero__badge' })).toBeTruthy();
    expect(await screen.findByText('Contributo ambientale 12,5 %')).toBeTruthy();
    const kpi = (nome: string) => testo(screen.getByRole('region', { name: nome }).textContent);
    expect(kpi('Dotazione spesa pubblica')).toContain('1,0 M€');
    expect(kpi('Risorse quota FEASR')).toContain('0,4 M€');
    expect(kpi('Pagamenti al netto delle rettifiche')).toContain('0,2 M€');
    expect(kpi('Domande presentate')).toContain('12');
    await userEvent.click(screen.getByRole('link', { name: 'Filtra i report su questo intervento' }));
    expect(indirizzo(router)).toBe('/finanziario?intervento=SRA01');
  });

  it('schede: Sintesi con i due grafici; Domande e SIGC leggono solo quando si aprono; Tutte le voci con il motivo delle assenze', async () => {
    servi();
    const client = clientDiTest();
    conRouter(<DettaglioIntervento codice="SRA01" />, '/prova', client);
    expect(await screen.findByRole('tab', { name: 'Sintesi', selected: true })).toBeTruthy();
    await waitFor(() => expect(graficiVivi()).toHaveLength(2));
    await waitFor(() => expect(descrizione(graficoDi('Pagato sulla dotazione'))).toContain('20 %'));
    expect(graficoDi('Dalla dotazione al residuo').opzioni.length).toBeGreaterThan(0);
    for (const p of ['domande-per-anno', 'importi-per-anno', 'sigc/domande', 'sigc/importi']) expect(letture(client, `/api/finanziario/${p}`)).toHaveLength(0);

    await userEvent.click(screen.getByRole('tab', { name: 'Domande' }));
    expect(await screen.findByRole('heading', { name: 'Domande per anno di raccolta' })).toBeTruthy();
    await waitFor(() => expect(graficoDi('Importi ammessi e decretati per anno').opzioni.length).toBeGreaterThan(0));
    expect(letture(client, '/api/finanziario/sigc/domande')).toHaveLength(0);

    await userEvent.click(screen.getByRole('tab', { name: 'SIGC' }));
    await waitFor(() => expect(graficoDi('Importi SIGC').opzioni.length).toBeGreaterThan(0));
    expect(graficoDi('Domande SIGC').opzioni.length).toBeGreaterThan(0);

    await userEvent.click(screen.getByRole('tab', { name: 'Tutte le voci' }));
    const voci = await screen.findByRole('table', { name: 'Intervento SRA01: dalla dotazione al residuo sui pagamenti' });
    expect(valoreDi(voci, 'Dotazione di spesa pubblica')).toBe('1.000.000,00 €');
    expect(valoreDi(voci, 'Stanziato')).toBe('non disponibile (fonte quadro sinottico non attiva)');
    expect(valoreDi(voci, 'Pagamenti al netto delle rettifiche')).toBe('200.000,00 €');
  });

  it('le schede si scorrono con le frecce (react-aria Tabs)', async () => {
    servi();
    conRouter(<DettaglioIntervento codice="SRA01" />);
    const sintesi = await screen.findByRole('tab', { name: 'Sintesi', selected: true });
    act(() => sintesi.focus());
    await userEvent.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: 'Domande' }).getAttribute('aria-selected')).toBe('true');
    expect(await screen.findByRole('tabpanel', { name: 'Domande' })).toBeTruthy();
  });

  it('nessuna riga nel riepilogo: stato vuoto (status) che rimanda al riepilogo, nessuna scheda', async () => {
    servi();
    server.use(rispondi('/api/finanziario/riepilogo', { perimetro: 'ADA', righe: [] }));
    conRouter(<DettaglioIntervento codice="SRA01" />);
    const vuoto = await screen.findByText(/Nessun dato per questo intervento nel tuo perimetro\./);
    expect(vuoto.closest('[role]')?.getAttribute('role')).toBe('status');
    expect(within(vuoto.closest('[role]') as HTMLElement).getByRole('link', { name: 'Torna al riepilogo' }).getAttribute('href')).toBe('/finanziario/riepilogo');
    expect(screen.getByText('Perimetro ADA')).toBeTruthy();
    expect(screen.queryByRole('tablist')).toBeNull();
  });

  it('senza il grant di TX-0011 lo dice e non legge riepilogo ne spesa (R-09)', async () => {
    servi();
    profilo('csr.tx-0001.read', 'csr.tx-0002.read');
    const client = clientDiTest();
    conRouter(<DettaglioIntervento codice="SRA01" />, '/prova', client);
    await sezioneNonDisponibile("Dettaglio dell'intervento");
    await notifiche();
    expect(letture(client, '/api/finanziario/riepilogo')).toHaveLength(0);
    expect(letture(client, '/api/finanziario/spesa-per-intervento')).toHaveLength(0);
  });

  it('senza il grant di TX-0002 la Sintesi non legge la spesa e il gauge dichiara il dato mancante', async () => {
    servi();
    profilo('csr.tx-0011.read');
    const client = clientDiTest();
    conRouter(<DettaglioIntervento codice="SRA01" />, '/prova', client);
    const gauge = await trovaCard('Pagato sulla dotazione');
    expect(within(gauge).getByText(/^Grafico non disponibile: della dotazione pagato: valore non disponibile/)).toBeTruthy();
    expect(screen.getByRole('heading', { level: 1, name: 'SRA01' })).toBeTruthy();
    await notifiche();
    expect(letture(client, '/api/finanziario/spesa-per-intervento')).toHaveLength(0);
    expect(letture(client, '/api/finanziario/filtri')).toHaveLength(0);
  });

  // regressione R-09: le letture delle schede stanno nei figli di ConGrant (prima partivano anche senza grant)
  it('senza i grant delle schede Domande e SIGC lo dicono e non leggono (R-09)', async () => {
    servi();
    profilo('csr.tx-0011.read', 'csr.tx-0002.read');
    const client = clientDiTest();
    conRouter(<DettaglioIntervento codice="SRA01" />, '/prova', client);
    await userEvent.click(await screen.findByRole('tab', { name: 'Domande' }));
    await waitFor(() => expect(screen.getAllByText(NON_DISPONIBILE_PROFILO)).toHaveLength(2));
    await notifiche();
    expect(letture(client, '/api/finanziario/domande-per-anno')).toHaveLength(0);
    expect(letture(client, '/api/finanziario/importi-per-anno')).toHaveLength(0);
  });

  it('a11y: zero violazioni axe', async () => {
    servi();
    const { container } = conRouter(<DettaglioIntervento codice="SRA01" />);
    await waitFor(() => expect(graficiVivi()).toHaveLength(2));
    await screen.findByText('Contributo ambientale 12,5 %');
    await expectNoA11yViolations(container);
  });
});

describe('RiepilogoReport (TX-0011, tabella interattiva)', () => {
  const NOME_TABELLA = /^Riepilogo per intervento \(RF011\)/;
  const tabella = () => screen.findByRole('table', { name: NOME_TABELLA });

  it('righe per intervento con importi e assenze dichiarate, colonne senza valori nascoste con la nota, totali, perimetro', async () => {
    server.use(rispondi('/api/finanziario/riepilogo', F.RIEPILOGO));
    renderConQuery(<RiepilogoReport filtri={{}} />);
    const t = await tabella();
    expect(t.querySelector('caption')?.textContent).toBe('Riepilogo per intervento (RF011): 2 righe. Clic o Invio su una riga per aprirla.');
    expect(within(t).getAllByRole('columnheader').map((c) => c.textContent?.replace(/[▲▼↕]/g, ''))).toEqual([
      'Intervento',
      'Domande presentate',
      'Dotazione spesa pubblica',
      'Risorse quota FEASR',
      'Pagamenti al netto di rettifiche',
      'Dotazione residua sui pagamenti',
    ]);
    expect(righeCorpo(t)).toEqual(['SRA01', 'SRA03']);
    expect(testo(within(t).getByRole('row', { name: "Apri l'anteprima dell'intervento SRA01" }).textContent)).toContain('1.000.000,00 €');
    // lo zero di un intervento senza pagamenti e' un dato, non un'assenza
    expect(testo(within(t).getByRole('row', { name: "Apri l'anteprima dell'intervento SRA03" }).textContent)).toContain('0,00 €');
    const totali = testo((t as HTMLTableElement).tFoot?.textContent);
    expect(totali).toContain('Totale (2 interventi)');
    expect(totali).toContain('1.500.000,00 €');
    expect(totali).toContain('1.300.000,00 €');
    expect(
      screen.getByText(
        'Colonne nascoste perché nessun intervento ha un valore (fonte non attiva o non valorizzato): Importo stanziato, Impegnato cofinanziato FEASR, Impegnato cofinanziato FEASR e non, Dotazione residua sugli impegni. Si mostrano da "Colonne".',
      ),
    ).toBeTruthy();
    expect(screen.getByText('Regionale: tutte le domande della regione')).toBeTruthy();
    const at = screen.getByRole('table', { name: 'Valore fuori tabella, indipendente dai filtri' });
    expect(testo(at.textContent)).toContain('100.000,00 €');
  });

  it("una colonna nascosta si mostra da Colonne: l'assenza e dichiarata nelle celle e il totale non e calcolabile", async () => {
    server.use(rispondi('/api/finanziario/riepilogo', F.RIEPILOGO));
    renderConQuery(<RiepilogoReport filtri={{}} />);
    const t = await tabella();
    expect(within(t).queryByRole('columnheader', { name: 'Importo stanziato' })).toBeNull();
    await userEvent.click(screen.getByText('Colonne'));
    await userEvent.click(within(screen.getByRole('group', { name: 'Colonne visibili' })).getByRole('checkbox', { name: 'Importo stanziato' }));
    expect(within(t).getByRole('columnheader', { name: 'Importo stanziato' })).toBeTruthy();
    expect(testo(within(t).getByRole('row', { name: "Apri l'anteprima dell'intervento SRA01" }).textContent)).toMatch(/non disponibile ?fonte quadro sinottico non attiva/);
    expect(testo((t as HTMLTableElement).tFoot?.textContent)).toContain('non calcolabile');
  });

  it('ordinamento per colonna con aria-sort (iniziale: dotazione decrescente)', async () => {
    server.use(rispondi('/api/finanziario/riepilogo', F.RIEPILOGO));
    renderConQuery(<RiepilogoReport filtri={{}} />);
    const t = await tabella();
    const intestazione = (nome: string) => within(t).getByRole('columnheader', { name: nome });
    expect(intestazione('Dotazione spesa pubblica').getAttribute('aria-sort')).toBe('descending');
    expect(intestazione('Intervento').getAttribute('aria-sort')).toBe('none');
    await userEvent.click(within(intestazione('Intervento')).getByRole('button'));
    expect(intestazione('Intervento').getAttribute('aria-sort')).toBe('descending');
    expect(intestazione('Dotazione spesa pubblica').getAttribute('aria-sort')).toBe('none');
    expect(righeCorpo(t)).toEqual(['SRA03', 'SRA01']);
    await userEvent.click(within(intestazione('Intervento')).getByRole('button'));
    expect(intestazione('Intervento').getAttribute('aria-sort')).toBe('ascending');
    expect(righeCorpo(t)).toEqual(['SRA01', 'SRA03']);
    await userEvent.click(within(intestazione('Domande presentate')).getByRole('button'));
    expect(righeCorpo(t)).toEqual(['SRA01', 'SRA03']);
  });

  it('ricerca: righe, caption e totali seguono il testo cercato', async () => {
    server.use(rispondi('/api/finanziario/riepilogo', F.RIEPILOGO));
    renderConQuery(<RiepilogoReport filtri={{}} />);
    const t = await tabella();
    await userEvent.type(screen.getByRole('searchbox', { name: 'Cerca nella tabella' }), 'sra03');
    expect(righeCorpo(t)).toEqual(['SRA03']);
    expect(t.querySelector('caption')?.textContent).toBe('Riepilogo per intervento (RF011): 1 riga per «sra03». Clic o Invio su una riga per aprirla.');
    expect(testo((t as HTMLTableElement).tFoot?.textContent)).toContain('500.000,00 €');
  });

  it('paginazione a 10 righe', async () => {
    const righe = Array.from({ length: 12 }, (_, n) => ({ ...F.RIEPILOGO.righe[0], codiceIntervento: `SRB${10 + n}`, dotazioneSpesaPubblica: euro((12 - n) * 100000) }));
    server.use(rispondi('/api/finanziario/riepilogo', { ...F.RIEPILOGO, righe }));
    renderConQuery(<RiepilogoReport filtri={{}} />);
    const t = await tabella();
    expect(righeCorpo(t)).toHaveLength(10);
    const pagine = screen.getByRole('navigation', { name: 'Pagine della tabella' });
    expect(pagine.textContent).toContain('Pagina 1 di 2');
    expect(within(pagine).getByRole('button', { name: 'Pagina 1' }).getAttribute('aria-current')).toBe('page');
    await userEvent.click(within(pagine).getByRole('button', { name: 'Pagina 2' }));
    expect(righeCorpo(t)).toEqual(['SRB20', 'SRB21']);
    expect(testo((t as HTMLTableElement).tFoot?.textContent)).toContain('Totale (12 interventi)');
  });

  it("clic o Invio su una riga aprono l'anteprima laterale, da cui si apre il dettaglio con gli stessi filtri", async () => {
    server.use(rispondi('/api/finanziario/riepilogo', F.RIEPILOGO));
    const { router } = conRouter(<RiepilogoReport filtri={{ intervento: ['SRA01', 'SRA03'] }} />);
    const t = await tabella();
    await userEvent.click(within(t).getByRole('row', { name: "Apri l'anteprima dell'intervento SRA03" }));
    let anteprima = await screen.findByRole('dialog', { name: 'SRA03' });
    expect(within(anteprima).getByText("Anteprima dell'intervento")).toBeTruthy();
    expect(testo(anteprima.textContent)).toContain('500.000,00 €');
    await userEvent.click(within(anteprima).getByRole('button', { name: 'Chiudi: SRA03' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());

    const riga = within(t).getByRole('row', { name: "Apri l'anteprima dell'intervento SRA01" });
    act(() => riga.focus());
    await userEvent.keyboard('{Enter}');
    anteprima = await screen.findByRole('dialog', { name: 'SRA01' });
    const dettaglio = within(anteprima).getByRole('link', { name: "Apri il dettaglio dell'intervento" });
    expect(dettaglio.getAttribute('href')).toBe('/finanziario/interventi/SRA01?intervento=SRA01&intervento=SRA03');
    await userEvent.click(dettaglio);
    await waitFor(() => expect(indirizzo(router)).toBe('/finanziario/interventi/SRA01?intervento=SRA01&intervento=SRA03'));
  });

  it("vista grafico: card con il grafico montato, tabella equivalente, clic su una barra apre l'anteprima", async () => {
    server.use(rispondi('/api/finanziario/riepilogo', F.RIEPILOGO));
    conRouter(<RiepilogoReport filtri={{}} />);
    await tabella();
    await userEvent.click(within(screen.getByRole('group', { name: 'Vista del riepilogo' })).getByRole('button', { name: 'Grafico' }));
    expect(screen.queryByRole('table', { name: NOME_TABELLA })).toBeNull();
    const titolo = 'Dotazione e pagamenti per intervento';
    await waitFor(() => expect(graficoDi(titolo).opzioni.length).toBeGreaterThan(0));
    act(() => clicSu(graficoDi(titolo), { name: 'SRA03', dataIndex: 1 }));
    expect(await screen.findByRole('dialog', { name: 'SRA03' })).toBeTruthy();
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    await vediTabella(titolo);
    const equivalente = screen.getByRole('table', { name: 'Dotazione e pagato per intervento' });
    expect(within(equivalente).getAllByRole('rowheader').map((c) => c.textContent)).toEqual(['SRA01', 'SRA03']);
  });

  it('esporta il CSV con gli stessi filtri e X-Requested-With', async () => {
    let richiesta: Request | undefined;
    server.use(
      rispondi('/api/finanziario/riepilogo', F.RIEPILOGO),
      http.get('*/api/finanziario/riepilogo/csv', ({ request }) => {
        richiesta = request;
        return new HttpResponse('intervento;dotazione\nSRA01;1000000', { headers: { 'Content-Type': 'text/csv' } });
      }),
    );
    URL.createObjectURL = vi.fn(() => 'blob:prova');
    URL.revokeObjectURL = vi.fn();
    const clic = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    renderConQuery(<RiepilogoReport filtri={{ intervento: ['SRA01'] }} />);
    await userEvent.click(await screen.findByRole('button', { name: 'Esporta la tabella in CSV' }));
    expect(await screen.findByText('File CSV scaricato.')).toBeTruthy();
    expect(new URL(richiesta?.url ?? 'http://x').search).toBe('?intervento=SRA01');
    expect(richiesta?.headers.get('X-Requested-With')).toBe('XMLHttpRequest');
    expect(clic).toHaveBeenCalledTimes(1);
    expect((clic.mock.contexts[0] as HTMLAnchorElement).download).toBe('riepilogo-finanziario.csv');
  });

  it("errore dell'esportazione classificato sul problem-type, in linea, senza perdere la tabella", async () => {
    server.use(
      rispondi('/api/finanziario/riepilogo', F.RIEPILOGO),
      http.get('*/api/finanziario/riepilogo/csv', () =>
        HttpResponse.json(problema(403, 'ACCESSO_NEGATO'), { status: 403, headers: { 'Content-Type': 'application/problem+json' } }),
      ),
    );
    renderConQuery(<RiepilogoReport filtri={{}} />);
    await userEvent.click(await screen.findByRole('button', { name: 'Esporta la tabella in CSV' }));
    const avviso = await screen.findByRole('alert');
    expect(avviso.textContent).toBe('Non hai i permessi per consultare questi dati.');
    expect(avviso.closest('.ui-strumenti')).toBeTruthy();
    expect(screen.getByRole('table', { name: NOME_TABELLA })).toBeTruthy();
  });

  it('vuoto (status) ed errore (alert) sono rami distinti; senza righe la dotazione AT resta e il CSV no', async () => {
    server.use(rispondi('/api/finanziario/riepilogo', { perimetro: 'REGIONALE', dotazioneAssistenzaTecnica: { valore: 100000 }, righe: [] }));
    const { unmount } = renderConQuery(<RiepilogoReport filtri={{ intervento: ['SRA01'] }} />);
    expect((await screen.findByText(VUOTO_INTERVENTI)).closest('[role]')?.getAttribute('role')).toBe('status');
    const at = screen.getByRole('table', { name: 'Valore fuori tabella, indipendente dai filtri' });
    expect(testo(at.textContent)).toContain('intero programma: non dipende dai filtri');
    expect(testo(at.textContent)).toContain('100.000,00 €');
    expect(screen.queryByRole('button', { name: 'Esporta la tabella in CSV' })).toBeNull();
    unmount();
    // 429 non si riprova (CAPACITA_ESAURITA si', con Retry-After): basta a provare il ramo errore
    server.use(rispondi('/api/finanziario/riepilogo', problema(429, 'TROPPE_RICHIESTE'), 429));
    renderConQuery(<RiepilogoReport filtri={{}} />);
    expect((await screen.findByRole('alert')).textContent).toContain('Troppe richieste');
  });

  it('perimetro ADA: colonne di programma dichiarate regionali con la nota del perimetro misto; vuoto che nomina la propria area', async () => {
    server.use(rispondi('/api/finanziario/riepilogo', { ...F.RIEPILOGO, perimetro: 'ADA' }));
    const { unmount } = renderConQuery(<RiepilogoReport filtri={{}} />);
    const t = await tabella();
    expect(within(t).getByRole('columnheader', { name: 'Dotazione spesa pubblica (regionale)' })).toBeTruthy();
    expect(within(t).getByRole('columnheader', { name: 'Risorse quota FEASR (regionale)' })).toBeTruthy();
    expect(within(t).getByRole('columnheader', { name: 'Pagamenti al netto di rettifiche' })).toBeTruthy();
    expect(screen.getByText(/i due valori non sono confrontabili/)).toBeTruthy();
    expect(screen.getByText('Perimetro ADA')).toBeTruthy();
    unmount();
    server.use(rispondi('/api/finanziario/riepilogo', { perimetro: 'ADA', righe: [] }));
    renderConQuery(<RiepilogoReport filtri={{}} />);
    expect(await screen.findByText(/Nessun dato nella tua area \(perimetro ADA\)/)).toBeTruthy();
  });

  it('a11y: zero violazioni axe', async () => {
    server.use(rispondi('/api/finanziario/riepilogo', F.RIEPILOGO));
    const { container } = renderConQuery(<RiepilogoReport filtri={{}} />);
    await tabella();
    await expectNoA11yViolations(container);
  });
});

describe('DotazioneReport (TX-0002, TX-0003)', () => {
  const servi = () => server.use(rispondi('/api/finanziario/spesa-per-intervento', F.SPESA), rispondi('/api/finanziario/distribuzione-dotazione', F.DISTRIBUZIONE));
  const QUOTE = 'Dotazione tra quota FEASR e non FEASR (RF003)';

  it('tre card con il grafico montato, opzioni dai builder, tabella interattiva per intervento', async () => {
    servi();
    conRouter(<DotazioneReport filtri={{}} />);
    await waitFor(() => expect(graficiVivi()).toHaveLength(3));
    expect(graficoDi('Dotazione e pagamenti per intervento').opzioni.length).toBeGreaterThan(0);
    expect(graficoDi('Contributo ambientale per intervento').opzioni.length).toBeGreaterThan(0);
    expect(ultimeOpzioni(graficoDi(QUOTE))).toMatchObject(graficoQuotaFeasr(F.DISTRIBUZIONE).opzioni as object);
    const t = screen.getByRole('table', { name: /^Dotazione, impegni e pagamenti per intervento/ });
    expect(within(t).getByRole('rowheader', { name: 'SRA01' })).toBeTruthy();
    expect(testo(within(t).getByRole('row', { name: /SRA01/ }).textContent)).toContain('12,5 %');
    expect(screen.getByText(/^Colonne nascoste perché nessun intervento ha un valore \(fonte non attiva\): Impegnato cofinanziato FEASR e non, Impegnato spesa pubblica, Vincolo dotazione LEADER\./)).toBeTruthy();
    await vediTabella(QUOTE);
    const equivalente = screen.getByRole('table', { name: 'Dotazione: quota FEASR e quota non FEASR' });
    expect(testo(within(equivalente).getByRole('row', { name: /^Quota FEASR/ }).textContent)).toContain('40 %');
  });

  it('drill-down: clic su una barra o su una riga apre il dettaglio dell intervento con i filtri', async () => {
    servi();
    const primo = conRouter(<DotazioneReport filtri={{ og: ['OG2'] }} />);
    await waitFor(() => expect(graficiVivi()).toHaveLength(3));
    act(() => clicSu(graficoDi('Contributo ambientale per intervento'), { name: 'SRA01', dataIndex: 0 }));
    await waitFor(() => expect(indirizzo(primo.router)).toBe('/finanziario/interventi/SRA01?og=OG2'));
    primo.unmount();
    servi();
    const secondo = conRouter(<DotazioneReport filtri={{}} />);
    await userEvent.click(await screen.findByRole('row', { name: "Apri il dettaglio dell'intervento SRA01" }));
    await waitFor(() => expect(indirizzo(secondo.router)).toBe('/finanziario/interventi/SRA01'));
  });

  it('selezione senza interventi: stato vuoto invece di zeri, anche per le quote (segnale da TX-0002)', async () => {
    server.use(
      rispondi('/api/finanziario/spesa-per-intervento', { perimetro: 'REGIONALE', righe: [] }),
      rispondi('/api/finanziario/distribuzione-dotazione', { perimetro: 'REGIONALE', dotazioneSpesaPubblica: ZERO, quotaFeasr: ZERO, quotaNonFeasr: ZERO }),
    );
    conRouter(<DotazioneReport filtri={{ intervento: ['SRA99'] }} />);
    await waitFor(() => expect(screen.getAllByText(VUOTO_INTERVENTI)).toHaveLength(2));
    expect(screen.queryByText(/0,00/)).toBeNull();
    expect(graficiVivi()).toHaveLength(0);
  });

  it('con TX-0002 ancora in attesa le quote restano in caricamento, senza mostrare prima i valori (R-15)', async () => {
    server.use(rispondi('/api/finanziario/distribuzione-dotazione', F.DISTRIBUZIONE));
    const rilascia = trattenuta('/api/finanziario/spesa-per-intervento', { perimetro: 'REGIONALE', righe: [] });
    const client = clientDiTest();
    conRouter(<DotazioneReport filtri={{ intervento: ['SRA99'] }} />, '/prova', client);
    await waitFor(() => expect(lettaConSuccesso(client, '/api/finanziario/distribuzione-dotazione')).toBe(true));
    await notifiche();
    expect(screen.getAllByText('Caricamento in corso…')).toHaveLength(2);
    expect(screen.queryByRole('region', { name: QUOTE })).toBeNull();
    await rilascia();
    await waitFor(() => expect(screen.getAllByText(VUOTO_INTERVENTI)).toHaveLength(2));
  });

  it('un intervento con dotazione 0,00 (come SRG08) non e uno stato vuoto: il grafico dice perche non si disegna', async () => {
    server.use(
      rispondi('/api/finanziario/spesa-per-intervento', { perimetro: 'REGIONALE', righe: [{ ...F.SPESA.righe[0], codiceIntervento: 'SRG08', dotazioneSpesaPubblica: ZERO, pagamentiTotali: ZERO }] }),
      rispondi('/api/finanziario/distribuzione-dotazione', { perimetro: 'REGIONALE', dotazioneSpesaPubblica: ZERO, quotaFeasr: ZERO, quotaNonFeasr: ZERO }),
    );
    conRouter(<DotazioneReport filtri={{ intervento: ['SRG08'] }} />);
    expect(await screen.findByRole('rowheader', { name: 'SRG08' })).toBeTruthy();
    const quote = await trovaCard(QUOTE);
    expect(within(quote).getByText('Grafico non disponibile: quote FEASR e non FEASR entrambe pari a zero: la ciambella non si può disegnare.')).toBeTruthy();
    // grafico non disegnabile: la tabella equivalente e' subito visibile
    expect(within(quote).getByRole('table', { name: 'Dotazione: quota FEASR e quota non FEASR' })).toBeTruthy();
    expect(screen.queryByText(VUOTO_INTERVENTI)).toBeNull();
  });

  it("perimetro ADA: il grafico per intervento non affianca la dotazione regionale ai pagamenti dell'area e lo dichiara", async () => {
    server.use(rispondi('/api/finanziario/spesa-per-intervento', { ...F.SPESA, perimetro: 'ADA' }), rispondi('/api/finanziario/distribuzione-dotazione', F.DISTRIBUZIONE));
    conRouter(<DotazioneReport filtri={{}} />);
    const titolo = 'Dotazione e pagamenti per intervento';
    await waitFor(() => expect(graficoDi(titolo).opzioni.length).toBeGreaterThan(0));
    const barre = card(titolo);
    expect(within(barre).getByText('1 voce non nel grafico')).toBeTruthy();
    expect(within(barre).getByText("Perimetro ADA: la dotazione regionale non si affianca ai pagamenti dell'area")).toBeTruthy();
    await vediTabella(titolo);
    expect(within(barre).getByRole('table', { name: 'Pagato per intervento' })).toBeTruthy();
    expect(screen.getByRole('columnheader', { name: 'Dotazione spesa pubblica (regionale)' })).toBeTruthy();
    expect(screen.getByRole('columnheader', { name: 'Pagamenti totali (elenchi di liquidazione)' })).toBeTruthy();
    expect(screen.getByText(/i due valori non sono confrontabili/)).toBeTruthy();
  });

  it('senza il grant di TX-0003 la sezione delle quote lo dice e non legge (R-09)', async () => {
    servi();
    profilo('csr.tx-0002.read');
    const client = clientDiTest();
    conRouter(<DotazioneReport filtri={{}} />, '/prova', client);
    await sezioneNonDisponibile(QUOTE);
    await screen.findByRole('rowheader', { name: 'SRA01' });
    expect(letture(client, '/api/finanziario/distribuzione-dotazione')).toHaveLength(0);
  });

  it('senza il grant di TX-0002 non legge la spesa (nemmeno come segnale) e le quote mostrano i dati', async () => {
    servi();
    profilo('csr.tx-0003.read');
    const client = clientDiTest();
    conRouter(<DotazioneReport filtri={{}} />, '/prova', client);
    await sezioneNonDisponibile('Spesa pubblica per intervento (RF002)');
    await waitFor(() => expect(graficoDi(QUOTE).opzioni.length).toBeGreaterThan(0));
    expect(letture(client, '/api/finanziario/spesa-per-intervento')).toHaveLength(0);
  });

  it('a11y: zero violazioni axe', async () => {
    servi();
    const { container } = conRouter(<DotazioneReport filtri={{}} />);
    await waitFor(() => expect(graficiVivi()).toHaveLength(3));
    await expectNoA11yViolations(container);
  });
});

describe('AvanzamentoReport (TX-0004..TX-0007)', () => {
  const RF004 = 'Importo stanziato e da stanziare (RF004)';
  const RF005 = "Pagamenti sull'impegnato (RF005)";
  const RF006 = 'Dotazione residua sugli impegni (RF006)';
  const RF007 = 'Dotazione residua sui pagamenti (RF007)';
  const SEZIONI = [RF004, RF005, RF006, RF007];
  const servi = () =>
    server.use(
      rispondi('/api/finanziario/stanziato', F.STANZIATO),
      rispondi('/api/finanziario/pagamenti-su-impegnato', F.PAGAMENTI),
      rispondi('/api/finanziario/residuo-impegni', F.RESIDUO_IMPEGNI),
      rispondi('/api/finanziario/residuo-pagamenti', F.RESIDUO_PAGAMENTI),
      rispondi('/api/finanziario/spesa-per-intervento', F.SPESA),
    );
  it('KPI con le assenze dichiarate (mai zeri) e i valori presenti', async () => {
    servi();
    renderConQuery(<AvanzamentoReport filtri={{}} />);
    await regioneContiene('Importo stanziato', 'Non disponibile: fonte quadro sinottico non attiva');
    await regioneContiene('Importo stanziato', 'dato di programma (regionale)');
    await regioneContiene('Totale impegnato', 'Non disponibile: fonte impegni non attiva');
    await regioneContiene('Importo pagato', '0,2 M€');
    await regioneContiene('Dotazione residua sui pagamenti', '0,8 M€');
  });

  it('quattro sezioni a card; senza tutte e due le parti la ciambella non inventa proporzioni e la tabella mostra cio che c e', async () => {
    servi();
    renderConQuery(<AvanzamentoReport filtri={{}} />);
    const rf004 = await trovaCard(RF004);
    expect(
      within(rf004).getByText(
        'Grafico non disponibile: manca una delle due parti (Importo stanziato: non disponibile (fonte quadro sinottico non attiva); Importo da stanziare: non disponibile (fonte quadro sinottico non attiva)).',
      ),
    ).toBeTruthy();
    const rf005 = await trovaCard(RF005);
    expect(within(rf005).getByText('Grafico non disponibile: manca una delle due parti (Impegnato ancora da pagare: non disponibile (fonte impegni non attiva)).')).toBeTruthy();
    expect(valoreDi(within(rf005).getByRole('table'), 'Pagamenti totali (elenchi di liquidazione)')).toBe('200.000,00 €');
    expect(within(await trovaCard(RF006)).getByText(/^Grafico non disponibile: manca una delle due parti/)).toBeTruthy();
    await waitFor(() => expect(descrizione(graficoDi(RF007))).toBe('Dotazione tra pagato e residuo: Pagamenti al netto di rettifiche 20 %, Dotazione residua 80 %.'));
    for (const s of [RF004, RF005, RF006]) expect(() => graficoDi(s)).toThrow();
    await vediTabella(RF007);
    expect(valoreDi(within(card(RF007)).getByRole('table'), 'Importo recuperato')).toBe('20.000,00 €');
  });

  it('flussi: sankey non disegnato con gli impegni da fonte non attiva, gauge del pagato sulla dotazione disegnato', async () => {
    servi();
    renderConQuery(<AvanzamentoReport filtri={{}} />);
    const sankey = await trovaCard('Dove va la dotazione');
    expect(within(sankey).getByText("Grafico non disponibile: impegni da fonte non attiva: il flusso dalla dotazione all'impegnato non si può disegnare.")).toBeTruthy();
    expect(valoreDi(within(sankey).getByRole('table', { name: "Dalla dotazione all'impegnato e al pagato" }), 'Da impegnare (dotazione meno impegnato)')).toBe('non calcolabile');
    await waitFor(() => expect(descrizione(graficoDi('Pagato sulla dotazione'))).toContain('22 %'));
  });

  it('perimetro per sezione: dati di programma regionali accanto a misure ADA', async () => {
    servi();
    server.use(rispondi('/api/finanziario/pagamenti-su-impegnato', { ...F.PAGAMENTI, perimetro: 'ADA' }));
    renderConQuery(<AvanzamentoReport filtri={{}} />);
    await waitFor(() => expect(within(card(RF005)).getByText('Fonte: TX-0005 · Perimetro ADA')).toBeTruthy());
    expect(within(card(RF004)).getByText('Fonte: TX-0004 · Perimetro REGIONALE')).toBeTruthy();
  });

  it('perimetro ADA su RF007: sottotitolo che dichiara i valori non confrontabili, dotazione dichiarata regionale', async () => {
    servi();
    server.use(rispondi('/api/finanziario/residuo-pagamenti', { ...F.RESIDUO_PAGAMENTI, perimetro: 'ADA' }));
    renderConQuery(<AvanzamentoReport filtri={{}} />);
    await waitFor(() => expect(graficoDi(RF007).opzioni.length).toBeGreaterThan(0));
    expect(within(card(RF007)).getByText(/La dotazione è regionale, i pagamenti sono della tua area: non confrontabili\./)).toBeTruthy();
    await vediTabella(RF007);
    expect(within(card(RF007)).getByRole('rowheader', { name: 'Dotazione spesa pubblica (regionale)' })).toBeTruthy();
  });

  // regressione: col perimetro ADA il gauge non divide i pagamenti dell'area per la dotazione regionale
  it('perimetro ADA: il gauge del pagato sulla dotazione non si disegna (non confrontabile)', async () => {
    servi();
    server.use(rispondi('/api/finanziario/residuo-pagamenti', { ...F.RESIDUO_PAGAMENTI, perimetro: 'ADA' }));
    renderConQuery(<AvanzamentoReport filtri={{}} />);
    await waitFor(() => expect(graficoDi(RF007).opzioni.length).toBeGreaterThan(0));
    expect(() => graficoDi('Pagato sulla dotazione')).toThrow();
    expect(within(card('Pagato sulla dotazione')).getByText(/^Grafico non disponibile/)).toBeTruthy();
  });

  it('selezione senza interventi (righe di TX-0002): quattro stati vuoti', async () => {
    servi();
    server.use(rispondi('/api/finanziario/spesa-per-intervento', { perimetro: 'REGIONALE', righe: [] }));
    renderConQuery(<AvanzamentoReport filtri={{ intervento: ['SRA99'] }} />);
    await waitFor(() => expect(screen.getAllByText(VUOTO_INTERVENTI)).toHaveLength(4));
    for (const s of SEZIONI) expect(screen.queryByRole('region', { name: s })).toBeNull();
  });

  it('con TX-0002 ancora in attesa le quattro sezioni restano in caricamento, senza mostrare prima i valori (R-15)', async () => {
    servi();
    const rilascia = trattenuta('/api/finanziario/spesa-per-intervento', { perimetro: 'REGIONALE', righe: [] });
    const client = clientDiTest();
    renderConQuery(<AvanzamentoReport filtri={{ intervento: ['SRA99'] }} />, client);
    const sezioni = ['stanziato', 'pagamenti-su-impegnato', 'residuo-impegni', 'residuo-pagamenti'].map((s) => `/api/finanziario/${s}`);
    await waitFor(() => expect(sezioni.every((p) => lettaConSuccesso(client, p))).toBe(true));
    await notifiche();
    // le quattro sezioni e un solo caricamento per KPI e flussi
    expect(screen.getAllByText('Caricamento in corso…')).toHaveLength(5);
    for (const s of SEZIONI) expect(screen.queryByRole('region', { name: s })).toBeNull();
    expect(screen.queryByText(/manca una delle due parti/)).toBeNull();
    await rilascia();
    await waitFor(() => expect(screen.getAllByText(VUOTO_INTERVENTI)).toHaveLength(4));
  });

  // regressione R-15: KPI e flussi seguono il segnale di TX-0002 come le quattro sezioni (prima mostravano gli zeri)
  it('selezione senza interventi: nemmeno KPI e flussi mostrano zeri', async () => {
    servi();
    server.use(
      rispondi('/api/finanziario/spesa-per-intervento', { perimetro: 'REGIONALE', righe: [] }),
      rispondi('/api/finanziario/residuo-pagamenti', {
        perimetro: 'REGIONALE',
        dotazioneSpesaPubblica: ZERO,
        importoPagato: ZERO,
        importoRecuperato: ZERO,
        pagamentiNettoRettifiche: ZERO,
        dotazioneResidua: ZERO,
      }),
    );
    renderConQuery(<AvanzamentoReport filtri={{ intervento: ['SRA99'] }} />);
    await waitFor(() => expect(screen.getAllByText(VUOTO_INTERVENTI)).toHaveLength(4));
    expect(screen.queryAllByText('0,0 M€')).toHaveLength(0);
    expect(screen.queryAllByText(/0,00.€/)).toHaveLength(0);
  });

  it('importi a zero con interventi nella selezione: dati, non stato vuoto', async () => {
    servi();
    server.use(rispondi('/api/finanziario/stanziato', { perimetro: 'REGIONALE', importoStanziato: ZERO, importoDaStanziare: ZERO }));
    renderConQuery(<AvanzamentoReport filtri={{}} />);
    const rf004 = await trovaCard(RF004);
    expect(within(rf004).getByText('Grafico non disponibile: il totale è zero.')).toBeTruthy();
    expect(valoreDi(within(rf004).getByRole('table'), 'Importo stanziato')).toBe('0,00 €');
    await regioneContiene('Importo stanziato', '0,0 M€');
    expect(screen.queryByText(VUOTO_INTERVENTI)).toBeNull();
  });

  it('un totale NON_VALORIZZATO e "non calcolabile" e rimanda al riepilogo per intervento', async () => {
    servi();
    server.use(rispondi('/api/finanziario/residuo-impegni', { ...F.RESIDUO_IMPEGNI, importoImpegnato: { valore: null, motivo: 'NON_VALORIZZATO', fonte: null } }));
    renderConQuery(<AvanzamentoReport filtri={{}} />);
    const rf006 = await trovaCard(RF006);
    expect(valoreDi(within(rf006).getByRole('table'), 'Importo impegnato')).toBe(
      'non calcolabile (manca per almeno un intervento della selezione: vedi il riepilogo per intervento)',
    );
  });

  it('senza il grant di TX-0005 il KPI, la sezione e il flusso della dotazione (che usa TX-0005) lo dicono, le altre sezioni restano', async () => {
    servi();
    profilo('csr.tx-0004.read', 'csr.tx-0006.read', 'csr.tx-0007.read');
    renderConQuery(<AvanzamentoReport filtri={{}} />);
    await waitFor(() => expect(screen.getAllByText(NON_DISPONIBILE_PROFILO)).toHaveLength(3));
    expect(within(card(RF005)).getByText(NON_DISPONIBILE_PROFILO)).toBeTruthy();
    expect(within(card('Totale impegnato')).getByText(NON_DISPONIBILE_PROFILO)).toBeTruthy();
    expect(within(card('Dove va la dotazione')).getByText(NON_DISPONIBILE_PROFILO)).toBeTruthy();
    await waitFor(() => expect(graficoDi(RF007).opzioni.length).toBeGreaterThan(0));
  });

  // regressione R-09: KPI e flussi leggono nei figli di ConGrant (prima leggevano TX-0005 anche senza il grant)
  it('senza il grant di TX-0005 non si legge TX-0005 (R-09)', async () => {
    servi();
    profilo('csr.tx-0004.read', 'csr.tx-0006.read', 'csr.tx-0007.read');
    const client = clientDiTest();
    renderConQuery(<AvanzamentoReport filtri={{}} />, client);
    await waitFor(() => expect(lettaConSuccesso(client, '/api/finanziario/residuo-pagamenti')).toBe(true));
    await notifiche();
    expect(letture(client, '/api/finanziario/pagamenti-su-impegnato')).toHaveLength(0);
  });

  it('a11y: zero violazioni axe', async () => {
    servi();
    const { container } = renderConQuery(<AvanzamentoReport filtri={{}} />);
    await waitFor(() => expect(graficoDi(RF007).opzioni.length).toBeGreaterThan(0));
    await expectNoA11yViolations(container);
  });
});

describe('DomandeReport (TX-0008..TX-0010)', () => {
  const RF008 = 'Domande per anno di raccolta (RF008)';
  const RF010 = 'Importi per anno di raccolta (RF010)';
  const servi = () =>
    server.use(
      rispondi('/api/finanziario/totale-domande', F.TOTALE_DOMANDE),
      rispondi('/api/finanziario/domande-per-anno', F.DOMANDE_PER_ANNO),
      rispondi('/api/finanziario/importi-per-anno', F.IMPORTI_PER_ANNO),
    );

  it('KPI dei totali, due card con il grafico e le tabelle di dettaglio con la riga senza campagna', async () => {
    servi();
    renderConQuery(<DomandeReport filtri={{}} />);
    // it-IT non raggruppa le migliaia nei numeri di quattro cifre
    await regioneContiene('Domande presentate', '1200');
    expect(testo(screen.getByRole('region', { name: 'di cui prima annualità' }).textContent)).toContain('400');
    expect(screen.getByText('Totale domande presentate (RF009) · Perimetro REGIONALE')).toBeTruthy();
    await waitFor(() => expect(graficiVivi()).toHaveLength(2));
    expect(graficoDi(RF008).opzioni.length).toBeGreaterThan(0);
    expect(graficoDi(RF010).opzioni.length).toBeGreaterThan(0);
    expect(screen.getAllByRole('rowheader', { name: 'senza campagna' })).toHaveLength(2);
    const importi = screen.getByRole('table', { name: 'Importi per anno di raccolta' });
    expect(within(importi).getByRole('columnheader', { name: 'Importo decretato (elenchi di liquidazione, come i pagamenti totali di RF005)' })).toBeTruthy();
    expect(testo(importi.textContent)).toMatch(/non disponibile ?fonte quadro sinottico non attiva/);
    await vediTabella(RF010);
    expect(within(card(RF010)).getByRole('table', { name: 'Importo ammesso e decretato per anno di raccolta' })).toBeTruthy();
  });

  it('perimetro ADA senza domande: lo stato vuoto (status) nomina la propria area', async () => {
    servi();
    server.use(rispondi('/api/finanziario/domande-per-anno', { perimetro: 'ADA', righe: [] }));
    renderConQuery(<DomandeReport filtri={{}} />);
    const vuoto = await screen.findByText(/Nessun dato nella tua area \(perimetro ADA\)/);
    const stato = vuoto.closest('[role]') as HTMLElement;
    expect(stato.getAttribute('role')).toBe('status');
    expect(within(stato).getByText('Perimetro ADA')).toBeTruthy();
    expect(() => graficoDi(RF008)).toThrow();
  });

  it('senza il grant di TX-0009 il totale lo dice e non legge; le altre sezioni restano', async () => {
    servi();
    profilo('csr.tx-0008.read', 'csr.tx-0010.read');
    const client = clientDiTest();
    renderConQuery(<DomandeReport filtri={{}} />, client);
    await sezioneNonDisponibile('Totale domande presentate (RF009)');
    await waitFor(() => expect(graficiVivi()).toHaveLength(2));
    expect(letture(client, '/api/finanziario/totale-domande')).toHaveLength(0);
  });

  it('a11y: zero violazioni axe', async () => {
    servi();
    const { container } = renderConQuery(<DomandeReport filtri={{}} />);
    await waitFor(() => expect(graficiVivi()).toHaveLength(2));
    await screen.findByRole('region', { name: 'Domande presentate' });
    await expectNoA11yViolations(container);
  });
});

describe('SigcReport (TX-0012, TX-0013)', () => {
  const RF012 = 'Domande SIGC (RF012)';
  const RF013 = 'Importi SIGC (RF013)';
  const servi = () => server.use(rispondi('/api/finanziario/sigc/domande', F.SIGC_DOMANDE), rispondi('/api/finanziario/sigc/importi', F.SIGC_IMPORTI));
  const VUOTO_SIGC = 'Nessuna domanda SIGC per i filtri scelti. Modifica i filtri.';

  it('imbuto e cascata montati, voci in tabella con la nota delle fonti diverse', async () => {
    servi();
    renderConQuery(<SigcReport filtri={{}} />);
    const domande = await screen.findByRole('table', { name: 'Domande SIGC' });
    expect(valoreDi(domande, 'Presentate')).toBe('800');
    expect(valoreDi(domande, 'Pagate (con pagamento in un elenco di liquidazione)')).toBe('500');
    const importi = await screen.findByRole('table', { name: 'Importi SIGC' });
    expect(valoreDi(importi, 'Importo ammesso')).toBe('4.500.000,00 €');
    expect(valoreDi(importi, 'Importo pagato (flusso ASR2-20)')).toBe('3.000.000,00 €');
    expect(screen.getAllByText(/^Fonti diverse: .* possono non coincidere/)).toHaveLength(2);
    await waitFor(() => expect(graficiVivi()).toHaveLength(2));
    expect(graficoDi(RF012).opzioni.length).toBeGreaterThan(0);
    await vediTabella(RF013);
    expect(within(card(RF013)).getByRole('table', { name: 'Importi delle domande SIGC: dal richiesto al pagato' })).toBeTruthy();
  });

  it('importi a zero con domande presentate: dati, non stato vuoto', async () => {
    server.use(
      rispondi('/api/finanziario/sigc/domande', F.SIGC_DOMANDE),
      rispondi('/api/finanziario/sigc/importi', { ...F.SIGC_IMPORTI, richiesto: ZERO, ammesso: ZERO, pagato: ZERO, ancoraDaPagare: ZERO, domandeSenza: { richiesto: 0, ammesso: 0, pagato: 0 } }),
    );
    renderConQuery(<SigcReport filtri={{}} />);
    expect(valoreDi(await screen.findByRole('table', { name: 'Importi SIGC' }), 'Importo richiesto')).toBe('0,00 €');
    expect(screen.queryByText(VUOTO_SIGC)).toBeNull();
  });

  it('nessuna domanda SIGC nella selezione: stato vuoto del wireframe per domande e importi, non zeri', async () => {
    server.use(
      rispondi('/api/finanziario/sigc/domande', { perimetro: 'REGIONALE', presentate: 0, pagate: 0, daPagare: 0 }),
      rispondi('/api/finanziario/sigc/importi', { perimetro: 'REGIONALE', richiesto: ZERO, ammesso: ZERO, pagato: ZERO, ancoraDaPagare: ZERO, domandeSenza: { richiesto: 0, ammesso: 0, pagato: 0 } }),
    );
    renderConQuery(<SigcReport filtri={{ intervento: ['SRA99'] }} />);
    await waitFor(() => expect(screen.getAllByText(VUOTO_SIGC)).toHaveLength(2));
    expect(screen.queryAllByText(/0,00.€/)).toHaveLength(0);
    expect(graficiVivi()).toHaveLength(0);
  });

  it('con il solo grant degli importi non legge le domande SIGC, nemmeno per il segnale di vuoto (R-09)', async () => {
    servi();
    profilo('csr.tx-0013.read');
    const client = clientDiTest();
    renderConQuery(<SigcReport filtri={{}} />, client);
    expect(valoreDi(await screen.findByRole('table', { name: 'Importi SIGC' }), 'Importo ammesso')).toBe('4.500.000,00 €');
    await sezioneNonDisponibile(RF012);
    expect(letture(client, '/api/finanziario/sigc/domande')).toHaveLength(0);
  });

  it('con TX-0012 ancora in attesa gli importi restano in caricamento, senza mostrare prima i valori (R-15)', async () => {
    servi();
    const rilascia = trattenuta('/api/finanziario/sigc/domande', F.SIGC_DOMANDE);
    const client = clientDiTest();
    renderConQuery(<SigcReport filtri={{}} />, client);
    await waitFor(() => expect(lettaConSuccesso(client, '/api/finanziario/sigc/importi')).toBe(true));
    await notifiche();
    expect(screen.queryByRole('table', { name: 'Importi SIGC' })).toBeNull();
    expect(screen.getAllByText('Caricamento in corso…')).toHaveLength(2);
    expect(graficiVivi()).toHaveLength(0);
    await rilascia();
    expect(valoreDi(await screen.findByRole('table', { name: 'Importi SIGC' }), 'Importo ammesso')).toBe('4.500.000,00 €');
  });

  it('a11y: zero violazioni axe', async () => {
    servi();
    const { container } = renderConQuery(<SigcReport filtri={{}} />);
    await screen.findByRole('table', { name: 'Importi SIGC' });
    await waitFor(() => expect(graficiVivi()).toHaveLength(2));
    await expectNoA11yViolations(container);
  });
});

describe('RiservaReport (TX-0014)', () => {
  it('senza anno chiede di sceglierlo e non legge; la scelta si applica con Mostra', async () => {
    const onCambia = vi.fn();
    const client = clientDiTest();
    renderConQuery(<RiservaReport anno={undefined} onCambiaAnno={onCambia} />, client);
    expect(screen.getByRole('status').textContent).toBe("Scegli l'anno della riserva da consultare.");
    await userEvent.selectOptions(screen.getByLabelText('Anno della riserva (anno n)'), '2025');
    expect(onCambia).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole('button', { name: 'Mostra' }));
    expect(onCambia).toHaveBeenCalledWith(2025);
    expect(client.getQueryCache().getAll().filter((q) => String(q.queryKey[0]).startsWith('/api/finanziario/riserva'))).toHaveLength(0);
  });

  it('il 404 NOT_FOUND e uno stato vuoto spiegato (status), non un errore', async () => {
    server.use(rispondi('/api/finanziario/riserva/2025', problema(404, 'NOT_FOUND'), 404));
    renderConQuery(<RiservaReport anno={2025} onCambiaAnno={nessunaAzione} />);
    const vuoto = await screen.findByText('Nessun dato di riserva per il 2025: i movimenti della riserva non sono ancora stati acquisiti.');
    expect(vuoto.closest('[role]')?.getAttribute('role')).toBe('status');
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('un errore diverso dal 404 NOT_FOUND resta un errore (alert)', async () => {
    server.use(rispondi('/api/finanziario/riserva/2025', problema(403, 'ACCESSO_NEGATO'), 403));
    renderConQuery(<RiservaReport anno={2025} onCambiaAnno={nessunaAzione} />);
    expect((await screen.findByRole('alert')).textContent).toContain('Non hai i permessi');
  });

  it('scenario SC-FI_RISERVA: fase di oggi, importi dell estrazione dichiarati, residuo disponibile, utilizzo progressivo', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2027, 1, 1));
    try {
      server.use(rispondi('/api/finanziario/riserva/2025', F.RISERVA));
      renderConQuery(<RiservaReport anno={2025} onCambiaAnno={nessunaAzione} />);
      const valori = await screen.findByRole('table', { name: "Riserva dell'anno 2025: valori all'estrazione del 31/12/2026" });
      expect(valoreDi(valori, 'Fase (calcolata al giorno della consultazione)')).toBe('residuo (2% del montante, dal 1/1/2027)');
      expect(screen.getByText(/precedente all'inizio della fase attuale/)).toBeTruthy();
      expect(valoreDi(valori, 'Residuo disponibile')).toBe('200,00 €');
      expect(valori.textContent).not.toContain('previsto');
      expect(within(valori).getByText('fonte regola n+2 e vincolo di pagamento entro ottobre non attiva')).toBeTruthy();
      expect(screen.getByText('Regionale: tutte le domande della regione')).toBeTruthy();
      expect(within(screen.getByRole('table', { name: 'Utilizzo progressivo' })).getAllByRole('rowheader').map((c) => c.textContent)).toEqual(['15/07/2026', '10/09/2026']);
      const titolo = 'Utilizzo progressivo cumulato della riserva';
      await waitFor(() => expect(graficoDi(titolo).opzioni.length).toBeGreaterThan(0));
      await vediTabella(titolo);
      expect(screen.getByRole('table', { name: /^Utilizzo progressivo della riserva \(riserva accumulata: 500,00.€\)$/ })).toBeTruthy();
    } finally {
      vi.useRealTimers();
    }
  });

  it('istantanea prima del congelamento: congelato e residuo spiegati con le date; utilizzo oltre la riserva segnalato', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 4, 10));
    try {
      server.use(
        rispondi('/api/finanziario/riserva/2025', { ...F.RISERVA, fase: 'ACCUMULO', dataEstrazione: '2026-05-06', importoCongelato: null, importoResiduoDisponibile: null, importoUtilizzato: 600, utilizzoProgressivo: [] }),
      );
      renderConQuery(<RiservaReport anno={2025} onCambiaAnno={nessunaAzione} />);
      expect(await screen.findByText('accumulo (dal 1/10/2025 al 30/6/2026)')).toBeTruthy();
      expect(screen.getByText("non ancora congelato all'estrazione del 06/05/2026: si congela al 30/6/2026")).toBeTruthy();
      expect(screen.getByText(/non ancora calcolato .* al congelamento del 30\/6\/2026/)).toBeTruthy();
      expect(screen.getByText(/L'importo utilizzato supera la riserva/)).toBeTruthy();
      expect(screen.getByText('Nessun utilizzo registrato.')).toBeTruthy();
      expect(graficiVivi()).toHaveLength(0);
    } finally {
      vi.useRealTimers();
    }
  });

  it('residuo calcolato ma non ancora disponibile: valore previsto con la data', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 9, 8));
    try {
      server.use(rispondi('/api/finanziario/riserva/2025', { ...F.RISERVA, fase: 'UTILIZZO', dataEstrazione: '2026-09-30' }));
      renderConQuery(<RiservaReport anno={2025} onCambiaAnno={nessunaAzione} />);
      expect(await screen.findByText(/200,00.€ previsto: disponibile dal 1\/1\/2027 se la riserva non è utilizzata completamente entro il 31\/12\/2026/)).toBeTruthy();
      expect(screen.queryByText(/precedente all'inizio della fase attuale/)).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  it('a11y: zero violazioni axe', async () => {
    server.use(rispondi('/api/finanziario/riserva/2025', F.RISERVA));
    const { container } = renderConQuery(<RiservaReport anno={2025} onCambiaAnno={nessunaAzione} />);
    await screen.findByRole('table', { name: 'Utilizzo progressivo' });
    await expectNoA11yViolations(container);
  });
});

describe('VerificaSmpReport (TX-0015)', () => {
  it("senza esercizio chiede di sceglierlo; l'esercizio 2030 e selezionabile", () => {
    renderConQuery(<VerificaSmpReport filtri={{}} esercizio={undefined} onCambiaEsercizio={nessunaAzione} />);
    expect(screen.getByRole('status').textContent).toBe("Scegli l'esercizio finanziario da consultare.");
    expect(within(screen.getByLabelText('Esercizio finanziario')).getByRole('option', { name: '2030' })).toBeTruthy();
  });

  it("tabella con l'intervento come intestazione di riga, 20 colonne di dati, mancanti 'non disponibile'; filtri ed esercizio al backend", async () => {
    let query = '';
    server.use(
      http.get('*/api/finanziario/sigc/verifica-smp', ({ request }) => {
        query = new URL(request.url).search;
        return HttpResponse.json(F.VERIFICA_SMP);
      }),
    );
    renderConQuery(<VerificaSmpReport filtri={{ intervento: ['SRA01'] }} esercizio={2025} onCambiaEsercizio={nessunaAzione} />);
    const tabella = await screen.findByRole('table', { name: 'I dati ASR per intervento da confrontare con SMP' });
    expect(within(tabella).getAllByRole('columnheader')).toHaveLength(21);
    expect(within(tabella).getByRole('rowheader').textContent).toBe('SRA01');
    expect(tabella.textContent).toContain('non disponibile');
    expect(tabella.textContent).not.toContain('non indicato');
    expect(query).toBe('?intervento=SRA01&esercizio=2025');
    expect(valoreDi(screen.getByRole('table', { name: 'Esercizio' }), 'Anno delle domande')).toBe('2024');
  });

  it('grafico della previsione e della spesa erogata montato, con la previsione assente dichiarata fra le voci omesse', async () => {
    server.use(rispondi('/api/finanziario/sigc/verifica-smp', F.VERIFICA_SMP));
    renderConQuery(<VerificaSmpReport filtri={{}} esercizio={2025} onCambiaEsercizio={nessunaAzione} />);
    const titolo = 'Previsione di pagamento e spesa erogata per intervento';
    await waitFor(() => expect(graficoDi(titolo).opzioni.length).toBeGreaterThan(0));
    const c = card(titolo);
    expect(within(c).getByText('1 voce non nel grafico')).toBeTruthy();
    expect(within(c).getByText('SRA01: previsione di pagamento non disponibile (fonte previsione di pagamento non attiva)')).toBeTruthy();
    expect(within(c).getByText('Fonte: TX-0015, esercizio 2025')).toBeTruthy();
  });

  it('a11y: zero violazioni axe', async () => {
    server.use(rispondi('/api/finanziario/sigc/verifica-smp', F.VERIFICA_SMP));
    const { container } = renderConQuery(<VerificaSmpReport filtri={{}} esercizio={2025} onCambiaEsercizio={nessunaAzione} />);
    await screen.findByRole('table', { name: 'I dati ASR per intervento da confrontare con SMP' });
    await expectNoA11yViolations(container);
  });
});
