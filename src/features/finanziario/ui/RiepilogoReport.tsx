// RiepilogoReport — report RF011 (route /finanziario/riepilogo, TX-0011, flusso riepilogo v2): la tabella di riepilogo per
// intervento con i nove campi di RF011 nell'ordine del requisito (cerca, ordina, colonne, paginazione, totali), riga che
// apre l'anteprima laterale e da li' il dettaglio dell'intervento, file CSV e XLSX dal backend con gli stessi filtri, nel piede
// la dotazione dell'Assistenza tecnica (intero programma, non dipende dai filtri); sotto, il grafico per intervento (clic su
// una barra: dettaglio). Ogni cella assente dice il suo motivo; i totali sono "non calcolabile" se manca anche un solo valore
// (mai somme parziali). Revisioni del 31/10/2026 (R08): pagamenti lordi (col link all'elenco dei pagamenti), rettifiche e
// "Con rettifiche", le rettifiche nell'anteprima, l'impegnato con la parte stimata e la nota di lettura; l'Assistenza tecnica
// non prende il filtro SIGC. Revisione del 04/11/2026 (secondo feedback di Leonardo/Deloitte): tutto RF011 in pagina senza
// interruttore, prima la tabella e poi il grafico (dotazione, impegnato, pagamenti netti); stimato, lordi, rettifiche e "Con
// rettifiche" nascoste all'apertura (selettore Colonne); avviso degli impegnati diversi.
import { useState } from 'react';
import { Link } from 'react-router';
import { ApriNellElenco } from '../../../entities/domanda';
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
import { NotaPerimetroMisto, NotaStima, PerimetroSezione, colonneImporti, diProgramma, vuotoConPerimetro } from './comuni';
import { TabellaRettifiche } from './rettifiche';
import { testoRettificato } from '../lib/rettifiche';
import { NOTA_RICERCA_FILE, datiDelReport } from './esportazioni';
import { AvvisoImpegnati } from './AvvisoImpegnati';
import { useApriIntervento } from './useApriIntervento';
import { useStatoNellaHistory } from './useStatoNellaHistory';
import { STATO_RIEPILOGO, useStatoDelRiepilogo } from './ritornoAlRiepilogo';
import { useLinkElenco } from './LinkElenco';
import type { CriteriLink, IdLinkElenco } from '../lib/link-elenco';
import type { CampoImporto } from './comuni';

type Riga = RiepilogoFinanziarioRiga;

/** I campi di programma di RF011, prima delle domande presentate. */
const CAMPI_PROGRAMMA: CampoImporto<Riga>[] = [
  { chiave: 'dotazioneSpesaPubblica', titolo: 'Dotazione spesa pubblica', programma: true },
  { chiave: 'risorseQuotaFeasr', titolo: 'Risorse quota FEASR', programma: true },
  { chiave: 'importoStanziato', titolo: 'Importo stanziato', programma: true },
];

/** Gli altri campi di RF011, dopo le domande presentate, nell'ordine del requisito. */
const CAMPI_RF011: CampoImporto<Riga>[] = [
  { chiave: 'impegnatoCofinanziatoFeasr', titolo: 'Impegnato cofinanziato FEASR' },
  { chiave: 'impegnatoCofinanziatoFeasrENon', titolo: 'Impegnato cofinanziato FEASR e non' },
  { chiave: 'pagamentiNettoRettifiche', titolo: 'Pagamenti al netto delle rettifiche' },
  { chiave: 'dotazioneResiduaSuImpegni', titolo: 'Dotazione residua sugli impegni' },
  { chiave: 'dotazioneResiduaSuPagamenti', titolo: 'Dotazione residua sui pagamenti' },
];

/** Le colonne in piu' di RF011 (R08 e stima): nascoste all'apertura, nel selettore Colonne, nell'anteprima e nei file. */
const CAMPI_IN_PIU: CampoImporto<Riga>[] = [
  { chiave: 'impegnatoStimato', titolo: 'di cui stimato' },
  { chiave: 'pagamentiLordi', titolo: 'Pagamenti lordi' },
  { chiave: 'importoRettifiche', titolo: 'Rettifiche' },
];

