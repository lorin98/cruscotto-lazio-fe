// Test L1 degli aggregati calcolati dal frontend (lib/aggregati.ts, H-01): chiamate dirette, niente render. Regola
// unica, come il backend: niente somme parziali (se manca un valore il totale non e' calcolabile e si dice per quanti
// interventi); la quota pagata e' la media ponderata del grafico dell'avanzamento, non confrontabile col perimetro ADA.
// Dati di prova inventati, numeri tondi.
import { describe, expect, it } from 'vitest';
import type { ImportoLike } from '../src/entities/importo';
import { cellaTotale, kpiImportiPerAnno, kpiSpesa, notaSenzaAmmesso, quotaPagata, sommaSeCompleta, totaleImporti } from '../src/features/finanziario/lib/aggregati';
import { avanzamentoPonderato } from '../src/features/finanziario/lib/avanzamento';
import { graficoAvanzamento } from '../src/features/finanziario/lib/grafici';
import type { RigaSpesa } from '../src/features/finanziario/lib/grafici';

const imp = (valore: number): ImportoLike => ({ valore, motivo: null, fonte: null });
const assente = (motivo: string, fonte: string | null = null): ImportoLike => ({ valore: null, motivo, fonte });

const MOTIVO_ADA = "Non confrontabile: dotazione regionale e pagamenti dell'area (perimetro ADA)";
const NESSUNO_UTILIZZABILE = 'Non calcolabile: nessun intervento con dotazione positiva e pagato valorizzato';

// avanzamento: 6/10 = 60%, 2/20 = 10%, 4/10 = 40%; media ponderata (6 + 2 + 4) / (10 + 20 + 10) = 30%
const righe: RigaSpesa[] = [
  { codiceIntervento: 'SRA01', dotazioneSpesaPubblica: imp(10_000_000), pagamentiTotali: imp(6_000_000) },
  { codiceIntervento: 'SRA02', dotazioneSpesaPubblica: imp(20_000_000), pagamentiTotali: imp(2_000_000) },
  { codiceIntervento: 'SRD13', dotazioneSpesaPubblica: imp(10_000_000), pagamentiTotali: imp(4_000_000) },
];
const dotazioneZero: RigaSpesa = { codiceIntervento: 'SRB01', dotazioneSpesaPubblica: imp(0), pagamentiTotali: imp(1_000_000) };
const senzaDotazione: RigaSpesa = { codiceIntervento: 'SRA03', dotazioneSpesaPubblica: assente('FONTE_NON_ATTIVA', 'QUADRO_SINOTTICO'), pagamentiTotali: imp(1_000_000) };

// ---------------------------------------------------------------- somme

describe('sommaSeCompleta', () => {
  it('somma al centesimo se ogni valore e un numero finito', () => {
    expect(sommaSeCompleta([1_000_000, 2_000_000])).toBe(3_000_000);
    expect(sommaSeCompleta([0.1, 0.2])).toBe(0.3);
    expect(sommaSeCompleta([0, 0])).toBe(0);
  });
  it('anche un solo valore assente o non finito: null, mai una somma parziale', () => {
    expect(sommaSeCompleta([1_000_000, null])).toBeNull();
    expect(sommaSeCompleta([undefined, 1_000_000])).toBeNull();
    expect(sommaSeCompleta([1_000_000, Number.NaN])).toBeNull();
    expect(sommaSeCompleta([1_000_000, Number.POSITIVE_INFINITY])).toBeNull();
  });
});

