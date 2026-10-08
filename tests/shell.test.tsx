import type { ReactElement } from 'react';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { QueryClientProvider } from '@tanstack/react-query';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { http, HttpResponse } from 'msw';
import { server } from '../src/shared/api/mock/server';
import { setActiveAuthFixture } from '../src/shared/api/mock/handlers';
import { expectNoA11yViolations } from '../src/shared/testing/axe';
import { RequireGrant } from '../src/app/require-grant';
import { appRoutes } from '../src/app/routes';
import { segnalaAccessoNegato } from '../src/app/avvisi';
import { AvvisoInattivita, CANALE_INATTIVITA } from '../src/app/inattivita';
import { Layout } from '../src/app/layout';
import { AUTH_STATUS_QUERY_KEY } from '../src/shared/api/auth/auth-status';
import PaginaRiepilogo from '../src/pages/finanziario/riepilogo/page';
import { FILTRI, RIEPILOGO } from '../src/shared/testing/fixture-finanziario';
import { rispondi } from '../src/shared/testing/msw';
import { PAGINE_FINANZIARIO } from '../src/features/finanziario';
import { SITO_ARSIAL, SITO_REGIONE } from '../src/app/collegamenti';
import { clientApp } from './app-client';

// Shell dell'app (review step9: V-03, V-04, V-05, V-17, A-01, A-04, A-10, A-12/NFR-41), sempre sul QueryClient di
// produzione (Z-08).
function conQuery(ui: ReactElement, client = clientApp()) {
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

// messaggi fra schede (BroadcastChannel): la consegna e' asincrona e non passa dai timer finti
async function consegnati(condizione: () => boolean) {
  for (let i = 0; i < 100 && !condizione(); i++) {
    await act(() => new Promise<void>((r) => setImmediate(r)));
  }
  expect(condizione()).toBe(true);
}
function apriApp(percorso = '/') {
  const router = createMemoryRouter(appRoutes(), { initialEntries: [percorso] });
  return { ...conQuery(<RouterProvider router={router} />), router };
}

afterEach(() => vi.useRealTimers());

describe('RequireGrant: tre casi distinti', () => {
  it('utente non collegato: invito ad accedere, nessun redirect automatico', async () => {
    setActiveAuthFixture('anonymous');
    conQuery(<RequireGrant visibility={['csr.tx-0011.read']}><p>report</p></RequireGrant>);
    expect(await screen.findByRole('heading', { name: 'Accesso richiesto' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Accedi' }).getAttribute('href')).toBe('/auth/login');
    expect(document.title).toBe('Accesso richiesto - Cruscotto CSR 2023-2027');
    expect(screen.queryByText('report')).toBeNull();
  });
  it('sessione non verificabile (401 di /auth/status): Riprova e Accedi di nuovo, senza ciclo', async () => {
    server.use(http.get('*/auth/status', () => new HttpResponse(null, { status: 401 })));
    conQuery(<RequireGrant visibility={['csr.tx-0011.read']}><p>report</p></RequireGrant>);
    expect(await screen.findByRole('heading', { name: 'Sessione non disponibile' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Riprova' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Accedi di nuovo' })).toBeTruthy();
  });
  it('utente collegato senza il grant: accesso non disponibile', async () => {
    server.use(http.get('*/auth/status', () => HttpResponse.json({ authenticated: true, user: { username: 'U', roles: ['altro'] } })));
    conQuery(<RequireGrant visibility={['csr.tx-0011.read']}><p>report</p></RequireGrant>);
    expect(await screen.findByRole('heading', { name: 'Accesso non disponibile' })).toBeTruthy();
  });
});

describe('Layout e Home', () => {
  it("dopo il login la Home porta alle aree dell'utente; intestazione con utente ed Esci", async () => {
    const { container } = apriApp('/');
    expect(await screen.findByRole('link', { name: 'Finanziario' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Finanziario' }).getAttribute('href')).toBe('/finanziario');
    expect(screen.getByRole('link', { name: 'Esci' }).getAttribute('href')).toBe('/auth/logout');
    expect(screen.getByRole('link', { name: 'Salta al contenuto' }).getAttribute('href')).toBe('#contenuto');
    expect(screen.getByRole('banner')).toBeTruthy();
    expect(screen.getByRole('contentinfo')).toBeTruthy();
    await expectNoA11yViolations(container);
  });
  it('utente non collegato: la Home invita ad accedere e non mostra Esci', async () => {
    setActiveAuthFixture('anonymous');
    apriApp('/');
    expect(await screen.findByRole('link', { name: 'Accedi' })).toBeTruthy();
    expect(screen.queryByRole('link', { name: 'Esci' })).toBeNull();
  });
  it('il 403 delle mutation diventa un avviso della shell, chiudibile', async () => {
    apriApp('/');
    await screen.findByRole('link', { name: 'Finanziario' });
    act(() => segnalaAccessoNegato());
    expect((await screen.findByRole('alert')).textContent).toContain('Non hai i permessi per questa operazione');
    fireEvent.click(screen.getByRole('button', { name: 'Chiudi' }));
    await waitFor(() => expect(screen.queryByRole('alert')).toBeNull());
  });
});

describe('NFR-41: avviso di scadenza per inattivita', () => {
  it('avviso prima del limite, Resta collegato lo chiude; senza risposta la sessione viene chiusa (Z-03)', async () => {
    vi.useFakeTimers();
    const chiudiSessione = vi.fn();
    conQuery(<AvvisoInattivita limite={10_000} preavviso={2_000} alloScadere={chiudiSessione} />);
    expect(screen.queryByRole('alertdialog')).toBeNull();
    act(() => vi.advanceTimersByTime(8_100));
    expect(screen.getByRole('alertdialog').textContent).toContain('La sessione sta per scadere');
    fireEvent.click(screen.getByRole('button', { name: 'Resta collegato' }));
    expect(screen.queryByRole('alertdialog')).toBeNull();
    act(() => vi.advanceTimersByTime(9_900));
    expect(chiudiSessione).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(200));
    expect(chiudiSessione).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('alertdialog').textContent).toContain('Sessione scaduta');
    expect(screen.getByRole('link', { name: 'Accedi' }).getAttribute('href')).toBe('/auth/login');
  });
  it('il testo del preavviso viene dal preavviso configurato', () => {
    vi.useFakeTimers();
    conQuery(<AvvisoInattivita limite={10 * 60_000} preavviso={3 * 60_000} alloScadere={vi.fn()} />);
    act(() => vi.advanceTimersByTime(7 * 60_000 + 100));
    expect(screen.getByRole('alertdialog').textContent).toContain('scadrà tra 3 minuti');
  });
  it("l'attivita' dell'utente rimanda l'avviso", () => {
    vi.useFakeTimers();
    conQuery(<AvvisoInattivita limite={10_000} preavviso={2_000} alloScadere={vi.fn()} />);
    act(() => vi.advanceTimersByTime(7_000));
    act(() => {
      window.dispatchEvent(new Event('keydown'));
    });
    act(() => vi.advanceTimersByTime(7_000));
    expect(screen.queryByRole('alertdialog')).toBeNull();
  });
  it("l'attivita' in un'altra scheda tiene viva la sessione, anche con l'avviso gia' aperto", async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] });
    const chiudiSessione = vi.fn();
    conQuery(<AvvisoInattivita limite={10_000} preavviso={2_000} alloScadere={chiudiSessione} />);
    act(() => vi.advanceTimersByTime(8_100));
    expect(screen.getByRole('alertdialog')).toBeTruthy();
    const altraScheda = new BroadcastChannel(CANALE_INATTIVITA);
    altraScheda.postMessage('attivita');
    await consegnati(() => screen.queryByRole('alertdialog') === null);
    act(() => vi.advanceTimersByTime(9_000));
    expect(chiudiSessione).not.toHaveBeenCalled();
    altraScheda.close();
  });
  it("l'attivita' qui e la scadenza si annunciano alle altre schede; una scadenza altrove non richiude la sessione", async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] });
    const ricevuti: string[] = [];
    const altraScheda = new BroadcastChannel(CANALE_INATTIVITA);
    altraScheda.onmessage = (e: MessageEvent<string>) => ricevuti.push(e.data);
    const chiudiSessione = vi.fn();
    conQuery(<AvvisoInattivita limite={10_000} preavviso={2_000} alloScadere={chiudiSessione} />);
    act(() => {
      window.dispatchEvent(new Event('keydown'));
    });
    await consegnati(() => ricevuti.includes('attivita'));
    altraScheda.postMessage('scaduta');
    await consegnati(() => screen.queryByRole('alertdialog') !== null);
    expect(screen.getByRole('alertdialog').textContent).toContain('Sessione scaduta');
    act(() => vi.advanceTimersByTime(20_000));
    expect(chiudiSessione).not.toHaveBeenCalled();
    altraScheda.close();
  });
});

