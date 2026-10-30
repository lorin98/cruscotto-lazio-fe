// navigazione.ts — i passaggi fra pagine dell'istituzionale come li vuole il profilo (gate di UX: il backend ridecide):
// l'ingresso dell'area per il percorso (la prima pagina visibile), il dettaglio dell'intervento dal clic su una barra o
// su una riga delle due verifiche (link dettaglio-intervento-smp con l'anno, dettaglio-intervento-smp-sigc con
// l'esercizio) e i link verso l'elenco operativo, solo col grant della pagina di arrivo (OP-IS-09). Gli indirizzi li
// costruiscono le funzioni pure di lib/collegamenti.
import { useNavigate } from 'react-router';
import { codiceDelPercorso } from '../../../entities/filtri';
import { hasGrant, useAuthStatus } from '../../../shared/api/auth/use-auth-status';
import { codiceDalClic } from '../../../shared/lib';
import type { ClicGrafico } from '../../../shared/ui';
import { puoLeggere } from '../lib/grant';
import { pagineVisibili } from '../lib/pagine';
import type { LinkDato } from '../lib/verifica';

/** L'indirizzo della voce "Istituzionale" del percorso: la prima pagina dell'area che il profilo puo' aprire. */
export function useIngressoArea(): string | undefined {
  const auth = useAuthStatus().data;
  return pagineVisibili((g) => hasGrant(auth, g))[0]?.percorso;
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

/** Il profilo puo' aprire la destinazione del link verso l'elenco: le domande (TX-0056) o i pagamenti (TX-0059). */
export function usePuoAprireElenco(): (l: LinkDato) => boolean {
  const auth = useAuthStatus().data;
  return (l) => puoLeggere(auth, l === 'ricevute' ? 'elencoDomande' : 'elencoPagamenti');
}
