import { describe, expect, it } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { RequireGrant } from '../src/app/require-grant';
import { server } from '../src/shared/api/mock/server';

function renderGuard(visibility: string[]) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <RequireGrant visibility={visibility}>
        <p data-testid="protected">contenuto</p>
      </RequireGrant>
    </QueryClientProvider>,
  );
}

describe('RequireGrant — hide-by-role (solo UX, enforcement server-side)', () => {
  it("mostra i figli quando l'utente ha il grant", async () => {
    server.use(
      http.get('*/auth/status', () =>
        HttpResponse.json({ authenticated: true, user: { username: 'u', roles: ['esempio.read'] } }),
      ),
    );
    renderGuard(['esempio.read']);
    await waitFor(() => expect(screen.getByTestId('protected')).toBeTruthy());
  });

  it('nasconde i figli e mostra il fallback quando manca il grant', async () => {
    server.use(
      http.get('*/auth/status', () =>
        HttpResponse.json({ authenticated: true, user: { username: 'u', roles: ['altro'] } }),
      ),
    );
    renderGuard(['esempio.read']);
    await waitFor(() => expect(screen.getByRole('alert')).toBeTruthy());
    expect(screen.queryByTestId('protected')).toBeNull();
  });

  it('visibility additiva: basta UNO dei grant (fine||coarse)', async () => {
    server.use(
      http.get('*/auth/status', () =>
        HttpResponse.json({ authenticated: true, user: { username: 'u', roles: ['coarse'] } }),
      ),
    );
    renderGuard(['fine.read', 'coarse']);
    await waitFor(() => expect(screen.getByTestId('protected')).toBeTruthy());
  });
});
