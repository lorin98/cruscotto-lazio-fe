import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { server } from '../src/shared/api/mock/server';
import { setActiveAuthFixture } from '../src/shared/api/mock/handlers';
import { AXIOS_INSTANCE, authEvents, configuraLoginDaSessioneScaduta } from '../src/shared/api/mutator/bff-mutator';
import { RITORNO_MAX, percorsoDiRitorno, resolveLoginPath } from '../src/shared/config/base-path';
import { configuraRitornoDopoLogin, linkDiLogin, ritornoDellaPagina } from '../src/app/ritorno-login';
import { RequireGrant } from '../src/app/require-grant';
import { clientApp } from './app-client';

// Ritorno al link dopo il login (review elenco v1 X-06, D-11 Rev. 9 di nfr-conformance, SC-FA_LOGIN_RITORNO): la SPA
// porta a /auth/login?ritorno=<pagina corrente> e il BFF, che riconvalida, ci riporta dopo il login. Niente Web Storage.

const DOMANDE = '/elenco-operativo/domande';
const LOGIN_DOMANDE_2024 = '/auth/login?ritorno=%2Felenco-operativo%2Fdomande%3Fanno%3D2024';
const pos = (pathname: string, search = '') => ({ pathname, search });

afterEach(() => {
  window.history.pushState({}, '', '/');
  configuraLoginDaSessioneScaduta(() => null);
});

describe('resolveLoginPath e percorsoDiRitorno (shared): solo percorsi relativi della SPA', () => {
  it('senza ritorno il login di sempre; con il ritorno la query codificata', () => {
    expect(resolveLoginPath()).toBe('/auth/login');
    expect(resolveLoginPath(null)).toBe('/auth/login');
    expect(resolveLoginPath(percorsoDiRitorno(DOMANDE, '?anno=2024')?.completo)).toBe(LOGIN_DOMANDE_2024);
  });

  it('il limite vale sulla forma codificata (D-11 Rev. 10 c): corto in chiaro ma lungo codificato, niente ritorno', () => {
    // 600 caratteri accentati: 600 in chiaro, oltre 3.600 codificati (la riga della richiesta supererebbe 4096: 414)
    const accentati = `?testo=${'à'.repeat(600)}`;
    expect(`${DOMANDE}${accentati}`.length).toBeLessThan(RITORNO_MAX);
    expect(percorsoDiRitorno(DOMANDE, accentati)).toBeNull();
    // al limite: la forma codificata di esattamente RITORNO_MAX caratteri passa, uno in piu' no
    const base = encodeURIComponent(`${DOMANDE}?testo=`).length;
    expect(percorsoDiRitorno(DOMANDE, `?testo=${'a'.repeat(RITORNO_MAX - base)}`)).not.toBeNull();
    expect(percorsoDiRitorno(DOMANDE, `?testo=${'a'.repeat(RITORNO_MAX - base + 1)}`)).toBeNull();
  });

  it('rifiuta Home, percorsi del BFF, percorsi assoluti o di protocollo, barre rovesciate, controlli, troppo lunghi', () => {
    expect(percorsoDiRitorno('/', '')).toBeNull();
    for (const p of ['/auth', '/auth/login', '/api/elenco-operativo/domande', '/q/health']) expect(percorsoDiRitorno(p, '')).toBeNull();
    for (const p of ['//altro.example/x', 'https://altro.example/x', 'altro', `/${String.fromCharCode(92)}altro.example`]) {
      expect(percorsoDiRitorno(p, '')).toBeNull();
    }
    expect(percorsoDiRitorno(`${DOMANDE}${String.fromCharCode(10)}x`, '')).toBeNull();
    expect(percorsoDiRitorno(DOMANDE, `?testo=a${String.fromCharCode(0)}`)).toBeNull();
    expect(percorsoDiRitorno(DOMANDE, `?testo=${'a'.repeat(RITORNO_MAX)}`)).toBeNull();
  });

  it('conserva la query; il frammento non fa parte del ritorno', () => {
    expect(percorsoDiRitorno(DOMANDE, '?anno=2024&stato=RILASCIATO')).toEqual({ completo: `${DOMANDE}?anno=2024&stato=RILASCIATO`, relativo: DOMANDE });
    expect(percorsoDiRitorno(DOMANDE, '?')).toEqual({ completo: DOMANDE, relativo: DOMANDE });
  });
});

