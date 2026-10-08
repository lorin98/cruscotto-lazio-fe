// sessione-non-verificabile.tsx — /auth/status non raggiungibile o 401 senza uno stato in cache (Home e RequireGrant).
// "Riprova" e "Accedi di nuovo", mai un redirect automatico: un'identita' rifiutata dal backend non deve finire in un
// ciclo di login (A-04).
import { resolveLoginPath } from '../shared/config/base-path';

export function SessioneNonVerificabile({ onRiprova }: { onRiprova: () => void }) {
  return (
    <>
      <p role="alert">Non riesco a verificare la sessione: il servizio non risponde o la sessione non è valida.</p>
      <p>
        <button type="button" className="btn btn-outline-primary me-2" onClick={onRiprova}>
          Riprova
        </button>
        <a className="btn btn-primary" href={resolveLoginPath()}>
          Accedi di nuovo
        </a>
      </p>
    </>
  );
}
