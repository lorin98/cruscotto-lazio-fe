import { describe, expect, it } from 'vitest';
import { formatDataOra, formatDate, formatGiorno, formatNumber } from '../src/shared/lib/format';
import { nomeFile } from '../src/shared/lib/nome-file';
import { DICITURA_USO, aCapo, righeContesto, righeIntestazione } from '../src/shared/lib/intestazione';
import { etichettaFlusso, menoRecente, testoUltimiDati } from '../src/shared/lib/aggiornamento';
import { MAX_VALORI_PARAMETRO, leggiRipetuti, scriviRipetuti } from '../src/shared/lib/parametri-ripetuti';
import { conStatoSalvato, leggiStatoSalvato } from '../src/shared/lib/stato-history';
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
