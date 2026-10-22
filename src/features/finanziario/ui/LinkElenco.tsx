// LinkElenco — drill-down dai report del finanziario all'elenco operativo (uiplan links[] con target_feature
// elenco-operativo, D-2 di MIN-20261012): il link porta i filtri correnti e i criteri del punto cliccato e si mostra solo a
// chi ha il grant della lettura di destinazione (gate di UX come il menu: il backend ridecide). Il link reso e' quello
// comune di entities/domanda (ApriNellElenco, usato anche dall'istituzionale), riesportato qui per i report della feature.
import { useCallback } from 'react';
import { useNavigate } from 'react-router';
import { hasGrant, useAuthStatus } from '../../../shared/api/auth/use-auth-status';
import type { Filtri } from '../lib/filtri';
import { grantDelLink, indirizzoDelLink } from '../lib/link-elenco';
import type { CriteriLink, IdLinkElenco } from '../lib/link-elenco';

export { ApriNellElenco } from '../../../entities/domanda';

/**
 * Indirizzo del link per il profilo corrente: null senza il grant della destinazione (o con l'autenticazione in corso), con
 * criteri null (il punto cliccato non si puo' esprimere nei parametri dell'elenco) o con un criterio fuori formato.
 */
export function useLinkElenco(filtri: Filtri): (id: IdLinkElenco, criteri?: CriteriLink | null) => string | null {
  const auth = useAuthStatus().data;
  return useCallback(
    (id, criteri) => (criteri === null || !hasGrant(auth, grantDelLink(id)) ? null : indirizzoDelLink(id, filtri, criteri)),
    [auth, filtri],
  );
}

/** Navigazione dal clic su un grafico: nessun effetto senza il grant o senza criteri (clic fuori dai dati). */
export function useApriNellElenco(filtri: Filtri): (id: IdLinkElenco, criteri: CriteriLink | null) => void {
  const link = useLinkElenco(filtri);
  const naviga = useNavigate();
  return useCallback(
    (id, criteri) => {
      const indirizzo = link(id, criteri);
      if (indirizzo) void naviga(indirizzo);
    },
    [link, naviga],
  );
}

