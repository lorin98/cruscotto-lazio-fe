// colonne — colonne delle due tabelle dell'interrogazione (wireframe domande e pagamenti): titolo, resa della cella dai
// formati puri di lib/ (un importo assente dice il motivo, mai zero) e campo dell'ordinamento lato server (D-04). Le viste
// per ambito scelgono quali colonne mostrare (lib/viste), qui solo come si rendono.
import { formatDate, formatNumber } from '../../../shared/lib';
import type { ColonnaServer } from '../../../shared/ui';
import type { DomandaElenco, PagamentoElenco } from '../api';
import { cellaImporto, etichettaEsito, etichettaTipo, siNo, testoAnno, testoAnnualita, testoAtto, testoSuperficie } from '../lib/formato';
import { COLONNE_PAGAMENTI_A_SCELTA, COLONNE_PAGAMENTI_VISIBILI, ORDINAMENTO_COLONNA, ORDINAMENTO_COLONNA_PAGAMENTI } from '../lib/viste';
import type { ColonnaDomanda, ColonnaPagamento } from '../lib/viste';

type Def<T> = Omit<ColonnaServer<T>, 'chiave' | 'ordinamento'>;

const DOMANDE: Record<ColonnaDomanda, Def<DomandaElenco>> = {
  codiceABarre: { titolo: 'Codice a barre', resa: (d) => d.codiceABarre ?? '' },
  tipo: { titolo: 'Tipo', resa: (d) => etichettaTipo(d.tipo) },
  cuaa: { titolo: 'CUAA', resa: (d) => d.cuaa ?? 'non valorizzato' },
  denominazione: { titolo: 'Denominazione', resa: (d) => d.denominazione ?? 'non valorizzata' },
  codiceIntervento: { titolo: 'Intervento', resa: (d) => d.codiceIntervento ?? '' },
  annoRaccolta: { titolo: 'Anno', resa: (d) => testoAnno(d.annoRaccolta) },
  primaAnnualita: { titolo: 'Annualità', resa: (d) => testoAnnualita(d.primaAnnualita) },
  sigc: { titolo: 'SIGC', resa: (d) => siNo(d.sigc) },
  statoDescrizione: { titolo: 'Stato SIAN', resa: (d) => d.statoDescrizione ?? d.statoCodice ?? 'senza stato' },
  statoProgrammazione: { titolo: 'Stato area programmazione', resa: (d) => d.statoProgrammazione ?? 'senza stato' },
  attoConcessione: { titolo: 'Atto di concessione', resa: (d) => testoAtto(d.attoConcessioneNumero, d.attoConcessioneData) },
  anomalie: { titolo: 'Anomalie', numerica: true, resa: (d) => formatNumber(d.anomalie ?? 0) },
  provincia: { titolo: 'Provincia', resa: (d) => d.provincia ?? '' },
  enteDelegato: { titolo: 'Ente delegato', resa: (d) => d.enteDelegato ?? '' },
  richiesto: { titolo: 'Richiesto', numerica: true, resa: (d) => cellaImporto(d.richiesto) },
  ammesso: { titolo: 'Ammesso', numerica: true, resa: (d) => cellaImporto(d.ammesso) },
  pagato: { titolo: 'Pagato', numerica: true, resa: (d) => cellaImporto(d.pagato) },
  ancoraDaPagare: { titolo: 'Ancora da pagare', numerica: true, resa: (d) => cellaImporto(d.ancoraDaPagare) },
  liquidato: { titolo: 'Liquidato', numerica: true, resa: (d) => cellaImporto(d.liquidato) },
  recuperato: { titolo: 'Recuperato', numerica: true, resa: (d) => cellaImporto(d.recuperato) },
  superficieSostegno: { titolo: 'Superficie di sostegno', numerica: true, resa: (d) => testoSuperficie(d.superficieSostegno) },
  superficiePagamento: { titolo: 'Superficie di pagamento', numerica: true, resa: (d) => testoSuperficie(d.superficiePagamento) },
};

/** Colonne della vista per ambito, nell'ordine della vista; la prima e' l'intestazione di riga. */
export function colonneDomande(chiavi: readonly ColonnaDomanda[]): ColonnaServer<DomandaElenco>[] {
  return chiavi.map((chiave) => ({ chiave, ordinamento: ORDINAMENTO_COLONNA[chiave], ...DOMANDE[chiave] }));
}

const PAGAMENTI: Record<ColonnaPagamento, Def<PagamentoElenco>> = {
  decreto: { titolo: 'Decreto', resa: (p) => p.decreto ?? '' },
  dataAutorizzazione: { titolo: 'Data di autorizzazione', resa: (p) => formatDate(p.dataAutorizzazione) },
  codiceABarre: { titolo: 'Codice a barre', resa: (p) => p.codiceABarre ?? '' },
  cuaa: { titolo: 'CUAA', resa: (p) => p.cuaa ?? 'non valorizzato' },
  denominazione: { titolo: 'Denominazione', resa: (p) => p.denominazione ?? 'non valorizzata' },
  codiceIntervento: { titolo: 'Intervento', resa: (p) => p.codiceIntervento ?? '' },
  esito: { titolo: 'Esito', resa: (p) => etichettaEsito(p.esito, p.domandaCorrente !== false) },
  importoDecretato: { titolo: 'Decretato', numerica: true, resa: (p) => cellaImporto(p.importoDecretato) },
  importoPagato: { titolo: 'Pagato', numerica: true, resa: (p) => cellaImporto(p.importoPagato) },
  protocollo: { titolo: 'Protocollo', resa: (p) => p.protocollo ?? '' },
  tipologiaElenco: { titolo: 'Tipologia di elenco', resa: (p) => p.tipologiaElenco ?? '' },
  tipologiaPagamento: { titolo: 'Tipologia di pagamento', resa: (p) => p.tipologiaPagamento ?? '' },
  tipoDomanda: { titolo: 'Tipo di domanda', resa: (p) => etichettaTipo(p.tipoDomanda) },
  quotaFeasr: { titolo: 'Quota FEASR', numerica: true, resa: (p) => cellaImporto(p.quotaFeasr) },
  quotaNazionale: { titolo: 'Quota nazionale', numerica: true, resa: (p) => cellaImporto(p.quotaNazionale) },
  quotaRegionale: { titolo: 'Quota regionale', numerica: true, resa: (p) => cellaImporto(p.quotaRegionale) },
  motiviEsclusione: { titolo: 'Motivi di esclusione', resa: (p) => (p.motiviEsclusione ?? []).join(', ') },
};

/** Colonne dei pagamenti: quelle visibili di partenza (la prima fissa) e quelle a scelta dal bottone "Colonne". */
export function colonnePagamenti(): ColonnaServer<PagamentoElenco>[] {
  const visibili = COLONNE_PAGAMENTI_VISIBILI.map((chiave, k) => ({ chiave, ordinamento: ORDINAMENTO_COLONNA_PAGAMENTI[chiave], ...PAGAMENTI[chiave], ...(k === 0 ? { fissa: true } : { nascosta: false }) }));
  const aScelta = COLONNE_PAGAMENTI_A_SCELTA.map((chiave) => ({ chiave, ordinamento: ORDINAMENTO_COLONNA_PAGAMENTI[chiave], ...PAGAMENTI[chiave], nascosta: true }));
  return [...visibili, ...aScelta];
}
