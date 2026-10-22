// SchedeIntervento — le schede del dettaglio dell'intervento (flusso intervento approvato): "Output per anno" (barre
// raggruppate per anno delle tre misure col target come riferimento, tabella equivalente a un clic; PNG, CSV, XLSX col
// nome che dice l'intervento), "Verifica SMP non SIGC" (selettore dell'anno di riferimento, le venti voci di TX-0016 come
// tabella a due colonne con intestazione di riga e i link verso l'elenco; CSV, XLSX) e "Importi unitari" (le Unit Amount
// in ordine di esercizio e di codice). Ogni scheda c'e' solo col grant della sua transazione (gate di UX) e la scheda
// attiva e' stato della pagina (in DettaglioIntervento), non dell'indirizzo. L'errore di una lettura senza risposta lo
// dice l'avviso della pagina, che lo registra una volta (DettaglioIntervento): nella scheda resta il testo statico.
// Tabs di react-aria-components (tablist con le frecce da tastiera, tabpanel collegato: il comportamento ARIA complesso
// del pattern); dentro, classi bootstrap-italia e del kit.
import { useMemo } from 'react';
import { Tab, TabList, TabPanel, Tabs } from 'react-aria-components';
import { ValoreImporto } from '../../../entities/importo';
import { AvvisoAggiornamento, CardGrafico, ErroreNellaPagina, PulsantiScarica, SelettoreAnno, TabellaStatica, TabellaVoci, VistaQuery, Vuoto } from '../../../shared/ui';
import type { ColonnaStatica } from '../../../shared/ui';
import { useOutputRegionale, useVerificaSmpNonSigc } from '../api';
import { anniDiRiferimento, criteriVerifica, soloIntervento } from '../lib/criteri';
import type { ImportoUnitario, RigaOutput, Verifica } from '../lib/dto';
import { DEFINIZIONI_VERIFICA, NESSUN_FILE } from '../lib/formato';
import { graficoOutputPerAnno } from '../lib/grafici';
import { SENZA_UNIT_AMOUNT, TITOLI_SCHEDE, captionVociVerifica, schedeVisibili, testoAggiornamentoAnno } from '../lib/intervento';
import type { IdScheda } from '../lib/intervento';
import { importiOrdinati, rigaDellIntervento } from '../lib/output';
import { DATI_VERIFICA, titoloDato } from '../lib/verifica';
import { CellaDato } from './comuni';
import { fileOutput, fileVerifica } from './esportazioni';
import { usePuoAprireElenco } from './navigazione';

type StatoVerifica = ReturnType<typeof useVerificaSmpNonSigc>;
type StatoOutput = ReturnType<typeof useOutputRegionale>;

const SOTTOTITOLO_OUTPUT = 'Il realizzato non SIGC è cumulativo per anno di riferimento, quello SIGC annuale: le barre non si sommano';
const AIUTO_ANNO = "Facoltativo. Vale per indicatori, output e dati dell'avviso; domande e spesa sono cumulative.";
/** L'errore senza risposta nella scheda: il solo testo statico, senza registrarlo di nuovo nell'avviso della pagina. */
const nellaPagina = () => <ErroreNellaPagina />;

/** Il grafico per anno dell'output dell'intervento (una sola unita' di misura: OP-IS-06), coi file di TX-0017 dell'intervento. */
function CardOutput({ r, cumulativo }: { r: RigaOutput; cumulativo: boolean }) {
  const codice = r.codiceIntervento;
  const dati = useMemo(() => graficoOutputPerAnno(r, cumulativo), [r, cumulativo]);
  return (
    <CardGrafico
      titolo={`Output programmato e realizzato per anno${r.unitaMisura ? ` (${r.unitaMisura})` : ''}`}
      sottotitolo={SOTTOTITOLO_OUTPUT}
      dati={dati}
      fonte={`Fonte: TX-0017. PNG: l'immagine del grafico con l'intestazione, non registrata in audit; CSV e XLSX: l'export di TX-0017 con intervento = ${codice} (output per anno e importi unitari), registrato in AUDIT_ESPORTAZIONE.`}
      scaricamenti={fileOutput(`Output ${codice}`, soloIntervento(codice))}
      oggettoDati={`l'output e gli importi unitari dell'intervento ${codice}`}
    />
  );
}

function SchedaOutput({ stato, codice }: { stato: StatoOutput; codice: string }) {
  return (
    <VistaQuery stato={stato} errorePersonalizzato={nellaPagina}>
      {(d) => {
        const r = rigaDellIntervento(d.righe, codice);
        return r ? <CardOutput r={r} cumulativo={d.realizzatoNonSigcCumulativo} /> : <Vuoto>Nessun output per questo intervento nel report.</Vuoto>;
      }}
    </VistaQuery>
  );
}

