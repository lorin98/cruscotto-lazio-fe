// Test L1 delle funzioni PURE del fisico (lib/): criteri nell'indirizzo, conti sulle superfici, testi, builder dei
// grafici, output regionale e Unit Amount (dal 29/10/2026), grant e pagine, il dettaglio dell'intervento e i suoi link (dal
// 30/10/2026). Chiamate dirette, niente render; i dati sono quelli degli scenari del backend e dei wireframe approvati. Le
// determine di una domanda sono del procedurale.
import type { EChartsOption } from 'echarts';
import { describe, expect, it } from 'vitest';
import { COLORI, ettari, valoreEttari } from '../src/shared/lib';
import { NON_DISPONIBILE_BREVE } from '../src/entities/importo';
import { criteriAttivi, criteriDaRicerca, criteriDellIntervento, campagnaDaTesto, conCampagna, conFiltriDelProgramma, ricercaDaCriteri, soloIntervento, testiCriteri } from '../src/features/fisico/lib/criteri';
import {
  campagnaDi,
  campagnaDiRiferimento,
  campagneDellAnteprima,
  campagnePresenti,
  campagneProposte,
  esitoSuperfici,
  interventiDelleRighe,
  quotaDpOltreDs,
  righeTabella,
  senzaSuperfici,
  totaliCampagna,
  totaliPerCampagna,
} from '../src/features/fisico/lib/superfici';
import {
  ANNO_TARGET_ASSENTE,
  DEFINIZIONI_OUTPUT,
  SENZA_SUPERFICI,
  TESTO_ASSENTE,
  cellaDifferenza,
  cellaSuperficie,
  fonteLineaIntervento,
  notaQuantitaPremio,
  pillPeriodo,
  quantita,
  testoDifferenza,
  testoDomande,
  testoNessunaSuperficie,
  testoNonInCampagna,
  testoNonNellaCampagnaFiltrata,
  testoQuantitaPremio,
  testoQuotaOltreDs,
  testoSenzaSuperfici,
  testoTarget,
  testoVuotoOutput,
  testoVuotoUnitAmount,
} from '../src/features/fisico/lib/formato';
import { TESTI_KPI, cardDelleSuperfici, kpiDellaCampagna } from '../src/features/fisico/lib/report';
import { anteprimaSuperfici } from '../src/features/fisico/lib/anteprima';
import {
  MOTIVO_CON_CAMPAGNA,
  graficoInterventoPerCampagna,
  graficoOutputPerAnno,
  graficoPerCampagna,
  graficoPerIntervento,
  graficoSuperficiDellIntervento,
  graficoUnitAmount,
  graficoVerifica,
  lineePerCampagna,
  pagatoSenzaFonte,
} from '../src/features/fisico/lib/grafici';
import { MISURE, anniDelPeriodo, captionOutput, datoDellAnno, etichettaMisura, opzioniMisura, ordinabileDellAnno, testoRicercaOutput, vociAnteprima } from '../src/features/fisico/lib/output';
import { CAMPI_PAGATO, TITOLI_PAGATO, assenzaPagato, chiaveUnitAmount, etichettaUnitAmount, notaPagato, valoreDi } from '../src/features/fisico/lib/unitAmount';
import { GRANT, LETTURE_DETTAGLIO, puoAprireIntervento, puoLeggere } from '../src/features/fisico/lib/grant';
import { GRANT_DETTAGLIO, PAGINE_FISICO, PERCORSI, pagineVisibili } from '../src/features/fisico/lib/pagine';
import { outputDellIntervento, percorsoIntervento, superficiDellIntervento, unitAmountDellIntervento } from '../src/features/fisico/lib/collegamenti';
import {
  GRAFICO_OUTPUT_INTERVENTO,
  GRAFICO_SUPERFICI_INTERVENTO,
  NOTA_CAMPAGNA_KPI,
  SENZA_DATI,
  SENZA_OUTPUT,
  SENZA_SUPERFICI_INTERVENTO,
  SENZA_UNIT_AMOUNT,
  SOTTOTITOLO_OUTPUT_INTERVENTO,
  SOTTOTITOLO_SUPERFICI_INTERVENTO,
  SUPERFICI_NON_VALORIZZATE,
  TITOLI_SCHEDE,
  TITOLO_SUPERFICI_INTERVENTO,
  badgeIntervento,
  campagnaDeiKpi,
  captionUnitAmountIntervento,
  eIdScheda,
  fonteOutputIntervento,
  fonteSuperficiIntervento,
  fonteUnitAmountIntervento,
  kpiIntervento,
  oggettoFileOutput,
  oggettoFileSuperfici,
  oggettoFileUnitAmount,
  perimetroDelDettaglio,
  ritornoSenzaDati,
  schedaAttiva,
  schedeVisibili,
  sopratitoloIntervento,
  titoloIntervento,
  titoloOutputIntervento,
  ultimiDelDettaglio,
  ultimoDatoInErrore,
} from '../src/features/fisico/lib/intervento';
import {
  OUTPUT,
  SRA01_OUTPUT,
  SUPERFICI,
  SUPERFICI_INTERVENTI,
  SUPERFICI_SENZA,
  SUPERFICI_TRE,
  SUPERFICI_TRE_2024,
  ULTIMI,
  campagna,
  outputPer,
  righeDeiFiltri,
  superficiPer,
  unitAmountPer,
} from '../src/features/fisico/testing/fixture';

// gli spazi del formato it-IT sono non separabili: si confronta con spazi normali
const n = (s: string | undefined) => (s ?? '').replace(/\s/g, ' ');

interface OpzioniProva {
  aria?: { label: { description: string } };
  tooltip?: { valueFormatter?: unknown };
  xAxis?: { type?: string; data?: string[]; min?: number; max?: number };
  yAxis?: { type?: string; data?: string[]; inverse?: boolean };
  series: Array<{ type?: string; name?: string; data?: Array<{ value: number; name: string; codice?: string; etichetta?: string; itemStyle?: { color: string } } | null> }>;
}
const prova = (o: EChartsOption | null): OpzioniProva => {
  expect(o).not.toBeNull();
  return o as unknown as OpzioniProva;
};

describe('RF018: criteri delle superfici nell indirizzo (filtri del programma e campagna)', () => {
  it('filtri come nei report finanziari e una sola campagna valida', () => {
    expect(criteriDaRicerca('?intervento=SRB01&os=OS4&campagna=2025&campagna=2024')).toEqual({ intervento: ['SRB01'], os: ['OS4'], campagna: 2025 });
    expect(criteriDaRicerca('?campagna=abc&campagna=1999&campagna=2024')).toEqual({ campagna: 2024 });
    expect(criteriDaRicerca('?campagna=20250')).toEqual({});
    expect(campagnaDaTesto(' 2025 ')).toBe(2025);
    expect(campagnaDaTesto('2101')).toBeUndefined();
    expect(campagnaDaTesto(null)).toBeUndefined();
  });

  it('scrittura: filtri ripetuti, poi la campagna; con, senza campagna e solo un intervento', () => {
    expect(ricercaDaCriteri({ campagna: 2025, intervento: ['SRB01', 'SRA29'] })).toBe('intervento=SRB01&intervento=SRA29&campagna=2025');
    expect(ricercaDaCriteri({ campagna: 1800 })).toBe('');
    expect(ricercaDaCriteri({})).toBe('');
    expect(conCampagna({ os: ['OS4'], campagna: 2025 }, undefined)).toEqual({ os: ['OS4'] });
    expect(conCampagna({ os: ['OS4'] }, 2024)).toEqual({ os: ['OS4'], campagna: 2024 });
    expect(soloIntervento({ intervento: ['SRA29', 'SRB01'], campagna: 2025 }, 'SRB01')).toEqual({ intervento: ['SRB01'], campagna: 2025 });
  });

  it('chip: un criterio per valore, la campagna in fondo; ogni chip sa i criteri senza di lui', () => {
    const attivi = criteriAttivi({ intervento: ['SRB01'], campagna: 2025 });
    expect(attivi.map((c) => [c.chiave, c.etichetta, c.valore])).toEqual([
      ['intervento:SRB01', 'Intervento', 'SRB01'],
      ['campagna:2025', 'Campagna', '2025'],
    ]);
    expect(attivi[0].senza).toEqual({ campagna: 2025 });
    expect(attivi[1].senza).toEqual({ intervento: ['SRB01'] });
    expect(testiCriteri({ os: ['OS4'], campagna: 2024 })).toEqual(['OS: OS4', 'Campagna: 2024']);
    expect(criteriAttivi({})).toEqual([]);
    expect(conFiltriDelProgramma({ campagna: 2025 })).toBe(false);
    expect(conFiltriDelProgramma({ op: ['OP1'] })).toBe(true);
  });
});

