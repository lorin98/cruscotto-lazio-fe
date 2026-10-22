// DettaglioIntervento — pagina /istituzionale/interventi/:codice (flusso intervento approvato, dettaglio v2, RF016 e
// RF017): compone TX-0016 e TX-0017 filtrate sull'intervento della route (nessuna transazione nuova). Il codice del percorso
// si convalida prima di leggere: un valore fuori formato (anche con '/') non manda richieste e la pagina lo dice. Barra dei
// riferimenti (perimetro regionale e "Dati al" della prima risposta arrivata), percorso, testata con un solo h1 (la
// descrizione dell'intervento da TX-0060, se no "Intervento <codice>"; focus a ogni cambio di route), badge in testo e i
// pulsanti verso i due report filtrati sull'intervento (solo col grant della destinazione), quattro KPI, le schede. Ogni
// lettura parte solo col grant della sua transazione; l'anno di riferimento sta nell'indirizzo (?anno=). Stati:
// caricamento (scheletro, alla prima apertura finche' non hanno risposto tutte le letture), errore (un solo avviso della
// pagina, problem-type, Riprova: ogni lettura vi registra il suo errore una volta), intervento senza dati (es. AT001) con
// il ritorno al report. La scheda attiva e' stato della pagina: resta mentre una lettura riparte (Riprova, un altro anno).
// Design system: classi bootstrap-italia e del kit v2 (hero, badge, KPI); react-aria solo nelle schede (tablist) e nel
// popover della pill.
import { Link } from 'react-router';
import { useState } from 'react';
import type { Ref } from 'react';
import { descrizioneIntervento } from '../../../entities/filtri';
import { useAuthStatus } from '../../../shared/api/auth/use-auth-status';
import { AvvisoPagina, Briciole, Caricamento, ContestoIntestazione, ErroreNellaPagina, Griglia, Kpi, PillDatiAl, TestataDettaglio, Vuoto, useAnnoNellIndirizzo, useErroreNellaPagina, useFocusTitolo } from '../../../shared/ui';
import type { NomeIcona, TonoKpi } from '../../../shared/ui';
import { useOutputRegionale, useValoriFiltri, useVerificaSmpNonSigc } from '../api';
import { outputDellIntervento, verificaDellIntervento } from '../lib/collegamenti';
import { PARAMETRO_ANNO, codiceDelPercorso, criteriVerifica, soloIntervento, testiCriteri } from '../lib/criteri';
import type { RigaOutput, RigaVerifica } from '../lib/dto';
import { PILL_PERIMETRO } from '../lib/formato';
import { puoLeggere } from '../lib/grant';
import { SENZA_DATI, badgeIntervento, kpiIntervento, sopratitoloIntervento, statoDelDettaglio, titoloIntervento, tutteRisposte, ultimiDelDettaglio, ultimoDatoInErrore } from '../lib/intervento';
import type { ChiaveKpi, IdScheda, LetturaDettaglio } from '../lib/intervento';
import { rigaDellIntervento } from '../lib/output';
import { PERCORSI } from '../lib/pagine';
import { useContesto } from './comuni';
import { useIngressoArea } from './navigazione';
import { SchedeIntervento } from './SchedeIntervento';
import type { PropsSchede } from './SchedeIntervento';

const ID_TITOLO = 't-intervento';

/** Le letture del dettaglio, ognuna solo col grant della sua transazione (null senza: la scheda non c'e'). */
function useLettureDelDettaglio(codice: string, anno: number | undefined) {
  const auth = useAuthStatus().data;
  const conVerifica = puoLeggere(auth, 'verifica');
  const conOutput = puoLeggere(auth, 'output');
  // al cambio d'anno restano i dati di prima: la scheda col selettore resta montata (focus su "Mostra")
  const verifica = useVerificaSmpNonSigc(criteriVerifica(soloIntervento(codice), anno), { abilitato: conVerifica, mantieniDati: true });
  const output = useOutputRegionale(soloIntervento(codice), { abilitato: conOutput });
  const valori = useValoriFiltri(puoLeggere(auth, 'filtri'));
  return { verifica: conVerifica ? verifica : null, output: conOutput ? output : null, descrizione: descrizioneIntervento(valori.data?.interventi, codice) };
}

