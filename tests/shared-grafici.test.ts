// Test L1 delle primitive PURE del kit dei grafici (shared/lib/grafici): contratto, colori del tema, primitive, opzioni
// sicure e firma, scheletri di cascata, barre raggruppate e ciambella di due parti. Chiamate dirette, niente render.
// Dati di prova inventati, numeri tondi. I builder di dominio che le compongono sono in finanziario-grafici.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { EChartsOption } from 'echarts';
import { describe, expect, it } from 'vitest';
import {
  COLORI,
  MAX_BARRE_VISIBILI,
  PALETTE,
  arrotonda1,
  aria,
  asseMilioni,
  assePercentuale,
  barreRaggruppate,
  centesimi,
  codiceDalClic,
  confronta,
  descrizioneCascata,
  etichettaDato,
  firmaOpzioni,
  formatNumber,
  graficoDueParti,
  milioni,
  minuscolaIniziale,
  nonDisegnabile,
  notaOmessi,
  numeroDi,
  opzioniCascata,
  opzioniSicure,
  percentuale,
  plurale,
  sommaCentesimi,
  tooltipDettaglio,
  valoreInMilioni,
  valoreInNumero,
  zoomSeMolti,
} from '../src/shared/lib';
import type { DatiGrafico, Parte, PassoCascata, SerieRaggruppata, TabellaEquivalente, TestiBarre, VoceRaggruppata } from '../src/shared/lib';

// gli spazi del formato it-IT sono non separabili: si confronta con spazi normali
const n = (s: string) => s.replace(/\s/g, ' ');

// regola dei motivi: seguono "Grafico non disponibile: ", quindi iniziale minuscola salvo sigle e codici
const REGOLA_MOTIVO = /^([a-zà-ý]|[A-Z]{2}|[A-Z]+\d)/;

// Le opzioni di ECharts sono unioni profonde: nei test si leggono con questa forma ridotta (solo i campi verificati).
type Formatter = (v: unknown) => string;
interface DatoProva {
  value?: number;
  name?: string;
  codice?: string;
  etichetta?: string;
  dettaglio?: string;
  itemStyle?: { color?: string };
}
interface SerieProva {
  type?: string;
  name?: string;
  stack?: string;
  silent?: boolean;
  radius?: unknown;
  itemStyle?: { color?: string };
  tooltip?: { show?: boolean };
  label?: { formatter?: unknown };
  data?: Array<DatoProva | number | null>;
}
interface AsseProva {
  type?: string;
  data?: string[];
  name?: string;
  axisLabel?: { formatter?: unknown; interval?: number; rotate?: number };
}
interface OpzioniProva {
  aria?: { enabled: boolean; label: { description: string } };
  legend?: object;
  tooltip?: { trigger?: string; renderMode?: string; formatter?: unknown; valueFormatter?: unknown };
  dataZoom?: Array<{ type: string; startValue?: number; endValue?: number }>;
  xAxis?: AsseProva | AsseProva[];
  yAxis?: AsseProva | AsseProva[];
  series: SerieProva[];
}

const prova = (o: EChartsOption | null): OpzioniProva => {
  expect(o).not.toBeNull();
  return o as unknown as OpzioniProva;
};
const asse = (a: AsseProva | AsseProva[] | undefined): AsseProva => {
  expect(Array.isArray(a)).toBe(false);
  return a as AsseProva;
};
const formatterDi = (a: AsseProva): Formatter => {
  expect(typeof a.axisLabel?.formatter).toBe('function');
  return a.axisLabel?.formatter as Formatter;
};

// ---------------------------------------------------------------- contratto e primitive

