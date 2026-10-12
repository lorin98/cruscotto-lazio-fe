// echarts.ts — ECharts 6 con import MODULARI (ADR 0027): solo i grafici e i componenti usati dai builder, renderer SVG
// sullo schermo (testo selezionabile, nitido in stampa) e canvas solo per l'immagine PNG scaricata, che si ridisegna
// fuori dalla pagina con le stesse opzioni, dimensioni e radice di vista, sotto l'intestazione di NFR-50. Unico punto
// d'ingresso della libreria: i test L2 lo sostituiscono (jsdom non disegna), i builder delle opzioni stanno nei lib/ e
// restano puri. Un tipo di grafico nuovo si registra qui quando un builder lo adotta.
import * as echarts from 'echarts/core';
import type { EChartsOption } from 'echarts';
import type { EChartsType } from 'echarts/core';
import { BarChart, FunnelChart, GaugeChart, LineChart, PieChart, SankeyChart, SunburstChart, TreemapChart } from 'echarts/charts';
import { AriaComponent, DataZoomComponent, GridComponent, LegendComponent, MarkLineComponent, TooltipComponent } from 'echarts/components';
import { CanvasRenderer, SVGRenderer } from 'echarts/renderers';
import { COLORI, PALETTE } from '../../lib/grafici';
import { aCapo } from '../../lib/intestazione';
import { radiciDiVista } from './vista';

const FONT = "'Titillium Web', Geneva, Tahoma, sans-serif";

echarts.use([
  BarChart, FunnelChart, GaugeChart, LineChart, PieChart, SankeyChart, SunburstChart, TreemapChart,
  AriaComponent, DataZoomComponent, GridComponent, LegendComponent, MarkLineComponent, TooltipComponent,
  CanvasRenderer, SVGRenderer,
]);

export const TEMA = 'ui';
echarts.registerTheme(TEMA, {
  color: PALETTE,
  textStyle: { fontFamily: FONT, color: COLORI.testo },
  // tooltip disegnato nel grafico (richText, vedi opzioniSicure): niente HTML ne' stili inline
  tooltip: { backgroundColor: COLORI.scuro, borderWidth: 0, borderRadius: 10, padding: [8, 12], textStyle: { color: COLORI.superficie, fontSize: 13 } },
  legend: { textStyle: { color: COLORI.attenuato } },
  categoryAxis: { axisLine: { lineStyle: { color: COLORI.neutro } }, axisTick: { show: false }, axisLabel: { color: COLORI.attenuato } },
  valueAxis: { axisLine: { show: false }, splitLine: { lineStyle: { color: '#eef2f6' } }, axisLabel: { color: COLORI.attenuato } },
});

/** Cio' che il kit usa di un'istanza di ECharts: il grafico finto dei test implementa gli stessi metodi. */
export type IstanzaGrafico = Pick<EChartsType, 'setOption' | 'on' | 'resize' | 'dispose' | 'getOption' | 'getWidth' | 'getHeight'>;

export function creaGrafico(el: HTMLElement): IstanzaGrafico {
  return echarts.init(el, TEMA, { renderer: 'svg' });
}

// intestazione del PNG: corpo 12 px, interlinea 16, margine 12 (in pixel CSS, moltiplicati per la densita')
const CORPO = 12;
const INTERLINEA = 16;
const MARGINE = 12;

/** Il grafico sotto le righe dell'intestazione, la prima (il titolo) in grassetto, a capo sulla larghezza del grafico. */
function conIntestazione(grafico: HTMLCanvasElement, righe: readonly string[], { larghezza, densita, sfondo }: { larghezza: number; densita: number; sfondo: string }): HTMLCanvasElement {
  const tela = document.createElement('canvas');
  const misura = tela.getContext('2d');
  if (!misura) throw new Error('disegno su canvas non disponibile nel browser');
  const linee = righe.flatMap((riga, n) => {
    misura.font = `${n === 0 ? '600 ' : ''}${CORPO}px ${FONT}`;
    return aCapo(riga, larghezza - 2 * MARGINE, (t) => misura.measureText(t).width).map((testo) => ({ testo, font: misura.font }));
  });
  const alta = Math.ceil((2 * MARGINE + linee.length * INTERLINEA) * densita);
  tela.width = grafico.width;
  tela.height = alta + grafico.height;
  // ridimensionare la tela azzera il contesto: lo stato si imposta dopo
  const ctx = tela.getContext('2d') as CanvasRenderingContext2D;
  ctx.fillStyle = sfondo;
  ctx.fillRect(0, 0, tela.width, tela.height);
  ctx.scale(densita, densita);
  ctx.fillStyle = COLORI.testo;
  ctx.textBaseline = 'top';
  linee.forEach((l, n) => {
    ctx.font = l.font;
    ctx.fillText(l.testo, MARGINE, MARGINE + n * INTERLINEA);
  });
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.drawImage(grafico, 0, alta);
  return tela;
}

// Senza animazioni anche su OGNI serie: il treemap ha le sue durate predefinite, che prevalgono su animation:false
// globale, e dopo il cambio di radice la copia avrebbe ancora le etichette del livello precedente ("▶ SRD" sopra la
// vista di SRA: review v3 iterazione 2, residuo di A-03). Con le serie senza animazioni il disegno e' subito quello finale.
function senzaAnimazioni(opzioni: EChartsOption): EChartsOption {
  const serie = opzioni.series;
  return { ...opzioni, animation: false, series: Array.isArray(serie) ? serie.map((s) => ({ ...s, animation: false })) : serie };
}

/**
 * Porta `copia` a com'e' `sorgente` sullo schermo: le opzioni CORRENTI (serie nascoste dalla legenda, zoom) senza
 * animazioni, poi la radice di vista di treemap e raggiera (il drill-down, review v3 A-03).
 */
export function copiaComeSiVede(sorgente: IstanzaGrafico, copia: Pick<EChartsType, 'setOption' | 'dispatchAction'>): void {
  copia.setOption(senzaAnimazioni(sorgente.getOption() as EChartsOption));
  for (const radice of radiciDiVista(sorgente)) copia.dispatchAction(radice);
}

/**
 * Immagine PNG (data URL) del grafico come si vede (copiaComeSiVede), sotto l'intestazione di NFR-50 (`intestazione`,
 * righe gia' composte: review v3 V-01), alle stesse dimensioni, col renderer canvas, che usa i font gia' caricati dalla
 * pagina (un SVG aperto come immagine non li vedrebbe e cambierebbe il testo), a densita' almeno doppia per la nitidezza.
 */
export function pngDelGrafico(sorgente: IstanzaGrafico, { sfondo, intestazione }: { sfondo: string; intestazione: readonly string[] }): string {
  const larghezza = sorgente.getWidth();
  const densita = Math.max(2, window.devicePixelRatio || 1);
  const copia = echarts.init(document.createElement('div'), TEMA, { renderer: 'canvas', width: larghezza, height: sorgente.getHeight() });
  try {
    copiaComeSiVede(sorgente, copia);
    const grafico = copia.renderToCanvas({ pixelRatio: densita, backgroundColor: sfondo });
    return conIntestazione(grafico, intestazione, { larghezza, densita, sfondo }).toDataURL('image/png');
  } finally {
    copia.dispose();
  }
}
