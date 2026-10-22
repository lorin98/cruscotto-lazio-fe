// api/index.ts — confine api/ della feature fisico (green-fe step3): wrapper React Query sopra il client orval sigillato
// della slice fisico (TX-0018 superfici ammissibili, TX-0020 determine di una domanda: letture; gli hook generati portano
// l'operationId TX-00NN) e, per i soli valori del pannello dei filtri delle superfici, TX-0060 dell'elenco operativo
// (decisione G2 dell'utente del 21/10/2026), letta da entities/filtri con la stessa query-key dell'elenco. I componenti
// importano da qui, mai dal generato.
// - Query-key: quelle delle factory generate (dentro gli hook orval). Nessuna mutation: i file CSV e XLSX di TX-0018 (D-06
//   del backend fisico) sono una funzione che restituisce il file, come nel finanziario; l'esito lo mostra chi la chiama.
// - Errori: nessun onError qui. I componenti li rendono con getErrorMessage (problem-type del backend); per TX-0020 il 404
//   NOT_FOUND (nessuna domanda con quel codice) e il 400 DATO_NON_VALIDO (codice senza cifre) si riconoscono sul
//   problem-type, mai sul solo status.
// - Parametri: i cinque filtri ripetibili dei report (intervento, os, og, op, azione) e la campagna (un solo anno, D-04 del
//   backend); il mutator li serializza ripetuti e mette in coda le letture oltre il tetto per utente, nella stessa coda
//   del finanziario e dell'elenco (app/tetti-letture, SC-FS_CAPACITA).
// - Retry: nessuna opzione qui; la politica (rete assente e 503 con Retry-After) e' del QueryClient (app/query-client.ts).
import { eProblema } from '../../../shared/api/problem/e-problema';
import { getApiFisicoSuperficieAmmissibileFormato, useTx0018, useTx0020 } from '../../../shared/api/generated/fisico/fisico/fisico';
import type { Tx0018Params } from '../../../shared/api/generated/fisico/aRSCSRBootstrapPostgresAPI.schemas';

export type {
  DeterminaCorrente,
  DeterminaDellaDomanda,
  DetermineDomanda,
  Problema,
  QuantitaRichiestaPremio,
  SuperficieAmmissibile,
  SuperficieCampagna,
  SuperficieIntervento,
  UltimoDatoSincronizzato,
} from '../../../shared/api/generated/fisico/aRSCSRBootstrapPostgresAPI.schemas';

// TX-0060 (RA006, decisione G2): i valori del pannello dei filtri, la lettura comune dell'elenco operativo. Chi la usa la
// abilita col grant csr.tx-0060.read (gate di UX).
export { useValoriFiltri } from '../../../entities/filtri';
export type { ValoriFiltriElenco, VoceFiltro } from '../../../entities/filtri';

/** Criteri di TX-0018: i cinque filtri ripetibili e la campagna (assente = tutte le campagne presenti). */
export type CriteriSuperfici = Tx0018Params;

// TX-0018 (RF018): superficie ammissibile DS e DP per intervento e campagna, con l'ultimo dato sincronizzato. Una lettura
// per pagina, coi criteri dell'indirizzo; `abilitato` falso: nessuna lettura (es. finche' non si sa se il filtro per
// azione si applica).
export const useSuperfici = (criteri: CriteriSuperfici, { abilitato = true }: { abilitato?: boolean } = {}) => useTx0018(criteri, { query: { enabled: abilitato } });

// TX-0020 (RF020): codice e data delle determine da cui la domanda prende le informazioni. Il codice arriva dal percorso
// della pagina gia' ridotto e convalidato da chi chiama (lib/determine); null = nessuna lettura (pagina senza codice o
// codice non valido). Il segmento entra nell'URL codificato, come la scheda dell'elenco (review v1 A-01): un indirizzo
// costruito ad arte non porta la richiesta verso un altro endpoint.
export const useDetermine = (codice: string | null) => useTx0020(codice === null ? '' : encodeURIComponent(codice), { query: { enabled: codice !== null } });

/** Vero se l'errore di TX-0020 e' il 404 NOT_FOUND (problem-type, non il solo status): nessuna domanda con quel codice. */
export function rispostaDomandaAssente(errore: unknown): boolean {
  return eProblema(errore, 'not-found');
}

/** Vero se l'errore e' il 400 DATO_NON_VALIDO (problem-type): il codice a barre di TX-0020, o un file oltre il limite. */
export function rispostaDatoNonValido(errore: unknown): boolean {
  return eProblema(errore, 'invalid-data');
}

// Esportazioni (D-06 del backend fisico, D-08 di nfr-conformance): il file CSV o XLSX lo scrive il backend, con gli stessi
// criteri della lettura, l'intestazione (fonte, filtri, perimetro, data, profili, ultimo dato sincronizzato per flusso,
// uso interno) e la registrazione in AUDIT_ESPORTAZIONE; una riga per intervento e campagna, nessun totale. Oltre 5.000
// righe o 50.000 celle risponde 400 DATO_NON_VALIDO (il mutator rilegge il corpo JSON del Blob d'errore).
export type FormatoEsportazione = 'csv' | 'xlsx';
export const esportaSuperfici = (formato: FormatoEsportazione, criteri: CriteriSuperfici): Promise<Blob> => getApiFisicoSuperficieAmmissibileFormato(formato, criteri);
