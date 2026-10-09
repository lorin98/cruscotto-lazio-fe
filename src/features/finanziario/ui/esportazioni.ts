// esportazioni.ts — i file dei dati di una card o di una tabella (richiesta dell'utente del 09/10/2026): CSV e XLSX del
// report scritti dal backend (D-08 di nfr-conformance: stessi filtri della consultazione, intestazione con fonte e data,
// registrazione in audit), salvati col nome del titolo. Il PNG del grafico lo aggiunge CardGrafico.
import { nomeFile } from '../../../shared/lib';
import { salvaFile } from '../../../shared/ui';
import type { Scaricamento } from '../../../shared/ui';
import { esportaReport } from '../api';
import type { FormatoEsportazione, ReportEsportabile } from '../api';
import type { Filtri } from '../lib/filtri';

/** CSV e XLSX di un export del backend, salvati come "<titolo>.csv" e "<titolo>.xlsx". */
export function scaricamentiDati(titolo: string, esporta: (formato: FormatoEsportazione) => Promise<Blob>): Scaricamento[] {
  return [
    { formato: 'CSV', scarica: async () => salvaFile(await esporta('csv'), nomeFile(titolo, 'csv')) },
    { formato: 'XLSX', scarica: async () => salvaFile(await esporta('xlsx'), nomeFile(titolo, 'xlsx')) },
  ];
}

/** CSV e XLSX di un report (TX-0002..TX-0013) coi filtri della pagina. */
export function datiDelReport(titolo: string, report: ReportEsportabile, filtri: Filtri): Scaricamento[] {
  return scaricamentiDati(titolo, (formato) => esportaReport(report, formato, filtri));
}
