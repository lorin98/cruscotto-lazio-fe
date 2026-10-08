import { describe, expect, it, vi } from 'vitest';
import { handleMutationError } from '../src/app/query-client';
import { PROBLEM_TYPES } from '../src/shared/api/problem/problem-types';

// Errore axios sintetico: isAxiosError() di axios riconosce un oggetto con isAxiosError===true.
function axiosErr(status: number, type?: string): unknown {
  return { isAxiosError: true, response: { status, data: type ? { type } : {} } };
}

describe('query-client — MutationCache boundary (rete di sicurezza mutation)', () => {
  it('intercetta SOLO access-denied (asse-dato/riga) come rete di sicurezza globale', () => {
    const spy = vi.fn();
    handleMutationError(axiosErr(403, PROBLEM_TYPES.ACCESSO_NEGATO), spy);
    expect(spy).toHaveBeenCalledTimes(1);
  });
  it('lascia INLINE gli altri errori (409 versione, 501, errore non-axios)', () => {
    const spy = vi.fn();
    handleMutationError(axiosErr(409, PROBLEM_TYPES.VERSIONE_SUPERATA), spy);
    handleMutationError(axiosErr(501), spy);
    handleMutationError(new Error('non-axios'), spy);
    expect(spy).not.toHaveBeenCalled();
  });
});
