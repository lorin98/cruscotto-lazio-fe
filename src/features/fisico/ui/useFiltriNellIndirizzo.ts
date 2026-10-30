// useFiltriNellIndirizzo — i filtri dell'output regionale e delle Unit Amount (dal 29/10/2026 nel fisico) vivono nella
// query string: li legge, li applica, li toglie uno per volta o tutti e prepara i chip della barra, con le voci di TX-0060
// dell'elenco operativo (decisione G2) lette col loro grant. La regola del filtro per azione portante senza il legame
// interventi - azioni e' quella comune di entities/filtri, come nelle superfici; le Unit Amount non hanno l'azione
// (`senzaAzione`, come nella pagina del procedurale da cui vengono). Il pannello della pagina e il focus dopo "Applica i
// filtri" sono quelli comuni di entities/filtri (usePannelloConFocus). Le superfici, con la campagna, hanno il loro
// useCriteriNellIndirizzo.
import { filtriDaRicerca, filtriNellaBarra, ricercaDaFiltri, useFiltriProgrammaNellIndirizzo, usePannelloConFocus } from '../../../entities/filtri';
import type { Filtri } from '../../../entities/filtri';
import { useAuthStatus } from '../../../shared/api/auth/use-auth-status';
import { useValoriFiltri } from '../api';
import { filtriSenzaAzione } from '../lib/criteri';
import { puoLeggere } from '../lib/grant';

const scrivi = (f: Filtri) => ricercaDaFiltri(f);
const NESSUNO: Filtri = {};

/** I filtri della pagina nell'indirizzo, il pannello e il focus dopo "Applica i filtri"; `senzaAzione`: le Unit Amount. */
export function useFiltriDellaPagina(senzaAzione: boolean) {
  const auth = useAuthStatus();
  const conValori = puoLeggere(auth.data, 'filtri');
  const valori = useValoriFiltri(conValori);
  const comuni = { scrivi, attivi: filtriNellaBarra, nessuno: NESSUNO };
  const regola = useFiltriProgrammaNellIndirizzo<Filtri>(senzaAzione ? { ...comuni, leggi: filtriSenzaAzione, senzaAzione: true } : { ...comuni, leggi: filtriDaRicerca, conValori, valori });
  return { ...regola, valori: conValori ? valori : null, senzaAzione, ...usePannelloConFocus(regola.filtri, regola.applica, ricercaDaFiltri) };
}

export type FiltriDellaPagina = ReturnType<typeof useFiltriDellaPagina>;
