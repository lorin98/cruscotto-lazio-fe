import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { delay, http, HttpResponse } from 'msw';
import { AxiosError, isCancel } from 'axios';
import { server } from '../src/shared/api/mock/server';
import {
  AXIOS_INSTANCE,
  GUARDIA_LETTURA_MS,
  LETTURE_IN_PARALLELO,
  NOME_LOCK_LETTURE,
  authEvents,
  azzeraCodeLetture,
  configuraTettiLetture,
  customInstance,
} from '../src/shared/api/mutator/bff-mutator';
import { classifyProblem, PROBLEM_TYPES } from '../src/shared/api/problem/problem-types';
import { getErrorMessage } from '../src/shared/lib';
import { TETTI_LETTURE, configuraTettiDellApp } from '../src/app/tetti-letture';

// Path neutro: il contratto BFF non dipende da alcuna slice.
const PATH = '/api/risorsa';

describe('Contratto BFF/CSRF sul mutator', () => {
  it('withCredentials attivo, XSRF cookie/header configurati, nessun bearer di default', () => {
    expect(AXIOS_INSTANCE.defaults.withCredentials).toBe(true);
    expect(AXIOS_INSTANCE.defaults.xsrfCookieName).toBe('XSRF-TOKEN');
    expect(AXIOS_INSTANCE.defaults.xsrfHeaderName).toBe('X-XSRF-TOKEN');
    const auth = (AXIOS_INSTANCE.defaults.headers.common as Record<string, unknown>)['Authorization'];
    expect(auth).toBeUndefined();
  });

  it('401 => onSessionExpired (redirect login), non un errore di dominio', async () => {
    const spy = vi.spyOn(authEvents, 'onSessionExpired').mockImplementation(() => {});
    server.use(http.get(`*${PATH}`, () => new HttpResponse(null, { status: 401 })));
    await expect(AXIOS_INSTANCE.get(PATH)).rejects.toBeTruthy();
    expect(spy).toHaveBeenCalledTimes(1);
    spy.mockRestore();
  });

  it('419 => onSessionExpired', async () => {
    const spy = vi.spyOn(authEvents, 'onSessionExpired').mockImplementation(() => {});
    server.use(http.get(`*${PATH}`, () => new HttpResponse(null, { status: 419 })));
    await expect(AXIOS_INSTANCE.get(PATH)).rejects.toBeTruthy();
    expect(spy).toHaveBeenCalledTimes(1);
    spy.mockRestore();
  });
});

describe('Problem-type end-to-end sul flusso axios reale', () => {
  async function callAndClassify(status: number, type?: string) {
    server.use(http.get(`*${PATH}`, () => HttpResponse.json(type ? { type } : {}, { status })));
    try {
      await AXIOS_INSTANCE.get(PATH);
      throw new Error('la richiesta doveva fallire');
    } catch (e) {
      const err = e as AxiosError;
      return classifyProblem(err.response?.status ?? 0, err.response?.data);
    }
  }

  it('403 accesso-negato => access-denied', async () => {
    expect((await callAndClassify(403, PROBLEM_TYPES.ACCESSO_NEGATO)).kind).toBe('access-denied');
  });
  it('412 precondizione-fallita => precondition-failed', async () => {
    expect((await callAndClassify(412, PROBLEM_TYPES.PRECONDIZIONE_FALLITA)).kind).toBe('precondition-failed');
  });
  it('409 stato-non-modificabile => state-not-modifiable', async () => {
    expect((await callAndClassify(409, PROBLEM_TYPES.STATO_NON_MODIFICABILE)).kind).toBe(
      'state-not-modifiable',
    );
  });
  it('409 versione-superata => version-conflict', async () => {
    expect((await callAndClassify(409, PROBLEM_TYPES.VERSIONE_SUPERATA)).kind).toBe(
      'version-conflict',
    );
  });
  it('409 risorsa-occupata => resource-locked', async () => {
    expect((await callAndClassify(409, PROBLEM_TYPES.RISORSA_OCCUPATA)).kind).toBe('resource-locked');
  });
  it('501 => not-portable per STATUS (nessun problem-type URI dedicato)', async () => {
    expect((await callAndClassify(501)).kind).toBe('not-portable');
  });
});

