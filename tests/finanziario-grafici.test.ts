// Test L1 dei builder PURI dei grafici del finanziario (lib/grafici/, lib/famiglie.ts): chiamate dirette, niente
// render. Dati di prova inventati, numeri tondi. Per ogni builder: forma delle opzioni, valori assenti omessi e
// dichiarati con la resa del dominio (mai zero nel grafico), caso non disegnabile con il motivo (iniziale minuscola:
// segue "Grafico non disponibile: "), tabella coerente con il grafico. Le primitive del kit sono in shared-grafici.
import { describe, expect, it } from 'vitest';
import type { ImportoLike } from '../src/entities/importo';
import { FAMIGLIA_ALTRO, famigliaDi } from '../src/features/finanziario/lib/famiglie';
import {
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
  graficoPartiImporto,
  graficoQuotaFeasr,
  graficoSankey,
  graficoSmp,
  graficoUtilizzoRiserva,
  sottotitoloFlusso,
  vociIntervento,
} from '../src/features/finanziario/lib/grafici';
import type { RigaRiepilogo, RigaSpesa } from '../src/features/finanziario/lib/grafici';
import { avanzamentoPonderato } from '../src/features/finanziario/lib/avanzamento';
import { assenzaImporto, cellaImporto } from '../src/features/finanziario/lib/importi';
import { COLORI, milioni, opzioniSicure } from '../src/shared/lib';
import type { DatiGrafico } from '../src/shared/lib';

// ---------------------------------------------------------------- supporto

// gli spazi del formato it-IT sono non separabili: si confronta con spazi normali
const n = (s: string) => s.replace(/\s/g, ' ');
const righeN = (g: DatiGrafico) => g.tabella.righe.map((r) => r.map(n));

const imp = (valore: number): ImportoLike => ({ valore, motivo: null, fonte: null });
const assente = (motivo: string, fonte: string | null = null): ImportoLike => ({ valore: null, motivo, fonte });

// resa delle assenze di entities/importo (H-03): un totale su piu' interventi e un dato di una riga
const NON_CALCOLABILE_AGGREGATO = 'non calcolabile (manca per almeno un intervento della selezione: vedi il riepilogo per intervento)';
const NON_VALORIZZATO_RIGA = 'non valorizzato (il dato non è presente nella fonte)';
const FUORI_PERIMETRO = 'fuori perimetro (non visibile nel perimetro del profilo)';

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
  tooltip?: { trigger?: string; renderMode?: string; formatter?: (p: unknown) => string; valueFormatter?: (v: unknown) => string };
  dataZoom?: Array<{ type: string }>;
  xAxis?: AsseProva;
  yAxis?: AsseProva;
}

function opzioniDi(g: DatiGrafico): OpzioniProva {
  expect(g.opzioni).not.toBeNull();
  expect(g.motivoAssenza).toBeUndefined();
  return g.opzioni as unknown as OpzioniProva;
}

function controllaAria(o: OpzioniProva): void {
  expect(o.aria.enabled).toBe(true);
  expect(o.aria.label.description.length).toBeGreaterThan(20);
}

