// AnteprimaOutput — drawer di anteprima di una riga dell'output regionale (flusso output-regionale approvato, OP-IS-06):
// indicatore con l'unita' di misura, target di fine periodo, come si legge il realizzato non SIGC, il mini grafico a barre
// per anno delle tre misure col target come riferimento (una sola unita': l'intervento), con la tabella equivalente a un
// clic e senza scaricamento (il grafico per anno col PNG e' nel dettaglio), e "Apri il dettaglio"
// (link:dettaglio-intervento-output). PannelloLaterale di react-aria (dialogo: focus trap, Esc, ritorno del focus alla
// riga che l'ha aperto); dentro, lista di definizioni e link bootstrap-italia.
import { Link } from 'react-router';
import { CardGrafico, PannelloLaterale } from '../../../shared/ui';
import { percorsoIntervento } from '../lib/collegamenti';
import type { RigaOutput } from '../lib/dto';
import { graficoOutputPerAnno } from '../lib/grafici';
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

export function AnteprimaOutput({ riga, cumulativo, onChiudi }: { riga: RigaOutput | null; cumulativo: boolean; onChiudi: () => void }) {
  const codice = riga?.codiceIntervento ?? '';
  return (
    <PannelloLaterale aperto={riga !== null} onChiudi={onChiudi} titolo={`Anteprima: ${codice}`} stretto>
      {riga && (
        <>
          <Voci riga={riga} cumulativo={cumulativo} />
          <CardGrafico titolo={`Output di ${codice} per anno`} livello={3} altezza="mini" dati={graficoOutputPerAnno(riga, cumulativo)} fonte={FONTE} senzaPng />
          <Link className="btn btn-primary mt-3 w-100" to={percorsoIntervento(codice)}>
            Apri il dettaglio
          </Link>
        </>
      )}
    </PannelloLaterale>
  );
}
