// DettaglioIntervento — pagina /istituzionale/interventi/:codice (flusso intervento approvato, ricomposto il 30/10/2026,
// dettaglio v2, RF016 e RF015): compone le due verifiche SMP filtrate sull'intervento della route (TX-0016 e TX-0015,
// nessuna transazione nuova), una scheda per verifica col suo periodo e i suoi KPI; l'output regionale (TX-0017) e' del
// fisico dal 29/10/2026. Il codice del percorso si convalida prima di leggere: un valore fuori formato (anche con '/') non
// manda richieste e la pagina lo dice. Barra dei riferimenti (perimetro regionale e "Dati al" della prima risposta
// arrivata fra TX-0016 e TX-0015), percorso, testata con un solo h1 (la descrizione dell'intervento da TX-0060, se no
// "Intervento <codice>"; focus a ogni cambio di route), il badge del perimetro e i pulsanti verso le due verifiche
// filtrate sull'intervento (ognuno col grant della sua destinazione, con l'anno o l'esercizio scelti), le schede. La
// scheda iniziale e' quella della pagina di partenza (con l'esercizio e senza l'anno, cioe' dalla verifica SIGC, la
// SIGC); poi la scheda attiva e' stato della pagina. Ogni lettura parte solo col grant della sua transazione e quando la
// sua scheda si apre (la SIGC solo con un esercizio); anno ed esercizio stanno nell'indirizzo (?anno=, ?esercizio=).
// Stati: caricamento (scheletro, alla prima apertura), errore (un solo avviso della pagina, problem-type, Riprova: ogni
// lettura vi registra il suo errore una volta), intervento senza dati nella verifica non SIGC (es. AT001) con il ritorno
// al report; la scheda SIGC dice da se' l'esercizio non scelto e l'intervento senza dati nell'esercizio.
// Design system: classi bootstrap-italia e del kit v2 (hero, badge, KPI); react-aria solo nelle schede (tablist) e nel
// popover della pill.
import { Link } from 'react-router';
import { useState } from 'react';
import type { Ref } from 'react';
import { ID_TITOLO_INTERVENTO, InterventoNonValido, codiceDelPercorso, descrizioneIntervento } from '../../../entities/filtri';
import { useAuthStatus } from '../../../shared/api/auth/use-auth-status';
import type { StatoDettaglio } from '../../../shared/lib';
import { AvvisoPagina, Briciole, ContestoIntestazione, CorpoDelDettaglio, ErroriDelleLetture, PillDatiAl, TestataDettaglio, Vuoto, useAnnoNellIndirizzo, useFocusTitolo, useRigheContesto, useStatoDelDettaglio } from '../../../shared/ui';
import { useValoriFiltri, useVerificaSmpNonSigc, useVerificaSmpSigc } from '../api';
import { verificaDellIntervento, verificaSigcDellIntervento } from '../lib/collegamenti';
import { PARAMETRO_ANNO, PARAMETRO_ESERCIZIO, criteriVerifica, soloIntervento, testiCriteri } from '../lib/criteri';
import { PERIMETRO_IN_PAROLE, PILL_PERIMETRO } from '../lib/formato';
import { puoLeggere } from '../lib/grant';
import {
  BADGE_INTERVENTO,
  SENZA_DATI,
  lettureDelloStato,
  schedaAttiva,
  schedaIniziale,
  schedeVisibili,
  sopratitoloIntervento,
  statoDellaPagina,
  titoloIntervento,
  ultimiDelDettaglio,
  ultimoDatoInErrore,
} from '../lib/intervento';
import type { IdScheda } from '../lib/intervento';
import { PERCORSI } from '../lib/pagine';
import { useIngressoArea } from './navigazione';
import { SchedeIntervento } from './SchedeIntervento';
import type { PropsSchede } from './SchedeIntervento';