describe('RF018: superfici per campagna (le campagne non si sommano, D-01)', () => {
  it('campagne presenti dalla piu recente; riferimento = filtro o la piu recente', () => {
    expect(campagnePresenti(SUPERFICI.righe)).toEqual([2025, 2024]);
    expect(campagnaDiRiferimento(SUPERFICI.righe, undefined)).toBe(2025);
    expect(campagnaDiRiferimento(SUPERFICI.righe, 2024)).toBe(2024);
    expect(campagnaDiRiferimento(SUPERFICI_SENZA.righe, undefined)).toBeNull();
    expect(campagnaDi(SUPERFICI.righe[1], 2024)?.superficieDs).toBe(10.5);
    expect(campagnaDi(SUPERFICI.righe[0], 2024)).toBeUndefined();
  });

  it('totali di una campagna: somme fra interventi, al centesimo; null senza la campagna', () => {
    expect(totaliCampagna(SUPERFICI_TRE.righe, 2025)).toEqual({
      anno: 2025,
      interventi: 2,
      domandePagamento: 5,
      domandeSostegno: 4,
      sostegniDiscordanti: 0,
      superficieDs: 19.5,
      superficieDp: 19.9,
      differenzaDpDs: 0.4,
      domandeDpOltreDs: 1,
    });
    expect(totaliCampagna(SUPERFICI.righe, 2023)).toBeNull();
    expect(totaliPerCampagna(SUPERFICI_TRE.righe).map((t) => [t.anno, t.superficieDs])).toEqual([
      [2024, 12.5],
      [2025, 19.5],
    ]);
    expect(totaliPerCampagna(SUPERFICI_TRE.righe, 'decrescente').map((t) => t.anno)).toEqual([2025, 2024]);
  });

  it('quota delle domande con DP oltre la DS sulle domande di pagamento', () => {
    expect(quotaDpOltreDs({ domandeDpOltreDs: 1, domandePagamento: 3 })).toBe(33.3);
    expect(quotaDpOltreDs({ domandeDpOltreDs: 0, domandePagamento: 0 })).toBeNull();
  });

  it('interventi senza superfici: in nessuna campagna o non in quella scelta', () => {
    expect(senzaSuperfici(SUPERFICI_TRE.righe, 2025, null)).toEqual([
      { codice: 'SRA29', motivo: 'nessuna-campagna' },
      { codice: 'SRB03', motivo: 'non-in-campagna' },
    ]);
  });

  it('con il filtro Campagna un intervento con campagne vuote e non nella campagna filtrata, mai in nessuna campagna (V1)', () => {
    // la risposta filtrata: SRB02 ha superfici solo nel 2025, ma col filtro 2024 ha campagne vuote e NON_VALORIZZATO
    expect(SUPERFICI_TRE_2024.campagna).toBe(2024);
    expect(SUPERFICI_TRE_2024.righe.find((r) => r.codiceIntervento === 'SRB02')).toMatchObject({ campagne: [], motivo: 'NON_VALORIZZATO' });
    expect(senzaSuperfici(SUPERFICI_TRE_2024.righe, 2024, 2024)).toEqual([
      { codice: 'SRA29', motivo: 'campagna-filtrata' },
      { codice: 'SRB02', motivo: 'campagna-filtrata' },
    ]);
    expect(righeTabella(SUPERFICI_TRE_2024.righe, 2024).filter((r) => r.campagna === null).map((r) => [r.codiceIntervento, r.campagnaRisposta])).toEqual([
      ['SRA29', 2024],
      ['SRB02', 2024],
    ]);
  });

  it('la risposta filtrata dei test: interventi richiesti e la sola campagna richiesta (forma del contratto, V2)', () => {
    const r = superficiPer(SUPERFICI_TRE, '?intervento=SRB01&intervento=SRB03&campagna=2025');
    expect(r.campagna).toBe(2025);
    expect(r.righe.map((x) => [x.codiceIntervento, x.campagne.map((c) => c.anno), x.motivo])).toEqual([
      ['SRB01', [2025], null],
      ['SRB03', [], 'NON_VALORIZZATO'],
    ]);
    expect(superficiPer(SUPERFICI, '')).toEqual(SUPERFICI);
  });

  it('righe della tabella: una per intervento e campagna; l intervento senza superfici ha una riga sola', () => {
    const righe = righeTabella(SUPERFICI.righe, null);
    expect(righe.map((r) => [r.chiave, r.campagna?.anno ?? null, r.motivo, r.campagnaRisposta])).toEqual([
      ['SRA29', null, 'NON_VALORIZZATO', null],
      ['SRB01:2024', 2024, null, null],
      ['SRB01:2025', 2025, null, null],
    ]);
    // dalle righe (anche solo quelle trovate dalla ricerca) si torna agli interventi per i totali per campagna
    expect(interventiDelleRighe(righe.slice(2)).map((r) => [r.codiceIntervento, r.campagne.map((c) => c.anno)])).toEqual([['SRB01', [2025]]]);
    expect(interventiDelleRighe(righe.slice(0, 1))[0].motivo).toBe('NON_VALORIZZATO');
  });

  it('esito: nessun intervento, nessuna superficie (mai una pagina di zeri) o i dati della campagna', () => {
    expect(esitoSuperfici([], undefined)).toEqual({ tipo: 'nessun-intervento' });
    expect(esitoSuperfici(SUPERFICI_SENZA.righe, 2023)).toEqual({ tipo: 'senza-superfici', campagna: 2023 });
    expect(esitoSuperfici(SUPERFICI_SENZA.righe, undefined)).toEqual({ tipo: 'senza-superfici', campagna: null });
    expect(esitoSuperfici(SUPERFICI.righe, 2023)).toEqual({ tipo: 'senza-superfici', campagna: 2023 });
    expect(esitoSuperfici(SUPERFICI.righe, undefined)).toEqual({ tipo: 'dati', campagna: 2025 });
  });
});

