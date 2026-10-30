// SchedeIntervento — le schede del dettaglio dell'intervento (flusso intervento approvato, ricomposto il 30/10/2026), ognuna
// col suo periodo e i suoi tre KPI (nessun KPI in testa: i periodi sono diversi e non si sommano):
// - "Verifica SMP non SIGC" (TX-0016): selettore dell'anno di riferimento, KPI cumulativi, CSV e XLSX, le venti voci come
//   tabella a due colonne con intestazione di riga, i link verso l'elenco e le definizioni;
// - "Verifica SMP SIGC" (TX-0015): selettore dell'esercizio (obbligatorio: senza, la scheda chiede di sceglierlo e non
//   legge), KPI della campagna n-1 e dell'esercizio n, CSV e XLSX, i riferimenti e le venti voci, le definizioni.
// Le quantita' di output hanno accanto il codice dell'indicatore (l'unita' di misura veniva da TX-0017, ora del fisico:
// OP-IS-12). Ogni scheda c'e' solo col grant della sua transazione (gate di UX), legge solo quando si apre e, mentre legge
// un altro anno o esercizio, tiene i dati di prima (role=status, aria-busy). La scheda attiva e' stato della pagina (in
// DettaglioIntervento), non dell'indirizzo. L'errore di una lettura senza risposta lo dice l'avviso della pagina, che lo
// registra una volta: nella scheda resta il testo statico.
// Tabs di react-aria-components (tablist con le frecce da tastiera, tabpanel collegato: il comportamento ARIA complesso
// del pattern); dentro, classi bootstrap-italia e del kit.
import { Tab, TabList, TabPanel, Tabs } from 'react-aria-components';
import { rigaDellIntervento } from '../../../entities/filtri';
import { AvvisoAggiornamento, ErroreNellaPagina, Griglia, Kpi, PulsantiScarica, SelettoreAnno, TabellaVoci, VistaQuery, Vuoto } from '../../../shared/ui';
import type { NomeIcona, TonoKpi } from '../../../shared/ui';
import { useVerificaSmpNonSigc, useVerificaSmpSigc } from '../api';
import type { VerificaSmp } from '../api';
import { anniDiRiferimento, criteriVerifica, criteriVerificaSigc, eserciziProposti, soloIntervento } from '../lib/criteri';
import type { Verifica } from '../lib/dto';
import { DEFINIZIONI_VERIFICA, DEFINIZIONI_VERIFICA_SIGC, NESSUN_FILE, SCEGLI_ESERCIZIO } from '../lib/formato';
import { SENZA_DATI_SIGC, TITOLI_SCHEDE, captionVociVerifica, captionVociVerificaSigc, kpiVerifica, kpiVerificaSigc, testoAggiornamentoAnno, testoAggiornamentoEsercizio } from '../lib/intervento';
import type { ChiaveKpi, IdScheda, KpiIntervento } from '../lib/intervento';
import { DATI_VERIFICA, titoloDato } from '../lib/verifica';
import { DATI_VERIFICA_SIGC, periodoDellaRisposta, vociRiferimentiSigcIntervento } from '../lib/verificaSigc';
import { CellaDato, ValoreDelDatoSigc } from './comuni';
import { fileVerifica, fileVerificaSigc } from './esportazioni';
import { usePuoAprireElenco } from './navigazione';

type StatoVerifica = ReturnType<typeof useVerificaSmpNonSigc>;
type StatoVerificaSigc = ReturnType<typeof useVerificaSmpSigc>;

const AIUTO_ANNO = "Facoltativo. Vale per indicatori, output e dati dell'avviso; domande e spesa sono cumulative.";
const AIUTO_ESERCIZIO = "Obbligatorio. Esercizio n dal 16 ottobre n-1 al 15 ottobre n; le domande sono quelle dell'anno n-1.";
/** L'errore senza risposta nella scheda: il solo testo statico, senza registrarlo di nuovo nell'avviso della pagina. */
const nellaPagina = () => <ErroreNellaPagina />;

const ASPETTO_KPI: Record<ChiaveKpi, { icona: NomeIcona; tono: TonoKpi }> = {
  ricevute: { icona: 'it-files', tono: 'blu' },
  finanziate: { icona: 'it-check-circle', tono: 'verde' },
  spesa: { icona: 'it-card', tono: 'ambra' },
};

/** I tre KPI di una scheda (lib/intervento): valori della riga, nessuna quota calcolata; il periodo nell'etichetta o nella nota. */
function KpiScheda({ kpi }: { kpi: readonly KpiIntervento[] }) {
  return (
    <Griglia colonne={4}>
      {kpi.map((k) => (
        <Kpi key={k.chiave} etichetta={k.etichetta} valore={k.valore} assente={k.assente} nota={k.nota} {...ASPETTO_KPI[k.chiave]} />
      ))}
    </Griglia>
  );
}

