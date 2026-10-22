// useFiltriNellIndirizzo — i filtri dei due report istituzionali vivono nella query string (url_params delle route): li
// legge, li applica, li toglie uno per volta o tutti e prepara i chip della barra. Le voci dei filtri vengono da TX-0060
// dell'elenco operativo (decisione G2), letto solo col suo grant: senza, nessuna richiesta parte. La regola del filtro per
// azione portante senza il legame interventi - azioni (chip "non applicato", attesa finche' TX-0060 non risponde,
// l'azione al backend com'e' senza il grant o con TX-0060 in errore) e' quella comune di entities/filtri, la stessa del
// finanziario e del fisico. Nella verifica SMP non SIGC l'anno di riferimento del file resta quando i filtri cambiano.
// Poi il pannello dei filtri della pagina e il focus dopo "Applica i filtri" (come nel fisico, review A1).
import { useRef, useState } from 'react';
import { filtriDaRicerca, filtriNellaBarra, ricercaDaFiltri, useFiltriProgrammaNellIndirizzo } from '../../../entities/filtri';
import type { Filtri } from '../../../entities/filtri';
import { useAuthStatus } from '../../../shared/api/auth/use-auth-status';
import { useFocusDopoIlCambio } from '../../../shared/ui';
import { useValoriFiltri } from '../api';
import { ricercaConAnno } from '../lib/criteri';
import { puoLeggere } from '../lib/grant';

const soloFiltri = (f: Filtri) => ricercaDaFiltri(f);

/** `conAnno`: la pagina ha l'anno di riferimento nell'indirizzo (la verifica), che resta quando i filtri cambiano. */
export function useFiltriNellIndirizzo(conAnno: boolean) {
  const auth = useAuthStatus();
  const conValori = puoLeggere(auth.data, 'filtri');
  const valori = useValoriFiltri(conValori);
  const regola = useFiltriProgrammaNellIndirizzo<Filtri>({ leggi: filtriDaRicerca, scrivi: conAnno ? ricercaConAnno : soloFiltri, attivi: filtriNellaBarra, conValori, valori, nessuno: {} });
  return { ...regola, valori: conValori ? valori : null };
}

/** Il pannello dei filtri: chiuso, aperto dal bottone Filtri della barra o da "Modifica i filtri" di uno stato vuoto. */
export type Pannello = 'barra' | 'vuoto' | null;

/**
 * Il pannello della pagina e "Applica i filtri": il bottone che l'ha aperto resta (Filtri della barra, o "Modifica i
 * filtri" con criteri invariati) e react-aria ci riporta il focus; dallo stato vuoto, con criteri nuovi, il contenuto
 * cambia e "Modifica i filtri" sparisce: il focus va sull'h1 dopo la chiusura del dialogo (WCAG 2.4.3, come nel fisico).
 */
export function usePannelloConFocus(filtri: Filtri, applica: (f: Filtri) => void) {
  const h1 = useRef<HTMLHeadingElement>(null);
  const sposta = useFocusDopoIlCambio(h1);
  const [pannello, setPannello] = useState<Pannello>(null);
  const onApplica = (f: Filtri) => {
    const cambiati = ricercaDaFiltri(f) !== ricercaDaFiltri(filtri);
    setPannello(null);
    applica(f);
    if (pannello === 'vuoto' && cambiati) sposta();
  };
  return { h1, pannello, apri: setPannello, chiudi: () => setPannello(null), onApplica };
}
