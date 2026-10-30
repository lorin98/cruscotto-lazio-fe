import { describe, expect, it } from 'vitest';
import { formatDataOra, formatDate, formatEttari, formatGiorno, formatNumber } from '../src/shared/lib/format';
import { anniProposti, isAnnoValido } from '../src/shared/lib/anni';
import { nomeFile } from '../src/shared/lib/nome-file';
import { DICITURA_USO, aCapo, righeContesto, righeIntestazione, testoPerimetro } from '../src/shared/lib/intestazione';
import { etichettaFlusso, menoRecente, testoUltimiDati } from '../src/shared/lib/aggiornamento';
import { MAX_VALORI_PARAMETRO, leggiRipetuti, scriviRipetuti } from '../src/shared/lib/parametri-ripetuti';
import { conStatoSalvato, leggiStatoSalvato } from '../src/shared/lib/stato-history';
import { statoDelDettaglio, tutteRisposte } from '../src/shared/lib/dettaglio';
import * as libComune from '../src/shared/lib';
import { NON_DISPONIBILE_BREVE, resaAssenza, totaleMotivato } from '../src/entities/importo';
import { isOpenEnded, isSentinelDate, SENTINEL_DATE_MAX } from '../src/shared/lib/sentinel-dates';
import { isEditable, makeRolePredicate } from '../src/shared/lib/predicates';
import type { AuthStatus } from '../src/shared/api/auth/auth-status';

describe('lib/format — puro, nullable-safe, locale it-IT', () => {
  it('formatNumber: null|undefined -> "-"', () => {
    expect(formatNumber(null)).toBe('-');
    expect(formatNumber(undefined)).toBe('-');
  });
  it('formatNumber: usa il locale it-IT', () => {
    expect(formatNumber(1234)).toBe((1234).toLocaleString('it-IT'));
  });
  it('formatDate: vuoto -> ""; data non parsabile -> grezzo (non lancia)', () => {
    expect(formatDate(null)).toBe('');
    expect(formatDate('')).toBe('');
    expect(formatDate('non-una-data')).toBe('non-una-data');
  });
});

describe('lib/format — formatEttari, superfici con due decimali (D-01 del backend fisico)', () => {
  it('due decimali, segno meno sempre scritto, piu davanti alle differenze positive', () => {
    expect(formatEttari(15.5)).toBe('15,50');
    expect(formatEttari(-1)).toBe('-1,00');
    expect(formatEttari(0.7, { segno: true })).toBe('+0,70');
    expect(formatEttari(-0.5, { segno: true })).toBe('-0,50');
    expect(formatEttari(0, { segno: true })).toBe('0,00');
    // un positivo che a due decimali e' zero non prende il piu
    expect(formatEttari(0.001, { segno: true })).toBe('0,00');
    expect(formatEttari(null)).toBe('-');
  });
});

describe('lib del kit per le card della Home (decisione dell utente del 26/10/2026)', () => {
  it('intero: i passi di un numero animato arrotondati all unita, come formatNumber (it-IT: separatore da 10.000)', () => {
    expect(libComune.intero(12345.4)).toBe('12.345');
    expect(libComune.intero(0.6)).toBe('1');
    expect(libComune.intero(1234.5)).toBe(libComune.formatNumber(1235));
  });
  it('etichettaDellArea: col perimetro ADA la misura e dell area del profilo, altrimenti invariata', () => {
    expect(libComune.etichettaDellArea('Domande ammesse', 'ADA')).toBe('Domande ammesse della tua area');
    expect(libComune.etichettaDellArea('Domande ammesse', 'REGIONALE')).toBe('Domande ammesse');
    expect(libComune.etichettaDellArea('Domande ammesse', undefined)).toBe('Domande ammesse');
  });
  it('sommaSeCompleta: la somma al centesimo solo se ogni numero e noto, mai una somma parziale', () => {
    expect(libComune.sommaSeCompleta([0.1, 0.2])).toBe(0.3);
    expect(libComune.sommaSeCompleta([])).toBe(0);
    expect(libComune.sommaSeCompleta([1, null])).toBeNull();
    expect(libComune.sommaSeCompleta([1, Number.NaN])).toBeNull();
  });
});

describe('lib/anni — anno di un parametro del contratto (2000-2100)', () => {
  it('interi nell intervallo; fuori, decimali e assenti no', () => {
    expect(isAnnoValido(2025)).toBe(true);
    expect(isAnnoValido(2000)).toBe(true);
    expect(isAnnoValido(2100)).toBe(true);
    expect(isAnnoValido(1999)).toBe(false);
    expect(isAnnoValido(2025.5)).toBe(false);
    expect(isAnnoValido(undefined)).toBe(false);
  });

  it('anniProposti (review H7 dell istituzionale, prima nel finanziario e nell istituzionale): il periodo e gli anni validi in piu, in ordine', () => {
    expect(anniProposti(2023, 2025)).toEqual([2023, 2024, 2025]);
    expect(anniProposti(2023, 2025, 2024, 2031, 2019, 1999, 2025.5, null, undefined)).toEqual([2019, 2023, 2024, 2025, 2031]);
    expect(anniProposti(2023, 2025, 2031, 2031)).toEqual([2023, 2024, 2025, 2031]);
  });
});

