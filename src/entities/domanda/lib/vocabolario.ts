// vocabolario.ts — il vocabolario della domanda condiviso dalle feature (finanziario ed elenco operativo): i codici sono il
// contratto dei link e dei filtri dell'elenco operativo (parametri annualita', pagamento e anno di TX-0056), le etichette
// sono quelle mostrate. Una sola fonte: le feature non riscrivono codici ne' etichette.

/** Annualita' della domanda (TX-0008, parametro annualita' dell'elenco). */
export type Annualita = 'PRIMA' | 'ALTRE' | 'NON_CLASSIFICATE';

export const ETICHETTE_ANNUALITA: Readonly<Record<Annualita, string>> = {
  PRIMA: 'Prima annualità',
  ALTRE: 'Altre annualità',
  NON_CLASSIFICATE: 'Non classificate',
};

/** Esito del pagamento della domanda (TX-0012, parametro pagamento dell'elenco). */
export type EsitoPagamentoDomanda = 'PAGATA' | 'DA_PAGARE' | 'SENZA_IMPORTI';

export const ETICHETTE_ESITO_PAGAMENTO: Readonly<Record<EsitoPagamentoDomanda, string>> = {
  PAGATA: 'Pagate',
  DA_PAGARE: 'Da pagare',
  SENZA_IMPORTI: 'Senza importi',
};

/** Valore del parametro anno per le domande senza anno di raccolta. */
export const ANNO_SENZA = 'SENZA';

/**
 * Le domande senza anno di raccolta (D-09 del backend: ne' campagna ne' anno di rilascio). Un solo concetto, due forme
 * dichiarate: `breve` per i chip e le opzioni dei filtri, `esteso` nelle descrizioni e nelle tabelle dei report.
 */
export const ANNO_ASSENTE = { breve: 'Senza anno', esteso: 'senza anno di raccolta' } as const;

/** Tipo della domanda (SOSTEGNO, PAGAMENTO): "Sostegno", "Pagamento"; un codice nuovo resta il codice. */
export const ETICHETTE_TIPO_DOMANDA: Readonly<Record<string, string>> = { SOSTEGNO: 'Sostegno', PAGAMENTO: 'Pagamento' };

export function etichettaTipoDomanda(tipo: string | null | undefined): string {
  return tipo ? (ETICHETTE_TIPO_DOMANDA[tipo] ?? tipo) : '';
}
