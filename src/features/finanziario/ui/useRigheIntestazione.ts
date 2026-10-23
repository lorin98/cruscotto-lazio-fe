// useRigheIntestazione — righe di contesto per l'intestazione del PNG dei grafici (NFR-50, review v3 V-01), che la pagina
// mette in ContestoIntestazione: profilo dalla sessione, ultimo dato sincronizzato dalla lettura di TX-0001 gia' in cache
// per la barra dei filtri (senza il suo grant: "non disponibile"). Le righe le compone l'hook del kit (useRigheContesto).
import { hasGrant, useAuthStatus } from '../../../shared/api/auth/use-auth-status';
import { useRigheContesto } from '../../../shared/ui';
import { useFiltri } from '../api';
import { GRANT } from '../lib/report';

/** `filtri`: "Etichetta: valore" di ogni filtro applicato alla pagina. */
export function useRigheIntestazione(filtri: readonly string[]): readonly string[] {
  const auth = useAuthStatus();
  const abilitato = hasGrant(auth.data, GRANT.filtri);
  const ultimi = useFiltri(abilitato).data?.ultimiDatiSincronizzati;
  return useRigheContesto(filtri, abilitato ? ultimi : undefined);
}
