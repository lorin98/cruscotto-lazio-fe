// DettaglioIntervento — pagina /istituzionale/interventi/:codice (flusso intervento approvato, dettaglio v2, RF016):
// compone TX-0016 filtrata sull'intervento della route (nessuna transazione nuova). Dal riallineamento degli ambiti del
// 29/10/2026 l'output regionale (TX-0017: scheda Output per anno, scheda Importi unitari, KPI del target, pulsante verso il
// report) e' del fisico; la scheda della verifica SMP SIGC (TX-0015) e' dei passi successivi. Il codice del percorso si
// convalida prima di leggere: un valore fuori formato (anche con '/') non manda richieste e la pagina lo dice. Barra dei
// riferimenti (perimetro regionale e "Dati al" della risposta), percorso, testata con un solo h1 (la descrizione
// dell'intervento da TX-0060, se no "Intervento <codice>"; focus a ogni cambio di route), badge in testo e il pulsante
// verso la verifica filtrata sull'intervento (solo col grant della destinazione), tre KPI, le schede. La lettura parte
// solo col grant della sua transazione; l'anno di riferimento sta nell'indirizzo (?anno=). Stati: caricamento
// (scheletro, alla prima apertura), errore (un solo avviso della pagina, problem-type, Riprova: la lettura vi registra il
// suo errore una volta), intervento senza dati (es. AT001) con il ritorno al report. La scheda attiva e' stato della
// pagina: resta mentre la lettura riparte (Riprova, un altro anno).
// Design system: classi bootstrap-italia e del kit v2 (hero, badge, KPI); react-aria solo nelle schede (tablist) e nel
// popover della pill.
import { Link } from 'react-router';
import { useState } from 'react';
import type { Ref } from 'react';
import { ID_TITOLO_INTERVENTO, InterventoNonValido, codiceDelPercorso, descrizioneIntervento, rigaDellIntervento } from '../../../entities/filtri';
import { useAuthStatus } from '../../../shared/api/auth/use-auth-status';
import type { StatoDettaglio } from '../../../shared/lib';
import { AvvisoPagina, Briciole, ContestoIntestazione, CorpoDelDettaglio, ErroriDelleLetture, Griglia, Kpi, PillDatiAl, TestataDettaglio, Vuoto, useAnnoNellIndirizzo, useFocusTitolo, useRigheContesto, useStatoDelDettaglio } from '../../../shared/ui';
import type { NomeIcona, TonoKpi } from '../../../shared/ui';
import { useValoriFiltri, useVerificaSmpNonSigc } from '../api';
import { verificaDellIntervento } from '../lib/collegamenti';
import { PARAMETRO_ANNO, criteriVerifica, soloIntervento, testiCriteri } from '../lib/criteri';
import type { RigaVerifica } from '../lib/dto';
import { PERIMETRO_IN_PAROLE, PILL_PERIMETRO } from '../lib/formato';
import { puoLeggere } from '../lib/grant';
import { SENZA_DATI, badgeIntervento, kpiIntervento, sopratitoloIntervento, titoloIntervento, ultimiDelDettaglio, ultimoDatoInErrore } from '../lib/intervento';
import type { ChiaveKpi, IdScheda } from '../lib/intervento';
import { PERCORSI } from '../lib/pagine';
import { useIngressoArea } from './navigazione';
import { SchedeIntervento } from './SchedeIntervento';
import type { PropsSchede } from './SchedeIntervento';

/** Le letture del dettaglio, ognuna solo col grant della sua transazione (null senza: la scheda non c'e'). */
function useLettureDelDettaglio(codice: string, anno: number | undefined) {
  const auth = useAuthStatus().data;
  const conVerifica = puoLeggere(auth, 'verifica');
  // al cambio d'anno restano i dati di prima: la scheda col selettore resta montata (focus su "Mostra")
  const verifica = useVerificaSmpNonSigc(criteriVerifica(soloIntervento(codice), anno), { abilitato: conVerifica, mantieniDati: true });
  const valori = useValoriFiltri(puoLeggere(auth, 'filtri'));
  return { verifica: conVerifica ? verifica : null, descrizione: descrizioneIntervento(valori.data?.interventi, codice) };
}

