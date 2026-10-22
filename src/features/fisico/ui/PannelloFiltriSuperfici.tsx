// PannelloFiltriSuperfici — pannello laterale dei filtri delle superfici (flusso superfici approvato, come nel
// finanziario: OP-FIS-01). Gruppi del programma comuni col finanziario (entities/filtri, GruppiProgramma) con le voci di
// TX-0060 dell'elenco operativo (decisione G2), poi la campagna: una sola, o "Tutte le campagne", dalle campagne della
// risposta di TX-0018 (con una campagna nell'indirizzo la risposta ha solo quella: il gruppo propone quella e "Tutte le
// campagne", senza una seconda lettura: scelta approvata il 22/10/2026). Senza il grant di TX-0060 o con TX-0060 in errore
// lo stato lo dice in testo (role=status): Intervento propone i codici delle righe della risposta senza descrizione,
// obiettivi e azione portante non hanno voci, e il report resta leggibile. La scelta e' una bozza: "Applica i filtri" la
// porta nell'indirizzo, "Azzera" la svuota. PannelloLaterale (react-aria) da' focus trap, Esc e ritorno del focus; i
// controlli sono quelli del kit (gruppo, chip a scelta singola per la campagna: review H1), bootstrap-italia nativi.
import { GruppiProgramma, senzaAzioneSeNonDisponibile, useBozzaFiltri } from '../../../entities/filtri';
import type { ChiaveFiltro } from '../../../entities/filtri';
import { Caricamento, Gruppo, PannelloLaterale, Scelte } from '../../../shared/ui';
import type { StatoQuery } from '../../../shared/ui';
import type { ValoriFiltriElenco } from '../api';
import { campagnaDaTesto, conCampagna, vociDelPannello } from '../lib/criteri';
import type { Criteri } from '../lib/criteri';
import { campagneProposte } from '../lib/superfici';

const NON_DISPONIBILI =
  "Valori dei filtri non disponibili: Intervento propone i codici delle righe della risposta, senza descrizione; obiettivi e azione portante non hanno voci. I filtri già nell'indirizzo restano e il report si legge comunque.";
const SENZA_VOCI = 'Nessuna voce: valori dei filtri non disponibili.';

/** Campagna: una sola alla volta, oppure tutte (parametro non ripetibile di TX-0018): "Tutte le campagne" e' la voce senza valore. */
function GruppoCampagna({ campagne, scelta, onScegli }: { campagne: readonly number[]; scelta: number | undefined; onScegli: (c: number | undefined) => void }) {
  const voci = [{ valore: '', etichetta: 'Tutte le campagne' }, ...campagne.map((c) => ({ valore: String(c), etichetta: String(c) }))];
  return (
    <Gruppo titolo="Campagna (un solo anno)" scelti={scelta === undefined ? 0 : 1} aperto>
      <Scelte etichetta="Campagna" opzioni={voci} scelti={[scelta === undefined ? '' : String(scelta)]} esclusive onCambia={(v) => onScegli(campagnaDaTesto(v[0]))} />
    </Gruppo>
  );
}

interface PropsPannello {
  aperto: boolean;
  criteri: Criteri;
  /** La lettura di TX-0060; null senza il grant csr.tx-0060.read. */
  valori: StatoQuery<ValoriFiltriElenco> | null;
  /** Campagne proposte: quelle della risposta di TX-0018 (e quella scelta). */
  campagne: readonly number[];
  /** Codici degli interventi della risposta: le voci di Intervento senza TX-0060. */
  codiciRisposta: readonly string[];
  onApplica: (c: Criteri) => void;
  onChiudi: () => void;
}

/** Azzera e Applica i filtri: senza il legame con le azioni portanti l'azione non si applica (come nel finanziario). */
function Azioni({ bozza, valori, onAzzera, onApplica }: { bozza: Criteri; valori: ValoriFiltriElenco | undefined; onAzzera: () => void; onApplica: (c: Criteri) => void }) {
  return (
    <>
      <button type="button" className="btn btn-outline-primary" onClick={onAzzera}>
        Azzera
      </button>
      <button type="button" className="btn btn-primary" onClick={() => onApplica(valori ? senzaAzioneSeNonDisponibile(bozza, valori.legameAzioniDisponibile === true) : bozza)}>
        Applica i filtri
      </button>
    </>
  );
}

interface PropsGruppi {
  valori: StatoQuery<ValoriFiltriElenco> | null;
  codiciRisposta: readonly string[];
  bozza: Criteri;
  imposta: (k: ChiaveFiltro) => (v: string[]) => void;
}

/** I gruppi del programma: in caricamento, oppure con le voci di TX-0060 o, senza, coi codici della risposta e lo stato detto. */
function GruppiDelPannello({ valori, codiciRisposta, bozza, imposta }: PropsGruppi) {
  const disponibili = valori?.data;
  if (valori !== null && disponibili === undefined && !valori.isError) return <Caricamento testo="Caricamento dei valori dei filtri…" />;
  return (
    <>
      {!disponibili && (
        <p className="ui-nota" role="status">
          {NON_DISPONIBILI}
        </p>
      )}
      <GruppiProgramma valori={vociDelPannello(disponibili, codiciRisposta)} bozza={bozza} imposta={imposta} senzaVoci={disponibili ? undefined : SENZA_VOCI} />
    </>
  );
}

export function PannelloFiltriSuperfici({ aperto, criteri, valori, campagne, codiciRisposta, onApplica, onChiudi }: PropsPannello) {
  // la bozza dei criteri riparte da quelli applicati a ogni apertura (entities/filtri, come nel finanziario)
  const { bozza, setBozza, imposta } = useBozzaFiltri(aperto, criteri);
  return (
    <PannelloLaterale
      aperto={aperto}
      onChiudi={onChiudi}
      titolo="Filtri delle superfici ammissibili"
      descrizione="Restano nell'indirizzo della pagina."
      azioni={<Azioni bozza={bozza} valori={valori?.data} onAzzera={() => setBozza({})} onApplica={onApplica} />}
    >
      <GruppiDelPannello valori={valori} codiciRisposta={codiciRisposta} bozza={bozza} imposta={imposta} />
      <GruppoCampagna campagne={campagneProposte(campagne, bozza.campagna)} scelta={bozza.campagna} onScegli={(c) => setBozza((b) => conCampagna(b, c))} />
      <p className="ui-nota">
        {"Voci di Intervento, obiettivi e azioni portanti da TX-0060 dell'elenco operativo (valori regionali); voci di Campagna dalle campagne della risposta. La campagna è una sola alla volta."}
      </p>
    </PannelloLaterale>
  );
}
