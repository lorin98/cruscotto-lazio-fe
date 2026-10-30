// DetermineDellaDomanda — pagina /procedurale/determine/:codice? (flusso determine approvato il 30/10/2026, dettaglio v2
// come la scheda della domanda dell'elenco, RF020; dalla pagina /fisico/determine/:codice? col riallineamento degli ambiti
// del 29/10/2026, A-1, A-5, nessun alias della vecchia route): una sola route col segmento facoltativo (scelta approvata
// il 22/10/2026). Senza codice (la
// voce di menu) il solo modulo di ricerca e lo stato "senza codice", nessuna lettura; con un codice valido UNA lettura di
// TX-0020. Percorso, modulo di ricerca (link cerca-domanda), testata con un solo h1 (le determine della domanda o, senza
// codice, il titolo della pagina: focus a ogni cambio di route e dopo una ricerca), badge in testo col perimetro della
// risposta (regionale, o ADA per il P4: scelta 2 del dossier) e "Apri la scheda della
// domanda" (link scheda-domanda verso l'elenco operativo: solo col grant di TX-0058 e con la domanda non chiusa), quattro
// KPI (corrente, numero di determine, da dove vengono stato area programmazione e comparto), tabella delle determine con
// riga aperta (si'/no in testo). Niente pill "Dati al" ne' download: TX-0020 non li ha (G3). Stati: senza codice, nessuna
// determina, domanda chiusa, caricamento, domanda non trovata (404 sul problem-type: un solo messaggio, stato e focus per
// la domanda inesistente e per quella fuori dal perimetro del P4, scelta 3, con "Cerca un altro codice" che porta il
// focus al campo), codice non valido (400 sul problem-type, sotto il campo), il resto (403, 429, 503) con l'avviso della
// pagina: Riprova come nelle altre pagine e "Cerca un altro codice" col focus al campo, come nel 404 (decisione D2
// dell'utente del 30/10/2026, review step9 PRO-02). In arrivo dalla scheda dell'elenco (link determine-della-domanda, il
// tipo della scheda nello state della navigazione, convalidato) con un tipo diverso da tipoDomanda della risposta, sopra
// la testata l'avviso "domanda dell'altro tipo" in role=status col link scheda-di-partenza (decisione D1 dell'utente del
// 30/10/2026, review step9 EO-01; testo neutro della decisione D4). Il tipo si legge una volta sola all'arrivo e lo state
// lascia subito la voce della cronologia (review step9 PRO2-01): senza state (ricarica, Indietro o Avanti, indirizzo
// condiviso), con lo stesso tipo, dopo una ricerca dal modulo o un cambio d'utente nessun avviso.
// Design system: classi bootstrap-italia e del kit v2 (hero, badge, KPI, tabella statica nativa); nessun primitivo
// react-aria, che qui non serve (nessun dialogo, nessuna scheda).
import { useEffect, useRef, useState } from 'react';
import type { MouseEvent, Ref, RefObject } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { tipoDellaSchedaDiPartenza } from '../../../entities/domanda';
import type { TipoDellaDomanda } from '../../../entities/domanda';
import { improntaIdentita, useAuthStatus } from '../../../shared/api/auth/use-auth-status';
import { formatDate, formatNumber } from '../../../shared/lib';
import { AvvisoPagina, Briciole, Griglia, Kpi, Sezione, TabellaStatica, TestataDettaglio, VistaQuery, Vuoto, useFocusTitolo } from '../../../shared/ui';
import type { ColonnaStatica } from '../../../shared/ui';
import { rispostaDatoNonValido, rispostaDomandaAssente, useDetermine } from '../api';
import {
  ARRIVO_SU_DETERMINE,
  badgeDetermine,
  codiceDalPercorso,
  eCorrente,
  fonteDi,
  messaggioAltroTipo,
  messaggioDomandaNonTrovata,
  percorsoDetermine,
  percorsoSchedaDellaDomanda,
  percorsoSchedaDiPartenza,
  sopratitoloDetermine,
  testoSchedaDiPartenza,
  tipoDiPartenzaDiverso,
  titoloDetermine,
} from '../lib/determine';
import type { CodiceDelPercorso } from '../lib/determine';
import type { Determina, Determine } from '../lib/dto';
import { siNo } from '../lib/formato';
import { puoLeggere } from '../lib/grant';
import { useIngressoArea } from './navigazione';
import { CercaDomanda } from './CercaDomanda';

const ID_CAMPO = 'codice-domanda';
const TITOLO_PAGINA = 'Determine di una domanda';
const CODICE_NON_VALIDO = 'Codice a barre non valido: contano solo le cifre, fino a 30.';

