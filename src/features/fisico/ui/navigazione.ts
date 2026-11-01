// navigazione.ts — i passaggi fra pagine del fisico come li vuole il profilo (gate di UX: il backend ridecide): l'ingresso
// dell'area per la voce "Fisico" del percorso, la prima pagina dell'area che il profilo puo' aprire. Prima solo nel
// dettaglio dell'intervento; ora anche nell'impaginazione dell'output regionale e delle Unit Amount, che si aprono con
// csr.tx-0017.read o csr.tx-0030.read mentre le superfici chiedono csr.tx-0018.read (review del riallineamento FIS-02),
// come nell'istituzionale.
import { useLocation } from 'react-router';
import { hasGrant, useAuthStatus } from '../../../shared/api/auth/use-auth-status';
import { ricercaDelSoloSigc } from '../../../shared/lib';
import { pagineVisibili } from '../lib/pagine';

/** L'indirizzo della voce "Fisico" del percorso: la prima pagina dell'area che il profilo puo' aprire, col filtro SIGC. */
export function useIngressoArea(): string | undefined {
  const auth = useAuthStatus().data;
  // il filtro SIGC della pagina resta tornando all'ingresso dell'area, come nel menu (R01; review step9 V2-19)
  const sigc = ricercaDelSoloSigc(useLocation().search);
  const percorso = pagineVisibili((g) => hasGrant(auth, g))[0]?.percorso;
  return percorso && sigc ? `${percorso}?${sigc}` : percorso;
}
