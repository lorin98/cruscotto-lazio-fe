// Pagina /finanziario/interventi/:codice (UI v2, flusso panoramica): dettaglio dell'intervento. Il codice della route e'
// validato con il formato dei filtri: un codice non valido non genera richieste. Titolo (h1, focus, titolo del documento)
// sempre della pagina, anche in caricamento, in errore o senza grant; nella barra il solo intervento, fisso. L'indirizzo
// porta la selezione da cui si e' arrivati: breadcrumb, menu e "Torna al riepilogo" la conservano (N-03); breadcrumb e
// "Torna al riepilogo" riportano anche ricerca, ordine e pagina del riepilogo da cui si e' arrivati (review v4 X-04).
import { useParams } from 'react-router';
import { DETTAGLIO_INTERVENTO, DettaglioIntervento, PERCORSI, codiceInterventoValido, useDescrizioneIntervento, useStatoDelRiepilogo, voceDi } from '../../../features/finanziario';

const AL_RIEPILOGO = { etichetta: voceDi(PERCORSI.riepilogo)?.titolo ?? 'Riepilogo per intervento', a: PERCORSI.riepilogo };
import { PaginaFinanziario } from '../../../widgets/report-finanziario';

export default function Pagina() {
  const { codice } = useParams();
  const valido = codiceInterventoValido(codice);
  const descrizione = useDescrizioneIntervento(valido ? codice : undefined);
  const alRiepilogo = { ...AL_RIEPILOGO, stato: useStatoDelRiepilogo() };
  if (!valido) {
    return (
      <PaginaFinanziario percorso={DETTAGLIO_INTERVENTO.percorso} conBarraFiltri={false} titolo="Intervento non valido" titoloDocumento="Intervento non valido" briciole={[alRiepilogo, { etichetta: 'Intervento' }]}>
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
      briciole={[alRiepilogo, { etichetta: codice }]}
    >
      {(filtri) => <DettaglioIntervento codice={codice} selezione={filtri} />}
    </PaginaFinanziario>
  );
}
