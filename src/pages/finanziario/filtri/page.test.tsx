import { describe, expect, it } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '../../../shared/api/mock/server';
import { expectNoA11yViolations } from '../../../shared/testing/axe';
import { FILTRI } from '../../../shared/testing/fixture-finanziario';
import { renderPagina } from '../../../shared/testing/render-pagina';
import Pagina from './page';

const filtri = () => server.use(http.get('*/api/finanziario/filtri', () => HttpResponse.json(FILTRI)));

describe('RF001: filtri Intervento, OS, OG, OP e Azioni portanti applicati a tutti i report', () => {
  it('mostra i cinque filtri con i valori del backend', async () => {
    filtri();
    renderPagina(Pagina, '/finanziario');
    expect(within(await screen.findByLabelText('Intervento')).getAllByRole('option')).toHaveLength(2);
    for (const nome of ['Obiettivo specifico (OS)', 'Obiettivo generale (OG)', 'Obiettivo di policy (OP)', 'Azione portante']) {
      expect(screen.getByLabelText(nome)).toBeTruthy();
    }
  });

  it('applicati, portano al riepilogo con i filtri nell indirizzo', async () => {
    filtri();
    const { router } = renderPagina(Pagina, '/finanziario');
    await userEvent.selectOptions(await screen.findByLabelText('Obiettivo specifico (OS)'), ['OS4']);
    await userEvent.click(screen.getByRole('button', { name: 'Applica filtri' }));
    await waitFor(() => expect(router.state.location.pathname).toBe('/finanziario/riepilogo'));
    expect(router.state.location.search).toBe('?os=OS4');
  });

  it("arrivati da Modifica filtri, applicati riportano al report d'origine con il suo esercizio", async () => {
    filtri();
    const da = encodeURIComponent('/finanziario/sigc/verifica-smp?esercizio=2025');
    const { router } = renderPagina(Pagina, '/finanziario', `/finanziario?os=OS4&da=${da}`);
    await userEvent.selectOptions(await screen.findByLabelText('Intervento'), ['SRA01']);
    await userEvent.click(screen.getByRole('button', { name: 'Applica filtri' }));
    await waitFor(() => expect(router.state.location.pathname).toBe('/finanziario/sigc/verifica-smp'));
    expect(router.state.location.search).toBe('?intervento=SRA01&os=OS4&esercizio=2025');
  });

  it("un ritorno fuori catalogo e' ignorato: si va al riepilogo", async () => {
    filtri();
    const { router } = renderPagina(Pagina, '/finanziario', `/finanziario?da=${encodeURIComponent('https://altro.example/x')}`);
    await screen.findByLabelText('Intervento');
    await userEvent.click(screen.getByRole('button', { name: 'Applica filtri' }));
    await waitFor(() => expect(router.state.location.pathname).toBe('/finanziario/riepilogo'));
    expect(router.state.location.search).toBe('');
  });

  it('senza un ritorno, applicati portano al primo report che il profilo puo consultare (R-09)', async () => {
    filtri();
    server.use(
      http.get('*/auth/status', () =>
        HttpResponse.json({ authenticated: true, user: { username: 'U', roles: ['csr.tx-0001.read', 'csr.tx-0002.read'] } }),
      ),
    );
    const { router } = renderPagina(Pagina, '/finanziario');
    await userEvent.selectOptions(await screen.findByLabelText('Obiettivo specifico (OS)'), ['OS4']);
    // la sessione e' letta quando l'elenco dei report del profilo compare
    await screen.findByRole('link', { name: 'Dotazione e spesa per intervento' });
    await userEvent.click(screen.getByRole('button', { name: 'Applica filtri' }));
    await waitFor(() => expect(router.state.location.pathname).toBe('/finanziario/dotazione'));
    expect(router.state.location.search).toBe('?os=OS4');
  });

  it("Azzera toglie i filtri anche dall'indirizzo, conservando il ritorno", async () => {
    filtri();
    const da = encodeURIComponent('/finanziario/dotazione');
    const { router } = renderPagina(Pagina, '/finanziario', `/finanziario?intervento=SRA03&da=${da}`);
    await screen.findByLabelText('Intervento');
    await userEvent.click(screen.getByRole('button', { name: 'Azzera i filtri' }));
    await waitFor(() => expect(router.state.location.search).toBe(`?da=${da}`));
    const interventi = (await screen.findByLabelText('Intervento')) as HTMLSelectElement;
    expect(interventi.selectedOptions).toHaveLength(0);
  });

  it("riprende i filtri gia' scelti dall indirizzo", async () => {
    filtri();
    renderPagina(Pagina, '/finanziario', '/finanziario?intervento=SRA03');
    const interventi = (await screen.findByLabelText('Intervento')) as HTMLSelectElement;
    expect(Array.from(interventi.selectedOptions, (o) => o.value)).toEqual(['SRA03']);
  });

  it('errore del backend: messaggio leggibile, i report restano raggiungibili', async () => {
    server.use(
      http.get('*/api/finanziario/filtri', () =>
        HttpResponse.json({ type: 'urn:cruscottocsr:problem:accesso-negato', title: 'Forbidden', status: 403, errorCode: 'ACCESSO_NEGATO' }, { status: 403 }),
      ),
    );
    renderPagina(Pagina, '/finanziario');
    expect((await screen.findByRole('alert')).textContent).toContain('Non hai i permessi');
    expect(screen.getByRole('link', { name: 'Riepilogo per intervento' })).toBeTruthy();
  });

  it('nessuna violazione axe', async () => {
    filtri();
    const { container } = renderPagina(Pagina, '/finanziario');
    await screen.findByLabelText('Intervento');
    await expectNoA11yViolations(container);
  });
});

describe("RF001: filtri (accessibilita' da tastiera)", () => {
  it('focus iniziale sul titolo, poi i campi in ordine con Tab', async () => {
    filtri();
    renderPagina(Pagina, '/finanziario');
    const h1 = screen.getByRole('heading', { level: 1 });
    await waitFor(() => expect(document.activeElement).toBe(h1));
    const intervento = await screen.findByLabelText('Intervento');
    const user = userEvent.setup();
    intervento.focus();
    await user.tab();
    expect(document.activeElement).toBe(screen.getByLabelText('Obiettivo specifico (OS)'));
    await user.tab({ shift: true });
    expect(document.activeElement).toBe(intervento);
  });

  it('si applica senza mouse: Tab fino al pulsante e Invio', async () => {
    filtri();
    const { router } = renderPagina(Pagina, '/finanziario');
    const user = userEvent.setup();
    await screen.findByLabelText('Intervento');
    screen.getByLabelText('Obiettivo di policy (OP)').focus();
    await user.tab(); // Azione portante e' disabilitata: il focus la salta
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Applica filtri' }));
    await user.keyboard('{Enter}');
    await waitFor(() => expect(router.state.location.pathname).toBe('/finanziario/riepilogo'));
  });

  it('ogni campo ha il testo di aiuto associato (aria-describedby)', async () => {
    filtri();
    renderPagina(Pagina, '/finanziario');
    const azione = await screen.findByLabelText('Azione portante');
    const aiuto = document.getElementById(azione.getAttribute('aria-describedby') ?? '');
    expect(aiuto?.textContent).toMatch(/finché nessun intervento/);
    expect((azione as HTMLSelectElement).disabled).toBe(true);
  });
});
