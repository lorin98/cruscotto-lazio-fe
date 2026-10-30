// fixture.ts — risposte di prova del fisico nella forma del contratto (TX-0018, TX-0017, TX-0030) e i valori dei filtri
// (TX-0060 dell'elenco operativo), per i test dei componenti e delle pagine. I numeri sono quelli degli scenari di
// accettazione del backend (handover/acceptance/fisico-scenarios.json: SC-FS_SUPERFICIE, SC-FS_OUTPUT_ANNI,
// SC-FS_UNIT_AMOUNT_AZIONE; per l'output regionale e le Unit Amount gli stessi delle fixture dell'istituzionale e del
// procedurale da cui le pagine vengono, 29/10/2026): nessun dato reale. outputPer e unitAmountPer rispondono come il
// backend ai parametri della query (intervento, os, og, op, azione), cosi' i test di pagina non ricevono lo stesso corpo
// per ogni query. Le determine di una domanda (TX-0020) e le loro fixture sono del procedurale.
import type { MonitoraggioOutput, MonitoraggioOutputAnno, MonitoraggioOutputRiga, PagamentiUnitAmount, PagamentiUnitAmountRiga, SuperficieAmmissibile, SuperficieCampagna, ValoriFiltriElenco } from '../api';

const PREMIO_NON_ATTIVO = { valore: null, motivo: 'FONTE_NON_ATTIVA', fonte: 'QUANTITA_RICHIESTA_PREMIO' };

export function campagna(anno: number, valori: Partial<SuperficieCampagna> = {}): SuperficieCampagna {
  return {
    anno,
    domandePagamento: 1,
    domandeSostegno: 1,
    sostegniDiscordanti: 0,
    superficieDs: 10,
    superficieDp: 10,
    differenzaDpDs: 0,
    domandeDpOltreDs: 0,
    quantitaRichiestaPremio: PREMIO_NON_ATTIVO,
    ...valori,
  };
}

export const ULTIMI = [
  { flusso: 'ASR2_DS20', conclusoIl: '2026-03-02T09:30:00Z' },
  { flusso: 'PROSA_DS04', conclusoIl: '2026-03-03T08:30:00Z' },
];

/** SC-FS_SUPERFICIE: SRA29 senza superfici; SRB01 nel 2024 e nel 2025 (le campagne non si sommano). */
export const SUPERFICI: SuperficieAmmissibile = {
  campagna: null,
  perimetro: 'REGIONALE',
  righe: [
    { codiceIntervento: 'SRA29', motivo: 'NON_VALORIZZATO', campagne: [] },
    {
      codiceIntervento: 'SRB01',
      motivo: null,
      campagne: [
        campagna(2024, { superficieDs: 10.5, superficieDp: 10, differenzaDpDs: -0.5 }),
        campagna(2025, { domandePagamento: 3, domandeSostegno: 2, superficieDs: 15.5, superficieDp: 16.2, differenzaDpDs: 0.7, domandeDpOltreDs: 1 }),
      ],
    },
  ],
  ultimiDatiSincronizzati: ULTIMI,
};

/** Due interventi nella stessa campagna (somme dentro la campagna) e un intervento solo nel 2024. */
export const SUPERFICI_TRE: SuperficieAmmissibile = {
  ...SUPERFICI,
  righe: [
    ...SUPERFICI.righe,
    { codiceIntervento: 'SRB02', motivo: null, campagne: [campagna(2025, { domandePagamento: 2, domandeSostegno: 2, superficieDs: 4, superficieDp: 3.7, differenzaDpDs: -0.3 })] },
    { codiceIntervento: 'SRB03', motivo: null, campagne: [campagna(2024, { superficieDs: 2, superficieDp: 2 })] },
  ],
};

/** SC-FS_SUPERFICIE_CAMPAGNA con ?campagna=2023: interventi senza campagne, NON_VALORIZZATO. */
export const SUPERFICI_SENZA: SuperficieAmmissibile = {
  campagna: 2023,
  perimetro: 'REGIONALE',
  righe: [
    { codiceIntervento: 'SRA29', motivo: 'NON_VALORIZZATO', campagne: [] },
    { codiceIntervento: 'SRB01', motivo: 'NON_VALORIZZATO', campagne: [] },
  ],
  ultimiDatiSincronizzati: ULTIMI,
};

