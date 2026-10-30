// Test L1 delle funzioni PURE dell'istituzionale (lib/): grant e pagine, criteri nell'indirizzo, link dello uiplan, testi,
// i ventuno dati della verifica, il dettaglio dell'intervento e i builder dei grafici (anche quello della verifica SMP
// SIGC, dal finanziario il 29/10/2026; l'output regionale e i suoi test sono del fisico). Chiamate dirette, niente
// render; i dati sono quelli degli scenari del backend (fixture dell'istituzionale).
import type { BarSeriesOption } from 'echarts';
import { describe, expect, it } from 'vitest';
import { GRANT, puoLeggere } from '../src/features/istituzionale/lib/grant';
import { GRANT_DETTAGLIO, PAGINE_ISTITUZIONALE, PERCORSI, pagineVisibili, ricercaConservata } from '../src/features/istituzionale/lib/pagine';
import { ANNI_DEL_PERIODO, ESERCIZI, anniDiRiferimento, conFiltri, criteriVerifica, criteriVerificaSigc, esercizioUltimoChiuso, eserciziProposti, filtriVerificaSigcSenzaFiltri, ricercaConAnno, ricercaConParametro, soloIntervento, testiCriteri, testiCriteriSigc } from '../src/features/istituzionale/lib/criteri';
import { codiceDelPercorso } from '../src/entities/filtri';
import { assenzaInFrase, testoMotivato } from '../src/entities/importo';
import {
  VERIFICA_SMP_SIGC,
  conValore,
  elencoRicevute,
  elencoSpesa,
  percorsoIntervento,
  percorsoInterventoSigc,
  verificaDellIntervento,
  verificaNonSigcConFiltri,
  verificaSigcConFiltri,
  verificaSigcDellIntervento,
} from '../src/features/istituzionale/lib/collegamenti';
import {
  DEFINIZIONI_VERIFICA,
  DEFINIZIONI_VERIFICA_SIGC,
  NESSUN_DATO_SIGC,
  NESSUN_FILE,
  PERIMETRO_IN_PAROLE,
  PILL_PERIMETRO,
  SCEGLI_ESERCIZIO,
  periodoEsercizio,
  pillAnnoDelFile,
  pillEsercizio,
  quantitaConIndicatore,
  siNo,
  testoAnnoDiRiferimento,
  testoOutputErogato,
  testoVuoto,
} from '../src/features/istituzionale/lib/formato';
import { DATI_VERIFICA, TESTI_LINK, indirizzoDelDato, testoRicerca, testoValore, titoloDato, valoreOrdinabile, vociRiferimenti } from '../src/features/istituzionale/lib/verifica';
import type { DatoVerifica } from '../src/features/istituzionale/lib/verifica';
import { statoDelDettaglio, tutteRisposte } from '../src/shared/lib';
import {
  BADGE_INTERVENTO,
  SENZA_DATI,
  SENZA_DATI_SIGC,
  TITOLI_SCHEDE,
  captionVociVerifica,
  captionVociVerificaSigc,
  kpiVerifica,
  kpiVerificaSigc,
  lettureDelloStato,
  schedaAttiva,
  schedaIniziale,
  schedeVisibili,
  statoDellaPagina,
  testoAggiornamentoAnno,
  testoAggiornamentoEsercizio,
  ultimoDatoInErrore,
  sopratitoloIntervento,
  titoloIntervento,
  ultimiDelDettaglio,
} from '../src/features/istituzionale/lib/intervento';
import { DATI_VERIFICA_SIGC, testoEsercizio, testoRicercaSigc, valoreOrdinabileSigc, vociRiferimentiSigc, vociRiferimentiSigcIntervento } from '../src/features/istituzionale/lib/verificaSigc';
import type { DatoVerificaSigc } from '../src/features/istituzionale/lib/verificaSigc';
import { TITOLO_SPESA, TITOLO_SPESA_SIGC, graficoSpesa, graficoSpesaSigc } from '../src/features/istituzionale/lib/grafici';
import { SRD01, ULTIMI, VERIFICA, VERIFICA_SMP, dato as datoSmp, nd, nv, rigaSmp, righeDeiFiltri, verificaPer, verificaSigcPer } from '../src/features/istituzionale/testing/fixture';
import { anteprimaVerifica, anteprimaVerificaSigc, etichetteAnteprima, etichetteAnteprimaSigc, nomeGruppoSigc, riferimentoAnteprima, riferimentoAnteprimaSigc } from '../src/features/istituzionale/lib/anteprima';
import type { RigaVerifica } from '../src/features/istituzionale/lib/dto';

const dato = (campo: DatoVerifica['campo']) => DATI_VERIFICA.find((d) => d.campo === campo) as DatoVerifica;
const status = (roles: string[]) => ({ authenticated: true, user: { username: 'U', profile: 'p3-funzionario-area-ist', roles } });

