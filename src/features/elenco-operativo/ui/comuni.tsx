// comuni — pezzi comuni delle due pagine dell'interrogazione: barra dei filtri con perimetro e data dell'ultimo dato,
// avviso di aggiornamento (i dati precedenti restano, ADR 0029), stato vuoto che porta al pannello dei filtri.
import type { ChipFiltro } from '../../../shared/ui';
import { BarraFiltri } from '../../../shared/ui';
import type { UltimoDato } from '../../../shared/lib';
import { DatiAl, PerimetroElenco } from './pill';

export function BarraInterrogazione({
  chip,
  onApri,
  onTogliTutti,
  vuoto,
  perimetro,
  ultimi,
}: {
  chip: ChipFiltro[];
  onApri?: () => void;
  onTogliTutti: () => void;
  vuoto: string;
  perimetro: string | null | undefined;
  ultimi: readonly UltimoDato[] | undefined;
}) {
  return (
    <BarraFiltri
      chip={chip}
      onApri={onApri}
      onTogliTutti={onTogliTutti}
      vuoto={vuoto}
      destra={
        <>
          <PerimetroElenco perimetro={perimetro} />
          <DatiAl voci={ultimi} />
        </>
      }
    />
  );
}

export function AvvisoAggiornamento({ attivo }: { attivo: boolean }) {
  return attivo ? (
    <p className="ui-aggiornamento" role="status">
      Aggiornamento dei risultati: restano visibili quelli precedenti finché arrivano i nuovi.
    </p>
  ) : null;
}

export function VuotoFiltri({ testo, onApriFiltri }: { testo: string; onApriFiltri?: () => void }) {
  return (
    <>
      {testo}{' '}
      {onApriFiltri && (
        <button type="button" className="btn btn-primary btn-sm" onClick={onApriFiltri}>
          Modifica i filtri
        </button>
      )}
    </>
  );
}
