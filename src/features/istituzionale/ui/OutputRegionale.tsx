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
// report si rilegge coi filtri nuovi, un chip tolto o Riprova (wireframe approvato, review V1). Barra, testata, stati e
// pannello sono l'impaginazione comune dei due report (PaginaReport, review H6).
import { useState } from 'react';
import { ricercaDaFiltri, rigaDellIntervento } from '../../../entities/filtri';
import type { Filtri } from '../../../entities/filtri';
import { Interruttore, Sezione } from '../../../shared/ui';
import { useOutputRegionale } from '../api';
import type { Output } from '../lib/dto';
import { DEFINIZIONI_OUTPUT, pillPeriodo } from '../lib/formato';
import { opzioniMisura } from '../lib/output';
import type { Misura } from '../lib/output';
import { AnteprimaOutput } from './AnteprimaOutput';
import { NOTA_FILE_OUTPUT, fileOutput } from './esportazioni';
import { PaginaReport } from './PaginaReport';
import { TabellaOutput } from './TabellaOutput';
import { useFiltriDellaPagina } from './useFiltriNellIndirizzo';

const SOTTOTITOLO = "Per ogni intervento l'output programmato e realizzato della Regione Lazio, anno per anno, nell'unità di misura del suo indicatore. Clic su una riga per l'anteprima.";
const TITOLO_OUTPUT = 'Output per intervento e anno';

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

export function OutputRegionale() {
  const pagina = useFiltriDellaPagina(false);
  const stato = useOutputRegionale(pagina.filtri, { abilitato: !pagina.inAttesa });
  const [misura, setMisura] = useState<Misura>('programmato');
  return (
    <PaginaReport pagina={pagina} stato={stato} briciola="Output regionale" titolo="Istituzionale: output regionale programmato e realizzato" titoloDocumento="Output regionale - Istituzionale" sottotitolo={SOTTOTITOLO} pill={(d) => pillPeriodo(d.annoInizio, d.annoFine)}>
      {(d) => <ReportOutput key={ricercaDaFiltri(pagina.filtri)} d={d} filtri={pagina.filtri} misura={misura} onMisura={setMisura} />}
    </PaginaReport>
  );
}
