// viste.ts — viste per ambito dell'elenco delle domande (D-1 di MIN-20261012, OP-EO-02), PURO: cambiano le colonne della
// tabella, gli indicatori e i grafici del sinottico, mai le righe (stessi criteri, stesso insieme). La vista non e' un
// parametro del contratto: resta nel browser e un link condiviso apre la vista generale.

export type IdVista = 'generale' | 'finanziario' | 'procedurale' | 'fisico' | 'istituzionale';

/** Colonne della tabella delle domande (campi di DomandaElenco, con l'atto di concessione in una colonna sola). */
export type ColonnaDomanda =
  | 'codiceABarre'
  | 'tipo'
  | 'cuaa'
  | 'denominazione'
  | 'codiceIntervento'
  | 'annoRaccolta'
  | 'primaAnnualita'
  | 'sigc'
  | 'statoDescrizione'
  | 'statoProgrammazione'
  | 'attoConcessione'
  | 'anomalie'
  | 'provincia'
  | 'enteDelegato'
  | 'richiesto'
  | 'ammesso'
  | 'pagato'
  | 'ancoraDaPagare'
  | 'liquidato'
  | 'recuperato'
  | 'superficieSostegno'
  | 'superficiePagamento';

/** Indicatori del sinottico (campi di SinotticoElenco). */
export type Indicatore =
  | 'domande'
  | 'presentate'
  | 'beneficiari'
  | 'esitiPagamento'
  | 'richiesto'
  | 'ammesso'
  | 'pagato'
  | 'ancoraDaPagare'
  | 'liquidato'
  | 'recuperato'
  | 'quotaPagata';

/** Grafici del sinottico (ripartizioni di SinotticoElenco). */
export type GraficoSinottico = 'perStato' | 'perIntervento' | 'perAnno';

export interface Vista {
  id: IdVista;
  etichetta: string;
  colonne: readonly ColonnaDomanda[];
  indicatori: readonly Indicatore[];
  grafici: readonly GraficoSinottico[];
}

/** Le cinque viste del wireframe approvato (flusso domande), nell'ordine delle schede. */
export const VISTE: readonly Vista[] = [
  {
    id: 'generale',
    etichetta: 'Generale',
    colonne: ['codiceABarre', 'tipo', 'cuaa', 'denominazione', 'codiceIntervento', 'annoRaccolta', 'statoDescrizione', 'provincia', 'richiesto', 'ammesso', 'pagato'],
    indicatori: ['domande', 'presentate', 'beneficiari', 'esitiPagamento', 'richiesto', 'ammesso', 'pagato', 'ancoraDaPagare'],
    grafici: ['perStato', 'perIntervento'],
  },
  {
    id: 'finanziario',
    etichetta: 'Finanziario',
    colonne: ['codiceABarre', 'denominazione', 'codiceIntervento', 'annoRaccolta', 'primaAnnualita', 'sigc', 'richiesto', 'ammesso', 'pagato', 'ancoraDaPagare', 'liquidato', 'recuperato'],
    indicatori: ['richiesto', 'ammesso', 'pagato', 'ancoraDaPagare', 'liquidato', 'recuperato', 'quotaPagata'],
    grafici: ['perAnno'],
  },
  {
    id: 'procedurale',
    etichetta: 'Procedurale',
    colonne: ['codiceABarre', 'tipo', 'denominazione', 'codiceIntervento', 'statoDescrizione', 'statoProgrammazione', 'attoConcessione', 'anomalie', 'enteDelegato'],
    indicatori: ['domande', 'presentate', 'beneficiari'],
    grafici: ['perStato'],
  },
  {
    id: 'fisico',
    etichetta: 'Fisico',
    colonne: ['codiceABarre', 'denominazione', 'codiceIntervento', 'annoRaccolta', 'superficieSostegno', 'superficiePagamento'],
    indicatori: ['domande', 'beneficiari'],
    grafici: [],
  },
  {
    id: 'istituzionale',
    etichetta: 'Istituzionale',
    colonne: ['codiceABarre', 'tipo', 'denominazione', 'codiceIntervento', 'annoRaccolta', 'primaAnnualita', 'provincia', 'enteDelegato'],
    indicatori: ['domande', 'presentate', 'beneficiari'],
    grafici: ['perIntervento'],
  },
];

/** La vista con quell'id, altrimenti la generale (un valore sconosciuto non rompe la pagina). */
export function vistaDi(id: string | null | undefined): Vista {
  return VISTE.find((v) => v.id === id) ?? VISTE[0];
}

/** Campo dell'ordinamento lato server per ogni colonna ordinabile delle domande (D-04); le altre non si ordinano. */
export const ORDINAMENTO_COLONNA: Partial<Record<ColonnaDomanda, string>> = {
  codiceABarre: 'codiceABarre',
  tipo: 'tipo',
  cuaa: 'cuaa',
  denominazione: 'denominazione',
  codiceIntervento: 'intervento',
  annoRaccolta: 'anno',
  statoDescrizione: 'stato',
  provincia: 'provincia',
  enteDelegato: 'ente',
  richiesto: 'richiesto',
  ammesso: 'ammesso',
  pagato: 'pagato',
  ancoraDaPagare: 'ancoraDaPagare',
  liquidato: 'liquidato',
};

/** Colonne dei pagamenti (campi di PagamentoElenco): visibili di partenza e a scelta dal bottone "Colonne". */
export type ColonnaPagamento =
  | 'decreto'
  | 'dataAutorizzazione'
  | 'codiceABarre'
  | 'cuaa'
  | 'denominazione'
  | 'codiceIntervento'
  | 'esito'
  | 'importoDecretato'
  | 'importoPagato'
  | 'protocollo'
  | 'tipologiaElenco'
  | 'tipologiaPagamento'
  | 'tipoDomanda'
  | 'quotaFeasr'
  | 'quotaNazionale'
  | 'quotaRegionale'
  | 'motiviEsclusione';

export const COLONNE_PAGAMENTI_VISIBILI: readonly ColonnaPagamento[] = [
  'decreto',
  'dataAutorizzazione',
  'codiceABarre',
  'cuaa',
  'denominazione',
  'codiceIntervento',
  'esito',
  'importoDecretato',
  'importoPagato',
];
export const COLONNE_PAGAMENTI_A_SCELTA: readonly ColonnaPagamento[] = [
  'protocollo',
  'tipologiaElenco',
  'tipologiaPagamento',
  'tipoDomanda',
  'quotaFeasr',
  'quotaNazionale',
  'quotaRegionale',
  'motiviEsclusione',
];

/** Campo dell'ordinamento lato server per le colonne ordinabili dei pagamenti (D-04). */
export const ORDINAMENTO_COLONNA_PAGAMENTI: Partial<Record<ColonnaPagamento, string>> = {
  decreto: 'decreto',
  dataAutorizzazione: 'dataAutorizzazione',
  codiceABarre: 'codiceABarre',
  denominazione: 'denominazione',
  codiceIntervento: 'intervento',
  importoPagato: 'importoPagato',
  importoDecretato: 'importoDecretato',
};