describe('RF018: testi delle superfici (ettari con due decimali, assenze mai a zero)', () => {
  it('superfici con la resa del kit (ettari, due decimali) e differenze col segno', () => {
    expect(n(ettari(15.5))).toBe('15,50 ha');
    expect(n(ettari(-1))).toBe('-1,00 ha');
    expect(n(testoDifferenza(0.7))).toBe('+0,70 ha');
    expect(n(testoDifferenza(-0.5))).toBe('-0,50 ha');
    expect(cellaSuperficie(10)).toBe('10,00');
    expect(cellaDifferenza(0.7)).toBe('+0,70');
  });

  it('quantita richiesta a premio: la resa unica delle assenze (OP-FIS-04), oppure il valore', () => {
    expect(testoQuantitaPremio({ valore: null, motivo: 'FONTE_NON_ATTIVA', fonte: 'QUANTITA_RICHIESTA_PREMIO' })).toBe('non disponibile (fonte quantità richiesta a premio non attiva)');
    expect(testoQuantitaPremio({ valore: 12, motivo: null, fonte: null })).toBe('12');
    expect(testoQuantitaPremio(undefined)).toBe('non disponibile');
  });

  it('interventi fuori dai grafici e quota', () => {
    expect(SENZA_SUPERFICI).toContain('non valorizzato');
    expect(testoNonInCampagna(2025)).toBe('nessuna superficie nella campagna 2025');
    expect(testoNonNellaCampagnaFiltrata(2024)).toBe('nessuna superficie nella campagna 2024 (non valorizzato)');
    expect(testoSenzaSuperfici(null)).toBe(SENZA_SUPERFICI);
    expect(testoSenzaSuperfici(2024)).toBe('nessuna superficie nella campagna 2024 (non valorizzato)');
    expect(n(testoQuotaOltreDs(3, 33.3))).toBe('su 3 domande di pagamento: 33,3 %');
    expect(n(testoQuotaOltreDs(1, 100))).toBe('su 1 domanda di pagamento: 100 %');
    expect(testoQuotaOltreDs(0, null)).toBe('nessuna domanda di pagamento');
  });

  it('stato vuoto nessuna superficie: senza filtro non a superficie o non SIGC, col filtro Campagna solo quella (D1)', () => {
    expect(testoNessunaSuperficie(null)).toBe('Nessuna superficie per gli interventi scelti: gli interventi non sono a superficie o non sono SIGC (non valorizzato).');
    expect(testoNessunaSuperficie(2023)).toBe('Nessuna superficie per gli interventi scelti nella campagna 2023 (non valorizzato). Togli il filtro Campagna per vedere le altre campagne.');
    expect(fonteLineaIntervento(null)).toBe("Fonte: TX-0018, superfici dell'intervento campagna per campagna (le campagne non si sommano).");
    expect(fonteLineaIntervento(2024)).toBe("Fonte: TX-0018 con il filtro Campagna 2024: l'anteprima mostra solo la campagna 2024.");
  });
});

describe('RF018: grafici delle superfici (tabella equivalente, omessi dichiarati)', () => {
  it('barre DS e DP per intervento nella campagna: SRA29 omesso e dichiarato, in ettari', () => {
    const g = graficoPerIntervento(SUPERFICI.righe, 2025, null);
    const o = prova(g.opzioni);
    expect(o.xAxis?.data).toEqual(['SRB01']);
    expect(o.series.map((s) => s.name)).toEqual(['Superficie DS', 'Superficie DP']);
    expect(o.series[0].data?.[0]).toMatchObject({ value: 15.5, codice: 'SRB01' });
    expect(o.tooltip?.valueFormatter).toBe(valoreEttari);
    expect(g.omessi).toEqual([`SRA29: ${SENZA_SUPERFICI}`]);
    expect(g.tabella.colonne).toEqual(['Intervento', 'Superficie DS (ha)', 'Superficie DP (ha)']);
    expect(g.tabella.righe).toEqual([
      ['SRB01', '15,50', '16,20'],
      ['SRA29', 'non valorizzato', 'non valorizzato'],
    ]);
    expect(n(o.aria?.label.description)).toBe('Barre raggruppate della superficie DS e DP per 1 intervento (SRB01), superfici in ettari. 1 voce omessa per dati mancanti o non utilizzabili.');
  });

  it('nessun intervento con la campagna: non disegnabile col motivo, la tabella resta', () => {
    const g = graficoPerIntervento(SUPERFICI_SENZA.righe, 2023, 2023);
    expect(g.opzioni).toBeNull();
    expect(g.motivoAssenza).toBe('nessun intervento con superfici nella campagna 2023');
    expect(g.tabella.righe).toHaveLength(2);
  });

  it('con il filtro Campagna gli omessi sono non nella campagna filtrata, mai in nessuna campagna (V1)', () => {
    const g = graficoPerIntervento(SUPERFICI_TRE_2024.righe, 2024, 2024);
    expect(g.omessi).toEqual(['SRA29: nessuna superficie nella campagna 2024 (non valorizzato)', 'SRB02: nessuna superficie nella campagna 2024 (non valorizzato)']);
    expect(g.tabella.righe.slice(-2)).toEqual([
      ['SRA29', 'nessuna superficie (non valorizzato)', 'nessuna superficie (non valorizzato)'],
      ['SRB02', 'nessuna superficie (non valorizzato)', 'nessuna superficie (non valorizzato)'],
    ]);
    const v = graficoVerifica(SUPERFICI_TRE_2024.righe, 2024, 2024);
    expect(v.omessi).toEqual(g.omessi);
    expect(v.omessi.join(' ')).not.toContain('in nessuna campagna');
  });

  it('linea per campagna: un punto per campagna col suo anno (clic = filtro Campagna)', () => {
    const g = graficoPerCampagna([{ anno: 2024, superficieDs: 10.5, superficieDp: 10 }, { anno: 2025, superficieDs: 15.5, superficieDp: 16.2 }], undefined);
    const o = prova(g.opzioni);
    expect(o.xAxis?.data).toEqual(['2024', '2025']);
    expect(o.series.map((s) => [s.type, s.name])).toEqual([
      ['line', 'Superficie DS'],
      ['line', 'Superficie DP'],
    ]);
    expect(o.series[1].data?.[1]).toMatchObject({ value: 16.2, codice: '2025' });
    expect(n(o.aria?.label.description)).toBe('Linee della superficie DS e DP per campagna dal 2024 al 2025 (2 campagne), superfici in ettari: nel 2025 DS 15,50 ha e DP 16,20 ha.');
    expect(g.tabella.righe).toEqual([
      ['2024', '10,50', '10,00'],
      ['2025', '15,50', '16,20'],
    ]);
  });

  it('con il filtro Campagna la serie non si disegna e lo dice; senza campagne neppure', () => {
    const g = graficoPerCampagna([{ anno: 2025, superficieDs: 15.5, superficieDp: 16.2 }], 2025);
    expect(g.opzioni).toBeNull();
    expect(g.motivoAssenza).toBe(MOTIVO_CON_CAMPAGNA);
    expect(g.tabella.righe).toHaveLength(1);
    expect(lineePerCampagna([], { caption: 'c', titolo: 't' }).motivoAssenza).toBe('nessuna campagna con superfici');
  });

  it("mini linea dell'anteprima: le campagne del solo intervento", () => {
    const o = prova(graficoInterventoPerCampagna(SUPERFICI.righe[1], null).opzioni);
    expect(n(o.aria?.label.description)).toContain('Linee della superficie DS e DP di SRB01 per campagna dal 2024 al 2025');
    expect(graficoInterventoPerCampagna(SUPERFICI.righe[0], null).opzioni).toBeNull();
  });

  it("mini linea dell'anteprima con il filtro Campagna: non si disegna e lo dice, la tabella resta (V1)", () => {
    const srb01 = SUPERFICI_TRE_2024.righe.find((r) => r.codiceIntervento === 'SRB01');
    if (!srb01) throw new Error('SRB01 assente');
    const g = graficoInterventoPerCampagna(srb01, 2024);
    expect(g.opzioni).toBeNull();
    expect(g.motivoAssenza).toBe(MOTIVO_CON_CAMPAGNA);
    expect(g.tabella.righe).toEqual([['2024', '10,50', '10,00']]);
  });

  it('verifica incrociata: barre dalla differenza maggiore, zero al centro, segno nel testo e colore per verso', () => {
    const g = graficoVerifica(SUPERFICI_TRE.righe, 2025, null);
    const o = prova(g.opzioni);
    expect(o.yAxis).toMatchObject({ type: 'category', inverse: true, data: ['SRB01', 'SRB02'] });
    expect(o.xAxis?.min).toBe(-(o.xAxis?.max ?? 0));
    expect(o.xAxis?.max).toBeGreaterThan(0.7);
    const dati = o.series[0].data ?? [];
    expect(n(dati[0]?.etichetta)).toBe('+0,70 ha, 1 DP oltre la DS');
    expect(n(dati[1]?.etichetta)).toBe('-0,30 ha, 0 DP oltre la DS');
    expect(dati[0]?.itemStyle?.color).toBe(COLORI.attenzione);
    expect(dati[1]?.itemStyle?.color).toBe(COLORI.primario);
    expect(g.omessi.map((o2) => o2.split(':')[0])).toEqual(['SRA29', 'SRB03']);
    expect(g.tabella.righe[0]).toEqual(['SRB01', '+0,70', '1', 'non disponibile (fonte quantità richiesta a premio non attiva)']);
    expect(n(o.aria?.label.description)).toBe(
      "Barre orizzontali della differenza fra superficie DP e superficie DS per 2 interventi nella campagna 2025: dalla più alta, SRB01 +0,70 ha, alla più bassa, SRB02 -0,30 ha; a destra dello zero la DP supera la DS. 2 voci omesse per dati mancanti o non utilizzabili.",
    );
    expect(graficoVerifica(SUPERFICI_SENZA.righe, 2023, 2023).opzioni).toBeNull();
  });
});

