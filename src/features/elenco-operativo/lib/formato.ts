// formato.ts — resa PURA dei campi dell'elenco operativo (zero React): importi col motivo dell'assenza (mai uno zero),
// somme del sinottico con le domande senza importo, etichette dei codici del contratto, superfici e responsabile del
// procedimento col loro motivo, atto di concessione ("nessun atto" solo con la fonte attiva, altrimenti l'assenza).
import { ANNO_ASSENTE, ANNO_SENZA, ETICHETTE_ANNUALITA, ETICHETTE_ESITO_PAGAMENTO, ETICHETTE_ESITO_RIGA } from '../../../entities/domanda';
import { descriviAssenza, descriviImporto, testoConNota } from '../../../entities/importo';
import type { ImportoLike } from '../../../entities/importo';
import { formatDate, formatEuro, formatNumber, formatPercentuale, plurale } from '../../../shared/lib';
import type { DatoSenzaFonte, Somma } from './dto';

/** Cella di un Importo di una domanda: euro, oppure l'assenza con il motivo ("non valorizzato"). */
export function cellaImporto(importo: ImportoLike | null | undefined): string {
  return descriviImporto(importo).testo;
}

/** Importo con la nota dell'assenza, per la scheda e l'anteprima: "non valorizzato (il dato non è presente nella fonte)". */
export function importoConNota(importo: ImportoLike | null | undefined): string {
  return testoConNota(descriviImporto(importo));
}

/**
 * Somma del sinottico o dei totali: il totale delle domande che hanno l'importo e quante non lo hanno (D-05). Il totale e'
 * assente solo se manca su tutte le domande: allora "non valorizzato". `unita`: cosa si conta (domande, righe).
 */
export function testoSomma(somma: Somma | null | undefined, unita: readonly [string, string] = ['domanda', 'domande']): { valore: string; nota?: string } {
  const valore = somma?.totale?.valore != null ? formatEuro(somma.totale.valore) : descriviImporto(somma?.totale).testo;
  const senza = somma?.senzaValore ?? 0;
  return senza > 0 ? { valore, nota: `${plurale(senza, unita[0], unita[1])} senza importo` } : { valore };
}

/** Motivo dell'assenza di un aggregato del sinottico (D-05 Rev. 1 del backend): non e' il "non valorizzato" della domanda. */
const MOTIVI_AGGREGATO: Readonly<Record<'liquidato' | 'recuperato', string>> = {
  liquidato: "una riga di liquidazione dell'insieme non ha l'importo",
  recuperato: "un recupero dell'insieme non ha l'importo",
};

/**
 * Liquidato o recuperato del sinottico: la somma, oppure "non calcolabile" col motivo dell'aggregato (un elemento
 * dell'insieme senza importo rende assente la somma, D-05 Rev. 1), mai zero (review v1 V-10).
 */
export function testoAggregato(importo: ImportoLike | null | undefined, campo: 'liquidato' | 'recuperato'): { valore: string; nota?: string } {
  if (importo?.valore != null) return { valore: formatEuro(importo.valore) };
  return { valore: 'non calcolabile', nota: MOTIVI_AGGREGATO[campo] };
}

