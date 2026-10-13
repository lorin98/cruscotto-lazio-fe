// parametri-ripetuti.ts — parametri di query ripetuti come li vuole il backend (ParametriGrezzi): chiave ripetuta per ogni
// valore, valori ripuliti e senza doppioni, al piu' MAX_VALORI_PARAMETRO per chiave. Unica regola per i filtri del
// finanziario, i link verso l'elenco operativo e i criteri dell'elenco: ognuno passa le sue chiavi e le sue validazioni.

/** Tetto dei valori di un parametro ripetuto (ParametriGrezzi.MAX_VALORI del backend). */
export const MAX_VALORI_PARAMETRO = 100;

/** I valori di `chiave` nella ricerca: ripuliti (trim), solo quelli validi, senza doppioni, al piu' `max`. */
export function leggiRipetuti(ricerca: URLSearchParams, chiave: string, valido: (valore: string) => boolean = () => true, max = MAX_VALORI_PARAMETRO): string[] {
  return Array.from(new Set(ricerca.getAll(chiave).map((v) => v.trim()).filter(valido))).slice(0, max);
}

/**
 * Query string (senza "?") con le chiavi nell'ordine dato, chiave ripetuta per ogni valore, senza doppioni, al piu' `max`
 * valori per chiave (o quelli di `maxPer` per una chiave): lo stesso insieme da' sempre lo stesso indirizzo.
 */
export function scriviRipetuti(
  chiavi: readonly string[],
  valori: (chiave: string) => readonly string[] | undefined,
  maxPer: (chiave: string) => number = () => MAX_VALORI_PARAMETRO,
): string {
  const p = new URLSearchParams();
  for (const chiave of new Set(chiavi)) for (const v of Array.from(new Set(valori(chiave) ?? [])).slice(0, maxPer(chiave))) p.append(chiave, v);
  return p.toString();
}
