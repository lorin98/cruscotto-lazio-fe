import { describe, expect, it, vi } from 'vitest';
import { delay, http, HttpResponse } from 'msw';
import { AxiosError, AxiosHeaders } from 'axios';
import type { AxiosResponse } from 'axios';
import { server } from '../src/shared/api/mock/server';
import { AXIOS_INSTANCE, LETTURE_IN_PARALLELO, authEvents, customInstance } from '../src/shared/api/mutator/bff-mutator';
import { classifyProblem } from '../src/shared/api/problem/problem-types';
import { getErrorMessage } from '../src/shared/lib';
import { rispostaRiservaAssente } from '../src/features/finanziario/api';
import { attesaPrimaDiRiprovare, soloTransitori } from '../src/shared/api/retry/nuovi-tentativi';

// Runtime allineato al contratto reale del backend ARSCSR (review step9: H-01..H-04, A-02, A-04, A-05, V-02).
const tipo = (codice: string) => `urn:cruscottocsr:problem:${codice}`;
function erroreHttp(status: number, data?: unknown, headers: Record<string, string> = {}): AxiosError {
  const response = { status, data, statusText: '', headers, config: { headers: new AxiosHeaders() } } as AxiosResponse;
  return new AxiosError('richiesta fallita', 'ERR_BAD_RESPONSE', undefined, undefined, response);
}

describe('getErrorMessage: messaggio dal problem-type, mai dal solo status', () => {
  it('sessione, accesso negato, richiesta non ammessa, non trovato', () => {
    expect(getErrorMessage(erroreHttp(401))).toMatch(/sessione è scaduta/);
    expect(getErrorMessage(erroreHttp(403, { type: tipo('accesso-negato') }))).toMatch(/permessi/);
    expect(getErrorMessage(erroreHttp(403, { type: tipo('richiesta-non-ammessa') }))).toMatch(/non ammessa/);
    expect(getErrorMessage(erroreHttp(404, { type: tipo('not-found') }))).toBe('Dati non trovati.');
  });
  it('il detail si mostra solo per i tipi dichiarati leggibili, troncato', () => {
    expect(getErrorMessage(erroreHttp(400, { type: tipo('dato-non-valido'), detail: 'campo anno: valore non ammesso' }))).toContain('campo anno');
    expect(getErrorMessage(erroreHttp(503, { type: tipo('tempo-scaduto'), detail: 'restringere i filtri' }))).toContain('restringere i filtri');
    expect(getErrorMessage(erroreHttp(503, { type: tipo('esportazione-non-registrata'), detail: 'audit non scritto' }))).toContain('audit non scritto');
    // stesso status ma problem-type diverso: il detail non passa
    expect(getErrorMessage(erroreHttp(503, { type: tipo('capacita-esaurita'), detail: 'interno' }))).not.toContain('interno');
    expect(getErrorMessage(erroreHttp(400, { type: tipo('dato-non-valido'), detail: 'x'.repeat(500) })).length).toBeLessThan(260);
  });
  it('senza problem-type: messaggio per status; rete; errore non HTTP', () => {
    expect(getErrorMessage(erroreHttp(429))).toMatch(/Troppe richieste/);
    expect(getErrorMessage(erroreHttp(503))).toMatch(/occupato/);
    expect(getErrorMessage(new AxiosError('Network Error', 'ERR_NETWORK'))).toMatch(/non risponde/);
    expect(getErrorMessage(new Error('boom'))).toBe('Errore inatteso nella pagina.');
  });
});

describe('classifyProblem: un Blob non e un problem+json', () => {
  it('il MIME del Blob non viene scambiato per problem-type', () => {
    expect(classifyProblem(403, new Blob(['{}'], { type: tipo('accesso-negato') })).kind).toBe('unknown');
  });
});

describe('esportazione CSV: il problem+json di un errore arriva come oggetto', () => {
  it('403 ACCESSO_NEGATO su responseType blob e classificato come accesso negato', async () => {
    server.use(
      http.get('*/api/finanziario/riepilogo/csv', () =>
        HttpResponse.json({ type: tipo('accesso-negato'), title: 'Forbidden', status: 403, errorCode: 'ACCESSO_NEGATO' }, {
          status: 403,
          headers: { 'Content-Type': 'application/problem+json' },
        }),
      ),
    );
    const errore = await customInstance<Blob>({ url: '/api/finanziario/riepilogo/csv', method: 'GET', responseType: 'blob' }).catch((e: unknown) => e);
    expect(getErrorMessage(errore)).toMatch(/permessi/);
  });
});