describe('lib/format — formatDataOra in ora italiana (NFR-25)', () => {
  it('istante del backend in ora di Roma, con ora legale e solare', () => {
    expect(formatDataOra('2026-03-03T08:30:00Z')).toBe('03/03/2026 09:30');
    expect(formatDataOra('2026-10-08T12:45:49.801Z')).toBe('08/10/2026 14:45');
    expect(formatDataOra('2026-12-31T23:30:00Z')).toBe('01/01/2027 00:30');
    // microsecondi come li manda il backend (Instant di Java)
    expect(formatDataOra('2026-10-07T14:13:34.964352Z')).toBe('07/10/2026 16:13');
  });
  it('vuoto -> ""; non parsabile -> grezzo (non lancia)', () => {
    expect(formatDataOra(null)).toBe('');
    expect(formatDataOra('ieri')).toBe('ieri');
  });
});

describe('lib/sentinel-dates — predicati fail-safe', () => {
  it('isOpenEnded: sentinella max e anno 9999', () => {
    expect(isOpenEnded(SENTINEL_DATE_MAX)).toBe(true);
    expect(isOpenEnded('9999-01-01')).toBe(true);
    expect(isOpenEnded('2026-01-01')).toBe(false);
    expect(isOpenEnded(null)).toBe(false);
  });
  it('isSentinelDate: min e max', () => {
    expect(isSentinelDate('0001-01-01')).toBe(true);
    expect(isSentinelDate(SENTINEL_DATE_MAX)).toBe(true);
    expect(isSentinelDate('2026-01-01')).toBe(false);
    expect(isSentinelDate(undefined)).toBe(false);
  });
});

describe('lib/predicates — gate UX, mai enforcement', () => {
  const status: AuthStatus = {
    authenticated: true,
    user: { username: 'u', roles: ['elementi.read'] },
  };
  it('makeRolePredicate: fine||coarse sui roles, false su assente/undefined', () => {
    expect(makeRolePredicate('elementi.read')(status)).toBe(true);
    expect(makeRolePredicate('elementi.write')(status)).toBe(false);
    expect(makeRolePredicate('elementi.read')(undefined)).toBe(false);
  });
  it('isEditable: consuma il flag server-derived, fail-safe a read-only', () => {
    expect(isEditable({ modificabile: true })).toBe(true);
    expect(isEditable({ modificabile: false })).toBe(false);
    expect(isEditable({})).toBe(false);
    expect(isEditable(null)).toBe(false);
  });
});

describe('formatGiorno (H-25)', () => {
  it("il giorno dell'istante in ora italiana, lo stesso di formatDataOra", () => {
    // 23:30 UTC del 31 dicembre e' gia' il primo gennaio a Roma
    expect(formatGiorno('2025-12-31T23:30:00Z')).toBe('01/01/2026');
    expect(formatGiorno('2026-03-03T08:30:00.123456Z')).toBe(formatDataOra('2026-03-03T08:30:00.123456Z').slice(0, 10));
    expect(formatGiorno(null)).toBe('');
    expect(formatGiorno('non una data')).toBe('non una data');
  });
});

describe('lib/nome-file — nome del file dal titolo', () => {
  it('minuscole, accenti tolti, trattini al posto del resto', () => {
    expect(nomeFile('Domande SIGC (RF012)', 'png')).toBe('domande-sigc-rf012.png');
    expect(nomeFile("Riserva di efficacia: quantità e attività", 'xlsx')).toBe('riserva-di-efficacia-quantita-e-attivita.xlsx');
  });
  it('un titolo senza lettere ne cifre da un nome comunque valido', () => {
    expect(nomeFile(' — ', 'csv')).toBe('cruscotto.csv');
  });
});