describe('RF018: il report come dati e i calcoli spostati dai componenti (H3, H4)', () => {
  it('KPI della campagna: somme dentro la campagna, nomi accessibili con le sigle sciolte, quota sulle domande di pagamento', () => {
    const kpi = kpiDellaCampagna(SUPERFICI_TRE.righe, 2025);
    expect(kpi?.map((k) => [k.chiave, k.etichetta, n(k.valore), n(k.nota)])).toEqual([
      ['ds', 'Superficie ammissibile DS', '19,50 ha', '4 domande di sostegno (la DS si conta una volta per domanda di sostegno)'],
      ['dp', 'Superficie ammissibile DP', '19,90 ha', '5 domande di pagamento'],
      ['differenza', 'Differenza DP - DS', '+0,40 ha', 'negativa se la DP è minore della DS'],
      ['oltre', 'Domande con DP oltre la DS', '1', 'su 5 domande di pagamento: 20 %'],
    ]);
    expect(kpi?.[0].nomeAccessibile).toBe('Superficie ammissibile DS: superficie delle domande di sostegno, campagna 2025');
    expect(kpi?.[3].quota).toBe(0.2);
    expect(kpi?.[0].quota).toBeUndefined();
    expect(kpiDellaCampagna(SUPERFICI.righe, 2023)).toBeNull();
    expect(testoDomande(1, 'sostegno')).toBe('1 domanda di sostegno');
    expect(testoDomande(3, 'pagamento')).toBe('3 domande di pagamento');
  });

  it('le tre card: titoli della campagna, clic, criteri dei file (la campagna della card o i filtri della pagina) e fonte', () => {
    const [perIntervento, perCampagna, verifica] = cardDelleSuperfici(SUPERFICI, { intervento: ['SRB01'] }, 2025);
    expect([perIntervento.titolo, perCampagna.titolo, verifica.titolo]).toEqual([
      'Superficie DS e DP per intervento, campagna 2025',
      'Superficie DS e DP per campagna',
      'Verifica incrociata: differenza DP - DS per intervento, campagna 2025',
    ]);
    expect([perIntervento.clic, perCampagna.clic, verifica.clic]).toEqual(['intervento', 'campagna', 'intervento']);
    expect(perIntervento.criteriFile).toEqual({ intervento: ['SRB01'], campagna: 2025 });
    expect(perCampagna.criteriFile).toEqual({ intervento: ['SRB01'] });
    expect(verifica.criteriFile).toEqual({ intervento: ['SRB01'], campagna: 2025 });
    expect(perCampagna.fonte).toBe('Fonte: TX-0018, tutte le campagne della risposta. CSV e XLSX: la tabella di TX-0018 coi filtri della pagina, tutte le campagne.');
    expect(verifica.fonte).toContain('Quantità richiesta a premio: non disponibile (fonte quantità richiesta a premio non attiva).');
    expect(perIntervento.dati.omessi).toEqual([`SRA29: ${SENZA_SUPERFICI}`]);
    const filtrate = cardDelleSuperfici(SUPERFICI_TRE_2024, { campagna: 2024 }, 2024);
    expect(filtrate[1].fonte).toBe('Fonte: TX-0018 con il filtro Campagna 2024. CSV e XLSX: la tabella di TX-0018 coi filtri della pagina.');
    expect(filtrate[1].dati.motivoAssenza).toBe(MOTIVO_CON_CAMPAGNA);
    expect(filtrate[0].dati.omessi).toContain('SRB02: nessuna superficie nella campagna 2024 (non valorizzato)');
  });

  it('nota della quantita a premio: assente in tutta la campagna oppure il rimando alla tabella (anche con un valore)', () => {
    expect(notaQuantitaPremio(SUPERFICI.righe, 2025)).toBe('Quantità richiesta a premio: non disponibile (fonte quantità richiesta a premio non attiva).');
    const conValore = [{ codiceIntervento: 'SRB09', motivo: null, campagne: [{ ...SUPERFICI.righe[1].campagne[1], quantitaRichiestaPremio: { valore: 12, motivo: null, fonte: null } }] }, ...SUPERFICI.righe];
    expect(notaQuantitaPremio(conValore, 2025)).toBe('Quantità richiesta a premio nella tabella equivalente.');
    expect(notaQuantitaPremio(SUPERFICI.righe, 2023)).toBe('Quantità richiesta a premio nella tabella equivalente.');
  });

  it("campagne dell'anteprima: quella di riferimento, le altre dalla piu recente, quella della quantita a premio", () => {
    const srb01 = SUPERFICI.righe[1];
    const con2025 = campagneDellAnteprima(srb01, 2025);
    expect([con2025.riferimento?.anno, con2025.altre.map((c) => c.anno), con2025.premio?.anno]).toEqual([2025, [2024], 2025]);
    const senza = campagneDellAnteprima(srb01, null);
    expect([senza.riferimento, senza.altre.map((c) => c.anno), senza.premio?.anno]).toEqual([undefined, [2025, 2024], 2025]);
    expect(campagneDellAnteprima(srb01, 2023).riferimento).toBeUndefined();
    expect(campagneDellAnteprima(SUPERFICI.righe[0], 2025)).toEqual({ riferimento: undefined, altre: [], premio: undefined });
  });

  it('pannello: campagne proposte dalla risposta e quella scelta (voci e descrizione dell intervento: entities/filtri)', () => {
    expect(campagneProposte([2025, 2024], undefined)).toEqual([2025, 2024]);
    expect(campagneProposte([2025, 2024], 2024)).toEqual([2025, 2024]);
    expect(campagneProposte([2024], 2023)).toEqual([2023, 2024]);
  });
});