describe('QueryClient di produzione montato con la shell (R-05, R-07, R-08, R-16)', () => {
  function apriConClientReale(percorso: string) {
    const client = clientApp();
    const router = createMemoryRouter([{ Component: Layout, children: [{ path: '/finanziario/riepilogo', Component: PaginaRiepilogo }] }], {
      initialEntries: [percorso],
    });
    return render(<QueryClientProvider client={client}><RouterProvider router={router} /></QueryClientProvider>);
  }

  it("il 403 dell'esportazione CSV compare una sola volta (inline), non anche nell'avviso della shell", async () => {
    server.use(
      http.get('*/api/finanziario/riepilogo', () => HttpResponse.json(RIEPILOGO)),
      http.get('*/api/finanziario/riepilogo/csv', () =>
        HttpResponse.json({ type: 'urn:cruscottocsr:problem:accesso-negato', title: 'Forbidden', status: 403, errorCode: 'ACCESSO_NEGATO' }, {
          status: 403,
          headers: { 'Content-Type': 'application/problem+json' },
        }),
      ),
    );
    apriConClientReale('/finanziario/riepilogo');
    fireEvent.click(await screen.findByRole('button', { name: 'Esporta la tabella in CSV' }));
    await waitFor(() => expect(screen.getAllByRole('alert')).toHaveLength(1));
    expect(screen.getByRole('alert').textContent).toContain('Non hai i permessi per consultare questi dati');
    expect(screen.queryByText('Non hai i permessi per questa operazione.')).toBeNull();
  });

  it("chiuso l'avviso del 403, il focus torna al titolo della pagina", async () => {
    server.use(http.get('*/api/finanziario/riepilogo', () => HttpResponse.json(RIEPILOGO)));
    apriConClientReale('/finanziario/riepilogo');
    const h1 = await screen.findByRole('heading', { level: 1 });
    act(() => segnalaAccessoNegato());
    // il focus parte dal bottone (come da tastiera): senza la correzione, chiuso l'avviso, finirebbe sul body (Z-05)
    const chiudi = await screen.findByRole('button', { name: 'Chiudi' });
    chiudi.focus();
    expect(document.activeElement).toBe(chiudi);
    await userEvent.click(chiudi);
    await waitFor(() => expect(document.activeElement).toBe(h1));
  });

  it('un refetch fallito di /auth/status con la sessione in cache non toglie la pagina', async () => {
    const client = clientApp();
    client.setQueryData(AUTH_STATUS_QUERY_KEY, { authenticated: true, user: { username: 'U', roles: ['csr.tx-0011.read'] } });
    server.use(http.get('*/auth/status', () => new HttpResponse(null, { status: 503 })));
    conQuery(<RequireGrant visibility={['csr.tx-0011.read']}><p>report</p></RequireGrant>, client);
    await act(async () => {
      await client.refetchQueries({ queryKey: AUTH_STATUS_QUERY_KEY });
    });
    expect(client.getQueryState(AUTH_STATUS_QUERY_KEY)?.status).toBe('error');
    expect(screen.getByText('report')).toBeTruthy();
  });

  it('Home con la sessione non verificabile: Riprova e Accedi di nuovo, non un invito ad accedere', async () => {
    server.use(http.get('*/auth/status', () => new HttpResponse(null, { status: 503 })));
    apriApp('/');
    expect((await screen.findByRole('alert')).textContent).toContain('Non riesco a verificare la sessione');
    expect(screen.getByRole('button', { name: 'Riprova' })).toBeTruthy();
    expect(screen.queryByRole('link', { name: 'Accedi' })).toBeNull();
  });
});

