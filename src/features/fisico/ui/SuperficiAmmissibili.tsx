// SuperficiAmmissibili — pagina /fisico/superfici (flusso superfici approvato, report v2 come il riepilogo del finanziario,
// RF018): barra dei filtri a chip col pannello (voci da TX-0060, G2), la pill del perimetro regionale e la pill "Dati al"
// (ultimiDatiSincronizzati di TX-0018, G3); percorso e un solo h1 col focus; il report della campagna di riferimento
// (ReportSuperfici: quella del filtro Campagna o la piu' recente della risposta, le campagne non si sommano, D-01). UNA
// lettura di TX-0018 per pagina, coi criteri dell'indirizzo. Stati: caricamento (scheletro), errore (un solo avviso della
// pagina, problem-type), vuoto (nessun intervento; nessuna superficie, mai una pagina di zeri: con il filtro Campagna detto
// di quella campagna, D1) e valori dei filtri non disponibili (nel pannello). La campagna della risposta (null = letta
// senza filtro) decide i testi degli interventi senza superfici in tabella, nelle note dei grafici e nell'anteprima (V1
// della review del fisico). Nessun link verso altre pagine (OP-FIS-05): il clic apre l'anteprima o mette un filtro della
// stessa pagina. Criteri nuovi = contenuto nuovo: un comando che sparisce col report ("Mostra solo", punto della serie per
// campagna, "Applica i filtri" con criteri cambiati dal pannello aperto dallo stato vuoto) porta il focus sull'h1 dopo la
// chiusura del dialogo (A1, X2: WCAG 2.4.3); con criteri invariati il bottone che ha aperto il pannello resta e il focus
// torna li' (A1 dell'iterazione 2).
// Design system: classi bootstrap-italia e del kit v2; i primitivi react-aria stanno solo dentro i componenti del kit che
// li richiedono (pannello e drawer modali, popover della pill).
import { useState } from 'react';
import { descrizioneIntervento, usePannelloConFocus } from '../../../entities/filtri';
import { testoPerimetro } from '../../../shared/lib';
import { AvvisoPagina, BarraFiltri, Briciole, Caricamento, ContestoIntestazione, PillDatiAl, TestaPagina, VistaQuery, VuotoConFiltri, useRigheContesto } from '../../../shared/ui';
import type { VistaGrafico } from '../../../shared/ui';
import { useSuperfici } from '../api';
import type { SuperficieAmmissibile } from '../api';
import { ricercaDaCriteri, testiCriteri } from '../lib/criteri';
import { PERCORSI } from '../lib/pagine';
import { campagnePresenti } from '../lib/superfici';
import { PannelloFiltriSuperfici } from './PannelloFiltriSuperfici';
import { Report } from './ReportSuperfici';
import type { PropsReport } from './ReportSuperfici';
import { useCriteriNellIndirizzo } from './useCriteriNellIndirizzo';

const SOTTOTITOLO =
  "Superficie ammissibile delle domande di sostegno (DS) e delle domande di pagamento (DP) per intervento e campagna, con la verifica incrociata fra le due. Clic su una barra per l'anteprima dell'intervento; nella vista Tabella cerca, ordina e scegli le colonne.";
const BRICIOLE = [{ etichetta: 'Fisico', a: PERCORSI.superfici }, { etichetta: 'Superfici ammissibili' }];

/** Perimetro (sempre regionale) e ultimo dato sincronizzato della risposta, a destra nella barra dei filtri. */
function PillDellaBarra({ d, inErrore }: { d: SuperficieAmmissibile | undefined; inErrore: boolean }) {
  return (
    <>
      {d && <span className="ui-pill">{`Perimetro: ${testoPerimetro(d.perimetro)}`}</span>}
      <PillDatiAl voci={d?.ultimiDatiSincronizzati} inErrore={inErrore} />
    </>
  );
}

type PropsCorpo = Omit<PropsReport, 'd'> & { stato: ReturnType<typeof useSuperfici>; inAttesa: boolean };

/** Il corpo della pagina: un solo avviso, l'attesa del legame con le azioni, la lettura di TX-0018 e il report. */
function CorpoSuperfici({ stato, inAttesa, ...report }: PropsCorpo) {
  // righe di contesto del PNG dei grafici (NFR-50, hook del kit): criteri applicati, perimetro, profilo, ultimo dato di TX-0018
  const d = stato.data;
  const contesto = useRigheContesto(testiCriteri(report.criteri), d?.ultimiDatiSincronizzati, d ? testoPerimetro(d.perimetro) : null);
  return (
    <ContestoIntestazione.Provider value={contesto}>
      <AvvisoPagina>
        {/* finche' non si sa se il filtro per azione si applica, TX-0018 non si legge (come nel finanziario, X-03) */}
        {inAttesa ? (
          <Caricamento testo="Verifica dei filtri in corso…" />
        ) : (
          <VistaQuery stato={stato} eVuoto={(d) => d.righe.length === 0} vuoto={<VuotoConFiltri onModifica={report.onModificaFiltri}>Nessun intervento per i filtri scelti.</VuotoConFiltri>}>
            {/* criteri nuovi = contenuto nuovo: l'anteprima aperta non resta quella di prima */}
            {(d) => <Report key={ricercaDaCriteri(report.criteri)} d={d} {...report} />}
          </VistaQuery>
        )}
      </AvvisoPagina>
    </ContestoIntestazione.Provider>
  );
}

export function SuperficiAmmissibili() {
  const { criteri, inAttesa, chip, applica, togliTutti, valori } = useCriteriNellIndirizzo();
  const stato = useSuperfici(criteri, { abilitato: !inAttesa });
  // il pannello e il focus dopo "Applica i filtri" (regola comune di entities/filtri); i criteri applicati da un comando
  // che sparisce col report (applicaConFocus) portano il focus sull'h1 dopo la chiusura del dialogo (A1, X2)
  const { h1, pannello, apri, chiudi, onApplica, applicaConFocus } = usePannelloConFocus(criteri, applica, ricercaDaCriteri);
  const [vista, setVista] = useState<VistaGrafico>('grafico');
  const righe = stato.data?.righe ?? [];
  const descrizioneDi = (codice: string) => descrizioneIntervento(valori?.data?.interventi, codice);
  return (
    <>
      <BarraFiltri chip={chip} onApri={() => apri('barra')} onTogliTutti={togliTutti} vuoto="Nessun filtro: tutti gli interventi e tutte le campagne" destra={<PillDellaBarra d={stato.data} inErrore={stato.isError} />} />
      <main className="ui-pagina" id="contenuto">
        <Briciole voci={BRICIOLE} />
        <TestaPagina titolo="Fisico: superfici ammissibili per intervento" titoloDocumento="Superfici ammissibili - Fisico" sottotitolo={SOTTOTITOLO} refTitolo={h1} />
        <CorpoSuperfici stato={stato} inAttesa={inAttesa} criteri={criteri} vista={vista} onVista={setVista} applica={applicaConFocus} onModificaFiltri={() => apri('vuoto')} descrizioneDi={descrizioneDi} />
      </main>
      <PannelloFiltriSuperfici aperto={pannello !== null} criteri={criteri} valori={valori} campagne={campagnePresenti(righe)} codiciRisposta={righe.map((r) => r.codiceIntervento)} onChiudi={chiudi} onApplica={onApplica} />
    </>
  );
}
