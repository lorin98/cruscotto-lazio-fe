// grafici.ts — builder PURI dei grafici delle superfici (TX-0018), dal catalogo dei tipi del kit (ADR 0027): barre
// raggruppate per un confronto fra interventi (DS e DP nella campagna di riferimento, zoom oltre 12), linea per una serie
// nel tempo (DS e DP per campagna), barre orizzontali con lo zero al centro per una differenza col segno (verifica
// incrociata DP - DS). Ogni grafico ha la tabella equivalente; gli interventi senza superfici sono omessi e dichiarati,
// mai a zero; i valori negativi hanno il segno meno nel testo (il colore non e' l'unico canale).
import type { BarSeriesOption, EChartsOption, LineSeriesOption } from 'echarts';
import {
  COLORI,
  MISURA_ETTARI,
  aria,
  asseEttari,
  barreRaggruppate,
  ettari,
  etichettaDato,
  nonDisegnabile,
  notaOmessi,
  plurale,
  tooltipDettaglio,
  valoreEttari,
} from '../../../shared/lib';
import type { DatiGrafico, DatoSerie, TabellaEquivalente, VoceRaggruppata } from '../../../shared/lib';
import type { InterventoSuperficie } from './dto';
import { ETICHETTE, SENZA_SUPERFICI, cellaDifferenza, cellaSuperficie, testoDifferenza, testoNonInCampagna, testoNonNellaCampagnaFiltrata, testoQuantitaPremio } from './formato';
import { campagnaDi, senzaSuperfici } from './superfici';
import type { InterventoSenzaSuperfici, MotivoSenzaSuperfici } from './superfici';

const SERIE_DS_DP = [
  { nome: 'Superficie DS', soggetto: 'superficie DS' },
  { nome: 'Superficie DP', soggetto: 'superficie DP' },
];

/** Perche' l'intervento non e' nel grafico della campagna, in testo (con il filtro Campagna mai "in nessuna campagna"). */
const MOTIVI_FUORI: Record<MotivoSenzaSuperfici, (anno: number) => string> = {
  'nessuna-campagna': () => SENZA_SUPERFICI,
  'non-in-campagna': testoNonInCampagna,
  'campagna-filtrata': testoNonNellaCampagnaFiltrata,
};

/** Cella breve della tabella equivalente per un intervento fuori dal grafico. */
const CELLE_FUORI: Record<MotivoSenzaSuperfici, string> = {
  'nessuna-campagna': 'non valorizzato',
  'non-in-campagna': 'nessuna superficie',
  'campagna-filtrata': 'nessuna superficie (non valorizzato)',
};

function motivoFuori(f: InterventoSenzaSuperfici, anno: number): string {
  return MOTIVI_FUORI[f.motivo](anno);
}

function cellaFuori(f: InterventoSenzaSuperfici): string {
  return CELLE_FUORI[f.motivo];
}

// ---------------------------------------------------------------- superficie DS e DP per intervento

/**
 * Barre raggruppate della superficie DS e DP di ogni intervento nella campagna; clic: anteprima dell'intervento (codice).
 * `campagnaRisposta`: la campagna della risposta (null = letta senza filtro), che dice il motivo degli omessi.
 */
export function graficoPerIntervento(righe: readonly InterventoSuperficie[], anno: number, campagnaRisposta: number | null): DatiGrafico {
  const fuori = senzaSuperfici(righe, anno, campagnaRisposta);
  const voci: VoceRaggruppata[] = righe.flatMap((r) => {
    const c = campagnaDi(r, anno);
    return c ? [{ categoria: r.codiceIntervento, codice: r.codiceIntervento, valori: [c.superficieDs, c.superficieDp], celle: [cellaSuperficie(c.superficieDs), cellaSuperficie(c.superficieDp)] }] : [];
  });
  const testi = {
    caption: `Superficie DS e DP per intervento, campagna ${anno}`,
    colonne: [ETICHETTE.intervento, ETICHETTE.superficieDs, ETICHETTE.superficieDp],
    titolo: 'Barre raggruppate della superficie DS e DP',
    vuoto: `nessun intervento con superfici nella campagna ${anno}`,
    unita: ['intervento', 'interventi'] as [string, string],
  };
  const g = barreRaggruppate(
    voci,
    SERIE_DS_DP,
    testi,
    fuori.map((f) => `${f.codice}: ${motivoFuori(f, anno)}`),
    MISURA_ETTARI,
  );
  return { ...g, tabella: { ...g.tabella, righe: [...g.tabella.righe, ...fuori.map((f) => [f.codice, cellaFuori(f), cellaFuori(f)])] } };
}

