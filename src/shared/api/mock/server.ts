// server.ts — MSW per i test (node). Stessi handler del worker dev.
import { setupServer } from 'msw/node';
import { handlers } from './handlers';

export const server = setupServer(...handlers);