/** Le venti voci della verifica dell'intervento, coi link verso l'elenco e i file di TX-0016 dell'intervento e dell'anno. */
function VociVerifica({ d, codice, anno, unita }: { d: Verifica; codice: string; anno: number | undefined; unita: string | null }) {
  const puo = usePuoAprireElenco();
  const r = rigaDellIntervento(d.righe, codice);
  if (!r) return <Vuoto>Nessun dato della verifica SMP non SIGC per questo intervento.</Vuoto>;
  const voci = DATI_VERIFICA.map((x) => ({ etichetta: titoloDato(x, 'voce', d.outputCumulativo), valore: <CellaDato r={r} d={x} unita={unita} puo={puo} /> }));
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
  unita: string | null;
}

/**
 * Il selettore dell'anno resta montato mentre si legge un altro anno: il focus su "Mostra". I dati di prima restano con
 * lo stile di aggiornamento del kit (ui-risultati con aria-busy) e lo stato detto in role=status (review A3).
 */
function SchedaVerifica({ stato, codice, anno, onAnno, unita }: PropsVerifica) {
  return (
    <>
      <SelettoreAnno id="f-anno-intervento" etichetta="Anno di riferimento del monitoraggio SMP non SIGC" aiuto={AIUTO_ANNO} anni={anniDiRiferimento(stato.data?.annoRiferimento, anno)} voceVuota="Ultimo anno con un file (predefinito)" anno={anno} onCambia={onAnno} />
      <AvvisoAggiornamento attivo={stato.isPlaceholderData} testo={testoAggiornamentoAnno(anno)} />
      <div className="ui-risultati" aria-busy={stato.isPlaceholderData || undefined}>
        <VistaQuery stato={stato} errorePersonalizzato={nellaPagina}>
          {(d) => <VociVerifica d={d} codice={codice} anno={anno} unita={unita} />}
        </VistaQuery>
      </div>
    </>
  );
}

const COLONNE_IMPORTI: readonly ColonnaStatica<ImportoUnitario>[] = [
  { chiave: 'unitAmount', titolo: 'Unit Amount', resa: (i) => i.codiceUnitAmount },
  { chiave: 'gruppo', titolo: 'Gruppo colturale', resa: (i) => i.gruppoColturale },
  { chiave: 'esercizio', titolo: 'Esercizio', resa: (i) => String(i.esercizio), numerica: true },
  { chiave: 'importo', titolo: 'Importo unitario', resa: (i) => <ValoreImporto importo={i.importoUnitario} />, numerica: true },
];

function TabellaImporti({ riga }: { riga: RigaOutput | undefined }) {
  const importi = riga ? importiOrdinati(riga) : [];
  if (importi.length === 0) return <Vuoto>{SENZA_UNIT_AMOUNT}</Vuoto>;
  return (
    <>
      <TabellaStatica caption="Importo unitario per Unit Amount ed esercizio finanziario (dal CSR), in ordine di esercizio e di codice" colonne={COLONNE_IMPORTI} righe={importi} chiaveRiga={(i, k) => `${k}-${i.codiceUnitAmount}`} />
      <p className="ui-nota">Gli importi unitari sono anche nei file CSV e XLSX della scheda Output per anno (stesso export di TX-0017).</p>
    </>
  );
}

export interface PropsSchede {
  codice: string;
  anno: number | undefined;
  onAnno: (anno: number | undefined) => void;
  /** Le letture dell'intervento; null senza il grant della transazione (la scheda non c'e'). */
  verifica: StatoVerifica | null;
  output: StatoOutput | null;
  unita: string | null;
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

export function SchedeIntervento({ codice, anno, onAnno, verifica, output, unita, scheda, onScheda }: PropsSchede) {
  const schede = schedeVisibili(verifica !== null, output !== null);
  return (
    <Tabs selectedKey={schedaAttiva(schede, scheda)} onSelectionChange={(k) => onScheda(String(k) as IdScheda)}>
      <ListaSchede schede={schede} />
      {output && (
        <TabPanel id="output">
          <SchedaOutput stato={output} codice={codice} />
        </TabPanel>
      )}
      {verifica && (
        <TabPanel id="verifica">
          <SchedaVerifica stato={verifica} codice={codice} anno={anno} onAnno={onAnno} unita={unita} />
        </TabPanel>
      )}
      {output && (
        <TabPanel id="importi">
          <VistaQuery stato={output} errorePersonalizzato={nellaPagina}>
            {(d) => <TabellaImporti riga={rigaDellIntervento(d.righe, codice)} />}
          </VistaQuery>
        </TabPanel>
      )}
    </Tabs>
  );
}