describe('contratto e primitive numeriche', () => {
  it('nonDisegnabile: opzioni null, il motivo, la tabella e le voci omesse', () => {
    const tabella: TabellaEquivalente = { caption: 'Prova', colonne: ['Voce', 'Importo'], righe: [['A', '10']] };
    expect(nonDisegnabile('nessun dato', tabella, ['A: assente'])).toEqual({ opzioni: null, motivoAssenza: 'nessun dato', tabella, omessi: ['A: assente'] });
  });
  it('numeroDi: solo un numero finito, mai uno zero al posto di un assente', () => {
    expect(numeroDi(0)).toBe(0);
    expect(numeroDi(-5)).toBe(-5);
    expect(numeroDi(null)).toBeNull();
    expect(numeroDi(undefined)).toBeNull();
    expect(numeroDi(Number.NaN)).toBeNull();
    expect(numeroDi(Number.POSITIVE_INFINITY)).toBeNull();
  });
  it('centesimi, arrotonda1, percentuale, sommaCentesimi', () => {
    expect(centesimi(0.1 + 0.2)).toBe(0.3);
    expect(arrotonda1(33.333)).toBe(33.3);
    expect(percentuale(1, 3)).toBe(33.3);
    expect(percentuale(50, 200)).toBe(25);
    expect(sommaCentesimi([0.1, 0.2])).toBe(0.3);
    expect(sommaCentesimi([1_000_000, 2_000_000])).toBe(3_000_000);
    expect(sommaCentesimi([])).toBe(0);
  });
  it('plurale, confronta, minuscolaIniziale', () => {
    expect(plurale(1, 'voce', 'voci')).toBe('1 voce');
    expect(plurale(0, 'voce', 'voci')).toBe('0 voci');
    expect(plurale(12_000, 'voce', 'voci')).toBe('12.000 voci');
    expect(confronta('SRA01', 'SRA02')).toBe(-1);
    expect(confronta('SRB01', 'SRA02')).toBe(1);
    expect(confronta('SRA01', 'SRA01')).toBe(0);
    // indipendente dal locale: ordine dei code point (le maiuscole prima)
    expect(confronta('Z', 'a')).toBe(-1);
    expect(minuscolaIniziale('Quota FEASR non disponibile')).toBe('quota FEASR non disponibile');
    expect(minuscolaIniziale('')).toBe('');
  });
  it('milioni e valori di assi e tooltip: assente = "non disponibile"', () => {
    expect(milioni(12_345_678)).toBe('12,3 M€');
    expect(asseMilioni(2_000_000)).toBe('2,0 M€');
    expect(assePercentuale(25)).toBe('25 %');
    expect(valoreInMilioni(3_000_000)).toBe('3,0 M€');
    expect(valoreInMilioni(null)).toBe('non disponibile');
    expect(valoreInMilioni('3')).toBe('non disponibile');
    expect(valoreInNumero(12_000)).toBe('12.000');
    expect(valoreInNumero(undefined)).toBe('non disponibile');
  });
  it('aria e notaOmessi', () => {
    expect(aria('Barre di prova')).toEqual({ enabled: true, label: { description: 'Barre di prova' } });
    expect(notaOmessi([])).toBe('');
    expect(notaOmessi(['A'])).toBe(' 1 voce omessa per dati mancanti o non utilizzabili.');
    expect(notaOmessi(['A', 'B'])).toBe(' 2 voci omesse per dati mancanti o non utilizzabili.');
  });
});

// ---------------------------------------------------------------- scorrimento

describe('zoomSeMolti', () => {
  it('fino a MAX_BARRE_VISIBILI categorie niente scorrimento', () => {
    expect(MAX_BARRE_VISIBILI).toBe(12);
    expect(zoomSeMolti(0)).toEqual({});
    expect(zoomSeMolti(MAX_BARRE_VISIBILI)).toEqual({});
  });
  it('oltre: zoom interno e cursore sulla prima finestra di MAX_BARRE_VISIBILI categorie', () => {
    const finestra = { xAxisIndex: 0, startValue: 0, endValue: MAX_BARRE_VISIBILI - 1 };
    expect(zoomSeMolti(MAX_BARRE_VISIBILI + 1)).toEqual({ dataZoom: [{ type: 'inside', ...finestra }, { type: 'slider', ...finestra }] });
    expect(zoomSeMolti(100).dataZoom?.map((z) => z.type)).toEqual(['inside', 'slider']);
  });
});

// ---------------------------------------------------------------- testi dei dati e clic

describe('tooltipDettaglio ed etichettaDato', () => {
  const p = { name: 'SRA01', data: { value: 60, dettaglio: 'SRA01: <b>60 %</b> della dotazione', etichetta: '60 %' } };

  it('il testo composto nel dato, semplice: niente escape (il tooltip e richText, non HTML)', () => {
    expect(tooltipDettaglio(p)).toBe('SRA01: <b>60 %</b> della dotazione');
    expect(etichettaDato(p)).toBe('60 %');
  });
  it('senza il testo nel dato: il nome; senza nome: stringa vuota', () => {
    expect(tooltipDettaglio({ name: 'SRA02', data: { value: 10 } })).toBe('SRA02');
    expect(etichettaDato({ name: 'SRA02', data: 10 })).toBe('SRA02');
    expect(tooltipDettaglio({ name: 'SRA03', data: { dettaglio: 5 } })).toBe('SRA03');
    expect(etichettaDato({ data: null })).toBe('');
    expect(tooltipDettaglio(null)).toBe('');
    expect(tooltipDettaglio('SRA01')).toBe('');
    expect(etichettaDato({ name: 7 })).toBe('');
  });
});

