// PannelloFiltri — pannello laterale dei filtri di RF001 (UI v2, wireframe panoramica): interventi con ricerca e caselle
// (codice e descrizione dal backend), OS, OG e OP come chip, azione portante disabilitata con la spiegazione finche' manca
// il legame (OP-002). La scelta e' una bozza: "Applica" la porta nell'indirizzo, "Azzera" la svuota. Valori ammessi solo
// quelli di TX-0001; stesso filtro = valori in alternativa, filtri diversi = insieme.
import { useId, useState } from 'react';
import type { ReactNode } from 'react';
import { filtraRighe } from '../../../shared/lib';
import { ErroreVista, PannelloLaterale, VistaQuery } from '../../../shared/ui';
import { useFiltri } from '../api';
import type { FiltriFinanziari, VoceFiltro } from '../api';
import { ETICHETTE_FILTRO, senzaAzioneSeNonDisponibile } from '../lib/filtri';
import type { ChiaveFiltro, Filtri } from '../lib/filtri';

interface Opzione {
  valore: string;
  descrizione?: string;
}

const daVoci = (voci: VoceFiltro[] | undefined): Opzione[] =>
  (voci ?? []).filter((v): v is VoceFiltro & { chiave: string } => !!v.chiave).map((v) => ({ valore: v.chiave, descrizione: v.descrizione ?? undefined }));
const daTesti = (testi: string[] | undefined): Opzione[] => (testi ?? []).map((t) => ({ valore: t }));

function Gruppo({ titolo, scelti, aperto = false, children }: { titolo: string; scelti: number; aperto?: boolean; children: ReactNode }) {
  return (
    <details className="ui-gruppo-filtro" open={aperto}>
      <summary>
        {titolo}
        {scelti > 0 && <span className="ui-gruppo-filtro__conta">{scelti === 1 ? '1 scelto' : `${scelti} scelti`}</span>}
      </summary>
      <div className="ui-gruppo-filtro__corpo">{children}</div>
    </details>
  );
}

function Caselle({ id, etichetta, opzioni, scelti, disabilitato, onCambia }: { id: string; etichetta: string; opzioni: Opzione[]; scelti: string[]; disabilitato?: boolean; onCambia: (v: string[]) => void }) {
  const [cercato, setCercato] = useState('');
  // stessa ricerca della tabella interattiva: senza distinguere maiuscole e accenti
  const visibili = filtraRighe(opzioni, cercato, (o) => `${o.valore} ${o.descrizione ?? ''}`);
  return (
    <fieldset disabled={disabilitato}>
      <legend className="visually-hidden">{etichetta}</legend>
      {opzioni.length > 8 && (
        <>
          <label className="visually-hidden" htmlFor={`${id}-cerca`}>{`Cerca in ${etichetta}`}</label>
          <input id={`${id}-cerca`} className="ui-campo-cerca" type="search" placeholder="Cerca per codice o descrizione" value={cercato} onChange={(e) => setCercato(e.target.value)} />
        </>
      )}
      <div className="ui-opzioni">
        {visibili.map((o) => (
          <label key={o.valore} className="ui-opzione">
            <input
              type="checkbox"
              checked={scelti.includes(o.valore)}
              onChange={(e) => onCambia(e.target.checked ? [...scelti, o.valore] : scelti.filter((v) => v !== o.valore))}
            />
            <span>
              <span className="ui-opzione__codice">{o.valore}</span> {o.descrizione && <span className="ui-opzione__descr">{o.descrizione}</span>}
            </span>
          </label>
        ))}
        {visibili.length === 0 && <p className="small text-muted mb-0">Nessuna voce corrisponde alla ricerca.</p>}
      </div>
    </fieldset>
  );
}

function Chip({ etichetta, opzioni, scelti, onCambia }: { etichetta: string; opzioni: Opzione[]; scelti: string[]; onCambia: (v: string[]) => void }) {
  return (
    <div className="ui-toggle-chips" role="group" aria-label={etichetta}>
      {opzioni.map((o) => {
        const attivo = scelti.includes(o.valore);
        return (
          <button key={o.valore} type="button" className="ui-toggle-chip" aria-pressed={attivo} onClick={() => onCambia(attivo ? scelti.filter((v) => v !== o.valore) : [...scelti, o.valore])}>
            {o.descrizione ? `${o.valore} - ${o.descrizione}` : o.valore}
          </button>
        );
      })}
    </div>
  );
}

function Contenuto({ dati, bozza, imposta }: { dati: FiltriFinanziari; bozza: Filtri; imposta: (k: ChiaveFiltro) => (v: string[]) => void }) {
  const id = useId();
  const legame = dati.legameAzioniDisponibile === true;
  const sel = (k: ChiaveFiltro) => bozza[k] ?? [];
  // le etichette estese della lib, le stesse dei chip della barra in forma breve (H-07)
  const nome = (k: ChiaveFiltro) => ETICHETTE_FILTRO[k].estesa;
  return (
    <>
      <Gruppo titolo={nome('intervento')} scelti={sel('intervento').length} aperto>
        <Caselle id={`${id}-int`} etichetta={nome('intervento')} opzioni={daVoci(dati.interventi)} scelti={sel('intervento')} onCambia={imposta('intervento')} />
      </Gruppo>
      <Gruppo titolo={nome('og')} scelti={sel('og').length}>
        <Chip etichetta={nome('og')} opzioni={daTesti(dati.obiettiviGenerali)} scelti={sel('og')} onCambia={imposta('og')} />
      </Gruppo>
      <Gruppo titolo={nome('os')} scelti={sel('os').length}>
        <Chip etichetta={nome('os')} opzioni={daVoci(dati.obiettiviSpecifici)} scelti={sel('os')} onCambia={imposta('os')} />
      </Gruppo>
      <Gruppo titolo={nome('op')} scelti={sel('op').length}>
        <Chip etichetta={nome('op')} opzioni={daTesti(dati.obiettiviPolicy)} scelti={sel('op')} onCambia={imposta('op')} />
      </Gruppo>
      <Gruppo titolo={nome('azione')} scelti={sel('azione').length}>
        {!legame && <p className="ui-nota">{"Non disponibile finché nessun intervento è collegato a un'azione portante."}</p>}
        <Caselle id={`${id}-az`} etichetta={nome('azione')} opzioni={daVoci(dati.azioniPortanti)} scelti={sel('azione')} disabilitato={!legame} onCambia={imposta('azione')} />
      </Gruppo>
      <p className="ui-nota">Valori dello stesso filtro in alternativa (O); filtri diversi insieme (E). Nessuna scelta: tutti i valori.</p>
    </>
  );
}

export function PannelloFiltri({ aperto, valori, onApplica, onChiudi }: { aperto: boolean; valori: Filtri; onApplica: (f: Filtri) => void; onChiudi: () => void }) {
  const stato = useFiltri(aperto);
  const legame = stato.data?.legameAzioniDisponibile === true;
  const [bozza, setBozza] = useState<Filtri>(valori);
  const [apertoPrima, setApertoPrima] = useState(aperto);
  // all'apertura la bozza riparte dai filtri applicati (stato derivato dal prop, senza effetti)
  if (aperto !== apertoPrima) {
    setApertoPrima(aperto);
    if (aperto) setBozza(valori);
  }
  const imposta = (k: ChiaveFiltro) => (v: string[]) => setBozza((b) => ({ ...b, [k]: v.length > 0 ? v : undefined }));
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
        {(dati) => <Contenuto dati={dati} bozza={bozza} imposta={imposta} />}
      </VistaQuery>
    </PannelloLaterale>
  );
}
