// bff-mutator.ts — mutator custom di orval (istanza axios condivisa).
// Modello BFF: session cookie cifrato lato BE; la SPA NON vede ne' conserva un bearer.
// CSRF: il backend ARSCSR difende scritture ed esportazioni con header custom (X-Requested-With) + controllo
// dell'Origin (RegolaOrigine): e' QUESTA la difesa effettiva, coperta da tests/integrazione-be.test.ts. Le opzioni
// xsrf* (double-submit del pattern green-be) restano armate per il contratto della suite, ma con questo backend sono
// inerti: il cookie XSRF-TOKEN non viene emesso, quindi axios non manda X-XSRF-TOKEN.
import Axios, { AxiosError } from 'axios';
import type { AxiosRequestConfig, AxiosResponse } from 'axios';
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

// Il backend ammette al piu' LETTURE_IN_PARALLELO letture dei report in corso per utente
// (cruscottocsr.finanziario.letture-per-utente): oltre risponde 503 CAPACITA_ESAURITA. Le pagine con piu' sezioni ne
// lanciano 3-4 insieme: le GET verso un prefisso con un tetto si mettono in coda qui, cosi' il tetto non viene superato.
// Il tetto e' per prefisso del percorso (review step9 H-21): ogni prefisso ha la sua coda, le GET senza un tetto non
// aspettano. Vale il prefisso piu' lungo che combacia. Il posto liberato passa direttamente al primo in coda. Il mutator
// condiviso non ha tetti predefiniti: li configura l'app all'avvio (app/tetti-letture.ts, chiamato da main.tsx).
// Il tetto e' dell'utente, non della scheda (review X-02):
//  - fra le schede: ogni lettura in corso tiene uno dei lock "cruscotto-csr-letture:<prefisso>:<i>" della Web Locks API
//    (i da 0 al tetto escluso), quindi con piu' schede aperte le letture in corso restano al piu' quante il tetto. Prende
//    il primo lock libero e, solo se li tengono tutti, aspetta quello del proprio posto nella scheda (review N-11): un
//    posto tenuto da un'altra scheda non ferma questa se ce n'e' un altro libero. Senza Web Locks (contesto non sicuro,
//    jsdom dei test) la coda resta per scheda;
//  - una lettura annullata (react-query annulla quelle di una pagina lasciata) non interrompe la richiesta HTTP: il
//    backend la lavorerebbe comunque fino in fondo. Chi l'ha chiesta riceve subito l'annullamento, il posto si libera
//    quando arriva la risposta;
//  - una lettura senza risposta non tiene posto e lock per sempre (review N-13): la guardia, armata all'invio, dopo
//    GUARDIA_LETTURA_MS interrompe la richiesta, libera posto e lock e chiude la promessa con un timeout di rete
//    (AxiosError ETIMEDOUT senza risposta: per getErrorMessage "il server non risponde").
export const LETTURE_IN_PARALLELO = 2;
export const NOME_LOCK_LETTURE = 'cruscotto-csr-letture';
// oltre la durata massima di un report sul backend: fino a sette letture SQL da 15 s (cruscottocsr.finanziario.query-timeout)
export const GUARDIA_LETTURA_MS = 120_000;

interface Coda {
  prefisso: string;
  tetto: number;
  /** Posti liberi della scheda: indici da 0 al tetto escluso; il posto dice quale lock aspettare se sono tutti tenuti. */
  liberi: number[];
  inAttesa: ((indice: number) => void)[];
}
let code = new Map<string, Coda>();
let tetti: Record<string, number> = {};

/** Sostituisce i tetti di letture per prefisso (l'app all'avvio, i test). Le code in corso finiscono. */
export function configuraTettiLetture(nuovi: Record<string, number>): void {
  tetti = { ...nuovi };
  code = new Map();
}