describe('shell UI v2: intestazione degli enti, menu laterale, ricerca, piede', () => {
  const servi = () => server.use(rispondi('/api/finanziario/riepilogo', RIEPILOGO), rispondi('/api/finanziario/filtri', FILTRI));

  it('loghi degli enti con il link al sito in una nuova finestra; piede con i collegamenti e quelli ancora da definire', async () => {
    apriApp('/');
    const intestazione = screen.getByRole('banner');
    const regione = within(intestazione).getByRole('link', { name: 'Regione Lazio (si apre in una nuova finestra)' });
    expect(regione.getAttribute('href')).toBe(SITO_REGIONE.url);
    expect(regione.getAttribute('target')).toBe('_blank');
    expect(regione.getAttribute('rel')).toContain('noopener');
    expect(within(intestazione).getByRole('link', { name: /^ARSIAL - Agenzia Regionale .* \(si apre in una nuova finestra\)$/ }).getAttribute('href')).toBe(SITO_ARSIAL.url);
    const istituzioni = screen.getByRole('navigation', { name: 'Collegamenti istituzionali' });
    expect(within(istituzioni).getAllByRole('link').map((l) => l.getAttribute('href'))).toEqual([SITO_REGIONE.url, SITO_ARSIAL.url]);
    const legali = screen.getByRole('navigation', { name: 'Informazioni legali' });
    // nessun link verso pagine che non esistono ancora
    expect(within(legali).queryAllByRole('link')).toHaveLength(0);
    expect(legali.textContent).toContain('Privacy (indirizzo da definire)');
  });

  it("menu laterale: le pagine del finanziario visibili, la corrente marcata, i filtri dell'indirizzo conservati, le aree future senza link", async () => {
    servi();
    apriApp('/finanziario/riepilogo?intervento=SRA01');
    const menu = await screen.findByRole('navigation', { name: 'Navigazione principale' });
    const gruppo = within(menu).getByRole('button', { name: 'Finanziario' });
    expect(gruppo.getAttribute('aria-expanded')).toBe('true');
    const voci = await within(menu).findAllByRole('link');
    expect(voci.map((v) => v.textContent)).toEqual(PAGINE_FINANZIARIO.map((p) => p.titolo));
    for (const v of voci) expect(v.getAttribute('href')).toMatch(/\?intervento=SRA01$/);
    const corrente = within(menu).getByRole('link', { name: 'Riepilogo per intervento' });
    await waitFor(() => expect(corrente.getAttribute('aria-current')).toBe('page'));
    expect(within(menu).getByRole('link', { name: 'Panoramica' }).getAttribute('aria-current')).toBeNull();
    expect(menu.textContent).toContain('Fisicopresto');
    await userEvent.click(gruppo);
    expect(gruppo.getAttribute('aria-expanded')).toBe('false');
    expect(within(menu).queryAllByRole('link')).toHaveLength(0);
  });

  it('menu laterale: solo le pagine visibili per i grant dell utente (gate di UX)', async () => {
    servi();
    server.use(http.get('*/auth/status', () => HttpResponse.json({ authenticated: true, user: { username: 'U', roles: ['csr.tx-0011.read', 'csr.tx-0001.read', 'csr.tx-0013.read'] } })));
    apriApp('/finanziario/riepilogo');
    const menu = await screen.findByRole('navigation', { name: 'Navigazione principale' });
    await waitFor(() => expect(within(menu).getAllByRole('link').map((l) => l.textContent)).toEqual(['Panoramica', 'Riepilogo per intervento', 'Domande e importi SIGC']));
  });

  it('menu su schermo piccolo: il bottone apre il pannello col menu, la scelta di una pagina lo chiude', async () => {
    servi();
    const { router, container } = apriApp('/finanziario/riepilogo');
    await userEvent.click(await screen.findByRole('button', { name: 'Apri il menu' }));
    const pannello = await screen.findByRole('dialog', { name: 'Menu' });
    await expectNoA11yViolations(container.ownerDocument.body);
    await userEvent.click(within(pannello).getByRole('link', { name: 'Avanzamento finanziario' }));
    await waitFor(() => expect(router.state.location.pathname).toBe('/finanziario/avanzamento'));
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Menu' })).toBeNull());
  });

  it("ricerca nella barra: un codice noto apre il dettaglio dell'intervento, uno sconosciuto lo dice in modo visibile", async () => {
    servi();
    const { router } = apriApp('/finanziario/riepilogo');
    const campo = await screen.findByRole('combobox', { name: 'Cerca un intervento per codice' });
    await userEvent.type(campo, 'SRZ99{Enter}');
    expect((await screen.findByRole('alert')).textContent).toBe('Codice non trovato');
    expect(campo.getAttribute('aria-invalid')).toBe('true');
    await userEvent.clear(campo);
    expect(screen.queryByRole('alert')).toBeNull();
    await userEvent.type(campo, 'sra01 Intervento di prova A{Enter}');
    await waitFor(() => expect(router.state.location.pathname).toBe('/finanziario/interventi/SRA01'));
    expect((campo as HTMLInputElement).value).toBe('');
  });
});
