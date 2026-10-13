import { describe, expect, it } from 'vitest';
import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '../../../shared/api/mock/server';
import { expectNoA11yViolations } from '../../../shared/testing/axe';
import { descrizioneDi, graficoDi, tabellaDi, trovaCard } from '../../../shared/testing/card-grafico';
import { DOMANDE_PER_ANNO, IMPORTI_PER_ANNO, TOTALE_DOMANDE } from '../../../features/finanziario/testing/fixture';
import { renderPagina } from '../../../shared/testing/render-pagina';
import { clicSulDato } from '../../../shared/testing/grafico-finto';
import Pagina from './page';

const servi = () =>
  server.use(
    http.get('*/api/finanziario/totale-domande', () => HttpResponse.json(TOTALE_DOMANDE)),
    http.get('*/api/finanziario/domande-per-anno', () => HttpResponse.json(DOMANDE_PER_ANNO)),
    http.get('*/api/finanziario/importi-per-anno', () => HttpResponse.json(IMPORTI_PER_ANNO)),
  );

describe("RF008: domande per anno di raccolta tra prima annualita' e altre annualita'", () => {
  it('grafico, tabella equivalente e tabella di dettaglio per anno, con le domande senza anno di raccolta', async () => {
    servi();
    renderPagina(Pagina, '/finanziario/domande');
    const card = await trovaCard('Domande per anno di raccolta (RF008)');
    expect(graficoDi(card)).toBeTruthy();
    expect(descrizioneDi(card)).toBeTruthy();
    expect((await tabellaDi(card)).textContent).toContain('2024');
    const dettaglio = screen.getByRole('region', { name: 'Domande per anno: dettaglio' });
    const t = within(dettaglio).getByRole('table', { name: 'Domande per anno di raccolta' });
    expect(within(t).getAllByRole('rowheader').map((c) => c.textContent)).toEqual(['2024', 'senza anno di raccolta']);
    // la nota dice che cosa sono l'anno di raccolta e le non classificate (D-09)
    expect(within(dettaglio).getByText(/Non classificate: le domande di sostegno NO SIGC, per cui prima e altre annualità non si applicano, e quelle delle campagne senza dati di annualità\.$/)).toBeTruthy();
  });
});

describe("RF009: totale delle domande presentate e di prima annualita'", () => {
  it('i due totali come indicatori', async () => {
    servi();
    renderPagina(Pagina, '/finanziario/domande');
    // it-IT non raggruppa le migliaia nei numeri di quattro cifre
    expect((await screen.findByRole('region', { name: 'Domande presentate' })).textContent).toContain('1200');
    expect(screen.getByRole('region', { name: 'di cui prima annualità' }).textContent).toContain('400');
  });
  it('senza il grant di TX-0009 la sezione lo dice e non legge', async () => {
    servi();
    let letto = false;
    server.use(
      http.get('*/api/finanziario/totale-domande', () => {
        letto = true;
        return HttpResponse.json(TOTALE_DOMANDE);
      }),
      http.get('*/auth/status', () => HttpResponse.json({ authenticated: true, user: { username: 'U', roles: ['csr.tx-0008.read', 'csr.tx-0010.read'] } })),
    );
    renderPagina(Pagina, '/finanziario/domande');
    const sezione = await screen.findByRole('region', { name: 'Totale domande presentate (RF009)' });
    expect(await within(sezione).findByText('Sezione non disponibile per il tuo profilo.')).toBeTruthy();
    await trovaCard('Domande per anno di raccolta (RF008)');
    expect(letto).toBe(false);
  });
});

describe('RF010: per anno importo stanziato, ammesso e decretato', () => {
  it('grafico e tabella degli importi per anno', async () => {
    servi();
    renderPagina(Pagina, '/finanziario/domande');
    const card = await trovaCard('Importi per anno di raccolta (RF010)');
    expect(graficoDi(card)).toBeTruthy();
    const t = screen.getByRole('table', { name: 'Importi per anno di raccolta' });
    expect((t.textContent ?? '').replace(/\s/g, ' ')).toContain('900.000,00 €');
    expect(within(t).getByRole('columnheader', { name: 'Importo decretato (elenchi di liquidazione)' })).toBeTruthy();
    expect(within(t).getAllByRole('rowheader').map((c) => c.textContent)).toEqual(['2024', 'senza anno di raccolta']);
  });
  it('nessuna violazione axe', async () => {
    servi();
    const { container } = renderPagina(Pagina, '/finanziario/domande');
    await trovaCard('Importi per anno di raccolta (RF010)');
    await trovaCard('Domande per anno di raccolta (RF008)');
    await expectNoA11yViolations(container);
  });
});

