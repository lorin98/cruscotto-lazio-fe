// dto.ts — forme minime dei DTO letti dalle funzioni pure del procedurale, con i nomi dei campi del contratto
// (TX-0024..TX-0032). Sono strutturali (i layer puri non importano dal confine api/): ui/contratto.ts verifica a
// compilazione che ogni campo esista nel DTO generato, cosi' un campo rinominato nella spec ferma la compilazione invece
// di sparire in pagina. I conteggi e gli importi col motivo dell'assenza (ConteggioProcedurale, QuantitaProcedurale,
// Importo) sono DatoMotivatoLike dell'entity importo: il valore, oppure null col motivo (FONTE_NON_ATTIVA con la fonte
// attesa, NON_VALORIZZATO). Molti campi sono facoltativi nella spec: le funzioni pure li leggono come tali.
import type { DatoMotivatoLike } from '../../../entities/importo';
import type { UltimoDato } from '../../../shared/lib';

/** Perimetro di una risposta: REGIONALE, oppure ADA per le domande del P4 (i dati di programma restano regionali). */
export type Perimetro = 'REGIONALE' | 'ADA';
export type TipoDomanda = 'SOSTEGNO' | 'PAGAMENTO';

/** Un conteggio o un importo col motivo dell'assenza. */
export type Dato = DatoMotivatoLike<number>;

/** VoceStato: una voce di SR-01 col nome stabile; domande null con FONTE_NON_ATTIVA (IN_COMPILAZIONE senza fonte). */
export interface VoceStato {
  stato: string;
  descrizione: string;
  domande: number | null;
  domandeNonRilasciate: number;
  motivo: string | null;
  fonte: string | null;
}

/** AltroStato: uno stato che nessuna voce del catalogo abbina, col suo codice. */
export interface AltroStato {
  codice: string;
  descrizione: string | null;
  domande: number;
  domandeNonRilasciate: number;
}

/** DistribuzioneStati: le voci, gli altri stati, il totale e il di cui non rilasciate (senza stato: area programmazione). */
export interface Distribuzione {
  voci: VoceStato[];
  altriStati: AltroStato[];
  totale: number;
  domandeNonRilasciate: number;
  senzaStato: number;
}

/** StatiDomandeRiga di TX-0027 e TX-0028. */
export interface RigaStati {
  codiceIntervento?: string;
  stati?: Distribuzione;
}

/** StatiDomande di TX-0027 e TX-0028: una riga per intervento selezionato e il totale. */
export interface Stati {
  perimetro?: Perimetro;
  tipoDomanda?: TipoDomanda;
  righe?: RigaStati[];
  totale?: Distribuzione;
}

/** DomandeAmmesseRiga di TX-0026. */
export interface RigaAmmesse {
  codiceIntervento: string;
  perimetroIntervento: string | null;
  attivato: boolean;
  domandeAmmesse: number;
  conAttoConcessione: Dato;
  importoRichiesto: Dato;
  contributoAmmesso: Dato;
}

/** DomandeAmmesseTotale di TX-0026. */
export interface TotaleAmmesse {
  domandeAmmesse?: number;
  conAttoConcessione?: Dato;
  importoRichiesto?: Dato;
  contributoAmmesso?: Dato;
  interventiAttivati?: number;
  interventiPerimetroUfficiale?: number;
}

/** DomandeAmmesse di TX-0026. */
export interface Ammesse {
  perimetro?: Perimetro;
  righe?: RigaAmmesse[];
  totale?: TotaleAmmesse;
}

/** RiepilogoProceduraleRiga di TX-0029: le misure di TX-0026 e le tre distribuzioni dell'intervento. */
export interface RigaRiepilogo {
  ammesse?: RigaAmmesse;
  statiAreaProgrammazione?: Distribuzione;
  statiSostegno?: Distribuzione;
  statiPagamento?: Distribuzione;
}

/** RiepilogoProceduraleTotale di TX-0029. */
export interface TotaleRiepilogo {
  ammesse?: TotaleAmmesse;
  statiAreaProgrammazione?: Distribuzione;
  statiSostegno?: Distribuzione;
  statiPagamento?: Distribuzione;
}

/** RiepilogoProcedurale di TX-0029. */
export interface Riepilogo {
  perimetro?: Perimetro;
  righe?: RigaRiepilogo[];
  totale?: TotaleRiepilogo;
}

/** SottofaseCensita: una sottofase dell'anagrafica con le sue sole domande. */
export interface SottofaseCensita {
  codice: string;
  descrizione: string;
  esito?: string | null;
  domande: Dato;
}

/** SottofaseVoce: una voce di SR-01, la sottofase censita che la abbina (null se non censita) e le domande della voce. */
export interface VoceSottofase {
  fase: string;
  descrizione: string;
  domande: Dato;
  censita: SottofaseCensita | null;
}

/** SottofasiAmmissibilita di TX-0031 e TX-0032. */
export interface Sottofasi {
  perimetro?: Perimetro;
  tipoDomanda?: TipoDomanda;
  voci?: VoceSottofase[];
  altre?: SottofaseCensita[];
}

/** PagamentiUnitAmountRiga di TX-0030. */
export interface RigaUnitAmount {
  codiceIntervento?: string;
  codiceUnitAmount?: string;
  gruppoColturale?: string;
  esercizio?: number;
  importoUnitario?: Dato;
  outputPrevisto?: Dato;
  importoPagato?: Dato;
  percentualePagata?: Dato;
  baseStorica?: Dato;
}

/** PagamentiUnitAmount di TX-0030 (dati di programma: sempre regionali). */
export interface UnitAmount {
  perimetro?: 'REGIONALE';
  righe?: RigaUnitAmount[];
}

/** StatoAreaProgrammazione di TX-0025: chiave da rimandare in ?stato=, descrizione, origine. */
export interface StatoArea {
  chiave: string;
  descrizione: string;
  origine: 'CATALOGO' | 'OSSERVATO' | 'SENZA_STATO';
}

/** StatiAreaProgrammazione di TX-0025. */
export interface ValoriStatiArea {
  perimetro?: 'REGIONALE';
  valori?: StatoArea[];
}

/** FiltriProcedurali di TX-0024: i valori dei filtri del programma e l'ultimo dato sincronizzato per flusso. */
export interface ValoriFiltri {
  perimetro?: 'REGIONALE';
  interventi?: { chiave?: string; descrizione?: string | null }[];
  obiettiviSpecifici?: { chiave?: string; descrizione?: string | null }[];
  obiettiviGenerali?: string[];
  obiettiviPolicy?: string[];
  ultimiDatiSincronizzati?: UltimoDato[];
}
