// echarts.ts — ECharts 6 con import MODULARI (ADR 0027): solo i grafici e i componenti usati, renderer SVG (testo
// selezionabile, nitido in stampa, nessun canvas). Unico punto d'ingresso della libreria: i test L2 lo sostituiscono
// (jsdom non disegna), i builder delle opzioni stanno nei lib/ delle feature e restano puri.
import * as echarts from 'echarts/core';
import { BarChart, FunnelChart, GaugeChart, HeatmapChart, LineChart, PieChart, SankeyChart, SunburstChart, TreemapChart } from 'echarts/charts';
import {
  AriaComponent,
  DataZoomComponent,
  GridComponent,
  LegendComponent,
  MarkLineComponent,
  TooltipComponent,
  VisualMapComponent,
} from 'echarts/components';
import { SVGRenderer } from 'echarts/renderers';

echarts.use([
  BarChart, FunnelChart, GaugeChart, HeatmapChart, LineChart, PieChart, SankeyChart, SunburstChart, TreemapChart,
  AriaComponent, DataZoomComponent, GridComponent, LegendComponent, MarkLineComponent, TooltipComponent, VisualMapComponent,
  SVGRenderer,
]);

/** Palette del tema (token di tema.css): il colore non e' mai l'unico canale, ogni grafico ha la tabella equivalente. */
export const PALETTE = ['#0066cc', '#4e8a1f', '#b26b00', '#7a5cb8', '#00838f', '#c0392b', '#0b2d4e', '#8a99a8'];

export const TEMA = 'ui';
echarts.registerTheme(TEMA, {
  color: PALETTE,
  textStyle: { fontFamily: "'Titillium Web', Geneva, Tahoma, sans-serif", color: '#17212b' },
  tooltip: {
    backgroundColor: 'rgba(11,45,78,.94)',
    borderWidth: 0,
    textStyle: { color: '#fff', fontSize: 13 },
    extraCssText: 'border-radius:10px;box-shadow:0 8px 24px rgba(0,0,0,.18);',
  },
  legend: { textStyle: { color: '#546474' } },
  categoryAxis: { axisLine: { lineStyle: { color: '#c9d3de' } }, axisTick: { show: false }, axisLabel: { color: '#546474' } },
  valueAxis: { axisLine: { show: false }, splitLine: { lineStyle: { color: '#eef2f6' } }, axisLabel: { color: '#546474' } },
});

export type IstanzaGrafico = echarts.EChartsType;

export function creaGrafico(el: HTMLElement): IstanzaGrafico {
  return echarts.init(el, TEMA, { renderer: 'svg' });
}
