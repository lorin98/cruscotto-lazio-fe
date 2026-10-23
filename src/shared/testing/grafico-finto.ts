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
  /** Chiamate a resize (il ResizeObserver del kit). */
  ridimensionamenti: number;
  dismesso: boolean;
  setOption: (o: unknown, impostazioni?: unknown) => void;
  on: (evento: string, f: (p: unknown) => void) => GraficoFinto;
  resize: () => void;
  dispose: () => void;
  getOption: () => unknown;
  getWidth: () => number;
  getHeight: () => number;
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
    ridimensionamenti: 0,
    dismesso: false,
    setOption: (o, impostazioni) => {
      g.opzioni.push(o);
      g.impostazioni.push(impostazioni);
    },
    on: (evento, f) => {
      if (evento === 'click') g.clic.push(f);
      return g;
    },
    resize: () => {
      g.ridimensionamenti += 1;
    },
    dispose: () => {
      g.dismesso = true;
    },
    // le ultime opzioni ricevute, come l'istanza vera dopo setOption con notMerge
    getOption: () => g.opzioni.at(-1),
    getWidth: () => 800,
    getHeight: () => 320,
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
export function clicSu(g: GraficoFinto, p: { name?: string; dataIndex?: number; data?: unknown; seriesName?: string }): void {
  g.clic.forEach((f) => f(p));
}

/**
 * Clic su un dato come lo manda ECharts: il dato `indice` della serie `serie` letto dalle ultime opzioni ricevute dal
 * grafico (con il nome della serie e, per gli oggetti, il nome del dato). Il test clicca cio' che il grafico disegna, non
 * un parametro scritto a mano. Errore se il dato non esiste.
 */
export function clicSulDato(g: GraficoFinto, serie: number, indice: number): void {
  type Asse = { data?: unknown[] } | undefined;
  const opzioni = g.opzioni.at(-1) as { series?: Array<{ name?: string; data?: unknown[] }>; xAxis?: Asse; yAxis?: Asse } | undefined;
  const s = opzioni?.series?.[serie];
  const dato = s?.data?.[indice];
  if (s === undefined || dato === undefined || dato === null) throw new Error(`nessun dato ${indice} nella serie ${serie} del grafico`);
  // come ECharts: il nome del dato, altrimenti la categoria dell'asse
  const categoria = opzioni?.xAxis?.data?.[indice] ?? opzioni?.yAxis?.data?.[indice];
  const proprio = typeof dato === 'object' ? (dato as { name?: unknown }).name : undefined;
  const nome = typeof proprio === 'string' ? proprio : typeof categoria === 'string' ? categoria : undefined;
  clicSu(g, { name: nome, dataIndex: indice, data: dato, seriesName: s.name });
}

/**
 * Clic sul dato che porta il codice dato (il `codice` dei dati delle serie del kit: un intervento, la chiave di una voce,
 * una riga), come lo manda ECharts: il primo dato col codice nelle serie delle ultime opzioni ricevute. Il test clicca
 * la barra del dato che conta senza contarne la posizione. Errore se nessun dato porta il codice.
 */
export function clicSulCodice(g: GraficoFinto | undefined, codice: string): void {
  if (!g) throw new Error('grafico assente');
  const opzioni = g.opzioni.at(-1) as { series?: Array<{ data?: unknown[] }> } | undefined;
  for (const [serie, s] of (opzioni?.series ?? []).entries()) {
    const indice = (s.data ?? []).findIndex((d) => typeof d === 'object' && d !== null && (d as { codice?: unknown }).codice === codice);
    if (indice >= 0) return clicSulDato(g, serie, indice);
  }
  throw new Error(`nessun dato col codice ${codice} nel grafico`);
}
