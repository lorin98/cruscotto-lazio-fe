// RiepilogoReport — report RF011 (route /finanziario/riepilogo, TX-0011, flusso riepilogo v2): tabella interattiva per
// intervento (cerca, ordina, colonne, paginazione, totali), riga che apre l'anteprima laterale e da li' il dettaglio
// dell'intervento, vista grafico, esportazione CSV con gli stessi filtri, dotazione dell'Assistenza tecnica (intero
// programma, non dipende dai filtri). Le colonne senza alcun valore nelle righe ricevute partono nascoste e lo si dice.
import { useState } from 'react';
import { Link } from 'react-router';
import { ValoreImporto } from '../../../entities/importo';
import type { ImportoLike } from '../../../entities/importo';
import { formatEuro, formatNumber, getErrorMessage } from '../../../shared/lib';
import { CardGrafico, PannelloLaterale, TabellaInterattiva, VistaQuery, Vuoto, salvaFile } from '../../../shared/ui';
import type { ColonnaTabella } from '../../../shared/ui';
import { useEsportaRiepilogoCsv, useRiepilogo } from '../api';
import type { RiepilogoFinanziario, RiepilogoFinanziarioRiga } from '../api';
import { ricercaDaFiltri } from '../lib/filtri';
import type { Filtri, Perimetro } from '../lib/filtri';
import { graficoDotazionePagamenti } from '../lib/grafici';
import { percorsoIntervento } from '../lib/report';
import { NotaPerimetroMisto, PerimetroSezione, Sezione, TabellaVoci, diProgramma, vuotoConPerimetro } from './comuni';

type Riga = RiepilogoFinanziarioRiga;
type CampoImporto = Exclude<{ [K in keyof Riga]-?: Riga[K] extends ImportoLike | undefined ? K : never }[keyof Riga], undefined>;

const CAMPI: Array<{ chiave: CampoImporto; titolo: string; programma?: boolean }> = [
  { chiave: 'dotazioneSpesaPubblica', titolo: 'Dotazione spesa pubblica', programma: true },
  { chiave: 'risorseQuotaFeasr', titolo: 'Risorse quota FEASR', programma: true },
  { chiave: 'importoStanziato', titolo: 'Importo stanziato', programma: true },
  { chiave: 'impegnatoCofinanziatoFeasr', titolo: 'Impegnato cofinanziato FEASR' },
  { chiave: 'impegnatoCofinanziatoFeasrENon', titolo: 'Impegnato cofinanziato FEASR e non' },
  { chiave: 'pagamentiNettoRettifiche', titolo: 'Pagamenti al netto di rettifiche' },
  { chiave: 'dotazioneResiduaSuImpegni', titolo: 'Dotazione residua sugli impegni' },
  { chiave: 'dotazioneResiduaSuPagamenti', titolo: 'Dotazione residua sui pagamenti' },
];

const valore = (i: ImportoLike | undefined | null) => i?.valore ?? null;
const senzaValori = (righe: Riga[], c: CampoImporto) => righe.every((r) => valore(r[c]) === null);

function colonne(righe: Riga[], perimetro: Perimetro | undefined): ColonnaTabella<Riga>[] {
  return [
    { chiave: 'codice', titolo: 'Intervento', valore: (r) => r.codiceIntervento ?? null, fissa: true },
    { chiave: 'domande', titolo: 'Domande presentate', valore: (r) => r.domandePresentate ?? null, resa: (r) => formatNumber(r.domandePresentate), numerica: true },
    ...CAMPI.map((c) => ({
      chiave: c.chiave,
      titolo: c.programma ? diProgramma(c.titolo, perimetro) : c.titolo,
      valore: (r: Riga) => valore(r[c.chiave]),
      resa: (r: Riga) => <ValoreImporto importo={r[c.chiave]} />,
      numerica: true,
      nascosta: senzaValori(righe, c.chiave),
    })),
  ];
}

/** Somma di una colonna solo se ogni riga ha il valore: con anche un solo assente il totale non e' calcolabile. */
function totale(righe: readonly Riga[], c: CampoImporto): string {
  const v = righe.map((r) => valore(r[c]));
  return v.every((x): x is number => x !== null) ? formatEuro(v.reduce((a, b) => a + b, 0)) : 'non calcolabile';
}

