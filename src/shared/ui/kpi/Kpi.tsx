// Kpi — tessera di un indicatore (ADR 0027): etichetta con icona, valore, nota, quota opzionale. Un valore assente non
// diventa mai zero: la tessera dice "non disponibile" con il motivo.
import type { ReactNode } from 'react';
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
  azione,
  nomeAccessibile,
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
  /** Azione della tessera sotto il valore (es. il link che apre l'elenco delle domande contate). */
  azione?: ReactNode;
  /**
   * Nome della tessera per i lettori di schermo quando l'etichetta ha sigle da sciogliere (es. "Superficie ammissibile DS:
   * superficie delle domande di sostegno"); deve contenere l'etichetta visibile (WCAG 2.5.3). Assente = l'etichetta.
   */
  nomeAccessibile?: string;
}) {
  return (
    <section className="ui-card ui-kpi ui-dissolvenza" aria-label={nomeAccessibile ?? etichetta}>
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
      {!assente && <BarraQuota quota={quota} />}
      {azione && <div className="ui-kpi__azione">{azione}</div>}
    </section>
  );
}

/** La quota fra 0 e 1 come barra; niente se non calcolabile o negativa. */
function BarraQuota({ quota }: { quota: number | null | undefined }) {
  // la barra si ferma al pieno, il testo accessibile dice il valore vero (oltre il 100%: review v3 X-05, WCAG 1.1.1)
  if (quota == null || quota < 0) return null;
  const percentuale = quota * 100;
  return (
    <div className="ui-barra" role="img" aria-label={`${percentuale.toLocaleString('it-IT', { maximumFractionDigits: 1 })}%`}>
      <span className={`ui-barra__${Math.round(Math.min(100, percentuale) / 5) * 5}`} />
    </div>
  );
}
