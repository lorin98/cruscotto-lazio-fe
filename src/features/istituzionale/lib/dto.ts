// dto.ts — forme minime dei DTO letti dalle funzioni pure dell'istituzionale, con i nomi dei campi del contratto (TX-0016,
// TX-0017). Sono strutturali (i layer puri non importano dal confine api/): ui/contratto.ts verifica a compilazione che
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

/** MonitoraggioOutputAnno di TX-0017: le tre misure di un anno del periodo. */
export interface AnnoOutput {
  anno: number;
  programmato: DatoMotivatoLike<number>;
  realizzatoSigc: DatoMotivatoLike<number>;
  realizzatoNonSigc: DatoMotivatoLike<number>;
}

/** ImportoUnitarioUnitAmount di TX-0017. */
export interface ImportoUnitario {
  codiceUnitAmount: string;
  gruppoColturale: string;
  esercizio: number;
  importoUnitario: DatoMotivatoLike<number>;
}

/** MonitoraggioOutputRiga di TX-0017: indicatore, unita' di misura, target e anni del periodo in ordine. */
export interface RigaOutput {
  codiceIntervento: string;
  indicatoreOutput: string | null;
  unitaMisura: string | null;
  targetFinePeriodo: DatoMotivatoLike<number>;
  annoTarget: number | null;
  anni: AnnoOutput[];
  importiUnitari: ImportoUnitario[];
}

/** MonitoraggioOutput di TX-0017: periodo (annoInizio..annoFine), perimetro sempre REGIONALE. */
export interface Output {
  annoInizio: number;
  annoFine: number;
  perimetro: string;
  realizzatoNonSigcCumulativo: boolean;
  righe: RigaOutput[];
  ultimiDatiSincronizzati: UltimoDato[];
}
