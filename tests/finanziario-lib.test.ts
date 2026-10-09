import { describe, expect, it } from 'vitest';
import routeTable from '../src/app/route-table.json';
import { ariaSort, conColonna, didascalia, formatDate, formatEuro, formatPercentuale, versoSuccessivo } from '../src/shared/lib';
import { descriviImporto, etichettaFonte } from '../src/entities/importo';
import {
  CHIAVI_FILTRO,
  ETICHETTE_FILTRO,
  MAX_VALORI_FILTRO,
  PARAMETRI_DI_PAGINA,
  anniSelezionabili,
  filtriAttivi,
  filtriDaRicerca,
  isAnnoValido,
  ricercaConParametri,
  ricercaDaFiltri,
  senzaAzioneSeNonDisponibile,
  senzaValore,
  valoreFiltroValido,
} from '../src/features/finanziario/lib/filtri';
import type { Filtri } from '../src/features/finanziario/lib/filtri';
import { PERIMETRO_ADA, etichettaDiProgramma, etichettaPerimetro, perimetroBreve, perimetroCombinato } from '../src/features/finanziario/lib/perimetro';
import {
  annoDiRaccolta,
  annoOpzionale,
  euroOpzionale,
  numeroOpzionale,
  percentualeOpzionale,
  siNo,
  testoOpzionale,
} from '../src/features/finanziario/lib/formato';
import {
  DETTAGLIO_INTERVENTO,
  GRANT,
  PAGINE_FINANZIARIO,
  PERCORSI,
  codiceDaRicerca,
  codiceInterventoValido,
  conFiltri,
  pagineVisibili,
  percorsoIntervento,
  titoloH1,
  voceDi,
} from '../src/features/finanziario/lib/report';
import { etichettaFlusso, menoRecente, testoUltimiDati } from '../src/features/finanziario/lib/aggiornamento';
import {
  aiutoRiserva,
  calendarioRiserva,
  dataBreve,
  etichettaFaseRiserva,
  inizioFase,
  istantaneaAnteriore,
  kpiRiserva,
  testoCongelato,
  testoResiduo,
  utilizzoOltreRiserva,
} from '../src/features/finanziario/lib/riserva';
import type { FaseRiserva } from '../src/features/finanziario/lib/riserva';

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

