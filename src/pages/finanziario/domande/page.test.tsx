import { describe, expect, it } from 'vitest';
import { screen, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '../../../shared/api/mock/server';
import { expectNoA11yViolations } from '../../../shared/testing/axe';
import { DOMANDE_PER_ANNO, IMPORTI_PER_ANNO, TOTALE_DOMANDE } from '../../../shared/testing/fixture-finanziario';
import { renderPagina } from '../../../shared/testing/render-pagina';
import Pagina from './page';

const servi = () =>
  server.use(
    http.get('*/api/finanziario/totale-domande', () => HttpResponse.json(TOTALE_DOMANDE)),
    http.get('*/api/finanziario/domande-per-anno', () => HttpResponse.json(DOMANDE_PER_ANNO)),
    http.get('*/api/finanziario/importi-per-anno', () => HttpResponse.json(IMPORTI_PER_ANNO)),
  );

describe("RF008: domande per anno di raccolta tra prima annualita' e altre annualita'", () => {
  it('grafico e tabella per anno, con le domande senza campagna', async () => {
    servi();
    renderPagina(Pagina, '/finanziario/domande');
    expect(await screen.findByRole('img', { name: /Domande per anno di raccolta/ })).toBeTruthy();
    const t = screen.getByRole('table', { name: 'Domande per anno di raccolta' });
    expect(within(t).getAllByRole('rowheader').map((c) => c.textContent)).toEqual(['2024', 'senza campagna']);
  });
});

describe("RF009: totale delle domande presentate e di prima annualita'", () => {
  it('i due totali', async () => {
    servi();
    renderPagina(Pagina, '/finanziario/domande');
    const t = await screen.findByRole('table', { name: 'Domande presentate (di sostegno o SIGC)' });
    // it-IT non raggruppa le migliaia nei numeri di quattro cifre
    expect(within(t).getByRole('rowheader', { name: 'Domande presentate' }).nextElementSibling?.textContent).toBe('1200');
    expect(within(t).getByRole('rowheader', { name: 'di cui prima annualità' }).nextElementSibling?.textContent).toBe('400');
  });
});

describe('RF010: per anno importo stanziato, ammesso e decretato', () => {
  it('grafico e tabella degli importi per anno', async () => {
    servi();
    renderPagina(Pagina, '/finanziario/domande');
    expect(await screen.findByRole('img', { name: /stanziato, ammesso e decretato/ })).toBeTruthy();
    const t = screen.getByRole('table', { name: 'Importi per anno di raccolta' });
    expect((t.textContent ?? '').replace(/\s/g, ' ')).toContain('900.000,00 €');
    expect(within(t).getByRole('columnheader', { name: /^Importo decretato \(elenchi di liquidazione/ })).toBeTruthy();
    expect(within(t).getAllByRole('rowheader').map((c) => c.textContent)).toEqual(['2024', 'senza campagna']);
  });
  it('nessuna violazione axe', async () => {
    servi();
    const { container } = renderPagina(Pagina, '/finanziario/domande');
    await screen.findByRole('img', { name: /stanziato, ammesso e decretato/ });
    await expectNoA11yViolations(container);
  });
});
