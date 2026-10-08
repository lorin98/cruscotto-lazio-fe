import { describe, expect, it } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { App } from '../src/app/App';
import { server } from '../src/shared/api/mock/server';
import { hasGrant, projection, type AuthStatus } from '../src/shared/api/auth/auth-status';

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