describe('codiceDalClic', () => {
  it('il codice del dato (drill-down), altrimenti il nome', () => {
    expect(codiceDalClic({ name: 'SRA01', data: { value: 60, codice: 'SRA01' } })).toBe('SRA01');
    expect(codiceDalClic({ name: 'Famiglia SRA', data: { codice: 'SRA02' } })).toBe('SRA02');
    expect(codiceDalClic({ name: 'SRA03', data: 10 })).toBe('SRA03');
    expect(codiceDalClic({ name: 'SRA', data: { value: 30 } })).toBe('SRA');
  });
  it('un codice non stringa non vale; senza nome ne codice: undefined', () => {
    expect(codiceDalClic({ name: 'SRA04', data: { codice: 4 } })).toBe('SRA04');
    expect(codiceDalClic({ data: null })).toBeUndefined();
    expect(codiceDalClic({})).toBeUndefined();
  });
});

// ---------------------------------------------------------------- opzioni sicure e firma

describe('opzioniSicure', () => {
  it('tooltip oggetto: disegnato nel grafico (richText), gli altri campi restano, l input non cambia', () => {
    const opzioni: EChartsOption = { tooltip: { trigger: 'item', formatter: tooltipDettaglio }, series: [{ type: 'bar', data: [1] }] };
    const sicure = opzioniSicure(opzioni);
    expect(sicure.tooltip).toEqual({ trigger: 'item', formatter: tooltipDettaglio, renderMode: 'richText' });
    expect(sicure.series).toBe(opzioni.series);
    expect((opzioni.tooltip as { renderMode?: string }).renderMode).toBeUndefined();
  });
  it('un renderMode html si sovrascrive', () => {
    expect(opzioniSicure({ tooltip: { trigger: 'axis', renderMode: 'html' } }).tooltip).toEqual({ trigger: 'axis', renderMode: 'richText' });
  });
  it('array di tooltip: richText su ognuno', () => {
    const sicure = opzioniSicure({ tooltip: [{ trigger: 'item' }, { trigger: 'axis', renderMode: 'html' }] });
    expect(sicure.tooltip).toEqual([
      { trigger: 'item', renderMode: 'richText' },
      { trigger: 'axis', renderMode: 'richText' },
    ]);
  });
  it('nessun tooltip: nessun tooltip aggiunto, stesso contenuto', () => {
    const opzioni: EChartsOption = { series: [{ type: 'pie', data: [1, 2] }] };
    const sicure = opzioniSicure(opzioni);
    expect(sicure).toEqual(opzioni);
    expect(sicure.tooltip).toBeUndefined();
  });

  // X-05: ECharts da solo scrive i numeri all'inglese ("1,000", "12,000"). Il formatter aggiunto e' formatNumber, lo
  // stesso delle tabelle: in it-IT (CLDR) il separatore delle migliaia parte dalle cinque cifre, quindi 1000 resta
  // "1000" come "6000 domande" nell'imbuto, e 12000 diventa "12.000". Mai la virgola inglese.
  it('asse di valori senza formatter: riceve un formatter con i numeri in italiano', () => {
    const opzioni: EChartsOption = { xAxis: { type: 'category', data: ['2023', '2024'] }, yAxis: { type: 'value', name: 'Domande' }, series: [] };
    const y = asse(prova(opzioniSicure(opzioni)).yAxis);
    expect(y.type).toBe('value');
    expect(y.name).toBe('Domande');
    const f = formatterDi(y);
    expect(f(1000)).toBe(formatNumber(1000));
    expect(f(1000)).not.toContain(',');
    expect(f(12_000)).toBe('12.000');
    expect(f(1_234_567)).toBe('1.234.567');
    expect(f(2.5)).toBe('2,5');
    expect(f(0)).toBe('0');
    // l'input non cambia
    expect((opzioni.yAxis as AsseProva).axisLabel).toBeUndefined();
  });
  it('asse di valori con altre opzioni dell etichetta ma senza formatter: le opzioni restano, il formatter si aggiunge', () => {
    const y = asse(prova(opzioniSicure({ yAxis: { type: 'value', axisLabel: { rotate: 45 } }, series: [] })).yAxis);
    expect(y.axisLabel?.rotate).toBe(45);
    expect(formatterDi(y)(12_000)).toBe('12.000');
  });
  it('asse di valori con un formatter proprio: invariato', () => {
    const y = asse(prova(opzioniSicure({ yAxis: { type: 'value', axisLabel: { formatter: asseMilioni } }, series: [] })).yAxis);
    expect(y.axisLabel?.formatter).toBe(asseMilioni);
    const conTesto = asse(prova(opzioniSicure({ xAxis: { type: 'value', axisLabel: { formatter: '{value} %' } }, series: [] })).xAxis);
    expect(conTesto.axisLabel?.formatter).toBe('{value} %');
  });
  it('asse di categoria: invariato (nessun formatter aggiunto)', () => {
    const x = asse(prova(opzioniSicure({ xAxis: { type: 'category', data: ['SRA01', 'SRA02'] }, series: [] })).xAxis);
    expect(x).toEqual({ type: 'category', data: ['SRA01', 'SRA02'] });
    expect(x.axisLabel).toBeUndefined();
  });
  it('assi in array: ogni asse di valori senza formatter in italiano, gli altri invariati', () => {
    const opzioni: EChartsOption = {
      xAxis: [{ type: 'category', data: ['2023'] }],
      yAxis: [{ type: 'value' }, { type: 'value', axisLabel: { formatter: assePercentuale } }],
      series: [],
    };
    const o = prova(opzioniSicure(opzioni));
    expect(o.xAxis).toEqual([{ type: 'category', data: ['2023'] }]);
    const [primo, secondo] = o.yAxis as AsseProva[];
    expect(formatterDi(primo)(12_000)).toBe('12.000');
    expect(secondo.axisLabel?.formatter).toBe(assePercentuale);
  });
  it('senza assi: nessun asse aggiunto', () => {
    const sicure = prova(opzioniSicure({ series: [{ type: 'pie' }] }));
    expect(sicure.xAxis).toBeUndefined();
    expect(sicure.yAxis).toBeUndefined();
  });
});

