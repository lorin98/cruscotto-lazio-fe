import { describe, expect, it } from 'vitest';
import { formatEuro, formatPercentuale } from '../src/shared/lib';
import { descriviImporto, etichettaFonte } from '../src/entities/importo';
import {
  MAX_VALORI_FILTRO,
  anniSelezionabili,
  etichettaFaseRiserva,
  etichettaPerimetro,
  filtriDaRicerca,
  isAnnoValido,
  ricercaDaFiltri,
  senzaAzioneSeNonDisponibile,
  valoreFiltroValido,
} from '../src/features/finanziario/lib/filtri';
import {
  annoDiRaccolta,
  annoOpzionale,
  euroOpzionale,
  numeroOpzionale,
  percentualeOpzionale,
  siNo,
  testoOpzionale,
} from '../src/features/finanziario/lib/formato';
import { daPer, reportVisibili, ritornoValido, titoloH1, voceDi } from '../src/features/finanziario/lib/report';
import { etichettaFlusso, testoUltimiDati } from '../src/features/finanziario/lib/aggiornamento';
import { inizioFase, istantaneaAnteriore, testoCongelato, testoResiduo, utilizzoOltreRiserva } from '../src/features/finanziario/lib/riserva';

// gli spazi del formato it-IT sono non separabili: si confronta con spazi normali
const n = (s: string) => s.replace(/\s/g, ' ');

describe('formattatori di importi', () => {
  it('formatEuro: euro al centesimo, trattino se assente', () => {
    expect(n(formatEuro(3000000))).toBe('3.000.000,00 €');
    expect(n(formatEuro(0.5))).toBe('0,50 €');
    expect(formatEuro(null)).toBe('-');
    expect(formatEuro(undefined)).toBe('-');
  });
  it('formatPercentuale: al piu due decimali', () => {
    expect(formatPercentuale(12.5)).toBe('12,5 %');
    expect(formatPercentuale(33.3333)).toBe('33,33 %');
    expect(formatPercentuale(null)).toBe('-');
  });
});

describe('resa dell Importo (mai uno zero al posto di un dato assente)', () => {
  it('valore presente', () => {
    const r = descriviImporto({ valore: 1221000, motivo: null, fonte: null });
    expect(r.disponibile).toBe(true);
    expect(n(r.testo)).toBe('1.221.000,00 €');
  });
  it('valore zero e un valore, non un assente', () => {
    expect(descriviImporto({ valore: 0 }).disponibile).toBe(true);
  });
  it('FONTE_NON_ATTIVA con la fonte attesa', () => {
    expect(descriviImporto({ valore: null, motivo: 'FONTE_NON_ATTIVA', fonte: 'IMPEGNI' })).toEqual({
      disponibile: false,
      testo: 'non disponibile',
      nota: 'fonte impegni non attiva',
    });
  });
  it('NON_VALORIZZATO: nella fonte per un dato singolo, non calcolabile per un totale', () => {
    expect(descriviImporto({ valore: null, motivo: 'NON_VALORIZZATO' }).testo).toBe('non valorizzato');
    const totale = descriviImporto({ valore: null, motivo: 'NON_VALORIZZATO' }, true);
    expect(totale.testo).toBe('non calcolabile');
    expect(totale.nota).toMatch(/almeno un intervento della selezione/);
    expect(descriviImporto({ valore: null, motivo: 'FUORI_PERIMETRO' }).testo).toBe('fuori perimetro');
  });
  it('importo assente o motivo sconosciuto', () => {
    expect(descriviImporto(undefined)).toEqual({ disponibile: false, testo: 'non disponibile' });
    expect(descriviImporto({ valore: null, motivo: 'ALTRO' }).disponibile).toBe(false);
  });
  it('etichettaFonte: tutti i codici FonteAttesa del backend, sconosciuta, assente', () => {
    expect(etichettaFonte('QUADRO_SINOTTICO')).toBe('quadro sinottico');
    expect(etichettaFonte('REGOLA_N2')).toBe('regola n+2 e vincolo di pagamento entro ottobre');
    expect(etichettaFonte('CSR_CON_SGR')).toBe('CSR con SGR');
    expect(etichettaFonte('NUOVA_FONTE')).toBe('NUOVA_FONTE');
    expect(etichettaFonte(null)).toBe('non indicata');
  });
});

