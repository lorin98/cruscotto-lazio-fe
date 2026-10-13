// useRigheIntestazione — righe di contesto per l'intestazione del PNG dei grafici (NFR-50, review v3 V-01), che la pagina
// mette in ContestoIntestazione: profilo dalla sessione, ultimo dato sincronizzato dalla lettura di TX-0001 gia' in cache
// per la barra dei filtri (senza il suo grant: "non disponibile").
import { useMemo } from 'react';
import { hasGrant, useAuthStatus } from '../../../shared/api/auth/use-auth-status';
import { useFiltri } from '../api';
import { righeContesto } from '../../../shared/lib';
import { GRANT } from '../lib/report';

/** `filtri`: "Etichetta: valore" di ogni filtro applicato alla pagina. */
export function useRigheIntestazione(filtri: readonly string[]): readonly string[] {
  const auth = useAuthStatus();
  const abilitato = hasGrant(auth.data, GRANT.filtri);
  const ultimi = useFiltri(abilitato).data?.ultimiDatiSincronizzati;
  const profilo = auth.data?.user?.profile;
  const chiave = filtri.join('\n');
  return useMemo(() => righeContesto({ filtri: chiave ? chiave.split('\n') : [], profilo, ultimi: abilitato ? ultimi : undefined }), [chiave, profilo, ultimi, abilitato]);
}
