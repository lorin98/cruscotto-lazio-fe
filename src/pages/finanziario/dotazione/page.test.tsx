import { describe, expect, it } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '../../../shared/api/mock/server';
import { expectNoA11yViolations } from '../../../shared/testing/axe';
import { DISTRIBUZIONE, SPESA } from '../../../shared/testing/fixture-finanziario';
import { renderPagina } from '../../../shared/testing/render-pagina';
import Pagina from './page';

const servi = () =>
  server.use(
    http.get('*/api/finanziario/spesa-per-intervento', () => HttpResponse.json(SPESA)),
    http.get('*/api/finanziario/distribuzione-dotazione', () => HttpResponse.json(DISTRIBUZIONE)),
  );

describe('RF002: grafico e tabella per intervento con dotazione, impegnato e pagamenti', () => {
  it('grafico con nome accessibile e tabella con le stesse voci', async () => {
    servi();
    renderPagina(Pagina, '/finanziario/dotazione');
    expect(await screen.findByRole('img', { name: /Dotazione, impegnato e pagamenti per intervento/ })).toBeTruthy();
    const tabella = screen.getByRole('table', { name: 'Dotazione, impegni e pagamenti per intervento' });
    expect(within(tabella).getByRole('rowheader').textContent).toBe('SRA01');
    expect(tabella.textContent).toContain('fonte impegni non attiva');
  });
  it('nessun intervento: stato vuoto informativo (status) in entrambe le sezioni, nessun errore', async () => {
    server.use(
      http.get('*/api/finanziario/spesa-per-intervento', () => HttpResponse.json({ perimetro: 'REGIONALE', righe: [] })),
      http.get('*/api/finanziario/distribuzione-dotazione', () => HttpResponse.json(DISTRIBUZIONE)),
    );
    renderPagina(Pagina, '/finanziario/dotazione');
    await waitFor(() => expect(screen.getAllByText('Nessun intervento per i filtri scelti. Modifica i filtri.')).toHaveLength(2));
    for (const v of screen.getAllByText('Nessun intervento per i filtri scelti. Modifica i filtri.')) expect(v.closest('[role]')?.getAttribute('role')).toBe('status');
    expect(screen.queryByRole('alert')).toBeNull();
  });
  it('nessuna violazione axe', async () => {
    servi();
    const { container } = renderPagina(Pagina, '/finanziario/dotazione');
    await screen.findByRole('img', { name: /Ripartizione della dotazione/ });
    await expectNoA11yViolations(container);
  });
});

describe('RF003: dotazione ripartita tra quota FEASR e quota non FEASR', () => {
  it('ciambella e voci', async () => {
    servi();
    renderPagina(Pagina, '/finanziario/dotazione');
    expect(await screen.findByRole('img', { name: /Quota FEASR 40%, Quota non FEASR 60%/ })).toBeTruthy();
    expect(screen.getByRole('table', { name: 'Ripartizione della dotazione di spesa pubblica' }).textContent).toContain('Quota non FEASR');
  });
});