const CAMPI: CampoImporto<Riga>[] = [...CAMPI_PROGRAMMA, ...CAMPI_RF011, ...CAMPI_IN_PIU];

const TITOLO_TABELLA = 'Tabella di riepilogo per intervento (RF011)';
const TITOLO_GRAFICO = 'Dotazione, impegnato e pagamenti per intervento';

const VUOTO = vuotoConPerimetro('Nessun intervento per i filtri scelti.', { programma: true });

type LinkDelReport = (id: IdLinkElenco, criteri?: CriteriLink) => string | null;

/** Nota del link dei pagamenti: l'elenco ha il pagato lordo dei pagamenti con esito Pagata, lo stesso importo dei lordi. */
const PAGAMENTI_LORDI_ELENCO = 'elenco dei pagamenti';
const NOTA_PAGAMENTI_LORDI = "L'elenco dei pagamenti mostra i pagamenti con esito Pagata degli elenchi di liquidazione con gli importi lordi, come la colonna Pagamenti lordi (nel selettore Colonne); le rettifiche sono nella loro colonna e nell'anteprima.";

/** "Si': 2 rettifiche", "No", o la fonte non attiva senza rettifiche nel database (R08). */
function testoConRettifiche(r: Riga): string {
  return testoRettificato(r.conRettifiche, (r.rettifiche ?? []).length);
}

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
  const domande: ColonnaTabella<Riga> = {
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
  };
  const inPiu = colonneImporti(CAMPI_IN_PIU, perimetro).flatMap((c): ColonnaTabella<Riga>[] => {
    // il link all'elenco dei pagamenti sta sulla cella dei lordi: stesso importo dell'elenco (scelta dell'utente del 01/11/2026)
    if (c.chiave === 'pagamentiLordi') {
      const resa = (r: Riga) => (
        <>
          {c.resa?.(r)}
          <ApriNellElenco variante="testo" indirizzo={linkDellaRiga(link, r).pagamenti} testo={PAGAMENTI_LORDI_ELENCO} descrizione={`l'elenco dei pagamenti dell'intervento ${r.codiceIntervento ?? ''}`} />
        </>
      );
      return [{ ...c, resa, nascosta: true }];
    }
    if (c.chiave === 'importoRettifiche') {
      return [{ ...c, nascosta: true }, { chiave: 'conRettifiche', titolo: 'Con rettifiche', valore: (r) => (r.rettifiche ?? []).length, resa: testoConRettifiche, nascosta: true }];
    }
    return [{ ...c, nascosta: true }];
  });
  return [
    { chiave: 'codice', titolo: 'Intervento', valore: (r) => r.codiceIntervento ?? null, fissa: true },
    ...colonneImporti(CAMPI_PROGRAMMA, perimetro),
    domande,
    ...colonneImporti(CAMPI_RF011, perimetro),
    ...inPiu,
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
  return <PulsantiScarica oggetto="la tabella di riepilogo per intervento" scaricamenti={datiDelReport('Riepilogo per intervento', 'riepilogo', filtri)} />;
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
        <ApriNellElenco variante="testo" indirizzo={nellElenco.pagamenti} testo={PAGAMENTI_LORDI_ELENCO} descrizione={`dell'intervento ${codice}`} />
      </p>
      {nellElenco.pagamenti && <p className="small mb-0">{NOTA_PAGAMENTI_LORDI}</p>}
    </div>
  );
}