/** I KPI, i file e le venti voci della verifica non SIGC dell'intervento e dell'anno, coi link verso l'elenco. */
function VociVerifica({ d, codice, anno }: { d: Verifica; codice: string; anno: number | undefined }) {
  const puo = usePuoAprireElenco();
  const r = rigaDellIntervento(d.righe, codice);
  if (!r) return <Vuoto>Nessun dato della verifica SMP non SIGC per questo intervento.</Vuoto>;
  const voci = DATI_VERIFICA.map((x) => ({ etichetta: titoloDato(x, 'voce', d.outputCumulativo), valore: <CellaDato r={r} d={x} indicatore={r.indicatoreOutput.valore} puo={puo} /> }));
  return (
    <>
      {d.annoRiferimento === null && <Vuoto>{NESSUN_FILE}</Vuoto>}
      <KpiScheda kpi={kpiVerifica(r)} />
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

/** I KPI, i file, i riferimenti e le venti voci della verifica SIGC dell'intervento e dell'esercizio. */
function VociVerificaSigc({ d, codice, esercizio }: { d: VerificaSmp; codice: string; esercizio: number }) {
  const r = rigaDellIntervento(d.righe, codice);
  if (!r) return <Vuoto>{SENZA_DATI_SIGC}</Vuoto>;
  const { esercizio: n, annoDomande } = periodoDellaRisposta(d, esercizio);
  const voci = [
    ...vociRiferimentiSigcIntervento(d, esercizio),
    ...DATI_VERIFICA_SIGC.map((x) => ({ etichetta: x.voce, valore: <ValoreDelDatoSigc r={r} d={x} indicatore={r.indicatoreOutput} /> })),
  ];
  return (
    <>
      <KpiScheda kpi={kpiVerificaSigc(r, n, annoDomande)} />
      <div className="ui-strumenti">
        <PulsantiScarica oggetto={`la verifica SMP SIGC dell'intervento ${codice}, esercizio ${n}`} scaricamenti={fileVerificaSigc(`Verifica SMP SIGC ${codice} esercizio ${n}`, criteriVerificaSigc(soloIntervento(codice), esercizio))} />
      </div>
      <TabellaVoci caption={captionVociVerificaSigc(n, annoDomande)} voci={voci} />
      <p className="ui-fonte">{DEFINIZIONI_VERIFICA_SIGC}</p>
    </>
  );
}

interface PropsVerificaSigc {
  /** La lettura di TX-0015 dell'intervento; null senza esercizio (la scheda non legge). */
  stato: StatoVerificaSigc | null;
  codice: string;
  esercizio: number | undefined;
  onEsercizio: (esercizio: number | undefined) => void;
}

/** Come la scheda non SIGC, col selettore dell'esercizio; senza esercizio la scheda chiede di sceglierlo e non legge. */
function SchedaVerificaSigc({ stato, codice, esercizio, onEsercizio }: PropsVerificaSigc) {
  return (
    <>
      <SelettoreAnno id="f-esercizio-intervento" etichetta="Esercizio finanziario" aiuto={AIUTO_ESERCIZIO} anni={eserciziProposti(esercizio)} voceVuota="Scegli un anno" anno={esercizio} onCambia={onEsercizio} />
      {stato === null || esercizio === undefined ? (
        <Vuoto>{SCEGLI_ESERCIZIO}</Vuoto>
      ) : (
        <>
          <AvvisoAggiornamento attivo={stato.isPlaceholderData} testo={testoAggiornamentoEsercizio(esercizio, stato.data?.esercizio)} />
          <div className="ui-risultati" aria-busy={stato.isPlaceholderData || undefined}>
            <VistaQuery stato={stato} errorePersonalizzato={nellaPagina}>
              {(d) => <VociVerificaSigc d={d} codice={codice} esercizio={esercizio} />}
            </VistaQuery>
          </div>
        </>
      )}
    </>
  );
}

export interface PropsSchede {
  codice: string;
  anno: number | undefined;
  onAnno: (anno: number | undefined) => void;
  esercizio: number | undefined;
  onEsercizio: (esercizio: number | undefined) => void;
  /** Le schede che il profilo vede, nell'ordine del wireframe. */
  schede: readonly IdScheda[];
  /** La scheda attiva (stato della pagina: resta mentre una lettura riparte); undefined senza schede. */
  attiva: IdScheda | undefined;
  onScheda: (s: IdScheda) => void;
  /** La lettura di TX-0016 dell'intervento; null finche' la scheda non si apre (o senza il grant). */
  verifica: StatoVerifica | null;
  /** La lettura di TX-0015 dell'intervento; null finche' la scheda non si apre con un esercizio (o senza il grant). */
  verificaSigc: StatoVerificaSigc | null;
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

export function SchedeIntervento({ codice, anno, onAnno, esercizio, onEsercizio, schede, attiva, onScheda, verifica, verificaSigc }: PropsSchede) {
  return (
    <Tabs selectedKey={attiva} onSelectionChange={(k) => onScheda(String(k) as IdScheda)}>
      <ListaSchede schede={schede} />
      {schede.includes('verifica') && <TabPanel id="verifica">{verifica && <SchedaVerifica stato={verifica} codice={codice} anno={anno} onAnno={onAnno} />}</TabPanel>}
      {schede.includes('verificaSigc') && (
        <TabPanel id="verificaSigc">
          <SchedaVerificaSigc stato={verificaSigc} codice={codice} esercizio={esercizio} onEsercizio={onEsercizio} />
        </TabPanel>
      )}
    </Tabs>
  );
}
