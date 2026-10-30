// determine.ts — il contratto dell'indirizzo delle determine di una domanda (PURO), condiviso dalle feature: la pagina
// del procedurale /procedurale/determine/:codice? (TX-0020, nel procedurale dal riallineamento degli ambiti del 29/10/2026,
// A-3) e il grant della sua lettura (VERBATIM dall'authz-catalog). L'elenco operativo ci costruisce il link
// determine-della-domanda della scheda della domanda (OP-EO-07) senza importare dalla feature procedurale (uiplan-patterns
// 7): come percorsoSchedaDomanda per il passaggio inverso (link scheda-domanda delle determine).
import { codiceABarreValido } from './elenco';

/** Ingresso della pagina delle determine di una domanda (senza codice: il solo modulo di ricerca). */
export const PERCORSO_DETERMINE_DELLA_DOMANDA = '/procedurale/determine';

/** Grant della lettura delle determine di una domanda (TX-0020), verbatim dal catalogo. */
export const GRANT_DETERMINE_DELLA_DOMANDA = 'csr.tx-0020.read';

/** Le determine della domanda col codice a barre dato (/procedurale/determine/<codice>); null se il codice non e' di sole
 *  cifre (al piu' 30, come nel percorso del backend): un valore diverso non entra mai nell'indirizzo. */
export function percorsoDetermineDellaDomanda(codiceABarre: string | null | undefined): string | null {
  return codiceABarreValido(codiceABarre) ? `${PERCORSO_DETERMINE_DELLA_DOMANDA}/${codiceABarre}` : null;
}
