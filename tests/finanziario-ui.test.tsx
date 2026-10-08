import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '../src/shared/api/mock/server';
import { AUTH_STATUS_QUERY_KEY } from '../src/shared/api/auth/auth-status';
import { expectNoA11yViolations } from '../src/shared/testing/axe';
import { problema, rispondi } from '../src/shared/testing/msw';
import { clientDiTest, renderConQuery } from '../src/shared/testing/render';
import {
  AvanzamentoReport,
  DomandeReport,
  DotazioneReport,
  FiltriAttivi,
  FiltriForm,
  UltimoAggiornamento,
  RiepilogoReport,
  RiservaReport,
  SigcReport,
  VerificaSmpReport,
} from '../src/features/finanziario';
import * as F from '../src/shared/testing/fixture-finanziario';

const testo = (s: string | null | undefined) => (s ?? '').replace(/\s/g, ' ');
const nessunaAzione = () => {};

// Profilo ridotto (gate di UX R-09): /auth/status con i soli grant indicati.
const profilo = (...roles: string[]) =>
  server.use(http.get('*/auth/status', () => HttpResponse.json({ authenticated: true, user: { username: 'U', roles } })));
// Letture partite verso un path (in corso o concluse), lette dalla cache di React Query: deterministico, non dipende da
// quando MSW serve la richiesta.
const letture = (client: ReturnType<typeof clientDiTest>, path: string) =>
  client
    .getQueryCache()
    .getAll()
    .filter((q) => q.queryKey[0] === path && (q.state.fetchStatus !== 'idle' || q.state.dataUpdateCount > 0 || q.state.errorUpdateCount > 0));
const sessioneLetta = (client: ReturnType<typeof clientDiTest>) =>
  waitFor(() => expect(client.getQueryState(AUTH_STATUS_QUERY_KEY)?.status).toBe('success'));
