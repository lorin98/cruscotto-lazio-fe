// dto.ts — forme minime dei DTO letti dalle funzioni pure, con i nomi dei campi del contratto (TX-0056..TX-0060). Sono
// strutturali (i layer puri non importano dal confine api/): ui/contratto.ts verifica a compilazione che ogni campo
// esista nel DTO generato.
import type { DatoMotivatoLike, ImportoLike } from '../../../entities/importo';

type Importo = ImportoLike | null;

/**
 * Dato col motivo dell'assenza ma senza la fonte: superfici (NON_VALORIZZATO) e responsabile del procedimento (NON_ESPOSTO).
 * E' il DatoMotivatoLike dell'entity con valore e motivo obbligatori (review delta 21/10 passata 2 H3: non piu' omonimo del
 * componente ValoreMotivato di entities/importo).
 */
export type DatoSenzaFonte<T> = Required<Pick<DatoMotivatoLike<T>, 'valore' | 'motivo'>>;

/** Somma di un importo sulle domande che lo hanno, col numero di quelle che non lo hanno (SommaElenco). */
export interface Somma {
  totale?: Importo;
  senzaValore?: number;
}

/** DomandaElenco (D-03): una riga dell'elenco e la domanda della scheda. */
export interface Domanda {
  codiceABarre?: string;
  tipo?: string;
  cuaa?: string | null;
  denominazione?: string | null;
  codiceIntervento?: string;
  annoRaccolta?: number | null;
  primaAnnualita?: boolean | null;
  sigc?: boolean;
  statoCodice?: string | null;
  statoDescrizione?: string | null;
  statoProgrammazione?: string | null;
  provincia?: string | null;
  enteDelegato?: string | null;
  richiesto?: Importo;
  ammesso?: Importo;
  pagato?: Importo;
  ancoraDaPagare?: Importo;
  liquidato?: Importo;
  recuperato?: Importo;
  attoConcessioneNumero?: string | null;
  attoConcessioneData?: string | null;
  anomalie?: number;
  superficieSostegno?: DatoSenzaFonte<number>;
  superficiePagamento?: DatoSenzaFonte<number>;
}

/** PagamentoElenco (D-07): una riga corrente degli elenchi di liquidazione. */
export interface Pagamento {
  decreto?: string;
  protocollo?: string | null;
  dataAutorizzazione?: string | null;
  tipologiaElenco?: string | null;
  tipologiaPagamento?: string | null;
  codiceABarre?: string;
  tipoDomanda?: string;
  cuaa?: string | null;
  denominazione?: string | null;
  codiceIntervento?: string;
  esito?: string;
  importoDecretato?: Importo;
  importoPagato?: Importo;
  quotaFeasr?: Importo;
  quotaNazionale?: Importo;
  quotaRegionale?: Importo;
  motiviEsclusione?: string[];
  domandaCorrente?: boolean;
}

/** VoceRipartizione: una voce delle ripartizioni del sinottico. */
export interface Voce {
  chiave?: string;
  descrizione?: string | null;
  domande?: number;
}

/** SinotticoElenco (D-05): aggregati dell'intero insieme filtrato. */
export interface Sinottico {
  domande?: number;
  sostegno?: number;
  pagamento?: number;
  presentate?: number;
  sigc?: number;
  beneficiari?: number;
  richiesto?: Somma;
  ammesso?: Somma;
  pagato?: Somma;
  ancoraDaPagare?: Somma;
  liquidato?: Importo;
  recuperato?: Importo;
  quotaPagata?: number | null;
  pagate?: number;
  daPagare?: number;
  senzaImporti?: number;
  perStato?: Voce[];
  perIntervento?: Voce[];
  perAnno?: Voce[];
}

/** TotaliPagamenti (D-07): totali dell'insieme filtrato dei pagamenti, importi delle righe PAGATA. */
export interface Totali {
  pagate?: number;
  escluse?: number;
  importoDecretato?: Somma;
  importoPagato?: Importo;
  quotaFeasr?: Importo;
  quotaNazionale?: Importo;
  quotaRegionale?: Importo;
}

/** VoceFiltro e StatoSianElenco: un valore dei filtri con la descrizione. */
export interface VoceValore {
  chiave?: string;
  codice?: string;
  descrizione?: string | null;
}

/** ValoriFiltriElenco (D-08): valori dei filtri nel perimetro del chiamante. */
export interface Valori {
  interventi?: VoceValore[];
  obiettiviSpecifici?: VoceValore[];
  obiettiviGenerali?: string[];
  obiettiviPolicy?: string[];
  azioniPortanti?: VoceValore[];
  stati?: VoceValore[];
  statiProgrammazione?: string[];
  province?: string[];
  enti?: string[];
  anni?: number[];
  decreti?: string[];
  tipi?: string[];
}
