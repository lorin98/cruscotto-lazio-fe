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

describe('RF012: domande SIGC presentate, pagate, da pagare e senza importi', () => {
  it('i quattro conteggi con la definizione di ogni voce; pagate e da pagare si sovrappongono', async () => {
    servi();
    renderPagina(Pagina, '/finanziario/sigc');
    const t = (await screen.findByRole('table', { name: 'Domande SIGC' })).textContent ?? '';
    expect(t).toContain('Presentate800');
    expect(t).toContain('Pagate (importo pagato maggiore di zero)500');
    expect(t).toContain('Da pagare (ammesse con importo ancora da pagare, anche se pagate in parte)320');
    expect(t).toContain('Senza importi (non classificabili: campagne senza ASR2-20)60');
    expect(t).not.toMatch(/elenchi? di liquidazione|presentate meno pagate/);
    expect(screen.getByText(/^Pagate e da pagare vengono dagli importi della domanda \(flusso ASR2-20\)/)).toBeTruthy();
  });
});

describe('RF013: importi SIGC richiesto, ammesso, pagato, pagato oltre l ammesso e ancora da pagare', () => {
  it('importi e domande senza importo, nessuna nota di fonti diverse', async () => {
    servi();
    renderPagina(Pagina, '/finanziario/sigc');
    const t = ((await screen.findByRole('table', { name: 'Importi SIGC' })).textContent ?? '').replace(/\s/g, ' ');
    expect(t).toContain('5.000.000,00 €');
    expect(t).toContain('Importo pagato (flusso ASR2-20)3.000.000,00 €');
    expect(t).toContain("Pagato oltre l'ammesso100.000,00 €");
    expect(t).toContain('Ancora da pagare1.600.000,00 €');
    expect(t).toContain('Domande senza importo richiesto60');
    expect(screen.queryByText(/Fonti diverse/)).toBeNull();
  });
  it('nessuna violazione axe', async () => {
    servi();
    const { container } = renderPagina(Pagina, '/finanziario/sigc');
    await screen.findByRole('table', { name: 'Importi SIGC' });
    await expectNoA11yViolations(container);
  });
});
