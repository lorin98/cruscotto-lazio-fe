// Dettaglio — le parti comuni delle pagine di dettaglio che compongono piu' letture dei report filtrate sull'oggetto
// della route (il dettaglio dell'intervento dell'istituzionale e del procedurale; review H1 del procedurale, prima copiate
// nelle due feature): la pagina del codice non valido nell'indirizzo (nessuna richiesta), l'errore di ogni lettura senza
// risposta registrato una volta nell'avviso della pagina, e il corpo secondo lo stato delle letture (useStatoDelDettaglio).
// Classi bootstrap-italia e del kit v2; nessun react-aria.
import type { ReactNode } from 'react';
import { senzaRisposta } from '../../lib/dettaglio';
import type { LetturaConErrore, StatoDettaglio } from '../../lib/dettaglio';
import { useFocusTitolo } from '../focus';
import { ErroreNellaPagina, useErroreNellaPagina } from '../stati/AvvisoPagina';
import { Caricamento } from '../stati/StatiVista';
import { Briciole, TestataDettaglio } from './Testata';

interface PropsNonValida {
  /** La voce dell'area nel percorso ("Procedurale") e il suo indirizzo (la prima pagina dell'area che il profilo apre). */
  area: string;
  ingresso: string | undefined;
  /** Dove scegliere l'intervento, dopo la frase fissa (es. "Scegli l'intervento dalla panoramica o dai report procedurali."). */
  suggerimento: string;
  /** Il titolo del documento (es. "Intervento non valido - Procedurale"). */
  titoloDocumento: string;
}

/** Il codice dell'indirizzo non e' un codice di intervento: nessuna richiesta, lo dice la pagina col titolo col focus. */
export function IntestazioneNonValida({ area, ingresso, suggerimento, titoloDocumento }: PropsNonValida) {
  const h1 = useFocusTitolo<HTMLHeadingElement>(titoloDocumento);
  return (
    <main className="ui-pagina" id="contenuto">
      <Briciole voci={[{ etichetta: area, a: ingresso }, { etichetta: 'Intervento' }]} />
      <TestataDettaglio idTitolo="t-intervento" titolo="Intervento non valido" h1={h1} />
      <p className="alert alert-danger" role="alert">
        {`Il codice nell'indirizzo non è un codice di intervento: nessun dato richiesto. ${suggerimento}`}
      </p>
    </main>
  );
}

/** L'errore di una lettura senza risposta, registrato nell'avviso della pagina finche' dura (con Riprova). */
function ErroreDellaLettura({ lettura }: { lettura: LetturaConErrore | null }) {
  useErroreNellaPagina(senzaRisposta(lettura), lettura?.error, () => lettura?.refetch());
  return null;
}

/**
 * Le letture della pagina che non hanno risposto: l'errore lo dice subito, una volta e con Riprova, l'avviso della pagina
 * (anche se la scheda della lettura non e' aperta); le parti mostrano il testo statico. Le letture in un ordine fisso
 * (null = senza il grant).
 */
export function ErroriDelleLetture({ letture }: { letture: readonly (LetturaConErrore | null)[] }) {
  return (
    <>
      {letture.map((l, n) => (
        <ErroreDellaLettura key={n} lettura={l} />
      ))}
    </>
  );
}

/** Il corpo secondo lo stato delle letture: scheletro, errore (detto dall'avviso della pagina), il vuoto dato, i dati. */
export function CorpoDelDettaglio({ stato, vuoto, children }: { stato: StatoDettaglio; vuoto: ReactNode; children: ReactNode }) {
  if (stato === 'caricamento') return <Caricamento alto />;
  if (stato === 'errore') return <ErroreNellaPagina />;
  return <>{stato === 'vuoto' ? vuoto : children}</>;
}
