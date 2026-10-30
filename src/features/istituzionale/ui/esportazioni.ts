// esportazioni.ts — i file CSV e XLSX dei due report istituzionali (D-07 del backend): li scrive il backend con gli
// stessi criteri della lettura (GET /api/istituzionale/<report>/{formato}, X-Requested-With dal mutator), l'intestazione di
// NFR-50 e la registrazione in AUDIT_ESPORTAZIONE (SC-IS_ESPORTA); contengono tutti gli interventi dei filtri e tutte le
// colonne (TX-0016) o i venti dati dell'esercizio (TX-0015), qualunque sia la ricerca o le colonne mostrate. Il nome del
// file viene dal titolo e dalla transazione. Oltre il limite dell'export sincrono il backend risponde 400
// DATO_NON_VALIDO: il messaggio per esteso e' quello comune del kit.
import { messaggioOltreIlLimite, scaricamentiDalBackend } from '../../../shared/ui';
import type { Scaricamento } from '../../../shared/ui';
import { esportaVerificaSmpNonSigc, esportaVerificaSmpSigc } from '../api';
import type { CriteriVerifica, CriteriVerificaSigc } from '../api';

/** La nota sotto gli strumenti delle tabelle: i file non applicano la ricerca ne' la scelta delle colonne. */
export const NOTA_FILE_VERIFICA = 'I file CSV e XLSX contengono tutti gli interventi dei filtri e tutte le 21 colonne, non solo quelli trovati dalla ricerca o le colonne scelte.';
/** La nota della tabella della verifica SMP SIGC con la ricerca (come nel finanziario, review v3 X-04). */
export const NOTA_FILE_VERIFICA_SIGC = 'I file CSV e XLSX contengono tutti gli interventi dei filtri, non solo quelli trovati dalla ricerca.';

/** I file di TX-0016 della pagina della verifica nei nomi dei pulsanti, nella card del grafico e nella tabella (low-fi approvato). */
export const OGGETTO_FILE_VERIFICA = 'i dati della verifica SMP non SIGC';

/** CSV e XLSX di TX-0016 coi criteri dati, come "<titolo>-tx-0016.csv". */
export function fileVerifica(titolo: string, criteri: CriteriVerifica): Scaricamento[] {
  return scaricamentiDalBackend({ base: `${titolo} TX-0016`, esporta: (formato) => esportaVerificaSmpNonSigc(formato, criteri), messaggioErrore: messaggioOltreIlLimite });
}

/** CSV e XLSX di TX-0015 coi filtri e l'esercizio, come "<titolo>-tx-0015.csv". */
export function fileVerificaSigc(titolo: string, criteri: CriteriVerificaSigc): Scaricamento[] {
  return scaricamentiDalBackend({ base: `${titolo} TX-0015`, esporta: (formato) => esportaVerificaSmpSigc(formato, criteri), messaggioErrore: messaggioOltreIlLimite });
}
