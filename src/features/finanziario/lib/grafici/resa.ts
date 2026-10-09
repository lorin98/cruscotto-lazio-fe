// resa.ts — resa del dominio nei builder dei grafici: un Importo assente si scrive come in tutto il resto
// dell'applicazione (descriviImporto di entities/importo, con il motivo e la fonte attesa), mai come zero. Il flag
// `aggregato` distingue un totale su piu' interventi (NON_VALORIZZATO = non calcolabile) da un dato di una riga.
import { descriviImporto } from '../../../../entities/importo';
import type { ImportoLike } from '../../../../entities/importo';
import { NON_DISPONIBILE, formatDate, formatEuro, formatNumber, numeroDi } from '../../../../shared/lib';
import { annoDiRaccolta } from '../formato';

export const PERIMETRO_ADA = 'ADA';
const SENZA_CODICE = 'Senza codice';

export function valoreDi(importo: ImportoLike | null | undefined): number | null {
  return numeroDi(importo?.valore);
}

/** "non disponibile (fonte impegni non attiva)", "non calcolabile (manca ...)": l'assenza con il suo motivo. */
export function assenzaImporto(importo: ImportoLike | null | undefined, aggregato = false): string {
  const r = descriviImporto(importo, aggregato);
  return r.nota ? `${r.testo} (${r.nota})` : r.testo;
}

/** Cella di tabella di un Importo: euro pieni, oppure l'assenza con il motivo (mai uno zero). */
export function cellaImporto(importo: ImportoLike | null | undefined, aggregato = false): string {
  const v = valoreDi(importo);
  return v == null ? assenzaImporto(importo, aggregato) : formatEuro(v);
}

export function cellaNumero(v: number | null | undefined): string {
  const n = numeroDi(v);
  return n == null ? NON_DISPONIBILE : formatNumber(n);
}

/** Cella di un importo in euro che non e' un Importo (numero semplice): assente = "non disponibile". */
export function cellaEuro(v: number | null | undefined): string {
  const n = numeroDi(v);
  return n == null ? NON_DISPONIBILE : formatEuro(n);
}

export function codiceDi(riga: { codiceIntervento?: string | null }): string {
  const codice = riga.codiceIntervento?.trim();
  return codice ? codice : SENZA_CODICE;
}

/** Anno di raccolta come nelle tabelle di dettaglio: "senza campagna" per l'anno nullo. */
export function annoDi(anno: number | null | undefined): string {
  return annoDiRaccolta(anno);
}

/** Righe in ordine di anno di raccolta crescente, quelle senza anno in coda (ordinamento stabile). */
export function perAnno<T extends { annoRaccolta?: number | null }>(righe: readonly T[]): T[] {
  return [...righe].sort((a, b) => {
    const x = a.annoRaccolta;
    const y = b.annoRaccolta;
    if (x == null) return y == null ? 0 : 1;
    return y == null ? -1 : x - y;
  });
}

/** Data AAAA-MM-GG come GG/MM/AAAA (senza fuso orario, come in tutte le tabelle). */
export function dataItaliana(iso: string): string {
  return formatDate(iso);
}

/** Problema della dotazione come base di un grafico (assente, zero, negativa), null se e' utilizzabile. */
export function problemaDotazione(importo: ImportoLike | null | undefined): string | null {
  const v = valoreDi(importo);
  if (v == null) return `dotazione ${assenzaImporto(importo)}`;
  if (v === 0) return 'dotazione pari a zero';
  return v < 0 ? 'dotazione negativa' : null;
}