// I tetti li configura l'app all'avvio (app/tetti-letture.ts, review H-21): qui come in main.tsx.
describe('coda delle letture: tetto per prefisso del percorso (review step9 H-21)', () => {
  beforeEach(() => configuraTettiDellApp());
  afterEach(() => azzeraCodeLetture());

  // risposta lenta che misura quante richieste al percorso sono in corso insieme
  function misuraParallelo(percorso: string, metodo: 'get' | 'post' = 'get') {
    const misura = { inCorso: 0, massimo: 0 };
    server.use(
      http[metodo](`*${percorso}`, async () => {
        misura.inCorso++;
        misura.massimo = Math.max(misura.massimo, misura.inCorso);
        await delay(20);
        misura.inCorso--;
        return HttpResponse.json({ ok: true });
      }),
    );
    return misura;
  }
  const insieme = (url: string, method = 'GET', n = 5) =>
    Promise.all(Array.from({ length: n }, () => customInstance<{ ok: boolean }>({ url, method })));

  it(`con i tetti dell'app solo il finanziario ha un tetto: al piu' ${LETTURE_IN_PARALLELO} GET insieme, le altre in coda`, async () => {
    expect(TETTI_LETTURE).toEqual({ '/api/finanziario/': 2 });
    const misura = misuraParallelo('/api/finanziario/lenta');
    expect((await insieme('/api/finanziario/lenta')).every((e) => e.ok)).toBe(true);
    expect(misura.massimo).toBe(LETTURE_IN_PARALLELO);
  });

  it("il mutator condiviso non ha tetti predefiniti: senza la configurazione dell'app nessuna GET aspetta", async () => {
    azzeraCodeLetture();
    const misura = misuraParallelo('/api/finanziario/lenta');
    await insieme('/api/finanziario/lenta');
    expect(misura.massimo).toBe(5);
  });

  it('le GET fuori dai prefissi con un tetto e le scritture non vanno in coda', async () => {
    const altraArea = misuraParallelo('/api/altra-area/lenta');
    const scrittura = misuraParallelo('/api/finanziario/scrittura', 'post');
    await Promise.all([insieme('/api/altra-area/lenta'), insieme('/api/finanziario/scrittura', 'POST')]);
    expect(altraArea.massimo).toBe(5);
    expect(scrittura.massimo).toBe(5);
  });

  it('tetti configurabili: una coda per prefisso, vale il prefisso piu lungo', async () => {
    configuraTettiLetture({ '/api/area/': 3, '/api/area/pesante/': 1 });
    const pesante = misuraParallelo('/api/area/pesante/report');
    const leggera = misuraParallelo('/api/area/leggera');
    const finanziario = misuraParallelo('/api/finanziario/lenta');
    await Promise.all([insieme('/api/area/pesante/report'), insieme('/api/area/leggera'), insieme('/api/finanziario/lenta')]);
    expect(pesante.massimo).toBe(1);
    expect(leggera.massimo).toBe(3);
    // il finanziario non e' piu' fra i tetti configurati
    expect(finanziario.massimo).toBe(5);
  });


  it('un errore libera comunque il posto', async () => {
    server.use(
      http.get('*/api/finanziario/rotta', () => new HttpResponse(null, { status: 500 })),
      http.get('*/api/finanziario/sana', () => HttpResponse.json({ ok: true })),
    );
    await Promise.all([1, 2, 3].map(() => customInstance({ url: '/api/finanziario/rotta', method: 'GET' }).catch(() => undefined)));
    expect(await customInstance<{ ok: boolean }>({ url: '/api/finanziario/sana', method: 'GET' })).toEqual({ ok: true });
  });
});

