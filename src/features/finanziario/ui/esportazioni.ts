// esportazioni.ts — i file dei dati di una card o di una tabella (richiesta dell'utente del 09/10/2026): CSV e XLSX del
// report scritti dal backend (D-08 di nfr-conformance: stessi filtri della consultazione, intestazione con fonte e data,
// registrazione in audit), salvati col nome del titolo e della transazione: due report con lo stesso titolo non danno
// lo stesso file (review v3 H-06). Il PNG del grafico lo aggiunge CardGrafico, con lo stesso nome.
import { nomeFile } from '../../../shared/lib';
import { salvaFile } from '../../../shared/ui';
import type { Scaricamento } from '../../../shared/ui';
import { esportaReport } from '../api';
import type { FormatoEsportazione, ReportEsportabile } from '../api';
import type { Filtri } from '../lib/filtri';
import { transazioneDi } from '../lib/report';
import type { LetturaConDati } from '../lib/report';

/** CSV e XLSX di un export del backend, salvati come "<titolo>-tx-00nn.csv" e "<titolo>-tx-00nn.xlsx". */
export function scaricamentiDati(titolo: string, lettura: LetturaConDati, esporta: (formato: FormatoEsportazione) => Promise<Blob>): Scaricamento[] {
  const base = `${titolo} ${transazioneDi(lettura)}`;
  return (['csv', 'xlsx'] as const).map((formato) => {
    const file = nomeFile(base, formato);
    return { formato: formato === 'csv' ? 'CSV' : 'XLSX', file, scarica: async () => salvaFile(await esporta(formato), file) };
  });
}

/** CSV e XLSX di un report (TX-0002..TX-0013) coi filtri della pagina. */
export function datiDelReport(titolo: string, report: ReportEsportabile, filtri: Filtri): Scaricamento[] {
  return scaricamentiDati(titolo, report, (formato) => esportaReport(report, formato, filtri));
}
