// useFiltriNellIndirizzo — i filtri dell'output regionale e delle Unit Amount (dal 29/10/2026 nel fisico) vivono nella
// query string: li legge, li applica, li toglie uno per volta o tutti e prepara i chip della barra, con le voci di TX-0060
// dell'elenco operativo (decisione G2) lette col loro grant. I cinque filtri dei report fisici in entrambe le pagine,
// azione portante compresa (dal 30/10/2026 anche le Unit Amount: SC-FS_UNIT_AMOUNT_AZIONE, wireframe unit-amount
// approvato); la regola del filtro per azione portante senza il legame interventi - azioni e' quella comune di
// entities/filtri, come nelle superfici. Il pannello della pagina e il focus dopo "Applica i filtri" sono quelli comuni di
// entities/filtri (usePannelloConFocus). Le superfici, con la campagna, hanno il loro useCriteriNellIndirizzo.
import { filtriDaRicerca, filtriNellaBarra, ricercaDaFiltri, useFiltriProgrammaNellIndirizzo, usePannelloConFocus } from '../../../entities/filtri';
import type { Filtri } from '../../../entities/filtri';
import { useAuthStatus } from '../../../shared/api/auth/use-auth-status';
import { useValoriFiltri } from '../api';
import { puoLeggere } from '../lib/grant';

const scrivi = (f: Filtri) => ricercaDaFiltri(f);
const NESSUNO: Filtri = {};

/** I filtri della pagina nell'indirizzo, il pannello e il focus dopo "Applica i filtri". */
export function useFiltriDellaPagina() {
  const auth = useAuthStatus();
  const conValori = puoLeggere(auth.data, 'filtri');
  const valori = useValoriFiltri(conValori);
  const regola = useFiltriProgrammaNellIndirizzo<Filtri>({ leggi: filtriDaRicerca, scrivi, attivi: filtriNellaBarra, nessuno: NESSUNO, conValori, valori });
  return { ...regola, valori: conValori ? valori : null, ...usePannelloConFocus(regola.filtri, regola.applica, ricercaDaFiltri) };
}

export type FiltriDellaPagina = ReturnType<typeof useFiltriDellaPagina>;
