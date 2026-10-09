// sigc.ts — grafici SIGC: imbuto delle domande (TX-0012), cascata degli importi (TX-0013, con le domande senza uno
// degli importi dichiarate: le somme sono parziali), barre della verifica SMP per intervento (TX-0015).
import type { EChartsOption, FunnelSeriesOption } from 'echarts';
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
import type { DomandeSigcLike, ImportiSigcLike, RigaSmp } from './dto';
import { assenzaImporto, cellaImporto, cellaNumero, codiceDi, valoreDi } from './resa';

// ---------------------------------------------------------------- 1. imbuto delle domande SIGC

function quotaSulle(presentate: number | null) {
  return (v: number): string => (presentate != null && presentate > 0 ? formatPercentuale(percentuale(v, presentate)) : NON_CALCOLABILE);
}

function serieImbuto(dati: DatoSerie[]): FunnelSeriesOption {
  return {
    type: 'funnel',
    name: 'Domande SIGC',
    sort: 'none',
    min: 0,
    max: Math.max(...dati.map((x) => x.value)),
    gap: 2,
    // etichette bianche e in grassetto dentro i segmenti: contrasto sufficiente su ogni colore della palette
    label: { show: true, position: 'inside', formatter: etichettaDato, color: COLORI.superficie, fontWeight: 600, textBorderColor: 'rgba(0,0,0,.35)', textBorderWidth: 2 },
    data: dati,
  };
}

/** Imbuto delle domande SIGC: presentate, pagate, da pagare (in quest'ordine), con la quota sulle presentate. */
export function graficoImbutoSigc(d: DomandeSigcLike): DatiGrafico {
  const presentate = numeroDi(d.presentate);
  const fasi = [
    { nome: 'Presentate', valore: presentate },
    { nome: 'Pagate', valore: numeroDi(d.pagate) },
    { nome: 'Da pagare', valore: numeroDi(d.daPagare) },
  ];
  const quota = quotaSulle(presentate);
  const tabella = { caption: 'Domande SIGC: presentate, pagate e da pagare', colonne: ['Fase', 'Domande', 'Quota sulle presentate'], righe: fasi.map((f) => [f.nome, cellaNumero(f.valore), f.valore == null ? NON_CALCOLABILE : quota(f.valore)]) };
  const omessi = fasi.filter((f) => f.valore == null).map((f) => `${f.nome}: numero di domande ${NON_DISPONIBILE}`);
  if (presentate == null) return nonDisegnabile("domande presentate non disponibili: l'imbuto non si può disegnare", tabella, omessi);
  if (presentate <= 0) return nonDisegnabile("nessuna domanda presentata: l'imbuto non si può disegnare", tabella, omessi);
  const dati = fasi.flatMap((f): DatoSerie[] => (f.valore == null ? [] : [{ value: f.valore, name: f.nome, etichetta: `${f.nome}: ${formatNumber(f.valore)}`, dettaglio: `${f.nome}: ${plurale(f.valore, 'domanda', 'domande')} (${quota(f.valore)} delle presentate)` }]));
  const descrizione = `Imbuto delle domande SIGC: ${dati.map((x) => `${x.name.toLowerCase()} ${formatNumber(x.value)} (${quota(x.value)})`).join(', ')}.${notaOmessi(omessi)}`;
  const opzioni: EChartsOption = { aria: aria(descrizione), tooltip: { trigger: 'item', formatter: tooltipDettaglio }, series: [serieImbuto(dati)] };
  return { opzioni, tabella, omessi };
}

// ---------------------------------------------------------------- 2. cascata degli importi SIGC

const NOTA_FONTI_DIVERSE = 'Fonti diverse: il pagato viene dal flusso ASR2-20';
const VOCI_SIGC = [
  { nome: 'Richiesto', campo: 'richiesto' },
  { nome: 'Ammesso', campo: 'ammesso' },
  { nome: 'Pagato', campo: 'pagato' },
] as const;

interface ValoriSigc {
  richiesto: number;
  ammesso: number;
  pagato: number;
}

