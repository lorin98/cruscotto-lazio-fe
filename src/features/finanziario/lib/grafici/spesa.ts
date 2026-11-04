// spesa.ts — grafici della spesa per intervento (TX-0002, TX-0011): avanzamento del pagato lordo sulla dotazione, dotazione
// per famiglia di intervento, dotazione e pagato affiancati (il contributo ambientale e' uscito con le revisioni del
// 31/10/2026, R14). I dati per intervento portano il
// codice (drill-down). Col perimetro ADA la dotazione (regionale) non si confronta con i pagamenti (dell'area).
import type { BarSeriesOption, EChartsOption, SunburstSeriesOption, TreemapSeriesOption } from 'echarts';
import type { ImportoLike } from '../../../../entities/importo';
import {
  COLORI,
  NON_CALCOLABILE,
  aria,
  arrotondaPercentuale,
  assePercentuale,
  barreRaggruppate,
  confronta,
  etichettaDato,
  formatEuro,
  formatPercentuale,
  importoBreve,
  nonDisegnabile,
  notaOmessi,
  plurale,
  sommaCentesimi,
  tooltipDettaglio,
  asseCategorieOrizzontale,
} from '../../../../shared/lib';
import type { DatiGrafico, DatoSerie, TabellaEquivalente } from '../../../../shared/lib';
import { famigliaDi } from '../famiglie';
import { avanzamentoPonderato, esclusione } from '../avanzamento';
import type { InterventoAvanzamento } from '../avanzamento';
import type { RigaSpesa } from '../dto';
import { cellaImporto, codiceDi, problemaDotazione, valoreDi } from '../importi';
import { PERIMETRO_ADA } from '../perimetro';

export const MOTIVO_ADA_RAPPORTO = "perimetro ADA: la dotazione è regionale, i pagamenti sono dell'area: il rapporto non è confrontabile";
/** I pagamenti totali di TX-0002 e TX-0005: lordi, dagli elenchi di liquidazione dei decreti (il netto e' di TX-0007 e TX-0011). */
export const PAGAMENTI_LORDI = 'Pagamenti totali (lordi, elenchi di liquidazione)';
/** Etichetta breve dei pagamenti totali (Home), sempre con "lordi" come nella panoramica. */
export const PAGAMENTI_LORDI_BREVE = 'Pagamenti totali (lordi)';
/** Quota del pagato lordo (TX-0002) sulla dotazione: KPI della panoramica e card della Home. */
export const PAGATO_LORDO_SULLA_DOTAZIONE = 'Pagato lordo sulla dotazione';

// ---------------------------------------------------------------- 1. avanzamento per intervento

const CAPTION_AVANZAMENTO = 'Pagato lordo sulla dotazione di spesa pubblica per intervento';
const COLONNE_AVANZAMENTO = ['Intervento', 'Dotazione', 'Pagato (lordo)', 'Pagato lordo sulla dotazione'];

/** Colore della quota pagata sulla dotazione: >= 50% positivo, >= 30% primario, altrimenti attenzione. */
function coloreQuota(quota: number): string {
  if (quota >= 0.5) return COLORI.positivo;
  return quota >= 0.3 ? COLORI.primario : COLORI.attenzione;
}

function datoAvanzamento(x: InterventoAvanzamento): DatoSerie {
  const valore = arrotondaPercentuale(x.quota * 100);
  const etichetta = formatPercentuale(valore);
  return { value: valore, name: x.codice, codice: x.codice, etichetta, dettaglio: `${x.codice}: ${etichetta} della dotazione (pagato ${importoBreve(x.pagato)} su ${importoBreve(x.dotazione)})`, itemStyle: { color: coloreQuota(x.quota) } };
}

function descrizioneAvanzamento(dati: readonly DatoSerie[], media: number, omessi: readonly string[]): string {
  const prima = dati[0];
  const ultima = dati[dati.length - 1];
  const estremi = dati.length === 1 ? `${prima.name} ${prima.etichetta}` : `dalla quota più alta, ${prima.name} ${prima.etichetta}, alla più bassa, ${ultima.name} ${ultima.etichetta}`;
  return `Barre orizzontali del pagato lordo sulla dotazione per ${plurale(dati.length, 'intervento', 'interventi')}: ${estremi}; media ponderata ${formatPercentuale(media)}.${notaOmessi(omessi)}`;
}

