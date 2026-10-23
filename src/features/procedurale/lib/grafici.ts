// grafici.ts — builder PURI dei grafici del procedurale, dal catalogo dei tipi del kit (ADR 0027): barre orizzontali
// impilate degli stati delle domande (rilasciate e non ancora rilasciate: il segmento delle non rilasciate ha anche un
// motivo a tratteggio, non solo il colore), barre orizzontali dello stato area programmazione e delle sottofasi, barre
// raggruppate per intervento (importi, ammesse e con atto, domande del riepilogo; zoom oltre 12) e barre orizzontali
// raggruppate delle Unit Amount. Ogni grafico ha la tabella equivalente; i valori senza fonte o non valorizzati sono
// omessi e dichiarati col motivo, mai a zero; una fonte non attiva per tutto il grafico lo rende non disponibile, detto
// in testo. Il dato di ogni barra porta il codice del drill-down (intervento, chiave della voce, riga delle Unit Amount).
import type { BarSeriesOption, EChartsOption } from 'echarts';
import { descriviAssenza, testoConNota, testoMotivato } from '../../../entities/importo';
import { COLORI, GRIGLIA_CON_ETICHETTE, MISURA_EURO, MISURA_NUMERI, MISURA_PERCENTUALI, aria, asseCategorieOrizzontale, barreRaggruppate, formatEuro, formatNumber, formatPercentuale, nonDisegnabile, notaOmessi, plurale, tooltipDettaglio, valoreInNumero } from '../../../shared/lib';
import type { DatiGrafico, DatoSerie, MisuraBarre, TabellaEquivalente, VoceRaggruppata } from '../../../shared/lib';
import type { RigaAmmesse, RigaRiepilogo, RigaUnitAmount, Sottofasi, TipoDomanda } from './dto';
import { NON_DISPONIBILE_BREVE, resaAssenza } from './formato';
import { etichettaVoce } from './sottofasi';
import { diTipo, rilasciate } from './stati';
import type { VoceDistribuzione } from './stati';
import { chiaveUnitAmount, etichettaUnitAmount } from './unitAmount';

/** Conteggi di domande: i numeri del kit, con la descrizione accessibile che dice cosa contano. */
export const MISURA_DOMANDE: MisuraBarre = { ...MISURA_NUMERI, descrizione: 'numeri di domande' };

const INTERVENTI: [string, string] = ['intervento', 'interventi'];

/** Le domande di una voce in testo: il numero, oppure l'assenza col motivo (mai 0 per una voce senza fonte). */
export function testoDomande(v: VoceDistribuzione): string {
  return v.domande === null ? testoConNota(descriviAssenza(v.assenza)) : formatNumber(v.domande);
}

/** Il di cui non rilasciate in testo: "non disponibile" per la voce senza fonte (scelta 5 approvata). */
export function testoNonRilasciate(v: VoceDistribuzione): string {
  return v.nonRilasciate === null ? NON_DISPONIBILE_BREVE.testo : formatNumber(v.nonRilasciate);
}

/** I testi di un grafico per stato: titolo (descrizione accessibile), didascalia della tabella e intestazione delle voci. */
interface TestiStati {
  titolo: string;
  caption: string;
  voce: string;
}

/** Il totale della distribuzione, ultima riga della tabella equivalente (dal backend, mai sommato qui). */
interface TotaleStati {
  domande: number;
  nonRilasciate?: number;
}

/** La tabella equivalente di un grafico degli stati: voce, domande, di cui non rilasciate; in fondo il totale. */
export function tabellaStati(voci: readonly VoceDistribuzione[], testi: TestiStati, totale?: TotaleStati): TabellaEquivalente {
  const righe = voci.map((v) => [v.etichetta, testoDomande(v), testoNonRilasciate(v)]);
  if (totale) righe.push(['Totale', formatNumber(totale.domande), formatNumber(totale.nonRilasciate ?? 0)]);
  return { caption: testi.caption, colonne: [testi.voce, 'Domande', 'Di cui non rilasciate'], righe };
}

const dato = (v: VoceDistribuzione, valore: number, dettaglio: string): DatoSerie => ({ value: valore, name: v.etichetta, codice: v.chiave, dettaglio });

