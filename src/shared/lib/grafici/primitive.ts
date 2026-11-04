// primitive.ts — mattoni generici e PURI dei builder di grafici: numeri, testi in italiano, descrizione accessibile,
// scorrimento delle barre, dato di una serie con i testi gia' composti e i callback che li leggono. Nessun dominio.
import type { DataZoomComponentOption, EChartsOption, GridComponentOption, TooltipComponentOption, YAXisComponentOption } from 'echarts';
import { MIGLIAIA, ettari, formatEttari, formatEuro, formatNumber, formatPercentuale } from '../format';

export const NON_DISPONIBILE = 'non disponibile';
export const NON_CALCOLABILE = 'non calcolabile';
/**
 * Oltre questo numero di categorie le barre verticali si scorrono (dataZoom), come dicono i wireframe approvati ("zoom oltre
 * 12"): piu' barre verticali non hanno spazio per le etichette, specie a 390 px. I grafici che devono mostrare tutti gli
 * interventi (R02) usano le barre orizzontali, alte quanto serve e scorrevoli solo oltre MAX_BARRE_ORIZZONTALI (review K-01).
 */
export const MAX_BARRE_VISIBILI = 12;
/**
 * Barre orizzontali (R02, revisioni del 31/10/2026): il grafico e' alto quanto serve al numero di categorie e si scorre
 * solo oltre questa soglia alta, cosi' per esempio la Panoramica mostra tutti gli interventi con tutte le etichette.
 */
export const MAX_BARRE_ORIZZONTALI = 40;
/** Righe in piu' per gradino d'altezza delle barre orizzontali (classi ui-grafico--righe-N, per la CSP style-src 'self'). */
const RIGHE_PER_GRADINO = 4;

/** Il numero se finito, altrimenti null (mai uno zero al posto di un assente). */
export function numeroDi(v: number | null | undefined): number | null {
  return typeof v === 'number' && Number.isFinite(v) ? v : null;
}

export function centesimi(v: number): number {
  return Math.round(v * 100) / 100;
}

export function arrotonda1(v: number): number {
  return Math.round(v * 10) / 10;
}

/**
 * Percentuale gia' in centesimi arrotondata: una cifra decimale da 1 % in su, due sotto; un valore non nullo che a due
 * cifre sarebbe zero resta com'e' (formatPercentuale lo scrive "< 0,01 %"). Un pagamento piccolo non sembra uno zero.
 */
export function arrotondaPercentuale(v: number): number {
  if (Math.abs(v) >= 1) return arrotonda1(v);
  const dueCifre = Math.round(v * 100) / 100;
  return dueCifre === 0 ? v : dueCifre;
}

/** Percentuale (0-100) arrotondata con arrotondaPercentuale. */
export function percentuale(parte: number, totale: number): number {
  return arrotondaPercentuale((parte / totale) * 100);
}

/** Somma al centesimo. */
export function sommaCentesimi(valori: readonly number[]): number {
  return centesimi(valori.reduce((acc, v) => acc + v, 0));
}

/**
 * Somma al centesimo solo se ogni numero e' noto: con anche un solo assente il risultato e' null (mai una somma parziale,
 * come i totali del backend). Prima nel lib del finanziario; ora anche delle card della Home degli altri ambiti.
 */
export function sommaSeCompleta(valori: ReadonlyArray<number | null | undefined>): number | null {
  return valori.every((v): v is number => numeroDi(v) !== null) ? sommaCentesimi(valori as number[]) : null;
}

/** "1 intervento", "3 interventi". */
export function plurale(n: number, singolare: string, plurale: string): string {
  return `${formatNumber(n)} ${n === 1 ? singolare : plurale}`;
}

/** Confronto fra stringhe indipendente dal locale (ordinamenti deterministici). */
export function confronta(a: string, b: string): number {
  if (a < b) return -1;
  return a > b ? 1 : 0;
}

export function minuscolaIniziale(testo: string): string {
  return testo.charAt(0).toLowerCase() + testo.slice(1);
}

export function maiuscolaIniziale(testo: string): string {
  return testo.charAt(0).toUpperCase() + testo.slice(1);
}

/** Importo in milioni di euro con una cifra decimale: 12345678 -> "12,3 M€". Sotto il milione si usa importoBreve. */
export function milioni(v: number): string {
  return `${(v / 1_000_000).toLocaleString('it-IT', { ...MIGLIAIA, minimumFractionDigits: 1, maximumFractionDigits: 1 })} M€`;
}

/**
 * Importo di KPI, etichette, tooltip e descrizioni accessibili: in milioni da un milione in su, altrimenti in euro pieni
 * (un importo piccolo non sembra uno zero: 300 € non diventa "0,0 M€", review v3 X-03).
 */
