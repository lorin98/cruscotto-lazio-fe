// VerificaSmpReport — pattern DS "report" (route /finanziario/sigc/verifica-smp, TX-0015/RF015, wireframe
// verifica-smp.html): i dati SIGC per intervento da confrontare con SMP - Data Platform, per l'esercizio scelto
// (obbligatorio). Tabella interattiva dei venti dati (cerca, ordina, scegli le colonne), intestazione di riga sul codice
// intervento; i dati ASR mancanti sono "non disponibile" (decisione di OP-004). UI v2: barre della previsione e della
// spesa erogata con zoom; clic su una barra: il dettaglio dell'intervento.
import type { ReactNode } from 'react';
import { ValoreImporto } from '../../../entities/importo';
import type { ImportoLike } from '../../../entities/importo';
import { CardGrafico, Sezione, TabellaInterattiva, TabellaVoci, VistaQuery, Vuoto } from '../../../shared/ui';
import type { ColonnaTabella } from '../../../shared/ui';
import { useVerificaSmp } from '../api';
import type { VerificaSmpRiga } from '../api';
import { ricercaDaFiltri } from '../lib/filtri';
import type { Filtri } from '../lib/filtri';
import { annoOpzionale, numeroOpzionale, siNo, testoOpzionale } from '../lib/formato';
import { graficoSmp } from '../lib/grafici';
import { Numero, PerimetroSezione, vuotoConPerimetro } from './comuni';
import { SelettoreAnno } from './SelettoreAnno';
import { useApriIntervento } from './useApriIntervento';

type Riga = VerificaSmpRiga;
type Ordinabile = string | number | null | undefined;

function colonna(chiave: string, titolo: string, valore: (r: Riga) => Ordinabile, resa: (r: Riga) => ReactNode): ColonnaTabella<Riga> {
  return { chiave, titolo, valore: (r) => valore(r) ?? null, resa, numerica: true };
}
const conteggio = (chiave: string, titolo: string, leggi: (r: Riga) => number | null | undefined) => colonna(chiave, titolo, leggi, (r) => <Numero valore={leggi(r)} />);
const importo = (chiave: string, titolo: string, leggi: (r: Riga) => ImportoLike | undefined) => colonna(chiave, titolo, (r) => leggi(r)?.valore, (r) => <ValoreImporto importo={leggi(r)} />);
const opzionale = (chiave: string, titolo: string, leggi: (r: Riga) => number | null | undefined) => colonna(chiave, titolo, leggi, (r) => numeroOpzionale(leggi(r)));

const COLONNE: ColonnaTabella<Riga>[] = [
  { chiave: 'codice', titolo: 'Intervento', valore: (r) => r.codiceIntervento ?? null, fissa: true },
  conteggio('avvisi', 'Avvisi attivati', (r) => r.avvisiAttivati),
  opzionale('azioni', 'Azioni attivate', (r) => r.azioniAttivate),
  conteggio('ricevute', 'Domande ricevute', (r) => r.domandeRicevute),
  conteggio('senzaRichiesto', 'Domande ricevute senza richiesto', (r) => r.domandeRicevuteSenzaRichiesto),
  importo('valoreRicevute', 'Valore domande ricevute', (r) => r.valoreDomandeRicevute),
  conteggio('finanziate', 'Domande finanziate', (r) => r.domandeFinanziate),
  importo('valoreFinanziate', 'Valore domande finanziate', (r) => r.valoreDomandeFinanziate),
  importo('dotazionePrecedente', 'Dotazione anno precedente', (r) => r.dotazioneAnnoPrecedente),
  importo('dotazioneImpegno', 'Dotazione periodo di impegno', (r) => r.dotazionePeriodoImpegno),
  conteggio('pagate', "Domande pagate nell'esercizio", (r) => r.domandePagateEsercizio),
  importo('spesaPrecedente', 'Spesa erogata campagna precedente', (r) => r.spesaErogataCampagnaPrecedente),
  importo('spesaAnteriori', 'Spesa erogata campagne anteriori', (r) => r.spesaErogataCampagneAnteriori),
  importo('previsione', "Previsione di pagamento nell'esercizio", (r) => r.previsionePagamentoEsercizio),
  importo('topUp', 'Importo top-up', (r) => r.importoTopUp),
  colonna('includeTopUp', 'Include top-up', (r) => siNo(r.includeTopUp), (r) => siNo(r.includeTopUp)),
  opzionale('ettari', 'Ettari o UBA richiesti', (r) => r.ettariUbaRichiesti),
  opzionale('outputAtteso', 'Output atteso delle finanziate', (r) => r.outputAttesoFinanziate),
  opzionale('outputErogato', "Output erogato nell'esercizio", (r) => r.outputErogatoEsercizio),
  colonna('indicatoreOutput', 'Indicatore di output', (r) => r.indicatoreOutput, (r) => testoOpzionale(r.indicatoreOutput)),
  colonna('indicatoreRisultato', 'Indicatore di risultato', (r) => r.indicatoreRisultato, (r) => testoOpzionale(r.indicatoreRisultato)),
];

const VUOTO = vuotoConPerimetro("Nessun dato SIGC per l'esercizio scelto. Scegli un altro esercizio.");

function DatiSmp({ filtri, esercizio }: { filtri: Filtri; esercizio: number }) {
  const stato = useVerificaSmp(filtri, esercizio);
  const { apri, dalClic: clic } = useApriIntervento(filtri);
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
              sottotitolo="Trascina il cursore sotto il grafico per ingrandire; clic su una barra per il dettaglio dell'intervento"
              dati={graficoSmp(d.righe ?? [])}
              fonte={`Fonte: TX-0015, esercizio ${d.esercizio ?? esercizio}`}
              livello={3}
              altezza="alto"
              onClic={clic}
            />
            <TabellaInterattiva
              key={`${esercizio}-${ricercaDaFiltri(filtri)}`}
              caption="I dati ASR per intervento da confrontare con SMP"
              righe={d.righe ?? []}
              colonne={COLONNE}
              chiaveRiga={(r) => r.codiceIntervento ?? ''}
              testoRicerca={(r) => `${r.codiceIntervento ?? ''} ${r.indicatoreOutput ?? ''} ${r.indicatoreRisultato ?? ''}`}
              segnapostoRicerca="Cerca per codice o indicatore"
              // la riga apre il dettaglio anche da tastiera (Invio), come il clic sulla barra del grafico
              etichettaRiga={(r) => `Apri il dettaglio dell'intervento ${r.codiceIntervento ?? ''}`}
              onRiga={(r) => r.codiceIntervento && apri(r.codiceIntervento)}
              perPagina={20}
            />
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
