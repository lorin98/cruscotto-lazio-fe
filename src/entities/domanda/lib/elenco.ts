// elenco.ts — il contratto dell'indirizzo dell'elenco operativo, condiviso dalle feature (review v1 H-09): i percorsi delle
// due pagine, i grant delle loro letture principali (VERBATIM dall'authz-catalog) e i codici dell'esito di una riga di
// elenco di liquidazione. Il finanziario ci costruisce i link di drill-down, l'elenco operativo le sue pagine e i suoi
// link: una sola fonte, nessuna copia per feature.

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
