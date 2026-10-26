// intestazione.ts — intestazione dei file generati nel browser (oggi il PNG di un grafico), con le voci di NFR-50 come
// quella dei CSV e XLSX scritti dal backend: testata e titolo, fonte, contesto della pagina (filtri applicati, profilo,
// ultimo dato sincronizzato), data e ora di estrazione, dicitura sull'uso interno (review v3 V-01). Il PNG non e'
// registrato in AUDIT_ESPORTAZIONE: punto aperto OP-FE-08. Il perimetro in parole e' quello delle letture regionali del
// fisico e dell'istituzionale (review H7: prima una copia per feature). Puro.
import { formatDataOra } from './format';
import { testoUltimiDati } from './aggiornamento';
import type { UltimoDato } from './aggiornamento';

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

/**
 * Il perimetro di una risposta in parole, per le pill, le righe di contesto e i riferimenti: REGIONALE = "regionale", ADA
 * = "ADA del tuo profilo" (le domande del P4, come nell'elenco operativo, che prima ne aveva la sua copia; ora anche nel
 * procedurale).
 */
export function testoPerimetro(perimetro: string): string {
  if (perimetro === 'ADA') return 'ADA del tuo profilo';
  return perimetro === 'REGIONALE' ? 'regionale' : perimetro.toLowerCase();
}

/**
 * Etichetta di una misura per domanda (pagamenti, domande, superfici): con il perimetro ADA della risposta e' dell'area del
 * profilo. Prima nel lib del finanziario; ora anche delle card della Home degli altri ambiti.
 */
export function etichettaDellArea(etichetta: string, perimetro: string | null | undefined): string {
  return perimetro === 'ADA' ? `${etichetta} della tua area` : etichetta;
}

/**
 * Righe di contesto della pagina per l'intestazione dei file generati nel browser (PNG dei grafici, NFR-50): i filtri
 * applicati come nella barra, il profilo, l'ultimo dato sincronizzato per flusso con lo stesso testo dei file del backend.
 * `filtri`: "Etichetta: valore" di ogni filtro applicato; `ultimi` assente = non letto (grant mancante, errore, attesa).
 */
export function righeContesto({
  filtri,
  profilo,
  ultimi,
  perimetro,
}: {
  filtri: readonly string[];
  profilo: string | undefined;
  ultimi: readonly UltimoDato[] | undefined;
  /** Perimetro dei dati della pagina gia' in parole (es. "regionale"), come nell'intestazione dei file del backend. */
  perimetro?: string | null;
}): string[] {
  return [
    `Filtri applicati: ${filtri.length > 0 ? filtri.join('; ') : 'nessuno'}`,
    ...(perimetro ? [`Perimetro: ${perimetro}`] : []),
    `Profilo: ${profilo ?? 'non indicato'}`,
    `Ultimo dato sincronizzato: ${ultimi ? testoUltimiDati(ultimi) : 'non disponibile'}`,
  ];
}
