import { describe, expect, it } from 'vitest';
import { screen, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '../../../shared/api/mock/server';
import { expectNoA11yViolations } from '../../../shared/testing/axe';
import { renderPagina } from '../../../shared/testing/render-pagina';
import { PAGINA_DOMANDE, SINOTTICO, VALORI } from '../../../features/elenco-operativo/testing/fixture';
import Pagina from './page';

describe('RA002: pagina /elenco-operativo/domande (TX-0056, TX-0057, TX-0060)', () => {
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

  it('pagate, da pagare e senza importi uno per riga con la loro voce, anche con numeri grandi (wireframe del 02/11/2026)', async () => {
    server.use(
      http.get('*/api/elenco-operativo/filtri', () => HttpResponse.json(VALORI)),
      http.get('*/api/elenco-operativo/domande/sinottico', () =>
        HttpResponse.json({ ...SINOTTICO, pagate: 36846, daPagare: 31595, senzaImporti: 3191 }),
      ),
      http.get('*/api/elenco-operativo/domande', () => HttpResponse.json(PAGINA_DOMANDE)),
    );
    const { container } = renderPagina(Pagina, '/elenco-operativo/domande');
    const tessera = await screen.findByRole('region', { name: 'Pagate / da pagare / senza importi' });
    const righe = within(tessera).getAllByRole('listitem').map((li) => li.textContent);
    expect(righe).toEqual(['36.846 pagate', '31.595 da pagare', '3191 senza importi']);
    expect(tessera.textContent).not.toContain(' / 31.595');
    await expectNoA11yViolations(container);
  });
});
