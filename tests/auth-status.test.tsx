import { createElement } from 'react';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { act, render, renderHook, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { App } from '../src/app/App';
import { CANALE_UTENTE, useUtenteDellaSessione } from '../src/app/utente-della-sessione';
import { server } from '../src/shared/api/mock/server';
import { AUTH_STATUS_QUERY_KEY, hasGrant, improntaIdentita, projection, type AuthStatus } from '../src/shared/api/auth/auth-status';
import { useAuthStatus } from '../src/shared/api/auth/use-auth-status';

function renderApp() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <App />
    </QueryClientProvider>,
  );
}

describe('MSW navigabile — /auth/status senza backend', () => {
  it('la feature e navigabile: /auth/status risponde dalla fixture di default', async () => {
    renderApp();
    // la shell mostra l'utente della fixture e la Home le aree visibili per i suoi grant
    await waitFor(() => expect(screen.getByRole('link', { name: 'Esci' })).toBeTruthy());
    expect(screen.getByRole('link', { name: 'Finanziario' })).toBeTruthy();
  });

  it('username reso dal claim quando /auth/status e autenticato', async () => {
    server.use(
      http.get('*/auth/status', () =>
        HttpResponse.json({ authenticated: true, user: { username: 'tizio', roles: ['x'] } }),
      ),
    );
    renderApp();
    await waitFor(() => expect(screen.getByRole('banner').textContent).toContain('tizio'));
  });
});

describe('auth module — gate UX fine||coarse + projection security-inert', () => {
  const s: AuthStatus = {
    authenticated: true,
    user: { username: 'u', roles: ['coarse', 'fine.read'], contextProjection: { tipoEnte: 'A' } },
  };
  it('hasGrant true su ruolo presente (fine o coarse, additivi)', () => {
    expect(hasGrant(s, 'fine.read')).toBe(true);
    expect(hasGrant(s, 'coarse')).toBe(true);
  });
  it('hasGrant false su ruolo assente', () => {
    expect(hasGrant(s, 'assente')).toBe(false);
    expect(hasGrant(undefined, 'x')).toBe(false);
  });
  it('projection legge il valore presente', () => {
    expect(projection(s, 'tipoEnte', '?')).toBe('A');
  });
  it('projection fail-OPEN se assente (mai un controllo di sicurezza)', () => {
    expect(projection(s, 'mancante', 'fallback')).toBe('fallback');
    expect(projection(undefined, 'x', 'fb')).toBe('fb');
  });
});

describe("impronta dell'identita': username, profilo e ruoli ordinati (review N-15)", () => {
  const p1: AuthStatus = { authenticated: true, user: { username: 'ANNA', profile: 'p1', roles: ['csr.tx-0011.read', 'csr.tx-0001.read'] } };
  it('stessa identita con i ruoli in un altro ordine; diversa per username, profilo o ruoli', () => {
    const uguale: AuthStatus = { authenticated: true, user: { username: 'ANNA', profile: 'p1', roles: ['csr.tx-0001.read', 'csr.tx-0011.read'] } };
    expect(improntaIdentita(uguale)).toBe(improntaIdentita(p1));
    const varianti: AuthStatus[] = [
      { authenticated: true, user: { username: 'BRUNO', profile: 'p1', roles: ['csr.tx-0011.read', 'csr.tx-0001.read'] } },
      { authenticated: true, user: { username: 'ANNA', profile: 'p4', roles: ['csr.tx-0011.read', 'csr.tx-0001.read'] } },
      { authenticated: true, user: { username: 'ANNA', profile: 'p1', roles: ['csr.tx-0011.read'] } },
    ];
    for (const v of varianti) expect(improntaIdentita(v)).not.toBe(improntaIdentita(p1));
  });
  it('nessun utente collegato: nessuna impronta', () => {
    expect(improntaIdentita(undefined)).toBeUndefined();
    expect(improntaIdentita({ authenticated: false })).toBeUndefined();
  });
});

