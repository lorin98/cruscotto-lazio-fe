// grafici.ts — builder PURI dei grafici dell'istituzionale, dal catalogo dei tipi del kit (ADR 0027): barre per un
// confronto fra interventi (la spesa pubblica erogata non SIGC di TX-0016, zoom oltre 12; clic: il dettaglio
// dell'intervento) e barre raggruppate per anno delle tre misure dell'output di un intervento (TX-0017, una sola unita' di
// misura: OP-IS-06) col target di fine periodo come linea di riferimento, che e' anche una riga della tabella equivalente
// (note WCAG: non solo il colore). Gli anni o gli interventi senza valore sono omessi e dichiarati col motivo, mai a zero;
// il realizzato non SIGC e' cumulativo e quello SIGC annuale: le barre non si sommano.
import type { BarSeriesOption, EChartsOption } from 'echarts';
import { descriviImporto, testoConNota } from '../../../entities/importo';
import type { ImportoLike } from '../../../entities/importo';
import { COLORI, aria, barreRaggruppate, formatEuro, formatNumber, minuscolaIniziale, numeroDi, valoreInNumero } from '../../../shared/lib';
import type { DatiGrafico, MisuraBarre, VoceRaggruppata } from '../../../shared/lib';
import type { RigaOutput, RigaVerifica } from './dto';
import { quantita, testoMotivato, testoTarget } from './formato';
import { MISURE, etichettaMisura } from './output';

/** Cella della tabella equivalente di un importo: euro al centesimo, oppure l'assenza col motivo (mai uno zero). */
function cellaImporto(importo: ImportoLike): string {
  return importo.valore != null ? formatEuro(importo.valore) : testoConNota(descriviImporto(importo));
}

export const TITOLO_SPESA = 'Spesa pubblica erogata per intervento (anticipi inclusi)';

/** Barre della spesa pubblica erogata non SIGC per intervento (anticipi inclusi, al lordo dei recuperi); clic: il dettaglio. */
export function graficoSpesa(righe: readonly RigaVerifica[]): DatiGrafico {
  const voci: VoceRaggruppata[] = righe.map((r) => ({ categoria: r.codiceIntervento, codice: r.codiceIntervento, valori: [numeroDi(r.spesaErogata.valore)], celle: [cellaImporto(r.spesaErogata)] }));
  return barreRaggruppate(voci, [{ nome: 'Spesa pubblica erogata (anticipi inclusi)', soggetto: 'spesa pubblica erogata' }], {
    caption: 'Spesa pubblica erogata non SIGC per intervento (anticipi inclusi, al lordo dei recuperi)',
    colonne: ['Intervento', 'Spesa pubblica erogata (anticipi inclusi)'],
    titolo: 'Barre della spesa pubblica erogata non SIGC',
    vuoto: 'nessun intervento con la spesa erogata valorizzata',
    unita: ['intervento', 'interventi'],
  });
}

/**
 * La misura delle barre dell'output: il testo dei valori con l'unita' dell'indicatore (solo nei testi gia' composti, mai
 * in una funzione delle opzioni), tooltip e asse coi numeri in italiano senza dati catturati.
 */
function misuraOutput(unita: string | null): MisuraBarre {
  return { breve: (v) => quantita(v, unita), valore: valoreInNumero, asse: formatNumber, descrizione: unita ? `quantità in ${unita}` : "quantità nell'unità di misura dell'indicatore" };
}

/** Il target come linea di riferimento sulla prima serie, con l'asse che lo contiene, e nella descrizione accessibile. */
function conTarget(opzioni: EChartsOption, r: RigaOutput, testo: string): EChartsOption {
  const target = numeroDi(r.targetFinePeriodo.valore);
  const [prima, ...altre] = (opzioni.series ?? []) as BarSeriesOption[];
  if (target === null || !prima) return opzioni;
  const massimo = Math.max(0, ...r.anni.flatMap((a) => MISURE.map((m) => numeroDi(a[m].valore) ?? 0)));
  const linea: BarSeriesOption['markLine'] = { symbol: 'none', silent: true, lineStyle: { type: 'dashed', color: COLORI.scuro }, label: { formatter: '{b}' }, data: [{ name: `Target ${testo}`, yAxis: target }] };
  const descrizione = (opzioni.aria as { label?: { description?: string } } | undefined)?.label?.description ?? '';
  return {
    ...opzioni,
    aria: aria(`${descrizione} Target di fine periodo: ${testo}.`),
    yAxis: { ...(opzioni.yAxis as object), ...(target > massimo ? { max: target } : {}) },
    series: [{ ...prima, markLine: linea }, ...altre],
  };
}

/**
 * Barre raggruppate per anno dell'output di un intervento: programmato, realizzato SIGC, realizzato non SIGC (cumulativo),
 * nell'unita' dell'indicatore, col target di fine periodo; nessun clic. La tabella equivalente ha una riga per anno e
 * una per il target.
 */
export function graficoOutputPerAnno(r: RigaOutput, cumulativo: boolean): DatiGrafico {
  const unita = r.unitaMisura;
  const definizioni = MISURE.map((m) => ({ nome: etichettaMisura(m, cumulativo), soggetto: minuscolaIniziale(etichettaMisura(m, cumulativo)) }));
  const voci: VoceRaggruppata[] = r.anni.map((a) => ({
    categoria: String(a.anno),
    valori: MISURE.map((m) => numeroDi(a[m].valore)),
    celle: MISURE.map((m) => testoMotivato(a[m], (v) => quantita(v, unita))),
  }));
  const testi = {
    caption: `Tabella equivalente: output dell'intervento ${r.codiceIntervento} per anno${unita ? `, in ${unita}` : ''}`,
    colonne: ['Anno', ...definizioni.map((d) => d.nome)],
    titolo: `Barre raggruppate dell'output di ${r.codiceIntervento}`,
    vuoto: "nessun anno con un valore dell'output",
    unita: ['anno', 'anni'] as [string, string],
  };
  const g = barreRaggruppate(voci, definizioni, testi, [], misuraOutput(unita));
  const target = testoTarget(r.targetFinePeriodo, r.annoTarget, unita);
  const tabella = { ...g.tabella, righe: [...g.tabella.righe, ['Target di fine periodo', target, '', '']] };
  return { ...g, tabella, opzioni: g.opzioni && conTarget(g.opzioni, r, target) };
}
