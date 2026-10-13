// server.ts — MSW per i test (node). Stessi handler del worker dev, tranne i mock generati dell'elenco operativo: i suoi
// test dichiarano ognuno gli endpoint che usano (review v1 H-16), cosi' una lettura non dichiarata fa fallire il test
// (onUnhandledRequest 'error') invece di ricevere dati inventati. Il worker di sviluppo (browser.ts) li monta tutti.
import { setupServer } from 'msw/node';
import type { RequestHandler } from 'msw';
import { handlers } from './handlers';

const DICHIARATI_DAI_TEST = '/api/elenco-operativo';

function percorsoDi(h: RequestHandler): string {
  const { path } = h.info as { path?: unknown };
  return typeof path === 'string' ? path : '';
}

export const server = setupServer(...handlers.filter((h) => !percorsoDi(h).includes(DICHIARATI_DAI_TEST)));
