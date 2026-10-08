// browser.ts — MSW per lo sviluppo (worker). Il file del worker sta in public-dev/ (vite.config.ts: solo dev server).
import { setupWorker } from 'msw/browser';
import { handlersEsempio } from './esempio-finanziario';
import { handlers } from './handlers';

// i dati di esempio del finanziario hanno la precedenza sui mock generati (casuali): MSW usa il primo handler che risponde
export const worker = setupWorker(...handlersEsempio, ...handlers);
