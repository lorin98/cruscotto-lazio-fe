// Test L1 delle funzioni PURE dell'istituzionale (lib/): grant e pagine, criteri nell'indirizzo, link dello uiplan, testi,
// i ventuno dati della verifica, l'output regionale, il dettaglio dell'intervento e i builder dei grafici. Chiamate
// dirette, niente render; i dati sono quelli degli scenari del backend (fixture dell'istituzionale).
import type { BarSeriesOption } from 'echarts';
import { describe, expect, it } from 'vitest';
import { GRANT, puoLeggere } from '../src/features/istituzionale/lib/grant';
import { GRANT_DETTAGLIO, PAGINE_ISTITUZIONALE, PERCORSI, pagineVisibili, ricercaConservata } from '../src/features/istituzionale/lib/pagine';
import { ANNI_DEL_PERIODO, anniDiRiferimento, codiceDelPercorso, conFiltri, criteriVerifica, ricercaConAnno, soloIntervento, testiCriteri } from '../src/features/istituzionale/lib/criteri';
import { VERIFICA_SMP_SIGC, conValore, elencoRicevute, elencoSpesa, outputDellIntervento, percorsoIntervento, verificaDellIntervento } from '../src/features/istituzionale/lib/collegamenti';
import {
  ANNO_TARGET_ASSENTE,
  DEFINIZIONI_OUTPUT,
  DEFINIZIONI_VERIFICA,
  NESSUN_FILE,
  PILL_PERIMETRO,
  TESTO_ASSENTE,
  assenzaInFrase,
  pillAnnoDelFile,
  pillPeriodo,
  quantita,
  siNo,
  testoAnnoDiRiferimento,
  testoMotivato,
  testoOutputErogato,
  testoPerimetro,
  testoTarget,
  testoVuoto,
} from '../src/features/istituzionale/lib/formato';
import { DATI_VERIFICA, TESTI_LINK, indirizzoDelDato, testoRicerca, testoValore, titoloDato, valoreOrdinabile, vociRiferimenti } from '../src/features/istituzionale/lib/verifica';
import type { DatoVerifica } from '../src/features/istituzionale/lib/verifica';
import { MISURE, anniDelPeriodo, captionOutput, datoDellAnno, etichettaMisura, importiOrdinati, opzioniMisura, ordinabileDellAnno, rigaDellIntervento, testoRicercaOutput, vociAnteprima } from '../src/features/istituzionale/lib/output';
import { SENZA_DATI, SENZA_UNIT_AMOUNT, TITOLI_SCHEDE, badgeIntervento, captionVociVerifica, kpiIntervento, schedeVisibili, statoDelDettaglio, testoAggiornamentoAnno, tutteRisposte,ultimoDatoInErrore, sopratitoloIntervento, titoloIntervento, ultimiDelDettaglio } from '../src/features/istituzionale/lib/intervento';
import { TITOLO_SPESA, graficoOutputPerAnno, graficoSpesa } from '../src/features/istituzionale/lib/grafici';
import { OUTPUT, SRA01_OUTPUT, SRD01, ULTIMI, VERIFICA, outputPer, righeDeiFiltri, verificaPer } from '../src/features/istituzionale/testing/fixture';

const dato = (campo: DatoVerifica['campo']) => DATI_VERIFICA.find((d) => d.campo === campo) as DatoVerifica;
const status = (roles: string[]) => ({ authenticated: true, user: { username: 'U', profile: 'p3-funzionario-area-ist', roles } });

