import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '../../../shared/api/mock/server';
import { expectNoA11yViolations } from '../../../shared/testing/axe';
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
const voci = async (nome: string) => (await screen.findByRole('table', { name: nome })).textContent ?? '';

describe('RF004: importo stanziato e importo da stanziare', () => {
  it('senza fonte attiva il grafico lo dichiara e la tabella spiega la fonte', async () => {
    servi();
    renderPagina(Pagina, '/finanziario/avanzamento');
    expect(await screen.findByText(/Stanziato e da stanziare: grafico non disponibile/)).toBeTruthy();
    expect(await voci('Stanziato e da stanziare')).toContain('fonte quadro sinottico non attiva');
  });
});

describe("RF005: totale impegnato tra pagamenti e impegnato ancora da pagare", () => {
  it('voci del pagato sull impegnato', async () => {
    servi();
    renderPagina(Pagina, '/finanziario/avanzamento');
    const t = await voci('Impegnato tra pagamenti e ancora da pagare');
    expect(t).toContain('Totale impegnato');
    expect(t).toContain('Pagamenti totali (elenchi di liquidazione)');
    expect(t.replace(/\s/g, ' ')).toContain('200.000,00 €');
    expect(t).toContain('fonte impegni non attiva');
  });
});

describe('RF006: dotazione tra importo impegnato e dotazione residua', () => {
  it('voci del residuo sugli impegni', async () => {
    servi();
    renderPagina(Pagina, '/finanziario/avanzamento');
    expect(await voci('Dotazione tra impegnato e residuo')).toContain('Dotazione residua');
  });
});

describe('RF007: dotazione tra importo pagato e dotazione residua', () => {
  it('grafico e voci del residuo sui pagamenti', async () => {
    servi();
    renderPagina(Pagina, '/finanziario/avanzamento');
    expect(await screen.findByRole('img', { name: /Dotazione tra pagato e residuo/ })).toBeTruthy();
    expect(await voci('Dotazione tra pagato e residuo')).toContain('Importo recuperato');
  });
  it('errore di un report: solo la sua sezione mostra l errore', async () => {
    servi();
    server.use(http.get('*/api/finanziario/residuo-pagamenti', () => new HttpResponse(null, { status: 404 })));
    renderPagina(Pagina, '/finanziario/avanzamento');
    expect((await screen.findByRole('alert')).textContent).toContain('Dati non trovati');
    expect(await voci('Dotazione tra impegnato e residuo')).toContain('Dotazione residua');
  });
  it('nessuna violazione axe', async () => {
    servi();
    const { container } = renderPagina(Pagina, '/finanziario/avanzamento');
    await screen.findByRole('img', { name: /Dotazione tra pagato e residuo/ });
    await expectNoA11yViolations(container);
  });
});