describe('totaleImporti', () => {
  const dotazione = (r: RigaSpesa) => r.dotazioneSpesaPubblica;
  const daCodici = (codici: string[], importo: ImportoLike = assente('NON_VALORIZZATO')): RigaSpesa[] => codici.map((codiceIntervento) => ({ codiceIntervento, dotazioneSpesaPubblica: importo }));

  it('righe vuote: non calcolabile, nessun intervento nella selezione (non uno zero)', () => {
    expect(totaleImporti([], dotazione)).toEqual({ valore: null, motivo: 'Non calcolabile: nessun intervento nella selezione' });
  });

  it('tutti i valori presenti: il totale, senza motivo; lo zero e un valore', () => {
    expect(totaleImporti(righe, dotazione)).toEqual({ valore: 40_000_000 });
    expect(totaleImporti([...righe, dotazioneZero], dotazione)).toEqual({ valore: 40_000_000 });
    expect(totaleImporti(righe, (r) => r.pagamentiTotali)).toEqual({ valore: 12_000_000 });
  });

  it('una riga senza valore: non calcolabile, con il codice dell intervento che manca', () => {
    expect(totaleImporti([...righe, senzaDotazione], dotazione)).toEqual({ valore: null, motivo: 'Non calcolabile: manca per 1 intervento (SRA03)' });
  });

  it('ogni assenza conta: fonte non attiva, non valorizzato, fuori perimetro, null, campo mancante', () => {
    for (const importo of [assente('FONTE_NON_ATTIVA', 'IMPEGNI'), assente('NON_VALORIZZATO'), assente('FUORI_PERIMETRO'), null, undefined]) {
      const t = totaleImporti([righe[0], { codiceIntervento: 'SRA09', dotazioneSpesaPubblica: importo }], dotazione);
      expect(t).toEqual({ valore: null, motivo: 'Non calcolabile: manca per 1 intervento (SRA09)' });
    }
  });

  it('fino a 3 interventi mancanti l elenco dei codici, oltre solo il numero', () => {
    expect(totaleImporti(daCodici(['SRA01', 'SRA02', 'SRA03']), dotazione).motivo).toBe('Non calcolabile: manca per 3 interventi (SRA01, SRA02, SRA03)');
    expect(totaleImporti([...righe, ...daCodici(['SRA04', 'SRA05', 'SRA06', 'SRA07'])], dotazione)).toEqual({
      valore: null,
      motivo: 'Non calcolabile: manca per 4 interventi',
    });
  });

  it('una riga senza codice: "Senza codice" nell elenco', () => {
    expect(totaleImporti([{ dotazioneSpesaPubblica: assente('NON_VALORIZZATO') }], dotazione).motivo).toBe('Non calcolabile: manca per 1 intervento (Senza codice)');
  });

  it('somma al centesimo: niente errori della virgola mobile', () => {
    const centesimi = [imp(0.1), imp(0.2)].map((importo, k) => ({ codiceIntervento: `SRA0${k + 1}`, dotazioneSpesaPubblica: importo }));
    expect(totaleImporti(centesimi, dotazione)).toEqual({ valore: 0.3 });
    const euro = [imp(1_000_000.1), imp(2_000_000.2), imp(0.3)].map((importo, k) => ({ codiceIntervento: `SRA0${k + 1}`, dotazioneSpesaPubblica: importo }));
    expect(totaleImporti(euro, dotazione).valore).toBe(3_000_000.6);
  });
});

// ---------------------------------------------------------------- quota pagata e KPI