// una risposta trattenuta finche' il test non la rilascia
function trattenuta(path: string, corpo: Parameters<typeof HttpResponse.json>[0]) {
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

afterEach(() => vi.restoreAllMocks());

describe('FiltriForm (route /finanziario, TX-0001)', () => {
  it('mostra i valori dal backend e applica i filtri scelti', async () => {
    server.use(rispondi('/api/finanziario/filtri', F.FILTRI));
    const onApplica = vi.fn();
    renderConQuery(<FiltriForm valori={{}} onApplica={onApplica} onAzzera={nessunaAzione} />);
    const interventi = await screen.findByLabelText('Intervento');
    expect(within(interventi).getAllByRole('option')).toHaveLength(2);
    await userEvent.selectOptions(interventi, ['SRA01', 'SRA03']);
    await userEvent.click(screen.getByRole('button', { name: 'Applica filtri' }));
    expect(onApplica).toHaveBeenCalledWith({ intervento: ['SRA01', 'SRA03'] });
  });

  it("senza legame l'azione portante e disabilitata, spiegata e non applicata anche se nell'indirizzo", async () => {
    server.use(rispondi('/api/finanziario/filtri', F.FILTRI));
    const onApplica = vi.fn();
    renderConQuery(<FiltriForm valori={{ azione: ['1'], os: ['OS4'] }} onApplica={onApplica} onAzzera={nessunaAzione} />);
    const azione = (await screen.findByLabelText('Azione portante')) as HTMLSelectElement;
    expect(azione.disabled).toBe(true);
    expect(document.getElementById(azione.getAttribute('aria-describedby') ?? '')?.textContent).toMatch(/finché nessun intervento/);
    expect(screen.getByText(/non viene applicato/)).toBeTruthy();
    await userEvent.click(screen.getByRole('button', { name: 'Applica filtri' }));
    expect(onApplica).toHaveBeenCalledWith({ os: ['OS4'] });
  });

  it('Azzera svuota la scelta e chiede alla pagina di togliere i filtri applicati', async () => {
    server.use(rispondi('/api/finanziario/filtri', F.FILTRI));
    const onApplica = vi.fn();
    const onAzzera = vi.fn();
    renderConQuery(<FiltriForm valori={{ intervento: ['SRA03'] }} onApplica={onApplica} onAzzera={onAzzera} />);
    await screen.findByLabelText('Intervento');
    await userEvent.click(screen.getByRole('button', { name: 'Azzera i filtri' }));
    expect(onAzzera).toHaveBeenCalledTimes(1);
    await userEvent.click(screen.getByRole('button', { name: 'Applica filtri' }));
    expect(onApplica).toHaveBeenCalledWith({});
  });

  it('OP atomici dal backend, selezione multipla in alternativa; il testo spiega E/O', async () => {
    server.use(rispondi('/api/finanziario/filtri', F.FILTRI));
    const onApplica = vi.fn();
    renderConQuery(<FiltriForm valori={{}} onApplica={onApplica} onAzzera={nessunaAzione} />);
    const op = await screen.findByLabelText('Obiettivo di policy (OP)');
    expect(within(op).getAllByRole('option').map((o) => o.textContent)).toEqual(['OP1', 'OP2', 'OP4', 'OP5']);
    expect(document.getElementById(op.getAttribute('aria-describedby') ?? '')?.textContent).toMatch(/valgono in alternativa/);
    expect(screen.getByText(/Filtri diversi valgono insieme/)).toBeTruthy();
    await userEvent.selectOptions(op, ['OP2', 'OP5']);
    await userEvent.click(screen.getByRole('button', { name: 'Applica filtri' }));
    expect(onApplica).toHaveBeenCalledWith({ op: ['OP2', 'OP5'] });
  });

  it('errore del backend: i report restano consultabili, messaggio leggibile e riprova', async () => {
    server.use(rispondi('/api/finanziario/filtri', problema(403, 'ACCESSO_NEGATO'), 403));
    renderConQuery(<FiltriForm valori={{}} onApplica={nessunaAzione} onAzzera={nessunaAzione} />);
    const avviso = await screen.findByRole('alert');
    expect(avviso.textContent).toContain('Valori dei filtri non disponibili: i report restano consultabili senza filtri.');
    expect(avviso.textContent).toContain('Non hai i permessi');
    expect(screen.getByRole('button', { name: 'Riprova' })).toBeTruthy();
  });

  it('a11y: zero violazioni axe', async () => {
    server.use(rispondi('/api/finanziario/filtri', F.FILTRI));
    const { container } = renderConQuery(<FiltriForm valori={{}} onApplica={nessunaAzione} onAzzera={nessunaAzione} />);
    await screen.findByLabelText('Intervento');
    await expectNoA11yViolations(container);
  });
});

describe('FiltriAttivi', () => {
  it('nessun filtro: tutte le dimensioni libere', async () => {
    server.use(rispondi('/api/finanziario/filtri', F.FILTRI));
    renderConQuery(<FiltriAttivi filtri={{}} />);
    expect(await screen.findByText(/Filtri attivi: nessuno \(interventi, OS, OG, OP e azioni portanti: tutti\)/)).toBeTruthy();
  });
  it('con descrizioni dai valori del backend e le dimensioni libere come "tutti"', async () => {
    server.use(rispondi('/api/finanziario/filtri', F.FILTRI));
    renderConQuery(<FiltriAttivi filtri={{ intervento: ['SRA01', 'SRA03'], os: ['OS4'] }} modifica={<a href="/finanziario">Modifica filtri</a>} />);
    expect(
      await screen.findByText(/Intervento SRA01 - Intervento di prova A, SRA03 - Intervento di prova B; OS OS4; OG, OP e azioni portanti: tutti/),
    ).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Modifica filtri' })).toBeTruthy();
  });
  it('piu valori dello stesso filtro elencati con i codici', async () => {
    server.use(rispondi('/api/finanziario/filtri', F.FILTRI));
    renderConQuery(<FiltriAttivi filtri={{ op: ['OP1', 'OP2'] }} />);
    expect(await screen.findByText(/OP OP1, OP2; interventi, OS, OG e azioni portanti: tutti/)).toBeTruthy();
  });
  it('senza il grant dei filtri non legge TX-0001 e mostra i soli codici (R-09)', async () => {
    profilo('csr.tx-0011.read');
    server.use(rispondi('/api/finanziario/filtri', F.FILTRI));
    const client = clientDiTest();
    renderConQuery(<FiltriAttivi filtri={{ intervento: ['SRA01'] }} />, client);
    await sessioneLetta(client);
    await notifiche();
    expect(letture(client, '/api/finanziario/filtri')).toHaveLength(0);
    expect(screen.getByText(/Filtri attivi: Intervento SRA01; OS, OG, OP e azioni portanti: tutti/)).toBeTruthy();
  });
  it('a11y: zero violazioni axe', async () => {
    server.use(rispondi('/api/finanziario/filtri', F.FILTRI));
    const { container } = renderConQuery(<FiltriAttivi filtri={{ intervento: ['SRA01'] }} modifica={<a href="/finanziario">Modifica filtri</a>} />);
    await screen.findByText(/Intervento di prova A/);
    await expectNoA11yViolations(container);
  });
});

describe('UltimoAggiornamento (NFR-25 b, OP-FE-04)', () => {
  it('una voce per flusso con data e ora italiane, dalla risposta di TX-0001', async () => {
    server.use(rispondi('/api/finanziario/filtri', F.FILTRI));
    renderConQuery(<UltimoAggiornamento />);
    expect((await screen.findByText(/^Ultimo dato sincronizzato:/)).textContent).toBe(
      'Ultimo dato sincronizzato: DS-12 02/03/2026 10:15; PROSA DS-04 03/03/2026 09:30.',
    );
  });
  it('senza acquisizioni concluse lo dichiara', async () => {
    server.use(rispondi('/api/finanziario/filtri', { ...F.FILTRI, ultimiDatiSincronizzati: [] }));
    renderConQuery(<UltimoAggiornamento />);
    expect(await screen.findByText('Ultimo dato sincronizzato: nessuna acquisizione conclusa.')).toBeTruthy();
  });
  it('errore di TX-0001: la data risulta non disponibile', async () => {
    server.use(rispondi('/api/finanziario/filtri', problema(500, 'ERRORE_INTERNO'), 500));
    renderConQuery(<UltimoAggiornamento />);
    expect(await screen.findByText('Ultimo dato sincronizzato: non disponibile.')).toBeTruthy();
  });
  it('un backend senza il campo non fa dire "nessuna acquisizione conclusa"', async () => {
    const senza: Partial<typeof F.FILTRI> = { ...F.FILTRI };
    delete senza.ultimiDatiSincronizzati;
    server.use(rispondi('/api/finanziario/filtri', senza));
    const client = clientDiTest();
    renderConQuery(<UltimoAggiornamento />, client);
    await waitFor(() => expect(letture(client, '/api/finanziario/filtri').some((q) => q.state.status === 'success')).toBe(true));
    await notifiche();
    expect(screen.queryByText(/Ultimo dato sincronizzato/)).toBeNull();
  });
  it('senza il grant di TX-0001 non legge e non mostra la riga', async () => {
    profilo('csr.tx-0011.read');
    server.use(rispondi('/api/finanziario/filtri', F.FILTRI));
    const client = clientDiTest();
    renderConQuery(<UltimoAggiornamento />, client);
    await sessioneLetta(client);
    await notifiche();
    expect(letture(client, '/api/finanziario/filtri')).toHaveLength(0);
    expect(screen.queryByText(/Ultimo dato sincronizzato/)).toBeNull();
  });
  it('a11y: zero violazioni axe', async () => {
    server.use(rispondi('/api/finanziario/filtri', F.FILTRI));
    const { container } = renderConQuery(<UltimoAggiornamento />);
    await screen.findByText(/^Ultimo dato sincronizzato:/);
    await expectNoA11yViolations(container);
  });
});

describe('RiepilogoReport (TX-0011)', () => {
  it('tabella per intervento con importi e assenze dichiarate, perimetro nella sezione', async () => {
    server.use(rispondi('/api/finanziario/riepilogo', F.RIEPILOGO));
    renderConQuery(<RiepilogoReport filtri={{}} />);
    const tabella = await screen.findByRole('table', { name: /nove campi finanziari/ });
    const righe = within(tabella).getAllByRole('row');
    expect(righe).toHaveLength(3);
    expect(within(righe[1]).getByRole('rowheader').textContent).toBe('SRA01');
    expect(testo(righe[1].textContent)).toContain('1.000.000,00 €');
    expect(righe[1].textContent).toContain('fonte quadro sinottico non attiva');
    expect(screen.getByText(/Regionale: tutte le domande/)).toBeTruthy();
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
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    renderConQuery(<RiepilogoReport filtri={{ intervento: ['SRA01'] }} />);
    await userEvent.click(await screen.findByRole('button', { name: 'Esporta la tabella in CSV' }));
    expect(await screen.findByText('File CSV scaricato.')).toBeTruthy();
    expect(new URL(richiesta!.url).search).toBe('?intervento=SRA01');
    expect(richiesta!.headers.get('X-Requested-With')).toBe('XMLHttpRequest');
  });

  it("errore dell'esportazione classificato sul problem-type, senza perdere la tabella", async () => {
    server.use(
      rispondi('/api/finanziario/riepilogo', F.RIEPILOGO),
      http.get('*/api/finanziario/riepilogo/csv', () =>
        HttpResponse.json(problema(403, 'ACCESSO_NEGATO'), { status: 403, headers: { 'Content-Type': 'application/problem+json' } }),
      ),
    );
    renderConQuery(<RiepilogoReport filtri={{}} />);
    await userEvent.click(await screen.findByRole('button', { name: 'Esporta la tabella in CSV' }));
    expect((await screen.findByRole('alert')).textContent).toContain('Non hai i permessi');
    expect(screen.getByRole('table', { name: /nove campi finanziari/ })).toBeTruthy();
  });

  it('vuoto (status) ed errore (alert) sono rami distinti; senza righe la dotazione AT resta e il CSV no', async () => {
    server.use(rispondi('/api/finanziario/riepilogo', { perimetro: 'REGIONALE', dotazioneAssistenzaTecnica: { valore: 100000 }, righe: [] }));
    const { unmount } = renderConQuery(<RiepilogoReport filtri={{ intervento: ['SRA01'] }} />);
    expect((await screen.findByText(/Nessun intervento per i filtri scelti/)).closest('[role]')?.getAttribute('role')).toBe('status');
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

  it('perimetro ADA: colonne di programma dichiarate regionali con la nota; vuoto che nomina la propria area', async () => {
    server.use(rispondi('/api/finanziario/riepilogo', { ...F.RIEPILOGO, perimetro: 'ADA' }));
    const { unmount } = renderConQuery(<RiepilogoReport filtri={{}} />);
    const tabella = await screen.findByRole('table', { name: /nove campi finanziari/ });
    expect(within(tabella).getByRole('columnheader', { name: 'Dotazione spesa pubblica (regionale)' })).toBeTruthy();
    expect(within(tabella).getByRole('columnheader', { name: 'Pagamenti al netto di rettifiche' })).toBeTruthy();
    expect(screen.getByText(/non sono confrontabili/)).toBeTruthy();
    unmount();
    server.use(rispondi('/api/finanziario/riepilogo', { perimetro: 'ADA', righe: [] }));
    renderConQuery(<RiepilogoReport filtri={{}} />);
    expect(await screen.findByText(/Nessun dato nella tua area \(perimetro ADA\)/)).toBeTruthy();
  });

  it('a11y: zero violazioni axe', async () => {
    server.use(rispondi('/api/finanziario/riepilogo', F.RIEPILOGO));
    const { container } = renderConQuery(<RiepilogoReport filtri={{}} />);
    await screen.findByRole('table', { name: /nove campi finanziari/ });
    await expectNoA11yViolations(container);
  });
});

describe('DotazioneReport (TX-0002, TX-0003)', () => {
  const servi = () => server.use(rispondi('/api/finanziario/spesa-per-intervento', F.SPESA), rispondi('/api/finanziario/distribuzione-dotazione', F.DISTRIBUZIONE));
  it('grafici con nome accessibile e tabelle', async () => {
    servi();
    renderConQuery(<DotazioneReport filtri={{}} />);
    expect(await screen.findByRole('img', { name: /Dotazione, impegnato e pagamenti per intervento/ })).toBeTruthy();
    expect(await screen.findByRole('img', { name: /Quota FEASR 40%, Quota non FEASR 60%/ })).toBeTruthy();
    expect(screen.getByText('12,5 %')).toBeTruthy();
  });
  it('selezione senza interventi: stato vuoto invece di zeri', async () => {
    server.use(
      rispondi('/api/finanziario/spesa-per-intervento', { perimetro: 'REGIONALE', righe: [] }),
      rispondi('/api/finanziario/distribuzione-dotazione', { perimetro: 'REGIONALE', dotazioneSpesaPubblica: { valore: 0 }, quotaFeasr: { valore: 0 }, quotaNonFeasr: { valore: 0 } }),
    );
    renderConQuery(<DotazioneReport filtri={{ intervento: ['SRA99'] }} />);
    await waitFor(() => expect(screen.getAllByText('Nessun intervento per i filtri scelti. Modifica i filtri.')).toHaveLength(2));
  });
  it('un intervento con dotazione 0,00 (come SRG08) non e uno stato vuoto', async () => {
    const zero = { valore: 0, motivo: null, fonte: null };
    server.use(
      rispondi('/api/finanziario/spesa-per-intervento', { perimetro: 'REGIONALE', righe: [{ ...F.SPESA.righe[0], codiceIntervento: 'SRG08', dotazioneSpesaPubblica: zero, pagamentiTotali: zero }] }),
      rispondi('/api/finanziario/distribuzione-dotazione', { perimetro: 'REGIONALE', dotazioneSpesaPubblica: zero, quotaFeasr: zero, quotaNonFeasr: zero }),
    );
    renderConQuery(<DotazioneReport filtri={{ intervento: ['SRG08'] }} />);
    expect(await screen.findByRole('rowheader', { name: 'SRG08' })).toBeTruthy();
    expect(await screen.findByText(/Ripartizione della dotazione di spesa pubblica: grafico non disponibile, nessun valore da rappresentare/)).toBeTruthy();
    expect(screen.queryByText(/Nessun intervento per i filtri scelti/)).toBeNull();
  });
  it('perimetro ADA: il grafico per intervento non affianca la dotazione regionale ai pagamenti dell area', async () => {
    server.use(rispondi('/api/finanziario/spesa-per-intervento', { ...F.SPESA, perimetro: 'ADA' }), rispondi('/api/finanziario/distribuzione-dotazione', F.DISTRIBUZIONE));
    renderConQuery(<DotazioneReport filtri={{}} />);
    const grafico = await screen.findByRole('img', { name: /Impegnato e pagamenti della tua area per intervento/ });
    expect(grafico.closest('figure')?.textContent).not.toContain('Dotazione');
    expect(screen.getByRole('columnheader', { name: 'Dotazione spesa pubblica (regionale)' })).toBeTruthy();
    expect(screen.getByRole('columnheader', { name: 'Pagamenti totali (elenchi di liquidazione)' })).toBeTruthy();
    expect(screen.getByText(/non sono confrontabili/)).toBeTruthy();
  });
  it('a11y: zero violazioni axe', async () => {
    servi();
    const { container } = renderConQuery(<DotazioneReport filtri={{}} />);
    await screen.findByRole('img', { name: /Quota FEASR/ });
    await expectNoA11yViolations(container);
  });
});

describe('AvanzamentoReport (TX-0004..TX-0007)', () => {
  const servi = () =>
    server.use(
      rispondi('/api/finanziario/stanziato', F.STANZIATO),
      rispondi('/api/finanziario/pagamenti-su-impegnato', F.PAGAMENTI),
      rispondi('/api/finanziario/residuo-impegni', F.RESIDUO_IMPEGNI),
      rispondi('/api/finanziario/residuo-pagamenti', F.RESIDUO_PAGAMENTI),
      rispondi('/api/finanziario/spesa-per-intervento', F.SPESA),
    );
  it('quattro sezioni; senza tutte le parti la ciambella non inventa proporzioni (RF005)', async () => {
    servi();
    renderConQuery(<AvanzamentoReport filtri={{}} />);
    expect(await screen.findByText(/Stanziato e da stanziare: grafico non disponibile/)).toBeTruthy();
    expect(await screen.findByText(/Impegnato tra pagamenti e ancora da pagare: grafico non disponibile, Impegnato ancora da pagare: dato non disponibile/)).toBeTruthy();
    expect(screen.queryByText(/100%/)).toBeNull();
    expect(await screen.findByRole('img', { name: /Pagamenti al netto di rettifiche 20%, Dotazione residua 80%/ })).toBeTruthy();
    expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(4);
  });
  it('perimetro per sezione: dati di programma regionali accanto a misure ADA', async () => {
    servi();
    server.use(rispondi('/api/finanziario/pagamenti-su-impegnato', { ...F.PAGAMENTI, perimetro: 'ADA' }));
    renderConQuery(<AvanzamentoReport filtri={{}} />);
    const sezione = (nome: RegExp) => screen.getByRole('region', { name: nome });
    await waitFor(() => expect(within(sezione(/Pagamenti sull'impegnato/)).getByText('ADA')).toBeTruthy());
    expect(within(sezione(/Importo stanziato/)).getByText('REGIONALE')).toBeTruthy();
  });
  it('selezione senza interventi (righe di TX-0002): quattro stati vuoti', async () => {
    servi();
    server.use(rispondi('/api/finanziario/spesa-per-intervento', { perimetro: 'REGIONALE', righe: [] }));
    renderConQuery(<AvanzamentoReport filtri={{ intervento: ['SRA99'] }} />);
    await waitFor(() => expect(screen.getAllByText('Nessun intervento per i filtri scelti. Modifica i filtri.')).toHaveLength(4));
  });
  it('con TX-0002 ancora in attesa le quattro sezioni restano in caricamento, senza mostrare prima i valori (R-15)', async () => {
    servi();
    const rilascia = trattenuta('/api/finanziario/spesa-per-intervento', { perimetro: 'REGIONALE', righe: [] });
    const client = clientDiTest();
    renderConQuery(<AvanzamentoReport filtri={{ intervento: ['SRA99'] }} />, client);
    const sezioni = ['stanziato', 'pagamenti-su-impegnato', 'residuo-impegni', 'residuo-pagamenti'].map((s) => `/api/finanziario/${s}`);
    await waitFor(() => expect(sezioni.every((p) => letture(client, p).some((q) => q.state.status === 'success'))).toBe(true));
    await notifiche();
    expect(screen.getAllByText('Caricamento in corso…')).toHaveLength(4);
    expect(screen.queryByText(/grafico non disponibile/)).toBeNull();
    expect(screen.queryByRole('table')).toBeNull();
    await rilascia();
    await waitFor(() => expect(screen.getAllByText('Nessun intervento per i filtri scelti. Modifica i filtri.')).toHaveLength(4));
  });
  it('importi a zero con interventi nella selezione: dati, non stato vuoto', async () => {
    const zero = { valore: 0, motivo: null, fonte: null };
    servi();
    server.use(rispondi('/api/finanziario/stanziato', { perimetro: 'REGIONALE', importoStanziato: zero, importoDaStanziare: zero }));
    renderConQuery(<AvanzamentoReport filtri={{}} />);
    expect(await screen.findByText(/Stanziato e da stanziare: grafico non disponibile, nessun valore da rappresentare/)).toBeTruthy();
    expect(screen.queryByText(/Nessun intervento per i filtri scelti/)).toBeNull();
  });
  it('un totale NON_VALORIZZATO e "non calcolabile" e rimanda al riepilogo per intervento', async () => {
    servi();
    server.use(rispondi('/api/finanziario/residuo-impegni', { ...F.RESIDUO_IMPEGNI, importoImpegnato: { valore: null, motivo: 'NON_VALORIZZATO', fonte: null } }));
    renderConQuery(<AvanzamentoReport filtri={{}} />);
    const sezione = () => screen.getByRole('region', { name: /Dotazione residua sugli impegni/ });
    await waitFor(() => expect(within(sezione()).getByText('non calcolabile')).toBeTruthy());
    expect(within(sezione()).getByText(/manca per almeno un intervento della selezione/)).toBeTruthy();
  });
  it('perimetro ADA su RF007: dotazione dichiarata regionale con la nota', async () => {
    servi();
    server.use(rispondi('/api/finanziario/residuo-pagamenti', { ...F.RESIDUO_PAGAMENTI, perimetro: 'ADA' }));
    renderConQuery(<AvanzamentoReport filtri={{}} />);
    const sezione = () => screen.getByRole('region', { name: /Dotazione residua sui pagamenti/ });
    await waitFor(() => expect(within(sezione()).getByRole('rowheader', { name: 'Dotazione spesa pubblica (regionale)' })).toBeTruthy());
    expect(within(sezione()).getByText(/non sono confrontabili/)).toBeTruthy();
  });
  it('senza il grant di una transazione la sezione non chiama il backend e lo dice', async () => {
    servi();
    const tutti = ['csr.tx-0004.read', 'csr.tx-0006.read', 'csr.tx-0007.read'];
    server.use(http.get('*/auth/status', () => HttpResponse.json({ authenticated: true, user: { username: 'U', roles: tutti } })));
    let chiamato = false;
    server.use(http.get('*/api/finanziario/pagamenti-su-impegnato', () => ((chiamato = true), HttpResponse.json(F.PAGAMENTI))));
    renderConQuery(<AvanzamentoReport filtri={{}} />);
    expect(await screen.findByText('Sezione non disponibile per il tuo profilo.')).toBeTruthy();
    await screen.findByRole('img', { name: /Dotazione tra pagato e residuo/ });
    expect(chiamato).toBe(false);
  });
  it('a11y: zero violazioni axe', async () => {
    servi();
    const { container } = renderConQuery(<AvanzamentoReport filtri={{}} />);
    await screen.findByRole('img', { name: /Dotazione tra pagato e residuo/ });
    await expectNoA11yViolations(container);
  });
});

describe('DomandeReport (TX-0008..TX-0010)', () => {
  const servi = () =>
    server.use(
      rispondi('/api/finanziario/totale-domande', F.TOTALE_DOMANDE),
      rispondi('/api/finanziario/domande-per-anno', F.DOMANDE_PER_ANNO),
      rispondi('/api/finanziario/importi-per-anno', F.IMPORTI_PER_ANNO),
    );
  it('totali, barre impilate per anno e riga senza campagna', async () => {
    servi();
    renderConQuery(<DomandeReport filtri={{}} />);
    // it-IT non raggruppa le migliaia nei numeri di quattro cifre
    expect(await screen.findByText('1200')).toBeTruthy();
    expect(await screen.findByRole('img', { name: /Barre impilate per 2 voci/ })).toBeTruthy();
    expect((await screen.findAllByRole('rowheader', { name: 'senza campagna' })).length).toBe(2);
    expect(await screen.findByRole('img', { name: /stanziato, ammesso e decretato/ })).toBeTruthy();
    expect(screen.getByRole('columnheader', { name: /Importo decretato \(elenchi di liquidazione, come i pagamenti totali di RF005\)/ })).toBeTruthy();
  });
  it('perimetro ADA senza domande: lo stato vuoto nomina la propria area', async () => {
    servi();
    server.use(rispondi('/api/finanziario/domande-per-anno', { perimetro: 'ADA', righe: [] }));
    renderConQuery(<DomandeReport filtri={{}} />);
    const vuoto = await screen.findByText(/Nessun dato nella tua area \(perimetro ADA\)/);
    expect(vuoto.closest('[role]')?.getAttribute('role')).toBe('status');
    expect(within(vuoto.closest('[role]') as HTMLElement).getByText('ADA')).toBeTruthy();
  });
  it('a11y: zero violazioni axe', async () => {
    servi();
    const { container } = renderConQuery(<DomandeReport filtri={{}} />);
    await screen.findByRole('img', { name: /stanziato, ammesso e decretato/ });
    await expectNoA11yViolations(container);
  });
});

describe('SigcReport (TX-0012, TX-0013)', () => {
  const servi = () => server.use(rispondi('/api/finanziario/sigc/domande', F.SIGC_DOMANDE), rispondi('/api/finanziario/sigc/importi', F.SIGC_IMPORTI));
  it('domande e importi SIGC', async () => {
    servi();
    renderConQuery(<SigcReport filtri={{}} />);
    expect(await screen.findByText('800')).toBeTruthy();
    expect(testo((await screen.findByRole('table', { name: 'Importi SIGC' })).textContent)).toContain('4.500.000,00 €');
    expect(screen.getByRole('rowheader', { name: 'Pagate (con pagamento in un elenco di liquidazione)' })).toBeTruthy();
    expect(screen.getByRole('rowheader', { name: 'Importo pagato (flusso ASR2-20)' })).toBeTruthy();
    expect(screen.getAllByText(/Fonti diverse: .* possono non coincidere/)).toHaveLength(2);
  });
  it('importi a zero con domande presentate: dati, non stato vuoto', async () => {
    const zero = { valore: 0, motivo: null, fonte: null };
    server.use(
      rispondi('/api/finanziario/sigc/domande', F.SIGC_DOMANDE),
      rispondi('/api/finanziario/sigc/importi', { ...F.SIGC_IMPORTI, richiesto: zero, ammesso: zero, pagato: zero, ancoraDaPagare: zero, domandeSenza: { richiesto: 0, ammesso: 0, pagato: 0 } }),
    );
    renderConQuery(<SigcReport filtri={{}} />);
    expect(testo((await screen.findByRole('table', { name: 'Importi SIGC' })).textContent)).toContain('0,00 €');
    expect(screen.queryByText(/Nessuna domanda SIGC/)).toBeNull();
  });
  it('nessuna domanda SIGC nella selezione: stato vuoto del wireframe, non zeri', async () => {
    const zero = { valore: 0, motivo: null, fonte: null };
    server.use(
      rispondi('/api/finanziario/sigc/domande', { perimetro: 'REGIONALE', presentate: 0, pagate: 0, daPagare: 0 }),
      rispondi('/api/finanziario/sigc/importi', { perimetro: 'REGIONALE', richiesto: zero, ammesso: zero, pagato: zero, ancoraDaPagare: zero, domandeSenza: { richiesto: 0, ammesso: 0, pagato: 0 } }),
    );
    renderConQuery(<SigcReport filtri={{ intervento: ['SRA99'] }} />);
    await waitFor(() => expect(screen.getAllByText('Nessuna domanda SIGC per i filtri scelti. Modifica i filtri.')).toHaveLength(2));
  });
  it('con il solo grant degli importi non legge le domande SIGC per il segnale di vuoto (R-09)', async () => {
    servi();
    profilo('csr.tx-0013.read');
    const client = clientDiTest();
    renderConQuery(<SigcReport filtri={{}} />, client);
    expect(testo((await screen.findByRole('table', { name: 'Importi SIGC' })).textContent)).toContain('4.500.000,00 €');
    expect(screen.getByText('Sezione non disponibile per il tuo profilo.')).toBeTruthy();
    expect(letture(client, '/api/finanziario/sigc/domande')).toHaveLength(0);
  });
  it('con TX-0012 ancora in attesa gli importi restano in caricamento, senza mostrare prima i valori (R-15)', async () => {
    servi();
    const rilascia = trattenuta('/api/finanziario/sigc/domande', F.SIGC_DOMANDE);
    const client = clientDiTest();
    renderConQuery(<SigcReport filtri={{}} />, client);
    await waitFor(() => expect(letture(client, '/api/finanziario/sigc/importi').some((q) => q.state.status === 'success')).toBe(true));
    await notifiche();
    expect(screen.queryByRole('table', { name: 'Importi SIGC' })).toBeNull();
    expect(screen.getAllByText('Caricamento in corso…')).toHaveLength(2);
    await rilascia();
    expect(testo((await screen.findByRole('table', { name: 'Importi SIGC' })).textContent)).toContain('4.500.000,00 €');
  });
  it('a11y: zero violazioni axe', async () => {
    servi();
    const { container } = renderConQuery(<SigcReport filtri={{}} />);
    await screen.findByRole('table', { name: 'Importi SIGC' });
    await expectNoA11yViolations(container);
  });
});

describe('RiservaReport (TX-0014)', () => {
  it("senza anno chiede di sceglierlo; la scelta si applica con Mostra", async () => {
    const onCambia = vi.fn();
    renderConQuery(<RiservaReport anno={undefined} onCambiaAnno={onCambia} />);
    expect(screen.getByRole('status').textContent).toContain("Scegli l'anno");
    await userEvent.selectOptions(screen.getByLabelText('Anno della riserva (anno n)'), '2025');
    expect(onCambia).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole('button', { name: 'Mostra' }));
    expect(onCambia).toHaveBeenCalledWith(2025);
  });
  it('il 404 NOT_FOUND e uno stato vuoto spiegato', async () => {
    server.use(rispondi('/api/finanziario/riserva/2025', problema(404, 'NOT_FOUND'), 404));
    renderConQuery(<RiservaReport anno={2025} onCambiaAnno={nessunaAzione} />);
    expect((await screen.findByText(/Nessun dato di riserva per il 2025/)).closest('[role]')?.getAttribute('role')).toBe('status');
  });
  it('scenario SC-FI_RISERVA: fase di oggi, importi dell estrazione dichiarati, residuo disponibile, utilizzo progressivo', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2027, 1, 1));
    try {
      server.use(rispondi('/api/finanziario/riserva/2025', F.RISERVA));
      renderConQuery(<RiservaReport anno={2025} onCambiaAnno={nessunaAzione} />);
      const valori = await screen.findByRole('table', { name: "Riserva dell'anno 2025: valori all'estrazione del 31/12/2026" });
      expect(within(valori).getByRole('rowheader', { name: 'Fase (calcolata al giorno della consultazione)' })).toBeTruthy();
      expect(within(valori).getByText('residuo (2% del montante, dal 1/1/2027)')).toBeTruthy();
      expect(screen.getByText(/precedente all'inizio della fase attuale/)).toBeTruthy();
      expect(testo(valori.textContent)).toContain('200,00 €');
      expect(valori.textContent).not.toContain('previsto');
      expect(within(valori).getByText('fonte regola n+2 e vincolo di pagamento entro ottobre non attiva')).toBeTruthy();
      expect(screen.getByRole('table', { name: 'Utilizzo progressivo' })).toBeTruthy();
      expect(screen.getByRole('img', { name: /Utilizzo progressivo cumulato/ })).toBeTruthy();
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
    expect(screen.getByRole('status').textContent).toContain("Scegli l'esercizio");
    expect(within(screen.getByLabelText('Esercizio finanziario')).getByRole('option', { name: '2030' })).toBeTruthy();
  });
  it("tabella con l'intervento come intestazione di riga, 20 colonne di dati, mancanti 'non disponibile'", async () => {
    let query = '';
    server.use(
      http.get('*/api/finanziario/sigc/verifica-smp', ({ request }) => {
        query = new URL(request.url).search;
        return HttpResponse.json(F.VERIFICA_SMP);
      }),
    );
    renderConQuery(<VerificaSmpReport filtri={{ intervento: ['SRA01'] }} esercizio={2025} onCambiaEsercizio={nessunaAzione} />);
    const tabella = await screen.findByRole('table', { name: /dati ASR per intervento/ });
    expect(within(tabella).getAllByRole('columnheader')).toHaveLength(21);
    expect(within(tabella).getByRole('rowheader').textContent).toBe('SRA01');
    expect(tabella.textContent).toContain('non disponibile');
    expect(tabella.textContent).not.toContain('non indicato');
    expect(query).toBe('?intervento=SRA01&esercizio=2025');
  });
  it('a11y: zero violazioni axe', async () => {
    server.use(rispondi('/api/finanziario/sigc/verifica-smp', F.VERIFICA_SMP));
    const { container } = renderConQuery(<VerificaSmpReport filtri={{}} esercizio={2025} onCambiaEsercizio={nessunaAzione} />);
    await screen.findByRole('table', { name: /dati ASR per intervento/ });
    await expectNoA11yViolations(container);
  });
});
