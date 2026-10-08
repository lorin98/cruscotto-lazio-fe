// setup.ts — bootstrap dei test. MSW node + faker seed costante (D-F4-9: mock deterministici).
import { afterAll, afterEach, beforeAll } from 'vitest';
import { faker } from '@faker-js/faker';
import { server } from '../api/mock/server';
import { resetActiveAuthFixture } from '../api/mock/handlers';

faker.seed(20260804);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  resetActiveAuthFixture();
});
afterAll(() => server.close());