describe('firmaOpzioni', () => {
  const crea = (dati: number[]): EChartsOption => ({
    tooltip: { trigger: 'item', formatter: tooltipDettaglio },
    yAxis: { type: 'value', axisLabel: { formatter: (v: number) => milioni(v) } },
    series: [{ type: 'bar', data: dati }],
  });

  it('opzioni uguali con funzioni (anche ricreate a ogni chiamata): stessa firma', () => {
    expect(firmaOpzioni(crea([1, 2]))).toBe(firmaOpzioni(crea([1, 2])));
    const passi: PassoCascata[] = [{ nome: 'Dotazione', valore: 10_000_000, base: 0, colore: COLORI.scuro }];
    expect(firmaOpzioni(opzioniCascata(passi, 'Prova'))).toBe(firmaOpzioni(opzioniCascata(passi, 'Prova')));
  });
  it('cambia un dato: firma diversa', () => {
    expect(firmaOpzioni(crea([1, 2]))).not.toBe(firmaOpzioni(crea([1, 3])));
  });
  it('le funzioni entrano nella firma col loro sorgente: un formatter diverso cambia la firma', () => {
    const a: EChartsOption = { tooltip: { formatter: tooltipDettaglio } };
    const b: EChartsOption = { tooltip: { formatter: etichettaDato } };
    expect(firmaOpzioni(a)).not.toBe(firmaOpzioni(b));
    // senza la sostituzione JSON.stringify le scarterebbe e le due firme coinciderebbero
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });
});

// ---------------------------------------------------------------- cascata

