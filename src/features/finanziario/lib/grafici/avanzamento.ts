// avanzamento.ts — grafici dell'avanzamento finanziario (RF003-RF007): flusso della dotazione (sankey), indicatore del
// pagato sulla dotazione, ciambelle di due parti di un totale (quote FEASR, sezioni RF004-RF007). Ogni valore viene dal
// contratto: nessun residuo ricalcolato nel browser. Col perimetro ADA la dotazione (regionale) non si confronta con
// impegni e pagamenti (dell'area): i grafici che li mettono in rapporto non si disegnano.
import type { EChartsOption, GaugeSeriesOption, SankeySeriesOption } from 'echarts';
import type { ImportoLike } from '../../../../entities/importo';
import {
  COLORI,
  NON_CALCOLABILE,
  aria,
  assePercentuale,
  centesimi,
  etichettaDato,
  formatEuro,
  formatPercentuale,
  graficoDueParti,
  milioni,
  nonDisegnabile,
  notaOmessi,
  numeroDi,
  percentuale,
  tooltipDettaglio,
} from '../../../../shared/lib';
import type { DatiGrafico, TabellaEquivalente } from '../../../../shared/lib';
import type { AvanzamentoPagamentiLike, DistribuzioneDotazioneLike, ResiduoSuImpegniLike, ResiduoSuPagamentiLike } from './dto';
import { PERIMETRO_ADA, assenzaImporto, cellaImporto, valoreDi } from './resa';
import { MOTIVO_ADA_RAPPORTO } from './spesa';

type Voce = [string, ImportoLike | null | undefined];

// ---------------------------------------------------------------- 1. flusso della dotazione

const MOTIVO_ADA_FLUSSO = "perimetro ADA: la dotazione è regionale, impegni e pagamenti sono dell'area: il flusso non è confrontabile";

interface Collegamento {
  source: string;
  target: string;
  value: number;
  dettaglio: string;
}

function collegamento(source: string, target: string, value: number): Collegamento {
  return { source, target, value, dettaglio: `${source} → ${target}: ${milioni(value)}` };
}

/** La dotazione del flusso: quella di TX-0006 se valorizzata, altrimenti quella di TX-0007 (stesso dato di programma). */
function dotazioneFlusso(i: ResiduoSuImpegniLike, r: ResiduoSuPagamentiLike): ImportoLike | null | undefined {
  return valoreDi(i.dotazioneSpesaPubblica) != null ? i.dotazioneSpesaPubblica : (r.dotazioneSpesaPubblica ?? i.dotazioneSpesaPubblica);
}

function tabellaFlusso(i: ResiduoSuImpegniLike, p: AvanzamentoPagamentiLike, r: ResiduoSuPagamentiLike): TabellaEquivalente {
  const voci: Voce[] = [
    ['Dotazione', dotazioneFlusso(i, r)],
    ['Impegnato', i.importoImpegnato],
    ['Da impegnare (dotazione residua sugli impegni)', i.dotazioneResidua],
    ['Pagamenti totali sull\'impegnato', p.pagamentiTotali],
    ['Impegnato ancora da pagare', p.impegnatoDaPagare],
    ['Pagamenti al netto delle rettifiche', r.pagamentiNettoRettifiche],
    ['Dotazione residua sui pagamenti', r.dotazioneResidua],
  ];
  return { caption: "Dalla dotazione all'impegnato e al pagato", colonne: ['Voce', 'Importo'], righe: voci.map(([n, x]) => [n, cellaImporto(x, true)]) };
}

/** I rami del flusso: con gli impegni dalla dotazione all'impegnato e al pagato; senza, dalla dotazione al pagato (TX-0007). */
function ramiFlusso(i: ResiduoSuImpegniLike, p: AvanzamentoPagamentiLike, r: ResiduoSuPagamentiLike): { rami: Array<[string, string, ImportoLike | null | undefined]>; omessi: string[] } {
  if (valoreDi(i.importoImpegnato) != null) {
    const rami: Array<[string, string, ImportoLike | null | undefined]> = [
      ['Dotazione', 'Impegnato', i.importoImpegnato],
      ['Dotazione', 'Da impegnare', i.dotazioneResidua],
      ['Impegnato', 'Pagato', p.pagamentiTotali],
      ['Impegnato', 'Da pagare', p.impegnatoDaPagare],
    ];
    return { rami, omessi: [] };
  }
  const omessi = [`Impegnato ${assenzaImporto(i.importoImpegnato, true)}: il ramo dell'impegnato non si disegna`];
  return { rami: [['Dotazione', 'Pagamenti netti', r.pagamentiNettoRettifiche], ['Dotazione', 'Dotazione residua', r.dotazioneResidua]], omessi };
}

