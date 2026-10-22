// Pagina /istituzionale/interventi/:codice (green-fe step6): il segmento e' il codice dell'intervento (flusso intervento).
// Il componente della feature lo convalida prima di leggere: con un valore fuori formato (anche con '/') nessuna
// richiesta parte e la pagina lo dice; h1 col focus al cambio di route nel componente.
import { useParams } from 'react-router';
import { DettaglioIntervento } from '../../../features/istituzionale';

export default function Pagina() {
  const { codice } = useParams();
  return <DettaglioIntervento codice={codice} />;
}
