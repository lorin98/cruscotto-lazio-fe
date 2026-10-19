// RiepilogoReport — report RF011 (route /finanziario/riepilogo, TX-0011, flusso riepilogo v2): tabella interattiva per
// intervento con i nove campi (cerca, ordina, colonne, paginazione, totali), riga che apre l'anteprima laterale e da li'
// il dettaglio dell'intervento, vista grafico (clic su una barra: dettaglio), file CSV e XLSX dal backend con gli stessi filtri, e
// nel piede la dotazione dell'Assistenza tecnica (intero programma, non dipende dai filtri). Ogni cella assente dice il
// suo motivo; i totali sono "non calcolabile" se manca anche un solo valore (mai somme parziali).
import { useState } from 'react';
import { Link } from 'react-router';
import { ValoreImporto } from '../../../entities/importo';
import { formatNumber } from '../../../shared/lib';
import { CardGrafico, PannelloLaterale, PulsantiScarica, Sezione, TabellaInterattiva, VistaQuery } from '../../../shared/ui';
import { statoTabellaValido } from '../../../shared/ui';
import type { ColonnaTabella, RigaPiede, StatoTabella } from '../../../shared/ui';
import { useRiepilogo } from '../api';
import type { RiepilogoFinanziario, RiepilogoFinanziarioRiga } from '../api';
import { cellaTotale, sommaSeCompleta } from '../lib/aggregati';
import { ricercaDaFiltri } from '../lib/filtri';
import type { Filtri } from '../lib/filtri';
import { graficoDotazionePagamenti } from '../lib/grafici';
import type { Perimetro } from '../lib/perimetro';
import { conFiltri, percorsoIntervento } from '../lib/report';
import { NotaPerimetroMisto, PerimetroSezione, colonneImporti, diProgramma, vuotoConPerimetro } from './comuni';
import { NOTA_RICERCA_FILE, datiDelReport } from './esportazioni';
import { useApriIntervento } from './useApriIntervento';
import { useStatoNellaHistory } from './useStatoNellaHistory';
import { STATO_RIEPILOGO, VISTA_RIEPILOGO, eVistaRiepilogo, useStatoDelRiepilogo } from './ritornoAlRiepilogo';
import type { VistaRiepilogo } from './ritornoAlRiepilogo';
import { ApriNellElenco, useLinkElenco } from './LinkElenco';
import type { CriteriLink, IdLinkElenco } from '../lib/link-elenco';
import type { CampoImporto } from './comuni';

type Riga = RiepilogoFinanziarioRiga;

const CAMPI: CampoImporto<Riga>[] = [
  { chiave: 'dotazioneSpesaPubblica', titolo: 'Dotazione spesa pubblica', programma: true },
  { chiave: 'risorseQuotaFeasr', titolo: 'Risorse quota FEASR', programma: true },
  { chiave: 'importoStanziato', titolo: 'Importo stanziato', programma: true },
  { chiave: 'impegnatoCofinanziatoFeasr', titolo: 'Impegnato cofinanziato FEASR' },
  { chiave: 'impegnatoCofinanziatoFeasrENon', titolo: 'Impegnato cofinanziato FEASR e non' },
  { chiave: 'pagamentiNettoRettifiche', titolo: 'Pagamenti al netto delle rettifiche' },
  { chiave: 'dotazioneResiduaSuImpegni', titolo: 'Dotazione residua sugli impegni' },
  { chiave: 'dotazioneResiduaSuPagamenti', titolo: 'Dotazione residua sui pagamenti' },
];

const VUOTO = vuotoConPerimetro('Nessun intervento per i filtri scelti.', { programma: true });

type LinkDelReport = (id: IdLinkElenco, criteri?: CriteriLink) => string | null;

/** Nota del link dei pagamenti: l'elenco ha il pagato lordo delle righe PAGATA, il report il netto delle rettifiche. */
const PAGAMENTI_LORDI_ELENCO = 'righe di pagamento, importi lordi';
const NOTA_PAGAMENTI_LORDI = "L'elenco dei pagamenti mostra le righe pagate degli elenchi di liquidazione con gli importi lordi; i recuperi sono nella scheda di ogni domanda.";

