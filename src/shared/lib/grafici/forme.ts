// forme.ts — scheletri generici e PURI riusati dai builder delle feature: cascata (barre impilate con base
// trasparente), barre raggruppate per categoria, ciambella di due parti di un totale. I testi delle assenze arrivano
// gia' composti dalla feature (resa del dominio): qui solo forma, descrizione accessibile e voci omesse.
import type { BarSeriesOption, EChartsOption, PieSeriesOption } from 'echarts';
import { formatPercentuale } from '../format';
import { COLORI } from './colori';
import { nonDisegnabile } from './contratto';
import type { DatiGrafico, TabellaEquivalente } from './contratto';
import {
  aria,
  asseMilioni,
  etichettaDato,
  milioni,
  notaOmessi,
  percentuale,
  plurale,
  tooltipDettaglio,
  valoreInMilioni,
  zoomSeMolti,
} from './primitive';
import type { DatoSerie } from './primitive';

// ---------------------------------------------------------------- cascata

export interface PassoCascata {
  nome: string;
  valore: number;
  base: number;
  colore: string;
}

export function opzioniCascata(passi: readonly PassoCascata[], descrizione: string): EChartsOption {
  const dati = passi.map((p): DatoSerie => ({ value: p.valore, name: p.nome, etichetta: milioni(p.valore), dettaglio: `${p.nome}: ${milioni(p.valore)}`, itemStyle: { color: p.colore } }));
  const serie: BarSeriesOption[] = [
    {
      type: 'bar',
      name: 'Base',
      stack: 'cascata',
      silent: true,
      itemStyle: { color: 'transparent', borderColor: 'transparent' },
      emphasis: { disabled: true },
      tooltip: { show: false },
      data: passi.map((p) => p.base),
    },
    { type: 'bar', name: 'Importo', stack: 'cascata', label: { show: true, position: 'top', formatter: etichettaDato }, data: dati },
  ];
  return {
    aria: aria(descrizione),
    tooltip: { trigger: 'item', formatter: tooltipDettaglio },
    xAxis: { type: 'category', data: passi.map((p) => p.nome) },
    yAxis: { type: 'value', axisLabel: { formatter: asseMilioni } },
    series: serie,
  };
}

export function descrizioneCascata(titolo: string, passi: readonly PassoCascata[], omessi: readonly string[]): string {
  return `${titolo}: ${passi.map((p) => `${p.nome.toLowerCase()} ${milioni(p.valore)}`).join(', ')}.${notaOmessi(omessi)}`;
}

// ---------------------------------------------------------------- barre raggruppate per categoria

export interface SerieRaggruppata {
  nome: string;
  /** Soggetto nei messaggi delle voci omesse: "SRA01, <soggetto>: non disponibile (...)". */
  soggetto: string;
}

export interface VoceRaggruppata {
  categoria: string;
  /** Codice navigabile (drill-down), se la categoria e' un elemento con un dettaglio. */
  codice?: string;
  /** Un valore per serie, null se assente. */
  valori: Array<number | null>;
  /** Celle della tabella equivalente, una per serie, gia' formattate (assenze comprese). */
  celle: string[];
}

export interface TestiBarre {
  caption: string;
  colonne: string[];
  titolo: string;
  vuoto: string;
}

function datiBarre(voci: readonly VoceRaggruppata[], definizioni: readonly SerieRaggruppata[], omessi: string[]) {
  const categorie: string[] = [];
  const datiSerie: Array<Array<DatoSerie | null>> = definizioni.map(() => []);
  for (const v of voci) {
    v.valori.forEach((x, k) => {
      // "SRA01, pagamenti totali: non valorizzato": la forma con i due punti non chiede l'accordo con il soggetto
      if (x == null) omessi.push(`${v.categoria}, ${definizioni[k].soggetto}: ${v.celle[k]}`);
    });
    if (v.valori.every((x) => x == null)) continue;
    categorie.push(v.categoria);
    v.valori.forEach((x, k) => {
      datiSerie[k].push(x == null ? null : { value: x, name: v.categoria, codice: v.codice, dettaglio: `${v.categoria}, ${definizioni[k].soggetto}: ${milioni(x)}` });
    });
  }
  return { categorie, datiSerie };
}