describe('RF016 e RF017: grant e pagine dell istituzionale (menu e Home)', () => {
  it('grant verbatim del catalogo; puoLeggere col solo hasGrant, senza stato no', () => {
    expect(GRANT).toEqual({
      verifica: 'csr.tx-0016.read',
      output: 'csr.tx-0017.read',
      filtri: 'csr.tx-0060.read',
      elencoDomande: 'csr.tx-0056.read',
      elencoPagamenti: 'csr.tx-0059.read',
      verificaSigc: 'csr.tx-0015.read',
    });
    expect(puoLeggere(status(['csr.tx-0016.read']), 'verifica')).toBe(true);
    expect(puoLeggere(status(['csr.tx-0016.read']), 'verificaSigc')).toBe(false);
    expect(puoLeggere(undefined, 'verifica')).toBe(false);
  });

  it('le due pagine del menu per grant; il dettaglio con uno dei due grant; i filtri restano fra i due report, l anno no', () => {
    expect(PAGINE_ISTITUZIONALE.map((p) => [p.percorso, p.voceMenu])).toEqual([
      ['/istituzionale/verifica-smp-non-sigc', 'Verifica SMP non SIGC'],
      ['/istituzionale/output-regionale', 'Output regionale'],
    ]);
    expect(pagineVisibili((g) => g === 'csr.tx-0017.read').map((p) => p.percorso)).toEqual([PERCORSI.output]);
    expect(pagineVisibili(() => false)).toEqual([]);
    expect(GRANT_DETTAGLIO).toEqual(['csr.tx-0016.read', 'csr.tx-0017.read']);
    expect(ricercaConservata('?intervento=SRD01&anno=2024&os=OS4&x=1')).toBe('intervento=SRD01&os=OS4');
    expect(ricercaConservata('')).toBe('');
  });
});

describe('RF016: criteri nell indirizzo (filtri del programma e anno di riferimento del file)', () => {
  it('anni proposti: il periodo CSR, l anno della risposta e quello scelto, in ordine e senza doppioni', () => {
    expect(anniDiRiferimento(null, undefined)).toEqual([2023, 2024, 2025, 2026, 2027, 2028, 2029]);
    expect(anniDiRiferimento(2025, 2025)).toHaveLength(ANNI_DEL_PERIODO.ultimo - ANNI_DEL_PERIODO.primo + 1);
    expect(anniDiRiferimento(2031, 2019)).toEqual([2019, 2023, 2024, 2025, 2026, 2027, 2028, 2029, 2031]);
    expect(anniDiRiferimento(1999, undefined)).not.toContain(1999);
  });

  it('i filtri riscritti tengono l anno valido della ricerca corrente; un anno non valido si perde', () => {
    expect(ricercaConAnno({ intervento: ['SRD01'] }, '?anno=2024&intervento=SRA01')).toBe('intervento=SRD01&anno=2024');
    expect(ricercaConAnno({}, '?anno=2024')).toBe('anno=2024');
    expect(ricercaConAnno({ os: ['OS4'] }, '?anno=abc')).toBe('os=OS4');
    expect(ricercaConAnno({}, '')).toBe('');
  });

  it('criteri di TX-0016, testi del PNG, codice del percorso e filtri del dettaglio', () => {
    expect(criteriVerifica({ os: ['OS4'] }, 2024)).toEqual({ os: ['OS4'], anno: 2024 });
    expect(criteriVerifica({ os: ['OS4'] }, undefined)).toEqual({ os: ['OS4'] });
    expect(testiCriteri({ intervento: ['SRD01'], os: ['OS4'] }, 2024)).toEqual(['Intervento: SRD01', 'OS: OS4', 'Anno di riferimento: 2024']);
    expect(testiCriteri({})).toEqual([]);
    expect(codiceDelPercorso('SRA01')).toBe('SRA01');
    for (const nonValido of ['SRA01/..', 'sra01', ' SRA01', '', undefined, 'SRA01%2F']) expect(codiceDelPercorso(nonValido)).toBeNull();
    expect(soloIntervento('SRA01')).toEqual({ intervento: ['SRA01'] });
    expect([conFiltri({ os: ['OS4'] }), conFiltri({}), conFiltri({ intervento: [] })]).toEqual([true, false, false]);
  });
});