/** Una voce dell'anteprima: un campo Importo con il titolo di programma se serve. */
function VoceImporto({ riga, campo, perimetro }: { riga: Riga; campo: CampoImporto<Riga>; perimetro?: Perimetro }) {
  return (
    <div>
      <dt>{campo.programma ? diProgramma(campo.titolo, perimetro) : campo.titolo}</dt>
      <dd>
        <ValoreImporto importo={riga[campo.chiave] as Riga['dotazioneSpesaPubblica']} />
      </dd>
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
            {CAMPI_PROGRAMMA.map((c) => (
              <VoceImporto key={c.chiave} riga={riga} campo={c} perimetro={perimetro} />
            ))}
            <div>
              <dt>Domande presentate</dt>
              <dd>{formatNumber(riga.domandePresentate)}</dd>
            </div>
            {[...CAMPI_RF011, ...CAMPI_IN_PIU].map((c) => (
              <VoceImporto key={c.chiave} riga={riga} campo={c} perimetro={perimetro} />
            ))}
            <div>
              <dt>Con rettifiche</dt>
              <dd>{testoConRettifiche(riga)}</dd>
            </div>
          </dl>
          {(riga.rettifiche ?? []).length > 0 && <TabellaRettifiche codice={riga.codiceIntervento ?? ''} rettifiche={riga.rettifiche ?? []} />}
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

function Contenuto({ d, filtri }: { d: RiepilogoFinanziario; filtri: Filtri }) {
  // aprendo il dettaglio (anteprima o grafico) lo stato della tabella viaggia con la navigazione: "Torna al riepilogo" lo
  // riporta (review v4 X-04, iter3 X-01)
  const { dalClic } = useApriIntervento(filtri, useStatoDelRiepilogo());
  const link = useLinkElenco(filtri);
  const colonneTabella = colonne(d.perimetro, link);
  // ricerca, ordine e pagina da ritrovare tornando indietro dall'elenco operativo o dal dettaglio (stessi filtri); uno stato
  // salvato fuori forma vale come assente (review v4 V-03, H-05)
  const [statoTabella, conservaStato] = useStatoNellaHistory<StatoTabella>(STATO_RIEPILOGO, filtri, statoTabellaValido(colonneTabella.map((c) => c.chiave)));
  const righe = d.righe ?? [];
  const [aperta, setAperta] = useState<Riga | null>(null);
  // valore fuori tabella, indipendente dai filtri: nel piede, come nel wireframe
  const assistenzaTecnica: RigaPiede = { codice: 'Dotazione assistenza tecnica (AT001, intero programma: non dipende dai filtri, nemmeno dal filtro SIGC)', dotazioneSpesaPubblica: <ValoreImporto importo={d.dotazioneAssistenzaTecnica} /> };
  return (
    <>
      <Sezione titolo={TITOLO_TABELLA}>
        <PerimetroSezione perimetro={d.perimetro} />
        <NotaPerimetroMisto perimetro={d.perimetro} />
        <AvvisoImpegnati righe={righe} />
        <NotaStima stima={d.stimaImpegni} />
        <TabellaInterattiva
          caption={TITOLO_TABELLA}
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
        {link('elenco-pagamenti-riga', { esito: ['PAGATA'] }) !== null && <p className="small mt-2 mb-0">{NOTA_PAGAMENTI_LORDI}</p>}
      </Sezione>
      <CardGrafico
        titolo={TITOLO_GRAFICO}
        sottotitolo="Un intervento per riga, tutti con la loro etichetta; clic su una barra per il dettaglio"
        altezza="alto"
        dati={graficoDotazionePagamenti(
          righe.map((r) => ({ codiceIntervento: r.codiceIntervento, dotazione: r.dotazioneSpesaPubblica, impegnato: r.impegnatoCofinanziatoFeasrENon, pagato: r.pagamentiNettoRettifiche })),
          d.perimetro,
          'Pagamenti al netto delle rettifiche',
        )}
        fonte="Fonte: TX-0011, riepilogo per intervento"
        onClic={dalClic}
        scaricamenti={datiDelReport(TITOLO_GRAFICO, 'riepilogo', filtri)}
      />
      <Anteprima riga={aperta} perimetro={d.perimetro} filtri={filtri} onChiudi={() => setAperta(null)} />
    </>
  );
}

export function RiepilogoReport({ filtri }: { filtri: Filtri }) {
  const stato = useRiepilogo(filtri);
  // una selezione nuova e' un contenuto nuovo: ricerca, ordine, pagina e anteprima non restano quelli di prima
  return (
    <VistaQuery stato={stato} eVuoto={(d) => (d.righe ?? []).length === 0} vuoto={VUOTO}>
      {(d) => <Contenuto key={ricercaDaFiltri(filtri)} d={d} filtri={filtri} />}
    </VistaQuery>
  );
}
