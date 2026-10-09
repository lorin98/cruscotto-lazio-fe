// useFiltriNellIndirizzo — i filtri di RF001 vivono nella query string: li legge, li applica conservando i parametri di
// pagina (anno, esercizio), li toglie uno per volta o tutti e prepara i chip della barra. Il filtro per azione portante
// senza il legame interventi - azioni (fonte non attiva, SC-FI_FILTRO_AZIONI_SENZA_LEGAME) non si applica: resta come
// chip con la spiegazione, cosi' i report non dicono "nessun intervento" per un filtro che non puo' funzionare. Finche'
// TX-0001 non risponde, un indirizzo con l'azione e' `inAttesa`: la pagina non fa leggere i report con un filtro che
// forse non si applica (X-03).
import { useLocation, useNavigate } from 'react-router';
import { hasGrant, useAuthStatus } from '../../../shared/api/auth/use-auth-status';
import type { ChipFiltro } from '../../../shared/ui';
import { useFiltri } from '../api';
import { filtriAttivi, filtriDaRicerca, ricercaConParametri, senzaAzioneSeNonDisponibile, senzaValore } from '../lib/filtri';
import type { Filtri } from '../lib/filtri';
import { GRANT } from '../lib/report';

const AZIONE_NON_APPLICATA = 'non applicato: il legame con le azioni portanti viene da una fonte non attiva';

export function useFiltriNellIndirizzo() {
  const { pathname, search } = useLocation();
  const naviga = useNavigate();
  const auth = useAuthStatus();
  const conPannello = hasGrant(auth.data, GRANT.filtri);
  const { data, isError } = useFiltri(conPannello);
  const richiesti = filtriDaRicerca(search);
  const legameAssente = data?.legameAzioniDisponibile === false;
  // il legame non si conosce ancora: profilo in caricamento, oppure TX-0001 in corso
  const legameIgnoto = (auth.data === undefined && !auth.isError) || (conPannello && data === undefined && !isError);
  const inAttesa = legameIgnoto && (richiesti.azione ?? []).length > 0;
  const filtri: Filtri = legameAssente ? senzaAzioneSeNonDisponibile(richiesti, false) : richiesti;
  const applica = (f: Filtri) => {
    const query = ricercaConParametri(search, f);
    void naviga(query ? `${pathname}?${query}` : pathname);
  };
  const chip: ChipFiltro[] = filtriAttivi(richiesti).map((f) => ({
    chiave: `${f.chiave}:${f.valore}`,
    etichetta: f.etichetta,
    valore: legameAssente && f.chiave === 'azione' ? `${f.valore} (${AZIONE_NON_APPLICATA})` : f.valore,
    onTogli: () => applica(senzaValore(richiesti, f.chiave, f.valore)),
  }));
  return { filtri, inAttesa, chip, applica, togliTutti: () => applica({}), conPannello };
}
