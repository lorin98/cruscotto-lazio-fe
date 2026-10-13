import { describe, expect, it } from 'vitest';
import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import type { JsonBodyType } from 'msw';
import { server } from '../../../shared/api/mock/server';
import { expectNoA11yViolations } from '../../../shared/testing/axe';
import { graficoDi, tabellaDi, trovaCard } from '../../../shared/testing/card-grafico';
import { DOMANDE_PER_ANNO, FILTRI, IMPORTI_PER_ANNO, RIEPILOGO, SIGC_DOMANDE, SIGC_IMPORTI, SPESA } from '../../../features/finanziario/testing/fixture';
import { renderPagina } from '../../../shared/testing/render-pagina';
import { clicSu, clicSulDato } from '../../../shared/testing/grafico-finto';
import Pagina from './page';

const PERCORSO = '/finanziario/interventi/:codice';
const SRA01 = { ...RIEPILOGO, righe: [RIEPILOGO.righe[0]] };

/** Serve le letture del dettaglio e registra la query di ognuna (per verificare il filtro sull'intervento). */
function servi() {
  const lette: Record<string, string> = {};
  const registra = (nome: string, corpo: JsonBodyType) =>
    http.get(`*/api/finanziario/${nome}`, ({ request }) => {
      lette[nome] = new URL(request.url).search;
      return HttpResponse.json(corpo);
    });
  server.use(
    registra('filtri', FILTRI),
    registra('riepilogo', SRA01),
    registra('spesa-per-intervento', SPESA),
    registra('domande-per-anno', DOMANDE_PER_ANNO),
    registra('importi-per-anno', IMPORTI_PER_ANNO),
    registra('sigc/domande', SIGC_DOMANDE),
    registra('sigc/importi', SIGC_IMPORTI),
  );
  return lette;
}

