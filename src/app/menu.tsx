// menu.tsx — menu laterale dell'applicazione (UI v2): aree del cruscotto con gruppi e sottomenu. Le voci di un'area
// sono le sue pagine visibili per i grant dell'utente (solo UX); passando da una pagina all'altra i filtri restano.
// Le aree non ancora realizzate sono dichiarate "presto", senza link.
import { useId, useState } from 'react';
import { NavLink, useLocation } from 'react-router';
import { filtriDaRicerca, pagineVisibili, ricercaDaFiltri } from '../features/finanziario';
import { hasGrant, useAuthStatus } from '../shared/api/auth/use-auth-status';
import { Icona } from '../shared/ui';

const AREE_FUTURE = ['Fisico', 'Procedurale', 'Istituzionale', 'Primo pilastro'];

export function MenuLaterale({ onNaviga }: { onNaviga?: () => void }) {
  const id = useId();
  const { search } = useLocation();
  const { data: auth } = useAuthStatus();
  const [aperto, setAperto] = useState(true);
  const pagine = pagineVisibili((g) => hasGrant(auth, g));
  const query = ricercaDaFiltri(filtriDaRicerca(search));
  return (
    <>
      <p className="ui-menu__sezione">Aree del cruscotto</p>
      <ul className="ui-menu">
        {pagine.length > 0 && (
          <li>
            <button type="button" className="ui-menu__gruppo" aria-expanded={aperto} aria-controls={`${id}-finanziario`} onClick={() => setAperto((a) => !a)}>
              <Icona nome="it-chart-line" />
              Finanziario
              <Icona nome="it-chevron-right" />
            </button>
            <ul id={`${id}-finanziario`} className="ui-menu__sub" hidden={!aperto}>
              {pagine.map((p) => (
                <li key={p.percorso}>
                  <NavLink to={query ? `${p.percorso}?${query}` : p.percorso} end onClick={onNaviga}>
                    {p.titolo}
                  </NavLink>
                </li>
              ))}
            </ul>
          </li>
        )}
        {AREE_FUTURE.map((a) => (
          <li key={a}>
            <span className="ui-menu__presto">
              {a}
              <span>presto</span>
            </span>
          </li>
        ))}
      </ul>
    </>
  );
}
