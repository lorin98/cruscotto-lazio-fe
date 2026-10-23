// PannelloFiltriProcedurale — pannello laterale dei filtri dei report procedurali (wireframe panoramica approvato, "Filtri
// dei report procedurali"): il pannello comune di entities/filtri (PannelloFiltriProgramma, lo stesso di fisico e
// istituzionale) con le voci di TX-0024 della slice (interventi senza AT001, OS, OG, OP) e senza l'azione portante
// (RF024), poi il gruppo dello stato domanda area programmazione con le voci di TX-0025 (le dieci di RF025, gli stati
// osservati, la voce senza stato). Le Unit Amount non hanno il gruppo dello stato (TX-0030 non lo accetta: lo stato
// dell'indirizzo resta per le altre pagine); il dettaglio dell'intervento ha il solo gruppo dello stato. La scelta e' una
// bozza: "Applica i filtri" la porta nell'indirizzo, "Azzera" la svuota. PannelloLaterale di react-aria (focus trap, Esc,
// ritorno del focus); controlli bootstrap-italia nativi del kit.
import { useId } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { PannelloFiltriProgramma, useBozzaFiltri } from '../../../entities/filtri';
import { Caricamento, Caselle, Gruppo, PannelloLaterale } from '../../../shared/ui';
import type { StatoQuery } from '../../../shared/ui';
import { etichettaStatoArea, nessunFiltro } from '../lib/criteri';
import type { CriteriProcedurali } from '../lib/criteri';
import type { ValoriFiltri, ValoriStatiArea } from '../lib/dto';
import type { FormaCriteri } from './useCriteriNellIndirizzo';

const NOTA =
  "I filtri restano nell'indirizzo della pagina e valgono per tutte le pagine del procedurale, sottofasi comprese; le Unit Amount prendono intervento e obiettivi, non lo stato area programmazione. Voci da TX-0024 e TX-0025 (dati di programma, regionali).";
const TITOLO_STATO = 'Stato domanda area programmazione';

interface PropsStato {
  statiArea: StatoQuery<ValoriStatiArea> | null;
  bozza: CriteriProcedurali;
  setBozza: Dispatch<SetStateAction<CriteriProcedurali>>;
}

/** Le voci dello stato: quelle di TX-0025, oppure, senza (grant o errore), le sole chiavi gia' scelte, da poter togliere. */
function VociDelloStato({ statiArea, bozza, setBozza }: PropsStato) {
  const id = useId();
  const scelti = bozza.stato ?? [];
  const voci = statiArea?.data?.valori;
  const opzioni = voci ? voci.map((v) => ({ valore: v.chiave, etichetta: etichettaStatoArea(v) })) : scelti.map((s) => ({ valore: s }));
  return (
    <>
      {!voci && <p className="ui-nota">Valori dello stato area programmazione non disponibili: restano le voci dell&apos;indirizzo.</p>}
      <Caselle id={`${id}-stato`} etichetta={TITOLO_STATO} opzioni={opzioni} scelti={scelti} onCambia={(v) => setBozza((b) => ({ ...b, stato: v.length > 0 ? v : undefined }))} />
      <p className="ui-nota">Le dieci voci di RF025, poi gli stati osservati e la voce senza stato, con le descrizioni del backend.</p>
    </>
  );
}

/** Il gruppo dello stato area programmazione (TX-0025): in caricamento lo scheletro. */
function GruppoStato(p: PropsStato) {
  const inCorso = p.statiArea !== null && p.statiArea.data === undefined && !p.statiArea.isError;
  return (
    <Gruppo titolo={TITOLO_STATO} scelti={(p.bozza.stato ?? []).length} aperto>
      {inCorso ? <Caricamento testo="Caricamento degli stati area programmazione…" /> : <VociDelloStato {...p} />}
    </Gruppo>
  );
}

export interface PropsPannello {
  aperto: boolean;
  forma: FormaCriteri;
  criteri: CriteriProcedurali;
  /** La lettura di TX-0024; null senza il grant csr.tx-0024.read. */
  valori: StatoQuery<ValoriFiltri> | null;
  /** La lettura di TX-0025; null senza il grant csr.tx-0025.read o dove lo stato non si applica. */
  statiArea: StatoQuery<ValoriStatiArea> | null;
  /** Codici degli interventi della risposta del report: le voci di Intervento senza TX-0024. */
  codiciRisposta: readonly string[];
  onApplica: (c: CriteriProcedurali) => void;
  onChiudi: () => void;
}

/** Il dettaglio dell'intervento: il solo stato area programmazione (l'intervento e' quello della route). */
function PannelloDelloStato({ aperto, criteri, statiArea, onApplica, onChiudi }: PropsPannello) {
  const { bozza, setBozza } = useBozzaFiltri(aperto, criteri);
  const azioni = (
    <>
      <button type="button" className="btn btn-outline-primary" onClick={() => setBozza({})}>
        Azzera
      </button>
      <button type="button" className="btn btn-primary" onClick={() => onApplica(bozza)}>
        Applica i filtri
      </button>
    </>
  );
  return (
    <PannelloLaterale aperto={aperto} onChiudi={onChiudi} titolo="Filtri del dettaglio dell'intervento" descrizione="Restano nell'indirizzo della pagina." azioni={azioni}>
      <GruppoStato statiArea={statiArea} bozza={bozza} setBozza={setBozza} />
    </PannelloLaterale>
  );
}

export function PannelloFiltriProcedurale(props: PropsPannello) {
  const { forma, criteri, statiArea, ...pannello } = props;
  if (forma === 'soloStato') return <PannelloDelloStato {...props} />;
  const altriGruppi = forma === 'tutti' ? (bozza: CriteriProcedurali, setBozza: Dispatch<SetStateAction<CriteriProcedurali>>) => <GruppoStato statiArea={statiArea} bozza={bozza} setBozza={setBozza} /> : undefined;
  return <PannelloFiltriProgramma<CriteriProcedurali> {...pannello} criteri={criteri} titolo="Filtri dei report procedurali" nessuno={nessunFiltro(criteri, forma === 'senzaStato')} nota={NOTA} senzaAzione altriGruppi={altriGruppi} />;
}
