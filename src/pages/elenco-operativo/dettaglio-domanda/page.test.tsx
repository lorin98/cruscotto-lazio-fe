import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '../../../shared/api/mock/server';
import { renderPagina } from '../../../shared/testing/render-pagina';
import { DETTAGLIO, VALORI } from '../../../features/elenco-operativo/testing/fixture';
import Pagina from './page';

describe('RA004: pagina /elenco-operativo/domande/:tipo/:codiceABarre (TX-0058)', () => {
  it('legge la domanda dei parametri del percorso', async () => {
    let letto = '';
    server.use(
      // la pagina legge anche attoConcessioneDisponibile dai valori dei filtri (TX-0060, review delta 21/10 X2 e passata 2 V1)
      http.get('*/api/elenco-operativo/filtri', () => HttpResponse.json(VALORI)),
      http.get('*/api/elenco-operativo/domande/:tipo/:codice', ({ params }) => {
        letto = `${String(params.tipo)}/${String(params.codice)}`;
        return HttpResponse.json(DETTAGLIO);
      }),
    );
    renderPagina(Pagina, '/elenco-operativo/domande/:tipo/:codiceABarre', '/elenco-operativo/domande/PAGAMENTO/54230000001');
    expect(await screen.findByRole('heading', { level: 1, name: 'COOPERATIVA VERDI' })).toBeTruthy();
    expect(letto).toBe('PAGAMENTO/54230000001');
  });
});