/** Perimetro della risposta in parole (pill, badge, intestazione dei PNG); null se la risposta non lo porta. */
export function testoPerimetro(perimetro: string | null | undefined): string | null {
  if (perimetro === 'ADA') return 'ADA del tuo profilo';
  if (perimetro === 'REGIONALE') return 'regionale';
  return null;
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

const ESITI: Record<string, string> = ETICHETTE_ESITO_RIGA;
/** Esito della riga di elenco; per una domanda chiusa lo dice in testo (non solo col colore). */
export function etichettaEsito(esito: string | null | undefined, domandaCorrente = true): string {
  const e = esito ? (ESITI[esito] ?? esito) : '';
  return domandaCorrente ? e : `${e} (domanda chiusa)`;
}

/** Valori dei filtri codificati del contratto, con l'etichetta da mostrare. */
export const ETICHETTE_VALORI: Partial<Record<string, Record<string, string>>> = {
  tipo: TIPI,
  annualita: ETICHETTE_ANNUALITA,
  pagamento: ETICHETTE_ESITO_PAGAMENTO,
  esito: ETICHETTE_ESITO_RIGA,
  anno: { [ANNO_SENZA]: ANNO_ASSENTE.breve },
  stato: { SENZA_STATO: 'Senza stato SIAN' },
  statoProgrammazione: { SENZA_STATO: 'Senza stato area programmazione' },
};

/** Anno di raccolta, oppure "senza anno" (D-09 di finanziario: campagna, altrimenti anno di rilascio). */
export function testoAnno(anno: number | null | undefined): string {
  return anno == null ? ANNO_ASSENTE.breve.toLowerCase() : String(anno);
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
export function testoSuperficie(s: DatoSenzaFonte<number> | null | undefined): string {
  if (s?.valore != null) return `${formatNumber(s.valore)} ha`;
  return 'non valorizzata';
}

/**
 * Nominativo del responsabile del procedimento (OP-008): ai profili senza l'area procedurale il backend lo manda null con
 * NON_ESPOSTO; senza nominativo nella determina, NON_VALORIZZATO.
 */
export function testoResponsabile(r: DatoSenzaFonte<string> | null | undefined): string {
  if (r?.valore) return r.valore;
  if (r?.motivo === 'NON_ESPOSTO') return "riservato ai profili dell'area procedurale";
  return 'non indicato nella determina';
}

/**
 * L'atto di concessione quando la sua fonte non e' attiva: nessuna domanda del database ha l'atto (TX-0060
 * attoConcessioneDisponibile falso; D4 e D-02 Rev. 5-6 del backend). E' un'assenza con la fonte ATTO_CONCESSIONE, resa
 * come quella di un importo (review delta 21/10 X2, decisione F1 dell'utente).
 */
const ATTO_FONTE_NON_ATTIVA = { motivo: 'FONTE_NON_ATTIVA', fonte: 'ATTO_CONCESSIONE' } as const;

/**
 * Una domanda senza l'atto, secondo `fonteAttiva` (attoConcessioneDisponibile di TX-0060), in tre stati (review delta 21/10
 * passata 2 V1, decisione dell'utente del 22/10/2026). Vero: "nessun atto". Falso: l'assenza con la fonte, "non disponibile
 * (fonte atto di concessione non attiva)", perche' "nessun atto" sarebbe un "no" inventato (F1). Assente, cioe' TX-0060
 * non letto (in attesa, in errore, senza il grant): l'assenza senza motivo, "non disponibile"; lo stato ignoto non vale
 * mai come fonte attiva.
 */
function senzaAtto(fonteAttiva: boolean | undefined): string {
  if (fonteAttiva === true) return 'nessun atto';
  return testoConNota(descriviAssenza(fonteAttiva === false ? ATTO_FONTE_NON_ATTIVA : undefined));
}

/** Atto di concessione: "AC-1 del 01/03/2025", solo il numero, solo la data; senza l'atto vedi senzaAtto. */
export function testoAtto(numero: string | null | undefined, data: string | null | undefined, fonteAttiva?: boolean): string {
  if (numero && data) return `${numero} del ${formatDate(data)}`;
  if (numero) return numero;
  if (data) return `del ${formatDate(data)}`;
  return senzaAtto(fonteAttiva);
}

/**
 * Conteggio dal vivo del pannello dei filtri (review v1 V-03): mentre arriva la risposta dei criteri nuovi (dati
 * precedenti come segnaposto) dice "Conteggio in corso", mai il numero vecchio come se fosse di questi filtri.
 */
export function testoConteggio(n: number | null | undefined, unita: readonly [string, string], { inAggiornamento, inErrore = false }: { inAggiornamento: boolean; inErrore?: boolean }): string {
  if (inAggiornamento) return 'Conteggio in corso…';
  if (n == null) return inErrore ? 'Conteggio non disponibile' : 'Conteggio in corso…';
  return `${formatNumber(n)} ${n === 1 ? unita[0] : unita[1]} con questi filtri`;
}

/** Quota di un importo sull'altro della stessa domanda, in centesimi (es. pagato sull'ammesso); null se uno manca o la
 *  base non e' positiva: non si inventa un rapporto. */
export function quotaSu(parte: ImportoLike | null | undefined, base: ImportoLike | null | undefined): number | null {
  const p = parte?.valore;
  const b = base?.valore;
  if (p == null || b == null || b <= 0) return null;
  return Math.round((p / b) * 1000) / 10;
}
