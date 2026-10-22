// esportazioni.ts — i file CSV e XLSX delle superfici (D-06 del backend fisico): li scrive il backend con gli stessi criteri
// della lettura (GET /api/fisico/superficie-ammissibile/{formato}, X-Requested-With dal mutator), l'intestazione di D-08 e
// la registrazione in AUDIT_ESPORTAZIONE; una riga per intervento e campagna, nessun totale. Il nome del file viene dal
// titolo della card e dalla transazione (due card non danno lo stesso file). Oltre 5.000 righe o 50.000 celle il backend
// risponde 400 DATO_NON_VALIDO: il messaggio invita a restringere i filtri (wireframe superfici, stato d'errore), col testo
// comune del kit (lo stesso dell'istituzionale).
import { messaggioOltreIlLimite, scaricamentiDalBackend } from '../../../shared/ui';
import type { Scaricamento } from '../../../shared/ui';
import { esportaSuperfici } from '../api';
import type { CriteriSuperfici } from '../api';

/** CSV e XLSX di TX-0018 coi criteri dati (quelli della pagina, o con la campagna della card), come "<titolo>-tx-0018.csv". */
export function scaricamentiSuperfici(titolo: string, criteri: CriteriSuperfici): Scaricamento[] {
  return scaricamentiDalBackend({ base: `${titolo} TX-0018`, esporta: (formato) => esportaSuperfici(formato, criteri), messaggioErrore: messaggioOltreIlLimite });
}
