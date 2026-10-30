// api/index.ts — confine api/ della feature procedurale (green-fe step3): wrapper React Query sopra il client orval
// sigillato della slice procedurale. Letture: TX-0024 (valori dei filtri e ultimo dato sincronizzato), TX-0025 (valori
// del filtro sullo stato area programmazione), TX-0026 (domande ammesse), TX-0027 e TX-0028 (stati delle domande di
// sostegno e di pagamento), TX-0029 (riepilogo), TX-0031 e TX-0032 (sottofasi di ammissibilita'), TX-0020 (determine di una
// domanda, dal fisico col riallineamento degli ambiti del 29/10/2026; le Unit Amount, TX-0030, sono del fisico); gli hook
// generati portano l'operationId TX-00NN. I valori dei filtri vengono dalla slice stessa (TX-0024, TX-0025): la decisione
// G2 (TX-0060 dell'elenco) non riguarda il procedurale. I componenti importano da qui, mai dal generato.
// - Query-key: quelle delle factory generate (dentro gli hook orval). Nessuna mutation: i file CSV e XLSX dei report
//   (D-10 del backend procedurale) sono funzioni che restituiscono il file, come nel finanziario, nel fisico e
//   nell'istituzionale; l'esito lo mostra chi le chiama.
// - Errori: nessun onError qui. I componenti li rendono con getErrorMessage (problem-type del backend); il 400
//   DATO_NON_VALIDO di un file oltre il limite dell'export si riconosce sul problem-type con messaggioOltreIlLimite del
//   kit, mai sul solo status; per TX-0020 il 404 NOT_FOUND (nessuna domanda con quel codice fra quelle che il profilo
//   puo' consultare: inesistente o, per il P4, fuori dal perimetro ADA, con lo stesso corpo) e il 400 DATO_NON_VALIDO
//   (codice senza cifre) si riconoscono sul problem-type. Il perimetro della risposta (REGIONALE o ADA) e' nel DTO.
// - Parametri: i cinque filtri ripetibili dei report (intervento, os, og, op, stato; mai `azione`, uscito dal contratto
//   con D-01 Rev. 1); TX-0020 ha il solo codice a barre nel percorso. Il mutator li serializza ripetuti e mette in coda le
//   letture oltre il tetto per utente, nella stessa coda delle altre aree (app/tetti-letture, SC-PC_CAPACITA).
// - Retry: nessuna opzione qui; la politica (rete assente e 503 con Retry-After) e' del QueryClient (app/query-client.ts).
import { keepPreviousData } from '@tanstack/react-query';
import { eProblema } from '../../../shared/api/problem/e-problema';
import {
  getApiProceduraleDomandeAmmesseFormato,
  getApiProceduraleRiepilogoFormato,
  getApiProceduraleSottofasiPagamentoFormato,
  getApiProceduraleSottofasiSostegnoFormato,
  getApiProceduraleStatiPagamentoFormato,
  getApiProceduraleStatiSostegnoFormato,
  useTx0020,
  useTx0024,
  useTx0025,
  useTx0026,
  useTx0027,
  useTx0028,
  useTx0029,
  useTx0031,
  useTx0032,
} from '../../../shared/api/generated/procedurale/procedurale/procedurale';
import type { Tx0026Params } from '../../../shared/api/generated/procedurale/aRSCSRBootstrapPostgresAPI.schemas';

export type {
  AltroStato,
  DeterminaCorrente,
  DeterminaDellaDomanda,
  DetermineDomanda,
  DistribuzioneStati,
  DomandeAmmesse,
  DomandeAmmesseRiga,
  DomandeAmmesseTotale,
  FiltriProcedurali,
  RiepilogoProcedurale,
  RiepilogoProceduraleRiga,
  RiepilogoProceduraleTotale,
  SottofaseCensita,
  SottofaseVoce,
  SottofasiAmmissibilita,
  StatiAreaProgrammazione,
  StatiDomande,
  StatiDomandeRiga,
  StatoAreaProgrammazione,
  VoceStato,
} from '../../../shared/api/generated/procedurale/aRSCSRBootstrapPostgresAPI.schemas';

/**
 * Criteri dei report per domanda (TX-0026..TX-0029, TX-0031, TX-0032): i cinque filtri ripetibili, gli stessi parametri
 * in tutte le letture e nei loro export (ui/contratto.ts lo verifica a compilazione).
 */
export type CriteriReport = Tx0026Params;

/**
 * `abilitato` falso: nessuna lettura (senza il grant della transazione, o una scheda del dettaglio non ancora aperta).
 * `mantieniDati`: durante la lettura coi criteri nuovi restano i dati di prima (placeholderData, come nel dettaglio
 * dell'istituzionale): il dettaglio dell'intervento non torna allo scheletro quando cambia lo stato area programmazione.
 */
interface Opzioni {
  abilitato?: boolean;
  mantieniDati?: boolean;
}

const lettura = ({ abilitato = true, mantieniDati = false }: Opzioni) => ({ query: { enabled: abilitato, ...(mantieniDati ? { placeholderData: keepPreviousData } : {}) } });

