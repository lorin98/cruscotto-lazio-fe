// ritornoAlRiepilogo — ricerca, ordine, pagina e vista (Tabella o Grafico) del riepilogo da ritrovare tornando dal
// dettaglio di un intervento con i link della pagina ("Torna al riepilogo" e la briciola), non solo con l'Indietro del
// browser (review v4 X-04, iter3 X-01). Aprendo il dettaglio dal riepilogo il suo stato (le voci dello state della history
// di useStatoNellaHistory) viaggia nello state della navigazione; i link di ritorno lo riportano al riepilogo, che lo
// ritrova se i filtri sono gli stessi (N-01).
import { useLocation } from 'react-router';

/** Chiave dello stato della tabella del riepilogo nello state della history. */
export const STATO_RIEPILOGO = 'riepilogo';
/** Chiave della vista del riepilogo (Tabella o Grafico) nello state della history. */
export const VISTA_RIEPILOGO = 'vistaRiepilogo';
const CHIAVI = [STATO_RIEPILOGO, VISTA_RIEPILOGO];

export type VistaRiepilogo = 'tabella' | 'grafico';
export const eVistaRiepilogo = (v: unknown): v is VistaRiepilogo => v === 'tabella' || v === 'grafico';

/** Lo state di navigazione con il solo stato del riepilogo (tabella e vista), se c'e'. */
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
