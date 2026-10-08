// shared/ui — componenti trasversali senza dominio: stati della vista, grafici SVG, salvataggio file, focus di pagina.
export { Caricamento, ErroreVista, Vuoto, VistaQuery } from './stati/StatiVista';
export type { StatoQuery } from './stati/StatiVista';
export { GraficoBarre, GraficoCiambella, GraficoLinea } from './grafici/grafici';
export type { Serie } from './grafici/grafici';
export { salvaFile } from './salva-file';
export { NOME_APPLICAZIONE, useFocusTitolo } from './focus';
