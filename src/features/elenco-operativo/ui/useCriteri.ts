// useCriteri — i criteri dell'interrogazione vivono nella query string (url_params dello uiplan, ADR 0029): il hook li
// legge normalizzati dalla funzione pura di lib/ e li riscrive. L'indirizzo si sostituisce (replace): un filtro dal vivo
// non riempie la cronologia di passi intermedi, e "indietro" torna alla pagina di provenienza.
// Debounce (wireframe approvati: "si applicano dal vivo, debounce", ADR 0029; review v1 V-15): ogni scelta del pannello e
// il clic su un grafico passano da `applicaRitardato`, che tiene una BOZZA e la scrive nell'indirizzo RITARDO_MS dopo
// l'ultima scelta: sei province scelte di fila fanno una lettura sola. La bozza e' gia' visibile nei controlli e nei chip
// (`criteriVisti`); chiudere il pannello la scrive subito (`scarica`, H-12: niente testo perso). Togliere un chip o
// azzerare (`applica`) e' immediato. Un campo tornato non valido ritira la sua parte di bozza (`ritira`, review v2 H-01):
// un valore valido scritto prima non parte dopo. Le letture usano solo i criteri dell'indirizzo (`criteri`).
// La navigazione e' una transizione di React: fra la scrittura e il render col nuovo indirizzo i criteri scritti restano
// visibili (`inScrittura`), cosi' campi, chip e paginazione non tornano per un attimo ai criteri vecchi (`criteriScritti`:
// la select delle righe per pagina, review v2 X-02).
// Il timer della bozza scrive con l'indirizzo e lo state CORRENTI (riferimento aggiornato a ogni render): una vista
// scelta mentre la bozza aspetta non torna quella di prima (review v2 H-01).
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { criteriDaRicerca, ricercaDaCriteri } from '../lib/criteri';
import type { Criteri, Elenco, NomeParametro } from '../lib/criteri';

export const RITARDO_MS = 300;

/** I criteri scritti nell'indirizzo finche' il render non li legge dall'indirizzo stesso. */
function useInScrittura(criteri: Criteri) {
  const [inScrittura, setInScrittura] = useState<Criteri | null>(null);
  const [criteriPrima, setCriteriPrima] = useState(criteri);
  if (criteri !== criteriPrima) {
    setCriteriPrima(criteri);
    setInScrittura(null);
  }
  return [inScrittura, setInScrittura] as const;
}

/** I criteri con i filtri `nomi` riportati a quelli applicati (o tolti, se non applicati). */
function conApplicati(bozza: Criteri, applicati: Criteri, nomi: readonly NomeParametro[]): Criteri {
  const out: Criteri = { ...bozza };
  for (const n of nomi) {
    const v = applicati[n];
    if (v?.length) out[n] = v;
    else delete out[n];
  }
  return out;
}

/** I criteri dell'indirizzo e la loro scrittura (replace), sempre con l'indirizzo e lo state della voce CORRENTI. */
function useIndirizzo(elenco: Elenco) {
  const posizione = useLocation();
  const naviga = useNavigate();
  const criteri = useMemo(() => criteriDaRicerca(posizione.search, elenco), [posizione.search, elenco]);
  const [inScrittura, setInScrittura] = useInScrittura(criteri);
  const attuali = useRef(criteri);
  const corrente = useRef(posizione);
  useEffect(() => {
    attuali.current = criteri;
    corrente.current = posizione;
  });
  const vai = useCallback(
    (nuovi: Criteri) => {
      const ricerca = ricercaDaCriteri(nuovi, elenco);
      if (ricerca === ricercaDaCriteri(attuali.current, elenco)) return;
      // la vista per ambito e le colonne nello state restano: cambiare i filtri non le cambia
      const { pathname, state } = corrente.current;
      void naviga(`${pathname}${ricerca}`, { replace: true, state });
      setInScrittura(nuovi);
    },
    [elenco, naviga, setInScrittura],
  );
  return { criteri, inScrittura, attuali, vai };
}

export function useCriteri(elenco: Elenco) {
  const { criteri, inScrittura, attuali, vai } = useIndirizzo(elenco);
  const [bozza, setBozza] = useState<Criteri | null>(null);
  const bozzaCorrente = useRef<Criteri | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const lascia = useCallback(() => {
    clearTimeout(timer.current);
    bozzaCorrente.current = null;
    setBozza(null);
  }, []);
  /** Scrive subito la bozza in attesa (chiusura del pannello o scadenza del ritardo); senza bozza non fa nulla. */
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
  /** Un campo tornato non valido: i suoi filtri nella bozza tornano quelli applicati (la bozza decade se non resta altro). */
  const ritira = useCallback(
    (nomi: readonly NomeParametro[]) => {
      const b = bozzaCorrente.current;
      if (!b) return;
      const nuova = conApplicati(b, attuali.current, nomi);
      if (ricercaDaCriteri(nuova, elenco) === ricercaDaCriteri(attuali.current, elenco)) {
        lascia();
        return;
      }
      bozzaCorrente.current = nuova;
      setBozza(nuova);
    },
    [elenco, lascia, attuali],
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
  const criteriScritti = inScrittura ?? criteri;
  return { criteri, criteriScritti, criteriVisti: bozza ?? criteriScritti, inAttesa: bozza !== null || inScrittura !== null, applica, applicaRitardato, ritira, scarica };
}
