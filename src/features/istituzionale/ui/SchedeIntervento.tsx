// SchedeIntervento — le schede del dettaglio dell'intervento (flusso intervento approvato): "Verifica SMP non SIGC"
// (selettore dell'anno di riferimento, le venti voci di TX-0016 come tabella a due colonne con intestazione di riga e i
// link verso l'elenco; CSV, XLSX). Le schede "Output per anno" e "Importi unitari" di TX-0017 sono uscite col
// riallineamento degli ambiti del 29/10/2026 (output regionale nel fisico); la scheda della verifica SMP SIGC (TX-0015) e'
// dei passi successivi. Ogni scheda c'e' solo col grant della sua transazione (gate di UX) e la scheda attiva e' stato
// della pagina (in DettaglioIntervento), non dell'indirizzo. L'errore di una lettura senza risposta lo dice l'avviso della
// pagina, che lo registra una volta (DettaglioIntervento): nella scheda resta il testo statico.
// Tabs di react-aria-components (tablist con le frecce da tastiera, tabpanel collegato: il comportamento ARIA complesso
// del pattern); dentro, classi bootstrap-italia e del kit.
import { Tab, TabList, TabPanel, Tabs } from 'react-aria-components';
import { rigaDellIntervento } from '../../../entities/filtri';
import { AvvisoAggiornamento, ErroreNellaPagina, PulsantiScarica, SelettoreAnno, TabellaVoci, VistaQuery, Vuoto } from '../../../shared/ui';
import { useVerificaSmpNonSigc } from '../api';
import { anniDiRiferimento, criteriVerifica, soloIntervento } from '../lib/criteri';
import type { Verifica } from '../lib/dto';
import { DEFINIZIONI_VERIFICA, NESSUN_FILE } from '../lib/formato';
import { TITOLI_SCHEDE, captionVociVerifica, schedeVisibili, testoAggiornamentoAnno } from '../lib/intervento';
import type { IdScheda } from '../lib/intervento';
import { DATI_VERIFICA, titoloDato } from '../lib/verifica';
import { CellaDato } from './comuni';
import { fileVerifica } from './esportazioni';
import { usePuoAprireElenco } from './navigazione';

type StatoVerifica = ReturnType<typeof useVerificaSmpNonSigc>;

const AIUTO_ANNO = "Facoltativo. Vale per indicatori, output e dati dell'avviso; domande e spesa sono cumulative.";
/** L'errore senza risposta nella scheda: il solo testo statico, senza registrarlo di nuovo nell'avviso della pagina. */
const nellaPagina = () => <ErroreNellaPagina />;

/**
 * Le venti voci della verifica dell'intervento, coi link verso l'elenco e i file di TX-0016 dell'intervento e dell'anno.
 * Le quantita' di output sono senza unita' di misura: l'unita' veniva da TX-0017, ora del fisico (OP-IS-12).
 */
function VociVerifica({ d, codice, anno }: { d: Verifica; codice: string; anno: number | undefined }) {
  const puo = usePuoAprireElenco();
  const r = rigaDellIntervento(d.righe, codice);
  if (!r) return <Vuoto>Nessun dato della verifica SMP non SIGC per questo intervento.</Vuoto>;
  const voci = DATI_VERIFICA.map((x) => ({ etichetta: titoloDato(x, 'voce', d.outputCumulativo), valore: <CellaDato r={r} d={x} indicatore={r.indicatoreOutput.valore} puo={puo} /> }));
  return (
    <>
      {d.annoRiferimento === null && <Vuoto>{NESSUN_FILE}</Vuoto>}
      <div className="ui-strumenti">
        <PulsantiScarica oggetto={`la verifica SMP non SIGC dell'intervento ${codice}`} scaricamenti={fileVerifica(`Verifica SMP non SIGC ${codice}`, criteriVerifica(soloIntervento(codice), anno))} />
      </div>
      <TabellaVoci caption={captionVociVerifica(d.annoRiferimento)} voci={voci} />
      <p className="ui-fonte">{DEFINIZIONI_VERIFICA}</p>
    </>
  );
}

interface PropsVerifica {
  stato: StatoVerifica;
  codice: string;
  anno: number | undefined;
  onAnno: (anno: number | undefined) => void;
}

/**
 * Il selettore dell'anno resta montato mentre si legge un altro anno: il focus su "Mostra". I dati di prima restano con
 * lo stile di aggiornamento del kit (ui-risultati con aria-busy) e lo stato detto in role=status (review A3), con l'anno
 * dei dati che restano, lo stesso della didascalia (review X1).
 */
function SchedaVerifica({ stato, codice, anno, onAnno }: PropsVerifica) {
  return (
    <>
      <SelettoreAnno id="f-anno-intervento" etichetta="Anno di riferimento del monitoraggio SMP non SIGC" aiuto={AIUTO_ANNO} anni={anniDiRiferimento(stato.data?.annoRiferimento, anno)} voceVuota="Ultimo anno con un file (predefinito)" anno={anno} onCambia={onAnno} />
      <AvvisoAggiornamento attivo={stato.isPlaceholderData} testo={testoAggiornamentoAnno(anno, stato.data?.annoRiferimento)} />
      <div className="ui-risultati" aria-busy={stato.isPlaceholderData || undefined}>
        <VistaQuery stato={stato} errorePersonalizzato={nellaPagina}>
          {(d) => <VociVerifica d={d} codice={codice} anno={anno} />}
        </VistaQuery>
      </div>
    </>
  );
}

export interface PropsSchede {
  codice: string;
  anno: number | undefined;
  onAnno: (anno: number | undefined) => void;
  /** La lettura dell'intervento; null senza il grant della transazione (la scheda non c'e'). */
  verifica: StatoVerifica | null;
  /** La scheda scelta dall'utente (stato della pagina: resta mentre una lettura riparte); null = la prima. */
  scheda: IdScheda | null;
  onScheda: (s: IdScheda) => void;
}

/** La scheda attiva: la scelta dell'utente se ancora visibile, altrimenti la prima. */
function schedaAttiva(schede: readonly IdScheda[], scelta: IdScheda | null): IdScheda | undefined {
  return scelta !== null && schede.includes(scelta) ? scelta : schede[0];
}

/** La tablist con le schede visibili, nell'ordine del wireframe. */
function ListaSchede({ schede }: { schede: readonly IdScheda[] }) {
  return (
    <TabList aria-label="Sezioni dell'intervento" className="ui-tabs">
      {schede.map((s) => (
        <Tab key={s} id={s} className="ui-tab">
          {TITOLI_SCHEDE[s]}
        </Tab>
      ))}
    </TabList>
  );
}

export function SchedeIntervento({ codice, anno, onAnno, verifica, scheda, onScheda }: PropsSchede) {
  const schede = schedeVisibili(verifica !== null, false);
  return (
    <Tabs selectedKey={schedaAttiva(schede, scheda)} onSelectionChange={(k) => onScheda(String(k) as IdScheda)}>
      <ListaSchede schede={schede} />
      {verifica && (
        <TabPanel id="verifica">
          <SchedaVerifica stato={verifica} codice={codice} anno={anno} onAnno={onAnno} />
        </TabPanel>
      )}
    </Tabs>
  );
}
