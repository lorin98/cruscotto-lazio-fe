// barre-impilate.ts — barre orizzontali impilate sulla stessa scala, una per categoria, con i segmenti etichettati (importo
// e quota della barra): Importi SIGC (R13 forma B, sigc.ts) e "Dalla dotazione al residuo" del dettaglio di un intervento
// (note di Leonardo del 10/11/2026, intervento.ts). Spostato qui da sigc.ts nella review step9 dell'11/11/2026 (J-12): una
// sola definizione del costruttore delle opzioni, con le correzioni J-04 (spazio a destra in pixel) e del 05/11/2026 (asse
// con al piu' tre intervalli) valide per tutti e due i grafici.
import type { EChartsOption, LabelLayoutOptionCallback } from 'echarts';
import {
  COLORI,
  GRIGLIA_CON_ETICHETTE,
  aria,
  asseCategorieOrizzontale,
  asseImporti,
  etichettaDato,
  formatEuro,
  formatPercentuale,
  importoBreve,
  percentuale,
  tooltipDettaglio,
} from '../../../../shared/lib';
import type { DatoSerie } from '../../../../shared/lib';

/** Un segmento di una delle barre impilate: il dato nella sua barra, nulla nelle altre. */
export interface Segmento<B extends string = string> {
  nome: string;
  /** La barra (categoria dell'asse) del segmento. */
  barra: B;
  valore: number;
  /** Il totale della barra: la percentuale dell'etichetta. */
  totale: number;
  colore: string;
  /** Il colore del testo dell'etichetta sul colore del segmento (contrasto AA). */
  testo: string;
  /** L'ultimo segmento della sua barra: un'etichetta che non entra va a destra della barra. */
  ultimo: boolean;
  /** La barra e' intera (un solo segmento, nome uguale alla barra): niente quota nell'etichetta, suggerimento col solo importo. */
  intera?: boolean;
}

/** Spazio fra l'etichetta e il bordo del segmento (px): sotto questo margine l'etichetta non entra. */
const MARGINE_ETICHETTA = 4;

/**
 * Posizione dell'etichetta di un segmento (revisione del 04/11/2026: "Ancora da pagare" sforava di qualche pixel): dentro
 * il segmento se ci sta, altrimenti accanto, a destra della barra per l'ultimo segmento e sopra il segmento per gli altri.
 * ECharts la chiama a ogni disegno, anche quando il grafico cambia larghezza; l'etichetta ha lo sfondo del suo segmento,
 * quindi resta leggibile e riconoscibile anche fuori.
 */
export function posizioneEtichettaSegmento(ultimo: boolean): LabelLayoutOptionCallback {
  return ({ rect, labelRect }) => {
    if (labelRect.width + 2 * MARGINE_ETICHETTA <= rect.width && labelRect.height <= rect.height) return {};
    return ultimo
      ? { x: rect.x + rect.width + MARGINE_ETICHETTA, y: rect.y + rect.height / 2, align: 'left', verticalAlign: 'middle' }
      : { x: rect.x, y: rect.y - MARGINE_ETICHETTA, align: 'left', verticalAlign: 'bottom' };
  };
}

/** Larghezza stimata (px) di un'etichetta di segmento a 12 px: circa 7 px per carattere, piu' il riquadro e il margine. */
export function larghezzaEtichetta(testo: string): number {
  return Math.ceil(testo.length * 7) + 8 + MARGINE_ETICHETTA;
}

/** " (24,3 %)": la quota del segmento sulla sua barra; nulla per una barra intera (sarebbe sempre 100 %). */
function quotaDellaBarra(seg: Segmento): string {
  return !seg.intera && seg.totale > 0 ? ` (${formatPercentuale(percentuale(seg.valore, seg.totale))})` : '';
}

/** "41,9 M€ (24,3 %)": l'importo del segmento e la sua quota della barra. */
export function testoEtichetta(seg: Segmento): string {
  return `${importoBreve(seg.valore)}${quotaDellaBarra(seg)}`;
}

/** Il suggerimento: "Ammesso, pagato: 4.900.000,00 € (61,3 %)"; per una barra intera "Dotazione: 10.000.000,00 €". */
function dettaglioSegmento(seg: Segmento): string {
  return seg.intera ? `${seg.barra}: ${formatEuro(seg.valore)}` : `${seg.barra}, ${seg.nome.toLowerCase()}: ${formatEuro(seg.valore)}${quotaDellaBarra(seg)}`;
}

/**
 * La serie di un segmento: il dato nella sua barra, nulla nelle altre. Un bordo bianco separa i segmenti attigui anche
 * quando i loro colori hanno luminanza simile (review step9 dell'11/11/2026, J-02: netti e rettifiche a 1,04:1).
 */
export function serieSegmento(seg: Segmento, barre: readonly string[]) {
  const dato: DatoSerie = { value: seg.valore, name: seg.barra, etichetta: testoEtichetta(seg), dettaglio: dettaglioSegmento(seg) };
  return {
    type: 'bar' as const,
    name: seg.nome,
    stack: 'importi',
    barMaxWidth: 46,
    itemStyle: { color: seg.colore, borderColor: COLORI.superficie, borderWidth: 1 },
    label: { show: true, position: 'inside' as const, formatter: etichettaDato, color: seg.testo, backgroundColor: seg.colore, padding: [2, 4], borderRadius: 3 },
    labelLayout: posizioneEtichettaSegmento(seg.ultimo),
    data: barre.map((b) => (b === seg.barra ? dato : null)),
  };
}

/**
 * Le opzioni delle barre impilate: suggerimento per segmento, legenda sotto, a destra lo spazio in pixel per l'etichetta piu'
 * lunga degli ultimi segmenti se non entra nel suo (J-04: non dipende dalla larghezza del grafico ne' dalla scala), asse
 * degli importi con al piu' tre intervalli e nessuna etichetta sopra un'altra (verifica a vista del 05/11/2026), barre nell'
 * ordine dato dall'alto.
 */
export function opzioniBarreImpilate(segmenti: readonly Segmento[], barre: readonly string[], descrizione: string): EChartsOption {
  return {
    aria: aria(descrizione),
    tooltip: { trigger: 'item', formatter: tooltipDettaglio },
    legend: { bottom: 0 },
    grid: { ...GRIGLIA_CON_ETICHETTE, right: Math.max(...segmenti.filter((s) => s.ultimo).map((s) => larghezzaEtichetta(testoEtichetta(s)))) },
    xAxis: { type: 'value', splitNumber: 3, axisLabel: { formatter: asseImporti, hideOverlap: true } },
    yAxis: asseCategorieOrizzontale(barre),
    series: segmenti.map((seg) => serieSegmento(seg, barre)),
  };
}
