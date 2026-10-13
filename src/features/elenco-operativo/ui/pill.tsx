// pill — informazioni sempre visibili nella barra dei filtri dell'elenco (wireframe domande e pagamenti): il perimetro
// dichiarato dalla risposta (non rimovibile: per un P4 la propria area) e la data dell'ultimo dato sincronizzato
// (OP-EO-01: ultimiDatiSincronizzati del sinottico o della pagina dei pagamenti), come la pill del finanziario.
import { Button, Dialog, DialogTrigger, Popover } from 'react-aria-components';
import { etichettaFlusso, formatDataOra, formatGiorno, menoRecente, testoUltimiDati } from '../../../shared/lib';
import type { UltimoDato } from '../../../shared/lib';
import { Icona } from '../../../shared/ui';

export function PerimetroElenco({ perimetro }: { perimetro: string | null | undefined }) {
  if (!perimetro) return null;
  const ada = perimetro === 'ADA';
  return <span className={ada ? 'ui-pill ui-pill--evidenza' : 'ui-pill'}>{ada ? 'Perimetro: la tua area (ADA)' : 'Perimetro: regionale'}</span>;
}

/** "Dati al gg/mm/aaaa" (la conclusione meno recente: tutti i flussi sono aggiornati almeno fino a li') e il dettaglio. */
export function DatiAl({ voci }: { voci: readonly UltimoDato[] | undefined }) {
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
