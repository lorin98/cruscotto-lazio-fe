// spesa.ts — grafici della spesa per intervento (TX-0002, TX-0011): avanzamento del pagato sulla dotazione, dotazione
// per famiglia di intervento, contributo ambientale, dotazione e pagato affiancati. I dati per intervento portano il
// codice (drill-down). Col perimetro ADA la dotazione (regionale) non si confronta con i pagamenti (dell'area).
import type { BarSeriesOption, EChartsOption, SunburstSeriesOption, TreemapSeriesOption } from 'echarts';
import type { ImportoLike } from '../../../../entities/importo';
import {
  COLORI,
  NON_CALCOLABILE,
  NON_DISPONIBILE,
  arrotonda1,
  aria,
  assePercentuale,
  barreRaggruppate,
  confronta,
  etichettaDato,
  formatEuro,
  formatPercentuale,
  milioni,
  nonDisegnabile,
  notaOmessi,
  numeroDi,
  plurale,
  sommaCentesimi,
  tooltipDettaglio,
  zoomSeMolti,
} from '../../../../shared/lib';
import type { DatiGrafico, DatoSerie, TabellaEquivalente } from '../../../../shared/lib';
import { famigliaDi } from '../famiglie';
import { avanzamentoPonderato, esclusione } from '../avanzamento';
import type { InterventoAvanzamento } from '../avanzamento';
import type { RigaSpesa } from '../dto';
import { cellaImporto, codiceDi, problemaDotazione, valoreDi } from '../importi';
import { PERIMETRO_ADA } from '../perimetro';

export const MOTIVO_ADA_RAPPORTO = "perimetro ADA: la dotazione è regionale, i pagamenti sono dell'area: il rapporto non è confrontabile";

// ---------------------------------------------------------------- 1. avanzamento per intervento

const CAPTION_AVANZAMENTO = 'Pagato sulla dotazione di spesa pubblica per intervento';
const COLONNE_AVANZAMENTO = ['Intervento', 'Dotazione', 'Pagato', 'Pagato sulla dotazione'];

/** Colore della quota pagata sulla dotazione: >= 50% positivo, >= 30% primario, altrimenti attenzione. */
function coloreQuota(quota: number): string {
  if (quota >= 0.5) return COLORI.positivo;
  return quota >= 0.3 ? COLORI.primario : COLORI.attenzione;
}

function datoAvanzamento(x: InterventoAvanzamento): DatoSerie {
  const valore = arrotonda1(x.quota * 100);
  const etichetta = formatPercentuale(valore);
  return { value: valore, name: x.codice, codice: x.codice, etichetta, dettaglio: `${x.codice}: ${etichetta} della dotazione (pagato ${milioni(x.pagato)} su ${milioni(x.dotazione)})`, itemStyle: { color: coloreQuota(x.quota) } };
}

function descrizioneAvanzamento(dati: readonly DatoSerie[], media: number, omessi: readonly string[]): string {
  const prima = dati[0];
  const ultima = dati[dati.length - 1];
  const estremi = dati.length === 1 ? `${prima.name} ${prima.etichetta}` : `dalla quota più alta, ${prima.name} ${prima.etichetta}, alla più bassa, ${ultima.name} ${ultima.etichetta}`;
  return `Barre orizzontali del pagato sulla dotazione per ${plurale(dati.length, 'intervento', 'interventi')}: ${estremi}; media ponderata ${formatPercentuale(media)}.${notaOmessi(omessi)}`;
}

