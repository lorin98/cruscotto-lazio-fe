// SchedeIntervento — le schede del dettaglio dell'intervento del fisico (flusso intervento approvato il 30/10/2026):
// "Output per anno" (TX-0017: barre raggruppate per anno delle tre misure col target come linea di riferimento e come riga
// della tabella equivalente, a un clic; PNG, CSV, XLSX col nome che dice l'intervento; portata dal dettaglio
// dell'istituzionale, OP-FIS-11), "Superfici per campagna" (TX-0018: linea della superficie DS e DP campagna per campagna,
// mai sommate, con la tabella equivalente dei sette dati dalla piu' recente; PNG, CSV, XLSX; senza superfici lo stato
// dichiarato) e "Unit Amount" (TX-0030: tabella di otto colonne con la Unit Amount come intestazione di riga, la nota
// unica del pagato e le celle brevi come nella pagina Unit Amount, CSV e XLSX; senza Unit Amount lo stato dichiarato).
// Ogni scheda c'e' solo col grant della sua transazione (gate di UX) e la scheda attiva e' stato della pagina (in
// DettaglioIntervento), non dell'indirizzo. L'errore di una lettura senza risposta lo dice l'avviso della pagina, che lo
// registra una volta (DettaglioIntervento): nella scheda resta il testo statico, le altre schede restano.
// Tabs di react-aria-components (tablist con le frecce da tastiera, tabpanel collegato: il comportamento ARIA complesso
// del pattern); dentro, classi bootstrap-italia e del kit (card grafico, tabella statica, pulsanti di scaricamento).
import { useMemo } from 'react';
import { Tab, TabList, TabPanel, Tabs } from 'react-aria-components';
import { rigaDellIntervento } from '../../../entities/filtri';
import { ValoreImporto, ValoreMotivato } from '../../../entities/importo';
import { formatNumber } from '../../../shared/lib';
import { CardGrafico, ErroreNellaPagina, PulsantiScarica, TabellaStatica, VistaQuery, Vuoto } from '../../../shared/ui';
import type { ColonnaStatica } from '../../../shared/ui';
import type { useOutputRegionale, useSuperfici, useUnitAmount } from '../api';
import { criteriDellIntervento } from '../lib/criteri';
import type { InterventoSuperficie, RigaOutput, RigaUnitAmount } from '../lib/dto';
import { graficoOutputPerAnno, graficoSuperficiDellIntervento } from '../lib/grafici';
import {
  GRAFICO_OUTPUT_INTERVENTO,
  GRAFICO_SUPERFICI_INTERVENTO,
  SENZA_OUTPUT,
  SENZA_SUPERFICI_INTERVENTO,
  SENZA_UNIT_AMOUNT,
  SOTTOTITOLO_OUTPUT_INTERVENTO,
  SOTTOTITOLO_SUPERFICI_INTERVENTO,
  TITOLI_SCHEDE,
  TITOLO_SUPERFICI_INTERVENTO,
  captionUnitAmountIntervento,
  fonteOutputIntervento,
  fonteSuperficiIntervento,
  fonteUnitAmountIntervento,
  oggettoFileOutput,
  oggettoFileSuperfici,
  oggettoFileUnitAmount,
  titoloOutputIntervento,
} from '../lib/intervento';
import type { IdScheda } from '../lib/intervento';
import { CAMPI_PAGATO, TITOLI_PAGATO, chiaveUnitAmount, notaPagato } from '../lib/unitAmount';
import { fileOutput, fileUnitAmount, scaricamentiSuperfici } from './esportazioni';
import { DatoPagato } from './TabellaUnitAmount';

type StatoOutput = ReturnType<typeof useOutputRegionale>;
type StatoSuperfici = ReturnType<typeof useSuperfici>;
type StatoUnitAmount = ReturnType<typeof useUnitAmount>;

/** L'errore senza risposta nella scheda: il solo testo statico, senza registrarlo di nuovo nell'avviso della pagina. */
const nellaPagina = () => <ErroreNellaPagina />;

/** Il grafico per anno dell'output dell'intervento (una sola unita' di misura: OP-FIS-11), coi file di TX-0017 dell'intervento. */
function CardOutput({ r, cumulativo }: { r: RigaOutput; cumulativo: boolean }) {
  const codice = r.codiceIntervento;
  const dati = useMemo(() => graficoOutputPerAnno(r, cumulativo), [r, cumulativo]);
  return (
    <CardGrafico
      titolo={titoloOutputIntervento(r.unitaMisura)}
      sottotitolo={SOTTOTITOLO_OUTPUT_INTERVENTO}
      dati={dati}
      fonte={fonteOutputIntervento(codice)}
      scaricamenti={fileOutput(`Output ${codice}`, criteriDellIntervento(codice))}
      oggettoPng={GRAFICO_OUTPUT_INTERVENTO}
      oggettoDati={oggettoFileOutput(codice)}
    />
  );
}

function SchedaOutput({ stato, codice }: { stato: StatoOutput; codice: string }) {
  return (
    <VistaQuery stato={stato} errorePersonalizzato={nellaPagina}>
      {(d) => {
        const r = rigaDellIntervento(d.righe, codice);
        return r ? <CardOutput r={r} cumulativo={d.realizzatoNonSigcCumulativo} /> : <Vuoto>{SENZA_OUTPUT}</Vuoto>;
      }}
    </VistaQuery>
  );
}

