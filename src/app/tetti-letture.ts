// tetti-letture.ts — tetti delle letture in parallelo per area (review step9 H-21). Il mutator condiviso
// (shared/api/mutator) non ne ha di predefiniti: li sceglie l'app, che conosce le aree, e li configura all'avvio
// (main.tsx). Il backend ammette al piu' LETTURE_IN_PARALLELO letture in corso per utente, contate INSIEME per i report
// del finanziario e per l'elenco operativo (LettureLimitate e' un solo tetto per utente: review v1 V-04): le due aree
// stanno nella stessa coda. Un'area nuova con un tetto suo si aggiunge qui.
import { LETTURE_IN_PARALLELO, configuraTettiLetture } from '../shared/api/mutator/bff-mutator';
import type { TettoLetture } from '../shared/api/mutator/bff-mutator';

export const TETTI_LETTURE: Readonly<Record<string, TettoLetture>> = {
  'letture-limitate': { tetto: LETTURE_IN_PARALLELO, prefissi: ['/api/finanziario/', '/api/elenco-operativo/'] },
};

export function configuraTettiDellApp(): void {
  configuraTettiLetture(TETTI_LETTURE);
}
