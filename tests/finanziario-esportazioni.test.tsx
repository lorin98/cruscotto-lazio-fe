// Esportazioni CSV e XLSX di ogni report (review v3 V-02): ogni pulsante chiama l'endpoint della SUA transazione, con i
// filtri della pagina e X-Requested-With, e salva un file col nome della transazione. Le funzioni generate hanno tutte la
// stessa firma: uno scambio di voci nella mappa delle esportazioni o una chiave sbagliata in un componente passerebbe il
// typecheck e scaricherebbe (registrandolo in audit) il report sbagliato. L'oracolo e' la spec: percorso -> transazione.
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ReactElement } from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { MemoryRouter } from 'react-router';
import { server } from '../src/shared/api/mock/server';
import { rispondi } from '../src/shared/testing/msw';
import { renderConQuery } from '../src/shared/testing/render';
import { AvanzamentoReport, DettaglioIntervento, DomandeReport, DotazioneReport, Panoramica } from '../src/features/finanziario';
import { esportaReport, esportaRiserva } from '../src/features/finanziario/api';
import type { ReportEsportabile } from '../src/features/finanziario/api';
import * as F from '../src/features/finanziario/testing/fixture';

// transazione di ogni endpoint di esportazione, dalla spec (handover/openapi-finanziario.json, summary "TX-00NN in CSV o XLSX")
const TX_DEL_PERCORSO: Record<string, string> = {
  'spesa-per-intervento': 'tx-0002',
  'distribuzione-dotazione': 'tx-0003',
  stanziato: 'tx-0004',
  'pagamenti-su-impegnato': 'tx-0005',
  'residuo-impegni': 'tx-0006',
  'residuo-pagamenti': 'tx-0007',
  'domande-per-anno': 'tx-0008',
  'totale-domande': 'tx-0009',
  'importi-per-anno': 'tx-0010',
  riepilogo: 'tx-0011',
  'sigc/domande': 'tx-0012',
  'sigc/importi': 'tx-0013',
  'riserva/2025': 'tx-0014',
};

const ESPORTAZIONE = /\/api\/finanziario\/(.+)\/(csv|xlsx)(\?.*)?$/;

/** Registra le esportazioni richieste: "percorso?query" (senza /api/finanziario/ ne' formato) e X-Requested-With. */
function registraEsportazioni() {
  const richieste: Array<{ report: string; query: string; formato: string; xrw: string | null }> = [];
  server.use(
    http.get(ESPORTAZIONE, ({ request }) => {
      const u = new URL(request.url);
      const [, report, formato] = /\/api\/finanziario\/(.+)\/(csv|xlsx)$/.exec(u.pathname) ?? [];
      richieste.push({ report, query: u.search, formato, xrw: request.headers.get('X-Requested-With') });
      return new HttpResponse('a;b\n1;2', { headers: { 'Content-Type': formato === 'csv' ? 'text/csv' : 'application/octet-stream' } });
    }),
  );
  return richieste;
}

/** Clicca ogni pulsante "… in CSV" della vista, in ordine: [nome accessibile, report richiesto, file salvato]. */
async function scaricaOgniCsv(richieste: ReturnType<typeof registraEsportazioni>, attesi: number) {
  URL.createObjectURL = vi.fn(() => 'blob:prova');
  URL.revokeObjectURL = vi.fn();
  const clic = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
  // lo spy e le richieste si accumulano fra le schede: si parte da dove sono
  const [clicPrima, richiestePrima] = [clic.mock.calls.length, richieste.length];
  await waitFor(() => expect(screen.getAllByRole('button', { name: / in CSV$/ })).toHaveLength(attesi));
  const esiti: Array<[string, string, string]> = [];
  for (const pulsante of screen.getAllByRole('button', { name: / in CSV$/ })) {
    await userEvent.click(pulsante);
    await waitFor(() => expect(clic).toHaveBeenCalledTimes(clicPrima + esiti.length + 1));
    const r = richieste[richiestePrima + esiti.length];
    expect(r.query).toBe('?intervento=SRA01');
    expect(r.xrw).toBe('XMLHttpRequest');
    expect(r.formato).toBe('csv');
    esiti.push([pulsante.getAttribute('aria-label') ?? '', r.report, (clic.mock.contexts.at(-1) as HTMLAnchorElement).download]);
  }
  // ogni file porta la transazione del report che contiene
  for (const [nome, report, file] of esiti) expect(file, nome).toMatch(new RegExp(`-${TX_DEL_PERCORSO[report]}\\.csv$`));
  return esiti.map(([nome, report]) => [nome, report]);
}

