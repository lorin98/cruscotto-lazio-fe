import { describe, expect, it } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '../../../../shared/api/mock/server';
import { expectNoA11yViolations } from '../../../../shared/testing/axe';
import { VERIFICA_SMP } from '../../../../features/finanziario/testing/fixture';
import { renderPagina } from '../../../../shared/testing/render-pagina';
import Pagina from './page';

describe('RF015: i dati ASR dell ambito SIGC per il confronto con SMP - Data Platform', () => {
  it("l'esercizio e' obbligatorio e va nell'indirizzo insieme ai filtri", async () => {
    let query = '';
    server.use(
      http.get('*/api/finanziario/sigc/verifica-smp', ({ request }) => {
        query = new URL(request.url).search;
        return HttpResponse.json(VERIFICA_SMP);
      }),
    );
    const { router } = renderPagina(Pagina, '/finanziario/sigc/verifica-smp', '/finanziario/sigc/verifica-smp?intervento=SRA01');
    expect(screen.getByRole('status').textContent).toContain("Scegli l'esercizio");
    await userEvent.selectOptions(screen.getByLabelText('Esercizio finanziario'), '2025');
    await userEvent.click(screen.getByRole('button', { name: 'Mostra' }));
    await waitFor(() => expect(router.state.location.search).toBe('?intervento=SRA01&esercizio=2025'));
    await screen.findByRole('table', { name: /dati ASR per intervento/ });
    expect(query).toBe('?intervento=SRA01&esercizio=2025');
  });
  it('tabella per intervento con i dati di confronto', async () => {
    server.use(http.get('*/api/finanziario/sigc/verifica-smp', () => HttpResponse.json(VERIFICA_SMP)));
    renderPagina(Pagina, '/finanziario/sigc/verifica-smp', '/finanziario/sigc/verifica-smp?esercizio=2025');
    const t = await screen.findByRole('table', { name: /dati ASR per intervento/ });
    expect(within(t).getAllByRole('columnheader')).toHaveLength(21);
    expect(t.textContent).toContain('fonte previsione di pagamento non attiva');
  });
  it('nessuna violazione axe', async () => {
    server.use(http.get('*/api/finanziario/sigc/verifica-smp', () => HttpResponse.json(VERIFICA_SMP)));
    const { container } = renderPagina(Pagina, '/finanziario/sigc/verifica-smp', '/finanziario/sigc/verifica-smp?esercizio=2025');
    await screen.findByRole('table', { name: /dati ASR per intervento/ });
    await expectNoA11yViolations(container);
  });
});