/** I grant delle due letture del dettaglio (gate di UX: il backend ridecide). */
function useGrantDelDettaglio() {
  const auth = useAuthStatus().data;
  return { conVerifica: puoLeggere(auth, 'verifica'), conSigc: puoLeggere(auth, 'verificaSigc'), conValori: puoLeggere(auth, 'filtri') };
}

/**
 * Le schede: quelle visibili per grant, l'attiva (la scelta o quella iniziale dalla pagina di partenza, se visibile) e
 * quelle gia' aperte, le cui letture restano partite.
 */
function useSchede(conVerifica: boolean, conSigc: boolean, anno: number | undefined, esercizio: number | undefined) {
  const schede = schedeVisibili(conVerifica, conSigc);
  const [scelta, setScelta] = useState<IdScheda>(() => schedaIniziale(anno, esercizio));
  const [aperte, setAperte] = useState<readonly IdScheda[]>([]);
  const attiva = schedaAttiva(schede, scelta);
  const aperta = (s: IdScheda) => attiva === s || aperte.includes(s);
  const onScheda = (s: IdScheda) => {
    setScelta(s);
    setAperte((prima) => [...new Set([...prima, ...(attiva ? [attiva] : []), s])]);
  };
  return { schede, attiva, aperta, onScheda };
}

