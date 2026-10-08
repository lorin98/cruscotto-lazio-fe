// grafici.ts — builder PURI delle opzioni ECharts dei report del finanziario (UI v2): zero React, zero client generato
// (i DTO sono tipizzati con interfacce strutturali minime, con i nomi dei campi del contratto). Ogni builder ritorna:
// - le opzioni del grafico, oppure null con il motivo leggibile (motivoAssenza);
// - la tabella equivalente, SEMPRE presente, con gli stessi valori gia' formattati in italiano (euro pieni);
// - le voci omesse dal grafico, con il motivo.
// Regola di resa: un importo assente non diventa mai uno zero: si omette dal grafico e si dichiara.
// Deterministiche: niente orologio ne' casualita'; i callback delle opzioni (etichette, tooltip) leggono testi gia'
// composti nel dato. Per il drill-down i dati per intervento portano il codice (name e codice del dato).
import type {
  BarSeriesOption,
  DataZoomComponentOption,
  EChartsOption,
  FunnelSeriesOption,
  GaugeSeriesOption,
  LineSeriesOption,
  PieSeriesOption,
  SankeySeriesOption,
  SunburstSeriesOption,
  TreemapSeriesOption,
} from 'echarts';
import { etichettaFonte } from '../../../entities/importo';
import type { ImportoLike } from '../../../entities/importo';
import { formatEuro, formatNumber, formatPercentuale } from '../../../shared/lib';
import { famigliaDi } from './famiglie';
import { NON_DISPONIBILE } from './formato';

// ---------------------------------------------------------------- contratto

/** Alternativa testuale del grafico: gli stessi valori, gia' formattati in italiano. */
export interface TabellaEquivalente {
  caption: string;
  colonne: string[];
  righe: string[][];
}

export interface Grafico {
  /** null = grafico non disegnabile (il motivo e' in motivoAssenza). */
  opzioni: EChartsOption | null;
  /** Presente quando opzioni e' null: frase leggibile. */
  motivoAssenza?: string;
  /** Sempre presente, anche quando il grafico non si disegna (con i valori che ci sono). */
  tabella: TabellaEquivalente;
  /** Voci omesse dal grafico, leggibili: es. "SRA03: dotazione non disponibile (fonte non attiva)". */
  omessi: string[];
}

/** Colori semantici. Le serie generiche usano la palette del tema. */
export const COLORI = {
  primario: '#0066cc',
  scuro: '#0b2d4e',
  positivo: '#4e8a1f',
  attenzione: '#b26b00',
  neutro: '#c9d3de',
} as const;

// ---------------------------------------------------------------- forme dei DTO (campi come nel contratto)

/** Riga di SpesaPerIntervento (TX-0002). */
export interface RigaSpesa {
  codiceIntervento?: string;
  dotazioneSpesaPubblica?: ImportoLike | null;
  pagamentiTotali?: ImportoLike | null;
  percentualeContributoAmbientale?: number | null;
}

/** Riga di RiepilogoFinanziario (TX-0011). */
export interface RigaRiepilogo {
  codiceIntervento?: string;
  dotazioneSpesaPubblica?: ImportoLike | null;
  risorseQuotaFeasr?: ImportoLike | null;
  importoStanziato?: ImportoLike | null;
  impegnatoCofinanziatoFeasr?: ImportoLike | null;
  impegnatoCofinanziatoFeasrENon?: ImportoLike | null;
  pagamentiNettoRettifiche?: ImportoLike | null;
  dotazioneResiduaSuImpegni?: ImportoLike | null;
  dotazioneResiduaSuPagamenti?: ImportoLike | null;
}

/** Riga di DomandePerAnno (TX-0008): annoRaccolta null per le domande senza campagna. */
export interface RigaDomandeAnno {
  annoRaccolta?: number | null;
  primaAnnualita?: number | null;
  altreAnnualita?: number | null;
  nonClassificate?: number | null;
  totali?: number | null;
}

/** Riga di ImportiPerAnno (TX-0010). */
export interface RigaImportiAnno {
  annoRaccolta?: number | null;
  importoAmmesso?: ImportoLike | null;
  importoDecretato?: ImportoLike | null;
}

/** DomandeSigc (TX-0012). */
export interface DomandeSigcLike {
  presentate?: number | null;
  pagate?: number | null;
  daPagare?: number | null;
}

/** ImportiSigc (TX-0013). */
export interface ImportiSigcLike {
  richiesto?: ImportoLike | null;
  ammesso?: ImportoLike | null;
  pagato?: ImportoLike | null;
  ancoraDaPagare?: ImportoLike | null;
}

/** ResiduoSuImpegni (TX-0006). */
export interface ResiduoSuImpegniLike {
  dotazioneSpesaPubblica?: ImportoLike | null;
  importoImpegnato?: ImportoLike | null;
}

/** AvanzamentoPagamenti (TX-0005). */
export interface AvanzamentoPagamentiLike {
  pagamentiTotali?: ImportoLike | null;
  impegnatoDaPagare?: ImportoLike | null;
}

/** DistribuzioneDotazione (TX-0003). */
export interface DistribuzioneDotazioneLike {
  quotaFeasr?: ImportoLike | null;
  quotaNonFeasr?: ImportoLike | null;
}

/** MonitoraggioRiserva (TX-0014): utilizzo progressivo con data ISO AAAA-MM-GG. */
export interface RiservaLike {
  importoAccumulato?: number | null;
  utilizzoProgressivo?: Array<{ data?: string | null; importo?: number | null; cumulato?: number | null }> | null;
}

/** Riga di VerificaSmp (TX-0015). */
export interface RigaSmp {
  codiceIntervento?: string;
  previsionePagamentoEsercizio?: ImportoLike | null;
  spesaErogataCampagnaPrecedente?: ImportoLike | null;
}

// ---------------------------------------------------------------- formati e utilita'

/** Importo in milioni di euro con una cifra decimale, per assi, tooltip ed etichette: 12345678 -> "12,3 M€". */
export function milioni(v: number): string {
  return `${(v / 1_000_000).toLocaleString('it-IT', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} M€`;
}

// stessa etichetta della tabella di dettaglio (lib/formato.ts, annoDiRaccolta)
const SENZA_ANNO = 'senza campagna';
const SENZA_CODICE = 'Senza codice';
const NON_CALCOLABILE = 'non calcolabile';
const PERIMETRO_ADA = 'ADA';
/** Oltre questo numero di interventi le barre si scorrono (dataZoom). */
const MAX_BARRE_VISIBILI = 12;

function numeroDi(v: number | null | undefined): number | null {
  return typeof v === 'number' && Number.isFinite(v) ? v : null;
}

function valoreDi(importo: ImportoLike | null | undefined): number | null {
  return numeroDi(importo?.valore);
}

function motivoDi(importo: ImportoLike | null | undefined): string | null {
  switch (importo?.motivo) {
    case 'FONTE_NON_ATTIVA':
      // la fonte attesa, se il backend la dichiara (come nelle tabelle dei report: "fonte impegni non attiva")
      return importo.fonte ? `fonte ${etichettaFonte(importo.fonte)} non attiva` : 'fonte non attiva';
    case 'NON_VALORIZZATO':
      return 'non valorizzato';
    case 'FUORI_PERIMETRO':
      return 'fuori perimetro';
    default:
      return null;
  }
}

/** "non disponibile (fonte non attiva)"; solo "non disponibile" se il motivo non e' noto. */
function nonDisponibile(importo: ImportoLike | null | undefined): string {
  const motivo = motivoDi(importo);
  return motivo ? `${NON_DISPONIBILE} (${motivo})` : NON_DISPONIBILE;
}

/** Cella di tabella di un Importo: euro pieni, oppure l'assenza con il motivo (mai uno zero). */
function cellaImporto(importo: ImportoLike | null | undefined): string {
  const v = valoreDi(importo);
  return v == null ? nonDisponibile(importo) : formatEuro(v);
}