describe('quotaPagata e kpiSpesa', () => {
  it('tutti gli interventi utilizzabili: media ponderata degli interventi', () => {
    expect(quotaPagata(righe)).toEqual({ valore: 30, nota: 'media ponderata degli interventi' });
    expect(quotaPagata(righe, 'REGIONALE')).toEqual({ valore: 30, nota: 'media ponderata degli interventi' });
  });

  it('dotazione zero esclusa: niente percentuali assurde (infinite o oltre il pagato), nota su K di N interventi', () => {
    const q = quotaPagata([...righe, dotazioneZero]);
    expect(q).toEqual({ valore: 30, nota: 'media ponderata su 3 di 4 interventi' });
    expect(Number.isFinite(q.valore)).toBe(true);
    // la sola riga con dotazione zero: non calcolabile, non Infinity
    expect(quotaPagata([dotazioneZero])).toEqual({ valore: null, motivo: NESSUNO_UTILIZZABILE });
    // una dotazione negativa e esclusa allo stesso modo
    expect(quotaPagata([{ codiceIntervento: 'SRE01', dotazioneSpesaPubblica: imp(-5), pagamentiTotali: imp(1) }])).toEqual({ valore: null, motivo: NESSUNO_UTILIZZABILE });
  });

  it('media coerente con avanzamentoPonderato e con la linea del grafico dell avanzamento', () => {
    const misti = [
      ...righe,
      dotazioneZero,
      senzaDotazione,
      { codiceIntervento: 'SRC01', dotazioneSpesaPubblica: imp(5_000_000), pagamentiTotali: assente('NON_VALORIZZATO') },
      { codiceIntervento: 'SRC02', dotazioneSpesaPubblica: imp(20_000_000), pagamentiTotali: imp(5_000_000) },
    ];
    const a = avanzamentoPonderato(misti);
    // (6 + 2 + 4 + 5) / (10 + 20 + 10 + 20) = 28,3%
    expect(a.media).toBe(28.3);
    expect(quotaPagata(misti).valore).toBe(a.media);
    const linea = graficoAvanzamento(misti).opzioni as unknown as { series: Array<{ markLine?: { data: Array<{ xAxis?: number }> } }> };
    expect(linea.series[0].markLine?.data[0].xAxis).toBe(a.media);
    expect(quotaPagata(misti).nota).toBe(`media ponderata su ${a.incluse.length} di 7 interventi`);
    expect(a.incluse).toHaveLength(4);
  });

  it('la nota "media ponderata su K di N interventi" quando qualche intervento e escluso', () => {
    expect(quotaPagata([...righe, senzaDotazione]).nota).toBe('media ponderata su 3 di 4 interventi');
    expect(quotaPagata([righe[0], senzaDotazione])).toEqual({ valore: 60, nota: 'media ponderata su 1 di 2 interventi' });
  });

  it('nessun intervento: non calcolabile', () => {
    expect(quotaPagata([])).toEqual({ valore: null, motivo: NESSUNO_UTILIZZABILE });
  });

  it('perimetro ADA: la quota non e confrontabile, anche con dati completi', () => {
    expect(quotaPagata(righe, 'ADA')).toEqual({ valore: null, motivo: MOTIVO_ADA });
    expect(quotaPagata([], 'ADA')).toEqual({ valore: null, motivo: MOTIVO_ADA });
  });

  it('kpiSpesa: totali senza somme parziali e la stessa quota', () => {
    expect(kpiSpesa(righe)).toEqual({
      dotazione: { valore: 40_000_000 },
      pagato: { valore: 12_000_000 },
      quota: { valore: 30, nota: 'media ponderata degli interventi' },
    });
    // dotazione zero: e un valore nel totale, ma la quota la esclude (la media non e il rapporto dei totali)
    expect(kpiSpesa([...righe, dotazioneZero])).toEqual({
      dotazione: { valore: 40_000_000 },
      pagato: { valore: 13_000_000 },
      quota: { valore: 30, nota: 'media ponderata su 3 di 4 interventi' },
    });
    // una dotazione assente: il totale della dotazione non e calcolabile, il pagato si'
    expect(kpiSpesa([...righe, senzaDotazione])).toEqual({
      dotazione: { valore: null, motivo: 'Non calcolabile: manca per 1 intervento (SRA03)' },
      pagato: { valore: 13_000_000 },
      quota: { valore: 30, nota: 'media ponderata su 3 di 4 interventi' },
    });
  });

  it('kpiSpesa col perimetro ADA: i totali restano, la quota non e confrontabile', () => {
    expect(kpiSpesa(righe, 'ADA')).toEqual({
      dotazione: { valore: 40_000_000 },
      pagato: { valore: 12_000_000 },
      quota: { valore: null, motivo: MOTIVO_ADA },
    });
  });

  it('kpiSpesa senza righe: tutto non calcolabile, nessuno zero', () => {
    const k = kpiSpesa([]);
    expect(k.dotazione).toEqual({ valore: null, motivo: 'Non calcolabile: nessun intervento nella selezione' });
    expect(k.pagato.valore).toBeNull();
    expect(k.quota).toEqual({ valore: null, motivo: NESSUNO_UTILIZZABILE });
  });
});

