// dto.ts — forme minime dei DTO letti dalle funzioni pure del fisico, con i nomi dei campi del contratto (TX-0018, TX-0017
// e TX-0030: l'output regionale e le Unit Amount sono del fisico dal riallineamento degli ambiti del 29/10/2026).
// Sono strutturali (i layer puri non importano dal confine api/): ui/contratto.ts verifica a compilazione che ogni campo
// esista nel DTO generato, cosi' un campo rinominato nella spec ferma la compilazione invece di sparire in pagina.
import type { DatoMotivatoLike } from '../../../entities/importo';
import type { UltimoDato } from '../../../shared/lib';

/** SuperficieCampagna di TX-0018: superfici in ettari (due decimali, una DS negativa del file entra col suo segno). */
export interface CampagnaSuperficie {
  anno: number;
  domandePagamento: number;
  domandeSostegno: number;
  sostegniDiscordanti: number;
  superficieDs: number;
  superficieDp: number;
  differenzaDpDs: number;
  domandeDpOltreDs: number;
  /** Oggi sempre assente: FONTE_NON_ATTIVA con fonte QUANTITA_RICHIESTA_PREMIO (D-02 del backend, OP-FIS-04). */
  quantitaRichiestaPremio: DatoMotivatoLike<number>;
}

/** SuperficieIntervento di TX-0018: campagne in ordine crescente; NON_VALORIZZATO se l'intervento non ne ha nessuna. */
export interface InterventoSuperficie {
  codiceIntervento: string;
  motivo: string | null;
  campagne: CampagnaSuperficie[];
}

/** SuperficieAmmissibile di TX-0018: campagna richiesta (null = tutte), perimetro sempre REGIONALE, ultimo dato. */
export interface Superfici {
  campagna: number | null;
  perimetro: string;
  righe: InterventoSuperficie[];
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

/** PagamentiUnitAmountRiga di TX-0030 (campi facoltativi come nella spec). */
export interface RigaUnitAmount {
  codiceIntervento?: string;
  codiceUnitAmount?: string;
  gruppoColturale?: string;
  esercizio?: number;
  importoUnitario?: DatoMotivatoLike<number>;
  outputPrevisto?: DatoMotivatoLike<number>;
  importoPagato?: DatoMotivatoLike<number>;
  percentualePagata?: DatoMotivatoLike<number>;
  baseStorica?: DatoMotivatoLike<number>;
}

/** PagamentiUnitAmount di TX-0030 (dati di programma: sempre regionali), con l'ultimo dato sincronizzato. */
export interface UnitAmount {
  perimetro?: 'REGIONALE';
  righe?: RigaUnitAmount[];
  ultimiDatiSincronizzati?: UltimoDato[];
}