/** Testata (flusso approvato, testata di dettaglio del kit): sopratitolo, h1, badge in testo e il link alla scheda. */
function Testata({ h1, titolo, d, scheda }: { h1: Ref<HTMLHeadingElement>; titolo: string; d: Determine | undefined; scheda: string | null }) {
  const azioni = scheda && (
    <Link className="btn btn-light btn-sm" to={scheda}>
      Apri la scheda della domanda
    </Link>
  );
  return <TestataDettaglio idTitolo="t-determine" titolo={titolo} h1={h1} sopratitolo={d && sopratitoloDetermine(d)} badge={d && badgeDetermine(d)} azioni={azioni} />;
}

/**
 * Il testo dell'avviso "domanda dell'altro tipo" e il link scheda-di-partenza (solo col grant della scheda), che apre la
 * scheda della domanda sulla scheda Determine (state della navigazione).
 */
function TestoAltroTipo({ codice, tipoDellaRisposta, tipoDellaScheda, conGrantScheda }: { codice: string; tipoDellaRisposta: string; tipoDellaScheda: TipoDellaDomanda; conGrantScheda: boolean }) {
  const scheda = percorsoSchedaDiPartenza(tipoDellaScheda, codice, conGrantScheda);
  return (
    <>
      {messaggioAltroTipo(codice, tipoDellaRisposta, tipoDellaScheda)}
      {scheda && (
        <>
          {' '}
          <Link to={scheda} state={ARRIVO_SU_DETERMINE}>
            {testoSchedaDiPartenza(tipoDellaScheda)}
          </Link>
        </>
      )}
    </>
  );
}

/** Il tipo della scheda di partenza letto all'arrivo, col codice d'arrivo: vale solo finche' la pagina mostra quel codice. */
interface Arrivo {
  tipo: TipoDellaDomanda;
  codice: string;
}

/**
 * Il tipo della scheda di partenza (decisione D1; review step9 PRO2-01, come il flusso riapprovato): si legge UNA volta
 * all'arrivo dallo state della navigazione (convalidato) e resta nel componente insieme al codice; lo state lascia subito
 * la voce della cronologia (navigazione replace, stesso indirizzo), cosi' ricarica, Indietro o Avanti e indirizzo
 * condiviso non riportano l'avviso. Si azzera con `azzera` (una nuova ricerca dal modulo, anche dello stesso codice) e
 * quando cambia l'identita' della sessione senza ricarica: la shell (app/utente-della-sessione.ts) svuota la cache, ma lo
 * stato del componente resta. improntaIdentita qui decide solo cosa dimenticare, mai un accesso.
 */
function useTipoDiPartenza(codice: CodiceDelPercorso, impronta: string | undefined): { arrivo: Arrivo | null; azzera: () => void } {
  const { state, pathname, search, hash } = useLocation();
  const naviga = useNavigate();
  const [arrivo, setArrivo] = useState<Arrivo | null>(() => {
    const tipo = tipoDellaSchedaDiPartenza(state);
    return tipo !== null && codice.stato === 'valido' ? { tipo, codice: codice.codice } : null;
  });
  const daTogliere = tipoDellaSchedaDiPartenza(state) !== null;
  useEffect(() => {
    if (daTogliere) void naviga({ pathname, search, hash }, { replace: true, state: null });
  }, [daTogliere, naviga, pathname, search, hash]);
  // un'altra identita' (non la prima lettura della sessione): il tipo letto per la precedente non vale piu'
  const [identita, setIdentita] = useState(impronta);
  if (impronta !== identita) {
    setIdentita(impronta);
    if (identita !== undefined) setArrivo(null);
  }
  const valido = arrivo !== null && codice.stato === 'valido' && arrivo.codice === codice.codice;
  return { arrivo: valido ? arrivo : null, azzera: () => setArrivo(null) };
}

interface PropsAltroTipo {
  d: Determine | undefined;
  conGrantScheda: boolean;
}

/**
 * La regione dell'avviso: si monta vuota e nascosta e si riempie dopo il montaggio, anche con TX-0020 gia' in cache
 * (review step9 PRO2-02): una regione live inserita gia' piena non si annuncia (review v1 X-08 dell'elenco).
 */
function RegioneAltroTipo({ arrivo, d, conGrantScheda }: PropsAltroTipo & { arrivo: Arrivo }) {
  const [montata, setMontata] = useState(false);
  useEffect(() => setMontata(true), []);
  const tipo = montata ? tipoDiPartenzaDiverso(arrivo.tipo, d) : null;
  return (
    <div className={tipo === null ? 'visually-hidden' : 'alert alert-info my-3'} role="status">
      {tipo !== null && d && <TestoAltroTipo codice={arrivo.codice} tipoDellaRisposta={d.tipoDomanda} tipoDellaScheda={tipo} conGrantScheda={conGrantScheda} />}
    </div>
  );
}

