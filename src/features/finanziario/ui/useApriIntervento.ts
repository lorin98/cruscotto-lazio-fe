// useApriIntervento — drill-down verso il dettaglio di un intervento, uguale da ogni grafico e tabella: il dettaglio legge
// solo l'intervento della route, ma l'indirizzo conserva la selezione dell'utente, cosi' breadcrumb, menu e "Torna al
// riepilogo" la ritrovano. Il clic su un elemento che non e' un codice di intervento (una famiglia, una fase) non naviga.
import { useNavigate } from 'react-router';
import { codiceDalClic } from '../../../shared/lib';
import type { ClicGrafico } from '../../../shared/ui';
import type { Filtri } from '../lib/filtri';
import { codiceInterventoValido, conFiltri, percorsoIntervento } from '../lib/report';

export function useApriIntervento(filtri: Filtri) {
  const naviga = useNavigate();
  const apri = (codice: string) => void naviga(conFiltri(percorsoIntervento(codice), filtri));
  const dalClic = (p: ClicGrafico) => {
    const codice = codiceDalClic(p);
    if (codiceInterventoValido(codice)) apri(codice);
  };
  return { apri, dalClic };
}
