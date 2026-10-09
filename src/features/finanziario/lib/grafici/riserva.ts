// riserva.ts — grafico dell'utilizzo progressivo della riserva al 5% (TX-0014): area dell'utilizzo cumulato per data,
// con la riserva accumulata come linea di riferimento. I movimenti senza data restano in tabella ("senza data").
import type { EChartsOption, LineSeriesOption } from 'echarts';
import {
  COLORI,
  NON_DISPONIBILE,
  aria,
  asseMilioni,
  confronta,
  formatDate,
  formatEuro,
  milioni,
  nonDisegnabile,
  notaOmessi,
  numeroDi,
  plurale,
  valoreInMilioni,
} from '../../../../shared/lib';
import type { DatiGrafico } from '../../../../shared/lib';
import type { RiservaLike } from '../dto';
import { euroOpzionale } from '../formato';

interface Movimento {
  data: string;
  importo: number | null;
  cumulato: number | null;
}

function movimentiDatati(m: RiservaLike): { datati: Movimento[]; senzaData: Array<{ importo?: number | null; cumulato?: number | null }> } {
  const movimenti = m.utilizzoProgressivo ?? [];
  const datati = movimenti.flatMap((p): Movimento[] => (p.data ? [{ data: p.data, importo: numeroDi(p.importo), cumulato: numeroDi(p.cumulato) }] : []));
  return { datati: datati.sort((a, b) => confronta(a.data, b.data)), senzaData: movimenti.filter((p) => !p.data) };
}

function lineaUtilizzo(cumulati: Array<number | null>, accumulato: number | null): LineSeriesOption {
  const riferimento =
    accumulato == null
      ? {}
      : { markLine: { silent: true, symbol: 'none' as const, lineStyle: { color: COLORI.attenzione, type: 'dashed' as const }, label: { formatter: `Riserva accumulata ${milioni(accumulato)}` }, data: [{ name: 'Riserva accumulata', yAxis: accumulato }] } };
  return { type: 'line', name: 'Utilizzo cumulato', connectNulls: false, areaStyle: { opacity: 0.2 }, data: cumulati, ...riferimento };
}

/** Area dell'utilizzo cumulato della riserva per data, con la linea della riserva accumulata. */
export function graficoUtilizzoRiserva(m: RiservaLike): DatiGrafico {
  const accumulato = numeroDi(m.importoAccumulato);
  const { datati, senzaData } = movimentiDatati(m);
  const categorie = datati.map((p) => formatDate(p.data));
  const righe = [...datati.map((p, k) => [categorie[k], euroOpzionale(p.importo), euroOpzionale(p.cumulato)]), ...senzaData.map((p) => ['senza data', euroOpzionale(p.importo), euroOpzionale(p.cumulato)])];
  const tabella = { caption: `Utilizzo progressivo della riserva (riserva accumulata: ${accumulato == null ? NON_DISPONIBILE : formatEuro(accumulato)})`, colonne: ['Data', 'Importo del movimento', 'Utilizzo cumulato'], righe };
  const omessi = [
    ...(senzaData.length > 0 ? [plurale(senzaData.length, 'movimento senza data', 'movimenti senza data')] : []),
    ...datati.flatMap((p, k) => (p.cumulato == null ? [`${categorie[k]}: utilizzo cumulato ${NON_DISPONIBILE}`] : [])),
  ];
  const cumulati = datati.map((p) => p.cumulato);
  if (cumulati.every((c) => c == null)) return nonDisegnabile('nessun utilizzo della riserva registrato', tabella, omessi);
  if (accumulato == null) omessi.push(`Riserva accumulata ${NON_DISPONIBILE}: linea di riferimento omessa`);
  const ultimo = [...cumulati].reverse().find((c): c is number => c != null) ?? 0;
  const descrizione =
    `Area dell'utilizzo cumulato della riserva dal ${categorie[0]} al ${categorie[categorie.length - 1]}: ${milioni(ultimo)} utilizzati` +
    `${accumulato == null ? '' : ` su ${milioni(accumulato)} di riserva accumulata`}.${notaOmessi(omessi)}`;
  // massimo dell'asse calcolato qui: le funzioni delle opzioni non catturano dati (la firma le confronta per sorgente)
  const massimo = accumulato == null ? {} : { max: Math.max(accumulato, ...cumulati.filter((c): c is number => c != null)) };
  const opzioni: EChartsOption = {
    aria: aria(descrizione),
    tooltip: { trigger: 'axis', valueFormatter: valoreInMilioni },
    dataZoom: [{ type: 'inside' }, { type: 'slider' }],
    xAxis: { type: 'category', data: categorie },
    yAxis: { type: 'value', min: 0, ...massimo, axisLabel: { formatter: asseMilioni } },
    series: [lineaUtilizzo(cumulati, accumulato)],
  };
  return { opzioni, tabella, omessi };
}
