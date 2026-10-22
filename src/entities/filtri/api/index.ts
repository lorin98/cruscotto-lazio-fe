// api/index.ts — confine api/ dell'entity filtri (green-fe step3): la lettura dei valori dei filtri, TX-0060 della slice
// elenco-operativo (RA006), condivisa dalle feature che la usano (decisione G2 dell'utente del 21/10/2026: l'elenco
// operativo per il suo pannello e per l'atto di concessione della scheda, il fisico per il pannello delle superfici).
// Prima stava nell'api/ dell'elenco: una feature non importa da un'altra, quindi la lettura comune sta qui, con UNA sola
// query-key (quella della factory generata, dentro l'hook orval) e quindi una sola cache per tutte le pagine.
// Nessun onError: chi legge rende l'errore (getErrorMessage) o il suo ripiego. La lettura e' gated dal grant
// csr.tx-0060.read di chi chiama (`abilitato`): gate di UX, l'enforcement e' del backend.
import { useTx0060 } from '../../../shared/api/generated/elenco-operativo/elenco-operativo/elenco-operativo';

export type { ValoriFiltriElenco, VoceFiltro } from '../../../shared/api/generated/elenco-operativo/aRSCSRBootstrapPostgresAPI.schemas';

// TX-0060 (RA006): valori dei filtri nel perimetro del chiamante. `abilitato` falso: nessuna lettura (profilo senza il
// grant dei filtri, o pagina che non ne ha bisogno).
export const useValoriFiltri = (abilitato = true) => useTx0060({ query: { enabled: abilitato } });
