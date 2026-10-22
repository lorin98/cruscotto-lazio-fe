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
} from './lib/elenco';
export type { DestinazioneElenco, EsitoRigaElenco } from './lib/elenco';
export { ApriNellElenco } from './ui/ApriNellElenco';