/**
 * Avviso "domanda dell'altro tipo" (decisione D1), sopra la testata: solo in arrivo dalla scheda dell'elenco (il tipo
 * della scheda letto all'arrivo col codice, useTipoDiPartenza); se la risposta e' dell'altro tipo lo dice.
 */
function DomandaDellAltroTipo({ arrivo, ...props }: PropsAltroTipo & { arrivo: Arrivo | null }) {
  return arrivo === null ? null : <RegioneAltroTipo arrivo={arrivo} {...props} />;
}

/** KPI di una determina che fa da fonte, oppure l'assenza in testo. */
function KpiFonte({ etichetta, nomeAccessibile, determina }: { etichetta: string; nomeAccessibile: string; determina: Determina | undefined }) {
  return (
    <Kpi
      etichetta={etichetta}
      nomeAccessibile={nomeAccessibile}
      valore={determina?.codice}
      nota={determina ? `del ${formatDate(determina.data)}` : undefined}
      assente={determina ? undefined : 'Nessuna determina (non valorizzato)'}
      icona="it-file-signed"
      tono="scuro"
    />
  );
}

function Kpis({ d }: { d: Determine }) {
  const corrente = d.corrente.valore;
  return (
    <>
      <Griglia colonne={4}>
        <Kpi
          etichetta="Determina corrente"
          valore={corrente?.codice}
          nota={corrente ? `del ${formatDate(corrente.data)} (la più recente con riga aperta: data, poi codice)` : undefined}
          assente={corrente ? undefined : 'Nessuna determina aperta (non valorizzato)'}
          icona="it-file-signed"
        />
        <Kpi etichetta="Determine con riga aperta" valore={formatNumber(d.elenco.length)} nota="le righe chiuse non si elencano" icona="it-files" tono="verde" />
        <KpiFonte etichetta="Stato area programmazione da" nomeAccessibile="Stato area programmazione da: determina da cui viene lo stato area programmazione" determina={fonteDi(d.elenco, 'fonteStatoAreaProgrammazione')} />
        <KpiFonte etichetta="Comparto da" nomeAccessibile="Comparto da: determina da cui viene il comparto" determina={fonteDi(d.elenco, 'fonteComparto')} />
      </Griglia>
      <p className="small">
        {
          'Un campo della domanda viene dalla determina più recente che lo valorizza, che può non essere la corrente. Se nessuna determina aperta lo fornisce il riquadro dice "nessuna determina (non valorizzato)".'
        }
      </p>
    </>
  );
}

function colonne(d: Determine): ColonnaStatica<Determina>[] {
  return [
    { chiave: 'codice', titolo: 'Codice della determina', resa: (r) => r.codice },
    { chiave: 'data', titolo: 'Data', resa: (r) => formatDate(r.data) },
    { chiave: 'corrente', titolo: 'Determina corrente', resa: (r) => siNo(eCorrente(r, d.corrente), 'sì, corrente') },
    { chiave: 'stato', titolo: 'Da qui lo stato area programmazione', resa: (r) => siNo(r.fonteStatoAreaProgrammazione) },
    { chiave: 'comparto', titolo: 'Da qui il comparto', resa: (r) => siNo(r.fonteComparto) },
  ];
}

function Contenuto({ d }: { d: Determine }) {
  if (d.elenco.length === 0) {
    return <Vuoto>{`Nessuna determina aperta per la domanda ${d.codiceABarre} (non valorizzato): la domanda non prende informazioni da nessuna determina.`}</Vuoto>;
  }
  return (
    <>
      <Kpis d={d} />
      <Sezione titolo="Determine con riga aperta, dalla più recente">
        <TabellaStatica
          caption={`Determine da cui la domanda ${d.codiceABarre} prende le informazioni: codice, data e campi della domanda che ne prendono il valore. Ordine per data, poi per codice, dalla più recente.`}
          colonne={colonne(d)}
          righe={d.elenco}
          chiaveRiga={(r) => `${r.codice}-${r.data}`}
        />
        <p className="ui-fonte">Fonte: TX-0020 (determina corrente, determine con riga aperta). Responsabile, ADA, provincia e contributi delle determine sono nella scheda della domanda (elenco operativo, scheda Determine).</p>
      </Sezione>
    </>
  );
}

/**
 * "Cerca un altro codice" (404 e avviso della pagina per 403, 429 e 503): porta il focus al campo del modulo, senza contare
 * sulla navigazione al frammento del browser.
 */
