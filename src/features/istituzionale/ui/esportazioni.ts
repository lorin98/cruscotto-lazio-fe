// esportazioni.ts — i file CSV e XLSX dei due report istituzionali (D-07 del backend): li scrive il backend con gli
// stessi criteri della lettura (GET /api/istituzionale/<report>/{formato}, X-Requested-With dal mutator), l'intestazione di
// NFR-50 e la registrazione in AUDIT_ESPORTAZIONE (SC-IS_ESPORTA); contengono tutti gli interventi dei filtri e tutte le
// colonne (TX-0016) o tutte e tre le misure per anno e gli importi unitari (TX-0017), qualunque sia la ricerca, la misura
// o le colonne mostrate. Il nome del file viene dal titolo e dalla transazione. Oltre il limite dell'export sincrono il
// backend risponde 400 DATO_NON_VALIDO: il messaggio per esteso e' quello comune del kit.
import { messaggioOltreIlLimite, scaricamentiDalBackend } from '../../../shared/ui';
import type { Scaricamento } from '../../../shared/ui';
import { esportaOutputRegionale, esportaVerificaSmpNonSigc } from '../api';
import type { CriteriOutput, CriteriVerifica } from '../api';

/** La nota sotto gli strumenti delle tabelle: i file non applicano la ricerca ne' la scelta delle colonne o della misura. */
export const NOTA_FILE_VERIFICA = 'I file CSV e XLSX contengono tutti gli interventi dei filtri e tutte le 21 colonne, non solo quelli trovati dalla ricerca o le colonne scelte.';
export const NOTA_FILE_OUTPUT =
  'I file CSV e XLSX contengono tutti gli interventi dei filtri, non solo quelli trovati dalla ricerca, e tutte e tre le misure per anno qualunque sia quella mostrata, più gli importi unitari per Unit Amount.';

/** CSV e XLSX di TX-0016 coi criteri dati, come "<titolo>-tx-0016.csv". */
export function fileVerifica(titolo: string, criteri: CriteriVerifica): Scaricamento[] {
  return scaricamentiDalBackend({ base: `${titolo} TX-0016`, esporta: (formato) => esportaVerificaSmpNonSigc(formato, criteri), messaggioErrore: messaggioOltreIlLimite });
}

/** CSV e XLSX di TX-0017 coi criteri dati, come "<titolo>-tx-0017.csv". */
export function fileOutput(titolo: string, criteri: CriteriOutput): Scaricamento[] {
  return scaricamentiDalBackend({ base: `${titolo} TX-0017`, esporta: (formato) => esportaOutputRegionale(formato, criteri), messaggioErrore: messaggioOltreIlLimite });
}
