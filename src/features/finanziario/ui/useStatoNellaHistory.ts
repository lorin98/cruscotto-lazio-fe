// useStatoNellaHistory — stato di una pagina del finanziario da ritrovare tornando indietro (dall'elenco operativo o dal
// dettaglio): sta nello state della voce di history corrente (navigazione replace, l'indirizzo non cambia) insieme alla
// firma dei filtri. Vale solo per gli stessi filtri: una selezione nuova e' un dettaglio nuovo (N-01, review v2), quindi
// con filtri diversi lo stato salvato si ignora.
import { useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { ricercaDaFiltri } from '../lib/filtri';
import type { Filtri } from '../lib/filtri';

interface Salvato<T> {
  firma: string;
  valore: T;
}

export function useStatoNellaHistory<T>(chiave: string, filtri: Filtri): [T | undefined, (valore: T) => void] {
  const posizione = useLocation();
  const naviga = useNavigate();
  const firma = ricercaDaFiltri(filtri);
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
