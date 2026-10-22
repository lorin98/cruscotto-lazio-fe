// comuni — pezzi comuni delle due pagine dell'interrogazione: barra dei filtri con perimetro e data dell'ultimo dato,
// ordinamento attivo dichiarato (X-02, X-04), pagina oltre l'ultima (H-01), stato vuoto che porta al pannello dei filtri,
// accesso non disponibile senza il grant della lettura (A-06). L'avviso di aggiornamento (i dati precedenti restano, ADR
// 0029) e' passato nel kit (AvvisoAggiornamento di shared/ui), usato anche dall'istituzionale.
import type { ChipFiltro } from '../../../shared/ui';
import { BarraFiltri, Caricamento, PillDatiAl } from '../../../shared/ui';
import type { UltimoDato } from '../../../shared/lib';
import { formatNumber } from '../../../shared/lib';
import { PerimetroElenco } from './pill';

export function BarraInterrogazione({
  chip,
  onApri,
  onTogliTutti,
  vuoto,
  perimetro,
  ultimi,
  ultimiInErrore = false,
}: {
  chip: ChipFiltro[];
  onApri?: () => void;
  onTogliTutti: () => void;
  vuoto: string;
  perimetro: string | null | undefined;
  ultimi: readonly UltimoDato[] | undefined;
  /** La risposta che porta l'ultimo dato e' in errore: la pill lo dice "non disponibile". */
  ultimiInErrore?: boolean;
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
          {/* "Dati al gg/mm/aaaa" (OP-EO-01): le voci del sinottico o della pagina dei pagamenti */}
          <PillDatiAl voci={ultimi} inErrore={ultimiInErrore} />
        </>
      }
    />
  );
}

/**
 * L'ordinamento della tabella, sempre detto in testo vicino alla tabella: anche su una colonna che la vista non mostra
 * (link condiviso, ritorno dalla scheda) si sa come sono ordinate le righe. Il testo e' annunciato (aria-live) quando
 * cambia, senza spostare il focus dall'intestazione cliccata; "Ordine predefinito" lo riporta all'inizio.
 */
export function OrdinamentoAttivo({ testo, predefinito, onPredefinito }: { testo: string; predefinito: boolean; onPredefinito: () => void }) {
  return (
    <p className="ui-ordinamento">
      <span aria-live="polite">{testo}</span>
      {!predefinito && (
        <button type="button" className="btn btn-link btn-sm p-0 ms-2" onClick={onPredefinito}>
          Ordine predefinito
        </button>
      )}
    </p>
  );
}

/** Pagina chiesta oltre l'ultima (segnalibro vecchio, filtri cambiati altrove): lo dice e porta all'ultima pagina. */
export function PaginaOltreLUltima({ pagina, ultima, onUltima }: { pagina: number; ultima: number; onUltima: () => void }) {
  return (
    <div className="alert alert-info my-3" role="status">
      {`La pagina ${formatNumber(pagina + 1)} non c'è: i risultati arrivano a pagina ${formatNumber(ultima + 1)}.`}{' '}
      <button type="button" className="btn btn-primary btn-sm" onClick={onUltima}>
        {"Vai all'ultima pagina"}
      </button>
    </div>
  );
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

/**
 * Profilo senza il grant della lettura principale della pagina: niente lettura (sarebbe un 403), lo si dice. Finche' il
 * profilo non e' letto non si sa ancora: caricamento, non un avviso che sparirebbe un attimo dopo.
 */
export function AccessoNonDisponibile({ cosa, profiloLetto }: { cosa: string; profiloLetto: boolean }) {
  if (!profiloLetto) return <Caricamento />;
  return (
    <div className="alert alert-warning my-3" role="alert">
      {`Il tuo profilo non consulta ${cosa}.`}
    </div>
  );
}
