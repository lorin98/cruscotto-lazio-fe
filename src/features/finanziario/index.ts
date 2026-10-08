// features/finanziario — public API (barrel): le pagine e il widget di impaginazione compongono solo da qui.
export { FiltriForm } from './ui/FiltriForm';
export { FiltriAttivi } from './ui/FiltriAttivi';
export { UltimoAggiornamento } from './ui/UltimoAggiornamento';
export { RiepilogoReport } from './ui/RiepilogoReport';
export { DotazioneReport } from './ui/DotazioneReport';
export { AvanzamentoReport } from './ui/AvanzamentoReport';
export { DomandeReport } from './ui/DomandeReport';
export { SigcReport } from './ui/SigcReport';
export { RiservaReport } from './ui/RiservaReport';
export { VerificaSmpReport } from './ui/VerificaSmpReport';
export { useAnnoNellIndirizzo } from './ui/useAnnoNellIndirizzo';
export { filtriDaRicerca, ricercaDaFiltri } from './lib/filtri';
export type { Filtri } from './lib/filtri';
export { PAGINA_FILTRI, REPORT_FINANZIARIO, daPer, reportVisibili, ritornoValido, titoloH1, voceDi } from './lib/report';
export type { VoceReport } from './lib/report';
