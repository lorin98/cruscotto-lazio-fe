// auth-status.ts — modulo auth FUORI-CODEGEN. /auth/status non vive in alcuna openapi-<slice>:
// orval non genera nulla. E' il CANALE UNICO dei claim (username, roles[] additivi, projection).
// Tipi e predicati puri stanno in ./stato (senza il mutator, usabili dai lib/: review v3 H-03); qui la lettura.
import { AXIOS_INSTANCE } from '../mutator/bff-mutator';
import type { AuthStatus } from './stato';

export { hasGrant, improntaIdentita, projection } from './stato';
export type { AuthStatus, AuthUser } from './stato';

export const AUTH_STATUS_QUERY_KEY = ['auth', 'status'] as const;

export async function fetchAuthStatus(): Promise<AuthStatus> {
  const res = await AXIOS_INSTANCE.get<AuthStatus>('/auth/status');
  return res.data;
}
