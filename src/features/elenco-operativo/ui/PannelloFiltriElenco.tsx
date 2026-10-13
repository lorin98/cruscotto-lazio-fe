// PannelloFiltriElenco — pannello laterale dei filtri dell'interrogazione (wireframe domande e pagamenti, ADR 0029): ogni
// scelta cambia subito l'indirizzo e quindi risultati, sinottico e totali (nessun "Applica"); il conteggio dal vivo e'
// annunciato con role="status". Valori dei filtri da TX-0060, solo quelli del perimetro del chiamante. PannelloLaterale
// (react-aria) da' focus trap, Esc e ritorno del focus; i controlli sono Bootstrap Italia (vedi controlli.tsx).
import { useId } from 'react';
import { ErroreVista, PannelloLaterale, VistaQuery } from '../../../shared/ui';
import { useValoriFiltri } from '../api';
import type { ValoriFiltriElenco } from '../api';
import { ETICHETTE_FILTRI } from '../lib/chip';
import { conFiltro, importoDaTesto, testoInviabile } from '../lib/criteri';
import type { Criteri, Elenco, NomeFiltro } from '../lib/criteri';
import { ETICHETTE_VALORI } from '../lib/formato';
import { CampoRitardato, Caselle, Gruppo, Scelte } from './controlli';
import type { Opzione } from './controlli';

const daCodici = (codici: readonly (string | number)[] | undefined, nome?: NomeFiltro): Opzione[] =>
  (codici ?? []).map((c) => ({ valore: String(c), etichetta: (nome && ETICHETTE_VALORI[nome]?.[String(c)]) ?? String(c) }));
const daVoci = (voci: ReadonlyArray<{ chiave?: string; codice?: string; descrizione?: string | null }> | undefined): Opzione[] =>
  (voci ?? [])
    .map((v) => ({ valore: v.chiave ?? v.codice ?? '', etichetta: v.descrizione ? `${v.chiave ?? v.codice} - ${v.descrizione}` : (v.chiave ?? v.codice ?? '') }))
    .filter((o) => o.valore !== '');
const fisse = (nome: NomeFiltro): Opzione[] => Object.entries(ETICHETTE_VALORI[nome] ?? {}).map(([valore, etichetta]) => ({ valore, etichetta }));
const booleano = (si: string, no?: string): Opzione[] => [{ valore: 'true', etichetta: si }, ...(no ? [{ valore: 'false', etichetta: no }] : [])];
const conSenza = (opzioni: Opzione[], chiave: string, etichetta: string): Opzione[] => [...opzioni, { valore: chiave, etichetta }];

const IMPORTI: ReadonlyArray<[string, NomeFiltro, NomeFiltro]> = [
  ['Importo richiesto (euro)', 'richiestoDa', 'richiestoA'],
  ['Importo ammesso (euro)', 'ammessoDa', 'ammessoA'],
  ['Importo pagato (euro)', 'pagatoDa', 'pagatoA'],
];

const importoValido = (s: string) => s.trim() === '' || importoDaTesto(s) !== null;

interface PropsContenuto {
  dati: ValoriFiltriElenco;
  criteri: Criteri;
  elenco: Elenco;
  applica: (c: Criteri) => void;
}

/** Accessori comuni dei gruppi: valori scelti, cambio di un filtro, conteggio dei valori scelti in piu' filtri. */
interface Scelta {
  id: string;
  dati: ValoriFiltriElenco;
  sel: (n: NomeFiltro) => string[];
  imposta: (n: NomeFiltro) => (v: string[]) => void;
  conta: (...nomi: NomeFiltro[]) => number;
}

function GruppoPagamenti({ id, dati, sel, imposta, conta }: Scelta) {
  return (
    <Gruppo titolo="Decreto ed esito" scelti={conta('decreto', 'esito')} aperto>
      <Scelte etichetta={ETICHETTE_FILTRI.esito} opzioni={fisse('esito')} scelti={sel('esito')} onCambia={imposta('esito')} />
      <Caselle id={`${id}-decreto`} etichetta={ETICHETTE_FILTRI.decreto} opzioni={daCodici(dati.decreti)} scelti={sel('decreto')} onCambia={imposta('decreto')} />
    </Gruppo>
  );
}