/** Il motivo per cui la cascata non si disegna, oppure null con i tre valori utilizzabili. */
function motivoCascataSigc(i: ImportiSigcLike): { motivo: string } | { valori: ValoriSigc } {
  const mancanti = VOCI_SIGC.filter((v) => valoreDi(i[v.campo]) == null);
  if (mancanti.length > 0) return { motivo: `la cascata richiede richiesto, ammesso e pagato: ${mancanti.map((v) => `${v.nome.toLowerCase()} ${assenzaImporto(i[v.campo], true)}`).join(', ')}` };
  const valori = { richiesto: valoreDi(i.richiesto) as number, ammesso: valoreDi(i.ammesso) as number, pagato: valoreDi(i.pagato) as number };
  const regole: Array<[boolean, string]> = [
    [valori.richiesto < 0 || valori.ammesso < 0 || valori.pagato < 0, 'importi negativi: la cascata non si può disegnare'],
    [valori.ammesso > valori.richiesto, "l'ammesso supera il richiesto: la cascata non si può disegnare"],
    [valori.pagato > valori.ammesso, "il pagato supera l'ammesso: la cascata non si può disegnare"],
  ];
  const violata = regole.find(([condizione]) => condizione);
  return violata ? { motivo: violata[1] } : { valori };
}

/** Le domande senza uno dei tre importi: le somme le escludono, quindi si dichiarano accanto agli importi. */
function righeDomandeSenza(i: ImportiSigcLike): string[][] {
  const s = i.domandeSenza;
  if (!s) return [];
  return [
    ['Domande senza importo richiesto', cellaNumero(s.richiesto)],
    ['Domande senza importo ammesso', cellaNumero(s.ammesso)],
    ['Domande senza importo pagato', cellaNumero(s.pagato)],
  ];
}

function tabellaCascataSigc(i: ImportiSigcLike, valori: ValoriSigc | null) {
  const differenza = (a: number, b: number) => (valori ? formatEuro(centesimi(a - b)) : NON_CALCOLABILE);
  const righe = [
    ['Richiesto', cellaImporto(i.richiesto, true)],
    ['Non ammesso (richiesto meno ammesso)', valori ? differenza(valori.richiesto, valori.ammesso) : NON_CALCOLABILE],
    ['Ammesso', cellaImporto(i.ammesso, true)],
    ['Non ancora pagato (ammesso meno pagato)', valori ? differenza(valori.ammesso, valori.pagato) : NON_CALCOLABILE],
    ['Pagato', cellaImporto(i.pagato, true)],
    ['Ancora da pagare (dal DTO)', cellaImporto(i.ancoraDaPagare, true)],
    ...righeDomandeSenza(i),
  ];
  const [ammesso, pagato, daPagare] = [valoreDi(i.ammesso), valoreDi(i.pagato), valoreDi(i.ancoraDaPagare)];
  if (ammesso != null && pagato != null && daPagare != null && centesimi(ammesso - pagato) !== centesimi(daPagare)) righe.push(['Nota', NOTA_FONTI_DIVERSE]);
  return { caption: 'Importi delle domande SIGC: dal richiesto al pagato', colonne: ['Voce', 'Importo'], righe };
}

/** Cascata richiesto -> non ammesso -> ammesso -> non ancora pagato -> pagato degli importi SIGC. */
export function graficoCascataSigc(i: ImportiSigcLike): DatiGrafico {
  const esito = motivoCascataSigc(i);
  const valori = 'valori' in esito ? esito.valori : null;
  const tabella = tabellaCascataSigc(i, valori);
  const omessi = VOCI_SIGC.filter((v) => valoreDi(i[v.campo]) == null).map((v) => `${v.nome} ${assenzaImporto(i[v.campo], true)}`);
  if (!valori) return nonDisegnabile('motivo' in esito ? esito.motivo : 'la cascata non si può disegnare', tabella, omessi);
  const passi: PassoCascata[] = [
    { nome: 'Richiesto', valore: valori.richiesto, base: 0, colore: COLORI.scuro },
    { nome: 'Non ammesso', valore: centesimi(valori.richiesto - valori.ammesso), base: valori.ammesso, colore: COLORI.attenzione },
    { nome: 'Ammesso', valore: valori.ammesso, base: 0, colore: COLORI.primario },
    { nome: 'Non ancora pagato', valore: centesimi(valori.ammesso - valori.pagato), base: valori.pagato, colore: COLORI.attenzione },
    { nome: 'Pagato', valore: valori.pagato, base: 0, colore: COLORI.positivo },
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
    },
  );
}
