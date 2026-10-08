import { describe, expect, it } from 'vitest';
import { screen, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '../../../shared/api/mock/server';
import { expectNoA11yViolations } from '../../../shared/testing/axe';
import { descrizioneDi, graficoDi, tabellaDi, trovaCard } from '../../../shared/testing/card-grafico';
import { PAGAMENTI, RESIDUO_IMPEGNI, RESIDUO_PAGAMENTI, SPESA, STANZIATO } from '../../../shared/testing/fixture-finanziario';
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
  it('voci del residuo sugli impegni; senza impegni il flusso della dotazione non si disegna', async () => {
    servi();
    renderPagina(Pagina, '/finanziario/avanzamento');
    expect(await voci('Dotazione residua sugli impegni (RF006)')).toContain('Dotazione residua');
    expect(graficoDi(await trovaCard('Dove va la dotazione'))).toBeUndefined();
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
  it('errore di un report: solo la sua sezione mostra l errore', async () => {
    servi();
    server.use(http.get('*/api/finanziario/residuo-pagamenti', () => new HttpResponse(null, { status: 404 })));
    renderPagina(Pagina, '/finanziario/avanzamento');
    expect((await screen.findAllByRole('alert'))[0].textContent).toContain('Dati non trovati');
    expect(await voci('Dotazione residua sugli impegni (RF006)')).toContain('Dotazione residua');
  });
  it('nessuna violazione axe', async () => {
    servi();
    const { container } = renderPagina(Pagina, '/finanziario/avanzamento');
    await trovaCard('Dotazione residua sui pagamenti (RF007)');
    await trovaCard("Pagamenti sull'impegnato (RF005)");
    await expectNoA11yViolations(container);
  });
});