function GruppoProgramma({ id, dati, sel, imposta, conta }: Scelta) {
  return (
    <Gruppo titolo="Obiettivi e azioni portanti" scelti={conta('os', 'og', 'op', 'azione')}>
      <Scelte etichetta={ETICHETTE_FILTRI.os} opzioni={daVoci(dati.obiettiviSpecifici)} scelti={sel('os')} onCambia={imposta('os')} />
      <Scelte etichetta={ETICHETTE_FILTRI.og} opzioni={daCodici(dati.obiettiviGenerali)} scelti={sel('og')} onCambia={imposta('og')} />
      <Scelte etichetta={ETICHETTE_FILTRI.op} opzioni={daCodici(dati.obiettiviPolicy)} scelti={sel('op')} onCambia={imposta('op')} />
      {dati.legameAzioniDisponibile === false ? (
        <p className="ui-nota">{"Azioni portanti non disponibili finché nessun intervento è collegato a un'azione portante."}</p>
      ) : (
        <Caselle id={`${id}-az`} etichetta={ETICHETTE_FILTRI.azione} opzioni={daVoci(dati.azioniPortanti)} scelti={sel('azione')} onCambia={imposta('azione')} />
      )}
    </Gruppo>
  );
}

function GruppoDomanda({ dati, sel, imposta, conta, aperto }: Scelta & { aperto: boolean }) {
  return (
    <Gruppo titolo="Domanda" scelti={conta('tipo', 'presentata', 'sigc', 'annualita')} aperto={aperto}>
      <Scelte etichetta={ETICHETTE_FILTRI.tipo} opzioni={daCodici(dati.tipi, 'tipo')} scelti={sel('tipo')} onCambia={imposta('tipo')} />
      <Scelte etichetta={ETICHETTE_FILTRI.presentata} opzioni={booleano('Solo presentate')} scelti={sel('presentata')} esclusive onCambia={imposta('presentata')} />
      <Scelte etichetta={ETICHETTE_FILTRI.sigc} opzioni={booleano('Solo SIGC', 'Non SIGC')} scelti={sel('sigc')} esclusive onCambia={imposta('sigc')} />
      <Scelte etichetta={ETICHETTE_FILTRI.annualita} opzioni={fisse('annualita')} scelti={sel('annualita')} onCambia={imposta('annualita')} />
    </Gruppo>
  );
}

function GruppoStati({ id, dati, sel, imposta, conta }: Scelta) {
  return (
    <Gruppo titolo="Stati" scelti={conta('stato', 'statoProgrammazione', 'concessione', 'anomalie')}>
      <Caselle id={`${id}-stato`} etichetta={ETICHETTE_FILTRI.stato} opzioni={conSenza(daVoci(dati.stati), 'SENZA_STATO', 'Senza stato SIAN')} scelti={sel('stato')} onCambia={imposta('stato')} />
      <Caselle
        id={`${id}-prog`}
        etichetta={ETICHETTE_FILTRI.statoProgrammazione}
        opzioni={conSenza(daCodici(dati.statiProgrammazione), 'SENZA_STATO', 'Senza stato area programmazione')}
        scelti={sel('statoProgrammazione')}
        onCambia={imposta('statoProgrammazione')}
      />
      <Scelte etichetta={ETICHETTE_FILTRI.concessione} opzioni={booleano("Con l'atto di concessione", "Senza l'atto")} scelti={sel('concessione')} esclusive onCambia={imposta('concessione')} />
      <Scelte etichetta={ETICHETTE_FILTRI.anomalie} opzioni={booleano('Con anomalie', 'Senza anomalie')} scelti={sel('anomalie')} esclusive onCambia={imposta('anomalie')} />
    </Gruppo>
  );
}

function GruppoTerritorio({ id, dati, sel, imposta, conta }: Scelta) {
  return (
    <Gruppo titolo="Territorio" scelti={conta('provincia', 'ente')}>
      <Caselle id={`${id}-prov`} etichetta={ETICHETTE_FILTRI.provincia} opzioni={daCodici(dati.province)} scelti={sel('provincia')} onCambia={imposta('provincia')} />
      <Caselle id={`${id}-ente`} etichetta={ETICHETTE_FILTRI.ente} opzioni={daCodici(dati.enti)} scelti={sel('ente')} onCambia={imposta('ente')} />
    </Gruppo>
  );
}

function GruppoImporti({ id, sel, imposta, conta }: Scelta) {
  const scrivi = (n: NomeFiltro) => (s: string) => {
    const importo = importoDaTesto(s);
    imposta(n)(importo ? [importo] : []);
  };
  return (
    <Gruppo titolo="Importi e pagamento" scelti={conta('pagamento', 'richiestoDa', 'richiestoA', 'ammessoDa', 'ammessoA', 'pagatoDa', 'pagatoA')}>
      <Scelte etichetta={ETICHETTE_FILTRI.pagamento} opzioni={fisse('pagamento')} scelti={sel('pagamento')} onCambia={imposta('pagamento')} />
      {IMPORTI.map(([legenda, da, a]) => (
        <fieldset key={da}>
          <legend>{legenda}</legend>
          <div className="ui-intervallo">
            {[da, a].map((n) => (
              <CampoRitardato
                key={n}
                id={`${id}-${n}`}
                etichetta={n === da ? 'Da' : 'Fino a'}
                tipo="text"
                modo="decimal"
                errore="Scrivi un importo in euro, ad esempio 1.500,50."
                valore={(sel(n)[0] ?? '').replace('.', ',')}
                valido={importoValido}
                onCambia={scrivi(n)}
              />
            ))}
          </div>
        </fieldset>
      ))}
    </Gruppo>
  );
}

