// navigazione.ts — i passaggi fra pagine del fisico come li vuole il profilo (gate di UX: il backend ridecide): l'ingresso
// dell'area per la voce "Fisico" del percorso, la prima pagina dell'area che il profilo puo' aprire. Prima solo nel
// dettaglio dell'intervento; ora anche nell'impaginazione dell'output regionale e delle Unit Amount, che si aprono con
// csr.tx-0017.read o csr.tx-0030.read mentre le superfici chiedono csr.tx-0018.read (review del riallineamento FIS-02),
// come nell'istituzionale.
import { hasGrant, useAuthStatus } from '../../../shared/api/auth/use-auth-status';
import { pagineVisibili } from '../lib/pagine';

/** L'indirizzo della voce "Fisico" del percorso: la prima pagina dell'area che il profilo puo' aprire. */
export function useIngressoArea(): string | undefined {
  const auth = useAuthStatus().data;
  return pagineVisibili((g) => hasGrant(auth, g))[0]?.percorso;
}
