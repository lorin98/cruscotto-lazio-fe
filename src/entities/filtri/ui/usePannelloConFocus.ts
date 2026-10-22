// usePannelloConFocus — il pannello dei filtri di una pagina e il focus dopo "Applica i filtri" (WCAG 2.4.3; A1 della
// review del fisico), accanto al pannello comune (PannelloFiltriProgramma): prima la regola era copiata nel fisico e
// nell'istituzionale (review dell'istituzionale H4). Il bottone che ha aperto il pannello resta (Filtri della barra, o
// "Modifica i filtri" con criteri invariati) e react-aria ci riporta il focus; dallo stato vuoto, con criteri nuovi, il
// contenuto cambia e "Modifica i filtri" sparisce: il focus va sull'h1 della pagina dopo la chiusura del dialogo
// (useFocusDopoIlCambio del kit). `applicaConFocus` serve anche agli altri comandi che spariscono col contenuto che
// cambiano (es. "Mostra solo" e la serie per campagna del fisico).
import { useRef, useState } from 'react';
import { useFocusDopoIlCambio } from '../../../shared/ui';
import type { Filtri } from '../lib/programma';

/** Il pannello dei filtri: chiuso, aperto dal bottone Filtri della barra o da "Modifica i filtri" di uno stato vuoto. */
export type PannelloAperto = 'barra' | 'vuoto' | null;

/** `ricerca`: la query string dei criteri della pagina, per sapere se "Applica i filtri" li ha cambiati. */
export function usePannelloConFocus<C extends Filtri>(criteri: C, applica: (c: C) => void, ricerca: (c: C) => string) {
  const h1 = useRef<HTMLHeadingElement>(null);
  const sposta = useFocusDopoIlCambio(h1);
  const [pannello, setPannello] = useState<PannelloAperto>(null);
  const applicaConFocus = (c: C) => {
    applica(c);
    sposta();
  };
  const onApplica = (c: C) => {
    setPannello(null);
    (pannello === 'vuoto' && ricerca(c) !== ricerca(criteri) ? applicaConFocus : applica)(c);
  };
  return { h1, pannello, apri: setPannello, chiudi: () => setPannello(null), onApplica, applicaConFocus };
}