function Contenuto({ dati, criteri, elenco, applica }: PropsContenuto) {
  const id = useId();
  const sel = (n: NomeFiltro) => criteri[n] ?? [];
  const scelta: Scelta = {
    id,
    dati,
    sel,
    imposta: (n) => (v) => applica(conFiltro(criteri, n, v)),
    conta: (...nomi) => nomi.reduce((s, n) => s + sel(n).length, 0),
  };
  return (
    <>
      {elenco === 'pagamenti' && <GruppoPagamenti {...scelta} />}
      <Gruppo titolo={ETICHETTE_FILTRI.intervento} scelti={scelta.conta('intervento')} aperto={elenco === 'domande'}>
        <Caselle id={`${id}-int`} etichetta={ETICHETTE_FILTRI.intervento} opzioni={daVoci(dati.interventi)} scelti={sel('intervento')} onCambia={scelta.imposta('intervento')} />
      </Gruppo>
      <GruppoProgramma {...scelta} />
      <GruppoDomanda {...scelta} aperto={elenco === 'domande'} />
      <Gruppo titolo={ETICHETTE_FILTRI.anno} scelti={scelta.conta('anno')}>
        <Scelte etichetta={ETICHETTE_FILTRI.anno} opzioni={conSenza(daCodici(dati.anni), 'SENZA', 'Senza anno')} scelti={sel('anno')} onCambia={scelta.imposta('anno')} />
      </Gruppo>
      <GruppoStati {...scelta} />
      <GruppoTerritorio {...scelta} />
      <GruppoImporti {...scelta} />
      <p className="ui-nota">Si applica mentre scegli. Valori dello stesso filtro in alternativa (O); filtri diversi insieme (E).</p>
    </>
  );
}

/** Ricerca libera fuori dai valori di TX-0060: resta disponibile anche se i valori dei filtri non arrivano. */
function CampoTesto({ criteri, applica }: { criteri: Criteri; applica: (c: Criteri) => void }) {
  const id = useId();
  return (
    <CampoRitardato
      id={`${id}-testo`}
      etichetta="Cerca per codice a barre, CUAA o denominazione"
      aiuto="Almeno 3 caratteri: il codice a barre e il CUAA che iniziano così, la denominazione che lo contiene."
      errore="Scrivi da 3 a 100 caratteri."
      valore={criteri.testo?.[0] ?? ''}
      valido={testoInviabile}
      onCambia={(s) => applica(conFiltro(criteri, 'testo', [s]))}
    />
  );
}

export function PannelloFiltriElenco({
  aperto,
  onChiudi,
  elenco,
  criteri,
  applica,
  conteggio,
  onAzzera,
}: {
  aperto: boolean;
  onChiudi: () => void;
  elenco: Elenco;
  criteri: Criteri;
  applica: (c: Criteri) => void;
  /** Conteggio dal vivo dell'insieme filtrato (dal server), gia' in parole: "1.284 domande con questi filtri". */
  conteggio: string;
  onAzzera: () => void;
}) {
  const stato = useValoriFiltri();
  return (
    <PannelloLaterale
      aperto={aperto}
      onChiudi={onChiudi}
      titolo="Filtri"
      descrizione="Restano nell'indirizzo della pagina: la ricerca si può condividere."
      azioni={
        <>
          <button type="button" className="btn btn-outline-primary" onClick={onAzzera}>
            Azzera
          </button>
          <button type="button" className="btn btn-primary" onClick={onChiudi}>
            Mostra i risultati
          </button>
        </>
      }
    >
      <p className="ui-conteggio" role="status" aria-live="polite">
        {conteggio}
      </p>
      <CampoTesto criteri={criteri} applica={applica} />
      <VistaQuery
        stato={stato}
        errorePersonalizzato={(e) => <ErroreVista errore={e} contesto="Valori dei filtri non disponibili: resta la ricerca per testo." onRiprova={() => void stato.refetch()} />}
      >
        {(dati) => <Contenuto dati={dati} criteri={criteri} elenco={elenco} applica={applica} />}
      </VistaQuery>
    </PannelloLaterale>
  );
}
