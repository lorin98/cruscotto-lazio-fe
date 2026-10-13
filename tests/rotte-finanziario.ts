// rotte-finanziario.ts — le voci della route-table del progetto che appartengono al finanziario (solo test). Sta fra i test,
// non nella feature: la route-table e' dell'app e una feature non importa da app (review v4 H-01).
import routeTable from '../src/app/route-table.json';
import uiplan from '../uiplan.json';

/** I path delle route del finanziario, dallo uiplan della feature (la route-table e' del progetto: piu' feature, ADR 0028). */
const PATH_FINANZIARIO = new Set(uiplan.routes.map((r) => r.path));

/** Le voci della route-table che appartengono al finanziario. */
export const ROTTE_FINANZIARIO = routeTable.routes.filter((r) => PATH_FINANZIARIO.has(r.path));
