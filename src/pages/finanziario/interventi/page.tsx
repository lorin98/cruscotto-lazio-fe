// Pagina /finanziario/interventi/:codice (UI v2, flusso panoramica): dettaglio dell'intervento. Il codice della route e'
// validato con il formato dei filtri: un codice non valido non genera richieste.
import { useParams } from 'react-router';
import { DETTAGLIO_INTERVENTO, DettaglioIntervento, codiceInterventoValido } from '../../../features/finanziario';
import { useFocusTitolo } from '../../../shared/ui';
import { PaginaFinanziario } from '../../../widgets/report-finanziario';

function CodiceNonValido() {
  const h1 = useFocusTitolo<HTMLHeadingElement>('Intervento non valido - Finanziario');
  return (
    <div className="ui-titolo">
      <div>
        <h1 ref={h1} tabIndex={-1}>
          Intervento non valido
        </h1>
        <p role="alert">{"Il codice nell'indirizzo non è un codice di intervento. Scegli l'intervento dal riepilogo o dalla ricerca."}</p>
      </div>
    </div>
  );
}

export default function Pagina() {
  const { codice } = useParams();
  const valido = codiceInterventoValido(codice);
  return (
    <PaginaFinanziario
      percorso={DETTAGLIO_INTERVENTO.percorso}
      senzaTitolo
      briciole={[{ etichetta: 'Riepilogo per intervento', a: '/finanziario/riepilogo' }, { etichetta: valido ? codice : 'Intervento' }]}
    >
      {() => (valido ? <DettaglioIntervento codice={codice} /> : <CodiceNonValido />)}
    </PaginaFinanziario>
  );
}
