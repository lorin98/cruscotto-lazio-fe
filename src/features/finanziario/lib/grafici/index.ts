// grafici/ — builder PURI delle opzioni ECharts dei report del finanziario (UI v2), uno per report, sulle primitive del
// kit (shared/lib/grafici). Ogni builder restituisce le opzioni oppure il motivo per cui il grafico non si disegna, la
// tabella equivalente (sempre) e le voci omesse: un importo assente non diventa mai uno zero, si omette e si dichiara.
// Deterministici: niente orologio ne' casualita'. Per il drill-down i dati per intervento portano il codice.
export type * from '../dto';
export { PAGAMENTI_LORDI, PAGAMENTI_LORDI_BREVE, PAGATO_LORDO_SULLA_DOTAZIONE, graficoAvanzamento, graficoContributo, graficoDotazionePagamenti, graficoFamiglie } from './spesa';
export type { RigaDotazionePagato } from './spesa';
export { VOCI_DOMANDE_SIGC, graficoCascataSigc, graficoDomandeSigc, graficoSmp } from './sigc';
export { ANNUALITA_DOMANDE, graficoDomandePerAnno, graficoImportiPerAnno } from './domande';
export { graficoGauge, graficoPagatoNetto, graficoPartiImporto, graficoQuotaFeasr, graficoSankey, sottotitoloFlusso } from './avanzamento';
export { graficoCascataIntervento, vociIntervento } from './intervento';
export { graficoUtilizzoRiserva } from './riserva';
