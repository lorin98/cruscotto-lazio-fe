// useRigheContesto — le righe di contesto della pagina per l'intestazione del PNG dei grafici (NFR-50, review v3 V-01),
// che la pagina mette in ContestoIntestazione: i criteri applicati, il perimetro dei dati, il profilo della sessione e
// l'ultimo dato sincronizzato. Prima in tre copie, nel finanziario, nel fisico e nell'istituzionale (review H7
// dell'istituzionale). Le righe restano lo stesso oggetto finche' non cambiano i loro dati (memo sul testo dei criteri).
import { useMemo } from 'react';
import { useAuthStatus } from '../../api/auth/use-auth-status';
import { righeContesto } from '../../lib/intestazione';
import type { UltimoDato } from '../../lib/aggiornamento';

/**
 * `criteri`: "Etichetta: valore" di ogni criterio applicato; `ultimi` assente = non letto (grant mancante, errore, attesa);
 * `perimetro`: gia' in parole (es. "regionale"), assente = la riga non c'e'.
 */
export function useRigheContesto(criteri: readonly string[], ultimi: readonly UltimoDato[] | undefined, perimetro?: string | null): readonly string[] {
  const profilo = useAuthStatus().data?.user?.profile;
  const chiave = criteri.join('\n');
  return useMemo(() => righeContesto({ filtri: chiave ? chiave.split('\n') : [], profilo, ultimi, perimetro }), [chiave, profilo, ultimi, perimetro]);
}
