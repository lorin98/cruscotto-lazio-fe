// Test L1 dei builder PURI dei grafici del finanziario (lib/grafici.ts, lib/famiglie.ts): chiamate dirette, niente
// render. Dati di prova inventati, numeri tondi. Per ogni builder: forma delle opzioni, valori assenti omessi e
// dichiarati (mai zero nel grafico), caso non disegnabile, tabella coerente con il grafico.
import { describe, expect, it } from 'vitest';
import type { ImportoLike } from '../src/entities/importo';
import { FAMIGLIA_ALTRO, famigliaDi } from '../src/features/finanziario/lib/famiglie';
import {
  COLORI,
  graficoAvanzamento,
  graficoCascataIntervento,
  graficoCascataSigc,
  graficoContributo,
  graficoDomandePerAnno,
  graficoDotazionePagamenti,
  graficoFamiglie,
  graficoGauge,
  graficoImbutoSigc,
  graficoImportiPerAnno,
  graficoQuotaFeasr,
  graficoSankey,
  graficoSmp,
  graficoUtilizzoRiserva,
  milioni,
} from '../src/features/finanziario/lib/grafici';
import type { Grafico, RigaRiepilogo, RigaSpesa } from '../src/features/finanziario/lib/grafici';

// ---------------------------------------------------------------- supporto

// gli spazi del formato it-IT sono non separabili: si confronta con spazi normali
const n = (s: string) => s.replace(/\s/g, ' ');
const righeN = (g: Grafico) => g.tabella.righe.map((r) => r.map(n));

const imp = (valore: number): ImportoLike => ({ valore, motivo: null, fonte: null });
const assente = (motivo: string, fonte: string | null = null): ImportoLike => ({ valore: null, motivo, fonte });

// Le opzioni di ECharts sono unioni profonde: nei test si leggono con questa forma ridotta (solo i campi verificati).
interface ItemProva {
  name?: string;
  value?: number;
  codice?: string;
  etichetta?: string;
  dettaglio?: string;
  itemStyle?: { color?: string };
  children?: ItemProva[];
}
interface SerieProva {
  type: string;
  name?: string;
  stack?: string;
  data?: Array<ItemProva | number | null>;
  links?: Array<{ source: string; target: string; value: number }>;
  markLine?: { data: Array<{ xAxis?: number; yAxis?: number }> };
  nodeClick?: string;
  leafDepth?: number;
  breadcrumb?: { show?: boolean };
  sort?: string;
  min?: number;
  max?: number;
  connectNulls?: boolean;
  progress?: { show?: boolean };
  areaStyle?: object;
  radius?: unknown;
}
interface AsseProva {
  type?: string;
  data?: string[];
  inverse?: boolean;
  min?: number;
  max?: number | ((e: { min: number; max: number }) => number);
}
interface OpzioniProva {
  aria: { enabled: boolean; label: { description: string } };
  series: SerieProva[];
  tooltip?: { trigger?: string; formatter?: (p: unknown) => string; valueFormatter?: (v: unknown) => string };
  dataZoom?: Array<{ type: string }>;
  xAxis?: AsseProva;
  yAxis?: AsseProva;
}

function opzioniDi(g: Grafico): OpzioniProva {
  expect(g.opzioni).not.toBeNull();
  expect(g.motivoAssenza).toBeUndefined();
  return g.opzioni as unknown as OpzioniProva;
}

function controllaAria(o: OpzioniProva): void {
  expect(o.aria.enabled).toBe(true);
  expect(o.aria.label.description.length).toBeGreaterThan(20);
}

function controllaNonDisegnabile(g: Grafico, motivo: RegExp | string): void {
  expect(g.opzioni).toBeNull();
  if (typeof motivo === 'string') expect(g.motivoAssenza).toBe(motivo);
  else expect(g.motivoAssenza).toMatch(motivo);
  expect(g.tabella.colonne.length).toBeGreaterThan(0);
}

const item = (x: ItemProva | number | null | undefined): ItemProva => {
  expect(x).not.toBeNull();
  expect(typeof x).toBe('object');
  return x as ItemProva;
};

const nomiDi = (s: SerieProva) => (s.data ?? []).map((x) => (x == null || typeof x === 'number' ? null : x.name));
const valoriDi = (s: SerieProva) => (s.data ?? []).map((x) => (x == null || typeof x === 'number' ? x : (x.value ?? null)));

const righeSpesa: RigaSpesa[] = [
  { codiceIntervento: 'SRA01', dotazioneSpesaPubblica: imp(10_000_000), pagamentiTotali: imp(6_000_000), percentualeContributoAmbientale: 100 },
  { codiceIntervento: 'SRA02', dotazioneSpesaPubblica: imp(20_000_000), pagamentiTotali: imp(2_000_000), percentualeContributoAmbientale: 40 },
  { codiceIntervento: 'SRD13', dotazioneSpesaPubblica: imp(10_000_000), pagamentiTotali: imp(4_000_000), percentualeContributoAmbientale: null },
  { codiceIntervento: 'SRA03', dotazioneSpesaPubblica: assente('FONTE_NON_ATTIVA', 'QUADRO_SINOTTICO'), pagamentiTotali: imp(1_000_000) },
];

// ---------------------------------------------------------------- formati e famiglie

describe('milioni e famiglie', () => {
  it('milioni: una cifra decimale, separatore italiano', () => {
    expect(milioni(12_345_678)).toBe('12,3 M€');
    expect(milioni(10_000_000)).toBe('10,0 M€');
    expect(milioni(0)).toBe('0,0 M€');
  });
  it('famigliaDi: prefisso alfabetico del codice, altrimenti Altro', () => {
    expect(famigliaDi('SRA01')).toBe('SRA');
    expect(famigliaDi('SRD13')).toBe('SRD');
    expect(famigliaDi('AT001')).toBe('AT');
    expect(famigliaDi('XX')).toBe('Altro');
    expect(famigliaDi('01A')).toBe(FAMIGLIA_ALTRO);
    expect(famigliaDi('')).toBe('Altro');
  });
  it('builder deterministici: stesse opzioni a ogni chiamata', () => {
    expect(JSON.stringify(graficoAvanzamento(righeSpesa))).toBe(JSON.stringify(graficoAvanzamento(righeSpesa)));
    expect(JSON.stringify(graficoFamiglie(righeSpesa))).toBe(JSON.stringify(graficoFamiglie(righeSpesa)));
  });
});

