// InterventoNonValido — la pagina del dettaglio dell'intervento quando il codice dell'indirizzo non e' un codice di
// intervento (codiceDelPercorso null): nessuna richiesta, lo dice la pagina col titolo col focus. Sta accanto al
// controllo che la decide, come rigaDellIntervento (review H2 dell'iterazione 2 del procedurale: prima era nel kit, col
// dominio scritto dentro); la usano i dettagli dell'intervento dell'istituzionale e del procedurale, con lo stesso id del
// titolo. Classi bootstrap-italia e del kit v2; nessun react-aria.
import { Briciole, TestataDettaglio, useFocusTitolo } from '../../../shared/ui';

/** L'id dell'h1 del dettaglio dell'intervento (la testata lo usa come nome della sezione), lo stesso nei due dettagli. */
export const ID_TITOLO_INTERVENTO = 't-intervento';

interface PropsInterventoNonValido {
  /** La voce dell'area nel percorso ("Procedurale") e il suo indirizzo (la prima pagina dell'area che il profilo apre). */
  area: string;
  ingresso: string | undefined;
  /** Dove scegliere l'intervento, dopo la frase fissa (es. "Scegli l'intervento dalla panoramica o dai report procedurali."). */
  suggerimento: string;
  /** Il titolo del documento (es. "Intervento non valido - Procedurale"). */
  titoloDocumento: string;
}

/** Il codice dell'indirizzo non e' un codice di intervento: nessuna richiesta, lo dice la pagina col titolo col focus. */
export function InterventoNonValido({ area, ingresso, suggerimento, titoloDocumento }: PropsInterventoNonValido) {
  const h1 = useFocusTitolo<HTMLHeadingElement>(titoloDocumento);
  return (
    <main className="ui-pagina" id="contenuto">
      <Briciole voci={[{ etichetta: area, a: ingresso }, { etichetta: 'Intervento' }]} />
      <TestataDettaglio idTitolo={ID_TITOLO_INTERVENTO} titolo="Intervento non valido" h1={h1} />
      <p className="alert alert-danger" role="alert">
        {`Il codice nell'indirizzo non è un codice di intervento: nessun dato richiesto. ${suggerimento}`}
      </p>
    </main>
  );
}
