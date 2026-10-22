// PannelloFiltriSuperfici — pannello laterale dei filtri delle superfici (flusso superfici approvato, come nel
// finanziario: OP-FIS-01). Gruppi del programma comuni col finanziario (entities/filtri, GruppiProgramma) con le voci di
// TX-0060 dell'elenco operativo (decisione G2), poi la campagna: una sola, o "Tutte le campagne", dalle campagne della
// risposta di TX-0018 (con una campagna nell'indirizzo la risposta ha solo quella: il gruppo propone quella e "Tutte le
// campagne", senza una seconda lettura: scelta approvata il 22/10/2026). Senza il grant di TX-0060 o con TX-0060 in errore
// lo stato lo dice in testo (role=status): Intervento propone i codici delle righe della risposta senza descrizione,
// obiettivi e azione portante non hanno voci, e il report resta leggibile. La scelta e' una bozza: "Applica i filtri" la
// porta nell'indirizzo, "Azzera" la svuota. PannelloLaterale (react-aria) da' focus trap, Esc e ritorno del focus; i
// controlli sono bootstrap-italia nativi (caselle, bottoni con aria-pressed).
import { useState } from 'react';
import { Gruppo, GruppiProgramma, senzaAzioneSeNonDisponibile } from '../../../entities/filtri';
import type { ChiaveFiltro, ValoriProgramma } from '../../../entities/filtri';
import { Caricamento, PannelloLaterale } from '../../../shared/ui';
import type { StatoQuery } from '../../../shared/ui';
import type { ValoriFiltriElenco } from '../api';
import { conCampagna } from '../lib/criteri';
import type { Criteri } from '../lib/criteri';

const NON_DISPONIBILI =
  "Valori dei filtri non disponibili: Intervento propone i codici delle righe della risposta, senza descrizione; obiettivi e azione portante non hanno voci. I filtri già nell'indirizzo restano e il report si legge comunque.";
const SENZA_VOCI = 'Nessuna voce: valori dei filtri non disponibili.';

/** Campagna: una sola alla volta, oppure tutte (parametro non ripetibile di TX-0018). */
function GruppoCampagna({ campagne, scelta, onScegli }: { campagne: readonly number[]; scelta: number | undefined; onScegli: (c: number | undefined) => void }) {
  const voci: Array<[number | undefined, string]> = [[undefined, 'Tutte le campagne'], ...campagne.map((c): [number, string] => [c, String(c)])];
  return (
    <Gruppo titolo="Campagna (un solo anno)" scelti={scelta === undefined ? 0 : 1} aperto>
      <div className="ui-toggle-chips" role="group" aria-label="Campagna">
        {voci.map(([valore, testo]) => (
          <button key={testo} type="button" className="ui-toggle-chip" aria-pressed={scelta === valore} onClick={() => onScegli(valore)}>
            {testo}
          </button>
        ))}
      </div>
    </Gruppo>
  );
}

/** Le voci dei gruppi: quelle di TX-0060, oppure i soli codici degli interventi della risposta. */
function valoriDei(valori: ValoriFiltriElenco | undefined, codiciRisposta: readonly string[]): ValoriProgramma {
  return valori ?? { interventi: codiciRisposta.map((chiave) => ({ chiave })) };
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

/** La bozza dei criteri: all'apertura riparte da quelli applicati (stato derivato dal prop, senza effetti). */
function useBozza(aperto: boolean, criteri: Criteri) {
  const [bozza, setBozza] = useState<Criteri>(criteri);
  const [apertoPrima, setApertoPrima] = useState(aperto);
  if (aperto !== apertoPrima) {
    setApertoPrima(aperto);
    if (aperto) setBozza(criteri);
  }
  const imposta = (k: ChiaveFiltro) => (v: string[]) => setBozza((b) => ({ ...b, [k]: v.length > 0 ? v : undefined }));
  return { bozza, setBozza, imposta };
}

/** Le campagne da proporre: quelle della risposta, e quella della bozza se non c'e' (con una campagna gia' scelta). */
function campagneProposte(campagne: readonly number[], scelta: number | undefined): readonly number[] {
  return scelta === undefined || campagne.includes(scelta) ? campagne : [scelta, ...campagne];
}

export function PannelloFiltriSuperfici({ aperto, criteri, valori, campagne, codiciRisposta, onApplica, onChiudi }: PropsPannello) {
  const { bozza, setBozza, imposta } = useBozza(aperto, criteri);
  const disponibili = valori?.data;
  const inCaricamento = valori !== null && disponibili === undefined && !valori.isError;
  const legame = disponibili?.legameAzioniDisponibile === true;
  const proposte = campagneProposte(campagne, bozza.campagna);
  return (
    <PannelloLaterale
      aperto={aperto}
      onChiudi={onChiudi}
      titolo="Filtri delle superfici ammissibili"
      descrizione="Restano nell'indirizzo della pagina."
      azioni={
        <>
          <button type="button" className="btn btn-outline-primary" onClick={() => setBozza({})}>
            Azzera
          </button>
          <button type="button" className="btn btn-primary" onClick={() => onApplica(disponibili ? senzaAzioneSeNonDisponibile(bozza, legame) : bozza)}>
            Applica i filtri
          </button>
        </>
      }
    >
      {inCaricamento ? (
        <Caricamento testo="Caricamento dei valori dei filtri…" />
      ) : (
        <>
          {!disponibili && (
            <p className="ui-nota" role="status">
              {NON_DISPONIBILI}
            </p>
          )}
          <GruppiProgramma valori={valoriDei(disponibili, codiciRisposta)} bozza={bozza} imposta={imposta} senzaVoci={disponibili ? undefined : SENZA_VOCI} />
        </>
      )}
      <GruppoCampagna campagne={proposte} scelta={bozza.campagna} onScegli={(c) => setBozza((b) => conCampagna(b, c))} />
      <p className="ui-nota">
        {"Voci di Intervento, obiettivi e azioni portanti da TX-0060 dell'elenco operativo (valori regionali); voci di Campagna dalle campagne della risposta. La campagna è una sola alla volta."}
      </p>
    </PannelloLaterale>
  );
}