const SRA01 = { intervento: ['SRA01'] };
const conRouter = (ui: ReactElement) => renderConQuery(<MemoryRouter>{ui}</MemoryRouter>);

afterEach(() => vi.restoreAllMocks());

describe('esportaReport: ogni chiave chiama l endpoint della sua transazione (review v3 V-02)', () => {
  it.each<[ReportEsportabile, string]>([
    ['spesaPerIntervento', 'spesa-per-intervento'],
    ['distribuzioneDotazione', 'distribuzione-dotazione'],
    ['stanziato', 'stanziato'],
    ['pagamentiSuImpegnato', 'pagamenti-su-impegnato'],
    ['residuoImpegni', 'residuo-impegni'],
    ['residuoPagamenti', 'residuo-pagamenti'],
    ['domandePerAnno', 'domande-per-anno'],
    ['totaleDomande', 'totale-domande'],
    ['importiPerAnno', 'importi-per-anno'],
    ['riepilogo', 'riepilogo'],
    ['sigcDomande', 'sigc/domande'],
    ['sigcImporti', 'sigc/importi'],
  ])('%s -> /api/finanziario/%s/{formato}', async (chiave, percorso) => {
    const richieste = registraEsportazioni();
    await esportaReport(chiave, 'xlsx', { intervento: ['SRA01'], os: ['OS4'] });
    expect(richieste).toEqual([{ report: percorso, query: '?intervento=SRA01&os=OS4', formato: 'xlsx', xrw: 'XMLHttpRequest' }]);
  });
  it('riserva dell anno (TX-0014)', async () => {
    const richieste = registraEsportazioni();
    await esportaRiserva(2025, 'csv');
    expect(richieste.map((r) => [r.report, r.query])).toEqual([['riserva/2025', '']]);
  });
});

