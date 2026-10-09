// domande.ts — grafici delle domande per anno di raccolta (TX-0008: barre impilate per annualita') e degli importi per
// anno (TX-0010: linee dello stanziato, dell'ammesso e del decretato). Le domande senza campagna sono la categoria
// "senza campagna", in coda. Una serie senza alcun valore (fonte non attiva) non si disegna e si dichiara una volta.
import type { BarSeriesOption, EChartsOption, LineSeriesOption } from 'echarts';
import type { ImportoLike } from '../../../../entities/importo';
import {
  NON_DISPONIBILE,
  aria,
  asseMilioni,
  nonDisegnabile,
  notaOmessi,
  numeroDi,
  plurale,
  valoreInMilioni,
  valoreInNumero,
} from '../../../../shared/lib';
import type { DatiGrafico } from '../../../../shared/lib';
import { sommaSeCompleta } from '../aggregati';
import type { RigaDomandeAnno, RigaImportiAnno } from '../dto';
import { annoDiRaccolta, numeroOpzionale } from '../formato';
import { assenzaImporto, cellaImporto, perAnno, valoreDi } from '../importi';

// ---------------------------------------------------------------- 1. domande per anno di raccolta

const ANNUALITA = [
  { nome: 'Prima annualità', campo: 'primaAnnualita' },
  { nome: 'Altre annualità', campo: 'altreAnnualita' },
  { nome: 'Non classificate', campo: 'nonClassificate' },
] as const;


/** Barre impilate delle domande per anno di raccolta (senza campagna in coda): prima annualita', altre, non classificate. */
export function graficoDomandePerAnno(righe: RigaDomandeAnno[]): DatiGrafico {
  const ordinate = perAnno(righe);
  const categorie = ordinate.map((r) => annoDiRaccolta(r.annoRaccolta));
  const tabella = {
    caption: 'Domande per anno di raccolta',
    colonne: ['Anno', 'Prima annualità', 'Altre', 'Non classificate', 'Totale'],
    righe: ordinate.map((r, k) => [categorie[k], numeroOpzionale(r.primaAnnualita), numeroOpzionale(r.altreAnnualita), numeroOpzionale(r.nonClassificate), numeroOpzionale(r.totali)]),
  };
  if (ordinate.length === 0) return nonDisegnabile('nessuna domanda per anno di raccolta', tabella, []);
  const omessi: string[] = [];
  const serie: BarSeriesOption[] = ANNUALITA.map((def) => ({
    type: 'bar',
    name: def.nome,
    stack: 'domande',
    data: ordinate.map((r, k) => {
      const v = numeroDi(r[def.campo]);
      if (v == null) omessi.push(`${categorie[k]}, ${def.nome.toLowerCase()}: numero di domande ${NON_DISPONIBILE}`);
      return v;
    }),
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

const IMPORTI = [
  { nome: 'Importo stanziato', campo: 'importoStanziato' },
  { nome: 'Importo ammesso', campo: 'importoAmmesso' },
  { nome: 'Importo decretato', campo: 'importoDecretato' },
] as const;

function lineaImporti(def: (typeof IMPORTI)[number], righe: readonly RigaImportiAnno[], categorie: readonly string[], omessi: string[]): LineSeriesOption | null {
  const importi: Array<ImportoLike | null | undefined> = righe.map((r) => r[def.campo]);
  const valori = importi.map(valoreDi);
  const soggetto = def.nome.toLowerCase();
  if (valori.every((v) => v == null)) {
    // una serie tutta assente (es. fonte non attiva) si dichiara una volta, con il motivo del primo anno
    omessi.push(`${def.nome}: ${assenzaImporto(importi[0], true)} per tutti gli anni`);
    return null;
  }
  valori.forEach((v, k) => {
    if (v == null) omessi.push(`${categorie[k]}: ${soggetto} ${assenzaImporto(importi[k], true)}`);
  });
  return { type: 'line', name: def.nome, connectNulls: false, data: valori };
}

/** Linee degli importi per anno di raccolta; i punti assenti sono vuoti (mai zero) e dichiarati, come le domande senza ammesso. */
export function graficoImportiPerAnno(righe: RigaImportiAnno[]): DatiGrafico {
  const ordinate = perAnno(righe);
  const categorie = ordinate.map((r) => annoDiRaccolta(r.annoRaccolta));
  const tabella = {
    caption: 'Importi per anno di raccolta: stanziato, ammesso e decretato',
    colonne: ['Anno', 'Stanziato', 'Ammesso', 'Decretato', 'Domande senza importo ammesso'],
    righe: ordinate.map((r, k) => [categorie[k], cellaImporto(r.importoStanziato, true), cellaImporto(r.importoAmmesso, true), cellaImporto(r.importoDecretato, true), numeroOpzionale(r.domandeSenzaAmmesso)]),
  };
  if (ordinate.length === 0) return nonDisegnabile('nessun importo per anno di raccolta', tabella, []);
  const omessi: string[] = [];
  const serie = IMPORTI.map((def) => lineaImporti(def, ordinate, categorie, omessi)).filter((s): s is LineSeriesOption => s != null);
  if (serie.length === 0) return nonDisegnabile('nessun importo valorizzato per anno di raccolta', tabella, omessi);
  const senzaAmmesso = sommaSeCompleta(ordinate.map((r) => r.domandeSenzaAmmesso));
  if (senzaAmmesso) omessi.push(`${plurale(senzaAmmesso, 'domanda senza importo ammesso', 'domande senza importo ammesso')}: ${senzaAmmesso === 1 ? 'non entra' : 'non entrano'} nelle somme`);
  const descrizione = `Linee ${serie.map((s) => `dell'${String(s.name).toLowerCase()}`).join(' e ')} per anno di raccolta (${categorie.join(', ')}), in milioni di euro.${notaOmessi(omessi)}`;
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
