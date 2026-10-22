// dto.ts — forme minime dei DTO letti dalle funzioni pure del fisico, con i nomi dei campi del contratto (TX-0018, TX-0020).
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

/** DeterminaDellaDomanda di TX-0020. */
export interface Determina {
  codice: string;
  data: string;
  fonteStatoAreaProgrammazione: boolean;
  fonteComparto: boolean;
}

/** DetermineDomanda di TX-0020: la determina corrente (oppure null con NON_VALORIZZATO) e quelle con riga aperta. */
export interface Determine {
  codiceABarre: string;
  tipoDomanda: string;
  domandaChiusa: boolean;
  corrente: { valore: Determina | null; motivo: string | null };
  elenco: Determina[];
}