describe("coda delle letture: tetto dell'utente, non della scheda (review X-02)", () => {
  beforeEach(() => configuraTettiDellApp());
  afterEach(() => {
    vi.useRealTimers();
    Reflect.deleteProperty(navigator, 'locks');
    azzeraCodeLetture();
  });

  const URL = '/api/finanziario/lenta';
  // risposta lenta (o appesa) che conta le richieste arrivate e quelle in corso insieme sul backend
  function backend(attesaMs: number | 'infinite' = 50) {
    const stato = { arrivate: 0, inCorso: 0, massimo: 0, servite: 0 };
    server.use(
      http.get(`*${URL}`, async () => {
        stato.arrivate++;
        stato.inCorso++;
        stato.massimo = Math.max(stato.massimo, stato.inCorso);
        await delay(attesaMs);
        stato.inCorso--;
        stato.servite++;
        return HttpResponse.json({ ok: true });
      }),
    );
    return stato;
  }
  const leggi = (signal?: AbortSignal) => customInstance<{ ok: boolean }>({ url: URL, method: 'GET', signal });
  const finche = (condizione: () => boolean) => vi.waitFor(() => expect(condizione()).toBe(true), { timeout: 2000, interval: 5 });

  it("una lettura annullata risponde subito a chi l'ha chiesta ma tiene il posto finche' il backend non risponde", async () => {
    const stato = backend(50);
    const annullamento = new AbortController();
    const annullate = [leggi(annullamento.signal), leggi(annullamento.signal)];
    await finche(() => stato.arrivate === 2);
    annullamento.abort();
    for (const a of annullate) expect(isCancel(await a.catch((e: unknown) => e))).toBe(true);
    // l'annullamento e' arrivato prima delle risposte: il backend sta ancora lavorando le due letture
    expect(stato.inCorso).toBe(2);
    expect(await leggi()).toEqual({ ok: true });
    // la terza e' partita solo dopo le risposte delle due annullate
    expect(stato.massimo).toBe(LETTURE_IN_PARALLELO);
  });

  it('annullata mentre aspetta il posto, esce dalla coda senza partire', async () => {
    const stato = backend(30);
    const annullamento = new AbortController();
    const prime = [leggi(), leggi()];
    const inCoda = leggi(annullamento.signal);
    annullamento.abort();
    expect(isCancel(await inCoda.catch((e: unknown) => e))).toBe(true);
    await Promise.all(prime);
    expect(stato.arrivate).toBe(2);
  });

  // la consegna delle risposte MSW non passa dai timer finti: si lascia girare il ciclo degli eventi
  const giri = async (n = 20) => {
    for (let i = 0; i < n; i++) await new Promise<void>((r) => setImmediate(r));
  };
  // seconda lettura, servita subito, che segna quando arriva la risposta
  function letturaSana() {
    server.use(http.get('*/api/finanziario/sana', () => HttpResponse.json({ ok: true })));
    const esito = { servita: false };
    const risposta = customInstance<{ ok: boolean }>({ url: '/api/finanziario/sana', method: 'GET' }).then((r) => {
      esito.servita = true;
      return r;
    });
    return { esito, risposta };
  }

  it("una lettura annullata e senza risposta libera il posto alla guardia, contata dall'invio", async () => {
    configuraTettiLetture({ '/api/finanziario/': 1 });
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    const appesa = backend('infinite');
    const annullamento = new AbortController();
    const annullata = leggi(annullamento.signal);
    await giri();
    expect(appesa.arrivate).toBe(1);
    annullamento.abort();
    expect(isCancel(await annullata.catch((e: unknown) => e))).toBe(true);
    const dopo = letturaSana();
    await giri();
    expect(dopo.esito.servita).toBe(false);
    vi.advanceTimersByTime(GUARDIA_LETTURA_MS);
    vi.useRealTimers();
    expect(await dopo.risposta).toEqual({ ok: true });
  });

  // LockManager finto, come quello condiviso fra le schede: lock esclusivi con nome, serviti in ordine di richiesta;
  // con ifAvailable un lock tenuto da altri non si aspetta, il lavoro riceve null
  function installaLocksFinti() {
    const tenuti = new Set<string>();
    const attese = new Map<string, (() => void)[]>();
    const request = (nome: string, opzioni: LockOptions, lavoro: (lock: Lock | null) => unknown) =>
      new Promise((ok, ko) => {
        const esegui = () => {
          tenuti.add(nome);
          void Promise.resolve(lavoro({ name: nome, mode: 'exclusive' })).then((v) => {
            tenuti.delete(nome);
            attese.get(nome)?.shift()?.();
            ok(v);
          }, ko);
        };
        if (!tenuti.has(nome)) return esegui();
        if (opzioni.ifAvailable) return void Promise.resolve(lavoro(null)).then(ok, ko);
        attese.set(nome, [...(attese.get(nome) ?? []), esegui]);
        opzioni.signal?.addEventListener('abort', () => {
          attese.set(nome, (attese.get(nome) ?? []).filter((f) => f !== esegui));
          ko(new DOMException('annullata', 'AbortError'));
        });
      });
    Object.defineProperty(navigator, 'locks', { value: { request }, configurable: true });
    return { request, tenuti };
  }

  it("con le Web Locks il tetto vale fra le schede: il posto tenuto da un'altra scheda qui non si usa", async () => {
    const locks = installaLocksFinti();
    // l'altra scheda tiene il posto 0 del finanziario
    let rilasciaAltraScheda = () => {};
    void locks.request(`${NOME_LOCK_LETTURE}:/api/finanziario/:0`, {}, () => new Promise<void>((r) => (rilasciaAltraScheda = r)));
    const stato = backend(10);
    const letture = Promise.all([leggi(), leggi(), leggi(), leggi()]);
    await finche(() => stato.servite >= 2);
    // una lettura alla volta, sul solo posto 1
    expect(stato.massimo).toBe(1);
    rilasciaAltraScheda();
    expect((await letture).every((r) => r.ok)).toBe(true);
    expect(stato.servite).toBe(4);
    expect(stato.massimo).toBeLessThanOrEqual(LETTURE_IN_PARALLELO);
    // finite le letture, i lock di questa scheda sono liberi
    expect(locks.tenuti.size).toBe(0);
  });

  it("posto 0 tenuto da un'altra scheda e una sola lettura qui: parte subito, sul primo lock libero (N-11)", async () => {
    const locks = installaLocksFinti();
    const altraScheda = `${NOME_LOCK_LETTURE}:/api/finanziario/:0`;
    void locks.request(altraScheda, {}, () => new Promise<void>(() => {}));
    const stato = backend(30);
    const lettura = leggi();
    await finche(() => stato.arrivate === 1);
    // la lettura tiene il posto 1, l'altra scheda il suo
    expect([...locks.tenuti].sort()).toEqual([altraScheda, `${NOME_LOCK_LETTURE}:/api/finanziario/:1`]);
    expect(await lettura).toEqual({ ok: true });
    expect([...locks.tenuti]).toEqual([altraScheda]);
  });

  it('una lettura senza risposta libera posto e lock alla guardia e finisce con un timeout di rete (N-13)', async () => {
    configuraTettiLetture({ '/api/finanziario/': 1 });
    const locks = installaLocksFinti();
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    const appesa = backend('infinite');
    const senzaRisposta = leggi().catch((e: unknown) => e);
    await giri();
    expect(appesa.arrivate).toBe(1);
    expect(locks.tenuti.size).toBe(1);
    const dopo = letturaSana();
    await giri();
    expect(dopo.esito.servita).toBe(false);
    vi.advanceTimersByTime(GUARDIA_LETTURA_MS - 1);
    await giri();
    expect(dopo.esito.servita).toBe(false);
    vi.advanceTimersByTime(1);
    vi.useRealTimers();
    // errore classificabile: AxiosError di rete senza risposta, non un annullamento
    const errore = await senzaRisposta;
    expect(errore).toBeInstanceOf(AxiosError);
    expect((errore as AxiosError).code).toBe(AxiosError.ETIMEDOUT);
    expect(isCancel(errore)).toBe(false);
    expect(getErrorMessage(errore)).toMatch(/server non risponde/);
    expect(await dopo.risposta).toEqual({ ok: true });
    expect(locks.tenuti.size).toBe(0);
  });
});