/** Il codice dell'indirizzo non e' un codice di intervento: nessuna richiesta, lo dice la pagina (InterventoNonValido dell'entity). */
function CodiceNonValido() {
  return <InterventoNonValido area="Istituzionale" ingresso={useIngressoArea()} suggerimento="Scegli l'intervento dalla verifica SMP non SIGC o dalla verifica SMP SIGC." titoloDocumento="Intervento non valido - Istituzionale" />;
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

interface PropsTestata {
  h1: Ref<HTMLHeadingElement>;
  codice: string;
  titolo: string;
  anno: number | undefined;
  esercizio: number | undefined;
  conVerifica: boolean;
  conSigc: boolean;
}

/**
 * La testata: sopratitolo, h1, il badge del perimetro e i pulsanti verso le due verifiche filtrate sull'intervento (link
 * verifica-smp-intervento con l'anno, verifica-smp-sigc-intervento con l'esercizio), ognuno col grant della destinazione.
 */
function TestataIntervento({ h1, codice, titolo, anno, esercizio, conVerifica, conSigc }: PropsTestata) {
  const azioni = (conVerifica || conSigc) && (
    <>
      {conVerifica && (
        <Link className="btn btn-light btn-sm" to={verificaDellIntervento(codice, anno)}>
          Verifica SMP non SIGC filtrata su questo intervento
        </Link>
      )}
      {conSigc && (
        <Link className="btn btn-light btn-sm" to={verificaSigcDellIntervento(codice, esercizio)}>
          Verifica SMP SIGC filtrata su questo intervento
        </Link>
      )}
    </>
  );
  return <TestataDettaglio idTitolo={ID_TITOLO_INTERVENTO} titolo={titolo} h1={h1} sopratitolo={sopratitoloIntervento(codice)} badge={BADGE_INTERVENTO} azioni={azioni} />;
}

/** Intervento senza righe nella verifica non SIGC: lo stato col ritorno alla verifica SMP non SIGC. */
function SenzaDati() {
  return (
    <Vuoto>
      <span className="me-2">{SENZA_DATI}</span>
      <Link className="btn btn-primary btn-sm" to={PERCORSI.verifica}>
        Torna alla verifica SMP non SIGC
      </Link>
    </Vuoto>
  );
}

/** Il corpo secondo lo stato delle letture (CorpoDelDettaglio del kit): scheletro, errore, senza dati, le schede. */
function CorpoDettaglio({ stato, ...schede }: PropsSchede & { stato: StatoDettaglio }) {
  return (
    <CorpoDelDettaglio stato={stato} vuoto={<SenzaDati />}>
      <SchedeIntervento {...schede} />
    </CorpoDelDettaglio>
  );
}

function Dettaglio({ codice }: { codice: string }) {
  const [anno, impostaAnno] = useAnnoNellIndirizzo(PARAMETRO_ANNO);
  const [esercizio, impostaEsercizio] = useAnnoNellIndirizzo(PARAMETRO_ESERCIZIO);
  const { conVerifica, conSigc, conValori } = useGrantDelDettaglio();
  const { schede, attiva, aperta, onScheda } = useSchede(conVerifica, conSigc, anno, esercizio);
  // ogni lettura parte col grant della sua transazione quando la sua scheda si apre; al cambio d'anno o d'esercizio restano
  // i dati di prima: la scheda col selettore resta montata (focus su "Mostra")
  const leggeVerifica = conVerifica && aperta('verifica');
  const leggeSigc = conSigc && aperta('verificaSigc') && esercizio !== undefined;
  const statoVerifica = useVerificaSmpNonSigc(criteriVerifica(soloIntervento(codice), anno), { abilitato: leggeVerifica, mantieniDati: true });
  const statoSigc = useVerificaSmpSigc(soloIntervento(codice), esercizio, { abilitato: leggeSigc, mantieniDati: true });
  const verifica = leggeVerifica ? statoVerifica : null;
  const verificaSigc = leggeSigc ? statoSigc : null;
  const descrizione = descrizioneIntervento(useValoriFiltri(conValori).data?.interventi, codice);
  const letture = [verifica, verificaSigc].filter((l) => l !== null);
  const stato = statoDellaPagina(useStatoDelDettaglio(lettureDelloStato(verifica, verificaSigc)), letture.length, schede.length);
  // il titolo del documento dal codice, come nel wireframe approvato (review V8): la descrizione che arriva dopo non
  // riporta il focus sull'h1
  const h1 = useFocusTitolo<HTMLHeadingElement>(`Intervento ${codice} - Istituzionale`);
  const ultimi = ultimiDelDettaglio([verifica, verificaSigc]);
  // l'intestazione dei file coi criteri dell'intervento (review A1, NFR-50): la pagina non ha grafici, le schede scaricano
  // i file del backend
  const contesto = useRigheContesto(testiCriteri(soloIntervento(codice)), ultimi, PERIMETRO_IN_PAROLE);
  const schedeProps = { codice, anno, onAnno: impostaAnno, esercizio, onEsercizio: impostaEsercizio, schede, attiva, onScheda, verifica, verificaSigc };
  return (
    <ContestoIntestazione.Provider value={contesto}>
      <BarraRiferimenti ultimi={ultimi} inErrore={ultimoDatoInErrore(letture)} />
      <main className="ui-pagina" id="contenuto">
        <Briciole voci={[{ etichetta: 'Istituzionale', a: useIngressoArea() }, { etichetta: codice }]} />
        <TestataIntervento h1={h1} codice={codice} titolo={titoloIntervento(codice, descrizione)} anno={anno} esercizio={esercizio} conVerifica={conVerifica} conSigc={conSigc} />
        <AvvisoPagina>
          {/* l'errore di ogni lettura lo registra l'avviso della pagina, una volta (review H1): le schede il testo statico */}
          <ErroriDelleLetture letture={[verifica, verificaSigc]} />
          <CorpoDettaglio stato={stato} {...schedeProps} />
        </AvvisoPagina>
      </main>
    </ContestoIntestazione.Provider>
  );
}

/** Il codice viene dalla route (react-router lo decodifica): fuori formato, nessuna lettura. */
export function DettaglioIntervento({ codice: parametro }: { codice: string | undefined }) {
  const codice = codiceDelPercorso(parametro);
  // codice nuovo = pagina nuova: la scheda scelta non resta quella dell'intervento di prima
  return codice === null ? <CodiceNonValido /> : <Dettaglio key={codice} codice={codice} />;
}