function motivoFlusso(rami: ReadonlyArray<[string, string, ImportoLike | null | undefined]>): string | null {
  const [dotazione1, dotazione2] = rami;
  const assenti = [dotazione1, dotazione2].filter(([, , x]) => valoreDi(x) == null);
  if (assenti.length > 0) return `il flusso richiede ${assenti.map(([, t, x]) => `${t.toLowerCase()} (${assenzaImporto(x, true)})`).join(' e ')}`;
  return rami.some(([, , x]) => (valoreDi(x) ?? 0) < 0) ? 'valori negativi: il flusso non si può disegnare' : null;
}

/**
 * Flusso della dotazione. Con gli impegni: dotazione -> impegnato / da impegnare (residuo di TX-0006), impegnato ->
 * pagato / da pagare (TX-0005). Senza impegni (fonte non attiva): dotazione -> pagamenti netti / dotazione residua
 * (TX-0007), con il ramo dell'impegnato dichiarato.
 */
export function graficoSankey(impegni: ResiduoSuImpegniLike, pagamenti: AvanzamentoPagamentiLike, residuo: ResiduoSuPagamentiLike = {}, perimetro?: string | null): DatiGrafico {
  const tabella = tabellaFlusso(impegni, pagamenti, residuo);
  if (perimetro === PERIMETRO_ADA) return nonDisegnabile(MOTIVO_ADA_FLUSSO, tabella, []);
  const { rami, omessi } = ramiFlusso(impegni, pagamenti, residuo);
  const motivo = motivoFlusso(rami);
  if (motivo) return nonDisegnabile(motivo, tabella, omessi);
  const collegamenti = rami.flatMap(([s, t, x]) => {
    const v = valoreDi(x);
    if (v == null) omessi.push(`${t} ${assenzaImporto(x, true)}`);
    return v == null ? [] : [collegamento(s, t, v)];
  });
  // la dotazione del contratto; in sua assenza la somma dei rami che ne escono (il flusso e' comunque disegnabile)
  const dotazione = valoreDi(dotazioneFlusso(impegni, residuo)) ?? centesimi(collegamenti.filter((c) => c.source === 'Dotazione').reduce((a, c) => a + c.value, 0));
  const nomi = [...new Set(collegamenti.flatMap((c) => [c.source, c.target]))];
  const valoreNodo = (n: string) => (n === 'Dotazione' ? dotazione : collegamenti.find((c) => c.target === n)?.value);
  const nodi = nomi.map((n) => ({ name: n, etichetta: `${n}: ${milioni(valoreNodo(n) ?? 0)}`, dettaglio: `${n}: ${milioni(valoreNodo(n) ?? 0)}` }));
  const descrizione = `Flusso della dotazione (${milioni(dotazione)}): ${collegamenti.map((c) => `${c.target.toLowerCase()} ${milioni(c.value)}`).join(', ')}.${notaOmessi(omessi)}`;
  const serie: SankeySeriesOption = { type: 'sankey', name: 'Flusso della dotazione', data: nodi, links: collegamenti, nodeAlign: 'left', emphasis: { focus: 'adjacency' }, lineStyle: { color: 'gradient', curveness: 0.5 }, label: { formatter: etichettaDato } };
  return { opzioni: { aria: aria(descrizione), tooltip: { trigger: 'item', formatter: tooltipDettaglio }, series: [serie] }, tabella, omessi };
}

// ---------------------------------------------------------------- 2. indicatore percentuale

function motivoGauge(p: number | null, t: number | null): string | null {
  if (p == null) return 'valore non disponibile: la percentuale non si può calcolare';
  if (t == null) return 'totale non disponibile: la percentuale non si può calcolare';
  if (t <= 0) return 'totale pari a zero o negativo: la percentuale non si può calcolare';
  return p < 0 ? 'valore negativo: la percentuale non si può calcolare' : null;
}

function serieGauge(titolo: string, valore: number): GaugeSeriesOption {
  return {
    type: 'gauge',
    name: titolo,
    min: 0,
    max: 100,
    startAngle: 200,
    endAngle: -20,
    progress: { show: true, width: 16 },
    itemStyle: { color: COLORI.primario },
    axisLine: { lineStyle: { width: 16, color: [[1, COLORI.neutro]] } },
    pointer: { show: false },
    anchor: { show: false },
    axisTick: { show: false },
    splitLine: { show: false },
    axisLabel: { show: false },
    title: { show: true, offsetCenter: [0, '35%'] },
    detail: { offsetCenter: [0, '-5%'], formatter: assePercentuale },
    data: [{ value: valore, name: titolo }],
  };
}

