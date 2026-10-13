// useStatoNellaHistory — stato di una pagina da ritrovare tornando indietro (dalla pagina di un'altra feature o da un
// dettaglio): sta nello state della voce di history corrente (navigazione replace, l'indirizzo non cambia), con una firma
// (per esempio quella dei filtri): con una firma diversa lo stato salvato si ignora. Generico: lo usano il finanziario,
// con la firma dei suoi filtri (N-01), e l'elenco operativo per vista per ambito e colonne scelte, con una firma fissa
// (i filtri dell'elenco stanno nell'indirizzo; review v2 A-04, V-03). Lo state della history e' `unknown` (chiunque
// nella stessa origine puo' scriverlo): il predicato `valido` e' obbligatorio e un valore che non lo soddisfa vale come
// assente (review v4 H-05, iter3 A-02).
// Le altre chiavi dello state restano (lo stato di un'altra parte della pagina, o quello da riportare indietro).
// L'involucro { firma, valore } e la sua lettura stanno in shared/lib (stato-history), condivisi con chi porta lo stato
// in un link (review v1 iter3 H-02).
import { useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { conStatoSalvato, leggiStatoSalvato } from '../lib';

export function useStatoNellaHistory<T>(chiave: string, firma: string, valido: (v: unknown) => v is T): [T | undefined, (valore: T) => void] {
  const posizione = useLocation();
  const naviga = useNavigate();
  const valore = leggiStatoSalvato(posizione.state, chiave, firma, valido);
  const salva = useCallback(
    (v: T) => {
      void naviga({ pathname: posizione.pathname, search: posizione.search, hash: posizione.hash }, { replace: true, state: conStatoSalvato(posizione.state, chiave, firma, v) });
    },
    [naviga, posizione, chiave, firma],
  );
  return [valore, salva];
}
