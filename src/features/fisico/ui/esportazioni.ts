// esportazioni.ts — i file CSV e XLSX del fisico (D-06 del backend fisico): li scrive il backend con gli stessi criteri
// della lettura (GET /api/fisico/<report>/{formato}, X-Requested-With dal mutator), l'intestazione di D-08 e la
// registrazione in AUDIT_ESPORTAZIONE: per le superfici una riga per intervento e campagna, nessun totale; per l'output
// regionale tutte e tre le misure per anno e gli importi unitari; per le Unit Amount una riga per Unit Amount (le due pagine
// dal 29/10/2026). Il nome del file viene dal titolo della card e dalla transazione (due card non danno lo stesso file).
// Oltre 5.000 righe o 50.000 celle il backend risponde 400 DATO_NON_VALIDO: il messaggio invita a restringere i filtri
// (wireframe superfici, stato d'errore), col testo comune del kit (lo stesso dell'istituzionale).
import { messaggioOltreIlLimite, scaricamentiDalBackend } from '../../../shared/ui';
import type { Scaricamento } from '../../../shared/ui';
import { esportaOutputRegionale, esportaSuperfici, esportaUnitAmount } from '../api';
import type { CriteriOutput, CriteriSuperfici, CriteriUnitAmount } from '../api';

/** CSV e XLSX di TX-0018 coi criteri dati (quelli della pagina, o con la campagna della card), come "<titolo>-tx-0018.csv". */
export function scaricamentiSuperfici(titolo: string, criteri: CriteriSuperfici): Scaricamento[] {
  return scaricamentiDalBackend({ base: `${titolo} TX-0018`, esporta: (formato) => esportaSuperfici(formato, criteri), messaggioErrore: messaggioOltreIlLimite });
}

/** La nota sotto la tabella dell'output: i file non applicano la ricerca ne' la misura mostrata. */
export const NOTA_FILE_OUTPUT =
  'I file CSV e XLSX contengono tutti gli interventi dei filtri, non solo quelli trovati dalla ricerca, e tutte e tre le misure per anno qualunque sia quella mostrata, più gli importi unitari per Unit Amount.';

/** CSV e XLSX di TX-0017 coi criteri dati, come "<titolo>-tx-0017.csv". */
export function fileOutput(titolo: string, criteri: CriteriOutput): Scaricamento[] {
  return scaricamentiDalBackend({ base: `${titolo} TX-0017`, esporta: (formato) => esportaOutputRegionale(formato, criteri), messaggioErrore: messaggioOltreIlLimite });
}

/** I file di TX-0030 nei nomi dei pulsanti della card del grafico. */
export const OGGETTO_FILE_UNIT_AMOUNT = 'i dati delle Unit Amount';

/** CSV e XLSX di TX-0030 coi filtri della pagina, come "<titolo>-tx-0030.csv". */
export function fileUnitAmount(titolo: string, criteri: CriteriUnitAmount): Scaricamento[] {
  return scaricamentiDalBackend({ base: `${titolo} TX-0030`, esporta: (formato) => esportaUnitAmount(formato, criteri), messaggioErrore: messaggioOltreIlLimite });
}
