import type { ReactNode } from 'react';
import { useAuthStatus, hasGrant } from '../shared/api/auth/use-auth-status';
import { resolveLoginPath } from '../shared/config/base-path';
import { useFocusTitolo } from '../shared/ui';
import { SessioneNonVerificabile } from './sessione-non-verificabile';

// RequireGrant — route-guard di UX (hide-by-role). DOTTRINA (auth-runtime-pattern.md): e' SOLO UX,
// MAI un controllo di sicurezza. L'enforcement e' server-side (403 urn:cruscottocsr:problem:accesso-negato,
// gestito dalla MutationCache/error boundary); qui evitiamo solo di mostrare pagine che l'utente non
// puo' usare. Visibile se l'utente ha ALMENO uno dei grant (roles additivi fine||coarse, hasGrant).
// I grant sono VERBATIM dall'authz-catalog (via route-table.json), mai nomi di ruolo inventati.
// Tre casi distinti (review step9 V-04/A-01): /auth/status non raggiungibile o 401 (sessione non valida),
// utente non collegato (invito ad accedere, navigazione verso /auth/login del BFF), utente senza il grant.
// Nessun redirect automatico: un'identita' rifiutata dal backend non deve finire in un ciclo di login (A-04).

function Esito({ titolo, children }: { titolo: string; children: ReactNode }) {
  const h1 = useFocusTitolo<HTMLHeadingElement>(titolo);
  return (
    <main className="ui-pagina" id="contenuto">
      <div className="ui-titolo">
        <h1 ref={h1} tabIndex={-1}>
          {titolo}
        </h1>
      </div>
      {children}
    </main>
  );
}

export function RequireGrant({
  visibility,
  children,
}: {
  visibility: string[];
  children: ReactNode;
}) {
  const { data: status, isLoading, isError, refetch } = useAuthStatus();
  if (isLoading) return <p role="status">Caricamento…</p>;
  // un refetch fallito con lo stato gia' in cache non toglie la pagina (React Query conserva data): R-08
  if (isError && status === undefined) {
    return (
      <Esito titolo="Sessione non disponibile">
        <SessioneNonVerificabile onRiprova={() => void refetch()} />
      </Esito>
    );
  }
  if (!status?.authenticated) {
    return (
      <Esito titolo="Accesso richiesto">
        <p role="alert">Per consultare il cruscotto devi accedere con le tue credenziali.</p>
        <p>
          <a className="btn btn-primary" href={resolveLoginPath()}>
            Accedi
          </a>
        </p>
      </Esito>
    );
  }
  const allowed = visibility.some((grant) => hasGrant(status, grant));
  if (!allowed) {
    return (
      <Esito titolo="Accesso non disponibile">
        <p role="alert">Non hai i permessi per questa pagina.</p>
      </Esito>
    );
  }
  return <>{children}</>;
}
