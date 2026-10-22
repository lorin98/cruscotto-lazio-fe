// useCriteriNellIndirizzo — i criteri delle superfici vivono nella query string (url_params della route): li legge, li
// applica, li toglie uno per volta o tutti e prepara i chip della barra. Le voci dei filtri vengono da TX-0060 dell'elenco
// operativo (decisione G2), letto col suo grant: come nel finanziario, il filtro per azione portante senza il legame
// interventi - azioni (legameAzioniDisponibile falso) non si applica e resta come chip con la spiegazione, cosi' il report
// non dice "nessun intervento" per un filtro che non puo' funzionare; finche' TX-0060 non risponde, un indirizzo con
// l'azione e' `inAttesa` (la pagina non legge TX-0018 con un filtro che forse non si applica). Senza il grant di TX-0060,
// o con TX-0060 in errore, il legame non si conosce e l'azione va al backend com'e'.
import { useLocation, useNavigate } from 'react-router';
import { AZIONE_NON_APPLICATA, senzaAzioneSeNonDisponibile } from '../../../entities/filtri';
import { useAuthStatus } from '../../../shared/api/auth/use-auth-status';
import type { ChipFiltro } from '../../../shared/ui';
import { useValoriFiltri } from '../api';
import { criteriAttivi, criteriDaRicerca, ricercaDaCriteri } from '../lib/criteri';
import type { Criteri } from '../lib/criteri';
import { puoLeggere } from '../lib/grant';

export function useCriteriNellIndirizzo() {
  const { pathname, search } = useLocation();
  const naviga = useNavigate();
  const auth = useAuthStatus();
  const conValori = puoLeggere(auth.data, 'filtri');
  const valori = useValoriFiltri(conValori);
  const richiesti = criteriDaRicerca(search);
  const legameAssente = valori.data?.legameAzioniDisponibile === false;
  // il legame non si conosce ancora: profilo in caricamento, oppure TX-0060 in corso
  const legameIgnoto = (auth.data === undefined && !auth.isError) || (conValori && valori.data === undefined && !valori.isError);
  const inAttesa = legameIgnoto && (richiesti.azione ?? []).length > 0;
  const criteri: Criteri = legameAssente ? senzaAzioneSeNonDisponibile(richiesti, false) : richiesti;
  const applica = (c: Criteri) => {
    const query = ricercaDaCriteri(c);
    void naviga(query ? `${pathname}?${query}` : pathname);
  };
  const chip: ChipFiltro[] = criteriAttivi(richiesti).map((c) => ({
    chiave: c.chiave,
    etichetta: c.etichetta,
    valore: legameAssente && c.chiave.startsWith('azione:') ? `${c.valore} (${AZIONE_NON_APPLICATA})` : c.valore,
    onTogli: () => applica(c.senza),
  }));
  return { criteri, inAttesa, chip, applica, togliTutti: () => applica({}), valori: conValori ? valori : null };
}