// output regionale (TX-0017) e Unit Amount (TX-0030): gli stessi casi dei test dell'istituzionale e del procedurale da cui
// le pagine vengono (29/10/2026)
describe('RF017: l output regionale (TX-0017)', () => {
  it('misure dell interruttore, anni del periodo e dato di un anno; un anno non elencato e non valorizzato', () => {
    expect(MISURE.map((m) => etichettaMisura(m, true))).toEqual(['Programmato', 'Realizzato SIGC', 'Realizzato non SIGC (cumulativo)']);
    expect(etichettaMisura('realizzatoNonSigc', false)).toBe('Realizzato non SIGC');
    expect(opzioniMisura(true)).toEqual([
      { valore: 'programmato', etichetta: 'Programmato' },
      { valore: 'realizzatoSigc', etichetta: 'Realizzato SIGC' },
      { valore: 'realizzatoNonSigc', etichetta: 'Realizzato non SIGC (cumulativo)' },
    ]);
    expect(anniDelPeriodo({ annoInizio: 2023, annoFine: 2030 })).toHaveLength(8);
    expect(datoDellAnno(SRA01_OUTPUT, 2024, 'programmato').valore).toBe(500);
    expect(datoDellAnno(SRA01_OUTPUT, 2031, 'programmato')).toEqual({ valore: null, motivo: 'NON_VALORIZZATO', fonte: null });
    expect([ordinabileDellAnno(SRA01_OUTPUT, 2023, 'realizzatoSigc'), ordinabileDellAnno(SRA01_OUTPUT, 2023, 'programmato')]).toEqual([400, null]);
  });

  it('didascalia con la misura; voci del drawer; riga e ricerca (gli importi unitari li mostra TX-0030, OP-FIS-15)', () => {
    expect(captionOutput('programmato', true)).toBe("Output programmato per anno (misura scelta sopra), l'intervento è l'intestazione di riga e gli anni vengono dalla risposta");
    expect(captionOutput('realizzatoSigc', true)).toMatch(/^Output realizzato SIGC per anno/);
    expect(vociAnteprima(SRA01_OUTPUT, true)).toEqual([
      { termine: 'Indicatore di output', valore: 'O.14 (ettari)' },
      { termine: 'Target di fine periodo', valore: '1500 ettari al 2029' },
      { termine: 'Realizzato non SIGC', valore: 'cumulativo per anno di riferimento' },
    ]);
    const srg01 = OUTPUT.righe[3];
    // l'indicatore assente con la resa unica delle assenze, come la tabella; senza l'unita' anche se c'e' (review V4)
    expect(vociAnteprima(srg01, false).map((v) => v.valore)).toEqual(['non valorizzato (il dato non è presente nella fonte)', 'non valorizzato (il dato non è presente nella fonte)', 'annuale']);
    expect(vociAnteprima({ ...srg01, unitaMisura: 'ettari' }, false)[0].valore).toBe('non valorizzato (il dato non è presente nella fonte)');
    expect(testoRicercaOutput(SRA01_OUTPUT)).toBe('SRA01 O.14 ettari');
  });

  it('testi: quantita con l unita, periodo, target; mai uno zero al posto di un assente; stato vuoto e definizioni', () => {
    expect([quantita(1500, 'ettari'), quantita(12, null), quantita(12345, 'UBA')]).toEqual(['1500 ettari', '12', '12.345 UBA']);
    expect(pillPeriodo(2023, 2029)).toBe('Periodo: 2023 - 2029');
    expect(testoTarget({ valore: 1500 }, 2029, 'ettari')).toBe('1500 ettari al 2029');
    expect(testoTarget({ valore: 10 }, null, null)).toBe('10');
    expect(testoTarget({ valore: null, motivo: 'NON_VALORIZZATO' }, null, null)).toBe('non valorizzato (il dato non è presente nella fonte)');
    expect(ANNO_TARGET_ASSENTE).toEqual({ disponibile: false, testo: 'non valorizzato', nota: 'nessun target' });
    expect(TESTO_ASSENTE.motivo).toBe('NON_VALORIZZATO');
    expect(testoVuotoOutput(true)).toBe("Nessun intervento per i filtri scelti (per esempio un'azione portante senza interventi collegati).");
    expect(testoVuotoOutput(false)).toBe("Nessun intervento nell'output regionale.");
    expect(DEFINIZIONI_OUTPUT).toContain("somma dell'output previsto delle Unit Amount");
  });

  it('output per anno: tre serie nell unita dell indicatore, anni senza valore omessi col motivo, il target linea e riga', () => {
    const g = graficoOutputPerAnno(SRA01_OUTPUT, true);
    const serie = g.opzioni?.series as Array<{ name: string; markLine?: { data: unknown[] } }>;
    expect(serie.map((x) => x.name)).toEqual(['Programmato', 'Realizzato SIGC', 'Realizzato non SIGC (cumulativo)']);
    expect((g.opzioni?.xAxis as { data: string[] }).data).toEqual(['2023', '2024']);
    expect(serie[0].markLine?.data).toEqual([{ name: 'Target 1500 ettari al 2029', yAxis: 1500 }]);
    // il target supera le barre: l'asse lo contiene
    expect((g.opzioni?.yAxis as { max?: number }).max).toBe(1500);
    expect((g.opzioni?.aria as { label: { description: string } }).label.description).toMatch(/Target di fine periodo: 1500 ettari al 2029\.$/);
    expect(g.tabella.caption).toBe("Tabella equivalente: output dell'intervento SRA01 per anno, in ettari");
    expect(g.tabella.righe[1]).toEqual(['2024', '500 ettari', 'non valorizzato (il dato non è presente nella fonte)', 'non valorizzato (il dato non è presente nella fonte)']);
    expect(g.tabella.righe.at(-1)).toEqual(['Target di fine periodo', '1500 ettari al 2029', '', '']);
    expect(g.omessi).toContain('2027, realizzato SIGC: non valorizzato (il dato non è presente nella fonte)');
  });

  it('output per anno senza target ne valori: non disegnabile, la tabella resta con la riga del target', () => {
    const g = graficoOutputPerAnno(OUTPUT.righe[3], false);
    expect(g.opzioni).toBeNull();
    expect(g.motivoAssenza).toBe("nessun anno con un valore dell'output");
    expect(g.tabella.caption).toBe("Tabella equivalente: output dell'intervento SRG01 per anno");
    expect(g.tabella.righe.at(-1)).toEqual(['Target di fine periodo', 'non valorizzato (il dato non è presente nella fonte)', '', '']);
    const ambiguo = graficoOutputPerAnno(OUTPUT.righe[1], true);
    expect(ambiguo.omessi).toContain('2027, realizzato SIGC: non attribuibile (riga presente sia nel monitoraggio SIGC sia nel non SIGC)');
  });

  it('fixture: le righe dei filtri come il backend (E fra dimensioni, O fra valori), azione senza legame: nessuna riga', () => {
    const codici = (p: string) => righeDeiFiltri(OUTPUT.righe, new URLSearchParams(p)).map((r) => r.codiceIntervento);
    expect(codici('')).toEqual(['SRA01', 'SRA16', 'SRD01', 'SRG01']);
    expect(codici('os=OS4')).toEqual(['SRD01']);
    expect(codici('os=OS4&os=OS5')).toEqual(['SRA01', 'SRA16', 'SRD01']);
    expect(codici('og=OG1&op=OP1')).toEqual(['SRA01']);
    expect(codici('azione=3')).toEqual([]);
    expect(outputPer(OUTPUT, new URLSearchParams('intervento=SRD01')).righe).toHaveLength(1);
  });
});

