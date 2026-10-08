// grafico-finto.ts — ECharts sostituito nei test (jsdom non disegna): ogni grafico creato registra le opzioni ricevute
// e il gestore del clic, cosi' i test verificano cosa arriva al grafico e simulano il drill-down. Montato da
// src/shared/test/setup.ts con vi.mock sul modulo shared/ui/grafici/echarts.

export interface GraficoFinto {
  el: HTMLElement;
  opzioni: unknown[];
  clic: Array<(p: unknown) => void>;
  dismesso: boolean;
  setOption: (o: unknown) => void;
  on: (evento: string, f: (p: unknown) => void) => void;
  off: () => void;
  resize: () => void;
  dispose: () => void;
  getDataURL: () => string;
}

export const graficiFinti: GraficoFinto[] = [];

export function creaGraficoFinto(el: HTMLElement): GraficoFinto {
  const g: GraficoFinto = {
    el,
    opzioni: [],
    clic: [],
    dismesso: false,
    setOption: (o) => g.opzioni.push(o),
    on: (evento, f) => {
      if (evento === 'click') g.clic.push(f);
    },
    off: () => undefined,
    resize: () => undefined,
    dispose: () => {
      g.dismesso = true;
    },
    getDataURL: () => 'data:image/svg+xml;charset=utf-8,',
  };
  graficiFinti.push(g);
  return g;
}

export function azzeraGraficiFinti(): void {
  graficiFinti.length = 0;
}

/** I grafici vivi (non dismessi), nell'ordine di creazione. */
export const graficiVivi = (): GraficoFinto[] => graficiFinti.filter((g) => !g.dismesso);

/** Simula il clic su un elemento del grafico (parametro come quello di ECharts). */
export function clicSu(g: GraficoFinto, p: { name?: string; dataIndex?: number; data?: unknown }): void {
  g.clic.forEach((f) => f(p));
}