// ---------------------------------------------------------------- 1. avanzamento

describe('graficoAvanzamento', () => {
  it('barre orizzontali ordinate dalla quota maggiore, con il codice nel dato e la media ponderata', () => {
    const g = graficoAvanzamento(righeSpesa, 'REGIONALE');
    const o = opzioniDi(g);
    controllaAria(o);
    expect(o.series).toHaveLength(1);
    const s = o.series[0];
    expect(s.type).toBe('bar');
    expect(o.xAxis?.type).toBe('value');
    expect(o.yAxis?.type).toBe('category');
    expect(o.yAxis?.inverse).toBe(true);
    expect(o.yAxis?.data).toEqual(['SRA01', 'SRD13', 'SRA02']);
    expect(nomiDi(s)).toEqual(['SRA01', 'SRD13', 'SRA02']);
    expect(valoriDi(s)).toEqual([60, 40, 10]);
    expect(item(s.data?.[0]).codice).toBe('SRA01');
    // media ponderata = (6 + 2 + 4) / (10 + 20 + 10) = 30%
    expect(s.markLine?.data[0].xAxis).toBe(30);
    expect(o.aria.label.description).toMatch(/media ponderata 30 %/);
  });

  it('colore per soglia: >= 50% positivo, >= 30% primario, altrimenti attenzione', () => {
    const g = graficoAvanzamento([
      { codiceIntervento: 'SRA01', dotazioneSpesaPubblica: imp(1_000_000), pagamentiTotali: imp(500_000) },
      { codiceIntervento: 'SRA02', dotazioneSpesaPubblica: imp(1_000_000), pagamentiTotali: imp(300_000) },
      { codiceIntervento: 'SRA03', dotazioneSpesaPubblica: imp(1_000_000), pagamentiTotali: imp(290_000) },
    ]);
    const colori = (opzioniDi(g).series[0].data ?? []).map((x) => item(x).itemStyle?.color);
    expect(colori).toEqual([COLORI.positivo, COLORI.primario, COLORI.attenzione]);
  });

  it('dotazione assente, pari a zero o pagato assente: voce omessa e dichiarata, mai zero nel grafico', () => {
    const g = graficoAvanzamento([
      ...righeSpesa,
      { codiceIntervento: 'SRB01', dotazioneSpesaPubblica: imp(0), pagamentiTotali: imp(1_000_000) },
      { codiceIntervento: 'SRC01', dotazioneSpesaPubblica: imp(5_000_000), pagamentiTotali: assente('NON_VALORIZZATO') },
    ]);
    const o = opzioniDi(g);
    expect(nomiDi(o.series[0])).not.toContain('SRA03');
    expect(nomiDi(o.series[0])).not.toContain('SRB01');
    expect(nomiDi(o.series[0])).not.toContain('SRC01');
    expect(valoriDi(o.series[0])).not.toContain(0);
    expect(g.omessi).toEqual([
      'SRA03: dotazione non disponibile (fonte quadro sinottico non attiva)',
      'SRB01: dotazione pari a zero',
      'SRC01: pagato non disponibile (non valorizzato)',
    ]);
  });

  it('tabella coerente: righe del grafico, poi le omesse, poi la media ponderata', () => {
    const g = graficoAvanzamento(righeSpesa);
    expect(g.tabella.colonne).toEqual(['Intervento', 'Dotazione', 'Pagato', 'Pagato sulla dotazione']);
    expect(righeN(g)).toEqual([
      ['SRA01', '10.000.000,00 €', '6.000.000,00 €', '60 %'],
      ['SRD13', '10.000.000,00 €', '4.000.000,00 €', '40 %'],
      ['SRA02', '20.000.000,00 €', '2.000.000,00 €', '10 %'],
      ['SRA03', 'non disponibile (fonte quadro sinottico non attiva)', '1.000.000,00 €', 'non calcolabile'],
      ['Media ponderata degli interventi nel grafico', '40.000.000,00 €', '12.000.000,00 €', '30 %'],
    ]);
  });

  it('perimetro ADA: non disegnabile, tabella comunque con dotazione e pagato', () => {
    const g = graficoAvanzamento(righeSpesa, 'ADA');
    controllaNonDisegnabile(g, "Perimetro ADA: la dotazione è regionale, i pagamenti sono dell'area: la quota non è confrontabile");
    expect(righeN(g)[0]).toEqual(['SRA01', '10.000.000,00 €', '6.000.000,00 €', 'non confrontabile (perimetro ADA)']);
    expect(g.tabella.righe).toHaveLength(4);
  });

  it('nessuna riga utile: non disegnabile, le voci restano dichiarate', () => {
    const g = graficoAvanzamento([righeSpesa[3]]);
    controllaNonDisegnabile(g, 'Nessun intervento con dotazione e pagato valorizzati');
    expect(g.omessi).toEqual(['SRA03: dotazione non disponibile (fonte quadro sinottico non attiva)']);
    expect(g.tabella.righe).toHaveLength(1);
    expect(graficoAvanzamento([]).opzioni).toBeNull();
  });

  it('il tooltip codifica i caratteri speciali del testo', () => {
    const o = opzioniDi(graficoAvanzamento([{ codiceIntervento: 'SR<b>', dotazioneSpesaPubblica: imp(100), pagamentiTotali: imp(50) }]));
    const testo = o.tooltip?.formatter?.({ name: 'SR<b>', data: o.series[0].data?.[0] }) ?? '';
    expect(testo).toContain('SR&lt;b&gt;');
    expect(testo).not.toContain('<b>');
  });
});