describe('RF030: le Unit Amount (TX-0030)', () => {
  const q = (s = '') => new URLSearchParams(s);

  it('chiave ed etichetta della riga; la nota unica e le celle brevi con la fonte del pagato non attiva (scelta 8)', () => {
    const [r] = unitAmountPer(q()).righe ?? [];
    expect([chiaveUnitAmount(r), etichettaUnitAmount(r)]).toEqual(['SRD01|UA1|2024', 'UA1 (SRD01, esercizio 2024)']);
    expect(chiaveUnitAmount({})).toBe('||');
    expect(CAMPI_PAGATO.map((c) => TITOLI_PAGATO[c])).toEqual(['Importo pagato', 'Pagato sul richiesto', 'Base storica']);
    expect(notaPagato(unitAmountPer(q()).righe ?? [])).toBe(
      'Importo pagato, percentuale pagata sul richiesto e base storica: non disponibili per tutte le Unit Amount (fonte pagato per Unit Amount non attiva). Nelle celle: "non disponibile".',
    );
    expect(notaPagato(unitAmountPer(q(), { pagato: true }).righe ?? [])).toBeNull();
    expect(assenzaPagato(r, 'baseStorica', true)).toBe(NON_DISPONIBILE_BREVE);
    // il drawer non arriva alla nota della tabella: col motivo
    expect(assenzaPagato(r, 'baseStorica', false)).toEqual({ disponibile: false, testo: 'non disponibile', nota: 'fonte pagato per Unit Amount non attiva' });
    const [, ua2] = unitAmountPer(q(), { pagato: true }).righe ?? [];
    expect(assenzaPagato(ua2, 'importoPagato', true)).toEqual({ disponibile: false, testo: 'non valorizzato', nota: 'il dato non è presente nella fonte' });
    expect([valoreDi({ valore: 3 }), valoreDi({ valore: null }), valoreDi(undefined)]).toEqual([3, null, null]);
    expect([testoVuotoUnitAmount(true), testoVuotoUnitAmount(false)]).toEqual(["Nessuna Unit Amount per i filtri scelti (per esempio un'azione portante senza interventi collegati).", 'Nessuna Unit Amount.']);
  });

  it('senza la fonte del pagato grafico non disponibile; con la fonte barre orizzontali raggruppate', () => {
    const righe = unitAmountPer(q()).righe ?? [];
    const senza = graficoUnitAmount(righe, 'Percentuale pagata per Unit Amount');
    expect(senza.motivoAssenza).toBe("nessuna Unit Amount ha ancora l'importo pagato (fonte pagato per Unit Amount non attiva)");
    expect(senza.tabella.righe).toEqual([
      ['UA1 (SRD01, esercizio 2024)', 'non disponibile', 'non disponibile'],
      ['UA2 (SRD01, esercizio 2024)', 'non disponibile', 'non disponibile'],
      ['UA1 (SRD01, esercizio 2025)', 'non disponibile', 'non disponibile'],
    ]);
    // un'altra assenza resta col motivo
    const mista = graficoUnitAmount([righe[0], { ...righe[1], baseStorica: { valore: null, motivo: 'NON_VALORIZZATO', fonte: null } }], 'T');
    expect(mista.tabella.righe[1]).toEqual(['UA2 (SRD01, esercizio 2024)', 'non disponibile', 'non valorizzato (il dato non è presente nella fonte)']);
    expect(pagatoSenzaFonte(righe)).toBe(true);
    const con = graficoUnitAmount(unitAmountPer(q(), { pagato: true }).righe ?? [], 'Percentuale pagata per Unit Amount');
    const o = con.opzioni as { yAxis: { type: string; data: string[] }; series: Array<{ data: unknown[] }> };
    expect(o.yAxis.type).toBe('category');
    expect(o.yAxis.data).toEqual(['UA1 (SRD01, esercizio 2024)', 'UA1 (SRD01, esercizio 2025)']);
    expect(o.series[0].data[0]).toMatchObject({ value: 40, codice: 'SRD01|UA1|2024' });
  });

  it('righe dei filtri come il backend: intervento, obiettivi e azione portante (SC-FS_UNIT_AMOUNT_AZIONE, senza legame nessuna riga)', () => {
    expect((unitAmountPer(q('azione=3')).righe ?? [])).toEqual([]);
    expect((unitAmountPer(q('os=OS5')).righe ?? []).map((r) => r.codiceIntervento)).toEqual([]);
    expect((unitAmountPer(q('intervento=SRD01')).righe ?? [])).toHaveLength(3);
  });
});

describe('grant e pagine del fisico (gate di UX)', () => {
  const stato = (roles: string[]) => ({ authenticated: true, user: { username: 'u', roles } });

  it('grant verbatim dal catalogo; senza stato nessuna lettura', () => {
    expect(GRANT).toEqual({ superfici: 'csr.tx-0018.read', output: 'csr.tx-0017.read', unitAmount: 'csr.tx-0030.read', filtri: 'csr.tx-0060.read' });
    expect(puoLeggere(stato(['csr.tx-0018.read']), 'superfici')).toBe(true);
    expect(puoLeggere(stato(['csr.tx-0018.read']), 'filtri')).toBe(false);
    expect(puoLeggere(undefined, 'output')).toBe(false);
  });

  it('pagine visibili per grant, nell ordine del menu: superfici, output regionale, Unit Amount (le determine al procedurale)', () => {
    expect(pagineVisibili((g) => g === GRANT.unitAmount).map((p) => p.percorso)).toEqual([PERCORSI.unitAmount]);
    expect(pagineVisibili(() => true).map((p) => [p.voceMenu, p.percorso])).toEqual([
      ['Superfici ammissibili', '/fisico/superfici'],
      ['Output regionale', '/fisico/output-regionale'],
      ['Unit Amount', '/fisico/unit-amount'],
    ]);
    expect(PAGINE_FISICO.map((p) => p.grant)).toEqual([GRANT.superfici, GRANT.output, GRANT.unitAmount]);
    expect(pagineVisibili((g) => g === 'csr.tx-0020.read')).toEqual([]);
  });
});