describe('opzioniCascata e descrizioneCascata', () => {
  const passi: PassoCascata[] = [
    { nome: 'Dotazione', valore: 10_000_000, base: 0, colore: COLORI.scuro },
    { nome: 'Pagato', valore: 4_000_000, base: 6_000_000, colore: COLORI.attenzione },
    { nome: 'Residuo', valore: 6_000_000, base: 0, colore: COLORI.primario },
  ];

  it('due serie impilate: la base trasparente e muta, poi il valore con testi e colore del passo', () => {
    const o = prova(opzioniCascata(passi, 'Cascata di prova'));
    expect(o.aria).toEqual({ enabled: true, label: { description: 'Cascata di prova' } });
    expect(asse(o.xAxis)).toEqual({ type: 'category', data: ['Dotazione', 'Pagato', 'Residuo'] });
    expect(asse(o.yAxis).axisLabel?.formatter).toBe(asseMilioni);
    expect(o.tooltip).toEqual({ trigger: 'item', formatter: tooltipDettaglio });
    expect(o.series.map((s) => [s.type, s.name, s.stack])).toEqual([
      ['bar', 'Base', 'cascata'],
      ['bar', 'Importo', 'cascata'],
    ]);
    const [base, importo] = o.series;
    expect(base.data).toEqual([0, 6_000_000, 0]);
    expect(base.silent).toBe(true);
    expect(base.itemStyle?.color).toBe('transparent');
    expect(base.tooltip?.show).toBe(false);
    expect(importo.label?.formatter).toBe(etichettaDato);
    expect(importo.data?.[1]).toEqual({ value: 4_000_000, name: 'Pagato', etichetta: '4,0 M€', dettaglio: 'Pagato: 4,0 M€', itemStyle: { color: COLORI.attenzione } });
  });

  it('ogni base piu il valore torna al totale precedente', () => {
    const o = prova(opzioniCascata(passi, 'Prova'));
    const basi = o.series[0].data as number[];
    expect(basi[1] + passi[1].valore).toBe(passi[0].valore);
  });

  it('descrizioneCascata: titolo, passi in minuscolo e la nota degli omessi', () => {
    expect(n(descrizioneCascata('Cascata di prova', passi, []))).toBe('Cascata di prova: dotazione 10,0 M€, pagato 4,0 M€, residuo 6,0 M€.');
    expect(n(descrizioneCascata('Cascata di prova', passi.slice(0, 1), ['Residuo non disponibile']))).toBe(
      'Cascata di prova: dotazione 10,0 M€. 1 voce omessa per dati mancanti o non utilizzabili.',
    );
  });
});

// ---------------------------------------------------------------- barre raggruppate

