// navigazione.ts — i passaggi fra pagine del procedurale come li vuole il profilo (gate di UX: il backend ridecide):
// l'ingresso dell'area per il percorso (la prima pagina visibile, coi criteri della pagina), il dettaglio dell'intervento
// dal clic su una barra o su una riga (link dettaglio-intervento-*, con lo stato della pagina) e i link verso le domande
// dell'elenco operativo, solo col grant della pagina di arrivo (TX-0056), e le letture di una pagina col loro grant. Gli
// indirizzi li costruiscono le funzioni pure di lib/collegamenti.
import { useNavigate } from 'react-router';
import { codiceDelPercorso } from '../../../entities/filtri';
import { hasGrant, useAuthStatus } from '../../../shared/api/auth/use-auth-status';
import { codiceDalClic } from '../../../shared/lib';
import type { ClicGrafico } from '../../../shared/ui';
import { indirizzoElenco, percorsoIntervento } from '../lib/collegamenti';
import type { IdLinkElenco, PuntoElenco } from '../lib/collegamenti';
import { conCriteri } from '../lib/criteri';
import type { CriteriProcedurali } from '../lib/criteri';
import { puoLeggere } from '../lib/grant';
import type { Lettura } from '../lib/grant';
import { pagineVisibili } from '../lib/pagine';

/** L'indirizzo della voce "Procedurale" del percorso: la prima pagina dell'area che il profilo puo' aprire, coi criteri. */
export function useIngressoArea(c: CriteriProcedurali): string | undefined {
  const auth = useAuthStatus().data;
  const prima = pagineVisibili((g) => hasGrant(auth, g))[0]?.percorso;
  return prima === undefined ? undefined : conCriteri(prima, c);
}

/** Il dettaglio dell'intervento (con lo stato della pagina) dal clic su una barra; un clic fuori dai codici non naviga. */
export function useApriIntervento(stato?: readonly string[]) {
  const naviga = useNavigate();
  const apri = (codice: string) => void naviga(percorsoIntervento(codice, stato));
  const dalClic = (p: ClicGrafico) => {
    const codice = codiceDelPercorso(codiceDalClic(p));
    if (codice !== null) apri(codice);
  };
  return { apri, dalClic };
}

/**
 * Le letture di una pagina col grant del profilo (una forma sola per panoramica, sottofasi e dettaglio, review H10):
 * `puo` dice se una lettura parte, `conGrant` tiene il suo stato solo col grant (null senza: la sezione non c'e').
 */
export function useLettureColGrant() {
  const auth = useAuthStatus().data;
  const puo = (l: Lettura) => puoLeggere(auth, l);
  const conGrant = <T>(l: Lettura, stato: T): T | null => (puo(l) ? stato : null);
  return { puo, conGrant };
}

/** Il profilo apre le domande dell'elenco operativo (TX-0056), la destinazione dei link "Apri nell'elenco". */
export function usePuoAprireElenco(): boolean {
  return puoLeggere(useAuthStatus().data, 'elencoDomande');
}

/** L'indirizzo di un link verso l'elenco: null senza il grant di TX-0056 (o in caricamento) e col punto non esprimibile. */
export function useLinkElenco(c: CriteriProcedurali): (id: IdLinkElenco, punto: PuntoElenco) => string | null {
  const puo = usePuoAprireElenco();
  return (id, punto) => (puo ? indirizzoElenco(id, c, punto) : null);
}
