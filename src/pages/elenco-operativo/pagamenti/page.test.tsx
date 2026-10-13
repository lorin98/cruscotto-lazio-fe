import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '../../../shared/api/mock/server';
import { renderPagina } from '../../../shared/testing/render-pagina';
import { PAGINA_PAGAMENTI, VALORI } from '../../../features/elenco-operativo/testing/fixture';
import Pagina from './page';

describe('RA002: pagina /elenco-operativo/pagamenti (TX-0059, TX-0060)', () => {
  it("compone l'interrogazione dei pagamenti dal barrel", async () => {
    server.use(
      http.get('*/api/elenco-operativo/filtri', () => HttpResponse.json(VALORI)),
      http.get('*/api/elenco-operativo/pagamenti', () => HttpResponse.json(PAGINA_PAGAMENTI)),
    );
    renderPagina(Pagina, '/elenco-operativo/pagamenti');
    expect(await screen.findByRole('heading', { level: 1, name: 'Elenco operativo dei pagamenti' })).toBeTruthy();
    expect(await screen.findByRole('table', { name: /Elenco operativo dei pagamenti/ })).toBeTruthy();
  });
});
