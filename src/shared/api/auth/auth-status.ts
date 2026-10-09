// auth-status.ts — modulo auth FUORI-CODEGEN. /auth/status non vive in alcuna openapi-<slice>:
// orval non genera nulla. E' il CANALE UNICO dei claim (username, roles[] additivi, projection).
import { AXIOS_INSTANCE } from '../mutator/bff-mutator';

export interface AuthUser {
  username: string;
  profile?: string;
  roles: string[]; // coarse+fine additivi (gia' espansi dall'augmentor two-tier del BE)
  displayName?: string;
  contextProjection?: Record<string, unknown>; // security-inert
}

export interface AuthStatus {
  authenticated: boolean;
  user?: AuthUser;
}

export const AUTH_STATUS_QUERY_KEY = ['auth', 'status'] as const;

export async function fetchAuthStatus(): Promise<AuthStatus> {
  const res = await AXIOS_INSTANCE.get<AuthStatus>('/auth/status');
  return res.data;
}

// Predicato di autorizzazione FE = fine || coarse sui roles[]. GATE DI UX, non enforcement
// (il BE ridecide sempre). L'asse-dato/cono/livello e' enforcement server-side: la FE non lo replica.
export function hasGrant(status: AuthStatus | undefined, grant: string): boolean {
  return status?.user?.roles?.includes(grant) ?? false;
}

// Impronta dell'identita' della sessione (review N-15): username, profilo e ruoli ordinati. Lo stesso username con un
// altro profilo o altri ruoli (es. gruppo dell'IdP da P1 a P4) e' un'altra identita': i dati letti dalla precedente non
// valgono per lei. Serve SOLO a decidere quando svuotare la cache (app/utente-della-sessione.ts), come al piu' potrebbe
// la contextProjection: MAI a concedere o negare un accesso. undefined = nessun utente collegato.
export function improntaIdentita(status: AuthStatus | undefined): string | undefined {
  const u = status?.authenticated ? status.user : undefined;
  if (!u) return undefined;
  return JSON.stringify([u.username, u.profile ?? null, [...(u.roles ?? [])].sort()]);
}

// contextProjection e' security-inert: fail-OPEN se assente. MAI un controllo di sicurezza.
export function projection<T>(status: AuthStatus | undefined, key: string, fallback: T): T {
  const p = status?.user?.contextProjection;
  if (!p || !Object.prototype.hasOwnProperty.call(p, key)) return fallback;
  return p[key] as T;
}
