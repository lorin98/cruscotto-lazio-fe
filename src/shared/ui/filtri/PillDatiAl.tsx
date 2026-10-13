// PillDatiAl — pill "Dati al ..." della barra dei filtri (NFR-25 b; OP-FE-04 del finanziario, OP-EO-01 dell'elenco): la
// data fino a cui TUTTI i flussi sono aggiornati (la conclusione meno recente) e nel popover una voce per flusso d'import.
// Una sola pill per le feature (review v1 H-07): chi la usa passa le voci della risposta che le porta e se quella
// risposta e' in errore. In caricamento (voci assenti) non si mostra; in errore la data risulta non disponibile.
import { Button, Dialog, DialogTrigger, Popover } from 'react-aria-components';
import { etichettaFlusso, formatDataOra, formatGiorno, menoRecente, testoUltimiDati } from '../../lib';
import type { UltimoDato } from '../../lib';
import { Icona } from '../icona';

export function PillDatiAl({ voci, inErrore = false }: { voci: readonly UltimoDato[] | undefined; inErrore?: boolean }) {
  if (inErrore && !voci) return <span className="ui-pill">Ultimo dato sincronizzato: non disponibile</span>;
  if (!voci) return null;
  const recente = menoRecente(voci);
  if (!recente) return <span className="ui-pill">{`Ultimo dato sincronizzato: ${testoUltimiDati(voci)}`}</span>;
  return (
    <DialogTrigger>
      <Button className="ui-pill ui-pill--bottone" aria-label={`Ultimo dato sincronizzato: dati al ${formatGiorno(recente)} per tutti i flussi. Mostra il dettaglio per flusso`}>
        <Icona nome="it-refresh" />
        {`Dati al ${formatGiorno(recente)}`}
      </Button>
      <Popover placement="bottom end" className="ui-pop__corpo">
        <Dialog aria-label="Ultimo dato sincronizzato per flusso d'import">
          <strong>Ultimo dato sincronizzato</strong>
          <ul>
            {voci
              .filter((v) => v.flusso && v.conclusoIl)
              .map((v) => (
                <li key={v.flusso}>
                  <span>{etichettaFlusso(v.flusso ?? '')}</span>
                  <span>{formatDataOra(v.conclusoIl)}</span>
                </li>
              ))}
          </ul>
        </Dialog>
      </Popover>
    </DialogTrigger>
  );
}