// ---------------------------------------------------------------- 2. famiglie

describe('graficoFamiglie', () => {
  it('treemap famiglia -> intervento con zoom, foglie con il codice', () => {
    const g = graficoFamiglie(righeSpesa);
    const o = opzioniDi(g);
    controllaAria(o);
    const s = o.series[0];
    expect(s.type).toBe('treemap');
    expect(s.nodeClick).toBe('zoomToNode');
    expect(s.leafDepth).toBe(1);
    expect(s.breadcrumb?.show).toBe(true);
    const famiglie = (s.data ?? []).map(item);
    expect(famiglie.map((f) => [f.name, f.value])).toEqual([
      ['SRA', 30_000_000],
      ['SRD', 10_000_000],
    ]);
    expect(famiglie[0].codice).toBeUndefined();
    expect(famiglie[0].children?.map((c) => [c.name, c.value, c.codice])).toEqual([
      ['SRA02', 20_000_000, 'SRA02'],
      ['SRA01', 10_000_000, 'SRA01'],
    ]);
  });

  it('raggiera: rootToNode', () => {
    const s = opzioniDi(graficoFamiglie(righeSpesa, 'sunburst')).series[0];
    expect(s.type).toBe('sunburst');
    expect(s.nodeClick).toBe('rootToNode');
    expect((s.data ?? []).length).toBe(2);
  });

  it('dotazione assente o non positiva: omessa e dichiarata', () => {
    const g = graficoFamiglie([...righeSpesa, { codiceIntervento: 'SRE01', dotazioneSpesaPubblica: imp(-5) }]);
    expect(g.omessi).toEqual(['SRA03: dotazione non disponibile (fonte quadro sinottico non attiva)', 'SRE01: dotazione negativa']);
    const foglie = (opzioniDi(g).series[0].data ?? []).flatMap((f) => item(f).children ?? []);
    expect(foglie.map((f) => f.codice)).not.toContain('SRA03');
    expect(foglie.map((f) => f.value)).not.toContain(0);
  });

  it('tabella: foglie e totale per famiglia, poi le omesse', () => {
    const g = graficoFamiglie(righeSpesa);
    expect(g.tabella.colonne).toEqual(['Famiglia', 'Intervento', 'Dotazione']);
    expect(righeN(g)).toEqual([
      ['SRA', 'SRA02', '20.000.000,00 €'],
      ['SRA', 'SRA01', '10.000.000,00 €'],
      ['SRA', 'Totale della famiglia', '30.000.000,00 €'],
      ['SRD', 'SRD13', '10.000.000,00 €'],
      ['SRD', 'Totale della famiglia', '10.000.000,00 €'],
      ['SRA', 'SRA03', 'non disponibile (fonte quadro sinottico non attiva)'],
    ]);
  });

  it('nessuna dotazione utile: non disegnabile', () => {
    const g = graficoFamiglie([righeSpesa[3]]);
    controllaNonDisegnabile(g, /Nessun intervento con dotazione/);
    expect(g.tabella.righe).toHaveLength(1);
  });
});

// ---------------------------------------------------------------- 3. imbuto SIGC

describe('graficoImbutoSigc', () => {
  it('fasi nell ordine Presentate, Pagate, Da pagare, senza riordino', () => {
    const g = graficoImbutoSigc({ presentate: 10_000, pagate: 6_000, daPagare: 4_000 });
    const o = opzioniDi(g);
    controllaAria(o);
    const s = o.series[0];
    expect(s.type).toBe('funnel');
    expect(s.sort).toBe('none');
    expect(s.min).toBe(0);
    expect(s.max).toBe(10_000);
    expect(nomiDi(s)).toEqual(['Presentate', 'Pagate', 'Da pagare']);
    expect(valoriDi(s)).toEqual([10_000, 6_000, 4_000]);
    expect(n(item(s.data?.[1]).dettaglio ?? '')).toBe('Pagate: 6000 domande (60 % delle presentate)');
  });

  it('tabella con la quota sulle presentate', () => {
    const g = graficoImbutoSigc({ presentate: 10_000, pagate: 6_000, daPagare: 4_000 });
    expect(g.tabella.colonne).toEqual(['Fase', 'Domande', 'Quota sulle presentate']);
    expect(righeN(g)).toEqual([
      ['Presentate', '10.000', '100 %'],
      ['Pagate', '6000', '60 %'],
      ['Da pagare', '4000', '40 %'],
    ]);
  });

  it('fase assente: omessa e dichiarata, mai zero', () => {
    const g = graficoImbutoSigc({ presentate: 1000, pagate: 600 });
    const s = opzioniDi(g).series[0];
    expect(nomiDi(s)).toEqual(['Presentate', 'Pagate']);
    expect(g.omessi).toEqual(['Da pagare: numero di domande non disponibile']);
    expect(g.tabella.righe[2]).toEqual(['Da pagare', 'non disponibile', 'non calcolabile']);
  });

  it('presentate assenti o zero: non disegnabile', () => {
    controllaNonDisegnabile(graficoImbutoSigc({ pagate: 10 }), /presentate non disponibili/);
    const zero = graficoImbutoSigc({ presentate: 0, pagate: 0, daPagare: 0 });
    controllaNonDisegnabile(zero, /Nessuna domanda presentata/);
    expect(zero.tabella.righe[0]).toEqual(['Presentate', '0', 'non calcolabile']);
  });
});

// ---------------------------------------------------------------- 4. cascata SIGC

