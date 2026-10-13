// sigc.ts — grafici SIGC: barre delle domande (TX-0012: presentate, pagate, da pagare e senza importi, insiemi che si
// sovrappongono), cascata degli importi (TX-0013: dall'ammesso all'ancora da pagare con i valori del contratto, con le
// domande senza uno degli importi dichiarate: le somme sono parziali), barre della verifica SMP per intervento (TX-0015).
// Gli importi SIGC sono somme per domanda: NON_VALORIZZATO vuol dire che l'importo manca su tutte le domande della
// selezione (D-09 del backend), quindi si rende come il dato assente nella fonte, non come un totale per intervento.
import type { EChartsOption } from 'echarts';
import {
  COLORI,
  NON_CALCOLABILE,
  NON_DISPONIBILE,
  aria,
  barreRaggruppate,
  centesimi,
  descrizioneCascata,
  etichettaDato,
  formatEuro,
  formatNumber,
  formatPercentuale,
  nonDisegnabile,
  notaOmessi,
  numeroDi,
  opzioniCascata,
  percentuale,
  plurale,
  tooltipDettaglio,
} from '../../../../shared/lib';
import type { DatiGrafico, DatoSerie, PassoCascata } from '../../../../shared/lib';
import type { DomandeSigcLike, ImportiSigcLike, RigaSmp } from '../dto';
import { numeroOpzionale } from '../formato';
import { assenzaImporto, cellaImporto, codiceDi, valoreDi } from '../importi';

// ---------------------------------------------------------------- 1. domande SIGC

/**
 * Le voci di TX-0012 (D-09 del backend), con l'etichetta delle tabelle: pagate e da pagare vengono dagli importi della
 * domanda (flusso ASR2-20), come l'importo pagato di TX-0013. Una domanda pagata in parte e' sia pagata sia da pagare;
 * quelle senza importi non sono ne' l'una ne' l'altra; le presentate fuori da tutte e tre non sono ammesse ne' pagate.
 */
// `codice`: la voce nel contratto dei link verso l'elenco operativo (lib/link-elenco), nel dato di ogni barra.
export const VOCI_DOMANDE_SIGC = [
  { codice: 'PRESENTATE', nome: 'Presentate', campo: 'presentate', etichetta: 'Presentate', colore: COLORI.scuro },
  { codice: 'PAGATA', nome: 'Pagate', campo: 'pagate', etichetta: 'Pagate (importo pagato maggiore di zero)', colore: COLORI.positivo },
  { codice: 'DA_PAGARE', nome: 'Da pagare', campo: 'daPagare', etichetta: 'Da pagare (ammesse con importo ancora da pagare, anche se pagate in parte)', colore: COLORI.attenzione },
  { codice: 'SENZA_IMPORTI', nome: 'Senza importi', campo: 'senzaImporti', etichetta: 'Senza importi (non classificabili: campagne senza ASR2-20)', colore: COLORI.attenuato },
] as const;

function quotaSulle(presentate: number | null) {
  return (v: number): string => (presentate != null && presentate > 0 ? formatPercentuale(percentuale(v, presentate)) : NON_CALCOLABILE);
}

function datoDomande(codice: string, nome: string, valore: number, colore: string, quota: (v: number) => string): DatoSerie {
  const domande = plurale(valore, 'domanda', 'domande');
  if (codice === 'PRESENTATE') return { value: valore, name: nome, codice, etichetta: formatNumber(valore), dettaglio: `${nome}: ${domande}`, itemStyle: { color: colore } };
  return { value: valore, name: nome, codice, etichetta: `${formatNumber(valore)} (${quota(valore)})`, dettaglio: `${nome}: ${domande} (${quota(valore)} delle presentate)`, itemStyle: { color: colore } };
}

/**
 * Barre orizzontali delle domande SIGC, ognuna con la quota sulle presentate. Non e' un imbuto ne' una partizione delle
 * presentate: pagate e da pagare si sovrappongono (domande pagate in parte) e la descrizione lo dice.
 */
