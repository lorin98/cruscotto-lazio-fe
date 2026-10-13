// formato.ts — resa PURA dei campi dell'elenco operativo (zero React): importi col motivo dell'assenza (mai uno zero),
// somme del sinottico con le domande senza importo, etichette dei codici del contratto, superfici e responsabile del
// procedimento col loro motivo.
import { descriviImporto } from '../../../entities/importo';
import type { ImportoLike } from '../../../entities/importo';
import { formatDate, formatEuro, formatNumber, formatPercentuale, plurale } from '../../../shared/lib';
import type { Somma, ValoreMotivato } from './dto';

/** Cella di un Importo di una domanda: euro, oppure l'assenza con il motivo ("non valorizzato"). */
export function cellaImporto(importo: ImportoLike | null | undefined): string {
  return descriviImporto(importo).testo;
}

/** Importo con la nota dell'assenza, per la scheda e l'anteprima: "non valorizzato (il dato non è presente nella fonte)". */
export function importoConNota(importo: ImportoLike | null | undefined): string {
  const r = descriviImporto(importo);
  return r.nota ? `${r.testo} (${r.nota})` : r.testo;
}

/**
 * Somma del sinottico o dei totali: il totale delle domande che hanno l'importo e quante non lo hanno (D-05). Il totale e'
 * assente solo se manca su tutte le domande: allora "non valorizzato".
 */
export function testoSomma(somma: Somma | null | undefined): { valore: string; nota?: string } {
  const valore = somma?.totale?.valore != null ? formatEuro(somma.totale.valore) : descriviImporto(somma?.totale).testo;
  const senza = somma?.senzaValore ?? 0;
  return senza > 0 ? { valore, nota: `${plurale(senza, 'domanda', 'domande')} senza importo` } : { valore };
}

/** Quota pagata sull'ammesso (percentuale gia' calcolata dal server), oppure "non calcolabile". */
export function testoQuotaPagata(quota: number | null | undefined): string {
  return quota == null ? 'non calcolabile' : formatPercentuale(quota);
}

const TIPI: Record<string, string> = { SOSTEGNO: 'Sostegno', PAGAMENTO: 'Pagamento' };
/** "Sostegno", "Pagamento"; un codice nuovo resta il codice. */
export function etichettaTipo(tipo: string | null | undefined): string {
  return tipo ? (TIPI[tipo] ?? tipo) : '';
}

const ESITI: Record<string, string> = { PAGATA: 'Pagata', ESCLUSA: 'Esclusa' };
/** Esito della riga di elenco; per una domanda chiusa lo dice in testo (non solo col colore). */
export function etichettaEsito(esito: string | null | undefined, domandaCorrente = true): string {
  const e = esito ? (ESITI[esito] ?? esito) : '';
  return domandaCorrente ? e : `${e} (domanda chiusa)`;
}

/** Valori dei filtri codificati del contratto, con l'etichetta da mostrare. */
export const ETICHETTE_VALORI: Partial<Record<string, Record<string, string>>> = {
  tipo: TIPI,
  annualita: { PRIMA: 'Prima annualità', ALTRE: 'Altre annualità', NON_CLASSIFICATE: 'Non classificate' },
  pagamento: { PAGATA: 'Pagate', DA_PAGARE: 'Da pagare', SENZA_IMPORTI: 'Senza importi' },
  esito: { PAGATA: 'Pagata', ESCLUSA: 'Esclusa' },
  anno: { SENZA: 'Senza anno' },
  stato: { SENZA_STATO: 'Senza stato SIAN' },
  statoProgrammazione: { SENZA_STATO: 'Senza stato area programmazione' },
};

/** Anno di raccolta, oppure "senza anno" (D-09 di finanziario: campagna, altrimenti anno di rilascio). */
export function testoAnno(anno: number | null | undefined): string {
  return anno == null ? 'senza anno' : String(anno);
}

/** Prima annualita': si', no (altre annualita'), oppure non classificata. */
export function testoAnnualita(prima: boolean | null | undefined): string {
  if (prima == null) return 'non classificata';
  return prima ? 'prima annualità' : 'altre annualità';
}

export function siNo(v: boolean | null | undefined): string {
  if (v == null) return '';
  return v ? 'sì' : 'no';
}

/** Superficie in ettari, oppure l'assenza col motivo (mai zero). */
export function testoSuperficie(s: ValoreMotivato<number> | null | undefined): string {
  if (s?.valore != null) return `${formatNumber(s.valore)} ha`;
  return 'non valorizzata';
}

/**
 * Nominativo del responsabile del procedimento (OP-008): ai profili senza l'area procedurale il backend lo manda null con
 * NON_ESPOSTO; senza nominativo nella determina, NON_VALORIZZATO.
 */
export function testoResponsabile(r: ValoreMotivato<string> | null | undefined): string {
  if (r?.valore) return r.valore;
  if (r?.motivo === 'NON_ESPOSTO') return "riservato ai profili dell'area procedurale";
  return 'non indicato nella determina';
}

/** Atto di concessione: "AC-1 del 01/03/2025", solo il numero, solo la data, oppure "nessun atto". */
export function testoAtto(numero: string | null | undefined, data: string | null | undefined): string {
  if (numero && data) return `${numero} del ${formatDate(data)}`;
  if (numero) return numero;
  if (data) return `del ${formatDate(data)}`;
  return 'nessun atto';
}

/** "1 riga", "2.173 righe": conteggi in italiano. */
export function conteggio(n: number | null | undefined, singolare: string, plur: string): string {
  return n == null ? '-' : `${formatNumber(n)} ${n === 1 ? singolare : plur}`;
}
