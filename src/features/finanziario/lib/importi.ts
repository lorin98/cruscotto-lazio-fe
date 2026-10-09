// importi.ts — regole PURE sugli Importo dei report del finanziario (zero React), condivise da builder dei grafici e
// aggregati: valore, codice dell'intervento, resa dell'assenza come in tutto il resto dell'applicazione (descriviImporto
// di entities/importo, con il motivo e la fonte attesa, mai uno zero), problemi della dotazione come base di un rapporto.
import { descriviImporto } from '../../../entities/importo';
import type { ImportoLike } from '../../../entities/importo';
import { formatEuro, numeroDi } from '../../../shared/lib';

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

export function codiceDi(riga: { codiceIntervento?: string | null }): string {
  const codice = riga.codiceIntervento?.trim();
  return codice ? codice : SENZA_CODICE;
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

/** Problema della dotazione come base di un rapporto (assente, zero, negativa), null se e' utilizzabile. */
export function problemaDotazione(importo: ImportoLike | null | undefined): string | null {
  const v = valoreDi(importo);
  if (v == null) return `dotazione: ${assenzaImporto(importo)}`;
  if (v === 0) return 'dotazione pari a zero';
  return v < 0 ? 'dotazione negativa' : null;
}
