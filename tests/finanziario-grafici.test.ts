// Test L1 dei builder PURI dei grafici del finanziario (lib/grafici/, lib/famiglie.ts): chiamate dirette, niente
// render. Dati di prova inventati, numeri tondi. Per ogni builder: forma delle opzioni, valori assenti omessi e
// dichiarati con la resa del dominio (mai zero nel grafico), caso non disegnabile con il motivo (iniziale minuscola:
// segue "Grafico non disponibile: "), tabella coerente con il grafico. Le primitive del kit sono in shared-grafici.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { ImportoLike } from '../src/entities/importo';
import { FAMIGLIA_ALTRO, famigliaDi } from '../src/features/finanziario/lib/famiglie';
import {
  graficoAvanzamento,
  graficoBarreIntervento,
  graficoImportiSigc,
  graficoDomandePerAnno,
  graficoDomandeSigc,
  graficoDotazionePagamenti,
  graficoFamiglie,
  graficoGauge,
  graficoImportiPerAnno,
  graficoPagatoNetto,
  graficoPartiImporto,
  graficoQuotaFeasr,
  graficoSankey,
  graficoUtilizzoRiserva,
  letturaUtilizzoRiserva,
  sottotitoloFlusso,
  vociIntervento,
} from '../src/features/finanziario/lib/grafici';
import type { RigaRiepilogo, RigaSpesa } from '../src/features/finanziario/lib/grafici';
import { avanzamentoPonderato } from '../src/features/finanziario/lib/avanzamento';
import { VERDE_PAGATO, larghezzaEtichetta, posizioneEtichettaSegmento } from '../src/features/finanziario/lib/grafici/sigc';
import { impegnatiDiversi } from '../src/features/finanziario/lib/impegnati';
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
  { codiceIntervento: 'SRA01', dotazioneSpesaPubblica: imp(10_000_000), pagamentiTotali: imp(6_000_000) },
  { codiceIntervento: 'SRA02', dotazioneSpesaPubblica: imp(20_000_000), pagamentiTotali: imp(2_000_000) },
  { codiceIntervento: 'SRD13', dotazioneSpesaPubblica: imp(10_000_000), pagamentiTotali: imp(4_000_000) },
  { codiceIntervento: 'SRA03', dotazioneSpesaPubblica: assente('FONTE_NON_ATTIVA', 'QUADRO_SINOTTICO'), pagamentiTotali: imp(1_000_000) },
];

// TX-0013 (D-09): ammesso = pagato + ancora da pagare - pagato oltre l'ammesso, nessuna domanda senza importi
const sigcBase = {
  richiesto: imp(10_000_000),
  ammesso: imp(8_000_000),
  pagato: imp(5_000_000),
  ancoraDaPagare: imp(3_100_000),
  pagatoOltreAmmesso: imp(100_000),
  domandeSenza: { richiesto: 0, ammesso: 0, pagato: 0 },
};

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
  // revisioni del 31/10/2026 (R08): pagato lordo e rettifiche (netto = lordo - rettifiche)
  pagamentiLordi: imp(4_500_000),
  importoRettifiche: imp(500_000),
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
    expect(g.tabella.colonne).toEqual(['Intervento', 'Dotazione', 'Pagato (lordo)', 'Pagato lordo sulla dotazione']);
    expect(righeN(g)).toEqual([
      ['SRA01', '10.000.000,00 €', '6.000.000,00 €', '60 %'],
      ['SRD13', '10.000.000,00 €', '4.000.000,00 €', '40 %'],
      ['SRA02', '20.000.000,00 €', '2.000.000,00 €', '10 %'],
      ['SRA03', 'non disponibile (fonte quadro sinottico non attiva)', '1.000.000,00 €', 'non calcolabile'],
      ['Media ponderata degli interventi nel grafico', '40.000.000,00 €', '12.000.000,00 €', '30 %'],
    ]);
  });

  it('quota piccola ma non nulla: due decimali sotto l 1 %, mai "0 %"', () => {
    const g = graficoAvanzamento([{ codiceIntervento: 'SRA01', dotazioneSpesaPubblica: imp(10_000_000), pagamentiTotali: imp(4_000) }]);
    expect(valoriDi(opzioniDi(g).series[0])).toEqual([0.04]);
    expect(righeN(g)[0]).toEqual(['SRA01', '10.000.000,00 €', '4.000,00 €', '0,04 %']);
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
    expect(n(testo)).toBe('SR<b>: 50 % della dotazione (pagato 50,00 € su 100,00 €)');
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

  it('tabella: foglie e totale per famiglia (non calcolabile se manca un intervento, review v3 X-02), poi le omesse', () => {
    const g = graficoFamiglie(righeSpesa);
    expect(g.tabella.colonne).toEqual(['Famiglia', 'Intervento', 'Dotazione']);
    expect(righeN(g)).toEqual([
      ['SRA', 'SRA02', '20.000.000,00 €'],
      ['SRA', 'SRA01', '10.000.000,00 €'],
      ['SRA', 'Totale della famiglia', 'non calcolabile (manca per SRA03)'],
      ['SRD', 'SRD13', '10.000.000,00 €'],
      ['SRD', 'Totale della famiglia', '10.000.000,00 €'],
      ['SRA', 'SRA03', 'non disponibile (fonte quadro sinottico non attiva)'],
    ]);
  });

  it('famiglia con un intervento senza dotazione: nodo e descrizione non chiamano totale la somma parziale (review v3 X-02)', () => {
    const g = graficoFamiglie(righeSpesa);
    const [sra, srd] = (opzioniDi(g).series[0].data ?? []).map(item);
    expect(n(sra.etichetta ?? '')).toBe('SRA non calcolabile');
    expect(n(sra.dettaglio ?? '')).toBe('Famiglia SRA: dotazione non calcolabile (manca per SRA03); 2 interventi con dotazione, 30,0 M€');
    expect(sra.value).toBe(30_000_000);
    expect(n(srd.etichetta ?? '')).toBe('SRD 10,0 M€');
    const descrizione = opzioniDi(g).aria.label.description;
    expect(n(descrizione)).toContain('2 famiglie e 3 interventi; dotazione non calcolabile per SRA (manca per SRA03).');
    expect(descrizione).not.toContain('maggiore');
    // tutte complete: la famiglia maggiore si dichiara
    expect(n(opzioniDi(graficoFamiglie(righeSpesa.filter((r) => r.codiceIntervento !== 'SRA03'))).aria.label.description)).toContain('la famiglia con la dotazione maggiore è SRA (30,0 M€)');
  });

  it('dotazione 0,00 o negativa: fuori dal grafico ma dentro il totale della famiglia, che resta calcolabile (review v3 N-01)', () => {
    const righe: RigaSpesa[] = [
      { codiceIntervento: 'SRA01', dotazioneSpesaPubblica: imp(20_000_000) },
      { codiceIntervento: 'SRA05', dotazioneSpesaPubblica: imp(0) },
      { codiceIntervento: 'SRA06', dotazioneSpesaPubblica: imp(-1_000_000) },
    ];
    const g = graficoFamiglie(righe);
    expect(righeN(g)).toContainEqual(['SRA', 'Totale della famiglia', '19.000.000,00 €']);
    const [sra] = (opzioniDi(g).series[0].data ?? []).map(item);
    // l'area resta quella delle foglie positive; etichetta e dettaglio dicono la dotazione della famiglia
    expect(sra.value).toBe(20_000_000);
    // l'area (20 M€) non e' la dotazione della famiglia (19 M€): etichetta e dettaglio dicono le due cose (review v3 M-01)
    expect(n(sra.etichetta ?? '')).toBe('SRA 19,0 M€ (nel grafico 20,0 M€)');
    expect(n(sra.dettaglio ?? '')).toBe(
      'Famiglia SRA: dotazione 19,0 M€; 1 intervento nel grafico, 20,0 M€; 2 interventi fuori dal grafico (dotazione zero o negativa), -1,0 M€',
    );
    expect(n(opzioniDi(g).aria.label.description)).toContain('la famiglia con la dotazione maggiore è SRA (19,0 M€)');
    expect(g.omessi).toEqual(['SRA05: dotazione pari a zero', 'SRA06: dotazione negativa']);
  });

  it('nessuna dotazione utile: non disegnabile, ma la famiglia ha comunque la sua riga di totale (review v3 M-02)', () => {
    const g = graficoFamiglie([righeSpesa[3]]);
    controllaNonDisegnabile(g, 'nessun intervento con dotazione valorizzata e positiva');
    expect(righeN(g)).toEqual([
      ['SRA', 'Totale della famiglia', 'non calcolabile (manca per SRA03)'],
      ['SRA', 'SRA03', 'non disponibile (fonte quadro sinottico non attiva)'],
    ]);
  });

  it('famiglia senza interventi disegnati: riga di totale e confronto anche per lei, come il KPI (review v3 M-02)', () => {
    const negativa = graficoFamiglie([
      { codiceIntervento: 'SRA01', dotazioneSpesaPubblica: imp(20_000_000) },
      { codiceIntervento: 'SRD01', dotazioneSpesaPubblica: imp(-5_000_000) },
    ]);
    expect(righeN(negativa)).toContainEqual(['SRD', 'Totale della famiglia', '-5.000.000,00 €']);
    // nel grafico la sola famiglia disegnabile
    expect((opzioniDi(negativa).series[0].data ?? []).map((f) => item(f).name)).toEqual(['SRA']);
    const conAssente = graficoFamiglie([
      { codiceIntervento: 'SRA01', dotazioneSpesaPubblica: imp(20_000_000) },
      { codiceIntervento: 'SRD01', dotazioneSpesaPubblica: assente('NON_VALORIZZATO', null) },
    ]);
    expect(righeN(conAssente)).toContainEqual(['SRD', 'Totale della famiglia', 'non calcolabile (manca per SRD01)']);
    const descrizione = n(opzioniDi(conAssente).aria.label.description);
    expect(descrizione).toContain('dotazione non calcolabile per SRD (manca per SRD01)');
    expect(descrizione).not.toContain('maggiore');
  });
});

