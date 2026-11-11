// grafici/ — builder PURI delle opzioni ECharts dei report del finanziario (UI v2), uno per report, sulle primitive del
// kit (shared/lib/grafici). Ogni builder restituisce le opzioni oppure il motivo per cui il grafico non si disegna, la
// tabella equivalente (sempre) e le voci omesse: un importo assente non diventa mai uno zero, si omette e si dichiara.
// Deterministici: niente orologio ne' casualita'. Per il drill-down i dati per intervento portano il codice.
export type * from '../dto';
export { PAGAMENTI_LORDI, PAGAMENTI_LORDI_BREVE, PAGATO_LORDO_SULLA_DOTAZIONE, graficoAvanzamento, graficoDotazionePagamenti, graficoFamiglie } from './spesa';
export type { RigaDotazionePagato } from './spesa';
export { VOCI_DOMANDE_SIGC, graficoDomandeSigc, graficoImportiSigc } from './sigc';
export { ANNUALITA_DOMANDE, COLONNE_IMPORTI_PER_ANNO, IMPORTI_PER_ANNO, TITOLO_ANNO_DI_RACCOLTA, TITOLO_SENZA_AMMESSO, graficoDomandePerAnno, graficoImportiPerAnno } from './domande';
export { SOTTOTITOLO_GAUGE_PAGAMENTI, TITOLO_GAUGE_PAGAMENTI, graficoPagatoNetto, graficoPartiImporto, graficoQuotaFeasr, graficoSankey, sottotitoloFlusso } from './avanzamento';
export { graficoBarreIntervento, sottotitoloBarreIntervento, vociIntervento } from './intervento';
export { graficoUtilizzoRiserva, letturaUtilizzoRiserva } from './riserva';