function opzioniAvanzamento(dati: DatoSerie[], media: number, omessi: readonly string[]): EChartsOption {
  const massimo = Math.max(100, Math.ceil(Math.max(...dati.map((d) => d.value)) / 10) * 10);
  const serie: BarSeriesOption = {
    type: 'bar',
    name: 'Pagato sulla dotazione',
    data: dati,
    label: { show: true, position: 'right', formatter: etichettaDato },
    markLine: {
      silent: true,
      symbol: 'none',
      lineStyle: { color: COLORI.scuro, type: 'dashed' },
      // in cima alla linea, non sull'asse: non si sovrappone alle etichette delle percentuali
      label: { formatter: `Media ponderata ${formatPercentuale(media)}`, position: 'insideEndTop', color: COLORI.scuro, fontWeight: 600 },
      data: [{ name: 'Media ponderata', xAxis: media }],
    },
  };
  return {
    aria: aria(descrizioneAvanzamento(dati, media, omessi)),
    tooltip: { trigger: 'item', formatter: tooltipDettaglio },
    xAxis: { type: 'value', min: 0, max: massimo, axisLabel: { formatter: assePercentuale } },
    yAxis: { type: 'category', inverse: true, data: dati.map((d) => d.name) },
    series: [serie],
  };
}

/** Righe della tabella fuori dal grafico: tutte col perimetro ADA, altrimenti quelle escluse (decise riga per riga). */
function righeOmesseAvanzamento(righe: readonly RigaSpesa[], ada: boolean): string[][] {
  const esito = ada ? 'non confrontabile (perimetro ADA)' : NON_CALCOLABILE;
  return righe.filter((r) => ada || esclusione(r) != null).map((r) => [codiceDi(r), cellaImporto(r.dotazioneSpesaPubblica), cellaImporto(r.pagamentiTotali), esito]);
}

/** Barre orizzontali del pagato sulla dotazione per intervento, dalla quota maggiore, con la media ponderata. */
export function graficoAvanzamento(righe: RigaSpesa[], perimetro?: string | null): DatiGrafico {
  if (perimetro === PERIMETRO_ADA) {
    return nonDisegnabile(MOTIVO_ADA_RAPPORTO, { caption: CAPTION_AVANZAMENTO, colonne: COLONNE_AVANZAMENTO, righe: righeOmesseAvanzamento(righe, true) }, []);
  }
  const a = avanzamentoPonderato(righe);
  const omesse = righeOmesseAvanzamento(righe, false);
  if (a.media == null) {
    return nonDisegnabile('nessun intervento con dotazione e pagato valorizzati', { caption: CAPTION_AVANZAMENTO, colonne: COLONNE_AVANZAMENTO, righe: omesse }, a.omessi);
  }
  const dati = a.incluse.map(datoAvanzamento);
  const tabella: TabellaEquivalente = {
    caption: CAPTION_AVANZAMENTO,
    colonne: COLONNE_AVANZAMENTO,
    righe: [
      ...a.incluse.map((x, k) => [x.codice, formatEuro(x.dotazione), formatEuro(x.pagato), formatPercentuale(dati[k].value)]),
      ...omesse,
      ['Media ponderata degli interventi nel grafico', formatEuro(a.totaleDotazione), formatEuro(a.totalePagato), formatPercentuale(a.media)],
    ],
  };
  return { opzioni: opzioniAvanzamento(dati, a.media, a.omessi), tabella, omessi: a.omessi };
}

// ---------------------------------------------------------------- 2. dotazione per famiglia di intervento

interface Famiglia {
  nome: string;
  totale: number;
  foglie: Array<{ codice: string; dotazione: number }>;
}

interface NodoAlbero {
  name: string;
  value: number;
  codice?: string;
  etichetta: string;
  dettaglio: string;
  children?: NodoAlbero[];
}

function raggruppaFamiglie(righe: readonly RigaSpesa[]) {
  const perFamiglia = new Map<string, Famiglia['foglie']>();
  const righeOmesse: string[][] = [];
  const omessi: string[] = [];
  for (const r of righe) {
    const codice = codiceDi(r);
    const famiglia = famigliaDi(r.codiceIntervento ?? '');
    const problema = problemaDotazione(r.dotazioneSpesaPubblica);
    if (problema) {
      omessi.push(`${codice}: ${problema}`);
      righeOmesse.push([famiglia, codice, cellaImporto(r.dotazioneSpesaPubblica)]);
      continue;
    }
    perFamiglia.set(famiglia, [...(perFamiglia.get(famiglia) ?? []), { codice, dotazione: valoreDi(r.dotazioneSpesaPubblica) as number }]);
  }
  const famiglie: Famiglia[] = [...perFamiglia]
    .map(([nome, foglie]) => ({ nome, totale: sommaCentesimi(foglie.map((f) => f.dotazione)), foglie: [...foglie].sort((a, b) => b.dotazione - a.dotazione || confronta(a.codice, b.codice)) }))
    .sort((a, b) => b.totale - a.totale || confronta(a.nome, b.nome));
  return { famiglie, righeOmesse, omessi };
}

