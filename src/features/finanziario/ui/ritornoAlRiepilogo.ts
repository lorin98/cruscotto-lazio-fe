// ritornoAlRiepilogo — ricerca, ordine e pagina della tabella del riepilogo da ritrovare tornando dal
// dettaglio di un intervento con i link della pagina ("Torna al riepilogo" e la briciola), non solo con l'Indietro del
// browser (review v4 X-04, iter3 X-01). Aprendo il dettaglio dal riepilogo il suo stato (le voci dello state della history
// di useStatoNellaHistory) viaggia nello state della navigazione; i link di ritorno lo riportano al riepilogo, che lo
// ritrova se i filtri sono gli stessi (N-01).
import { useLocation } from 'react-router';

/** Chiave dello stato della tabella del riepilogo nello state della history. */
export const STATO_RIEPILOGO = 'riepilogo';
// la vista Tabella o Grafico non c'e' piu' dal 04/11/2026: tabella e grafico stanno entrambi nella pagina
const CHIAVI = [STATO_RIEPILOGO];

/** Lo state di navigazione con il solo stato della tabella del riepilogo, se c'e'. */
export function statoDelRiepilogo(state: unknown): Record<string, unknown> | undefined {
  if (typeof state !== 'object' || state === null) return undefined;
  const s = state as Record<string, unknown>;
  const presenti = CHIAVI.filter((k) => k in s);
  return presenti.length === 0 ? undefined : Object.fromEntries(presenti.map((k) => [k, s[k]]));
}

/** Lo stato del riepilogo nella voce di history corrente, da passare ai link verso il dettaglio o di ritorno. */
export function useStatoDelRiepilogo(): Record<string, unknown> | undefined {
  return statoDelRiepilogo(useLocation().state);
}
