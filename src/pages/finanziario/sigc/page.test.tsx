import { describe, expect, it } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '../../../shared/api/mock/server';
import { expectNoA11yViolations } from '../../../shared/testing/axe';
import { SIGC_DOMANDE, SIGC_IMPORTI } from '../../../features/finanziario/testing/fixture';
import { renderPagina } from '../../../shared/testing/render-pagina';
import { graficoDi, trovaCard } from '../../../shared/testing/card-grafico';
import { clicSu } from '../../../shared/testing/grafico-finto';
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

describe("RA003: drill-down dalla pagina SIGC all'elenco operativo", () => {
  it('voci della tabella delle domande SIGC con i filtri correnti', async () => {
    servi();
    renderPagina(Pagina, '/finanziario/sigc', '/finanziario/sigc?azione=1');
    const t = await screen.findByRole('table', { name: 'Domande SIGC' });
    expect(within(t).getByRole('link', { name: "Apri nell'elenco operativo le domande SIGC da pagare" }).getAttribute('href')).toBe(
      '/elenco-operativo/domande?sigc=true&pagamento=DA_PAGARE&azione=1',
    );
    expect(within(t).getByRole('link', { name: "Apri nell'elenco operativo le domande SIGC presentate" }).getAttribute('href')).toBe('/elenco-operativo/domande?sigc=true&azione=1');
    expect(
      screen.getByRole('link', { name: "Le domande SIGC nell'elenco operativo: apri nell'elenco operativo (sinottico con richiesto, ammesso, pagato e ancora da pagare)" }).getAttribute('href'),
    ).toBe('/elenco-operativo/domande?sigc=true&azione=1');
  });
  it('clic su una barra delle domande SIGC: le domande di quella voce', async () => {
    servi();
    const { router } = renderPagina(Pagina, '/finanziario/sigc');
    const grafico = graficoDi(await trovaCard('Domande SIGC (RF012)'));
    if (grafico) clicSu(grafico, { name: 'Senza importi', dataIndex: 3 });
    await waitFor(() => expect(`${router.state.location.pathname}${router.state.location.search}`).toBe('/elenco-operativo/domande?sigc=true&pagamento=SENZA_IMPORTI'));
  });
  it('nessuna violazione axe con i link', async () => {
    servi();
    const { container } = renderPagina(Pagina, '/finanziario/sigc');
    await screen.findByRole('link', { name: "Apri nell'elenco operativo le domande SIGC pagate" });
    await screen.findByRole('table', { name: 'Importi SIGC' });
    await expectNoA11yViolations(container);
  });
});
