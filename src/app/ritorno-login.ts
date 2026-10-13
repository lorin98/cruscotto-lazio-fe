// ritorno-login.ts — ritorno al link dopo il login (review elenco v1 X-06, D-11 Rev. 9 di nfr-conformance). Chi apre un
// link condiviso senza sessione, dopo il login torna li' e non alla Home: la SPA porta a /auth/login?ritorno=<pagina>
// e il BFF, che riconvalida il percorso, ce lo riporta. Nessuno stato nel browser (niente Web Storage: modello BFF).
// Il ritorno vale solo per le route dell'app (route-table.json), mai per la Home (ci si arriva comunque), /auth o /api.
import { matchPath } from 'react-router';
import { configuraLoginDaSessioneScaduta } from '../shared/api/mutator/bff-mutator';
import { percorsoDiRitorno, resolveLoginPath } from '../shared/config/base-path';
import type { RitornoAmmesso } from '../shared/config/base-path';
import routeTable from './route-table.json';

const ROTTE: readonly string[] = routeTable.routes.map((r) => r.path);

interface Posizione {
  pathname: string;
  search: string;
}

function posizioneCorrente(): Posizione | null {
  return typeof window !== 'undefined' && window.location ? window.location : null;
}

/** Percorso (con la query) della pagina a cui tornare dopo il login, oppure null se non e' una route dell'app. */
export function ritornoDellaPagina(posizione: Posizione | null = posizioneCorrente()): RitornoAmmesso | null {
  if (!posizione) return null;
  const ritorno = percorsoDiRitorno(posizione.pathname, posizione.search);
  if (!ritorno) return null;
  return ROTTE.some((path) => matchPath({ path, end: true }, ritorno.relativo) !== null) ? ritorno.completo : null;
}

/** Link "Accedi": il login del BFF con il ritorno alla pagina corrente, se e' una route dell'app. */
export function linkDiLogin(posizione?: Posizione | null): string {
  return resolveLoginPath(ritornoDellaPagina(posizione === undefined ? posizioneCorrente() : posizione));
}

/** All'avvio (main.tsx): anche la sessione scaduta durante una lettura riporta alla pagina dopo il login. */
export function configuraRitornoDopoLogin(): void {
  configuraLoginDaSessioneScaduta(() => ritornoDellaPagina());
}