describe("dettaglio dell'intervento (flusso panoramica)", () => {
  it("testata con la descrizione dal backend, KPI dalla riga del riepilogo, letture filtrate sull'intervento", async () => {
    const lette = servi();
    renderPagina(Pagina, PERCORSO, '/finanziario/interventi/SRA01');
    const h1 = await screen.findByRole('heading', { level: 1, name: 'Intervento di prova A' });
    await waitFor(() => expect(document.activeElement).toBe(h1));
    expect(document.title).toBe('SRA01 - Finanziario - Cruscotto CSR 2023-2027');
    expect(screen.getByText('Intervento SRA01')).toBeTruthy();
    expect(screen.getByText(/^Contributo ambientale 12,5\s?%$/)).toBeTruthy();
    expect((await screen.findByRole('region', { name: 'Domande presentate' })).textContent).toContain('12');
    expect(screen.getByRole('region', { name: 'Risorse quota FEASR' }).textContent).not.toContain('Non disponibile');
    expect(lette.riepilogo).toBe('?intervento=SRA01');
    expect(lette['spesa-per-intervento']).toBe('?intervento=SRA01');
    const briciole = screen.getByRole('navigation', { name: 'Percorso' });
    expect(within(briciole).getByRole('link', { name: 'Riepilogo per intervento' }).getAttribute('href')).toBe('/finanziario/riepilogo');
    expect(within(briciole).getByText('SRA01').getAttribute('aria-current')).toBe('page');
  });

  // N-03: l'indirizzo del dettaglio porta la selezione da cui si e' arrivati; le letture restano sull'intervento
  it("selezione conservata: breadcrumb e Torna al riepilogo tornano con i filtri, nella barra il solo intervento", async () => {
    const lette = servi();
    renderPagina(Pagina, PERCORSO, '/finanziario/interventi/SRA01?og=OG1');
    await screen.findByRole('heading', { level: 1, name: 'Intervento di prova A' });
    await waitFor(() => expect(lette.riepilogo).toBe('?intervento=SRA01'));
    const briciole = screen.getByRole('navigation', { name: 'Percorso' });
    expect(within(briciole).getByRole('link', { name: 'Finanziario' }).getAttribute('href')).toBe('/finanziario?og=OG1');
    expect(within(briciole).getByRole('link', { name: 'Riepilogo per intervento' }).getAttribute('href')).toBe('/finanziario/riepilogo?og=OG1');
    expect((await screen.findByRole('link', { name: 'Torna al riepilogo' })).getAttribute('href')).toBe('/finanziario/riepilogo?og=OG1');
    expect(screen.getByRole('link', { name: 'Filtra i report su questo intervento' }).getAttribute('href')).toBe('/finanziario?intervento=SRA01');
    expect(screen.queryByText('OG1')).toBeNull();
  });

  it('le schede leggono solo quando si aprono; la scheda delle voci dice il motivo dei valori assenti', async () => {
    const lette = servi();
    renderPagina(Pagina, PERCORSO, '/finanziario/interventi/SRA01');
    await trovaCard('Pagato netto sulla dotazione');
    expect(graficoDi(await trovaCard('Dalla dotazione al residuo'))).toBeTruthy();
    expect(lette['domande-per-anno']).toBeUndefined();
    expect(lette['sigc/domande']).toBeUndefined();
    await userEvent.click(screen.getByRole('tab', { name: 'Domande' }));
    await trovaCard('Domande per anno di raccolta');
    expect(lette['domande-per-anno']).toBe('?intervento=SRA01');
    expect(lette['importi-per-anno']).toBe('?intervento=SRA01');
    await userEvent.click(screen.getByRole('tab', { name: 'SIGC' }));
    await trovaCard('Importi SIGC');
    expect(lette['sigc/domande']).toBe('?intervento=SRA01');
    await userEvent.click(screen.getByRole('tab', { name: 'Tutte le voci' }));
    const voci = within(screen.getByRole('tabpanel')).getByRole('table');
    expect(voci.textContent).toContain('fonte impegni non attiva');
  });

  it('il KPI assente lo dice, senza zero', async () => {
    servi();
    server.use(http.get('*/api/finanziario/riepilogo', () => HttpResponse.json({ ...SRA01, righe: [{ ...SRA01.righe[0], risorseQuotaFeasr: { valore: null, motivo: 'NON_VALORIZZATO', fonte: null } }] })));
    renderPagina(Pagina, PERCORSO, '/finanziario/interventi/SRA01');
    expect((await screen.findByRole('region', { name: 'Risorse quota FEASR' })).textContent).toContain('Non valorizzato: il dato non è presente nella fonte');
    expect((await tabellaDi(await trovaCard('Dalla dotazione al residuo'))).textContent).toBeTruthy();
  });

  it("intervento fuori dal perimetro (nessuna riga): testata e stato vuoto con il ritorno al riepilogo", async () => {
    servi();
    server.use(http.get('*/api/finanziario/riepilogo', () => HttpResponse.json({ perimetro: 'ADA', righe: [] })));
    renderPagina(Pagina, PERCORSO, '/finanziario/interventi/SRA03');
    expect(await screen.findByRole('heading', { level: 1, name: 'Intervento di prova B' })).toBeTruthy();
    const vuoto = (await screen.findByText(/Nessun dato per questo intervento nel riepilogo/)).closest('[role]');
    expect(vuoto?.getAttribute('role')).toBe('status');
    expect(within(vuoto as HTMLElement).getByRole('link', { name: 'Torna al riepilogo' })).toBeTruthy();
    expect(screen.queryByRole('tablist')).toBeNull();
  });

  it('codice non valido nella route: titolo e avviso, nessuna lettura', async () => {
    const lette = servi();
    renderPagina(Pagina, PERCORSO, '/finanziario/interventi/%3Cscript%3E');
    expect(await screen.findByRole('heading', { level: 1, name: 'Intervento non valido' })).toBeTruthy();
    expect(screen.getByRole('alert').textContent).toContain("non è un codice di intervento");
    expect(lette.riepilogo).toBeUndefined();
  });

  it('senza il grant di TX-0011 il dettaglio non legge e lo dice', async () => {
    const lette = servi();
    server.use(http.get('*/auth/status', () => HttpResponse.json({ authenticated: true, user: { username: 'U', roles: ['csr.tx-0002.read'] } })));
    renderPagina(Pagina, PERCORSO, '/finanziario/interventi/SRA01');
    expect(await screen.findByText('Sezione non disponibile per il tuo profilo.')).toBeTruthy();
    expect(lette.riepilogo).toBeUndefined();
  });

  it('nessuna violazione axe', async () => {
    servi();
    const { container } = renderPagina(Pagina, PERCORSO, '/finanziario/interventi/SRA01');
    await trovaCard('Dalla dotazione al residuo');
    await expectNoA11yViolations(container);
  });
});

const indirizzoDi = (router: { state: { location: { pathname: string; search: string } } }) => `${router.state.location.pathname}${router.state.location.search}`;