// TX-0024 (RF024): interventi senza AT001, OS, OG, OP e ultimiDatiSincronizzati (NFR-25 b, D-01 Rev. 2): una lettura
// per pagina, nella coda comune delle letture come i report (il backend la conta nel tetto, SC-PC_CAPACITA) e registrata
// in audit senza parametri (SC-PC_AUDIT); fuori dal tetto e dall'audit e' solo l'ultimo dato sincronizzato (D-01 Rev. 2).
// La stessa cache per pannello, pill e descrizioni.
export const useValoriFiltri = (abilitato = true) => useTx0024(lettura({ abilitato }));

// TX-0025 (RF025): le dieci voci di RF025, gli stati osservati e la voce senza stato, con le chiavi da rimandare in ?stato=.
export const useStatiAreaProgrammazione = (abilitato = true) => useTx0025(lettura({ abilitato }));

// TX-0026 (RF026): domande ammesse, con atto di concessione, importi e interventi attivati per intervento, coi totali.
export const useDomandeAmmesse = (criteri: CriteriReport, opzioni: Opzioni = {}) => useTx0026(criteri, lettura(opzioni));

// TX-0027 (RF027): gli undici stati della domanda di sostegno per intervento e in totale, col di cui non rilasciate.
export const useStatiSostegno = (criteri: CriteriReport, opzioni: Opzioni = {}) => useTx0027(criteri, lettura(opzioni));

// TX-0028 (RF028): i cinque stati della domanda di pagamento CSR-DP per intervento e in totale.
export const useStatiPagamento = (criteri: CriteriReport, opzioni: Opzioni = {}) => useTx0028(criteri, lettura(opzioni));

// TX-0029 (RF029): il riepilogo per intervento di tutte le misure procedurali (ammesse, area programmazione, stati DS e DP).
export const useRiepilogo = (criteri: CriteriReport, opzioni: Opzioni = {}) => useTx0029(criteri, lettura(opzioni));

// TX-0031 e TX-0032 (RF031, RF032): le sottofasi di ammissibilita' di SR-01 con l'anagrafica e le domande per sottofase.
export const useSottofasiSostegno = (criteri: CriteriReport, opzioni: Opzioni = {}) => useTx0031(criteri, lettura(opzioni));
export const useSottofasiPagamento = (criteri: CriteriReport, opzioni: Opzioni = {}) => useTx0032(criteri, lettura(opzioni));

// TX-0020 (RF020): codice e data delle determine da cui la domanda prende le informazioni. Il codice arriva dal percorso
// della pagina gia' ridotto e convalidato da chi chiama (lib/determine); null = nessuna lettura (pagina senza codice o
// codice non valido). Il segmento entra nell'URL codificato, come la scheda dell'elenco (review v1 A-01 del fisico): un
// indirizzo costruito ad arte non porta la richiesta verso un altro endpoint.
export const useDetermine = (codice: string | null) => useTx0020(codice === null ? '' : encodeURIComponent(codice), { query: { enabled: codice !== null } });

/**
 * Vero se l'errore di TX-0020 e' il 404 NOT_FOUND (problem-type, non il solo status): nessuna domanda con quel codice fra
 * quelle che il profilo puo' consultare. Il backend non distingue la domanda inesistente da quella fuori dal perimetro ADA
 * del P4 (stesso corpo), e nemmeno la pagina.
 */
export function rispostaDomandaAssente(errore: unknown): boolean {
  return eProblema(errore, 'not-found');
}

/** Vero se l'errore e' il 400 DATO_NON_VALIDO (problem-type): il codice a barre di TX-0020. */
export function rispostaDatoNonValido(errore: unknown): boolean {
  return eProblema(errore, 'invalid-data');
}

// Esportazioni (D-10 del backend procedurale, D-08 di nfr-conformance): GET /api/procedurale/<report>/{formato}, il file
// CSV o XLSX lo scrive il backend con gli stessi criteri della lettura, l'intestazione (titolo della TX, fonte, filtri,
// perimetro, tipo di domanda, ultimo dato sincronizzato per flusso, uso interno) e la registrazione in
// AUDIT_ESPORTAZIONE (SC-PC_ESPORTA). Per il riepilogo in CSV e' lo stesso indirizzo storico /riepilogo/csv. Oltre 5.000
// righe o 50.000 celle risponde 400 DATO_NON_VALIDO (il mutator rilegge il corpo JSON del Blob d'errore).
export type FormatoEsportazione = 'csv' | 'xlsx';

/** I report per domanda che hanno un export, con la transazione che lo scrive. */
export type ReportProcedurale = 'domandeAmmesse' | 'statiSostegno' | 'statiPagamento' | 'riepilogo' | 'sottofasiSostegno' | 'sottofasiPagamento';

const ESPORTA: Readonly<Record<ReportProcedurale, (formato: FormatoEsportazione, criteri: CriteriReport) => Promise<Blob>>> = {
  domandeAmmesse: getApiProceduraleDomandeAmmesseFormato,
  statiSostegno: getApiProceduraleStatiSostegnoFormato,
  statiPagamento: getApiProceduraleStatiPagamentoFormato,
  riepilogo: getApiProceduraleRiepilogoFormato,
  sottofasiSostegno: getApiProceduraleSottofasiSostegnoFormato,
  sottofasiPagamento: getApiProceduraleSottofasiPagamentoFormato,
};

/** Il file del report coi criteri della lettura (TX-0026..TX-0029, TX-0031, TX-0032). */
export const esportaReport = (report: ReportProcedurale, formato: FormatoEsportazione, criteri: CriteriReport): Promise<Blob> => ESPORTA[report](formato, criteri);
