// menu.tsx — menu laterale dell'applicazione (UI v2): aree del cruscotto con gruppi e sottomenu, dal catalogo unico delle
// aree (aree.ts, review step9 H-22). Le voci di un'area sono le sue pagine visibili per i grant dell'utente (solo UX);
// passando da una pagina all'altra della stessa area la sua parte dell'indirizzo (i filtri) resta. Solo dalla stessa
// area: i filtri di un'altra area non entrano nei suoi link (review v1 H-10, una navigazione che nessun link dichiara).
// Le aree non ancora realizzate sono dichiarate "presto", senza link. Gli strumenti trasversali (elenco operativo) hanno
// una sezione propria, con le sole pagine visibili. Una voce e' corrente sul suo percorso, o anche nei sottopercorsi se
// la pagina lo dichiara (le determine di una domanda: /fisico/determine/<codice>).
import { useId, useState } from 'react';
import { NavLink, useLocation } from 'react-router';
import { hasGrant, useAuthStatus } from '../shared/api/auth/use-auth-status';
import { Icona } from '../shared/ui';
import { AREE_FUTURE, STRUMENTI, areeVisibili } from './aree';
import type { Area, PaginaArea } from './aree';

function GruppoArea({ area, pagine, onNaviga }: { area: Area; pagine: PaginaArea[]; onNaviga?: () => void }) {
  const id = useId();
  const { pathname, search } = useLocation();
  const [aperto, setAperto] = useState(true);
  const dellArea = pagine.some((p) => pathname === p.percorso || pathname.startsWith(`${p.percorso}/`));
  const query = dellArea ? (area.ricercaConservata?.(search) ?? '') : '';
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
            <NavLink to={query ? `${p.percorso}?${query}` : p.percorso} end={!p.conSottopercorsi} onClick={onNaviga}>
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
  const strumenti = areeVisibili((g) => hasGrant(auth, g), STRUMENTI);
  return (
    <>
      <p className="ui-menu__sezione">Aree del cruscotto</p>
      <ul className="ui-menu">
        {aree.map(({ area, pagine }) => (
          <GruppoArea key={area.chiave} area={area} pagine={pagine} onNaviga={onNaviga} />
        ))}
        {AREE_FUTURE.map((a) => (
          <li key={a.chiave}>
            <span className="ui-menu__presto">
              {a.titolo}
              <span>presto</span>
            </span>
          </li>
        ))}
      </ul>
      {strumenti.length > 0 && (
        <>
          <p className="ui-menu__sezione">Strumenti</p>
          <ul className="ui-menu">
            {strumenti.map(({ area, pagine }) => (
              <GruppoArea key={area.chiave} area={area} pagine={pagine} onNaviga={onNaviga} />
            ))}
          </ul>
        </>
      )}
    </>
  );
}
