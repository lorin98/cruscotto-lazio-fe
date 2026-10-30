// collegamenti.ts — gli indirizzi dei links[] dello uiplan del fisico (PURO, ADR 0028 §8; flusso intervento approvato il
// 30/10/2026): il dettaglio dell'intervento dai drawer delle tre pagine (dettaglio-intervento-superfici,
// dettaglio-intervento-output, dettaglio-intervento-unit-amount) e i tre report filtrati sull'intervento dai pulsanti
// della testata del dettaglio (output-regionale-intervento, superfici-intervento, unit-amount-intervento). Tutti nella
// stessa feature; ogni link porta solo i parametri della sua `query` (il codice nel percorso, oppure intervento).
import { ricercaDaFiltri } from '../../../entities/filtri';
import { criteriDellIntervento } from './criteri';
import { PERCORSI } from './pagine';

/** Il report col solo filtro Intervento sul codice dato (la query del link: intervento). */
function conIntervento(percorso: string, codice: string): string {
  const query = ricercaDaFiltri(criteriDellIntervento(codice));
  return query ? `${percorso}?${query}` : percorso;
}

/**
 * link:dettaglio-intervento-*: il dettaglio dell'intervento, col codice nel percorso CODIFICATO (un valore con '/' resta un
 * solo segmento della route; il dettaglio lo convalida prima di leggere).
 */
export function percorsoIntervento(codice: string): string {
  return `${PERCORSI.interventi}/${encodeURIComponent(codice)}`;
}

/** link:output-regionale-intervento: l'output regionale filtrato sull'intervento. */
export function outputDellIntervento(codice: string): string {
  return conIntervento(PERCORSI.output, codice);
}

/** link:superfici-intervento: le superfici ammissibili filtrate sull'intervento (tutte le campagne). */
export function superficiDellIntervento(codice: string): string {
  return conIntervento(PERCORSI.superfici, codice);
}

/** link:unit-amount-intervento: le Unit Amount filtrate sull'intervento. */
export function unitAmountDellIntervento(codice: string): string {
  return conIntervento(PERCORSI.unitAmount, codice);
}
