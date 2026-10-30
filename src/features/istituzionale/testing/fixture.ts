// fixture.ts — risposte di prova dell'istituzionale nella forma del contratto (TX-0016, TX-0015) e i valori dei filtri
// (TX-0060 dell'elenco operativo), per i test dei componenti e delle pagine. I numeri sono quelli degli scenari di
// accettazione del backend (handover/acceptance/istituzionale-scenarios.json: SC-IS_SMP_NONSIGC, SC-IS_SMP_ANNO,
// SC-IS_FILTRI) e, per TX-0015, quelli di prova della pagina del finanziario da cui la verifica SIGC viene: nessun dato
// reale. verificaPer e verificaSigcPer rispondono come il backend ai parametri della query (intervento, os, og, op,
// azione e l'anno o l'esercizio), cosi' i test di pagina non ricevono lo stesso corpo per ogni query (lezione della
// review del fisico). L'output regionale (TX-0017) e le sue fixture sono del fisico dal 29/10/2026.
import type { ValoriFiltriElenco, VerificaSmp, VerificaSmpNonSigc, VerificaSmpNonSigcRiga, VerificaSmpRiga } from '../api';

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

/** Le righe in ordine di codice, come le rende il backend (SC-IS_SMP_NONSIGC); l'ordinamento della tabella ha il suo test. */
export const VERIFICA: VerificaSmpNonSigc = {
  annoRiferimento: 2025,
  perimetro: 'REGIONALE',
  outputCumulativo: true,
  righe: [
    rigaVerifica('SRA01', NV),
    // SC-IS_OUTPUT_AMBIGUO: la riga di output e' in entrambi i monitoraggi
    rigaVerifica('SRA16', NV, { domandeRicevute: 1, valoreDomandeRicevute: v(5000), spesaErogata: v(1200.5), outputErogato: AMBIGUA }),
    SRD01,
  ],
  ultimiDatiSincronizzati: ULTIMI,
};

/**
 * I dati dell'avviso NOSIGC per un anno diverso dal file piu' recente: l'avviso e' uno per intervento e porta i dati del
 * file 2025 (SC-IS_SMP_ANNO), compresi avvisi attivati e chiusi e concessioni previste, che si leggono dall'avviso
 * (SC-IS_SMP_SENZA_FONTE; riga SRD04 del low-fi approvato).
 */
const AVVISO_DI_UN_ALTRO_ANNO = {
  avvisiAttivati: ANNO,
  avvisiChiusi: ANNO,
  azioniAttivate: ANNO,
  dotazioneAvvisi: ANNO,
  chiusuraUltimoAvvisoAperto: ANNO,
  includeTopUp: ANNO,
  importoTopUp: ANNO,
  concessioniPreviste: ANNO,
} satisfies Partial<VerificaSmpNonSigcRiga>;

/** I dati del file NOSIGC di un anno senza file (il 2023 di SC-IS_SMP_ANNO): indicatori e output NON_VALORIZZATO. */
const SENZA_FILE_DELL_ANNO = { indicatoreOutput: NV, indicatoreRisultato: NV, outputAttesoFinanziate: NV, outputErogato: NV } satisfies Partial<VerificaSmpNonSigcRiga>;

/**
 * SC-IS_SMP_ANNO: con un anno diverso dal 2025 i dati dell'avviso sono ANNO_NON_CONSERVATO (un intervento senza avviso li
 * tiene NON_VALORIZZATO); il 2024 ha il suo file (output erogato 7), un altro anno nessun file.
 */
function conAnno(r: VerificaSmpNonSigcRiga, anno: number): VerificaSmpNonSigcRiga {
  if (anno === 2025) return r;
  const avviso = r.dotazioneAvvisi.valore === null ? {} : AVVISO_DI_UN_ALTRO_ANNO;
  const file = anno !== 2024 ? SENZA_FILE_DELL_ANNO : r.outputErogato.valore === null ? {} : { outputErogato: v(7) };
  return { ...r, ...avviso, ...file };
}

// SC-IS_FILTRI: il legame intervento - obiettivi (OS, OG, OP) e nessun intervento collegato alle azioni portanti
const OBIETTIVI: Record<string, readonly string[]> = { SRA01: ['OS5', 'OG1', 'OP1'], SRA16: ['OS5', 'OG1'], SRD01: ['OS4', 'OG2', 'OP1'], SRD04: ['OS4', 'OG2'], SRG01: ['OS6'] };

