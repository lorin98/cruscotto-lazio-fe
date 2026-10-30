// entities/domanda — public API (barrel): vocabolario della domanda e contratto dell'indirizzo dell'elenco operativo
// (pagine, scheda della domanda, codice a barre) e il link di drill-down verso l'elenco, condivisi dalle feature.
export { ANNO_ASSENTE, ANNO_SENZA, ETICHETTE_ANNUALITA, ETICHETTE_ESITO_PAGAMENTO, ETICHETTE_TIPO_DOMANDA, etichettaTipoDomanda } from './lib/vocabolario';
export type { Annualita, EsitoPagamentoDomanda } from './lib/vocabolario';
export {
  ETICHETTE_ESITO_RIGA,
  GRANT_DELLA_PAGINA,
  GRANT_ELENCO,
  PERCORSO_ELENCO_DOMANDE,
  PERCORSO_ELENCO_PAGAMENTI,
  codiceABarreValido,
  percorsoSchedaDomanda,
  riferimentoDomandaValido,
  tipoDomandaValido,
} from './lib/elenco';
export type { DestinazioneElenco, EsitoRigaElenco, TipoDellaDomanda } from './lib/elenco';
// il contratto dell'indirizzo delle determine di una domanda (procedurale, TX-0020): il link della scheda dell'elenco e il
// suo state (il tipo della scheda di partenza, decisione D1 del 30/10/2026)
export {
  GRANT_DETERMINE_DELLA_DOMANDA,
  PERCORSO_DETERMINE_DELLA_DOMANDA,
  arrivoDallaScheda,
  percorsoDetermineDellaDomanda,
  tipoDellaSchedaDiPartenza,
} from './lib/determine';
export type { ArrivoDallaScheda } from './lib/determine';
export { ApriNellElenco } from './ui/ApriNellElenco';