/** Le due serie impilate: rilasciate e non ancora rilasciate (questa col tratteggio, distinguibile senza il colore). */
function serieStati(voci: readonly VoceDistribuzione[]): BarSeriesOption[] {
  return [
    { type: 'bar', name: 'Rilasciate', stack: 'stati', data: voci.map((v) => dato(v, rilasciate(v) ?? 0, `${v.etichetta}: ${formatNumber(rilasciate(v))} rilasciate`)) },
    {
      type: 'bar',
      name: 'Non ancora rilasciate',
      stack: 'stati',
      itemStyle: { color: COLORI.attenzione, decal: { symbol: 'rect', dashArrayX: [1, 0], dashArrayY: [2, 3], rotation: -0.785 } },
      data: voci.map((v) => dato(v, v.nonRilasciate ?? 0, `${v.etichetta}: ${formatNumber(v.nonRilasciate)} non ancora rilasciate`)),
    },
  ];
}

/** Descrizione accessibile: ogni voce col numero e, se ci sono, le non rilasciate. */
function descrizioneStati(titolo: string, voci: readonly VoceDistribuzione[], omessi: readonly string[]): string {
  const elenco = voci.map((v) => `${v.etichetta} ${formatNumber(v.domande)}${(v.nonRilasciate ?? 0) > 0 ? ` (di cui ${formatNumber(v.nonRilasciate)} non rilasciate)` : ''}`);
  return `${titolo}: barre orizzontali impilate delle domande rilasciate e non ancora rilasciate per ${plurale(voci.length, 'stato', 'stati')}: ${elenco.join(', ')}.${notaOmessi(omessi)}`;
}

/** Barre orizzontali impilate degli stati (voci nell'ordine dato); la voce senza fonte e' omessa e dichiarata. */
export function graficoStati(voci: readonly VoceDistribuzione[], testi: TestiStati, totale?: TotaleStati): DatiGrafico {
  const tabella = tabellaStati(voci, testi, totale);
  const omessi = voci.filter((v) => v.domande === null).map((v) => `${v.etichetta}: ${testoDomande(v)}`);
  const disegnate = voci.filter((v) => v.domande !== null);
  if (disegnate.length === 0) return nonDisegnabile('nessuno stato con le domande', tabella, omessi);
  const opzioni: EChartsOption = {
    aria: aria(descrizioneStati(testi.titolo, disegnate, omessi)),
    legend: {},
    tooltip: { trigger: 'axis', valueFormatter: valoreInNumero },
    grid: GRIGLIA_CON_ETICHETTE,
    xAxis: { type: 'value', min: 0 },
    yAxis: asseCategorieOrizzontale(disegnate.map((v) => v.etichetta)),
    series: serieStati(disegnate),
  };
  return { opzioni, tabella, omessi };
}

/** Barre orizzontali di una sola serie (stato area programmazione, sottofasi): le voci coi numeri, nell'ordine dato. */
function barreOrizzontali(voci: readonly { etichetta: string; chiave: string; valore: number }[], nome: string, descrizione: string): EChartsOption {
  return {
    aria: aria(descrizione),
    tooltip: { trigger: 'item', formatter: tooltipDettaglio },
    grid: GRIGLIA_CON_ETICHETTE,
    xAxis: { type: 'value', min: 0 },
    yAxis: asseCategorieOrizzontale(voci.map((v) => v.etichetta)),
    series: [{ type: 'bar', name: nome, data: voci.map((v): DatoSerie => ({ value: v.valore, name: v.etichetta, codice: v.chiave, dettaglio: `${v.etichetta}: ${formatNumber(v.valore)}` })) }],
  };
}

/** Barre dello stato area programmazione: le voci di RF025, gli stati osservati, le domande senza stato; il totale in fondo. */
export function graficoArea(voci: readonly VoceDistribuzione[], titolo: string, totale?: number): DatiGrafico {
  const righe = voci.map((v) => [v.etichetta, testoDomande(v)]);
  if (totale !== undefined) righe.push(['Totale', formatNumber(totale)]);
  const tabella: TabellaEquivalente = { caption: titolo, colonne: ['Stato area programmazione', 'Domande'], righe };
  const disegnate = voci.flatMap((v) => (v.domande === null ? [] : [{ etichetta: v.etichetta, chiave: v.chiave, valore: v.domande }]));
  if (disegnate.length === 0) return nonDisegnabile('nessuna domanda per stato area programmazione', tabella, []);
  const descrizione = `${titolo}: barre orizzontali per ${plurale(disegnate.length, 'stato', 'stati')}: ${disegnate.map((v) => `${v.etichetta} ${formatNumber(v.valore)}`).join(', ')}.`;
  return { opzioni: barreOrizzontali(disegnate, 'Domande', descrizione), tabella, omessi: [] };
}

/** Un importo (richiesto, ammesso) in testo: l'euro, oppure l'assenza col motivo. */
export function testoImporto(d: { valore?: number | null; motivo?: string | null; fonte?: string | null } | undefined): string {
  return testoMotivato(d, formatEuro);
}

