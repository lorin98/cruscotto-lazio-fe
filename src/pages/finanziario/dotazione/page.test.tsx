import { describe, expect, it } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '../../../shared/api/mock/server';
import { expectNoA11yViolations } from '../../../shared/testing/axe';
import { descrizioneDi, graficoDi, tabellaDi, trovaCard } from '../../../shared/testing/card-grafico';
import { DISTRIBUZIONE, SPESA } from '../../../shared/testing/fixture-finanziario';
import { clicSu } from '../../../shared/testing/grafico-finto';
import { renderPagina } from '../../../shared/testing/render-pagina';
import Pagina from './page';

const servi = () =>
  server.use(
    http.get('*/api/finanziario/spesa-per-intervento', () => HttpResponse.json(SPESA)),
    http.get('*/api/finanziario/distribuzione-dotazione', () => HttpResponse.json(DISTRIBUZIONE)),
  );

describe('RF002: grafico e tabella per intervento con dotazione, impegnato e pagamenti', () => {
  it('grafico con descrizione accessibile, tabella equivalente e tabella interattiva con le assenze dichiarate', async () => {
    servi();
    renderPagina(Pagina, '/finanziario/dotazione');
    const card = await trovaCard('Dotazione e pagamenti per intervento');
    expect(graficoDi(card)).toBeTruthy();
    expect(descrizioneDi(card)).toMatch(/SRA01/);
    expect(within(await tabellaDi(card)).getAllByRole('rowheader').map((c) => c.textContent)).toEqual(['SRA01']);
    const tabella = screen.getByRole('table', { name: /^Dotazione, impegni e pagamenti per intervento: 1 riga\./ });
    expect(within(tabella).getByRole('rowheader').textContent).toBe('SRA01');
    // tutte le colonne si vedono (wireframe dotazione): ogni assenza dice il motivo, mai uno zero
    expect(within(tabella).getByRole('columnheader', { name: /Impegnato spesa pubblica/ })).toBeTruthy();
    expect(within(tabella).getByRole('columnheader', { name: /Vincolo dotazione LEADER/ })).toBeTruthy();
    expect(tabella.textContent).toContain('fonte impegni non attiva');
    expect(tabella.textContent).toContain('fonte vincolo LEADER non attiva');
  });
  it("drill-down: il clic su una barra e su una riga apre il dettaglio dell'intervento intero", async () => {
    servi();
    const { router } = renderPagina(Pagina, '/finanziario/dotazione', '/finanziario/dotazione?os=SO4');
    const card = await trovaCard('Dotazione e pagamenti per intervento');
    const grafico = graficoDi(card);
    expect(grafico).toBeTruthy();
    if (grafico) clicSu(grafico, { name: 'SRA01' });
    await waitFor(() => expect(router.state.location.pathname).toBe('/finanziario/interventi/SRA01'));
    expect(router.state.location.search).toBe('');
    await router.navigate('/finanziario/dotazione');
    await userEvent.click(await screen.findByRole('row', { name: "Apri il dettaglio dell'intervento SRA01" }));
    await waitFor(() => expect(router.state.location.pathname).toBe('/finanziario/interventi/SRA01'));
  });
  it('un clic fuori dagli interventi (nome non valido) non naviga', async () => {
    servi();
    const { router } = renderPagina(Pagina, '/finanziario/dotazione');
    const grafico = graficoDi(await trovaCard('Dotazione e pagamenti per intervento'));
    if (grafico) clicSu(grafico, { name: '../riepilogo' });
    expect(router.state.location.pathname).toBe('/finanziario/dotazione');
  });
  it('nessun intervento: stato vuoto informativo (status) in entrambe le sezioni, nessun errore', async () => {
    server.use(
      http.get('*/api/finanziario/spesa-per-intervento', () => HttpResponse.json({ perimetro: 'REGIONALE', righe: [] })),
      http.get('*/api/finanziario/distribuzione-dotazione', () => HttpResponse.json(DISTRIBUZIONE)),
    );
    renderPagina(Pagina, '/finanziario/dotazione');
    await waitFor(() => expect(screen.getAllByText('Nessun intervento per i filtri scelti.')).toHaveLength(2));
    for (const v of screen.getAllByText('Nessun intervento per i filtri scelti.')) expect(v.closest('[role]')?.getAttribute('role')).toBe('status');
    expect(screen.getAllByRole('button', { name: 'Modifica i filtri' })).toHaveLength(2);
    expect(screen.queryByRole('alert')).toBeNull();
  });
  it('nessuna violazione axe', async () => {
    servi();
    const { container } = renderPagina(Pagina, '/finanziario/dotazione');
    await trovaCard('Dotazione tra quota FEASR e non FEASR (RF003)');
    await screen.findByRole('table', { name: /^Dotazione, impegni e pagamenti per intervento/ });
    await expectNoA11yViolations(container);
  });
});

describe('RF003: dotazione ripartita tra quota FEASR e quota non FEASR', () => {
  it('ciambella e voci', async () => {
    servi();
    renderPagina(Pagina, '/finanziario/dotazione');
    const card = await trovaCard('Dotazione tra quota FEASR e non FEASR (RF003)');
    expect(descrizioneDi(card)).toMatch(/Quota FEASR 40\s?%, Quota non FEASR 60\s?%/);
    const t = (await tabellaDi(card)).textContent ?? '';
    // la dotazione e' quella del contratto, non la somma delle quote (V-04)
    expect(t).toContain('Dotazione spesa pubblica');
    expect(t.replace(/\s/g, ' ')).toContain('1.000.000,00 €');
  });
});
