// useFiltriNellIndirizzo — i filtri dei due report istituzionali vivono nella query string (url_params delle route): li
// legge, li applica, li toglie uno per volta o tutti e prepara i chip della barra. Le voci dei filtri vengono da TX-0060
// dell'elenco operativo (decisione G2), letto solo col suo grant: senza, nessuna richiesta parte. La regola del filtro per
// azione portante senza il legame interventi - azioni (chip "non applicato", attesa finche' TX-0060 non risponde,
// l'azione al backend com'e' senza il grant o con TX-0060 in errore) e' quella comune di entities/filtri, la stessa del
// finanziario e del fisico. Nella verifica SMP non SIGC l'anno di riferimento del file resta quando i filtri cambiano.
// Il pannello della pagina e il focus dopo "Applica i filtri" sono quelli comuni di entities/filtri (usePannelloConFocus):
// useFiltriDellaPagina li mette insieme per l'impaginazione comune dei due report (PaginaReport, review H6).
import { filtriDaRicerca, filtriNellaBarra, ricercaDaFiltri, useFiltriProgrammaNellIndirizzo, usePannelloConFocus } from '../../../entities/filtri';
import type { Filtri } from '../../../entities/filtri';
import { useAuthStatus } from '../../../shared/api/auth/use-auth-status';
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

/** I filtri della pagina nell'indirizzo, il pannello e il focus dopo "Applica i filtri": la pagina li da' a PaginaReport. */
export function useFiltriDellaPagina(conAnno: boolean) {
  const filtri = useFiltriNellIndirizzo(conAnno);
  return { ...filtri, ...usePannelloConFocus(filtri.filtri, filtri.applica, ricercaDaFiltri) };
}

export type FiltriDellaPagina = ReturnType<typeof useFiltriDellaPagina>;
