// PannelloFiltriProgramma — il pannello laterale dei filtri del programma con le voci di TX-0060 dell'elenco operativo
// (decisione G2), comune alle superfici del fisico e ai report dell'istituzionale (prima era tutto nel pannello del fisico:
// quando l'istituzionale ne ha avuto bisogno uguale, il pannello e' venuto qui). Gruppi del programma (GruppiProgramma)
// con le voci lette; in caricamento lo scheletro; senza il grant di TX-0060 o con TX-0060 in errore lo stato lo dice in
// testo (role=status), Intervento propone i codici delle righe della risposta del report senza descrizione, obiettivi e
// azione portante non hanno voci, e il report resta leggibile. La pagina aggiunge i suoi gruppi dopo quelli del programma
// (es. la campagna del fisico) e la sua nota. La scelta e' una bozza (useBozzaFiltri): "Applica i filtri" la porta
// nell'indirizzo, senza l'azione portante se il legame con gli interventi non c'e'; "Azzera" la svuota. PannelloLaterale
// (react-aria) da' focus trap, Esc e ritorno del focus; i controlli sono quelli del kit, bootstrap-italia nativi.
import type { Dispatch, ReactNode, SetStateAction } from 'react';
import { Caricamento, PannelloLaterale } from '../../../shared/ui';
import type { StatoQuery } from '../../../shared/ui';
import { senzaAzioneSeNonDisponibile, vociDelPannello } from '../lib/programma';
import type { ChiaveFiltro, Filtri, ValoriProgramma } from '../lib/programma';
import { GruppiProgramma } from './GruppiProgramma';
import { useBozzaFiltri } from './useFiltriProgrammaNellIndirizzo';

const NON_DISPONIBILI =
  "Valori dei filtri non disponibili: Intervento propone i codici delle righe della risposta, senza descrizione; obiettivi e azione portante non hanno voci. I filtri già nell'indirizzo restano e il report si legge comunque.";
const SENZA_VOCI = 'Nessuna voce: valori dei filtri non disponibili.';

interface PropsGruppi {
  valori: StatoQuery<ValoriProgramma> | null;
  codiciRisposta: readonly string[];
  bozza: Filtri;
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

/** Azzera e Applica i filtri: senza il legame con le azioni portanti l'azione non si applica (come nel finanziario). */
function Azioni<C extends Filtri>({ bozza, valori, onAzzera, onApplica }: { bozza: C; valori: ValoriProgramma | undefined; onAzzera: () => void; onApplica: (c: C) => void }) {
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

export interface PropsPannelloProgramma<C extends Filtri> {
  aperto: boolean;
  titolo: string;
  /** I criteri applicati (dall'indirizzo): la bozza riparte da qui a ogni apertura. */
  criteri: C;
  /** La lettura di TX-0060; null senza il grant csr.tx-0060.read. */
  valori: StatoQuery<ValoriProgramma> | null;
  /** Codici degli interventi della risposta del report: le voci di Intervento senza TX-0060. */
  codiciRisposta: readonly string[];
  /** I criteri dopo "Azzera" (nessun filtro). */
  nessuno: C;
  onApplica: (c: C) => void;
  onChiudi: () => void;
  /** I gruppi della pagina dopo quelli del programma (es. la campagna del fisico), sulla bozza. */
  altriGruppi?: (bozza: C, setBozza: Dispatch<SetStateAction<C>>) => ReactNode;
  /** Da dove vengono le voci (nota in fondo al pannello). */
  nota: string;
}

export function PannelloFiltriProgramma<C extends Filtri>({ aperto, titolo, criteri, valori, codiciRisposta, nessuno, onApplica, onChiudi, altriGruppi, nota }: PropsPannelloProgramma<C>) {
  // la bozza dei criteri riparte da quelli applicati a ogni apertura (come nel finanziario)
  const { bozza, setBozza, imposta } = useBozzaFiltri(aperto, criteri);
  return (
    <PannelloLaterale
      aperto={aperto}
      onChiudi={onChiudi}
      titolo={titolo}
      descrizione="Restano nell'indirizzo della pagina."
      azioni={<Azioni bozza={bozza} valori={valori?.data} onAzzera={() => setBozza(nessuno)} onApplica={onApplica} />}
    >
      <GruppiDelPannello valori={valori} codiciRisposta={codiciRisposta} bozza={bozza} imposta={imposta} />
      {altriGruppi?.(bozza, setBozza)}
      <p className="ui-nota">{nota}</p>
    </PannelloLaterale>
  );
}