/** La linea delle superfici dell'intervento per campagna, coi file di TX-0018 dell'intervento (tutte le campagne). */
function CardSuperfici({ riga }: { riga: InterventoSuperficie }) {
  const codice = riga.codiceIntervento;
  const dati = useMemo(() => graficoSuperficiDellIntervento(riga), [riga]);
  return (
    <CardGrafico
      titolo={TITOLO_SUPERFICI_INTERVENTO}
      sottotitolo={SOTTOTITOLO_SUPERFICI_INTERVENTO}
      dati={dati}
      fonte={fonteSuperficiIntervento(riga)}
      scaricamenti={scaricamentiSuperfici(`Superfici ${codice}`, criteriDellIntervento(codice))}
      oggettoPng={GRAFICO_SUPERFICI_INTERVENTO}
      oggettoDati={oggettoFileSuperfici(codice)}
    />
  );
}

function SchedaSuperfici({ stato, codice }: { stato: StatoSuperfici; codice: string }) {
  return (
    <VistaQuery stato={stato} errorePersonalizzato={nellaPagina}>
      {(d) => {
        // un intervento non a superficie o non SIGC ha la riga con NON_VALORIZZATO e nessuna campagna: mai una linea a zero
        const r = rigaDellIntervento(d.righe, codice);
        return r && r.campagne.length > 0 ? <CardSuperfici riga={r} /> : <Vuoto>{SENZA_SUPERFICI_INTERVENTO}</Vuoto>;
      }}
    </VistaQuery>
  );
}

/** Le otto colonne della tabella delle Unit Amount dell'intervento: la Unit Amount e' l'intestazione di riga. */
const COLONNE_UNIT_AMOUNT: readonly ColonnaStatica<RigaUnitAmount>[] = [
  { chiave: 'ua', titolo: 'Unit Amount', resa: (r) => r.codiceUnitAmount ?? '' },
  { chiave: 'gruppo', titolo: 'Gruppo colturale', resa: (r) => r.gruppoColturale ?? '' },
  { chiave: 'esercizio', titolo: 'Esercizio', resa: (r) => (r.esercizio === undefined ? '' : String(r.esercizio)), numerica: true },
  { chiave: 'unitario', titolo: 'Importo unitario', resa: (r) => <ValoreImporto importo={r.importoUnitario} />, numerica: true },
  { chiave: 'output', titolo: 'Output previsto', resa: (r) => <ValoreMotivato dato={r.outputPrevisto} resa={formatNumber} />, numerica: true },
  ...CAMPI_PAGATO.map((campo) => ({ chiave: campo, titolo: TITOLI_PAGATO[campo], resa: (r: RigaUnitAmount) => <DatoPagato r={r} campo={campo} breve />, numerica: true })),
];

/** Le Unit Amount dell'intervento: CSV e XLSX di TX-0030, la nota unica del pagato senza fonte, la tabella, la fonte. */
function TabellaUnitAmountIntervento({ righe, codice }: { righe: readonly RigaUnitAmount[]; codice: string }) {
  const nota = notaPagato(righe);
  return (
    <>
      <div className="ui-strumenti">
        <PulsantiScarica oggetto={oggettoFileUnitAmount(codice)} scaricamenti={fileUnitAmount(`Unit Amount ${codice}`, criteriDellIntervento(codice))} />
      </div>
      {nota && <p className="ui-nota">{nota}</p>}
      <TabellaStatica caption={captionUnitAmountIntervento(codice)} colonne={COLONNE_UNIT_AMOUNT} righe={righe} chiaveRiga={(r) => chiaveUnitAmount(r)} />
      <p className="ui-fonte">{fonteUnitAmountIntervento(codice)}</p>
    </>
  );
}

function SchedaUnitAmount({ stato, codice }: { stato: StatoUnitAmount; codice: string }) {
  return (
    <VistaQuery stato={stato} errorePersonalizzato={nellaPagina} eVuoto={(d) => (d.righe ?? []).length === 0} vuoto={SENZA_UNIT_AMOUNT}>
      {(d) => <TabellaUnitAmountIntervento righe={d.righe ?? []} codice={codice} />}
    </VistaQuery>
  );
}

export interface PropsSchede {
  codice: string;
  /** Le letture dell'intervento; null senza il grant della transazione (la scheda non c'e'). */
  output: StatoOutput | null;
  superfici: StatoSuperfici | null;
  unitAmount: StatoUnitAmount | null;
  /** Le schede visibili, nell'ordine del wireframe, e quella attiva (stato della pagina). */
  schede: readonly IdScheda[];
  scheda: IdScheda | undefined;
  onScheda: (s: IdScheda) => void;
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

export function SchedeIntervento({ codice, output, superfici, unitAmount, schede, scheda, onScheda }: PropsSchede) {
  return (
    <Tabs selectedKey={scheda} onSelectionChange={(k) => onScheda(String(k) as IdScheda)}>
      <ListaSchede schede={schede} />
      {output && (
        <TabPanel id="output">
          <SchedaOutput stato={output} codice={codice} />
        </TabPanel>
      )}
      {superfici && (
        <TabPanel id="superfici">
          <SchedaSuperfici stato={superfici} codice={codice} />
        </TabPanel>
      )}
      {unitAmount && (
        <TabPanel id="unitAmount">
          <SchedaUnitAmount stato={unitAmount} codice={codice} />
        </TabPanel>
      )}
    </Tabs>
  );
}