/** Barre raggruppate dell'importo richiesto e del contributo ammesso per intervento (TX-0026); clic: il dettaglio. */
export function graficoImporti(righe: readonly RigaAmmesse[], titolo: string): DatiGrafico {
  const voci: VoceRaggruppata[] = righe.map((r) => ({
    categoria: r.codiceIntervento,
    codice: r.codiceIntervento,
    valori: [r.importoRichiesto.valore ?? null, r.contributoAmmesso.valore ?? null],
    celle: [testoImporto(r.importoRichiesto), testoImporto(r.contributoAmmesso)],
  }));
  const definizioni = [
    { nome: 'Importo richiesto', soggetto: 'importo richiesto' },
    { nome: 'Contributo ammesso', soggetto: 'contributo ammesso' },
  ];
  return barreRaggruppate(voci, definizioni, { caption: titolo, colonne: ['Intervento', 'Importo richiesto', 'Contributo ammesso'], titolo, vuoto: 'nessun importo valorizzato', unita: INTERVENTI }, { misura: MISURA_EURO });
}

/** La fonte dell'atto di concessione non e' attiva per nessun intervento (nessun atto nel database: D-03 Rev. 4). */
export function attoSenzaFonte(righe: readonly RigaAmmesse[]): boolean {
  return righe.length > 0 && righe.every((r) => r.conAttoConcessione.motivo === 'FONTE_NON_ATTIVA');
}

/**
 * Barre raggruppate delle domande ammesse e di quelle con atto di concessione per intervento; con la fonte dell'atto non
 * attiva la seconda serie e' omessa e dichiarata una volta (mai a 0), la tabella dice l'assenza in ogni riga.
 */
export function graficoAmmesseConAtto(righe: readonly RigaAmmesse[], titolo: string): DatiGrafico {
  const senzaFonte = attoSenzaFonte(righe);
  const voci: VoceRaggruppata[] = righe.map((r) => ({
    categoria: r.codiceIntervento,
    codice: r.codiceIntervento,
    valori: senzaFonte ? [r.domandeAmmesse] : [r.domandeAmmesse, r.conAttoConcessione.valore ?? null],
    celle: [formatNumber(r.domandeAmmesse), testoMotivato(r.conAttoConcessione, formatNumber)],
  }));
  const ammesse = { nome: 'Domande ammesse', soggetto: 'domande ammesse' };
  const definizioni = senzaFonte ? [ammesse] : [ammesse, { nome: 'Con atto di concessione', soggetto: 'domande con atto di concessione' }];
  const omessi = senzaFonte ? [`Domande con atto di concessione: ${testoMotivato(righe[0].conAttoConcessione, formatNumber)} per tutti gli interventi`] : [];
  return barreRaggruppate(voci, definizioni, { caption: titolo, colonne: ['Intervento', 'Domande ammesse', 'Con atto di concessione'], titolo, vuoto: 'nessun intervento', unita: INTERVENTI }, { omessi, misura: MISURA_DOMANDE });
}

/** Barre raggruppate delle domande di sostegno, di pagamento CSR-DP e ammesse per intervento (TX-0029); clic: il dettaglio. */
export function graficoRiepilogo(righe: readonly RigaRiepilogo[], titolo: string): DatiGrafico {
  const voci: VoceRaggruppata[] = righe.flatMap((r) => {
    const codice = r.ammesse?.codiceIntervento;
    if (codice === undefined) return [];
    const valori = [r.statiSostegno?.totale ?? null, r.statiPagamento?.totale ?? null, r.ammesse?.domandeAmmesse ?? null];
    return [{ categoria: codice, codice, valori, celle: valori.map((v) => (v === null ? NON_DISPONIBILE_BREVE.testo : formatNumber(v))) }];
  });
  const definizioni = [
    { nome: 'Domande di sostegno', soggetto: 'domande di sostegno' },
    { nome: 'Domande di pagamento CSR-DP', soggetto: 'domande di pagamento CSR-DP' },
    { nome: 'Domande ammesse', soggetto: 'domande ammesse' },
  ];
  return barreRaggruppate(voci, definizioni, { caption: titolo, colonne: ['Intervento', 'Domande di sostegno', 'Domande di pagamento', 'Domande ammesse'], titolo, vuoto: 'nessun intervento', unita: INTERVENTI }, { misura: MISURA_DOMANDE });
}

/** La fonte delle sottofasi della domanda non e' attiva per il tipo (nessuna domanda legata a una sottofase: D-06 Rev. 2). */
export function sottofasiSenzaFonte(s: Sottofasi): boolean {
  return (s.voci ?? []).some((v) => v.domande.motivo === 'FONTE_NON_ATTIVA');
}

