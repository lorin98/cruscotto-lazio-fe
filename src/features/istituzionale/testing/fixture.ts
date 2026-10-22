// fixture.ts — risposte di prova dell'istituzionale nella forma del contratto (TX-0016, TX-0017) e i valori dei filtri
// (TX-0060 dell'elenco operativo), per i test dei componenti e delle pagine. I numeri sono quelli degli scenari di
// accettazione del backend (handover/acceptance/istituzionale-scenarios.json: SC-IS_SMP_NONSIGC, SC-IS_SMP_ANNO,
// SC-IS_OUTPUT_ANNI, SC-IS_OUTPUT_STRUTTURALE, SC-IS_OUTPUT_AMBIGUO, SC-IS_FILTRI): nessun dato reale. verificaPer e
// outputPer rispondono come il backend ai parametri della query (intervento, os, og, op, azione e, per TX-0016, anno),
// cosi' i test di pagina non ricevono lo stesso corpo per ogni query (lezione della review del fisico).
import type { MonitoraggioOutput, MonitoraggioOutputAnno, MonitoraggioOutputRiga, ValoriFiltriElenco, VerificaSmpNonSigc, VerificaSmpNonSigcRiga } from '../api';

type Dato<T> = { valore: T | null; motivo: string | null; fonte: string | null };
const v = <T,>(valore: T): Dato<T> => ({ valore, motivo: null, fonte: null });
const assente = (motivo: string): Dato<never> => ({ valore: null, motivo, fonte: null });
const NV = assente('NON_VALORIZZATO');
const ANNO = assente('ANNO_NON_CONSERVATO');
const AMBIGUA = assente('FONTE_AMBIGUA');

export const ULTIMI = [
  { flusso: 'ASR2_DS20', conclusoIl: '2026-03-02T09:30:00Z' },
  { flusso: 'PROSA_DS04', conclusoIl: '2026-03-03T08:30:00Z' },
];

/** TX-0060 (G2): interventi con la descrizione, obiettivi, azioni senza legame con gli interventi (SC-IS_FILTRI). */
export const VALORI: ValoriFiltriElenco = {
  perimetro: 'REGIONALE',
  interventi: [
    { chiave: 'SRA01', descrizione: 'Produzione integrata' },
    { chiave: 'SRA16', descrizione: 'Conservazione agrobiodiversità' },
    { chiave: 'SRD01', descrizione: 'Investimenti produttivi agricoli per la competitività' },
    { chiave: 'SRD04', descrizione: 'Investimenti non produttivi agricoli con finalità ambientale' },
    { chiave: 'SRG01', descrizione: 'Sostegno ai gruppi operativi PEI AGRI' },
  ],
  obiettiviSpecifici: [
    { chiave: 'OS4', descrizione: null },
    { chiave: 'OS5', descrizione: null },
  ],
  obiettiviGenerali: ['OG1', 'OG2'],
  obiettiviPolicy: ['OP1'],
  azioniPortanti: [{ chiave: '3', descrizione: 'Azione portante 3' }],
  legameAzioniDisponibile: false,
};

/** Riga della verifica coi dati di programma assenti per `motivo` e domande e spesa vere (zero se non dati). */
function rigaVerifica(codiceIntervento: string, motivo: Dato<never>, dati: Partial<VerificaSmpNonSigcRiga> = {}): VerificaSmpNonSigcRiga {
  return {
    codiceIntervento,
    indicatoreOutput: NV,
    indicatoreRisultato: NV,
    avvisiAttivati: motivo,
    avvisiChiusi: motivo,
    azioniAttivate: motivo,
    dotazioneAvvisi: motivo,
    chiusuraUltimoAvvisoAperto: motivo,
    domandeRicevute: 0,
    valoreDomandeRicevute: v(0),
    domandeRicevuteSenzaRichiesto: 0,
    domandeFinanziate: 0,
    valoreDomandeFinanziate: v(0),
    outputAttesoFinanziate: NV,
    domandeSaldate: 0,
    anticipiErogati: v(0),
    spesaErogata: v(0),
    outputErogato: NV,
    includeTopUp: motivo,
    importoTopUp: motivo,
    concessioniPreviste: motivo,
    ...dati,
  };
}

/** SC-IS_SMP_NONSIGC: SRD01 col file 2025 e i suoi conti; SRA01 SIGC (zero domande e zero spesa non SIGC). */
export const SRD01: VerificaSmpNonSigcRiga = rigaVerifica('SRD01', NV, {
  indicatoreOutput: v('O.20'),
  indicatoreRisultato: v('R.9'),
  avvisiAttivati: v(2),
  avvisiChiusi: v(1),
  azioniAttivate: v(3),
  dotazioneAvvisi: v(2000000),
  chiusuraUltimoAvvisoAperto: v('2025-03-31'),
  domandeRicevute: 3,
  valoreDomandeRicevute: v(180000),
  domandeRicevuteSenzaRichiesto: 1,
  domandeFinanziate: 2,
  valoreDomandeFinanziate: v(160000),
  outputAttesoFinanziate: v(40),
  domandeSaldate: 1,
  anticipiErogati: v(20000),
  spesaErogata: v(90000),
  outputErogato: v(12),
  includeTopUp: v(true),
  importoTopUp: v(150000),
  concessioniPreviste: v(false),
});

export const VERIFICA: VerificaSmpNonSigc = {
  annoRiferimento: 2025,
  perimetro: 'REGIONALE',
  outputCumulativo: true,
  righe: [
    rigaVerifica('SRA01', NV),
    SRD01,
    // SC-IS_OUTPUT_AMBIGUO: la riga di output e' in entrambi i monitoraggi
    rigaVerifica('SRA16', NV, { domandeRicevute: 1, valoreDomandeRicevute: v(5000), spesaErogata: v(1200.5), outputErogato: AMBIGUA }),
  ],
  ultimiDatiSincronizzati: ULTIMI,
};