function controllaNonDisegnabile(g: DatiGrafico, motivo: RegExp | string): void {
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
const collegamentiDi = (s: SerieProva) => (s.links ?? []).map((l) => [l.source, l.target, l.value]);

// ---------------------------------------------------------------- dati di prova condivisi

const righeSpesa: RigaSpesa[] = [
  { codiceIntervento: 'SRA01', dotazioneSpesaPubblica: imp(10_000_000), pagamentiTotali: imp(6_000_000), percentualeContributoAmbientale: 100 },
  { codiceIntervento: 'SRA02', dotazioneSpesaPubblica: imp(20_000_000), pagamentiTotali: imp(2_000_000), percentualeContributoAmbientale: 40 },
  { codiceIntervento: 'SRD13', dotazioneSpesaPubblica: imp(10_000_000), pagamentiTotali: imp(4_000_000), percentualeContributoAmbientale: null },
  { codiceIntervento: 'SRA03', dotazioneSpesaPubblica: assente('FONTE_NON_ATTIVA', 'QUADRO_SINOTTICO'), pagamentiTotali: imp(1_000_000) },
];

const sigcBase = { richiesto: imp(10_000_000), ammesso: imp(8_000_000), pagato: imp(5_000_000), ancoraDaPagare: imp(3_000_000) };

// flusso della dotazione: TX-0006 (impegni), TX-0005 (pagamenti sull'impegnato), TX-0007 (residuo sui pagamenti)
const impegni = { dotazioneSpesaPubblica: imp(100_000_000), importoImpegnato: imp(60_000_000), dotazioneResidua: imp(40_000_000) };
const pagamenti = { pagamentiTotali: imp(45_000_000), impegnatoDaPagare: imp(15_000_000) };
const residuo = { dotazioneSpesaPubblica: imp(100_000_000), pagamentiNettoRettifiche: imp(44_000_000), dotazioneResidua: imp(56_000_000) };

const rigaIntervento: RigaRiepilogo = {
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

// ---------------------------------------------------------------- resa delle assenze

describe('resa delle assenze nei grafici (H-03): sempre descriviImporto di entities/importo', () => {
  it('fonte non attiva, con e senza la fonte attesa', () => {
    expect(assenzaImporto(assente('FONTE_NON_ATTIVA', 'IMPEGNI'))).toBe('non disponibile (fonte impegni non attiva)');
    expect(assenzaImporto(assente('FONTE_NON_ATTIVA'))).toBe('non disponibile (fonte non attiva)');
  });
  it('NON_VALORIZZATO: non calcolabile per un aggregato, non valorizzato per una riga', () => {
    expect(assenzaImporto(assente('NON_VALORIZZATO'), true)).toBe(NON_CALCOLABILE_AGGREGATO);
    expect(assenzaImporto(assente('NON_VALORIZZATO'))).toBe(NON_VALORIZZATO_RIGA);
  });
  it('fuori perimetro, importo assente o motivo sconosciuto', () => {
    expect(assenzaImporto(assente('FUORI_PERIMETRO'))).toBe(FUORI_PERIMETRO);
    expect(assenzaImporto(undefined)).toBe('non disponibile');
    expect(assenzaImporto(null, true)).toBe('non disponibile');
    expect(assenzaImporto(assente('ALTRO'))).toBe('non disponibile');
  });
  it('cellaImporto: euro pieni (lo zero e un valore), altrimenti l assenza con il motivo', () => {
    expect(n(cellaImporto(imp(1_000_000)))).toBe('1.000.000,00 €');
    expect(n(cellaImporto(imp(0)))).toBe('0,00 €');
    expect(cellaImporto(assente('NON_VALORIZZATO'), true)).toBe(NON_CALCOLABILE_AGGREGATO);
    expect(cellaImporto(assente('NON_VALORIZZATO'))).toBe(NON_VALORIZZATO_RIGA);
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
    // dati di una riga: NON_VALORIZZATO e' "non valorizzato" nella fonte, non "non calcolabile"
    expect(g.omessi).toEqual([
      'SRA03: dotazione: non disponibile (fonte quadro sinottico non attiva)',
      'SRB01: dotazione pari a zero',
      `SRC01: pagato: ${NON_VALORIZZATO_RIGA}`,
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
    controllaNonDisegnabile(g, "perimetro ADA: la dotazione è regionale, i pagamenti sono dell'area: il rapporto non è confrontabile");
    expect(righeN(g)[0]).toEqual(['SRA01', '10.000.000,00 €', '6.000.000,00 €', 'non confrontabile (perimetro ADA)']);
    expect(g.tabella.righe).toHaveLength(4);
  });

  it('nessuna riga utile: non disegnabile, le voci restano dichiarate', () => {
    const g = graficoAvanzamento([righeSpesa[3]]);
    controllaNonDisegnabile(g, 'nessun intervento con dotazione e pagato valorizzati');
    expect(g.omessi).toEqual(['SRA03: dotazione: non disponibile (fonte quadro sinottico non attiva)']);
    expect(g.tabella.righe).toHaveLength(1);
    expect(graficoAvanzamento([]).opzioni).toBeNull();
  });

  it('il tooltip e testo semplice (richText): i caratteri speciali restano testo, opzioniSicure lo disegna nel grafico', () => {
    const g = graficoAvanzamento([{ codiceIntervento: 'SR<b>', dotazioneSpesaPubblica: imp(100), pagamentiTotali: imp(50) }]);
    const o = opzioniDi(g);
    const testo = o.tooltip?.formatter?.({ name: 'SR<b>', data: o.series[0].data?.[0] }) ?? '';
    expect(n(testo)).toBe('SR<b>: 50 % della dotazione (pagato 0,0 M€ su 0,0 M€)');
    expect(testo).not.toContain('&lt;');
    const sicure = opzioniSicure(g.opzioni ?? {}) as unknown as OpzioniProva;
    expect(sicure.tooltip?.renderMode).toBe('richText');
  });

  it('avanzamentoPonderato: incluse dalla quota maggiore, esclusi col motivo, totali e media dei soli inclusi', () => {
    const a = avanzamentoPonderato([...righeSpesa, { codiceIntervento: 'SRZ01' }]);
    expect(a.incluse.map((x) => [x.codice, x.dotazione, x.pagato, x.quota])).toEqual([
      ['SRA01', 10_000_000, 6_000_000, 0.6],
      ['SRD13', 10_000_000, 4_000_000, 0.4],
      ['SRA02', 20_000_000, 2_000_000, 0.1],
    ]);
    expect(a.omessi).toEqual([
      'SRA03: dotazione: non disponibile (fonte quadro sinottico non attiva)',
      'SRZ01: dotazione: non disponibile, pagato: non disponibile',
    ]);
    expect([a.totaleDotazione, a.totalePagato, a.media]).toEqual([40_000_000, 12_000_000, 30]);
    // la stessa media del grafico
    expect(opzioniDi(graficoAvanzamento(righeSpesa)).series[0].markLine?.data[0].xAxis).toBe(avanzamentoPonderato(righeSpesa).media);
  });

  it('avanzamentoPonderato senza interventi utilizzabili: media null, totali a zero', () => {
    expect(avanzamentoPonderato([])).toEqual({ incluse: [], omessi: [], totaleDotazione: 0, totalePagato: 0, media: null });
    const soloZero = avanzamentoPonderato([{ codiceIntervento: 'SRB01', dotazioneSpesaPubblica: imp(0), pagamentiTotali: imp(1_000_000) }]);
    expect(soloZero.media).toBeNull();
    expect(soloZero.omessi).toEqual(['SRB01: dotazione pari a zero']);
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
    expect(g.omessi).toEqual(['SRA03: dotazione: non disponibile (fonte quadro sinottico non attiva)', 'SRE01: dotazione negativa']);
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
    controllaNonDisegnabile(g, 'nessun intervento con dotazione valorizzata e positiva');
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
    controllaNonDisegnabile(graficoImbutoSigc({ pagate: 10 }), "domande presentate non disponibili: l'imbuto non si può disegnare");
    const zero = graficoImbutoSigc({ presentate: 0, pagate: 0, daPagare: 0 });
    controllaNonDisegnabile(zero, "nessuna domanda presentata: l'imbuto non si può disegnare");
    expect(zero.tabella.righe[0]).toEqual(['Presentate', '0', 'non calcolabile']);
  });
});

// ---------------------------------------------------------------- 4. cascata SIGC

describe('graficoCascataSigc', () => {
  it('cascata coerente: base trasparente + valore, i decrementi partono dal totale successivo', () => {
    const g = graficoCascataSigc(sigcBase);
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
    const g = graficoCascataSigc(sigcBase);
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
    const g = graficoCascataSigc({ ...sigcBase, ancoraDaPagare: imp(4_000_000) });
    expect(g.tabella.righe[g.tabella.righe.length - 1]).toEqual(['Nota', 'Fonti diverse: il pagato viene dal flusso ASR2-20']);
    expect(g.omessi).toEqual([]);
    expect(g.opzioni).not.toBeNull();
  });

  it('importo assente: non disegnabile, dichiarato come aggregato, differenze non calcolabili', () => {
    const g = graficoCascataSigc({ ...sigcBase, pagato: assente('NON_VALORIZZATO') });
    controllaNonDisegnabile(g, `la cascata richiede richiesto, ammesso e pagato: pagato ${NON_CALCOLABILE_AGGREGATO}`);
    expect(g.omessi).toEqual([`Pagato ${NON_CALCOLABILE_AGGREGATO}`]);
    expect(g.tabella.righe[1]).toEqual(['Non ammesso (richiesto meno ammesso)', 'non calcolabile']);
    expect(g.tabella.righe[3]).toEqual(['Non ancora pagato (ammesso meno pagato)', 'non calcolabile']);
    expect(g.tabella.righe[4]).toEqual(['Pagato', NON_CALCOLABILE_AGGREGATO]);
  });

  it('ordine violato o negativi: non disegnabile con il motivo', () => {
    controllaNonDisegnabile(graficoCascataSigc({ ...sigcBase, ammesso: imp(12_000_000) }), "l'ammesso supera il richiesto: la cascata non si può disegnare");
    controllaNonDisegnabile(graficoCascataSigc({ ...sigcBase, pagato: imp(9_000_000) }), "il pagato supera l'ammesso: la cascata non si può disegnare");
    controllaNonDisegnabile(graficoCascataSigc({ ...sigcBase, pagato: imp(-1) }), 'importi negativi: la cascata non si può disegnare');
  });

  it('domande senza uno degli importi (V-12): righe in tabella dopo l ancora da pagare, la nota resta ultima', () => {
    const g = graficoCascataSigc({ ...sigcBase, domandeSenza: { richiesto: 0, ammesso: 120, pagato: null } });
    expect(g.opzioni).not.toBeNull();
    expect(g.tabella.righe.slice(6)).toEqual([
      ['Domande senza importo richiesto', '0'],
      ['Domande senza importo ammesso', '120'],
      ['Domande senza importo pagato', 'non disponibile'],
    ]);
    const conNota = graficoCascataSigc({ ...sigcBase, ancoraDaPagare: imp(4_000_000), domandeSenza: { richiesto: 0, ammesso: 120, pagato: 300 } });
    expect(conNota.tabella.righe.map((r) => r[0]).slice(6)).toEqual([
      'Domande senza importo richiesto',
      'Domande senza importo ammesso',
      'Domande senza importo pagato',
      'Nota',
    ]);
    // senza domandeSenza nel DTO nessuna riga in piu'
    expect(graficoCascataSigc({ ...sigcBase, domandeSenza: null }).tabella.righe).toHaveLength(6);
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
    controllaNonDisegnabile(g, 'nessuna domanda per anno di raccolta');
    expect(g.tabella.righe).toEqual([]);
  });

  it('nessun numero valorizzato: non disegnabile, ogni assenza dichiarata', () => {
    const g = graficoDomandePerAnno([{ annoRaccolta: null }]);
    controllaNonDisegnabile(g, 'nessun numero di domande valorizzato');
    expect(g.omessi).toHaveLength(3);
    expect(g.omessi[0]).toBe('senza campagna, prima annualità: numero di domande non disponibile');
  });
});

// ---------------------------------------------------------------- 6. importi per anno

describe('graficoImportiPerAnno', () => {
  const righe = [
    { annoRaccolta: null, importoAmmesso: imp(1_000_000), importoDecretato: imp(500_000) },
    { annoRaccolta: 2023, importoAmmesso: imp(4_000_000), importoDecretato: assente('NON_VALORIZZATO') },
    { annoRaccolta: 2024, importoAmmesso: imp(6_000_000), importoDecretato: imp(3_000_000) },
  ];
  const conStanziato = [
    { annoRaccolta: 2024, importoStanziato: imp(8_000_000), importoAmmesso: imp(6_000_000), importoDecretato: imp(3_000_000), domandeSenzaAmmesso: 20 },
    { annoRaccolta: 2023, importoStanziato: imp(5_000_000), importoAmmesso: imp(4_000_000), importoDecretato: imp(2_000_000), domandeSenzaAmmesso: 10 },
  ];

  it('linee per anno senza unire i punti assenti, con lo zoom interno; lo stanziato assente non si disegna', () => {
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

  it('punto assente: null nella serie (mai zero) e dichiarato; la serie tutta assente una volta sola', () => {
    const g = graficoImportiPerAnno(righe);
    expect(opzioniDi(g).series[1].data).toEqual([null, 3_000_000, 500_000]);
    expect(g.omessi).toEqual(['Importo stanziato: non disponibile per tutti gli anni', `2023: importo decretato ${NON_CALCOLABILE_AGGREGATO}`]);
  });

  it('tabella: Anno, Stanziato, Ammesso, Decretato, Domande senza importo ammesso', () => {
    const g = graficoImportiPerAnno(righe);
    expect(g.tabella.colonne).toEqual(['Anno', 'Stanziato', 'Ammesso', 'Decretato', 'Domande senza importo ammesso']);
    expect(righeN(g)).toEqual([
      ['2023', 'non disponibile', '4.000.000,00 €', NON_CALCOLABILE_AGGREGATO, 'non disponibile'],
      ['2024', 'non disponibile', '6.000.000,00 €', '3.000.000,00 €', 'non disponibile'],
      ['senza campagna', 'non disponibile', '1.000.000,00 €', '500.000,00 €', 'non disponibile'],
    ]);
  });

  it('nessuna riga o nessun importo: non disegnabile', () => {
    controllaNonDisegnabile(graficoImportiPerAnno([]), 'nessun importo per anno di raccolta');
    const vuoti = graficoImportiPerAnno([{ annoRaccolta: 2024, importoAmmesso: assente('FUORI_PERIMETRO'), importoDecretato: assente('FUORI_PERIMETRO') }]);
    controllaNonDisegnabile(vuoti, 'nessun importo valorizzato per anno di raccolta');
    expect(vuoti.omessi).toEqual([
      'Importo stanziato: non disponibile per tutti gli anni',
      `Importo ammesso: ${FUORI_PERIMETRO} per tutti gli anni`,
      `Importo decretato: ${FUORI_PERIMETRO} per tutti gli anni`,
    ]);
  });

  it('stanziato, ammesso e decretato: tre linee; le domande senza ammesso dichiarate se il conteggio e noto per ogni anno', () => {
    const g = graficoImportiPerAnno(conStanziato);
    const o = opzioniDi(g);
    expect(o.series.map((s) => s.name)).toEqual(['Importo stanziato', 'Importo ammesso', 'Importo decretato']);
    expect(o.series[0].data).toEqual([5_000_000, 8_000_000]);
    expect(g.omessi).toEqual(['30 domande senza importo ammesso: non entrano nelle somme']);
    expect(righeN(g)).toEqual([
      ['2023', '5.000.000,00 €', '4.000.000,00 €', '2.000.000,00 €', '10'],
      ['2024', '8.000.000,00 €', '6.000.000,00 €', '3.000.000,00 €', '20'],
    ]);
  });

  it('domande senza ammesso: niente dichiarazione con un conteggio non noto (niente somme parziali) o pari a zero', () => {
    const ignoto = graficoImportiPerAnno([conStanziato[0], { ...conStanziato[1], domandeSenzaAmmesso: null }]);
    expect(ignoto.omessi).toEqual([]);
    expect(ignoto.tabella.righe[0][4]).toBe('non disponibile');
    const zero = graficoImportiPerAnno(conStanziato.map((r) => ({ ...r, domandeSenzaAmmesso: 0 })));
    expect(zero.omessi).toEqual([]);
  });

  it('stanziato da fonte non attiva: la serie si dichiara una volta, col motivo, non anno per anno', () => {
    const g = graficoImportiPerAnno(conStanziato.map((r) => ({ ...r, importoStanziato: assente('FONTE_NON_ATTIVA', 'QUADRO_SINOTTICO'), domandeSenzaAmmesso: null })));
    expect(opzioniDi(g).series.map((s) => s.name)).toEqual(['Importo ammesso', 'Importo decretato']);
    expect(g.omessi).toEqual(['Importo stanziato: non disponibile (fonte quadro sinottico non attiva) per tutti gli anni']);
    // assente in un solo anno: dichiarato per quell'anno
    const unAnno = graficoImportiPerAnno([conStanziato[0], { ...conStanziato[1], importoStanziato: assente('NON_VALORIZZATO') }]);
    expect(unAnno.omessi[0]).toBe(`2023: importo stanziato ${NON_CALCOLABILE_AGGREGATO}`);
  });
});

// ---------------------------------------------------------------- 7. sankey

describe('graficoSankey', () => {
  it('nodi e collegamenti dalla dotazione al pagato', () => {
    const g = graficoSankey(impegni, pagamenti);
    const o = opzioniDi(g);
    controllaAria(o);
    const s = o.series[0];
    expect(s.type).toBe('sankey');
    expect(nomiDi(s)).toEqual(['Dotazione', 'Impegnato', 'Da impegnare', 'Pagato', 'Da pagare']);
    expect(collegamentiDi(s)).toEqual([
      ['Dotazione', 'Impegnato', 60_000_000],
      ['Dotazione', 'Da impegnare', 40_000_000],
      ['Impegnato', 'Pagato', 45_000_000],
      ['Impegnato', 'Da pagare', 15_000_000],
    ]);
    expect(n(o.aria.label.description)).toBe('Flusso della dotazione (100,0 M€): impegnato 60,0 M€, da impegnare 40,0 M€, pagato 45,0 M€, da pagare 15,0 M€.');
    expect(g.omessi).toEqual([]);
  });

  it('il ramo Da impegnare e la dotazione residua del DTO TX-0006, non una differenza calcolata (V-08)', () => {
    const g = graficoSankey({ ...impegni, dotazioneResidua: imp(35_000_000) }, pagamenti);
    expect(collegamentiDi(opzioniDi(g).series[0])[1]).toEqual(['Dotazione', 'Da impegnare', 35_000_000]);
    expect(n(g.tabella.righe[2][1])).toBe('35.000.000,00 €');
    // senza il residuo del DTO non si ricalcola nel browser: il flusso non si disegna
    const senza = graficoSankey({ dotazioneSpesaPubblica: imp(100_000_000), importoImpegnato: imp(60_000_000) }, pagamenti);
    controllaNonDisegnabile(senza, 'il flusso richiede da impegnare: non disponibile');
    expect(senza.tabella.righe[2]).toEqual(['Da impegnare (dotazione residua sugli impegni)', 'non disponibile']);
  });

  it('tabella con le voci dei tre DTO, gli assenti resi come aggregati', () => {
    expect(righeN(graficoSankey(impegni, pagamenti, residuo))).toEqual([
      ['Dotazione', '100.000.000,00 €'],
      ['Impegnato', '60.000.000,00 €'],
      ['Da impegnare (dotazione residua sugli impegni)', '40.000.000,00 €'],
      ["Pagamenti totali sull'impegnato", '45.000.000,00 €'],
      ['Impegnato ancora da pagare', '15.000.000,00 €'],
      ['Pagamenti al netto delle rettifiche', '44.000.000,00 €'],
      ['Dotazione residua sui pagamenti', '56.000.000,00 €'],
    ]);
    const g = graficoSankey(impegni, pagamenti, { ...residuo, dotazioneResidua: assente('NON_VALORIZZATO') });
    expect(g.tabella.righe[6]).toEqual(['Dotazione residua sui pagamenti', NON_CALCOLABILE_AGGREGATO]);
  });

  it('impegnato da fonte non attiva e nessun residuo sui pagamenti: non disegnabile, tabella con le voci disponibili e le assenti col motivo', () => {
    const g = graficoSankey({ ...impegni, importoImpegnato: assente('FONTE_NON_ATTIVA', 'IMPEGNI'), dotazioneResidua: assente('FONTE_NON_ATTIVA', 'IMPEGNI') }, pagamenti);
    controllaNonDisegnabile(g, 'il flusso richiede pagamenti netti: non disponibile; dotazione residua: non disponibile');
    expect(righeN(g)).toEqual([
      ['Dotazione', '100.000.000,00 €'],
      ['Impegnato', 'non disponibile (fonte impegni non attiva)'],
      ['Da impegnare (dotazione residua sugli impegni)', 'non disponibile (fonte impegni non attiva)'],
      ["Pagamenti totali sull'impegnato", '45.000.000,00 €'],
      ['Impegnato ancora da pagare', '15.000.000,00 €'],
      ['Pagamenti al netto delle rettifiche', 'non disponibile'],
      ['Dotazione residua sui pagamenti', 'non disponibile'],
    ]);
    expect(g.omessi).toEqual(["Impegnato non disponibile (fonte impegni non attiva): il ramo dell'impegnato non si disegna"]);
  });

  it('flusso ridotto senza impegni (V-09): dotazione -> pagamenti netti / dotazione residua di TX-0007, il ramo dell impegnato dichiarato', () => {
    const senzaImpegni = { dotazioneSpesaPubblica: imp(100_000_000), importoImpegnato: assente('FONTE_NON_ATTIVA', 'IMPEGNI'), dotazioneResidua: assente('FONTE_NON_ATTIVA', 'IMPEGNI') };
    const g = graficoSankey(senzaImpegni, { pagamentiTotali: assente('FONTE_NON_ATTIVA', 'IMPEGNI'), impegnatoDaPagare: assente('FONTE_NON_ATTIVA', 'IMPEGNI') }, residuo);
    const o = opzioniDi(g);
    const s = o.series[0];
    expect(nomiDi(s)).toEqual(['Dotazione', 'Pagamenti netti', 'Dotazione residua']);
    expect(collegamentiDi(s)).toEqual([
      ['Dotazione', 'Pagamenti netti', 44_000_000],
      ['Dotazione', 'Dotazione residua', 56_000_000],
    ]);
    expect(g.omessi).toEqual(["Impegnato non disponibile (fonte impegni non attiva): il ramo dell'impegnato non si disegna"]);
    expect(n(o.aria.label.description)).toBe(
      'Flusso della dotazione (100,0 M€): pagamenti netti 44,0 M€, dotazione residua 56,0 M€. 1 voce omessa per dati mancanti o non utilizzabili.',
    );
  });

  it('flusso ridotto senza il DTO degli impegni: la dotazione viene da TX-0007', () => {
    const g = graficoSankey({}, {}, residuo);
    expect(collegamentiDi(opzioniDi(g).series[0])).toEqual([
      ['Dotazione', 'Pagamenti netti', 44_000_000],
      ['Dotazione', 'Dotazione residua', 56_000_000],
    ]);
    expect(g.omessi).toEqual(["Impegnato non disponibile: il ramo dell'impegnato non si disegna"]);
    expect(righeN(g)[0]).toEqual(['Dotazione', '100.000.000,00 €']);
  });

  it('da pagare assente: collegamento omesso e dichiarato come aggregato, mai zero', () => {
    const g = graficoSankey(impegni, { ...pagamenti, impegnatoDaPagare: assente('NON_VALORIZZATO') });
    const s = opzioniDi(g).series[0];
    expect(s.links).toHaveLength(3);
    expect(nomiDi(s)).not.toContain('Da pagare');
    expect(g.omessi).toEqual([`Da pagare ${NON_CALCOLABILE_AGGREGATO}`]);
  });

  it('valori negativi: non disegnabile', () => {
    const g = graficoSankey({ ...impegni, importoImpegnato: imp(120_000_000), dotazioneResidua: imp(-20_000_000) }, pagamenti);
    controllaNonDisegnabile(g, 'valori negativi: il flusso non si può disegnare');
    expect(n(g.tabella.righe[2][1])).toBe('-20.000.000,00 €');
  });

  it('perimetro ADA: non disegnabile anche con tutti i valori, la tabella resta', () => {
    const g = graficoSankey(impegni, pagamenti, residuo, 'ADA');
    controllaNonDisegnabile(g, "perimetro ADA: la dotazione è regionale, impegni e pagamenti sono dell'area: il flusso non è confrontabile");
    expect(g.omessi).toEqual([]);
    expect(g.tabella.righe).toHaveLength(7);
    expect(righeN(g)[1]).toEqual(['Impegnato', '60.000.000,00 €']);
    expect(graficoSankey(impegni, pagamenti, residuo, 'REGIONALE').opzioni).not.toBeNull();
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
    controllaNonDisegnabile(g, /^perimetro ADA: .*il rapporto non è confrontabile$/);
    expect(g.tabella.righe).toEqual([['della dotazione pagato', 'non confrontabile (perimetro ADA)']]);
    expect(g.omessi).toEqual([]);
    expect(graficoGauge(40, 100, 'della dotazione pagato', 'REGIONALE').opzioni).not.toBeNull();
  });

  it('perimetro ADA senza valori: non confrontabile, non "non calcolabile"', () => {
    const g = graficoGauge(null, undefined, 'Quota', 'ADA');
    controllaNonDisegnabile(g, "perimetro ADA: la dotazione è regionale, i pagamenti sono dell'area: il rapporto non è confrontabile");
    expect(g.tabella.righe).toEqual([['Quota', 'non confrontabile (perimetro ADA)']]);
  });

  it('parte o totale assenti, totale non positivo, parte negativa: non disegnabile, motivo senza il titolo davanti', () => {
    controllaNonDisegnabile(graficoGauge(null, 100, 'Quota'), 'valore non disponibile: la percentuale non si può calcolare');
    controllaNonDisegnabile(graficoGauge(Number.NaN, 100, 'Quota'), 'valore non disponibile: la percentuale non si può calcolare');
    controllaNonDisegnabile(graficoGauge(10, undefined, 'Quota'), 'totale non disponibile: la percentuale non si può calcolare');
    controllaNonDisegnabile(graficoGauge(10, 0, 'Quota'), 'totale pari a zero o negativo: la percentuale non si può calcolare');
    controllaNonDisegnabile(graficoGauge(10, -5, 'Quota'), /^totale pari a zero o negativo/);
    const negativa = graficoGauge(-1, 100, 'Quota');
    controllaNonDisegnabile(negativa, 'valore negativo: la percentuale non si può calcolare');
    expect(negativa.motivoAssenza).not.toContain('Quota');
    expect(negativa.tabella.righe).toEqual([['Quota', 'non calcolabile']]);
  });
});

// ---------------------------------------------------------------- 9. cascata intervento

describe('graficoCascataIntervento e vociIntervento', () => {
  it('dotazione -> pagamenti netti -> residuo, impegnato assente dichiarato', () => {
    const g = graficoCascataIntervento(rigaIntervento);
    const o = opzioniDi(g);
    controllaAria(o);
    expect(o.xAxis?.data).toEqual(['Dotazione', 'Pagamenti netti', 'Residuo sui pagamenti']);
    expect(valoriDi(o.series[0])).toEqual([0, 6_000_000, 0]);
    expect(valoriDi(o.series[1])).toEqual([10_000_000, 4_000_000, 6_000_000]);
    expect(o.series.every((s) => s.type === 'bar' && s.stack === 'cascata')).toBe(true);
    expect(g.omessi).toEqual(['Impegnato FEASR e non FEASR non disponibile (fonte impegni non attiva)']);
  });

  it('tabella con tutte le voci della riga e il motivo degli assenti: e vociIntervento', () => {
    const g = graficoCascataIntervento(rigaIntervento);
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
    expect(g.tabella).toEqual(vociIntervento(rigaIntervento));
  });

  it('residuo assente: barra omessa e dichiarata come dato della riga', () => {
    const g = graficoCascataIntervento({ ...rigaIntervento, dotazioneResiduaSuPagamenti: assente('NON_VALORIZZATO') });
    expect(opzioniDi(g).xAxis?.data).toEqual(['Dotazione', 'Pagamenti netti']);
    expect(g.omessi).toContain(`Residuo sui pagamenti ${NON_VALORIZZATO_RIGA}`);
  });

  it('dotazione o pagamenti assenti, negativi, pagamenti oltre la dotazione: non disegnabile', () => {
    const senza = graficoCascataIntervento({ ...rigaIntervento, pagamentiNettoRettifiche: assente('FUORI_PERIMETRO') });
    controllaNonDisegnabile(senza, `la cascata di SRA01 richiede dotazione e pagamenti netti; pagamenti netti: ${FUORI_PERIMETRO}`);
    expect(senza.tabella.righe).toHaveLength(8);
    controllaNonDisegnabile(graficoCascataIntervento({ ...rigaIntervento, pagamentiNettoRettifiche: imp(11_000_000) }), 'i pagamenti netti di SRA01 superano la dotazione: la cascata non si può disegnare');
    controllaNonDisegnabile(graficoCascataIntervento({ ...rigaIntervento, dotazioneResiduaSuPagamenti: imp(-1) }), 'importi negativi per SRA01: la cascata non si può disegnare');
  });

  it('perimetro ADA (V-03): non si disegna, la tabella resta con i dati di programma regionali', () => {
    const g = graficoCascataIntervento(rigaIntervento, 'ADA');
    controllaNonDisegnabile(g, "perimetro ADA: la dotazione è regionale, i pagamenti sono dell'area e il residuo è fuori perimetro");
    expect(g.omessi).toEqual([]);
    expect(g.tabella).toEqual(vociIntervento(rigaIntervento, 'ADA'));
    expect(graficoCascataIntervento(rigaIntervento, 'REGIONALE').opzioni).not.toBeNull();
  });

  it('vociIntervento: "(regionale)" sui dati di programma solo per ADA, le assenze con il motivo della riga', () => {
    const ada = vociIntervento({ ...rigaIntervento, dotazioneResiduaSuPagamenti: assente('FUORI_PERIMETRO') }, 'ADA');
    expect(ada.colonne).toEqual(['Voce', 'Importo']);
    expect(ada.caption).toBe('Intervento SRA01: dalla dotazione al residuo sui pagamenti');
    expect(ada.righe.map((r) => r[0])).toEqual([
      'Dotazione di spesa pubblica (regionale)',
      'Quota FEASR (regionale)',
      'Stanziato (regionale)',
      'Impegnato FEASR',
      'Impegnato FEASR e non FEASR',
      'Pagamenti al netto delle rettifiche',
      'Residuo sugli impegni',
      'Residuo sui pagamenti',
    ]);
    expect(ada.righe[7]).toEqual(['Residuo sui pagamenti', FUORI_PERIMETRO]);
    expect(vociIntervento(rigaIntervento, 'REGIONALE').righe[0][0]).toBe('Dotazione di spesa pubblica');
    const vuota = vociIntervento({});
    expect(vuota.caption).toBe('Intervento Senza codice: dalla dotazione al residuo sui pagamenti');
    expect(vuota.righe.every((r) => r[1] === 'non disponibile')).toBe(true);
    expect(vuota.righe).toHaveLength(8);
  });
});

// ---------------------------------------------------------------- 10. quota FEASR

describe('graficoQuotaFeasr', () => {
  const dotazione = { dotazioneSpesaPubblica: imp(100_000_000), quotaFeasr: imp(40_000_000), quotaNonFeasr: imp(60_000_000) };

  it('ciambella a due parti con le percentuali, tabella con la dotazione del DTO (V-04)', () => {
    const g = graficoQuotaFeasr(dotazione);
    const o = opzioniDi(g);
    controllaAria(o);
    const s = o.series[0];
    expect(s.type).toBe('pie');
    expect(Array.isArray(s.radius)).toBe(true);
    expect(nomiDi(s)).toEqual(['Quota FEASR', 'Quota non FEASR']);
    expect(valoriDi(s)).toEqual([40_000_000, 60_000_000]);
    expect(n(o.aria.label.description)).toBe('Dotazione tra quota FEASR e quota non FEASR: Quota FEASR 40 %, Quota non FEASR 60 %.');
    expect(g.tabella.caption).toBe('Dotazione: quota FEASR e quota non FEASR');
    expect(g.tabella.colonne).toEqual(['Voce', 'Importo', 'Sulla dotazione']);
    expect(righeN(g)).toEqual([
      ['Dotazione spesa pubblica', '100.000.000,00 €', '100 %'],
      ['Quota FEASR', '40.000.000,00 €', '40 %'],
      ['Quota non FEASR', '60.000.000,00 €', '60 %'],
    ]);
  });

  it('scarto fra la dotazione e la somma delle quote: riga in tabella, in difetto o in eccesso', () => {
    const difetto = graficoQuotaFeasr({ ...dotazione, quotaNonFeasr: imp(50_000_000) });
    expect(difetto.opzioni).not.toBeNull();
    expect(righeN(difetto)).toHaveLength(5);
    expect(righeN(difetto)[3]).toEqual(['Scarto fra la dotazione e la somma delle quote', '10.000.000,00 €', '10 %']);
    // con uno scarto la tabella dichiara che la ciambella ripartisce la somma delle quote, non la dotazione
    expect(righeN(difetto)[4]).toEqual(['Nota', 'il grafico ripartisce la somma delle due quote, la tabella le confronta con la dotazione']);
    const eccesso = graficoQuotaFeasr({ ...dotazione, quotaNonFeasr: imp(70_000_000) });
    expect(righeN(eccesso)[3]).toEqual(['Scarto fra la dotazione e la somma delle quote', '-10.000.000,00 €', '-10 %']);
  });

  it('dotazione assente: la ciambella si disegna con le due quote, le quote sulla dotazione non si calcolano', () => {
    const g = graficoQuotaFeasr({ quotaFeasr: imp(40_000_000), quotaNonFeasr: imp(60_000_000) });
    expect(g.opzioni).not.toBeNull();
    expect(righeN(g)).toEqual([
      ['Dotazione spesa pubblica', 'non disponibile', 'non calcolabile'],
      ['Quota FEASR', '40.000.000,00 €', 'non calcolabile'],
      ['Quota non FEASR', '60.000.000,00 €', 'non calcolabile'],
    ]);
  });

  it('quota assente: non disegnabile, dichiarata nel motivo come aggregato', () => {
    const g = graficoQuotaFeasr({ ...dotazione, quotaFeasr: assente('NON_VALORIZZATO') });
    controllaNonDisegnabile(g, `manca una delle due parti (Quota FEASR: ${NON_CALCOLABILE_AGGREGATO})`);
    expect(g.omessi).toEqual([]);
    expect(righeN(g)[1]).toEqual(['Quota FEASR', NON_CALCOLABILE_AGGREGATO, 'non calcolabile']);
  });

  it('quote negative o entrambe zero: non disegnabile', () => {
    controllaNonDisegnabile(graficoQuotaFeasr({ quotaFeasr: imp(-1), quotaNonFeasr: imp(10) }), 'una delle due parti è negativa: le proporzioni non avrebbero senso');
    controllaNonDisegnabile(graficoQuotaFeasr({ quotaFeasr: imp(0), quotaNonFeasr: imp(0) }), 'il totale è zero');
  });
});

// ---------------------------------------------------------------- 11. parti di un importo (RF004-RF007)

describe('graficoPartiImporto', () => {
  const titolo = 'Stanziato e da stanziare';
  const parti: [[string, ImportoLike], [string, ImportoLike]] = [
    ['Importo stanziato', imp(30_000_000)],
    ['Importo da stanziare', imp(70_000_000)],
  ];

  it('ciambella delle due parti; la tabella porta le voci date dal chiamante', () => {
    const g = graficoPartiImporto(titolo, parti, [['Totale', imp(100_000_000)], ...parti]);
    const o = opzioniDi(g);
    expect(nomiDi(o.series[0])).toEqual(['Importo stanziato', 'Importo da stanziare']);
    expect(n(o.aria.label.description)).toBe('Stanziato e da stanziare: Importo stanziato 30 %, Importo da stanziare 70 %.');
    expect(g.tabella.caption).toBe(titolo);
    expect(g.tabella.colonne).toEqual(['Voce', 'Importo']);
    expect(righeN(g)).toEqual([
      ['Totale', '100.000.000,00 €'],
      ['Importo stanziato', '30.000.000,00 €'],
      ['Importo da stanziare', '70.000.000,00 €'],
    ]);
  });

  it('parte assente: resa come aggregato per default, come dato di una riga se richiesto', () => {
    const conAssente: [[string, ImportoLike], [string, ImportoLike]] = [['Importo stanziato', assente('NON_VALORIZZATO')], parti[1]];
    const g = graficoPartiImporto(titolo, conAssente, conAssente);
    controllaNonDisegnabile(g, `manca una delle due parti (Importo stanziato: ${NON_CALCOLABILE_AGGREGATO})`);
    expect(g.tabella.righe[0]).toEqual(['Importo stanziato', NON_CALCOLABILE_AGGREGATO]);
    const perRiga = graficoPartiImporto(titolo, conAssente, conAssente, false);
    expect(perRiga.motivoAssenza).toBe(`manca una delle due parti (Importo stanziato: ${NON_VALORIZZATO_RIGA})`);
    expect(perRiga.tabella.righe[0]).toEqual(['Importo stanziato', NON_VALORIZZATO_RIGA]);
    const fonte = graficoPartiImporto(titolo, [['Importo impegnato', assente('FONTE_NON_ATTIVA', 'IMPEGNI')], parti[1]], []);
    expect(fonte.motivoAssenza).toBe('manca una delle due parti (Importo impegnato: non disponibile (fonte impegni non attiva))');
  });
});

// ---------------------------------------------------------------- 12. contributo ambientale

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
    controllaNonDisegnabile(graficoContributo([righeSpesa[2]]), 'nessun intervento con il contributo ambientale valorizzato');
  });
});

// ---------------------------------------------------------------- 13. dotazione e pagato

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

  it('barre raggruppate Dotazione e Pagamenti totali, codice nel dato, assenti vuoti (mai zero) e dichiarati', () => {
    const g = graficoDotazionePagamenti(righe, 'REGIONALE');
    const o = opzioniDi(g);
    controllaAria(o);
    expect(o.series.map((s) => [s.type, s.name, s.stack])).toEqual([
      ['bar', 'Dotazione', undefined],
      ['bar', 'Pagamenti totali', undefined],
    ]);
    expect(o.xAxis?.data).toEqual(['SRA01', 'SRA02']);
    expect(item(o.series[0].data?.[0]).codice).toBe('SRA01');
    expect(o.series[1].data?.[1]).toBeNull();
    expect(g.omessi).toEqual([
      `SRA02, pagamenti totali: ${NON_VALORIZZATO_RIGA}`,
      'SRA03, dotazione: non disponibile (fonte non attiva)',
      'SRA03, pagamenti totali: non disponibile (fonte non attiva)',
    ]);
    expect(o.dataZoom).toBeUndefined();
    expect(g.tabella.colonne).toEqual(['Intervento', 'Dotazione', 'Pagamenti totali']);
    expect(righeN(g)).toEqual([
      ['SRA01', '10.000.000,00 €', '6.000.000,00 €'],
      ['SRA02', '20.000.000,00 €', NON_VALORIZZATO_RIGA],
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
    expect(o.series.map((s) => s.name)).toEqual(['Pagamenti totali']);
    expect(o.xAxis?.data).toEqual(['SRA01']);
    expect(g.omessi[0]).toBe("perimetro ADA: la dotazione regionale non si affianca ai pagamenti dell'area");
    expect(g.tabella.colonne).toEqual(['Intervento', 'Pagamenti totali']);
  });

  it('il nome del pagato dice quale pagato e (V-19): serie, colonne, didascalia e omessi', () => {
    const g = graficoDotazionePagamenti(righe, 'REGIONALE', 'Pagamenti netti');
    const o = opzioniDi(g);
    expect(o.series.map((s) => s.name)).toEqual(['Dotazione', 'Pagamenti netti']);
    expect(g.tabella.colonne).toEqual(['Intervento', 'Dotazione', 'Pagamenti netti']);
    expect(g.tabella.caption).toBe('Dotazione e pagamenti netti per intervento');
    expect(g.omessi[0]).toBe(`SRA02, pagamenti netti: ${NON_VALORIZZATO_RIGA}`);
    expect(o.aria.label.description).toMatch(/^Barre raggruppate di dotazione e pagamenti netti per 2 interventi, da SRA01 a SRA02/);
    const ada = graficoDotazionePagamenti(righe, 'ADA', 'Pagamenti netti');
    expect(opzioniDi(ada).series.map((s) => s.name)).toEqual(['Pagamenti netti']);
    expect(ada.tabella.caption).toBe('Pagamenti netti per intervento');
  });

  it('nessun valore: non disegnabile', () => {
    controllaNonDisegnabile(graficoDotazionePagamenti([righe[2]]), 'nessun intervento con dotazione o pagamenti totali valorizzati');
    controllaNonDisegnabile(graficoDotazionePagamenti([]), /^nessun intervento/);
    controllaNonDisegnabile(graficoDotazionePagamenti([righe[2]], 'ADA'), 'nessun intervento con pagamenti totali valorizzati');
  });
});

// ---------------------------------------------------------------- 14. riserva

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

  it('movimento senza data: in coda alla tabella ("senza data") e dichiarato', () => {
    const g = graficoUtilizzoRiserva({ ...riserva, utilizzoProgressivo: [...riserva.utilizzoProgressivo, { data: null, importo: 100_000, cumulato: null }] });
    expect(righeN(g)[2]).toEqual(['senza data', '100.000,00 €', 'non disponibile']);
    expect(g.omessi).toEqual(['1 movimento senza data']);
    expect(opzioniDi(g).xAxis?.data).toHaveLength(2);
  });

  it('nessun punto: non disegnabile', () => {
    controllaNonDisegnabile(graficoUtilizzoRiserva({ importoAccumulato: 5_000_000, utilizzoProgressivo: [] }), 'nessun utilizzo della riserva registrato');
    controllaNonDisegnabile(graficoUtilizzoRiserva({}), 'nessun utilizzo della riserva registrato');
  });
});