/** Il codice dell'indirizzo non e' un codice di intervento: nessuna richiesta, lo dice la pagina. */
function InterventoNonValido() {
  const h1 = useFocusTitolo<HTMLHeadingElement>('Intervento non valido - Istituzionale');
  return (
    <main className="ui-pagina" id="contenuto">
      <Briciole voci={[{ etichetta: 'Istituzionale', a: useIngressoArea() }, { etichetta: 'Intervento' }]} />
      <TestataDettaglio idTitolo={ID_TITOLO} titolo="Intervento non valido" h1={h1} />
      <p className="alert alert-danger" role="alert">
        {"Il codice nell'indirizzo non è un codice di intervento: nessun dato richiesto. Scegli l'intervento dalla verifica SMP non SIGC o dall'output regionale."}
      </p>
    </main>
  );
}

/** Perimetro (sempre regionale) e ultimo dato sincronizzato, nella barra dei riferimenti (il dettaglio non ha filtri). */
function BarraRiferimenti({ ultimi, inErrore }: { ultimi: ReturnType<typeof ultimiDelDettaglio>; inErrore: boolean }) {
  return (
    <div className="ui-filtri" role="region" aria-label="Riferimenti dei dati">
      <div className="ui-filtri__destra">
        <span className="ui-pill">{PILL_PERIMETRO}</span>
        <PillDatiAl voci={ultimi} inErrore={inErrore} />
      </div>
    </div>
  );
}

/** La testata: sopratitolo, h1, badge in testo e i pulsanti verso i due report filtrati (link dello uiplan). */
function TestataIntervento({ h1, codice, titolo, badge, anno }: { h1: Ref<HTMLHeadingElement>; codice: string; titolo: string; badge: string[]; anno: number | undefined }) {
  const auth = useAuthStatus().data;
  const azioni = (
    <>
      {puoLeggere(auth, 'verifica') && (
        <Link className="btn btn-light btn-sm" to={verificaDellIntervento(codice, anno)}>
          Verifica SMP non SIGC filtrata su questo intervento
        </Link>
      )}
      {puoLeggere(auth, 'output') && (
        <Link className="btn btn-outline-light btn-sm" to={outputDellIntervento(codice)}>
          Output regionale filtrato su questo intervento
        </Link>
      )}
    </>
  );
  return <TestataDettaglio idTitolo={ID_TITOLO} titolo={titolo} h1={h1} sopratitolo={sopratitoloIntervento(codice)} badge={badge} azioni={azioni} />;
}

const ASPETTO_KPI: Record<ChiaveKpi, { icona: NomeIcona; tono: TonoKpi }> = {
  target: { icona: 'it-chart-line', tono: 'scuro' },
  ricevute: { icona: 'it-files', tono: 'blu' },
  finanziate: { icona: 'it-check-circle', tono: 'verde' },
  spesa: { icona: 'it-card', tono: 'ambra' },
};

/** I KPI del dettaglio (lib/intervento): quelli delle letture fatte, nessuna quota calcolata. */
function KpiDettaglio({ output, verifica }: { output: RigaOutput | undefined; verifica: RigaVerifica | undefined }) {
  const kpi = kpiIntervento(output, verifica);
  if (kpi.length === 0) return null;
  return (
    <Griglia colonne={4}>
      {kpi.map((k) => (
        <Kpi key={k.chiave} etichetta={k.etichetta} valore={k.valore} assente={k.assente} nota={k.nota} {...ASPETTO_KPI[k.chiave]} />
      ))}
    </Griglia>
  );
}

/** Intervento senza righe nei report letti: lo stato col ritorno al report (l'output regionale, se il profilo lo legge). */
function SenzaDati({ conOutput }: { conOutput: boolean }) {
  return (
    <Vuoto>
      <span className="me-2">{SENZA_DATI}</span>
      <Link className="btn btn-primary btn-sm" to={conOutput ? PERCORSI.output : PERCORSI.verifica}>
        {conOutput ? "Torna all'output regionale" : 'Torna alla verifica SMP non SIGC'}
      </Link>
    </Vuoto>
  );
}

type PropsCorpo = Omit<PropsSchede, 'unita'>;
type Stato = ReturnType<typeof statoDelDettaglio>;

const senzaRisposta = (s: { isError: boolean; data: unknown } | null): boolean => s !== null && s.isError && s.data === undefined;

/**
 * Le letture che non hanno risposto: l'errore lo dice subito, una volta e con Riprova, l'avviso della pagina (anche se la
 * scheda della lettura non e' aperta). E' il solo a registrarlo (review H1): le schede mostrano il testo statico.
 */