/** Link della riga verso l'elenco: nessuno senza il codice dell'intervento (la dotazione AT001 sta nel piede, senza link). */
function linkDellaRiga(link: LinkDelReport, r: Riga) {
  const codice = r.codiceIntervento;
  if (!codice) return { domande: null, pagamenti: null };
  return {
    domande: link('elenco-presentate-riga', { presentata: true, intervento: codice }),
    pagamenti: link('elenco-pagamenti-riga', { esito: ['PAGATA'], intervento: codice }),
  };
}

function colonne(perimetro: Perimetro | undefined, link: LinkDelReport): ColonnaTabella<Riga>[] {
  return [
    { chiave: 'codice', titolo: 'Intervento', valore: (r) => r.codiceIntervento ?? null, fissa: true },
    {
      chiave: 'domande',
      titolo: 'Domande presentate',
      valore: (r) => r.domandePresentate ?? null,
      resa: (r) => (
        <>
          {formatNumber(r.domandePresentate)}
          <ApriNellElenco variante="testo" indirizzo={linkDellaRiga(link, r).domande} descrizione={`le domande presentate dell'intervento ${r.codiceIntervento ?? ''}`} />
        </>
      ),
      numerica: true,
    },
    ...colonneImporti(CAMPI, perimetro).map((c) =>
      c.chiave !== 'pagamentiNettoRettifiche'
        ? c
        : {
            ...c,
            resa: (r: Riga) => (
              <>
                {c.resa?.(r)}
                <ApriNellElenco variante="testo" indirizzo={linkDellaRiga(link, r).pagamenti} testo={PAGAMENTI_LORDI_ELENCO} descrizione={`le righe di pagamento dell'intervento ${r.codiceIntervento ?? ''}`} />
              </>
            ),
          },
    ),
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

function Esporta({ filtri }: { filtri: Filtri }) {
  return <PulsantiScarica oggetto="la tabella Riepilogo per intervento" scaricamenti={datiDelReport('Riepilogo per intervento', 'riepilogo', filtri)} />;
}

/** I due link della riga nell'anteprima, con la nota sugli importi lordi; niente senza il grant dell'elenco. */
function NellElencoAnteprima({ riga, filtri }: { riga: Riga; filtri: Filtri }) {
  const nellElenco = linkDellaRiga(useLinkElenco(filtri), riga);
  if (!nellElenco.domande && !nellElenco.pagamenti) return null;
  const codice = riga.codiceIntervento ?? '';
  return (
    <div className="mt-3">
      <p className="ui-link-elenco--riga">
        <span>Nell&apos;elenco operativo:</span>
        <ApriNellElenco variante="testo" indirizzo={nellElenco.domande} testo="domande presentate" descrizione={`dell'intervento ${codice}`} />
        <ApriNellElenco variante="testo" indirizzo={nellElenco.pagamenti} testo={PAGAMENTI_LORDI_ELENCO} descrizione={`le righe di pagamento dell'intervento ${codice}`} />
      </p>
      {nellElenco.pagamenti && <p className="small mb-0">{NOTA_PAGAMENTI_LORDI}</p>}
    </div>
  );
}

function Anteprima({ riga, perimetro, filtri, onChiudi }: { riga: Riga | null; perimetro?: Perimetro; filtri: Filtri; onChiudi: () => void }) {
  const ritorno = useStatoDelRiepilogo();
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
            <Link className="btn btn-primary mt-3 w-100" to={conFiltri(percorsoIntervento(riga.codiceIntervento), filtri)} state={ritorno}>
              {"Apri il dettaglio dell'intervento"}
            </Link>
          )}
          <NellElencoAnteprima riga={riga} filtri={filtri} />
        </>
      )}
    </PannelloLaterale>
  );
}