export function importoBreve(v: number): string {
  return Math.abs(v) >= 1_000_000 ? milioni(v) : formatEuro(v);
}

/**
 * Un importo per un KPI: la forma compatta su una riga e il valore pieno per i lettori di schermo e il suggerimento (R09,
 * revisioni del 31/10/2026; review J-08). Si stende nelle prop di Kpi; senza valore niente (l'assenza la dice la tessera).
 */
export function importoKpi(v: number | null | undefined): { valore?: string; valorePieno?: string } {
  return v == null ? {} : { valore: importoBreve(v), valorePieno: formatEuro(v) };
}

export function valoreBreve(v: unknown): string {
  return typeof v === 'number' ? importoBreve(v) : NON_DISPONIBILE;
}

export function valoreEttari(v: unknown): string {
  return typeof v === 'number' ? ettari(v) : NON_DISPONIBILE;
}

/** Tacca di un asse di superfici: ettari senza decimali oltre i 10 ha, con due decimali sotto. */
export function asseEttari(v: number): string {
  return Math.abs(v) >= 10 ? `${v.toLocaleString('it-IT', { ...MIGLIAIA, maximumFractionDigits: 0 })} ha` : `${formatEttari(v)} ha`;
}

export function valoreInNumero(v: unknown): string {
  return typeof v === 'number' ? formatNumber(v) : NON_DISPONIBILE;
}

/** Una percentuale gia' in centesimi per il tooltip, oppure "non disponibile". */
export function valorePercentuale(v: unknown): string {
  return typeof v === 'number' ? formatPercentuale(v) : NON_DISPONIBILE;
}

// I campi facoltativi senza motivo dell'assenza (nella spec il dato manca e basta): assente = "non disponibile", mai uno
// zero ne' una cella vuota. Prima copiati nel finanziario e nell'istituzionale (review del riallineamento IST-06; l'anno
// facoltativo, annoOpzionale, non serve piu': l'anno delle domande della verifica SMP SIGC ha il ripiego n-1, IST-04).

/** Un numero facoltativo (conteggi, ettari o UBA): assente = "non disponibile". */
export function numeroOpzionale(v: number | null | undefined): string {
  return v == null ? NON_DISPONIBILE : formatNumber(v);
}

/** Un testo facoltativo (date gia' formattate, indicatori): assente o vuoto = "non disponibile". */
export function testoOpzionale(v: string | null | undefined): string {
  return v == null || v.trim() === '' ? NON_DISPONIBILE : v;
}

export function assePercentuale(v: number): string {
  return formatPercentuale(v);
}

