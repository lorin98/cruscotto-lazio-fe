// msw.ts — risposte MSW dei test nella forma del contratto del backend ARSCSR.
import { http, HttpResponse } from 'msw';
import type { JsonBodyType } from 'msw';

/** GET che risponde con un corpo JSON (il path e' relativo al base path: match con suffisso). */
export const rispondi = (path: string, corpo: JsonBodyType, status = 200) => http.get(`*${path}`, () => HttpResponse.json(corpo, { status }));

/** Corpo problem+json del backend: type urn:cruscottocsr:problem:<codice in minuscolo con i trattini>. */
export function problema(status: number, errorCode: string, detail?: string) {
  return {
    type: `urn:cruscottocsr:problem:${errorCode.toLowerCase().replaceAll('_', '-')}`,
    title: 'Errore',
    status,
    errorCode,
    ...(detail ? { detail } : {}),
  };
}
