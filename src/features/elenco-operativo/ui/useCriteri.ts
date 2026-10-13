// useCriteri — i criteri dell'interrogazione vivono nella query string (url_params dello uiplan, ADR 0029): il hook li
// legge validati dalla funzione pura di lib/ e li riscrive. L'indirizzo si sostituisce (replace): un filtro dal vivo non
// riempie la cronologia di passi intermedi, e "indietro" torna alla pagina di provenienza. Il debounce dei campi di
// testo sta nei campi (CampoRitardato), non qui.
import { useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { criteriDaRicerca, ricercaDaCriteri } from '../lib/criteri';
import type { Criteri, Elenco } from '../lib/criteri';

export function useCriteri(elenco: Elenco) {
  const { pathname, search } = useLocation();
  const naviga = useNavigate();
  const criteri = useMemo(() => criteriDaRicerca(search, elenco), [search, elenco]);
  const applica = useCallback(
    (nuovi: Criteri) => {
      const ricerca = ricercaDaCriteri(nuovi, elenco);
      if (ricerca !== ricercaDaCriteri(criteri, elenco)) void naviga(`${pathname}${ricerca}`, { replace: true });
    },
    [criteri, elenco, naviga, pathname],
  );
  return { criteri, applica };
}