/** Le righe che il backend rende ai filtri della query: dimensioni insieme (E), valori dello stesso filtro in alternativa (O). */
export function righeDeiFiltri<R extends { codiceIntervento?: string }>(righe: readonly R[], p: URLSearchParams): R[] {
  if (p.getAll('azione').length > 0) return [];
  const interventi = p.getAll('intervento');
  const obiettivi = ['os', 'og', 'op'].map((k) => p.getAll(k)).filter((valori) => valori.length > 0);
  return righe.filter((r) => (interventi.length === 0 || interventi.includes(r.codiceIntervento ?? '')) && obiettivi.every((valori) => valori.some((o) => (OBIETTIVI[r.codiceIntervento ?? ''] ?? []).includes(o))));
}

/** TX-0016 come il backend: righe dei filtri e, con l'anno, quell'anno di riferimento e i dati dell'avviso del 2025. */
export function verificaPer(base: VerificaSmpNonSigc, p: URLSearchParams): VerificaSmpNonSigc {
  const anno = p.get('anno');
  const righe = righeDeiFiltri(base.righe, p);
  if (anno === null) return { ...base, righe };
  return { ...base, annoRiferimento: Number(anno), righe: righe.map((r) => conAnno(r, Number(anno))) };
}

// TX-0015 (verifica SMP SIGC, dal finanziario il 29/10/2026): i dati col motivo dell'assenza (Importo,
// ConteggioFinanziario, SiNoFinanziario: stessa forma), il valore, la fonte non attiva, il dato non valorizzato; la stessa
// risposta di prova che il finanziario usava per la sua pagina (review delta 21/10 V1, H4).
export const dato = <T,>(valore: T) => ({ valore, motivo: null, fonte: null });
export const nd = (fonte: string) => ({ valore: null, motivo: 'FONTE_NON_ATTIVA', fonte });
export const nv = () => ({ valore: null, motivo: 'NON_VALORIZZATO', fonte: null });

export const VERIFICA_SMP = {
  perimetro: 'REGIONALE',
  esercizio: 2025,
  annoDomande: 2024,
  pagamentiSenzaData: 3,
  righe: [
    {
      codiceIntervento: 'SRA01',
      avvisiAttivati: dato(1),
      azioniAttivate: nv(),
      domandeRicevute: 120,
      domandeRicevuteSenzaRichiesto: 2,
      valoreDomandeRicevute: dato(1500000),
      domandeFinanziate: 100,
      valoreDomandeFinanziate: dato(1200000),
      dotazioneAnnoPrecedente: dato(1000000),
      dotazionePeriodoImpegno: dato(1000000),
      domandePagateEsercizio: 80,
      spesaErogataCampagnaPrecedente: dato(400000),
      spesaErogataCampagneAnteriori: dato(0),
      previsionePagamentoEsercizio: nd('PREVISIONE_PAGAMENTO'),
      importoTopUp: dato(0),
      includeTopUp: dato(false),
      ettariUbaRichiesti: 350.5,
      outputAttesoFinanziate: null,
      outputErogatoEsercizio: null,
      indicatoreOutput: 'O.14',
      indicatoreRisultato: null,
    },
  ],
  ultimiDatiSincronizzati: ULTIMI,
} satisfies VerificaSmp;

/** Una riga della verifica SMP SIGC (la prima di VERIFICA_SMP) con i campi dati: tipizzata sul DTO, cosi' un campo
 *  rinominato nella spec fa fallire la compilazione dei test (review delta 21/10 V1). */
export const rigaSmp = (campi: Partial<VerificaSmpRiga>): VerificaSmpRiga => ({ ...VERIFICA_SMP.righe[0], ...campi });

/** TX-0015 come il backend: le righe dei filtri della query e l'esercizio chiesto. */
export function verificaSigcPer(base: VerificaSmp, p: URLSearchParams): VerificaSmp {
  const esercizio = Number(p.get('esercizio'));
  return { ...base, esercizio, annoDomande: esercizio - 1, righe: righeDeiFiltri(base.righe ?? [], p) };
}
