// e-problema.ts — riconoscimento PURO di un errore HTTP della SPA dal problem-type del backend (urn:cruscottocsr:problem:*),
// mai dal solo status (regola cardine di problem-types.ts). La stessa espressione stava nei wrapper api/ di finanziario,
// elenco operativo e fisico (review del fisico H8): i wrapper restano col loro nome di dominio e chiamano questa.
import { isAxiosError } from 'axios';
import { classifyProblem } from './problem-types';
import type { ProblemKind } from './problem-types';

/** Vero se l'errore e' una risposta HTTP del backend col problem-type di quel tipo (es. 'not-found', 'invalid-data'). */
export function eProblema(errore: unknown, kind: ProblemKind): boolean {
  return isAxiosError(errore) && classifyProblem(errore.response?.status ?? 0, errore.response?.data).kind === kind;
}