function CercaUnAltroCodice({ campo }: { campo: RefObject<HTMLInputElement | null> }) {
  const alCampo = (e: MouseEvent<HTMLAnchorElement>) => {
    if (!campo.current) return;
    e.preventDefault();
    campo.current.focus();
  };
  return (
    <a href={`#${ID_CAMPO}`} onClick={alCampo}>
      Cerca un altro codice
    </a>
  );
}

/** Domanda non trovata (404): lo stesso messaggio per la domanda inesistente e per quella fuori dal perimetro del P4. */
function DomandaNonTrovata({ codice, campo }: { codice: string; campo: RefObject<HTMLInputElement | null> }) {
  return (
    <div className="alert alert-danger" role="alert">
      {`${messaggioDomandaNonTrovata(codice)} `}
      <CercaUnAltroCodice campo={campo} />
    </div>
  );
}

/** Il corpo secondo il codice del percorso e la lettura: senza codice, codice non valido, 404, i dati. */
function Corpo({ codice, stato, campo }: { codice: CodiceDelPercorso; stato: ReturnType<typeof useDetermine>; campo: RefObject<HTMLInputElement | null> }) {
  if (codice.stato === 'assente') return <Vuoto>Scrivi il codice a barre di una domanda per vedere da quali determine prende le informazioni.</Vuoto>;
  // codice non valido (dall'indirizzo o dal 400 del backend): lo dice il campo del modulo, nessun altro avviso
  if (codice.stato === 'non-valido') return null;
  const domanda = codice.codice;
  return (
    <VistaQuery
      stato={stato}
      errorePersonalizzato={(e) => {
        if (rispostaDatoNonValido(e)) return <></>;
        if (!rispostaDomandaAssente(e)) return null;
        return <DomandaNonTrovata codice={domanda} campo={campo} />;
      }}
    >
      {(d) => <Contenuto d={d} />}
    </VistaQuery>
  );
}

/** Messaggio da dire sotto il campo: il codice dell'indirizzo non valido o il 400 DATO_NON_VALIDO del backend. */
function erroreDelCampo(codice: CodiceDelPercorso, stato: ReturnType<typeof useDetermine>): string | undefined {
  if (codice.stato === 'non-valido') return CODICE_NON_VALIDO;
  return stato.isError && rispostaDatoNonValido(stato.error) ? CODICE_NON_VALIDO : undefined;
}

export function DetermineDellaDomanda({ codice: parametro }: { codice: string | undefined }) {
  const codice = codiceDalPercorso(parametro);
  const stato = useDetermine(codice.stato === 'valido' ? codice.codice : null);
  const auth = useAuthStatus();
  const titolo = codice.stato === 'valido' ? titoloDetermine(codice.codice) : TITOLO_PAGINA;
  const h1 = useFocusTitolo<HTMLHeadingElement>(`${titolo} - Procedurale`);
  const d = codice.stato === 'valido' ? stato.data : undefined;
  const conGrantScheda = puoLeggere(auth.data, 'schedaDomanda');
  const scheda = d ? percorsoSchedaDellaDomanda(d, conGrantScheda) : null;
  const partenza = useTipoDiPartenza(codice, improntaIdentita(auth.data));
  const campo = useRef<HTMLInputElement>(null);
  const ingresso = useIngressoArea({});
  const briciole = [
    { etichetta: 'Procedurale', a: ingresso === percorsoDetermine() ? undefined : ingresso },
    { etichetta: TITOLO_PAGINA, a: codice.stato === 'assente' ? undefined : percorsoDetermine() },
    ...(codice.stato === 'valido' ? [{ etichetta: `Domanda ${codice.codice}` }] : []),
  ];
  return (
    <main className="ui-pagina" id="contenuto">
      <Briciole voci={briciole} />
      <Sezione titolo="Cerca le determine di una domanda">
        {/* il modulo riparte dal codice dell'indirizzo a ogni cambio di route */}
        <CercaDomanda key={parametro ?? ''} idCampo={ID_CAMPO} campo={campo} codiceIniziale={parametro ?? ''} erroreEsterno={erroreDelCampo(codice, stato)} onCerca={partenza.azzera} />
      </Sezione>
      <DomandaDellAltroTipo arrivo={partenza.arrivo} d={d} conGrantScheda={conGrantScheda} />
      <Testata h1={h1} titolo={titolo} d={d} scheda={scheda} />
      <AvvisoPagina azioni={<CercaUnAltroCodice campo={campo} />}>
        <Corpo codice={codice} stato={stato} campo={campo} />
      </AvvisoPagina>
    </main>
  );
}
