// unitAmount.ts — le Unit Amount come DATI (PURO, zero React; TX-0030, dal procedurale col riallineamento degli ambiti
// del 29/10/2026): la chiave e l'etichetta di una riga (codice, intervento ed esercizio: lo stesso codice torna per
// esercizi diversi), il valore per l'ordinamento dei dati motivati, la fonte non attiva del pagato (oggi il caso reale,
// OP-FIS-14) detta UNA volta in una nota sopra la tabella, con le tre celle in breve (scelta 8 approvata il 22/10/2026),
// e nel drawer col motivo. Nessun totale: il DTO non lo porta.
import { descriviAssenza, resaAssenza } from '../../../entities/importo';
import type { ImportoResa } from '../../../entities/importo';
import type { RigaUnitAmount } from './dto';

/** La chiave stabile di una riga: intervento, codice ed esercizio (il codice si ripete fra gli esercizi). */
export function chiaveUnitAmount(r: RigaUnitAmount): string {
  return `${r.codiceIntervento ?? ''}|${r.codiceUnitAmount ?? ''}|${r.esercizio ?? ''}`;
}

/** L'etichetta di una riga nei grafici e nel drawer: "UA1 (SRD01, esercizio 2025)". */
export function etichettaUnitAmount(r: RigaUnitAmount): string {
  return `${r.codiceUnitAmount ?? ''} (${r.codiceIntervento ?? ''}, esercizio ${r.esercizio ?? ''})`;
}

/** I tre dati del pagato: importo pagato, percentuale pagata sul richiesto, base storica (stessa fonte). */
export const CAMPI_PAGATO = ['importoPagato', 'percentualePagata', 'baseStorica'] as const;
export type CampoPagato = (typeof CAMPI_PAGATO)[number];

/** I nomi dei tre dati del pagato, nelle intestazioni della tabella e nel drawer. */
export const TITOLI_PAGATO: Readonly<Record<CampoPagato, string>> = { importoPagato: 'Importo pagato', percentualePagata: 'Pagato sul richiesto', baseStorica: 'Base storica' };

/** La nota unica sopra la tabella quando la fonte del pagato non e' attiva; null con la fonte attiva. */
export function notaPagato(righe: readonly RigaUnitAmount[]): string | null {
  const senza = righe.find((r) => r.importoPagato?.motivo === 'FONTE_NON_ATTIVA');
  if (!senza) return null;
  return `Importo pagato, percentuale pagata sul richiesto e base storica: non disponibili per tutte le Unit Amount (${descriviAssenza(senza.importoPagato).nota ?? 'fonte non attiva'}). Nelle celle: "non disponibile".`;
}

/**
 * La resa dell'assenza di un dato del pagato: `breve` (le celle della tabella, sotto la nota che dice il motivo) con la
 * fonte non attiva "non disponibile", altrimenti completa col motivo (il drawer, un dialogo che non arriva alla nota).
 */
export function assenzaPagato(r: RigaUnitAmount, campo: CampoPagato, breve: boolean): ImportoResa {
  return resaAssenza(r[campo], breve);
}

/** Il valore per l'ordinamento di un dato motivato (null in fondo). */
export function valoreDi(d: { valore?: number | null } | undefined): number | null {
  return d?.valore ?? null;
}
