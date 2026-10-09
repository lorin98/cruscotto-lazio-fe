import { describe, expect, it } from 'vitest';
import { formatDataOra, formatDate, formatGiorno, formatNumber } from '../src/shared/lib/format';
import { nomeFile } from '../src/shared/lib/nome-file';
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
