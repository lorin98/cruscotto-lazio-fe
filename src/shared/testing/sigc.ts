// sigc.ts — il filtro SIGC nei dati di esempio del dev server (MSW): come il backend (D-12 Rev.,
// REV-D1), per INTERVENTO, con la classificazione della programmazione (F1); un intervento non classificato non passa ne'
// SIGC ne' NO SIGC. Un solo elenco per tutte le aree (review A-10, X-11: prima i mock di fisico, procedurale e
// istituzionale ignoravano sigc).

/** Gli interventi classificati SIGC nella programmazione (revisioni del 31/10/2026, F1). */
export const INTERVENTI_SIGC: ReadonlySet<string> = new Set(['SRA01', 'SRA03', 'SRA14', 'SRA15', 'SRA29', 'SRA30', 'SRB01', 'SRC01']);

/**
 * Vero se l'intervento passa il filtro `sigc` della query: assente = tutti; 'true' i SIGC; 'false' i NO SIGC, cioe' i
 * classificati non SIGC (`classificato` dice se l'intervento ha una classificazione: di default tutti i non SIGC la hanno).
 */
export function passaSigc(codice: string, p: URLSearchParams, classificato: (codice: string) => boolean = () => true): boolean {
  const s = p.get('sigc');
  if (s === null) return true;
  if (INTERVENTI_SIGC.has(codice)) return s === 'true';
  return s === 'false' && classificato(codice);
}
