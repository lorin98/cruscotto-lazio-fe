// app-errori.test.tsx — indirizzi inesistenti ed errori delle pagine, resi dentro la shell (review step9 A-01): testo in
// italiano, h1 col focus e titolo della scheda, testata e piede presenti; mai la pagina d'errore predefinita di React
// Router, mai il messaggio o lo stack dell'errore.
import type { RouteObject } from 'react-router';
import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { QueryClientProvider } from '@tanstack/react-query';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { expectNoA11yViolations } from '../src/shared/testing/axe';
import { ErroreDiPagina } from '../src/app/errori';
import { appRoutes } from '../src/app/routes';
import { clientApp } from './app-client';

// La pagina del riepilogo lancia durante il render: la carica la route lazy vera di appRoutes.
vi.mock('../src/pages/finanziario/riepilogo/page', () => ({
  default: function PaginaCheLancia(): never {
    throw new Error('dettaglio interno della pagina');
  },
}));

function apri(rotte: RouteObject[], percorso: string) {
  const router = createMemoryRouter(rotte, { initialEntries: [percorso] });
  return render(
    <QueryClientProvider client={clientApp()}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
}

// React e React Router scrivono in console l'errore catturato: nei test che lo provocano si tace.
function taciConsole() {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
}

function senzaDettagliTecnici() {
  const testo = document.body.textContent ?? '';
  expect(testo).not.toContain('Unexpected Application Error');
  expect(testo).not.toContain('dettaglio interno');
  expect(testo).not.toMatch(/\bat \S+ \(/); // righe di uno stack
  expect(document.querySelector('pre')).toBeNull();
}

afterEach(() => vi.restoreAllMocks());

describe('indirizzo inesistente', () => {
  it("Pagina non trovata dentro la shell: h1 col focus, titolo della scheda, ritorno alla Home; a11y", async () => {
    const { container } = apri(appRoutes(), '/finanziario/nonesiste');
    const h1 = await screen.findByRole('heading', { level: 1, name: 'Pagina non trovata' });
    await waitFor(() => expect(document.activeElement).toBe(h1));
    expect(document.title).toBe('Pagina non trovata - Cruscotto CSR 2023-2027');
    expect(screen.getByRole('banner')).toBeTruthy();
    expect(screen.getByRole('contentinfo')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Vai alla Home' }).getAttribute('href')).toBe('/');
    senzaDettagliTecnici();
    await expectNoA11yViolations(container);
  });
});

describe('errore di una pagina', () => {
  it('la pagina che lancia: messaggio generico, shell e menu restano, nessun messaggio ne stack; a11y', async () => {
    taciConsole();
    const { container } = apri(appRoutes(), '/finanziario/riepilogo');
    const h1 = await screen.findByRole('heading', { level: 1, name: 'Errore nella pagina' });
    await waitFor(() => expect(document.activeElement).toBe(h1));
    expect(document.title).toBe('Errore nella pagina - Cruscotto CSR 2023-2027');
    expect(screen.getByRole('alert').textContent).toContain('errore inatteso');
    expect(screen.getByRole('banner')).toBeTruthy();
    expect(screen.getByRole('navigation', { name: 'Navigazione principale' })).toBeTruthy();
    expect(screen.getByRole('contentinfo')).toBeTruthy();
    senzaDettagliTecnici();
    await expectNoA11yViolations(container);
  });

  it('modulo della pagina non caricato (dopo un rilascio): invito a ricaricare, senza indirizzo del modulo', async () => {
    taciConsole();
    const modulo = 'https://cruscotto.example/assets/page-1a2b3c.js';
    apri(
      [
        {
          ErrorBoundary: ErroreDiPagina,
          children: [{ path: '/', lazy: () => Promise.reject(new TypeError(`Failed to fetch dynamically imported module: ${modulo}`)) }],
        },
      ],
      '/',
    );
    expect(await screen.findByRole('heading', { level: 1, name: 'Pagina non disponibile' })).toBeTruthy();
    expect(screen.getByRole('alert').textContent).toContain('Ricarica la pagina');
    expect(screen.getByRole('button', { name: 'Ricarica la pagina' })).toBeTruthy();
    expect(document.body.textContent).not.toContain(modulo);
  });

  it('risposta 404 del router: Pagina non trovata', async () => {
    taciConsole();
    apri(
      [
        {
          ErrorBoundary: ErroreDiPagina,
          children: [
            {
              path: '/',
              loader: () => {
                throw new Response('dettaglio interno', { status: 404 });
              },
              Component: () => null,
            },
          ],
        },
      ],
      '/',
    );
    expect(await screen.findByRole('heading', { level: 1, name: 'Pagina non trovata' })).toBeTruthy();
    senzaDettagliTecnici();
  });
});
