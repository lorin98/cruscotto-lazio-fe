// dto.ts — forme minime dei DTO letti dalle funzioni pure dell'istituzionale, con i nomi dei campi del contratto (TX-0016,
// TX-0015). Sono strutturali (i layer puri non importano dal confine api/): ui/contratto.ts verifica a compilazione che
// ogni campo esista nel DTO generato, cosi' un campo rinominato nella spec ferma la compilazione invece di sparire in
// pagina. Ogni dato col motivo dell'assenza (Conteggio, Data, ImportoIstituzionale, Quantita, SiNo, TestoIstituzionale)
// e' un DatoMotivatoLike dell'entity importo: il valore, oppure null col motivo (FONTE_NON_ATTIVA, NON_VALORIZZATO,
// ANNO_NON_CONSERVATO, FONTE_AMBIGUA).
import type { DatoMotivatoLike } from '../../../entities/importo';
import type { UltimoDato } from '../../../shared/lib';

/** VerificaSmpNonSigcRiga di TX-0016: i ventuno dati di un intervento; domande e spesa sono conteggi veri (mai assenti). */
export interface RigaVerifica {
  codiceIntervento: string;
  avvisiAttivati: DatoMotivatoLike<number>;
  avvisiChiusi: DatoMotivatoLike<number>;
  azioniAttivate: DatoMotivatoLike<number>;
  dotazioneAvvisi: DatoMotivatoLike<number>;
  chiusuraUltimoAvvisoAperto: DatoMotivatoLike<string>;
  domandeRicevute: number;
  domandeRicevuteSenzaRichiesto: number;
  valoreDomandeRicevute: DatoMotivatoLike<number>;
  domandeFinanziate: number;
  valoreDomandeFinanziate: DatoMotivatoLike<number>;
  domandeSaldate: number;
  anticipiErogati: DatoMotivatoLike<number>;
  spesaErogata: DatoMotivatoLike<number>;
  concessioniPreviste: DatoMotivatoLike<boolean>;
  includeTopUp: DatoMotivatoLike<boolean>;
  importoTopUp: DatoMotivatoLike<number>;
  outputAttesoFinanziate: DatoMotivatoLike<number>;
  outputErogato: DatoMotivatoLike<number>;
  indicatoreOutput: DatoMotivatoLike<string>;
  indicatoreRisultato: DatoMotivatoLike<string>;
}

/** VerificaSmpNonSigc di TX-0016: anno del file (null = nessun file), perimetro sempre REGIONALE, output cumulativo. */
export interface Verifica {
  annoRiferimento: number | null;
  perimetro: string;
  outputCumulativo: boolean;
  righe: RigaVerifica[];
  ultimiDatiSincronizzati: UltimoDato[];
}

/**
 * Riga di VerificaSmp di TX-0015 per il grafico (verifica SMP SIGC, dal finanziario): il codice e la spesa erogata nella
 * campagna precedente; la previsione di pagamento e' un si'/no (D-11 del backend) e sta nella tabella. I campi sono
 * facoltativi come nella spec.
 */
export interface RigaVerificaSigc {
  codiceIntervento?: string;
  spesaErogataCampagnaPrecedente?: DatoMotivatoLike<number>;
}