describe("RA003: drill-down dal dettaglio dell'intervento all'elenco operativo", () => {
  it("KPI Domande presentate e clic su un segmento di Domande per anno: l'intervento del dettaglio con la selezione di provenienza", async () => {
    servi();
    const { router } = renderPagina(Pagina, PERCORSO, '/finanziario/interventi/SRA01?intervento=SRA03&os=OS4');
    const kpi = await screen.findByRole('link', { name: "Apri nell'elenco operativo le domande presentate dell'intervento SRA01" });
    expect(kpi.getAttribute('href')).toBe('/elenco-operativo/domande?presentata=true&intervento=SRA01&os=OS4');
    await userEvent.click(screen.getByRole('tab', { name: 'Domande' }));
    const grafico = graficoDi(await trovaCard('Domande per anno di raccolta'));
    expect(grafico).toBeTruthy();
    // il segmento disegnato: serie delle non classificate, seconda categoria (senza anno, in coda)
    clicSulDato(grafico!, 2, 1);
    await waitFor(() => expect(indirizzoDi(router)).toBe('/elenco-operativo/domande?presentata=true&anno=SENZA&annualita=NON_CLASSIFICATE&intervento=SRA01&os=OS4'));
  });
  it('Domande per anno da tastiera: la vista Tabella porta in ogni cella anno per annualita (e nel totale) il link del segmento', async () => {
    servi();
    const { router } = renderPagina(Pagina, PERCORSO, '/finanziario/interventi/SRA01?intervento=SRA03&os=OS4');
    await userEvent.click(await screen.findByRole('tab', { name: 'Domande' }));
    const tabella = await tabellaDi(await trovaCard('Domande per anno di raccolta'));
    const href = (nome: string) => within(tabella).getByRole('link', { name: `Apri nell'elenco operativo le domande dell'intervento SRA01 ${nome}` }).getAttribute('href');
    expect(href('del 2024, prima annualità')).toBe('/elenco-operativo/domande?presentata=true&anno=2024&annualita=PRIMA&intervento=SRA01&os=OS4');
    expect(href('del 2024, altre annualità')).toBe('/elenco-operativo/domande?presentata=true&anno=2024&annualita=ALTRE&intervento=SRA01&os=OS4');
    expect(href('del 2024')).toBe('/elenco-operativo/domande?presentata=true&anno=2024&intervento=SRA01&os=OS4');
    expect(href('senza anno di raccolta, non classificate')).toBe('/elenco-operativo/domande?presentata=true&anno=SENZA&annualita=NON_CLASSIFICATE&intervento=SRA01&os=OS4');
    // 2 anni x (3 annualita + totale): un link per cella, e la cella mostra ancora il numero
    expect(within(tabella).getAllByRole('link')).toHaveLength(8);
    expect(within(tabella).getByText('510')).toBeTruthy();
    // percorso da tastiera: il link della cella si raggiunge e si apre con Invio
    const cella = within(tabella).getByRole('link', { name: "Apri nell'elenco operativo le domande dell'intervento SRA01 del 2024, prima annualità" });
    cella.focus();
    expect(document.activeElement).toBe(cella);
    await userEvent.keyboard('{Enter}');
    await waitFor(() => expect(indirizzoDi(router)).toBe('/elenco-operativo/domande?presentata=true&anno=2024&annualita=PRIMA&intervento=SRA01&os=OS4'));
  });
  it('Domande per anno: con e senza il grant la vista Tabella ha le stesse intestazioni e gli stessi testi di cella, link a parte', async () => {
    const leggi = async () => {
      await userEvent.click(await screen.findByRole('tab', { name: 'Domande' }));
      const tabella = await tabellaDi(await trovaCard('Domande per anno di raccolta'));
      const copia = tabella.cloneNode(true) as HTMLElement;
      copia.querySelectorAll('a').forEach((a) => a.remove());
      const testi = Array.from(copia.querySelectorAll('th, td')).map((c) => c.textContent?.trim());
      return testi;
    };
    servi();
    const conGrant = renderPagina(Pagina, PERCORSO, '/finanziario/interventi/SRA01');
    const testiConGrant = await leggi();
    conGrant.unmount();
    server.use(http.get('*/auth/status', () => HttpResponse.json({ authenticated: true, user: { username: 'U', roles: ['csr.tx-0002.read', 'csr.tx-0008.read', 'csr.tx-0011.read'] } })));
    renderPagina(Pagina, PERCORSO, '/finanziario/interventi/SRA01');
    expect(await leggi()).toEqual(testiConGrant);
  });
  it("Domande per anno senza il grant dell'elenco (TX-0056): la vista Tabella ha i numeri e nessun link", async () => {
    servi();
    server.use(http.get('*/auth/status', () => HttpResponse.json({ authenticated: true, user: { username: 'U', roles: ['csr.tx-0002.read', 'csr.tx-0008.read', 'csr.tx-0011.read'] } })));
    renderPagina(Pagina, PERCORSO, '/finanziario/interventi/SRA01');
    await userEvent.click(await screen.findByRole('tab', { name: 'Domande' }));
    const tabella = await tabellaDi(await trovaCard('Domande per anno di raccolta'));
    expect(within(tabella).queryAllByRole('link')).toHaveLength(0);
    expect(within(tabella).getByText('510')).toBeTruthy();
  });
  it('voci SIGC come link (anche da tastiera) e clic sulla cascata degli importi', async () => {
    servi();
    const { router } = renderPagina(Pagina, PERCORSO, '/finanziario/interventi/SRA01');
    await userEvent.click(await screen.findByRole('tab', { name: 'SIGC' }));
    const pagate = await screen.findByRole('link', { name: "pagate: apri nell'elenco operativo le domande SIGC pagate dell'intervento SRA01" });
    expect(pagate.getAttribute('href')).toBe('/elenco-operativo/domande?sigc=true&pagamento=PAGATA&intervento=SRA01');
    expect(screen.getByRole('link', { name: "presentate: apri nell'elenco operativo le domande SIGC presentate dell'intervento SRA01" }).getAttribute('href')).toBe(
      '/elenco-operativo/domande?sigc=true&intervento=SRA01',
    );
    const cascata = graficoDi(await trovaCard('Importi SIGC'));
    expect(cascata).toBeTruthy();
    clicSu(cascata!, { name: 'Ammesso', dataIndex: 0 });
    await waitFor(() => expect(indirizzoDi(router)).toBe('/elenco-operativo/domande?sigc=true&intervento=SRA01'));
  });
  it("clic sulla barra 'Da pagare' delle domande SIGC: le SIGC da pagare dell'intervento", async () => {
    servi();
    const { router } = renderPagina(Pagina, PERCORSO, '/finanziario/interventi/SRA01');
    await userEvent.click(await screen.findByRole('tab', { name: 'SIGC' }));
    const grafico = graficoDi(await trovaCard('Domande SIGC'));
    expect(grafico).toBeTruthy();
    clicSulDato(grafico!, 0, 2);
    await waitFor(() => expect(indirizzoDi(router)).toBe('/elenco-operativo/domande?sigc=true&pagamento=DA_PAGARE&intervento=SRA01'));
  });
  it('importi SIGC senza cascata (importi non valorizzati): il link da tastiera resta, il sottotitolo non promette il clic', async () => {
    servi();
    const nv = { valore: null, motivo: 'NON_VALORIZZATO', fonte: null };
    server.use(http.get('*/api/finanziario/sigc/importi', () => HttpResponse.json({ ...SIGC_IMPORTI, richiesto: nv, ammesso: nv, pagato: nv, ancoraDaPagare: nv, pagatoOltreAmmesso: nv })));
    renderPagina(Pagina, PERCORSO, '/finanziario/interventi/SRA01');
    await userEvent.click(await screen.findByRole('tab', { name: 'SIGC' }));
    const card = await trovaCard('Importi SIGC');
    expect(card.textContent).not.toContain('Clic sulla cascata');
    expect(
      screen.getByRole('link', { name: "Le domande SIGC dell'intervento nell'elenco operativo: apri nell'elenco operativo (sinottico con richiesto, ammesso, pagato e ancora da pagare)" }).getAttribute('href'),
    ).toBe('/elenco-operativo/domande?sigc=true&intervento=SRA01');
  });
  it("tornando indietro dall'elenco operativo la scheda del dettaglio e' quella da cui si era partiti", async () => {
    servi();
    const { router } = renderPagina(Pagina, PERCORSO, '/finanziario/interventi/SRA01');
    await userEvent.click(await screen.findByRole('tab', { name: 'SIGC' }));
    expect(router.state.location.search).toBe('?scheda=sigc');
    await userEvent.click(await screen.findByRole('link', { name: "pagate: apri nell'elenco operativo le domande SIGC pagate dell'intervento SRA01" }));
    await waitFor(() => expect(router.state.location.pathname).toBe('/elenco-operativo/domande'));
    await act(() => router.navigate(-1));
    await waitFor(() => expect(screen.getByRole('tab', { name: 'SIGC' }).getAttribute('aria-selected')).toBe('true'));
    expect(screen.getByRole('tab', { name: 'Sintesi' }).getAttribute('aria-selected')).toBe('false');
  });
  // review v4 A-01: la scheda scelta e' subito quella selezionata; il clic nativo, fuori da act() come nel browser (act()
  // scaricherebbe anche la navigazione e il test non distinguerebbe lo stato locale dal solo indirizzo)
  it('la scheda scelta e subito quella selezionata, prima che l indirizzo la segua', async () => {
    servi();
    const { router } = renderPagina(Pagina, PERCORSO, '/finanziario/interventi/SRA01');
    const sigc = await screen.findByRole('tab', { name: 'SIGC' });
    sigc.click();
    // un solo giro di microtask: React applica lo stato dell'evento discreto, la navigazione (transizione) arriva dopo
    await Promise.resolve();
    expect(sigc.getAttribute('aria-selected')).toBe('true');
    await waitFor(() => expect(router.state.location.search).toBe('?scheda=sigc'));
  });
  // review v4 V-05: la vista Tabella di Domande per anno (il percorso da tastiera del clic) si ritrova tornando dall'elenco
  it("tornando indietro dall'elenco operativo la vista Tabella di Domande per anno e' ancora quella", async () => {
    servi();
    const { router } = renderPagina(Pagina, PERCORSO, '/finanziario/interventi/SRA01');
    await userEvent.click(await screen.findByRole('tab', { name: 'Domande' }));
    const card = await trovaCard('Domande per anno di raccolta');
    await userEvent.click(within(within(card).getByRole('group', { name: 'Vista di Domande per anno di raccolta' })).getByRole('button', { name: 'Tabella' }));
    const tabella = await tabellaDi(card);
    await userEvent.click(within(tabella).getByRole('link', { name: "Apri nell'elenco operativo le domande dell'intervento SRA01 del 2024, prima annualità" }));
    await waitFor(() => expect(router.state.location.pathname).toBe('/elenco-operativo/domande'));
    await act(() => router.navigate(-1));
    const dopo = await trovaCard('Domande per anno di raccolta');
    expect(within(within(dopo).getByRole('group', { name: 'Vista di Domande per anno di raccolta' })).getByRole('button', { name: 'Tabella' }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByRole('tab', { name: 'Domande' }).getAttribute('aria-selected')).toBe('true');
  });
  it("senza il grant dell'elenco i clic non portano altrove e i link non ci sono", async () => {
    servi();
    server.use(http.get('*/auth/status', () => HttpResponse.json({ authenticated: true, user: { username: 'U', roles: ['csr.tx-0001.read', 'csr.tx-0002.read', 'csr.tx-0008.read', 'csr.tx-0009.read', 'csr.tx-0010.read', 'csr.tx-0011.read', 'csr.tx-0012.read', 'csr.tx-0013.read'] } })));
    const { router } = renderPagina(Pagina, PERCORSO, '/finanziario/interventi/SRA01');
    await screen.findByRole('region', { name: 'Domande presentate' });
    expect(screen.queryByRole('link', { name: /apri nell.elenco operativo/i })).toBeNull();
    await userEvent.click(screen.getByRole('tab', { name: 'Domande' }));
    const grafico = graficoDi(await trovaCard('Domande per anno di raccolta'));
    expect(grafico).toBeTruthy();
    expect(screen.getByRole('region', { name: 'Domande per anno di raccolta' }).textContent).not.toContain('Clic su un segmento');
    clicSulDato(grafico!, 0, 0);
    // la navigazione di react-router e' asincrona: si lascia il tempo a un'eventuale navigazione prima di guardare
    await act(() => new Promise((r) => setTimeout(r, 0)));
    expect(router.state.location.pathname).toBe('/finanziario/interventi/SRA01');
    await userEvent.click(screen.getByRole('tab', { name: 'SIGC' }));
    const sigc = graficoDi(await trovaCard('Domande SIGC'));
    expect(sigc).toBeTruthy();
    clicSulDato(sigc!, 0, 1);
    const cascata = graficoDi(await trovaCard('Importi SIGC'));
    expect(cascata).toBeTruthy();
    clicSu(cascata!, { name: 'Ammesso', dataIndex: 0 });
    await act(() => new Promise((r) => setTimeout(r, 0)));
    expect(router.state.location.pathname).toBe('/finanziario/interventi/SRA01');
    expect(screen.queryByRole('link', { name: /apri nell.elenco operativo/i })).toBeNull();
  });
});
