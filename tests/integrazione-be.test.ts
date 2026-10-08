import { describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import type { AxiosError } from 'axios';
import { server } from '../src/shared/api/mock/server';
import { AXIOS_INSTANCE } from '../src/shared/api/mutator/bff-mutator';
import { classifyProblem } from '../src/shared/api/problem/problem-types';

// Allineamenti del runtime al backend ARSCSR (README, OP-FE-02): verificati contro il backend vero l'08/10/2026.
const PATH = '/api/risorsa';

describe('Runtime allineato al backend ARSCSR', () => {
  it('manda X-Requested-With (RegolaOrigine di export e scritture)', async () => {
    let header: string | null = null;
    server.use(
      http.get(`*${PATH}`, ({ request }) => {
        header = request.headers.get('X-Requested-With');
        return HttpResponse.json({});
      }),
    );
    await AXIOS_INSTANCE.get(PATH);
    expect(header).toBe('XMLHttpRequest');
  });

  it('serializza i filtri ripetibili come parametri ripetuti, senza parentesi quadre', async () => {
    let query = '';
    server.use(
      http.get(`*${PATH}`, ({ request }) => {
        query = new URL(request.url).search;
        return HttpResponse.json({});
      }),
    );
    await AXIOS_INSTANCE.get(PATH, { params: { intervento: ['SRA01', 'SRA03'], os: ['SO1'] } });
    expect(query).toBe('?intervento=SRA01&intervento=SRA03&os=SO1');
  });

  it('riconosce il 403 ACCESSO_NEGATO nel formato del backend', async () => {
    server.use(
      http.get(`*${PATH}`, () =>
        HttpResponse.json(
          { type: 'urn:cruscottocsr:problem:accesso-negato', title: 'Forbidden', status: 403, errorCode: 'ACCESSO_NEGATO' },
          { status: 403 },
        ),
      ),
    );
    const err = (await AXIOS_INSTANCE.get(PATH).catch((e: unknown) => e)) as AxiosError;
    expect(classifyProblem(err.response?.status ?? 0, err.response?.data).kind).toBe('access-denied');
  });

  it('la RICHIESTA_NON_AMMESSA (403 della RegolaOrigine) non e un accesso negato per ruolo', async () => {
    server.use(
      http.get(`*${PATH}`, () =>
        HttpResponse.json(
          { type: 'urn:cruscottocsr:problem:richiesta-non-ammessa', title: 'Forbidden', status: 403, errorCode: 'RICHIESTA_NON_AMMESSA' },
          { status: 403 },
        ),
      ),
    );
    const err = (await AXIOS_INSTANCE.get(PATH).catch((e: unknown) => e)) as AxiosError;
    expect(classifyProblem(err.response?.status ?? 0, err.response?.data).kind).toBe('request-not-allowed');
  });
});
