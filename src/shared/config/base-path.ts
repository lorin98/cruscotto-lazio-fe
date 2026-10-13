// base-path.ts — l'unico punto da cui gli URL generati ereditano il context root del portale.
// Restituisce il prefisso SENZA slash finale; alla radice vale '' (stringa vuota).
// NON prefissare mai a mano un URL API: si otterrebbe un doppio prefisso.
export function basePath(): string {
  const raw: string =
    (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.BASE_URL) || '/';
  if (raw === '/' || raw === '') return '';
  return raw.replace(/\/+$/, '');
}

/**
 * Percorso di ritorno convalidato: lo produce SOLO percorsoDiRitorno (tipo marcato), quindi il login non puo' ricevere
 * una stringa qualsiasi (review finanziario v4 iter3 H-02).
 */
export type RitornoAmmesso = string & { readonly __ritornoAmmesso: unique symbol };

// Path di login costruito SOLO dal base path noto + '/auth/login'.
// Mai da un returnTo/Location arbitrario del server (anti open-redirect). L'unico ritorno ammesso e' la pagina corrente
// della SPA, gia' convalidata da percorsoDiRitorno (e dall'app contro la route-table): il BFF la riconvalida e dopo il
// login riporta li' (ritorno al link condiviso, D-11 Rev. 9 di nfr-conformance, review elenco v1 X-06).
export function resolveLoginPath(ritorno?: RitornoAmmesso | null): string {
  const login = `${basePath()}/auth/login`;
  return ritorno ? `${login}?ritorno=${encodeURIComponent(ritorno)}` : login;
}

/**
 * Lunghezza massima del ritorno, misurata CODIFICATO: il BFF accetta percorsi fino a 2048 caratteri, ma la riga della
 * richiesta ha un limite di 4096 (oltre: 414 prima della route), quindi la SPA non aggiunge il ritorno quando la sua forma
 * codificata supera 2048 (D-11 Rev. 10 c di nfr-conformance).
 */
export const RITORNO_MAX = 2048;
const RISERVATI = ['/auth', '/api', '/q'];
const CONTROLLO = /[\p{Cc}\p{Cf}\\]/u;

/**
 * Percorso della SPA a cui tornare dopo il login (percorso + query, il frammento non conta), oppure null se non c'e' da
 * tornare (Home) o se il percorso non e' ammesso: deve stare sotto il base path, iniziare con una sola '/', senza
 * caratteri di controllo ne' barre rovesciate, fuori da /auth, /api e /q, entro RITORNO_MAX una volta codificato.
 * `relativo` e' il percorso senza il base path (quello delle route). Il BFF riconvalida comunque: qui si evita solo un
 * ritorno inutile o una richiesta troppo lunga.
 */
export function percorsoDiRitorno(pathname: string, search: string): { completo: RitornoAmmesso; relativo: string } | null {
  const base = basePath();
  if (!pathname.startsWith('/') || pathname.startsWith('//') || CONTROLLO.test(pathname) || CONTROLLO.test(search)) return null;
  let relativo = pathname;
  if (base) {
    if (pathname !== base && !pathname.startsWith(`${base}/`)) return null;
    relativo = pathname.slice(base.length) || '/';
  }
  if (relativo === '/' || relativo.startsWith('//')) return null;
  if (RISERVATI.some((r) => relativo === r || relativo.startsWith(`${r}/`))) return null;
  const query = search && search !== '?' ? (search.startsWith('?') ? search : `?${search}`) : '';
  const completo = `${pathname}${query}`;
  return encodeURIComponent(completo).length <= RITORNO_MAX ? { completo: completo as RitornoAmmesso, relativo } : null;
}

// Path di logout, stessa regola.
export function resolveLogoutPath(): string {
  return `${basePath()}/auth/logout`;
}
