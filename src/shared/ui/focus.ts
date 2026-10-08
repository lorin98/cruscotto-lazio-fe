// focus.ts — a11y del cambio di route (green-fe step6, invariante #6): al montaggio della pagina il focus va sul suo
// titolo (h1 con tabIndex=-1), cosi' chi usa lettore di schermo o tastiera riparte dal contenuto nuovo; con il titolo
// della pagina aggiorna anche document.title (WCAG 2.4.2), che altrimenti resterebbe quello di index.html.
import { useEffect, useRef } from 'react';

export const NOME_APPLICAZIONE = 'Cruscotto CSR 2023-2027';

export function useFocusTitolo<T extends HTMLElement>(titoloPagina?: string) {
  const ref = useRef<T>(null);
  useEffect(() => {
    if (titoloPagina) document.title = `${titoloPagina} - ${NOME_APPLICAZIONE}`;
    ref.current?.focus();
  }, [titoloPagina]);
  return ref;
}