describe('ogni pulsante CSV delle pagine scarica la transazione della sua card (review v3 V-02)', () => {
  it('Dotazione: dotazione e contributo e tabella da TX-0002, quote da TX-0003', async () => {
    server.use(rispondi('/api/finanziario/spesa-per-intervento', F.SPESA), rispondi('/api/finanziario/distribuzione-dotazione', F.DISTRIBUZIONE));
    const richieste = registraEsportazioni();
    conRouter(<DotazioneReport filtri={SRA01} />);
    expect(await scaricaOgniCsv(richieste, 4)).toEqual([
      ['Scarica il grafico Dotazione e pagamenti per intervento in CSV', 'spesa-per-intervento'],
      ['Scarica il grafico Dotazione tra quota FEASR e non FEASR (RF003) in CSV', 'distribuzione-dotazione'],
      ['Scarica il grafico Contributo ambientale per intervento in CSV', 'spesa-per-intervento'],
      ['Scarica la tabella Spesa pubblica per intervento (RF002) in CSV', 'spesa-per-intervento'],
    ]);
  });

  it('Avanzamento: le quattro parti da TX-0004..TX-0007, pagato netto sulla dotazione da TX-0007', async () => {
    server.use(
      rispondi('/api/finanziario/stanziato', F.STANZIATO),
      rispondi('/api/finanziario/pagamenti-su-impegnato', F.PAGAMENTI),
      rispondi('/api/finanziario/residuo-impegni', F.RESIDUO_IMPEGNI),
      rispondi('/api/finanziario/residuo-pagamenti', F.RESIDUO_PAGAMENTI),
      rispondi('/api/finanziario/spesa-per-intervento', F.SPESA),
    );
    const richieste = registraEsportazioni();
    conRouter(<AvanzamentoReport filtri={SRA01} />);
    const esiti = await scaricaOgniCsv(richieste, 5);
    expect(Object.fromEntries(esiti)).toEqual({
      'Scarica il grafico Pagato netto sulla dotazione in CSV': 'residuo-pagamenti',
      'Scarica il grafico Importo stanziato e da stanziare (RF004) in CSV': 'stanziato',
      "Scarica il grafico Pagamenti sull'impegnato (RF005) in CSV": 'pagamenti-su-impegnato',
      'Scarica il grafico Dotazione residua sugli impegni (RF006) in CSV': 'residuo-impegni',
      'Scarica il grafico Dotazione residua sui pagamenti (RF007) in CSV': 'residuo-pagamenti',
    });
  });

  it('Domande: totali da TX-0009 (V-04), domande per anno da TX-0008, importi da TX-0010', async () => {
    server.use(
      rispondi('/api/finanziario/totale-domande', F.TOTALE_DOMANDE),
      rispondi('/api/finanziario/domande-per-anno', F.DOMANDE_PER_ANNO),
      rispondi('/api/finanziario/importi-per-anno', F.IMPORTI_PER_ANNO),
    );
    const richieste = registraEsportazioni();
    conRouter(<DomandeReport filtri={SRA01} />);
    expect(await scaricaOgniCsv(richieste, 5)).toEqual([
      ['Scarica i dati di Totale domande presentate (RF009) in CSV', 'totale-domande'],
      ['Scarica il grafico Domande per anno di raccolta (RF008) in CSV', 'domande-per-anno'],
      ['Scarica la tabella Domande per anno in CSV', 'domande-per-anno'],
      ['Scarica il grafico Importi per anno di raccolta (RF010) in CSV', 'importi-per-anno'],
      ['Scarica la tabella Importi per anno in CSV', 'importi-per-anno'],
    ]);
  });

  it('Panoramica: domande presentate da TX-0009 (V-04), avanzamento e famiglie da TX-0002, SIGC da TX-0012 e TX-0013', async () => {
    server.use(
      rispondi('/api/finanziario/spesa-per-intervento', F.SPESA),
      rispondi('/api/finanziario/totale-domande', F.TOTALE_DOMANDE),
      rispondi('/api/finanziario/sigc/domande', F.SIGC_DOMANDE),
      rispondi('/api/finanziario/sigc/importi', F.SIGC_IMPORTI),
    );
    const richieste = registraEsportazioni();
    conRouter(<Panoramica filtri={SRA01} />);
    expect(Object.fromEntries(await scaricaOgniCsv(richieste, 5))).toEqual({
      'Scarica i dati di Domande presentate (RF009) in CSV': 'totale-domande',
      'Scarica il grafico Avanzamento per intervento in CSV': 'spesa-per-intervento',
      'Scarica il grafico Dotazione per famiglia di intervento in CSV': 'spesa-per-intervento',
      'Scarica il grafico Domande SIGC: presentate, pagate e da pagare in CSV': 'sigc/domande',
      'Scarica il grafico Importi SIGC in CSV': 'sigc/importi',
    });
  });

  it("Dettaglio dell'intervento: ogni scheda scarica le sue transazioni", async () => {
    server.use(
      rispondi('/api/finanziario/filtri', F.FILTRI),
      rispondi('/api/finanziario/riepilogo', { ...F.RIEPILOGO, righe: [F.RIEPILOGO.righe[0]] }),
      rispondi('/api/finanziario/spesa-per-intervento', F.SPESA),
      rispondi('/api/finanziario/domande-per-anno', F.DOMANDE_PER_ANNO),
      rispondi('/api/finanziario/importi-per-anno', F.IMPORTI_PER_ANNO),
      rispondi('/api/finanziario/sigc/domande', F.SIGC_DOMANDE),
      rispondi('/api/finanziario/sigc/importi', F.SIGC_IMPORTI),
    );
    const richieste = registraEsportazioni();
    conRouter(<DettaglioIntervento codice="SRA01" />);
    const sintesi = await scaricaOgniCsv(richieste, 2);
    await userEvent.click(screen.getByRole('tab', { name: 'Domande' }));
    const domande = await scaricaOgniCsv(richieste, 2);
    await userEvent.click(screen.getByRole('tab', { name: 'SIGC' }));
    const sigc = await scaricaOgniCsv(richieste, 2);
    // il pagato netto sulla dotazione viene dalla riga del riepilogo (TX-0011), come la cascata accanto
    expect([...sintesi, ...domande, ...sigc].map(([, report]) => report)).toEqual([
      'riepilogo',
      'riepilogo',
      'domande-per-anno',
      'importi-per-anno',
      'sigc/domande',
      'sigc/importi',
    ]);
  });
});
