// PannelloFiltriIstituzionale — pannello laterale dei filtri dei due report istituzionali (wireframe verifica-smp-non-sigc
// e verifica-smp-sigc approvati): il pannello comune di entities/filtri (PannelloFiltriProgramma, lo stesso del fisico)
// con le voci di TX-0060 dell'elenco operativo (decisione G2): interventi con la descrizione (senza AT001), obiettivi
// specifico, generale e di policy, azione portante disabilitata finche' manca il legame. Senza il grant di TX-0060 o con
// TX-0060 in errore Intervento propone i codici delle righe della risposta e lo stato lo dice (role=status). La scelta e'
// una bozza: "Applica i filtri" la porta nell'indirizzo, "Azzera" la svuota. PannelloLaterale di react-aria (focus trap,
// Esc, ritorno del focus); controlli bootstrap-italia nativi del kit.
import { PannelloFiltriProgramma } from '../../../entities/filtri';
import type { Filtri } from '../../../entities/filtri';
import type { StatoQuery } from '../../../shared/ui';
import type { ValoriFiltriElenco } from '../api';

const NOTA = "Valori da TX-0060 dell'elenco operativo: gli interventi del CSR con la descrizione (senza l'Assistenza tecnica AT001), gli obiettivi e le azioni portanti.";

interface PropsPannello {
  aperto: boolean;
  filtri: Filtri;
  /** La lettura di TX-0060; null senza il grant csr.tx-0060.read. */
  valori: StatoQuery<ValoriFiltriElenco> | null;
  /** Codici degli interventi della risposta del report: le voci di Intervento senza TX-0060. */
  codiciRisposta: readonly string[];
  onApplica: (f: Filtri) => void;
  onChiudi: () => void;
}

export function PannelloFiltriIstituzionale({ filtri, ...pannello }: PropsPannello) {
  return <PannelloFiltriProgramma<Filtri> {...pannello} criteri={filtri} titolo="Filtri dei report istituzionali" nessuno={{}} nota={NOTA} />;
}