/** Per i test: nessun tetto e code vuote, come prima della configurazione dell'app. Le letture in coda finiscono. */
export function azzeraCodeLetture(): void {
  configuraTettiLetture({});
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
    coda = { prefisso, tetto, liberi: Array.from({ length: tetto }, (_, i) => i), inAttesa: [] };
    code.set(prefisso, coda);
  }
  return coda;
}

const annullata = () => new Axios.CanceledError();
const senzaRisposta = () => new AxiosError(`Nessuna risposta in ${GUARDIA_LETTURA_MS} ms`, AxiosError.ETIMEDOUT);

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

const nessunLock = () => undefined;

// Lock se e' libero adesso (ifAvailable, che non ammette un signal): undefined se lo tiene un altro.
function provaLock(locks: LockManager, nome: string): Promise<(() => void) | undefined> {
  return new Promise((esito, ko) => {
    locks
      .request(nome, { ifAvailable: true }, (lock) => (lock ? new Promise<void>((rilascia) => esito(rilascia)) : esito(undefined)))
      .catch(ko);
  });
}

// Lock atteso finche' chi lo tiene non lo lascia; la funzione restituita lo rilascia.
function attendiLock(locks: LockManager, nome: string, segnale?: AbortSignal): Promise<() => void> {
  return new Promise((preso, ko) => {
    locks.request(nome, { signal: segnale }, () => new Promise<void>((rilascia) => preso(rilascia))).catch(ko);
  });
}

// Lock fra le schede: il primo libero fra gli indici del prefisso, altrimenti l'attesa su quello del posto della
// scheda. Senza Web Locks, o se il browser li nega (SecurityError in un iframe isolato), nessun lock: resta la coda
// della scheda.
async function prendiLock(coda: Coda, indice: number, segnale?: AbortSignal): Promise<() => void> {
  const locks = typeof navigator === 'undefined' ? undefined : navigator.locks;
  if (!locks) return nessunLock;
  const nome = (i: number) => `${NOME_LOCK_LETTURE}:${coda.prefisso}:${i}`;
  try {
    for (let i = 0; i < coda.tetto; i++) {
      const rilascia = await provaLock(locks, nome(i));
      if (rilascia) return rilascia;
    }
    return await attendiLock(locks, nome(indice), segnale);
  } catch {
    if (segnale?.aborted) throw annullata();
    return nessunLock;
  }
}

/** Posto della scheda e lock fra le schede; la funzione restituita li libera (una volta sola). */
async function prendiPosto(coda: Coda, segnale?: AbortSignal): Promise<() => void> {
  const indice = await prendiIndice(coda, segnale);
  let rilasciaLock: () => void;
  try {
    rilasciaLock = await prendiLock(coda, indice, segnale);
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
  // react-query passa un AbortSignal del DOM: la richiesta HTTP parte con un segnale suo, che aziona solo la guardia,
  // per tenere il posto finche' il backend lavora
  const { signal, ...senzaSegnale } = richiesta;
  const segnale = signal as AbortSignal | undefined;
  const rilascia = await prendiPosto(coda, segnale);
  if (segnale?.aborted) {
    rilascia();
    throw annullata();
  }
  const interrompi = new AbortController();
  const risposta = AXIOS_INSTANCE({ ...senzaSegnale, signal: interrompi.signal });
  return new Promise<T>((ok, ko) => {
    const annulla = () => ko(annullata());
    const guardia = setTimeout(() => {
      ko(senzaRisposta());
      rilascia();
      interrompi.abort();
    }, GUARDIA_LETTURA_MS);
    // posto e lock si liberano prima che il chiamante riprenda: il primo in coda parte subito
    const fine = () => {
      clearTimeout(guardia);
      rilascia();
      segnale?.removeEventListener('abort', annulla);
    };
    segnale?.addEventListener('abort', annulla, { once: true });
    void risposta.then(
      (r) => {
        fine();
        ok(r.data as T);
      },
      (e: unknown) => {
        fine();
        ko(e);
      },
    );
  });
};

export type ErrorType<Error> = AxiosError<Error>;
export type BodyType<BodyData> = BodyData;

export default customInstance;