describe('RF016 e RF017: i link dello uiplan (dettaglio, report filtrati, elenco operativo, verifica SMP SIGC)', () => {
  it('il codice nel percorso del dettaglio e codificato: un valore con / resta un segmento; l anno solo se valido', () => {
    expect(percorsoIntervento('SRA01')).toBe('/istituzionale/interventi/SRA01');
    expect(percorsoIntervento('SRA01', 2024)).toBe('/istituzionale/interventi/SRA01?anno=2024');
    expect(percorsoIntervento('SR/../A01', 1999)).toBe('/istituzionale/interventi/SR%2F..%2FA01');
  });

  it('i due report filtrati sull intervento, nell ordine della query dello uiplan', () => {
    expect(verificaDellIntervento('SRA01', 2024)).toBe('/istituzionale/verifica-smp-non-sigc?intervento=SRA01&anno=2024');
    expect(verificaDellIntervento('SRA01')).toBe('/istituzionale/verifica-smp-non-sigc?intervento=SRA01');
    expect(outputDellIntervento('SRA01')).toBe('/istituzionale/output-regionale?intervento=SRA01');
  });

  it('elenco operativo: ricevute = domande di sostegno, spesa = righe PAGATA non SIGC (D-05); link solo con un valore positivo', () => {
    expect(elencoRicevute('SRD01')).toBe('/elenco-operativo/domande?tipo=SOSTEGNO&intervento=SRD01');
    expect(elencoSpesa('SRD01')).toBe('/elenco-operativo/pagamenti?esito=PAGATA&sigc=false&intervento=SRD01');
    expect(VERIFICA_SMP_SIGC).toBe('/finanziario/sigc/verifica-smp');
    expect([conValore(3), conValore(0), conValore(null), conValore(undefined), conValore(-1)]).toEqual([true, false, false, false, false]);
  });
});

describe('RF016 e RF017: testi (perimetro, anno, quantita, assenze, definizioni)', () => {
  it('perimetro, anno del file e periodo della barra', () => {
    expect(PILL_PERIMETRO).toBe('Perimetro: regionale (i report istituzionali non hanno perimetro ADA)');
    expect([testoPerimetro('REGIONALE'), testoPerimetro('ADA')]).toEqual(['regionale', 'ada']);
    expect(pillAnnoDelFile(2025)).toBe('Anno di riferimento del file SMP non SIGC: 2025');
    expect(pillAnnoDelFile(null)).toBe('Anno di riferimento del file SMP non SIGC: nessun file');
    expect(pillPeriodo(2023, 2029)).toBe('Periodo: 2023 - 2029');
    expect(testoAnnoDiRiferimento(2025, undefined)).toBe('2025 (ultimo anno con un file SMP non SIGC presente)');
    expect(testoAnnoDiRiferimento(2024, 2024)).toBe('2024');
    expect(testoAnnoDiRiferimento(null, 2023)).toBe('nessun file SMP non SIGC presente');
    expect([testoOutputErogato(true), testoOutputErogato(false)]).toEqual(['valore del file, cumulativo per anno di riferimento', 'valore del file per anno di riferimento']);
  });

  it('quantita con l unita, si e no, dati motivati e target; mai uno zero al posto di un assente', () => {
    expect([quantita(1500, 'ettari'), quantita(12, null), quantita(12345, 'UBA')]).toEqual(['1500 ettari', '12', '12.345 UBA']);
    expect([siNo(true), siNo(false)]).toEqual(['sì', 'no']);
    expect(testoMotivato({ valore: 7, motivo: null }, String)).toBe('7');
    expect(testoMotivato({ valore: null, motivo: 'ANNO_NON_CONSERVATO' }, String)).toBe("non disponibile per l'anno scelto (l'avviso porta i dati del file più recente)");
    expect(testoMotivato(undefined, String)).toBe('non disponibile');
    expect(assenzaInFrase({ motivo: 'NON_VALORIZZATO' })).toBe('Non valorizzato: il dato non è presente nella fonte');
    expect(assenzaInFrase(null)).toBe('Non disponibile');
    expect(testoTarget({ valore: 1500 }, 2029, 'ettari')).toBe('1500 ettari al 2029');
    expect(testoTarget({ valore: 10 }, null, null)).toBe('10');
    expect(testoTarget({ valore: null, motivo: 'NON_VALORIZZATO' }, null, null)).toBe('non valorizzato (il dato non è presente nella fonte)');
    expect(ANNO_TARGET_ASSENTE).toEqual({ disponibile: false, testo: 'non valorizzato', nota: 'nessun target' });
    expect(TESTO_ASSENTE.motivo).toBe('NON_VALORIZZATO');
  });

  it('stati e definizioni dei wireframe approvati', () => {
    expect(testoVuoto(true)).toBe("Nessun intervento per i filtri scelti (per esempio un'azione portante senza interventi collegati).");
    expect(testoVuoto(false)).toBe('Nessun intervento nei report istituzionali.');
    expect(NESSUN_FILE).toMatch(/^Nessun file SMP non SIGC acquisito: /);
    expect(DEFINIZIONI_VERIFICA).toContain('solo saldate al 100% (definizione da confermare con ARSIAL)');
    expect(DEFINIZIONI_OUTPUT).toContain('somma dell\'output previsto delle Unit Amount');
  });
});

