// FiltriForm — pattern DS "form guidata" (route /finanziario, TX-0001, flusso riepilogo, wireframe filtri.html).
// Select multiple native con le classi bootstrap-italia (label for/id, aria-describedby, fieldset/legend): sono
// accessibili da tastiera senza react-aria. Nessuna validazione: i filtri sono tutti facoltativi e i valori ammessi
// arrivano dal backend. L'azione portante e' disabilitata, con la spiegazione, finche' manca il legame (OP-002). Il
// testo dice come si combinano i filtri (stesso filtro: in alternativa; filtri diversi: insieme). OG e OP arrivano dal
// backend come obiettivi singoli (OP1..OP5), anche per gli interventi che ne hanno piu' d'uno.
import { useState } from 'react';
import { ErroreVista, VistaQuery } from '../../../shared/ui';
import { useFiltri } from '../api';
import type { FiltriFinanziari, VoceFiltro } from '../api';
import { senzaAzioneSeNonDisponibile } from '../lib/filtri';
import type { ChiaveFiltro, Filtri } from '../lib/filtri';

interface Opzione {
  valore: string;
  etichetta: string;
}

const daVoci = (voci: VoceFiltro[] | undefined): Opzione[] =>
  (voci ?? [])
    .filter((v): v is VoceFiltro & { chiave: string } => !!v.chiave)
    .map((v) => ({ valore: v.chiave, etichetta: v.descrizione ? `${v.chiave} - ${v.descrizione}` : v.chiave }));
const daTesti = (testi: string[] | undefined): Opzione[] =>
  (testi ?? []).map((t) => ({ valore: t, etichetta: t }));

function SelectMultipla(props: {
  id: string;
  etichetta: string;
  aiuto: string;
  opzioni: Opzione[];
  selezionati: string[];
  disabilitato?: boolean;
  onCambia: (valori: string[]) => void;
}) {
  const { id, etichetta, aiuto, opzioni, selezionati, disabilitato, onCambia } = props;
  return (
    <div className="select-wrapper mb-3">
      <label htmlFor={id} className="form-label">
        {etichetta}
      </label>
      <select
        id={id}
        className="form-select"
        multiple
        size={Math.min(8, Math.max(3, opzioni.length))}
        value={selezionati}
        disabled={disabilitato}
        aria-describedby={`${id}-aiuto`}
        onChange={(e) => onCambia(Array.from(e.target.selectedOptions, (o) => o.value))}
      >
        {opzioni.map((o) => (
          <option key={o.valore} value={o.valore}>
            {o.etichetta}
          </option>
        ))}
      </select>
      <p className="form-text" id={`${id}-aiuto`}>
        {aiuto}
      </p>
    </div>
  );
}

function Modulo(props: { dati: FiltriFinanziari; valori: Filtri; onApplica: (f: Filtri) => void; onAzzera: () => void }) {
  const { dati, valori, onApplica, onAzzera } = props;
  const legame = dati.legameAzioniDisponibile === true;
  const [scelti, setScelti] = useState<Filtri>(senzaAzioneSeNonDisponibile(valori, legame));
  const imposta = (k: ChiaveFiltro) => (v: string[]) => setScelti((s) => ({ ...s, [k]: v.length > 0 ? v : undefined }));
  const sel = (k: ChiaveFiltro) => scelti[k] ?? [];
  const multipla = 'Selezione multipla con Ctrl o Maiuscolo: i valori scelti valgono in alternativa. Nessuna scelta: tutti i valori.';
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onApplica(senzaAzioneSeNonDisponibile(scelti, legame));
      }}
    >
      <p className="mb-3">Filtri diversi valgono insieme: un intervento o una domanda devono rispettarli tutti.</p>
      <fieldset className="mb-3">
        <legend className="h5">Programmazione</legend>
        <SelectMultipla id="f-intervento" etichetta="Intervento" aiuto={multipla} opzioni={daVoci(dati.interventi)} selezionati={sel('intervento')} onCambia={imposta('intervento')} />
        <SelectMultipla id="f-os" etichetta="Obiettivo specifico (OS)" aiuto={multipla} opzioni={daVoci(dati.obiettiviSpecifici)} selezionati={sel('os')} onCambia={imposta('os')} />
        <SelectMultipla id="f-og" etichetta="Obiettivo generale (OG)" aiuto={multipla} opzioni={daTesti(dati.obiettiviGenerali)} selezionati={sel('og')} onCambia={imposta('og')} />
        <SelectMultipla id="f-op" etichetta="Obiettivo di policy (OP)" aiuto={multipla} opzioni={daTesti(dati.obiettiviPolicy)} selezionati={sel('op')} onCambia={imposta('op')} />
      </fieldset>
      <fieldset className="mb-3">
        <legend className="h5">Azioni portanti</legend>
        <SelectMultipla
          id="f-azione"
          etichetta="Azione portante"
          aiuto={legame ? multipla : "Non disponibile finché nessun intervento è collegato a un'azione portante."}
          opzioni={daVoci(dati.azioniPortanti)}
          selezionati={sel('azione')}
          disabilitato={!legame}
          onCambia={imposta('azione')}
        />
        {!legame && valori.azione && <p className="small mb-0">{"Il filtro per azione portante dell'indirizzo non viene applicato: nessun intervento è collegato alle azioni portanti."}</p>}
      </fieldset>
      <button type="submit" className="btn btn-primary me-2">
        Applica filtri
      </button>
      <button type="button" className="btn btn-outline-primary" onClick={() => { setScelti({}); onAzzera(); }}>
        Azzera i filtri
      </button>
    </form>
  );
}

/** Form dei filtri; "Azzera" toglie anche i filtri gia' applicati (la pagina pulisce l'indirizzo con onAzzera). */
export function FiltriForm(props: { valori: Filtri; onApplica: (filtri: Filtri) => void; onAzzera: () => void }) {
  const { valori, onApplica, onAzzera } = props;
  const stato = useFiltri();
  const errore = (e: unknown) => (
    <ErroreVista errore={e} contesto="Valori dei filtri non disponibili: i report restano consultabili senza filtri." onRiprova={() => void stato.refetch()} />
  );
  return (
    <VistaQuery stato={stato} errorePersonalizzato={errore} eVuoto={(d) => (d.interventi ?? []).length === 0} vuoto="Nessun intervento in programmazione: i filtri non sono disponibili.">
      {(dati) => <Modulo dati={dati} valori={valori} onApplica={onApplica} onAzzera={onAzzera} />}
    </VistaQuery>
  );
}
