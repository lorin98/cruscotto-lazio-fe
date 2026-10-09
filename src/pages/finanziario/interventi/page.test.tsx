import { describe, expect, it } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import type { JsonBodyType } from 'msw';
import { server } from '../../../shared/api/mock/server';
import { expectNoA11yViolations } from '../../../shared/testing/axe';
import { graficoDi, tabellaDi, trovaCard } from '../../../shared/testing/card-grafico';
import { DOMANDE_PER_ANNO, FILTRI, IMPORTI_PER_ANNO, RIEPILOGO, SIGC_DOMANDE, SIGC_IMPORTI, SPESA } from '../../../features/finanziario/testing/fixture';
import { renderPagina } from '../../../shared/testing/render-pagina';
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
    await trovaCard('Pagato sulla dotazione');
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