// ---------------------------------------------------------------- 15. SMP

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
    expect(g.omessi).toEqual(['SRA02, previsione di pagamento: non disponibile (fonte previsione di pagamento non attiva)']);
    expect(g.tabella.colonne).toEqual(['Intervento', 'Previsione di pagamento', 'Spesa erogata nella campagna precedente']);
    expect(righeN(g)[1]).toEqual(['SRA02', 'non disponibile (fonte previsione di pagamento non attiva)', '1.000.000,00 €']);
  });

  it('oltre 12 interventi: zoom interno e cursore', () => {
    const molte = Array.from({ length: 13 }, (_, k) => ({ codiceIntervento: `SRC${k + 10}`, previsionePagamentoEsercizio: imp(1_000_000) }));
    expect(opzioniDi(graficoSmp(molte)).dataZoom?.map((z) => z.type)).toEqual(['inside', 'slider']);
  });

  it('nessun valore: non disegnabile', () => {
    const g = graficoSmp([{ codiceIntervento: 'SRA09' }]);
    controllaNonDisegnabile(g, 'nessun intervento con previsione di pagamento o spesa erogata valorizzate');
    expect(g.omessi).toEqual([
      'SRA09, previsione di pagamento: non disponibile',
      'SRA09, spesa erogata nella campagna precedente: non disponibile',
    ]);
  });
});