function ErroriDelleLetture({ verifica, output }: Pick<PropsCorpo, 'verifica' | 'output'>) {
  useErroreNellaPagina(senzaRisposta(verifica), verifica?.error, () => verifica?.refetch());
  useErroreNellaPagina(senzaRisposta(output), output?.error, () => output?.refetch());
  return null;
}

/** I KPI delle righe dell'intervento e le schede. */
function DatiDelDettaglio({ codice, verifica, output, ...schede }: PropsCorpo) {
  const rigaOutput = rigaDellIntervento(output?.data?.righe, codice);
  return (
    <>
      <KpiDettaglio output={rigaOutput} verifica={rigaDellIntervento(verifica?.data?.righe, codice)} />
      <SchedeIntervento {...schede} codice={codice} verifica={verifica} output={output} unita={rigaOutput?.unitaMisura ?? null} />
    </>
  );
}

/** Il corpo secondo lo stato delle letture: scheletro, errore (detto dall'avviso della pagina), senza dati, KPI e schede. */
function CorpoDettaglio({ stato, ...props }: PropsCorpo & { stato: Stato }) {
  if (stato === 'caricamento') return <Caricamento alto />;
  if (stato === 'errore') return <ErroreNellaPagina />;
  if (stato === 'vuoto') return <SenzaDati conOutput={props.output !== null} />;
  return <DatiDelDettaglio {...props} />;
}

/** Lo stato del dettaglio; finita la prima apertura (tutte le letture hanno risposto) la pagina non torna allo scheletro. */
function useStatoDelDettaglio(letture: readonly LetturaDettaglio[]): Stato {
  const [giaRisposte, setGiaRisposte] = useState(false);
  const risposte = tutteRisposte(letture);
  if (risposte && !giaRisposte) setGiaRisposte(true);
  return statoDelDettaglio(letture, giaRisposte || risposte);
}

function Dettaglio({ codice }: { codice: string }) {
  const [anno, impostaAnno] = useAnnoNellIndirizzo(PARAMETRO_ANNO);
  const [scheda, setScheda] = useState<IdScheda | null>(null);
  const { verifica, output, descrizione } = useLettureDelDettaglio(codice, anno);
  const letture = [verifica, output].filter((s) => s !== null);
  const stato = useStatoDelDettaglio(letture);
  // il titolo del documento dal codice: la descrizione che arriva dopo non riporta il focus sull'h1
  const h1 = useFocusTitolo<HTMLHeadingElement>(`${codice} - Istituzionale`);
  const ultimi = ultimiDelDettaglio(verifica?.data, output?.data);
  // l'intestazione del PNG coi soli criteri di TX-0017: l'unico PNG della pagina e' quello della scheda Output, che l'anno
  // di riferimento di TX-0016 non lo applica (review A1, NFR-50); un PNG di TX-0016 avrebbe il suo contesto nella scheda
  const contesto = useContesto(testiCriteri(soloIntervento(codice)), ultimi);
  const badge = badgeIntervento(rigaDellIntervento(output?.data?.righe, codice), rigaDellIntervento(verifica?.data?.righe, codice));
  return (
    <ContestoIntestazione.Provider value={contesto}>
      <BarraRiferimenti ultimi={ultimi} inErrore={ultimoDatoInErrore(letture)} />
      <main className="ui-pagina" id="contenuto">
        <Briciole voci={[{ etichetta: 'Istituzionale', a: useIngressoArea() }, { etichetta: codice }]} />
        <TestataIntervento h1={h1} codice={codice} titolo={titoloIntervento(codice, descrizione)} badge={badge} anno={anno} />
        <AvvisoPagina>
          <ErroriDelleLetture verifica={verifica} output={output} />
          <CorpoDettaglio stato={stato} codice={codice} anno={anno} onAnno={impostaAnno} verifica={verifica} output={output} scheda={scheda} onScheda={setScheda} />
        </AvvisoPagina>
      </main>
    </ContestoIntestazione.Provider>
  );
}

/** Il codice viene dalla route (react-router lo decodifica): fuori formato, nessuna lettura. */
export function DettaglioIntervento({ codice: parametro }: { codice: string | undefined }) {
  const codice = codiceDelPercorso(parametro);
  // codice nuovo = pagina nuova: la scheda scelta non resta quella dell'intervento di prima
  return codice === null ? <InterventoNonValido /> : <Dettaglio key={codice} codice={codice} />;
}
