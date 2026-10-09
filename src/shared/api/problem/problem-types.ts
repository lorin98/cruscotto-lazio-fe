// problem-types.ts — mapping RFC 9457 lato FE.
// Regola cardine (auth-runtime-pattern.md §1, "Mapping errori RFC 9457"): si discrimina sul campo
// `type` (urn:cruscottocsr:problem:*), MAI sul solo codice HTTP. 403 e 409 sono multi-significato: il codice non basta.

export interface ProblemDetail {
  type: string;
  title?: string;
  status?: number;
  detail?: string;
  instance?: string;
  errorCode?: string;
}

// Namespace del contratto sigillato del backend ARSCSR (schema Problema delle spec: type = PREFISSO + errorCode in
// minuscolo con i trattini, es. urn:cruscottocsr:problem:accesso-negato), al posto del namespace urn:problema del
// pattern green-be. Le voci sono i codici che la spec dichiara (descrizioni delle risposte 400/403/404/409/429/503)
// piu' i quattro della concorrenza del pattern green-be, per le scritture future. Ogni altro problem-type ricade su
// `unknown` by design (fail-safe). Il 501 (non-portabile) NON ha un URI dedicato: si discrimina per STATUS, come 401/419.
const PREFISSO = 'urn:cruscottocsr:problem:';
export const PROBLEM_TYPES = {
  ACCESSO_NEGATO: `${PREFISSO}accesso-negato`,
  RICHIESTA_NON_AMMESSA: `${PREFISSO}richiesta-non-ammessa`,
  DATO_NON_VALIDO: `${PREFISSO}dato-non-valido`,
  NON_TROVATO: `${PREFISSO}not-found`,
  VINCOLO_VIOLATO: `${PREFISSO}vincolo-violato`,
  TROPPE_RICHIESTE: `${PREFISSO}troppe-richieste`,
  CAPACITA_ESAURITA: `${PREFISSO}capacita-esaurita`,
  TEMPO_SCADUTO: `${PREFISSO}tempo-scaduto`,
  ESPORTAZIONE_NON_REGISTRATA: `${PREFISSO}esportazione-non-registrata`,
  // 412: optimistic lock (If-Match/version-column), CONFLICT_VERSION_MISMATCH — la PRIMA voce del
  // DomainErrorMapping di green-be. Distinto dai 409 di concorrenza (stale/lock).
  PRECONDIZIONE_FALLITA: `${PREFISSO}precondizione-fallita`,
  VERSIONE_SUPERATA: `${PREFISSO}versione-superata`,
  RISORSA_OCCUPATA: `${PREFISSO}risorsa-occupata`,
  STATO_NON_MODIFICABILE: `${PREFISSO}stato-non-modificabile`,
} as const;

export type ProblemKind =
  | 'session-expired'
  | 'access-denied'
  | 'request-not-allowed'
  | 'invalid-data'
  | 'not-found'
  | 'constraint-violated'
  | 'too-many-requests'
  | 'capacity-exhausted'
  | 'timeout'
  | 'export-not-registered'
  | 'precondition-failed'
  | 'version-conflict'
  | 'resource-locked'
  | 'state-not-modifiable'
  | 'not-portable'
  | 'unknown';

export interface ClassifiedProblem {
  kind: ProblemKind;
  status: number;
  problem?: ProblemDetail;
}

// Un problem+json e' un oggetto JSON con `type` stringa. Un Blob (corpo d'errore di una richiesta responseType 'blob',
// es. l'esportazione CSV) ha anch'esso `.type` stringa (il MIME): va escluso, o un errore verrebbe classificato a caso.
function isProblemDetail(x: unknown): x is ProblemDetail {
  if (typeof x !== 'object' || x === null) return false;
  if (typeof Blob !== 'undefined' && x instanceof Blob) return false;
  return typeof (x as ProblemDetail).type === 'string';
}

const PER_TIPO: Record<string, ProblemKind> = {
  [PROBLEM_TYPES.ACCESSO_NEGATO]: 'access-denied',
  [PROBLEM_TYPES.RICHIESTA_NON_AMMESSA]: 'request-not-allowed',
  [PROBLEM_TYPES.DATO_NON_VALIDO]: 'invalid-data',
  [PROBLEM_TYPES.NON_TROVATO]: 'not-found',
  [PROBLEM_TYPES.VINCOLO_VIOLATO]: 'constraint-violated',
  [PROBLEM_TYPES.TROPPE_RICHIESTE]: 'too-many-requests',
  [PROBLEM_TYPES.CAPACITA_ESAURITA]: 'capacity-exhausted',
  [PROBLEM_TYPES.TEMPO_SCADUTO]: 'timeout',
  [PROBLEM_TYPES.ESPORTAZIONE_NON_REGISTRATA]: 'export-not-registered',
  [PROBLEM_TYPES.PRECONDIZIONE_FALLITA]: 'precondition-failed',
  [PROBLEM_TYPES.VERSIONE_SUPERATA]: 'version-conflict',
  [PROBLEM_TYPES.RISORSA_OCCUPATA]: 'resource-locked',
  [PROBLEM_TYPES.STATO_NON_MODIFICABILE]: 'state-not-modifiable',
};

// Ordine: prima i casi discriminati per STATUS (401/419 sessione, 501 non-portabile: green-be NON emette
// un problem-type URI per questi), poi il problem-type URI (`urn:cruscottocsr:problem:*`) per tutto il
// resto — MAI dedurre 403/409 dal solo codice HTTP (sono multi-significato). Vedi auth-runtime-pattern.md §1.
export function classifyProblem(status: number, body?: unknown): ClassifiedProblem {
  const problem = isProblemDetail(body) ? body : undefined;
  // Sessione: 401/419 non portano un problem-type di dominio; e' flusso di login.
  if (status === 401 || status === 419) {
    return { kind: 'session-expired', status };
  }
  // 501: operazione non-portabile su un db_target. green-be NON emette un problem-type URI dedicato
  // -> si discrimina per STATUS (come la sessione), mai da .type.
  if (status === 501) {
    return { kind: 'not-portable', status, problem };
  }
  const kind = (problem && Object.prototype.hasOwnProperty.call(PER_TIPO, problem.type) && PER_TIPO[problem.type]) || 'unknown';
  return { kind, status, problem };
}
