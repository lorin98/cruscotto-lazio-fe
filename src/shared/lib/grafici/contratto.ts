// contratto.ts — forma unica di cio' che un builder di grafico restituisce al kit (CardGrafico): le opzioni ECharts
// oppure il motivo per cui il grafico non si disegna, la tabella equivalente (il canale accessibile, sempre presente)
// e le voci omesse. Puro: i builder stanno nei lib/ delle feature, il kit li rende.
import type { EChartsOption } from 'echarts';

/** Alternativa testuale del grafico: gli stessi valori, gia' formattati in italiano. */
export interface TabellaEquivalente {
  caption: string;
  /** La prima colonna e' l'intestazione di riga; le altre sono valori (allineati a destra). */
  colonne: string[];
  righe: string[][];
}

export interface DatiGrafico {
  /** null = grafico non disegnabile (il motivo e' in motivoAssenza). */
  opzioni: EChartsOption | null;
  /** Presente quando opzioni e' null: segue "Grafico non disponibile: ", quindi iniziale minuscola salvo sigle e codici. */
  motivoAssenza?: string;
  /** Sempre presente, anche quando il grafico non si disegna (con i valori che ci sono). */
  tabella: TabellaEquivalente;
  /** Voci omesse dal grafico, leggibili: es. "SRA03: dotazione non disponibile (fonte impegni non attiva)". */
  omessi: string[];
}

export function nonDisegnabile(motivoAssenza: string, tabella: TabellaEquivalente, omessi: string[]): DatiGrafico {
  return { opzioni: null, motivoAssenza, tabella, omessi };
}
