// esportazioni.ts — i file CSV e XLSX dei report procedurali (D-10 del backend): li scrive il backend con gli stessi
// criteri della lettura (GET /api/procedurale/<report>/{formato}, X-Requested-With dal mutator), l'intestazione di NFR-50
// e la registrazione in AUDIT_ESPORTAZIONE (SC-PC_ESPORTA). Il file di una card o di una tabella e' l'export dell'intero
// report (tutte le righe e le colonne: scelta 7 approvata), qualunque sia la ricerca o la scelta delle colonne. Il nome
// del file viene dal titolo e dalla transazione. Oltre il limite dell'export sincrono il backend risponde 400
// DATO_NON_VALIDO: il messaggio per esteso e' quello comune del kit.
import { messaggioOltreIlLimite, scaricamentiDalBackend } from '../../../shared/ui';
import type { Scaricamento } from '../../../shared/ui';
import { esportaReport, esportaUnitAmount } from '../api';
import type { ReportProcedurale } from '../api';
import { criteriDelReport, criteriUnitAmount } from '../lib/criteri';
import type { CriteriProcedurali } from '../lib/criteri';

const TRANSAZIONE: Readonly<Record<ReportProcedurale, string>> = {
  domandeAmmesse: 'TX-0026',
  statiSostegno: 'TX-0027',
  statiPagamento: 'TX-0028',
  riepilogo: 'TX-0029',
  sottofasiSostegno: 'TX-0031',
  sottofasiPagamento: 'TX-0032',
};

/** Cosa sono CSV e XLSX di una card nei nomi dei pulsanti (il PNG resta "il grafico <titolo>": oggettoDati del kit). */
export const OGGETTO_FILE: Readonly<Record<ReportProcedurale | 'unitAmount', string>> = {
  domandeAmmesse: 'i dati delle domande ammesse',
  statiSostegno: 'i dati degli stati delle domande di sostegno',
  statiPagamento: 'i dati degli stati delle domande di pagamento',
  riepilogo: 'i dati del riepilogo per intervento',
  sottofasiSostegno: 'i dati delle sottofasi delle domande di sostegno',
  sottofasiPagamento: 'i dati delle sottofasi delle domande di pagamento',
  unitAmount: 'i dati delle Unit Amount',
};

/** CSV e XLSX di un report coi criteri della pagina, come "<titolo>-tx-00nn.csv". */
export function fileReport(report: ReportProcedurale, titolo: string, criteri: CriteriProcedurali): Scaricamento[] {
  return scaricamentiDalBackend({ base: `${titolo} ${TRANSAZIONE[report]}`, esporta: (formato) => esportaReport(report, formato, criteriDelReport(criteri)), messaggioErrore: messaggioOltreIlLimite });
}

/** CSV e XLSX di TX-0030 coi soli intervento e obiettivi della pagina (mai lo stato), come "<titolo>-tx-0030.csv". */
export function fileUnitAmount(titolo: string, criteri: CriteriProcedurali): Scaricamento[] {
  return scaricamentiDalBackend({ base: `${titolo} TX-0030`, esporta: (formato) => esportaUnitAmount(formato, criteriUnitAmount(criteri)), messaggioErrore: messaggioOltreIlLimite });
}