describe('ritornoDellaPagina e linkDiLogin (app): solo le route della route-table', () => {
  it('route dell\'app, anche con parametri di percorso: si torna li\'', () => {
    expect(ritornoDellaPagina(pos(DOMANDE, '?anno=2024'))).toBe(`${DOMANDE}?anno=2024`);
    expect(ritornoDellaPagina(pos('/elenco-operativo/domande/SOSTEGNO/04230000001'))).toBe('/elenco-operativo/domande/SOSTEGNO/04230000001');
    expect(ritornoDellaPagina(pos('/finanziario/interventi/SRA01', '?scheda=sigc'))).toBe('/finanziario/interventi/SRA01?scheda=sigc');
    expect(linkDiLogin(pos(DOMANDE, '?anno=2024'))).toBe(LOGIN_DOMANDE_2024);
  });

  it('Home, percorsi fuori dalla route-table o del BFF: il login di sempre', () => {
    expect(linkDiLogin(pos('/'))).toBe('/auth/login');
    expect(linkDiLogin(pos('/pagina-che-non-esiste'))).toBe('/auth/login');
    expect(linkDiLogin(pos('/elenco-operativo/domande/SOSTEGNO'))).toBe('/auth/login');
    expect(linkDiLogin(pos('/api/elenco-operativo/domande'))).toBe('/auth/login');
    expect(linkDiLogin(null)).toBe('/auth/login');
  });

  it('dalla posizione del browser: la query resta, il frammento no', () => {
    window.history.pushState({}, '', `${DOMANDE}?anno=2024#tabella`);
    expect(linkDiLogin()).toBe(LOGIN_DOMANDE_2024);
  });
});

describe('sessione scaduta durante una lettura (mutator): login con il ritorno alla pagina', () => {
  it('su /elenco-operativo/domande?anno=2024 un 401 porta a /auth/login?ritorno=<la pagina>', async () => {
    configuraRitornoDopoLogin();
    window.history.pushState({}, '', `${DOMANDE}?anno=2024`);
    const vai = vi.spyOn(authEvents, 'vai').mockImplementation(() => {});
    server.use(http.get('*/api/elenco-operativo/domande', () => new HttpResponse(null, { status: 401 })));
    await expect(AXIOS_INSTANCE.get('/api/elenco-operativo/domande')).rejects.toBeTruthy();
    expect(vai).toHaveBeenCalledWith(LOGIN_DOMANDE_2024);
    vai.mockRestore();
  });

  it('senza la configurazione dell\'app il mutator porta al login di sempre', async () => {
    window.history.pushState({}, '', `${DOMANDE}?anno=2024`);
    const vai = vi.spyOn(authEvents, 'vai').mockImplementation(() => {});
    server.use(http.get('*/api/elenco-operativo/domande', () => new HttpResponse(null, { status: 419 })));
    await expect(AXIOS_INSTANCE.get('/api/elenco-operativo/domande')).rejects.toBeTruthy();
    expect(vai).toHaveBeenCalledWith('/auth/login');
    vai.mockRestore();
  });
});

describe('shell: "Accedi" su un link condiviso aperto senza sessione', () => {
  it('RequireGrant porta al login con il ritorno alla pagina', async () => {
    setActiveAuthFixture('anonymous');
    window.history.pushState({}, '', `${DOMANDE}?anno=2024`);
    render(
      <QueryClientProvider client={clientApp()}>
        <RequireGrant visibility={['csr.tx-0056.read']}>
          <p>elenco</p>
        </RequireGrant>
      </QueryClientProvider>,
    );
    expect((await screen.findByRole('link', { name: 'Accedi' })).getAttribute('href')).toBe(LOGIN_DOMANDE_2024);
    expect(screen.queryByText('elenco')).toBeNull();
  });
});
