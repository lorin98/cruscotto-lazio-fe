// Grafico — wrapper unico di ECharts (ADR 0027): init, opzioni, ridimensionamento, clic, dispose. Le opzioni arrivano gia'
// pronte dai builder puri delle feature; qui solo il ciclo di vita. Con prefers-reduced-motion niente animazioni.
import { useEffect, useRef } from 'react';
import type { EChartsOption } from 'echarts';
import { firmaOpzioni, opzioniSicure } from '../../lib/grafici';
import { creaGrafico } from './echarts';
import type { IstanzaGrafico } from './echarts';

/** Parametro del clic su un elemento del grafico (sottoinsieme di quello di ECharts usato per il drill-down). */
export interface ClicGrafico {
  name?: string;
  dataIndex?: number;
  data?: unknown;
}

export type AltezzaGrafico = 'normale' | 'alto' | 'basso' | 'mini';

const movimentoRidotto = () => typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function Grafico({
  opzioni,
  altezza = 'normale',
  onClic,
  onIstanza,
}: {
  opzioni: EChartsOption;
  altezza?: AltezzaGrafico;
  onClic?: (p: ClicGrafico) => void;
  onIstanza?: (c: IstanzaGrafico | null) => void;
}) {
  const el = useRef<HTMLDivElement>(null);
  const istanza = useRef<IstanzaGrafico | null>(null);
  // firma delle opzioni gia' applicate all'istanza corrente (azzerata quando l'istanza si ricrea)
  const firmaApplicata = useRef<string | null>(null);
  const clic = useRef(onClic);
  const notifica = useRef(onIstanza);
  useEffect(() => {
    clic.current = onClic;
    notifica.current = onIstanza;
  });

  useEffect(() => {
    if (!el.current) return;
    const c = creaGrafico(el.current);
    istanza.current = c;
    firmaApplicata.current = null;
    notifica.current?.(c);
    c.on('click', (p) => clic.current?.(p as ClicGrafico));
    const osservatore = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(() => c.resize());
    osservatore?.observe(el.current);
    return () => {
      osservatore?.disconnect();
      c.dispose();
      istanza.current = null;
      notifica.current?.(null);
    };
  }, []);

  // i builder ricreano le opzioni a ogni render della pagina: si ridisegna solo se il contenuto cambia, cosi' uno
  // stato estraneo (un'anteprima aperta, un interruttore) non azzera zoom e drill-down del grafico
  useEffect(() => {
    const firma = firmaOpzioni(opzioni);
    if (!istanza.current || firma === firmaApplicata.current) return;
    firmaApplicata.current = firma;
    istanza.current.setOption({ ...opzioniSicure(opzioni), animation: !movimentoRidotto() }, { notMerge: true });
  }, [opzioni]);

  const classe = altezza === 'normale' ? 'ui-grafico' : `ui-grafico ui-grafico--${altezza}`;
  return <div ref={el} className={classe} />;
}
