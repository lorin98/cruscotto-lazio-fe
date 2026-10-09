// UltimoAggiornamento — pill "Dati al ..." nella barra dei filtri (NFR-25 b, OP-FE-04, UI v2): la data fino a cui TUTTI i
// flussi sono aggiornati (la conclusione meno recente), e nel popover una voce per flusso d'import. I dati arrivano con
// TX-0001 (la stessa lettura, in cache, del pannello dei filtri): senza il suo grant la pill non c'e'. In caricamento
// non si mostra; in errore la data risulta non disponibile; un backend che non porta ancora il campo non fa dire
// "nessuna acquisizione conclusa".
import { Button, Dialog, DialogTrigger, Popover } from 'react-aria-components';
import { hasGrant, useAuthStatus } from '../../../shared/api/auth/use-auth-status';
import { formatDataOra } from '../../../shared/lib/format';
import { Icona } from '../../../shared/ui';
import { useFiltri } from '../api';
import { etichettaFlusso, menoRecente, testoUltimiDati } from '../lib/aggiornamento';
import { GRANT } from '../lib/report';

export function UltimoAggiornamento() {
  const abilitato = hasGrant(useAuthStatus().data, GRANT.filtri);
  const { data, isError } = useFiltri(abilitato);
  if (!abilitato) return null;
  if (isError) return <span className="ui-pill">Ultimo dato sincronizzato: non disponibile</span>;
  const voci = data?.ultimiDatiSincronizzati;
  if (!voci) return null;
  const recente = menoRecente(voci);
  if (!recente) return <span className="ui-pill">{`Ultimo dato sincronizzato: ${testoUltimiDati(voci)}`}</span>;
  return (
    <DialogTrigger>
      <Button className="ui-pill ui-pill--bottone" aria-label={`Ultimo dato sincronizzato: dati al ${formatDataOra(recente).slice(0, 10)} per tutti i flussi. Mostra il dettaglio per flusso`}>
        <Icona nome="it-refresh" />
        {`Dati al ${formatDataOra(recente).slice(0, 10)}`}
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
