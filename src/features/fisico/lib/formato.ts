// formato.ts — testi PURI del fisico (zero React): superfici in ettari con due decimali e il segno meno scritto (D-01 Rev.
// 2: una DS negativa del file ASR2-20 entra col suo segno), differenze col segno, assenze dette con la resa unica
// dell'entity importo (mai uno zero), etichette dei campi di TX-0018. I testi sono quelli dei wireframe approvati.
import { descriviAssenza, testoConNota } from '../../../entities/importo';
import type { DatoMotivatoLike } from '../../../entities/importo';
import { formatEttari, formatNumber, formatPercentuale } from '../../../shared/lib';

/** "15,50 ha", "-1,00 ha". */
export function testoSuperficie(v: number): string {
  return `${formatEttari(v)} ha`;
}

/** Differenza DP - DS col segno: "+0,70 ha", "-0,50 ha", "0,00 ha". */
export function testoDifferenza(v: number): string {
  return `${formatEttari(v, { segno: true })} ha`;
}

/** La cella numerica di una superficie (senza unita': l'intestazione della colonna dice "ha"). */
export function cellaSuperficie(v: number): string {
  return formatEttari(v);
}

/** La cella di una differenza (senza unita'), col segno. */
export function cellaDifferenza(v: number): string {
  return formatEttari(v, { segno: true });
}

/**
 * Quantita' richiesta a premio (OP-FIS-04): il valore, oppure la sua assenza con la resa unica delle assenze (oggi sempre
 * "non disponibile (fonte quantità richiesta a premio non attiva)", D-02 del backend).
 */
export function testoQuantitaPremio(q: DatoMotivatoLike<number> | null | undefined): string {
  if (q?.valore != null) return formatNumber(q.valore);
  return testoConNota(descriviAssenza(q));
}

/** Motivo di una riga senza superfici (NON_VALORIZZATO): intervento non a superficie o non SIGC (D-01 del backend). */
export const SENZA_SUPERFICI = 'nessuna superficie in nessuna campagna (non valorizzato: intervento non a superficie o non SIGC)';

/** "nessuna superficie nella campagna 2025" per un intervento che ha superfici solo in altre campagne. */
export function testoNonInCampagna(anno: number): string {
  return `nessuna superficie nella campagna ${anno}`;
}

/** "su 3 domande di pagamento: 33,3 %", oppure "nessuna domanda di pagamento" (la quota non si calcola). */
export function testoQuotaOltreDs(pagamento: number, quota: number | null): string {
  if (quota === null) return 'nessuna domanda di pagamento';
  return `su ${formatNumber(pagamento)} ${pagamento === 1 ? 'domanda' : 'domande'} di pagamento: ${formatPercentuale(quota)}`;
}

/** Etichette dei campi di TX-0018: le stesse in tabella, KPI, anteprima e tabelle equivalenti dei grafici. */
export const ETICHETTE = {
  intervento: 'Intervento',
  campagna: 'Campagna',
  domandePagamento: 'Domande di pagamento',
  domandeSostegno: 'Domande di sostegno',
  superficieDs: 'Superficie DS (ha)',
  superficieDp: 'Superficie DP (ha)',
  differenzaDpDs: 'Differenza DP - DS (ha)',
  domandeDpOltreDs: 'Domande con DP oltre la DS',
  sostegniDiscordanti: 'Sostegni con DS discordanti',
  quantitaRichiestaPremio: "Quantità richiesta a premio",
} as const;
