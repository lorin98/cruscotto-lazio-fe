// domande.ts — grafici delle domande per anno di raccolta (TX-0008: barre impilate per annualita') e degli importi per
// anno (TX-0010: linee dello stanziato, dell'ammesso e del decretato). Anno di raccolta = campagna, altrimenti anno di
// rilascio della domanda di sostegno; le domande senza nessuno dei due sono la categoria "senza anno di raccolta", in
// coda. Una serie senza alcun valore (fonte non attiva) non si disegna e si dichiara una volta. L'importo ammesso
// dell'anno e' una somma per domanda: NON_VALORIZZATO = nessuna domanda dell'anno ha l'ammesso (D-09 del backend), e si
// rende come il dato assente nella fonte, non come un totale per intervento che manca.
import type { BarSeriesOption, EChartsOption, LineSeriesOption } from 'echarts';
import type { ImportoLike } from '../../../../entities/importo';
import {
  NON_DISPONIBILE,
  aria,
  asseImporti,
  nonDisegnabile,
  notaOmessi,
  numeroDi,
  plurale,
  valoreBreve,
  valoreInNumero,
} from '../../../../shared/lib';
import type { DatiGrafico } from '../../../../shared/lib';
import { sommaSeCompleta, testoSenzaAmmesso } from '../aggregati';
import type { RigaDomandeAnno, RigaImportiAnno } from '../dto';
import { annoDiRaccolta, numeroOpzionale } from '../formato';
import { assenzaImporto, cellaImporto, perAnno, valoreDi } from '../importi';
import { ETICHETTE_ANNUALITA } from '../../../../entities/domanda';
import type { Annualita } from '../../../../entities/domanda';

// ---------------------------------------------------------------- 1. domande per anno di raccolta

/** Dato di un segmento di Domande per anno di raccolta: il valore e i codici del drill-down (lib/link-elenco li legge). */
export interface DatoSegmentoAnno {
  value: number;
  /** Annualita' della serie. */
  codice: Annualita;
  /** Anno di raccolta; null = le domande senza anno (SENZA). */
  anno: number | null;
}

/**
 * Le annualita' di TX-0008, unica tabella per le serie del grafico e per le colonne della tabella (ui/colonneAnno): il
 * `codice` e' il valore del parametro annualita' dell'elenco operativo e va nel dato di ogni segmento (drill-down).
 */
export const ANNUALITA_DOMANDE = [
  { codice: 'PRIMA', nome: ETICHETTE_ANNUALITA.PRIMA, campo: 'primaAnnualita' },
  { codice: 'ALTRE', nome: ETICHETTE_ANNUALITA.ALTRE, campo: 'altreAnnualita' },
  { codice: 'NON_CLASSIFICATE', nome: ETICHETTE_ANNUALITA.NON_CLASSIFICATE, campo: 'nonClassificate' },
] as const satisfies readonly { codice: Annualita; nome: string; campo: string }[];

/** Barre impilate delle domande per anno di raccolta (senza anno in coda): prima annualita', altre, non classificate. */
export function graficoDomandePerAnno(righe: RigaDomandeAnno[]): DatiGrafico {
  const ordinate = perAnno(righe);
  const categorie = ordinate.map((r) => annoDiRaccolta(r.annoRaccolta));
  const tabella = {
    caption: 'Domande per anno di raccolta',
    colonne: ['Anno di raccolta', ...ANNUALITA_DOMANDE.map((a) => a.nome), 'Totale'],
    righe: ordinate.map((r, k) => [categorie[k], ...ANNUALITA_DOMANDE.map((a) => numeroOpzionale(r[a.campo])), numeroOpzionale(r.totali)]),
  };
  if (ordinate.length === 0) return nonDisegnabile('nessuna domanda per anno di raccolta', tabella, []);
  const omessi: string[] = [];
  const serie: BarSeriesOption[] = ANNUALITA_DOMANDE.map((def) => ({
    type: 'bar',
    name: def.nome,
    stack: 'domande',
    data: ordinate.map((r, k): DatoSegmentoAnno | null => {
      const v = numeroDi(r[def.campo]);
      if (v == null) omessi.push(`${categorie[k]}, ${def.nome.toLowerCase()}: numero di domande ${NON_DISPONIBILE}`);
      return v == null ? null : { value: v, codice: def.codice, anno: r.annoRaccolta ?? null };
    }) as BarSeriesOption['data'],
  }));
  if (!serie.some((s) => (s.data ?? []).some((v) => v != null))) return nonDisegnabile('nessun numero di domande valorizzato', tabella, omessi);
  const totale = sommaSeCompleta(ordinate.map((r) => r.totali));
  const descrizione =
    `Barre impilate delle domande per anno di raccolta (${categorie.join(', ')}): prima annualità, altre annualità e non classificate` +
    `${totale == null ? '' : `; ${plurale(totale, 'domanda', 'domande')} in tutto`}.${notaOmessi(omessi)}`;
  const opzioni: EChartsOption = { aria: aria(descrizione), legend: {}, tooltip: { trigger: 'axis', valueFormatter: valoreInNumero }, xAxis: { type: 'category', data: categorie }, yAxis: { type: 'value' }, series: serie };
  return { opzioni, tabella, omessi };
}

