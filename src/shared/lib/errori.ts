// errori.ts — messaggio d'errore per l'utente (PURO, zero React). Mai String(error)/error.message: il messaggio si
// sceglie dal problem-type (classifyProblem); lo status serve solo dove il backend non manda un problem+json (rete,
// 401/419, risposte senza corpo). Il `detail` del backend si mostra solo per i tipi in cui la spec lo dichiara
// leggibile e senza dati personali (DATO_NON_VALIDO, TEMPO_SCADUTO, ESPORTAZIONE_NON_REGISTRATA), troncato.
import { isAxiosError } from 'axios';
import { classifyProblem } from '../api/problem/problem-types';
import type { ProblemKind } from '../api/problem/problem-types';

const MAX_DETTAGLIO = 200;

function dettaglio(detail: string | undefined): string | undefined {
  const d = detail?.trim();
  if (!d) return undefined;
  return d.length > MAX_DETTAGLIO ? `${d.slice(0, MAX_DETTAGLIO)}…` : d;
}

const MESSAGGI: Partial<Record<ProblemKind, string>> = {
  'session-expired': 'La sessione è scaduta: accedi di nuovo.',
  'access-denied': 'Non hai i permessi per consultare questi dati.',
  'request-not-allowed': 'Richiesta non ammessa dal server.',
  'not-found': 'Dati non trovati.',
  'too-many-requests': 'Troppe richieste in poco tempo: riprova tra qualche secondo.',
  'capacity-exhausted': 'Il servizio è occupato da altre letture: riprova tra qualche secondo.',
};

// Messaggi per status quando la risposta non porta un problem-type riconosciuto.
function perStatus(status: number): string {
  if (status === 403) return 'Richiesta non ammessa dal server.';
  if (status === 404) return 'Dati non trovati.';
  if (status === 429) return MESSAGGI['too-many-requests'] ?? '';
  if (status === 503) return 'Servizio momentaneamente occupato: riprova tra poco.';
  return 'Errore nel recupero dei dati: riprova più tardi.';
}

export function getErrorMessage(errore: unknown): string {
  if (!isAxiosError(errore)) return 'Errore inatteso nella pagina.';
  const status = errore.response?.status;
  if (status === undefined) return 'Il server non risponde: controlla la connessione e riprova.';
  const { kind, problem } = classifyProblem(status, errore.response?.data);
  const d = dettaglio(problem?.detail);
  switch (kind) {
    case 'invalid-data':
      return `Filtri non validi${d ? `: ${d}` : ''}. Modificali e riprova.`;
    case 'timeout':
      return d ? `La lettura ha richiesto troppo tempo: ${d}.` : 'La lettura ha richiesto troppo tempo: restringi i filtri e riprova.';
    case 'export-not-registered':
      return d ? `Esportazione non riuscita: ${d}.` : 'Esportazione non riuscita: riprova tra poco.';
    case 'unknown':
      return perStatus(status);
    default:
      return MESSAGGI[kind] ?? perStatus(status);
  }
}