// ---------------------------------------------------------------- 3. domande SIGC

describe('graficoDomandeSigc', () => {
  // D-09: pagate e da pagare si sovrappongono (pagate in parte), le senza importi non sono ne' l'una ne' l'altra
  const domande = { presentate: 10_000, pagate: 6_000, daPagare: 4_500, senzaImporti: 500 };

  it('barre orizzontali, non un imbuto: presentate, pagate, da pagare e senza importi, con la quota sulle presentate', () => {
    const o = opzioniDi(graficoDomandeSigc(domande));
    controllaAria(o);
    const s = o.series[0];
    expect(s.type).toBe('bar');
    expect(o.yAxis?.data).toEqual(['Presentate', 'Pagate', 'Da pagare', 'Senza importi']);
    expect(o.yAxis?.inverse).toBe(true);
    expect(valoriDi(s)).toEqual([10_000, 6_000, 4_500, 500]);
    expect(item(s.data?.[0]).etichetta).toBe('10.000');
    expect(n(item(s.data?.[1]).etichetta ?? '')).toBe('6.000 (60 %)');
    expect(n(item(s.data?.[2]).dettaglio ?? '')).toBe('Da pagare: 4.500 domande (45 % delle presentate)');
  });

  it('pagate e da pagare si sovrappongono: la descrizione lo dice, nessuna partizione delle presentate', () => {
    // 6000 + 4500 + 500 supera le presentate: le pagate in parte sono anche da pagare
    expect(n(opzioniDi(graficoDomandeSigc(domande)).aria.label.description)).toBe(
      'Barre delle domande SIGC: presentate 10.000, pagate 6.000 (60 %), da pagare 4.500 (45 %), senza importi 500 (5 %). ' +
        'Pagate e da pagare si sovrappongono (domande pagate in parte): le voci non sommano alle presentate.',
    );
  });

  it('tabella con la definizione di ogni voce e la quota sulle presentate', () => {
    const g = graficoDomandeSigc(domande);
    expect(g.tabella.colonne).toEqual(['Voce', 'Domande', 'Quota sulle presentate']);
    expect(righeN(g)).toEqual([
      ['Presentate', '10.000', '100 %'],
      ['Pagate (ammesso e pagato valorizzati, pagato maggiore di zero)', '6.000', '60 %'],
      ['Da pagare (ammesse con importo ancora da pagare, anche se pagate in parte)', '4.500', '45 %'],
      ['Senza importi (non classificabili)', '500', '5 %'],
    ]);
  });

  it('voce assente: omessa e dichiarata, mai zero', () => {
    const g = graficoDomandeSigc({ presentate: 1000, pagate: 600, daPagare: 300 });
    expect(opzioniDi(g).yAxis?.data).toEqual(['Presentate', 'Pagate', 'Da pagare']);
    expect(g.omessi).toEqual(['Senza importi: numero di domande non disponibile']);
    expect(g.tabella.righe[3]).toEqual(['Senza importi (non classificabili)', 'non disponibile', 'non calcolabile']);
  });

  it('presentate assenti o zero: non disegnabile', () => {
    controllaNonDisegnabile(graficoDomandeSigc({ pagate: 10 }), 'domande presentate non disponibili: il grafico non si può disegnare');
    const zero = graficoDomandeSigc({ presentate: 0, pagate: 0, daPagare: 0, senzaImporti: 0 });
    controllaNonDisegnabile(zero, 'nessuna domanda presentata: il grafico non si può disegnare');
    expect(zero.tabella.righe[0]).toEqual(['Presentate', '0', 'non calcolabile']);
  });

  it('quota piccola ma non nulla: mai "0 %" (due decimali sotto l 1 %, "< 0,01 %" sotto lo 0,005 %)', () => {
    const g = graficoDomandeSigc({ presentate: 100_000, pagate: 30, daPagare: 3, senzaImporti: 0 });
    expect(righeN(g).map((r) => r[2])).toEqual(['100 %', '0,03 %', '< 0,01 %', '0 %']);
  });
});

// ---------------------------------------------------------------- 4. cascata SIGC