function cellaNumero(v: number | null | undefined): string {
  const n = numeroDi(v);
  return n == null ? NON_DISPONIBILE : formatNumber(n);
}

/** Cella di un importo in euro che non e' un Importo (numero semplice): assente = "non disponibile". */
function cellaEuro(v: number | null | undefined): string {
  const n = numeroDi(v);
  return n == null ? NON_DISPONIBILE : formatEuro(n);
}

function minuscolaIniziale(testo: string): string {
  return testo.charAt(0).toLowerCase() + testo.slice(1);
}

function centesimi(v: number): number {
  return Math.round(v * 100) / 100;
}

function arrotonda1(v: number): number {
  return Math.round(v * 10) / 10;
}

/** Percentuale (0-100) a una cifra decimale. */
function percentuale(parte: number, totale: number): number {
  return arrotonda1((parte / totale) * 100);
}

function somma(valori: number[]): number {
  return centesimi(valori.reduce((acc, v) => acc + v, 0));
}

function plurale(n: number, singolare: string, plurale: string): string {
  return `${formatNumber(n)} ${n === 1 ? singolare : plurale}`;
}

/** Confronto fra stringhe indipendente dal locale (ordinamenti deterministici). */
function confronta(a: string, b: string): number {
  if (a < b) return -1;
  return a > b ? 1 : 0;
}

function codiceDi(riga: { codiceIntervento?: string | null }): string {
  const codice = riga.codiceIntervento?.trim();
  return codice ? codice : SENZA_CODICE;
}

function annoDi(anno: number | null | undefined): string {
  return anno == null ? SENZA_ANNO : String(anno);
}

/** Righe in ordine di anno di raccolta crescente, quelle senza anno in coda (ordinamento stabile). */
function perAnno<T extends { annoRaccolta?: number | null }>(righe: readonly T[]): T[] {
  return [...righe].sort((a, b) => {
    const x = a.annoRaccolta;
    const y = b.annoRaccolta;
    if (x == null) return y == null ? 0 : 1;
    return y == null ? -1 : x - y;
  });
}

/** Data ISO AAAA-MM-GG come GG/MM/AAAA, senza passare dal fuso orario; un formato diverso resta com'e'. */
function dataItaliana(iso: string): string {
  const parti = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  return parti ? `${parti[3]}/${parti[2]}/${parti[1]}` : iso;
}

/** Problema della dotazione come base di un grafico (assente, zero, negativa), null se e' utilizzabile. */
function problemaDotazione(importo: ImportoLike | null | undefined): string | null {
  const v = valoreDi(importo);
  if (v == null) return `dotazione ${nonDisponibile(importo)}`;
  if (v === 0) return 'dotazione pari a zero';
  if (v < 0) return 'dotazione negativa';
  return null;
}

function notaOmessi(omessi: string[]): string {
  return omessi.length > 0 ? ` ${plurale(omessi.length, 'voce omessa', 'voci omesse')} per dati mancanti o non utilizzabili.` : '';
}

function aria(description: string): EChartsOption['aria'] {
  return { enabled: true, label: { description } };
}

function nonDisegnabile(motivoAssenza: string, tabella: TabellaEquivalente, omessi: string[]): Grafico {
  return { opzioni: null, motivoAssenza, tabella, omessi };
}

/** Scorrimento delle barre quando gli interventi sono piu' di MAX_BARRE_VISIBILI (se ne mostrano MAX_BARRE_VISIBILI). */
function zoomSeMolti(n: number): { dataZoom?: DataZoomComponentOption[] } {
  if (n <= MAX_BARRE_VISIBILI) return {};
  const finestra = { xAxisIndex: 0, startValue: 0, endValue: MAX_BARRE_VISIBILI - 1 };
  return { dataZoom: [{ type: 'inside', ...finestra }, { type: 'slider', ...finestra }] };
}

// ---------------------------------------------------------------- dati e callback

/** Dato di una serie: porta i testi gia' composti per etichetta e tooltip e, se e' un intervento, il codice. */
interface DatoSerie {
  value: number;
  name: string;
  codice?: string;
  etichetta?: string;
  dettaglio?: string;
  itemStyle?: { color: string };
}

function campoTesto(p: unknown, campo: 'etichetta' | 'dettaglio'): string | null {
  if (typeof p !== 'object' || p === null) return null;
  const dato: unknown = (p as { data?: unknown }).data;
  if (typeof dato !== 'object' || dato === null) return null;
  const testo: unknown = (dato as Record<string, unknown>)[campo];
  return typeof testo === 'string' ? testo : null;
}

function nomeDi(p: unknown): string {
  if (typeof p !== 'object' || p === null) return '';
  const nome: unknown = (p as { name?: unknown }).name;
  return typeof nome === 'string' ? nome : '';
}

const ENTITA_HTML: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

