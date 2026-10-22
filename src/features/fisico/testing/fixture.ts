// fixture.ts — risposte di prova del fisico nella forma del contratto (TX-0018, TX-0020) e i valori dei filtri (TX-0060
// dell'elenco operativo), per i test dei componenti e delle pagine. I numeri sono quelli degli scenari di accettazione del
// backend (handover/acceptance/fisico-scenarios.json: SC-FS_SUPERFICIE, SC-FS_DETERMINA, SC-FS_DETERMINA_NESSUNA): nessun
// dato reale.
import type { DetermineDomanda, SuperficieAmmissibile, SuperficieCampagna, ValoriFiltriElenco } from '../api';

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

/** SUPERFICI_TRE letta con ?campagna=2024: SRB02 (superfici solo nel 2025) e SRA29 con campagne vuote e NON_VALORIZZATO. */
export const SUPERFICI_TRE_2024: SuperficieAmmissibile = superficiPer(SUPERFICI_TRE, '?campagna=2024');

/** SC-FS_DETERMINA: G00003 corrente, G00002 fonte del comparto, G00001 fonte dello stato area programmazione. */
export const DETERMINE: DetermineDomanda = {
  codiceABarre: '54810769585',
  tipoDomanda: 'PAGAMENTO',
  domandaChiusa: false,
  corrente: { valore: { codice: 'G00003', data: '2025-06-30', fonteStatoAreaProgrammazione: false, fonteComparto: false }, motivo: null },
  elenco: [
    { codice: 'G00003', data: '2025-06-30', fonteStatoAreaProgrammazione: false, fonteComparto: false },
    { codice: 'G00002', data: '2025-06-30', fonteStatoAreaProgrammazione: false, fonteComparto: true },
    { codice: 'G00001', data: '2025-01-10', fonteStatoAreaProgrammazione: true, fonteComparto: false },
  ],
};

/** SC-FS_DETERMINA_NESSUNA: nessuna determina aperta. */
export const DETERMINE_NESSUNA: DetermineDomanda = {
  codiceABarre: '54810000001',
  tipoDomanda: 'PAGAMENTO',
  domandaChiusa: false,
  corrente: { valore: null, motivo: 'NON_VALORIZZATO' },
  elenco: [],
};

/** SC-FS_DETERMINA_NESSUNA, seconda domanda: chiusa con la sua determina. */
export const DETERMINE_CHIUSA: DetermineDomanda = {
  codiceABarre: '34810063735',
  tipoDomanda: 'PAGAMENTO',
  domandaChiusa: true,
  corrente: { valore: { codice: 'G00016', data: '2025-03-01', fonteStatoAreaProgrammazione: true, fonteComparto: true }, motivo: null },
  elenco: [{ codice: 'G00016', data: '2025-03-01', fonteStatoAreaProgrammazione: true, fonteComparto: true }],
};

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
