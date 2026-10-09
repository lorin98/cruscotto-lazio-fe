// RiepilogoReport — report RF011 (route /finanziario/riepilogo, TX-0011, flusso riepilogo v2): tabella interattiva per
// intervento con i nove campi (cerca, ordina, colonne, paginazione, totali), riga che apre l'anteprima laterale e da li'
// il dettaglio dell'intervento, vista grafico (clic su una barra: dettaglio), esportazione CSV con gli stessi filtri, e
// nel piede la dotazione dell'Assistenza tecnica (intero programma, non dipende dai filtri). Ogni cella assente dice il
// suo motivo; i totali sono "non calcolabile" se manca anche un solo valore (mai somme parziali).
import { useState } from 'react';
import { Link } from 'react-router';
import { ValoreImporto } from '../../../entities/importo';
import { formatNumber, getErrorMessage } from '../../../shared/lib';
import { CardGrafico, PannelloLaterale, Sezione, TabellaInterattiva, VistaQuery, salvaFile } from '../../../shared/ui';
import type { ColonnaTabella, RigaPiede } from '../../../shared/ui';
import { useEsportaRiepilogoCsv, useRiepilogo } from '../api';
import type { RiepilogoFinanziario, RiepilogoFinanziarioRiga } from '../api';
import { cellaTotale, sommaSeCompleta } from '../lib/aggregati';
import { ricercaDaFiltri } from '../lib/filtri';
import type { Filtri } from '../lib/filtri';
import { graficoDotazionePagamenti } from '../lib/grafici';
import type { Perimetro } from '../lib/perimetro';
import { conFiltri, percorsoIntervento } from '../lib/report';
import { NotaPerimetroMisto, PerimetroSezione, colonneImporti, diProgramma, vuotoConPerimetro } from './comuni';
import { useApriIntervento } from './useApriIntervento';
import type { CampoImporto } from './comuni';

type Riga = RiepilogoFinanziarioRiga;

const CAMPI: CampoImporto<Riga>[] = [
  { chiave: 'dotazioneSpesaPubblica', titolo: 'Dotazione spesa pubblica', programma: true },
  { chiave: 'risorseQuotaFeasr', titolo: 'Risorse quota FEASR', programma: true },
  { chiave: 'importoStanziato', titolo: 'Importo stanziato', programma: true },
  { chiave: 'impegnatoCofinanziatoFeasr', titolo: 'Impegnato cofinanziato FEASR' },
  { chiave: 'impegnatoCofinanziatoFeasrENon', titolo: 'Impegnato cofinanziato FEASR e non' },
  { chiave: 'pagamentiNettoRettifiche', titolo: 'Pagamenti al netto di rettifiche' },
  { chiave: 'dotazioneResiduaSuImpegni', titolo: 'Dotazione residua sugli impegni' },
  { chiave: 'dotazioneResiduaSuPagamenti', titolo: 'Dotazione residua sui pagamenti' },
];

const VUOTO = vuotoConPerimetro('Nessun intervento per i filtri scelti.', { programma: true });

function colonne(perimetro: Perimetro | undefined): ColonnaTabella<Riga>[] {
  return [
    { chiave: 'codice', titolo: 'Intervento', valore: (r) => r.codiceIntervento ?? null, fissa: true },
    { chiave: 'domande', titolo: 'Domande presentate', valore: (r) => r.domandePresentate ?? null, resa: (r) => formatNumber(r.domandePresentate), numerica: true },
    ...colonneImporti(CAMPI, perimetro),
  ];
}

/** Riga dei totali sulle righe filtrate: mai somme parziali; un'assenza comune a tutte le righe dice il suo motivo. */
function totali(righe: readonly Riga[]): RigaPiede {
  const domande = sommaSeCompleta(righe.map((r) => r.domandePresentate));
  const importi = CAMPI.map((c) => [c.chiave, cellaTotale(righe, (r) => r[c.chiave] as Riga['dotazioneSpesaPubblica'])]);
  return {
    codice: righe.length === 1 ? 'Totale (1 intervento)' : `Totale (${righe.length} interventi)`,
    domande: domande === null ? 'non calcolabile' : formatNumber(domande),
    ...Object.fromEntries(importi),
  };
}

function EsportaCsv({ filtri }: { filtri: Filtri }) {
  const esportazione = useEsportaRiepilogoCsv();
  const esporta = () => esportazione.mutate(filtri, { onSuccess: (csv) => salvaFile(csv, 'riepilogo-finanziario.csv') });
  return (
    <>
      <button type="button" className="btn btn-outline-primary btn-sm" onClick={esporta} disabled={esportazione.isPending}>
        Esporta la tabella in CSV
      </button>
      <span role="status" aria-live="polite" className="small">
        {esportazione.isPending && 'Esportazione del file CSV in corso…'}
        {esportazione.isSuccess && 'File CSV scaricato.'}
      </span>
      {esportazione.isError && (
        <div className="alert alert-danger w-100 mb-0" role="alert">
          {getErrorMessage(esportazione.error)}
        </div>
      )}
    </>
  );
}