describe('RF018: card della Home coi KPI della campagna piu recente (OP-FIS-10, decisione dell utente del 26/10/2026)', () => {
  it('la campagna piu recente della risposta, coi conti della pagina: dentro la campagna si sommano gli interventi', () => {
    expect(anteprimaSuperfici(SUPERFICI)).toEqual({ campagna: 2025, superficieDs: 15.5, superficieDp: 16.2, domandePagamento: 3, quotaOltreDs: 33.3 });
    // SRB01 e SRB02 nel 2025; SRB03 ha solo il 2024 e non entra (le campagne non si sommano, D-01)
    expect(anteprimaSuperfici(SUPERFICI_TRE)).toEqual({ campagna: 2025, superficieDs: 19.5, superficieDp: 19.9, domandePagamento: 5, quotaOltreDs: 20 });
    // gli stessi numeri dei KPI della pagina per quella campagna
    const kpi = kpiDellaCampagna(SUPERFICI_TRE.righe, 2025) ?? [];
    expect(kpi.find((k) => k.chiave === 'ds')?.valore).toBe(ettari(19.5));
    expect(kpi.find((k) => k.chiave === 'dp')?.valore).toBe(ettari(19.9));
    expect(kpi.find((k) => k.chiave === 'oltre')?.quota).toBe(0.2);
  });

  it('nessuna superficie: nessun numero; senza domande di pagamento nella campagna nessuna quota', () => {
    expect(anteprimaSuperfici(SUPERFICI_SENZA)).toBeNull();
    const senzaPagamento = { righe: [{ codiceIntervento: 'SRB01', motivo: null, campagne: [campagna(2026, { domandePagamento: 0 })] }] };
    expect(anteprimaSuperfici(senzaPagamento)).toMatchObject({ campagna: 2026, domandePagamento: 0, quotaOltreDs: null });
  });

  it('etichette e spiegazioni comuni alla pagina e alla card', () => {
    const kpi = kpiDellaCampagna(SUPERFICI.righe, 2025) ?? [];
    expect(kpi.map((k) => k.etichetta)).toEqual([TESTI_KPI.ds.etichetta, TESTI_KPI.dp.etichetta, 'Differenza DP - DS', TESTI_KPI.oltre.etichetta]);
    expect(kpi.map((k) => k.nomeAccessibile)).toEqual([
      'Superficie ammissibile DS: superficie delle domande di sostegno, campagna 2025',
      'Superficie ammissibile DP: superficie delle domande di pagamento, campagna 2025',
      'Differenza DP - DS: superficie di pagamento meno superficie di sostegno, campagna 2025',
      'Domande con DP oltre la DS: domande di pagamento con superficie oltre quella di sostegno, campagna 2025',
    ]);
  });
});

