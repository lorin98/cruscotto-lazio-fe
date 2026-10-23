// Pagina /procedurale/interventi/:codice (green-fe step7): describe taggati coi REQ della route (RF024, RF026..RF032),
// dati dagli scenari del backend (fixture del procedurale) con letture che rispondono ai parametri della query, MSW
// seminato con onUnhandledRequest 'error' (ogni lettura e' dichiarata qui), axe-core diretto. ECharts e' il grafico finto
// del setup: i clic sulle barre sono quelli del dato disegnato.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '../../../shared/api/mock/server';
import { expectNoA11yViolations } from '../../../shared/testing/axe';
import { graficoDi, tabellaDi, trovaCard } from '../../../shared/testing/card-grafico';
import { clicSulCodice } from '../../../shared/testing/grafico-finto';
import { problema, trattenuta } from '../../../shared/testing/msw';
import { renderPagina } from '../../../shared/testing/render-pagina';
import { ammessePer, statiPer } from '../../../features/procedurale/testing/fixture';
import { lettureProcedurale } from '../../../features/procedurale/testing/letture';
import type { Basi } from '../../../features/procedurale/testing/letture';
import Pagina from './page';

const PERCORSO = '/procedurale/interventi/:codice';
const SRD01 = '/procedurale/interventi/SRD01';
const TITOLO = 'SRD01 - Investimenti produttivi agricoli per la competitività';
const AGGIORNAMENTO = 'Aggiornamento dei risultati: restano visibili quelli precedenti finché arrivano i nuovi.';
const testo = (s: string | null | undefined) => (s ?? '').replace(/\s/g, ' ');
const profilo = (roles: string[]) =>
  server.use(http.get('*/auth/status', () => HttpResponse.json({ authenticated: true, user: { username: 'U', profile: 'p3-funzionario-area-pro', roles } })));

function servi(basi?: Basi) {
  const { handlers, lette } = lettureProcedurale(basi);
  server.use(...handlers);
  return lette;
}

const apri = (indirizzo = SRD01) => renderPagina(Pagina, PERCORSO, indirizzo);
const dove = (router: ReturnType<typeof apri>['router']) => `${router.state.location.pathname}${router.state.location.search}`;
const indisponibile = (percorso: string) => http.get(`*/api/procedurale/${percorso}`, () => HttpResponse.json(problema(503, 'CAPACITA_ESAURITA'), { status: 503 }));

afterEach(() => vi.restoreAllMocks());

