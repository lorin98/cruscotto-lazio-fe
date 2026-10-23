// Pagina /procedurale (green-fe step7): describe taggati coi REQ della route (RF024..RF029), dati dagli scenari del
// backend (fixture del procedurale) con letture che rispondono ai parametri della query, MSW seminato con
// onUnhandledRequest 'error' (ogni lettura e' dichiarata qui), axe-core diretto. ECharts e' il grafico finto del setup:
// i clic sulle barre sono quelli del dato disegnato.
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
import { VALORI, ammessePer, riepilogoPer, statiPer } from '../../../features/procedurale/testing/fixture';
import { lettureProcedurale } from '../../../features/procedurale/testing/letture';
import type { Basi } from '../../../features/procedurale/testing/letture';
import Pagina from './page';

const PERCORSO = '/procedurale';
const TITOLO = 'Procedurale: panoramica';
const testo = (s: string | null | undefined) => (s ?? '').replace(/\s/g, ' ');
const profilo = (roles: string[]) =>
  server.use(http.get('*/auth/status', () => HttpResponse.json({ authenticated: true, user: { username: 'U', profile: 'p3-funzionario-area-pro', roles } })));

function servi(basi?: Basi) {
  const { handlers, lette } = lettureProcedurale(basi);
  server.use(...handlers);
  return lette;
}

const apri = (indirizzo = PERCORSO) => renderPagina(Pagina, PERCORSO, indirizzo);
const h1 = () => screen.getByRole('heading', { level: 1, name: TITOLO });
const dove = (router: ReturnType<typeof apri>['router']) => `${router.state.location.pathname}${router.state.location.search}`;

