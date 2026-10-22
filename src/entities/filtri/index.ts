// entities/filtri — public API (barrel): i filtri sulle dimensioni del programma (intervento, OS, OG, OP, azione portante)
// comuni ai report del finanziario, del fisico e dell'istituzionale (lib nell'indirizzo, regola dell'azione senza legame
// e bozza del pannello, gruppi del pannello, pannello con le voci di TX-0060), e i valori dei filtri letti da TX-0060
// dell'elenco operativo, condivisi dalle feature che ne compongono il pannello (elenco operativo, fisico, istituzionale).
export { useValoriFiltri } from './api';
export type { ValoriFiltriElenco, VoceFiltro } from './api';
export {
  AZIONE_NON_APPLICATA,
  CHIAVI_FILTRO,
  ETICHETTE_FILTRO,
  MAX_VALORI_FILTRO,
  descrizioneIntervento,
  filtriAttivi,
  filtriDaRicerca,
  filtriNellaBarra,
  ricercaDaFiltri,
  senzaAzioneSeNonDisponibile,
  senzaValore,
  valoreFiltroValido,
  vociDelPannello,
} from './lib/programma';
export type { ChiaveFiltro, Filtri, FiltroAttivo, FiltroNellaBarra, ValoriProgramma } from './lib/programma';
export { GruppiProgramma } from './ui/GruppiProgramma';
export { PannelloFiltriProgramma } from './ui/PannelloFiltriProgramma';
export type { PropsPannelloProgramma } from './ui/PannelloFiltriProgramma';
export { useBozzaFiltri, useFiltriProgrammaNellIndirizzo } from './ui/useFiltriProgrammaNellIndirizzo';
export type { LetturaValoriFiltri, ParametriFiltriNellIndirizzo } from './ui/useFiltriProgrammaNellIndirizzo';
