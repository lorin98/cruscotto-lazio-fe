// grafico-finto.ts — ECharts sostituito nei test (jsdom non disegna): ogni grafico creato registra le opzioni ricevute
// (con le impostazioni di setOption) e il gestore del clic, cosi' i test verificano cosa arriva al grafico e simulano
// il drill-down. Montato da src/shared/test/setup.ts con vi.mock sul modulo shared/ui/grafici/echarts. Implementa gli
// stessi metodi di IstanzaGrafico: un metodo nuovo usato dal kit fa fallire la compilazione qui (controllo sotto).
import type { IstanzaGrafico } from '../ui/grafici/echarts';

export interface GraficoFinto {
  el: HTMLElement;
  /** Opzioni ricevute da setOption, in ordine. */
  opzioni: unknown[];
  /** Impostazioni passate a setOption insieme alle opzioni (es. notMerge). */
  impostazioni: unknown[];
  clic: Array<(p: unknown) => void>;
  dismesso: boolean;
  setOption: (o: unknown, impostazioni?: unknown) => void;
  on: (evento: string, f: (p: unknown) => void) => GraficoFinto;
  resize: () => void;
  dispose: () => void;
  getDataURL: () => string;
}

// ogni metodo di IstanzaGrafico deve esistere nel finto
export const METODI_DEL_FINTO: Exclude<keyof IstanzaGrafico, keyof GraficoFinto> extends never ? true : never = true;

export const graficiFinti: GraficoFinto[] = [];

export function creaGraficoFinto(el: HTMLElement): IstanzaGrafico {
  const g: GraficoFinto = {
    el,
    opzioni: [],
    impostazioni: [],
    clic: [],
    dismesso: false,
    setOption: (o, impostazioni) => {
      g.opzioni.push(o);
      g.impostazioni.push(impostazioni);
    },
    on: (evento, f) => {
      if (evento === 'click') g.clic.push(f);
      return g;
    },
    resize: () => undefined,
    dispose: () => {
      g.dismesso = true;
    },
    getDataURL: () => 'data:image/svg+xml;charset=utf-8,',
  };
  graficiFinti.push(g);
  return g as unknown as IstanzaGrafico;
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
