// useCriteriNellIndirizzo — i criteri delle superfici vivono nella query string (url_params della route): li legge, li
// applica, li toglie uno per volta o tutti e prepara i chip della barra. Le voci dei filtri vengono da TX-0060 dell'elenco
// operativo (decisione G2), letto col suo grant. La regola del filtro per azione portante senza il legame interventi -
// azioni (chip "non applicato", attesa X-03 finche' TX-0060 non risponde, l'azione al backend com'e' senza il grant o con
// TX-0060 in errore) e' quella comune di entities/filtri, la stessa del finanziario (review del fisico H2); qui la lettura
// dei valori, la campagna e la scrittura dell'indirizzo.
import { useFiltriProgrammaNellIndirizzo } from '../../../entities/filtri';
import { useAuthStatus } from '../../../shared/api/auth/use-auth-status';
import { useValoriFiltri } from '../api';
import { criteriAttivi, criteriDaRicerca, ricercaDaCriteri } from '../lib/criteri';
import type { Criteri } from '../lib/criteri';
import { puoLeggere } from '../lib/grant';

const scrivi = (c: Criteri) => ricercaDaCriteri(c);

export function useCriteriNellIndirizzo() {
  const auth = useAuthStatus();
  const conValori = puoLeggere(auth.data, 'filtri');
  const valori = useValoriFiltri(conValori);
  const { filtri, inAttesa, chip, applica, togliTutti } = useFiltriProgrammaNellIndirizzo<Criteri>({ leggi: criteriDaRicerca, scrivi, attivi: criteriAttivi, conValori, valori, nessuno: {} });
  return { criteri: filtri, inAttesa, chip, applica, togliTutti, valori: conValori ? valori : null };
}
