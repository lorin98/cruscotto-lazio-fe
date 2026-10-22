// entities/filtri — public API (barrel): i filtri sulle dimensioni del programma (intervento, OS, OG, OP, azione portante)
// comuni ai report del finanziario e del fisico, e i valori dei filtri letti da TX-0060 dell'elenco operativo, condivisi
// dalle feature che ne compongono il pannello (elenco operativo, fisico).
export { useValoriFiltri } from './api';
export type { ValoriFiltriElenco, VoceFiltro } from './api';
export {
  AZIONE_NON_APPLICATA,
  CHIAVI_FILTRO,
  ETICHETTE_FILTRO,
  MAX_VALORI_FILTRO,
  filtriAttivi,
  filtriDaRicerca,
  ricercaDaFiltri,
  senzaAzioneSeNonDisponibile,
  senzaValore,
  valoreFiltroValido,
} from './lib/programma';
export type { ChiaveFiltro, Filtri, FiltroAttivo } from './lib/programma';
