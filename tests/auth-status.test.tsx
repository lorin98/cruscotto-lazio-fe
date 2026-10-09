import { createElement } from 'react';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, render, renderHook, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { App } from '../src/app/App';
import { server } from '../src/shared/api/mock/server';
import { AUTH_STATUS_QUERY_KEY, hasGrant, projection, type AuthStatus } from '../src/shared/api/auth/auth-status';
import { EVENTO_UTENTE_CAMBIATO, leggiStatoSessione, useAuthStatus } from '../src/shared/api/auth/use-auth-status';

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

describe("cambio d'utente senza 401: i dati del precedente lasciano la cache (review X-06)", () => {
  const anna: AuthStatus = { authenticated: true, user: { username: 'anna', roles: ['csr.tx-0011.read'] } };
  const avviso = vi.fn();
  afterEach(() => {
    window.removeEventListener(EVENTO_UTENTE_CAMBIATO, avviso);
    avviso.mockReset();
  });
  // client con la sessione di anna e un report gia' letto da lei
  function clientDiAnna() {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    client.setQueryData(AUTH_STATUS_QUERY_KEY, anna);
    client.setQueryData(['report', 'riepilogo'], { righe: ['SRA01'] });
    window.addEventListener(EVENTO_UTENTE_CAMBIATO, avviso);
    return client;
  }
  const rispondeStato = (stato: AuthStatus) => server.use(http.get('*/auth/status', () => HttpResponse.json(stato)));

  it("un'altra persona collegata: via i report in cache, resta lo stato della sessione, la shell e' avvisata", async () => {
    const client = clientDiAnna();
    rispondeStato({ authenticated: true, user: { username: 'bruno', roles: [] } });
    const stato = await leggiStatoSessione(client);
    expect(stato.user?.username).toBe('bruno');
    expect(client.getQueryData(['report', 'riepilogo'])).toBeUndefined();
    expect(client.getQueryData(AUTH_STATUS_QUERY_KEY)).toEqual(anna);
    expect(avviso).toHaveBeenCalledTimes(1);
  });

  it('sessione chiusa altrove (nessun utente): via i report in cache', async () => {
    const client = clientDiAnna();
    rispondeStato({ authenticated: false });
    await leggiStatoSessione(client);
    expect(client.getQueryData(['report', 'riepilogo'])).toBeUndefined();
  });

  it('stesso utente, o prima lettura della sessione: la cache resta', async () => {
    const client = clientDiAnna();
    rispondeStato(anna);
    await leggiStatoSessione(client);
    expect(client.getQueryData(['report', 'riepilogo'])).toEqual({ righe: ['SRA01'] });
    client.removeQueries({ queryKey: AUTH_STATUS_QUERY_KEY });
    rispondeStato({ authenticated: true, user: { username: 'bruno', roles: [] } });
    await leggiStatoSessione(client);
    expect(client.getQueryData(['report', 'riepilogo'])).toEqual({ righe: ['SRA01'] });
    expect(avviso).not.toHaveBeenCalled();
  });

  it("useAuthStatus: il refetch che trova un altro utente porta i suoi grant e toglie i dati del precedente", async () => {
    const client = clientDiAnna();
    const wrapper = ({ children }: { children: ReactNode }) => createElement(QueryClientProvider, { client }, children);
    const { result } = renderHook(() => useAuthStatus(), { wrapper });
    expect(result.current.data?.user?.username).toBe('anna');
    rispondeStato({ authenticated: true, user: { username: 'bruno', roles: ['csr.tx-0001.read'] } });
    await act(() => client.refetchQueries({ queryKey: AUTH_STATUS_QUERY_KEY }));
    await waitFor(() => expect(result.current.data?.user?.username).toBe('bruno'));
    expect(hasGrant(result.current.data, 'csr.tx-0011.read')).toBe(false);
    expect(client.getQueryData(['report', 'riepilogo'])).toBeUndefined();
  });
});
