// Pagina /finanziario/interventi/:codice (UI v2, flusso panoramica): dettaglio dell'intervento. Il codice della route e'
// validato con il formato dei filtri: un codice non valido non genera richieste. Titolo (h1, focus, titolo del documento)
// sempre della pagina, anche in caricamento, in errore o senza grant; nella barra il solo intervento, fisso.
import { useParams } from 'react-router';
import { DETTAGLIO_INTERVENTO, DettaglioIntervento, PERCORSI, codiceInterventoValido, useDescrizioneIntervento, voceDi } from '../../../features/finanziario';

const AL_RIEPILOGO = { etichetta: voceDi(PERCORSI.riepilogo)?.titolo ?? 'Riepilogo per intervento', a: PERCORSI.riepilogo };
import { PaginaFinanziario } from '../../../widgets/report-finanziario';

export default function Pagina() {
  const { codice } = useParams();
  const valido = codiceInterventoValido(codice);
  const descrizione = useDescrizioneIntervento(valido ? codice : undefined);
  if (!valido) {
    return (
      <PaginaFinanziario percorso={DETTAGLIO_INTERVENTO.percorso} conBarraFiltri={false} titolo="Intervento non valido" titoloDocumento="Intervento non valido" briciole={[AL_RIEPILOGO, { etichetta: 'Intervento' }]}>
        {() => <p role="alert">{"Il codice nell'indirizzo non è un codice di intervento. Scegli l'intervento dal riepilogo o dalla ricerca."}</p>}
      </PaginaFinanziario>
    );
  }
  return (
    <PaginaFinanziario
      percorso={DETTAGLIO_INTERVENTO.percorso}
      chipFissi={[{ chiave: `intervento:${codice}`, etichetta: 'Intervento', valore: codice }]}
      titolo={descrizione ?? `Intervento ${codice}`}
      titoloDocumento={codice}
      briciole={[AL_RIEPILOGO, { etichetta: codice }]}
    >
      {() => <DettaglioIntervento codice={codice} />}
    </PaginaFinanziario>
  );
}
