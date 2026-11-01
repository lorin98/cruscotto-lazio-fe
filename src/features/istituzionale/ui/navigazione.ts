// navigazione.ts — i passaggi fra pagine dell'istituzionale come li vuole il profilo (gate di UX: il backend ridecide):
// l'ingresso dell'area per il percorso (la prima pagina visibile), il dettaglio dell'intervento dal clic su una barra o
// su una riga delle due verifiche (link dettaglio-intervento-smp con l'anno, dettaglio-intervento-smp-sigc con
// l'esercizio) e i link verso l'elenco operativo, solo col grant della pagina di arrivo (OP-IS-09). Gli indirizzi li
// costruiscono le funzioni pure di lib/collegamenti.
import { useLocation, useNavigate } from 'react-router';
import { codiceDelPercorso, tipoIntervento } from '../../../entities/filtri';
import { hasGrant, useAuthStatus } from '../../../shared/api/auth/use-auth-status';
import { codiceDalClic, percorsoConSigc, sigcDaRicerca } from '../../../shared/lib';
import type { FiltroSigc } from '../../../shared/lib';
import { useValoriFiltri } from '../api';
import type { ClicGrafico } from '../../../shared/ui';
import { puoLeggere } from '../lib/grant';
import { pagineVisibili } from '../lib/pagine';
import type { LinkDato } from '../lib/verifica';

/** L'indirizzo della voce "Istituzionale" del percorso: la prima pagina dell'area che il profilo puo' aprire, col filtro SIGC. */
export function useIngressoArea(): string | undefined {
  const auth = useAuthStatus().data;
  // il filtro SIGC della pagina resta tornando all'ingresso dell'area, come nel menu (R01; review step9 V2-19)
  const sigc = sigcDaRicerca(useLocation().search);
  const percorso = pagineVisibili((g) => hasGrant(auth, g))[0]?.percorso;
  return percorso && percorsoConSigc(percorso, sigc);
}

/**
 * Il dettaglio dell'intervento all'indirizzo dato dalla pagina (percorsoIntervento con l'anno, percorsoInterventoSigc con
 * l'esercizio); un clic fuori dai codici non naviga.
 */
export function useApriIntervento(percorso: (codice: string) => string) {
  const naviga = useNavigate();
  const apri = (codice: string) => void naviga(percorso(codice));
  const dalClic = (p: ClicGrafico) => {
    const codice = codiceDelPercorso(codiceDalClic(p));
    if (codice !== null) apri(codice);
  };
  return { apri, dalClic };
}

/**
 * La classificazione SIGC degli interventi (VoceFiltro.perimetro dei valori dei filtri, letti col loro grant: stessa cache
 * della pagina); null se non e' nota. Decide il link della spesa non SIGC (review K-02).
 */
export function useTipoDegliInterventi(): (codice: string) => FiltroSigc | null {
  const auth = useAuthStatus().data;
  const voci = useValoriFiltri(puoLeggere(auth, 'filtri')).data?.interventi;
  return (codice) => tipoIntervento(voci, codice);
}

/** Il profilo puo' aprire la destinazione del link verso l'elenco: le domande (TX-0056) o i pagamenti (TX-0059). */
export function usePuoAprireElenco(): (l: LinkDato) => boolean {
  const auth = useAuthStatus().data;
  return (l) => puoLeggere(auth, l === 'ricevute' ? 'elencoDomande' : 'elencoPagamenti');
}
