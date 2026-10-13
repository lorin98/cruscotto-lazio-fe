// tabelle.ts — supporto dei test del finanziario sulle tabelle e sulla route-table (solo test).
import routeTable from '../../../app/route-table.json';
import uiplan from '../../../../uiplan.json';

/** Il testo di una cella senza i link di drill-down verso l'elenco operativo (riconosciuti dalla destinazione, non dallo stile). */
export function senzaLinkElenco(cella: Element | null | undefined): string | null | undefined {
  const copia = cella?.cloneNode(true) as Element | undefined;
  copia?.querySelectorAll("a[href^='/elenco-operativo']").forEach((a) => a.remove());
  return copia?.textContent;
}

/** I path delle route del finanziario, dallo uiplan della feature (la route-table e' del progetto: piu' feature, ADR 0028). */
const PATH_FINANZIARIO = new Set(uiplan.routes.map((r) => r.path));

/** Le voci della route-table che appartengono al finanziario. */
export const ROTTE_FINANZIARIO = routeTable.routes.filter((r) => PATH_FINANZIARIO.has(r.path));