/**
 * La risposta di TX-0018 che il backend darebbe ai criteri della query, come il mock del dev server (review del fisico V2):
 * solo gli interventi richiesti; con la campagna le sole superfici di quella e, per gli interventi che non ne hanno, campagne
 * vuote e NON_VALORIZZATO anche se ne hanno in altre campagne (SC-FS_SUPERFICIE_CAMPAGNA). Gli altri filtri del programma
 * non si simulano: le fixture non hanno le dimensioni del programma.
 */
export function superficiPer(corpo: SuperficieAmmissibile, ricerca: string | URLSearchParams): SuperficieAmmissibile {
  const p = typeof ricerca === 'string' ? new URLSearchParams(ricerca) : ricerca;
  const interventi = p.getAll('intervento');
  const testo = p.get('campagna');
  const anno = testo === null ? null : Number(testo);
  const righe = corpo.righe
    .filter((r) => interventi.length === 0 || interventi.includes(r.codiceIntervento))
    .map((r) => {
      if (anno === null) return r;
      const campagne = r.campagne.filter((c) => c.anno === anno);
      return { ...r, campagne, motivo: campagne.length === 0 ? 'NON_VALORIZZATO' : null };
    });
  return { ...corpo, campagna: anno, righe };
}

/**
 * Le superfici degli interventi dell'output e delle Unit Amount, per il dettaglio dell'intervento (valori del wireframe
 * intervento approvato il 30/10/2026): SRA01 nel 2024 e nel 2025 (la DP del 2025 sotto la DS, quella del 2024 oltre);
 * SRD01, strutturale, senza superfici (NON_VALORIZZATO). AT001 non c'e' mai (SC-FS_FILTRI).
 */
export const SUPERFICI_INTERVENTI: SuperficieAmmissibile = {
  campagna: null,
  perimetro: 'REGIONALE',
  righe: [
    {
      codiceIntervento: 'SRA01',
      motivo: null,
      campagne: [
        campagna(2024, { domandePagamento: 1, domandeSostegno: 1, superficieDs: 5, superficieDp: 6, differenzaDpDs: 1, domandeDpOltreDs: 1 }),
        campagna(2025, { domandePagamento: 2, domandeSostegno: 1, superficieDs: 10.5, superficieDp: 10.2, differenzaDpDs: -0.3, domandeDpOltreDs: 0 }),
      ],
    },
    { codiceIntervento: 'SRD01', motivo: 'NON_VALORIZZATO', campagne: [] },
  ],
  ultimiDatiSincronizzati: ULTIMI,
};

/** SUPERFICI_TRE letta con ?campagna=2024: SRB02 (superfici solo nel 2025) e SRA29 con campagne vuote e NON_VALORIZZATO. */
export const SUPERFICI_TRE_2024: SuperficieAmmissibile = superficiPer(SUPERFICI_TRE, '?campagna=2024');

/** TX-0060: valori regionali (nessun profilo con csr.tx-0018.read ha un perimetro ADA), legame con le azioni assente. */
export const VALORI: ValoriFiltriElenco = {
  perimetro: 'REGIONALE',
  interventi: [
    { chiave: 'SRA29', descrizione: 'Agricoltura biologica' },
    { chiave: 'SRB01', descrizione: 'Sostegno zone con svantaggi naturali montagna' },
  ],
  obiettiviSpecifici: [{ chiave: 'OS4', descrizione: null }],
  obiettiviGenerali: ['OG2'],
  obiettiviPolicy: ['OP1'],
  azioniPortanti: [],
  legameAzioniDisponibile: false,
};

// ---------------------------------------------------------------- output regionale (TX-0017) e Unit Amount (TX-0030)

type Dato<T> = { valore: T | null; motivo: string | null; fonte: string | null };
const v = <T,>(valore: T): Dato<T> => ({ valore, motivo: null, fonte: null });
const assente = (motivo: string, fonte: string | null = null): Dato<never> => ({ valore: null, motivo, fonte });
const NV = assente('NON_VALORIZZATO');
const AMBIGUA = assente('FONTE_AMBIGUA');