/**
 * Vista Tabella o Grafico: subito quella scelta (stato locale), e la history la segue per il ritorno dal dettaglio (review v4 iter3
 * X-01). Senza una scelta salvata si parte dal grafico, come ogni card (richiesta dell'utente del 19/10/2026).
 */
function useVistaRiepilogo(filtri: Filtri): [VistaRiepilogo, (v: VistaRiepilogo) => void] {
  const [salvata, salva] = useStatoNellaHistory<VistaRiepilogo>(VISTA_RIEPILOGO, filtri, eVistaRiepilogo);
  const [vista, setVista] = useState<VistaRiepilogo>(salvata ?? 'grafico');
  return [
    vista,
    (v) => {
      setVista(v);
      salva(v);
    },
  ];
}

function Contenuto({ d, filtri }: { d: RiepilogoFinanziario; filtri: Filtri }) {
  // aprendo il dettaglio (anteprima o grafico) lo stato del riepilogo (tabella e vista) viaggia con la navigazione: "Torna
  // al riepilogo" lo riporta (review v4 X-04, iter3 X-01)
  const { dalClic } = useApriIntervento(filtri, useStatoDelRiepilogo());
  const link = useLinkElenco(filtri);
  const colonneTabella = colonne(d.perimetro, link);
  // ricerca, ordine e pagina da ritrovare tornando indietro dall'elenco operativo o dal dettaglio (stessi filtri); uno stato
  // salvato fuori forma vale come assente (review v4 V-03, H-05)
  const [statoTabella, conservaStato] = useStatoNellaHistory<StatoTabella>(STATO_RIEPILOGO, filtri, statoTabellaValido(colonneTabella.map((c) => c.chiave)));
  const righe = d.righe ?? [];
  const [aperta, setAperta] = useState<Riga | null>(null);
  const [vista, scegliVista] = useVistaRiepilogo(filtri);
  // valore fuori tabella, indipendente dai filtri: nel piede, come nel wireframe
  const assistenzaTecnica: RigaPiede = { codice: 'Dotazione assistenza tecnica (AT001, intero programma: non dipende dai filtri)', dotazioneSpesaPubblica: <ValoreImporto importo={d.dotazioneAssistenzaTecnica} /> };
  return (
    <>
      <PerimetroSezione perimetro={d.perimetro} />
      <NotaPerimetroMisto perimetro={d.perimetro} />
      <div className="ui-seg mb-3" role="group" aria-label="Vista del riepilogo">
        <button type="button" aria-pressed={vista === 'tabella'} onClick={() => scegliVista('tabella')}>
          Tabella
        </button>
        <button type="button" aria-pressed={vista === 'grafico'} onClick={() => scegliVista('grafico')}>
          Grafico
        </button>
      </div>
      {vista === 'tabella' ? (
        <TabellaInterattiva
          caption="Riepilogo per intervento (RF011)"
          righe={righe}
          colonne={colonneTabella}
          chiaveRiga={(r) => r.codiceIntervento ?? ''}
          testoRicerca={(r) => r.codiceIntervento ?? ''}
          segnapostoRicerca="Cerca per codice dell'intervento"
          notaRicerca={NOTA_RICERCA_FILE}
          etichettaRiga={(r) => `Apri l'anteprima dell'intervento ${r.codiceIntervento ?? ''}`}
          onRiga={setAperta}
          ordineIniziale={{ chiave: 'dotazioneSpesaPubblica', verso: 'decrescente' }}
          statoIniziale={statoTabella}
          onStato={conservaStato}
          totali={totali}
          righePiede={[assistenzaTecnica]}
          strumenti={<Esporta filtri={filtri} />}
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
          scaricamenti={datiDelReport('Dotazione e pagamenti per intervento', 'riepilogo', filtri)}
        />
      )}
      {vista === 'tabella' && link('elenco-pagamenti-riga', { esito: ['PAGATA'] }) !== null && <p className="small mt-2 mb-0">{NOTA_PAGAMENTI_LORDI}</p>}
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
