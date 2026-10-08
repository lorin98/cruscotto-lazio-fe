// RiepilogoReport — pattern DS "report" (route /finanziario/riepilogo, TX-0011/RF011, wireframe riepilogo.html):
// tabella per intervento dei nove campi finanziari + dotazione di assistenza tecnica (AT001, intero programma: non
// dipende dai filtri e resta visibile anche senza righe) + esportazione CSV con gli stessi filtri. Con il perimetro ADA
// le colonne di programma sono dichiarate regionali. Tabella bootstrap-italia; esito dell'esportazione in role=status.
import { ValoreImporto } from '../../../entities/importo';
import { getErrorMessage } from '../../../shared/lib';
import { VistaQuery, Vuoto, salvaFile } from '../../../shared/ui';
import { useEsportaRiepilogoCsv, useRiepilogo } from '../api';
import type { RiepilogoFinanziario, RiepilogoFinanziarioRiga } from '../api';
import type { Filtri, Perimetro } from '../lib/filtri';
import { NotaPerimetroMisto, Numero, PerimetroSezione, Sezione, TabellaRighe, TabellaVoci, colonnaImporto, diProgramma, vuotoConPerimetro } from './comuni';
import type { Colonna } from './comuni';

type Riga = RiepilogoFinanziarioRiga;
const colonne = (p: Perimetro | undefined): Colonna<Riga>[] => [
  colonnaImporto<Riga>(diProgramma('Dotazione spesa pubblica', p), (r) => r.dotazioneSpesaPubblica),
  colonnaImporto<Riga>(diProgramma('Risorse quota FEASR', p), (r) => r.risorseQuotaFeasr),
  colonnaImporto<Riga>(diProgramma('Importo stanziato', p), (r) => r.importoStanziato),
  ['Domande presentate', (r) => <Numero valore={r.domandePresentate} />],
  colonnaImporto<Riga>('Impegnato cofinanziato FEASR', (r) => r.impegnatoCofinanziatoFeasr),
  colonnaImporto<Riga>('Impegnato cofinanziato FEASR e non', (r) => r.impegnatoCofinanziatoFeasrENon),
  colonnaImporto<Riga>('Pagamenti al netto di rettifiche', (r) => r.pagamentiNettoRettifiche),
  colonnaImporto<Riga>('Dotazione residua sugli impegni', (r) => r.dotazioneResiduaSuImpegni),
  colonnaImporto<Riga>('Dotazione residua sui pagamenti', (r) => r.dotazioneResiduaSuPagamenti),
];

function EsportaCsv({ filtri }: { filtri: Filtri }) {
  const esportazione = useEsportaRiepilogoCsv();
  const esporta = () => esportazione.mutate(filtri, { onSuccess: (csv) => salvaFile(csv, 'riepilogo-finanziario.csv') });
  return (
    <div className="my-3">
      <h2 className="h5">Esportazione</h2>
      <button type="button" className="btn btn-primary" onClick={esporta} disabled={esportazione.isPending}>
        Esporta la tabella in CSV
      </button>
      <p role="status" aria-live="polite" className="mt-2 mb-0">
        {esportazione.isPending && 'Esportazione del file CSV in corso…'}
        {esportazione.isSuccess && 'File CSV scaricato.'}
      </p>
      {esportazione.isError && (
        <div className="alert alert-danger mt-2" role="alert">
          {getErrorMessage(esportazione.error)}
        </div>
      )}
    </div>
  );
}

function Tabella({ d }: { d: RiepilogoFinanziario }) {
  const righe = d.righe ?? [];
  if (righe.length === 0) return <Vuoto>{vuotoConPerimetro('Nessun intervento per i filtri scelti. Modifica i filtri.')(d)}</Vuoto>;
  return (
    <>
      <PerimetroSezione perimetro={d.perimetro} />
      <NotaPerimetroMisto perimetro={d.perimetro} />
      <TabellaRighe caption="Riepilogo per intervento: i nove campi finanziari di RF011" intestazione="Intervento" chiave={(r) => r.codiceIntervento ?? ''} colonne={colonne(d.perimetro)} righe={righe} />
    </>
  );
}

export function RiepilogoReport({ filtri }: { filtri: Filtri }) {
  const stato = useRiepilogo(filtri);
  return (
    <VistaQuery stato={stato}>
      {(d) => (
        <>
          <Sezione titolo="Tabella di riepilogo">
            <Tabella d={d} />
            <TabellaVoci
              caption="Valore fuori tabella, indipendente dai filtri"
              voci={[{ etichetta: 'Dotazione assistenza tecnica (AT001, intero programma: non dipende dai filtri)', valore: <ValoreImporto importo={d.dotazioneAssistenzaTecnica} /> }]}
            />
          </Sezione>
          {(d.righe ?? []).length > 0 && <EsportaCsv filtri={filtri} />}
        </>
      )}
    </VistaQuery>
  );
}