// ---------------------------------------------------------------- iterazione 3 della review v2

describe('cellaTotale (N-02)', () => {
  const r = (x: ImportoLike | undefined) => ({ x });
  const leggi = (riga: { x: ImportoLike | undefined }) => riga.x;
  it('tutti valorizzati: la somma in euro', () => {
    expect(cellaTotale([r(imp(1_000_000)), r(imp(2_000_000))], leggi).replace(/\s/g, ' ')).toBe('3.000.000,00 €');
  });
  it('assenti tutti con lo stesso motivo (non un non valorizzato): il motivo comune', () => {
    const fonte = assente('FONTE_NON_ATTIVA', 'IMPEGNI');
    expect(cellaTotale([r(fonte), r(fonte)], leggi)).toBe('non disponibile (fonte impegni non attiva)');
  });
  it('mai una somma parziale: un valore mancante, motivi diversi, non valorizzato o campo assente danno non calcolabile', () => {
    expect(cellaTotale([r(imp(1_000)), r(assente('FONTE_NON_ATTIVA', 'IMPEGNI'))], leggi)).toBe('non calcolabile');
    expect(cellaTotale([r(assente('FONTE_NON_ATTIVA', 'IMPEGNI')), r(assente('FUORI_PERIMETRO'))], leggi)).toBe('non calcolabile');
    expect(cellaTotale([r(assente('NON_VALORIZZATO')), r(assente('NON_VALORIZZATO'))], leggi)).toBe('non calcolabile');
    expect(cellaTotale([r(undefined), r(undefined)], leggi)).toBe('non calcolabile');
  });
});

describe('kpiImportiPerAnno e notaSenzaAmmesso (N-08)', () => {
  const anno = (ammesso: ImportoLike | undefined, stanziato: ImportoLike | undefined, senza: number | null) => ({ annoRaccolta: 2024, importoAmmesso: ammesso, importoStanziato: stanziato, domandeSenzaAmmesso: senza });
  const STANZIATO_ASSENTE = assente('FONTE_NON_ATTIVA', 'QUADRO_SINOTTICO');
  it('somme solo se ogni anno e valorizzato; lo stanziato assente porta l Importo del primo anno che manca', () => {
    const k = kpiImportiPerAnno([anno(imp(500), STANZIATO_ASSENTE, 0), anno(imp(300), STANZIATO_ASSENTE, 2)]);
    expect(k.ammesso).toEqual({ valore: 800, nota: '2 domande senza importo ammesso: non entrano nella somma' });
    expect(k.stanziato).toEqual({ valore: null, importo: STANZIATO_ASSENTE });
    const pieni = kpiImportiPerAnno([anno(imp(500), imp(700), 0)]);
    expect(pieni.stanziato).toEqual({ valore: 700, nota: 'somma degli anni di raccolta' });
  });
  it('ammesso mancante per un anno: non calcolabile, con il motivo', () => {
    const k = kpiImportiPerAnno([anno(imp(500), undefined, 0), anno(assente('NON_VALORIZZATO'), undefined, 0)]);
    expect(k.ammesso.valore).toBeNull();
    expect(k.ammesso.motivo).toBe('Non calcolabile: manca per almeno un anno di raccolta');
  });
  it('notaSenzaAmmesso: singolare, plurale, nessuna e conteggio mancante', () => {
    expect(notaSenzaAmmesso([anno(imp(1), undefined, 1)])).toBe('1 domanda senza importo ammesso: non entra nella somma');
    expect(notaSenzaAmmesso([anno(imp(1), undefined, 0)])).toBe('somma degli anni di raccolta');
    expect(notaSenzaAmmesso([anno(imp(1), undefined, null)])).toBe('domande senza importo ammesso: conteggio non disponibile per almeno un anno');
  });
});
