// Kpi — tessera di un indicatore (ADR 0027): etichetta con icona, valore, nota, quota opzionale. Un valore assente non
// diventa mai zero: la tessera dice "non disponibile" con il motivo. Dentro <NonPertinente> (filtro SIGC opposto, F3) la
// tessera e' in grigio, dice il motivo e non ha l'azione.
import type { ReactNode } from 'react';
import { MotivoNonPertinente, useMotivoGiaDetto, useNonPertinenza } from '../card/NonPertinente';
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
  badge,
  valorePieno,
}: {
  etichetta: string;
  /**
   * Il valore pieno quando quello mostrato e' in forma compatta (R09: "1,2 M€" su una riga): lo leggono i lettori di
   * schermo e il suggerimento al passaggio del mouse.
   */
  valorePieno?: string;
  /** Un badge in testo accanto all'etichetta (es. "Consuntivo" o "Previsione" della riserva). */
  badge?: string;
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
  const np = useNonPertinenza();
  const nome = nomeAccessibile ?? etichetta;
  return (
    <section className={np ? 'ui-card ui-kpi ui-kpi--non-pertinente ui-dissolvenza' : 'ui-card ui-kpi ui-dissolvenza'} aria-label={np ? `${nome}, non pertinente al filtro ${np.filtro}` : nome}>
      <EtichettaKpi etichetta={etichetta} icona={icona} tono={tono} badge={badge} />
      <ValoreKpi valore={valore} unita={unita} assente={assente} pieno={valorePieno} />
      {nota && <p className="ui-kpi__nota">{nota}</p>}
      {!assente && <BarraQuota quota={quota} />}
      <MotivoSeDovuto />
      {azione && !np && <div className="ui-kpi__azione">{azione}</div>}
    </section>
  );
}

/** Il motivo della non pertinenza, se nessuna card intorno lo ha gia' detto (review J-01). */
function MotivoSeDovuto() {
  const np = useNonPertinenza();
  const detto = useMotivoGiaDetto();
  return np && !detto ? <MotivoNonPertinente np={np} /> : null;
}

function EtichettaKpi({ etichetta, icona, tono, badge }: { etichetta: string; icona: NomeIcona; tono: TonoKpi; badge?: string }) {
  return (
    <p className="ui-kpi__etichetta">
      <span className={`ui-kpi__icona ui-tono-${tono}`}>
        <Icona nome={icona} />
      </span>
      {etichetta}
      {badge && <span className="badge ui-badge-testo ms-1">{badge}</span>}
    </p>
  );
}

/** Il valore con l'unita', oppure l'assenza col suo motivo (mai uno zero al posto di un assente). */
function ValoreKpi({ valore, unita, assente, pieno }: { valore?: string; unita?: string; assente?: string; pieno?: string }) {
  if (assente) return <p className="ui-kpi__valore ui-kpi__valore--assente">{assente}</p>;
  if (pieno && pieno !== valore) {
    // l'unita' resta accanto al compatto e nel pieno (review H-09)
    const pienoConUnita = unita ? `${pieno} ${unita}` : pieno;
    return (
      <p className="ui-kpi__valore" title={pienoConUnita}>
        <span aria-hidden="true">
          {valore}
          {unita && <small>{unita}</small>}
        </span>
        <span className="visually-hidden">{pienoConUnita}</span>
      </p>
    );
  }
  return (
    <p className="ui-kpi__valore">
      {valore}
      {unita && <small>{unita}</small>}
    </p>
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
