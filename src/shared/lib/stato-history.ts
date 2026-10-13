// stato-history — l'involucro con cui useStatoNellaHistory (shared/ui) conserva uno stato di pagina nello state della voce
// di history: state[chiave] = { firma, valore }. Funzioni pure, condivise dal hook e da chi deve portare quello stato in
// un link (l'elenco operativo verso la scheda e ritorno; review v1 iter3 H-02): l'involucro e' definito in un punto solo.
// Lo state della history e' `unknown` (chiunque nella stessa origine puo' scriverlo): la lettura convalida firma e valore.

export interface StatoSalvato<T> {
  firma: string;
  valore: T;
}

/** Il valore salvato sotto `chiave` con quella `firma` e che soddisfa `valido`; altrimenti undefined. */
export function leggiStatoSalvato<T>(state: unknown, chiave: string, firma: string, valido: (v: unknown) => v is T): T | undefined {
  if (typeof state !== 'object' || state === null) return undefined;
  const salvato: unknown = (state as Record<string, unknown>)[chiave];
  if (typeof salvato !== 'object' || salvato === null) return undefined;
  const { firma: f, valore } = salvato as Record<string, unknown>;
  return f === firma && valore !== undefined && valido(valore) ? valore : undefined;
}

/** Lo state con `valore` salvato sotto `chiave` e `firma`; le altre chiavi dello state restano. */
export function conStatoSalvato<T>(state: unknown, chiave: string, firma: string, valore: T): Record<string, unknown> {
  const base = typeof state === 'object' && state !== null ? (state as Record<string, unknown>) : {};
  return { ...base, [chiave]: { firma, valore } satisfies StatoSalvato<T> };
}
