// useStatoNellaHistory — stato di una pagina da ritrovare tornando indietro (dalla pagina di un'altra feature o da un
// dettaglio): sta nello state della voce di history corrente (navigazione replace, l'indirizzo non cambia), con una firma
// facoltativa (per esempio quella dei filtri): con una firma diversa lo stato salvato si ignora. Generico: il finanziario
// lo usa con la firma dei suoi filtri (N-01), l'elenco operativo per la vista per ambito, senza firma.
import { useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router';

interface Salvato<T> {
  firma: string;
  valore: T;
}

export function useStatoNellaHistory<T>(chiave: string, firma = ''): [T | undefined, (valore: T) => void] {
  const posizione = useLocation();
  const naviga = useNavigate();
  const stato = (posizione.state ?? null) as Record<string, unknown> | null;
  const salvato = stato?.[chiave] as Salvato<T> | undefined;
  const valore = salvato && salvato.firma === firma ? salvato.valore : undefined;
  const salva = useCallback(
    (v: T) => {
      void naviga(
        { pathname: posizione.pathname, search: posizione.search, hash: posizione.hash },
        { replace: true, state: { ...((posizione.state ?? {}) as object), [chiave]: { firma, valore: v } satisfies Salvato<T> } },
      );
    },
    [naviga, posizione, chiave, firma],
  );
  return [valore, salva];
}