describe('RF024: dettaglio procedurale dell intervento, testata e filtro per stato area programmazione', () => {
  it('testata con la descrizione di TX-0024, badge e link verso la panoramica; letture con l intervento e lo stato; nessuna violazione axe', async () => {
    const lette = servi();
    const { container } = apri(`${SRD01}?stato=AMMESSA&stato=REVOCATA`);
    const h1 = await screen.findByRole('heading', { level: 1, name: TITOLO });
    expect(document.activeElement).toBe(h1);
    expect(document.title).toBe('Intervento SRD01 - Procedurale - Cruscotto CSR 2023-2027');
    expect(screen.getByRole('link', { name: 'Filtra i report procedurali su questo intervento' }).getAttribute('href')).toBe('/procedurale?intervento=SRD01&stato=AMMESSA&stato=REVOCATA');
    expect(screen.getByRole('link', { name: 'Torna alla panoramica' }).getAttribute('href')).toBe('/procedurale?stato=AMMESSA&stato=REVOCATA');
    expect(within(await screen.findByRole('list', { name: 'Dati principali' })).getAllByRole('listitem').map((l) => l.textContent)).toEqual(['Perimetro: SIGC no', 'Attivato: sì']);
    await trovaCard('Domande di sostegno per stato');
    for (const l of [lette.ammesse, lette.sostegno, lette.pagamento]) expect(l).toEqual(['?intervento=SRD01&stato=AMMESSA&stato=REVOCATA']);
    const barra = screen.getByRole('region', { name: 'Filtri attivi' });
    expect(within(barra).getByRole('button', { name: 'Togli il filtro Stato area programmazione Revocata' })).toBeTruthy();
    expect(within(barra).queryByRole('button', { name: /^Togli il filtro Intervento/ })).toBeNull();
    await expectNoA11yViolations(container);
  });

  it('codice non valido nel percorso (anche con /): nessuna lettura, la pagina lo dice col titolo col focus', async () => {
    const lette = servi();
    apri('/procedurale/interventi/SR%2F01');
    const h1 = screen.getByRole('heading', { level: 1, name: 'Intervento non valido' });
    await waitFor(() => expect(document.activeElement).toBe(h1));
    expect(screen.getByRole('alert').textContent).toMatch(/^Il codice nell'indirizzo non è un codice di intervento/);
    await new Promise((r) => setTimeout(r, 50));
    expect([lette.ammesse, lette.sostegno, lette.pagamento]).toEqual([[], [], []]);
  });

  it('cambiando lo stato dal pannello restano i dati di prima con l avviso dell aggiornamento, nessuno scheletro; poi i nuovi', async () => {
    const t = trattenuta();
    let prima = true;
    servi();
    server.use(
      http.get('*/api/procedurale/domande-ammesse', async ({ request }) => {
        if (!prima) await t.attesa;
        prima = false;
        return HttpResponse.json(ammessePer(new URL(request.url).searchParams));
      }),
    );
    apri();
    expect(testo((await screen.findByRole('region', { name: 'Domande ammesse' })).textContent)).toMatch(/^Domande ammesse2/);
    await userEvent.click(screen.getByRole('button', { name: /^Filtri/ }));
    const pannello = await screen.findByRole('dialog', { name: "Filtri del dettaglio dell'intervento" });
    expect(within(pannello).queryByRole('checkbox', { name: /^SRD01/ })).toBeNull();
    await userEvent.click(within(pannello).getByRole('checkbox', { name: 'Revocata (stato osservato fuori catalogo)' }));
    await userEvent.click(within(pannello).getByRole('button', { name: 'Applica i filtri' }));
    expect(await screen.findByText(AGGIORNAMENTO)).toBeTruthy();
    expect(testo(screen.getByRole('region', { name: 'Domande ammesse' }).textContent)).toMatch(/^Domande ammesse2/);
    expect(document.querySelector('.ui-skeleton--alto')).toBeNull();
    await act(async () => t.libera());
    await waitFor(() => expect(screen.queryByText(AGGIORNAMENTO)).toBeNull());
    expect(testo(screen.getByRole('region', { name: 'Domande ammesse' }).textContent)).toMatch(/^Domande ammesse0/);
  });

  it('senza il grant di TX-0025 nessuna lettura degli stati area programmazione: il chip dello stato mostra la chiave (D1)', async () => {
    profilo(['csr.tx-0024.read', 'csr.tx-0026.read', 'csr.tx-0027.read', 'csr.tx-0028.read']);
    const lette = servi();
    apri(`${SRD01}?stato=AMMESSA`);
    await screen.findByRole('region', { name: 'Domande ammesse' });
    expect(within(screen.getByRole('region', { name: 'Filtri attivi' })).getByRole('button', { name: 'Togli il filtro Stato area programmazione AMMESSA' })).toBeTruthy();
    expect(lette.statiArea).toBe(0);
  });

  it('TX-0024 non disponibile: il titolo col solo codice, lo stato dei valori con Riprova; i report si leggono', async () => {
    servi({ valori: null });
    apri();
    expect(await screen.findByRole('heading', { level: 1, name: 'Intervento SRD01' })).toBeTruthy();
    const stato = (await screen.findByText(/^Valori dei filtri non disponibili: /)).closest('[role="status"]') as HTMLElement;
    expect(within(stato).getByRole('button', { name: 'Riprova' })).toBeTruthy();
    expect(await screen.findByRole('region', { name: 'Domande ammesse' })).toBeTruthy();
  });
});

describe('RF026: KPI della riga dell intervento in TX-0026 (ammesse, atto di concessione, contributo)', () => {
  it('KPI della riga col link delle ammesse dell intervento verso l elenco; le domande di sostegno e di pagamento dagli stati', async () => {
    servi();
    apri();
    const ammesse = await screen.findByRole('region', { name: 'Domande ammesse' });
    expect(within(ammesse).getByRole('link', { name: "Apri nell'elenco operativo le domande ammesse di SRD01" }).getAttribute('href')).toBe('/elenco-operativo/domande?voceProgrammazione=AMMESSA&intervento=SRD01');
    expect(testo(screen.getByRole('region', { name: 'Contributo ammesso' }).textContent)).toContain('800,00 €');
    expect(testo(screen.getByRole('region', { name: 'Domande di sostegno' }).textContent)).toContain('3di cui non rilasciate 0; domande di pagamento 3');
  });

  it('senza il grant dell elenco operativo nessun link nei KPI ne nelle tabelle equivalenti delle schede', async () => {
    profilo(['csr.tx-0024.read', 'csr.tx-0025.read', 'csr.tx-0026.read', 'csr.tx-0027.read', 'csr.tx-0028.read']);
    servi();
    apri();
    const ammesse = await screen.findByRole('region', { name: 'Domande ammesse' });
    expect(within(ammesse).queryByRole('link')).toBeNull();
    const t = await tabellaDi(await trovaCard('Domande di sostegno per stato'));
    expect(within(t).queryByRole('link')).toBeNull();
  });
});

describe('RF027 e RF028: scheda Stati delle domande dell intervento (TX-0027, TX-0028)', () => {
  it('le voci con la parte rilasciata verso l elenco (intervento e stato); il clic su una barra la apre; CSV coi criteri del dettaglio', async () => {
    const lette = servi();
    URL.createObjectURL = vi.fn(() => 'blob:prova');
    URL.revokeObjectURL = vi.fn();
    const clic = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    const { router } = apri(`${SRD01}?stato=SENZA_STATO`);
    const pagamento = await trovaCard('Domande di pagamento per stato');
    // il titolo della card non dice l'intervento: il PNG lo dice come i file dei dati (wireframe approvato, WCAG 2.4.6)
    expect(within(pagamento).getAllByRole('button', { name: /^Scarica / }).map((b) => b.getAttribute('aria-label'))).toEqual([
      'Scarica il grafico Domande di pagamento per stato di SRD01 in PNG',
      'Scarica i dati degli stati delle domande di pagamento di SRD01 in CSV',
      'Scarica i dati degli stati delle domande di pagamento di SRD01 in XLSX',
    ]);
    const t = await tabellaDi(pagamento);
    expect(within(t).getByRole('link', { name: "Apri nell'elenco operativo la domanda di pagamento di SRD01 nello stato Proposta al pagamento - autorizzazione ente territoriale" }).getAttribute('href')).toBe(
      '/elenco-operativo/domande?statoPagamento=PROPOSTA_AUTORIZZAZIONE_ENTE&voceProgrammazione=SENZA_STATO&intervento=SRD01',
    );
    await userEvent.click(within(pagamento).getByRole('button', { name: 'Scarica i dati degli stati delle domande di pagamento di SRD01 in CSV' }));
    await waitFor(() => expect(clic).toHaveBeenCalledTimes(1));
    expect((clic.mock.contexts.at(-1) as HTMLAnchorElement).download).toBe('domande-di-pagamento-per-stato-srd01-tx-0028.csv');
    expect(lette.file).toEqual(['/api/procedurale/stati-pagamento/csv?intervento=SRD01&stato=SENZA_STATO XMLHttpRequest']);
    clicSulCodice(graficoDi(await trovaCard('Domande di sostegno per stato')), 'RILASCIATO');
    await waitFor(() => expect(dove(router)).toBe('/elenco-operativo/domande?statoSostegno=RILASCIATO&voceProgrammazione=SENZA_STATO&intervento=SRD01'));
  });
});

describe('RF029: scheda Area programmazione dell intervento (TX-0029)', () => {
  it('le schede si scelgono da tastiera; l Area legge TX-0029 quando si apre e resta scelta mentre la pagina rilegge', async () => {
    const lette = servi();
    apri(`${SRD01}?stato=AMMESSA&stato=SENZA_STATO`);
    const stati = await screen.findByRole('tab', { name: 'Stati delle domande' });
    await trovaCard('Domande di sostegno per stato');
    expect(lette.riepilogo).toEqual([]);
    stati.focus();
    await userEvent.keyboard('{ArrowRight}');
    const area = screen.getByRole('tab', { name: 'Area programmazione' });
    expect(document.activeElement).toBe(area);
    await waitFor(() => expect(area.getAttribute('aria-selected')).toBe('true'));
    const card = await trovaCard('Domande per stato area programmazione');
    expect(lette.riepilogo).toEqual(['?intervento=SRD01&stato=AMMESSA&stato=SENZA_STATO']);
    expect(within(card).getByRole('button', { name: 'Scarica il grafico Domande per stato area programmazione di SRD01 in PNG' })).toBeTruthy();
    expect(within(await tabellaDi(card)).getByRole('link', { name: "Apri nell'elenco operativo le 3 domande di SRD01 senza stato area programmazione" }).getAttribute('href')).toBe(
      '/elenco-operativo/domande?voceProgrammazione=SENZA_STATO&intervento=SRD01',
    );
    await userEvent.click(screen.getByRole('button', { name: 'Togli il filtro Stato area programmazione Ammessa' }));
    await waitFor(() => expect(lette.ammesse.at(-1)).toBe('?intervento=SRD01&stato=SENZA_STATO'));
    expect(screen.getByRole('tab', { name: 'Area programmazione' }).getAttribute('aria-selected')).toBe('true');
  });
});

describe('RF030: scheda Unit Amount dell intervento (TX-0030, senza lo stato)', () => {
  it('legge col solo intervento quando si apre; la tabella con la nota unica del pagato', async () => {
    const lette = servi();
    apri(`${SRD01}?stato=AMMESSA`);
    await userEvent.click(await screen.findByRole('tab', { name: 'Unit Amount' }));
    const t = await screen.findByRole('table', { name: /^Unit Amount di SRD01/ });
    expect(lette.unitAmount).toEqual(['?intervento=SRD01']);
    expect(within(t).getAllByRole('rowheader').map((c) => c.textContent)).toEqual(['UA1', 'UA2', 'UA1']);
    expect(screen.getByText(/^Importo pagato, percentuale pagata sul richiesto e base storica: non disponibili per tutte le Unit Amount/)).toBeTruthy();
  });
});

describe('RF031 e RF032: scheda Sottofasi dell intervento (TX-0031, TX-0032)', () => {
  it('legge le due sottofasi con l intervento e lo stato quando si apre; le card senza clic', async () => {
    const lette = servi();
    apri(`${SRD01}?stato=SENZA_STATO`);
    await userEvent.click(await screen.findByRole('tab', { name: 'Sottofasi' }));
    const sostegno = await trovaCard('Domande di sostegno per sottofase di ammissibilità');
    const pagamento = await trovaCard('Domande di pagamento per sottofase di ammissibilità');
    expect(within(pagamento).getByRole('button', { name: 'Scarica il grafico Domande di pagamento per sottofase di ammissibilità di SRD01 in PNG' })).toBeTruthy();
    expect(lette.sottofasiSostegno).toEqual(['?intervento=SRD01&stato=SENZA_STATO']);
    expect(lette.sottofasiPagamento).toEqual(['?intervento=SRD01&stato=SENZA_STATO']);
    expect(within(sostegno).getByRole('button', { name: 'Scarica i dati delle sottofasi delle domande di sostegno di SRD01 in CSV' })).toBeTruthy();
  });

  it('col solo grant di TX-0031 la sola scheda Sottofasi: nessuna lettura della pagina, nessuno scheletro che resta', async () => {
    profilo(['csr.tx-0024.read', 'csr.tx-0031.read']);
    const lette = servi();
    apri();
    expect(await screen.findByRole('tab', { name: 'Sottofasi' })).toBeTruthy();
    expect(screen.getAllByRole('tab')).toHaveLength(1);
    await trovaCard('Domande di sostegno per sottofase di ammissibilità');
    expect(screen.queryByRole('region', { name: 'Domande di pagamento per sottofase di ammissibilità' })).toBeNull();
    expect([lette.ammesse, lette.sostegno, lette.pagamento, lette.sottofasiPagamento]).toEqual([[], [], [], []]);
    expect(document.querySelector('.ui-skeleton--alto')).toBeNull();
  });
});

describe('RF024: stati del dettaglio (caricamento, errore, senza dati, nessuna domanda per lo stato)', () => {
  it('caricamento: lo scheletro della pagina con aria-live alla prima apertura, poi i dati', async () => {
    const t = trattenuta();
    servi();
    server.use(
      http.get('*/api/procedurale/domande-ammesse', async ({ request }) => {
        await t.attesa;
        return HttpResponse.json(ammessePer(new URL(request.url).searchParams));
      }),
    );
    apri();
    const scheletro = await waitFor(() => {
      const s = document.querySelector('.ui-skeleton--alto');
      if (!s) throw new Error('nessuno scheletro');
      return s;
    });
    expect([scheletro.getAttribute('role'), scheletro.getAttribute('aria-live')]).toEqual(['status', 'polite']);
    await act(async () => t.libera());
    expect(await screen.findByRole('region', { name: 'Domande ammesse' })).toBeTruthy();
  });

  it('una lettura in errore: un solo avviso dal problem-type con Riprova, il resto della pagina c e; Riprova la rilegge', async () => {
    let tentativi = 0;
    servi();
    server.use(
      http.get('*/api/procedurale/domande-ammesse', ({ request }) => {
        tentativi += 1;
        return tentativi === 1 ? HttpResponse.json(problema(503, 'CAPACITA_ESAURITA'), { status: 503 }) : HttpResponse.json(ammessePer(new URL(request.url).searchParams));
      }),
    );
    apri();
    const avviso = await screen.findByRole('alert');
    expect(screen.getAllByRole('alert')).toHaveLength(1);
    expect(avviso.textContent).not.toContain('503');
    expect(await screen.findByRole('region', { name: 'Domande di sostegno' })).toBeTruthy();
    expect(screen.queryByRole('region', { name: 'Domande ammesse' })).toBeNull();
    await userEvent.click(within(avviso).getByRole('button', { name: 'Riprova' }));
    expect(await screen.findByRole('region', { name: 'Domande ammesse' })).toBeTruthy();
  });

  it('tutte le letture in errore: un solo avviso della pagina, nessun KPI ne scheda', async () => {
    servi();
    server.use(indisponibile('domande-ammesse'), indisponibile('stati-sostegno'), indisponibile('stati-pagamento'));
    apri();
    await screen.findByRole('alert');
    await waitFor(() => expect(screen.queryByText(/^Dati non caricati/)).not.toBeNull());
    expect(screen.getAllByRole('alert')).toHaveLength(1);
    expect(screen.queryByRole('tab')).toBeNull();
  });

  it('una lettura in errore e le altre a zero: un solo avviso, nessun vuoto dedotto dall errore (mai uno zero inventato)', async () => {
    servi();
    server.use(indisponibile('stati-sostegno'));
    apri(`${SRD01}?stato=DECADENZA_TOTALE`);
    await screen.findByRole('alert');
    expect(testo((await screen.findByRole('region', { name: 'Domande ammesse' })).textContent)).toMatch(/^Domande ammesse0/);
    expect(screen.getAllByRole('alert')).toHaveLength(1);
    expect(screen.queryByText(/^Nessuna domanda di SRD01/)).toBeNull();
  });

  it('perimetro ADA (P4) senza domande di SRD01 nella sua ADA: la pill in evidenza, il vuoto e la barra dicono l ADA', async () => {
    servi();
    // le tre letture del P4: la riga di SRD01 c'e' (dato di programma), con zero domande nella sua ADA
    const zero = new URLSearchParams('intervento=SRD01&stato=DECADENZA_TOTALE');
    server.use(
      http.get('*/api/procedurale/domande-ammesse', () => HttpResponse.json({ ...ammessePer(zero), perimetro: 'ADA' })),
      http.get('*/api/procedurale/stati-sostegno', () => HttpResponse.json({ ...statiPer('SOSTEGNO', zero), perimetro: 'ADA' })),
      http.get('*/api/procedurale/stati-pagamento', () => HttpResponse.json({ ...statiPer('PAGAMENTO', zero), perimetro: 'ADA' })),
    );
    apri();
    expect(await screen.findByText('Nessuna domanda di SRD01 nella tua area (perimetro ADA).')).toBeTruthy();
    const barra = screen.getByRole('region', { name: 'Filtri attivi' });
    expect(within(barra).getByText(/^Perimetro: .* \(solo le domande della tua ADA\)$/).className).toContain('ui-pill--evidenza');
    expect(within(barra).getByText("Nessun filtro per stato: tutte le domande dell'intervento nella tua ADA")).toBeTruthy();
    expect(screen.queryByText(/nei report procedurali/)).toBeNull();
  });

  it('un 400 del backend (DATO_NON_VALIDO) sulle tre letture: un solo avviso col messaggio del problem-type, non il senza dati', async () => {
    servi();
    // AT001 o un intervento fuori dal CSR rispondono 200 senza righe (D2 del judge); un 400 resta un errore della pagina
    const rifiuto = (percorso: string) => http.get(`*/api/procedurale/${percorso}`, () => HttpResponse.json(problema(400, 'DATO_NON_VALIDO', 'stato non valido'), { status: 400 }));
    server.use(rifiuto('domande-ammesse'), rifiuto('stati-sostegno'), rifiuto('stati-pagamento'));
    apri(`${SRD01}?stato=AMMESSA`);
    const avviso = await screen.findByRole('alert');
    await waitFor(() => expect(avviso.textContent).toContain('3 sezioni della pagina non si sono caricate.'));
    expect(screen.getAllByRole('alert')).toHaveLength(1);
    expect(avviso.textContent).toContain('Richiesta non valida: stato non valido. Correggila e riprova.');
    expect(screen.queryByText(/^Nessun dato per questo intervento/)).toBeNull();
    expect(screen.queryByRole('tab')).toBeNull();
  });

  it('un intervento senza righe nei report: lo stato senza dati, il titolo col solo codice', async () => {
    servi();
    apri('/procedurale/interventi/SRX99');
    expect(await screen.findByText("Nessun dato per questo intervento nei report procedurali (l'Assistenza tecnica AT001 non è nei report).")).toBeTruthy();
    expect(screen.getByRole('heading', { level: 1, name: 'Intervento SRX99' })).toBeTruthy();
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('nessuna domanda per lo stato scelto: Modifica i filtri apre il pannello del solo stato; le schede restano', async () => {
    servi();
    apri(`${SRD01}?stato=DECADENZA_TOTALE`);
    const vuoto = (await screen.findByText('Nessuna domanda di SRD01 per lo stato area programmazione scelto.')).closest('[role="status"]') as HTMLElement;
    expect(screen.getAllByRole('tab')).toHaveLength(4);
    await userEvent.click(within(vuoto).getByRole('button', { name: 'Modifica i filtri' }));
    expect(await screen.findByRole('dialog', { name: "Filtri del dettaglio dell'intervento" })).toBeTruthy();
  });
});