describe('lib/intestazione — intestazione dei file generati nel browser (NFR-50, review v3 V-01)', () => {
  it('testata e titolo, fonte, righe della pagina, data e ora di estrazione (Roma), dicitura come nei file del backend', () => {
    const righe = righeIntestazione({ titolo: 'Stanziato', fonte: 'Fonte: TX-0004', contesto: ['Filtri applicati: nessuno', 'Profilo: P1'], estrattoIl: new Date('2026-10-12T08:30:00Z') });
    expect(righe).toEqual([
      'Cruscotto CSR Lazio - Stanziato',
      'Fonte: TX-0004',
      'Filtri applicati: nessuno',
      'Profilo: P1',
      'Estratto il 12/10/2026 10:30 (Europe/Rome)',
      `Uso: ${DICITURA_USO}`,
    ]);
    expect(DICITURA_USO).toBe('Documento ad uso interno di ARSIAL e della Regione Lazio: dati riservati, non diffondere');
  });
  it('testoPerimetro (review H7 dell istituzionale, prima nel fisico e nell istituzionale): il perimetro della risposta in parole', () => {
    expect([testoPerimetro('REGIONALE'), testoPerimetro('ADA')]).toEqual(['regionale', 'ADA del tuo profilo']);
    expect(righeContesto({ filtri: [], profilo: 'P1', ultimi: undefined, perimetro: testoPerimetro('REGIONALE') })[1]).toBe('Perimetro: regionale');
  });
  it('aCapo: linee entro il massimo fra le parole, una parola troppo lunga resta intera', () => {
    const misura = (t: string) => t.length;
    expect(aCapo('uno due tre quattro', 7, misura)).toEqual(['uno due', 'tre', 'quattro']);
    expect(aCapo('brevissimo', 100, misura)).toEqual(['brevissimo']);
    expect(aCapo('a lunghissimaparola b', 5, misura)).toEqual(['a', 'lunghissimaparola', 'b']);
    expect(aCapo('  ', 10, misura)).toEqual([]);
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
  it('righe di contesto del PNG (NFR-50, review v3 V-01): filtri della barra, profilo, ultimo dato come negli export', () => {
    expect(righeContesto({ filtri: ['Intervento: SRA01', 'Anno: 2024'], profilo: 'P4', ultimi: [{ flusso: 'DS-12', conclusoIl: '2026-03-02T09:15:00Z' }] })).toEqual([
      'Filtri applicati: Intervento: SRA01; Anno: 2024',
      'Profilo: P4',
      'Ultimo dato sincronizzato: DS-12 02/03/2026 10:15',
    ]);
    expect(righeContesto({ filtri: [], profilo: undefined, ultimi: undefined })).toEqual([
      'Filtri applicati: nessuno',
      'Profilo: non indicato',
      'Ultimo dato sincronizzato: non disponibile',
    ]);
    expect(righeContesto({ filtri: [], profilo: 'P1', ultimi: [] })[2]).toBe('Ultimo dato sincronizzato: nessuna acquisizione conclusa');
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

describe('parametri ripetuti (unica regola di filtri, link e criteri, H-07 review v4)', () => {
  it('lettura: valori ripuliti, validi, senza doppioni, al piu il tetto', () => {
    const p = new URLSearchParams('a=1&a= 2 &a=1&a=x&b=9');
    expect(leggiRipetuti(p, 'a', (v) => /^[0-9]+$/.test(v))).toEqual(['1', '2']);
    expect(leggiRipetuti(p, 'a', undefined, 1)).toEqual(['1']);
    const molti = new URLSearchParams(Array.from({ length: MAX_VALORI_PARAMETRO + 3 }, (_, i) => ['k', String(i)]));
    expect(leggiRipetuti(molti, 'k')).toHaveLength(MAX_VALORI_PARAMETRO);
  });
  it('scrittura: chiavi nell ordine dato, chiave ripetuta per valore, senza doppioni, tetto per chiave, valori codificati', () => {
    expect(scriviRipetuti(['b', 'a', 'b'], (k) => ({ a: ['1', '1', '2'], b: ['x&y=1'] })[k])).toBe('b=x%26y%3D1&a=1&a=2');
    expect(scriviRipetuti(['a'], () => ['1', '2', '3'], () => 2)).toBe('a=1&a=2');
    expect(scriviRipetuti(['a'], () => undefined)).toBe('');
  });
});

describe("lib/stato-history — l'involucro { firma, valore } dello state della history (review v1 iter3 H-02)", () => {
  const eTesto = (v: unknown): v is string => typeof v === 'string';
  it('conStatoSalvato scrive sotto la chiave e lascia le altre chiavi dello state', () => {
    expect(conStatoSalvato({ altro: 1 }, 'k', 'f', 'v')).toEqual({ altro: 1, k: { firma: 'f', valore: 'v' } });
    expect(conStatoSalvato(undefined, 'k', 'f', 'v')).toEqual({ k: { firma: 'f', valore: 'v' } });
    expect(conStatoSalvato('non un oggetto', 'k', 'f', 'v')).toEqual({ k: { firma: 'f', valore: 'v' } });
  });
  it('leggiStatoSalvato rilegge cio che conStatoSalvato scrive, solo con la stessa firma e un valore valido', () => {
    const stato = conStatoSalvato({ altro: 1 }, 'k', 'f', 'v');
    expect(leggiStatoSalvato(stato, 'k', 'f', eTesto)).toBe('v');
    expect(leggiStatoSalvato(stato, 'k', 'altra firma', eTesto)).toBeUndefined();
    expect(leggiStatoSalvato(stato, 'altra chiave', 'f', eTesto)).toBeUndefined();
    expect(leggiStatoSalvato({ k: { firma: 'f', valore: 3 } }, 'k', 'f', eTesto)).toBeUndefined();
    expect(leggiStatoSalvato({ k: 'manomesso' }, 'k', 'f', eTesto)).toBeUndefined();
    expect(leggiStatoSalvato(null, 'k', 'f', eTesto)).toBeUndefined();
    expect(leggiStatoSalvato(undefined, 'k', 'f', eTesto)).toBeUndefined();
  });
});

describe('lib/dettaglio — lo stato di un dettaglio con piu letture (prima nell istituzionale, ora anche del procedurale)', () => {
  const ok = (data: { righe?: readonly unknown[] }) => ({ data, isError: false });
  it('una risposta senza righe (campo facoltativo nella spec) conta come vuota', () => {
    expect(statoDelDettaglio([ok({}), ok({ righe: [] })], false)).toBe('vuoto');
    expect(statoDelDettaglio([ok({}), ok({ righe: [{}] })], false)).toBe('dati');
    expect(tutteRisposte([ok({}), { data: undefined, isError: true }])).toBe(true);
  });

  it('shared/lib non conosce campi di dominio: la riga dell intervento sta in entities/filtri (review H2 del procedurale)', () => {
    expect(Object.keys(libComune)).not.toContain('rigaDellIntervento');
  });
});

describe('entities/importo: totaleMotivato, la regola dei totali senza somme parziali (review H4 della card della Home)', () => {
  type Riga = { codice: string; dato: { valore: number | null; motivo: string | null; fonte: null } };
  const riga = (codice: string, valore: number | null, motivo: string | null = null): Riga => ({ codice, dato: { valore, motivo, fonte: null } });
  const totale = (righe: Riga[], conMotivo = false, vuoto: 'zero' | 'non-calcolabile' = 'zero') => totaleMotivato(righe, (r) => r.dato, (r) => r.codice, { vuoto, conMotivo });

  it('la somma al centesimo se ogni riga ha il valore; l insieme vuoto lo decide chi chiama', () => {
    expect(totale([riga('A', 0.1), riga('B', 0.2)])).toEqual({ valore: 0.3 });
    expect(totale([])).toEqual({ valore: 0 });
    expect(totale([], false, 'non-calcolabile')).toEqual({ valore: null, motivo: 'Non calcolabile: nessun intervento nella selezione' });
  });

  it('una riga senza valore: non calcolabile coi codici (fino a tre), il motivo unico solo se richiesto', () => {
    const righe = [riga('A', 1), riga('B', null, 'FONTE_AMBIGUA')];
    expect(totale(righe)).toEqual({ valore: null, motivo: 'Non calcolabile: manca per 1 intervento (B)' });
    expect(totale(righe, true)).toEqual({ valore: null, motivo: 'Non calcolabile: manca per 1 intervento (B); non attribuibile (riga presente sia nel monitoraggio SIGC sia nel non SIGC)' });
    // motivi diversi: nessun motivo unico; oltre tre righe solo il numero
    expect(totale([riga('A', null, 'NON_VALORIZZATO'), riga('B', null, 'FONTE_AMBIGUA')], true).motivo).toBe('Non calcolabile: manca per 2 interventi (A, B)');
    expect(totale(['A', 'B', 'C', 'D'].map((c) => riga(c, null))).motivo).toBe('Non calcolabile: manca per 4 interventi');
  });
});

describe("entities/importo: resaAssenza, l'assenza in breve dove il motivo e detto altrove (review del riallineamento FIS-07, prima nel procedurale e nel fisico)", () => {
  it('breve con la fonte non attiva solo se chiesto; altrimenti, e con gli altri motivi, la resa completa', () => {
    expect(resaAssenza({ motivo: 'FONTE_NON_ATTIVA', fonte: 'PAGATO_PER_UNIT_AMOUNT' }, true)).toBe(NON_DISPONIBILE_BREVE);
    expect(NON_DISPONIBILE_BREVE).toEqual({ disponibile: false, testo: 'non disponibile' });
    expect(resaAssenza({ motivo: 'FONTE_NON_ATTIVA', fonte: 'PAGATO_PER_UNIT_AMOUNT' }, false)).toEqual({ disponibile: false, testo: 'non disponibile', nota: 'fonte pagato per Unit Amount non attiva' });
    expect(resaAssenza({ motivo: 'NON_VALORIZZATO' }, true)).toEqual({ disponibile: false, testo: 'non valorizzato', nota: 'il dato non è presente nella fonte' });
    expect(resaAssenza(undefined, true)).toEqual({ disponibile: false, testo: 'non disponibile' });
  });
});