describe('filtri di RF001 nell indirizzo della pagina', () => {
  it('filtriDaRicerca: chiavi note, valori ripetuti, vuoti e duplicati scartati', () => {
    expect(filtriDaRicerca('intervento=SRA01&intervento=SRA03&os=SO1&x=1&og=&intervento=SRA01')).toEqual({
      intervento: ['SRA01', 'SRA03'],
      os: ['SO1'],
    });
    expect(filtriDaRicerca('')).toEqual({});
  });
  it('valori fuori formato scartati (niente testo arbitrario in pagina): OG e OP solo come codici', () => {
    expect(filtriDaRicerca('intervento=<script>&os=OS-AKIS&op=OP1, OP2&op=OP4&azione=abc&og=OG1&og=Chiama 06-123')).toEqual({
      os: ['OS-AKIS'],
      og: ['OG1'],
      op: ['OP4'],
    });
    expect(valoreFiltroValido('intervento', 'sra01')).toBe(false);
    expect(valoreFiltroValido('azione', '3')).toBe(true);
  });
  it('al piu MAX_VALORI_FILTRO valori per chiave, come il backend', () => {
    const tanti = Array.from({ length: 120 }, (_, i) => `azione=${i + 1}`).join('&');
    expect(filtriDaRicerca(tanti).azione).toHaveLength(MAX_VALORI_FILTRO);
  });
  it('ricercaDaFiltri: formato del backend, ordine stabile delle chiavi', () => {
    expect(ricercaDaFiltri({ os: ['SO1'], intervento: ['SRA01', 'SRA03'] })).toBe('intervento=SRA01&intervento=SRA03&os=SO1');
    expect(ricercaDaFiltri({})).toBe('');
  });
  it('andata e ritorno', () => {
    const f = { intervento: ['SRA01'], op: ['OP2', 'OP4'], azione: ['3'] };
    expect(filtriDaRicerca(ricercaDaFiltri(f))).toEqual(f);
  });
  it('senzaAzioneSeNonDisponibile', () => {
    expect(senzaAzioneSeNonDisponibile({ azione: ['1'], os: ['OS4'] }, false)).toEqual({ os: ['OS4'] });
    expect(senzaAzioneSeNonDisponibile({ azione: ['1'] }, true)).toEqual({ azione: ['1'] });
    const senza = { os: ['OS4'] };
    expect(senzaAzioneSeNonDisponibile(senza, false)).toBe(senza);
  });
});

describe('etichette e anni', () => {
  it('etichettaPerimetro', () => {
    expect(etichettaPerimetro('REGIONALE')).toMatch(/^Regionale/);
    expect(etichettaPerimetro('ADA')).toMatch(/ADA/);
    expect(etichettaPerimetro(undefined)).toBe('non indicato');
  });
  it('etichettaFaseRiserva con le date dell anno n', () => {
    expect(etichettaFaseRiserva('NON_INIZIATA', 2025)).toBe("non iniziata (l'accumulo parte il 1/10/2025)");
    expect(etichettaFaseRiserva('ACCUMULO', 2025)).toBe('accumulo (dal 1/10/2025 al 30/6/2026)');
    expect(etichettaFaseRiserva('UTILIZZO', 2025)).toBe('utilizzo (fino al 31/12/2026)');
    expect(etichettaFaseRiserva('RESIDUO', 2025)).toBe('residuo (2% del montante, dal 1/1/2027)');
    expect(etichettaFaseRiserva(null, 2025)).toBe('non disponibile');
  });
  it('isAnnoValido: intero 2000-2100', () => {
    expect(isAnnoValido(2025)).toBe(true);
    expect(isAnnoValido(2000)).toBe(true);
    expect(isAnnoValido(2101)).toBe(false);
    expect(isAnnoValido(2025.5)).toBe(false);
    expect(isAnnoValido(undefined)).toBe(false);
  });
  it('anniSelezionabili: riserva fino al 2029, esercizio fino al 2030, anno corrente valido sempre presente', () => {
    expect(anniSelezionabili('riserva')).toEqual([2023, 2024, 2025, 2026, 2027, 2028, 2029]);
    expect(anniSelezionabili('esercizio').at(-1)).toBe(2030);
    expect(anniSelezionabili('riserva', 2031).at(-1)).toBe(2031);
    expect(anniSelezionabili('riserva', 2025)).toHaveLength(7);
    expect(anniSelezionabili('riserva', 1999)).toHaveLength(7);
  });
});

