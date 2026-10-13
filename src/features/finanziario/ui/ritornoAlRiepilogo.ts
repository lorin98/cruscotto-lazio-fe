// ritornoAlRiepilogo — ricerca, ordine e pagina del riepilogo da ritrovare tornando dal dettaglio di un intervento con i
// link della pagina ("Torna al riepilogo" e la briciola), non solo con l'Indietro del browser (review v4 X-04). Aprendo il
// dettaglio dal riepilogo il suo stato (la voce dello state della history di useStatoNellaHistory) viaggia nello state
// della navigazione; i link di ritorno lo riportano al riepilogo, che lo ritrova se i filtri sono gli stessi (N-01).
import { useLocation } from 'react-router';

/** Chiave dello stato del riepilogo nello state della history. */
export const STATO_RIEPILOGO = 'riepilogo';

/** Lo state di navigazione con il solo stato del riepilogo, se c'e'. */
export function statoDelRiepilogo(state: unknown): Record<string, unknown> | undefined {
  if (typeof state !== 'object' || state === null || !(STATO_RIEPILOGO in state)) return undefined;
  return { [STATO_RIEPILOGO]: (state as Record<string, unknown>)[STATO_RIEPILOGO] };
}

/** Lo stato del riepilogo nella voce di history corrente, da passare ai link verso il dettaglio o di ritorno. */
export function useStatoDelRiepilogo(): Record<string, unknown> | undefined {
  return statoDelRiepilogo(useLocation().state);
}
