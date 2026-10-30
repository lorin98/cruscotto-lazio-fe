// Pagina /fisico/interventi/:codice (green-fe step6; flusso intervento approvato il 30/10/2026): il segmento e' il codice
// dell'intervento. Il componente della feature lo convalida prima di leggere: con un valore fuori formato (anche con '/')
// nessuna richiesta parte e la pagina lo dice; h1 col focus al cambio di route nel componente. Ci si arriva dai drawer
// delle superfici, dell'output regionale e delle Unit Amount (links dettaglio-intervento-*).
import { useParams } from 'react-router';
import { DettaglioIntervento } from '../../../features/fisico';

export default function Pagina() {
  const { codice } = useParams();
  return <DettaglioIntervento codice={codice} />;
}