function nodoFamiglia(f: Famiglia): NodoAlbero {
  return {
    name: f.nome,
    value: f.totale,
    etichetta: `${f.nome}\n${milioni(f.totale)}`,
    dettaglio: `Famiglia ${f.nome}: ${plurale(f.foglie.length, 'intervento', 'interventi')}, dotazione ${milioni(f.totale)}`,
    children: f.foglie.map((x) => ({ name: x.codice, value: x.dotazione, codice: x.codice, etichetta: `${x.codice}\n${milioni(x.dotazione)}`, dettaglio: `${x.codice} (famiglia ${f.nome}): dotazione ${milioni(x.dotazione)}` })),
  };
}

function serieFamiglie(nodi: NodoAlbero[], forma: 'treemap' | 'sunburst'): TreemapSeriesOption | SunburstSeriesOption {
  return forma === 'treemap'
    ? { type: 'treemap', name: 'Dotazione', data: nodi, nodeClick: 'zoomToNode', leafDepth: 1, roam: false, breadcrumb: { show: true }, label: { show: true, formatter: etichettaDato } }
    : { type: 'sunburst', name: 'Dotazione', data: nodi, nodeClick: 'rootToNode', radius: ['12%', '90%'], label: { formatter: '{b}' } };
}

/** Gerarchia famiglia -> intervento della dotazione (treemap con zoom o raggiera); le foglie portano il codice. */
export function graficoFamiglie(righe: RigaSpesa[], forma: 'treemap' | 'sunburst' = 'treemap'): DatiGrafico {
  const { famiglie, righeOmesse, omessi } = raggruppaFamiglie(righe);
  const righeTabella = [...famiglie.flatMap((f) => [...f.foglie.map((x) => [f.nome, x.codice, formatEuro(x.dotazione)]), [f.nome, 'Totale della famiglia', formatEuro(f.totale)]]), ...righeOmesse];
  const tabella = { caption: 'Dotazione di spesa pubblica per famiglia e intervento', colonne: ['Famiglia', 'Intervento', 'Dotazione'], righe: righeTabella };
  if (famiglie.length === 0) return nonDisegnabile('nessun intervento con dotazione valorizzata e positiva', tabella, omessi);
  const interventi = famiglie.reduce((n, f) => n + f.foglie.length, 0);
  const tipo = forma === 'treemap' ? 'Mappa ad albero' : 'Grafico a raggiera';
  const descrizione =
    `${tipo} della dotazione di spesa pubblica per famiglia di intervento: ${plurale(famiglie.length, 'famiglia', 'famiglie')} e ` +
    `${plurale(interventi, 'intervento', 'interventi')}; la famiglia con la dotazione maggiore è ${famiglie[0].nome} (${milioni(famiglie[0].totale)}).${notaOmessi(omessi)}`;
  const opzioni: EChartsOption = { aria: aria(descrizione), tooltip: { trigger: 'item', formatter: tooltipDettaglio }, series: [serieFamiglie(famiglie.map(nodoFamiglia), forma)] };
  return { opzioni, tabella, omessi };
}

// ---------------------------------------------------------------- 3. contributo ambientale

