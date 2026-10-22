import { describe, expect, it } from 'vitest';
import { AxiosError } from 'axios';
import { eProblema } from '../src/shared/api/problem/e-problema';
import {
  classifyProblem,
  PROBLEM_TYPES,
  type ProblemDetail,
} from '../src/shared/api/problem/problem-types';

function pd(type: string): ProblemDetail {
  return { type, title: 't', status: 0 };
}

describe('classifyProblem — discrimina sul problem-type URI, non sul solo status', () => {
  it('401 => session-expired (login), senza problem-type di dominio', () => {
    expect(classifyProblem(401).kind).toBe('session-expired');
  });
  it('419 => session-expired', () => {
    expect(classifyProblem(419).kind).toBe('session-expired');
  });
  it('403 accesso-negato => access-denied (ruolo/ownership/livello, stesso URI)', () => {
    expect(classifyProblem(403, pd(PROBLEM_TYPES.ACCESSO_NEGATO)).kind).toBe('access-denied');
  });
  it('412 precondizione-fallita => precondition-failed (optimistic lock, prima voce DomainErrorMapping)', () => {
    expect(classifyProblem(412, pd(PROBLEM_TYPES.PRECONDIZIONE_FALLITA)).kind).toBe('precondition-failed');
  });
  it('409 versione-superata => version-conflict', () => {
    expect(classifyProblem(409, pd(PROBLEM_TYPES.VERSIONE_SUPERATA)).kind).toBe('version-conflict');
  });
  it('409 risorsa-occupata => resource-locked', () => {
    expect(classifyProblem(409, pd(PROBLEM_TYPES.RISORSA_OCCUPATA)).kind).toBe('resource-locked');
  });
  it('409 stato-non-modificabile => state-not-modifiable (nuovo, stato-dato)', () => {
    expect(classifyProblem(409, pd(PROBLEM_TYPES.STATO_NON_MODIFICABILE)).kind).toBe(
      'state-not-modifiable',
    );
  });
  it('501 => not-portable per STATUS, senza URI dedicato (green-be non lo emette)', () => {
    expect(classifyProblem(501).kind).toBe('not-portable');
    expect(classifyProblem(501, pd('urn:problema:qualsiasi')).kind).toBe('not-portable');
  });
  it('409 senza problem-type riconosciuto => unknown (mai un default permissivo)', () => {
    expect(classifyProblem(409, pd('urn:problema:sconosciuto')).kind).toBe('unknown');
  });
  it('403 senza body problem => unknown (non deduce dal solo codice)', () => {
    expect(classifyProblem(403).kind).toBe('unknown');
  });
});

describe('eProblema: il riconoscimento comune dei wrapper api/ delle feature (review del fisico H8)', () => {
  const risposta = (status: number, data?: unknown) => Object.assign(new AxiosError('errore'), { response: { status, data, statusText: '', headers: {}, config: {} } });

  it('vero solo per una risposta HTTP col problem-type di quel tipo, mai dal solo status', () => {
    expect(eProblema(risposta(404, pd(PROBLEM_TYPES.NON_TROVATO)), 'not-found')).toBe(true);
    expect(eProblema(risposta(404, pd(PROBLEM_TYPES.NON_TROVATO)), 'invalid-data')).toBe(false);
    expect(eProblema(risposta(400, pd(PROBLEM_TYPES.DATO_NON_VALIDO)), 'invalid-data')).toBe(true);
    expect(eProblema(risposta(404), 'not-found')).toBe(false);
    expect(eProblema(new Error('non HTTP'), 'not-found')).toBe(false);
    expect(eProblema(undefined, 'not-found')).toBe(false);
  });
});
