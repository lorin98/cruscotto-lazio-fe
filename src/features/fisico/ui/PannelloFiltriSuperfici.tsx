// PannelloFiltriSuperfici — pannello laterale dei filtri delle superfici (flusso superfici approvato, come nel
// finanziario: OP-FIS-01). Il pannello dei filtri del programma con le voci di TX-0060 dell'elenco operativo (decisione G2)
// e il suo stato senza voci (senza il grant di TX-0060 o con TX-0060 in errore: Intervento propone i codici delle righe
// della risposta, il report resta leggibile) e' quello comune di entities/filtri (PannelloFiltriProgramma, nato qui e
// spostato quando l'istituzionale ne ha avuto bisogno uguale); qui la campagna: una sola, o "Tutte le campagne", dalle
// campagne della risposta di TX-0018 (con una campagna nell'indirizzo la risposta ha solo quella: il gruppo propone
// quella e "Tutte le campagne", senza una seconda lettura: scelta approvata il 22/10/2026). La scelta e' una bozza:
// "Applica i filtri" la porta nell'indirizzo, "Azzera" la svuota. I controlli sono quelli del kit (gruppo, chip a scelta
// singola per la campagna: review H1), bootstrap-italia nativi; focus trap ed Esc del PannelloLaterale di react-aria.
import { PannelloFiltriProgramma } from '../../../entities/filtri';
import { Gruppo, Scelte } from '../../../shared/ui';
import type { StatoQuery } from '../../../shared/ui';
import type { ValoriFiltriElenco } from '../api';
import { campagnaDaTesto, conCampagna } from '../lib/criteri';
import type { Criteri } from '../lib/criteri';
import { campagneProposte } from '../lib/superfici';

const NOTA =
  "Voci di Intervento, obiettivi e azioni portanti da TX-0060 dell'elenco operativo (valori regionali); voci di Campagna dalle campagne della risposta. La campagna è una sola alla volta.";

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

export function PannelloFiltriSuperfici({ campagne, ...pannello }: PropsPannello) {
  return (
    <PannelloFiltriProgramma<Criteri>
      {...pannello}
      titolo="Filtri delle superfici ammissibili"
      nessuno={{}}
      nota={NOTA}
      altriGruppi={(bozza, setBozza) => <GruppoCampagna campagne={campagneProposte(campagne, bozza.campagna)} scelta={bozza.campagna} onScegli={(c) => setBozza((b) => conCampagna(b, c))} />}
    />
  );
}