describe('formato dei campi facoltativi', () => {
  it('assenti come "non disponibile", mai zero o cella vuota', () => {
    expect(testoOpzionale(null)).toBe('non disponibile');
    expect(testoOpzionale('  ')).toBe('non disponibile');
    expect(testoOpzionale('O.14')).toBe('O.14');
    expect(siNo(true)).toBe('sì');
    expect(siNo(false)).toBe('no');
    expect(siNo(undefined)).toBe('non disponibile');
    expect(numeroOpzionale(null)).toBe('non disponibile');
    expect(numeroOpzionale(0)).toBe('0');
    expect(euroOpzionale(null)).toBe('non disponibile');
    expect(n(euroOpzionale(10))).toBe('10,00 €');
    expect(percentualeOpzionale(undefined)).toBe('non disponibile');
    expect(percentualeOpzionale(12.5)).toBe('12,5 %');
  });
  it('anni: senza separatore delle migliaia, "senza campagna" per l anno di raccolta assente', () => {
    expect(annoDiRaccolta(null)).toBe('senza campagna');
    expect(annoDiRaccolta(2024)).toBe('2024');
    expect(annoOpzionale(2024)).toBe('2024');
    expect(annoOpzionale(null)).toBe('non disponibile');
  });
});

describe('ultimo dato sincronizzato (NFR-25 b, OP-FE-04)', () => {
  it('etichetta leggibile del flusso: PROSA_DS04 -> PROSA DS-04, gli altri codici restano', () => {
    expect(etichettaFlusso('PROSA_DS04')).toBe('PROSA DS-04');
    expect(etichettaFlusso('SIAN_DS01')).toBe('SIAN DS-01');
    expect(etichettaFlusso('DS-12')).toBe('DS-12');
    expect(etichettaFlusso('ALTRO')).toBe('ALTRO');
  });
  it('una voce per flusso con data e ora italiane, nell ordine del backend', () => {
    expect(
      testoUltimiDati([
        { flusso: 'DS-12', conclusoIl: '2026-03-02T09:15:00Z' },
        { flusso: 'PROSA_DS04', conclusoIl: '2026-03-03T08:30:00Z' },
      ]),
    ).toBe('DS-12 02/03/2026 10:15; PROSA DS-04 03/03/2026 09:30');
  });
  it('senza acquisizioni concluse lo dice come l intestazione degli export; le voci incomplete non contano', () => {
    expect(testoUltimiDati([])).toBe('nessuna acquisizione conclusa');
    expect(testoUltimiDati([{ flusso: 'DS-12' }, { conclusoIl: '2026-03-02T09:15:00Z' }])).toBe('nessuna acquisizione conclusa');
  });
});

