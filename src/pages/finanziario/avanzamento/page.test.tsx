import { describe, expect, it } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '../../../shared/api/mock/server';
import { expectNoA11yViolations } from '../../../shared/testing/axe';
import { descrizioneDi, graficoDi, tabellaDi, trovaCard } from '../../../shared/testing/card-grafico';
import { PAGAMENTI, RESIDUO_IMPEGNI, RESIDUO_PAGAMENTI, SPESA, STANZIATO } from '../../../features/finanziario/testing/fixture';
import { renderPagina } from '../../../shared/testing/render-pagina';
import Pagina from './page';

const servi = () =>
  server.use(
    http.get('*/api/finanziario/stanziato', () => HttpResponse.json(STANZIATO)),
    http.get('*/api/finanziario/pagamenti-su-impegnato', () => HttpResponse.json(PAGAMENTI)),
    http.get('*/api/finanziario/residuo-impegni', () => HttpResponse.json(RESIDUO_IMPEGNI)),
    http.get('*/api/finanziario/residuo-pagamenti', () => HttpResponse.json(RESIDUO_PAGAMENTI)),
    // le righe per intervento di TX-0002 dicono se la selezione e' vuota (mai gli importi a zero)
    http.get('*/api/finanziario/spesa-per-intervento', () => HttpResponse.json(SPESA)),
  );
const voci = async (titolo: string) => (await tabellaDi(await trovaCard(titolo))).textContent ?? '';

describe('RF004: importo stanziato e importo da stanziare', () => {
  it('senza fonte attiva il grafico lo dichiara, la tabella spiega la fonte e il KPI non diventa zero', async () => {
    servi();
    renderPagina(Pagina, '/finanziario/avanzamento');
    const card = await trovaCard('Importo stanziato e da stanziare (RF004)');
    expect(graficoDi(card)).toBeUndefined();
    expect(within(card).getByText(/^Grafico non disponibile: manca una delle due parti/)).toBeTruthy();
    expect(await voci('Importo stanziato e da stanziare (RF004)')).toContain('fonte quadro sinottico non attiva');
    const kpi = await screen.findByRole('region', { name: 'Importo stanziato' });
    expect(kpi.textContent).toContain('Non disponibile: fonte quadro sinottico non attiva');
    expect(kpi.textContent).not.toMatch(/0,0/);
  });
});

describe('RF005: totale impegnato tra pagamenti e impegnato ancora da pagare', () => {
  it("voci del pagato sull'impegnato", async () => {
    servi();
    renderPagina(Pagina, '/finanziario/avanzamento');
    const t = await voci("Pagamenti sull'impegnato (RF005)");
    expect(t).toContain('Totale impegnato');
    expect(t).toContain('Pagamenti totali (elenchi di liquidazione)');
    expect(t.replace(/\s/g, ' ')).toContain('200.000,00 €');
    expect(t).toContain('fonte impegni non attiva');
  });
});

describe('RF006: dotazione tra importo impegnato e dotazione residua', () => {
  it('voci del residuo sugli impegni; senza impegni il flusso va dalla dotazione al pagato e dichiara il ramo mancante', async () => {
    servi();
    renderPagina(Pagina, '/finanziario/avanzamento');
    expect(await voci('Dotazione residua sugli impegni (RF006)')).toContain('Dotazione residua');
    const flusso = await trovaCard('Dove va la dotazione');
    expect(graficoDi(flusso)).toBeTruthy();
    expect(descrizioneDi(flusso)).toMatch(/pagamenti netti .*dotazione residua/);
    expect(within(flusso).getByText(/Impegnato non disponibile \(fonte impegni non attiva\): il ramo dell'impegnato non si disegna/)).toBeTruthy();
  });
});

describe('RF007: dotazione tra importo pagato e dotazione residua', () => {
  it('ciambella e voci del residuo sui pagamenti, gauge del pagato', async () => {
    servi();
    renderPagina(Pagina, '/finanziario/avanzamento');
    const card = await trovaCard('Dotazione residua sui pagamenti (RF007)');
    expect(descrizioneDi(card)).toMatch(/^Dotazione tra pagato e residuo: Pagamenti al netto di rettifiche 20\s?%, Dotazione residua 80\s?%\.$/);
    expect(await voci('Dotazione residua sui pagamenti (RF007)')).toContain('Importo recuperato');
    expect(descrizioneDi(await trovaCard('Pagato sulla dotazione'))).toMatch(/22\s?%/);
  });
  it('perimetro ADA: dotazione regionale dichiarata nella tabella e grafico dichiarato non confrontabile', async () => {
    servi();
    server.use(http.get('*/api/finanziario/residuo-pagamenti', () => HttpResponse.json({ ...RESIDUO_PAGAMENTI, perimetro: 'ADA' })));
    renderPagina(Pagina, '/finanziario/avanzamento');
    const card = await trovaCard('Dotazione residua sui pagamenti (RF007)');
    expect(card.textContent).toContain('La dotazione è regionale, i pagamenti sono della tua area: non confrontabili.');
    expect(await voci('Dotazione residua sui pagamenti (RF007)')).toContain('Dotazione spesa pubblica (regionale)');
  });
  it('errore di un report: un solo avviso nella pagina, le altre sezioni si vedono', async () => {
    servi();
    server.use(http.get('*/api/finanziario/residuo-pagamenti', () => new HttpResponse(null, { status: 404 })));
    renderPagina(Pagina, '/finanziario/avanzamento');
    const avviso = await screen.findByRole('alert');
    expect(avviso.textContent).toContain('Dati non trovati');
    expect(screen.getAllByRole('alert')).toHaveLength(1);
    expect(await voci('Dotazione residua sugli impegni (RF006)')).toContain('Dotazione residua');
  });
  // A-07: con il backend che non risponde un solo avviso per la pagina; "Riprova" rilegge tutte le sezioni in errore
  it('backend non disponibile: un solo avviso di pagina, sezioni senza alert, Riprova rilegge tutto', async () => {
    let letture = 0;
    server.use(
      http.get('*/api/finanziario/*', () => {
        letture += 1;
        return new HttpResponse(null, { status: 503 });
      }),
    );
    const { container } = renderPagina(Pagina, '/finanziario/avanzamento');
    await waitFor(() => expect(screen.getByRole('alert').textContent).toMatch(/\d sezioni della pagina non si sono caricate\./));
    const avviso = screen.getByRole('alert');
    expect(screen.getAllByRole('alert')).toHaveLength(1);
    expect(within(avviso).getAllByRole('button')).toHaveLength(1);
    expect(screen.getAllByText(/^Dati non caricati: l'avviso in cima alla pagina/).length).toBeGreaterThan(1);
    const prima = letture;
    await userEvent.click(within(avviso).getByRole('button', { name: 'Riprova' }));
    await waitFor(() => expect(letture).toBeGreaterThan(prima));
    await expectNoA11yViolations(container);
  });
  it('nessuna violazione axe', async () => {
    servi();
    const { container } = renderPagina(Pagina, '/finanziario/avanzamento');
    await trovaCard('Dotazione residua sui pagamenti (RF007)');
    await trovaCard("Pagamenti sull'impegnato (RF005)");
    await expectNoA11yViolations(container);
  });
});
