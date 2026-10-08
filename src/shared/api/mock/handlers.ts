// handlers.ts — feature navigabile senza backend.
// /auth/status dalle fixture derivate dall'authz-catalog (auth-fixtures.sh) + handler generati orval.
import { http, HttpResponse } from 'msw';
import type { RequestHandler } from 'msw';
import authFixtures from './fixtures/auth-status.json';
import type { AuthStatus, AuthUser } from '../auth/auth-status';

interface AuthFixture {
  id: string;
  authenticated: boolean;
  user?: AuthUser;
}
interface AuthFixturesFile {
  schema_version: string;
  pack_hash: string;
  fixtures: AuthFixture[];
}

const file = authFixtures as AuthFixturesFile;

// Fixture attiva selezionabile nei test; default = primo profilo autenticato (feature navigabile).
const firstAuthenticated: AuthFixture | undefined =
  file.fixtures.find((f) => f.authenticated) ?? file.fixtures[0];
let activeFixtureId: string | undefined = firstAuthenticated?.id;

export function setActiveAuthFixture(id: string): void {
  activeFixtureId = id;
}
export function resetActiveAuthFixture(): void {
  activeFixtureId = firstAuthenticated?.id;
}

function activeStatus(): AuthStatus {
  const f = file.fixtures.find((x) => x.id === activeFixtureId) ?? firstAuthenticated;
  if (!f) return { authenticated: false };
  return { authenticated: f.authenticated, user: f.user };
}

// Canale unico dei claim. Il path e' relativo al base path del portale => match con suffisso '*'.
const authHandler = http.get('*/auth/status', () => HttpResponse.json(activeStatus()));

// Raccoglie gli handler MSW generati da orval, slice-agnostico: nessun nome di tag cablato a mano.
function collectGeneratedHandlers(): RequestHandler[] {
  const modules = import.meta.glob('../generated/**/*.msw.ts', { eager: true });
  const out: RequestHandler[] = [];
  for (const mod of Object.values(modules)) {
    for (const [name, value] of Object.entries(mod as Record<string, unknown>)) {
      // L'aggregatore per-tag get<Tag>Mock ritorna un ARRAY di RequestHandler MSW (ognuno con `.info`
      // oggetto e `.run` FUNZIONE). Non basta Array.isArray: un data-generator get..ResponseMock di una
      // response a CORPO ARRAY (es. string[], o oggetti di dominio) ritorna anch'esso un array di DATI
      // faker e ne verrebbe spinta spazzatura in setupServer. Non basta nemmeno `'run' in el`: un dato
      // di dominio con campi chiamati per caso 'info'/'run' (stringhe) lo passerebbe (giro 5, #9). Si
      // esige quindi la shape RUNTIME di un handler: `.run` e' un metodo e `.info` un oggetto. Questo
      // include correttamente un tag chiamato 'Response' (aggregatore getResponseMock) ed esclude i dati.
      if (typeof value === 'function' && /^get.+Mock$/.test(name)) {
        const result = (value as () => unknown)();
        if (
          Array.isArray(result) &&
          result.length > 0 &&
          result.every(
            (el) =>
              el !== null &&
              typeof el === 'object' &&
              typeof (el as { run?: unknown }).run === 'function' &&
              typeof (el as { info?: unknown }).info === 'object' &&
              (el as { info?: unknown }).info !== null,
          )
        ) {
          out.push(...(result as RequestHandler[]));
        }
      }
    }
  }
  return out;
}

export const handlers: RequestHandler[] = [authHandler, ...collectGeneratedHandlers()];