/** Indicatore 0-100 della parte sul totale; col perimetro ADA (parte dell'area su un totale regionale) non si disegna. */
export function graficoGauge(parte: number | null | undefined, totale: number | null | undefined, titolo: string, perimetro?: string | null): DatiGrafico {
  const tabellaCon = (valore: string) => ({ caption: titolo, colonne: ['Misura', 'Valore'], righe: [[titolo, valore]] });
  if (perimetro === PERIMETRO_ADA) return nonDisegnabile(MOTIVO_ADA_RAPPORTO, tabellaCon('non confrontabile (perimetro ADA)'), []);
  const p = numeroDi(parte);
  const t = numeroDi(totale);
  const motivo = motivoGauge(p, t);
  if (motivo || p == null || t == null) return nonDisegnabile(motivo ?? 'la percentuale non si può calcolare', tabellaCon(NON_CALCOLABILE), []);
  const valore = percentuale(p, t);
  const opzioni: EChartsOption = { aria: aria(`Indicatore da 0 a 100 %: ${titolo} ${formatPercentuale(valore)}.`), series: [serieGauge(titolo, valore)] };
  return { opzioni, tabella: tabellaCon(formatPercentuale(valore)), omessi: [] };
}

// ---------------------------------------------------------------- 3. due parti di un totale

/** Ciambella di due parti di un Importo aggregato; `voci` sono le righe della tabella (di norma il totale e le parti). */
export function graficoPartiImporto(titolo: string, parti: [Voce, Voce], voci: Voce[], aggregato = true): DatiGrafico {
  const tabella = { caption: titolo, colonne: ['Voce', 'Importo'], righe: voci.map(([n, x]) => [n, cellaImporto(x, aggregato)]) };
  const [a, b] = parti.map(([nome, x]) => ({ nome, valore: valoreDi(x), assenza: assenzaImporto(x, aggregato) }));
  return graficoDueParti(titolo, [a, b], tabella);
}

function quotaSullaDotazione(v: number | null, dotazione: number | null): string {
  return v != null && dotazione != null && dotazione > 0 ? formatPercentuale(percentuale(v, dotazione)) : NON_CALCOLABILE;
}

/** Ciambella della dotazione fra quota FEASR e non FEASR; la tabella porta la dotazione del contratto e l'eventuale scarto. */
export function graficoQuotaFeasr(d: DistribuzioneDotazioneLike): DatiGrafico {
  const [dotazione, feasr, nonFeasr] = [valoreDi(d.dotazioneSpesaPubblica), valoreDi(d.quotaFeasr), valoreDi(d.quotaNonFeasr)];
  const righe = [
    ['Dotazione spesa pubblica', cellaImporto(d.dotazioneSpesaPubblica, true), dotazione != null && dotazione > 0 ? formatPercentuale(100) : NON_CALCOLABILE],
    ['Quota FEASR', cellaImporto(d.quotaFeasr, true), quotaSullaDotazione(feasr, dotazione)],
    ['Quota non FEASR', cellaImporto(d.quotaNonFeasr, true), quotaSullaDotazione(nonFeasr, dotazione)],
  ];
  const scarto = dotazione != null && feasr != null && nonFeasr != null ? centesimi(dotazione - feasr - nonFeasr) : null;
  if (scarto) {
    righe.push(['Scarto fra la dotazione e la somma delle quote', formatEuro(scarto), quotaSullaDotazione(scarto, dotazione)]);
    // con uno scarto le percentuali della ciambella (sulla somma delle quote) non coincidono con quelle della tabella
    righe.push(['Nota', 'il grafico ripartisce la somma delle due quote, la tabella le confronta con la dotazione']);
  }
  const tabella = { caption: 'Dotazione: quota FEASR e quota non FEASR', colonne: ['Voce', 'Importo', 'Sulla dotazione'], righe };
  const parti = [
    { nome: 'Quota FEASR', valore: feasr, assenza: assenzaImporto(d.quotaFeasr, true) },
    { nome: 'Quota non FEASR', valore: nonFeasr, assenza: assenzaImporto(d.quotaNonFeasr, true) },
  ] as const;
  return graficoDueParti('Dotazione tra quota FEASR e quota non FEASR', [parti[0], parti[1]], tabella);
}
