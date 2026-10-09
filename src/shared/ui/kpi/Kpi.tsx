// Kpi — tessera di un indicatore (ADR 0027): etichetta con icona, valore, nota, quota opzionale. Un valore assente non
// diventa mai zero: la tessera dice "non disponibile" con il motivo.
import type { NomeIcona } from '../icona';
import { Icona } from '../icona';

export type TonoKpi = 'blu' | 'verde' | 'ambra' | 'scuro';

export function Kpi({
  etichetta,
  valore,
  unita,
  nota,
  quota,
  icona,
  tono = 'blu',
  assente,
}: {
  etichetta: string;
  valore?: string;
  unita?: string;
  nota?: string;
  /** Quota fra 0 e 1 resa come barra; omessa se non calcolabile. */
  quota?: number | null;
  icona: NomeIcona;
  tono?: TonoKpi;
  /** Testo completo dell'assenza (es. "Non disponibile: fonte impegni non attiva"): se presente il valore non si mostra. */
  assente?: string;
}) {
  const percentuale = quota != null && quota >= 0 ? Math.min(100, quota * 100) : null;
  return (
    <section className="ui-card ui-kpi ui-dissolvenza" aria-label={etichetta}>
      <p className="ui-kpi__etichetta">
        <span className={`ui-kpi__icona ui-tono-${tono}`}>
          <Icona nome={icona} />
        </span>
        {etichetta}
      </p>
      {assente ? (
        <p className="ui-kpi__valore ui-kpi__valore--assente">{assente}</p>
      ) : (
        <p className="ui-kpi__valore">
          {valore}
          {unita && <small>{unita}</small>}
        </p>
      )}
      {nota && <p className="ui-kpi__nota">{nota}</p>}
      {!assente && percentuale !== null && (
        <div className="ui-barra" role="img" aria-label={`${percentuale.toLocaleString('it-IT', { maximumFractionDigits: 1 })}%`}>
          <span className={`ui-barra__${Math.round(percentuale / 5) * 5}`} />
        </div>
      )}
    </section>
  );
}