/** Il tooltip di ECharts e' HTML: il testo del dato (codici dal backend) entra con i caratteri speciali codificati. */
function testoHtml(testo: string): string {
  return testo.replace(/[&<>"']/g, (c) => ENTITA_HTML[c] ?? c);
}

function tooltipDettaglio(p: unknown): string {
  return testoHtml(campoTesto(p, 'dettaglio') ?? nomeDi(p));
}

function etichettaDato(p: unknown): string {
  return campoTesto(p, 'etichetta') ?? nomeDi(p);
}

function valoreInMilioni(v: unknown): string {
  return typeof v === 'number' ? milioni(v) : NON_DISPONIBILE;
}

function valoreInNumero(v: unknown): string {
  return typeof v === 'number' ? formatNumber(v) : NON_DISPONIBILE;
}

function assePercentuale(v: number): string {
  return formatPercentuale(v);
}

function asseMilioni(v: number): string {
  return milioni(v);
}

// ---------------------------------------------------------------- 1. avanzamento per intervento

const MOTIVO_ADA_AVANZAMENTO = "Perimetro ADA: la dotazione è regionale, i pagamenti sono dell'area: la quota non è confrontabile";
const MOTIVO_ADA_GAUGE = "Perimetro ADA: la dotazione è regionale, i pagamenti sono dell'area: la percentuale non è confrontabile";

/** Colore della quota pagata sulla dotazione: >= 50% positivo, >= 30% primario, altrimenti attenzione. */
function coloreQuota(quota: number): string {
  if (quota >= 0.5) return COLORI.positivo;
  if (quota >= 0.3) return COLORI.primario;
  return COLORI.attenzione;
}

/** Barre orizzontali del pagato sulla dotazione per intervento, dalla quota maggiore, con la media ponderata. */
export function graficoAvanzamento(righe: RigaSpesa[], perimetro?: string | null): Grafico {
  const caption = 'Pagato sulla dotazione di spesa pubblica per intervento';
  const colonne = ['Intervento', 'Dotazione', 'Pagato', 'Pagato sulla dotazione'];
  if (perimetro === PERIMETRO_ADA) {
    const righeAda = righe.map((r) => [
      codiceDi(r),
      cellaImporto(r.dotazioneSpesaPubblica),
      cellaImporto(r.pagamentiTotali),
      'non confrontabile (perimetro ADA)',
    ]);
    return nonDisegnabile(MOTIVO_ADA_AVANZAMENTO, { caption, colonne, righe: righeAda }, []);
  }

  const incluse: Array<{ codice: string; dotazione: number; pagato: number; quota: number }> = [];
  const righeOmesse: string[][] = [];
  const omessi: string[] = [];
  for (const r of righe) {
    const codice = codiceDi(r);
    const dotazione = valoreDi(r.dotazioneSpesaPubblica);
    const pagato = valoreDi(r.pagamentiTotali);
    const problemi: string[] = [];
    const problema = problemaDotazione(r.dotazioneSpesaPubblica);
    if (problema) problemi.push(problema);
    if (pagato == null) problemi.push(`pagato ${nonDisponibile(r.pagamentiTotali)}`);
    if (dotazione == null || dotazione <= 0 || pagato == null) {
      omessi.push(`${codice}: ${problemi.join(', ')}`);
      righeOmesse.push([codice, cellaImporto(r.dotazioneSpesaPubblica), cellaImporto(r.pagamentiTotali), NON_CALCOLABILE]);
      continue;
    }
    incluse.push({ codice, dotazione, pagato, quota: pagato / dotazione });
  }
  if (incluse.length === 0) {
    return nonDisegnabile('Nessun intervento con dotazione e pagato valorizzati', { caption, colonne, righe: righeOmesse }, omessi);
  }

  incluse.sort((a, b) => b.quota - a.quota || confronta(a.codice, b.codice));
  const totaleDotazione = somma(incluse.map((x) => x.dotazione));
  const totalePagato = somma(incluse.map((x) => x.pagato));
  const media = percentuale(totalePagato, totaleDotazione);
  const dati: DatoSerie[] = incluse.map((x) => {
    const valore = arrotonda1(x.quota * 100);
    return {
      value: valore,
      name: x.codice,
      codice: x.codice,
      etichetta: formatPercentuale(valore),
      dettaglio: `${x.codice}: ${formatPercentuale(valore)} della dotazione (pagato ${milioni(x.pagato)} su ${milioni(x.dotazione)})`,
      itemStyle: { color: coloreQuota(x.quota) },
    };
  });
  const massimo = Math.max(100, Math.ceil(Math.max(...dati.map((d) => d.value)) / 10) * 10);
  const prima = dati[0];
  const ultima = dati[dati.length - 1];
  const estremi =
    dati.length === 1
      ? `${prima.name} ${prima.etichetta}`
      : `dalla quota più alta, ${prima.name} ${prima.etichetta}, alla più bassa, ${ultima.name} ${ultima.etichetta}`;
  const descrizione =
    `Barre orizzontali del pagato sulla dotazione per ${plurale(dati.length, 'intervento', 'interventi')}: ${estremi}; ` +
    `media ponderata ${formatPercentuale(media)}.${notaOmessi(omessi)}`;

  const serie: BarSeriesOption[] = [
    {
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
    },
  ];
  const opzioni: EChartsOption = {
    aria: aria(descrizione),
    tooltip: { trigger: 'item', formatter: tooltipDettaglio },
    xAxis: { type: 'value', min: 0, max: massimo, axisLabel: { formatter: assePercentuale } },
    yAxis: { type: 'category', inverse: true, data: dati.map((d) => d.name) },
    series: serie,
  };
  const righeTabella = [
    ...incluse.map((x, k) => [x.codice, formatEuro(x.dotazione), formatEuro(x.pagato), formatPercentuale(dati[k].value)]),
    ...righeOmesse,
    ['Media ponderata degli interventi nel grafico', formatEuro(totaleDotazione), formatEuro(totalePagato), formatPercentuale(media)],
  ];
  return { opzioni, tabella: { caption, colonne, righe: righeTabella }, omessi };
}

// ---------------------------------------------------------------- 2. dotazione per famiglia di intervento

interface NodoAlbero {
  name: string;
  value: number;
  codice?: string;
  etichetta: string;
  dettaglio: string;
  children?: NodoAlbero[];
}

/** Gerarchia famiglia -> intervento della dotazione (treemap con zoom o raggiera); le foglie portano il codice. */
export function graficoFamiglie(righe: RigaSpesa[], forma: 'treemap' | 'sunburst' = 'treemap'): Grafico {
  const caption = 'Dotazione di spesa pubblica per famiglia e intervento';
  const colonne = ['Famiglia', 'Intervento', 'Dotazione'];
  const perFamiglia = new Map<string, Array<{ codice: string; dotazione: number }>>();
  const righeOmesse: string[][] = [];
  const omessi: string[] = [];
  for (const r of righe) {
    const codice = codiceDi(r);
    const famiglia = famigliaDi(r.codiceIntervento ?? '');
    const dotazione = valoreDi(r.dotazioneSpesaPubblica);
    const problema = problemaDotazione(r.dotazioneSpesaPubblica);
    if (problema || dotazione == null) {
      omessi.push(`${codice}: ${problema ?? NON_DISPONIBILE}`);
      righeOmesse.push([famiglia, codice, cellaImporto(r.dotazioneSpesaPubblica)]);
      continue;
    }
    const foglie = perFamiglia.get(famiglia) ?? [];
    foglie.push({ codice, dotazione });
    perFamiglia.set(famiglia, foglie);
  }
  const famiglie = [...perFamiglia]
    .map(([nome, foglie]) => ({
      nome,
      totale: somma(foglie.map((f) => f.dotazione)),
      foglie: [...foglie].sort((a, b) => b.dotazione - a.dotazione || confronta(a.codice, b.codice)),
    }))
    .sort((a, b) => b.totale - a.totale || confronta(a.nome, b.nome));
  const righeTabella = [
    ...famiglie.flatMap((f) => [
      ...f.foglie.map((x) => [f.nome, x.codice, formatEuro(x.dotazione)]),
      [f.nome, 'Totale della famiglia', formatEuro(f.totale)],
    ]),
    ...righeOmesse,
  ];
  const tabella = { caption, colonne, righe: righeTabella };
  if (famiglie.length === 0) return nonDisegnabile('Nessun intervento con dotazione valorizzata e positiva', tabella, omessi);

  const nodi: NodoAlbero[] = famiglie.map((f) => ({
    name: f.nome,
    value: f.totale,
    etichetta: `${f.nome}\n${milioni(f.totale)}`,
    dettaglio: `Famiglia ${f.nome}: ${plurale(f.foglie.length, 'intervento', 'interventi')}, dotazione ${milioni(f.totale)}`,
    children: f.foglie.map((x) => ({
      name: x.codice,
      value: x.dotazione,
      codice: x.codice,
      etichetta: `${x.codice}\n${milioni(x.dotazione)}`,
      dettaglio: `${x.codice} (famiglia ${f.nome}): dotazione ${milioni(x.dotazione)}`,
    })),
  }));
  const interventi = famiglie.reduce((n, f) => n + f.foglie.length, 0);
  const prima = famiglie[0];
  const tipo = forma === 'treemap' ? 'Mappa ad albero' : 'Grafico a raggiera';
  const descrizione =
    `${tipo} della dotazione di spesa pubblica per famiglia di intervento: ` +
    `${plurale(famiglie.length, 'famiglia', 'famiglie')} e ${plurale(interventi, 'intervento', 'interventi')}; ` +
    `la famiglia con la dotazione maggiore è ${prima.nome} (${milioni(prima.totale)}).${notaOmessi(omessi)}`;
  const serie: TreemapSeriesOption | SunburstSeriesOption =
    forma === 'treemap'
      ? {
          type: 'treemap',
          name: 'Dotazione',
          data: nodi,
          nodeClick: 'zoomToNode',
          leafDepth: 1,
          roam: false,
          breadcrumb: { show: true },
          label: { show: true, formatter: etichettaDato },
        }
      : {
          type: 'sunburst',
          name: 'Dotazione',
          data: nodi,
          nodeClick: 'rootToNode',
          radius: ['12%', '90%'],
          label: { formatter: '{b}' },
        };
  const opzioni: EChartsOption = {
    aria: aria(descrizione),
    tooltip: { trigger: 'item', formatter: tooltipDettaglio },
    series: [serie],
  };
  return { opzioni, tabella, omessi };
}

// ---------------------------------------------------------------- 3. imbuto delle domande SIGC

/** Imbuto delle domande SIGC: presentate, pagate, da pagare (in quest'ordine), con la quota sulle presentate. */
export function graficoImbutoSigc(d: DomandeSigcLike): Grafico {
  const caption = 'Domande SIGC: presentate, pagate e da pagare';
  const colonne = ['Fase', 'Domande', 'Quota sulle presentate'];
  const presentate = numeroDi(d.presentate);
  const fasi = [
    { nome: 'Presentate', valore: presentate },
    { nome: 'Pagate', valore: numeroDi(d.pagate) },
    { nome: 'Da pagare', valore: numeroDi(d.daPagare) },
  ];
  const quota = (v: number): string =>
    presentate != null && presentate > 0 ? formatPercentuale(percentuale(v, presentate)) : NON_CALCOLABILE;
  const tabella = {
    caption,
    colonne,
    righe: fasi.map((f) => [f.nome, cellaNumero(f.valore), f.valore == null ? NON_CALCOLABILE : quota(f.valore)]),
  };
  const omessi = fasi.filter((f) => f.valore == null).map((f) => `${f.nome}: numero di domande ${NON_DISPONIBILE}`);
  if (presentate == null) return nonDisegnabile("Domande presentate non disponibili: l'imbuto non si può disegnare", tabella, omessi);
  if (presentate <= 0) return nonDisegnabile("Nessuna domanda presentata: l'imbuto non si può disegnare", tabella, omessi);

  const dati = fasi.flatMap((f): DatoSerie[] =>
    f.valore == null
      ? []
      : [
          {
            value: f.valore,
            name: f.nome,
            etichetta: `${f.nome}: ${formatNumber(f.valore)}`,
            dettaglio: `${f.nome}: ${plurale(f.valore, 'domanda', 'domande')} (${quota(f.valore)} delle presentate)`,
          },
        ],
  );
  const descrizione =
    `Imbuto delle domande SIGC: ${dati.map((x) => `${x.name.toLowerCase()} ${formatNumber(x.value)} (${quota(x.value)})`).join(', ')}.` +
    notaOmessi(omessi);
  const serie: FunnelSeriesOption = {
    type: 'funnel',
    name: 'Domande SIGC',
    sort: 'none',
    min: 0,
    max: Math.max(...dati.map((x) => x.value)),
    gap: 2,
    // etichette bianche e in grassetto dentro i segmenti: contrasto sufficiente su ogni colore della palette
    label: { show: true, position: 'inside', formatter: etichettaDato, color: '#fff', fontWeight: 600, textBorderColor: 'rgba(0,0,0,.35)', textBorderWidth: 2 },
    data: dati,
  };
  const opzioni: EChartsOption = {
    aria: aria(descrizione),
    tooltip: { trigger: 'item', formatter: tooltipDettaglio },
    series: [serie],
  };
  return { opzioni, tabella, omessi };
}

// ---------------------------------------------------------------- cascata (barre impilate con base trasparente)

interface PassoCascata {
  nome: string;
  valore: number;
  base: number;
  colore: string;
}

function opzioniCascata(passi: PassoCascata[], descrizione: string): EChartsOption {
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
    {
      type: 'bar',
      name: 'Importo',
      stack: 'cascata',
      label: { show: true, position: 'top', formatter: etichettaDato },
      data: passi.map(
        (p): DatoSerie => ({
          value: p.valore,
          name: p.nome,
          etichetta: milioni(p.valore),
          dettaglio: `${p.nome}: ${milioni(p.valore)}`,
          itemStyle: { color: p.colore },
        }),
      ),
    },
  ];
  return {
    aria: aria(descrizione),
    tooltip: { trigger: 'item', formatter: tooltipDettaglio },
    xAxis: { type: 'category', data: passi.map((p) => p.nome) },
    yAxis: { type: 'value', axisLabel: { formatter: asseMilioni } },
    series: serie,
  };
}

function descrizioneCascata(titolo: string, passi: PassoCascata[], omessi: string[]): string {
  return `${titolo}: ${passi.map((p) => `${p.nome.toLowerCase()} ${milioni(p.valore)}`).join(', ')}.${notaOmessi(omessi)}`;
}

// ---------------------------------------------------------------- 4. cascata degli importi SIGC

const NOTA_FONTI_DIVERSE = 'Fonti diverse: il pagato viene dal flusso ASR2-20';

/** Cascata richiesto -> non ammesso -> ammesso -> non ancora pagato -> pagato degli importi SIGC. */
export function graficoCascataSigc(i: ImportiSigcLike): Grafico {
  const caption = 'Importi delle domande SIGC: dal richiesto al pagato';
  const colonne = ['Voce', 'Importo'];
  const richiesto = valoreDi(i.richiesto);
  const ammesso = valoreDi(i.ammesso);
  const pagato = valoreDi(i.pagato);
  const voci = [
    { nome: 'Richiesto', importo: i.richiesto },
    { nome: 'Ammesso', importo: i.ammesso },
    { nome: 'Pagato', importo: i.pagato },
  ];
  const mancanti = voci.filter((v) => valoreDi(v.importo) == null);
  const omessi = mancanti.map((v) => `${v.nome} ${nonDisponibile(v.importo)}`);

  const valori = richiesto != null && ammesso != null && pagato != null ? { richiesto, ammesso, pagato } : null;
  let motivo: string | null = null;
  if (!valori) {
    const elenco = mancanti.map((v) => `${v.nome.toLowerCase()} ${nonDisponibile(v.importo)}`).join(', ');
    motivo = `La cascata richiede richiesto, ammesso e pagato: ${elenco}`;
  } else if (valori.richiesto < 0 || valori.ammesso < 0 || valori.pagato < 0) {
    motivo = 'Importi negativi: la cascata non si può disegnare';
  } else if (valori.ammesso > valori.richiesto) {
    motivo = "L'ammesso supera il richiesto: la cascata non si può disegnare";
  } else if (valori.pagato > valori.ammesso) {
    motivo = "Il pagato supera l'ammesso: la cascata non si può disegnare";
  }
  const cascata = motivo == null ? valori : null;
  const nonAmmesso = cascata ? centesimi(cascata.richiesto - cascata.ammesso) : null;
  const nonPagato = cascata ? centesimi(cascata.ammesso - cascata.pagato) : null;

  const righe = [
    ['Richiesto', cellaImporto(i.richiesto)],
    ['Non ammesso (richiesto meno ammesso)', nonAmmesso == null ? NON_CALCOLABILE : formatEuro(nonAmmesso)],
    ['Ammesso', cellaImporto(i.ammesso)],
    ['Non ancora pagato (ammesso meno pagato)', nonPagato == null ? NON_CALCOLABILE : formatEuro(nonPagato)],
    ['Pagato', cellaImporto(i.pagato)],
    ['Ancora da pagare (dal DTO)', cellaImporto(i.ancoraDaPagare)],
  ];
  const daPagareDto = valoreDi(i.ancoraDaPagare);
  if (ammesso != null && pagato != null && daPagareDto != null && centesimi(ammesso - pagato) !== centesimi(daPagareDto)) {
    righe.push(['Nota', NOTA_FONTI_DIVERSE]);
  }
  const tabella = { caption, colonne, righe };
  if (!cascata || nonAmmesso == null || nonPagato == null) {
    return nonDisegnabile(motivo ?? 'La cascata non si può disegnare', tabella, omessi);
  }

  const passi: PassoCascata[] = [
    { nome: 'Richiesto', valore: cascata.richiesto, base: 0, colore: COLORI.scuro },
    { nome: 'Non ammesso', valore: nonAmmesso, base: cascata.ammesso, colore: COLORI.attenzione },
    { nome: 'Ammesso', valore: cascata.ammesso, base: 0, colore: COLORI.primario },
    { nome: 'Non ancora pagato', valore: nonPagato, base: cascata.pagato, colore: COLORI.attenzione },
    { nome: 'Pagato', valore: cascata.pagato, base: 0, colore: COLORI.positivo },
  ];
  const opzioni = opzioniCascata(passi, descrizioneCascata('Cascata degli importi SIGC', passi, omessi));
  return { opzioni, tabella, omessi };
}

// ---------------------------------------------------------------- 5. domande per anno di raccolta

/** Barre impilate delle domande per anno di raccolta (senza anno in coda): prima annualita', altre, non classificate. */
export function graficoDomandePerAnno(righe: RigaDomandeAnno[]): Grafico {
  const caption = 'Domande per anno di raccolta';
  const colonne = ['Anno', 'Prima annualità', 'Altre', 'Non classificate', 'Totale'];
  const ordinate = perAnno(righe);
  const tabella = {
    caption,
    colonne,
    righe: ordinate.map((r) => [
      annoDi(r.annoRaccolta),
      cellaNumero(r.primaAnnualita),
      cellaNumero(r.altreAnnualita),
      cellaNumero(r.nonClassificate),
      cellaNumero(r.totali),
    ]),
  };
  if (ordinate.length === 0) return nonDisegnabile('Nessuna domanda per anno di raccolta', tabella, []);

  const categorie = ordinate.map((r) => annoDi(r.annoRaccolta));
  const definizioni = [
    { nome: 'Prima annualità', campo: 'primaAnnualita' as const },
    { nome: 'Altre annualità', campo: 'altreAnnualita' as const },
    { nome: 'Non classificate', campo: 'nonClassificate' as const },
  ];
  const omessi: string[] = [];
  const serie: BarSeriesOption[] = definizioni.map((def) => ({
    type: 'bar',
    name: def.nome,
    stack: 'domande',
    data: ordinate.map((r, k) => {
      const v = numeroDi(r[def.campo]);
      if (v == null) omessi.push(`${categorie[k]}, ${def.nome.toLowerCase()}: numero di domande ${NON_DISPONIBILE}`);
      return v;
    }),
  }));
  const valorizzati = serie.some((s) => (s.data ?? []).some((v) => v != null));
  if (!valorizzati) return nonDisegnabile('Nessun numero di domande valorizzato', tabella, omessi);

  const totali = ordinate.map((r) => numeroDi(r.totali));
  const totale = totali.every((t): t is number => t != null) ? totali.reduce((a, t) => a + t, 0) : null;
  const descrizione =
    `Barre impilate delle domande per anno di raccolta (${categorie.join(', ')}): prima annualità, altre annualità e non classificate` +
    `${totale == null ? '' : `; ${plurale(totale, 'domanda', 'domande')} in tutto`}.${notaOmessi(omessi)}`;
  const opzioni: EChartsOption = {
    aria: aria(descrizione),
    legend: {},
    tooltip: { trigger: 'axis', valueFormatter: valoreInNumero },
    xAxis: { type: 'category', data: categorie },
    yAxis: { type: 'value' },
    series: serie,
  };
  return { opzioni, tabella, omessi };
}

// ---------------------------------------------------------------- 6. importi per anno di raccolta

/** Due linee (ammesso, decretato) per anno di raccolta; i punti assenti sono vuoti (mai zero) e dichiarati. */
export function graficoImportiPerAnno(righe: RigaImportiAnno[]): Grafico {
  const caption = 'Importo ammesso e decretato per anno di raccolta';
  const colonne = ['Anno', 'Ammesso', 'Decretato'];
  const ordinate = perAnno(righe);
  const tabella = {
    caption,
    colonne,
    righe: ordinate.map((r) => [annoDi(r.annoRaccolta), cellaImporto(r.importoAmmesso), cellaImporto(r.importoDecretato)]),
  };
  if (ordinate.length === 0) return nonDisegnabile('Nessun importo per anno di raccolta', tabella, []);

  const categorie = ordinate.map((r) => annoDi(r.annoRaccolta));
  const definizioni = [
    { nome: 'Importo ammesso', soggetto: 'importo ammesso', campo: 'importoAmmesso' as const },
    { nome: 'Importo decretato', soggetto: 'importo decretato', campo: 'importoDecretato' as const },
  ];
  const omessi: string[] = [];
  const serie: LineSeriesOption[] = definizioni.map((def) => ({
    type: 'line',
    name: def.nome,
    connectNulls: false,
    data: ordinate.map((r, k) => {
      const v = valoreDi(r[def.campo]);
      if (v == null) omessi.push(`${categorie[k]}: ${def.soggetto} ${nonDisponibile(r[def.campo])}`);
      return v;
    }),
  }));
  const valorizzati = serie.some((s) => (s.data ?? []).some((v) => v != null));
  if (!valorizzati) return nonDisegnabile('Nessun importo valorizzato per anno di raccolta', tabella, omessi);

  const descrizione =
    `Linee dell'importo ammesso e dell'importo decretato per anno di raccolta (${categorie.join(', ')}), in milioni di euro.` +
    notaOmessi(omessi);
  const opzioni: EChartsOption = {
    aria: aria(descrizione),
    legend: {},
    tooltip: { trigger: 'axis', valueFormatter: valoreInMilioni },
    dataZoom: [{ type: 'inside' }],
    xAxis: { type: 'category', data: categorie },
    yAxis: { type: 'value', axisLabel: { formatter: asseMilioni } },
    series: serie,
  };
  return { opzioni, tabella, omessi };
}

// ---------------------------------------------------------------- 7. flusso dotazione -> impegnato -> pagato

const MOTIVO_IMPEGNI_NON_ATTIVI = "Impegni da fonte non attiva: il flusso dalla dotazione all'impegnato non si può disegnare";

interface CollegamentoFlusso {
  source: string;
  target: string;
  value: number;
  dettaglio: string;
}

/** Diagramma di flusso: dotazione -> impegnato / da impegnare, impegnato -> pagato / da pagare. */
export function graficoSankey(impegni: ResiduoSuImpegniLike, pagamenti: AvanzamentoPagamentiLike): Grafico {
  const caption = 'Dalla dotazione all\'impegnato e al pagato';
  const colonne = ['Voce', 'Importo'];
  const dotazione = valoreDi(impegni.dotazioneSpesaPubblica);
  const impegnato = valoreDi(impegni.importoImpegnato);
  const pagato = valoreDi(pagamenti.pagamentiTotali);
  const daPagare = valoreDi(pagamenti.impegnatoDaPagare);
  const daImpegnare = dotazione != null && impegnato != null ? centesimi(dotazione - impegnato) : null;
  const voci = [
    { nome: 'Dotazione', importo: impegni.dotazioneSpesaPubblica },
    { nome: 'Impegnato', importo: impegni.importoImpegnato },
    { nome: 'Pagato', importo: pagamenti.pagamentiTotali },
    { nome: 'Da pagare', importo: pagamenti.impegnatoDaPagare },
  ];
  const omessi = voci.filter((v) => valoreDi(v.importo) == null).map((v) => `${v.nome} ${nonDisponibile(v.importo)}`);
  const tabella = {
    caption,
    colonne,
    righe: [
      ['Dotazione', cellaImporto(impegni.dotazioneSpesaPubblica)],
      ['Impegnato', cellaImporto(impegni.importoImpegnato)],
      ['Da impegnare (dotazione meno impegnato)', daImpegnare == null ? NON_CALCOLABILE : formatEuro(daImpegnare)],
      ['Pagato', cellaImporto(pagamenti.pagamentiTotali)],
      ['Da pagare', cellaImporto(pagamenti.impegnatoDaPagare)],
    ],
  };
  if (impegnato == null) {
    const motivo =
      impegni.importoImpegnato?.motivo === 'FONTE_NON_ATTIVA'
        ? MOTIVO_IMPEGNI_NON_ATTIVI
        : `Impegnato ${nonDisponibile(impegni.importoImpegnato)}: il flusso dalla dotazione all'impegnato non si può disegnare`;
    return nonDisegnabile(motivo, tabella, omessi);
  }
  if (dotazione == null || daImpegnare == null) {
    return nonDisegnabile(`Dotazione ${nonDisponibile(impegni.dotazioneSpesaPubblica)}: il flusso non si può disegnare`, tabella, omessi);
  }
  const negativi = [
    { nome: 'dotazione', valore: dotazione },
    { nome: 'impegnato', valore: impegnato },
    { nome: 'da impegnare', valore: daImpegnare },
    { nome: 'pagato', valore: pagato },
    { nome: 'da pagare', valore: daPagare },
  ].filter((v) => v.valore != null && v.valore < 0);
  if (negativi.length > 0) {
    return nonDisegnabile(`Valori negativi (${negativi.map((v) => v.nome).join(', ')}): il flusso non si può disegnare`, tabella, omessi);
  }

  const collegamento = (source: string, target: string, value: number): CollegamentoFlusso => ({
    source,
    target,
    value,
    dettaglio: `${source} → ${target}: ${milioni(value)}`,
  });
  const collegamenti = [collegamento('Dotazione', 'Impegnato', impegnato), collegamento('Dotazione', 'Da impegnare', daImpegnare)];
  if (pagato != null) collegamenti.push(collegamento('Impegnato', 'Pagato', pagato));
  if (daPagare != null) collegamenti.push(collegamento('Impegnato', 'Da pagare', daPagare));
  const valoriNodi: Record<string, number | null> = {
    Dotazione: dotazione,
    Impegnato: impegnato,
    'Da impegnare': daImpegnare,
    Pagato: pagato,
    'Da pagare': daPagare,
  };
  const nomi = ['Dotazione', 'Impegnato', 'Da impegnare', 'Pagato', 'Da pagare'].filter((nome) =>
    collegamenti.some((c) => c.source === nome || c.target === nome),
  );
  const nodi = nomi.map((nome) => {
    const v = valoriNodi[nome];
    const testo = v == null ? nome : `${nome}: ${milioni(v)}`;
    return { name: nome, etichetta: testo, dettaglio: testo };
  });
  const dellImpegnato = [
    pagato == null ? null : `${milioni(pagato)} pagati`,
    daPagare == null ? null : `${milioni(daPagare)} da pagare`,
  ].filter((t): t is string => t != null);
  const descrizione =
    `Flusso della dotazione: ${milioni(dotazione)} di dotazione, di cui ${milioni(impegnato)} impegnati e ${milioni(daImpegnare)} da impegnare` +
    `${dellImpegnato.length > 0 ? `; dell'impegnato ${dellImpegnato.join(' e ')}` : ''}.${notaOmessi(omessi)}`;
  const serie: SankeySeriesOption = {
    type: 'sankey',
    name: 'Flusso della dotazione',
    data: nodi,
    links: collegamenti,
    nodeAlign: 'left',
    emphasis: { focus: 'adjacency' },
    lineStyle: { color: 'gradient', curveness: 0.5 },
    label: { formatter: etichettaDato },
  };
  const opzioni: EChartsOption = {
    aria: aria(descrizione),
    tooltip: { trigger: 'item', formatter: tooltipDettaglio },
    series: [serie],
  };
  return { opzioni, tabella, omessi };
}

// ---------------------------------------------------------------- 8. indicatore percentuale

/** Indicatore 0-100 della parte sul totale (percentuale a una cifra decimale). */
export function graficoGauge(parte: number | null | undefined, totale: number | null | undefined, titolo: string, perimetro?: string | null): Grafico {
  const p = numeroDi(parte);
  const t = numeroDi(totale);
  if (perimetro === PERIMETRO_ADA) {
    // parte dell'area su un totale regionale (dato di programma): il rapporto non ha senso
    const tabella = { caption: titolo, colonne: ['Misura', 'Valore'], righe: [[titolo, 'non confrontabile (perimetro ADA)']] };
    return nonDisegnabile(MOTIVO_ADA_GAUGE, tabella, []);
  }
  let motivo: string | null = null;
  if (p == null) motivo = `${titolo}: valore non disponibile, la percentuale non si può calcolare`;
  else if (t == null) motivo = `${titolo}: totale non disponibile, la percentuale non si può calcolare`;
  else if (t <= 0) motivo = `${titolo}: totale pari a zero o negativo, la percentuale non si può calcolare`;
  else if (p < 0) motivo = `${titolo}: valore negativo, la percentuale non si può calcolare`;
  const valore = motivo == null && p != null && t != null ? percentuale(p, t) : null;
  const tabella = { caption: titolo, colonne: ['Misura', 'Valore'], righe: [[titolo, valore == null ? NON_CALCOLABILE : formatPercentuale(valore)]] };
  if (valore == null) return nonDisegnabile(motivo ?? `${titolo}: la percentuale non si può calcolare`, tabella, []);

  const serie: GaugeSeriesOption = {
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
  const opzioni: EChartsOption = {
    aria: aria(`Indicatore da 0 a 100 %: ${titolo} ${formatPercentuale(valore)}.`),
    series: [serie],
  };
  return { opzioni, tabella, omessi: [] };
}

// ---------------------------------------------------------------- 9. cascata di un intervento

/** Cascata di un intervento: dotazione -> pagamenti netti -> residuo sui pagamenti; tabella con tutta la riga. */
export function graficoCascataIntervento(riga: RigaRiepilogo): Grafico {
  const codice = codiceDi(riga);
  const caption = `Intervento ${codice}: dalla dotazione al residuo sui pagamenti`;
  const colonne = ['Voce', 'Importo'];
  const voci: Array<[string, ImportoLike | null | undefined]> = [
    ['Dotazione di spesa pubblica', riga.dotazioneSpesaPubblica],
    ['Quota FEASR', riga.risorseQuotaFeasr],
    ['Stanziato', riga.importoStanziato],
    ['Impegnato FEASR', riga.impegnatoCofinanziatoFeasr],
    ['Impegnato FEASR e non FEASR', riga.impegnatoCofinanziatoFeasrENon],
    ['Pagamenti al netto delle rettifiche', riga.pagamentiNettoRettifiche],
    ['Residuo sugli impegni', riga.dotazioneResiduaSuImpegni],
    ['Residuo sui pagamenti', riga.dotazioneResiduaSuPagamenti],
  ];
  const tabella = { caption, colonne, righe: voci.map(([nome, importo]) => [nome, cellaImporto(importo)]) };
  const omessi: string[] = [];
  if (valoreDi(riga.impegnatoCofinanziatoFeasrENon) == null) {
    omessi.push(`Impegnato FEASR e non FEASR ${nonDisponibile(riga.impegnatoCofinanziatoFeasrENon)}`);
  }
  const dotazione = valoreDi(riga.dotazioneSpesaPubblica);
  const pagamenti = valoreDi(riga.pagamentiNettoRettifiche);
  const residuo = valoreDi(riga.dotazioneResiduaSuPagamenti);
  if (residuo == null) omessi.push(`Residuo sui pagamenti ${nonDisponibile(riga.dotazioneResiduaSuPagamenti)}`);

  if (dotazione == null || pagamenti == null) {
    const mancanti = [
      dotazione == null ? `dotazione ${nonDisponibile(riga.dotazioneSpesaPubblica)}` : null,
      pagamenti == null ? `pagamenti netti ${nonDisponibile(riga.pagamentiNettoRettifiche)}` : null,
    ].filter((t): t is string => t != null);
    return nonDisegnabile(`La cascata di ${codice} richiede dotazione e pagamenti netti: ${mancanti.join(', ')}`, tabella, omessi);
  }
  if (dotazione < 0 || pagamenti < 0 || (residuo != null && residuo < 0)) {
    return nonDisegnabile(`Importi negativi per ${codice}: la cascata non si può disegnare`, tabella, omessi);
  }
  if (pagamenti > dotazione) {
    return nonDisegnabile(`I pagamenti netti di ${codice} superano la dotazione: la cascata non si può disegnare`, tabella, omessi);
  }

  const passi: PassoCascata[] = [
    { nome: 'Dotazione', valore: dotazione, base: 0, colore: COLORI.scuro },
    { nome: 'Pagamenti netti', valore: pagamenti, base: centesimi(dotazione - pagamenti), colore: COLORI.attenzione },
  ];
  if (residuo != null) passi.push({ nome: 'Residuo sui pagamenti', valore: residuo, base: 0, colore: COLORI.primario });
  const opzioni = opzioniCascata(passi, descrizioneCascata(`Cascata dell'intervento ${codice}`, passi, omessi));
  return { opzioni, tabella, omessi };
}

// ---------------------------------------------------------------- 10. quota FEASR

/** Ciambella della dotazione divisa fra quota FEASR e quota non FEASR. */
export function graficoQuotaFeasr(d: DistribuzioneDotazioneLike): Grafico {
  const caption = 'Dotazione: quota FEASR e quota non FEASR';
  const colonne = ['Quota', 'Importo', 'Percentuale'];
  const feasr = valoreDi(d.quotaFeasr);
  const nonFeasr = valoreDi(d.quotaNonFeasr);
  const voci = [
    { nome: 'Quota FEASR', importo: d.quotaFeasr, valore: feasr },
    { nome: 'Quota non FEASR', importo: d.quotaNonFeasr, valore: nonFeasr },
  ];
  const omessi = voci.filter((v) => v.valore == null).map((v) => `${v.nome} ${nonDisponibile(v.importo)}`);
  let motivo: string | null = null;
  if (feasr == null || nonFeasr == null) {
    const elenco = voci
      .filter((v) => v.valore == null)
      .map((v) => `${minuscolaIniziale(v.nome)} ${nonDisponibile(v.importo)}`)
      .join(', ');
    motivo = `La ciambella richiede la quota FEASR e la quota non FEASR: ${elenco}`;
  } else if (feasr < 0 || nonFeasr < 0) {
    motivo = 'Quote negative: la ciambella non si può disegnare';
  } else if (feasr + nonFeasr <= 0) {
    motivo = 'Quote FEASR e non FEASR entrambe pari a zero: la ciambella non si può disegnare';
  }
  const totale = feasr != null && nonFeasr != null ? centesimi(feasr + nonFeasr) : null;
  const quota = (v: number | null): string => (motivo == null && v != null && totale != null ? formatPercentuale(percentuale(v, totale)) : NON_CALCOLABILE);
  const tabella = {
    caption,
    colonne,
    righe: [
      ...voci.map((v) => [v.nome, cellaImporto(v.importo), quota(v.valore)]),
      ['Totale', totale == null ? NON_CALCOLABILE : formatEuro(totale), motivo == null ? formatPercentuale(100) : NON_CALCOLABILE],
    ],
  };
  if (motivo != null || feasr == null || nonFeasr == null) return nonDisegnabile(motivo ?? 'La ciambella non si può disegnare', tabella, omessi);

  const parti = [
    { nome: 'Quota FEASR', valore: feasr },
    { nome: 'Quota non FEASR', valore: nonFeasr },
  ];
  const dati: DatoSerie[] = parti.map((x) => ({
    value: x.valore,
    name: x.nome,
    etichetta: `${x.nome}: ${quota(x.valore)}`,
    dettaglio: `${x.nome}: ${milioni(x.valore)} (${quota(x.valore)})`,
  }));
  const descrizione = `Ciambella della dotazione: ${parti.map((x) => `${minuscolaIniziale(x.nome)} ${milioni(x.valore)} (${quota(x.valore)})`).join(', ')}.`;
  const serie: PieSeriesOption = {
    type: 'pie',
    name: 'Dotazione',
    radius: ['45%', '70%'],
    label: { formatter: etichettaDato },
    data: dati,
  };
  const opzioni: EChartsOption = {
    aria: aria(descrizione),
    legend: {},
    tooltip: { trigger: 'item', formatter: tooltipDettaglio },
    series: [serie],
  };
  return { opzioni, tabella, omessi };
}

// ---------------------------------------------------------------- 11. contributo ambientale

/** Barre della percentuale di contributo ambientale per intervento (asse 0-100%); le assenti sono omesse. */
export function graficoContributo(righe: RigaSpesa[]): Grafico {
  const caption = 'Contributo ambientale per intervento';
  const colonne = ['Intervento', 'Contributo ambientale'];
  const tabella = {
    caption,
    colonne,
    righe: righe.map((r) => {
      const v = numeroDi(r.percentualeContributoAmbientale);
      return [codiceDi(r), v == null ? NON_DISPONIBILE : formatPercentuale(v)];
    }),
  };
  const omessi: string[] = [];
  const dati: DatoSerie[] = [];
  for (const r of righe) {
    const codice = codiceDi(r);
    const v = numeroDi(r.percentualeContributoAmbientale);
    if (v == null) {
      omessi.push(`${codice}: contributo ambientale ${NON_DISPONIBILE}`);
      continue;
    }
    dati.push({ value: v, name: codice, codice, etichetta: formatPercentuale(v), dettaglio: `${codice}: contributo ambientale ${formatPercentuale(v)}` });
  }
  if (dati.length === 0) return nonDisegnabile('Nessun intervento con il contributo ambientale valorizzato', tabella, omessi);

  const descrizione =
    `Barre del contributo ambientale per ${plurale(dati.length, 'intervento', 'interventi')}, in percentuale: ` +
    `${dati.map((x) => `${x.name} ${x.etichetta}`).join(', ')}.${notaOmessi(omessi)}`;
  const serie: BarSeriesOption[] = [
    { type: 'bar', name: 'Contributo ambientale', data: dati, itemStyle: { color: COLORI.positivo } },
  ];
  const opzioni: EChartsOption = {
    aria: aria(descrizione),
    tooltip: { trigger: 'item', formatter: tooltipDettaglio },
    ...zoomSeMolti(dati.length),
    xAxis: { type: 'category', data: dati.map((x) => x.name), axisLabel: { interval: 0, rotate: dati.length > 8 ? 45 : 0 } },
    yAxis: { type: 'value', min: 0, max: 100, axisLabel: { formatter: assePercentuale } },
    series: serie,
  };
  return { opzioni, tabella, omessi };
}

// ---------------------------------------------------------------- barre raggruppate per intervento (12, 14)

interface SerieRaggruppata {
  nome: string;
  /** Soggetto nei messaggi delle voci omesse: "SRA01: <soggetto> non disponibile (...)". */
  soggetto: string;
}

interface VoceRaggruppata {
  codice: string;
  importi: Array<ImportoLike | null | undefined>;
}

function barreRaggruppate(
  voci: VoceRaggruppata[],
  definizioni: SerieRaggruppata[],
  testi: { caption: string; colonne: string[]; titolo: string; vuoto: string },
  omessiIniziali: string[],
): Grafico {
  const tabella = { caption: testi.caption, colonne: testi.colonne, righe: voci.map((v) => [v.codice, ...v.importi.map(cellaImporto)]) };
  const omessi = [...omessiIniziali];
  const categorie: string[] = [];
  const datiSerie: Array<Array<DatoSerie | null>> = definizioni.map(() => []);
  for (const v of voci) {
    const valori = v.importi.map(valoreDi);
    valori.forEach((x, k) => {
      if (x == null) omessi.push(`${v.codice}: ${definizioni[k].soggetto} ${nonDisponibile(v.importi[k])}`);
    });
    if (valori.every((x) => x == null)) continue;
    categorie.push(v.codice);
    valori.forEach((x, k) => {
      datiSerie[k].push(
        x == null
          ? null
          : { value: x, name: v.codice, codice: v.codice, dettaglio: `${v.codice}, ${definizioni[k].soggetto}: ${milioni(x)}` },
      );
    });
  }
  if (categorie.length === 0) return nonDisegnabile(testi.vuoto, tabella, omessi);

  const descrizione =
    `${testi.titolo} per ${plurale(categorie.length, 'intervento', 'interventi')}` +
    `${categorie.length === 1 ? ` (${categorie[0]})` : `, da ${categorie[0]} a ${categorie[categorie.length - 1]}`}, in milioni di euro.` +
    notaOmessi(omessi);
  const serie: BarSeriesOption[] = definizioni.map((def, k) => ({ type: 'bar', name: def.nome, data: datiSerie[k] }));
  const opzioni: EChartsOption = {
    aria: aria(descrizione),
    legend: {},
    tooltip: { trigger: 'axis', valueFormatter: valoreInMilioni },
    ...zoomSeMolti(categorie.length),
    xAxis: { type: 'category', data: categorie, axisLabel: { interval: 0, rotate: categorie.length > 8 ? 45 : 0 } },
    yAxis: { type: 'value', axisLabel: { formatter: asseMilioni } },
    series: serie,
  };
  return { opzioni, tabella, omessi };
}

// ---------------------------------------------------------------- 12. dotazione e pagato per intervento

const OMESSO_ADA_DOTAZIONE = "Perimetro ADA: la dotazione regionale non si affianca ai pagamenti dell'area";

/** Barre raggruppate dotazione / pagato per intervento; nel perimetro ADA solo il pagato. */
export function graficoDotazionePagamenti(
  righe: Array<{ codiceIntervento?: string; dotazione?: ImportoLike | null; pagato?: ImportoLike | null }>,
  perimetro?: string | null,
): Grafico {
  const caption = 'Dotazione e pagato per intervento';
  if (perimetro === PERIMETRO_ADA) {
    return barreRaggruppate(
      righe.map((r) => ({ codice: codiceDi(r), importi: [r.pagato] })),
      [{ nome: 'Pagato', soggetto: 'pagato' }],
      { caption: 'Pagato per intervento', colonne: ['Intervento', 'Pagato'], titolo: 'Barre del pagato', vuoto: 'Nessun intervento con il pagato valorizzato' },
      [OMESSO_ADA_DOTAZIONE],
    );
  }
  return barreRaggruppate(
    righe.map((r) => ({ codice: codiceDi(r), importi: [r.dotazione, r.pagato] })),
    [
      { nome: 'Dotazione', soggetto: 'dotazione' },
      { nome: 'Pagato', soggetto: 'pagato' },
    ],
    { caption, colonne: ['Intervento', 'Dotazione', 'Pagato'], titolo: 'Barre raggruppate di dotazione e pagato', vuoto: 'Nessun intervento con dotazione o pagato valorizzati' },
    [],
  );
}

// ---------------------------------------------------------------- 13. utilizzo della riserva

/** Area dell'utilizzo cumulato della riserva per data, con la linea della riserva accumulata. */
export function graficoUtilizzoRiserva(m: RiservaLike): Grafico {
  const accumulato = numeroDi(m.importoAccumulato);
  const caption = `Utilizzo progressivo della riserva (riserva accumulata: ${accumulato == null ? NON_DISPONIBILE : formatEuro(accumulato)})`;
  const colonne = ['Data', 'Importo del movimento', 'Utilizzo cumulato'];
  const movimenti = m.utilizzoProgressivo ?? [];
  const omessi: string[] = [];
  const datati: Array<{ data: string; importo: number | null; cumulato: number | null }> = [];
  let senzaData = 0;
  for (const p of movimenti) {
    if (!p.data) {
      senzaData += 1;
      continue;
    }
    datati.push({ data: p.data, importo: numeroDi(p.importo), cumulato: numeroDi(p.cumulato) });
  }
  datati.sort((a, b) => confronta(a.data, b.data));
  if (senzaData > 0) omessi.push(plurale(senzaData, 'movimento senza data', 'movimenti senza data'));
  const righe = [
    ...datati.map((p) => [dataItaliana(p.data), cellaEuro(p.importo), cellaEuro(p.cumulato)]),
    ...movimenti.filter((p) => !p.data).map((p) => ['senza data', cellaEuro(p.importo), cellaEuro(p.cumulato)]),
  ];
  const tabella = { caption, colonne, righe };
  const categorie = datati.map((p) => dataItaliana(p.data));
  datati.forEach((p, k) => {
    if (p.cumulato == null) omessi.push(`${categorie[k]}: utilizzo cumulato ${NON_DISPONIBILE}`);
  });
  const cumulati = datati.map((p) => p.cumulato);
  if (cumulati.every((c) => c == null)) return nonDisegnabile('Nessun utilizzo della riserva registrato', tabella, omessi);
  if (accumulato == null) omessi.push(`Riserva accumulata ${NON_DISPONIBILE}: linea di riferimento omessa`);

  const ultimo = [...cumulati].reverse().find((c): c is number => c != null) ?? 0;
  const descrizione =
    `Area dell'utilizzo cumulato della riserva dal ${categorie[0]} al ${categorie[categorie.length - 1]}: ${milioni(ultimo)} utilizzati` +
    `${accumulato == null ? '' : ` su ${milioni(accumulato)} di riserva accumulata`}.${notaOmessi(omessi)}`;
  const serie: LineSeriesOption = {
    type: 'line',
    name: 'Utilizzo cumulato',
    connectNulls: false,
    areaStyle: { opacity: 0.2 },
    data: cumulati,
    ...(accumulato == null
      ? {}
      : {
          markLine: {
            silent: true,
            symbol: 'none',
            lineStyle: { color: COLORI.attenzione, type: 'dashed' },
            label: { formatter: `Riserva accumulata ${milioni(accumulato)}` },
            data: [{ name: 'Riserva accumulata', yAxis: accumulato }],
          },
        }),
  };
  const opzioni: EChartsOption = {
    aria: aria(descrizione),
    tooltip: { trigger: 'axis', valueFormatter: valoreInMilioni },
    dataZoom: [{ type: 'inside' }, { type: 'slider' }],
    xAxis: { type: 'category', data: categorie },
    yAxis: {
      type: 'value',
      min: 0,
      ...(accumulato == null ? {} : { max: (estensione: { max: number }) => Math.max(estensione.max, accumulato) }),
      axisLabel: { formatter: asseMilioni },
    },
    series: [serie],
  };
  return { opzioni, tabella, omessi };
}

// ---------------------------------------------------------------- 14. verifica SMP

/** Barre raggruppate per intervento: previsione di pagamento dell'esercizio e spesa erogata nella campagna precedente. */
export function graficoSmp(righe: RigaSmp[]): Grafico {
  return barreRaggruppate(
    righe.map((r) => ({ codice: codiceDi(r), importi: [r.previsionePagamentoEsercizio, r.spesaErogataCampagnaPrecedente] })),
    [
      { nome: 'Previsione di pagamento', soggetto: 'previsione di pagamento' },
      { nome: 'Spesa erogata nella campagna precedente', soggetto: 'spesa erogata nella campagna precedente' },
    ],
    {
      caption: 'Previsione di pagamento e spesa erogata nella campagna precedente per intervento',
      colonne: ['Intervento', 'Previsione di pagamento', 'Spesa erogata nella campagna precedente'],
      titolo: 'Barre raggruppate della previsione di pagamento e della spesa erogata nella campagna precedente',
      vuoto: 'Nessun intervento con previsione di pagamento o spesa erogata valorizzate',
    },
    [],
  );
}
