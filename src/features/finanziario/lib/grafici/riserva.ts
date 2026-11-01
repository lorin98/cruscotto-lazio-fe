// riserva.ts — grafico dell'utilizzo progressivo della riserva al 5% (TX-0014), forma A di R18 scelta dall'utente il
// 01/11/2026: linea a gradini dell'utilizzo cumulato per data (asse del tempo), fasce di sfondo con il nome e le date delle
// fasi (accumulo, utilizzo dopo il congelamento al 30/06, residuo dal 01/01), soglia della riserva del 5% tratteggiata ed
// etichettata con l'importo, ultimo punto etichettato con il valore e la percentuale della riserva. I movimenti senza data
// restano in tabella ("senza data").
import type { EChartsOption, LineSeriesOption } from 'echarts';
import {
  COLORI,
  NON_DISPONIBILE,
  aria,
  asseImporti,
  confronta,
  formatDate,
  formatEuro,
  formatPercentuale,
  importoBreve,
  nonDisegnabile,
  notaOmessi,
  numeroDi,
  percentuale,
  plurale,
  valoreBreve,
} from '../../../../shared/lib';
import type { DatiGrafico } from '../../../../shared/lib';
import type { RiservaLike } from '../dto';
import { euroOpzionale } from '../formato';
import { calendarioRiserva, dataBreve, sogliaRiserva } from '../riserva';

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

/** Le fasce delle fasi dell'anno n (date ISO del calendario della riserva). */
function fasce(anno: number) {
  const c = calendarioRiserva(anno);
  const fascia = (nome: string, da: string, a: string, colore: string) => [
    { name: nome, xAxis: da, itemStyle: { color: colore }, label: { formatter: nome, position: 'insideTop' as const, color: COLORI.attenuato } },
    { xAxis: a },
  ];
  return [
    fascia(`Accumulo (${dataBreve(c.inizioAccumulo)} - ${dataBreve(c.congelamento)})`, c.inizioAccumulo, c.congelamento, 'rgba(201, 211, 222, .25)'),
    fascia(`Utilizzo (congelata il ${dataBreve(c.congelamento)})`, c.inizioUtilizzo, c.fineUtilizzo, 'rgba(0, 102, 204, .08)'),
    fascia(`Residuo (dal ${dataBreve(c.inizioResiduo)})`, c.inizioResiduo, `${anno + 2}-12-31`, 'rgba(178, 107, 0, .08)'),
  ];
}

function lineaUtilizzo(punti: Array<[string, number | null]>, s: { valore: number | null; nome: string }, anno: number, ultimo: string): LineSeriesOption {
  const riserva = s.valore;
  const soglia =
    riserva == null
      ? {}
      : { markLine: { silent: true, symbol: 'none' as const, lineStyle: { color: COLORI.attenzione, type: 'dashed' as const }, label: { formatter: `${s.nome} ${importoBreve(riserva)}`, position: 'insideEndTop' as const }, data: [{ name: s.nome, yAxis: riserva }] } };
  // l'ultimo punto: il valore e la percentuale della riserva (testo composto qui: i formatter non catturano dati)
  const etichette = punti.map(([data, v], k) => (k === punti.length - 1 && v != null ? { value: [data, v], label: { show: true, position: 'top' as const, formatter: ultimo } } : [data, v]));
  return {
    type: 'line',
    name: 'Utilizzo cumulato',
    step: 'end',
    connectNulls: false,
    areaStyle: { opacity: 0.15 },
    data: etichette as LineSeriesOption['data'],
    markArea: { silent: true, data: fasce(anno) as never },
    ...soglia,
  };
}

/**
 * Linea a gradini dell'utilizzo cumulato della riserva dell'anno `anno` per data, con le fasi sullo sfondo e la soglia della
 * riserva del 5% (montante x quota; in sua assenza la riserva accumulata).
 */
export function graficoUtilizzoRiserva(m: RiservaLike, anno: number): DatiGrafico {
  const s = sogliaRiserva(m);
  const riserva = s.valore;
  const nome = s.nome.toLowerCase().replace(' (montante o quota non disponibili)', '');
  const { datati, senzaData } = movimentiDatati(m);
  const date = datati.map((p) => formatDate(p.data));
  const righe = [...datati.map((p, k) => [date[k], euroOpzionale(p.importo), euroOpzionale(p.cumulato)]), ...senzaData.map((p) => ['senza data', euroOpzionale(p.importo), euroOpzionale(p.cumulato)])];
  const tabella = { caption: `Utilizzo progressivo della riserva (${s.nome.toLowerCase()}: ${riserva == null ? NON_DISPONIBILE : formatEuro(riserva)})`, colonne: ['Data', 'Importo del movimento', 'Utilizzo cumulato'], righe };
  const omessi = [
    ...(senzaData.length > 0 ? [plurale(senzaData.length, 'movimento senza data', 'movimenti senza data')] : []),
    ...datati.flatMap((p, k) => (p.cumulato == null ? [`${date[k]}: utilizzo cumulato ${NON_DISPONIBILE}`] : [])),
  ];
  const cumulati = datati.map((p) => p.cumulato);
  if (cumulati.every((c) => c == null)) return nonDisegnabile('nessun utilizzo della riserva registrato', tabella, omessi);
  if (riserva == null) omessi.push(`Riserva del 5% ${NON_DISPONIBILE}: soglia omessa`);
  const ultimo = [...cumulati].reverse().find((c): c is number => c != null) ?? 0;
  const quota = riserva != null && riserva > 0 ? ` (${formatPercentuale(percentuale(ultimo, riserva))} della riserva)` : '';
  const descrizione =
    `Linea a gradini dell'utilizzo cumulato della riserva dal ${date[0]} al ${date[date.length - 1]}: ${importoBreve(ultimo)} utilizzati${quota}` +
    `${riserva == null ? '' : `; ${nome} ${importoBreve(riserva)}`}.${notaOmessi(omessi)}`;
  // massimo dell'asse calcolato qui: le funzioni delle opzioni non catturano dati (la firma le confronta per sorgente)
  const massimo = riserva == null ? {} : { max: Math.max(riserva, ...cumulati.filter((c): c is number => c != null)) };
  const opzioni: EChartsOption = {
    aria: aria(descrizione),
    tooltip: { trigger: 'axis', valueFormatter: valoreBreve },
    // l'asse copre le fasi dell'anno n (dall'inizio dell'accumulo alla fine dell'anno del residuo), non i soli movimenti:
    // le fasce si vedono tutte (review J-07)
    xAxis: { type: 'time', min: calendarioRiserva(anno).inizioAccumulo, max: `${anno + 2}-12-31`, axisLabel: { formatter: '{dd}/{MM}/{yyyy}', hideOverlap: true } },
    yAxis: { type: 'value', min: 0, ...massimo, axisLabel: { formatter: asseImporti } },
    series: [lineaUtilizzo(datati.map((p) => [p.data, p.cumulato]), s, anno, `${importoBreve(ultimo)}${quota}`)],
  };
  return { opzioni, tabella, omessi };
}

/** Il testo di lettura sopra il grafico (R18): la linea, la soglia e cosa vuol dire superarla. */
export function letturaUtilizzoRiserva(m: RiservaLike): string {
  const s = sogliaRiserva(m);
  const nome = `la ${s.nome.toLowerCase()}`;
  const soglia = s.valore == null ? nome : `${nome} (${importoBreve(s.valore)})`;
  return `La linea è quanto della riserva è stato usato, sommato nel tempo. La linea tratteggiata è ${soglia}: finché la linea resta sotto, c'è ancora riserva; oltre, l'utilizzo la supera.`;
}
