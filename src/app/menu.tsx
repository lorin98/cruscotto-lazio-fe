// menu.tsx — menu laterale dell'applicazione (UI v2): aree del cruscotto con gruppi e sottomenu, dal catalogo unico delle
// aree (aree.ts, review step9 H-22). Le voci di un'area sono le sue pagine visibili per i grant dell'utente (solo UX);
// passando da una pagina all'altra della stessa area la sua parte dell'indirizzo (i filtri) resta.
// Le aree non ancora realizzate sono dichiarate "presto", senza link.
import { useId, useState } from 'react';
import { NavLink, useLocation } from 'react-router';
import { hasGrant, useAuthStatus } from '../shared/api/auth/use-auth-status';
import { Icona } from '../shared/ui';
import { AREE_FUTURE, areeVisibili } from './aree';
import type { Area, PaginaArea } from './aree';

function GruppoArea({ area, pagine, onNaviga }: { area: Area; pagine: PaginaArea[]; onNaviga?: () => void }) {
  const id = useId();
  const { search } = useLocation();
  const [aperto, setAperto] = useState(true);
  const query = area.ricercaConservata?.(search) ?? '';
  return (
    <li>
      <button type="button" className="ui-menu__gruppo" aria-expanded={aperto} aria-controls={`${id}-${area.chiave}`} onClick={() => setAperto((a) => !a)}>
        <Icona nome={area.icona} />
        {area.titolo}
        <Icona nome="it-chevron-right" />
      </button>
      <ul id={`${id}-${area.chiave}`} className="ui-menu__sub" hidden={!aperto}>
        {pagine.map((p) => (
          <li key={p.percorso}>
            <NavLink to={query ? `${p.percorso}?${query}` : p.percorso} end onClick={onNaviga}>
              {p.voceMenu}
            </NavLink>
          </li>
        ))}
      </ul>
    </li>
  );
}

export function MenuLaterale({ onNaviga }: { onNaviga?: () => void }) {
  const { data: auth } = useAuthStatus();
  const aree = areeVisibili((g) => hasGrant(auth, g));
  return (
    <>
      <p className="ui-menu__sezione">Aree del cruscotto</p>
      <ul className="ui-menu">
        {aree.map(({ area, pagine }) => (
          <GruppoArea key={area.chiave} area={area} pagine={pagine} onNaviga={onNaviga} />
        ))}
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
