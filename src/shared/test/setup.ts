// setup.ts — bootstrap dei test. MSW node + faker seed costante (D-F4-9: mock deterministici).
import { afterAll, afterEach, beforeAll, vi } from 'vitest';
import { faker } from '@faker-js/faker';
import { server } from '../api/mock/server';
import { resetActiveAuthFixture } from '../api/mock/handlers';
import { azzeraGraficiFinti, creaGraficoFinto } from '../testing/grafico-finto';

// jsdom non disegna: ECharts e' sostituito da un grafico finto che registra opzioni e clic (UI v2, ADR 0027); l'immagine
// PNG e' un PNG minimo (jsdom non ha canvas).
vi.mock('../ui/grafici/echarts', async (originale) => ({
  ...(await originale<typeof import('../ui/grafici/echarts')>()),
  creaGrafico: (el: HTMLElement) => creaGraficoFinto(el),
  pngDelGrafico: () => 'data:image/png;base64,iVBORw0KGgo=',
}));

faker.seed(20260804);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  resetActiveAuthFixture();
  azzeraGraficiFinti();
});
afterAll(() => server.close());