/** Barre della percentuale di contributo ambientale per intervento (asse 0-100%); le assenti sono omesse. */
export function graficoContributo(righe: RigaSpesa[]): DatiGrafico {
  const caption = 'Contributo ambientale per intervento';
  const valori = righe.map((r) => ({ codice: codiceDi(r), v: numeroDi(r.percentualeContributoAmbientale) }));
  const tabella = { caption, colonne: ['Intervento', 'Contributo ambientale'], righe: valori.map((x) => [x.codice, x.v == null ? NON_DISPONIBILE : formatPercentuale(x.v)]) };
  const omessi = valori.filter((x) => x.v == null).map((x) => `${x.codice}: contributo ambientale ${NON_DISPONIBILE}`);
  const dati = valori.flatMap((x): DatoSerie[] => (x.v == null ? [] : [{ value: x.v, name: x.codice, codice: x.codice, etichetta: formatPercentuale(x.v), dettaglio: `${x.codice}: contributo ambientale ${formatPercentuale(x.v)}` }]));
  if (dati.length === 0) return nonDisegnabile('nessun intervento con il contributo ambientale valorizzato', tabella, omessi);
  const descrizione = `Barre del contributo ambientale per ${plurale(dati.length, 'intervento', 'interventi')}, in percentuale: ${dati.map((x) => `${x.name} ${x.etichetta}`).join(', ')}.${notaOmessi(omessi)}`;
  const opzioni: EChartsOption = {
    aria: aria(descrizione),
    tooltip: { trigger: 'item', formatter: tooltipDettaglio },
    ...zoomSeMolti(dati.length),
    xAxis: { type: 'category', data: dati.map((x) => x.name), axisLabel: { interval: 0, rotate: dati.length > 8 ? 45 : 0 } },
    yAxis: { type: 'value', min: 0, max: 100, axisLabel: { formatter: assePercentuale } },
    series: [{ type: 'bar', name: 'Contributo ambientale', data: dati, itemStyle: { color: COLORI.positivo } }],
  };
  return { opzioni, tabella, omessi };
}

// ---------------------------------------------------------------- 4. dotazione e pagato per intervento

const INTERVENTI: [string, string] = ['intervento', 'interventi'];
const OMESSO_ADA_DOTAZIONE = "perimetro ADA: la dotazione regionale non si affianca ai pagamenti dell'area";

export interface RigaDotazionePagato {
  codiceIntervento?: string;
  dotazione?: ImportoLike | null;
  pagato?: ImportoLike | null;
}

function voce(r: RigaDotazionePagato, importi: Array<ImportoLike | null | undefined>) {
  const codice = codiceDi(r);
  return { categoria: codice, codice, valori: importi.map(valoreDi), celle: importi.map((i) => cellaImporto(i)) };
}

/**
 * Barre raggruppate dotazione / pagato per intervento; nel perimetro ADA solo il pagato. `nomePagato` dice quale
 * pagato e': i pagamenti totali (TX-0002) o i pagamenti al netto delle rettifiche (TX-0011), mai l'uno per l'altro.
 */
export function graficoDotazionePagamenti(righe: RigaDotazionePagato[], perimetro?: string | null, nomePagato = 'Pagamenti totali'): DatiGrafico {
  const pagato = { nome: nomePagato, soggetto: nomePagato.toLowerCase() };
  if (perimetro === PERIMETRO_ADA) {
    const testi = { caption: `${nomePagato} per intervento`, colonne: ['Intervento', nomePagato], titolo: `Barre dei ${pagato.soggetto}`, vuoto: `nessun intervento con ${pagato.soggetto} valorizzati`, unita: INTERVENTI };
    return barreRaggruppate(righe.map((r) => voce(r, [r.pagato])), [pagato], testi, [OMESSO_ADA_DOTAZIONE]);
  }
  const testi = { caption: `Dotazione e ${pagato.soggetto} per intervento`, colonne: ['Intervento', 'Dotazione', nomePagato], titolo: `Barre raggruppate di dotazione e ${pagato.soggetto}`, vuoto: `nessun intervento con dotazione o ${pagato.soggetto} valorizzati`, unita: INTERVENTI };
  return barreRaggruppate(righe.map((r) => voce(r, [r.dotazione, r.pagato])), [{ nome: 'Dotazione', soggetto: 'dotazione' }, pagato], testi);
}
