// importo.ts — funzioni PURE sull'Importo dei report (zero React). L'Importo del backend porta il valore al centesimo
// oppure null con il motivo dell'assenza (schema Importo delle spec: FONTE_NON_ATTIVA con la fonte attesa,
// NON_VALORIZZATO, FUORI_PERIMETRO). Regola di resa: un importo assente non e' mai uno zero.
import { formatEuro } from '../../../shared/lib';

/** Forma strutturale dell'Importo della spec (il client generato si importa solo dai wrapper api/). */
export interface ImportoLike {
  valore?: number | null;
  motivo?: string | null;
  fonte?: string | null;
}

export interface ImportoResa {
  disponibile: boolean;
  /** Testo della cella: l'importo formattato, oppure lo stato dell'assenza. */
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
 * Resa di un Importo. `aggregato`: l'importo e' un totale su piu' interventi o domande. Per il backend un totale e'
 * NON_VALORIZZATO quando manca anche per un solo intervento o una sola domanda (niente somme parziali): non e' "assente
 * nella fonte", e' non calcolabile.
 */
export function descriviImporto(importo: ImportoLike | null | undefined, aggregato = false): ImportoResa {
  if (importo?.valore != null) return { disponibile: true, testo: formatEuro(importo.valore) };
  switch (importo?.motivo) {
    case 'FONTE_NON_ATTIVA':
      return { disponibile: false, testo: 'non disponibile', nota: `fonte ${etichettaFonte(importo.fonte)} non attiva` };
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
