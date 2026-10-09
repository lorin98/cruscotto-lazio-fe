// tabella.ts — operazioni PURE della tabella interattiva (ricerca, ordinamento, paginazione). Zero React: la
// TabellaInterattiva di shared/ui le compone. I valori assenti (null) vanno sempre in fondo, in qualunque verso.

export type Verso = 'crescente' | 'decrescente';
export type ValoreOrdinabile = string | number | null | undefined;

/** Righe il cui testo di ricerca contiene il testo cercato (senza distinguere maiuscole e accenti). */
export function filtraRighe<T>(righe: readonly T[], cercato: string, testoDi: (r: T) => string): T[] {
  const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const q = norm(cercato.trim());
  return q ? righe.filter((r) => norm(testoDi(r)).includes(q)) : [...righe];
}

/** Ordinamento stabile; numeri come numeri, testo in ordine alfabetico italiano; null/undefined in fondo. */
export function ordinaRighe<T>(righe: readonly T[], valoreDi: (r: T) => ValoreOrdinabile, verso: Verso): T[] {
  const segno = verso === 'crescente' ? 1 : -1;
  return righe
    .map((r, i) => ({ r, i, v: valoreDi(r) }))
    .sort((a, b) => {
      const an = a.v == null, bn = b.v == null;
      if (an || bn) return an === bn ? a.i - b.i : an ? 1 : -1;
      const c = typeof a.v === 'number' && typeof b.v === 'number' ? a.v - b.v : String(a.v).localeCompare(String(b.v), 'it', { numeric: true });
      return c !== 0 ? c * segno : a.i - b.i;
    })
    .map((x) => x.r);
}

export function numeroPagine(totale: number, perPagina: number): number {
  return Math.max(1, Math.ceil(totale / Math.max(1, perPagina)));
}

/** La pagina richiesta (da 0), riportata nell'intervallo valido. */
export function paginaDi<T>(righe: readonly T[], pagina: number, perPagina: number): { righe: T[]; pagina: number; pagine: number } {
  const pagine = numeroPagine(righe.length, perPagina);
  const p = Math.min(Math.max(0, pagina), pagine - 1);
  return { righe: righe.slice(p * perPagina, (p + 1) * perPagina), pagina: p, pagine };
}

export interface Ordine {
  chiave: string;
  verso: Verso;
}

/** Ordine dopo il clic su una colonna: sulla stessa si inverte il verso, una nuova parte dal decrescente. */
export function versoSuccessivo(ordine: Ordine, chiave: string): Ordine {
  if (ordine.chiave !== chiave) return { chiave, verso: 'decrescente' };
  return { chiave, verso: ordine.verso === 'crescente' ? 'decrescente' : 'crescente' };
}

/** Valore di aria-sort di una colonna. */
export function ariaSort(ordine: Ordine, chiave: string): 'ascending' | 'descending' | 'none' {
  if (ordine.chiave !== chiave) return 'none';
  return ordine.verso === 'crescente' ? 'ascending' : 'descending';
}

/** Didascalia con il conteggio delle righe, la ricerca e, se le righe si aprono, come aprirle. */
export function didascalia(caption: string, righe: number, cercato: string, apribile: boolean): string {
  const conteggio = righe === 1 ? '1 riga' : `${righe} righe`;
  const ricerca = cercato.trim() ? ` per «${cercato.trim()}»` : '';
  return `${caption}: ${conteggio}${ricerca}.${apribile ? ' Clic o Invio su una riga per aprirla.' : ''}`;
}

/** Insieme delle colonne nascoste dopo aver mostrato o nascosto una colonna. */
export function conColonna(nascoste: ReadonlySet<string>, chiave: string, visibile: boolean): Set<string> {
  const n = new Set(nascoste);
  if (visibile) n.delete(chiave);
  else n.add(chiave);
  return n;
}
