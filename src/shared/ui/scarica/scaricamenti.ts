// scaricamenti.ts — i file CSV e XLSX scritti dal backend per una card o una tabella (D-08 di nfr-conformance: stessi
// criteri della consultazione, intestazione, registrazione in AUDIT_ESPORTAZIONE), come li vogliono i PulsantiScarica: un
// pulsante per formato, il file salvato col nome della base (nomeFile) e l'eventuale messaggio d'errore proprio. Prima
// ogni area aveva la sua copia (finanziario, elenco operativo); la base del nome, l'ordine dei formati e la lettura le
// decide chi chiama. Il PNG del grafico lo aggiunge CardGrafico, con lo stesso nome. Poi il messaggio del file oltre il
// limite dell'export sincrono, uguale per le aree che lo dicono per esteso (fisico, istituzionale).
import { eProblema } from '../../api/problem/e-problema';
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

// il limite dell'export sincrono del backend (D-06 del fisico, D-07 dell'istituzionale), col testo dei wireframe approvati
export const OLTRE_IL_LIMITE_DELL_ESPORTAZIONE = "La tabella supera il limite dell'esportazione (5.000 righe o 50.000 celle): restringi i filtri e riprova.";

/**
 * Per `messaggioErrore`: il 400 DATO_NON_VALIDO di un'esportazione (problem-type, mai il solo status) detto per esteso come
 * file oltre il limite; gli altri errori col messaggio del problem-type (null).
 */
export function messaggioOltreIlLimite(errore: unknown): string | null {
  return eProblema(errore, 'invalid-data') ? OLTRE_IL_LIMITE_DELL_ESPORTAZIONE : null;
}
