// riserva.ts — resa PURA della riserva al 5% (RF014) allineata al backend: la FASE e' calcolata al giorno della
// consultazione, gli IMPORTI sono quelli dell'istantanea estratta il giorno dataEstrazione (MonitoraggioRiserva).
// Congelato e residuo sono null finche' l'istantanea precede il congelamento (30/6/n+1); il residuo c'e' gia' dal
// congelamento ma diventa disponibile solo dal 1/1/n+2, se la riserva non e' utilizzata tutta entro il 31/12/n+1.
// Date ISO (AAAA-MM-GG): il confronto fra stringhe ISO e' cronologico.
import { formatDate, formatEuro } from '../../../shared/lib';

/** Fasi della riserva al 5% (enum della spec, RF014). */
export type FaseRiserva = 'NON_INIZIATA' | 'ACCUMULO' | 'UTILIZZO' | 'RESIDUO';

/** Calendario della riserva dell'anno n (date ISO): l'unica fonte delle date delle fasi. */
export function calendarioRiserva(n: number) {
  return {
    inizioAccumulo: `${n}-10-01`,
    congelamento: `${n + 1}-06-30`,
    inizioUtilizzo: `${n + 1}-07-01`,
    fineUtilizzo: `${n + 1}-12-31`,
    inizioResiduo: `${n + 2}-01-01`,
  };
}

/** Data ISO nella forma breve dei testi della riserva: 2025-10-01 -> "1/10/2025". */
export function dataBreve(iso: string): string {
  const [a, m, g] = iso.split('-').map(Number);
  return `${g}/${m}/${a}`;
}

const FASI_RISERVA: Record<FaseRiserva, (n: number) => string> = {
  NON_INIZIATA: (n) => `non iniziata (l'accumulo parte il ${dataBreve(calendarioRiserva(n).inizioAccumulo)})`,
  ACCUMULO: (n) => `accumulo (dal ${dataBreve(calendarioRiserva(n).inizioAccumulo)} al ${dataBreve(calendarioRiserva(n).congelamento)})`,
  UTILIZZO: (n) => `utilizzo (fino al ${dataBreve(calendarioRiserva(n).fineUtilizzo)})`,
  RESIDUO: (n) => `residuo (2% del montante, dal ${dataBreve(calendarioRiserva(n).inizioResiduo)})`,
};

/** Etichetta della fase con le date dell'anno n della riserva. */
export function etichettaFaseRiserva(fase: FaseRiserva | null | undefined, anno: number): string {
  // una fase che il contratto non conosce (nuovo valore dell'enum) resta "non disponibile", non un errore
  return fase && Object.hasOwn(FASI_RISERVA, fase) ? FASI_RISERVA[fase](anno) : 'non disponibile';
}

/** Testo d'aiuto del selettore dell'anno: le fasi in generale o con le date dell'anno scelto. */
export function aiutoRiserva(n?: number): string {
  if (n === undefined) return 'Accumulo dal 1 ottobre n al 30 giugno n+1, utilizzo fino al 31 dicembre n+1, residuo dal 1 gennaio n+2.';
  const c = calendarioRiserva(n);
  return `Per il ${n}: accumulo dal ${dataBreve(c.inizioAccumulo)} al ${dataBreve(c.congelamento)}, utilizzo fino al ${dataBreve(c.fineUtilizzo)}, residuo dal ${dataBreve(c.inizioResiduo)}.`;
}

/** Primo giorno della fase per l'anno n della riserva (null per NON_INIZIATA). */
export function inizioFase(fase: FaseRiserva | null | undefined, n: number): string | null {
  const c = calendarioRiserva(n);
  const inizi: Partial<Record<FaseRiserva, string>> = { ACCUMULO: c.inizioAccumulo, UTILIZZO: c.inizioUtilizzo, RESIDUO: c.inizioResiduo };
  return (fase && inizi[fase]) ?? null;
}

/** Vero se l'istantanea e' stata estratta prima dell'inizio della fase attuale (i suoi valori sono di una fase precedente). */
export function istantaneaAnteriore(fase: FaseRiserva | null | undefined, n: number, dataEstrazione: string | null | undefined): boolean {
  const inizio = inizioFase(fase, n);
  return !!inizio && !!dataEstrazione && dataEstrazione < inizio;
}

const alla = (dataEstrazione: string | null | undefined) => (dataEstrazione ? `all'estrazione del ${formatDate(dataEstrazione)}` : "nell'istantanea");

export function testoCongelato(v: number | null | undefined, n: number, dataEstrazione: string | null | undefined): string {
  return v == null ? `non ancora congelato ${alla(dataEstrazione)}: si congela al ${dataBreve(calendarioRiserva(n).congelamento)}` : formatEuro(v);
}

export function testoResiduo(v: number | null | undefined, n: number, dataEstrazione: string | null | undefined, oggi: string): string {
  const c = calendarioRiserva(n);
  if (v == null) return `non ancora calcolato ${alla(dataEstrazione)}: si calcola al congelamento del ${dataBreve(c.congelamento)}`;
  if (oggi < c.inizioResiduo) {
    return `${formatEuro(v)} previsto: disponibile dal ${dataBreve(c.inizioResiduo)} se la riserva non è utilizzata completamente entro il ${dataBreve(c.fineUtilizzo)}`;
  }
  return formatEuro(v);
}

/** Vero se l'utilizzato supera la riserva (congelato, o accumulato prima del congelamento). */
export function utilizzoOltreRiserva(d: { importoUtilizzato?: number | null; importoCongelato?: number | null; importoAccumulato?: number | null }): boolean {
  const riserva = d.importoCongelato ?? d.importoAccumulato;
  return d.importoUtilizzato != null && riserva != null && d.importoUtilizzato > riserva;
}
