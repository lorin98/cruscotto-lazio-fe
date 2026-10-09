// layout.tsx — shell dell'applicazione UI v2 (wireframe v2 approvati, prototipo): fascia dell'ente con i loghi, barra
// con nome, ricerca di un intervento e utente con "Esci" (logout del BFF, navigazione e non XHR), menu laterale con le
// aree (su schermi stretti in un pannello), piede con i link istituzionali; avviso globale del 403 delle mutation e
// avviso di inattivita' (NFR-41). Le pagine rendono la propria barra dei filtri e il proprio <main id="contenuto">.
// Scaduta la sessione (qui o in un'altra scheda) la shell smette di rendere pagine, menu, ricerca e utente e non
// rilegge /auth/status: dietro l'avviso non resta nulla da leggere (review step9 A-04). "Esci" lo annuncia alle altre
// schede prima della navigazione al logout del BFF.
import { useEffect, useState } from 'react';
import { Link, Outlet } from 'react-router';
import { CercaIntervento } from '../features/finanziario';
import { useAuthStatus } from '../shared/api/auth/use-auth-status';
import { resolveLogoutPath } from '../shared/config/base-path';
import { Icona, NOME_APPLICAZIONE, PannelloLaterale } from '../shared/ui';
import logoArsial from './assets/logo-arsial.png';
import logoLazio from './assets/logo-lazio.png';
import { EVENTO_ACCESSO_NEGATO } from './avvisi';
import { COLLEGAMENTI_LEGALI, SITO_ARSIAL, SITO_REGIONE } from './collegamenti';
import { AvvisoInattivita, annunciaUscita } from './inattivita';
import { MenuLaterale } from './menu';

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

const iniziali = (nome: string) =>
  nome
    .split(/[\s.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p.charAt(0).toUpperCase())
    .join('');

const nuovaFinestra = ' (si apre in una nuova finestra)';

export function Layout() {
  const [sessioneChiusa, setSessioneChiusa] = useState(false);
  const { data: auth } = useAuthStatus(!sessioneChiusa);
  const utente = !sessioneChiusa && auth?.authenticated ? (auth.user?.displayName ?? auth.user?.username) : undefined;
  const [menuAperto, setMenuAperto] = useState(false);
  return (
    <>
      <a className="visually-hidden-focusable ui-skip" href="#contenuto">
        Salta al contenuto
      </a>
      <header>
        <div className="ui-ente">
          <div className="ui-ente__interno">
            <a className="ui-logo" href={SITO_REGIONE.url ?? undefined} target="_blank" rel="noopener noreferrer">
              <img src={logoLazio} alt={`${SITO_REGIONE.etichetta}${nuovaFinestra}`} />
            </a>
            <span className="ui-ente__sep" aria-hidden="true" />
            <a className="ui-logo" href={SITO_ARSIAL.url ?? undefined} target="_blank" rel="noopener noreferrer">
              <img src={logoArsial} alt={`ARSIAL - Agenzia Regionale per lo Sviluppo e l'Innovazione dell'Agricoltura del Lazio${nuovaFinestra}`} />
            </a>
          </div>
        </div>
        <div className="ui-appbar">
          {utente && (
            <button type="button" className="ui-appbar__menu" aria-label="Apri il menu" aria-haspopup="dialog" onClick={() => setMenuAperto(true)}>
              <Icona nome="it-burger" />
            </button>
          )}
          <Link to="/" className="ui-appbar__nome">
            <span className="ui-appbar__sigla" aria-hidden="true">
              CSR
            </span>
            <span>
              {NOME_APPLICAZIONE} <small>Lazio</small>
            </span>
          </Link>
          {utente && <CercaIntervento />}
          {utente && (
            <div className="ui-utente">
              <span className="ui-utente__avatar" aria-hidden="true">
                {iniziali(utente)}
              </span>
              <span>{utente}</span>
              <a href={resolveLogoutPath()} onClick={annunciaUscita}>
                Esci
              </a>
            </div>
          )}
        </div>
      </header>
      <AvvisoAccessoNegato />
      <div className={utente ? 'ui-layout' : 'ui-layout ui-layout--senza-menu'}>
        {utente && (
          <nav className="ui-sidebar" aria-label="Navigazione principale">
            <div className="ui-sidebar__interno">
              <MenuLaterale />
            </div>
          </nav>
        )}
        <div className="ui-main">{!sessioneChiusa && <Outlet />}</div>
      </div>
      <footer className="ui-footer">
        <div className="ui-footer__interno">
          <div>
            <div className="ui-footer__loghi">
              <img src={logoLazio} alt={SITO_REGIONE.etichetta} />
              <img src={logoArsial} alt="ARSIAL" />
            </div>
            <p className="mb-0">{`${NOME_APPLICAZIONE}: monitoraggio del Complemento di Sviluppo Rurale della Regione Lazio, a cura di ARSIAL.`}</p>
          </div>
          <nav aria-label="Collegamenti istituzionali">
            <h2>Istituzioni</h2>
            <ul>
              {[SITO_REGIONE, SITO_ARSIAL].map((c) => (
                <li key={c.etichetta}>
                  <a href={c.url ?? undefined} target="_blank" rel="noopener noreferrer">
                    {c.etichetta}
                    <span className="visually-hidden">{nuovaFinestra}</span>
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <nav aria-label="Informazioni legali">
            <h2>Informazioni</h2>
            <ul>
              {COLLEGAMENTI_LEGALI.map((c) => (
                <li key={c.etichetta}>{c.url ? <a href={c.url}>{c.etichetta}</a> : <span>{`${c.etichetta} (indirizzo da definire)`}</span>}</li>
              ))}
            </ul>
          </nav>
        </div>
        <div className="ui-footer__fondo">Regione Lazio - ARSIAL</div>
      </footer>
      {utente && (
        <PannelloLaterale aperto={menuAperto} onChiudi={() => setMenuAperto(false)} titolo="Menu" stretto>
          <nav aria-label="Navigazione principale">
            <MenuLaterale onNaviga={() => setMenuAperto(false)} />
          </nav>
        </PannelloLaterale>
      )}
      {(sessioneChiusa || auth?.authenticated) && <AvvisoInattivita onScaduta={() => setSessioneChiusa(true)} />}
    </>
  );
}
