// primitive.ts — mattoni generici e PURI dei builder di grafici: numeri, testi in italiano, descrizione accessibile,
// scorrimento delle barre, dato di una serie con i testi gia' composti e i callback che li leggono. Nessun dominio.
import type { DataZoomComponentOption, EChartsOption, GridComponentOption, TooltipComponentOption, YAXisComponentOption } from 'echarts';
import { ettari, formatEttari, formatEuro, formatNumber, formatPercentuale } from '../format';

export const NON_DISPONIBILE = 'non disponibile';
export const NON_CALCOLABILE = 'non calcolabile';
/** Oltre questo numero di categorie le barre si scorrono (dataZoom). */
export const MAX_BARRE_VISIBILI = 12;

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
  return `${(v / 1_000_000).toLocaleString('it-IT', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} M€`;
}

/**
 * Importo di KPI, etichette, tooltip e descrizioni accessibili: in milioni da un milione in su, altrimenti in euro pieni
 * (un importo piccolo non sembra uno zero: 300 € non diventa "0,0 M€", review v3 X-03).
 */
export function importoBreve(v: number): string {
  return Math.abs(v) >= 1_000_000 ? milioni(v) : formatEuro(v);
}

export function valoreBreve(v: unknown): string {
  return typeof v === 'number' ? importoBreve(v) : NON_DISPONIBILE;
}

export function valoreEttari(v: unknown): string {
  return typeof v === 'number' ? ettari(v) : NON_DISPONIBILE;
}

/** Tacca di un asse di superfici: ettari senza decimali oltre i 10 ha, con due decimali sotto. */
export function asseEttari(v: number): string {
  return Math.abs(v) >= 10 ? `${v.toLocaleString('it-IT', { maximumFractionDigits: 0 })} ha` : `${formatEttari(v)} ha`;
}

export function valoreInNumero(v: unknown): string {
  return typeof v === 'number' ? formatNumber(v) : NON_DISPONIBILE;
}

/** Una percentuale gia' in centesimi per il tooltip, oppure "non disponibile". */
export function valorePercentuale(v: unknown): string {
  return typeof v === 'number' ? formatPercentuale(v) : NON_DISPONIBILE;
}

export function assePercentuale(v: number): string {
  return formatPercentuale(v);
}

/** Tacca di un asse di importi: in milioni da un milione in su, sotto in euro senza decimali (mai "0,0 M€" ripetuto). */
export function asseImporti(v: number): string {
  return Math.abs(v) >= 1_000_000 ? milioni(v) : v.toLocaleString('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
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
 * Unit Amount del procedurale). Una sola resa per tutte le barre orizzontali (review H6 del procedurale).
 */
export function asseCategorieOrizzontale(categorie: readonly string[]): YAXisComponentOption {
  return { type: 'category', inverse: true, data: [...categorie], axisLabel: { width: 180, overflow: 'break' } };
}

/** La griglia che contiene le etichette degli assi, com'era containLabel (deprecato in ECharts 6: grid.outerBounds). */
export const GRIGLIA_CON_ETICHETTE: GridComponentOption = { outerBoundsMode: 'same', outerBoundsContain: 'axisLabel' };

/**
 * Scorrimento delle barre quando le categorie sono piu' di MAX_BARRE_VISIBILI (se ne mostrano MAX_BARRE_VISIBILI), lungo
 * l'asse delle categorie: x per le barre verticali, y per quelle orizzontali.
 */
export function zoomSeMolti(n: number, asse: 'x' | 'y' = 'x'): { dataZoom?: DataZoomComponentOption[] } {
  if (n <= MAX_BARRE_VISIBILI) return {};
  const finestra = { [asse === 'x' ? 'xAxisIndex' : 'yAxisIndex']: 0, startValue: 0, endValue: MAX_BARRE_VISIBILI - 1 };
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