describe('barreRaggruppate', () => {
  const definizioni: SerieRaggruppata[] = [
    { nome: 'Previsto', soggetto: 'previsto' },
    { nome: 'Erogato', soggetto: 'erogato' },
  ];
  const testi: TestiBarre = { caption: 'Previsto ed erogato per intervento', colonne: ['Intervento', 'Previsto', 'Erogato'], titolo: 'Barre di prova', vuoto: 'nessun intervento con valori' };
  const voci: VoceRaggruppata[] = [
    { categoria: 'SRA01', codice: 'SRA01', valori: [3_000_000, 2_000_000], celle: ['3.000.000 euro', '2.000.000 euro'] },
    { categoria: 'SRA02', codice: 'SRA02', valori: [null, 1_000_000], celle: ['non disponibile (fonte di prova non attiva)', '1.000.000 euro'] },
    { categoria: 'SRA03', valori: [null, null], celle: ['non disponibile', 'non disponibile'] },
  ];
  const voce = (k: number): VoceRaggruppata => ({ categoria: `SRB${String(k).padStart(2, '0')}`, valori: [1_000_000, 500_000], celle: ['1', '0,5'] });

  it('una serie per definizione, il codice nel dato, i valori assenti vuoti (mai zero)', () => {
    const g = barreRaggruppate(voci, definizioni, testi);
    const o = prova(g.opzioni);
    expect(o.series.map((s) => [s.type, s.name])).toEqual([
      ['bar', 'Previsto'],
      ['bar', 'Erogato'],
    ]);
    // la categoria senza alcun valore non si disegna
    expect(asse(o.xAxis).data).toEqual(['SRA01', 'SRA02']);
    expect(asse(o.xAxis).axisLabel).toEqual({ interval: 0, rotate: 0 });
    expect(o.series[0].data).toEqual([{ value: 3_000_000, name: 'SRA01', codice: 'SRA01', dettaglio: 'SRA01, previsto: 3,0 M€' }, null]);
    expect(o.series[1].data?.[1]).toEqual({ value: 1_000_000, name: 'SRA02', codice: 'SRA02', dettaglio: 'SRA02, erogato: 1,0 M€' });
    expect(o.legend).toEqual({});
    expect(o.tooltip).toEqual({ trigger: 'axis', valueFormatter: valoreInMilioni });
    expect(asse(o.yAxis).axisLabel?.formatter).toBe(asseMilioni);
    expect(o.dataZoom).toBeUndefined();
  });

  it('omessi con il soggetto e la cella composta dal chiamante; tabella con tutte le voci', () => {
    const g = barreRaggruppate(voci, definizioni, testi);
    expect(g.omessi).toEqual(['SRA02, previsto: non disponibile (fonte di prova non attiva)', 'SRA03, previsto: non disponibile', 'SRA03, erogato: non disponibile']);
    expect(g.tabella).toEqual({
      caption: 'Previsto ed erogato per intervento',
      colonne: ['Intervento', 'Previsto', 'Erogato'],
      righe: [
        ['SRA01', '3.000.000 euro', '2.000.000 euro'],
        ['SRA02', 'non disponibile (fonte di prova non attiva)', '1.000.000 euro'],
        ['SRA03', 'non disponibile', 'non disponibile'],
      ],
    });
  });

  it('descrizione accessibile: titolo, estremi e nota degli omessi', () => {
    expect(n(prova(barreRaggruppate(voci, definizioni, testi).opzioni).aria?.label.description ?? '')).toBe(
      'Barre di prova per 2 interventi, da SRA01 a SRA02, in milioni di euro. 3 voci omesse per dati mancanti o non utilizzabili.',
    );
    expect(n(prova(barreRaggruppate(voci.slice(0, 1), definizioni, testi).opzioni).aria?.label.description ?? '')).toBe('Barre di prova per 1 intervento (SRA01), in milioni di euro.');
  });

  it('omessi iniziali in testa (es. una nota di perimetro)', () => {
    expect(barreRaggruppate(voci, definizioni, testi, ['nota di prova']).omessi[0]).toBe('nota di prova');
  });

  it('nessuna categoria con valori: non disegnabile col testo vuoto, la tabella resta', () => {
    const g = barreRaggruppate(voci.slice(2), definizioni, testi);
    expect(g.opzioni).toBeNull();
    expect(g.motivoAssenza).toBe('nessun intervento con valori');
    expect(g.tabella.righe).toHaveLength(1);
    expect(g.omessi).toHaveLength(2);
    expect(barreRaggruppate([], definizioni, testi).motivoAssenza).toBe('nessun intervento con valori');
  });

  it('piu di 8 categorie: etichette ruotate; oltre MAX_BARRE_VISIBILI anche lo scorrimento', () => {
    const nove = prova(barreRaggruppate(Array.from({ length: 9 }, (_, k) => voce(k + 1)), definizioni, testi).opzioni);
    expect(asse(nove.xAxis).axisLabel?.rotate).toBe(45);
    expect(nove.dataZoom).toBeUndefined();
    const tredici = prova(barreRaggruppate(Array.from({ length: 13 }, (_, k) => voce(k + 1)), definizioni, testi).opzioni);
    expect(tredici.dataZoom?.map((z) => [z.type, z.startValue, z.endValue])).toEqual([
      ['inside', 0, 11],
      ['slider', 0, 11],
    ]);
  });
});

// ---------------------------------------------------------------- ciambella di due parti

