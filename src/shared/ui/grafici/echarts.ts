// echarts.ts — ECharts 6 con import MODULARI (ADR 0027): solo i grafici e i componenti usati dai builder, renderer SVG
// sullo schermo (testo selezionabile, nitido in stampa) e canvas solo per l'immagine PNG scaricata, che si ridisegna
// fuori dalla pagina con le stesse opzioni e dimensioni. Unico punto d'ingresso della libreria: i test L2 lo
// sostituiscono (jsdom non disegna), i builder delle opzioni stanno nei lib/ e restano puri. Un tipo di grafico nuovo
// si registra qui quando un builder lo adotta.
import * as echarts from 'echarts/core';
import type { EChartsOption } from 'echarts';
import type { EChartsType } from 'echarts/core';
import { BarChart, FunnelChart, GaugeChart, LineChart, PieChart, SankeyChart, SunburstChart, TreemapChart } from 'echarts/charts';
import { AriaComponent, DataZoomComponent, GridComponent, LegendComponent, MarkLineComponent, TooltipComponent } from 'echarts/components';
import { CanvasRenderer, SVGRenderer } from 'echarts/renderers';
import { COLORI, PALETTE } from '../../lib/grafici';

echarts.use([
  BarChart, FunnelChart, GaugeChart, LineChart, PieChart, SankeyChart, SunburstChart, TreemapChart,
  AriaComponent, DataZoomComponent, GridComponent, LegendComponent, MarkLineComponent, TooltipComponent,
  CanvasRenderer, SVGRenderer,
]);

export const TEMA = 'ui';
echarts.registerTheme(TEMA, {
  color: PALETTE,
  textStyle: { fontFamily: "'Titillium Web', Geneva, Tahoma, sans-serif", color: COLORI.testo },
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

/**
 * Immagine PNG (data URL) del grafico come si vede: le opzioni CORRENTI dell'istanza (serie nascoste dalla legenda, zoom)
 * alle stesse dimensioni, ridisegnate senza animazioni col renderer canvas, che usa i font gia' caricati dalla pagina (un
 * SVG aperto come immagine non li vedrebbe e cambierebbe il testo), a densita' almeno doppia per la nitidezza.
 */
export function pngDelGrafico(sorgente: IstanzaGrafico, sfondo: string): string {
  const copia = echarts.init(document.createElement('div'), TEMA, { renderer: 'canvas', width: sorgente.getWidth(), height: sorgente.getHeight() });
  try {
    copia.setOption({ ...(sorgente.getOption() as EChartsOption), animation: false });
    return copia.getDataURL({ type: 'png', pixelRatio: Math.max(2, window.devicePixelRatio || 1), backgroundColor: sfondo });
  } finally {
    copia.dispose();
  }
}
