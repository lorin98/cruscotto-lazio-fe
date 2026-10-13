import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '../../../shared/api/mock/server';
import { expectNoA11yViolations } from '../../../shared/testing/axe';
import { renderPagina } from '../../../shared/testing/render-pagina';
import { PAGINA_DOMANDE, SINOTTICO, VALORI } from '../../../features/elenco-operativo/testing/fixture';
import Pagina from './page';

describe('pagina /elenco-operativo/domande (TX-0056, TX-0057, TX-0060)', () => {
  it("compone l'interrogazione delle domande dal barrel: h1, sinottico, tabella", async () => {
    server.use(
      http.get('*/api/elenco-operativo/filtri', () => HttpResponse.json(VALORI)),
      http.get('*/api/elenco-operativo/domande/sinottico', () => HttpResponse.json(SINOTTICO)),
      http.get('*/api/elenco-operativo/domande', () => HttpResponse.json(PAGINA_DOMANDE)),
    );
    const { container } = renderPagina(Pagina, '/elenco-operativo/domande');
    expect(await screen.findByRole('heading', { level: 1, name: 'Elenco operativo delle domande' })).toBeTruthy();
    expect(await screen.findByRole('table', { name: /Elenco operativo delle domande/ })).toBeTruthy();
    await expectNoA11yViolations(container);
  });
});