function opzioniAvanzamento(dati: DatoSerie[], media: number, omessi: readonly string[]): EChartsOption {
  const massimo = Math.max(100, Math.ceil(Math.max(...dati.map((d) => d.value)) / 10) * 10);
  const serie: BarSeriesOption = {
    type: 'bar',
    name: 'Pagato lordo sulla dotazione',
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
    // tutti gli interventi con la loro etichetta (R02): l'altezza del grafico segue il numero di interventi
    yAxis: asseCategorieOrizzontale(dati.map((d) => d.name)),
    series: [serie],
  };
}

/** Righe della tabella fuori dal grafico: tutte col perimetro ADA, altrimenti quelle escluse (decise riga per riga). */
function righeOmesseAvanzamento(righe: readonly RigaSpesa[], ada: boolean): string[][] {
  const esito = ada ? 'non confrontabile (perimetro ADA)' : NON_CALCOLABILE;
  return righe.filter((r) => ada || esclusione(r) != null).map((r) => [codiceDi(r), cellaImporto(r.dotazioneSpesaPubblica), cellaImporto(r.pagamentiTotali), esito]);
}

/** Barre orizzontali del pagato lordo (TX-0002) sulla dotazione per intervento, dalla quota maggiore, con la media ponderata. */
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
  /** Somma delle foglie (dotazioni positive): l'area del riquadro. */
  totale: number;
  foglie: Array<{ codice: string; dotazione: number }>;
  /** Dotazioni presenti ma zero o negative: fuori dal grafico, dentro la dotazione della famiglia (review v3 N-01). */
  fuori: number[];
  /** Interventi della famiglia senza la dotazione (valore assente): con anche uno solo il totale non e' calcolabile. */
  mancanti: string[];
}

/** Dotazione della famiglia: foglie piu' dotazioni zero o negative, come il KPI della dotazione. */
const dotazioneFamiglia = (f: Famiglia) => sommaCentesimi([f.totale, ...f.fuori]);

interface NodoAlbero {
  name: string;
  value: number;
  codice?: string;
  etichetta: string;
  dettaglio: string;
  children?: NodoAlbero[];
}

// ogni famiglia con almeno un intervento, anche se nessuno si disegna: ha la sua riga di totale (review v3 M-02)
function raggruppaFamiglie(righe: readonly RigaSpesa[]) {
  const perNome = new Map<string, Famiglia>();
  const famigliaDiNome = (nome: string): Famiglia => {
    const f = perNome.get(nome) ?? { nome, totale: 0, foglie: [], fuori: [], mancanti: [] };
    perNome.set(nome, f);
    return f;
  };
  const righeOmesse: string[][] = [];
  const omessi: string[] = [];
  for (const r of righe) {
    const codice = codiceDi(r);
    const f = famigliaDiNome(famigliaDi(r.codiceIntervento ?? ''));
    const problema = problemaDotazione(r.dotazioneSpesaPubblica);
    const valore = valoreDi(r.dotazioneSpesaPubblica);
    if (!problema) {
      f.foglie.push({ codice, dotazione: valore as number });
      continue;
    }
    omessi.push(`${codice}: ${problema}`);
    righeOmesse.push([f.nome, codice, cellaImporto(r.dotazioneSpesaPubblica)]);
    // un valore assente manca al totale; uno zero o un negativo c'e', anche se non si disegna
    if (valore == null) f.mancanti.push(codice);
    else f.fuori.push(valore);
  }
  const famiglie = [...perNome.values()]
    .map((f) => ({ ...f, totale: sommaCentesimi(f.foglie.map((x) => x.dotazione)), foglie: [...f.foglie].sort((a, b) => b.dotazione - a.dotazione || confronta(a.codice, b.codice)) }))
    .sort((a, b) => dotazioneFamiglia(b) - dotazioneFamiglia(a) || confronta(a.nome, b.nome));
  return { famiglie, righeOmesse, omessi };
}

/** Il totale della famiglia, o "non calcolabile" con gli interventi che mancano: mai una somma parziale (review v3 X-02). */
function totaleFamiglia(f: Famiglia, formato: (v: number) => string): string {
  return f.mancanti.length === 0 ? formato(dotazioneFamiglia(f)) : `${NON_CALCOLABILE} (manca per ${f.mancanti.join(', ')})`;
}

