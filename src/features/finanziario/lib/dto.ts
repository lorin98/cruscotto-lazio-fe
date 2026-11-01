// dto.ts — forme minime dei DTO letti dalle funzioni pure (builder dei grafici, aggregati), con i nomi dei campi del contratto. Sono strutturali (i layer puri
// non importano dal confine api/): ui/contratto.ts verifica a compilazione che ogni campo esista nel DTO generato.
import type { ImportoLike } from '../../../entities/importo';

type Importo = ImportoLike | null;

/** Riga di SpesaPerIntervento (TX-0002). */
export interface RigaSpesa {
  codiceIntervento?: string;
  dotazioneSpesaPubblica?: Importo;
  pagamentiTotali?: Importo;
  /** Impegnato di spesa pubblica (rilevato piu' stimato) e la parte stimata: i sei box della panoramica (R03). */
  impegnatoSpesaPubblica?: Importo;
  impegnatoStimato?: Importo;
}

/** Riga di RiepilogoFinanziario (TX-0011). */
export interface RigaRiepilogo {
  codiceIntervento?: string;
  dotazioneSpesaPubblica?: Importo;
  risorseQuotaFeasr?: Importo;
  importoStanziato?: Importo;
  impegnatoCofinanziatoFeasr?: Importo;
  impegnatoCofinanziatoFeasrENon?: Importo;
  pagamentiNettoRettifiche?: Importo;
  dotazioneResiduaSuImpegni?: Importo;
  dotazioneResiduaSuPagamenti?: Importo;
  /** Revisioni del 31/10/2026 (R08, R04): pagato lordo, rettifiche da togliere, di cui stimato dell'impegnato. */
  pagamentiLordi?: Importo;
  importoRettifiche?: Importo;
  impegnatoStimato?: Importo;
  /** L'indicatore delle rettifiche (null = fonte non attiva) e le righe: "Con rettifiche" di Tutte le voci (V1-07). */
  conRettifiche?: boolean | null;
  rettifiche?: readonly unknown[] | null;
}

/** Riga di DomandePerAnno (TX-0008): annoRaccolta = campagna, altrimenti anno di rilascio della domanda di sostegno; null senza nessuno dei due. */
export interface RigaDomandeAnno {
  annoRaccolta?: number | null;
  primaAnnualita?: number | null;
  altreAnnualita?: number | null;
  nonClassificate?: number | null;
  totali?: number | null;
}

/** Riga di ImportiPerAnno (TX-0010). */
export interface RigaImportiAnno {
  annoRaccolta?: number | null;
  importoStanziato?: Importo;
  importoAmmesso?: Importo;
  importoDecretato?: Importo;
  domandeSenzaAmmesso?: number | null;
}

/** DomandeSigc (TX-0012): pagate e da pagare dagli importi della domanda (ASR2-20), si sovrappongono (pagate in parte). */
export interface DomandeSigcLike {
  presentate?: number | null;
  pagate?: number | null;
  daPagare?: number | null;
  senzaImporti?: number | null;
}

/**
 * ImportiSigc (TX-0013): somme per domanda, con ammesso = pagato + ancoraDaPagare - pagatoOltreAmmesso sulle domande con
 * entrambi gli importi; domandeSenza conta le domande senza uno dei tre importi (somme parziali dichiarate).
 */
export interface ImportiSigcLike {
  richiesto?: Importo;
  ammesso?: Importo;
  pagato?: Importo;
  ancoraDaPagare?: Importo;
  pagatoOltreAmmesso?: Importo;
  domandeSenza?: { richiesto?: number | null; ammesso?: number | null; pagato?: number | null } | null;
}

/** ResiduoSuImpegni (TX-0006). */
export interface ResiduoSuImpegniLike {
  dotazioneSpesaPubblica?: Importo;
  importoImpegnato?: Importo;
  dotazioneResidua?: Importo;
  /** Di cui stimato (revisioni del 31/10/2026, R04): il ramo dell'impegnato stimato del flusso. */
  impegnatoStimato?: Importo;
}

/** AvanzamentoPagamenti (TX-0005). */
export interface AvanzamentoPagamentiLike {
  pagamentiTotali?: Importo;
  impegnatoDaPagare?: Importo;
}

/** ResiduoSuPagamenti (TX-0007). */
export interface ResiduoSuPagamentiLike {
  dotazioneSpesaPubblica?: Importo;
  pagamentiNettoRettifiche?: Importo;
  dotazioneResidua?: Importo;
}

/** DistribuzioneDotazione (TX-0003). */
export interface DistribuzioneDotazioneLike {
  dotazioneSpesaPubblica?: Importo;
  quotaFeasr?: Importo;
  quotaNonFeasr?: Importo;
}

/** MonitoraggioRiserva (TX-0014): utilizzo progressivo con data ISO AAAA-MM-GG. */
export interface RiservaLike {
  importoAccumulato?: number | null;
  /** Revisioni del 31/10/2026 (R17): montante dei pagamenti, quote della riserva (5%) e del residuo (2%) e loro natura. */
  montantePagamenti?: number | null;
  quotaRiserva?: number | null;
  quotaResiduo?: number | null;
  naturaRiserva?: string | null;
  naturaResiduo?: string | null;
  utilizzoProgressivo?: Array<{ data?: string | null; importo?: number | null; cumulato?: number | null }> | null;
}