describe('graficoImportiSigc (R13, forma B: due barre impilate)', () => {
  const segmenti = (o: ReturnType<typeof opzioniDi>) => o.series.map((s) => [s.name, s.stack, valoriDi(s)]);

  it('richiesto = ammesso + non ammesso, ammesso = pagato + ancora da pagare; il pagato oltre l ammesso e una nota', () => {
    const g = graficoImportiSigc(sigcBase);
    const o = opzioniDi(g);
    controllaAria(o);
    expect(o.yAxis?.data).toEqual(['Richiesto', 'Ammesso']);
    expect(segmenti(o)).toEqual([
      ['Ammesso', 'importi', [8_000_000, null]],
      ['Non ammesso', 'importi', [2_000_000, null]],
      // col pagato oltre l'ammesso il segmento e' la parte entro l'ammesso, e lo dice (review X-13)
      ["Pagato entro l'ammesso", 'importi', [null, 4_900_000]],
      ['Ancora da pagare', 'importi', [null, 3_100_000]],
    ]);
    // le due barre tornano: richiesto 10 = 8 + 2; ammesso 8 = 4,9 + 3,1
    expect(n(item(o.series[0].data?.[0]).etichetta ?? '')).toBe('8,0 M€ (80 %)');
    expect(n(item(o.series[2].data?.[1]).etichetta ?? '')).toBe('4,9 M€ (61,3 %)');
    expect(g.omessi.map(n)).toEqual(["Pagato oltre l'ammesso: 100.000,00 € (fuori dalla barra dell'ammesso)"]);
    expect(n(o.aria.label.description)).toBe(
      "Due barre impilate degli importi SIGC: richiesto 10,0 M€ = ammesso 8,0 M€ + non ammesso 2,0 M€; ammesso 8,0 M€ = pagato 4,9 M€ + ancora da pagare 3,1 M€ (più 100.000,00 € pagati oltre l'ammesso). 1 voce omessa per dati mancanti o non utilizzabili.",
    );
  });

  it("tabella con i valori del DTO, come prima: niente 'non ancora pagato' ricalcolato", () => {
    const g = graficoImportiSigc(sigcBase);
    expect(g.tabella.caption).toBe("Importi delle domande SIGC: dal richiesto all'ancora da pagare");
    expect(righeN(g)).toEqual([
      ['Richiesto', '10.000.000,00 €'],
      ['Non ammesso (richiesto meno ammesso)', '2.000.000,00 €'],
      ['Ammesso', '8.000.000,00 €'],
      ["Pagato oltre l'ammesso", '100.000,00 €'],
      ['Pagato', '5.000.000,00 €'],
      ['Ancora da pagare', '3.100.000,00 €'],
      ['Domande senza importo richiesto', '0'],
      ['Domande senza importo ammesso', '0'],
      ['Domande senza importo pagato', '0'],
    ]);
  });

  it('valori che non tornano, importi assenti o negativi: non disegnabile con il motivo, la tabella resta', () => {
    const g = graficoImportiSigc({ ...sigcBase, ancoraDaPagare: imp(4_000_000), domandeSenza: { richiesto: 0, ammesso: 0, pagato: 120 } });
    controllaNonDisegnabile(g, 'ammesso, pagato e ancora da pagare non tornano (somme su domande diverse, vedi le domande senza importo): il grafico non si può disegnare');
    expect(righeN(g)[5]).toEqual(['Ancora da pagare', '4.000.000,00 €']);
    const assente1 = graficoImportiSigc({ ...sigcBase, pagatoOltreAmmesso: assente('NON_VALORIZZATO') });
    controllaNonDisegnabile(assente1, `il grafico richiede ammesso, pagato oltre l'ammesso, pagato e ancora da pagare: pagato oltre l'ammesso ${NON_VALORIZZATO_RIGA}`);
    expect(assente1.omessi).toEqual([`Pagato oltre l'ammesso ${NON_VALORIZZATO_RIGA}`]);
    controllaNonDisegnabile(graficoImportiSigc({ ...sigcBase, pagato: imp(-1) }), 'importi negativi: il grafico non si può disegnare');
  });

  it('richiesto e ammesso non sulle stesse domande: la sola barra dell ammesso, con il motivo', () => {
    const diverse = graficoImportiSigc({ ...sigcBase, domandeSenza: { richiesto: 50, ammesso: 0, pagato: 0 } });
    expect(opzioniDi(diverse).yAxis?.data).toEqual(['Ammesso']);
    const motivo = 'richiesto e ammesso sono somme su domande diverse (50 domande senza richiesto, 0 senza ammesso)';
    expect(diverse.omessi[0]).toBe(`Richiesto e non ammesso: ${motivo}`);
    expect(diverse.tabella.righe[1]).toEqual(['Non ammesso (richiesto meno ammesso)', `non calcolabile (${motivo})`]);
    const senzaRichiesto = graficoImportiSigc({ ...sigcBase, richiesto: assente('FONTE_NON_ATTIVA', 'LEGAME_AZIONI_PORTANTI'), pagatoOltreAmmesso: imp(0), pagato: imp(4_900_000) });
    expect(opzioniDi(senzaRichiesto).yAxis?.data).toEqual(['Ammesso']);
    expect(senzaRichiesto.omessi).toEqual(['Richiesto non disponibile (fonte legame interventi - azioni portanti non attiva)']);
  });
});

// ---------------------------------------------------------------- 5. domande per anno