/** SC-IS_SMP_ANNO: con un anno diverso dal file piu' recente i dati dell'avviso sono ANNO_NON_CONSERVATO. */
function conAnno(r: VerificaSmpNonSigcRiga, anno: number): VerificaSmpNonSigcRiga {
  if (anno === 2025 || r.dotazioneAvvisi.valore === null) return r;
  return { ...r, dotazioneAvvisi: ANNO, chiusuraUltimoAvvisoAperto: ANNO, includeTopUp: ANNO, importoTopUp: ANNO, azioniAttivate: ANNO, outputErogato: anno === 2024 ? v(7) : NV };
}

// SC-IS_FILTRI: il legame intervento - obiettivi (OS, OG, OP) e nessun intervento collegato alle azioni portanti
const OBIETTIVI: Record<string, readonly string[]> = { SRA01: ['OS5', 'OG1', 'OP1'], SRA16: ['OS5', 'OG1'], SRD01: ['OS4', 'OG2', 'OP1'], SRD04: ['OS4', 'OG2'], SRG01: ['OS6'] };

/** Le righe che il backend rende ai filtri della query: dimensioni insieme (E), valori dello stesso filtro in alternativa (O). */
export function righeDeiFiltri<R extends { codiceIntervento: string }>(righe: readonly R[], p: URLSearchParams): R[] {
  if (p.getAll('azione').length > 0) return [];
  const interventi = p.getAll('intervento');
  const obiettivi = ['os', 'og', 'op'].map((k) => p.getAll(k)).filter((valori) => valori.length > 0);
  return righe.filter((r) => (interventi.length === 0 || interventi.includes(r.codiceIntervento)) && obiettivi.every((valori) => valori.some((o) => (OBIETTIVI[r.codiceIntervento] ?? []).includes(o))));
}

/** TX-0016 come il backend: righe dei filtri e, con l'anno, quell'anno di riferimento e i dati dell'avviso del 2025. */
export function verificaPer(base: VerificaSmpNonSigc, p: URLSearchParams): VerificaSmpNonSigc {
  const anno = p.get('anno');
  const righe = righeDeiFiltri(base.righe, p);
  if (anno === null) return { ...base, righe };
  return { ...base, annoRiferimento: Number(anno), righe: righe.map((r) => conAnno(r, Number(anno))) };
}

/** Gli anni 2023-2029 con le misure date per anno (le altre NON_VALORIZZATO). */
function anni(misure: Record<number, Partial<MonitoraggioOutputAnno>> = {}): MonitoraggioOutputAnno[] {
  return [2023, 2024, 2025, 2026, 2027, 2028, 2029].map((anno) => ({ anno, programmato: NV, realizzatoSigc: NV, realizzatoNonSigc: NV, ...misure[anno] }));
}

/** SC-IS_OUTPUT_ANNI: SRA01 in ettari, programmato 2024 = 500 (somma delle Unit Amount), SIGC 2023 = 400, tre importi unitari. */
export const SRA01_OUTPUT: MonitoraggioOutputRiga = {
  codiceIntervento: 'SRA01',
  indicatoreOutput: 'O.14',
  unitaMisura: 'ettari',
  targetFinePeriodo: v(1500),
  annoTarget: 2029,
  anni: anni({ 2023: { realizzatoSigc: v(400) }, 2024: { programmato: v(500) } }),
  importiUnitari: [
    { codiceUnitAmount: 'UA02', gruppoColturale: 'Seminativi', esercizio: 2024, importoUnitario: v(180) },
    { codiceUnitAmount: 'UA01', gruppoColturale: 'Seminativi', esercizio: 2025, importoUnitario: v(260) },
    { codiceUnitAmount: 'UA01', gruppoColturale: 'Seminativi', esercizio: 2024, importoUnitario: v(250) },
  ],
};

export const OUTPUT: MonitoraggioOutput = {
  annoInizio: 2023,
  annoFine: 2029,
  perimetro: 'REGIONALE',
  realizzatoNonSigcCumulativo: true,
  righe: [
    SRA01_OUTPUT,
    // SC-IS_OUTPUT_AMBIGUO: il 2027 in entrambi i monitoraggi
    { codiceIntervento: 'SRA16', indicatoreOutput: 'O.14', unitaMisura: 'ettari', targetFinePeriodo: v(300), annoTarget: 2029, anni: anni({ 2027: { realizzatoSigc: AMBIGUA, realizzatoNonSigc: AMBIGUA } }), importiUnitari: [] },
    // SC-IS_OUTPUT_STRUTTURALE: il solo target, nessuna Unit Amount, realizzato non SIGC 2025 = 12
    { codiceIntervento: 'SRD01', indicatoreOutput: 'O.20', unitaMisura: 'numero di operazioni', targetFinePeriodo: v(10), annoTarget: 2029, anni: anni({ 2025: { realizzatoNonSigc: v(12) } }), importiUnitari: [] },
    // senza riga PROGRAMMATO: indicatore, unita', target e anno del target assenti
    { codiceIntervento: 'SRG01', indicatoreOutput: null, unitaMisura: null, targetFinePeriodo: NV, annoTarget: null, anni: anni(), importiUnitari: [] },
  ],
  ultimiDatiSincronizzati: ULTIMI,
};

/** TX-0017 come il backend: le righe dei filtri della query. */
export function outputPer(base: MonitoraggioOutput, p: URLSearchParams): MonitoraggioOutput {
  return { ...base, righe: righeDeiFiltri(base.righe, p) };
}
