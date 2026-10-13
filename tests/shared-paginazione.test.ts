import { describe, expect, it } from 'vitest';
import { finestraPagine } from '../src/shared/lib/tabella';

describe('finestra delle pagine della paginazione dal server', () => {
  it('poche pagine: tutte', () => {
    expect(finestraPagine(0, 1)).toEqual([0]);
    expect(finestraPagine(3, 7)).toEqual([0, 1, 2, 3, 4, 5, 6]);
  });
  it('molte pagine: prima, ultima e due per parte attorno alla corrente, con i salti', () => {
    expect(finestraPagine(0, 52)).toEqual([0, 1, 2, null, 51]);
    expect(finestraPagine(25, 52)).toEqual([0, null, 23, 24, 25, 26, 27, null, 51]);
    expect(finestraPagine(51, 52)).toEqual([0, null, 49, 50, 51]);
    expect(finestraPagine(3, 52)).toEqual([0, 1, 2, 3, 4, 5, null, 51]);
  });
});
