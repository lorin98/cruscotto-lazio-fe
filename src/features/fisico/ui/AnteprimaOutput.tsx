// AnteprimaOutput — drawer di anteprima di una riga dell'output regionale (flusso output-regionale approvato, OP-FIS-11;
// dall'istituzionale col riallineamento degli ambiti del 29/10/2026): l'intervento con la descrizione dalle voci di TX-0060
// (senza, il solo codice), indicatore con l'unita' di misura, target di fine
// periodo, come si legge il realizzato non SIGC, il mini grafico a barre per anno delle tre misure col target come
// riferimento (una sola unita': l'intervento), con la tabella equivalente a un clic e senza scaricamento (il grafico per
// anno col PNG e' nel dettaglio), e "Apri il dettaglio" (link dettaglio-intervento-output, flusso intervento del
// 30/10/2026): il dettaglio dell'intervento del fisico, solo col grant di una delle sue letture; e' un link vero, il focus va
// sul titolo del dettaglio dopo il cambio di route. PannelloLaterale di react-aria (dialogo: focus trap, Esc, ritorno del
// focus alla riga che l'ha aperto se si chiude senza navigare); dentro, lista di definizioni e link bootstrap-italia.
import { Link } from 'react-router';
import { useAuthStatus } from '../../../shared/api/auth/use-auth-status';
import { CardGrafico, PannelloLaterale } from '../../../shared/ui';
import { percorsoIntervento } from '../lib/collegamenti';
import type { RigaOutput } from '../lib/dto';
import { graficoOutputPerAnno } from '../lib/grafici';
import { puoAprireIntervento } from '../lib/grant';
import { vociAnteprima } from '../lib/output';

const FONTE = "Fonte: TX-0017, l'output dell'intervento anno per anno con il target di fine periodo; il realizzato non SIGC è cumulativo e quello SIGC annuale: le barre non si sommano.";

/** Indicatore, target e realizzato non SIGC della riga, come lista di definizioni. */
function Voci({ riga, cumulativo }: { riga: RigaOutput; cumulativo: boolean }) {
  return (
    <dl className="ui-dl">
      {vociAnteprima(riga, cumulativo).map((v) => (
        <div key={v.termine}>
          <dt>{v.termine}</dt>
          <dd>{v.valore}</dd>
        </div>
      ))}
    </dl>
  );
}

interface PropsAnteprima {
  riga: RigaOutput | null;
  cumulativo: boolean;
  /** La descrizione dell'intervento dalle voci di TX-0060, se lette. */
  descrizione?: string;
  onChiudi: () => void;
}

export function AnteprimaOutput({ riga, cumulativo, descrizione, onChiudi }: PropsAnteprima) {
  const codice = riga?.codiceIntervento ?? '';
  const conDettaglio = puoAprireIntervento(useAuthStatus().data);
  return (
    <PannelloLaterale aperto={riga !== null} onChiudi={onChiudi} titolo={`Anteprima: ${codice}`} stretto>
      {riga && (
        <>
          <p>{descrizione ? `${codice} - ${descrizione}` : codice}</p>
          <Voci riga={riga} cumulativo={cumulativo} />
          <CardGrafico titolo={`Output di ${codice} per anno`} livello={3} altezza="mini" dati={graficoOutputPerAnno(riga, cumulativo)} fonte={FONTE} senzaPng />
          {conDettaglio && (
            <Link className="btn btn-primary mt-3 w-100" to={percorsoIntervento(codice)}>
              Apri il dettaglio
            </Link>
          )}
        </>
      )}
    </PannelloLaterale>
  );
}