// ---------------------------------------------------------------- 2. importi per anno di raccolta

// `aggregato`: resa di NON_VALORIZZATO come totale (stanziato, decretato) o come dato assente su tutte le domande (ammesso)
const IMPORTI = [
  { nome: 'Importo stanziato', campo: 'importoStanziato', aggregato: true },
  { nome: 'Importo ammesso', campo: 'importoAmmesso', aggregato: false },
  { nome: 'Importo decretato', campo: 'importoDecretato', aggregato: true },
] as const;

function lineaImporti(def: (typeof IMPORTI)[number], righe: readonly RigaImportiAnno[], categorie: readonly string[], omessi: string[]): LineSeriesOption | null {
  const importi: Array<ImportoLike | null | undefined> = righe.map((r) => r[def.campo]);
  const valori = importi.map(valoreDi);
  const soggetto = def.nome.toLowerCase();
  if (valori.every((v) => v == null)) {
    // una serie tutta assente (es. fonte non attiva) si dichiara una volta, con il motivo del primo anno
    omessi.push(`${def.nome}: ${assenzaImporto(importi[0], def.aggregato)} per tutti gli anni`);
    return null;
  }
  valori.forEach((v, k) => {
    if (v == null) omessi.push(`${categorie[k]}: ${soggetto} ${assenzaImporto(importi[k], def.aggregato)}`);
  });
  return { type: 'line', name: def.nome, connectNulls: false, data: valori };
}

/**
 * Colonne della tabella equivalente di Importi per anno (dopo quella dell'anno): titolo e testo della cella. Una sola
 * definizione per la tabella generata dal grafico e per quella con i link all'elenco operativo (review v4 V-06): con o senza
 * il grant la vista Tabella ha le stesse intestazioni e gli stessi testi.
 */
export const COLONNE_IMPORTI_PER_ANNO: readonly { titolo: string; cella: (r: RigaImportiAnno) => string }[] = [
  { titolo: 'Stanziato', cella: (r) => cellaImporto(r.importoStanziato, true) },
  { titolo: 'Ammesso', cella: (r) => cellaImporto(r.importoAmmesso) },
  { titolo: 'Decretato', cella: (r) => cellaImporto(r.importoDecretato, true) },
  { titolo: 'Domande senza importo ammesso', cella: (r) => numeroOpzionale(r.domandeSenzaAmmesso) },
];

/** Linee degli importi per anno di raccolta; i punti assenti sono vuoti (mai zero) e dichiarati, come le domande senza ammesso. */
export function graficoImportiPerAnno(righe: RigaImportiAnno[]): DatiGrafico {
  const ordinate = perAnno(righe);
  const categorie = ordinate.map((r) => annoDiRaccolta(r.annoRaccolta));
  const tabella = {
    caption: 'Importi per anno di raccolta: stanziato, ammesso e decretato',
    colonne: ['Anno', ...COLONNE_IMPORTI_PER_ANNO.map((c) => c.titolo)],
    righe: ordinate.map((r, k) => [categorie[k], ...COLONNE_IMPORTI_PER_ANNO.map((c) => c.cella(r))]),
  };
  if (ordinate.length === 0) return nonDisegnabile('nessun importo per anno di raccolta', tabella, []);
  const omessi: string[] = [];
  const serie = IMPORTI.map((def) => lineaImporti(def, ordinate, categorie, omessi)).filter((s): s is LineSeriesOption => s != null);
  if (serie.length === 0) return nonDisegnabile('nessun importo valorizzato per anno di raccolta', tabella, omessi);
  const senzaAmmesso = sommaSeCompleta(ordinate.map((r) => r.domandeSenzaAmmesso));
  if (senzaAmmesso) omessi.push(testoSenzaAmmesso(senzaAmmesso));
  const descrizione = `Linee ${serie.map((s) => `dell'${String(s.name).toLowerCase()}`).join(' e ')} per anno di raccolta (${categorie.join(', ')}), importi in euro.${notaOmessi(omessi)}`;
  const opzioni: EChartsOption = {
    aria: aria(descrizione),
    legend: {},
    tooltip: { trigger: 'axis', valueFormatter: valoreBreve },
    dataZoom: [{ type: 'inside' }],
    xAxis: { type: 'category', data: categorie },
    yAxis: { type: 'value', axisLabel: { formatter: asseImporti } },
    series: serie,
  };
  return { opzioni, tabella, omessi };
}
