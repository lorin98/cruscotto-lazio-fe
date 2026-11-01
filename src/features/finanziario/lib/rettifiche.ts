// rettifiche.ts — regola PURA dell'indicatore delle rettifiche di un intervento (revisioni del 31/10/2026, R08): un solo
// testo per la colonna "Con rettifiche" del riepilogo, la tabella del residuo per intervento e la scheda "Tutte le voci" del
// dettaglio (review H-07: prima tre copie con grafie diverse). conRettifiche null = nessuna rettifica nel database (fonte
// non attiva); false o nessuna riga = "No"; altrimenti quante righe.

/** "Sì: 2 righe", "Sì: 1 riga", "No", oppure "fonte non attiva: rettifiche". */
export function testoRettificato(conRettifiche: boolean | null | undefined, righe: number): string {
  if (conRettifiche == null) return 'fonte non attiva: rettifiche';
  if (!conRettifiche || righe === 0) return 'No';
  return righe === 1 ? 'Sì: 1 riga' : `Sì: ${righe} righe`;
}

/** Vero se ci sono righe di rettifiche da aprire. */
export function conRigheDiRettifiche(conRettifiche: boolean | null | undefined, righe: number): boolean {
  return conRettifiche === true && righe > 0;
}
