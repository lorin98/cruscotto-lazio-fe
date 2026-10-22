// output.ts — l'output regionale come DATI (PURO, zero React; TX-0017): le tre misure dell'interruttore (programmato,
// realizzato SIGC, realizzato non SIGC cumulativo: scelta approvata di OP-IS-06, una misura alla volta), gli anni del
// periodo dalla risposta, il dato di un anno per la misura scelta, la didascalia che dice la misura, le voci del drawer di
// anteprima e gli importi unitari in ordine di esercizio e di codice. Nessun totale ne' somma fra interventi: ogni
// intervento ha il suo indicatore e la sua unita' di misura (OP-IS-06).
import type { DatoMotivatoLike } from '../../../entities/importo';
import { confronta, minuscolaIniziale } from '../../../shared/lib';
import type { ValoreOrdinabile } from '../../../shared/lib';
import type { ImportoUnitario, Output, RigaOutput } from './dto';
import { testoTarget } from './formato';

export type Misura = 'programmato' | 'realizzatoSigc' | 'realizzatoNonSigc';

/** Le misure dell'interruttore, nell'ordine del wireframe. */
export const MISURE: readonly Misura[] = ['programmato', 'realizzatoSigc', 'realizzatoNonSigc'];

/** "Programmato", "Realizzato SIGC", "Realizzato non SIGC (cumulativo)" (realizzatoNonSigcCumulativo della risposta, D-04). */
export function etichettaMisura(m: Misura, cumulativo: boolean): string {
  if (m === 'programmato') return 'Programmato';
  if (m === 'realizzatoSigc') return 'Realizzato SIGC';
  return cumulativo ? 'Realizzato non SIGC (cumulativo)' : 'Realizzato non SIGC';
}

/** Gli anni del periodo della risposta, da annoInizio ad annoFine: una colonna ciascuno. */
export function anniDelPeriodo(d: Pick<Output, 'annoInizio' | 'annoFine'>): number[] {
  const anni: number[] = [];
  for (let a = d.annoInizio; a <= d.annoFine; a++) anni.push(a);
  return anni;
}

/** Il dato dell'anno per la misura; un anno che la riga non elenca e' non valorizzato (il backend li elenca tutti). */
export function datoDellAnno(r: RigaOutput, anno: number, m: Misura): DatoMotivatoLike<number> {
  return r.anni.find((a) => a.anno === anno)?.[m] ?? { valore: null, motivo: 'NON_VALORIZZATO', fonte: null };
}

/** Valore per l'ordinamento della colonna di un anno (assente = null, in fondo). */
export function ordinabileDellAnno(r: RigaOutput, anno: number, m: Misura): ValoreOrdinabile {
  return datoDellAnno(r, anno, m).valore ?? null;
}

/**
 * La didascalia della tabella dice quale misura e' mostrata (note WCAG dello uiplan: il cambio non sposta il focus); la
 * tabella del kit aggiunge il numero di righe e come aprirle.
 */
export function captionOutput(m: Misura, cumulativo: boolean): string {
  return `Output ${minuscolaIniziale(etichettaMisura(m, cumulativo))} per anno (misura scelta sopra), l'intervento è l'intestazione di riga e gli anni vengono dalla risposta`;
}

/** Le voci del drawer di anteprima: indicatore con l'unita', target di fine periodo, come si legge il realizzato non SIGC. */
export function vociAnteprima(r: RigaOutput, cumulativo: boolean): { termine: string; valore: string }[] {
  const indicatore = r.indicatoreOutput ?? 'non valorizzato';
  return [
    { termine: 'Indicatore di output', valore: r.unitaMisura ? `${indicatore} (${r.unitaMisura})` : indicatore },
    { termine: 'Target di fine periodo', valore: testoTarget(r.targetFinePeriodo, r.annoTarget, r.unitaMisura) },
    { termine: 'Realizzato non SIGC', valore: cumulativo ? 'cumulativo per anno di riferimento' : 'annuale' },
  ];
}

/** Gli importi unitari in ordine di esercizio e poi di codice della Unit Amount (wireframe intervento, scheda Importi). */
export function importiOrdinati(r: Pick<RigaOutput, 'importiUnitari'>): ImportoUnitario[] {
  return [...r.importiUnitari].sort((a, b) => a.esercizio - b.esercizio || confronta(a.codiceUnitAmount, b.codiceUnitAmount));
}

/** La riga dell'intervento nella risposta (il dettaglio legge col solo intervento della route). */
export function rigaDellIntervento<R extends { codiceIntervento: string }>(righe: readonly R[] | undefined, codice: string): R | undefined {
  return righe?.find((r) => r.codiceIntervento === codice);
}

/** Testo su cui cerca la ricerca della tabella: codice, indicatore e unita' di misura. */
export function testoRicercaOutput(r: RigaOutput): string {
  return `${r.codiceIntervento} ${r.indicatoreOutput ?? ''} ${r.unitaMisura ?? ''}`;
}
