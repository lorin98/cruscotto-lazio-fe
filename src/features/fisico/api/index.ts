// api/index.ts — confine api/ della feature fisico (green-fe step3): wrapper React Query sopra il client orval sigillato
// della slice fisico (TX-0018 superfici ammissibili, TX-0017 output regionale programmato e realizzato, TX-0030 pagamenti
// per Unit Amount: letture; gli hook generati portano l'operationId TX-00NN) e, per i soli valori del pannello dei filtri,
// TX-0060 dell'elenco operativo (decisione G2 dell'utente del 21/10/2026), letta da entities/filtri con la stessa
// query-key dell'elenco. Dal riallineamento degli ambiti del 29/10/2026 l'output regionale viene dall'istituzionale e le
// Unit Amount dal procedurale; le determine di una domanda (TX-0020) sono del procedurale. I componenti importano da qui,
// mai dal generato.
// - Query-key: quelle delle factory generate (dentro gli hook orval). Nessuna mutation: i file CSV e XLSX (D-06 del
//   backend fisico) sono funzioni che restituiscono il file, come nel finanziario; l'esito lo mostra chi le chiama.
// - Errori: nessun onError qui. I componenti li rendono con getErrorMessage (problem-type del backend); il 400
//   DATO_NON_VALIDO (file oltre il limite) si riconosce sul problem-type, mai sul solo status.
// - Parametri: i cinque filtri ripetibili dei report (intervento, os, og, op, azione) e, per TX-0018, la campagna (un solo
//   anno, D-04 del backend); il mutator li serializza ripetuti e mette in coda le letture oltre il tetto per utente, nella
//   stessa coda del finanziario e dell'elenco (app/tetti-letture, SC-FS_CAPACITA).
// - Retry: nessuna opzione qui; la politica (rete assente e 503 con Retry-After) e' del QueryClient (app/query-client.ts).
import {
  getApiFisicoOutputRegionaleFormato,
  getApiFisicoSuperficieAmmissibileFormato,
  getApiFisicoUnitAmountFormato,
  useTx0017,
  useTx0018,
  useTx0030,
} from '../../../shared/api/generated/fisico/fisico/fisico';
import type { Tx0017Params, Tx0018Params, Tx0030Params } from '../../../shared/api/generated/fisico/aRSCSRBootstrapPostgresAPI.schemas';

export type {
  Importo,
  ImportoIstituzionale,
  ImportoUnitarioUnitAmount,
  MonitoraggioOutput,
  MonitoraggioOutputAnno,
  MonitoraggioOutputRiga,
  PagamentiUnitAmount,
  PagamentiUnitAmountRiga,
  Problema,
  Quantita,
  QuantitaProcedurale,
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
/** Criteri di TX-0017: i cinque filtri ripetibili (il periodo lo decide il backend). */
export type CriteriOutput = Tx0017Params;
/** Criteri di TX-0030: i filtri del programma (la pagina manda intervento e obiettivi, come nel procedurale). */
export type CriteriUnitAmount = Tx0030Params;

/** `abilitato` falso: nessuna lettura (es. finche' non si sa se il filtro per azione si applica, o senza il grant). */
interface Opzioni {
  abilitato?: boolean;
}

// TX-0018 (RF018): superficie ammissibile DS e DP per intervento e campagna, con l'ultimo dato sincronizzato. Una lettura
// per pagina, coi criteri dell'indirizzo.
export const useSuperfici = (criteri: CriteriSuperfici, { abilitato = true }: Opzioni = {}) => useTx0018(criteri, { query: { enabled: abilitato } });

// TX-0017 (RF017): l'output regionale programmato e realizzato per intervento e anno del periodo, con gli importi
// unitari per Unit Amount e l'ultimo dato sincronizzato.
export const useOutputRegionale = (criteri: CriteriOutput, { abilitato = true }: Opzioni = {}) => useTx0017(criteri, { query: { enabled: abilitato } });

// TX-0030 (RF030): le Unit Amount degli interventi selezionati con il pagato, la percentuale e la base storica.
export const useUnitAmount = (criteri: CriteriUnitAmount, { abilitato = true }: Opzioni = {}) => useTx0030(criteri, { query: { enabled: abilitato } });

// Esportazioni (D-06 del backend fisico, D-08 di nfr-conformance): il file CSV o XLSX lo scrive il backend, con gli stessi
// criteri della lettura, l'intestazione (fonte, filtri, perimetro, data, profili, ultimo dato sincronizzato per flusso,
// uso interno) e la registrazione in AUDIT_ESPORTAZIONE. Oltre 5.000 righe o 50.000 celle risponde 400 DATO_NON_VALIDO
// (il mutator rilegge il corpo JSON del Blob d'errore).
export type FormatoEsportazione = 'csv' | 'xlsx';
/** TX-0018: una riga per intervento e campagna, nessun totale. */
export const esportaSuperfici = (formato: FormatoEsportazione, criteri: CriteriSuperfici): Promise<Blob> => getApiFisicoSuperficieAmmissibileFormato(formato, criteri);
/** TX-0017: per intervento una riga per anno con le tre misure e una per Unit Amount. */
export const esportaOutputRegionale = (formato: FormatoEsportazione, criteri: CriteriOutput): Promise<Blob> => getApiFisicoOutputRegionaleFormato(formato, criteri);
/** TX-0030: una riga per Unit Amount, coi filtri della pagina. */
export const esportaUnitAmount = (formato: FormatoEsportazione, criteri: CriteriUnitAmount): Promise<Blob> => getApiFisicoUnitAmountFormato(formato, criteri);
