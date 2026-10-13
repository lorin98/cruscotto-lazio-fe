// LinkElenco — drill-down dai report del finanziario all'elenco operativo (uiplan links[] con target_feature
// elenco-operativo, D-2 di MIN-20261012): il link porta i filtri correnti e i criteri del punto cliccato e si mostra solo a
// chi ha il grant della lettura di destinazione (gate di UX come il menu: il backend ridecide). Dentro una riga
// apribile e' la riga a ignorare i clic e i tasti nati dal link (shared/ui/tabella/rigaApribile): il link non ferma la
// propagazione, cosi' Esc e il focus trap del pannello che lo contiene continuano a funzionare.
import { useCallback } from 'react';
import { Link, useNavigate } from 'react-router';
import { hasGrant, useAuthStatus } from '../../../shared/api/auth/use-auth-status';
import type { Filtri } from '../lib/filtri';
import { grantDelLink, indirizzoDelLink } from '../lib/link-elenco';
import type { CriteriLink, IdLinkElenco } from '../lib/link-elenco';

/** Indirizzo del link per il profilo corrente: null senza il grant della destinazione (o con l'autenticazione in corso). */
export function useLinkElenco(filtri: Filtri): (id: IdLinkElenco, criteri?: CriteriLink) => string | null {
  const auth = useAuthStatus().data;
  return useCallback((id, criteri) => (hasGrant(auth, grantDelLink(id)) ? indirizzoDelLink(id, filtri, criteri) : null), [auth, filtri]);
}

/** Navigazione dal clic su un grafico: nessun effetto senza il grant o senza criteri (clic fuori dai dati). */
export function useApriNellElenco(filtri: Filtri): (id: IdLinkElenco, criteri: CriteriLink | null) => void {
  const link = useLinkElenco(filtri);
  const naviga = useNavigate();
  return useCallback(
    (id, criteri) => {
      const indirizzo = criteri === null ? null : link(id, criteri);
      if (indirizzo) void naviga(indirizzo);
    },
    [link, naviga],
  );
}

/**
 * Link "Apri nell'elenco": `descrizione` completa il nome accessibile ("Apri nell'elenco operativo le domande ...");
 * `testo` sostituisce l'etichetta visibile (es. "righe di pagamento, importi lordi") e apre il nome accessibile, che
 * contiene sempre il testo visibile (WCAG 2.5.3). Senza indirizzo non rende nulla.
 */
export function ApriNellElenco({ indirizzo, descrizione, testo, variante = 'pulsante' }: { indirizzo: string | null; descrizione: string; testo?: string; variante?: 'pulsante' | 'testo' }) {
  if (!indirizzo) return null;
  const nome = testo ? `${testo}: apri nell'elenco operativo ${descrizione}` : `Apri nell'elenco operativo ${descrizione}`;
  return (
    <Link className={variante === 'pulsante' ? 'btn btn-outline-primary btn-sm' : 'ui-link-elenco'} to={indirizzo} aria-label={nome}>
      {testo ?? "Apri nell'elenco"}
    </Link>
  );
}
