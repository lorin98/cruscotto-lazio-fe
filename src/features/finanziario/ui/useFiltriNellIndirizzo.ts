// useFiltriNellIndirizzo — i filtri di RF001 vivono nella query string: li legge, li applica conservando i parametri di
// pagina (anno, esercizio), li toglie uno per volta o tutti e prepara i chip della barra. La regola del filtro per azione
// portante senza il legame interventi - azioni (chip "non applicato", attesa X-03 finche' TX-0001 non risponde) e' quella
// comune di entities/filtri (useFiltriProgrammaNellIndirizzo, review del fisico H2): qui la lettura dei valori (TX-0001,
// col grant del pannello) e la scrittura dell'indirizzo coi parametri di pagina.
import { filtriNellaBarra, useFiltriProgrammaNellIndirizzo } from '../../../entities/filtri';
import { hasGrant, useAuthStatus } from '../../../shared/api/auth/use-auth-status';
import { useFiltri } from '../api';
import { filtriDaRicerca, ricercaConParametri } from '../lib/filtri';
import type { Filtri } from '../lib/filtri';
import { GRANT } from '../lib/report';

const scrivi = (f: Filtri, search: string) => ricercaConParametri(search, f);

export function useFiltriNellIndirizzo() {
  const auth = useAuthStatus();
  const conPannello = hasGrant(auth.data, GRANT.filtri);
  const valori = useFiltri(conPannello);
  const { filtri, inAttesa, chip, applica, togliTutti } = useFiltriProgrammaNellIndirizzo<Filtri>({ leggi: filtriDaRicerca, scrivi, attivi: filtriNellaBarra, conValori: conPannello, valori, nessuno: {} });
  return { filtri, inAttesa, chip, applica, togliTutti, conPannello };
}
