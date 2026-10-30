// determine.ts — il contratto dell'indirizzo delle determine di una domanda (PURO), condiviso dalle feature: la pagina
// del procedurale /procedurale/determine/:codice? (TX-0020, nel procedurale dal riallineamento degli ambiti del 29/10/2026,
// A-3) e il grant della sua lettura (VERBATIM dall'authz-catalog). L'elenco operativo ci costruisce il link
// determine-della-domanda della scheda della domanda (OP-EO-07) senza importare dalla feature procedurale (uiplan-patterns
// 7): come percorsoSchedaDomanda per il passaggio inverso (link scheda-domanda delle determine). Anche lo state della
// navigazione di quel link (il tipo della scheda di partenza, decisione D1 dell'utente del 30/10/2026): chi lo scrive e
// chi lo legge stanno in due feature.
import { codiceABarreValido, tipoDomandaValido } from './elenco';
import type { TipoDellaDomanda } from './elenco';

/** Ingresso della pagina delle determine di una domanda (senza codice: il solo modulo di ricerca). */
export const PERCORSO_DETERMINE_DELLA_DOMANDA = '/procedurale/determine';

/** Grant della lettura delle determine di una domanda (TX-0020), verbatim dal catalogo. */
export const GRANT_DETERMINE_DELLA_DOMANDA = 'csr.tx-0020.read';

/** Le determine della domanda col codice a barre dato (/procedurale/determine/<codice>); null se il codice non e' di sole
 *  cifre (al piu' 30, come nel percorso del backend): un valore diverso non entra mai nell'indirizzo. */
export function percorsoDetermineDellaDomanda(codiceABarre: string | null | undefined): string | null {
  return codiceABarreValido(codiceABarre) ? `${PERCORSO_DETERMINE_DELLA_DOMANDA}/${codiceABarre}` : null;
}

/**
 * Lo state della navigazione del link determine-della-domanda della scheda (decisione D1 dell'utente del 30/10/2026,
 * review step9 EO-01): il tipo della scheda di partenza, mai nell'indirizzo. TX-0020 ha solo il codice a barre e sceglie
 * la domanda con la regola dell'aggancio: con un codice di due domande (SOSTEGNO e PAGAMENTO) la pagina delle determine
 * puo' mostrare quella dell'altro tipo, e con questo state lo dice.
 */
export interface ArrivoDallaScheda {
  tipoDellaScheda: TipoDellaDomanda;
}

/** Lo state del link dalla scheda del tipo dato; undefined (nessuno state) se il tipo non e' SOSTEGNO o PAGAMENTO. */
export function arrivoDallaScheda(tipo: string | null | undefined): ArrivoDallaScheda | undefined {
  return tipoDomandaValido(tipo) ? { tipoDellaScheda: tipo } : undefined;
}

/**
 * Il tipo della scheda di partenza dallo state della navigazione (che e' `unknown`, anche manipolabile), convalidato
 * contro l'elenco chiuso (SOSTEGNO, PAGAMENTO); null senza state (indirizzo condiviso, ricerca dal modulo) o con uno
 * non valido.
 */
export function tipoDellaSchedaDiPartenza(stato: unknown): TipoDellaDomanda | null {
  const tipo = typeof stato === 'object' && stato !== null && 'tipoDellaScheda' in stato ? stato.tipoDellaScheda : undefined;
  return tipoDomandaValido(tipo) ? tipo : null;
}