// L'area del riquadro e' la somma delle foglie disegnate; quando la dotazione della famiglia e' diversa (un intervento
// manca, o ha dotazione zero o negativa) etichetta e dettaglio dicono le due cose distinte (review v3 X-02 e M-01).
function etichettaFamiglia(f: Famiglia): string {
  if (f.mancanti.length > 0) return `${f.nome}\n${NON_CALCOLABILE}`;
  const dotazione = dotazioneFamiglia(f);
  return dotazione === f.totale ? `${f.nome}\n${importoBreve(dotazione)}` : `${f.nome}\n${importoBreve(dotazione)} (nel grafico ${importoBreve(f.totale)})`;
}

function dettaglioFamiglia(f: Famiglia): string {
  const disegnati = plurale(f.foglie.length, 'intervento', 'interventi');
  if (f.mancanti.length > 0) return `Famiglia ${f.nome}: dotazione ${totaleFamiglia(f, importoBreve)}; ${disegnati} con dotazione, ${importoBreve(f.totale)}`;
  if (f.fuori.length === 0) return `Famiglia ${f.nome}: ${disegnati}, dotazione ${importoBreve(f.totale)}`;
  const fuori = `${plurale(f.fuori.length, 'intervento', 'interventi')} fuori dal grafico (dotazione zero o negativa), ${importoBreve(sommaCentesimi(f.fuori))}`;
  return `Famiglia ${f.nome}: dotazione ${importoBreve(dotazioneFamiglia(f))}; ${disegnati} nel grafico, ${importoBreve(f.totale)}; ${fuori}`;
}

function nodoFamiglia(f: Famiglia): NodoAlbero {
  return {
    name: f.nome,
    value: f.totale,
    etichetta: etichettaFamiglia(f),
    dettaglio: dettaglioFamiglia(f),
    children: f.foglie.map((x) => ({ name: x.codice, value: x.dotazione, codice: x.codice, etichetta: `${x.codice}\n${importoBreve(x.dotazione)}`, dettaglio: `${x.codice} (famiglia ${f.nome}): dotazione ${importoBreve(x.dotazione)}` })),
  };
}

function serieFamiglie(nodi: NodoAlbero[], forma: 'treemap' | 'sunburst'): TreemapSeriesOption | SunburstSeriesOption {
  return forma === 'treemap'
    ? { type: 'treemap', name: 'Dotazione', data: nodi, nodeClick: 'zoomToNode', leafDepth: 1, roam: false, breadcrumb: { show: true }, label: { show: true, formatter: etichettaDato } }
    : { type: 'sunburst', name: 'Dotazione', data: nodi, nodeClick: 'rootToNode', radius: ['12%', '90%'], label: { formatter: '{b}' } };
}

/**
 * Confronto fra le famiglie per la descrizione: tutte, anche quelle senza interventi disegnati. Con una famiglia parziale
 * la maggiore non si puo' dire (la somma parziale e' solo un limite inferiore): si dice per quali manca.
 */
function confrontoFamiglie(famiglie: readonly Famiglia[]): string {
  const parziali = famiglie.filter((f) => f.mancanti.length > 0);
  if (parziali.length > 0) return `dotazione non calcolabile per ${parziali.map((f) => `${f.nome} (manca per ${f.mancanti.join(', ')})`).join(', ')}`;
  return `la famiglia con la dotazione maggiore è ${famiglie[0].nome} (${importoBreve(dotazioneFamiglia(famiglie[0]))})`;
}

/** Gerarchia famiglia -> intervento della dotazione (treemap con zoom o raggiera); le foglie portano il codice. */
export function graficoFamiglie(righe: RigaSpesa[], forma: 'treemap' | 'sunburst' = 'treemap'): DatiGrafico {
  const { famiglie, righeOmesse, omessi } = raggruppaFamiglie(righe);
  const righeTabella = [...famiglie.flatMap((f) => [...f.foglie.map((x) => [f.nome, x.codice, formatEuro(x.dotazione)]), [f.nome, 'Totale della famiglia', totaleFamiglia(f, formatEuro)]]), ...righeOmesse];
  const tabella = { caption: 'Dotazione di spesa pubblica per famiglia e intervento', colonne: ['Famiglia', 'Intervento', 'Dotazione'], righe: righeTabella };
  const disegnate = famiglie.filter((f) => f.foglie.length > 0);
  if (disegnate.length === 0) return nonDisegnabile('nessun intervento con dotazione valorizzata e positiva', tabella, omessi);
  const interventi = disegnate.reduce((n, f) => n + f.foglie.length, 0);
  const tipo = forma === 'treemap' ? 'Mappa ad albero' : 'Grafico a raggiera';
  const descrizione =
    `${tipo} della dotazione di spesa pubblica per famiglia di intervento: ${plurale(disegnate.length, 'famiglia', 'famiglie')} e ` +
    `${plurale(interventi, 'intervento', 'interventi')}; ${confrontoFamiglie(famiglie)}.${notaOmessi(omessi)}`;
  const opzioni: EChartsOption = { aria: aria(descrizione), tooltip: { trigger: 'item', formatter: tooltipDettaglio }, series: [serieFamiglie(disegnate.map(nodoFamiglia), forma)] };
  return { opzioni, tabella, omessi };
}

