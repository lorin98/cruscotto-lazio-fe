// Pagina /procedurale/interventi/:codice (green-fe step6, flusso panoramica): il segmento e' il codice dell'intervento.
// Il componente della feature lo convalida prima di leggere: con un valore fuori formato (anche con '/') nessuna
// richiesta parte e la pagina lo dice; h1 col focus al cambio di route nel componente. Lo stato area programmazione sta
// nell'indirizzo.
import { useParams } from 'react-router';
import { DettaglioIntervento } from '../../../features/procedurale';

export default function Pagina() {
  const { codice } = useParams();
  return <DettaglioIntervento codice={codice} />;
}