// ---------------------------------------------------------------- superficie DS e DP per campagna

/** Un punto della serie per campagna: le superfici di una campagna (somma degli interventi, o di un solo intervento). */
export interface PuntoCampagna {
  anno: number;
  superficieDs: number;
  superficieDp: number;
}

function datiLinea(punti: readonly PuntoCampagna[], campo: 'superficieDs' | 'superficieDp', soggetto: string): DatoSerie[] {
  return punti.map((p) => ({ value: p[campo], name: String(p.anno), codice: String(p.anno), dettaglio: `${p.anno}, ${soggetto}: ${ettari(p[campo])}` }));
}

function descrizioneLinee(titolo: string, punti: readonly PuntoCampagna[]): string {
  const ultimo = punti[punti.length - 1];
  const periodo = punti.length === 1 ? `per la sola campagna ${ultimo.anno}` : `dal ${punti[0].anno} al ${ultimo.anno} (${plurale(punti.length, 'campagna', 'campagne')})`;
  return `${titolo} ${periodo}, superfici in ettari: nel ${ultimo.anno} DS ${ettari(ultimo.superficieDs)} e DP ${ettari(ultimo.superficieDp)}.`;
}

/** Linee della superficie DS e DP campagna per campagna; il clic su un punto porta il suo anno (filtro Campagna). */
export function lineePerCampagna(punti: readonly PuntoCampagna[], { caption, titolo }: { caption: string; titolo: string }): DatiGrafico {
  const tabella: TabellaEquivalente = {
    caption,
    colonne: [ETICHETTE.campagna, ETICHETTE.superficieDs, ETICHETTE.superficieDp],
    righe: punti.map((p) => [String(p.anno), cellaSuperficie(p.superficieDs), cellaSuperficie(p.superficieDp)]),
  };
  if (punti.length === 0) return nonDisegnabile('nessuna campagna con superfici', tabella, []);
  const serie = (campo: 'superficieDs' | 'superficieDp', nome: string, soggetto: string): LineSeriesOption => ({ type: 'line', name: nome, symbolSize: 8, data: datiLinea(punti, campo, soggetto) });
  const opzioni: EChartsOption = {
    aria: aria(descrizioneLinee(titolo, punti)),
    legend: {},
    tooltip: { trigger: 'axis', valueFormatter: valoreEttari },
    xAxis: { type: 'category', data: punti.map((p) => String(p.anno)) },
    yAxis: { type: 'value', axisLabel: { formatter: asseEttari } },
    series: [serie('superficieDs', 'Superficie DS', 'superficie DS'), serie('superficieDp', 'Superficie DP', 'superficie DP')],
  };
  return { opzioni, tabella, omessi: [] };
}

/** Motivo del grafico per campagna non disegnato quando la pagina ha il filtro Campagna (la risposta ha una campagna). */
export const MOTIVO_CON_CAMPAGNA = 'con il filtro Campagna la serie non si disegna: togli il filtro Campagna per vedere tutte le campagne';

/** La serie della card "Superficie DS e DP per campagna": con il filtro Campagna non si disegna e lo dice. */
export function graficoPerCampagna(punti: readonly PuntoCampagna[], filtroCampagna: number | undefined): DatiGrafico {
  const g = lineePerCampagna(punti, { caption: 'Superficie DS e DP per campagna (somma degli interventi scelti dentro ogni campagna)', titolo: 'Linee della superficie DS e DP per campagna' });
  return filtroCampagna === undefined ? g : nonDisegnabile(MOTIVO_CON_CAMPAGNA, g.tabella, []);
}

/**
 * La mini linea dell'anteprima: le superfici di un solo intervento campagna per campagna. Con il filtro Campagna
 * (`campagnaRisposta` non null) la risposta ha la sola campagna filtrata: la serie non si disegna e lo dice, come la card
 * della pagina, senza una seconda lettura di TX-0018 (una lettura per pagina, scelta approvata).
 */
export function graficoInterventoPerCampagna(riga: InterventoSuperficie, campagnaRisposta: number | null): DatiGrafico {
  const g = lineePerCampagna(riga.campagne, {
    caption: `Superficie DS e DP di ${riga.codiceIntervento} per campagna`,
    titolo: `Linee della superficie DS e DP di ${riga.codiceIntervento} per campagna`,
  });
  return campagnaRisposta === null ? g : nonDisegnabile(MOTIVO_CON_CAMPAGNA, g.tabella, []);
}

