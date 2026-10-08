// VerificaSmpReport — pattern DS "report" (route /finanziario/sigc/verifica-smp, TX-0015/RF015, wireframe
// verifica-smp.html): i dati SIGC per intervento da confrontare con SMP - Data Platform, per l'esercizio scelto
// (obbligatorio). Tabella larga in un contenitore scorrevole, intestazione di riga sul codice intervento; i dati ASR
// mancanti sono "non disponibile" (decisione di OP-004). UI v2: barre della previsione e della spesa erogata con zoom.
import { CardGrafico, VistaQuery, Vuoto } from '../../../shared/ui';
import { useVerificaSmp } from '../api';
import type { VerificaSmpRiga } from '../api';
import type { Filtri } from '../lib/filtri';
import { annoOpzionale, numeroOpzionale, siNo, testoOpzionale } from '../lib/formato';
import { Numero, PerimetroSezione, Sezione, TabellaRighe, TabellaVoci, colonnaImporto, vuotoConPerimetro } from './comuni';
import type { Colonna } from './comuni';
import { graficoSmp } from '../lib/grafici';
import { SelettoreAnno } from './SelettoreAnno';

type Riga = VerificaSmpRiga;
const COLONNE: Colonna<Riga>[] = [
  ['Avvisi attivati', (r) => <Numero valore={r.avvisiAttivati} />],
  ['Azioni attivate', (r) => numeroOpzionale(r.azioniAttivate)],
  ['Domande ricevute', (r) => <Numero valore={r.domandeRicevute} />],
  ['Domande ricevute senza richiesto', (r) => <Numero valore={r.domandeRicevuteSenzaRichiesto} />],
  colonnaImporto<Riga>('Valore domande ricevute', (r) => r.valoreDomandeRicevute),
  ['Domande finanziate', (r) => <Numero valore={r.domandeFinanziate} />],
  colonnaImporto<Riga>('Valore domande finanziate', (r) => r.valoreDomandeFinanziate),
  colonnaImporto<Riga>('Dotazione anno precedente', (r) => r.dotazioneAnnoPrecedente),
  colonnaImporto<Riga>('Dotazione periodo di impegno', (r) => r.dotazionePeriodoImpegno),
  ["Domande pagate nell'esercizio", (r) => <Numero valore={r.domandePagateEsercizio} />],
  colonnaImporto<Riga>('Spesa erogata campagna precedente', (r) => r.spesaErogataCampagnaPrecedente),
  colonnaImporto<Riga>('Spesa erogata campagne anteriori', (r) => r.spesaErogataCampagneAnteriori),
  colonnaImporto<Riga>("Previsione di pagamento nell'esercizio", (r) => r.previsionePagamentoEsercizio),
  colonnaImporto<Riga>('Importo top-up', (r) => r.importoTopUp),
  ['Include top-up', (r) => siNo(r.includeTopUp)],
  ['Ettari o UBA richiesti', (r) => numeroOpzionale(r.ettariUbaRichiesti)],
  ['Output atteso delle finanziate', (r) => numeroOpzionale(r.outputAttesoFinanziate)],
  ["Output erogato nell'esercizio", (r) => numeroOpzionale(r.outputErogatoEsercizio)],
  ['Indicatore di output', (r) => testoOpzionale(r.indicatoreOutput)],
  ['Indicatore di risultato', (r) => testoOpzionale(r.indicatoreRisultato)],
];

const VUOTO = vuotoConPerimetro("Nessun dato SIGC per l'esercizio scelto. Scegli un altro esercizio o modifica i filtri.");

function DatiSmp({ filtri, esercizio }: { filtri: Filtri; esercizio: number }) {
  const stato = useVerificaSmp(filtri, esercizio);
  return (
    <Sezione titolo={`Dati SIGC per il confronto con SMP, esercizio ${esercizio} (RF015)`}>
      <VistaQuery stato={stato} eVuoto={(d) => (d.righe ?? []).length === 0} vuoto={VUOTO}>
        {(d) => (
          <>
            <PerimetroSezione perimetro={d.perimetro} />
            <TabellaVoci
              caption="Esercizio"
              voci={[
                { etichetta: 'Esercizio', valore: String(d.esercizio ?? esercizio) },
                { etichetta: 'Anno delle domande', valore: annoOpzionale(d.annoDomande) },
                { etichetta: 'Pagamenti senza data di autorizzazione (esclusi)', valore: <Numero valore={d.pagamentiSenzaData} /> },
              ]}
            />
            <CardGrafico
              titolo="Previsione di pagamento e spesa erogata per intervento"
              sottotitolo="Trascina il cursore sotto il grafico per ingrandire"
              dati={graficoSmp(d.righe ?? [])}
              fonte={`Fonte: TX-0015, esercizio ${d.esercizio ?? esercizio}`}
              livello={3}
              altezza="alto"
            />
            <TabellaRighe caption="I dati ASR per intervento da confrontare con SMP" intestazione="Intervento" chiave={(r) => r.codiceIntervento ?? ''} colonne={COLONNE} righe={d.righe ?? []} />
          </>
        )}
      </VistaQuery>
    </Sezione>
  );
}

export function VerificaSmpReport(props: { filtri: Filtri; esercizio: number | undefined; onCambiaEsercizio: (esercizio: number | undefined) => void }) {
  const { filtri, esercizio, onCambiaEsercizio } = props;
  return (
    <>
      <SelettoreAnno
        id="f-esercizio"
        etichetta="Esercizio finanziario"
        aiuto="Obbligatorio. Esercizio n dal 16 ottobre n-1 al 15 ottobre n; le domande sono quelle dell'anno n-1."
        tipo="esercizio"
        anno={esercizio}
        onCambia={onCambiaEsercizio}
      />
      {esercizio === undefined ? <Vuoto>{"Scegli l'esercizio finanziario da consultare."}</Vuoto> : <DatiSmp filtri={filtri} esercizio={esercizio} />}
    </>
  );
}