describe('redirect al login', () => {
  it('il 401 di /auth/status non manda al login (niente ciclo); quello dei dati si', async () => {
    const spia = vi.spyOn(authEvents, 'onSessionExpired').mockImplementation(() => {});
    server.use(
      http.get('*/auth/status', () => new HttpResponse(null, { status: 401 })),
      http.get('*/api/dati', () => new HttpResponse(null, { status: 401 })),
    );
    await AXIOS_INSTANCE.get('/auth/status').catch(() => undefined);
    expect(spia).not.toHaveBeenCalled();
    await AXIOS_INSTANCE.get('/api/dati').catch(() => undefined);
    expect(spia).toHaveBeenCalledTimes(1);
    spia.mockRestore();
  });
});

// il tetto del backend vale per le letture del finanziario (cruscottocsr.finanziario.letture-per-utente)
describe('letture verso il backend: mai oltre il tetto per utente', () => {
  it(`al piu' ${LETTURE_IN_PARALLELO} GET /api/finanziario in corso insieme, le altre in coda`, async () => {
    let inCorso = 0;
    let massimo = 0;
    server.use(
      http.get('*/api/finanziario/lenta', async () => {
        inCorso++;
        massimo = Math.max(massimo, inCorso);
        await delay(20);
        inCorso--;
        return HttpResponse.json({ ok: true });
      }),
    );
    const esiti = await Promise.all(Array.from({ length: 5 }, () => customInstance<{ ok: boolean }>({ url: '/api/finanziario/lenta', method: 'GET' })));
    expect(esiti.every((e) => e.ok)).toBe(true);
    expect(massimo).toBe(LETTURE_IN_PARALLELO);
  });
  it('un errore libera comunque il posto', async () => {
    server.use(http.get('*/api/finanziario/rotta', () => new HttpResponse(null, { status: 500 })), http.get('*/api/finanziario/sana', () => HttpResponse.json({ ok: true })));
    await Promise.all([1, 2, 3].map(() => customInstance({ url: '/api/finanziario/rotta', method: 'GET' }).catch(() => undefined)));
    expect(await customInstance<{ ok: boolean }>({ url: '/api/finanziario/sana', method: 'GET' })).toEqual({ ok: true });
  });
});

describe('nuovi tentativi: solo i transitori, con Retry-After', () => {
  it('si riprova CAPACITA_ESAURITA e la rete assente; non TEMPO_SCADUTO ne i 4xx', () => {
    expect(soloTransitori(0, erroreHttp(503, { type: tipo('capacita-esaurita') }))).toBe(true);
    expect(soloTransitori(0, new AxiosError('Network Error', 'ERR_NETWORK'))).toBe(true);
    expect(soloTransitori(0, erroreHttp(503, { type: tipo('tempo-scaduto') }))).toBe(false);
    expect(soloTransitori(0, erroreHttp(403, { type: tipo('accesso-negato') }))).toBe(false);
    expect(soloTransitori(3, erroreHttp(503, { type: tipo('capacita-esaurita') }))).toBe(false);
  });
  it('attesa dai secondi di Retry-After, altrimenti progressiva', () => {
    expect(attesaPrimaDiRiprovare(0, erroreHttp(503, {}, { 'retry-after': '5' }))).toBe(5000);
    expect(attesaPrimaDiRiprovare(0, erroreHttp(503))).toBe(1000);
    expect(attesaPrimaDiRiprovare(5, erroreHttp(503))).toBe(8000);
  });
  it('la riserva assente si riconosce dal problem-type NOT_FOUND, non da qualunque 404', () => {
    expect(rispostaRiservaAssente(erroreHttp(404, { type: tipo('not-found') }))).toBe(true);
    expect(rispostaRiservaAssente(erroreHttp(404))).toBe(false);
  });
});