/** TX-0060 coi valori degli interventi dell'output e delle Unit Amount (quelli della fixture dell'istituzionale). */
export const VALORI_PROGRAMMA: ValoriFiltriElenco = {
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

// il legame intervento - obiettivi (OS, OG, OP) e nessun intervento collegato alle azioni portanti (come nell'istituzionale)
const OBIETTIVI: Record<string, readonly string[]> = { SRA01: ['OS5', 'OG1', 'OP1'], SRA16: ['OS5', 'OG1'], SRD01: ['OS4', 'OG2', 'OP1'], SRD04: ['OS4', 'OG2'], SRG01: ['OS6'] };

/** Le righe che il backend rende ai filtri della query: dimensioni insieme (E), valori dello stesso filtro in alternativa (O). */
export function righeDeiFiltri<R extends { codiceIntervento?: string }>(righe: readonly R[], p: URLSearchParams): R[] {
  if (p.getAll('azione').length > 0) return [];
  const interventi = p.getAll('intervento');
  const obiettivi = ['os', 'og', 'op'].map((k) => p.getAll(k)).filter((valori) => valori.length > 0);
  return righe.filter((r) => (interventi.length === 0 || interventi.includes(r.codiceIntervento ?? '')) && obiettivi.every((valori) => valori.some((o) => (OBIETTIVI[r.codiceIntervento ?? ''] ?? []).includes(o))));
}

/** Gli anni 2023-2029 con le misure date per anno (le altre NON_VALORIZZATO). */
function anni(misure: Record<number, Partial<MonitoraggioOutputAnno>> = {}): MonitoraggioOutputAnno[] {
  return [2023, 2024, 2025, 2026, 2027, 2028, 2029].map((anno) => ({ anno, programmato: NV, realizzatoSigc: NV, realizzatoNonSigc: NV, ...misure[anno] }));
}

/** SRA01 in ettari, programmato 2024 = 500 (somma delle Unit Amount), SIGC 2023 = 400, tre importi unitari. */
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
    // il 2027 in entrambi i monitoraggi: non attribuibile
    { codiceIntervento: 'SRA16', indicatoreOutput: 'O.14', unitaMisura: 'ettari', targetFinePeriodo: v(300), annoTarget: 2029, anni: anni({ 2027: { realizzatoSigc: AMBIGUA, realizzatoNonSigc: AMBIGUA } }), importiUnitari: [] },
    // un intervento strutturale: il solo target, nessuna Unit Amount, realizzato non SIGC 2025 = 12
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

/** Il pagato delle Unit Amount: con la fonte attiva i valori dello scenario, senza la fonte (il caso reale) FONTE_NON_ATTIVA. */
const PAGATO = assente('FONTE_NON_ATTIVA', 'PAGATO_PER_UNIT_AMOUNT');

/** TX-0030 (lo scenario del procedurale, SC-PC_UNIT_AMOUNT): SRD01 con UA1 2024, UA2 2024 e UA1 2025, per intervento, esercizio e codice; mai AT001. */
export function unitAmountPer(p: URLSearchParams, { pagato = false }: { pagato?: boolean } = {}): PagamentiUnitAmount {
  const righe: PagamentiUnitAmountRiga[] = [
    { codiceIntervento: 'SRD01', codiceUnitAmount: 'UA1', gruppoColturale: 'Seminativi', esercizio: 2024, importoUnitario: v(140), outputPrevisto: v(8), importoPagato: pagato ? v(56) : PAGATO, percentualePagata: pagato ? v(40) : PAGATO, baseStorica: pagato ? NV : PAGATO },
    { codiceIntervento: 'SRD01', codiceUnitAmount: 'UA2', gruppoColturale: 'Ortive', esercizio: 2024, importoUnitario: NV, outputPrevisto: v(5), importoPagato: pagato ? NV : PAGATO, percentualePagata: pagato ? NV : PAGATO, baseStorica: pagato ? NV : PAGATO },
    { codiceIntervento: 'SRD01', codiceUnitAmount: 'UA1', gruppoColturale: 'Seminativi', esercizio: 2025, importoUnitario: v(150), outputPrevisto: v(10), importoPagato: pagato ? v(1) : PAGATO, percentualePagata: pagato ? NV : PAGATO, baseStorica: pagato ? v(40) : PAGATO },
  ];
  return { perimetro: 'REGIONALE', righe: righeDeiFiltri(righe, p), ultimiDatiSincronizzati: ULTIMI };
}