describe("RA003: drill-down dalla pagina domande all'elenco operativo", () => {
  it('KPI presentate e prima annualita, con i filtri correnti', async () => {
    servi();
    renderPagina(Pagina, '/finanziario/domande', '/finanziario/domande?op=OP2');
    expect((await screen.findByRole('link', { name: "Apri nell'elenco operativo le domande presentate" })).getAttribute('href')).toBe('/elenco-operativo/domande?presentata=true&op=OP2');
    expect(screen.getByRole('link', { name: "Apri nell'elenco operativo le domande di prima annualità" }).getAttribute('href')).toBe(
      '/elenco-operativo/domande?presentata=true&annualita=PRIMA&op=OP2',
    );
  });
  it("celle anno per annualita' e righe degli importi per anno; le barre filtrano ancora la tabella in pagina", async () => {
    servi();
    const { router } = renderPagina(Pagina, '/finanziario/domande');
    const t = await screen.findByRole('table', { name: 'Domande per anno di raccolta' });
    expect(within(t).getByRole('link', { name: "Apri nell'elenco operativo le domande del 2024, prima annualità" }).getAttribute('href')).toBe(
      '/elenco-operativo/domande?presentata=true&anno=2024&annualita=PRIMA',
    );
    expect(within(t).getByRole('link', { name: "Apri nell'elenco operativo le domande senza anno di raccolta, non classificate" }).getAttribute('href')).toBe(
      '/elenco-operativo/domande?presentata=true&anno=SENZA&annualita=NON_CLASSIFICATE',
    );
    // il totale dell'anno: le presentate dell'anno, senza annualita'
    expect(within(t).getByRole('link', { name: "Apri nell'elenco operativo le domande del 2024" }).getAttribute('href')).toBe('/elenco-operativo/domande?presentata=true&anno=2024');
    const importi = screen.getByRole('table', { name: 'Importi per anno di raccolta' });
    expect(within(importi).getByRole('columnheader', { name: 'Elenco operativo' })).toBeTruthy();
    expect(within(importi).getByRole('link', { name: "Apri nell'elenco operativo le domande presentate del 2024" }).getAttribute('href')).toBe(
      '/elenco-operativo/domande?presentata=true&anno=2024',
    );
    const grafico = graficoDi(await trovaCard('Domande per anno di raccolta (RF008)'));
    expect(grafico).toBeTruthy();
    clicSulDato(grafico!, 0, 0);
    await waitFor(() => expect(within(t).getAllByRole('rowheader').map((c) => c.textContent)).toEqual(['2024']));
    expect(router.state.location.pathname).toBe('/finanziario/domande');
  });
  it("vista Tabella delle card RF008 e RF010: 'Apri nell'elenco' nelle celle della tabella equivalente", async () => {
    servi();
    renderPagina(Pagina, '/finanziario/domande');
    const perAnno = await tabellaDi(await trovaCard('Domande per anno di raccolta (RF008)'));
    expect(within(perAnno).getByRole('link', { name: "Apri nell'elenco operativo le domande del 2024, altre annualità" }).getAttribute('href')).toBe(
      '/elenco-operativo/domande?presentata=true&anno=2024&annualita=ALTRE',
    );
    const importi = await tabellaDi(await trovaCard('Importi per anno di raccolta (RF010)'));
    expect(within(importi).getAllByRole('columnheader').map((c) => c.textContent)).toEqual(['Anno', 'Stanziato', 'Ammesso', 'Decretato', 'Domande senza importo ammesso', 'Elenco operativo']);
    expect(within(importi).getByRole('link', { name: "Apri nell'elenco operativo le domande presentate del 2024" }).getAttribute('href')).toBe('/elenco-operativo/domande?presentata=true&anno=2024');
  });
  it("tornando indietro dall'elenco operativo l'anno scelto e' ancora quello", async () => {
    servi();
    const { router } = renderPagina(Pagina, '/finanziario/domande');
    const dettaglio = await screen.findByRole('region', { name: 'Domande per anno: dettaglio' });
    await userEvent.selectOptions(within(dettaglio).getByRole('combobox', { name: 'Anno di raccolta' }), '2024');
    const t = within(dettaglio).getByRole('table', { name: 'Domande per anno di raccolta' });
    await waitFor(() => expect(within(t).getAllByRole('rowheader').map((c) => c.textContent)).toEqual(['2024']));
    await userEvent.click(within(t).getByRole('link', { name: "Apri nell'elenco operativo le domande del 2024, prima annualità" }));
    await waitFor(() => expect(router.state.location.pathname).toBe('/elenco-operativo/domande'));
    await act(() => router.navigate(-1));
    const dopo = await screen.findByRole('region', { name: 'Domande per anno: dettaglio' });
    await waitFor(() => expect((within(dopo).getByRole('combobox', { name: 'Anno di raccolta' }) as HTMLSelectElement).value).toBe('2024'));
    expect(within(within(dopo).getByRole('table', { name: 'Domande per anno di raccolta' })).getAllByRole('rowheader').map((c) => c.textContent)).toEqual(['2024']);
  });
  it("senza il grant dell'elenco nessun link e nessuna colonna Elenco operativo", async () => {
    servi();
    server.use(http.get('*/auth/status', () => HttpResponse.json({ authenticated: true, user: { username: 'U', roles: ['csr.tx-0001.read', 'csr.tx-0002.read', 'csr.tx-0008.read', 'csr.tx-0009.read', 'csr.tx-0010.read', 'csr.tx-0011.read', 'csr.tx-0012.read', 'csr.tx-0013.read'] } })));
    renderPagina(Pagina, '/finanziario/domande');
    const importi = await screen.findByRole('table', { name: 'Importi per anno di raccolta' });
    expect(within(importi).queryByRole('columnheader', { name: 'Elenco operativo' })).toBeNull();
    await screen.findByRole('table', { name: 'Domande per anno di raccolta' });
    expect(screen.queryByRole('link', { name: /Apri nell.elenco operativo/ })).toBeNull();
  });
  it('nessuna violazione axe con i link', async () => {
    servi();
    const { container } = renderPagina(Pagina, '/finanziario/domande');
    await screen.findByRole('link', { name: "Apri nell'elenco operativo le domande presentate" });
    await screen.findByRole('table', { name: 'Importi per anno di raccolta' });
    await expectNoA11yViolations(container);
  });
});
