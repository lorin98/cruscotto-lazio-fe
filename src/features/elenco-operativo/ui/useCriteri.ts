// useCriteri — i criteri dell'interrogazione vivono nella query string (url_params dello uiplan, ADR 0029): il hook li
// legge normalizzati dalla funzione pura di lib/ e li riscrive. L'indirizzo si sostituisce (replace): un filtro dal vivo
// non riempie la cronologia di passi intermedi, e "indietro" torna alla pagina di provenienza.
// Debounce (wireframe approvati: "si applicano dal vivo, debounce", ADR 0029; review v1 V-15): ogni scelta del pannello e
// il clic su un grafico passano da `applicaRitardato`, che tiene una BOZZA e la scrive nell'indirizzo RITARDO_MS dopo
// l'ultima scelta: sei province scelte di fila fanno una lettura sola. La bozza e' gia' visibile nei controlli e nei chip
// (`criteriVisti`); chiudere il pannello la scrive subito (`scarica`, H-12: niente testo perso). Togliere un chip o
// azzerare (`applica`) e' immediato. Le letture usano solo i criteri dell'indirizzo (`criteri`).
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { criteriDaRicerca, ricercaDaCriteri } from '../lib/criteri';
import type { Criteri, Elenco } from '../lib/criteri';

export const RITARDO_MS = 300;

export function useCriteri(elenco: Elenco) {
  const { pathname, search, state } = useLocation();
  const naviga = useNavigate();
  const criteri = useMemo(() => criteriDaRicerca(search, elenco), [search, elenco]);
  const [bozza, setBozza] = useState<Criteri | null>(null);
  const bozzaCorrente = useRef<Criteri | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const attuali = useRef(criteri);
  useEffect(() => {
    attuali.current = criteri;
  }, [criteri]);

  const vai = useCallback(
    (nuovi: Criteri) => {
      const ricerca = ricercaDaCriteri(nuovi, elenco);
      // lo state della voce (la vista per ambito) resta: cambiare i filtri non cambia la vista
      if (ricerca !== ricercaDaCriteri(attuali.current, elenco)) void naviga(`${pathname}${ricerca}`, { replace: true, state });
    },
    [elenco, naviga, pathname, state],
  );
  const lascia = useCallback(() => {
    clearTimeout(timer.current);
    bozzaCorrente.current = null;
    setBozza(null);
  }, []);
  /** Scrive subito la bozza in attesa (chiusura del pannello, Invio in un campo); senza bozza non fa nulla. */
  const scarica = useCallback(() => {
    const b = bozzaCorrente.current;
    lascia();
    if (b) vai(b);
  }, [lascia, vai]);
  /** Scelta del pannello o clic su un grafico: entra nella bozza e va nell'indirizzo dopo RITARDO_MS. */
  const applicaRitardato = useCallback(
    (nuovi: Criteri) => {
      clearTimeout(timer.current);
      bozzaCorrente.current = nuovi;
      setBozza(nuovi);
      timer.current = setTimeout(scarica, RITARDO_MS);
    },
    [scarica],
  );
  /** Cambio immediato (chip tolto, azzera, pagina, ordinamento): la bozza in attesa decade. */
  const applica = useCallback(
    (nuovi: Criteri) => {
      lascia();
      vai(nuovi);
    },
    [lascia, vai],
  );
  // uscendo dalla pagina la bozza si perde: scriverla riporterebbe all'elenco chi ha appena aperto un altro indirizzo
  useEffect(() => () => clearTimeout(timer.current), []);
  return { criteri, criteriVisti: bozza ?? criteri, inAttesa: bozza !== null, applica, applicaRitardato, scarica };
}
