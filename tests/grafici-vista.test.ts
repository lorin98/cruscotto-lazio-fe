// @vitest-environment node
// Radice di vista di treemap e raggiera (review v3 A-03) con ECharts VERO, renderer SVG lato server: dopo il drill-down
// dell'utente la copia del PNG, con le stesse opzioni e le radici lette da radiciDiVista, mostra la stessa vista. Il
// modello di ECharts non e' nei tipi pubblici: se un aggiornamento della libreria lo cambia, fallisce questo test.
import { describe, expect, it } from 'vitest';
import * as echarts from 'echarts';
import type { EChartsOption } from 'echarts';
import { radiciDiVista } from '../src/shared/ui/grafici/vista';

const ALBERO = [
  { name: 'SRA', children: [{ name: 'SRA01', value: 9 }, { name: 'SRA03', value: 7 }] },
  { name: 'SRD', children: [{ name: 'SRD01', value: 5 }, { name: 'SRD02', value: 4 }] },
];

const TREEMAP: EChartsOption = { animation: false, series: [{ type: 'treemap', data: ALBERO, nodeClick: 'zoomToNode', leafDepth: 1, roam: false, breadcrumb: { show: true } }] };
const RAGGIERA: EChartsOption = { animation: false, series: [{ type: 'sunburst', data: ALBERO, nodeClick: 'rootToNode', label: { formatter: '{b}' } }] };

function crea(opzioni: EChartsOption) {
  const c = echarts.init(null, undefined, { renderer: 'svg', ssr: true, width: 600, height: 400 });
  c.setOption(opzioni);
  return c;
}

/** I testi disegnati, in ordine: cio' che si vede del grafico. */
const testi = (c: ReturnType<typeof crea>) => [...c.renderToSVGString().matchAll(/<text[^>]*>([^<]*)<\/text>/g)].map((m) => m[1]);

describe('radiciDiVista', () => {
  it.each([
    ['treemap', TREEMAP, 'treemapRootToNode'],
    ['raggiera', RAGGIERA, 'sunburstRootToNode'],
  ] as const)('%s: dopo il drill-down la copia mostra la stessa vista', (_nome, opzioni, azione) => {
    const vista = crea(opzioni);
    expect(radiciDiVista(vista)).toEqual([]);
    // il clic dell'utente su SRA: la stessa azione che ECharts esegue dal grafico
    vista.dispatchAction({ type: azione, seriesIndex: 0, targetNode: 'SRA' });
    const radici = radiciDiVista(vista);
    expect(radici).toEqual([{ type: azione, seriesIndex: 0, targetNodeId: expect.any(String) }]);
    const copia = crea(opzioni);
    // senza le radici la copia ripartirebbe dalla radice dell'albero
    expect(testi(copia)).not.toEqual(testi(vista));
    for (const r of radici) copia.dispatchAction(r);
    expect(testi(copia)).toEqual(testi(vista));
    expect(testi(copia)).not.toContain('SRD01');
    vista.dispose();
    copia.dispose();
  });

  it("un'istanza senza modello (il grafico finto) e un grafico senza alberi non hanno radici", () => {
    expect(radiciDiVista({})).toEqual([]);
    const barre = crea({ xAxis: { type: 'category', data: ['a'] }, yAxis: { type: 'value' }, series: [{ type: 'bar', data: [1] }] });
    expect(radiciDiVista(barre)).toEqual([]);
    barre.dispose();
  });
});
