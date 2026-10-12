// vista.ts — radice della vista di treemap e raggiera, cioe' il drill-down dell'utente (clic su una famiglia: azioni
// treemapRootToNode e sunburstRootToNode). Non sta nelle opzioni di getOption ma nel modello dell'istanza, che ECharts non
// espone nei tipi: la si legge qui, in un punto solo, e la copia del PNG la riapplica per essere il grafico come si vede
// (review v3 A-03). Un'istanza senza modello (il grafico finto dei test) non ha radici. Verificato con ECharts vero in
// tests/grafici-vista.test.ts: un aggiornamento della libreria che lo rompe fa fallire quel test.

interface NodoAlbero {
  getId(): string;
  parentNode?: NodoAlbero | null;
}

interface SerieDelModello {
  subType: string;
  seriesIndex: number;
  getViewRoot?: () => NodoAlbero | undefined;
}

interface ModelloGlobale {
  eachSeries(f: (serie: SerieDelModello) => void): void;
}

/** Azione di ECharts che riporta la vista di una serie al nodo `targetNodeId`. */
export interface RadiceDiVista {
  type: 'treemapRootToNode' | 'sunburstRootToNode';
  seriesIndex: number;
  targetNodeId: string;
}

/** Le radici di vista diverse dalla radice dell'albero, una per serie treemap o raggiera. */
export function radiciDiVista(istanza: object): RadiceDiVista[] {
  const modello = (istanza as { getModel?: () => ModelloGlobale | undefined }).getModel?.();
  const radici: RadiceDiVista[] = [];
  modello?.eachSeries((s) => {
    if (s.subType !== 'treemap' && s.subType !== 'sunburst') return;
    const nodo = s.getViewRoot?.();
    if (nodo?.parentNode) {
      radici.push({ type: s.subType === 'treemap' ? 'treemapRootToNode' : 'sunburstRootToNode', seriesIndex: s.seriesIndex, targetNodeId: nodo.getId() });
    }
  });
  return radici;
}