describe('formatDate', () => {
  it('una data AAAA-MM-GG senza ora si rende cosi com e, senza passare dal fuso orario', () => {
    expect(formatDate('2026-06-30')).toBe('30/06/2026');
    expect(formatDate('2025-12-31')).toBe('31/12/2025');
    // a ovest di Greenwich new Date('2026-01-01') e' ancora il 31/12/2025 locale: la data non deve slittare
    const fuso = process.env.TZ;
    try {
      process.env.TZ = 'America/New_York';
      expect(formatDate('2026-01-01')).toBe('01/01/2026');
      expect(formatDate('2026-10-01')).toBe('01/10/2026');
    } finally {
      if (fuso === undefined) delete process.env.TZ;
      else process.env.TZ = fuso;
    }
  });
  it('vuota, assente o non leggibile: stringa vuota o il testo grezzo, mai un errore', () => {
    expect(formatDate('')).toBe('');
    expect(formatDate(null)).toBe('');
    expect(formatDate(undefined)).toBe('');
    expect(formatDate('non una data')).toBe('non una data');
  });
  it('un istante con l ora: data a quattro cifre per l anno', () => {
    expect(formatDate('2026-06-15T12:00:00Z')).toBe('15/06/2026');
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

describe('chip dei filtri e parametri di pagina', () => {
  it('ETICHETTE_FILTRO: forma breve per la barra, estesa per il pannello, per ogni chiave', () => {
    expect(Object.keys(ETICHETTE_FILTRO).sort()).toEqual([...CHIAVI_FILTRO].sort());
    expect(ETICHETTE_FILTRO.os).toEqual({ breve: 'OS', estesa: 'Obiettivo specifico (OS)' });
    expect(ETICHETTE_FILTRO.azione.breve).toBe('Azione portante');
  });
  it('filtriAttivi: un chip per valore, nell ordine delle chiavi, con l etichetta breve', () => {
    expect(filtriAttivi({ os: ['OS4'], intervento: ['SRA01', 'SRA03'] })).toEqual([
      { chiave: 'intervento', valore: 'SRA01', etichetta: 'Intervento' },
      { chiave: 'intervento', valore: 'SRA03', etichetta: 'Intervento' },
      { chiave: 'os', valore: 'OS4', etichetta: 'OS' },
    ]);
    expect(filtriAttivi({})).toEqual([]);
    expect(filtriAttivi({ og: [] })).toEqual([]);
  });
  it('senzaValore: toglie un chip; la chiave rimasta senza valori sparisce; l originale non cambia', () => {
    const filtri: Filtri = { intervento: ['SRA01', 'SRA03'], os: ['OS4'] };
    expect(senzaValore(filtri, 'intervento', 'SRA01')).toEqual({ intervento: ['SRA03'], os: ['OS4'] });
    const senzaOs = senzaValore(filtri, 'os', 'OS4');
    expect(senzaOs).toEqual({ intervento: ['SRA01', 'SRA03'] });
    expect(senzaOs).not.toHaveProperty('os');
    expect(senzaValore(filtri, 'op', 'OP1')).toEqual(filtri);
    expect(filtri).toEqual({ intervento: ['SRA01', 'SRA03'], os: ['OS4'] });
  });
  it('ricercaConParametri: i filtri nuovi e i parametri di pagina della ricerca corrente (anno, esercizio)', () => {
    expect(PARAMETRI_DI_PAGINA).toEqual(['anno', 'esercizio']);
    expect(ricercaConParametri('anno=2025&intervento=SRA01&x=1', { os: ['OS4'] })).toBe('os=OS4&anno=2025');
    expect(ricercaConParametri('?esercizio=2026&anno=2025', { intervento: ['SRA01'] })).toBe('intervento=SRA01&anno=2025&esercizio=2026');
    expect(ricercaConParametri('intervento=SRA01', {})).toBe('');
    expect(ricercaConParametri('', { intervento: ['SRA01'] })).toBe('intervento=SRA01');
    expect(ricercaConParametri('anno=2025', {})).toBe('anno=2025');
    expect(ricercaConParametri('anno=&esercizio=', {})).toBe('');
  });
});

describe('etichette e anni', () => {
  it('etichettaPerimetro e perimetroBreve', () => {
    expect(etichettaPerimetro('REGIONALE')).toMatch(/^Regionale/);
    expect(etichettaPerimetro('ADA')).toMatch(/ADA/);
    expect(etichettaPerimetro(undefined)).toBe('non indicato');
    expect(perimetroBreve('ADA')).toBe('la tua area (ADA)');
    expect(perimetroBreve('REGIONALE')).toBe('regionale');
  });
  it('etichettaFaseRiserva con le date dell anno n', () => {
    expect(etichettaFaseRiserva('NON_INIZIATA', 2025)).toBe("non iniziata (l'accumulo parte il 1/10/2025)");
    expect(etichettaFaseRiserva('ACCUMULO', 2025)).toBe('accumulo (dal 1/10/2025 al 30/6/2026)');
    expect(etichettaFaseRiserva('UTILIZZO', 2025)).toBe('utilizzo (fino al 31/12/2026)');
    expect(etichettaFaseRiserva('RESIDUO', 2025)).toBe('residuo (2% del montante, dal 1/1/2027)');
    expect(etichettaFaseRiserva(null, 2025)).toBe('non disponibile');
  });
  it('etichettaFaseRiserva: una fase che il contratto non conosce resta "non disponibile", anche un nome del prototipo', () => {
    expect(etichettaFaseRiserva('SOSPESA' as FaseRiserva, 2025)).toBe('non disponibile');
    expect(etichettaFaseRiserva('toString' as FaseRiserva, 2025)).toBe('non disponibile');
    expect(etichettaFaseRiserva(undefined, 2025)).toBe('non disponibile');
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
  it('menoRecente (X-07): l istante meno recente fra le voci complete, la data fino a cui tutti i flussi sono aggiornati, indipendente dall ordine', () => {
    const voci = [
      { flusso: 'PROSA_DS04', conclusoIl: '2026-03-03T08:30:00Z' },
      { flusso: 'DS-12', conclusoIl: '2026-03-02T09:15:00Z' },
      // senza flusso non conta, anche se e' la piu' vecchia
      { conclusoIl: '2020-01-01T00:00:00Z' },
    ];
    expect(menoRecente(voci)).toBe('2026-03-02T09:15:00Z');
    expect(menoRecente([...voci].reverse())).toBe('2026-03-02T09:15:00Z');
    expect(menoRecente([{ flusso: 'DS-12', conclusoIl: '2026-03-02T09:15:00Z' }])).toBe('2026-03-02T09:15:00Z');
    expect(menoRecente([])).toBeUndefined();
    expect(menoRecente([{ flusso: 'DS-12' }])).toBeUndefined();
  });
  it('menoRecente: microsecondi del backend troncati nel confronto, date illeggibili scartate, la voce resta com e', () => {
    expect(
      menoRecente([
        { flusso: 'DS-12', conclusoIl: '2026-03-02T09:15:00.000999Z' },
        { flusso: 'PROSA_DS04', conclusoIl: '2026-03-02T09:14:59.999999Z' },
      ]),
    ).toBe('2026-03-02T09:14:59.999999Z');
    // stesso millisecondo dopo il troncamento: vale la prima voce
    expect(
      menoRecente([
        { flusso: 'DS-12', conclusoIl: '2026-03-02T09:15:00.123999Z' },
        { flusso: 'PROSA_DS04', conclusoIl: '2026-03-02T09:15:00.123001Z' },
      ]),
    ).toBe('2026-03-02T09:15:00.123999Z');
    expect(menoRecente([{ flusso: 'DS-12', conclusoIl: 'ieri' }, { flusso: 'PROSA_DS04', conclusoIl: '2026-03-03T08:30:00Z' }])).toBe('2026-03-03T08:30:00Z');
    expect(menoRecente([{ flusso: 'DS-12', conclusoIl: 'ieri' }])).toBeUndefined();
  });
});

describe('catalogo delle pagine (UI v2)', () => {
  it('voceDi, titoloH1: la panoramica apre il menu, il dettaglio non e una voce di menu', () => {
    expect(voceDi('/finanziario')?.titolo).toBe('Panoramica');
    expect(voceDi('/finanziario/sigc')?.grant).toEqual(['csr.tx-0012.read', 'csr.tx-0013.read']);
    expect(voceDi(DETTAGLIO_INTERVENTO.percorso)?.titolo).toBe("Dettaglio dell'intervento");
    expect(PAGINE_FINANZIARIO.map((p) => p.percorso)).not.toContain(DETTAGLIO_INTERVENTO.percorso);
    expect(PAGINE_FINANZIARIO[0].percorso).toBe('/finanziario');
    expect(voceDi('/altro')).toBeUndefined();
    expect(titoloH1('Riserva di efficacia (5%)')).toBe('Finanziario: riserva di efficacia (5%)');
  });
  it('titoli nuovi dei wireframe approvati: riserva di efficacia e verifica SMP (le sigle restano maiuscole)', () => {
    const riserva = voceDi(PERCORSI.riserva);
    expect(riserva?.titolo).toBe('Riserva di efficacia (5%)');
    expect(riserva?.voceMenu).toBe('Riserva di efficacia');
    const smp = voceDi(PERCORSI.verificaSmp);
    expect(smp?.titolo).toBe('Verifica SMP');
    expect(smp?.voceMenu).toBe('Verifica SMP');
    expect(titoloH1('Verifica SMP')).toBe('Finanziario: verifica SMP');
  });
  it('ogni pagina del menu ha la voce e il sottotitolo; il dettaglio non ha sottotitolo', () => {
    for (const p of PAGINE_FINANZIARIO) {
      expect(p.voceMenu.trim().length, p.percorso).toBeGreaterThan(0);
      expect(p.sottotitolo?.trim().length ?? 0, p.percorso).toBeGreaterThan(0);
    }
    expect(DETTAGLIO_INTERVENTO.sottotitolo).toBeUndefined();
  });
  it('GRANT: gli stessi grant della route-table, uno per transazione da TX-0001 a TX-0015', () => {
    const daTabella = new Set(routeTable.routes.flatMap((r) => r.actions.map((a) => a.grant)));
    expect([...daTabella].sort()).toEqual(Object.values(GRANT).sort());
    expect(Object.values(GRANT)).toEqual(Array.from({ length: 15 }, (_, k) => `csr.tx-${String(k + 1).padStart(4, '0')}.read`));
    // ogni azione della route-table usa il grant della sua transazione
    for (const a of routeTable.routes.flatMap((r) => r.actions)) expect(a.grant).toBe(`csr.${a.operationId.toLowerCase()}.read`);
  });
  it('PERCORSI: le route della route-table', () => {
    expect(Object.values(PERCORSI).sort()).toEqual(routeTable.routes.map((r) => r.path).sort());
  });
  it('pagineVisibili: basta uno dei grant della pagina', () => {
    expect(pagineVisibili((g) => g === GRANT.distribuzioneDotazione).map((r) => r.percorso)).toEqual(['/finanziario/dotazione']);
    expect(pagineVisibili(() => false)).toEqual([]);
    // la panoramica si vede con uno qualunque dei suoi grant (qui TX-0009, che apre anche Domande)
    expect(pagineVisibili((g) => g === 'csr.tx-0009.read').map((r) => r.percorso)).toEqual(['/finanziario', '/finanziario/domande']);
    expect(pagineVisibili((g) => g === 'csr.tx-0014.read').map((r) => r.percorso)).toEqual(['/finanziario/sigc/riserva']);
  });
  it('codiceInterventoValido: stesso formato del filtro intervento, niente percorsi o markup', () => {
    expect(codiceInterventoValido('SRA01')).toBe(true);
    for (const v of ['', null, undefined, '<x>', '../riepilogo', 'SRA01/altro', 'a'.repeat(200)]) expect(codiceInterventoValido(v)).toBe(false);
  });
  it('percorsoIntervento: il codice entra codificato nella route di dettaglio', () => {
    expect(percorsoIntervento('SRA01')).toBe('/finanziario/interventi/SRA01');
    expect(percorsoIntervento('A B')).toBe('/finanziario/interventi/A%20B');
  });
  it('conFiltri: il percorso con i filtri nella query string, nel formato del backend; senza filtri il solo percorso', () => {
    expect(conFiltri(PERCORSI.dotazione, { os: ['OS4'], intervento: ['SRA01', 'SRA03'] })).toBe('/finanziario/dotazione?intervento=SRA01&intervento=SRA03&os=OS4');
    expect(conFiltri(percorsoIntervento('SRA01'), { azione: ['3'] })).toBe('/finanziario/interventi/SRA01?azione=3');
    expect(conFiltri(PERCORSI.panoramica, {})).toBe('/finanziario');
    expect(conFiltri(PERCORSI.panoramica, { og: [] })).toBe('/finanziario');
  });
});

describe('riserva: calendario, fase di oggi, importi dell istantanea', () => {
  it('calendarioRiserva: le date ISO dell anno n, unica fonte delle fasi', () => {
    expect(calendarioRiserva(2025)).toEqual({
      inizioAccumulo: '2025-10-01',
      congelamento: '2026-06-30',
      inizioUtilizzo: '2026-07-01',
      fineUtilizzo: '2026-12-31',
      inizioResiduo: '2027-01-01',
    });
    expect(calendarioRiserva(2029).inizioResiduo).toBe('2031-01-01');
  });
  it('dataBreve: giorno e mese senza zeri iniziali', () => {
    expect(dataBreve('2025-10-01')).toBe('1/10/2025');
    expect(dataBreve('2026-06-30')).toBe('30/6/2026');
    expect(dataBreve('2026-12-31')).toBe('31/12/2026');
  });
  it('aiutoRiserva: le fasi in generale, o con le date dell anno scelto', () => {
    expect(aiutoRiserva()).toBe('Accumulo dal 1 ottobre n al 30 giugno n+1, utilizzo fino al 31 dicembre n+1, residuo dal 1 gennaio n+2.');
    expect(aiutoRiserva(2025)).toBe('Per il 2025: accumulo dal 1/10/2025 al 30/6/2026, utilizzo fino al 31/12/2026, residuo dal 1/1/2027.');
  });
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
    expect(testoCongelato(null, 2025, '2026-03-01')).toBe("non ancora congelato all'estrazione del 01/03/2026: si congela al 30/6/2026");
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

describe('tabella interattiva: ordine, aria-sort, didascalia, colonne', () => {
  it('versoSuccessivo: sulla stessa colonna si inverte, una colonna nuova parte dal decrescente', () => {
    expect(versoSuccessivo({ chiave: 'dotazione', verso: 'crescente' }, 'dotazione')).toEqual({ chiave: 'dotazione', verso: 'decrescente' });
    expect(versoSuccessivo({ chiave: 'dotazione', verso: 'decrescente' }, 'dotazione')).toEqual({ chiave: 'dotazione', verso: 'crescente' });
    expect(versoSuccessivo({ chiave: 'dotazione', verso: 'crescente' }, 'pagato')).toEqual({ chiave: 'pagato', verso: 'decrescente' });
  });
  it('ariaSort: ascending o descending sulla colonna ordinata, none sulle altre', () => {
    expect(ariaSort({ chiave: 'dotazione', verso: 'crescente' }, 'dotazione')).toBe('ascending');
    expect(ariaSort({ chiave: 'dotazione', verso: 'decrescente' }, 'dotazione')).toBe('descending');
    expect(ariaSort({ chiave: 'dotazione', verso: 'crescente' }, 'pagato')).toBe('none');
  });
  it('didascalia: conteggio delle righe, la ricerca e, se le righe si aprono, come aprirle', () => {
    expect(didascalia('Interventi', 1, '', false)).toBe('Interventi: 1 riga.');
    expect(didascalia('Interventi', 0, '   ', false)).toBe('Interventi: 0 righe.');
    expect(didascalia('Interventi', 3, ' SRA ', true)).toBe('Interventi: 3 righe per «SRA». Clic o Invio su una riga per aprirla.');
  });
  it('conColonna: nasconde o mostra una colonna in un insieme nuovo, l originale non cambia', () => {
    const nascoste = new Set(['quotaFeasr']);
    const mostrata = conColonna(nascoste, 'quotaFeasr', true);
    expect([...mostrata]).toEqual([]);
    expect([...nascoste]).toEqual(['quotaFeasr']);
    expect([...conColonna(nascoste, 'stanziato', false)].sort()).toEqual(['quotaFeasr', 'stanziato']);
    expect([...conColonna(nascoste, 'stanziato', true)]).toEqual(['quotaFeasr']);
    expect(conColonna(nascoste, 'quotaFeasr', false)).not.toBe(nascoste);
  });
});

// ---------------------------------------------------------------- iterazione 3 della review v2

describe('perimetro: regole uniche (N-20)', () => {
  it('perimetroCombinato: ADA se anche una sola risposta lo e, regionale se ce n e, altrimenti non indicato', () => {
    expect(perimetroCombinato(['REGIONALE', 'ADA', undefined])).toBe(PERIMETRO_ADA);
    expect(perimetroCombinato(['REGIONALE', null])).toBe('REGIONALE');
    expect(perimetroCombinato([undefined, null])).toBeUndefined();
  });
  it('etichettaDiProgramma: con il perimetro ADA il dato di programma si dichiara regionale', () => {
    expect(etichettaDiProgramma('Dotazione', 'ADA')).toBe('Dotazione (regionale)');
    expect(etichettaDiProgramma('Dotazione', 'REGIONALE')).toBe('Dotazione');
    expect(etichettaDiProgramma('Dotazione', undefined)).toBe('Dotazione');
  });
});

describe('codiceDaRicerca (H-25)', () => {
  it('la prima parola in maiuscolo se e un codice di intervento, altrimenti niente', () => {
    expect(codiceDaRicerca('  sra01 Intervento di prova A')).toBe('SRA01');
    expect(codiceDaRicerca('SRD07')).toBe('SRD07');
    for (const t of ['', '   ', 'intervento', '<x>', '../riepilogo']) expect(codiceDaRicerca(t)).toBeUndefined();
  });
});

describe('kpiRiserva (N-09)', () => {
  const ANNO = 2024;
  const inizioResiduo = calendarioRiserva(ANNO).inizioResiduo;
  it('valori presenti: niente assenze; utilizzo oltre la riserva segnalato; residuo previsto prima dell inizio della fase', () => {
    const d = { fase: 'UTILIZZO' as FaseRiserva, dataEstrazione: '2025-06-30', importoAccumulato: 1000, importoCongelato: 900, importoUtilizzato: 950, importoResiduoDisponibile: 50 };
    const k = kpiRiserva(d, ANNO, '2025-07-01');
    expect(k.accumulato).toEqual({ valore: 1000, nota: `Fase: ${etichettaFaseRiserva('UTILIZZO', ANNO)}` });
    expect(k.congelato).toEqual({ valore: 900, nota: undefined });
    expect(k.utilizzato).toEqual({ valore: 950, nota: 'Supera la riserva di questa estrazione', oltreRiserva: utilizzoOltreRiserva(d) });
    expect(k.utilizzato.oltreRiserva).toBe(true);
    expect(k.residuo.valore).toBe(50);
    expect(k.residuo.nota).toBe(`Previsto: disponibile dal ${dataBreve(inizioResiduo)}`);
    // dal primo giorno della fase il residuo non e' piu' "previsto"
    expect(kpiRiserva(d, ANNO, inizioResiduo).residuo.nota).toBeUndefined();
  });
  it('valori assenti: ogni KPI dice perche, con l iniziale maiuscola, come la tabella delle voci', () => {
    const d = { fase: 'ACCUMULO' as FaseRiserva, dataEstrazione: '2024-06-30' };
    const k = kpiRiserva(d, ANNO, '2024-07-01');
    expect(k.accumulato).toEqual({ valore: null, assente: 'Non disponibile', nota: `Fase: ${etichettaFaseRiserva('ACCUMULO', ANNO)}` });
    const congelato = testoCongelato(null, ANNO, d.dataEstrazione);
    expect(k.congelato.assente).toBe(`${congelato.charAt(0).toUpperCase()}${congelato.slice(1)}`);
    expect(k.utilizzato).toEqual({ valore: null, assente: 'Non disponibile', nota: undefined, oltreRiserva: false });
    const residuo = testoResiduo(null, ANNO, d.dataEstrazione, '2024-07-01');
    expect(k.residuo.assente).toBe(`${residuo.charAt(0).toUpperCase()}${residuo.slice(1)}`);
    expect(k.residuo.nota).toBeUndefined();
  });
});