/** Tacca di un asse di importi: in milioni da un milione in su, sotto in euro senza decimali (mai "0,0 M€" ripetuto). */
export function asseImporti(v: number): string {
  return Math.abs(v) >= 1_000_000 ? milioni(v) : v.toLocaleString('it-IT', { ...MIGLIAIA, style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
}

/** Descrizione accessibile: ECharts la mette sull'SVG del grafico. */
export function aria(description: string): EChartsOption['aria'] {
  return { enabled: true, label: { description } };
}

export function notaOmessi(omessi: readonly string[]): string {
  return omessi.length > 0 ? ` ${plurale(omessi.length, 'voce omessa', 'voci omesse')} per dati mancanti o non utilizzabili.` : '';
}

/**
 * L'asse delle categorie delle barre orizzontali: dall'alto in basso, con le etichette lunghe a capo (stati e voci di SR-01,
 * Unit Amount del procedurale). Una sola resa per tutte le barre orizzontali (review H6 del procedurale). Nessuna etichetta
 * saltata (R02): `interval: 0`; l'altezza del grafico segue il numero di categorie (righeOrizzontali, gradinoRighe).
 */
export function asseCategorieOrizzontale(categorie: readonly string[]): YAXisComponentOption {
  return { type: 'category', inverse: true, data: [...categorie], axisLabel: { interval: 0, hideOverlap: false, width: 160, overflow: 'break' } };
}

/** Le categorie di un asse orizzontale delle categorie (barre orizzontali) visibili insieme; 0 se l'asse y non le ha. */
export function righeOrizzontali(opzioni: EChartsOption): number {
  const y: unknown = Array.isArray(opzioni.yAxis) ? opzioni.yAxis[0] : opzioni.yAxis;
  if (typeof y !== 'object' || y === null) return 0;
  const asse = y as { type?: unknown; data?: unknown };
  return asse.type === 'category' && Array.isArray(asse.data) ? Math.min(asse.data.length, MAX_BARRE_ORIZZONTALI) : 0;
}

/**
 * Il gradino d'altezza (le righe della classe ui-grafico--righe-N) per `righe` barre orizzontali quando l'altezza scelta
 * ne contiene meno (`righeDellaBase`); null = basta l'altezza scelta.
 */
export function gradinoRighe(righe: number, righeDellaBase: number): number | null {
  if (righe <= righeDellaBase) return null;
  // il primo gradino e' 12 (le classi partono da ui-grafico--righe-12: review H-12)
  return Math.min(MAX_BARRE_ORIZZONTALI, Math.max(12, Math.ceil(righe / RIGHE_PER_GRADINO) * RIGHE_PER_GRADINO));
}

/** La griglia che contiene le etichette degli assi, com'era containLabel (deprecato in ECharts 6: grid.outerBounds). */
export const GRIGLIA_CON_ETICHETTE: GridComponentOption = { outerBoundsMode: 'same', outerBoundsContain: 'axisLabel' };

/**
 * Scorrimento delle barre quando le categorie sono piu' di MAX_BARRE_VISIBILI (barre verticali, asse x) o di
 * MAX_BARRE_ORIZZONTALI (barre orizzontali, asse y): se ne mostrano tante quante la soglia.
 */
export function zoomSeMolti(n: number, asse: 'x' | 'y' = 'x'): { dataZoom?: DataZoomComponentOption[] } {
  const massimo = asse === 'x' ? MAX_BARRE_VISIBILI : MAX_BARRE_ORIZZONTALI;
  if (n <= massimo) return {};
  const finestra = { [asse === 'x' ? 'xAxisIndex' : 'yAxisIndex']: 0, startValue: 0, endValue: massimo - 1 };
  return { dataZoom: [{ type: 'inside', ...finestra }, { type: 'slider', ...finestra }] };
}

// ---------------------------------------------------------------- dato di una serie e callback

/** Dato di una serie: porta i testi gia' composti per etichetta e tooltip e, se e' un elemento navigabile, il codice. */
export interface DatoSerie {
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

/** Tooltip di un elemento: il dettaglio composto nel dato. Testo semplice: il tooltip e' richText, non HTML. */
export function tooltipDettaglio(p: unknown): string {
  return campoTesto(p, 'dettaglio') ?? nomeDi(p);
}

export function etichettaDato(p: unknown): string {
  return campoTesto(p, 'etichetta') ?? nomeDi(p);
}

/** Codice dell'elemento cliccato (drill-down): il codice del dato, altrimenti il nome. */
export function codiceDalClic(p: { name?: string; data?: unknown }): string | undefined {
  const dato = p.data;
  if (typeof dato === 'object' && dato !== null && typeof (dato as { codice?: unknown }).codice === 'string') return (dato as { codice: string }).codice;
  return p.name;
}

// ---------------------------------------------------------------- opzioni sicure e in italiano

function tooltipTesto(t: TooltipComponentOption): TooltipComponentOption {
  return { ...t, renderMode: 'richText' };
}

type Asse = { type?: string; axisLabel?: { formatter?: unknown } };

/** Un asse di valori senza formatter: numeri in italiano (ECharts da solo scrive "1,000"). */
function asseItaliano<A extends Asse>(asse: A): A {
  if (asse.type !== 'value' || asse.axisLabel?.formatter) return asse;
  return { ...asse, axisLabel: { ...asse.axisLabel, formatter: (v: number) => formatNumber(v) } };
}

function assiItaliani(assi: unknown): unknown {
  if (!assi) return assi;
  return Array.isArray(assi) ? assi.map((a: Asse) => asseItaliano(a)) : asseItaliano(assi as Asse);
}

/**
 * Le opzioni come il kit le passa a ECharts:
 * - tooltip disegnato nel grafico (richText) e non come HTML: il tooltip HTML di ECharts scrive attributi style con
 *   innerHTML, bloccati dalla CSP senza stili inline, e porterebbe testo del backend nel DOM come HTML;
 * - assi di valori senza formatter con i numeri in italiano.
 * Il wrapper Grafico le applica a ogni grafico.
 */
export function opzioniSicure(opzioni: EChartsOption): EChartsOption {
  const t = opzioni.tooltip;
  return {
    ...opzioni,
    ...(t ? { tooltip: Array.isArray(t) ? t.map(tooltipTesto) : tooltipTesto(t) } : {}),
    ...(opzioni.xAxis ? { xAxis: assiItaliani(opzioni.xAxis) as EChartsOption['xAxis'] } : {}),
    ...(opzioni.yAxis ? { yAxis: assiItaliani(opzioni.yAxis) as EChartsOption['yAxis'] } : {}),
  };
}

/** Firma del contenuto delle opzioni (le funzioni per il loro sorgente): stessa firma, stesso grafico. */
export function firmaOpzioni(opzioni: EChartsOption): string {
  return JSON.stringify(opzioni, (_chiave, v: unknown) => (typeof v === 'function' ? String(v) : v));
}