// ---------------------------------------------------------------- regola dei motivi

describe('regola dei motivi: segue "Grafico non disponibile: ", iniziale minuscola salvo sigle e codici', () => {
  const REGOLA = /^([a-zà-ý]|[A-Z]{2}|[A-Z]+\d)/;

  it('la regola accetta minuscole, sigle e codici e rifiuta una parola con la maiuscola', () => {
    for (const ok of ['nessun intervento', 'è assente', 'ADA: perimetro', 'SRA01: dotazione', 'X2 assente']) expect(ok).toMatch(REGOLA);
    for (const ko of ['Nessun intervento', 'Perimetro ADA', 'Il pagato']) expect(ko).not.toMatch(REGOLA);
  });

  const casi: Array<[string, DatiGrafico]> = [
    ['avanzamento, perimetro ADA', graficoAvanzamento(righeSpesa, 'ADA')],
    ['avanzamento, nessuna riga utile', graficoAvanzamento([righeSpesa[3]])],
    ['famiglie, nessuna dotazione utile', graficoFamiglie([righeSpesa[3]])],
    ['contributo, nessun valore', graficoContributo([righeSpesa[2]])],
    ['dotazione e pagato, nessun valore', graficoDotazionePagamenti([])],
    ['dotazione e pagato ADA, nessun valore', graficoDotazionePagamenti([], 'ADA')],
    ['imbuto SIGC, presentate assenti', graficoImbutoSigc({ pagate: 10 })],
    ['imbuto SIGC, nessuna presentata', graficoImbutoSigc({ presentate: 0 })],
    ['cascata SIGC, importo assente', graficoCascataSigc({ ...sigcBase, pagato: assente('NON_VALORIZZATO') })],
    ['cascata SIGC, importi negativi', graficoCascataSigc({ ...sigcBase, pagato: imp(-1) })],
    ['cascata SIGC, ammesso oltre il richiesto', graficoCascataSigc({ ...sigcBase, ammesso: imp(12_000_000) })],
    ['cascata SIGC, pagato oltre l ammesso', graficoCascataSigc({ ...sigcBase, pagato: imp(9_000_000) })],
    ['SMP, nessun valore', graficoSmp([{ codiceIntervento: 'SRA09' }])],
    ['domande per anno, nessuna riga', graficoDomandePerAnno([])],
    ['domande per anno, nessun numero', graficoDomandePerAnno([{ annoRaccolta: 2024 }])],
    ['importi per anno, nessuna riga', graficoImportiPerAnno([])],
    ['importi per anno, nessun importo', graficoImportiPerAnno([{ annoRaccolta: 2024 }])],
    ['sankey, perimetro ADA', graficoSankey(impegni, pagamenti, residuo, 'ADA')],
    ['sankey, rami principali assenti', graficoSankey({}, {}, {})],
    ['sankey, residuo del DTO assente', graficoSankey({ ...impegni, dotazioneResidua: null }, pagamenti)],
    ['sankey, valori negativi', graficoSankey({ ...impegni, dotazioneResidua: imp(-20_000_000) }, pagamenti)],
    ['gauge, perimetro ADA', graficoGauge(40, 100, 'Quota', 'ADA')],
    ['gauge, valore assente', graficoGauge(null, 100, 'Quota')],
    ['gauge, totale assente', graficoGauge(10, null, 'Quota')],
    ['gauge, totale zero', graficoGauge(10, 0, 'Quota')],
    ['gauge, valore negativo', graficoGauge(-1, 100, 'Quota')],
    ['quota FEASR, quota assente', graficoQuotaFeasr({ quotaFeasr: assente('NON_VALORIZZATO'), quotaNonFeasr: imp(10) })],
    ['quota FEASR, quota negativa', graficoQuotaFeasr({ quotaFeasr: imp(-1), quotaNonFeasr: imp(10) })],
    ['quota FEASR, totale zero', graficoQuotaFeasr({ quotaFeasr: imp(0), quotaNonFeasr: imp(0) })],
    ['parti di un importo, parte assente', graficoPartiImporto('Prova', [['Importo A', undefined], ['Importo B', imp(10)]], [])],
    ['cascata intervento, perimetro ADA', graficoCascataIntervento(rigaIntervento, 'ADA')],
    ['cascata intervento, pagamenti assenti', graficoCascataIntervento({ ...rigaIntervento, pagamentiNettoRettifiche: assente('FUORI_PERIMETRO') })],
    ['cascata intervento, senza codice e senza dotazione', graficoCascataIntervento({})],
    ['cascata intervento, importi negativi', graficoCascataIntervento({ ...rigaIntervento, pagamentiNettoRettifiche: imp(-1) })],
    ['cascata intervento, pagamenti oltre la dotazione', graficoCascataIntervento({ ...rigaIntervento, pagamentiNettoRettifiche: imp(11_000_000) })],
    ['riserva, nessun utilizzo', graficoUtilizzoRiserva({})],
  ];

  it.each(casi)('%s', (_caso, g) => {
    expect(g.opzioni).toBeNull();
    expect(g.motivoAssenza).toMatch(REGOLA);
    expect(g.tabella.colonne.length).toBeGreaterThan(0);
  });
});

describe('sottotitoloFlusso (N-18)', () => {
  it("dice il ramo disegnato: con l'impegnato fino al pagato, senza dalla dotazione ai pagamenti netti col motivo", () => {
    expect(sottotitoloFlusso({ importoImpegnato: { valore: 10, motivo: null, fonte: null } })).toBe("Dalla dotazione all'impegnato e al pagato");
    expect(sottotitoloFlusso({ importoImpegnato: { valore: null, motivo: 'FONTE_NON_ATTIVA', fonte: 'IMPEGNI' } })).toBe(
      'Dalla dotazione ai pagamenti netti e al residuo; impegnato: non disponibile (fonte impegni non attiva)',
    );
  });
});
