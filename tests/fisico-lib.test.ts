// Test L1 delle funzioni PURE del fisico (lib/): criteri nell'indirizzo, conti sulle superfici, testi, builder dei
// grafici, determine, grant e pagine. Chiamate dirette, niente render; i dati sono quelli degli scenari del backend.
import type { EChartsOption } from 'echarts';
import { describe, expect, it } from 'vitest';
import { COLORI, valoreEttari } from '../src/shared/lib';
import { criteriAttivi, criteriDaRicerca, campagnaDaTesto, conCampagna, conFiltriDelProgramma, ricercaDaCriteri, soloIntervento, testiCriteri } from '../src/features/fisico/lib/criteri';
import {
  campagnaDi,
  campagnaDiRiferimento,
  campagnePresenti,
  esitoSuperfici,
  interventiDelleRighe,
  quotaDpOltreDs,
  righeTabella,
  senzaSuperfici,
  totaliCampagna,
  totaliPerCampagna,
} from '../src/features/fisico/lib/superfici';
import { SENZA_SUPERFICI, cellaDifferenza, cellaSuperficie, testoDifferenza, testoNonInCampagna, testoQuantitaPremio, testoQuotaOltreDs, testoSuperficie } from '../src/features/fisico/lib/formato';
import { MOTIVO_CON_CAMPAGNA, graficoInterventoPerCampagna, graficoPerCampagna, graficoPerIntervento, graficoVerifica, lineePerCampagna } from '../src/features/fisico/lib/grafici';
import {
  MAX_CIFRE,
  badgeDetermine,
  codiceDaCercare,
  codiceDalPercorso,
  eCorrente,
  fonteDi,
  percorsoDetermine,
  percorsoSchedaDellaDomanda,
  siNo,
  soloCifre,
  sopratitoloDetermine,
  testoDetermina,
  testoTipoDomanda,
  titoloDetermine,
} from '../src/features/fisico/lib/determine';
import { GRANT, puoLeggere } from '../src/features/fisico/lib/grant';
import { PAGINE_FISICO, PERCORSI, pagineVisibili } from '../src/features/fisico/lib/pagine';
import { DETERMINE, DETERMINE_CHIUSA, DETERMINE_NESSUNA, SUPERFICI, SUPERFICI_SENZA, SUPERFICI_TRE } from '../src/features/fisico/testing/fixture';

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
    expect(senzaSuperfici(SUPERFICI_TRE.righe, 2025)).toEqual([
      { codice: 'SRA29', motivo: 'nessuna-campagna' },
      { codice: 'SRB03', motivo: 'non-in-campagna' },
    ]);
  });

  it('righe della tabella: una per intervento e campagna; l intervento senza superfici ha una riga sola', () => {
    const righe = righeTabella(SUPERFICI.righe);
    expect(righe.map((r) => [r.chiave, r.campagna?.anno ?? null, r.motivo])).toEqual([
      ['SRA29', null, 'NON_VALORIZZATO'],
      ['SRB01:2024', 2024, null],
      ['SRB01:2025', 2025, null],
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
  it('superfici e differenze col segno', () => {
    expect(n(testoSuperficie(15.5))).toBe('15,50 ha');
    expect(n(testoSuperficie(-1))).toBe('-1,00 ha');
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
    expect(n(testoQuotaOltreDs(3, 33.3))).toBe('su 3 domande di pagamento: 33,3 %');
    expect(n(testoQuotaOltreDs(1, 100))).toBe('su 1 domanda di pagamento: 100 %');
    expect(testoQuotaOltreDs(0, null)).toBe('nessuna domanda di pagamento');
  });
});

describe('RF018: grafici delle superfici (tabella equivalente, omessi dichiarati)', () => {
  it('barre DS e DP per intervento nella campagna: SRA29 omesso e dichiarato, in ettari', () => {
    const g = graficoPerIntervento(SUPERFICI.righe, 2025);
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
    const g = graficoPerIntervento(SUPERFICI_SENZA.righe, 2023);
    expect(g.opzioni).toBeNull();
    expect(g.motivoAssenza).toBe('nessun intervento con superfici nella campagna 2023');
    expect(g.tabella.righe).toHaveLength(2);
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
    const o = prova(graficoInterventoPerCampagna(SUPERFICI.righe[1]).opzioni);
    expect(n(o.aria?.label.description)).toContain('Linee della superficie DS e DP di SRB01 per campagna dal 2024 al 2025');
    expect(graficoInterventoPerCampagna(SUPERFICI.righe[0]).opzioni).toBeNull();
  });

  it('verifica incrociata: barre dalla differenza maggiore, zero al centro, segno nel testo e colore per verso', () => {
    const g = graficoVerifica(SUPERFICI_TRE.righe, 2025);
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
    expect(graficoVerifica(SUPERFICI_SENZA.righe, 2023).opzioni).toBeNull();
  });
});

describe('RF020: determine di una domanda (codice, link e testi)', () => {
  it('codice del percorso: assente, valido o non valido (nessuna lettura)', () => {
    expect(codiceDalPercorso(undefined)).toEqual({ stato: 'assente' });
    expect(codiceDalPercorso('')).toEqual({ stato: 'assente' });
    expect(codiceDalPercorso('54810769585')).toEqual({ stato: 'valido', codice: '54810769585' });
    expect(codiceDalPercorso('5481A')).toEqual({ stato: 'non-valido' });
  });

  it('modulo di ricerca: le sole cifre, almeno una e al piu 30', () => {
    expect(soloCifre(' 5481-0769 585 ')).toBe('54810769585');
    expect(codiceDaCercare(' 5481 0769585')).toEqual({ codice: '54810769585' });
    expect(codiceDaCercare('abc')).toEqual({ errore: 'Scrivi il codice a barre della domanda: contano solo le cifre.' });
    expect(codiceDaCercare('1'.repeat(MAX_CIFRE + 1))).toEqual({ errore: 'Il codice a barre ha al più 30 cifre: ne hai scritte 31.' });
  });

  it('link cerca-domanda (stessa route) e scheda-domanda (elenco operativo, col grant e domanda non chiusa)', () => {
    expect(percorsoDetermine()).toBe('/fisico/determine');
    expect(percorsoDetermine('54810769585')).toBe('/fisico/determine/54810769585');
    expect(percorsoSchedaDellaDomanda(DETERMINE, true)).toBe('/elenco-operativo/domande/PAGAMENTO/54810769585');
    expect(percorsoSchedaDellaDomanda(DETERMINE, false)).toBeNull();
    expect(percorsoSchedaDellaDomanda(DETERMINE_CHIUSA, true)).toBeNull();
  });

  it('testata: tipo, corrente o chiusa, numero di determine', () => {
    expect(testoTipoDomanda('SOSTEGNO')).toBe('Domanda di sostegno');
    expect(badgeDetermine(DETERMINE)).toEqual(['Domanda di pagamento', 'Domanda corrente', '3 determine con riga aperta']);
    expect(badgeDetermine(DETERMINE_CHIUSA)).toEqual(['Domanda di pagamento', 'Domanda chiusa: non è più nelle fonti SIAN', '1 determina con riga aperta']);
    expect(sopratitoloDetermine(DETERMINE)).toBe('Domanda di pagamento 54810769585 - fonte delle informazioni');
    expect(titoloDetermine('54810769585')).toBe('Determine della domanda 54810769585');
  });

  it('determina corrente, fonti dei campi (la piu recente che li valorizza) e si/no in testo', () => {
    expect(DETERMINE.elenco.map((d) => eCorrente(d, DETERMINE.corrente))).toEqual([true, false, false]);
    expect(eCorrente(DETERMINE.elenco[0], DETERMINE_NESSUNA.corrente)).toBe(false);
    expect(fonteDi(DETERMINE.elenco, 'fonteStatoAreaProgrammazione')?.codice).toBe('G00001');
    expect(fonteDi(DETERMINE.elenco, 'fonteComparto')?.codice).toBe('G00002');
    expect(fonteDi(DETERMINE_NESSUNA.elenco, 'fonteComparto')).toBeUndefined();
    expect(testoDetermina(DETERMINE.elenco[0])).toBe('G00003 del 30/06/2025');
    expect(siNo(true, 'sì, corrente')).toBe('sì, corrente');
    expect(siNo(false)).toBe('no');
  });
});

describe('grant e pagine del fisico (gate di UX)', () => {
  const stato = (roles: string[]) => ({ authenticated: true, user: { username: 'u', roles } });

  it('grant verbatim dal catalogo; senza stato nessuna lettura', () => {
    expect(GRANT).toEqual({ superfici: 'csr.tx-0018.read', determine: 'csr.tx-0020.read', filtri: 'csr.tx-0060.read', schedaDomanda: 'csr.tx-0058.read' });
    expect(puoLeggere(stato(['csr.tx-0018.read']), 'superfici')).toBe(true);
    expect(puoLeggere(stato(['csr.tx-0018.read']), 'filtri')).toBe(false);
    expect(puoLeggere(undefined, 'determine')).toBe(false);
  });

  it('pagine visibili per grant, nell ordine del menu', () => {
    expect(pagineVisibili((g) => g === GRANT.determine).map((p) => p.percorso)).toEqual([PERCORSI.determine]);
    expect(pagineVisibili(() => true).map((p) => p.voceMenu)).toEqual(['Superfici ammissibili', 'Determine di una domanda']);
    expect(PAGINE_FISICO.map((p) => p.grant)).toEqual([GRANT.superfici, GRANT.determine]);
  });
});
