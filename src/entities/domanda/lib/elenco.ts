// elenco.ts — il contratto dell'indirizzo dell'elenco operativo, condiviso dalle feature (review v1 H-09): i percorsi delle
// due pagine e della scheda della domanda, i grant delle loro letture principali (VERBATIM dall'authz-catalog) e i codici
// dell'esito di una riga di elenco di liquidazione. Il finanziario ci costruisce i link di drill-down, il fisico il link
// alla scheda della domanda dalle determine, l'elenco operativo le sue pagine e i suoi link: una sola fonte, nessuna copia
// per feature.

export const PERCORSO_ELENCO_DOMANDE = '/elenco-operativo/domande';
export const PERCORSO_ELENCO_PAGAMENTI = '/elenco-operativo/pagamenti';
export type DestinazioneElenco = typeof PERCORSO_ELENCO_DOMANDE | typeof PERCORSO_ELENCO_PAGAMENTI;

/** Grant delle letture dell'elenco operativo (TX-0056..TX-0060), verbatim dal catalogo. */
export const GRANT_ELENCO = {
  domande: 'csr.tx-0056.read',
  sinottico: 'csr.tx-0057.read',
  dettaglio: 'csr.tx-0058.read',
  pagamenti: 'csr.tx-0059.read',
  filtri: 'csr.tx-0060.read',
} as const;

/** Grant che apre ciascuna delle due pagine (visibility della route nel route-manifest). */
export const GRANT_DELLA_PAGINA: Readonly<Record<DestinazioneElenco, string>> = {
  [PERCORSO_ELENCO_DOMANDE]: GRANT_ELENCO.domande,
  [PERCORSO_ELENCO_PAGAMENTI]: GRANT_ELENCO.pagamenti,
};

/** Esito di una riga di elenco di liquidazione (parametro esito di TX-0059). */
export type EsitoRigaElenco = 'PAGATA' | 'ESCLUSA';
export const ETICHETTE_ESITO_RIGA: Readonly<Record<EsitoRigaElenco, string>> = { PAGATA: 'Pagata', ESCLUSA: 'Esclusa' };

/** Tipi della domanda nel percorso della scheda (TX-0058) e nelle risposte (TX-0020: tipoDomanda). */
const TIPI_DOMANDA = new Set(['SOSTEGNO', 'PAGAMENTO']);
const CODICE_A_BARRE = /^\d{1,30}$/;

/** Codice a barre di una domanda come lo vogliono i percorsi del backend: sole cifre, al piu' 30 (TX-0058, TX-0020). */
export function codiceABarreValido(codice: string | null | undefined): codice is string {
  return typeof codice === 'string' && CODICE_A_BARRE.test(codice);
}

/**
 * Tipo e codice a barre utilizzabili come riferimento della scheda (TX-0058): tipo SOSTEGNO o PAGAMENTO, codice di sole
 * cifre (al piu' 30). Vale per i link che l'app costruisce e per i parametri del percorso che arrivano dall'indirizzo:
 * un valore diverso non entra mai nell'URL di una lettura (review v1 A-01: niente '/', '..', '%' nel percorso dell'API).
 */
export function riferimentoDomandaValido(tipo: string | null | undefined, codiceABarre: string | null | undefined): boolean {
  return Boolean(tipo && TIPI_DOMANDA.has(tipo) && codiceABarreValido(codiceABarre));
}

/** La scheda della domanda nell'elenco operativo (/elenco-operativo/domande/:tipo/:codiceABarre); null se tipo o codice
 *  non sono un riferimento valido. */
export function percorsoSchedaDomanda(tipo: string | null | undefined, codiceABarre: string | null | undefined): string | null {
  if (!riferimentoDomandaValido(tipo, codiceABarre)) return null;
  return `${PERCORSO_ELENCO_DOMANDE}/${tipo}/${codiceABarre}`;
}