function Anteprima({ riga, perimetro, filtri, onChiudi }: { riga: Riga | null; perimetro?: Perimetro; filtri: Filtri; onChiudi: () => void }) {
  return (
    <PannelloLaterale aperto={riga !== null} onChiudi={onChiudi} titolo={riga?.codiceIntervento ?? ''} sopratitolo="Anteprima dell'intervento" stretto>
      {riga && (
        <>
          <dl className="ui-dl">
            <div>
              <dt>Domande presentate</dt>
              <dd>{formatNumber(riga.domandePresentate)}</dd>
            </div>
            {CAMPI.map((c) => (
              <div key={c.chiave}>
                <dt>{c.programma ? diProgramma(c.titolo, perimetro) : c.titolo}</dt>
                <dd>
                  <ValoreImporto importo={riga[c.chiave] as Riga['dotazioneSpesaPubblica']} />
                </dd>
              </div>
            ))}
          </dl>
          {riga.codiceIntervento && (
            <Link className="btn btn-primary mt-3 w-100" to={conFiltri(percorsoIntervento(riga.codiceIntervento), filtri)}>
              {"Apri il dettaglio dell'intervento"}
            </Link>
          )}
        </>
      )}
    </PannelloLaterale>
  );
}

function Contenuto({ d, filtri }: { d: RiepilogoFinanziario; filtri: Filtri }) {
  const { dalClic } = useApriIntervento(filtri);
  const righe = d.righe ?? [];
  const [aperta, setAperta] = useState<Riga | null>(null);
  const [vista, setVista] = useState<'tabella' | 'grafico'>('tabella');
  // valore fuori tabella, indipendente dai filtri: nel piede, come nel wireframe
  const assistenzaTecnica: RigaPiede = { codice: 'Dotazione assistenza tecnica (AT001, intero programma: non dipende dai filtri)', dotazioneSpesaPubblica: <ValoreImporto importo={d.dotazioneAssistenzaTecnica} /> };
  return (
    <>
      <PerimetroSezione perimetro={d.perimetro} />
      <NotaPerimetroMisto perimetro={d.perimetro} />
      <div className="ui-seg mb-3" role="group" aria-label="Vista del riepilogo">
        <button type="button" aria-pressed={vista === 'tabella'} onClick={() => setVista('tabella')}>
          Tabella
        </button>
        <button type="button" aria-pressed={vista === 'grafico'} onClick={() => setVista('grafico')}>
          Grafico
        </button>
      </div>
      {vista === 'tabella' ? (
        <TabellaInterattiva
          caption="Riepilogo per intervento (RF011)"
          righe={righe}
          colonne={colonne(d.perimetro)}
          chiaveRiga={(r) => r.codiceIntervento ?? ''}
          testoRicerca={(r) => r.codiceIntervento ?? ''}
          segnapostoRicerca="Cerca per codice dell'intervento"
          etichettaRiga={(r) => `Apri l'anteprima dell'intervento ${r.codiceIntervento ?? ''}`}
          onRiga={setAperta}
          ordineIniziale={{ chiave: 'dotazioneSpesaPubblica', verso: 'decrescente' }}
          totali={totali}
          righePiede={[assistenzaTecnica]}
          strumenti={<EsportaCsv filtri={filtri} />}
        />
      ) : (
        <CardGrafico
          titolo="Dotazione e pagamenti per intervento"
          sottotitolo="Trascina il cursore sotto il grafico per ingrandire; clic su una barra per il dettaglio"
          livello={3}
          altezza="alto"
          dati={graficoDotazionePagamenti(
            righe.map((r) => ({ codiceIntervento: r.codiceIntervento, dotazione: r.dotazioneSpesaPubblica, pagato: r.pagamentiNettoRettifiche })),
            d.perimetro,
            'Pagamenti al netto delle rettifiche',
          )}
          fonte="Fonte: TX-0011, riepilogo per intervento"
          onClic={dalClic}
        />
      )}
      <Anteprima riga={aperta} perimetro={d.perimetro} filtri={filtri} onChiudi={() => setAperta(null)} />
    </>
  );
}

export function RiepilogoReport({ filtri }: { filtri: Filtri }) {
  const stato = useRiepilogo(filtri);
  return (
    <VistaQuery stato={stato} eVuoto={(d) => (d.righe ?? []).length === 0} vuoto={VUOTO}>
      {(d) => (
        <Sezione titolo="Riepilogo per intervento">
          {/* una selezione nuova e' un contenuto nuovo: ricerca, ordine, pagina e anteprima non restano quelli di prima */}
          <Contenuto key={ricercaDaFiltri(filtri)} d={d} filtri={filtri} />
        </Sezione>
      )}
    </VistaQuery>
  );
}
