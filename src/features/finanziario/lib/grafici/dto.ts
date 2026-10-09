// dto.ts — forme minime dei DTO letti dai builder, con i nomi dei campi del contratto. Sono strutturali (i layer puri
// non importano dal confine api/): ui/contratto.ts verifica a compilazione che ogni campo esista nel DTO generato.
import type { ImportoLike } from '../../../../entities/importo';

type Importo = ImportoLike | null;

/** Riga di SpesaPerIntervento (TX-0002). */
export interface RigaSpesa {
  codiceIntervento?: string;
  dotazioneSpesaPubblica?: Importo;
  pagamentiTotali?: Importo;
  percentualeContributoAmbientale?: number | null;
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
}

/** Riga di DomandePerAnno (TX-0008): annoRaccolta null per le domande senza campagna. */
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

/** DomandeSigc (TX-0012). */
export interface DomandeSigcLike {
  presentate?: number | null;
  pagate?: number | null;
  daPagare?: number | null;
}

/** ImportiSigc (TX-0013): domandeSenza conta le domande senza uno dei tre importi (somme parziali dichiarate). */
export interface ImportiSigcLike {
  richiesto?: Importo;
  ammesso?: Importo;
  pagato?: Importo;
  ancoraDaPagare?: Importo;
  domandeSenza?: { richiesto?: number | null; ammesso?: number | null; pagato?: number | null } | null;
}

/** ResiduoSuImpegni (TX-0006). */
export interface ResiduoSuImpegniLike {
  dotazioneSpesaPubblica?: Importo;
  importoImpegnato?: Importo;
  dotazioneResidua?: Importo;
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
  utilizzoProgressivo?: Array<{ data?: string | null; importo?: number | null; cumulato?: number | null }> | null;
}

/** Riga di VerificaSmp (TX-0015). */
export interface RigaSmp {
  codiceIntervento?: string;
  previsionePagamentoEsercizio?: Importo;
  spesaErogataCampagnaPrecedente?: Importo;
}
