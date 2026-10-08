// UltimoAggiornamento — riga "Ultimo dato sincronizzato" sotto il titolo di ogni pagina del finanziario (NFR-25 b, OP-FE-04,
// wireframe riapprovati). I dati arrivano con TX-0001, la stessa lettura (in cache) di FiltriAttivi: senza il suo grant la riga
// non c'e'. In caricamento non si mostra nulla; in errore la data risulta non disponibile; un backend che non porta ancora il
// campo non fa dire "nessuna acquisizione conclusa".
import { hasGrant, useAuthStatus } from '../../../shared/api/auth/use-auth-status';
import { useFiltri } from '../api';
import { testoUltimiDati } from '../lib/aggiornamento';

export function UltimoAggiornamento() {
  const abilitato = hasGrant(useAuthStatus().data, 'csr.tx-0001.read');
  const { data, isError } = useFiltri(abilitato);
  if (!abilitato) return null;
  if (data?.ultimiDatiSincronizzati) {
    return <p className="small mb-2">Ultimo dato sincronizzato: {testoUltimiDati(data.ultimiDatiSincronizzati)}.</p>;
  }
  if (isError) return <p className="small mb-2">Ultimo dato sincronizzato: non disponibile.</p>;
  return null;
}