describe('graficoCascataSigc', () => {
  const base = { richiesto: imp(10_000_000), ammesso: imp(8_000_000), pagato: imp(5_000_000), ancoraDaPagare: imp(3_000_000) };

  it('cascata coerente: base trasparente + valore, i decrementi partono dal totale successivo', () => {
    const g = graficoCascataSigc(base);
    const o = opzioniDi(g);
    controllaAria(o);
    expect(o.xAxis?.data).toEqual(['Richiesto', 'Non ammesso', 'Ammesso', 'Non ancora pagato', 'Pagato']);
    expect(o.series.map((s) => [s.type, s.stack])).toEqual([
      ['bar', 'cascata'],
      ['bar', 'cascata'],
    ]);
    const basi = valoriDi(o.series[0]);
    const valori = valoriDi(o.series[1]);
    expect(basi).toEqual([0, 8_000_000, 0, 5_000_000, 0]);
    expect(valori).toEqual([10_000_000, 2_000_000, 8_000_000, 3_000_000, 5_000_000]);
    // ogni decremento colma il salto fra il totale precedente e il successivo
    expect(Number(basi[1]) + Number(valori[1])).toBe(10_000_000);
    expect(Number(basi[3]) + Number(valori[3])).toBe(8_000_000);
    expect(item(o.series[1].data?.[1]).itemStyle?.color).toBe(COLORI.attenzione);
  });

  it('tabella con l ancora da pagare del DTO; nessuna nota se coincide', () => {
    const g = graficoCascataSigc(base);
    expect(righeN(g)).toEqual([
      ['Richiesto', '10.000.000,00 €'],
      ['Non ammesso (richiesto meno ammesso)', '2.000.000,00 €'],
      ['Ammesso', '8.000.000,00 €'],
      ['Non ancora pagato (ammesso meno pagato)', '3.000.000,00 €'],
      ['Pagato', '5.000.000,00 €'],
      ['Ancora da pagare (dal DTO)', '3.000.000,00 €'],
    ]);
    expect(g.omessi).toEqual([]);
  });

  it('fonti diverse: nota come ultima riga della tabella, non fra gli omessi', () => {
    const g = graficoCascataSigc({ ...base, ancoraDaPagare: imp(4_000_000) });
    expect(g.tabella.righe[g.tabella.righe.length - 1]).toEqual(['Nota', 'Fonti diverse: il pagato viene dal flusso ASR2-20']);
    expect(g.omessi).toEqual([]);
    expect(g.opzioni).not.toBeNull();
  });

  it('importo assente: non disegnabile, dichiarato, differenze non calcolabili', () => {
    const g = graficoCascataSigc({ ...base, pagato: assente('NON_VALORIZZATO') });
    controllaNonDisegnabile(g, /pagato non disponibile \(non valorizzato\)/);
    expect(g.omessi).toEqual(['Pagato non disponibile (non valorizzato)']);
    expect(g.tabella.righe[3]).toEqual(['Non ancora pagato (ammesso meno pagato)', 'non calcolabile']);
    expect(g.tabella.righe[4]).toEqual(['Pagato', 'non disponibile (non valorizzato)']);
  });

  it('ordine violato o negativi: non disegnabile con il motivo', () => {
    controllaNonDisegnabile(graficoCascataSigc({ ...base, ammesso: imp(12_000_000) }), /L'ammesso supera il richiesto/);
    controllaNonDisegnabile(graficoCascataSigc({ ...base, pagato: imp(9_000_000) }), /Il pagato supera l'ammesso/);
    controllaNonDisegnabile(graficoCascataSigc({ ...base, pagato: imp(-1) }), /Importi negativi/);
  });
});

// ---------------------------------------------------------------- 5. domande per anno

describe('graficoDomandePerAnno', () => {
  const righe = [
    { annoRaccolta: 2024, primaAnnualita: 300, altreAnnualita: 100, nonClassificate: 0, totali: 400 },
    { annoRaccolta: null, primaAnnualita: 10, altreAnnualita: 0, nonClassificate: 10, totali: 20 },
    { annoRaccolta: 2023, primaAnnualita: 200, altreAnnualita: 50, nonClassificate: 50, totali: 300 },
  ];

  it('barre impilate per anno, senza campagna in coda', () => {
    const g = graficoDomandePerAnno(righe);
    const o = opzioniDi(g);
    controllaAria(o);
    expect(o.xAxis?.data).toEqual(['2023', '2024', 'senza campagna']);
    expect(o.series.map((s) => [s.type, s.name, s.stack])).toEqual([
      ['bar', 'Prima annualità', 'domande'],
      ['bar', 'Altre annualità', 'domande'],
      ['bar', 'Non classificate', 'domande'],
    ]);
    expect(o.series[0].data).toEqual([200, 300, 10]);
    expect(o.aria.label.description).toMatch(/720 domande in tutto/);
  });

  it('tabella: Anno, Prima annualità, Altre, Non classificate, Totale', () => {
    const g = graficoDomandePerAnno(righe);
    expect(g.tabella.colonne).toEqual(['Anno', 'Prima annualità', 'Altre', 'Non classificate', 'Totale']);
    expect(g.tabella.righe).toEqual([
      ['2023', '200', '50', '50', '300'],
      ['2024', '300', '100', '0', '400'],
      ['senza campagna', '10', '0', '10', '20'],
    ]);
  });

  it('numero assente: vuoto nella serie (non zero) e dichiarato', () => {
    const g = graficoDomandePerAnno([{ annoRaccolta: 2024, primaAnnualita: 300, altreAnnualita: 100, totali: 400 }]);
    expect(opzioniDi(g).series[2].data).toEqual([null]);
    expect(g.omessi).toEqual(['2024, non classificate: numero di domande non disponibile']);
    expect(g.tabella.righe[0][3]).toBe('non disponibile');
  });

  it('nessuna riga: non disegnabile', () => {
    const g = graficoDomandePerAnno([]);
    controllaNonDisegnabile(g, 'Nessuna domanda per anno di raccolta');
    expect(g.tabella.righe).toEqual([]);
  });
});

// ---------------------------------------------------------------- 6. importi per anno

describe('graficoImportiPerAnno', () => {
  const righe = [
    { annoRaccolta: null, importoAmmesso: imp(1_000_000), importoDecretato: imp(500_000) },
    { annoRaccolta: 2023, importoAmmesso: imp(4_000_000), importoDecretato: assente('NON_VALORIZZATO') },
    { annoRaccolta: 2024, importoAmmesso: imp(6_000_000), importoDecretato: imp(3_000_000) },
  ];

  it('due linee per anno, senza unire i punti assenti, con lo zoom interno', () => {
    const g = graficoImportiPerAnno(righe);
    const o = opzioniDi(g);
    controllaAria(o);
    expect(o.xAxis?.data).toEqual(['2023', '2024', 'senza campagna']);
    expect(o.series.map((s) => [s.type, s.name, s.connectNulls])).toEqual([
      ['line', 'Importo ammesso', false],
      ['line', 'Importo decretato', false],
    ]);
    expect(o.series[0].data).toEqual([4_000_000, 6_000_000, 1_000_000]);
    expect(o.dataZoom).toEqual([{ type: 'inside' }]);
    expect(o.tooltip?.valueFormatter?.(3_000_000)).toBe('3,0 M€');
  });

  it('punto assente: null nella serie (mai zero) e dichiarato', () => {
    const g = graficoImportiPerAnno(righe);
    expect(opzioniDi(g).series[1].data).toEqual([null, 3_000_000, 500_000]);
    expect(g.omessi).toEqual(['2023: importo decretato non disponibile (non valorizzato)']);
  });

  it('tabella: Anno, Ammesso, Decretato', () => {
    const g = graficoImportiPerAnno(righe);
    expect(g.tabella.colonne).toEqual(['Anno', 'Ammesso', 'Decretato']);
    expect(righeN(g)).toEqual([
      ['2023', '4.000.000,00 €', 'non disponibile (non valorizzato)'],
      ['2024', '6.000.000,00 €', '3.000.000,00 €'],
      ['senza campagna', '1.000.000,00 €', '500.000,00 €'],
    ]);
  });

  it('nessuna riga o nessun importo: non disegnabile', () => {
    controllaNonDisegnabile(graficoImportiPerAnno([]), /Nessun importo/);
    const vuoti = graficoImportiPerAnno([{ annoRaccolta: 2024, importoAmmesso: assente('FUORI_PERIMETRO'), importoDecretato: assente('FUORI_PERIMETRO') }]);
    controllaNonDisegnabile(vuoti, /Nessun importo valorizzato/);
    expect(vuoti.omessi).toHaveLength(2);
  });
});

// ---------------------------------------------------------------- 7. sankey

describe('graficoSankey', () => {
  const impegni = { dotazioneSpesaPubblica: imp(100_000_000), importoImpegnato: imp(60_000_000) };
  const pagamenti = { pagamentiTotali: imp(45_000_000), impegnatoDaPagare: imp(15_000_000) };

  it('nodi e collegamenti dalla dotazione al pagato', () => {
    const g = graficoSankey(impegni, pagamenti);
    const o = opzioniDi(g);
    controllaAria(o);
    const s = o.series[0];
    expect(s.type).toBe('sankey');
    expect(nomiDi(s)).toEqual(['Dotazione', 'Impegnato', 'Da impegnare', 'Pagato', 'Da pagare']);
    expect(s.links?.map((l) => [l.source, l.target, l.value])).toEqual([
      ['Dotazione', 'Impegnato', 60_000_000],
      ['Dotazione', 'Da impegnare', 40_000_000],
      ['Impegnato', 'Pagato', 45_000_000],
      ['Impegnato', 'Da pagare', 15_000_000],
    ]);
  });

  it('tabella con le voci e il da impegnare calcolato', () => {
    expect(righeN(graficoSankey(impegni, pagamenti))).toEqual([
      ['Dotazione', '100.000.000,00 €'],
      ['Impegnato', '60.000.000,00 €'],
      ['Da impegnare (dotazione meno impegnato)', '40.000.000,00 €'],
      ['Pagato', '45.000.000,00 €'],
      ['Da pagare', '15.000.000,00 €'],
    ]);
  });

  it('impegnato da fonte non attiva: non disegnabile, tabella con le voci disponibili e le assenti col motivo', () => {
    const g = graficoSankey({ ...impegni, importoImpegnato: assente('FONTE_NON_ATTIVA', 'IMPEGNI') }, pagamenti);
    controllaNonDisegnabile(g, "Impegni da fonte non attiva: il flusso dalla dotazione all'impegnato non si può disegnare");
    expect(righeN(g)).toEqual([
      ['Dotazione', '100.000.000,00 €'],
      ['Impegnato', 'non disponibile (fonte impegni non attiva)'],
      ['Da impegnare (dotazione meno impegnato)', 'non calcolabile'],
      ['Pagato', '45.000.000,00 €'],
      ['Da pagare', '15.000.000,00 €'],
    ]);
    expect(g.omessi).toEqual(['Impegnato non disponibile (fonte impegni non attiva)']);
  });

  it('da pagare assente: collegamento omesso e dichiarato, mai zero', () => {
    const g = graficoSankey(impegni, { ...pagamenti, impegnatoDaPagare: assente('NON_VALORIZZATO') });
    const s = opzioniDi(g).series[0];
    expect(s.links).toHaveLength(3);
    expect(nomiDi(s)).not.toContain('Da pagare');
    expect(g.omessi).toEqual(['Da pagare non disponibile (non valorizzato)']);
  });

  it('valori negativi: non disegnabile', () => {
    const g = graficoSankey({ ...impegni, importoImpegnato: imp(120_000_000) }, pagamenti);
    controllaNonDisegnabile(g, /Valori negativi \(da impegnare\)/);
    expect(n(g.tabella.righe[2][1])).toBe('-20.000.000,00 €');
  });
});

// ---------------------------------------------------------------- 8. gauge

describe('graficoGauge', () => {
  it('indicatore 0-100 con progress e valore a un decimale', () => {
    const g = graficoGauge(45, 100, 'Pagato sulla dotazione');
    const o = opzioniDi(g);
    controllaAria(o);
    const s = o.series[0];
    expect(s.type).toBe('gauge');
    expect([s.min, s.max]).toEqual([0, 100]);
    expect(s.progress?.show).toBe(true);
    expect(item(s.data?.[0])).toEqual({ value: 45, name: 'Pagato sulla dotazione' });
    expect(g.tabella).toEqual({ caption: 'Pagato sulla dotazione', colonne: ['Misura', 'Valore'], righe: [['Pagato sulla dotazione', '45 %']] });
    expect(valoriDi(opzioniDi(graficoGauge(1, 3, 'Un terzo')).series[0])).toEqual([33.3]);
  });

  it('perimetro ADA: pagamenti dell area su dotazione regionale, non disegnabile anche con i due valori', () => {
    const g = graficoGauge(40, 100, 'della dotazione pagato', 'ADA');
    controllaNonDisegnabile(g, /^Perimetro ADA: .*la percentuale non è confrontabile$/);
    expect(g.tabella.righe).toEqual([['della dotazione pagato', 'non confrontabile (perimetro ADA)']]);
    expect(graficoGauge(40, 100, 'della dotazione pagato', 'REGIONALE').opzioni).not.toBeNull();
  });
  it('parte o totale assenti, totale non positivo, parte negativa: non disegnabile', () => {
    controllaNonDisegnabile(graficoGauge(null, 100, 'Quota'), /valore non disponibile/);
    controllaNonDisegnabile(graficoGauge(10, undefined, 'Quota'), /totale non disponibile/);
    controllaNonDisegnabile(graficoGauge(10, 0, 'Quota'), /totale pari a zero/);
    const negativa = graficoGauge(-1, 100, 'Quota');
    controllaNonDisegnabile(negativa, /valore negativo/);
    expect(negativa.tabella.righe).toEqual([['Quota', 'non calcolabile']]);
  });
});

// ---------------------------------------------------------------- 9. cascata intervento

describe('graficoCascataIntervento', () => {
  const riga: RigaRiepilogo = {
    codiceIntervento: 'SRA01',
    dotazioneSpesaPubblica: imp(10_000_000),
    risorseQuotaFeasr: imp(4_000_000),
    importoStanziato: imp(8_000_000),
    impegnatoCofinanziatoFeasr: imp(2_000_000),
    impegnatoCofinanziatoFeasrENon: assente('FONTE_NON_ATTIVA', 'IMPEGNI'),
    pagamentiNettoRettifiche: imp(4_000_000),
    dotazioneResiduaSuImpegni: assente('FONTE_NON_ATTIVA', 'IMPEGNI'),
    dotazioneResiduaSuPagamenti: imp(6_000_000),
  };

  it('dotazione -> pagamenti netti -> residuo, impegnato assente dichiarato', () => {
    const g = graficoCascataIntervento(riga);
    const o = opzioniDi(g);
    controllaAria(o);
    expect(o.xAxis?.data).toEqual(['Dotazione', 'Pagamenti netti', 'Residuo sui pagamenti']);
    expect(valoriDi(o.series[0])).toEqual([0, 6_000_000, 0]);
    expect(valoriDi(o.series[1])).toEqual([10_000_000, 4_000_000, 6_000_000]);
    expect(o.series.every((s) => s.type === 'bar' && s.stack === 'cascata')).toBe(true);
    expect(g.omessi).toEqual(['Impegnato FEASR e non FEASR non disponibile (fonte impegni non attiva)']);
  });

  it('tabella con tutte le voci della riga e il motivo degli assenti', () => {
    const g = graficoCascataIntervento(riga);
    expect(g.tabella.caption).toMatch(/SRA01/);
    expect(righeN(g)).toEqual([
      ['Dotazione di spesa pubblica', '10.000.000,00 €'],
      ['Quota FEASR', '4.000.000,00 €'],
      ['Stanziato', '8.000.000,00 €'],
      ['Impegnato FEASR', '2.000.000,00 €'],
      ['Impegnato FEASR e non FEASR', 'non disponibile (fonte impegni non attiva)'],
      ['Pagamenti al netto delle rettifiche', '4.000.000,00 €'],
      ['Residuo sugli impegni', 'non disponibile (fonte impegni non attiva)'],
      ['Residuo sui pagamenti', '6.000.000,00 €'],
    ]);
  });

  it('residuo assente: barra omessa e dichiarata', () => {
    const g = graficoCascataIntervento({ ...riga, dotazioneResiduaSuPagamenti: assente('NON_VALORIZZATO') });
    expect(opzioniDi(g).xAxis?.data).toEqual(['Dotazione', 'Pagamenti netti']);
    expect(g.omessi).toContain('Residuo sui pagamenti non disponibile (non valorizzato)');
  });

  it('dotazione o pagamenti assenti, pagamenti oltre la dotazione: non disegnabile', () => {
    const senza = graficoCascataIntervento({ ...riga, pagamentiNettoRettifiche: assente('FUORI_PERIMETRO') });
    controllaNonDisegnabile(senza, /pagamenti netti non disponibile \(fuori perimetro\)/);
    expect(senza.tabella.righe).toHaveLength(8);
    controllaNonDisegnabile(graficoCascataIntervento({ ...riga, pagamentiNettoRettifiche: imp(11_000_000) }), /superano la dotazione/);
  });
});

// ---------------------------------------------------------------- 10. quota FEASR

describe('graficoQuotaFeasr', () => {
  it('ciambella a due parti con le percentuali', () => {
    const g = graficoQuotaFeasr({ quotaFeasr: imp(40_000_000), quotaNonFeasr: imp(60_000_000) });
    const o = opzioniDi(g);
    controllaAria(o);
    const s = o.series[0];
    expect(s.type).toBe('pie');
    expect(Array.isArray(s.radius)).toBe(true);
    expect(nomiDi(s)).toEqual(['Quota FEASR', 'Quota non FEASR']);
    expect(valoriDi(s)).toEqual([40_000_000, 60_000_000]);
    expect(g.tabella.colonne).toEqual(['Quota', 'Importo', 'Percentuale']);
    expect(righeN(g)).toEqual([
      ['Quota FEASR', '40.000.000,00 €', '40 %'],
      ['Quota non FEASR', '60.000.000,00 €', '60 %'],
      ['Totale', '100.000.000,00 €', '100 %'],
    ]);
  });

  it('quota assente: non disegnabile, dichiarata', () => {
    const g = graficoQuotaFeasr({ quotaFeasr: assente('NON_VALORIZZATO'), quotaNonFeasr: imp(60_000_000) });
    controllaNonDisegnabile(g, /quota FEASR non disponibile \(non valorizzato\)/);
    expect(g.omessi).toEqual(['Quota FEASR non disponibile (non valorizzato)']);
    expect(righeN(g)[0]).toEqual(['Quota FEASR', 'non disponibile (non valorizzato)', 'non calcolabile']);
  });

  it('quote negative o entrambe zero: non disegnabile', () => {
    controllaNonDisegnabile(graficoQuotaFeasr({ quotaFeasr: imp(-1), quotaNonFeasr: imp(10) }), /Quote negative/);
    controllaNonDisegnabile(graficoQuotaFeasr({ quotaFeasr: imp(0), quotaNonFeasr: imp(0) }), /entrambe pari a zero/);
  });
});

// ---------------------------------------------------------------- 11. contributo ambientale

describe('graficoContributo', () => {
  it('barre in percentuale (0-100) con il codice nel dato, le assenti omesse', () => {
    const g = graficoContributo(righeSpesa);
    const o = opzioniDi(g);
    controllaAria(o);
    const s = o.series[0];
    expect(s.type).toBe('bar');
    expect([o.yAxis?.min, o.yAxis?.max]).toEqual([0, 100]);
    expect(nomiDi(s)).toEqual(['SRA01', 'SRA02']);
    expect(item(s.data?.[1]).codice).toBe('SRA02');
    expect(valoriDi(s)).toEqual([100, 40]);
    expect(g.omessi).toEqual(['SRD13: contributo ambientale non disponibile', 'SRA03: contributo ambientale non disponibile']);
    expect(o.dataZoom).toBeUndefined();
  });

  it('tabella: Intervento, Contributo ambientale', () => {
    const g = graficoContributo(righeSpesa);
    expect(g.tabella.colonne).toEqual(['Intervento', 'Contributo ambientale']);
    expect(g.tabella.righe).toEqual([
      ['SRA01', '100 %'],
      ['SRA02', '40 %'],
      ['SRD13', 'non disponibile'],
      ['SRA03', 'non disponibile'],
    ]);
  });

  it('nessun contributo valorizzato: non disegnabile', () => {
    controllaNonDisegnabile(graficoContributo([righeSpesa[2]]), /Nessun intervento con il contributo ambientale/);
  });
});

// ---------------------------------------------------------------- 12. dotazione e pagato

describe('graficoDotazionePagamenti', () => {
  const righe = [
    { codiceIntervento: 'SRA01', dotazione: imp(10_000_000), pagato: imp(6_000_000) },
    { codiceIntervento: 'SRA02', dotazione: imp(20_000_000), pagato: assente('NON_VALORIZZATO') },
    { codiceIntervento: 'SRA03', dotazione: assente('FONTE_NON_ATTIVA'), pagato: assente('FONTE_NON_ATTIVA') },
  ];
  const tredici = Array.from({ length: 13 }, (_, k) => ({
    codiceIntervento: `SRB${String(k + 1).padStart(2, '0')}`,
    dotazione: imp(1_000_000),
    pagato: imp(500_000),
  }));

  it('barre raggruppate Dotazione e Pagato, codice nel dato, assenti vuoti (mai zero) e dichiarati', () => {
    const g = graficoDotazionePagamenti(righe, 'REGIONALE');
    const o = opzioniDi(g);
    controllaAria(o);
    expect(o.series.map((s) => [s.type, s.name, s.stack])).toEqual([
      ['bar', 'Dotazione', undefined],
      ['bar', 'Pagato', undefined],
    ]);
    expect(o.xAxis?.data).toEqual(['SRA01', 'SRA02']);
    expect(item(o.series[0].data?.[0]).codice).toBe('SRA01');
    expect(o.series[1].data?.[1]).toBeNull();
    expect(g.omessi).toEqual([
      'SRA02: pagato non disponibile (non valorizzato)',
      'SRA03: dotazione non disponibile (fonte non attiva)',
      'SRA03: pagato non disponibile (fonte non attiva)',
    ]);
    expect(o.dataZoom).toBeUndefined();
    expect(righeN(g)).toEqual([
      ['SRA01', '10.000.000,00 €', '6.000.000,00 €'],
      ['SRA02', '20.000.000,00 €', 'non disponibile (non valorizzato)'],
      ['SRA03', 'non disponibile (fonte non attiva)', 'non disponibile (fonte non attiva)'],
    ]);
  });

  it('oltre 12 interventi: zoom interno e cursore', () => {
    const o = opzioniDi(graficoDotazionePagamenti(tredici));
    expect(o.dataZoom?.map((z) => z.type)).toEqual(['inside', 'slider']);
    expect(opzioniDi(graficoDotazionePagamenti(tredici.slice(0, 12))).dataZoom).toBeUndefined();
  });

  it('perimetro ADA: solo il pagato, la dotazione dichiarata come non affiancabile', () => {
    const g = graficoDotazionePagamenti(righe, 'ADA');
    const o = opzioniDi(g);
    expect(o.series.map((s) => s.name)).toEqual(['Pagato']);
    expect(o.xAxis?.data).toEqual(['SRA01']);
    expect(g.omessi[0]).toBe("Perimetro ADA: la dotazione regionale non si affianca ai pagamenti dell'area");
    expect(g.tabella.colonne).toEqual(['Intervento', 'Pagato']);
  });

  it('nessun valore: non disegnabile', () => {
    controllaNonDisegnabile(graficoDotazionePagamenti([righe[2]]), /Nessun intervento/);
    controllaNonDisegnabile(graficoDotazionePagamenti([]), /Nessun intervento/);
  });
});

// ---------------------------------------------------------------- 13. riserva

describe('graficoUtilizzoRiserva', () => {
  const riserva = {
    importoAccumulato: 5_000_000,
    utilizzoProgressivo: [
      { data: '2025-03-01', importo: 1_000_000, cumulato: 3_000_000 },
      { data: '2025-01-15', importo: 2_000_000, cumulato: 2_000_000 },
    ],
  };

  it('area del cumulato per data (GG/MM/AAAA) con la linea della riserva accumulata e lo zoom', () => {
    const g = graficoUtilizzoRiserva(riserva);
    const o = opzioniDi(g);
    controllaAria(o);
    const s = o.series[0];
    expect(s.type).toBe('line');
    expect(s.areaStyle).toBeDefined();
    expect(o.xAxis?.data).toEqual(['15/01/2025', '01/03/2025']);
    expect(s.data).toEqual([2_000_000, 3_000_000]);
    expect(s.markLine?.data[0].yAxis).toBe(5_000_000);
    expect(o.dataZoom?.map((z) => z.type)).toEqual(['inside', 'slider']);
    const massimo = o.yAxis?.max;
    expect(typeof massimo === 'function' ? massimo({ min: 0, max: 3_000_000 }) : massimo).toBe(5_000_000);
  });

  it('tabella in ordine di data con la riserva accumulata nella didascalia', () => {
    const g = graficoUtilizzoRiserva(riserva);
    expect(n(g.tabella.caption)).toMatch(/riserva accumulata: 5\.000\.000,00 €/);
    expect(righeN(g)).toEqual([
      ['15/01/2025', '2.000.000,00 €', '2.000.000,00 €'],
      ['01/03/2025', '1.000.000,00 €', '3.000.000,00 €'],
    ]);
  });

  it('cumulato o riserva assenti: punto vuoto (mai zero) e linea omessa, dichiarati', () => {
    const g = graficoUtilizzoRiserva({
      importoAccumulato: null,
      utilizzoProgressivo: [...riserva.utilizzoProgressivo, { data: '2025-04-01', importo: 500_000, cumulato: null }],
    });
    const s = opzioniDi(g).series[0];
    expect(s.data).toEqual([2_000_000, 3_000_000, null]);
    expect(s.markLine).toBeUndefined();
    expect(g.omessi).toEqual(['01/04/2025: utilizzo cumulato non disponibile', 'Riserva accumulata non disponibile: linea di riferimento omessa']);
  });

  it('nessun punto: non disegnabile', () => {
    controllaNonDisegnabile(graficoUtilizzoRiserva({ importoAccumulato: 5_000_000, utilizzoProgressivo: [] }), 'Nessun utilizzo della riserva registrato');
    controllaNonDisegnabile(graficoUtilizzoRiserva({}), 'Nessun utilizzo della riserva registrato');
  });
});

// ---------------------------------------------------------------- 14. SMP

describe('graficoSmp', () => {
  const righe = [
    { codiceIntervento: 'SRA01', previsionePagamentoEsercizio: imp(3_000_000), spesaErogataCampagnaPrecedente: imp(2_000_000) },
    { codiceIntervento: 'SRA02', previsionePagamentoEsercizio: assente('FONTE_NON_ATTIVA', 'PREVISIONE_PAGAMENTO'), spesaErogataCampagnaPrecedente: imp(1_000_000) },
  ];

  it('barre raggruppate per intervento con il codice nel dato, assenti vuoti e dichiarati', () => {
    const g = graficoSmp(righe);
    const o = opzioniDi(g);
    controllaAria(o);
    expect(o.series.map((s) => [s.type, s.name])).toEqual([
      ['bar', 'Previsione di pagamento'],
      ['bar', 'Spesa erogata nella campagna precedente'],
    ]);
    expect(o.xAxis?.data).toEqual(['SRA01', 'SRA02']);
    expect(o.series[0].data?.[1]).toBeNull();
    expect(item(o.series[1].data?.[1]).codice).toBe('SRA02');
    expect(g.omessi).toEqual(['SRA02: previsione di pagamento non disponibile (fonte previsione di pagamento non attiva)']);
    expect(g.tabella.colonne).toEqual(['Intervento', 'Previsione di pagamento', 'Spesa erogata nella campagna precedente']);
    expect(righeN(g)[1]).toEqual(['SRA02', 'non disponibile (fonte previsione di pagamento non attiva)', '1.000.000,00 €']);
  });

  it('oltre 12 interventi: zoom interno e cursore', () => {
    const molte = Array.from({ length: 13 }, (_, k) => ({ codiceIntervento: `SRC${k + 10}`, previsionePagamentoEsercizio: imp(1_000_000) }));
    expect(opzioniDi(graficoSmp(molte)).dataZoom?.map((z) => z.type)).toEqual(['inside', 'slider']);
  });

  it('nessun valore: non disegnabile', () => {
    const g = graficoSmp([{ codiceIntervento: 'SRA09' }]);
    controllaNonDisegnabile(g, /Nessun intervento/);
    expect(g.omessi).toEqual([
      'SRA09: previsione di pagamento non disponibile',
      'SRA09: spesa erogata nella campagna precedente non disponibile',
    ]);
  });
});
