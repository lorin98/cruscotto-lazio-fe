// scaricamenti.ts — i file CSV e XLSX scritti dal backend per una card o una tabella (D-08 di nfr-conformance: stessi
// criteri della consultazione, intestazione, registrazione in AUDIT_ESPORTAZIONE), come li vogliono i PulsantiScarica: un
// pulsante per formato, il file salvato col nome della base (nomeFile) e l'eventuale messaggio d'errore proprio. Prima
// ogni area aveva la sua copia (finanziario, elenco operativo); la base del nome, l'ordine dei formati e la lettura le
// decide chi chiama. Il PNG del grafico lo aggiunge CardGrafico, con lo stesso nome.
import { nomeFile } from '../../lib/nome-file';
import { salvaFile } from '../salva-file';
import type { Scaricamento } from './PulsantiScarica';

export type FormatoDelBackend = 'csv' | 'xlsx';

export function scaricamentiDalBackend({
  base,
  esporta,
  formati = ['csv', 'xlsx'],
  messaggioErrore,
}: {
  /** Base del nome del file (es. "Riepilogo per intervento TX-0011"): "riepilogo-per-intervento-tx-0011.csv". */
  base: string;
  esporta: (formato: FormatoDelBackend) => Promise<Blob>;
  /** Ordine dei pulsanti (es. l'XLSX prima, dove tiene gli zeri iniziali dei codici). */
  formati?: readonly FormatoDelBackend[];
  messaggioErrore?: (errore: unknown) => string | null;
}): Scaricamento[] {
  return formati.map((formato) => {
    const file = nomeFile(base, formato);
    return {
      formato: formato === 'csv' ? 'CSV' : 'XLSX',
      file,
      scarica: async () => salvaFile(await esporta(formato), file),
      ...(messaggioErrore ? { messaggioErrore } : {}),
    };
  });
}
