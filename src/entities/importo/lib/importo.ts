// importo.ts — funzioni PURE sull'Importo dei report e sugli altri dati col motivo dell'assenza (zero React). Il backend
// porta il valore (l'importo al centesimo, un conteggio, un si'/no) oppure null con il motivo dell'assenza (schemi Importo,
// ConteggioFinanziario, SiNoFinanziario delle spec: FONTE_NON_ATTIVA con la fonte attesa, NON_VALORIZZATO,
// FUORI_PERIMETRO). Regola di resa: un dato assente non e' mai uno zero ne' un "no"; l'assenza si dice sempre allo stesso
// modo, qualunque sia il tipo del valore (review delta 21/10 H1).
import { formatEuro } from '../../../shared/lib';

/**
 * Forma strutturale di un dato col motivo dell'assenza (Importo, ConteggioFinanziario, SiNoFinanziario della spec; il
 * client generato si importa solo dai wrapper api/): il valore, oppure null col motivo e, con FONTE_NON_ATTIVA, la fonte.
 */
export interface DatoMotivatoLike<T> {
  valore?: T | null;
  motivo?: string | null;
  fonte?: string | null;
}

/** Forma strutturale dell'Importo della spec: un dato motivato in euro. */
export type ImportoLike = DatoMotivatoLike<number>;

export interface ImportoResa {
  disponibile: boolean;
  /** Testo della cella: l'importo formattato, oppure lo stato dell'assenza (anche di un dato motivato non in euro). */
  testo: string;
  /** Spiegazione dell'assenza (fonte attesa, perimetro), da mostrare accanto o come descrizione. */
  nota?: string;
}

// Fonti attese che il backend puo' dichiarare con FONTE_NON_ATTIVA: tutti i valori dell'enum FonteAttesa di ARSCSR
// (la spec non porta l'enum su Importo.fonte: un codice nuovo resta leggibile come codice, vedi etichettaFonte).
const FONTI: Record<string, string> = {
  IMPEGNI: 'impegni',
  QUADRO_SINOTTICO: 'quadro sinottico',
  RIPARTO_STATO_REGIONE: 'riparto Stato - Regione',
  VINCOLO_LEADER: 'vincolo LEADER',
  PREVISIONE_PAGAMENTO: 'previsione di pagamento',
  REGOLA_N2: 'regola n+2 e vincolo di pagamento entro ottobre',
  LEGAME_AZIONI_PORTANTI: 'legame interventi - azioni portanti',
  AVVISI_SMP: 'avvisi SMP',
  CONCESSIONI_SMP: 'concessioni SMP',
  QUANTITA_RICHIESTA_PREMIO: 'quantità richiesta a premio',
  ATTO_CONCESSIONE: 'atto di concessione',
  PAGATO_PER_UNIT_AMOUNT: 'pagato per Unit Amount',
  SOTTOFASI_DOMANDA: 'sottofasi della domanda',
  DOMANDE_IN_COMPILAZIONE: 'domande in compilazione',
  VALORE_COMPARTO: 'valore del comparto',
  CONSISTENZA_ZOOTECNICA: 'consistenza zootecnica',
  MISURE_AGRICOLE: 'misure agricole',
  INTERVENTI_SETTORIALI: 'interventi settoriali',
  CSR_CON_SGR: 'CSR con SGR',
};

/** Etichetta leggibile di una fonte attesa; un codice non noto resta il codice (mai una stringa vuota). */
export function etichettaFonte(codice: string | null | undefined): string {
  if (!codice) return 'non indicata';
  return FONTI[codice] ?? codice;
}

/**
 * Resa dell'assenza di un dato motivato, qualunque sia il tipo del valore: lo stato col motivo e la fonte attesa.
 * `aggregato`: il dato e' un totale su piu' interventi o domande. Per il backend un totale e' NON_VALORIZZATO quando manca
 * anche per un solo intervento o una sola domanda (niente somme parziali): non e' "assente nella fonte", e' non calcolabile.
 */
export function descriviAssenza(dato: Pick<DatoMotivatoLike<unknown>, 'motivo' | 'fonte'> | null | undefined, aggregato = false): ImportoResa {
  switch (dato?.motivo) {
    case 'FONTE_NON_ATTIVA':
      // la fonte attesa, se il backend la dichiara ("fonte impegni non attiva")
      return { disponibile: false, testo: 'non disponibile', nota: dato.fonte ? `fonte ${etichettaFonte(dato.fonte)} non attiva` : 'fonte non attiva' };
    case 'NON_VALORIZZATO':
      return aggregato
        ? { disponibile: false, testo: 'non calcolabile', nota: 'manca per almeno un intervento della selezione: vedi il riepilogo per intervento' }
        : { disponibile: false, testo: 'non valorizzato', nota: 'il dato non è presente nella fonte' };
    case 'FUORI_PERIMETRO':
      return { disponibile: false, testo: 'fuori perimetro', nota: 'non visibile nel perimetro del profilo' };
    default:
      return { disponibile: false, testo: 'non disponibile' };
  }
}

/**
 * La resa in testo con la nota fra parentesi, per le voci, i testi e i motivi dei grafici: "non disponibile (fonte impegni
 * non attiva)"; senza nota il solo testo. Una sola forma testuale dell'assenza per tutte le feature (review delta 21/10
 * passata 2 H3); la forma a badge e' AssenzaMotivata.
 */
export function testoConNota(r: ImportoResa): string {
  return r.nota ? `${r.testo} (${r.nota})` : r.testo;
}

/** Resa di un Importo: l'euro formattato, oppure la sua assenza (descriviAssenza; `aggregato` come li'). */
export function descriviImporto(importo: ImportoLike | null | undefined, aggregato = false): ImportoResa {
  if (importo?.valore != null) return { disponibile: true, testo: formatEuro(importo.valore) };
  return descriviAssenza(importo, aggregato);
}
