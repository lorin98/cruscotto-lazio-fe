// features/finanziario — public API (barrel): le pagine, il widget di impaginazione e la shell compongono solo da qui.
export { PannelloFiltri } from './ui/PannelloFiltri';
export { CercaIntervento } from './ui/CercaIntervento';
export { UltimoAggiornamento } from './ui/UltimoAggiornamento';
export { Panoramica } from './ui/Panoramica';
export { DettaglioIntervento } from './ui/DettaglioIntervento';
export { RiepilogoReport } from './ui/RiepilogoReport';
export { DotazioneReport } from './ui/DotazioneReport';
export { AvanzamentoReport } from './ui/AvanzamentoReport';
export { DomandeReport } from './ui/DomandeReport';
export { SigcReport } from './ui/SigcReport';
export { RiservaReport } from './ui/RiservaReport';
export { VerificaSmpReport } from './ui/VerificaSmpReport';
export { useAnnoNellIndirizzo } from './ui/useAnnoNellIndirizzo';
export { CHIAVI_FILTRO, filtriDaRicerca, ricercaDaFiltri } from './lib/filtri';
export type { Filtri } from './lib/filtri';
export {
  DETTAGLIO_INTERVENTO,
  PAGINE_FINANZIARIO,
  PANORAMICA,
  REPORT_FINANZIARIO,
  codiceInterventoValido,
  pagineVisibili,
  percorsoIntervento,
  reportVisibili,
  titoloH1,
  voceDi,
} from './lib/report';
export type { VoceReport } from './lib/report';
