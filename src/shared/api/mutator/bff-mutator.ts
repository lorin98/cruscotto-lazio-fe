// bff-mutator.ts — mutator custom di orval (istanza axios condivisa).
// Modello BFF: session cookie cifrato lato BE; la SPA NON vede ne' conserva un bearer.
// CSRF: il backend ARSCSR difende scritture ed esportazioni con header custom (X-Requested-With) + controllo
// dell'Origin (RegolaOrigine): e' QUESTA la difesa effettiva, coperta da tests/integrazione-be.test.ts. Le opzioni
// xsrf* (double-submit del pattern green-be) restano armate per il contratto della suite, ma con questo backend sono
// inerti: il cookie XSRF-TOKEN non viene emesso, quindi axios non manda X-XSRF-TOKEN.
import Axios from 'axios';
import type { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import { basePath, resolveLoginPath } from '../../config/base-path';

// Evento di sessione scaduta, sostituibile nei test (evita navigazione reale sotto jsdom).
export const authEvents = {
  onSessionExpired(): void {
    if (typeof window !== 'undefined' && window.location) {
      // Anti open-redirect: SOLO base path noto + /auth/login, mai un returnTo del server.
      window.location.assign(resolveLoginPath());
    }
  },
};

export const AXIOS_INSTANCE = Axios.create({
  baseURL: basePath(),
  withCredentials: true, // invia il session cookie del BFF; nessun header Authorization/bearer
  xsrfCookieName: 'XSRF-TOKEN', // contratto della suite (ADR 0013); inerte con ARSCSR, vedi la testata
  xsrfHeaderName: 'X-XSRF-TOKEN',
  // Il backend ARSCSR protegge scritture ed esportazioni con la RegolaOrigine (header custom + Origin ammessa):
  // senza X-Requested-With risponde 403 RICHIESTA_NON_AMMESSA (OP-FE-02). Non e' una credenziale.
  headers: { 'X-Requested-With': 'XMLHttpRequest' },
  // Filtri ripetibili (intervento, os, og, op, azione) come parametri ripetuti: intervento=A&intervento=B. Il formato
  // di default di axios (intervento[]=A) non e' riconosciuto da JAX-RS e il backend lo ignora, rispondendo senza filtro.
  paramsSerializer: { indexes: null },
});

// Testo di un Blob (Blob.text dove c'e', FileReader altrimenti: jsdom dei test).
function testoDi(b: Blob): Promise<string> {
  if (typeof b.text === 'function') return b.text();
  return new Promise((ok, ko) => {
    const r = new FileReader();
    r.onload = () => ok(String(r.result));
    r.onerror = () => ko(r.error);
    r.readAsText(b);
  });
}

// Interceptor di risposta. Non rimuovere "semplificando" il mutator:
// - corpo d'errore di una richiesta responseType 'blob' (esportazione CSV): se e' JSON lo si rilegge come oggetto,
//   altrimenti il problem+json andrebbe perso e l'errore non sarebbe classificato;
// - 401/419 di una chiamata ai dati => login. Il 401 di /auth/status NO: lo gestisce la shell (RequireGrant) come
//   sessione non valida, altrimenti un'identita' che il backend rifiuta farebbe login -> / -> 401 -> login all'infinito.
AXIOS_INSTANCE.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const risposta = error.response;
    if (risposta && typeof Blob !== 'undefined' && risposta.data instanceof Blob && /json/i.test(risposta.data.type)) {
      try {
        risposta.data = JSON.parse(await testoDi(risposta.data));
      } catch {
        // corpo non leggibile: resta il Blob, l'errore sara' classificato per status
      }
    }
    const status = risposta?.status;
    const daStatoSessione = (error.config?.url ?? '').endsWith('/auth/status');
    if ((status === 401 || status === 419) && !daStatoSessione) {
      authEvents.onSessionExpired();
    }
    return Promise.reject(error);
  },
);

// Il backend ammette al piu' 2 letture dei report in corso per utente (cruscottocsr.finanziario.letture-per-utente):
// oltre risponde 503 CAPACITA_ESAURITA. Le pagine con piu' sezioni ne lanciano 3-4 insieme: le GET verso /api si
// mettono in coda qui, cosi' il tetto non viene superato. Il posto passa direttamente al primo in coda.
export const LETTURE_IN_PARALLELO = 2;
let lettureInCorso = 0;
const inAttesa: (() => void)[] = [];
function prendiPosto(): Promise<void> {
  if (lettureInCorso < LETTURE_IN_PARALLELO) {
    lettureInCorso++;
    return Promise.resolve();
  }
  return new Promise((ok) => inAttesa.push(ok));
}
function lasciaPosto(): void {
  const prossimo = inAttesa.shift();
  if (prossimo) prossimo();
  else lettureInCorso--;
}

// Mutator richiamato da OGNI operation generata da orval. `signal` (react-query v5) passa nel config.
export const customInstance = async <T>(config: AxiosRequestConfig, options?: AxiosRequestConfig): Promise<T> => {
  const richiesta = { ...config, ...options };
  const lettura = (richiesta.method ?? 'get').toLowerCase() === 'get' && (richiesta.url ?? '').startsWith('/api/');
  if (!lettura) return AXIOS_INSTANCE(richiesta).then((r) => r.data as T);
  await prendiPosto();
  try {
    return (await AXIOS_INSTANCE(richiesta)).data as T;
  } finally {
    lasciaPosto();
  }
};

export type ErrorType<Error> = AxiosError<Error>;
export type BodyType<BodyData> = BodyData;

export default customInstance;