export function graficoDomandeSigc(d: DomandeSigcLike): DatiGrafico {
  const presentate = numeroDi(d.presentate);
  const voci = VOCI_DOMANDE_SIGC.map((v) => ({ ...v, valore: numeroDi(d[v.campo]) }));
  const quota = quotaSulle(presentate);
  const tabella = {
    caption: 'Domande SIGC: presentate, pagate, da pagare e senza importi',
    colonne: ['Voce', 'Domande', 'Quota sulle presentate'],
    righe: voci.map((v) => [v.etichetta, numeroOpzionale(v.valore), v.valore == null ? NON_CALCOLABILE : quota(v.valore)]),
  };
  const omessi = voci.filter((v) => v.valore == null).map((v) => `${v.nome}: numero di domande ${NON_DISPONIBILE}`);
  if (presentate == null) return nonDisegnabile('domande presentate non disponibili: il grafico non si può disegnare', tabella, omessi);
  if (presentate <= 0) return nonDisegnabile('nessuna domanda presentata: il grafico non si può disegnare', tabella, omessi);
  const dati = voci.flatMap((v): DatoSerie[] => (v.valore == null ? [] : [datoDomande(v.codice, v.nome, v.valore, v.colore, quota)]));
  const descrizione =
    `Barre delle domande SIGC: ${dati.map((x) => `${x.name.toLowerCase()} ${x.etichetta ?? formatNumber(x.value)}`).join(', ')}. ` +
    `Pagate e da pagare si sovrappongono (domande pagate in parte): le voci non sommano alle presentate.${notaOmessi(omessi)}`;
  const opzioni: EChartsOption = {
    aria: aria(descrizione),
    tooltip: { trigger: 'item', formatter: tooltipDettaglio },
    // spazio a destra per le etichette ("6000 (60 %)") oltre la barra piu' lunga, quella delle presentate
    grid: { right: 110 },
    xAxis: { type: 'value', min: 0 },
    yAxis: { type: 'category', inverse: true, data: dati.map((x) => x.name) },
    series: [{ type: 'bar', name: 'Domande SIGC', data: dati, label: { show: true, position: 'right', formatter: etichettaDato } }],
  };
  return { opzioni, tabella, omessi };
}

// ---------------------------------------------------------------- 2. cascata degli importi SIGC

/**
 * Le voci della cascata con i valori del contratto, nell'ordine in cui si disegnano: ammesso + pagato oltre l'ammesso -
 * pagato = ancora da pagare (D-09 del backend). Il pagato oltre l'ammesso si aggiunge prima di togliere il pagato: le
 * basi restano non negative anche quando il pagato supera l'ammesso.
 */
const VOCI_CASCATA = [
  { nome: 'Ammesso', campo: 'ammesso' },
  { nome: "Pagato oltre l'ammesso", campo: 'pagatoOltreAmmesso' },
  { nome: 'Pagato', campo: 'pagato' },
  { nome: 'Ancora da pagare', campo: 'ancoraDaPagare' },
] as const;

interface ValoriSigc {
  ammesso: number;
  oltre: number;
  pagato: number;
  daPagare: number;
}

/** Il motivo per cui la cascata non si disegna, oppure i quattro valori del contratto, che tornano al centesimo. */
function motivoCascataSigc(i: ImportiSigcLike): { motivo: string } | { valori: ValoriSigc } {
  const mancanti = VOCI_CASCATA.filter((v) => valoreDi(i[v.campo]) == null);
  if (mancanti.length > 0) {
    return { motivo: `la cascata richiede ammesso, pagato oltre l'ammesso, pagato e ancora da pagare: ${mancanti.map((v) => `${v.nome.toLowerCase()} ${assenzaImporto(i[v.campo])}`).join(', ')}` };
  }
  const [ammesso, oltre, pagato, daPagare] = VOCI_CASCATA.map((v) => valoreDi(i[v.campo]) as number);
  if ([ammesso, oltre, pagato, daPagare].some((v) => v < 0)) return { motivo: 'importi negativi: la cascata non si può disegnare' };
  // le somme escludono le domande senza uno degli importi: se non sono sulle stesse domande i valori non tornano
  if (centesimi(ammesso + oltre - pagato) !== centesimi(daPagare)) {
    return { motivo: 'ammesso, pagato e ancora da pagare non tornano (somme su domande diverse, vedi le domande senza importo): la cascata non si può disegnare' };
  }
  return { valori: { ammesso, oltre, pagato, daPagare } };
}

/**
 * Il non ammesso (richiesto meno ammesso) solo sulle stesse domande: tante senza richiesto quante senza ammesso e
 * richiesto non inferiore all'ammesso. Altrimenti il motivo, e richiesto e non ammesso restano fuori dalla cascata.
 */
function nonAmmesso(i: ImportiSigcLike): { valore: number } | { motivo: string } {
  const [richiesto, ammesso] = [valoreDi(i.richiesto), valoreDi(i.ammesso)];
  if (richiesto == null) return { motivo: `richiesto ${assenzaImporto(i.richiesto)}` };
  if (ammesso == null) return { motivo: `ammesso ${assenzaImporto(i.ammesso)}` };
  const senza = i.domandeSenza;
  if (senza?.richiesto == null || senza.ammesso == null) return { motivo: 'non si sa se richiesto e ammesso sono sulle stesse domande' };
  if (senza.richiesto !== senza.ammesso) {
    return { motivo: `richiesto e ammesso sono somme su domande diverse (${plurale(senza.richiesto, 'domanda', 'domande')} senza richiesto, ${formatNumber(senza.ammesso)} senza ammesso)` };
  }
  return ammesso > richiesto ? { motivo: "l'ammesso supera il richiesto" } : { valore: centesimi(richiesto - ammesso) };
}

/** Le domande senza uno dei tre importi: le somme le escludono, quindi si dichiarano accanto agli importi. */
function righeDomandeSenza(i: ImportiSigcLike): string[][] {
  const s = i.domandeSenza;
  if (!s) return [];
  return [
    ['Domande senza importo richiesto', numeroOpzionale(s.richiesto)],
    ['Domande senza importo ammesso', numeroOpzionale(s.ammesso)],
    ['Domande senza importo pagato', numeroOpzionale(s.pagato)],
  ];
}

