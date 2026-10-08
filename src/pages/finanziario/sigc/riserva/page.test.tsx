import { describe, expect, it } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '../../../../shared/api/mock/server';
import { expectNoA11yViolations } from '../../../../shared/testing/axe';
import { RISERVA } from '../../../../shared/testing/fixture-finanziario';
import { renderPagina } from '../../../../shared/testing/render-pagina';
import Pagina from './page';

describe("RF014: monitoraggio della riserva al 5% dell'anno n nelle quattro fasi", () => {
  it("si sceglie l'anno con Mostra, che resta nell'indirizzo; le date sono quelle dell'anno scelto", async () => {
    server.use(http.get('*/api/finanziario/riserva/2025', () => HttpResponse.json(RISERVA)));
    const { router } = renderPagina(Pagina, '/finanziario/sigc/riserva');
    expect(screen.getByRole('status').textContent).toContain("Scegli l'anno");
    await userEvent.selectOptions(screen.getByLabelText('Anno della riserva (anno n)'), '2025');
    expect(router.state.location.search).toBe('');
    await userEvent.click(screen.getByRole('button', { name: 'Mostra' }));
    await waitFor(() => expect(router.state.location.search).toBe('?anno=2025'));
    expect(screen.getByText('Per il 2025: accumulo dal 1/10/2025 al 30/6/2026, utilizzo fino al 31/12/2026, residuo dal 1/1/2027.')).toBeTruthy();
    expect(await screen.findByText('residuo (2% del montante, dal 1/1/2027)')).toBeTruthy();
    expect(screen.queryByText(/Filtri attivi/)).toBeNull();
  });
  it('fase, valori, utilizzo progressivo in grafico e tabella', async () => {
    server.use(http.get('*/api/finanziario/riserva/2025', () => HttpResponse.json(RISERVA)));
    renderPagina(Pagina, '/finanziario/sigc/riserva', '/finanziario/sigc/riserva?anno=2025');
    expect(await screen.findByRole('table', { name: 'Utilizzo progressivo' })).toBeTruthy();
    expect(screen.getByRole('img', { name: /Utilizzo progressivo cumulato/ })).toBeTruthy();
    expect(screen.getByText(/i filtri del finanziario non si applicano/)).toBeTruthy();
  });
  it("anno senza movimenti (404): stato vuoto spiegato, non un errore", async () => {
    server.use(
      http.get('*/api/finanziario/riserva/2026', () =>
        HttpResponse.json({ type: 'urn:cruscottocsr:problem:not-found', title: 'Not Found', status: 404, errorCode: 'NOT_FOUND' }, { status: 404 }),
      ),
    );
    renderPagina(Pagina, '/finanziario/sigc/riserva', '/finanziario/sigc/riserva?anno=2026');
    expect((await screen.findByText(/Nessun dato di riserva per il 2026/)).closest('[role]')?.getAttribute('role')).toBe('status');
    expect(screen.queryByRole('alert')).toBeNull();
  });
  it('nessuna violazione axe', async () => {
    server.use(http.get('*/api/finanziario/riserva/2025', () => HttpResponse.json(RISERVA)));
    const { container } = renderPagina(Pagina, '/finanziario/sigc/riserva', '/finanziario/sigc/riserva?anno=2025');
    await screen.findByRole('table', { name: 'Utilizzo progressivo' });
    await expectNoA11yViolations(container);
  });
});