describe('graficoDueParti', () => {
  const tabella: TabellaEquivalente = { caption: 'Totale di prova', colonne: ['Voce', 'Importo'], righe: [['Totale', '100']] };
  const parte = (nome: string, valore: number | null, assenza = 'non disponibile'): Parte => ({ nome, valore, assenza });

  it('percentuali sul totale delle due parti, testi nel dato, tabella del chiamante', () => {
    const g = graficoDueParti('Totale tra A e B', [parte('Parte A', 25_000_000), parte('Parte B', 75_000_000)], tabella);
    const o = prova(g.opzioni);
    const s = o.series[0];
    expect([s.type, s.name]).toEqual(['pie', 'Totale tra A e B']);
    expect(s.radius).toEqual(['52%', '78%']);
    expect(s.label?.formatter).toBe(etichettaDato);
    expect(s.data).toEqual([
      { value: 25_000_000, name: 'Parte A', etichetta: '25 %', dettaglio: 'Parte A: 25,0 M€ (25 %)' },
      { value: 75_000_000, name: 'Parte B', etichetta: '75 %', dettaglio: 'Parte B: 75,0 M€ (75 %)' },
    ]);
    expect(o.aria?.label.description).toBe('Totale tra A e B: Parte A 25 %, Parte B 75 %.');
    expect(o.tooltip).toEqual({ trigger: 'item', formatter: tooltipDettaglio });
    expect(g.tabella).toBe(tabella);
    expect(g.omessi).toEqual([]);
  });

  it('percentuali a una cifra decimale; una parte zero e un valore', () => {
    const terzi = prova(graficoDueParti('Terzi', [parte('A', 1_000_000), parte('B', 2_000_000)], tabella).opzioni);
    expect(terzi.aria?.label.description).toBe('Terzi: A 33,3 %, B 66,7 %.');
    const zero = prova(graficoDueParti('Tutto B', [parte('A', 0), parte('B', 10)], tabella).opzioni);
    expect(zero.aria?.label.description).toBe('Tutto B: A 0 %, B 100 %.');
  });

  it('parte assente: non disegnabile, il motivo porta la resa dell assenza data dal chiamante', () => {
    const g = graficoDueParti('Prova', [parte('Parte A', null, 'non disponibile (fonte di prova non attiva)'), parte('Parte B', 10)], tabella);
    expect(g.opzioni).toBeNull();
    expect(g.motivoAssenza).toBe('manca una delle due parti (Parte A: non disponibile (fonte di prova non attiva))');
    expect(g.tabella).toBe(tabella);
    expect(g.omessi).toEqual([]);
    const entrambe = graficoDueParti('Prova', [parte('Parte A', null), parte('Parte B', null, 'fuori perimetro')], tabella);
    expect(entrambe.motivoAssenza).toBe('manca una delle due parti (Parte A: non disponibile; Parte B: fuori perimetro)');
  });

  it('parte negativa: non disegnabile, le proporzioni sarebbero false', () => {
    const g = graficoDueParti('Prova', [parte('Parte A', -1), parte('Parte B', 10)], tabella);
    expect(g.opzioni).toBeNull();
    expect(g.motivoAssenza).toBe('una delle due parti è negativa: le proporzioni non avrebbero senso');
  });

  it('totale zero: non disegnabile', () => {
    const g = graficoDueParti('Prova', [parte('Parte A', 0), parte('Parte B', 0)], tabella);
    expect(g.opzioni).toBeNull();
    expect(g.motivoAssenza).toBe('il totale è zero');
  });

  it('i motivi seguono la regola (iniziale minuscola salvo sigle e codici)', () => {
    const casi: DatiGrafico[] = [
      graficoDueParti('Prova', [parte('A', null), parte('B', 1)], tabella),
      graficoDueParti('Prova', [parte('A', -1), parte('B', 1)], tabella),
      graficoDueParti('Prova', [parte('A', 0), parte('B', 0)], tabella),
      barreRaggruppate([], [{ nome: 'Serie', soggetto: 'serie' }], { caption: 'Prova', colonne: ['Voce'], titolo: 'Barre', vuoto: 'nessun dato' }),
    ];
    for (const g of casi) expect(g.motivoAssenza).toMatch(REGOLA_MOTIVO);
  });
});

// ---------------------------------------------------------------- colori del tema

describe('colori del tema (H-09)', () => {
  const css = readFileSync(resolve(process.cwd(), 'src/shared/ui/tema.css'), 'utf8');
  const token = (nome: string) => new RegExp(`--ui-${nome}:\\s*(#[0-9a-fA-F]{3,8})\\s*;`).exec(css)?.[1]?.toLowerCase();

  it.each([
    ['primario', COLORI.primario],
    ['scuro', COLORI.scuro],
    ['positivo', COLORI.positivo],
    ['attenzione', COLORI.attenzione],
    ['testo', COLORI.testo],
  ])('--ui-%s di tema.css coincide con COLORI', (nome, colore) => {
    expect(token(nome)).toBe(colore.toLowerCase());
  });

  it('la palette delle serie parte dai colori semantici', () => {
    expect(PALETTE.slice(0, 3)).toEqual([COLORI.primario, COLORI.positivo, COLORI.attenzione]);
    expect(new Set(PALETTE).size).toBe(PALETTE.length);
  });
});
