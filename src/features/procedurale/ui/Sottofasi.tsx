// Sottofasi — pagina /procedurale/sottofasi (flusso sottofasi approvato, pattern lista v2, RF031 e RF032): dal giro G3
// (D-06 Rev. 6) la barra dei filtri col pannello comune (TX-0024, TX-0025), le pill del perimetro (domande del P4 nella
// sua ADA, anagrafica regionale) e "Dati al"; la regola del dato (la voce conta le domande distinte, i filtri restringono
// le domande contate, l'elenco delle sottofasi resta intero); la card della domanda di sostegno e quella di pagamento,
// ognuna col suo grant e la sua lettura coi criteri dell'indirizzo. Stati: caricamento (scheletro di ogni card), errore (un
// solo avviso della pagina), anagrafica vuota (nessun errore), nessuna domanda nei filtri (voci a 0, "Modifica i
// filtri"), valori dei filtri non disponibili. Classi bootstrap-italia e del kit v2; react-aria solo nel pannello e nella pill.
import { useAuthStatus } from '../../../shared/api/auth/use-auth-status';
import { VistaQuery } from '../../../shared/ui';
import type { StatoQuery } from '../../../shared/ui';
import { useSottofasiPagamento, useSottofasiSostegno } from '../api';
import { conFiltri, criteriDelReport } from '../lib/criteri';
import type { Sottofasi as DatiSottofasi, TipoDomanda } from '../lib/dto';
import { NOTA_SOTTOFASI, perimetroDelle } from '../lib/formato';
import { puoLeggere } from '../lib/grant';
import { CardSottofasi } from './CardSottofasi';
import { PaginaProcedurale } from './PaginaProcedurale';
import { useCriteriDellaPagina } from './useCriteriNellIndirizzo';
import type { PaginaDeiCriteri } from './useCriteriNellIndirizzo';

const SOTTOTITOLO =
  "Le sottofasi dello stato di ammissibilità della domanda di sostegno (sei) e di pagamento (sette) di SR-01, con la sottofase dell'anagrafica che le abbina e le domande che vi si trovano. I filtri restringono le domande contate; l'elenco delle sottofasi resta intero.";

function SezioneSottofasi({ tipo, stato, pagina }: { tipo: TipoDomanda; stato: StatoQuery<DatiSottofasi>; pagina: PaginaDeiCriteri }) {
  return <VistaQuery stato={stato}>{(s) => <CardSottofasi tipo={tipo} s={s} criteri={pagina.filtri} onModifica={() => pagina.apri('vuoto')} conFiltri={conFiltri(pagina.filtri)} />}</VistaQuery>;
}

/** Le due letture, ognuna col grant della sua transazione (null senza: la card non c'e'). */
function useLetture(pagina: PaginaDeiCriteri) {
  const auth = useAuthStatus().data;
  const criteri = criteriDelReport(pagina.filtri);
  const sostegno = useSottofasiSostegno(criteri, { abilitato: puoLeggere(auth, 'sottofasiSostegno') });
  const pagamento = useSottofasiPagamento(criteri, { abilitato: puoLeggere(auth, 'sottofasiPagamento') });
  return { sostegno: puoLeggere(auth, 'sottofasiSostegno') ? sostegno : null, pagamento: puoLeggere(auth, 'sottofasiPagamento') ? pagamento : null };
}

export function Sottofasi() {
  const pagina = useCriteriDellaPagina('tutti');
  const { sostegno, pagamento } = useLetture(pagina);
  const perimetro = perimetroDelle([sostegno?.data?.perimetro, pagamento?.data?.perimetro]);
  return (
    <PaginaProcedurale pagina={pagina} briciola="Sottofasi di ammissibilità" titolo="Procedurale: sottofasi di ammissibilità" titoloDocumento="Sottofasi di ammissibilità - Procedurale" sottotitolo={SOTTOTITOLO} perimetro={perimetro} tipoPerimetro="sottofasi" codiciRisposta={[]}>
      <p className="ui-nota">{NOTA_SOTTOFASI}</p>
      {sostegno && <SezioneSottofasi tipo="SOSTEGNO" stato={sostegno} pagina={pagina} />}
      {pagamento && <SezioneSottofasi tipo="PAGAMENTO" stato={pagamento} pagina={pagina} />}
    </PaginaProcedurale>
  );
}
