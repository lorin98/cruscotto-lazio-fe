// Pagina /elenco-operativo/domande/:tipo/:codiceABarre (green-fe step6): i parametri del percorso identificano la domanda
// (TX-0058); la scheda valida tipo e codice prima di leggere (link costruiti da lib/collegamenti, 400 dal backend altrimenti).
import { useParams } from 'react-router';
import { SchedaDomanda } from '../../../features/elenco-operativo';

export default function Pagina() {
  const { tipo, codiceABarre } = useParams();
  return <SchedaDomanda tipo={tipo} codiceABarre={codiceABarre} />;
}