/** Barre raggruppate (una serie per definizione) in milioni di euro; i valori assenti restano vuoti e dichiarati. */
export function barreRaggruppate(voci: readonly VoceRaggruppata[], definizioni: readonly SerieRaggruppata[], testi: TestiBarre, omessiIniziali: readonly string[] = []): DatiGrafico {
  const tabella: TabellaEquivalente = { caption: testi.caption, colonne: testi.colonne, righe: voci.map((v) => [v.categoria, ...v.celle]) };
  const omessi = [...omessiIniziali];
  const { categorie, datiSerie } = datiBarre(voci, definizioni, omessi);
  if (categorie.length === 0) return nonDisegnabile(testi.vuoto, tabella, omessi);
  const estremi = categorie.length === 1 ? ` (${categorie[0]})` : `, da ${categorie[0]} a ${categorie[categorie.length - 1]}`;
  const descrizione = `${testi.titolo} per ${plurale(categorie.length, 'intervento', 'interventi')}${estremi}, in milioni di euro.${notaOmessi(omessi)}`;
  const opzioni: EChartsOption = {
    aria: aria(descrizione),
    legend: {},
    tooltip: { trigger: 'axis', valueFormatter: valoreInMilioni },
    ...zoomSeMolti(categorie.length),
    xAxis: { type: 'category', data: categorie, axisLabel: { interval: 0, rotate: categorie.length > 8 ? 45 : 0 } },
    yAxis: { type: 'value', axisLabel: { formatter: asseMilioni } },
    series: definizioni.map((def, k): BarSeriesOption => ({ type: 'bar', name: def.nome, data: datiSerie[k] })),
  };
  return { opzioni, tabella, omessi };
}

// ---------------------------------------------------------------- ciambella di due parti

export interface Parte {
  nome: string;
  valore: number | null;
  /** Resa dell'assenza, gia' composta, quando il valore e' null (es. "non disponibile (fonte impegni non attiva)"). */
  assenza: string;
}

function motivoDueParti(parti: readonly [Parte, Parte]): string | null {
  const assenti = parti.filter((p) => p.valore == null);
  if (assenti.length > 0) return `manca una delle due parti (${assenti.map((p) => `${p.nome}: ${p.assenza}`).join('; ')})`;
  const [a, b] = parti.map((p) => p.valore as number);
  if (a < 0 || b < 0) return 'una delle due parti è negativa: le proporzioni non avrebbero senso';
  return a + b <= 0 ? 'il totale è zero' : null;
}

/**
 * Ciambella di due parti di un totale: si disegna solo se entrambe sono valorizzate e non negative e la somma e'
 * positiva (altrimenti le percentuali sarebbero false). La tabella la compone il chiamante (di norma il totale e le
 * parti, con le assenze del dominio).
 */
export function graficoDueParti(titolo: string, parti: readonly [Parte, Parte], tabella: TabellaEquivalente): DatiGrafico {
  const motivo = motivoDueParti(parti);
  if (motivo) return nonDisegnabile(motivo, tabella, []);
  const totale = (parti[0].valore as number) + (parti[1].valore as number);
  const quota = (v: number) => formatPercentuale(percentuale(v, totale));
  const dati = parti.map((p): DatoSerie => {
    const v = p.valore as number;
    return { value: v, name: p.nome, etichetta: quota(v), dettaglio: `${p.nome}: ${milioni(v)} (${quota(v)})` };
  });
  const serie: PieSeriesOption = {
    type: 'pie',
    name: titolo,
    radius: ['52%', '78%'],
    center: ['50%', '45%'],
    itemStyle: { borderColor: COLORI.superficie, borderWidth: 3 },
    label: { formatter: etichettaDato },
    data: dati,
  };
  return {
    opzioni: {
      aria: aria(`${titolo}: ${dati.map((d) => `${d.name} ${d.etichetta}`).join(', ')}.`),
      tooltip: { trigger: 'item', formatter: tooltipDettaglio },
      legend: { bottom: 0 },
      series: [serie],
    },
    tabella,
    omessi: [],
  };
}
