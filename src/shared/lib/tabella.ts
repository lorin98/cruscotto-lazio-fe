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