// ---------------------------------------------------------------- verifica incrociata DP - DS

interface VoceVerifica {
  codice: string;
  differenza: number;
  oltre: number;
}

function etichettaVerifica(v: VoceVerifica): string {
  return `${testoDifferenza(v.differenza)}, ${plurale(v.oltre, 'DP oltre la DS', 'DP oltre la DS')}`;
}

function datoVerifica(v: VoceVerifica): DatoSerie {
  const etichetta = etichettaVerifica(v);
  // il colore distingue i due versi, ma non e' l'unico canale: il segno e' nel testo dell'etichetta e della tabella
  return { value: v.differenza, name: v.codice, codice: v.codice, etichetta, dettaglio: `${v.codice}: differenza DP - DS ${etichetta}`, itemStyle: { color: v.differenza > 0 ? COLORI.attenzione : COLORI.primario } };
}

function descrizioneVerifica(voci: readonly VoceVerifica[], anno: number, omessi: readonly string[]): string {
  const prima = voci[0];
  const ultima = voci[voci.length - 1];
  const estremi = voci.length === 1 ? `${prima.codice} ${testoDifferenza(prima.differenza)}` : `dalla più alta, ${prima.codice} ${testoDifferenza(prima.differenza)}, alla più bassa, ${ultima.codice} ${testoDifferenza(ultima.differenza)}`;
  return `Barre orizzontali della differenza fra superficie DP e superficie DS per ${plurale(voci.length, 'intervento', 'interventi')} nella campagna ${anno}: ${estremi}; a destra dello zero la DP supera la DS.${notaOmessi(omessi)}`;
}

/** Estremo simmetrico dell'asse: lo zero sta al centro, i valori negativi a sinistra. */
function estremo(voci: readonly VoceVerifica[]): number {
  const massimo = Math.max(...voci.map((v) => Math.abs(v.differenza)));
  return massimo > 0 ? Math.ceil(massimo * 1.25 * 10) / 10 : 1;
}

/** Barre orizzontali della differenza DP - DS per intervento nella campagna, dalla maggiore; clic: anteprima. */
export function graficoVerifica(righe: readonly InterventoSuperficie[], anno: number, campagnaRisposta: number | null): DatiGrafico {
  const fuori = senzaSuperfici(righe, anno, campagnaRisposta);
  const omessi = fuori.map((f) => `${f.codice}: ${motivoFuori(f, anno)}`);
  const conCampagna = righe.flatMap((r) => {
    const c = campagnaDi(r, anno);
    return c ? [{ r, c }] : [];
  });
  const voci = conCampagna.map(({ r, c }) => ({ codice: r.codiceIntervento, differenza: c.differenzaDpDs, oltre: c.domandeDpOltreDs })).sort((a, b) => b.differenza - a.differenza);
  const tabella: TabellaEquivalente = {
    caption: `Verifica incrociata: differenza DP - DS per intervento, campagna ${anno}`,
    colonne: [ETICHETTE.intervento, ETICHETTE.differenzaDpDs, ETICHETTE.domandeDpOltreDs, ETICHETTE.quantitaRichiestaPremio],
    righe: [
      ...conCampagna
        .sort((a, b) => b.c.differenzaDpDs - a.c.differenzaDpDs)
        .map(({ r, c }) => [r.codiceIntervento, cellaDifferenza(c.differenzaDpDs), String(c.domandeDpOltreDs), testoQuantitaPremio(c.quantitaRichiestaPremio)]),
      ...fuori.map((f) => [f.codice, cellaFuori(f), '', '']),
    ],
  };
  if (voci.length === 0) return nonDisegnabile(`nessun intervento con superfici nella campagna ${anno}`, tabella, omessi);
  const m = estremo(voci);
  const serie: BarSeriesOption = { type: 'bar', name: 'Differenza DP - DS', data: voci.map(datoVerifica), label: { show: true, position: 'right', formatter: etichettaDato } };
  const opzioni: EChartsOption = {
    aria: aria(descrizioneVerifica(voci, anno, omessi)),
    tooltip: { trigger: 'item', formatter: tooltipDettaglio },
    xAxis: { type: 'value', min: -m, max: m, axisLabel: { formatter: asseEttari } },
    yAxis: { type: 'category', inverse: true, data: voci.map((v) => v.codice) },
    series: [serie],
  };
  return { opzioni, tabella, omessi };
}
