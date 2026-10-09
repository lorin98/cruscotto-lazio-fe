// shared/ui — componenti trasversali senza dominio: stati della vista, kit UI v2 (ADR 0027: grafici ECharts, KPI, filtri,
// pannello laterale, tabella interattiva, icone), salvataggio file, focus di pagina.
export { Caricamento, ErroreVista, Vuoto, VistaQuery } from './stati/StatiVista';
export { AvvisoPagina } from './stati/AvvisoPagina';
export type { StatoQuery } from './stati/StatiVista';
export { blobDaDataUrl, salvaFile } from './salva-file';
export { useFocusTitolo } from './focus';
export { Icona } from './icona';
export type { NomeIcona } from './icona';
export { Grafico } from './grafici/Grafico';
export type { AltezzaGrafico, ClicGrafico } from './grafici/Grafico';
export { CardGrafico } from './grafici/CardGrafico';
export type { DatiGrafico, TabellaEquivalente } from '../lib/grafici';
export { Griglia, Sezione } from './card/Sezione';
export { TabellaDati, TabellaRighe, TabellaVoci } from './tabella/TabelleSemplici';
export type { Colonna, Voce } from './tabella/TabelleSemplici';
export { Kpi } from './kpi/Kpi';
export type { TonoKpi } from './kpi/Kpi';
export { BarraFiltri } from './filtri/BarraFiltri';
export type { ChipFiltro } from './filtri/BarraFiltri';
export { PannelloLaterale } from './laterale/PannelloLaterale';
export { TabellaInterattiva } from './tabella/TabellaInterattiva';
export type { ColonnaTabella, RigaPiede } from './tabella/TabellaInterattiva';