describe('RF016 e RF015: grant e pagine dell istituzionale (menu e Home)', () => {
  it('grant verbatim del catalogo; puoLeggere col solo hasGrant, senza stato no', () => {
    expect(GRANT).toEqual({
      verifica: 'csr.tx-0016.read',
      filtri: 'csr.tx-0060.read',
      elencoDomande: 'csr.tx-0056.read',
      elencoPagamenti: 'csr.tx-0059.read',
      verificaSigc: 'csr.tx-0015.read',
    });
    expect(puoLeggere(status(['csr.tx-0016.read']), 'verifica')).toBe(true);
    expect(puoLeggere(status(['csr.tx-0016.read']), 'verificaSigc')).toBe(false);
    expect(puoLeggere(undefined, 'verifica')).toBe(false);
  });

  it('le due verifiche nel menu per grant, prima la non SIGC; il dettaglio con la non SIGC; i filtri restano fra i due report, anno ed esercizio no', () => {
    expect(PAGINE_ISTITUZIONALE.map((p) => [p.percorso, p.voceMenu])).toEqual([
      ['/istituzionale/verifica-smp-non-sigc', 'Verifica SMP non SIGC'],
      ['/istituzionale/verifica-smp-sigc', 'Verifica SMP SIGC'],
    ]);
    expect(pagineVisibili((g) => g === 'csr.tx-0015.read').map((p) => p.percorso)).toEqual([PERCORSI.verificaSigc]);
    expect(pagineVisibili(() => false)).toEqual([]);
    // l'output regionale (TX-0017) e' del fisico dal 29/10/2026: nessuna pagina dell'istituzionale col suo grant
    expect(pagineVisibili((g) => g === 'csr.tx-0017.read')).toEqual([]);
    // il dettaglio si apre con una delle due verifiche (una scheda ciascuna)
    expect(GRANT_DETTAGLIO).toEqual(['csr.tx-0016.read', 'csr.tx-0015.read']);
    expect(ricercaConservata('?intervento=SRD01&anno=2024&os=OS4&x=1')).toBe('intervento=SRD01&os=OS4');
    expect(ricercaConservata('?esercizio=2025&og=OG1')).toBe('og=OG1');
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

  it('verifica SMP SIGC: l esercizio resta coi filtri nuovi; esercizi 2023-2030 (regola n+2) e quello scelto; criteri e testi del PNG', () => {
    const conEsercizio = ricercaConParametro('esercizio');
    expect(conEsercizio({ intervento: ['SRD01'] }, '?esercizio=2025&anno=2024')).toBe('intervento=SRD01&esercizio=2025');
    expect(conEsercizio({}, '?esercizio=abc')).toBe('');
    expect(ESERCIZI).toEqual({ primo: 2023, ultimo: 2030 });
    expect(eserciziProposti(undefined)).toEqual([2023, 2024, 2025, 2026, 2027, 2028, 2029, 2030]);
    expect(eserciziProposti(2031).at(-1)).toBe(2031);
    expect(criteriVerificaSigc({ os: ['OS4'] }, 2025)).toEqual({ os: ['OS4'], esercizio: 2025 });
    expect(testiCriteriSigc({ intervento: ['SRD01'] }, 2025)).toEqual(['Intervento: SRD01', 'Esercizio: 2025']);
  });

  it('l ultimo esercizio chiuso (card della Home, scelta del 30/10/2026): dal 16 ottobre quello dell anno, prima quello precedente', () => {
    expect(esercizioUltimoChiuso(new Date(2026, 9, 15, 23, 59))).toBe(2025);
    expect(esercizioUltimoChiuso(new Date(2026, 9, 16, 0, 0))).toBe(2026);
    expect(esercizioUltimoChiuso(new Date(2026, 9, 30))).toBe(2026);
    expect(esercizioUltimoChiuso(new Date(2026, 11, 31))).toBe(2026);
    expect(esercizioUltimoChiuso(new Date(2027, 0, 1))).toBe(2026);
    expect(esercizioUltimoChiuso(new Date(2026, 8, 30))).toBe(2025);
    // la card legge come la pagina aperta senza filtri (stessa query, stessa cache)
    expect(filtriVerificaSigcSenzaFiltri()).toEqual({});
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

describe('RF016 e RF015: i link dello uiplan (dettaglio, report filtrati, elenco operativo, verifica SMP SIGC)', () => {
  it('il codice nel percorso del dettaglio e codificato: un valore con / resta un segmento; l anno solo se valido', () => {
    expect(percorsoIntervento('SRA01')).toBe('/istituzionale/interventi/SRA01');
    expect(percorsoIntervento('SRA01', 2024)).toBe('/istituzionale/interventi/SRA01?anno=2024');
    expect(percorsoIntervento('SR/../A01', 1999)).toBe('/istituzionale/interventi/SR%2F..%2FA01');
  });

  it('la verifica filtrata sull intervento, nell ordine della query dello uiplan; la verifica SIGC nella stessa area (G4)', () => {
    expect(verificaDellIntervento('SRA01', 2024)).toBe('/istituzionale/verifica-smp-non-sigc?intervento=SRA01&anno=2024');
    expect(verificaDellIntervento('SRA01')).toBe('/istituzionale/verifica-smp-non-sigc?intervento=SRA01');
    expect(VERIFICA_SMP_SIGC).toBe('/istituzionale/verifica-smp-sigc');
    // link:verifica-smp-sigc-intervento: intervento ed esercizio, nell'ordine della query dello uiplan
    expect(verificaSigcDellIntervento('SRA01', 2025)).toBe('/istituzionale/verifica-smp-sigc?intervento=SRA01&esercizio=2025');
    expect(verificaSigcDellIntervento('SR/A01')).toBe('/istituzionale/verifica-smp-sigc?intervento=SR%2FA01');
  });

  it('link:dettaglio-intervento-smp-sigc: il dettaglio col codice codificato e l esercizio solo se valido', () => {
    expect(percorsoInterventoSigc('SRA01', 2025)).toBe('/istituzionale/interventi/SRA01?esercizio=2025');
    expect(percorsoInterventoSigc('SR/../A01', 1999)).toBe('/istituzionale/interventi/SR%2F..%2FA01');
    expect(percorsoInterventoSigc('SRA01')).toBe('/istituzionale/interventi/SRA01');
  });

  it('link reciproci fra le due verifiche (scelta di disegno 1): i filtri comuni nell ordine dello uiplan, mai l anno ne l esercizio', () => {
    const filtri = { azione: ['3'], intervento: ['SRD01', 'SRA01'], og: ['OG1'], os: ['OS4'], op: ['OP1'] };
    expect(verificaSigcConFiltri(filtri)).toBe('/istituzionale/verifica-smp-sigc?intervento=SRD01&intervento=SRA01&os=OS4&og=OG1&op=OP1&azione=3');
    expect(verificaNonSigcConFiltri(filtri)).toBe('/istituzionale/verifica-smp-non-sigc?intervento=SRD01&intervento=SRA01&os=OS4&og=OG1&op=OP1&azione=3');
    expect([verificaSigcConFiltri({}), verificaNonSigcConFiltri({})]).toEqual(['/istituzionale/verifica-smp-sigc', '/istituzionale/verifica-smp-non-sigc']);
  });

  it('elenco operativo: ricevute = domande di sostegno, spesa = righe PAGATA non SIGC (D-05); link solo con un valore positivo', () => {
    expect(elencoRicevute('SRD01')).toBe('/elenco-operativo/domande?tipo=SOSTEGNO&intervento=SRD01');
    expect(elencoSpesa('SRD01')).toBe('/elenco-operativo/pagamenti?esito=PAGATA&sigc=false&intervento=SRD01');
    expect([conValore(3), conValore(0), conValore(null), conValore(undefined), conValore(-1)]).toEqual([true, false, false, false, false]);
  });
});

describe('RF016 e RF015: testi (perimetro, anno, esercizio, quantita, assenze, definizioni)', () => {
  it('perimetro, anno del file ed esercizio della barra', () => {
    expect(PILL_PERIMETRO).toBe('Perimetro: regionale (i report istituzionali non hanno perimetro ADA)');
    expect(PERIMETRO_IN_PAROLE).toBe('regionale');
    expect(pillAnnoDelFile(2025)).toBe('Anno di riferimento del file SMP non SIGC: 2025');
    expect(pillAnnoDelFile(null)).toBe('Anno di riferimento del file SMP non SIGC: nessun file');
    expect(pillEsercizio(2025)).toBe('Esercizio finanziario: 2025 (dal 16/10/2024 al 15/10/2025)');
    expect(periodoEsercizio(2023)).toBe('dal 16/10/2022 al 15/10/2023');
    expect(pillEsercizio(undefined)).toBe('Esercizio finanziario: non indicato');
    expect(testoAnnoDiRiferimento(2025, undefined)).toBe('2025 (ultimo anno con un file SMP non SIGC presente)');
    expect(testoAnnoDiRiferimento(2024, 2024)).toBe('2024');
    expect(testoAnnoDiRiferimento(null, 2023)).toBe('nessun file SMP non SIGC presente');
    expect([testoOutputErogato(true), testoOutputErogato(false)]).toEqual(['valore del file, cumulativo per anno di riferimento', 'valore del file per anno di riferimento']);
  });

  it('quantita con l unita, si e no e dati motivati (i facoltativi sono del kit: tests/lib.test.ts); mai uno zero al posto di un assente', () => {
    // OP-IS-12: l'unita' di misura non c'e' nelle due verifiche, la quantita' ha accanto il codice dell'indicatore
    expect([quantitaConIndicatore(40, 'O.20'), quantitaConIndicatore(12, null), quantitaConIndicatore(12345, ' '), quantitaConIndicatore(12345, 'O.14')]).toEqual(['40 (indicatore O.20)', '12', '12.345', '12.345 (indicatore O.14)']);
    expect([siNo(true), siNo(false)]).toEqual(['sì', 'no']);
    expect(testoMotivato({ valore: 7, motivo: null }, String)).toBe('7');
    expect(testoMotivato({ valore: null, motivo: 'ANNO_NON_CONSERVATO' }, String)).toBe("non disponibile per l'anno scelto (l'avviso porta i dati del file più recente)");
    expect(testoMotivato(undefined, String)).toBe('non disponibile');
    expect(assenzaInFrase({ motivo: 'NON_VALORIZZATO' })).toBe('Non valorizzato: il dato non è presente nella fonte');
    expect(assenzaInFrase(null)).toBe('Non disponibile');
  });

  it('stati e definizioni dei wireframe approvati', () => {
    expect(testoVuoto(true)).toBe("Nessun intervento per i filtri scelti (per esempio un'azione portante senza interventi collegati).");
    expect(testoVuoto(false)).toBe('Nessun intervento nei report istituzionali.');
    expect(NESSUN_FILE).toMatch(/^Nessun file SMP non SIGC acquisito: /);
    expect(DEFINIZIONI_VERIFICA).toContain('solo saldate al 100% (definizione da confermare con ARSIAL)');
    expect(SCEGLI_ESERCIZIO).toBe("Scegli l'esercizio finanziario da consultare.");
    expect(NESSUN_DATO_SIGC).toBe("Nessun dato SIGC per l'esercizio e i filtri scelti. Scegli un altro esercizio oppure");
    expect(DEFINIZIONI_VERIFICA_SIGC).toMatch(/^Definizioni del backend \(decisioni di finanziario richiamate da istituzionale\): esercizio n = dal 16\/10\/n-1 al 15\/10\/n/);
    expect(DEFINIZIONI_VERIFICA_SIGC).toContain('previsione di pagamento = sì/no del monitoraggio SMP (D-11)');
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
    expect(testoValore('quantita', 40, 'O.20')).toBe('40 (indicatore O.20)');
    expect(testoValore('quantita', 40)).toBe('40');
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
    // fail-closed sul codice della risposta (review A2): un codice che l'elenco scarterebbe non apre l'elenco intero
    for (const codice of [' ', 'SRD01\u200B', '', 'SRD01&tipo=PAGAMENTO']) {
      expect(indirizzoDelDato({ ...SRD01, codiceIntervento: codice }, dato('domandeRicevute'), tutto)).toBeNull();
      expect(indirizzoDelDato({ ...SRD01, codiceIntervento: codice }, dato('spesaErogata'), tutto)).toBeNull();
    }
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

describe('RF016 e RF015: il dettaglio dell intervento (testata, schede, KPI per scheda, ultimo dato, esito)', () => {
  const euro = (v: number) => new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2 }).format(v);

  it('titolo dalla descrizione di TX-0060 o dal codice; sopratitolo; il solo badge del perimetro (gli indicatori sono nelle voci)', () => {
    expect(titoloIntervento('SRA01', 'Produzione integrata')).toBe('Produzione integrata');
    expect(titoloIntervento('SRA01', undefined)).toBe('Intervento SRA01');
    expect(sopratitoloIntervento('SRA01')).toBe('Istituzionale - intervento SRA01');
    expect(BADGE_INTERVENTO).toEqual(['Perimetro regionale']);
  });

  it('KPI della scheda non SIGC: domande e spesa cumulative da TX-0016, col periodo nella nota; assenze in frase', () => {
    expect(kpiVerifica(SRD01).map((k) => [k.etichetta, k.valore ?? k.assente, k.nota])).toEqual([
      ['Domande ricevute non SIGC', '3', 'TX-0016, cumulative'],
      ['Domande finanziate non SIGC', '2', 'TX-0016, cumulative'],
      ['Spesa pubblica erogata non SIGC', euro(90000), 'TX-0016, anticipi inclusi, cumulativa'],
    ]);
    expect(kpiVerifica({ ...SRD01, spesaErogata: { valore: null, motivo: 'NON_VALORIZZATO', fonte: null } }).at(-1)?.assente).toBe('Non valorizzato: il dato non è presente nella fonte');
  });

  it('KPI della scheda SIGC: ricevute e finanziate della campagna n-1, spesa della campagna precedente pagata nell esercizio n', () => {
    expect(kpiVerificaSigc(VERIFICA_SMP.righe[0], 2025, 2024).map((k) => [k.chiave, k.etichetta, k.valore ?? k.assente, k.nota])).toEqual([
      ['ricevute', 'Domande ricevute SIGC (campagna 2024)', '120', 'TX-0015, esercizio 2025'],
      ['finanziate', 'Domande finanziate SIGC (campagna 2024)', '100', 'TX-0015, esercizio 2025'],
      ['spesa', 'Spesa erogata SIGC, campagna 2024', euro(400000), "TX-0015, pagata nell'esercizio 2025"],
    ]);
    // campi facoltativi della spec: un conteggio assente e' "Non disponibile", una spesa assente dice il motivo, mai uno zero
    const senza = kpiVerificaSigc({ codiceIntervento: 'SRA03', spesaErogataCampagnaPrecedente: nd('IMPEGNI') }, 2025, 2024);
    expect(senza.map((k) => k.assente)).toEqual(['Non disponibile', 'Non disponibile', 'Non disponibile: fonte impegni non attiva']);
  });

  it('ultimo dato della prima risposta arrivata fra TX-0016 e TX-0015; le letture senza risposta non contano', () => {
    const non = { data: VERIFICA, dataUpdatedAt: 20 };
    const sigc = { data: { ...VERIFICA_SMP, ultimiDatiSincronizzati: [ULTIMI[1]] }, dataUpdatedAt: 10 };
    expect(ultimiDelDettaglio([non, sigc])).toEqual([ULTIMI[1]]);
    expect(ultimiDelDettaglio([non, null])).toEqual(ULTIMI);
    expect(ultimiDelDettaglio([{ data: undefined, dataUpdatedAt: 0 }, sigc])).toEqual([ULTIMI[1]]);
    expect(ultimiDelDettaglio([null, null])).toBeUndefined();
    expect(ultimiDelDettaglio([])).toBeUndefined();
  });

  it('stato del kit: caricamento, errore, vuoto (AT001), dati anche con una sola lettura riuscita', () => {
    const ok = (data: { righe: readonly unknown[] }) => ({ data, isError: false });
    const inCorso = { data: undefined, isError: false };
    const errore = { data: undefined, isError: true };
    // prima apertura: lo scheletro finche' non hanno risposto tutte (KPI e schede insieme, AT001 non passa dai dati)
    expect(statoDelDettaglio([ok(VERIFICA), inCorso], false)).toBe('caricamento');
    expect(statoDelDettaglio([ok({ righe: [] }), inCorso], false)).toBe('caricamento');
    expect(statoDelDettaglio([errore, errore], false)).toBe('errore');
    expect(statoDelDettaglio([ok({ righe: [] }), ok({ righe: [] })], false)).toBe('vuoto');
    expect(statoDelDettaglio([ok({ righe: [] })], false)).toBe('vuoto');
    expect(statoDelDettaglio([ok({ righe: [] }), ok(VERIFICA)], false)).toBe('dati');
    expect(statoDelDettaglio([errore, ok(VERIFICA)], false)).toBe('dati');
    // una lettura in errore accanto a una riuscita senza righe: i dati, con l'errore nella sua scheda
    expect(statoDelDettaglio([errore, ok({ righe: [] })], false)).toBe('dati');
    // dopo la prima risposta una lettura che riparte (Riprova, un altro anno dopo un errore) accanto a una coi dati
    // lascia la pagina coi dati: lo scheletro e' nella sua scheda (review H1/X1)
    expect(statoDelDettaglio([inCorso, ok(VERIFICA)], true)).toBe('dati');
    expect(statoDelDettaglio([inCorso, ok({ righe: [] })], true)).toBe('dati');
    // senza dati lo scheletro torna: Riprova dopo l'errore di tutte
    expect(statoDelDettaglio([inCorso, inCorso], true)).toBe('caricamento');
    expect(statoDelDettaglio([errore, inCorso], true)).toBe('caricamento');
    // nessuna lettura abilitata: il profilo e' in caricamento
    expect(statoDelDettaglio([], false)).toBe('caricamento');
    expect(statoDelDettaglio([], true)).toBe('caricamento');
    expect([tutteRisposte([errore, ok(VERIFICA)]), tutteRisposte([inCorso, ok(VERIFICA)]), tutteRisposte([])]).toEqual([true, false, false]);
    // la pill "Dati al" e' in errore solo se tutte le letture fatte lo sono, mai senza letture
    expect([ultimoDatoInErrore([errore, errore]), ultimoDatoInErrore([errore, ok(VERIFICA)]), ultimoDatoInErrore([])]).toEqual([true, false, false]);
  });

  it('stato della pagina: la verifica SIGC senza la riga non fa il vuoto della pagina (lo dice la sua scheda); senza letture partite le schede', () => {
    const vuota = { data: { righe: [] }, isError: false };
    const errore = { data: undefined, isError: true };
    // dal clic della verifica SIGC (la sola lettura partita) senza la riga dell'intervento: la pagina ha le schede
    expect(statoDelDettaglio(lettureDelloStato(null, vuota), false)).toBe('dati');
    // la verifica non SIGC senza righe (AT001) e' il vuoto della pagina
    expect(statoDelDettaglio(lettureDelloStato(vuota, null), false)).toBe('vuoto');
    expect(statoDelDettaglio(lettureDelloStato(vuota, vuota), false)).toBe('dati');
    expect(statoDelDettaglio(lettureDelloStato(null, errore), false)).toBe('errore');
    expect(lettureDelloStato(null, null)).toEqual([]);
    expect(lettureDelloStato(null, { data: undefined, isError: false })).toEqual([{ data: undefined, isError: false }]);
    // la scheda SIGC aperta senza esercizio non legge: le schede, non lo scheletro; senza schede (profilo in caricamento) lo scheletro
    expect(statoDellaPagina('caricamento', 0, 1)).toBe('dati');
    expect(statoDellaPagina('caricamento', 0, 0)).toBe('caricamento');
    expect(statoDellaPagina('caricamento', 1, 2)).toBe('caricamento');
    expect(statoDellaPagina('vuoto', 1, 2)).toBe('vuoto');
  });

  it('schede per grant nell ordine del wireframe; la scheda iniziale dalla pagina di partenza; la scheda attiva fra le visibili', () => {
    expect(schedeVisibili(true, true).map((s) => TITOLI_SCHEDE[s])).toEqual(['Verifica SMP non SIGC', 'Verifica SMP SIGC']);
    expect(schedeVisibili(false, true)).toEqual(['verificaSigc']);
    expect(schedeVisibili(true, false)).toEqual(['verifica']);
    expect(schedeVisibili(false, false)).toEqual([]);
    // con l'esercizio e senza l'anno (dalla verifica SIGC) la SIGC; altrimenti la non SIGC
    expect([schedaIniziale(undefined, 2025), schedaIniziale(2024, 2025), schedaIniziale(2024, undefined), schedaIniziale(undefined, undefined)]).toEqual(['verificaSigc', 'verifica', 'verifica', 'verifica']);
    expect(schedaAttiva(['verifica', 'verificaSigc'], 'verificaSigc')).toBe('verificaSigc');
    expect(schedaAttiva(['verifica'], 'verificaSigc')).toBe('verifica');
    expect(schedaAttiva([], 'verifica')).toBeUndefined();
  });

  it('didascalie delle voci col periodo; testi degli stati e dell aggiornamento', () => {
    expect(captionVociVerifica(2025)).toBe("I dati ASR non SIGC dell'intervento da confrontare con SMP (anno di riferimento 2025), con i valori assenti e il loro motivo");
    expect(captionVociVerifica(null)).toContain('(anno di riferimento nessun file)');
    expect(captionVociVerificaSigc(2025, 2024)).toBe("I dati SIGC dell'intervento da confrontare con SMP (esercizio 2025, domande della campagna 2024), con i valori assenti e il loro motivo");
    // lo stato dice l'anno dei dati che restano, lo stesso della didascalia (review X1): indietro, avanti, senza file
    expect(testoAggiornamentoAnno(2024, 2025)).toBe("Lettura dell'anno 2024 in corso: restano i dati dell'anno di riferimento 2025.");
    expect(testoAggiornamentoAnno(2025, 2024)).toBe("Lettura dell'anno 2025 in corso: restano i dati dell'anno di riferimento 2024.");
    expect(testoAggiornamentoAnno(undefined, 2023)).toBe("Lettura dell'ultimo anno con un file in corso: restano i dati dell'anno di riferimento 2023.");
    expect(testoAggiornamentoAnno(2024, null)).toBe("Lettura dell'anno 2024 in corso: restano i dati di prima (nessun file).");
    expect(testoAggiornamentoAnno(2024, undefined)).toBe("Lettura dell'anno 2024 in corso: restano i dati di prima.");
    expect(testoAggiornamentoEsercizio(2024, 2025)).toBe("Lettura dell'esercizio 2024 in corso: restano i dati dell'esercizio 2025.");
    expect(testoAggiornamentoEsercizio(2024, undefined)).toBe("Lettura dell'esercizio 2024 in corso: restano i dati di prima.");
    expect(SENZA_DATI).toBe("Nessun dato per questo intervento nella verifica SMP (l'Assistenza tecnica AT001 non è nei report).");
    expect(SENZA_DATI_SIGC).toBe("Nessun dato SIGC per questo intervento nell'esercizio scelto. Scegli un altro esercizio.");
  });
});

describe('RF015: i venti dati della verifica SMP SIGC (TX-0015) nella tabella e nella scheda del dettaglio', () => {
  const datoSigc = (campo: DatoVerificaSigc['campo']) => DATI_VERIFICA_SIGC.find((d) => d.campo === campo) as DatoVerificaSigc;

  it('ordine e titoli della pagina; visibili di partenza le colonne del low-fi; voci del wireframe intervento', () => {
    expect(DATI_VERIFICA_SIGC).toHaveLength(20);
    expect(DATI_VERIFICA_SIGC.filter((d) => !d.nascosta).map((d) => d.colonna)).toEqual([
      'Avvisi attivati',
      'Azioni attivate',
      'Domande ricevute',
      'Domande finanziate',
      "Domande pagate nell'esercizio",
      'Spesa erogata campagna precedente',
      'Spesa erogata campagne anteriori',
      "Si prevede di pagare nell'esercizio",
      'Include top-up',
      "Output erogato nell'esercizio",
    ]);
    expect(datoSigc('previsionePagamentoEsercizio').voce).toBe("Si prevede di pagare importi entro l'esercizio");
    expect(datoSigc('outputErogatoEsercizio').voce).toBe("Output erogato nell'esercizio (solo SIGC)");
    expect(new Set(DATI_VERIFICA_SIGC.map((d) => d.campo)).size).toBe(20);
  });

  it('valori per l ordinamento: numeri, si e no come testo, testi; assenti = null', () => {
    const r = rigaSmp({ avvisiAttivati: datoSmp(3), azioniAttivate: nv(), includeTopUp: datoSmp(true) });
    expect(valoreOrdinabileSigc(r, datoSigc('avvisiAttivati'))).toBe(3);
    expect(valoreOrdinabileSigc(r, datoSigc('azioniAttivate'))).toBeNull();
    expect(valoreOrdinabileSigc(r, datoSigc('includeTopUp'))).toBe('sì');
    expect(valoreOrdinabileSigc(r, datoSigc('domandeRicevute'))).toBe(120);
    expect(valoreOrdinabileSigc(r, datoSigc('spesaErogataCampagnaPrecedente'))).toBe(400000);
    expect(valoreOrdinabileSigc(r, datoSigc('indicatoreOutput'))).toBe('O.14');
    expect(valoreOrdinabileSigc(r, datoSigc('outputErogatoEsercizio'))).toBeNull();
    expect(valoreOrdinabileSigc({ codiceIntervento: 'SRA03' }, datoSigc('domandeRicevute'))).toBeNull();
    expect(testoRicercaSigc(r)).toBe('SRA01 O.14 ');
    expect(testoRicercaSigc({})).toBe('  ');
  });

  it('riferimenti della risposta: esercizio con gli estremi, anno delle domande, pagamenti senza data, perimetro', () => {
    expect(testoEsercizio(2025)).toBe('2025 (dal 16/10/2024 al 15/10/2025)');
    expect(testoEsercizio(2025, true)).toBe('2025 (dal 16/10/2024 al 15/10/2025, estremi compresi)');
    expect(vociRiferimentiSigc(VERIFICA_SMP, 2025)).toEqual([
      { etichetta: 'Esercizio', valore: '2025 (dal 16/10/2024 al 15/10/2025, estremi compresi)' },
      { etichetta: 'Anno delle domande', valore: '2024' },
      { etichetta: "Pagamenti senza data di autorizzazione (esclusi dall'esercizio)", valore: '3' },
      { etichetta: 'Perimetro', valore: 'regionale' },
    ]);
    expect(vociRiferimentiSigc({}, 2026).map((v) => v.valore)).toEqual(['2026 (dal 16/10/2025 al 15/10/2026, estremi compresi)', 'non disponibile', 'non disponibile', 'regionale']);
    expect(vociRiferimentiSigcIntervento({ ...VERIFICA_SMP, pagamentiSenzaData: 12345 }, 2025)).toEqual([
      { etichetta: 'Esercizio', valore: '2025 (dal 16/10/2024 al 15/10/2025)' },
      { etichetta: 'Anno delle domande', valore: '2024' },
      { etichetta: "Pagamenti dell'intervento senza data di autorizzazione (esclusi dall'esercizio)", valore: '12.345' },
    ]);
  });
});

describe('RF016 e RF015: grafici (spesa per intervento non SIGC e SIGC)', () => {
  it('spesa erogata: una barra per intervento con valore (lo zero e un valore vero), gli assenti omessi col motivo', () => {
    const conAssente = [...VERIFICA.righe, { ...SRD01, codiceIntervento: 'SRD04', spesaErogata: { valore: null, motivo: 'NON_VALORIZZATO', fonte: null } }];
    const g = graficoSpesa(conAssente);
    expect(TITOLO_SPESA).toBe('Spesa pubblica erogata per intervento (anticipi inclusi)');
    const serie = (g.opzioni?.series as BarSeriesOption[])[0];
    expect((serie.data as Array<{ value: number; codice: string }>).map((d) => [d.codice, d.value])).toEqual([
      ['SRA01', 0],
      ['SRA16', 1200.5],
      ['SRD01', 90000],
    ]);
    expect(g.omessi).toEqual(['SRD04, spesa pubblica erogata: non valorizzato (il dato non è presente nella fonte)']);
    expect(g.tabella.righe.at(-1)).toEqual(['SRD04', 'non valorizzato (il dato non è presente nella fonte)']);
    expect(graficoSpesa([]).opzioni).toBeNull();
  });

  // verifica SMP SIGC (TX-0015): gli stessi casi del grafico della pagina del finanziario da cui viene
  it('spesa erogata nella campagna precedente: barre per intervento col codice, assenti omessi e dichiarati (D-11: niente previsione)', () => {
    const righe = [
      { codiceIntervento: 'SRA01', spesaErogataCampagnaPrecedente: { valore: 2_000_000, motivo: null, fonte: null } },
      { codiceIntervento: 'SRA02', spesaErogataCampagnaPrecedente: { valore: null, motivo: 'NON_VALORIZZATO', fonte: null } },
    ];
    const g = graficoSpesaSigc(righe);
    expect(TITOLO_SPESA_SIGC).toBe('Spesa erogata nella campagna precedente per intervento');
    const serie = g.opzioni?.series as BarSeriesOption[];
    expect(serie.map((s) => [s.type, s.name])).toEqual([['bar', 'Spesa erogata nella campagna precedente']]);
    expect((g.opzioni?.xAxis as { data: string[] }).data).toEqual(['SRA01']);
    expect((serie[0].data as Array<{ codice: string }>)[0].codice).toBe('SRA01');
    expect(g.omessi).toEqual(['SRA02, spesa erogata nella campagna precedente: non valorizzato (il dato non è presente nella fonte)']);
    expect(g.tabella.colonne).toEqual(['Intervento', 'Spesa erogata nella campagna precedente']);
    expect(g.tabella.righe[0][0]).toBe('SRA01');
  });

  it('spesa erogata SIGC: oltre 12 interventi zoom interno e cursore; nessun valore non disegnabile', () => {
    const molte = Array.from({ length: 13 }, (_, k) => ({ codiceIntervento: `SRC${k + 10}`, spesaErogataCampagnaPrecedente: { valore: 1_000_000 } }));
    expect((graficoSpesaSigc(molte).opzioni?.dataZoom as Array<{ type: string }>).map((z) => z.type)).toEqual(['inside', 'slider']);
    const g = graficoSpesaSigc([{ codiceIntervento: 'SRA09' }]);
    expect(g.opzioni).toBeNull();
    expect(g.motivoAssenza).toBe('nessun intervento con spesa erogata valorizzata');
    expect(g.omessi).toEqual(['SRA09, spesa erogata nella campagna precedente: non disponibile']);
  });
});

describe('fixture: le risposte di prova filtrano come il backend (SC-IS_FILTRI, SC-IS_SMP_ANNO)', () => {
  it('intervento, obiettivi (E fra dimensioni, O fra valori), azione senza legame: nessuna riga', () => {
    const codici = (p: string) => righeDeiFiltri(VERIFICA.righe, new URLSearchParams(p)).map((r) => r.codiceIntervento);
    expect(codici('')).toEqual(['SRA01', 'SRA16', 'SRD01']);
    expect(codici('os=OS4')).toEqual(['SRD01']);
    expect(codici('os=OS4&os=OS5')).toEqual(['SRA01', 'SRA16', 'SRD01']);
    expect(codici('og=OG1&op=OP1')).toEqual(['SRA01']);
    expect(codici('azione=3')).toEqual([]);
    const sigc = verificaSigcPer(VERIFICA_SMP, new URLSearchParams('esercizio=2026&intervento=SRA01'));
    expect([sigc.esercizio, sigc.annoDomande, sigc.righe?.length]).toEqual([2026, 2025, 1]);
    expect(verificaSigcPer(VERIFICA_SMP, new URLSearchParams('esercizio=2025&os=OS4')).righe).toEqual([]);
    const anno2024 = verificaPer(VERIFICA, new URLSearchParams('anno=2024&intervento=SRD01'));
    expect([anno2024.annoRiferimento, anno2024.righe[0].dotazioneAvvisi.motivo, anno2024.righe[0].outputErogato.valore, anno2024.righe[0].domandeRicevute]).toEqual([2024, 'ANNO_NON_CONSERVATO', 7, 3]);
  });

  it('SC-IS_SMP_ANNO: tutti i dati dell avviso di un altro anno; nel 2023 (nessun file) indicatori e output non valorizzati', () => {
    const avviso = ['avvisiAttivati', 'avvisiChiusi', 'azioniAttivate', 'dotazioneAvvisi', 'chiusuraUltimoAvvisoAperto', 'includeTopUp', 'importoTopUp', 'concessioniPreviste'] as const;
    const file = ['indicatoreOutput', 'indicatoreRisultato', 'outputAttesoFinanziate', 'outputErogato'] as const;
    const [srd2024] = verificaPer(VERIFICA, new URLSearchParams('anno=2024&intervento=SRD01')).righe;
    expect(avviso.map((k) => srd2024[k].motivo)).toEqual(avviso.map(() => 'ANNO_NON_CONSERVATO'));
    expect([srd2024.indicatoreOutput.valore, srd2024.indicatoreRisultato.valore, srd2024.outputAttesoFinanziate.valore]).toEqual(['O.20', 'R.9', 40]);
    const [srd2023] = verificaPer(VERIFICA, new URLSearchParams('anno=2023&intervento=SRD01')).righe;
    expect(avviso.map((k) => srd2023[k].motivo)).toEqual(avviso.map(() => 'ANNO_NON_CONSERVATO'));
    expect(file.map((k) => [srd2023[k].valore, srd2023[k].motivo])).toEqual(file.map(() => [null, 'NON_VALORIZZATO']));
    // domande e spesa restano cumulative; un intervento senza avviso tiene i dati dell'avviso NON_VALORIZZATO
    expect([srd2023.domandeRicevute, srd2023.spesaErogata.valore]).toEqual([3, 90000]);
    const [sra2024] = verificaPer(VERIFICA, new URLSearchParams('anno=2024&intervento=SRA01')).righe;
    expect(avviso.map((k) => sra2024[k].motivo)).toEqual(avviso.map(() => 'NON_VALORIZZATO'));
    // le righe in ordine di codice, come il backend
    expect(VERIFICA.righe.map((r) => r.codiceIntervento)).toEqual(['SRA01', 'SRA16', 'SRD01']);
  });
});

describe('RF016: card della Home coi totali della verifica SMP non SIGC (OP-IS-11, decisione dell utente del 26/10/2026)', () => {
  const assente = (motivo: string) => ({ valore: null, motivo, fonte: null });
  const conSpesa = (spesa: (r: RigaVerifica) => RigaVerifica['spesaErogata']): RigaVerifica[] => VERIFICA.righe.map((r): RigaVerifica => ({ ...r, spesaErogata: spesa(r) }));

  it('somme delle colonne fra gli interventi (SRA01 SIGC conta 0, conteggio vero) e la quota della spesa sul valore finanziato', () => {
    expect(anteprimaVerifica(VERIFICA)).toEqual({ domandeFinanziate: 2, domandeRicevute: 4, spesaErogata: { valore: 91200.5 }, quotaSpesa: { valore: 57 } });
  });

  it('un dato motivato assente anche in una sola riga: totale non calcolabile col motivo, nessuna quota; i conteggi restano', () => {
    const a = anteprimaVerifica({ righe: conSpesa((r) => (r.codiceIntervento === 'SRA16' ? assente('FONTE_AMBIGUA') : r.spesaErogata)) });
    expect(a.spesaErogata).toEqual({ valore: null, motivo: 'Non calcolabile: manca per 1 intervento (SRA16); non attribuibile (riga presente sia nel monitoraggio SIGC sia nel non SIGC)' });
    expect(a.quotaSpesa).toEqual({ valore: null, motivo: 'non calcolabile: manca il totale della spesa' });
    expect([a.domandeFinanziate, a.domandeRicevute]).toEqual([2, 4]);
  });

  it('motivi diversi: quanti interventi e quali, senza un motivo unico; entrambi i totali assenti: lo dice la quota', () => {
    const motivi: Record<string, string> = { SRA01: 'NON_VALORIZZATO', SRA16: 'FONTE_AMBIGUA' };
    const righe = conSpesa((r) => (motivi[r.codiceIntervento] ? assente(motivi[r.codiceIntervento]) : r.spesaErogata)).map((r): RigaVerifica => ({ ...r, valoreDomandeFinanziate: assente('NON_VALORIZZATO') }));
    const a = anteprimaVerifica({ righe });
    expect(a.spesaErogata.motivo).toBe('Non calcolabile: manca per 2 interventi (SRA01, SRA16)');
    expect(a.quotaSpesa.motivo).toBe('non calcolabile: manca il totale della spesa e del valore finanziato');
  });

  it('valore finanziato nullo: nessuna quota; spesa oltre il finanziato: la quota vera oltre 100; nessun intervento: zeri veri', () => {
    expect(anteprimaVerifica({ righe: [] })).toEqual({ domandeFinanziate: 0, domandeRicevute: 0, spesaErogata: { valore: 0 }, quotaSpesa: { valore: null, motivo: 'nessun valore finanziato' } });
    const oltre = conSpesa((r) => (r.codiceIntervento === 'SRD01' ? { valore: 200000, motivo: null, fonte: null } : r.spesaErogata));
    expect(anteprimaVerifica({ righe: oltre }).quotaSpesa).toEqual({ valore: 125.8 });
  });

  it('riferimento dell anno del file e etichette col perimetro', () => {
    expect(riferimentoAnteprima(2025)).toBe('Non SIGC, valori cumulativi (ultimo file SMP non SIGC: 2025)');
    expect(riferimentoAnteprima(null)).toBe('Non SIGC, valori cumulativi (nessun file SMP non SIGC)');
    expect(etichetteAnteprima('REGIONALE')).toEqual({ finanziate: 'Domande finanziate', spesa: 'Spesa pubblica erogata', quota: 'Spesa erogata sul valore delle domande finanziate', ricevute: 'Domande ricevute' });
    expect(etichetteAnteprima('ADA')).toMatchObject({ finanziate: 'Domande finanziate della tua area', spesa: 'Spesa pubblica erogata della tua area', ricevute: 'Domande ricevute della tua area' });
  });
});

describe('RF015: blocco SIGC della card della Home (rework 1 della card, scelta dell utente del 30/10/2026)', () => {
  const importo = (valore: number) => ({ valore, motivo: null, fonte: null });
  const riga = (codiceIntervento: string, campi: Parameters<typeof rigaSmp>[0] = {}) => rigaSmp({ codiceIntervento, ...campi });

  it('somme fra gli interventi: finanziate, pagate e ricevute; spesa nell esercizio = campagna precedente + campagne anteriori; nessuna quota', () => {
    const righe = [riga('SRA01'), riga('SRA03', { domandeRicevute: 30, domandeFinanziate: 20, domandePagateEsercizio: 5, spesaErogataCampagnaPrecedente: importo(1000.1), spesaErogataCampagneAnteriori: importo(250.25) })];
    expect(anteprimaVerificaSigc({ righe })).toEqual({
      domandeFinanziate: { valore: 120 },
      spesaErogata: { valore: 401250.35 },
      domandePagate: { valore: 85 },
      domandeRicevute: { valore: 150 },
    });
    expect(Object.keys(anteprimaVerificaSigc({ righe }))).not.toContain('quota');
  });

  it('una parte della spesa assente in una riga: totale non calcolabile col motivo, mai una somma parziale; i conteggi restano', () => {
    const righe = [riga('SRA01'), riga('SRA03', { spesaErogataCampagneAnteriori: nd('IMPEGNI') })];
    const a = anteprimaVerificaSigc({ righe });
    expect(a.spesaErogata).toEqual({ valore: null, motivo: 'Non calcolabile: manca per 1 intervento (SRA03); non disponibile (fonte impegni non attiva)' });
    expect(a.domandeRicevute).toEqual({ valore: 240 });
  });

  it('nessun intervento (o righe assenti): zeri veri; un conteggio assente nella spec: non calcolabile', () => {
    const zeri = { domandeFinanziate: { valore: 0 }, spesaErogata: { valore: 0 }, domandePagate: { valore: 0 }, domandeRicevute: { valore: 0 } };
    expect(anteprimaVerificaSigc({ righe: [] })).toEqual(zeri);
    expect(anteprimaVerificaSigc({})).toEqual(zeri);
    expect(anteprimaVerificaSigc({ righe: [{ codiceIntervento: 'SRA03' }] }).domandePagate).toEqual({ valore: null, motivo: 'Non calcolabile: manca per 1 intervento (SRA03)' });
  });

  it('nome del gruppo, riferimento con esercizio, periodo e anno delle domande; etichette col perimetro', () => {
    expect(nomeGruppoSigc(2026)).toBe('SIGC, esercizio 2026');
    expect(riferimentoAnteprimaSigc(2026, 2025)).toBe("SIGC, esercizio 2026 (16/10/2025 - 15/10/2026; domande dell'anno 2025)");
    expect(etichetteAnteprimaSigc('REGIONALE')).toEqual({ finanziate: 'Domande finanziate', spesa: "Spesa pubblica erogata nell'esercizio", pagate: "Domande pagate nell'esercizio", ricevute: 'Domande ricevute' });
    expect(etichetteAnteprimaSigc('ADA').pagate).toBe("Domande pagate nell'esercizio della tua area");
  });
});
