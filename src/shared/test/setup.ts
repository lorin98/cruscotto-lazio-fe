// setup.ts — bootstrap dei test. MSW node + faker seed costante (D-F4-9: mock deterministici).
import { afterAll, afterEach, beforeAll, vi } from 'vitest';
import { faker } from '@faker-js/faker';
import { server } from '../api/mock/server';
import { resetActiveAuthFixture } from '../api/mock/handlers';
import { azzeraGraficiFinti, creaGraficoFinto } from '../testing/grafico-finto';

// jsdom non disegna: ECharts e' sostituito da un grafico finto che registra opzioni e clic (UI v2, ADR 0027).
vi.mock('../ui/grafici/echarts', async (originale) => ({
  ...(await originale<typeof import('../ui/grafici/echarts')>()),
  creaGrafico: (el: HTMLElement) => creaGraficoFinto(el),
}));

faker.seed(20260804);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  resetActiveAuthFixture();
  azzeraGraficiFinti();
});
afterAll(() => server.close());
