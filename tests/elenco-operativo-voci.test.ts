import { describe, expect, it } from 'vitest';
import {
  badgeDellaDomanda,
  sopratitoloDomanda,
  testoBeneficiario,
  testoStatoProgrammazione,
  testoStatoSian,
  vociAnteprimaDomanda,
  vociAnteprimaPagamento,
  vociSintesi,
} from '../src/features/elenco-operativo/lib/voci';
import { GRANT, puoLeggere } from '../src/features/elenco-operativo/lib/grant';
import { PAGINE_ELENCO, pagineVisibili } from '../src/features/elenco-operativo/lib/pagine';
import { formatEuro } from '../src/shared/lib/format';

const euro = (valore: number | null, motivo: string | null = null) => ({ valore, motivo, fonte: null });

const domanda = {
  codiceABarre: '54230000001',
  tipo: 'PAGAMENTO',
  cuaa: '01234567890',
  denominazione: 'COOPERATIVA VERDI',
  codiceIntervento: 'SRA01',
  annoRaccolta: 2025,
  primaAnnualita: true,
  sigc: true,
  statoCodice: 'VALIDO',
  statoDescrizione: null,
  statoProgrammazione: null,
  provincia: 'FROSINONE',
  enteDelegato: null,
  ammesso: euro(4000),
  pagato: euro(null, 'NON_VALORIZZATO'),
  ancoraDaPagare: euro(null, 'NON_VALORIZZATO'),
  anomalie: 0,
};

describe('elenco operativo, testi delle schede di sola lettura', () => {
  it('beneficiario e stati con le assenze dichiarate', () => {
    expect(testoBeneficiario({ denominazione: 'ROSSI', cuaa: 'RSS' })).toBe('ROSSI (RSS)');
    expect(testoBeneficiario({ denominazione: null, cuaa: null })).toBe('denominazione non valorizzata');
    expect(testoStatoSian(domanda)).toBe('VALIDO');
    expect(testoStatoSian({ statoDescrizione: null, statoCodice: null })).toBe('senza stato');
    expect(testoStatoProgrammazione(domanda)).toBe('senza stato');
  });

  it('anteprima della domanda: importi assenti col motivo, mai zero', () => {
    const voci = Object.fromEntries(vociAnteprimaDomanda(domanda));
    expect(voci['Tipo']).toBe('Pagamento');
    expect(voci['Intervento e anno']).toBe('SRA01 - 2025, prima annualità');
    expect(voci['Ammesso']).toBe(formatEuro(4000));
    expect(voci['Pagato']).toBe('non valorizzato');
    expect(voci['Anomalie']).toBe('nessuna');
  });

  it("anteprima del pagamento: la domanda chiusa e i motivi d'esclusione in testo", () => {
    const base = { decreto: 'D1', codiceABarre: '1', tipoDomanda: 'PAGAMENTO', codiceIntervento: 'SRA01', esito: 'ESCLUSA', dataAutorizzazione: null, importoDecretato: euro(1), importoPagato: euro(null, 'NON_VALORIZZATO') };
    const chiusa = Object.fromEntries(vociAnteprimaPagamento({ ...base, domandaCorrente: false, motiviEsclusione: ['M01', 'M02'] }));
    expect(chiusa['Esito']).toBe('Esclusa (domanda chiusa)');
    expect(chiusa['Data di autorizzazione']).toBe('non indicata');
    expect(chiusa['Motivi di esclusione']).toBe('M01, M02');
    expect(Object.fromEntries(vociAnteprimaPagamento({ ...base, domandaCorrente: true }))['Motivi di esclusione']).toBeUndefined();
  });

  it('testata della scheda: badge in testo e sopratitolo', () => {
    expect(badgeDellaDomanda(domanda, 'ADA')).toEqual([
      'CUAA 01234567890',
      'Stato SIAN: VALIDO',
      'Area programmazione: senza stato',
      'SIGC',
      'Anno 2025, prima annualità',
      'Perimetro: la tua area (ADA)',
    ]);
    expect(badgeDellaDomanda({ ...domanda, cuaa: null, sigc: false }, 'REGIONALE')).toContain('CUAA non valorizzato');
    expect(sopratitoloDomanda(domanda, 'Produzione integrata')).toBe('Domanda di pagamento 54230000001 - SRA01 Produzione integrata');
    expect(sopratitoloDomanda(domanda, null)).toBe('Domanda di pagamento 54230000001 - SRA01');
  });

  it('sintesi: comparto, aggregato e assenze', () => {
    const voci = Object.fromEntries(vociSintesi(domanda, { descrizioneIntervento: null, compartoCodice: 'C01', compartoDescrizione: 'Ortofrutta', aggregatoComparti: null }));
    expect(voci['Intervento']).toBe('SRA01 - descrizione non disponibile');
    expect(voci['Comparto']).toBe('C01 - Ortofrutta');
    expect(voci['Aggregato dei comparti']).toBe('non indicato');
    expect(voci['Provincia ed ente delegato']).toBe('FROSINONE - non indicato');
    expect(voci['Atto di concessione']).toBe('nessun atto');
  });
});

describe('elenco operativo, grant e pagine visibili (gate di UX)', () => {
  it('grant verbatim del catalogo e predicato', () => {
    expect(Object.values(GRANT)).toEqual(['csr.tx-0056.read', 'csr.tx-0057.read', 'csr.tx-0058.read', 'csr.tx-0059.read', 'csr.tx-0060.read']);
    const status = { authenticated: true, user: { username: 'U', roles: ['csr.tx-0056.read'] } };
    expect(puoLeggere(status, 'domande')).toBe(true);
    expect(puoLeggere(status, 'pagamenti')).toBe(false);
    expect(puoLeggere(undefined, 'domande')).toBe(false);
  });

  it('pagine del menu per grant', () => {
    expect(PAGINE_ELENCO.map((p) => p.voceMenu)).toEqual(['Domande', 'Pagamenti']);
    expect(pagineVisibili((g) => g === 'csr.tx-0059.read').map((p) => p.percorso)).toEqual(['/elenco-operativo/pagamenti']);
    expect(pagineVisibili(() => false)).toEqual([]);
  });
});
