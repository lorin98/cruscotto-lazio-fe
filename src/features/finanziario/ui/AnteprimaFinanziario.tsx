// AnteprimaFinanziario — i numeri chiave del finanziario nella card dell'area della Home: dotazione e pagamenti totali
// (lordi) con la quota del pagato lordo sulla dotazione (TX-0002) e domande presentate (TX-0009), senza filtri: sono le
// stesse letture in cache della panoramica senza filtri. Con il perimetro ADA pagamenti e domande sono dell'area del
// profilo, accanto a una dotazione regionale: le etichette lo dicono e al posto della quota c'e' il suo motivo. Ogni numero si legge solo con il grant della sua transazione (letture nei figli, R-09) e
// segue le regole dei KPI (lib/aggregati: mai somme parziali, un'assenza dice il suo motivo). Un errore non ferma la
// Home: la card resta l'ingresso all'area e dice che il numero non e' disponibile. I pezzi della card sono del kit
// (AnteprimaArea), comuni alle card degli altri ambiti.
import type { ReactNode } from 'react';
import { hasGrant, useAuthStatus } from '../../../shared/api/auth/use-auth-status';
import { importoBreve, intero } from '../../../shared/lib';
import { AnteprimaArea, AttesaArea, AvanzamentoArea, NotaArea, NumeriArea, NumeroArea } from '../../../shared/ui';
import { useSpesaPerIntervento, useTotaleDomande } from '../api';
import { kpiSpesa } from '../lib/aggregati';
import type { Aggregato } from '../lib/aggregati';
import { PAGAMENTI_LORDI_BREVE, PAGATO_LORDO_SULLA_DOTAZIONE } from '../lib/grafici';
import { etichettaDellArea, etichettaDiProgramma } from '../lib/perimetro';
import { GRANT } from '../lib/report';

function Importo({ etichetta, a }: { etichetta: string; a: Aggregato }) {
  return <NumeroArea etichetta={etichetta} valore={a.valore} formato={importoBreve} motivo={a.motivo} />;
}

function Spesa() {
  const { data, isPending, isError } = useSpesaPerIntervento({});
  if (isPending) return <AttesaArea />;
  if (isError || !data) return <NotaArea>Dotazione e pagamenti non disponibili in questo momento.</NotaArea>;
  const k = kpiSpesa(data.righe ?? [], data.perimetro);
  return (
    <>
      <NumeriArea>
        <Importo etichetta={etichettaDiProgramma('Dotazione', data.perimetro)} a={k.dotazione} />
        <Importo etichetta={etichettaDellArea(PAGAMENTI_LORDI_BREVE, data.perimetro)} a={k.pagato} />
      </NumeriArea>
      {k.quota.valore !== null ? <AvanzamentoArea etichetta={PAGATO_LORDO_SULLA_DOTAZIONE} percentuale={k.quota.valore} /> : k.quota.motivo && <NotaArea>{`${PAGATO_LORDO_SULLA_DOTAZIONE}: ${k.quota.motivo}`}</NotaArea>}
    </>
  );
}

function Domande() {
  const { data, isPending, isError } = useTotaleDomande({});
  if (isPending) return <AttesaArea />;
  return (
    <NumeriArea>
      <NumeroArea
        etichetta={etichettaDellArea('Domande presentate', data?.perimetro)}
        valore={isError ? null : data?.presentate}
        formato={intero}
        motivo="Conteggio non disponibile in questo momento."
      />
    </NumeriArea>
  );
}

/** I numeri dell'area per i grant dell'utente; senza nessuno dei due grant, `altrimenti` (cosa c'e' nell'area). */
export function AnteprimaFinanziario({ altrimenti }: { altrimenti: ReactNode }) {
  const auth = useAuthStatus().data;
  const spesa = hasGrant(auth, GRANT.spesaPerIntervento);
  const domande = hasGrant(auth, GRANT.totaleDomande);
  if (!spesa && !domande) return <>{altrimenti}</>;
  return (
    <AnteprimaArea nome="Il finanziario in cifre">
      {spesa && <Spesa />}
      {domande && <Domande />}
    </AnteprimaArea>
  );
}