describe('RF024: filtri dei report procedurali e ultimo dato sincronizzato (TX-0024)', () => {
  it('le quattro letture coi filtri dell indirizzo, una sola dei valori; un solo h1 col focus; nessuna violazione axe', async () => {
    const lette = servi();
    const { container } = apri(`${PERCORSO}?intervento=SRD01&os=OS4`);
    await trovaCard('Domande di sostegno per stato');
    await trovaCard('Importo richiesto e contributo ammesso per intervento');
    await trovaCard('Domande per stato area programmazione');
    for (const l of [lette.ammesse, lette.sostegno, lette.pagamento, lette.riepilogo]) expect(l).toEqual(['?intervento=SRD01&os=OS4']);
    expect([lette.filtri, lette.statiArea]).toEqual([1, 1]);
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(document.activeElement).toBe(h1());
    expect(document.title).toBe('Panoramica - Procedurale - Cruscotto CSR 2023-2027');
    await expectNoA11yViolations(container);
  });

  it('Applica i filtri dal pannello della barra: l indirizzo, le letture coi filtri nuovi, il focus torna al bottone Filtri', async () => {
    const lette = servi();
    const { router } = apri();
    await trovaCard('Domande di sostegno per stato');
    await userEvent.click(screen.getByRole('button', { name: /^Filtri/ }));
    const pannello = await screen.findByRole('dialog', { name: 'Filtri dei report procedurali' });
    await userEvent.click(within(pannello).getByRole('button', { name: 'OS5' }));
    await userEvent.click(within(pannello).getByRole('button', { name: 'Applica i filtri' }));
    await waitFor(() => expect(router.state.location.search).toBe('?os=OS5'));
    await waitFor(() => expect(lette.sostegno.at(-1)).toBe('?os=OS5'));
    await waitFor(() => expect(document.activeElement).toBe(screen.getByRole('button', { name: /^Filtri/ })));
  });

  it('TX-0024 in errore: lo stato dei valori con Riprova e la pill "non disponibile"; sparito col Riprova, il focus va sul titolo', async () => {
    let tentativi = 0;
    servi();
    server.use(
      http.get('*/api/procedurale/filtri', () => {
        tentativi += 1;
        return tentativi === 1 ? HttpResponse.json(problema(503, 'CAPACITA_ESAURITA'), { status: 503 }) : HttpResponse.json(VALORI);
      }),
    );
    apri(`${PERCORSO}?intervento=SRD01`);
    const stato = (await screen.findByText(/^Valori dei filtri non disponibili: /)).closest('[role="status"]') as HTMLElement;
    expect(screen.getByText('Ultimo dato sincronizzato: non disponibile')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Togli il filtro Intervento SRD01' })).toBeTruthy();
    await trovaCard('Domande di sostegno per stato');
    await userEvent.click(within(stato).getByRole('button', { name: 'Riprova' }));
    await waitFor(() => expect(screen.queryByText(/^Valori dei filtri non disponibili: /)).toBeNull());
    await waitFor(() => expect(document.activeElement).toBe(h1()));
    expect(screen.getByRole('button', { name: /^Ultimo dato sincronizzato: dati al 02\/03\/2026/ })).toBeTruthy();
  });

  it('senza il grant di TX-0024: nessuna lettura dei valori ne pill "Dati al"; il pannello propone i codici della risposta', async () => {
    profilo(['csr.tx-0025.read', 'csr.tx-0026.read', 'csr.tx-0027.read', 'csr.tx-0028.read', 'csr.tx-0029.read']);
    const lette = servi();
    apri();
    await trovaCard('Importo richiesto e contributo ammesso per intervento');
    expect(lette.filtri).toBe(0);
    expect(screen.queryByRole('button', { name: /^Ultimo dato sincronizzato/ })).toBeNull();
    expect(screen.queryByText(/^Valori dei filtri non disponibili/)).toBeNull();
    await userEvent.click(screen.getByRole('button', { name: /^Filtri/ }));
    const pannello = await screen.findByRole('dialog', { name: 'Filtri dei report procedurali' });
    expect(within(pannello).getByRole('checkbox', { name: 'SRD01' })).toBeTruthy();
  });
});

describe('RF025: filtro per stato domanda area programmazione (TX-0025)', () => {
  it('lo stato dell indirizzo va in tutte le letture e nel chip con la descrizione di TX-0025; tolto il chip le letture ripartono', async () => {
    const lette = servi();
    apri(`${PERCORSO}?stato=AMMESSA&stato=SENZA_STATO`);
    await trovaCard('Domande di sostegno per stato');
    expect(lette.ammesse).toEqual(['?stato=AMMESSA&stato=SENZA_STATO']);
    expect(lette.riepilogo).toEqual(['?stato=AMMESSA&stato=SENZA_STATO']);
    await userEvent.click(await screen.findByRole('button', { name: 'Togli il filtro Stato area programmazione Senza stato area programmazione' }));
    await waitFor(() => expect(lette.ammesse.at(-1)).toBe('?stato=AMMESSA'));
    await waitFor(() => expect(lette.pagamento.at(-1)).toBe('?stato=AMMESSA'));
  });

  it('un valore di stato fuori formato nell indirizzo non arriva alle letture ne diventa un chip', async () => {
    const lette = servi();
    apri(`${PERCORSO}?stato=%3Cscript%3E&intervento=SRD01`);
    await trovaCard('Domande di sostegno per stato');
    expect(lette.ammesse).toEqual(['?intervento=SRD01']);
    expect(screen.queryByRole('button', { name: /^Togli il filtro Stato area programmazione/ })).toBeNull();
  });

  it('il clic su una barra dello stato area programmazione filtra la pagina per quello stato (scelta 3)', async () => {
    const lette = servi();
    const { router } = apri(`${PERCORSO}?intervento=SRD01`);
    clicSulCodice(graficoDi(await trovaCard('Domande per stato area programmazione')), 'REVOCATA');
    await waitFor(() => expect(router.state.location.search).toBe('?intervento=SRD01&stato=REVOCATA'));
    await waitFor(() => expect(lette.sostegno.at(-1)).toBe('?intervento=SRD01&stato=REVOCATA'));
    expect(await screen.findByRole('button', { name: 'Togli il filtro Stato area programmazione Revocata' })).toBeTruthy();
  });
});

describe('RF026: domande ammesse, atto di concessione e contributo nella panoramica (TX-0026)', () => {
  it('i quattro KPI dal totale del backend (mai sommati nel browser), col link delle ammesse verso l elenco', async () => {
    servi();
    const corpo = ammessePer(new URLSearchParams());
    server.use(http.get('*/api/procedurale/domande-ammesse', () => HttpResponse.json({ ...corpo, totale: { ...corpo.totale, domandeAmmesse: 7 } })));
    apri();
    const ammesse = await screen.findByRole('region', { name: 'Domande ammesse' });
    expect(testo(ammesse.textContent)).toContain('7');
    expect(within(ammesse).getByRole('link', { name: "Apri nell'elenco operativo le domande ammesse" }).getAttribute('href')).toBe('/elenco-operativo/domande?voceProgrammazione=AMMESSA');
    expect(testo(screen.getByRole('region', { name: 'Domande con atto di concessione' }).textContent)).toContain('Non disponibile: fonte atto di concessione non attiva');
    expect(testo(screen.getByRole('region', { name: 'Interventi attivati' }).textContent)).toContain('2 su 3');
  });

  it('il clic su una barra degli importi apre il dettaglio dell intervento con lo stato della pagina', async () => {
    servi();
    const { router } = apri(`${PERCORSO}?stato=AMMESSA`);
    clicSulCodice(graficoDi(await trovaCard('Importo richiesto e contributo ammesso per intervento')), 'SRD01');
    await waitFor(() => expect(dove(router)).toBe('/procedurale/interventi/SRD01?stato=AMMESSA'));
  });

  it('senza il grant dell elenco (TX-0056) nessun link; col solo TX-0026 le sole sezioni delle ammesse, nessuna altra lettura', async () => {
    profilo(['csr.tx-0024.read', 'csr.tx-0026.read']);
    const lette = servi();
    apri();
    const ammesse = await screen.findByRole('region', { name: 'Domande ammesse' });
    expect(within(ammesse).queryByRole('link')).toBeNull();
    await trovaCard('Importo richiesto e contributo ammesso per intervento');
    expect(screen.queryByRole('region', { name: 'Domande di sostegno per stato' })).toBeNull();
    expect(screen.queryByRole('region', { name: 'Domande per stato area programmazione' })).toBeNull();
    expect([lette.sostegno, lette.pagamento, lette.riepilogo]).toEqual([[], [], []]);
    expect(lette.statiArea).toBe(0);
  });
});

describe('RF027 e RF028: stati delle domande di sostegno e di pagamento nella panoramica (TX-0027, TX-0028)', () => {
  it('le due card nel totale con la voce senza fonte dichiarata; il clic su una barra e il link della card aprono la pagina degli stati', async () => {
    servi();
    const { router } = apri(`${PERCORSO}?intervento=SRD01&stato=AMMESSA&stato=REVOCATA`);
    const sostegno = await trovaCard('Domande di sostegno per stato');
    expect(testo(sostegno.textContent)).toContain('In compilazione: non disponibile (fonte domande in compilazione non attiva)');
    const pagamento = await trovaCard('Domande di pagamento per stato');
    expect(within(pagamento).getByRole('link', { name: 'Apri gli stati delle domande di pagamento' }).getAttribute('href')).toBe('/procedurale/stati-pagamento?intervento=SRD01&stato=AMMESSA&stato=REVOCATA');
    clicSulCodice(graficoDi(sostegno), 'RILASCIATO');
    await waitFor(() => expect(dove(router)).toBe('/procedurale/stati-sostegno?intervento=SRD01&stato=AMMESSA&stato=REVOCATA'));
  });

  it('nessuna domanda del tipo per i filtri: lo stato vuoto con Modifica i filtri; cambiati i filtri il focus va sul titolo', async () => {
    servi();
    const { router } = apri(`${PERCORSO}?intervento=SRA01`);
    const vuoto = (await screen.findByText('Nessuna domanda di pagamento CSR-DP per i filtri scelti.')).closest('[role="status"]') as HTMLElement;
    await trovaCard('Domande di sostegno per stato');
    await userEvent.click(within(vuoto).getByRole('button', { name: 'Modifica i filtri' }));
    const pannello = await screen.findByRole('dialog', { name: 'Filtri dei report procedurali' });
    await userEvent.click(within(pannello).getByRole('button', { name: 'Azzera' }));
    await userEvent.click(within(pannello).getByRole('button', { name: 'Applica i filtri' }));
    await waitFor(() => expect(router.state.location.search).toBe(''));
    // il bottone che aveva aperto il pannello sparisce con lo stato vuoto: il focus va sul titolo della pagina
    await waitFor(() => expect(document.activeElement).toBe(h1()));
    await trovaCard('Domande di pagamento per stato');
  });
});

describe('RF029: stato area programmazione dal riepilogo per intervento nella panoramica (TX-0029)', () => {
  it('la tabella equivalente apre nell elenco le domande di ogni stato coi filtri della pagina; il totale del backend', async () => {
    servi();
    apri(`${PERCORSO}?intervento=SRD01`);
    const t = await tabellaDi(await trovaCard('Domande per stato area programmazione'));
    expect(within(t).getByRole('link', { name: "Apri nell'elenco operativo la domanda con stato area programmazione Revocata (stato osservato fuori catalogo)" }).getAttribute('href')).toBe(
      '/elenco-operativo/domande?voceProgrammazione=REVOCATA&intervento=SRD01',
    );
    expect(within(within(t).getByRole('row', { name: /^Presentata/ })).queryByRole('link')).toBeNull();
    expect(testo(within(t).getByRole('row', { name: /^Totale/ }).textContent)).toBe('Totale6');
  });
});

describe('RF024: stati della panoramica (caricamento, errore, vuoto, perimetro)', () => {
  it('caricamento: lo scheletro della sezione con aria-live, le altre sezioni intanto ci sono; poi i dati', async () => {
    const t = trattenuta();
    servi();
    server.use(
      http.get('*/api/procedurale/stati-sostegno', async ({ request }) => {
        await t.attesa;
        return HttpResponse.json(statiPer('SOSTEGNO', new URL(request.url).searchParams));
      }),
    );
    apri();
    await trovaCard('Domande di pagamento per stato');
    expect(screen.getAllByText('Caricamento in corso…')[0].closest('[role="status"]')?.getAttribute('aria-live')).toBe('polite');
    await act(async () => t.libera());
    await trovaCard('Domande di sostegno per stato');
  });

  it('errore di una lettura: un solo avviso della pagina dal problem-type con Riprova; le altre sezioni restano', async () => {
    let tentativi = 0;
    servi();
    server.use(
      http.get('*/api/procedurale/domande-ammesse', ({ request }) => {
        tentativi += 1;
        return tentativi === 1 ? HttpResponse.json(problema(403, 'ACCESSO_NEGATO'), { status: 403 }) : HttpResponse.json(ammessePer(new URL(request.url).searchParams));
      }),
    );
    apri();
    const avviso = await screen.findByRole('alert');
    expect(screen.getAllByRole('alert')).toHaveLength(1);
    expect(avviso.textContent).not.toContain('403');
    await trovaCard('Domande di sostegno per stato');
    expect(screen.queryByRole('region', { name: 'Domande ammesse' })).toBeNull();
    await userEvent.click(within(avviso).getByRole('button', { name: 'Riprova' }));
    expect(await screen.findByRole('region', { name: 'Domande ammesse' })).toBeTruthy();
    await waitFor(() => expect(screen.queryByRole('alert')).toBeNull());
  });

  it('vuoto: nessun intervento per i filtri (un obiettivo senza interventi), senza errori', async () => {
    servi();
    apri(`${PERCORSO}?os=OS9`);
    expect(await screen.findByText('Nessun intervento per i filtri scelti.')).toBeTruthy();
    expect(await screen.findByText('Nessuna domanda di sostegno per i filtri scelti.')).toBeTruthy();
    expect(screen.queryByRole('region', { name: 'Domande ammesse' })).toBeNull();
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('perimetro ADA (P4, SC-PC_SCOPE_P4): gli interventi del perimetro ufficiale con le domande a zero; KPI a 0, le domande dicono la propria area', async () => {
    servi();
    // la risposta del P4 senza domande nella sua ADA: tutti gli interventi, con zero domande
    const zero = new URLSearchParams('stato=DECADENZA_TOTALE');
    server.use(
      http.get('*/api/procedurale/domande-ammesse', () => HttpResponse.json({ ...ammessePer(zero), perimetro: 'ADA' })),
      http.get('*/api/procedurale/stati-sostegno', () => HttpResponse.json({ ...statiPer('SOSTEGNO', zero), perimetro: 'ADA' })),
      http.get('*/api/procedurale/stati-pagamento', () => HttpResponse.json({ ...statiPer('PAGAMENTO', zero), perimetro: 'ADA' })),
      http.get('*/api/procedurale/riepilogo', () => HttpResponse.json({ ...riepilogoPer(zero), perimetro: 'ADA' })),
    );
    apri();
    expect(testo((await screen.findByRole('region', { name: 'Domande ammesse' })).textContent)).toMatch(/^Domande ammesse0/);
    expect(testo(screen.getByRole('region', { name: 'Interventi attivati' }).textContent)).toContain('0 su 3');
    await trovaCard('Importo richiesto e contributo ammesso per intervento');
    expect(await screen.findByText('Nessuna domanda di sostegno nella tua area (perimetro ADA).')).toBeTruthy();
    expect(screen.getByText('Nessuna domanda di pagamento CSR-DP nella tua area (perimetro ADA).')).toBeTruthy();
    expect(screen.queryByText(/^Nessun intervento/)).toBeNull();
    expect(screen.queryByRole('alert')).toBeNull();
    const pill = within(screen.getByRole('region', { name: 'Filtri attivi' })).getByText(/^Perimetro: .* \(solo le domande della tua ADA\)$/);
    expect(pill.className).toContain('ui-pill--evidenza');
  });

  it('perimetro ADA e filtri senza interventi: il vuoto degli interventi parla dei filtri, non dell area (wireframe approvato)', async () => {
    servi();
    server.use(http.get('*/api/procedurale/domande-ammesse', ({ request }) => HttpResponse.json({ ...ammessePer(new URL(request.url).searchParams), perimetro: 'ADA' })));
    apri(`${PERCORSO}?os=OS9`);
    expect(await screen.findByText('Nessun intervento per i filtri scelti.')).toBeTruthy();
    expect(screen.queryByText(/nella tua area/)).toBeNull();
  });
});
