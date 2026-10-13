// tabelle.ts — supporto dei test del finanziario sulle tabelle (solo test). Le route del finanziario nella route-table del
// progetto stanno in tests/rotte-finanziario.ts: una feature non importa da app (review v4 H-01).

/** Il testo di una cella senza i link di drill-down verso l'elenco operativo (riconosciuti dalla destinazione, non dallo stile). */
export function senzaLinkElenco(cella: Element | null | undefined): string | null | undefined {
  const copia = cella?.cloneNode(true) as Element | undefined;
  copia?.querySelectorAll("a[href^='/elenco-operativo']").forEach((a) => a.remove());
  return copia?.textContent;
}
