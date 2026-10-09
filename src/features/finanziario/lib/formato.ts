// formato.ts — resa PURA dei campi dei report del finanziario (zero React). Un dato assente non e' mai uno zero ne' una
// cella vuota: e' "non disponibile" come per gli Importo (ValoreImporto), salvo dove la spec ne dice il motivo.
import { NON_DISPONIBILE, formatEuro, formatNumber, formatPercentuale } from '../../../shared/lib';

export { NON_DISPONIBILE };

export function testoOpzionale(v: string | null | undefined): string {
  return v == null || v.trim() === '' ? NON_DISPONIBILE : v;
}

export function siNo(v: boolean | null | undefined): string {
  if (v == null) return NON_DISPONIBILE;
  return v ? 'sì' : 'no';
}

export function numeroOpzionale(v: number | null | undefined): string {
  return v == null ? NON_DISPONIBILE : formatNumber(v);
}

export function euroOpzionale(v: number | null | undefined): string {
  return v == null ? NON_DISPONIBILE : formatEuro(v);
}

export function percentualeOpzionale(v: number | null | undefined): string {
  return v == null ? NON_DISPONIBILE : formatPercentuale(v);
}

/** Anno di raccolta: null per le domande senza campagna (spec DomandePerAnno). */
export function annoDiRaccolta(anno: number | null | undefined): string {
  return anno == null ? 'senza campagna' : String(anno);
}

/** Anno come testo (senza separatore delle migliaia), "non disponibile" se assente. */
export function annoOpzionale(v: number | null | undefined): string {
  return v == null ? NON_DISPONIBILE : String(v);
}
