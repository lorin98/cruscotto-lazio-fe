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

// Il backend ammette al piu' 2 letture dei report del finanziario in corso per utente
// (cruscottocsr.finanziario.letture-per-utente): oltre risponde 503 CAPACITA_ESAURITA. Le pagine con piu' sezioni ne
// lanciano 3-4 insieme: le GET verso quel prefisso si mettono in coda qui, cosi' il tetto non viene superato. Il tetto e'
// per prefisso del percorso (review step9 H-21): ogni prefisso ha la sua coda, le GET senza un tetto non aspettano. Vale
// il prefisso piu' lungo che combacia. Il posto liberato passa direttamente al primo in coda.
// Il tetto e' dell'utente, non della scheda (review X-02):
//  - fra le schede: il posto i della coda si tiene insieme al lock "cruscotto-csr-letture:<prefisso>:<i>" della Web Locks
//    API, quindi con piu' schede aperte le letture in corso restano al piu' quante il tetto. Senza Web Locks (contesto non
//    sicuro, jsdom dei test) la coda resta per scheda;
//  - una lettura annullata (react-query annulla quelle di una pagina lasciata) non interrompe la richiesta HTTP: il
//    backend la lavorerebbe comunque fino in fondo. Chi l'ha chiesta riceve subito l'annullamento, il posto si libera
//    quando arriva la risposta, o al piu' dopo GUARDIA_DOPO_ANNULLO_MS.
export const LETTURE_IN_PARALLELO = 2;
export const TETTI_LETTURE_PREDEFINITI: Readonly<Record<string, number>> = { '/api/finanziario/': LETTURE_IN_PARALLELO };
export const NOME_LOCK_LETTURE = 'cruscotto-csr-letture';
// oltre la durata massima di un report sul backend: fino a sette letture SQL da 15 s (cruscottocsr.finanziario.query-timeout)
export const GUARDIA_DOPO_ANNULLO_MS = 120_000;

interface Coda {
  prefisso: string;
  /** Posti liberi della scheda: indici da 0 al tetto escluso, ognuno col suo lock fra le schede. */
  liberi: number[];
  inAttesa: ((indice: number) => void)[];
}
let code = new Map<string, Coda>();
let tetti: Record<string, number> = { ...TETTI_LETTURE_PREDEFINITI };

/** Sostituisce i tetti di letture per prefisso (es. quando un'area nuova ha un tetto suo). Le code in corso finiscono. */
export function configuraTettiLetture(nuovi: Record<string, number>): void {
  tetti = { ...nuovi };
  code = new Map();
}

/** Per i test: tetti predefiniti e code vuote. Le letture gia' in coda vengono servite dalle code vecchie. */
export function azzeraCodeLetture(): void {
  configuraTettiLetture(TETTI_LETTURE_PREDEFINITI);
}

function codaPer(url: string): Coda | undefined {
  const prefisso = Object.keys(tetti)
    .filter((p) => url.startsWith(p))
    .sort((a, b) => b.length - a.length)[0];
  if (prefisso === undefined) return undefined;
  let coda = code.get(prefisso);
  if (!coda) {
    // almeno una lettura alla volta: un tetto a zero bloccherebbe per sempre le letture del prefisso
    const tetto = Math.max(1, tetti[prefisso]);
    coda = { prefisso, liberi: Array.from({ length: tetto }, (_, i) => i), inAttesa: [] };
    code.set(prefisso, coda);
  }
  return coda;
}

const annullata = () => new Axios.CanceledError();

// Posto della scheda; se la lettura viene annullata mentre aspetta, esce dalla coda senza partire.
function prendiIndice(coda: Coda, segnale?: AbortSignal): Promise<number> {
  const libero = coda.liberi.shift();
  if (libero !== undefined) return Promise.resolve(libero);
  if (segnale?.aborted) return Promise.reject(annullata());
  return new Promise((ok, ko) => {
    const arriva = (indice: number) => {
      segnale?.removeEventListener('abort', esci);
      ok(indice);
    };
    const esci = () => {
      coda.inAttesa = coda.inAttesa.filter((a) => a !== arriva);
      ko(annullata());
    };
    coda.inAttesa.push(arriva);
    segnale?.addEventListener('abort', esci, { once: true });
  });
}
function lasciaIndice(coda: Coda, indice: number): void {
  const prossimo = coda.inAttesa.shift();
  if (prossimo) prossimo(indice);
  else coda.liberi.push(indice);
}

// Lock fra le schede, tenuto finche' non si chiama la funzione restituita. Senza Web Locks, o se il browser li nega
// (SecurityError in un iframe isolato), nessun lock: resta la coda della scheda.
function prendiLock(nome: string, segnale?: AbortSignal): Promise<() => void> {
  const nessunLock = () => undefined;
  const locks = typeof navigator === 'undefined' ? undefined : navigator.locks;
  if (!locks) return Promise.resolve(nessunLock);
  return new Promise((preso, ko) => {
    locks
      .request(nome, { signal: segnale }, () => new Promise<void>((rilascia) => preso(rilascia)))
      .catch(() => (segnale?.aborted ? ko(annullata()) : preso(nessunLock)));
  });
}

/** Posto della scheda e lock fra le schede; la funzione restituita li libera (una volta sola). */
async function prendiPosto(coda: Coda, segnale?: AbortSignal): Promise<() => void> {
  const indice = await prendiIndice(coda, segnale);
  let rilasciaLock: () => void;
  try {
    rilasciaLock = await prendiLock(`${NOME_LOCK_LETTURE}:${coda.prefisso}:${indice}`, segnale);
  } catch (e) {
    lasciaIndice(coda, indice);
    throw e;
  }
  let libero = false;
  return () => {
    if (libero) return;
    libero = true;
    rilasciaLock();
    lasciaIndice(coda, indice);
  };
}

// Mutator richiamato da OGNI operation generata da orval. `signal` (react-query v5) passa nel config.
export const customInstance = async <T>(config: AxiosRequestConfig, options?: AxiosRequestConfig): Promise<T> => {
  const richiesta = { ...config, ...options };
  const lettura = (richiesta.method ?? 'get').toLowerCase() === 'get';
  const coda = lettura ? codaPer(richiesta.url ?? '') : undefined;
  if (!coda) return AXIOS_INSTANCE(richiesta).then((r) => r.data as T);
  // react-query passa un AbortSignal del DOM; la richiesta HTTP parte senza, per tenere il posto finche' il backend lavora
  const { signal, ...senzaSegnale } = richiesta;
  const segnale = signal as AbortSignal | undefined;
  const rilascia = await prendiPosto(coda, segnale);
  if (segnale?.aborted) {
    rilascia();
    throw annullata();
  }
  const risposta = AXIOS_INSTANCE(senzaSegnale);
  void risposta.then(rilascia, rilascia);
  if (!segnale) return (await risposta).data as T;
  return new Promise<T>((ok, ko) => {
    const annulla = () => {
      ko(annullata());
      const guardia = setTimeout(rilascia, GUARDIA_DOPO_ANNULLO_MS);
      void risposta.then(
        () => clearTimeout(guardia),
        () => clearTimeout(guardia),
      );
    };
    segnale.addEventListener('abort', annulla, { once: true });
    void risposta.then(
      (r) => ok(r.data as T),
      (e: unknown) => ko(e),
    ).finally(() => segnale.removeEventListener('abort', annulla));
  });
};

export type ErrorType<Error> = AxiosError<Error>;
export type BodyType<BodyData> = BodyData;

export default customInstance;
