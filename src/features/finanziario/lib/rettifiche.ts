// rettifiche.ts — regola PURA dell'indicatore delle rettifiche di un intervento (revisioni del 31/10/2026, R08): un solo
// testo per la colonna "Con rettifiche" del riepilogo, la tabella del residuo per intervento e la scheda "Tutte le voci" del
// dettaglio (review H-07: prima tre copie con grafie diverse). conRettifiche null = nessuna rettifica nel database (fonte
// non attiva); false o nessuna riga = "No"; altrimenti quante righe.

/** "Sì: 2 rettifiche", "Sì: 1 rettifica", "No", oppure "fonte non attiva: rettifiche" ("righe" fino al 04/11/2026). */
export function testoRettificato(conRettifiche: boolean | null | undefined, rettifiche: number): string {
  if (conRettifiche == null) return 'fonte non attiva: rettifiche';
  if (!conRettifiche || rettifiche === 0) return 'No';
  return rettifiche === 1 ? 'Sì: 1 rettifica' : `Sì: ${rettifiche} rettifiche`;
}

/** La sezione delle rettifiche senza righe da mostrare: la fonte non attiva o nessuna rettifica. */
export function testoSenzaRighe(conRettifiche: boolean | null | undefined): string {
  return conRettifiche == null ? 'Rettifiche non disponibili: fonte non attiva (rettifiche).' : 'Nessuna rettifica.';
}

/** Le programmazioni delle rettifiche come le legge l'utente: solo quelle del CSR entrano nel netto (review H-07: da ui/). */
export const PROGRAMMAZIONI: Readonly<Record<string, string>> = {
  CSR_2023_2027: 'CSR 2023-2027 (nel netto)',
  TRASCINAMENTI_PSR: 'Trascinamenti PSR (fuori dal netto)',
};

/** Vero se ci sono righe di rettifiche da aprire. */
export function conRigheDiRettifiche(conRettifiche: boolean | null | undefined, righe: number): boolean {
  return conRettifiche === true && righe > 0;
}
