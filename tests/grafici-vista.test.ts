// @vitest-environment node
// Radice di vista di treemap e raggiera (review v3 A-03) con ECharts VERO, renderer SVG lato server: dopo il drill-down
// dell'utente la copia del PNG (copiaComeSiVede: stesse opzioni, nessuna animazione anche nelle serie, radici lette da
// radiciDiVista) mostra la stessa vista, senza le etichette del livello precedente. Il modello di ECharts non e' nei
// tipi pubblici: se un aggiornamento della libreria lo cambia, fallisce questo test.
import { describe, expect, it } from 'vitest';
import * as echarts from 'echarts';
import type { EChartsOption } from 'echarts';
import { copiaComeSiVede } from '../src/shared/ui/grafici/echarts';
import type { IstanzaGrafico } from '../src/shared/ui/grafici/echarts';
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
  ] as const)('%s: dopo il drill-down la copia del PNG mostra solo il livello scelto', (_nome, opzioni, azione) => {
    const vista = crea(opzioni);
    expect(radiciDiVista(vista)).toEqual([]);
    // il clic dell'utente su SRA: la stessa azione che ECharts esegue dal grafico
    vista.dispatchAction({ type: azione, seriesIndex: 0, targetNode: 'SRA' });
    expect(radiciDiVista(vista)).toEqual([{ type: azione, seriesIndex: 0, targetNodeId: expect.any(String) }]);
    const copia = echarts.init(null, undefined, { renderer: 'svg', ssr: true, width: 600, height: 400 });
    copiaComeSiVede(vista as unknown as IstanzaGrafico, copia);
    const visti = testi(copia);
    expect(visti).toEqual(expect.arrayContaining(['SRA01', 'SRA03']));
    // niente famiglie del livello precedente (con animation:false solo globale il treemap le lasciava: residuo di A-03)
    for (const altro of ['SRD', 'SRD01', '▶ SRD', '▶ SRA']) expect(visti).not.toContain(altro);
    vista.dispose();
    copia.dispose();
  });

  it('senza drill-down la copia ha le stesse famiglie della vista', () => {
    const vista = crea(TREEMAP);
    const copia = echarts.init(null, undefined, { renderer: 'svg', ssr: true, width: 600, height: 400 });
    copiaComeSiVede(vista as unknown as IstanzaGrafico, copia);
    expect(testi(copia)).toEqual(testi(vista));
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