describe('RF016: i ventuno dati della verifica SMP non SIGC (TX-0016)', () => {
  it('ordine del wireframe; visibili di partenza le colonne del low-fi; due soli link verso l elenco', () => {
    expect(DATI_VERIFICA).toHaveLength(20);
    expect(DATI_VERIFICA.filter((d) => !d.nascosta).map((d) => d.colonna)).toEqual([
      'Avvisi attivati',
      'Avvisi chiusi',
      'Azioni attivate',
      'Dotazione avvisi',
      'Domande ricevute',
      'Spesa erogata (anticipi inclusi)',
      'Concessioni previste senza impegni',
      'Include top-up',
      'Importo top-up',
      'Output erogato',
    ]);
    expect(DATI_VERIFICA.filter((d) => d.link).map((d) => [d.campo, d.link])).toEqual([
      ['domandeRicevute', 'ricevute'],
      ['spesaErogata', 'spesa'],
    ]);
  });

  it('il titolo dell output erogato dice se e cumulativo; gli altri restano', () => {
    expect(titoloDato(dato('outputErogato'), 'colonna', true)).toBe('Output erogato (cumulativo)');
    expect(titoloDato(dato('outputErogato'), 'voce', true)).toBe('Output erogato (valore del file, cumulativo)');
    expect(titoloDato(dato('outputErogato'), 'voce', false)).toBe('Output erogato (valore del file)');
    expect(titoloDato(dato('includeTopUp'), 'voce', true)).toBe('La dotazione include top-up');
  });

  it('valori per l ordinamento e testi: numeri, euro, date, si e no, quantita con l unita; assente = null', () => {
    expect(valoreOrdinabile(SRD01, dato('dotazioneAvvisi'))).toBe(2000000);
    expect(valoreOrdinabile(SRD01, dato('domandeRicevute'))).toBe(3);
    expect(valoreOrdinabile(SRD01, dato('includeTopUp'))).toBe('sì');
    expect(valoreOrdinabile(SRD01, dato('chiusuraUltimoAvvisoAperto'))).toBe('2025-03-31');
    expect(valoreOrdinabile(VERIFICA.righe[0], dato('avvisiAttivati'))).toBeNull();
    expect(testoValore('importo', 2000000)).toBe(new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2 }).format(2000000));
    expect(testoValore('data', '2025-03-31')).toBe('31/03/2025');
    expect(testoValore('siNo', false)).toBe('no');
    expect(testoValore('quantita', 40, 'ettari')).toBe('40 ettari');
    expect(testoValore('conteggio', 12345)).toBe('12.345');
    expect(testoValore('testo', 'O.20')).toBe('O.20');
  });

  it('link verso l elenco: solo col valore maggiore di 0 e col grant della destinazione (OP-IS-09)', () => {
    const tutto = () => true;
    expect(indirizzoDelDato(SRD01, dato('domandeRicevute'), tutto)).toBe('/elenco-operativo/domande?tipo=SOSTEGNO&intervento=SRD01');
    expect(indirizzoDelDato(SRD01, dato('spesaErogata'), tutto)).toBe('/elenco-operativo/pagamenti?esito=PAGATA&sigc=false&intervento=SRD01');
    // SRA01 e' SIGC: zero domande e zero spesa non SIGC, niente link verso un elenco vuoto
    expect(indirizzoDelDato(VERIFICA.righe[0], dato('domandeRicevute'), tutto)).toBeNull();
    expect(indirizzoDelDato(VERIFICA.righe[0], dato('spesaErogata'), tutto)).toBeNull();
    expect(indirizzoDelDato(SRD01, dato('spesaErogata'), (l) => l === 'ricevute')).toBeNull();
    expect(indirizzoDelDato(SRD01, dato('dotazioneAvvisi'), tutto)).toBeNull();
    expect(TESTI_LINK.ricevute('SRD01')).toEqual({ descrizione: "le domande di sostegno correnti dell'intervento SRD01" });
    expect(TESTI_LINK.spesa('SRD01')).toEqual({ testo: 'Apri nei pagamenti', descrizione: "le righe pagate non SIGC dell'intervento SRD01" });
  });

  it('riferimenti della risposta e testo della ricerca', () => {
    expect(vociRiferimenti(VERIFICA, undefined)).toEqual([
      { etichetta: 'Anno di riferimento', valore: '2025 (ultimo anno con un file SMP non SIGC presente)' },
      { etichetta: 'Output erogato', valore: 'valore del file, cumulativo per anno di riferimento' },
      { etichetta: 'Perimetro', valore: 'regionale' },
    ]);
    expect(testoRicerca(SRD01)).toBe('SRD01 O.20 R.9');
    expect(testoRicerca(VERIFICA.righe[0])).toBe('SRA01  ');
  });
});

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

  it('didascalia con la misura; voci del drawer; importi in ordine di esercizio e codice; riga e ricerca', () => {
    expect(captionOutput('programmato', true)).toBe("Output programmato per anno (misura scelta sopra), l'intervento è l'intestazione di riga e gli anni vengono dalla risposta");
    expect(captionOutput('realizzatoSigc', true)).toMatch(/^Output realizzato SIGC per anno/);
    expect(vociAnteprima(SRA01_OUTPUT, true)).toEqual([
      { termine: 'Indicatore di output', valore: 'O.14 (ettari)' },
      { termine: 'Target di fine periodo', valore: '1500 ettari al 2029' },
      { termine: 'Realizzato non SIGC', valore: 'cumulativo per anno di riferimento' },
    ]);
    const srg01 = OUTPUT.righe[3];
    expect(vociAnteprima(srg01, false).map((v) => v.valore)).toEqual(['non valorizzato', 'non valorizzato (il dato non è presente nella fonte)', 'annuale']);
    expect(importiOrdinati(SRA01_OUTPUT).map((i) => `${i.esercizio} ${i.codiceUnitAmount}`)).toEqual(['2024 UA01', '2024 UA02', '2025 UA01']);
    expect(SRA01_OUTPUT.importiUnitari[0].codiceUnitAmount).toBe('UA02');
    expect(rigaDellIntervento(OUTPUT.righe, 'SRD01')?.unitaMisura).toBe('numero di operazioni');
    expect(rigaDellIntervento(undefined, 'SRD01')).toBeUndefined();
    expect(testoRicercaOutput(SRA01_OUTPUT)).toBe('SRA01 O.14 ettari');
  });
});