/** Il codice dell'indirizzo non e' un codice di intervento: nessuna richiesta, lo dice la pagina (InterventoNonValido dell'entity). */
function CodiceNonValido() {
  return <InterventoNonValido area="Istituzionale" ingresso={useIngressoArea()} suggerimento="Scegli l'intervento dalla verifica SMP non SIGC." titoloDocumento="Intervento non valido - Istituzionale" />;
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

/** La testata: sopratitolo, h1, badge in testo e il pulsante verso la verifica filtrata (link dello uiplan). */
function TestataIntervento({ h1, codice, titolo, badge, anno }: { h1: Ref<HTMLHeadingElement>; codice: string; titolo: string; badge: string[]; anno: number | undefined }) {
  const auth = useAuthStatus().data;
  const azioni = puoLeggere(auth, 'verifica') && (
    <Link className="btn btn-light btn-sm" to={verificaDellIntervento(codice, anno)}>
      Verifica SMP non SIGC filtrata su questo intervento
    </Link>
  );
  return <TestataDettaglio idTitolo={ID_TITOLO_INTERVENTO} titolo={titolo} h1={h1} sopratitolo={sopratitoloIntervento(codice)} badge={badge} azioni={azioni} />;
}

const ASPETTO_KPI: Record<ChiaveKpi, { icona: NomeIcona; tono: TonoKpi }> = {
  ricevute: { icona: 'it-files', tono: 'blu' },
  finanziate: { icona: 'it-check-circle', tono: 'verde' },
  spesa: { icona: 'it-card', tono: 'ambra' },
};

/** I KPI del dettaglio (lib/intervento): quelli della lettura fatta, nessuna quota calcolata. */
function KpiDettaglio({ verifica }: { verifica: RigaVerifica | undefined }) {
  const kpi = kpiIntervento(verifica);
  if (kpi.length === 0) return null;
  return (
    <Griglia colonne={4}>
      {kpi.map((k) => (
        <Kpi key={k.chiave} etichetta={k.etichetta} valore={k.valore} assente={k.assente} nota={k.nota} {...ASPETTO_KPI[k.chiave]} />
      ))}
    </Griglia>
  );
}

/** Intervento senza righe nel report letto: lo stato col ritorno alla verifica SMP non SIGC. */
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

/** I KPI della riga dell'intervento e le schede. */
function DatiDelDettaglio({ codice, verifica, ...schede }: PropsSchede) {
  return (
    <>
      <KpiDettaglio verifica={rigaDellIntervento(verifica?.data?.righe, codice)} />
      <SchedeIntervento {...schede} codice={codice} verifica={verifica} />
    </>
  );
}

/** Il corpo secondo lo stato delle letture (CorpoDelDettaglio del kit): scheletro, errore, senza dati, KPI e schede. */
function CorpoDettaglio({ stato, ...props }: PropsSchede & { stato: StatoDettaglio }) {
  return (
    <CorpoDelDettaglio stato={stato} vuoto={<SenzaDati />}>
      <DatiDelDettaglio {...props} />
    </CorpoDelDettaglio>
  );
}

function Dettaglio({ codice }: { codice: string }) {
  const [anno, impostaAnno] = useAnnoNellIndirizzo(PARAMETRO_ANNO);
  const [scheda, setScheda] = useState<IdScheda | null>(null);
  const { verifica, descrizione } = useLettureDelDettaglio(codice, anno);
  const letture = [verifica].filter((s) => s !== null);
  const stato = useStatoDelDettaglio(letture);
  // il titolo del documento dal codice, come nel wireframe approvato (review V8): la descrizione che arriva dopo non
  // riporta il focus sull'h1
  const h1 = useFocusTitolo<HTMLHeadingElement>(`Intervento ${codice} - Istituzionale`);
  const ultimi = ultimiDelDettaglio(verifica?.data);
  // l'intestazione dei file e dei PNG coi criteri dell'intervento (review A1, NFR-50): la pagina non ha grafici, la scheda
  // della verifica scarica i file del backend
  const contesto = useRigheContesto(testiCriteri(soloIntervento(codice)), ultimi, PERIMETRO_IN_PAROLE);
  const badge = badgeIntervento(rigaDellIntervento(verifica?.data?.righe, codice));
  return (
    <ContestoIntestazione.Provider value={contesto}>
      <BarraRiferimenti ultimi={ultimi} inErrore={ultimoDatoInErrore(letture)} />
      <main className="ui-pagina" id="contenuto">
        <Briciole voci={[{ etichetta: 'Istituzionale', a: useIngressoArea() }, { etichetta: codice }]} />
        <TestataIntervento h1={h1} codice={codice} titolo={titoloIntervento(codice, descrizione)} badge={badge} anno={anno} />
        <AvvisoPagina>
          {/* l'errore di ogni lettura lo registra l'avviso della pagina, una volta (review H1): le schede il testo statico */}
          <ErroriDelleLetture letture={[verifica]} />
          <CorpoDettaglio stato={stato} codice={codice} anno={anno} onAnno={impostaAnno} verifica={verifica} scheda={scheda} onScheda={setScheda} />
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