describe('graficoDomandePerAnno', () => {
  const righe = [
    { annoRaccolta: 2024, primaAnnualita: 300, altreAnnualita: 100, nonClassificate: 0, totali: 400 },
    { annoRaccolta: null, primaAnnualita: 10, altreAnnualita: 0, nonClassificate: 10, totali: 20 },
    { annoRaccolta: 2023, primaAnnualita: 200, altreAnnualita: 50, nonClassificate: 50, totali: 300 },
  ];

  it('barre impilate per anno, senza anno di raccolta in coda', () => {
    const g = graficoDomandePerAnno(righe);
    const o = opzioniDi(g);
    controllaAria(o);
    expect(o.xAxis?.data).toEqual(['2023', '2024', 'senza anno di raccolta']);
    expect(o.series.map((s) => [s.type, s.name, s.stack])).toEqual([
      ['bar', 'Prima annualità', 'domande'],
      ['bar', 'Altre annualità', 'domande'],
      ['bar', 'Non classificate', 'domande'],
    ]);
    // ogni segmento porta il codice dell'annualita' e l'anno (drill-down verso l'elenco operativo, review v4 H-02)
    expect(o.series[0].data).toEqual([
      { value: 200, codice: 'PRIMA', anno: 2023 },
      { value: 300, codice: 'PRIMA', anno: 2024 },
      { value: 10, codice: 'PRIMA', anno: null },
    ]);
    expect(o.aria.label.description).toMatch(/720 domande in tutto/);
  });

  it('tabella: Anno di raccolta, Prima annualità, Altre annualità, Non classificate, Totale (come la tabella con i link, H-05)', () => {
    const g = graficoDomandePerAnno(righe);
    expect(g.tabella.colonne).toEqual(['Anno di raccolta', 'Prima annualità', 'Altre annualità', 'Non classificate', 'Totale']);
    expect(g.tabella.righe).toEqual([
      ['2023', '200', '50', '50', '300'],
      ['2024', '300', '100', '0', '400'],
      ['senza anno di raccolta', '10', '0', '10', '20'],
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
    expect(g.omessi[0]).toBe('senza anno di raccolta, prima annualità: numero di domande non disponibile');
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
    expect(o.xAxis?.data).toEqual(['2023', '2024', 'senza anno di raccolta']);
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

  it('tabella con le intestazioni della tabella di dettaglio (note di Leonardo del 10/11/2026)', () => {
    const g = graficoImportiPerAnno(righe);
    expect(g.tabella.colonne).toEqual(['Anno di raccolta', 'Importo stanziato', 'Importo ammesso', 'Importo decretato (elenchi di liquidazione)', 'Domande senza importo ammesso']);
    expect(righeN(g)).toEqual([
      ['2023', 'non disponibile', '4.000.000,00 €', NON_CALCOLABILE_AGGREGATO, 'non disponibile'],
      ['2024', 'non disponibile', '6.000.000,00 €', '3.000.000,00 €', 'non disponibile'],
      ['senza anno di raccolta', 'non disponibile', '1.000.000,00 €', '500.000,00 €', 'non disponibile'],
    ]);
  });

  // D-09: un anno in cui nessuna domanda ha l'ammesso e' NON_VALORIZZATO (prima 0,00): il dato assente nella fonte, non
  // un totale per intervento che manca
  it('anno senza ammesso su nessuna domanda: punto vuoto, dichiarato come dato assente nella fonte', () => {
    const g = graficoImportiPerAnno([...righe.slice(1), { annoRaccolta: 2025, importoAmmesso: assente('NON_VALORIZZATO'), importoDecretato: imp(0), domandeSenzaAmmesso: 40 }]);
    expect(opzioniDi(g).series[0].data).toEqual([4_000_000, 6_000_000, null]);
    expect(g.omessi).toContain(`2025: importo ammesso ${NON_VALORIZZATO_RIGA}`);
    expect(righeN(g)[2]).toEqual(['2025', 'non disponibile', NON_VALORIZZATO_RIGA, '0,00 €', '40']);
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
    // N-08: la stessa frase della nota del KPI (lib/aggregati, testoSenzaAmmesso)
    expect(g.omessi).toEqual(['30 domande senza importo ammesso: non entrano nella somma']);
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
    expect(n(g.tabella.righe[3][1])).toBe('35.000.000,00 €');
    // senza il residuo del DTO non si ricalcola nel browser: il flusso non si disegna
    const senza = graficoSankey({ dotazioneSpesaPubblica: imp(100_000_000), importoImpegnato: imp(60_000_000) }, pagamenti);
    controllaNonDisegnabile(senza, 'il flusso richiede da impegnare: non disponibile');
    expect(senza.tabella.righe[3]).toEqual(['Da impegnare (dotazione residua sugli impegni)', 'non disponibile']);
  });

  it('tabella con le voci dei tre DTO, gli assenti resi come aggregati', () => {
    expect(righeN(graficoSankey(impegni, pagamenti, residuo))).toEqual([
      ['Dotazione', '100.000.000,00 €'],
      ['Impegnato', '60.000.000,00 €'],
      // R04: la parte stimata dell'impegnato, una riga in piu' della tabella del flusso
      ['di cui stimato (previsione sui bandi pluriennali SIGC)', 'non disponibile'],
      ['Da impegnare (dotazione residua sugli impegni)', '40.000.000,00 €'],
      ["Pagamenti totali sull'impegnato (lordi, elenchi di liquidazione)", '45.000.000,00 €'],
      ['Impegnato ancora da pagare', '15.000.000,00 €'],
      ['Pagamenti al netto delle rettifiche', '44.000.000,00 €'],
      ['Dotazione residua sui pagamenti', '56.000.000,00 €'],
    ]);
    const g = graficoSankey(impegni, pagamenti, { ...residuo, dotazioneResidua: assente('NON_VALORIZZATO') });
    expect(g.tabella.righe[7]).toEqual(['Dotazione residua sui pagamenti', NON_CALCOLABILE_AGGREGATO]);
  });

  it('impegnato da fonte non attiva e nessun residuo sui pagamenti: non disegnabile, tabella con le voci disponibili e le assenti col motivo', () => {
    const g = graficoSankey({ ...impegni, importoImpegnato: assente('FONTE_NON_ATTIVA', 'IMPEGNI'), dotazioneResidua: assente('FONTE_NON_ATTIVA', 'IMPEGNI') }, pagamenti);
    controllaNonDisegnabile(g, 'il flusso richiede pagamenti netti: non disponibile; dotazione residua: non disponibile');
    expect(righeN(g)).toEqual([
      ['Dotazione', '100.000.000,00 €'],
      ['Impegnato', 'non disponibile (fonte impegni non attiva)'],
      ['di cui stimato (previsione sui bandi pluriennali SIGC)', 'non disponibile'],
      ['Da impegnare (dotazione residua sugli impegni)', 'non disponibile (fonte impegni non attiva)'],
      ["Pagamenti totali sull'impegnato (lordi, elenchi di liquidazione)", '45.000.000,00 €'],
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
    expect(n(g.tabella.righe[3][1])).toBe('-20.000.000,00 €');
  });

  it('perimetro ADA: non disegnabile anche con tutti i valori, la tabella resta', () => {
    const g = graficoSankey(impegni, pagamenti, residuo, 'ADA');
    controllaNonDisegnabile(g, "perimetro ADA: la dotazione è regionale, impegni e pagamenti sono dell'area: il flusso non è confrontabile");
    expect(g.omessi).toEqual([]);
    expect(g.tabella.righe).toHaveLength(8);
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

describe('graficoPagatoNetto', () => {
  const TITOLO = 'della dotazione pagato (netto)';

  // la serie del gauge con l'etichetta della fine dell'arco (title) e il centro (detail) delle note di Leonardo del 10/11/2026
  type SerieGauge = { data: Array<{ name: string }>; title: { offsetCenter: [string, string] }; detail: { formatter: () => string } };
  const gauge = (g: DatiGrafico) => opzioniDi(g).series[0] as unknown as SerieGauge;

  it('pagamenti al netto delle rettifiche sulla dotazione: indicatore 0-100, la dotazione al centro e il netto alla fine dell arco', () => {
    const g = graficoPagatoNetto(imp(200_000), imp(1_000_000));
    expect(valoriDi(opzioniDi(g).series[0])).toEqual([20]);
    // due righe: la percentuale e, sotto, l'importo netto; al centro l'importo della dotazione e, sotto, cosa e'
    expect(gauge(g).data[0].name.split('\n').map(n)).toEqual(['20 %', '(200.000,00 €)']);
    expect(gauge(g).detail.formatter().split('\n').map(n)).toEqual(['{v|1,0 M€}', '{n|dotazione spesa pubblica}']);
    expect(n(opzioniDi(g).aria.label.description)).toBe('Indicatore da 0 a 100 %: della dotazione pagato (netto) 20 %, pagamenti netti 200.000,00 € su una dotazione di 1,0 M€.');
    expect(g.tabella.caption).toBe(TITOLO);
    expect(righeN(g)).toEqual([['Dotazione spesa pubblica', '1.000.000,00 €'], ['Pagamenti al netto delle rettifiche', '200.000,00 €'], [TITOLO, '20 %']]);
  });

  it("l'etichetta segue la fine dell'arco, fuori dall'arco: a sinistra in basso a 0 %, in alto a 50 %, a destra in basso a 100 %", () => {
    const punto = (pagato: number) => gauge(graficoPagatoNetto(imp(pagato), imp(100))).title.offsetCenter;
    expect(punto(0)).toEqual(['-136%', '49%']);
    expect(punto(50)).toEqual(['0%', '-124%']);
    expect(punto(100)).toEqual(['136%', '49%']);
    // oltre il 100 % l'etichetta resta alla fine dell'arco
    expect(punto(150)).toEqual(punto(100));
  });

  it('netto o dotazione assenti: "non calcolabile" con il motivo dell importo (totale o riga di un intervento)', () => {
    const totale = graficoPagatoNetto(assente('NON_VALORIZZATO'), imp(1_000_000));
    controllaNonDisegnabile(totale, `la percentuale richiede pagamenti netti e dotazione; pagamenti netti: ${NON_CALCOLABILE_AGGREGATO}`);
    expect(totale.tabella.righe.slice(1)).toEqual([['Pagamenti al netto delle rettifiche', NON_CALCOLABILE_AGGREGATO], [TITOLO, 'non calcolabile']]);
    controllaNonDisegnabile(
      graficoPagatoNetto(assente('NON_VALORIZZATO'), null, null, false),
      `la percentuale richiede pagamenti netti e dotazione; pagamenti netti: ${NON_VALORIZZATO_RIGA}; dotazione: non disponibile`,
    );
  });

  it('perimetro ADA: non confrontabile, anche senza valori', () => {
    controllaNonDisegnabile(graficoPagatoNetto(null, null, 'ADA'), /^perimetro ADA: .*il rapporto non è confrontabile$/);
    controllaNonDisegnabile(graficoPagatoNetto(imp(200_000), imp(1_000_000), 'ADA'), /^perimetro ADA: /);
  });

  it('pagamento piccolo ma non nullo: mai "0 %"', () => {
    const g = graficoPagatoNetto(imp(300), imp(1_000_000));
    expect(g.tabella.righe.at(-1)).toEqual([TITOLO, '0,03 %']);
    expect(valoriDi(opzioniDi(g).series[0])).toEqual([0.03]);
    expect(n(opzioniDi(g).aria.label.description)).toContain('0,03 %');
  });
});

// ---------------------------------------------------------------- 9. barre dell'intervento (al posto della cascata dall'11/11/2026)

describe('graficoBarreIntervento e vociIntervento (R08: lordi e rettifiche)', () => {
  const segmentiBarre = (o: ReturnType<typeof opzioniDi>) => o.series.map((s) => [s.name, valoriDi(s)]);

  it('Dotazione = pagamenti netti + residuo, Pagamenti lordi = pagamenti netti + rettifiche; impegnato assente dichiarato', () => {
    const g = graficoBarreIntervento(rigaIntervento);
    const o = opzioniDi(g);
    controllaAria(o);
    expect(o.yAxis?.data).toEqual(['Dotazione', 'Pagamenti lordi']);
    // i pagamenti netti sono il primo segmento di tutte e due le barre (allineati a sinistra)
    expect(segmentiBarre(o)).toEqual([
      ['Pagamenti netti', [4_000_000, null]],
      ['Residuo sui pagamenti', [6_000_000, null]],
      ['Pagamenti netti', [null, 4_000_000]],
      ['Rettifiche', [null, 500_000]],
    ]);
    expect(o.series.every((s) => s.type === 'bar' && s.stack === 'importi')).toBe(true);
    expect(n(item(o.series[0].data?.[0]).etichetta ?? '')).toBe('4,0 M€ (40 %)');
    expect(n(item(o.series[3].data?.[1]).etichetta ?? '')).toBe('500.000,00 € (11,1 %)');
    expect(n(o.aria.label.description)).toBe(
      "Due barre impilate dell'intervento SRA01: dotazione 10,0 M€ = pagamenti netti 4,0 M€ + residuo sui pagamenti 6,0 M€; pagamenti lordi 4,5 M€ = pagamenti netti 4,0 M€ + rettifiche 500.000,00 €. 1 voce omessa per dati mancanti o non utilizzabili.",
    );
    expect(g.omessi).toEqual(['Impegnato FEASR e non FEASR non disponibile (fonte impegni non attiva)']);
  });

  it('senza rettifiche caricate: le due barre restano intere e lo dichiarano (mai il lordo al posto del netto)', () => {
    const senza = { ...rigaIntervento, importoRettifiche: assente('FONTE_NON_ATTIVA', 'RETTIFICHE'), pagamentiNettoRettifiche: assente('FONTE_NON_ATTIVA', 'RETTIFICHE'), dotazioneResiduaSuPagamenti: assente('FONTE_NON_ATTIVA', 'RETTIFICHE') };
    const g = graficoBarreIntervento(senza);
    expect(segmentiBarre(opzioniDi(g))).toEqual([
      ['Dotazione', [10_000_000, null]],
      ['Pagamenti lordi', [null, 4_500_000]],
    ]);
    expect(g.omessi).toContain('Rettifiche non disponibile (fonte rettifiche non attiva): pagamenti netti e residuo non si disegnano');
  });

  it('tabella con tutte le voci della riga e il motivo degli assenti: e vociIntervento', () => {
    const g = graficoBarreIntervento(rigaIntervento);
    expect(g.tabella.caption).toMatch(/SRA01/);
    expect(righeN(g)).toEqual([
      ['Dotazione di spesa pubblica', '10.000.000,00 €'],
      ['Quota FEASR', '4.000.000,00 €'],
      ['Stanziato (dai bandi)', '8.000.000,00 €'],
      ['Impegnato FEASR', '2.000.000,00 €'],
      ['Impegnato FEASR e non FEASR', 'non disponibile (fonte impegni non attiva)'],
      ['di cui stimato (previsione sui bandi pluriennali SIGC)', 'non disponibile'],
      ['Pagamenti lordi', '4.500.000,00 €'],
      ['Rettifiche', '500.000,00 €'],
      ['Con rettifiche', 'fonte non attiva: rettifiche'],
      ['Pagamenti al netto delle rettifiche', '4.000.000,00 €'],
      ['Residuo sugli impegni', 'non disponibile (fonte impegni non attiva)'],
      ['Residuo sui pagamenti', '6.000.000,00 €'],
    ]);
    expect(g.tabella).toEqual(vociIntervento(rigaIntervento));
  });

  it('"Con rettifiche" dopo le rettifiche, come nel riepilogo (V1-07): Sì con le righe, No, fonte non attiva', () => {
    const voce = (r: RigaRiepilogo) => vociIntervento(r).righe[8];
    expect(voce({ ...rigaIntervento, conRettifiche: true, rettifiche: [{}, {}] })).toEqual(['Con rettifiche', 'Sì: 2 rettifiche']);
    expect(voce({ ...rigaIntervento, conRettifiche: true, rettifiche: [{}] })).toEqual(['Con rettifiche', 'Sì: 1 rettifica']);
    expect(voce({ ...rigaIntervento, conRettifiche: false, rettifiche: [] })).toEqual(['Con rettifiche', 'No']);
    expect(voce({ ...rigaIntervento, conRettifiche: null })).toEqual(['Con rettifiche', 'fonte non attiva: rettifiche']);
  });

  it('residuo assente: la dotazione resta intera, il residuo e dichiarato come dato della riga', () => {
    const g = graficoBarreIntervento({ ...rigaIntervento, dotazioneResiduaSuPagamenti: assente('NON_VALORIZZATO') });
    expect(segmentiBarre(opzioniDi(g))).toEqual([
      ['Dotazione', [10_000_000, null]],
      ['Pagamenti netti', [null, 4_000_000]],
      ['Rettifiche', [null, 500_000]],
    ]);
    expect(g.omessi).toContain(`Residuo sui pagamenti ${NON_VALORIZZATO_RIGA}`);
  });

  it('lordi oltre la dotazione con i netti entro la dotazione: si disegna, la barra dei lordi e piu lunga', () => {
    const g = graficoBarreIntervento({ ...rigaIntervento, pagamentiLordi: imp(11_000_000), importoRettifiche: imp(7_000_000) });
    expect(segmentiBarre(opzioniDi(g)).at(-1)).toEqual(['Rettifiche', [null, 7_000_000]]);
  });

  it('dotazione o lordi assenti, importi negativi: non disegnabile', () => {
    const senza = graficoBarreIntervento({ ...rigaIntervento, pagamentiLordi: assente('FUORI_PERIMETRO') });
    controllaNonDisegnabile(senza, `il grafico di SRA01 richiede dotazione e pagamenti lordi; pagamenti lordi: ${FUORI_PERIMETRO}`);
    expect(senza.tabella.righe).toHaveLength(12);
    controllaNonDisegnabile(graficoBarreIntervento({ ...rigaIntervento, dotazioneResiduaSuPagamenti: imp(-1) }), 'importi negativi per SRA01: il grafico non si può disegnare');
    // SRD11 nei dati dell'11/11/2026: lordi zero e rettifiche positive, netti negativi
    controllaNonDisegnabile(graficoBarreIntervento({ ...rigaIntervento, pagamentiLordi: imp(0), importoRettifiche: imp(79_432.83), pagamentiNettoRettifiche: imp(-79_432.83) }), 'importi negativi per SRA01: il grafico non si può disegnare');
  });

  it('perimetro ADA (V-03): non si disegna, la tabella resta con i dati di programma regionali', () => {
    const g = graficoBarreIntervento(rigaIntervento, 'ADA');
    controllaNonDisegnabile(g, "perimetro ADA: la dotazione è regionale, i pagamenti sono dell'area e il residuo è fuori perimetro");
    expect(g.omessi).toEqual([]);
    expect(g.tabella).toEqual(vociIntervento(rigaIntervento, 'ADA'));
    expect(graficoBarreIntervento(rigaIntervento, 'REGIONALE').opzioni).not.toBeNull();
  });

  it('vociIntervento: "(regionale)" sui dati di programma solo per ADA, le assenze con il motivo della riga', () => {
    const ada = vociIntervento({ ...rigaIntervento, dotazioneResiduaSuPagamenti: assente('FUORI_PERIMETRO') }, 'ADA');
    expect(ada.colonne).toEqual(['Voce', 'Importo']);
    expect(ada.caption).toBe('Intervento SRA01: dalla dotazione al residuo sui pagamenti');
    expect(ada.righe.map((r) => r[0])).toEqual([
      'Dotazione di spesa pubblica (regionale)',
      'Quota FEASR (regionale)',
      'Stanziato (dai bandi) (regionale)',
      'Impegnato FEASR',
      'Impegnato FEASR e non FEASR',
      'di cui stimato (previsione sui bandi pluriennali SIGC)',
      'Pagamenti lordi',
      'Rettifiche',
      'Con rettifiche',
      'Pagamenti al netto delle rettifiche',
      'Residuo sugli impegni',
      'Residuo sui pagamenti',
    ]);
    expect(ada.righe[11]).toEqual(['Residuo sui pagamenti', FUORI_PERIMETRO]);
    expect(vociIntervento(rigaIntervento, 'REGIONALE').righe[0][0]).toBe('Dotazione di spesa pubblica');
    const vuota = vociIntervento({});
    expect(vuota.caption).toBe('Intervento Senza codice: dalla dotazione al residuo sui pagamenti');
    expect(vuota.righe.filter((r) => r[0] !== 'Con rettifiche').every((r) => r[1] === 'non disponibile')).toBe(true);
    expect(vuota.righe).toHaveLength(12);
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
    // R05: importi e percentuali, il totale
    expect(n(o.aria.label.description)).toBe('Dotazione tra quota FEASR e quota non FEASR: totale 100,0 M€; Quota FEASR 40,0 M€ (40 %), Quota non FEASR 60,0 M€ (60 %).');
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
    // R06: importi e percentuali, il totale
    expect(n(o.aria.label.description)).toBe('Stanziato e da stanziare: totale 100,0 M€; Importo stanziato 30,0 M€ (30 %), Importo da stanziare 70,0 M€ (70 %).');
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

// ---------------------------------------------------------------- 12. dotazione e pagamenti per intervento

describe('graficoDotazionePagamenti', () => {
  const righe = [
    { codiceIntervento: 'SRA01', dotazione: imp(10_000_000), impegnato: imp(8_000_000), pagato: imp(6_000_000) },
    { codiceIntervento: 'SRA02', dotazione: imp(20_000_000), impegnato: imp(15_000_000), pagato: assente('NON_VALORIZZATO') },
    { codiceIntervento: 'SRA03', dotazione: assente('FONTE_NON_ATTIVA'), impegnato: assente('FONTE_NON_ATTIVA'), pagato: assente('FONTE_NON_ATTIVA') },
  ];
  const quarantuno = Array.from({ length: 41 }, (_, k) => ({
    codiceIntervento: `SRB${String(k + 1).padStart(2, '0')}`,
    dotazione: imp(1_000_000),
    impegnato: imp(800_000),
    pagato: imp(500_000),
  }));

  it('barre raggruppate Dotazione, Impegnato spesa pubblica (04/11/2026) e Pagamenti totali lordi, codice nel dato, assenti vuoti (mai zero) e dichiarati', () => {
    const g = graficoDotazionePagamenti(righe, 'REGIONALE');
    const o = opzioniDi(g);
    controllaAria(o);
    expect(o.series.map((s) => [s.type, s.name, s.stack])).toEqual([
      ['bar', 'Dotazione', undefined],
      ['bar', 'Impegnato spesa pubblica', undefined],
      ['bar', 'Pagamenti totali (lordi, elenchi di liquidazione)', undefined],
    ]);
    expect(o.yAxis?.data).toEqual(['SRA01', 'SRA02']);
    expect(item(o.series[0].data?.[0]).codice).toBe('SRA01');
    expect(item(o.series[1].data?.[1]).value).toBe(15_000_000);
    expect(o.series[2].data?.[1]).toBeNull();
    expect(g.omessi).toEqual([
      `SRA02, pagamenti totali (lordi, elenchi di liquidazione): ${NON_VALORIZZATO_RIGA}`,
      'SRA03, dotazione: non disponibile (fonte non attiva)',
      'SRA03, impegnato di spesa pubblica: non disponibile (fonte non attiva)',
      'SRA03, pagamenti totali (lordi, elenchi di liquidazione): non disponibile (fonte non attiva)',
    ]);
    expect(o.dataZoom).toBeUndefined();
    // l'asse parte da zero senza valori negativi
    expect((o.xAxis as { min?: number }).min).toBeUndefined();
    expect(g.tabella.colonne).toEqual(['Intervento', 'Dotazione', 'Impegnato spesa pubblica', 'Pagamenti totali (lordi, elenchi di liquidazione)']);
    expect(righeN(g)).toEqual([
      ['SRA01', '10.000.000,00 €', '8.000.000,00 €', '6.000.000,00 €'],
      ['SRA02', '20.000.000,00 €', '15.000.000,00 €', NON_VALORIZZATO_RIGA],
      ['SRA03', 'non disponibile (fonte non attiva)', 'non disponibile (fonte non attiva)', 'non disponibile (fonte non attiva)'],
    ]);
  });

  it("un netto negativo: l'asse parte dal valore piu' basso vero, senza l'etichetta del minimo (04/11/2026: prima -20 M per -79 mila)", () => {
    const negativo = [...righe.slice(0, 2), { codiceIntervento: 'SRD11', dotazione: imp(3_689_186.11), impegnato: imp(0), pagato: imp(-79_432.83) }];
    const asse = opzioniDi(graficoDotazionePagamenti(negativo, 'REGIONALE', 'Pagamenti al netto delle rettifiche')).xAxis as { min?: number; axisLabel?: { showMinLabel?: boolean } };
    expect(asse.min).toBe(-79_432.83);
    expect(asse.axisLabel?.showMinLabel).toBe(false);
  });

  it('barre orizzontali: fino a 40 interventi tutti con la loro etichetta, oltre lo scorrimento verticale (R02; review K-01)', () => {
    const o = opzioniDi(graficoDotazionePagamenti(quarantuno));
    expect((o.dataZoom as Array<{ type: string; yAxisIndex?: number }> | undefined)?.map((z) => [z.type, z.yAxisIndex])).toEqual([['inside', 0], ['slider', 0]]);
    const tutti = opzioniDi(graficoDotazionePagamenti(quarantuno.slice(0, 36)));
    expect(tutti.dataZoom).toBeUndefined();
    expect(tutti.yAxis?.type).toBe('category');
    expect(tutti.yAxis?.data).toHaveLength(36);
    expect((tutti.yAxis as { axisLabel?: { interval?: number } } | undefined)?.axisLabel?.interval).toBe(0);
  });

  it("perimetro ADA: impegnato e pagato dell'area, la dotazione dichiarata come non affiancabile (J-06)", () => {
    const g = graficoDotazionePagamenti(righe, 'ADA');
    const o = opzioniDi(g);
    expect(o.series.map((s) => s.name)).toEqual(['Impegnato spesa pubblica', 'Pagamenti totali (lordi, elenchi di liquidazione)']);
    expect(o.yAxis?.data).toEqual(['SRA01', 'SRA02']);
    expect(g.omessi[0]).toBe("perimetro ADA: la dotazione regionale non si affianca ai pagamenti dell'area");
    expect(g.tabella.colonne).toEqual(['Intervento', 'Impegnato spesa pubblica', 'Pagamenti totali (lordi, elenchi di liquidazione)']);
    expect(g.tabella.caption).toBe('Impegnato e pagamenti totali (lordi, elenchi di liquidazione) per intervento');
  });

  it('il nome del pagato dice quale pagato e (V-19): serie, colonne, didascalia e omessi', () => {
    const g = graficoDotazionePagamenti(righe, 'REGIONALE', 'Pagamenti netti');
    const o = opzioniDi(g);
    expect(o.series.map((s) => s.name)).toEqual(['Dotazione', 'Impegnato spesa pubblica', 'Pagamenti netti']);
    expect(g.tabella.colonne).toEqual(['Intervento', 'Dotazione', 'Impegnato spesa pubblica', 'Pagamenti netti']);
    expect(g.tabella.caption).toBe('Dotazione, impegnato e pagamenti netti per intervento');
    expect(g.omessi[0]).toBe(`SRA02, pagamenti netti: ${NON_VALORIZZATO_RIGA}`);
    expect(o.aria.label.description).toMatch(/^Barre raggruppate di dotazione, impegnato e pagamenti netti per 2 interventi, da SRA01 a SRA02/);
    const ada = graficoDotazionePagamenti(righe, 'ADA', 'Pagamenti netti');
    expect(opzioniDi(ada).series.map((s) => s.name)).toEqual(['Impegnato spesa pubblica', 'Pagamenti netti']);
    expect(ada.tabella.caption).toBe('Impegnato e pagamenti netti per intervento');
  });

  it('nessun valore: non disegnabile', () => {
    controllaNonDisegnabile(graficoDotazionePagamenti([righe[2]]), 'nessun intervento con dotazione, impegnato o pagamenti totali (lordi, elenchi di liquidazione) valorizzati');
    controllaNonDisegnabile(graficoDotazionePagamenti([]), /^nessun intervento/);
    controllaNonDisegnabile(graficoDotazionePagamenti([righe[2]], 'ADA'), 'nessun intervento con impegnato o pagamenti totali (lordi, elenchi di liquidazione) valorizzati');
  });
});

// ---------------------------------------------------------------- 14. riserva

describe('graficoUtilizzoRiserva (R18, forma A: linea a gradini con le fasi)', () => {
  // J-07: senza il componente registrato ECharts ignora markArea e le fasce non si disegnano (review V1-04, X-08)
  it('il componente delle fasce (MarkAreaComponent) e registrato in ECharts', () => {
    const sorgente = readFileSync(resolve(__dirname, '../src/shared/ui/grafici/echarts.ts'), 'utf-8');
    expect(sorgente).toMatch(/echarts\.use\(\[[^\]]*\bMarkAreaComponent\b[^\]]*\]\)/);
  });

  const riserva = {
    importoAccumulato: 5_000_000,
    utilizzoProgressivo: [
      { data: '2025-03-01', importo: 1_000_000, cumulato: 3_000_000 },
      { data: '2025-01-15', importo: 2_000_000, cumulato: 2_000_000 },
    ],
  };
  const conMontante = { ...riserva, montantePagamenti: 80_000_000, quotaRiserva: 0.05 };

  it('linea a gradini sul tempo, fasi dell anno sullo sfondo, soglia della riserva del 5% e ultimo punto etichettato', () => {
    const g = graficoUtilizzoRiserva(conMontante, 2024);
    const o = opzioniDi(g);
    controllaAria(o);
    const s = o.series[0];
    expect([s.type, (s as { step?: unknown }).step]).toEqual(['line', 'end']);
    expect((o.xAxis as { type?: string }).type).toBe('time');
    // la riserva del 5% = montante x quota (4 milioni), non l'accumulato
    expect(s.markLine?.data[0].yAxis).toBe(4_000_000);
    expect((s as { markArea?: { data: unknown[] } }).markArea?.data).toHaveLength(3);
    // J-07 (review V1-04, X-08): l'asse contiene tutte le fasi dell'anno, dall'inizio dell'accumulo alla fine del residuo
    expect((o.xAxis as { min?: string; max?: string })).toMatchObject({ min: '2024-10-01', max: '2026-12-31' });
    const ultimo = (s.data as unknown[]).at(-1) as { value: unknown; label: { formatter: string } };
    expect(ultimo.value).toEqual(['2025-03-01', 3_000_000]);
    expect(n(ultimo.label.formatter)).toBe('3,0 M€ (75 % della riserva)');
    expect(n(o.aria.label.description)).toContain('3,0 M€ utilizzati (75 % della riserva); riserva del 5% 4,0 M€.');
  });

  it('senza quota: la soglia e la riserva accumulata, chiamata per quello che e (review passata 2); tabella in ordine di data', () => {
    const g = graficoUtilizzoRiserva(riserva, 2024);
    const soglia = opzioniDi(g).series[0].markLine?.data[0];
    expect(soglia?.yAxis).toBe(5_000_000);
    expect((soglia as { name?: string } | undefined)?.name).toBe('Riserva accumulata (montante o quota non disponibili)');
    expect(n(g.tabella.caption)).toMatch(/riserva accumulata \(montante o quota non disponibili\): 5\.000\.000,00 €/);
    expect(g.tabella.caption).not.toMatch(/5%/);
    expect(letturaUtilizzoRiserva(riserva)).toMatch(/La linea tratteggiata è la riserva accumulata \(montante o quota non disponibili\)/);
    // con montante e quota la soglia e' la riserva del 5%
    const conMontante = graficoUtilizzoRiserva({ ...riserva, montantePagamenti: 200_000_000, quotaRiserva: 0.05 }, 2024);
    expect(opzioniDi(conMontante).series[0].markLine?.data[0].yAxis).toBe(10_000_000);
    expect(n(conMontante.tabella.caption)).toMatch(/riserva del 5%: 10\.000\.000,00 €/);
    expect(righeN(g)).toEqual([
      ['15/01/2025', '2.000.000,00 €', '2.000.000,00 €'],
      ['01/03/2025', '1.000.000,00 €', '3.000.000,00 €'],
    ]);
  });

  it('cumulato o riserva assenti: punto vuoto (mai zero) e soglia omessa, dichiarati', () => {
    const g = graficoUtilizzoRiserva({ importoAccumulato: null, utilizzoProgressivo: [...riserva.utilizzoProgressivo, { data: '2025-04-01', importo: 500_000, cumulato: null }] }, 2024);
    const s = opzioniDi(g).series[0];
    expect(s.markLine).toBeUndefined();
    expect(g.omessi).toEqual(['01/04/2025: utilizzo cumulato non disponibile', 'Riserva del 5% non disponibile: soglia omessa']);
    // senza soglia la lettura non promette la linea tratteggiata (review M-06)
    expect(letturaUtilizzoRiserva({ importoAccumulato: null })).not.toMatch(/tratteggiata/);
  });

  it('nel grafico il nome corto della soglia di ripiego (a 390 px non si taglia); la parentesi in didascalia e lettura (review M-06)', () => {
    const s = opzioniDi(graficoUtilizzoRiserva(riserva, 2024)).series[0];
    expect((s.markLine as unknown as { label: { formatter: string } }).label.formatter).toMatch(/^Riserva accumulata 5,0.M€$/);
  });

  it('movimento senza data: in coda alla tabella ("senza data") e dichiarato', () => {
    const g = graficoUtilizzoRiserva({ ...riserva, utilizzoProgressivo: [...riserva.utilizzoProgressivo, { data: null, importo: 100_000, cumulato: null }] }, 2024);
    expect(righeN(g)[2]).toEqual(['senza data', '100.000,00 €', 'non disponibile']);
    expect(g.omessi).toEqual(['1 movimento senza data']);
  });

  it('nessun punto: non disegnabile', () => {
    controllaNonDisegnabile(graficoUtilizzoRiserva({ importoAccumulato: 5_000_000, utilizzoProgressivo: [] }, 2024), 'nessun utilizzo della riserva registrato');
    controllaNonDisegnabile(graficoUtilizzoRiserva({}, 2024), 'nessun utilizzo della riserva registrato');
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
    ['dotazione e pagato, nessun valore', graficoDotazionePagamenti([])],
    ['dotazione e pagato ADA, nessun valore', graficoDotazionePagamenti([], 'ADA')],
    ['domande SIGC, presentate assenti', graficoDomandeSigc({ pagate: 10 })],
    ['domande SIGC, nessuna presentata', graficoDomandeSigc({ presentate: 0 })],
    ['importi SIGC, importo assente', graficoImportiSigc({ ...sigcBase, pagato: assente('NON_VALORIZZATO') })],
    ['importi SIGC, importi negativi', graficoImportiSigc({ ...sigcBase, pagato: imp(-1) })],
    ['importi SIGC, valori che non tornano', graficoImportiSigc({ ...sigcBase, pagato: imp(9_000_000) })],
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
    ['pagato netto, netto assente', graficoPagatoNetto(assente('NON_VALORIZZATO'), imp(100))],
    ['pagato netto, perimetro ADA', graficoPagatoNetto(imp(10), imp(100), 'ADA')],
    ['quota FEASR, quota assente', graficoQuotaFeasr({ quotaFeasr: assente('NON_VALORIZZATO'), quotaNonFeasr: imp(10) })],
    ['quota FEASR, quota negativa', graficoQuotaFeasr({ quotaFeasr: imp(-1), quotaNonFeasr: imp(10) })],
    ['quota FEASR, totale zero', graficoQuotaFeasr({ quotaFeasr: imp(0), quotaNonFeasr: imp(0) })],
    ['parti di un importo, parte assente', graficoPartiImporto('Prova', [['Importo A', undefined], ['Importo B', imp(10)]], [])],
    ['barre intervento, perimetro ADA', graficoBarreIntervento(rigaIntervento, 'ADA')],
    ['barre intervento, pagamenti assenti', graficoBarreIntervento({ ...rigaIntervento, pagamentiLordi: assente('FUORI_PERIMETRO') })],
    ['barre intervento, senza codice e senza dotazione', graficoBarreIntervento({})],
    ['barre intervento, importi negativi', graficoBarreIntervento({ ...rigaIntervento, pagamentiNettoRettifiche: imp(-1) })],
    ['riserva, nessun utilizzo', graficoUtilizzoRiserva({}, 2024)],
  ];

  it.each(casi)('%s', (_caso, g) => {
    expect(g.opzioni).toBeNull();
    expect(g.motivoAssenza).toMatch(REGOLA);
    expect(g.tabella.colonne.length).toBeGreaterThan(0);
  });
});

describe('sottotitoloFlusso (N-18)', () => {
  it("dice il ramo disegnato: con l'impegnato fino al pagato, senza dalla dotazione ai pagamenti netti col motivo", () => {
    expect(sottotitoloFlusso({ importoImpegnato: { valore: 10, motivo: null, fonte: null } })).toBe('Ripartizione fra importo impegnato pagato e da pagare e importo da impegnare');
    expect(sottotitoloFlusso({ importoImpegnato: { valore: null, motivo: 'FONTE_NON_ATTIVA', fonte: 'IMPEGNI' } })).toBe(
      'Dalla dotazione ai pagamenti netti e al residuo; impegnato: non disponibile (fonte impegni non attiva)',
    );
  });
});

// ---------------------------------------------------------------- revisioni del 04/11/2026 (secondo feedback di Leonardo/Deloitte)

describe('revisioni del 04/11/2026', () => {
  it('Sankey: un solo nodo Impegnato anche con la parte stimata, che sta nel tooltip del nodo', () => {
    const o = opzioniDi(graficoSankey({ ...impegni, impegnatoStimato: imp(10_000_000) }, pagamenti));
    const s = o.series[0];
    expect(nomiDi(s)).toEqual(['Dotazione', 'Impegnato', 'Da impegnare', 'Pagato', 'Da pagare']);
    const nodo = (s.data ?? []).map(item).find((d) => d.name === 'Impegnato');
    expect(n(nodo?.dettaglio ?? '')).toBe('Impegnato: 60,0 M€, di cui stimato 10,0 M€');
    // senza parte stimata il tooltip dice il solo impegnato
    const senza = (opzioniDi(graficoSankey(impegni, pagamenti)).series[0].data ?? []).map(item).find((d) => d.name === 'Impegnato');
    expect(n(senza?.dettaglio ?? '')).toBe('Impegnato: 60,0 M€');
  });

  it("Importi SIGC: l'etichetta ha lo sfondo del suo segmento; dentro se ci sta, altrimenti a destra della barra (ultimo segmento) o sopra", () => {
    const o = opzioniDi(graficoImportiSigc(sigcBase)) as unknown as { series: Array<{ name: string; itemStyle: { color: string }; label: { backgroundColor?: string }; labelLayout: (p: unknown) => unknown }>; xAxis: { max?: unknown } };
    for (const serie of o.series) expect(serie.label.backgroundColor).toBe(serie.itemStyle.color);
    // nessun massimo forzato: lo spazio per l'etichetta messa a destra e' in pixel nella griglia (J-04); nell'area piu'
    // stretta al piu' tre intervalli e le etichette dell'asse non si sovrappongono (verifica a vista del 05/11/2026)
    expect(o.xAxis.max).toBeUndefined();
    expect(o.xAxis).toMatchObject({ splitNumber: 3, axisLabel: { hideOverlap: true } });
    const ultimo = o.series.find((x) => x.name === 'Ancora da pagare');
    const primo = o.series.find((x) => x.name.startsWith('Pagato'));
    const rect = { x: 100, y: 50, width: 40, height: 30 };
    expect(ultimo?.labelLayout({ rect, labelRect: { x: 0, y: 0, width: 30, height: 14 } })).toEqual({});
    expect(ultimo?.labelLayout({ rect, labelRect: { x: 0, y: 0, width: 110, height: 14 } })).toEqual({ x: 144, y: 65, align: 'left', verticalAlign: 'middle' });
    expect(primo?.labelLayout({ rect, labelRect: { x: 0, y: 0, width: 110, height: 14 } })).toEqual({ x: 100, y: 46, align: 'left', verticalAlign: 'bottom' });
    // il caso visto nell'app: "41,9 M€ (24,3 %)" sforava di qualche pixel il segmento
    expect(posizioneEtichettaSegmento(true)({ rect: { x: 0, y: 0, width: 96, height: 30 }, labelRect: { x: 0, y: 0, width: 98, height: 14 } } as never)).toMatchObject({ align: 'left' });
  });

  it("Importi SIGC: ogni etichetta regge il suo fondo (AA, 4,5:1 per il testo di 12 px) anche nel segmento del pagato (J-02)", () => {
    const luminanza = (hex: string) => {
      const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };
    const contrasto = (a: string, b: string) => (Math.max(luminanza(a), luminanza(b)) + 0.05) / (Math.min(luminanza(a), luminanza(b)) + 0.05);
    const o = opzioniDi(graficoImportiSigc(sigcBase)) as unknown as { series: Array<{ name: string; label: { color: string; backgroundColor: string } }> };
    expect(o.series).toHaveLength(4);
    for (const s of o.series) expect(contrasto(s.label.color, s.label.backgroundColor), s.name).toBeGreaterThanOrEqual(4.5);
    expect(o.series.find((s) => s.name.startsWith('Pagato'))?.label.backgroundColor).toBe(VERDE_PAGATO);
  });

  it("Importi SIGC: a destra della griglia lo spazio in pixel per l'etichetta piu' lunga degli ultimi segmenti (J-04)", () => {
    const o = opzioniDi(graficoImportiSigc(sigcBase)) as unknown as { grid: { right: number }; series: Array<{ name: string; data: Array<{ etichetta?: string } | null> }> };
    const etichette = o.series.filter((s) => s.name === 'Non ammesso' || s.name === 'Ancora da pagare').flatMap((s) => s.data.flatMap((d) => (d?.etichetta ? [d.etichetta] : [])));
    expect(etichette).toHaveLength(2);
    for (const e of etichette) expect(o.grid.right).toBeGreaterThanOrEqual(larghezzaEtichetta(e));
    // "41,9 M€ (24,3 %)": 16 caratteri, circa 124 px col riquadro e il margine
    expect(larghezzaEtichetta('41,9 M€ (24,3 %)')).toBe(124);
  });

  it('impegnatiDiversi: gli interventi coi due impegnati valorizzati e diversi al centesimo, in ordine di codice', () => {
    expect(
      impegnatiDiversi([
        { codiceIntervento: 'SRB01', impegnatoCofinanziatoFeasr: imp(52_622_658.68), impegnatoCofinanziatoFeasrENon: imp(54_967_054.76) },
        { codiceIntervento: 'SRA03', impegnatoCofinanziatoFeasr: imp(24_323_222.99), impegnatoCofinanziatoFeasrENon: imp(45_273_920.69) },
        { codiceIntervento: 'SRG06', impegnatoCofinanziatoFeasr: imp(13_879_326.08), impegnatoCofinanziatoFeasrENon: imp(13_879_326.08) },
        { codiceIntervento: 'SRA14', impegnatoCofinanziatoFeasr: imp(0.1 + 0.2), impegnatoCofinanziatoFeasrENon: imp(0.3) },
        { codiceIntervento: 'SRA15', impegnatoCofinanziatoFeasr: assente('FONTE_NON_ATTIVA', 'IMPEGNI'), impegnatoCofinanziatoFeasrENon: imp(1) },
        { impegnatoCofinanziatoFeasr: imp(1), impegnatoCofinanziatoFeasrENon: imp(2) },
      ]),
    ).toEqual([
      { codice: 'SRA03', feasr: 24_323_222.99, feasrENon: 45_273_920.69 },
      { codice: 'SRB01', feasr: 52_622_658.68, feasrENon: 54_967_054.76 },
    ]);
  });
});
