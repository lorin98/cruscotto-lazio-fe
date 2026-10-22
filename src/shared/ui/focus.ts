// focus.ts — a11y del cambio di route (green-fe step6, invariante #6): al montaggio della pagina il focus va sul suo
// titolo (h1 con tabIndex=-1), cosi' chi usa lettore di schermo o tastiera riparte dal contenuto nuovo; con il titolo
// della pagina aggiorna anche document.title (WCAG 2.4.2), che altrimenti resterebbe quello di index.html. Poi il focus
// dopo un comando che sparisce col contenuto che cambia (WCAG 2.4.3).
import { useCallback, useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';
import { NOME_APPLICAZIONE } from '../config/applicazione';

/** `esterno`: il ref dell'h1 se la pagina lo usa anche altrove (es. useFocusDopoIlCambio); assente, uno proprio. */
export function useFocusTitolo<T extends HTMLElement>(titoloPagina?: string, esterno?: RefObject<T | null>) {
  const proprio = useRef<T>(null);
  const ref = esterno ?? proprio;
  useEffect(() => {
    if (titoloPagina) document.title = `${titoloPagina} - ${NOME_APPLICAZIONE}`;
    ref.current?.focus();
  }, [titoloPagina, ref]);
  return ref;
}

/**
 * Focus dopo un comando che sparisce col contenuto che cambia (WCAG 2.4.3; X-03 dell'elenco, A1 della review del fisico):
 * chi chiude un dialogo e cambia il contenuto chiama `sposta()` nel gestore; il focus va sull'elemento del ref (stabile,
 * fuori dal contenuto che cambia: l'h1 della pagina) DOPO il render che ha chiuso il dialogo, in un effetto, perche' col
 * focus trap ancora attivo un focus() nel gestore tornerebbe nel dialogo. Il ripristino del focus di react-aria non lo
 * annulla: agisce solo se il focus e' rimasto sul body.
 */
export function useFocusDopoIlCambio<T extends HTMLElement>(destinazione: RefObject<T | null>): () => void {
  const [richieste, setRichieste] = useState(0);
  useEffect(() => {
    if (richieste > 0) destinazione.current?.focus();
  }, [richieste, destinazione]);
  return useCallback(() => setRichieste((n) => n + 1), []);
}
