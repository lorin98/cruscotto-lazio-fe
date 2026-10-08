// riserva.ts — resa PURA della riserva al 5% (RF014) allineata al backend: la FASE e' calcolata al giorno della
// consultazione, gli IMPORTI sono quelli dell'istantanea estratta il giorno dataEstrazione (MonitoraggioRiserva).
// Congelato e residuo sono null finche' l'istantanea precede il congelamento (30/6/n+1); il residuo c'e' gia' dal
// congelamento ma diventa disponibile solo dal 1/1/n+2, se la riserva non e' utilizzata tutta entro il 31/12/n+1.
// Date ISO (AAAA-MM-GG): il confronto fra stringhe ISO e' cronologico.
import { formatDate, formatEuro } from '../../../shared/lib';
import type { FaseRiserva } from './filtri';

/** Primo giorno della fase per l'anno n della riserva (null per NON_INIZIATA). */
export function inizioFase(fase: FaseRiserva | null | undefined, n: number): string | null {
  switch (fase) {
    case 'ACCUMULO':
      return `${n}-10-01`;
    case 'UTILIZZO':
      return `${n + 1}-07-01`;
    case 'RESIDUO':
      return `${n + 2}-01-01`;
    default:
      return null;
  }
}

/** Vero se l'istantanea e' stata estratta prima dell'inizio della fase attuale (i suoi valori sono di una fase precedente). */
export function istantaneaAnteriore(fase: FaseRiserva | null | undefined, n: number, dataEstrazione: string | null | undefined): boolean {
  const inizio = inizioFase(fase, n);
  return !!inizio && !!dataEstrazione && dataEstrazione < inizio;
}

const alla = (dataEstrazione: string | null | undefined) => (dataEstrazione ? `all'estrazione del ${formatDate(dataEstrazione)}` : "nell'istantanea");

export function testoCongelato(v: number | null | undefined, n: number, dataEstrazione: string | null | undefined): string {
  return v == null ? `non ancora congelato ${alla(dataEstrazione)}: si congela al 30/6/${n + 1}` : formatEuro(v);
}

export function testoResiduo(v: number | null | undefined, n: number, dataEstrazione: string | null | undefined, oggi: string): string {
  if (v == null) return `non ancora calcolato ${alla(dataEstrazione)}: si calcola al congelamento del 30/6/${n + 1}`;
  if (oggi < `${n + 2}-01-01`) {
    return `${formatEuro(v)} previsto: disponibile dal 1/1/${n + 2} se la riserva non è utilizzata completamente entro il 31/12/${n + 1}`;
  }
  return formatEuro(v);
}

/** Vero se l'utilizzato supera la riserva (congelato, o accumulato prima del congelamento). */
export function utilizzoOltreRiserva(d: { importoUtilizzato?: number | null; importoCongelato?: number | null; importoAccumulato?: number | null }): boolean {
  const riserva = d.importoCongelato ?? d.importoAccumulato;
  return d.importoUtilizzato != null && riserva != null && d.importoUtilizzato > riserva;
}
