// useCriteriNellIndirizzo — i criteri dei report procedurali vivono nella query string (url_params delle route): li legge,
// li applica, li toglie uno per volta o tutti e prepara i chip della barra; poi il pannello della pagina e il focus dopo
// "Applica i filtri" (usePannelloConFocus di entities/filtri, come nel fisico e nell'istituzionale). Le voci dei filtri
// vengono dalla slice stessa: TX-0024 (interventi, obiettivi, e "Dati al") e TX-0025 (stato area programmazione), lette
// solo col loro grant; senza, nessuna richiesta parte. La regola comune dei filtri nell'indirizzo e' quella di
// entities/filtri, `senzaAzione`: quella dell'azione portante senza legame non si applica, il procedurale non ha l'azione
// (RF024).
// Due forme di pagina: tutti i criteri (i report per domanda) e il solo stato (il dettaglio). La forma senza lo stato era
// delle Unit Amount (TX-0030), del fisico dal riallineamento degli ambiti del 29/10/2026: tolta.
import { useFiltriProgrammaNellIndirizzo, usePannelloConFocus } from '../../../entities/filtri';
import { useAuthStatus } from '../../../shared/api/auth/use-auth-status';
import { useStatiAreaProgrammazione, useValoriFiltri } from '../api';
import { criteriDaRicerca, criteriNellaBarra, ricercaDaCriteri } from '../lib/criteri';
import type { CriteriProcedurali } from '../lib/criteri';
import { puoLeggere } from '../lib/grant';

/** Quali criteri ha la pagina: tutti (i report per domanda) o il solo stato (il dettaglio). */
export type FormaCriteri = 'tutti' | 'soloStato';

/** Il solo stato dell'indirizzo (il dettaglio: l'intervento e' il segmento :codice). */
function soloLoStato(search: string): CriteriProcedurali {
  const { stato } = criteriDaRicerca(search);
  return stato ? { stato } : {};
}

const scrivi = (c: CriteriProcedurali) => ricercaDaCriteri(c);

export function useCriteriNellIndirizzo(forma: FormaCriteri) {
  const auth = useAuthStatus().data;
  const conValori = puoLeggere(auth, 'filtri');
  const conStatiArea = puoLeggere(auth, 'statiArea');
  const valori = useValoriFiltri(conValori);
  const statiArea = useStatiAreaProgrammazione(conStatiArea);
  const leggi = forma === 'soloStato' ? soloLoStato : criteriDaRicerca;
  const attivi = (c: CriteriProcedurali) => criteriNellaBarra(c, statiArea.data?.valori);
  const regola = useFiltriProgrammaNellIndirizzo<CriteriProcedurali>({ leggi, scrivi, attivi, senzaAzione: true, nessuno: {} });
  return { ...regola, forma, valori: conValori ? valori : null, statiArea: conStatiArea ? statiArea : null };
}

/** I criteri della pagina nell'indirizzo, il pannello e il focus dopo "Applica i filtri": la pagina li da' a PaginaProcedurale. */
export function useCriteriDellaPagina(forma: FormaCriteri) {
  const criteri = useCriteriNellIndirizzo(forma);
  return { ...criteri, ...usePannelloConFocus(criteri.filtri, criteri.applica, ricercaDaCriteri) };
}

export type PaginaDeiCriteri = ReturnType<typeof useCriteriDellaPagina>;