/** Come per gli importi: con anche un solo conteggio assente il totale non e' calcolabile (mai un assente come zero). */
function totaleDomande(righe: readonly Riga[]): string {
  const v = righe.map((r) => r.domandePresentate);
  return v.every((x): x is number => x != null) ? formatNumber(v.reduce((a, b) => a + b, 0)) : 'non calcolabile';
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
  const query = ricercaDaFiltri(filtri);
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
                  <ValoreImporto importo={riga[c.chiave]} />
                </dd>
              </div>
            ))}
          </dl>
          {riga.codiceIntervento && (
            <Link className="btn btn-primary mt-3 w-100" to={`${percorsoIntervento(riga.codiceIntervento)}${query ? `?${query}` : ''}`}>
              {"Apri il dettaglio dell'intervento"}
            </Link>
          )}
        </>
      )}
    </PannelloLaterale>
  );
}

function Contenuto({ d, filtri }: { d: RiepilogoFinanziario; filtri: Filtri }) {
  const righe = d.righe ?? [];
  const [aperta, setAperta] = useState<Riga | null>(null);
  const [vista, setVista] = useState<'tabella' | 'grafico'>('tabella');
  const nascoste = CAMPI.filter((c) => senzaValori(righe, c.chiave)).map((c) => (c.programma ? diProgramma(c.titolo, d.perimetro) : c.titolo));
  if (righe.length === 0) return <Vuoto>{vuotoConPerimetro('Nessun intervento per i filtri scelti. Modifica i filtri.')(d)}</Vuoto>;
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
        <>
          {nascoste.length > 0 && (
            <p className="ui-nota">{`Colonne nascoste perché nessun intervento ha un valore (fonte non attiva o non valorizzato): ${nascoste.join(', ')}. Si mostrano da "Colonne".`}</p>
          )}
          <TabellaInterattiva
            caption="Riepilogo per intervento (RF011)"
            righe={righe}
            colonne={colonne(righe, d.perimetro)}
            chiaveRiga={(r) => r.codiceIntervento ?? ''}
            testoRicerca={(r) => r.codiceIntervento ?? ''}
            etichettaRiga={(r) => `Apri l'anteprima dell'intervento ${r.codiceIntervento ?? ''}`}
            onRiga={setAperta}
            ordineIniziale={{ chiave: 'dotazioneSpesaPubblica', verso: 'decrescente' }}
            totali={(rr) => ({
              codice: rr.length === 1 ? 'Totale (1 intervento)' : `Totale (${rr.length} interventi)`,
              domande: totaleDomande(rr),
              ...Object.fromEntries(CAMPI.map((c) => [c.chiave, totale(rr, c.chiave)])),
            })}
            strumenti={<EsportaCsv filtri={filtri} />}
          />
        </>
      ) : (
        <CardGrafico
          titolo="Dotazione e pagamenti per intervento"
          sottotitolo="Trascina il cursore sotto il grafico per ingrandire"
          livello={3}
          altezza="alto"
          dati={graficoDotazionePagamenti(
            righe.map((r) => ({ codiceIntervento: r.codiceIntervento, dotazione: r.dotazioneSpesaPubblica, pagato: r.pagamentiNettoRettifiche })),
            d.perimetro,
          )}
          fonte="Fonte: TX-0011, riepilogo per intervento"
          onClic={(p) => {
            const r = righe.find((x) => x.codiceIntervento === p.name);
            if (r) setAperta(r);
          }}
        />
      )}
      <Anteprima riga={aperta} perimetro={d.perimetro} filtri={filtri} onChiudi={() => setAperta(null)} />
    </>
  );
}

export function RiepilogoReport({ filtri }: { filtri: Filtri }) {
  const stato = useRiepilogo(filtri);
  return (
    <VistaQuery stato={stato}>
      {(d) => (
        <>
          <Sezione titolo="Riepilogo per intervento">
            <Contenuto d={d} filtri={filtri} />
          </Sezione>
          <Sezione titolo="Assistenza tecnica">
            <TabellaVoci
              caption="Valore fuori tabella, indipendente dai filtri"
              voci={[{ etichetta: 'Dotazione assistenza tecnica (AT001, intero programma: non dipende dai filtri)', valore: <ValoreImporto importo={d.dotazioneAssistenzaTecnica} /> }]}
            />
          </Sezione>
        </>
      )}
    </VistaQuery>
  );
}
