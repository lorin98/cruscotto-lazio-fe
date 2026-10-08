import { describe, expect, it } from 'vitest';
import { screen, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '../../../shared/api/mock/server';
import { expectNoA11yViolations } from '../../../shared/testing/axe';
import { descrizioneDi, graficoDi, tabellaDi, trovaCard } from '../../../shared/testing/card-grafico';
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
  it('grafico, tabella equivalente e tabella di dettaglio per anno, con le domande senza campagna', async () => {
    servi();
    renderPagina(Pagina, '/finanziario/domande');
    const card = await trovaCard('Domande per anno di raccolta (RF008)');
    expect(graficoDi(card)).toBeTruthy();
    expect(descrizioneDi(card)).toBeTruthy();
    expect((await tabellaDi(card)).textContent).toContain('2024');
    const dettaglio = screen.getByRole('region', { name: 'Domande per anno: dettaglio' });
    const t = within(dettaglio).getByRole('table', { name: 'Domande per anno di raccolta' });
    expect(within(t).getAllByRole('rowheader').map((c) => c.textContent)).toEqual(['2024', 'senza campagna']);
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
    expect(within(t).getByRole('columnheader', { name: /^Importo decretato \(elenchi di liquidazione/ })).toBeTruthy();
    expect(within(t).getAllByRole('rowheader').map((c) => c.textContent)).toEqual(['2024', 'senza campagna']);
  });
  it('nessuna violazione axe', async () => {
    servi();
    const { container } = renderPagina(Pagina, '/finanziario/domande');
    await trovaCard('Importi per anno di raccolta (RF010)');
    await trovaCard('Domande per anno di raccolta (RF008)');
    await expectNoA11yViolations(container);
  });
});
