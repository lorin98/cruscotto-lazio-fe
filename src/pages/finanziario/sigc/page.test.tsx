import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '../../../shared/api/mock/server';
import { expectNoA11yViolations } from '../../../shared/testing/axe';
import { SIGC_DOMANDE, SIGC_IMPORTI } from '../../../features/finanziario/testing/fixture';
import { renderPagina } from '../../../shared/testing/render-pagina';
import Pagina from './page';

const servi = () =>
  server.use(
    http.get('*/api/finanziario/sigc/domande', () => HttpResponse.json(SIGC_DOMANDE)),
    http.get('*/api/finanziario/sigc/importi', () => HttpResponse.json(SIGC_IMPORTI)),
  );

describe('RF012: domande SIGC presentate, pagate e da pagare', () => {
  it('i tre conteggi', async () => {
    servi();
    renderPagina(Pagina, '/finanziario/sigc');
    const t = (await screen.findByRole('table', { name: 'Domande SIGC' })).textContent ?? '';
    for (const v of ['800', '500', '300']) expect(t).toContain(v);
    expect(t).toContain('Pagate (con pagamento in un elenco di liquidazione)');
  });
});

describe('RF013: importi SIGC richiesto, ammesso, pagato e ancora da pagare', () => {
  it('importi e domande senza importo', async () => {
    servi();
    renderPagina(Pagina, '/finanziario/sigc');
    const t = ((await screen.findByRole('table', { name: 'Importi SIGC' })).textContent ?? '').replace(/\s/g, ' ');
    expect(t).toContain('5.000.000,00 €');
    expect(t).toContain('Importo pagato (flusso ASR2-20)3.000.000,00 €');
    expect(t).toContain('Domande senza importo richiesto50');
    expect(screen.getAllByText(/Fonti diverse/)).toHaveLength(2);
  });
  it('nessuna violazione axe', async () => {
    servi();
    const { container } = renderPagina(Pagina, '/finanziario/sigc');
    await screen.findByRole('table', { name: 'Importi SIGC' });
    await expectNoA11yViolations(container);
  });
});
