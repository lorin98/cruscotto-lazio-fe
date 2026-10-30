// AnteprimaOutput — drawer di anteprima di una riga dell'output regionale (flusso output-regionale approvato, OP-FIS-11;
// dall'istituzionale col riallineamento degli ambiti del 29/10/2026): indicatore con l'unita' di misura, target di fine
// periodo, come si legge il realizzato non SIGC, il mini grafico a barre per anno delle tre misure col target come
// riferimento (una sola unita': l'intervento), con la tabella equivalente a un clic e senza scaricamento. "Apri il
// dettaglio" (link dettaglio-intervento-output) portava al dettaglio dell'istituzionale, che non ha piu' l'output: il
// dettaglio dell'intervento del fisico e il suo link sono dei passi successivi. PannelloLaterale di react-aria (dialogo:
// focus trap, Esc, ritorno del focus alla riga che l'ha aperto); dentro, lista di definizioni bootstrap-italia.
import { CardGrafico, PannelloLaterale } from '../../../shared/ui';
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
        </>
      )}
    </PannelloLaterale>
  );
}
