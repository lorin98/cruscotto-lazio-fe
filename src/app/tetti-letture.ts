// tetti-letture.ts — tetti delle letture in parallelo per area (review step9 H-21). Il mutator condiviso
// (shared/api/mutator) non ne ha di predefiniti: li sceglie l'app, che conosce le aree, e li configura all'avvio
// (main.tsx). Oggi ha un tetto solo il finanziario: il backend ammette al piu' LETTURE_IN_PARALLELO letture dei suoi
// report in corso per utente (cruscottocsr.finanziario.letture-per-utente). Un'area nuova con un tetto suo si aggiunge qui.
import { LETTURE_IN_PARALLELO, configuraTettiLetture } from '../shared/api/mutator/bff-mutator';

export const TETTI_LETTURE: Readonly<Record<string, number>> = { '/api/finanziario/': LETTURE_IN_PARALLELO };

export function configuraTettiDellApp(): void {
  configuraTettiLetture(TETTI_LETTURE);
}
