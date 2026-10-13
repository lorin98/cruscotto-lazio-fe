// Pagina /elenco-operativo/domande/:tipo/:codiceABarre (green-fe step6): i parametri del percorso identificano la domanda
// (TX-0058). La scheda li convalida (riferimentoValido) prima di leggere: con un valore non valido nessuna richiesta parte
// e la pagina lo dice, con il ritorno all'elenco (review v1 A-01).
import { useParams } from 'react-router';
import { SchedaDomanda } from '../../../features/elenco-operativo';

export default function Pagina() {
  const { tipo, codiceABarre } = useParams();
  return <SchedaDomanda tipo={tipo} codiceABarre={codiceABarre} />;
}
