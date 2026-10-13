// AnteprimaFinanziario — i numeri chiave del finanziario nella card dell'area della Home: dotazione e pagamenti totali
// (lordi) con la quota del pagato lordo sulla dotazione (TX-0002) e domande presentate (TX-0009), senza filtri: sono le
// stesse letture in cache della panoramica senza filtri. Con il perimetro ADA pagamenti e domande sono dell'area del
// profilo, accanto a una dotazione regionale: le etichette lo dicono e al posto della quota c'e' il suo motivo. Ogni numero si legge solo con il grant della sua transazione (letture nei figli, R-09) e
// segue le regole dei KPI (lib/aggregati: mai somme parziali, un'assenza dice il suo motivo). Un errore non ferma la
// Home: la card resta l'ingresso all'area e dice che il numero non e' disponibile.
import type { ReactNode } from 'react';
import { hasGrant, useAuthStatus } from '../../../shared/api/auth/use-auth-status';
import { formatNumber, formatPercentuale, importoBreve } from '../../../shared/lib';
import { NumeroAnimato } from '../../../shared/ui';
import { useSpesaPerIntervento, useTotaleDomande } from '../api';
import { kpiSpesa } from '../lib/aggregati';
import type { Aggregato } from '../lib/aggregati';
import { PAGAMENTI_LORDI_BREVE, PAGATO_LORDO_SULLA_DOTAZIONE } from '../lib/grafici';
import { PERIMETRO_ADA, etichettaDiProgramma } from '../lib/perimetro';
import { GRANT } from '../lib/report';

const NON_DISPONIBILE = 'non disponibile';
const DELLA_TUA_AREA = ' della tua area';

/** Etichetta di una misura per domanda: con il perimetro ADA e' dell'area del profilo. */
const dellArea = (etichetta: string, perimetro: string | null | undefined) => (perimetro === PERIMETRO_ADA ? `${etichetta}${DELLA_TUA_AREA}` : etichetta);

function Numero({ etichetta, children, nota }: { etichetta: string; children: ReactNode; nota?: string }) {
  return (
    <div>
      <dt>{etichetta}</dt>
      <dd>{children}</dd>
      {nota && <dd className="ui-ambito__nota">{nota}</dd>}
    </div>
  );
}

function Importo({ etichetta, a }: { etichetta: string; a: Aggregato }) {
  return (
    <Numero etichetta={etichetta} nota={a.valore === null ? a.motivo : undefined}>
      {a.valore === null ? NON_DISPONIBILE : <NumeroAnimato valore={a.valore} formato={importoBreve} />}
    </Numero>
  );
}

/** Quota pagata sulla dotazione come barra a passi del 5% (niente stili inline), che si riempie entrando. */
function Avanzamento({ quota }: { quota: number }) {
  const passo = Math.round(Math.min(100, Math.max(0, quota)) / 5) * 5;
  return (
    <div className="ui-ambito__avanzamento">
      <p>
        <span>{PAGATO_LORDO_SULLA_DOTAZIONE}</span>
        <b>{formatPercentuale(quota)}</b>
      </p>
      <div className="ui-barra ui-barra--entra" aria-hidden="true">
        <span className={`ui-barra__${passo}`} />
      </div>
    </div>
  );
}

function Spesa() {
  const { data, isPending, isError } = useSpesaPerIntervento({});
  if (isPending) return <div className="ui-skeleton ui-ambito__attesa" aria-hidden="true" />;
  if (isError || !data) return <p className="ui-ambito__nota">Dotazione e pagamenti non disponibili in questo momento.</p>;
  const k = kpiSpesa(data.righe ?? [], data.perimetro);
  return (
    <>
      <dl className="ui-ambito__numeri">
        <Importo etichetta={etichettaDiProgramma('Dotazione', data.perimetro)} a={k.dotazione} />
        <Importo etichetta={dellArea(PAGAMENTI_LORDI_BREVE, data.perimetro)} a={k.pagato} />
      </dl>
      {k.quota.valore !== null ? <Avanzamento quota={k.quota.valore} /> : k.quota.motivo && <p className="ui-ambito__nota">{`${PAGATO_LORDO_SULLA_DOTAZIONE}: ${k.quota.motivo}`}</p>}
    </>
  );
}

function Domande() {
  const { data, isPending, isError } = useTotaleDomande({});
  if (isPending) return <div className="ui-skeleton ui-ambito__attesa" aria-hidden="true" />;
  return (
    <dl className="ui-ambito__numeri">
      <Numero etichetta={dellArea('Domande presentate', data?.perimetro)} nota={isError || data?.presentate == null ? 'Conteggio non disponibile in questo momento.' : undefined}>
        {data?.presentate == null ? NON_DISPONIBILE : <NumeroAnimato valore={data.presentate} formato={(v) => formatNumber(Math.round(v))} />}
      </Numero>
    </dl>
  );
}

/** I numeri dell'area per i grant dell'utente; senza nessuno dei due grant, `altrimenti` (cosa c'e' nell'area). */
export function AnteprimaFinanziario({ altrimenti }: { altrimenti: ReactNode }) {
  const auth = useAuthStatus().data;
  const spesa = hasGrant(auth, GRANT.spesaPerIntervento);
  const domande = hasGrant(auth, GRANT.totaleDomande);
  if (!spesa && !domande) return <>{altrimenti}</>;
  return (
    <div className="ui-ambito__anteprima" aria-label="Il finanziario in cifre" role="group">
      {spesa && <Spesa />}
      {domande && <Domande />}
    </div>
  );
}
