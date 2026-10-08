// browser.ts — MSW per lo sviluppo (worker). Il file del worker sta in public-dev/ (vite.config.ts: solo dev server).
import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';

export const worker = setupWorker(...handlers);
