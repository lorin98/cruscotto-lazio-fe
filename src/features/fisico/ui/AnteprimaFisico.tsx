// AnteprimaFisico — i numeri chiave del fisico nella card dell'area della Home (flusso superfici approvato, home.html,
// OP-FIS-10, decisione dell'utente del 26/10/2026): i KPI della pagina Superfici per la campagna piu' recente (lib/anteprima),
// dalla lettura di TX-0018 coi criteri della pagina aperta senza filtri (lib/criteri: stessa cache, a lettura finita,
// decisione D2). Solo col grant di TX-0018; senza, `altrimenti` (cosa c'e' nell'area). Un errore non ferma la Home: la
// card resta l'ingresso all'area e dice che il dato non e' disponibile. Pezzi del kit (AnteprimaArea) come la card del
// finanziario; nessun react-aria.
import type { ReactNode } from 'react';
import { useAuthStatus } from '../../../shared/api/auth/use-auth-status';
import { etichettaDellArea, ettari, intero } from '../../../shared/lib';
import { AnteprimaArea, AttesaArea, AvanzamentoArea, NotaArea, NumeriArea, NumeroArea, RiferimentoArea } from '../../../shared/ui';
import { useSuperfici } from '../api';
import { anteprimaSuperfici } from '../lib/anteprima';
import { criteriSenzaFiltri } from '../lib/criteri';
import { testoQuotaOltreDs } from '../lib/formato';
import { puoLeggere } from '../lib/grant';
import { TESTI_KPI } from '../lib/report';

function Superfici() {
  const { data, isPending, isError } = useSuperfici(criteriSenzaFiltri());
  if (isPending) return <AttesaArea />;
  if (isError || !data) return <NotaArea>Superfici non disponibili in questo momento.</NotaArea>;
  const a = anteprimaSuperfici(data);
  if (!a) return <NotaArea stato>Nessuna superficie ammissibile nelle domande.</NotaArea>;
  const etichetta = (testo: string) => etichettaDellArea(testo, data.perimetro);
  return (
    <>
      <RiferimentoArea>{`Campagna ${a.campagna}`}</RiferimentoArea>
      <NumeriArea>
        <NumeroArea etichetta={etichetta(TESTI_KPI.ds.etichetta)} spiegazione={TESTI_KPI.ds.spiegazione} valore={a.superficieDs} formato={ettari} />
        <NumeroArea etichetta={etichetta(TESTI_KPI.dp.etichetta)} spiegazione={TESTI_KPI.dp.spiegazione} valore={a.superficieDp} formato={ettari} />
      </NumeriArea>
      {a.quotaOltreDs !== null ? (
        <AvanzamentoArea etichetta={TESTI_KPI.oltre.etichetta} spiegazione={TESTI_KPI.oltre.spiegazione} percentuale={a.quotaOltreDs} />
      ) : (
        <NotaArea>{`${TESTI_KPI.oltre.etichetta}: ${testoQuotaOltreDs(a.domandePagamento, null)}`}</NotaArea>
      )}
      <NumeriArea>
        <NumeroArea etichetta={etichetta('Domande di pagamento')} valore={a.domandePagamento} formato={intero} />
      </NumeriArea>
    </>
  );
}

/** I numeri dell'area col grant di TX-0018; senza, `altrimenti` (cosa c'e' nell'area). */
export function AnteprimaFisico({ altrimenti }: { altrimenti: ReactNode }) {
  const auth = useAuthStatus().data;
  if (!puoLeggere(auth, 'superfici')) return <>{altrimenti}</>;
  return (
    <AnteprimaArea nome="Il fisico in cifre">
      <Superfici />
    </AnteprimaArea>
  );
}