function cellaNonAmmesso(i: ImportiSigcLike, escluso: { valore: number } | { motivo: string }): string {
  if ('valore' in escluso) return formatEuro(escluso.valore);
  // con richiesto o ammesso assenti la differenza e' solo non calcolabile: l'assenza e' gia' nella sua riga
  return valoreDi(i.richiesto) == null || valoreDi(i.ammesso) == null ? NON_CALCOLABILE : `${NON_CALCOLABILE} (${escluso.motivo})`;
}

function tabellaCascataSigc(i: ImportiSigcLike, escluso: { valore: number } | { motivo: string }) {
  const righe = [
    ['Richiesto', cellaImporto(i.richiesto)],
    ['Non ammesso (richiesto meno ammesso)', cellaNonAmmesso(i, escluso)],
    ['Ammesso', cellaImporto(i.ammesso)],
    ["Pagato oltre l'ammesso", cellaImporto(i.pagatoOltreAmmesso)],
    ['Pagato', cellaImporto(i.pagato)],
    ['Ancora da pagare', cellaImporto(i.ancoraDaPagare)],
    ...righeDomandeSenza(i),
  ];
  return { caption: "Importi delle domande SIGC: dal richiesto all'ancora da pagare", colonne: ['Voce', 'Importo'], righe };
}

/** La voce omessa per richiesto e non ammesso: il richiesto assente, oppure il motivo del non ammesso (con l'ammesso). */
function omessoRichiesto(i: ImportiSigcLike, escluso: { valore: number } | { motivo: string }): string[] {
  if (valoreDi(i.richiesto) == null) return [`Richiesto ${assenzaImporto(i.richiesto)}`];
  return valoreDi(i.ammesso) != null && 'motivo' in escluso ? [`Richiesto e non ammesso: ${escluso.motivo}`] : [];
}

/**
 * Cascata degli importi SIGC: richiesto -> non ammesso -> ammesso -> pagato oltre l'ammesso -> pagato -> ancora da
 * pagare, con i valori del contratto (il browser calcola solo il non ammesso, e solo sulle stesse domande).
 */
export function graficoCascataSigc(i: ImportiSigcLike): DatiGrafico {
  const escluso = nonAmmesso(i);
  const tabella = tabellaCascataSigc(i, escluso);
  const omessi = [...omessoRichiesto(i, escluso), ...VOCI_CASCATA.filter((v) => valoreDi(i[v.campo]) == null).map((v) => `${v.nome} ${assenzaImporto(i[v.campo])}`)];
  const esito = motivoCascataSigc(i);
  if ('motivo' in esito) return nonDisegnabile(esito.motivo, tabella, omessi);
  const { ammesso, oltre, pagato, daPagare } = esito.valori;
  const richiesto: PassoCascata[] =
    'valore' in escluso
      ? [
          { nome: 'Richiesto', valore: valoreDi(i.richiesto) as number, base: 0, colore: COLORI.scuro },
          { nome: 'Non ammesso', valore: escluso.valore, base: ammesso, colore: COLORI.attenzione },
        ]
      : [];
  const passi: PassoCascata[] = [
    ...richiesto,
    { nome: 'Ammesso', valore: ammesso, base: 0, colore: COLORI.primario },
    { nome: "Pagato oltre l'ammesso", valore: oltre, base: ammesso, colore: COLORI.attenzione },
    { nome: 'Pagato', valore: pagato, base: daPagare, colore: COLORI.positivo },
    { nome: 'Ancora da pagare', valore: daPagare, base: 0, colore: COLORI.primario },
  ];
  return { opzioni: opzioniCascata(passi, descrizioneCascata('Cascata degli importi SIGC', passi, omessi)), tabella, omessi };
}

// ---------------------------------------------------------------- 3. verifica SMP

/** Barre raggruppate per intervento: previsione di pagamento dell'esercizio e spesa erogata nella campagna precedente. */
export function graficoSmp(righe: RigaSmp[]): DatiGrafico {
  const voci = righe.map((r) => {
    const importi = [r.previsionePagamentoEsercizio, r.spesaErogataCampagnaPrecedente];
    const codice = codiceDi(r);
    return { categoria: codice, codice, valori: importi.map(valoreDi), celle: importi.map((x) => cellaImporto(x)) };
  });
  return barreRaggruppate(
    voci,
    [
      { nome: 'Previsione di pagamento', soggetto: 'previsione di pagamento' },
      { nome: 'Spesa erogata nella campagna precedente', soggetto: 'spesa erogata nella campagna precedente' },
    ],
    {
      caption: 'Previsione di pagamento e spesa erogata nella campagna precedente per intervento',
      colonne: ['Intervento', 'Previsione di pagamento', 'Spesa erogata nella campagna precedente'],
      titolo: 'Barre raggruppate della previsione di pagamento e della spesa erogata nella campagna precedente',
      vuoto: 'nessun intervento con previsione di pagamento o spesa erogata valorizzate',
      unita: ['intervento', 'interventi'],
    },
  );
}
