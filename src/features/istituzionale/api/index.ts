// api/index.ts — confine api/ della feature istituzionale (green-fe step3): wrapper React Query sopra il client orval
// sigillato della slice istituzionale (TX-0016 verifica SMP non SIGC, TX-0017 output regionale programmato e realizzato:
// letture; gli hook generati portano l'operationId TX-00NN) e, per i soli valori del pannello dei filtri e la descrizione
// dell'intervento, TX-0060 dell'elenco operativo (decisione G2 dell'utente del 21/10/2026), letta da entities/filtri con la
// stessa query-key dell'elenco e del fisico. I componenti importano da qui, mai dal generato.
// - Query-key: quelle delle factory generate (dentro gli hook orval). Nessuna mutation: i file CSV e XLSX dei due report
//   (D-07 del backend istituzionale, D-08 di nfr-conformance) sono funzioni che restituiscono il file, come nel finanziario
//   e nel fisico; l'esito lo mostra chi le chiama.
// - Errori: nessun onError qui. I componenti li rendono con getErrorMessage (problem-type del backend); il 400
//   DATO_NON_VALIDO (filtro o anno non validi, file oltre il limite dell'export) si riconosce sul problem-type, mai sul
//   solo status: per il file oltre il limite con messaggioOltreIlLimite del kit (nessun predicato della feature).
// - Parametri: i cinque filtri ripetibili dei report (intervento, os, og, op, azione) e, per TX-0016, l'anno di
//   riferimento del file (uno solo, facoltativo: assente = l'ultimo anno con un file); il mutator li serializza ripetuti e
//   mette in coda le letture oltre il tetto per utente, nella stessa coda delle altre aree (app/tetti-letture,
//   SC-IS_CAPACITA).
// - Retry: nessuna opzione qui; la politica (rete assente e 503 con Retry-After) e' del QueryClient (app/query-client.ts).
import { keepPreviousData } from '@tanstack/react-query';
import {
  getApiIstituzionaleOutputRegionaleFormato,
  getApiIstituzionaleVerificaSmpNonSigcFormato,
  useTx0016,
  useTx0017,
} from '../../../shared/api/generated/istituzionale/istituzionale/istituzionale';
import type { Tx0016Params, Tx0017Params } from '../../../shared/api/generated/istituzionale/aRSCSRBootstrapPostgresAPI.schemas';

export type {
  Conteggio,
  Data,
  ImportoIstituzionale,
  ImportoUnitarioUnitAmount,
  MonitoraggioOutput,
  MonitoraggioOutputAnno,
  MonitoraggioOutputRiga,
  Problema,
  Quantita,
  SiNo,
  TestoIstituzionale,
  UltimoDatoSincronizzato,
  VerificaSmpNonSigc,
  VerificaSmpNonSigcRiga,
} from '../../../shared/api/generated/istituzionale/aRSCSRBootstrapPostgresAPI.schemas';

// TX-0060 (RA006, decisione G2): i valori del pannello dei filtri e la descrizione dell'intervento, la lettura comune
// dell'elenco operativo. Chi la usa la abilita col grant csr.tx-0060.read (gate di UX).
export { useValoriFiltri } from '../../../entities/filtri';
export type { ValoriFiltriElenco, VoceFiltro } from '../../../entities/filtri';

/** Criteri di TX-0016: i cinque filtri ripetibili e l'anno di riferimento del file (assente = l'ultimo con un file). */
export type CriteriVerifica = Tx0016Params;
/** Criteri di TX-0017: i cinque filtri ripetibili (il periodo lo decide il backend). */
export type CriteriOutput = Tx0017Params;

/** `abilitato` falso: nessuna lettura (es. finche' non si sa se il filtro per azione si applica, o senza il grant). */
interface Opzioni {
  abilitato?: boolean;
}

// TX-0016 (RF016): i dati non SIGC dei file ASR per intervento, da confrontare con SMP, con l'ultimo dato sincronizzato.
// Una lettura per pagina coi criteri dell'indirizzo; il dettaglio dell'intervento la fa col solo intervento della route e,
// con `mantieniDati`, durante la lettura di un altro anno tiene i dati di prima (placeholderData, come gli elenchi
// dell'elenco operativo): la scheda col selettore d'anno resta montata e il focus resta sul suo "Mostra".
export const useVerificaSmpNonSigc = (criteri: CriteriVerifica, { abilitato = true, mantieniDati = false }: Opzioni & { mantieniDati?: boolean } = {}) =>
  useTx0016(criteri, { query: { enabled: abilitato, ...(mantieniDati ? { placeholderData: keepPreviousData } : {}) } });

// TX-0017 (RF017): l'output regionale programmato e realizzato per intervento e anno del periodo, con gli importi
// unitari per Unit Amount e l'ultimo dato sincronizzato.
export const useOutputRegionale = (criteri: CriteriOutput, { abilitato = true }: Opzioni = {}) => useTx0017(criteri, { query: { enabled: abilitato } });

// Esportazioni (D-07 del backend istituzionale, D-08 di nfr-conformance): il file CSV o XLSX lo scrive il backend, con
// gli stessi criteri della lettura, l'intestazione (fonte, filtri, anno di riferimento o periodo, perimetro, data,
// profili, ultimo dato sincronizzato per flusso, uso interno) e la registrazione in AUDIT_ESPORTAZIONE (SC-IS_ESPORTA).
// Oltre 5.000 righe o 50.000 celle risponde 400 DATO_NON_VALIDO (il mutator rilegge il corpo JSON del Blob d'errore).
export type FormatoEsportazione = 'csv' | 'xlsx';
/** TX-0016 in CSV o XLSX: una riga per intervento con i ventuno dati e i motivi delle assenze. */
export const esportaVerificaSmpNonSigc = (formato: FormatoEsportazione, criteri: CriteriVerifica): Promise<Blob> => getApiIstituzionaleVerificaSmpNonSigcFormato(formato, criteri);
/** TX-0017 in CSV o XLSX: per intervento una riga per anno con le tre misure e una per Unit Amount. */
export const esportaOutputRegionale = (formato: FormatoEsportazione, criteri: CriteriOutput): Promise<Blob> => getApiIstituzionaleOutputRegionaleFormato(formato, criteri);
