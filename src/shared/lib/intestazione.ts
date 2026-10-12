// intestazione.ts — intestazione dei file generati nel browser (oggi il PNG di un grafico), con le voci di NFR-50 come
// quella dei CSV e XLSX scritti dal backend: testata e titolo, fonte, contesto della pagina (filtri applicati, profilo,
// ultimo dato sincronizzato), data e ora di estrazione, dicitura sull'uso interno (review v3 V-01). Il PNG non e'
// registrato in AUDIT_ESPORTAZIONE: punto aperto OP-FE-08. Puro.
import { formatDataOra } from './format';

export const TESTATA = 'Cruscotto CSR Lazio';
/** La stessa dicitura dei file del backend (EsportaTabellaService.DICITURA). */
export const DICITURA_USO = 'Documento ad uso interno di ARSIAL e della Regione Lazio: dati riservati, non diffondere';

/** Righe dell'intestazione: la prima e' il titolo; `contesto` sono le righe della pagina (filtri, profilo, ultimo dato). */
export function righeIntestazione({ titolo, fonte, contesto, estrattoIl }: { titolo: string; fonte: string; contesto: readonly string[]; estrattoIl: Date }): string[] {
  return [`${TESTATA} - ${titolo}`, fonte, ...contesto, `Estratto il ${formatDataOra(estrattoIl.toISOString())} (Europe/Rome)`, `Uso: ${DICITURA_USO}`];
}

/**
 * Una riga divisa in linee larghe al piu' `massimo` secondo `misura` (la larghezza del testo disegnato), a capo fra le
 * parole; una parola piu' larga del massimo resta intera su una linea sua.
 */
export function aCapo(testo: string, massimo: number, misura: (t: string) => number): string[] {
  const linee: string[] = [];
  let corrente = '';
  for (const parola of testo.split(/\s+/).filter(Boolean)) {
    const prova = corrente ? `${corrente} ${parola}` : parola;
    if (corrente && misura(prova) > massimo) {
      linee.push(corrente);
      corrente = parola;
    } else {
      corrente = prova;
    }
  }
  return corrente ? [...linee, corrente] : linee;
}
