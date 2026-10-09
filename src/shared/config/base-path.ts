// base-path.ts — l'unico punto da cui gli URL generati ereditano il context root del portale.
// Restituisce il prefisso SENZA slash finale; alla radice vale '' (stringa vuota).
// NON prefissare mai a mano un URL API: si otterrebbe un doppio prefisso.
export function basePath(): string {
  const raw: string =
    (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.BASE_URL) || '/';
  if (raw === '/' || raw === '') return '';
  return raw.replace(/\/+$/, '');
}

// Path di login costruito SOLO dal base path noto + '/auth/login'.
// Mai da un returnTo/Location arbitrario del server o del client (anti open-redirect).
export function resolveLoginPath(): string {
  return `${basePath()}/auth/login`;
}

// Path di logout, stessa regola.
export function resolveLogoutPath(): string {
  return `${basePath()}/auth/logout`;
}
