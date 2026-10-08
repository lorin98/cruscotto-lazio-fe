// layout.tsx — shell dell'applicazione (wireframe approvati: skip-link, intestazione, piè di pagina): nome
// dell'applicazione, utente collegato e "Esci" (logout del BFF, navigazione e non XHR), avviso globale del diniego 403
// delle mutation, avviso di inattivita' (NFR-41). Le pagine rendono il proprio <main id="contenuto">.
import { useEffect, useState } from 'react';
import { Link, Outlet } from 'react-router';
import { useAuthStatus } from '../shared/api/auth/use-auth-status';
import { resolveLogoutPath } from '../shared/config/base-path';
import { NOME_APPLICAZIONE } from '../shared/ui';
import { EVENTO_ACCESSO_NEGATO } from './avvisi';
import { AvvisoInattivita } from './inattivita';

function AvvisoAccessoNegato() {
  const [visibile, setVisibile] = useState(false);
  useEffect(() => {
    const mostra = () => setVisibile(true);
    window.addEventListener(EVENTO_ACCESSO_NEGATO, mostra);
    return () => window.removeEventListener(EVENTO_ACCESSO_NEGATO, mostra);
  }, []);
  // chiuso l'avviso, il focus torna al titolo della pagina (o al contenuto) invece di perdersi sul body (R-07)
  const chiudi = () => {
    setVisibile(false);
    const destinazione = document.querySelector<HTMLElement>('#contenuto h1') ?? document.getElementById('contenuto');
    destinazione?.focus();
  };
  if (!visibile) return null;
  return (
    <div className="alert alert-danger container mt-3" role="alert">
      Non hai i permessi per questa operazione.{' '}
      <button type="button" className="btn btn-sm btn-outline-danger ms-2" onClick={chiudi}>
        Chiudi
      </button>
    </div>
  );
}

export function Layout() {
  const { data: auth } = useAuthStatus();
  const utente = auth?.authenticated ? (auth.user?.displayName ?? auth.user?.username) : undefined;
  return (
    <>
      <a className="visually-hidden-focusable" href="#contenuto">
        Salta al contenuto
      </a>
      <header className="it-header-wrapper bg-primary text-white">
        <div className="container d-flex flex-wrap align-items-center justify-content-between py-2 gap-2">
          <Link to="/" className="text-white fw-semibold text-decoration-none">
            {NOME_APPLICAZIONE} - ARSIAL / Regione Lazio
          </Link>
          {utente && (
            <div className="d-flex align-items-center gap-3">
              <span>{utente}</span>
              <a className="btn btn-sm btn-outline-light" href={resolveLogoutPath()}>
                Esci
              </a>
            </div>
          )}
        </div>
      </header>
      <AvvisoAccessoNegato />
      <Outlet />
      <footer className="it-footer bg-dark text-white mt-4">
        <div className="container py-3 small">{NOME_APPLICAZIONE} - ARSIAL / Regione Lazio</div>
      </footer>
      {auth?.authenticated && <AvvisoInattivita />}
    </>
  );
}
