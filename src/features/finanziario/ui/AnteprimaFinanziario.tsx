// AnteprimaFinanziario — i numeri chiave del finanziario nella card dell'area della Home: dotazione e pagamenti totali
// con la quota pagata (TX-0002) e domande presentate (TX-0009), senza filtri: sono le stesse letture in cache della
// panoramica senza filtri. Ogni numero si legge solo con il grant della sua transazione (letture nei figli, R-09) e
// segue le regole dei KPI (lib/aggregati: mai somme parziali, un'assenza dice il suo motivo). Un errore non ferma la
// Home: la card resta l'ingresso all'area e dice che il numero non e' disponibile.
import type { ReactNode } from 'react';
import { hasGrant, useAuthStatus } from '../../../shared/api/auth/use-auth-status';
import { formatNumber, formatPercentuale, importoBreve } from '../../../shared/lib';
import { NumeroAnimato } from '../../../shared/ui';
import { useSpesaPerIntervento, useTotaleDomande } from '../api';
import { kpiSpesa } from '../lib/aggregati';
import type { Aggregato } from '../lib/aggregati';
import { etichettaDiProgramma } from '../lib/perimetro';
import { GRANT } from '../lib/report';

const NON_DISPONIBILE = 'non disponibile';

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
        <span>Pagato sulla dotazione</span>
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
        <Importo etichetta="Pagamenti totali" a={k.pagato} />
      </dl>
      {k.quota.valore !== null && <Avanzamento quota={k.quota.valore} />}
    </>
  );
}

function Domande() {
  const { data, isPending, isError } = useTotaleDomande({});
  if (isPending) return <div className="ui-skeleton ui-ambito__attesa" aria-hidden="true" />;
  return (
    <dl className="ui-ambito__numeri">
      <Numero etichetta="Domande presentate" nota={isError || data?.presentate == null ? 'Conteggio non disponibile in questo momento.' : undefined}>
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