// ---------------------------------------------------------------- 4. dotazione e pagato per intervento

const INTERVENTI: [string, string] = ['intervento', 'interventi'];
const OMESSO_ADA_DOTAZIONE = "perimetro ADA: la dotazione regionale non si affianca ai pagamenti dell'area";

export interface RigaDotazionePagato {
  codiceIntervento?: string;
  dotazione?: ImportoLike | null;
  /** L'impegnato di spesa pubblica (uguale al cofinanziato FEASR e non), rilevato piu' stimato. */
  impegnato?: ImportoLike | null;
  pagato?: ImportoLike | null;
}

/** La serie dell'impegnato nel grafico per intervento (revisione del 04/11/2026). */
export const IMPEGNATO_SPESA_PUBBLICA = 'Impegnato spesa pubblica';

function voce(r: RigaDotazionePagato, importi: Array<ImportoLike | null | undefined>) {
  const codice = codiceDi(r);
  return { categoria: codice, codice, valori: importi.map(valoreDi), celle: importi.map((i) => cellaImporto(i)) };
}

/**
 * Barre raggruppate dotazione / impegnato / pagato per intervento (l'impegnato dal 04/11/2026); nel perimetro ADA impegnato e
 * pagato, misure per domanda dell'area, senza la dotazione regionale (review step9 del 04/11/2026, J-06). `nomePagato` dice
 * quale pagato e': i pagamenti totali lordi degli elenchi di liquidazione (TX-0002) o i pagamenti al netto delle rettifiche
 * (TX-0011), mai l'uno per l'altro.
 */
export function graficoDotazionePagamenti(righe: RigaDotazionePagato[], perimetro?: string | null, nomePagato = PAGAMENTI_LORDI): DatiGrafico {
  const pagato = { nome: nomePagato, soggetto: nomePagato.toLowerCase() };
  // i pagamenti restano verdi come prima del 04/11/2026; l'impegnato, aggiunto in mezzo, ha il suo colore
  const impegnato = { nome: IMPEGNATO_SPESA_PUBBLICA, soggetto: 'impegnato di spesa pubblica', colore: COLORI.attenzione };
  const pagatoVerde = { ...pagato, colore: COLORI.positivo };
  if (perimetro === PERIMETRO_ADA) {
    const testi = {
      caption: `Impegnato e ${pagato.soggetto} per intervento`,
      colonne: ['Intervento', IMPEGNATO_SPESA_PUBBLICA, nomePagato],
      titolo: `Barre raggruppate di impegnato e ${pagato.soggetto}`,
      vuoto: `nessun intervento con impegnato o ${pagato.soggetto} valorizzati`,
      unita: INTERVENTI,
    };
    return barreRaggruppate(righe.map((r) => voce(r, [r.impegnato, r.pagato])), [impegnato, pagatoVerde], testi, { omessi: [OMESSO_ADA_DOTAZIONE], orizzontale: true });
  }
  const testi = {
    caption: `Dotazione, impegnato e ${pagato.soggetto} per intervento`,
    colonne: ['Intervento', 'Dotazione', IMPEGNATO_SPESA_PUBBLICA, nomePagato],
    titolo: `Barre raggruppate di dotazione, impegnato e ${pagato.soggetto}`,
    vuoto: `nessun intervento con dotazione, impegnato o ${pagato.soggetto} valorizzati`,
    unita: INTERVENTI,
  };
  const serie = [{ nome: 'Dotazione', soggetto: 'dotazione', colore: COLORI.primario }, impegnato, pagatoVerde];
  // in orizzontale: tutti gli interventi con la loro etichetta, uno per riga (R02, wireframe "tutte le etichette"; review K-01)
  return barreRaggruppate(righe.map((r) => voce(r, [r.dotazione, r.impegnato, r.pagato])), serie, testi, { orizzontale: true });
}
