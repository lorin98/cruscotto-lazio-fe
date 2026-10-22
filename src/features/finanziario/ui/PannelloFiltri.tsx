// PannelloFiltri — pannello laterale dei filtri di RF001 (UI v2, wireframe panoramica): interventi con ricerca e caselle
// (codice e descrizione dal backend), OS, OG e OP come chip, azione portante disabilitata con la spiegazione finche' manca
// il legame (OP-002): i gruppi e la bozza sono quelli comuni col fisico (entities/filtri: GruppiProgramma, useBozzaFiltri).
// La scelta e' una bozza: "Applica" la porta nell'indirizzo, "Azzera" la svuota. Valori ammessi solo quelli di TX-0001; stesso filtro = valori in
// alternativa, filtri diversi = insieme.
import { GruppiProgramma, useBozzaFiltri } from '../../../entities/filtri';
import { ErroreVista, PannelloLaterale, VistaQuery } from '../../../shared/ui';
import { useFiltri } from '../api';
import { senzaAzioneSeNonDisponibile } from '../lib/filtri';
import type { Filtri } from '../lib/filtri';

export function PannelloFiltri({ aperto, valori, onApplica, onChiudi }: { aperto: boolean; valori: Filtri; onApplica: (f: Filtri) => void; onChiudi: () => void }) {
  const stato = useFiltri(aperto);
  const legame = stato.data?.legameAzioniDisponibile === true;
  // all'apertura la bozza riparte dai filtri applicati
  const { bozza, setBozza, imposta } = useBozzaFiltri(aperto, valori);
  return (
    <PannelloLaterale
      aperto={aperto}
      onChiudi={onChiudi}
      titolo="Filtri"
      descrizione="Valgono per tutti i report del finanziario e restano nell'indirizzo della pagina."
      azioni={
        <>
          <button type="button" className="btn btn-outline-primary" onClick={() => setBozza({})}>
            Azzera
          </button>
          <button type="button" className="btn btn-primary" onClick={() => onApplica(senzaAzioneSeNonDisponibile(bozza, legame))}>
            Applica i filtri
          </button>
        </>
      }
    >
      <VistaQuery
        stato={stato}
        errorePersonalizzato={(e) => <ErroreVista errore={e} contesto="Valori dei filtri non disponibili: i report restano consultabili senza filtri." onRiprova={() => void stato.refetch()} />}
        eVuoto={(d) => (d.interventi ?? []).length === 0}
        vuoto="Nessun intervento in programmazione: i filtri non sono disponibili."
      >
        {(dati) => <GruppiProgramma valori={dati} bozza={bozza} imposta={imposta} />}
      </VistaQuery>
    </PannelloLaterale>
  );
}
