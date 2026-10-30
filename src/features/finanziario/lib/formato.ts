// formato.ts — resa PURA dei campi dei report del finanziario (zero React). Un dato assente non e' mai uno zero ne' una
// cella vuota: e' "non disponibile" come per gli Importo (ValoreImporto), salvo dove la spec ne dice il motivo. Il numero
// e il testo facoltativi sono quelli comuni di shared/lib (review del riallineamento IST-06 e FIN-01, che ha tolto anche
// siNo e annoOpzionale, rimasti senza consumatori con l'uscita della verifica SMP).
import { ANNO_ASSENTE } from '../../../entities/domanda';
import { NON_DISPONIBILE, formatEuro, formatPercentuale } from '../../../shared/lib';

export { NON_DISPONIBILE };

export function euroOpzionale(v: number | null | undefined): string {
  return v == null ? NON_DISPONIBILE : formatEuro(v);
}

export function percentualeOpzionale(v: number | null | undefined): string {
  return v == null ? NON_DISPONIBILE : formatPercentuale(v);
}

/** Anno di raccolta: la campagna, altrimenti l'anno di rilascio della domanda di sostegno; null senza nessuno dei due (spec DomandePerAnno). */
export function annoDiRaccolta(anno: number | null | undefined): string {
  return anno == null ? ANNO_ASSENTE.esteso : String(anno);
}
