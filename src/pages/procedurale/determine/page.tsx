// Pagina /procedurale/determine/:codice? (green-fe step6; dal fisico col riallineamento degli ambiti del 29/10/2026): il
// segmento facoltativo e' il codice a barre della domanda (TX-0020). Il componente della feature lo convalida prima di
// leggere: senza codice il solo modulo di ricerca, con un valore non valido nessuna richiesta parte e il campo lo dice
// (come la scheda dell'elenco, review v1 A-01).
import { useParams } from 'react-router';
import { DetermineDellaDomanda } from '../../../features/procedurale';

export default function Pagina() {
  const { codice } = useParams();
  return <DetermineDellaDomanda codice={codice} />;
}