/**
 * Barre orizzontali delle voci di SR-01 della domanda di sostegno o di pagamento con le domande della voce (TX-0031,
 * TX-0032); senza la fonte il grafico non e' disponibile e lo dice; una voce non censita e' omessa e dichiarata. Nessun
 * clic: l'elenco operativo non ha un filtro per sottofase (OP-PR-08).
 */
export function graficoSottofasi(s: Sottofasi, tipo: TipoDomanda, titolo: string): DatiGrafico {
  const voci = s.voci ?? [];
  const tabella: TabellaEquivalente = { caption: titolo, colonne: ['Sottofase (SR-01)', 'Domande della voce'], righe: voci.map((v) => [etichettaVoce(v), testoMotivato(v.domande, formatNumber)]) };
  if (sottofasiSenzaFonte(s)) return nonDisegnabile(`nessuna domanda ${diTipo(tipo)} è legata a una sottofase (${descriviAssenza(voci[0]?.domande).nota ?? 'fonte non attiva'})`, tabella, []);
  const omessi = voci.filter((v) => v.domande.valore == null).map((v) => `${etichettaVoce(v)}: ${testoMotivato(v.domande, formatNumber)}`);
  const disegnate = voci.flatMap((v) => (v.domande.valore == null ? [] : [{ etichetta: etichettaVoce(v), chiave: v.fase, valore: v.domande.valore }]));
  if (disegnate.length === 0) return nonDisegnabile('nessuna voce censita', tabella, omessi);
  const descrizione = `${titolo}: barre orizzontali per ${plurale(disegnate.length, 'voce', 'voci')}: ${disegnate.map((v) => `${v.etichetta} ${formatNumber(v.valore)}`).join(', ')}.${notaOmessi(omessi)}`;
  return { opzioni: barreOrizzontali(disegnate, 'Domande della voce', descrizione), tabella, omessi };
}

/** Il pagato delle Unit Amount non e' attivo (nessuna Unit Amount ha l'importo pagato: D-06 Rev. 2, OP-010). */
export function pagatoSenzaFonte(righe: readonly RigaUnitAmount[]): boolean {
  return righe.some((r) => r.importoPagato?.motivo === 'FONTE_NON_ATTIVA');
}

const percentuale = (d: RigaUnitAmount['percentualePagata']) => testoMotivato(d, formatPercentuale);

/** Una percentuale del pagato in testo, con la fonte non attiva "non disponibile" in breve: il motivo lo dice la card. */
const percentualeBreve = (d: RigaUnitAmount['percentualePagata']) => (d?.valore != null ? formatPercentuale(d.valore) : testoConNota(resaAssenza(d, true)));

/**
 * Barre orizzontali raggruppate della percentuale pagata e della base storica per Unit Amount (TX-0030); senza la fonte
 * del pagato il grafico non e' disponibile e lo dice una volta nel testo della card, la tabella equivalente ha le celle
 * "non disponibile" in breve (scelta 8 approvata). Clic su una barra: l'anteprima della riga (codice = la riga).
 */
export function graficoUnitAmount(righe: readonly RigaUnitAmount[], titolo: string): DatiGrafico {
  const voci: VoceRaggruppata[] = righe.map((r) => ({
    categoria: etichettaUnitAmount(r),
    codice: chiaveUnitAmount(r),
    valori: [r.percentualePagata?.valore ?? null, r.baseStorica?.valore ?? null],
    celle: [percentuale(r.percentualePagata), percentuale(r.baseStorica)],
  }));
  const definizioni = [
    { nome: 'Percentuale pagata', soggetto: 'percentuale pagata' },
    { nome: 'Base storica', soggetto: 'base storica' },
  ];
  const testi = { caption: titolo, colonne: ['Unit Amount', 'Pagato sul richiesto', 'Base storica'], titolo, vuoto: 'nessuna percentuale valorizzata', unita: ['Unit Amount', 'Unit Amount'] as [string, string] };
  if (pagatoSenzaFonte(righe)) {
    const tabella: TabellaEquivalente = { caption: titolo, colonne: testi.colonne, righe: righe.map((r) => [etichettaUnitAmount(r), percentualeBreve(r.percentualePagata), percentualeBreve(r.baseStorica)]) };
    return nonDisegnabile(`nessuna Unit Amount ha ancora l'importo pagato (${descriviAssenza(righe[0]?.importoPagato).nota ?? 'fonte non attiva'})`, tabella, []);
  }
  return barreRaggruppate(voci, definizioni, testi, { misura: MISURA_PERCENTUALI, orizzontale: true });
}