describe("cambio d'identita' senza 401: i dati della precedente lasciano la cache (review X-06, N-05, N-15)", () => {
  const anna: AuthStatus = { authenticated: true, user: { username: 'anna', roles: ['csr.tx-0011.read'] } };
  const REPORT = ['report', 'riepilogo'];
  // un'altra scheda sul canale dell'utente: raccoglie i messaggi e ne puo' mandare
  let altraScheda: BroadcastChannel;
  let ricevuti: unknown[];
  beforeEach(() => {
    ricevuti = [];
    altraScheda = new BroadcastChannel(CANALE_UTENTE);
    altraScheda.onmessage = (e: MessageEvent<unknown>) => ricevuti.push(e.data);
  });
  afterEach(() => altraScheda.close());

  // client con la sessione di anna (o un'altra, o null: nessuna) e un report gia' letto da lei
  function clientDiAnna(stato: AuthStatus | null = anna) {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    if (stato) client.setQueryData(AUTH_STATUS_QUERY_KEY, stato);
    client.setQueryData(REPORT, { righe: ['SRA01'] });
    return client;
  }
  const rispondeStato = (stato: AuthStatus) => server.use(http.get('*/auth/status', () => HttpResponse.json(stato)));
  // la shell: lo stato della sessione e l'identita' che segue
  function montaShell(client: QueryClient) {
    const wrapper = ({ children }: { children: ReactNode }) => createElement(QueryClientProvider, { client }, children);
    return renderHook(
      () => {
        useUtenteDellaSessione();
        return useAuthStatus();
      },
      { wrapper },
    );
  }
  const rileggi = (client: QueryClient) => act(() => client.refetchQueries({ queryKey: AUTH_STATUS_QUERY_KEY }));
  const annunciato = () => waitFor(() => expect(ricevuti).toContain('utente'));

  it('la lettura di /auth/status e pura: da sola non tocca la cache', async () => {
    const client = clientDiAnna();
    const wrapper = ({ children }: { children: ReactNode }) => createElement(QueryClientProvider, { client }, children);
    const { result } = renderHook(() => useAuthStatus(), { wrapper });
    rispondeStato({ authenticated: true, user: { username: 'bruno', roles: [] } });
    await rileggi(client);
    await waitFor(() => expect(result.current.data?.user?.username).toBe('bruno'));
    expect(client.getQueryData(REPORT)).toEqual({ righe: ['SRA01'] });
  });

  it("un'altra persona collegata: via i report, restano lo stato e i grant della nuova; le altre schede sono avvisate", async () => {
    const client = clientDiAnna();
    const { result } = montaShell(client);
    await annunciato();
    ricevuti.length = 0;
    rispondeStato({ authenticated: true, user: { username: 'bruno', roles: ['csr.tx-0001.read'] } });
    await rileggi(client);
    await waitFor(() => expect(result.current.data?.user?.username).toBe('bruno'));
    expect(hasGrant(result.current.data, 'csr.tx-0011.read')).toBe(false);
    expect(client.getQueryData(REPORT)).toBeUndefined();
    expect(client.getQueryData<AuthStatus>(AUTH_STATUS_QUERY_KEY)?.user?.username).toBe('bruno');
    await annunciato();
  });

  it('stesso username con altri ruoli (gruppo da P1 a P4): la cache si svuota (N-15)', async () => {
    const client = clientDiAnna({ authenticated: true, user: { username: 'anna', profile: 'p1', roles: ['csr.tx-0011.read', 'csr.tx-0001.read'] } });
    montaShell(client);
    rispondeStato({ authenticated: true, user: { username: 'anna', profile: 'p1', roles: ['csr.tx-0011.read'] } });
    await rileggi(client);
    expect(client.getQueryData(REPORT)).toBeUndefined();
  });

  it('stesso username con un altro profilo: la cache si svuota (N-15)', async () => {
    const client = clientDiAnna({ authenticated: true, user: { username: 'anna', profile: 'p1', roles: ['csr.tx-0011.read'] } });
    montaShell(client);
    rispondeStato({ authenticated: true, user: { username: 'anna', profile: 'p4', roles: ['csr.tx-0011.read'] } });
    await rileggi(client);
    expect(client.getQueryData(REPORT)).toBeUndefined();
  });

  it('sessione chiusa altrove (nessun utente): via i report in cache', async () => {
    const client = clientDiAnna();
    montaShell(client);
    rispondeStato({ authenticated: false });
    await rileggi(client);
    expect(client.getQueryData(REPORT)).toBeUndefined();
  });

  it('stessa identita, anche con i ruoli in un altro ordine: la cache resta e nessun annuncio', async () => {
    const client = clientDiAnna({ authenticated: true, user: { username: 'anna', roles: ['a', 'b'] } });
    montaShell(client);
    await annunciato();
    ricevuti.length = 0;
    rispondeStato({ authenticated: true, user: { username: 'anna', roles: ['b', 'a'] } });
    await rileggi(client);
    await act(() => new Promise<void>((r) => setTimeout(r, 20)));
    expect(client.getQueryData(REPORT)).toEqual({ righe: ['SRA01'] });
    expect(ricevuti).toEqual([]);
  });

  it('prima lettura della sessione: la cache resta e la scheda si annuncia alle altre', async () => {
    const client = clientDiAnna(null);
    rispondeStato({ authenticated: true, user: { username: 'bruno', roles: [] } });
    const { result } = montaShell(client);
    await waitFor(() => expect(result.current.data?.user?.username).toBe('bruno'));
    expect(client.getQueryData(REPORT)).toEqual({ righe: ['SRA01'] });
    await annunciato();
  });

  it("un annuncio da un'altra scheda fa rileggere lo stato della sessione", async () => {
    const client = clientDiAnna();
    const { result } = montaShell(client);
    rispondeStato({ authenticated: true, user: { username: 'bruno', roles: [] } });
    altraScheda.postMessage('utente');
    await waitFor(() => expect(result.current.data?.user?.username).toBe('bruno'));
    expect(client.getQueryData(REPORT)).toBeUndefined();
  });
});
