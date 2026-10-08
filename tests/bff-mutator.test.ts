import { describe, expect, it, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import type { AxiosError } from 'axios';
import { server } from '../src/shared/api/mock/server';
import { AXIOS_INSTANCE, authEvents } from '../src/shared/api/mutator/bff-mutator';
import { classifyProblem, PROBLEM_TYPES } from '../src/shared/api/problem/problem-types';

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