describe("RF017, RF018, RF030: il dettaglio dell'intervento come dati (flusso intervento del 30/10/2026)", () => {
  const sra01 = SUPERFICI_INTERVENTI.righe[0];
  const srd01 = SUPERFICI_INTERVENTI.righe[1];
  const kpi = kpiIntervento(SRA01_OUTPUT, sra01);

  it('testata: titolo dalla descrizione di TX-0060 o dal codice, sopratitolo, badge del perimetro e dell indicatore', () => {
    expect(titoloIntervento('SRA01', 'Produzione integrata')).toBe('Produzione integrata');
    expect(titoloIntervento('SRA01', undefined)).toBe('Intervento SRA01');
    expect(sopratitoloIntervento('SRA01')).toBe('Fisico - intervento SRA01');
    expect(badgeIntervento(SRA01_OUTPUT)).toEqual(['Perimetro regionale', 'Indicatore di output O.14 (ettari)']);
    expect(badgeIntervento({ indicatoreOutput: null, unitaMisura: null })).toEqual(['Perimetro regionale', 'Indicatore di output non valorizzato']);
    expect(badgeIntervento({ indicatoreOutput: 'O.20', unitaMisura: null })).toEqual(['Perimetro regionale', 'Indicatore di output O.20']);
    // senza la riga di TX-0017 (senza il grant, o intervento fuori dal report) il solo perimetro
    expect(badgeIntervento(undefined)).toEqual(['Perimetro regionale']);
  });

  it('KPI: il target da TX-0017 e le superfici della campagna piu recente da TX-0018, le sigle sciolte nel nome accessibile', () => {
    expect(campagnaDeiKpi(sra01)).toBe(2025);
    expect(kpi.map((k) => [k.chiave, k.etichetta, k.valore, k.nota])).toEqual([
      ['target', 'Target di fine periodo', '1500 ettari al 2029', 'TX-0017'],
      ['ds', 'Superficie ammissibile DS, campagna 2025', ettari(10.5), 'TX-0018, 1 domanda di sostegno'],
      ['dp', 'Superficie ammissibile DP, campagna 2025', ettari(10.2), 'TX-0018, 2 domande di pagamento'],
      ['oltre', 'Domande con DP oltre la DS, campagna 2025', '0', 'TX-0018, su 2 domande di pagamento: 0 %'],
    ]);
    // il nome accessibile contiene l'etichetta visibile (WCAG 2.5.3) e scioglie DS e DP
    expect(kpi.slice(1).map((k) => k.nomeAccessibile)).toEqual([
      'Superficie ammissibile DS, campagna 2025: superficie delle domande di sostegno',
      'Superficie ammissibile DP, campagna 2025: superficie delle domande di pagamento',
      'Domande con DP oltre la DS, campagna 2025: domande di pagamento con superficie oltre quella di sostegno',
    ]);
    expect(NOTA_CAMPAGNA_KPI).toMatch(/^Campagna di riferimento dei KPI delle superfici: la più recente/);
  });

  it('KPI: un intervento senza superfici ha i tre KPI non valorizzati, mai zero; un target assente detto in una frase', () => {
    expect(campagnaDeiKpi(srd01)).toBeNull();
    const senza = kpiIntervento(undefined, srd01);
    expect(senza.map((k) => [k.etichetta, k.valore, k.assente])).toEqual([
      ['Superficie ammissibile DS', undefined, SUPERFICI_NON_VALORIZZATE],
      ['Superficie ammissibile DP', undefined, SUPERFICI_NON_VALORIZZATE],
      ['Domande con DP oltre la DS', undefined, SUPERFICI_NON_VALORIZZATE],
    ]);
    expect(SUPERFICI_NON_VALORIZZATE).toBe('Non valorizzato: intervento non a superficie o non SIGC');
    const srg01 = OUTPUT.righe[3];
    expect(kpiIntervento(srg01, undefined)).toEqual([{ chiave: 'target', etichetta: 'Target di fine periodo', assente: 'Non valorizzato: il dato non è presente nella fonte', nota: 'TX-0017' }]);
    expect(kpiIntervento(undefined, undefined)).toEqual([]);
  });

  it('barra dei riferimenti: ultimo dato e perimetro della prima risposta arrivata; errore solo se tutte le letture lo sono', () => {
    const altri = [{ flusso: 'X', conclusoIl: '2026-01-01T00:00:00Z' }];
    expect(ultimiDelDettaglio(undefined, { ultimiDatiSincronizzati: ULTIMI }, { ultimiDatiSincronizzati: altri })).toBe(ULTIMI);
    expect(ultimiDelDettaglio(undefined, undefined, { ultimiDatiSincronizzati: altri })).toBe(altri);
    expect(ultimiDelDettaglio(undefined, undefined, undefined)).toBeUndefined();
    expect(perimetroDelDettaglio(undefined, { perimetro: 'REGIONALE' })).toBe('REGIONALE');
    expect(perimetroDelDettaglio()).toBeUndefined();
    expect(ultimoDatoInErrore([{ isError: true }, { isError: true }])).toBe(true);
    expect(ultimoDatoInErrore([{ isError: true }, { isError: false }])).toBe(false);
    expect(ultimoDatoInErrore([])).toBe(false);
  });

  it('schede nell ordine del wireframe, ognuna col grant della sua lettura; la scelta vale se visibile', () => {
    expect(schedeVisibili(() => true)).toEqual(['output', 'superfici', 'unitAmount']);
    expect(schedeVisibili((l) => l !== 'output')).toEqual(['superfici', 'unitAmount']);
    expect(schedeVisibili(() => false)).toEqual([]);
    expect(Object.values(TITOLI_SCHEDE)).toEqual(['Output per anno', 'Superfici per campagna', 'Unit Amount']);
    expect(schedaAttiva(['output', 'superfici', 'unitAmount'], 'unitAmount')).toBe('unitAmount');
    expect(schedaAttiva(['superfici'], 'unitAmount')).toBe('superfici');
    expect(schedaAttiva(['output', 'superfici'], null)).toBe('output');
    expect(schedaAttiva([], null)).toBeUndefined();
    expect([eIdScheda('unitAmount'), eIdScheda('importi'), eIdScheda(undefined)]).toEqual([true, false, false]);
  });

  it('intervento senza dati: il ritorno all output regionale, o al primo report che il profilo apre', () => {
    expect(SENZA_DATI).toBe("Nessun dato per questo intervento nei report del fisico (l'Assistenza tecnica AT001 non è nei report).");
    expect(ritornoSenzaDati(() => true)).toEqual({ percorso: '/fisico/output-regionale', testo: "Torna all'output regionale" });
    expect(ritornoSenzaDati((l) => l === 'superfici')).toEqual({ percorso: '/fisico/superfici', testo: 'Torna alle superfici ammissibili' });
    expect(ritornoSenzaDati((l) => l === 'unitAmount')).toEqual({ percorso: '/fisico/unit-amount', testo: 'Torna alle Unit Amount' });
    expect(ritornoSenzaDati(() => false)).toBeUndefined();
  });

  it('testi delle schede: titoli con l unita, oggetti dei file con l intervento, fonti, stati vuoti dichiarati', () => {
    expect(titoloOutputIntervento('ettari')).toBe('Output programmato e realizzato per anno (ettari)');
    expect(titoloOutputIntervento(null)).toBe('Output programmato e realizzato per anno');
    expect(GRAFICO_OUTPUT_INTERVENTO).toBe('il grafico Output programmato e realizzato per anno');
    expect(SOTTOTITOLO_OUTPUT_INTERVENTO).toMatch(/le barre non si sommano$/);
    expect(oggettoFileOutput('SRA01')).toBe("l'output e gli importi unitari dell'intervento SRA01");
    expect(fonteOutputIntervento('SRA01')).toContain("CSV e XLSX: l'export di TX-0017 con intervento = SRA01 (output per anno e importi unitari)");
    expect(SENZA_OUTPUT).toBe('Nessun output per questo intervento nel report.');
    expect([TITOLO_SUPERFICI_INTERVENTO, GRAFICO_SUPERFICI_INTERVENTO]).toEqual(['Superficie DS e DP per campagna (ettari)', 'il grafico Superficie DS e DP per campagna']);
    expect(SOTTOTITOLO_SUPERFICI_INTERVENTO).toMatch(/^Le superfici di campagne diverse non si sommano/);
    expect(oggettoFileSuperfici('SRA01')).toBe("le superfici dell'intervento SRA01");
    // la quantita' richiesta a premio, oggi sempre senza fonte (OP-FIS-04): detta una volta
    expect(fonteSuperficiIntervento(sra01)).toBe(
      "Fonte: TX-0018 con intervento = SRA01, tutte le campagne. Quantità richiesta a premio: non disponibile (fonte quantità richiesta a premio non attiva). PNG: l'immagine del grafico; CSV e XLSX: l'export di TX-0018 con intervento = SRA01 (una riga per campagna), registrato in AUDIT_ESPORTAZIONE.",
    );
    const conPremio = { ...sra01, campagne: [campagna(2024, { quantitaRichiestaPremio: { valore: 3, motivo: null, fonte: null } }), campagna(2025)] };
    expect(fonteSuperficiIntervento(conPremio)).toContain('Quantità richiesta a premio: 2025 non disponibile (fonte quantità richiesta a premio non attiva); 2024 3.');
    expect(SENZA_SUPERFICI_INTERVENTO).toMatch(/^Intervento senza superfici \(non a superficie o non SIGC/);
    expect(oggettoFileUnitAmount('SRD01')).toBe("le Unit Amount dell'intervento SRD01");
    expect(captionUnitAmountIntervento('SRD01')).toBe("Unit Amount dell'intervento SRD01 per esercizio e codice: importo unitario, output previsto, pagato e base storica");
    expect(fonteUnitAmountIntervento('SRD01')).toMatch(/^Fonte: TX-0030 con intervento = SRD01\./);
    expect(SENZA_UNIT_AMOUNT).toMatch(/^Intervento senza Unit Amount \(per esempio un intervento strutturale\)/);
  });

  it('superfici per campagna: la linea in ordine di campagna, la tabella equivalente coi sette dati dalla piu recente', () => {
    const g = graficoSuperficiDellIntervento(sra01);
    const o = prova(g.opzioni);
    expect(o.xAxis?.data).toEqual(['2024', '2025']);
    expect(o.series.map((s) => s.name)).toEqual(['Superficie DS', 'Superficie DP']);
    expect(n(o.aria?.label.description)).toBe('Linee della superficie DS e DP di SRA01 per campagna dal 2024 al 2025 (2 campagne), superfici in ettari: nel 2025 DS 10,50 ha e DP 10,20 ha.');
    expect(g.tabella.caption).toBe("Tabella equivalente: superfici dell'intervento SRA01 per campagna, dalla più recente");
    expect(g.tabella.colonne).toEqual(['Campagna', 'Domande di pagamento', 'Domande di sostegno', 'Superficie DS (ha)', 'Superficie DP (ha)', 'Differenza DP - DS (ha)', 'Domande con DP oltre la DS']);
    expect(g.tabella.righe).toEqual([
      ['2025', '2', '1', '10,50', '10,20', '-0,30', '0'],
      ['2024', '1', '1', '5,00', '6,00', '+1,00', '1'],
    ]);
    // senza superfici non si disegna, e lo dice
    const senza = graficoSuperficiDellIntervento(srd01);
    expect(senza.opzioni).toBeNull();
    expect(senza.tabella.righe).toEqual([]);
  });
});

describe('RA006: i link del dettaglio dell intervento (links dello uiplan, stessa feature)', () => {
  const stato = (roles: string[]) => ({ authenticated: true, user: { username: 'u', roles } });

  it('il dettaglio col codice nel percorso codificato; i tre report col solo filtro Intervento', () => {
    expect(percorsoIntervento('SRA01')).toBe('/fisico/interventi/SRA01');
    expect(percorsoIntervento('SR/..')).toBe('/fisico/interventi/SR%2F..');
    expect(outputDellIntervento('SRA01')).toBe('/fisico/output-regionale?intervento=SRA01');
    expect(superficiDellIntervento('SRA01')).toBe('/fisico/superfici?intervento=SRA01');
    expect(unitAmountDellIntervento('SRD01')).toBe('/fisico/unit-amount?intervento=SRD01');
    expect(criteriDellIntervento('SRA01')).toEqual({ intervento: ['SRA01'] });
  });

  it('il dettaglio si apre con almeno uno dei tre grant (visibility della route); in caricamento no', () => {
    expect(LETTURE_DETTAGLIO).toEqual(['output', 'superfici', 'unitAmount']);
    expect(GRANT_DETTAGLIO).toEqual(['csr.tx-0017.read', 'csr.tx-0018.read', 'csr.tx-0030.read']);
    expect(PERCORSI.interventi).toBe('/fisico/interventi');
    expect(puoAprireIntervento(stato(['csr.tx-0030.read']))).toBe(true);
    expect(puoAprireIntervento(stato(['csr.tx-0060.read', 'csr.tx-0016.read']))).toBe(false);
    expect(puoAprireIntervento(undefined)).toBe(false);
  });
});
