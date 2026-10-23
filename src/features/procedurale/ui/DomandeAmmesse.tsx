// DomandeAmmesse — pagina /procedurale/ammesse (flusso ammesse approvato, pattern report v2, RF026): barra dei filtri col
// pannello e le pill; quattro KPI dal totale del backend (domande ammesse col link verso l'elenco se il filtro per stato
// ammette Ammessa, con atto di concessione: "non disponibile" col motivo senza la fonte e allora nessun link, contributo
// ammesso con la quota sul richiesto solo coi due importi, interventi attivati sul perimetro ufficiale); le card a barre
// raggruppate degli importi e delle domande ammesse e con atto per intervento (clic: il dettaglio); la tabella per
// intervento coi totali del backend e il drawer di anteprima. UNA lettura di TX-0026 coi criteri dell'indirizzo; la riga
// aperta e' stato della pagina. Stati: caricamento, errore (un solo avviso), vuoto con "Modifica i filtri", valori dei
// filtri non disponibili. Classi bootstrap-italia e del kit v2; react-aria solo nel pannello, nel drawer e nella pill.
import { useState } from 'react';
import { useAuthStatus } from '../../../shared/api/auth/use-auth-status';
import { Griglia, VistaQuery, VuotoConFiltri } from '../../../shared/ui';
import { useDomandeAmmesse } from '../api';
import { conFiltri, criteriDelReport } from '../lib/criteri';
import type { Ammesse } from '../lib/dto';
import { NOTA_AMMESSE, testoVuoto } from '../lib/formato';
import { puoLeggere } from '../lib/grant';
import { kpiDelleAmmesse, kpiInterventi } from '../lib/kpi';
import { CardAmmesseConAtto, CardImporti } from './CardAmmesse';
import { TessereKpi } from './comuni';
import { fileReport } from './esportazioni';
import { PaginaProcedurale } from './PaginaProcedurale';
import { AnteprimaAmmesse, TabellaAmmesse } from './TabellaAmmesse';
import { useCriteriDellaPagina } from './useCriteriNellIndirizzo';
import type { PaginaDeiCriteri } from './useCriteriNellIndirizzo';

const SOTTOTITOLO = 'Numero di domande ammesse, domande con atto di concessione, importo richiesto e contributo ammesso per intervento, con gli interventi attivati.';
const LINK_KPI = { ammesse: 'elenco-ammesse', conAtto: 'elenco-con-atto' } as const;

function ReportAmmesse({ d, pagina, aperto, onApri }: { d: Ammesse; pagina: PaginaDeiCriteri; aperto: string | null; onApri: (codice: string | null) => void }) {
  const righe = d.righe ?? [];
  const criteri = pagina.filtri;
  return (
    <>
      {d.totale && <TessereKpi kpi={[...kpiDelleAmmesse(d.totale, { criteri, link: LINK_KPI }), kpiInterventi(d.totale)]} criteri={criteri} />}
      <p className="ui-nota">{NOTA_AMMESSE}</p>
      <Griglia>
        <CardImporti righe={righe} criteri={criteri} />
        <CardAmmesseConAtto righe={righe} criteri={criteri} />
      </Griglia>
      <TabellaAmmesse righe={righe} totale={d.totale} criteri={criteri} valori={pagina.valori?.data} scaricamenti={fileReport('domandeAmmesse', 'Domande ammesse per intervento', criteri)} onRiga={onApri} />
      <AnteprimaAmmesse riga={righe.find((r) => r.codiceIntervento === aperto) ?? null} criteri={criteri} onChiudi={() => onApri(null)} />
    </>
  );
}

export function DomandeAmmesse() {
  const pagina = useCriteriDellaPagina('tutti');
  const stato = useDomandeAmmesse(criteriDelReport(pagina.filtri), { abilitato: puoLeggere(useAuthStatus().data, 'ammesse') });
  const [aperto, setAperto] = useState<string | null>(null);
  const vuoto = (d: Ammesse) => <VuotoConFiltri onModifica={() => pagina.apri('vuoto')}>{testoVuoto('Nessun intervento', conFiltri(pagina.filtri), d.perimetro)}</VuotoConFiltri>;
  return (
    <PaginaProcedurale pagina={pagina} briciola="Domande ammesse" titolo="Procedurale: domande ammesse per intervento" titoloDocumento="Domande ammesse - Procedurale" sottotitolo={SOTTOTITOLO} perimetro={stato.data?.perimetro} tipoPerimetro="domande" codiciRisposta={(stato.data?.righe ?? []).map((r) => r.codiceIntervento)}>
      <VistaQuery stato={stato} eVuoto={(d) => (d.righe ?? []).length === 0} vuoto={vuoto}>
        {(d) => <ReportAmmesse d={d} pagina={pagina} aperto={aperto} onApri={setAperto} />}
      </VistaQuery>
    </PaginaProcedurale>
  );
}