describe('RF016 e RF017: il dettaglio dell intervento (testata, KPI, ultimo dato, esito)', () => {
  it('titolo dalla descrizione di TX-0060 o dal codice; sopratitolo; badge dagli indicatori letti', () => {
    expect(titoloIntervento('SRA01', 'Produzione integrata')).toBe('Produzione integrata');
    expect(titoloIntervento('SRA01', undefined)).toBe('Intervento SRA01');
    expect(sopratitoloIntervento('SRA01')).toBe('Istituzionale - intervento SRA01');
    expect(badgeIntervento(OUTPUT.righe[2], SRD01)).toEqual(['Perimetro regionale', 'Indicatore di output O.20 (numero di operazioni)', 'Indicatore di risultato R.9']);
    expect(badgeIntervento(undefined, SRD01)).toEqual(['Perimetro regionale', 'Indicatore di output O.20', 'Indicatore di risultato R.9']);
    expect(badgeIntervento(OUTPUT.righe[3], undefined)).toEqual(['Perimetro regionale']);
  });

  it('KPI: target da TX-0017, domande e spesa da TX-0016, solo con la riga della loro lettura; assenze in frase', () => {
    expect(kpiIntervento(OUTPUT.righe[2], SRD01).map((k) => [k.etichetta, k.valore ?? k.assente, k.nota])).toEqual([
      ['Target di fine periodo', '10 numero di operazioni al 2029', 'TX-0017'],
      ['Domande ricevute non SIGC', '3', 'TX-0016'],
      ['Domande finanziate non SIGC', '2', 'TX-0016'],
      ['Spesa pubblica erogata non SIGC', new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2 }).format(90000), 'TX-0016, anticipi inclusi'],
    ]);
    expect(kpiIntervento(OUTPUT.righe[3], undefined)).toEqual([{ chiave: 'target', etichetta: 'Target di fine periodo', assente: 'Non valorizzato: il dato non è presente nella fonte', nota: 'TX-0017' }]);
    expect(kpiIntervento(undefined, { ...SRD01, spesaErogata: { valore: null, motivo: 'NON_VALORIZZATO', fonte: null } }).at(-1)?.assente).toBe('Non valorizzato: il dato non è presente nella fonte');
    expect(kpiIntervento(undefined, undefined)).toEqual([]);
  });

  it('ultimo dato della prima risposta; stato: caricamento, errore, vuoto (AT001), dati anche con una sola lettura riuscita', () => {
    expect(ultimiDelDettaglio(undefined, OUTPUT)).toBe(OUTPUT.ultimiDatiSincronizzati);
    expect(ultimiDelDettaglio(VERIFICA, undefined)).toEqual(ULTIMI);
    expect(ultimiDelDettaglio(undefined, undefined)).toBeUndefined();
    const ok = (data: { righe: readonly unknown[] }) => ({ data, isError: false });
    const inCorso = { data: undefined, isError: false };
    const errore = { data: undefined, isError: true };
    // prima apertura: lo scheletro finche' non hanno risposto tutte (KPI e schede insieme, AT001 non passa dai dati)
    expect(statoDelDettaglio([ok(VERIFICA), inCorso], false)).toBe('caricamento');
    expect(statoDelDettaglio([ok({ righe: [] }), inCorso], false)).toBe('caricamento');
    expect(statoDelDettaglio([errore, errore], false)).toBe('errore');
    expect(statoDelDettaglio([ok({ righe: [] }), ok({ righe: [] })], false)).toBe('vuoto');
    expect(statoDelDettaglio([ok({ righe: [] })], false)).toBe('vuoto');
    expect(statoDelDettaglio([ok({ righe: [] }), ok(OUTPUT)], false)).toBe('dati');
    expect(statoDelDettaglio([errore, ok(OUTPUT)], false)).toBe('dati');
    // una lettura in errore accanto a una riuscita senza righe: i dati, con l'errore nella sua scheda
    expect(statoDelDettaglio([errore, ok({ righe: [] })], false)).toBe('dati');
    // dopo la prima risposta una lettura che riparte (Riprova, un altro anno dopo un errore) accanto a una coi dati
    // lascia la pagina coi dati: lo scheletro e' nella sua scheda (review H1/X1)
    expect(statoDelDettaglio([inCorso, ok(OUTPUT)], true)).toBe('dati');
    expect(statoDelDettaglio([inCorso, ok({ righe: [] })], true)).toBe('dati');
    // senza dati lo scheletro torna: Riprova dopo l'errore di tutte
    expect(statoDelDettaglio([inCorso, inCorso], true)).toBe('caricamento');
    expect(statoDelDettaglio([errore, inCorso], true)).toBe('caricamento');
    // nessuna lettura abilitata: il profilo e' in caricamento
    expect(statoDelDettaglio([], false)).toBe('caricamento');
    expect(statoDelDettaglio([], true)).toBe('caricamento');
    expect([tutteRisposte([errore, ok(OUTPUT)]), tutteRisposte([inCorso, ok(OUTPUT)]), tutteRisposte([])]).toEqual([true, false, false]);
    // la pill "Dati al" e' in errore solo se tutte le letture fatte lo sono, mai senza letture
    expect([ultimoDatoInErrore([errore, errore]), ultimoDatoInErrore([errore, ok(OUTPUT)]), ultimoDatoInErrore([])]).toEqual([true, false, false]);
  });

  it('schede per grant nell ordine del wireframe; didascalia delle voci; testi degli stati', () => {
    expect(schedeVisibili(true, true).map((s) => TITOLI_SCHEDE[s])).toEqual(['Output per anno', 'Verifica SMP non SIGC', 'Importi unitari']);
    expect(schedeVisibili(true, false)).toEqual(['verifica']);
    expect(schedeVisibili(false, true)).toEqual(['output', 'importi']);
    expect(captionVociVerifica(2025)).toBe("I dati ASR non SIGC dell'intervento da confrontare con SMP (anno di riferimento 2025), con i valori assenti e il loro motivo");
    expect(captionVociVerifica(null)).toContain('(anno di riferimento nessun file)');
    expect(testoAggiornamentoAnno(2024)).toBe("Lettura dell'anno 2024 in corso: restano i dati dell'anno precedente.");
    expect(testoAggiornamentoAnno(undefined)).toBe("Lettura dell'ultimo anno con un file in corso: restano i dati dell'anno precedente.");
    expect(SENZA_UNIT_AMOUNT).toMatch(/^Intervento senza Unit Amount/);
    expect(SENZA_DATI).toContain('AT001');
  });
});

