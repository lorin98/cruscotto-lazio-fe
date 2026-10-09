// browser.ts — MSW per lo sviluppo (worker). Il file del worker sta in public-dev/ (vite.config.ts: solo dev server).
// I dati d'esempio sono delle feature (features/<slice>/api/mock/esempio.ts, export handlersEsempio; review v2 H-20): il
// worker li raccoglie per convenzione di percorso, cosi' shared non importa nessuna feature.
import { setupWorker } from 'msw/browser';
import type { RequestHandler } from 'msw';
import { handlers } from './handlers';

const esempi = import.meta.glob<RequestHandler[]>('../../../features/*/api/mock/esempio.ts', { eager: true, import: 'handlersEsempio' });

// i dati di esempio delle feature hanno la precedenza sui mock generati (casuali): MSW usa il primo handler che risponde
export const worker = setupWorker(...Object.values(esempi).flat(), ...handlers);