describe('catalogo dei report', () => {
  it('voceDi, titoloH1', () => {
    expect(voceDi('/finanziario')?.titolo).toBe('Filtri dei report');
    expect(voceDi('/finanziario/sigc')?.grant).toEqual(['csr.tx-0012.read', 'csr.tx-0013.read']);
    expect(voceDi('/altro')).toBeUndefined();
    expect(titoloH1('Riserva al 5% (SIGC)')).toBe('Finanziario: riserva al 5% (SIGC)');
  });
  it('reportVisibili: basta uno dei grant della pagina', () => {
    expect(reportVisibili((g) => g === 'csr.tx-0003.read').map((r) => r.percorso)).toEqual(['/finanziario/dotazione']);
    expect(reportVisibili(() => false)).toEqual([]);
  });
  it('ritornoValido: solo percorsi del catalogo e parametri anno/esercizio interi (niente open-redirect)', () => {
    const r = ritornoValido('/finanziario/sigc/riserva?anno=2025&x=1&esercizio=abc');
    expect(r?.percorso).toBe('/finanziario/sigc/riserva');
    expect(r?.parametri.toString()).toBe('anno=2025');
    expect(ritornoValido('https://altro.example/finanziario/riepilogo')).toBeUndefined();
    expect(ritornoValido('//altro.example')).toBeUndefined();
    expect(ritornoValido('/finanziario/inesistente')).toBeUndefined();
    expect(ritornoValido(null)).toBeUndefined();
  });
  it('daPer: tiene solo i parametri di pagina', () => {
    expect(daPer('/finanziario/sigc/verifica-smp', '?intervento=SRA01&esercizio=2025')).toBe('/finanziario/sigc/verifica-smp?esercizio=2025');
    expect(daPer('/finanziario/riepilogo', '?intervento=SRA01')).toBe('/finanziario/riepilogo');
  });
});

describe('riserva: fase di oggi, importi dell istantanea', () => {
  it('inizioFase e istantaneaAnteriore', () => {
    expect(inizioFase('ACCUMULO', 2025)).toBe('2025-10-01');
    expect(inizioFase('UTILIZZO', 2025)).toBe('2026-07-01');
    expect(inizioFase('RESIDUO', 2025)).toBe('2027-01-01');
    expect(inizioFase('NON_INIZIATA', 2025)).toBeNull();
    expect(istantaneaAnteriore('RESIDUO', 2025, '2026-12-31')).toBe(true);
    expect(istantaneaAnteriore('RESIDUO', 2025, '2027-01-02')).toBe(false);
    expect(istantaneaAnteriore('NON_INIZIATA', 2025, '2025-01-01')).toBe(false);
    expect(istantaneaAnteriore('ACCUMULO', 2025, null)).toBe(false);
  });
  it('testoCongelato e testoResiduo', () => {
    expect(testoCongelato(null, 2025, null)).toBe("non ancora congelato nell'istantanea: si congela al 30/6/2026");
    expect(n(testoCongelato(500, 2025, '2026-12-31'))).toBe('500,00 €');
    expect(testoResiduo(null, 2025, null, '2026-05-01')).toBe("non ancora calcolato nell'istantanea: si calcola al congelamento del 30/6/2026");
    expect(n(testoResiduo(200, 2025, '2026-09-30', '2026-10-08'))).toBe(
      '200,00 € previsto: disponibile dal 1/1/2027 se la riserva non è utilizzata completamente entro il 31/12/2026',
    );
    expect(n(testoResiduo(200, 2025, '2026-12-31', '2027-01-01'))).toBe('200,00 €');
  });
  it('utilizzoOltreRiserva: confronto con il congelato, o con l accumulato prima del congelamento', () => {
    expect(utilizzoOltreRiserva({ importoUtilizzato: 300, importoCongelato: 500 })).toBe(false);
    expect(utilizzoOltreRiserva({ importoUtilizzato: 600, importoCongelato: null, importoAccumulato: 500 })).toBe(true);
    expect(utilizzoOltreRiserva({ importoUtilizzato: null, importoCongelato: 500 })).toBe(false);
    expect(utilizzoOltreRiserva({ importoUtilizzato: 10 })).toBe(false);
  });
});
