import { describe, expect, it } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '../../../../shared/api/mock/server';
import { expectNoA11yViolations } from '../../../../shared/testing/axe';
import { RISERVA } from '../../../../features/finanziario/testing/fixture';
import { descrizioneDi, graficoDi, trovaCard } from '../../../../shared/testing/card-grafico';
import { renderPagina } from '../../../../shared/testing/render-pagina';
import Pagina from './page';

describe("RF014: monitoraggio della riserva al 5% dell'anno n nelle quattro fasi", () => {
  it("si sceglie l'anno con Mostra, che resta nell'indirizzo; le date sono quelle dell'anno scelto", async () => {
    server.use(http.get('*/api/finanziario/riserva/2025', () => HttpResponse.json(RISERVA)));
    const { router } = renderPagina(Pagina, '/finanziario/sigc/riserva');
    expect(screen.getByRole('status').textContent).toContain("Scegli l'anno");
    await userEvent.selectOptions(screen.getByLabelText('Anno di riferimento (anno n)'), '2025');
    expect(router.state.location.search).toBe('');
    await userEvent.click(screen.getByRole('button', { name: 'Mostra' }));
    await waitFor(() => expect(router.state.location.search).toBe('?anno=2025'));
    expect(screen.getByText('Per il 2025: accumulo dal 01/10/2025 al 30/06/2026, utilizzo fino al 31/12/2026, residuo dal 01/01/2027.')).toBeTruthy();
    expect(await screen.findByText('residuo (2% del montante, dal 01/01/2027)')).toBeTruthy();
    expect(screen.queryByRole('region', { name: 'Filtri attivi' })).toBeNull();
  });
  it('fase, valori, utilizzo progressivo in grafico e tabella', async () => {
    server.use(http.get('*/api/finanziario/riserva/2025', () => HttpResponse.json(RISERVA)));
    renderPagina(Pagina, '/finanziario/sigc/riserva', '/finanziario/sigc/riserva?anno=2025');
    expect(await screen.findByRole('table', { name: 'Utilizzo progressivo' })).toBeTruthy();
    const card = await trovaCard('Utilizzo progressivo cumulato');
    expect(graficoDi(card)).toBeTruthy();
    expect(descrizioneDi(card)).toBeTruthy();
    expect(screen.getByText(/i filtri del finanziario e il filtro SIGC non si applicano/)).toBeTruthy();
    // dato regionale: niente barra dei filtri del finanziario
    expect(screen.queryByRole('region', { name: 'Filtri attivi' })).toBeNull();
  });
  it("anno senza movimenti (404): stato vuoto spiegato, non un errore", async () => {
    server.use(
      http.get('*/api/finanziario/riserva/2026', () =>
        HttpResponse.json({ type: 'urn:cruscottocsr:problem:not-found', title: 'Not Found', status: 404, errorCode: 'NOT_FOUND' }, { status: 404 }),
      ),
    );
    renderPagina(Pagina, '/finanziario/sigc/riserva', '/finanziario/sigc/riserva?anno=2026');
    expect((await screen.findByText(/Nessuna riserva calcolata per il 2026/)).closest('[role]')?.getAttribute('role')).toBe('status');
    expect(screen.queryByRole('alert')).toBeNull();
  });
  it('nessuna violazione axe', async () => {
    server.use(http.get('*/api/finanziario/riserva/2025', () => HttpResponse.json(RISERVA)));
    const { container } = renderPagina(Pagina, '/finanziario/sigc/riserva', '/finanziario/sigc/riserva?anno=2025');
    await screen.findByRole('table', { name: 'Utilizzo progressivo' });
    await expectNoA11yViolations(container);
  });
});

describe('Revisioni del 31/10/2026: montante e riserve (R17 forma A) e utilizzo progressivo (R18 forma A)', () => {
  it('il montante in alto, riserva del 5% e residuo del 2% col badge della natura; il testo di lettura sopra il grafico', async () => {
    // montante diverso da 20 x accumulato: 5% = 1.000,00 (accumulato 500,00), 2% = 400,00 (residuo disponibile 200,00)
    // distingue montante x quota dai campi di prima (review V1-14)
    server.use(http.get('*/api/finanziario/riserva/2025', () => HttpResponse.json({ ...RISERVA, montantePagamenti: 20000, naturaResiduo: 'PREVISIONE', fase: 'UTILIZZO' })));
    renderPagina(Pagina, '/finanziario/sigc/riserva', '/finanziario/sigc/riserva?anno=2025');
    const blocco = await screen.findByRole('region', { name: "Montante e riserve dell'anno 2025" });
    const riserva = screen.getByRole('region', { name: 'Riserva di efficacia (5%)' });
    expect(riserva.textContent).toContain('Consuntivo');
    // it-IT senza separatore delle migliaia sotto 10.000
    expect(riserva.textContent).toMatch(/1\.000,00.€/);
    expect(riserva.textContent).not.toMatch(/(^|[^.\d])500,00/);
    const residuo = screen.getByRole('region', { name: 'Residuo (2%)' });
    expect(residuo.textContent).toContain('Previsione');
    expect(residuo.textContent).toMatch(/400,00.€/);
    expect(residuo.textContent).not.toMatch(/(^|[^.\d])200,00/);
    // come il backend: il residuo disponibile e' il 2% se la riserva non e' usata tutta, altrimenti zero (review X-07)
    expect(residuo.textContent).toContain('Il residuo disponibile qui sotto vale questo importo se la riserva non è stata utilizzata tutta entro il 31/12/2026, altrimenti zero');
    expect(blocco.textContent).toContain("Montante dei pagamenti dell'anno 2025");
    const card = await trovaCard('Utilizzo progressivo cumulato');
    expect(card.textContent).toMatch(/La linea è quanto della riserva è stato usato, sommato nel tempo/);
  });
});
