// colori.ts — colori del tema per i grafici: gli stessi valori dei token --ui-* di src/shared/ui/tema.css (un test li
// confronta). Unica fonte per il tema ECharts e per i builder delle feature.

/** Colori semantici: il colore non e' mai l'unico canale, ogni grafico ha la tabella equivalente. */
export const COLORI = {
  primario: '#0066cc',
  scuro: '#0b2d4e',
  positivo: '#4e8a1f',
  attenzione: '#b26b00',
  neutro: '#c9d3de',
  superficie: '#ffffff',
  testo: '#17212b',
  attenuato: '#546474',
} as const;

/** Palette delle serie generiche, nell'ordine in cui il tema le assegna. */
export const PALETTE = [COLORI.primario, COLORI.positivo, COLORI.attenzione, '#7a5cb8', '#00838f', '#c0392b', COLORI.scuro, '#8a99a8'];
