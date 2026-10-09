// grafici/ — builder PURI delle opzioni ECharts dei report del finanziario (UI v2), uno per report, sulle primitive del
// kit (shared/lib/grafici). Ogni builder restituisce le opzioni oppure il motivo per cui il grafico non si disegna, la
// tabella equivalente (sempre) e le voci omesse: un importo assente non diventa mai uno zero, si omette e si dichiara.
// Deterministici: niente orologio ne' casualita'. Per il drill-down i dati per intervento portano il codice.
export type * from './dto';
export { avanzamentoPonderato, graficoAvanzamento, graficoContributo, graficoDotazionePagamenti, graficoFamiglie } from './spesa';
export type { Avanzamento, InterventoAvanzamento, RigaDotazionePagato } from './spesa';
export { graficoCascataSigc, graficoImbutoSigc, graficoSmp } from './sigc';
export { graficoDomandePerAnno, graficoImportiPerAnno } from './domande';
export { graficoGauge, graficoPartiImporto, graficoQuotaFeasr, graficoSankey } from './avanzamento';
export { graficoCascataIntervento, vociIntervento } from './intervento';
export { graficoUtilizzoRiserva } from './riserva';
export { assenzaImporto, cellaImporto } from './resa';