describe('RF016 e RF017: grafici (spesa per intervento, output per anno col target)', () => {
  it('spesa erogata: una barra per intervento con valore (lo zero e un valore vero), gli assenti omessi col motivo', () => {
    const conAssente = [...VERIFICA.righe, { ...SRD01, codiceIntervento: 'SRD04', spesaErogata: { valore: null, motivo: 'NON_VALORIZZATO', fonte: null } }];
    const g = graficoSpesa(conAssente);
    expect(TITOLO_SPESA).toBe('Spesa pubblica erogata per intervento (anticipi inclusi)');
    const serie = (g.opzioni?.series as BarSeriesOption[])[0];
    expect((serie.data as Array<{ value: number; codice: string }>).map((d) => [d.codice, d.value])).toEqual([
      ['SRA01', 0],
      ['SRD01', 90000],
      ['SRA16', 1200.5],
    ]);
    expect(g.omessi).toEqual(['SRD04, spesa pubblica erogata: non valorizzato (il dato non è presente nella fonte)']);
    expect(g.tabella.righe.at(-1)).toEqual(['SRD04', 'non valorizzato (il dato non è presente nella fonte)']);
    expect(graficoSpesa([]).opzioni).toBeNull();
  });

  it('output per anno: tre serie nell unita dell indicatore, anni senza valore omessi col motivo, il target linea e riga', () => {
    const g = graficoOutputPerAnno(SRA01_OUTPUT, true);
    const serie = g.opzioni?.series as BarSeriesOption[];
    expect(serie.map((s) => s.name)).toEqual(['Programmato', 'Realizzato SIGC', 'Realizzato non SIGC (cumulativo)']);
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
});

describe('fixture: le risposte di prova filtrano come il backend (SC-IS_FILTRI, SC-IS_SMP_ANNO)', () => {
  it('intervento, obiettivi (E fra dimensioni, O fra valori), azione senza legame: nessuna riga', () => {
    const codici = (p: string) => righeDeiFiltri(OUTPUT.righe, new URLSearchParams(p)).map((r) => r.codiceIntervento);
    expect(codici('')).toEqual(['SRA01', 'SRA16', 'SRD01', 'SRG01']);
    expect(codici('os=OS4')).toEqual(['SRD01']);
    expect(codici('os=OS4&os=OS5')).toEqual(['SRA01', 'SRA16', 'SRD01']);
    expect(codici('og=OG1&op=OP1')).toEqual(['SRA01']);
    expect(codici('azione=3')).toEqual([]);
    expect(outputPer(OUTPUT, new URLSearchParams('intervento=SRD01')).righe).toHaveLength(1);
    const anno2024 = verificaPer(VERIFICA, new URLSearchParams('anno=2024&intervento=SRD01'));
    expect([anno2024.annoRiferimento, anno2024.righe[0].dotazioneAvvisi.motivo, anno2024.righe[0].outputErogato.valore, anno2024.righe[0].domandeRicevute]).toEqual([2024, 'ANNO_NON_CONSERVATO', 7, 3]);
  });
});
