// Riepilogo — pagina /procedurale/riepilogo (flusso riepilogo approvato, pattern report v2 come il riepilogo del
// finanziario, RF029): barra dei filtri col pannello e le pill; l'interruttore di pagina "Vista del riepilogo" (Grafico |
// Tabella, vista iniziale Grafico: la scelta resta nella cronologia del browser, tornando dal dettaglio o dall'elenco con
// gli stessi filtri), nella vista Grafico la card delle domande di sostegno, di pagamento CSR-DP e ammesse per intervento
// (clic su una barra: il dettaglio dell'intervento; PNG, CSV, XLSX), nella vista Tabella la tabella a sezioni coi totali
// del backend, CSV e XLSX al posto di "Esporta CSV", e il drawer di anteprima. UNA lettura di TX-0029 coi criteri
// dell'indirizzo; vista e riga aperta sono stato della pagina. Stati: caricamento, errore (un solo avviso), vuoto con
// "Modifica i filtri", valori dei filtri non disponibili.
import { useMemo, useState } from 'react';
import { useAuthStatus } from '../../../shared/api/auth/use-auth-status';
import { CardGrafico, InterruttoreVista, Sezione, VistaQuery, VuotoConFiltri, eVistaGrafico, useStatoNellaHistory } from '../../../shared/ui';
import type { VistaGrafico } from '../../../shared/ui';
import { useRiepilogo } from '../api';
import { conFiltri, criteriDelReport, ricercaDaCriteri } from '../lib/criteri';
import type { Riepilogo as DatiRiepilogo } from '../lib/dto';
import { testoNessunIntervento } from '../lib/formato';
import { graficoRiepilogo } from '../lib/grafici';
import { puoLeggere } from '../lib/grant';
import { codiceDellaRiga, righeRiepilogo } from '../lib/riepilogo';
import { OGGETTO_FILE, fileReport } from './esportazioni';
import { useApriIntervento } from './navigazione';
import { PaginaProcedurale } from './PaginaProcedurale';
import { AnteprimaRiepilogo, TabellaRiepilogo } from './TabellaRiepilogo';
import { useCriteriDellaPagina } from './useCriteriNellIndirizzo';
import type { PaginaDeiCriteri } from './useCriteriNellIndirizzo';

const SOTTOTITOLO = 'Grafico per intervento: clic su una barra per il dettaglio; nella vista Tabella tutte le misure procedurali per intervento, da cercare, ordinare, scegliere per sezione e scaricare in CSV o XLSX.';
const TITOLO_GRAFICO = 'Domande per intervento';

/** La vista del riepilogo: subito quella scelta e la cronologia la segue (con gli stessi filtri); di partenza il Grafico. */
function useVista(pagina: PaginaDeiCriteri): [VistaGrafico, (v: VistaGrafico) => void] {
  const [salvata, salva] = useStatoNellaHistory<VistaGrafico>('vistaRiepilogo', ricercaDaCriteri(pagina.filtri), eVistaGrafico);
  const [vista, setVista] = useState<VistaGrafico>(salvata ?? 'grafico');
  return [
    vista,
    (v) => {
      setVista(v);
      salva(v);
    },
  ];
}

function GraficoRiepilogo({ d, pagina }: { d: DatiRiepilogo; pagina: PaginaDeiCriteri }) {
  const { dalClic } = useApriIntervento(pagina.filtri.stato);
  const dati = useMemo(() => graficoRiepilogo(righeRiepilogo(d), TITOLO_GRAFICO), [d]);
  return (
    <CardGrafico
      titolo={TITOLO_GRAFICO}
      sottotitolo="Domande di sostegno, di pagamento CSR-DP e ammesse; trascina il cursore sotto il grafico per ingrandire, clic su una barra per il dettaglio"
      livello={3}
      altezza="alto"
      dati={dati}
      fonte="Fonte: TX-0029 (righe). PNG: l'immagine del grafico con l'intestazione, non registrata in audit; CSV e XLSX: il file della tabella di riepilogo coi filtri della pagina."
      onClic={dalClic}
      scaricamenti={fileReport('riepilogo', TITOLO_GRAFICO, pagina.filtri)}
      oggettoDati={OGGETTO_FILE.riepilogo}
    />
  );
}

interface PropsContenuto {
  d: DatiRiepilogo;
  pagina: PaginaDeiCriteri;
  vista: VistaGrafico;
  scegli: (v: VistaGrafico) => void;
  aperto: string | null;
  setAperto: (codice: string | null) => void;
}

function ContenutoRiepilogo({ d, pagina, vista, scegli, aperto, setAperto }: PropsContenuto) {
  const righe = righeRiepilogo(d);
  return (
    <Sezione titolo="Riepilogo per intervento">
      <InterruttoreVista etichetta="Vista del riepilogo" vista={vista} onVista={scegli} className="mb-3" />
      {vista === 'tabella' ? (
        <TabellaRiepilogo righe={righe} totale={d.totale} criteri={pagina.filtri} scaricamenti={fileReport('riepilogo', 'Riepilogo per intervento', pagina.filtri)} onRiga={setAperto} />
      ) : (
        <GraficoRiepilogo d={d} pagina={pagina} />
      )}
      <AnteprimaRiepilogo riga={righe.find((r) => codiceDellaRiga(r) === aperto) ?? null} criteri={pagina.filtri} onChiudi={() => setAperto(null)} />
    </Sezione>
  );
}

export function Riepilogo() {
  const pagina = useCriteriDellaPagina('tutti');
  const stato = useRiepilogo(criteriDelReport(pagina.filtri), { abilitato: puoLeggere(useAuthStatus().data, 'riepilogo') });
  // vista e riga aperta sono stato della pagina: restano mentre la lettura riparte coi filtri nuovi
  const [vista, scegli] = useVista(pagina);
  const [aperto, setAperto] = useState<string | null>(null);
  const vuoto = <VuotoConFiltri onModifica={() => pagina.apri('vuoto')}>{testoNessunIntervento(conFiltri(pagina.filtri))}</VuotoConFiltri>;
  return (
    <PaginaProcedurale pagina={pagina} briciola="Riepilogo per intervento" titolo="Procedurale: riepilogo per intervento" titoloDocumento="Riepilogo per intervento - Procedurale" sottotitolo={SOTTOTITOLO} perimetro={stato.data?.perimetro} tipoPerimetro="domande" codiciRisposta={righeRiepilogo(stato.data ?? {}).map(codiceDellaRiga)}>
      <VistaQuery stato={stato} eVuoto={(d) => righeRiepilogo(d).length === 0} vuoto={vuoto}>
        {(d) => <ContenutoRiepilogo d={d} pagina={pagina} vista={vista} scegli={scegli} aperto={aperto} setAperto={setAperto} />}
      </VistaQuery>
    </PaginaProcedurale>
  );
}
