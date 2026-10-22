// OutputRegionale — pagina /istituzionale/output-regionale (flusso output-regionale approvato, report tabellare v2
// lista-filtri, RF017): barra dei filtri a chip col pannello (voci da TX-0060, G2), le pill del perimetro regionale, del
// periodo della risposta e "Dati al" (ultimiDatiSincronizzati di TX-0017, G3); percorso e un solo h1 col focus; lo stato
// dei valori dei filtri non disponibili; la card "Output per intervento e anno" con l'interruttore della misura
// (Programmato | Realizzato SIGC | Realizzato non SIGC cumulativo: scelta approvata di OP-IS-06; stato della pagina, non
// dell'indirizzo; il cambio non sposta il focus), la tabella e le definizioni; il drawer di anteprima della riga. Nessuna
// card grafico in pagina (unita' diverse fra interventi: OP-IS-06), quindi nessun PNG. UNA lettura di TX-0017 per pagina.
// Stati: caricamento, errore (un solo avviso), vuoto (con "Modifica i filtri"), valori dei filtri non disponibili.
// Design system: classi bootstrap-italia e del kit v2 (card, interruttore con aria-pressed); react-aria solo dentro il
// pannello, il drawer e il popover della pill del kit. La misura dell'interruttore sta nella pagina: resta quando il
// report si rilegge coi filtri nuovi, un chip tolto o Riprova (wireframe approvato, review V1).
import { useState } from 'react';
import { ricercaDaFiltri, usePannelloConFocus } from '../../../entities/filtri';
import type { Filtri } from '../../../entities/filtri';
import { AvvisoPagina, BarraFiltri, Briciole, Caricamento, Interruttore, PillDatiAl, Sezione, TestaPagina, VistaQuery, VuotoConFiltri } from '../../../shared/ui';
import { useOutputRegionale } from '../api';
import { conFiltri } from '../lib/criteri';
import type { Output } from '../lib/dto';
import { DEFINIZIONI_OUTPUT, PILL_PERIMETRO, pillPeriodo, testoVuoto } from '../lib/formato';
import { opzioniMisura, rigaDellIntervento } from '../lib/output';
import type { Misura } from '../lib/output';
import { AnteprimaOutput } from './AnteprimaOutput';
import { ValoriNonDisponibili } from './comuni';
import { NOTA_FILE_OUTPUT, fileOutput } from './esportazioni';
import { useIngressoArea } from './navigazione';
import { PannelloFiltriIstituzionale } from './PannelloFiltriIstituzionale';
import { TabellaOutput } from './TabellaOutput';
import { useFiltriNellIndirizzo } from './useFiltriNellIndirizzo';

const SOTTOTITOLO = "Per ogni intervento l'output programmato e realizzato della Regione Lazio, anno per anno, nell'unità di misura del suo indicatore. Clic su una riga per l'anteprima.";
const TITOLO_OUTPUT = 'Output per intervento e anno';

/** Perimetro (sempre regionale), periodo e ultimo dato sincronizzato della risposta, nella barra. */
function PillDellaBarra({ d, inErrore }: { d: Output | undefined; inErrore: boolean }) {
  return (
    <>
      <span className="ui-pill">{PILL_PERIMETRO}</span>
      {d && <span className="ui-pill">{pillPeriodo(d.annoInizio, d.annoFine)}</span>}
      <PillDatiAl voci={d?.ultimiDatiSincronizzati} inErrore={inErrore} />
    </>
  );
}

/** La misura dell'interruttore, stato della pagina: il report la riceve e la cambia. */
type PropsMisura = { misura: Misura; onMisura: (m: Misura) => void };

/** Il report: la card con l'interruttore della misura, la tabella e le definizioni, poi il drawer della riga aperta. */
function ReportOutput({ d, filtri, misura, onMisura }: { d: Output; filtri: Filtri } & PropsMisura) {
  const [aperto, setAperto] = useState<string | null>(null);
  const cumulativo = d.realizzatoNonSigcCumulativo;
  return (
    <>
      <Sezione titolo={TITOLO_OUTPUT} strumenti={<Interruttore etichetta="Misura mostrata negli anni" opzioni={opzioniMisura(cumulativo)} scelta={misura} onScelta={onMisura} />}>
        <p className="ui-nota">{NOTA_FILE_OUTPUT}</p>
        <TabellaOutput d={d} misura={misura} scaricamenti={fileOutput('Output regionale', filtri)} onRiga={setAperto} />
        <p className="ui-fonte">{DEFINIZIONI_OUTPUT}</p>
      </Sezione>
      <AnteprimaOutput riga={aperto === null ? null : (rigaDellIntervento(d.righe, aperto) ?? null)} cumulativo={cumulativo} onChiudi={() => setAperto(null)} />
    </>
  );
}

type PropsCorpo = { stato: ReturnType<typeof useOutputRegionale>; inAttesa: boolean; filtri: Filtri; onModificaFiltri: () => void } & PropsMisura;

/** Il corpo: un solo avviso, l'attesa del legame con le azioni, la lettura di TX-0017 e il report (nuovo coi filtri nuovi). */
function CorpoOutput({ stato, inAttesa, filtri, onModificaFiltri, ...misura }: PropsCorpo) {
  const vuoto = <VuotoConFiltri onModifica={onModificaFiltri}>{testoVuoto(conFiltri(filtri))}</VuotoConFiltri>;
  return (
    <AvvisoPagina>
      {/* finche' non si sa se il filtro per azione si applica, TX-0017 non si legge (come nel finanziario, X-03) */}
      {inAttesa ? (
        <Caricamento testo="Verifica dei filtri in corso…" />
      ) : (
        <VistaQuery stato={stato} eVuoto={(d) => d.righe.length === 0} vuoto={vuoto}>
          {(d) => <ReportOutput key={ricercaDaFiltri(filtri)} d={d} filtri={filtri} {...misura} />}
        </VistaQuery>
      )}
    </AvvisoPagina>
  );
}

export function OutputRegionale() {
  const { filtri, inAttesa, chip, applica, togliTutti, valori } = useFiltriNellIndirizzo(false);
  const stato = useOutputRegionale(filtri, { abilitato: !inAttesa });
  const [misura, setMisura] = useState<Misura>('programmato');
  const { h1, pannello, apri, chiudi, onApplica } = usePannelloConFocus(filtri, applica, ricercaDaFiltri);
  const briciole = [{ etichetta: 'Istituzionale', a: useIngressoArea() }, { etichetta: 'Output regionale' }];
  return (
    <>
      <BarraFiltri chip={chip} onApri={() => apri('barra')} onTogliTutti={togliTutti} vuoto="Nessun filtro: tutti gli interventi" destra={<PillDellaBarra d={stato.data} inErrore={stato.isError} />} />
      <main className="ui-pagina" id="contenuto">
        <Briciole voci={briciole} />
        <TestaPagina titolo="Istituzionale: output regionale programmato e realizzato" titoloDocumento="Output regionale - Istituzionale" sottotitolo={SOTTOTITOLO} refTitolo={h1} />
        <ValoriNonDisponibili valori={valori} h1={h1} />
        <CorpoOutput stato={stato} inAttesa={inAttesa} filtri={filtri} onModificaFiltri={() => apri('vuoto')} misura={misura} onMisura={setMisura} />
      </main>
      <PannelloFiltriIstituzionale aperto={pannello !== null} filtri={filtri} valori={valori} codiciRisposta={(stato.data?.righe ?? []).map((r) => r.codiceIntervento)} onApplica={onApplica} onChiudi={chiudi} />
    </>
  );
}
