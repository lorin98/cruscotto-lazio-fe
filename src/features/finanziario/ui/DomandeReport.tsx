// DomandeReport — pattern DS "report" (route /finanziario/domande, TX-0008..TX-0010/RF008-RF010, wireframe domande v2):
// quattro KPI (domande presentate e di prima annualita' TX-0009, con i loro file; importo ammesso, somma degli anni, e
// importo stanziato TX-0010), domande per anno di raccolta (barre impilate; clic su un anno, o la scelta da tastiera sopra la tabella:
// la tabella di dettaglio mostra quell'anno) e
// importi per anno (linee + tabella). Anno di raccolta = campagna, altrimenti anno di rilascio della domanda di sostegno
// (D-09 del backend); le domande senza nessuno dei due sono la riga "senza anno di raccolta". Ogni sezione ha il suo
// grant e il suo perimetro. L'importo decretato viene dagli elenchi di liquidazione: e' la colonna del decretato, non
// quella del pagato dei pagamenti totali di RF005 (OP-FE-05).
import { useId } from 'react';
import { formatNumber, importoBreve } from '../../../shared/lib';
import { CardGrafico, Griglia, Kpi, PulsantiScarica, Sezione, TabellaRighe, VistaQuery } from '../../../shared/ui';
import type { ClicGrafico, Colonna } from '../../../shared/ui';
import { useDomandePerAnno, useImportiPerAnno, useTotaleDomande } from '../api';
import type { DomandePerAnno, DomandePerAnnoRiga, ImportiPerAnno, ImportiPerAnnoRiga } from '../api';
import { datiDelReport } from './esportazioni';
import { kpiImportiPerAnno } from '../lib/aggregati';
import { ricercaDaFiltri } from '../lib/filtri';
import type { Filtri } from '../lib/filtri';
import { annoDiRaccolta, numeroOpzionale } from '../lib/formato';
import { cellaImporto, perAnno } from '../lib/importi';
import { graficoDomandePerAnno, graficoImportiPerAnno } from '../lib/grafici';
import { GRANT } from '../lib/report';
import { ConGrant, KpiImporto, Numero, PerimetroSezione, ScaricaKpi, colonnaImporto, erroreGiaMostrato, vuotoConPerimetro } from './comuni';
import { ApriNellElenco, useLinkElenco } from './LinkElenco';
import { colonneDomandePerAnno } from './colonneAnno';
import { useStatoNellaHistory } from './useStatoNellaHistory';
import { criteriAnnoAnnualita } from '../lib/link-elenco';
import type { CriteriLink, IdLinkElenco } from '../lib/link-elenco';

const TITOLI = {
  totale: 'Totale domande presentate (RF009)',
  perAnno: 'Domande per anno di raccolta (RF008)',
  importi: 'Importi per anno di raccolta (RF010)',
};
const VUOTO = vuotoConPerimetro('Nessuna domanda per i filtri scelti.');
const DECRETATO = 'Importo decretato (elenchi di liquidazione)';

// ---------------------------------------------------------------- KPI

function KpiTotali({ filtri }: { filtri: Filtri }) {
  const link = useLinkElenco(filtri);
  return (
    <VistaQuery stato={useTotaleDomande(filtri)}>
      {(d) => (
        <>
          <Kpi
            etichetta="Domande presentate"
            icona="it-files"
            tono="ambra"
            valore={formatNumber(d.presentate)}
            nota={`${TITOLI.totale} · Perimetro ${d.perimetro ?? 'non indicato'}`}
            azione={<ApriNellElenco indirizzo={link('elenco-presentate-domande', { presentata: true })} descrizione="le domande presentate" />}
          />
          <Kpi
            etichetta="di cui prima annualità"
            icona="it-calendar"
            tono="blu"
            valore={formatNumber(d.primaAnnualita)}
            azione={<ApriNellElenco indirizzo={link('elenco-prima-annualita', { presentata: true, annualita: ['PRIMA'] })} descrizione="le domande di prima annualità" />}
          />
        </>
      )}
    </VistaQuery>
  );
}

/**
 * Importo ammesso e stanziato di tutti gli anni (lib/aggregati, kpiImportiPerAnno): la somma solo se ogni anno e'
 * valorizzato, in milioni come gli altri KPI; lo stanziato, oggi da fonte non attiva, si dichiara con il suo motivo.
 */
function KpiAmmessoEStanziato({ d }: { d: ImportiPerAnno }) {
  const { ammesso, stanziato } = kpiImportiPerAnno(d.righe ?? []);
  return (
    <>
      <Kpi etichetta="Importo ammesso" icona="it-card" tono="verde" valore={ammesso.valore === null ? undefined : importoBreve(ammesso.valore)} assente={ammesso.motivo} nota={ammesso.nota} />
      {stanziato.valore === null ? (
        <KpiImporto etichetta="Importo stanziato" importo={stanziato.importo} icona="it-presentation" tono="scuro" />
      ) : (
        <Kpi etichetta="Importo stanziato" icona="it-presentation" tono="scuro" valore={importoBreve(stanziato.valore)} nota={stanziato.nota} />
      )}
    </>
  );
}

function KpiImporti({ filtri }: { filtri: Filtri }) {
  return (
    // senza anni le tessere non compaiono: lo stato vuoto lo dice la sezione degli importi
    <VistaQuery stato={useImportiPerAnno(filtri)} errorePersonalizzato={erroreGiaMostrato}>
      {(d) => ((d.righe ?? []).length === 0 ? null : <KpiAmmessoEStanziato d={d} />)}
    </VistaQuery>
  );
}

// ---------------------------------------------------------------- domande per anno

type LinkDelReport = (id: IdLinkElenco, criteri?: CriteriLink) => string | null;

/** Ogni cella (anno per annualita', e il totale dell'anno) apre l'elenco con quell'anno e quell'annualita' (wireframe domande). */
function colonneAnno(link: LinkDelReport): Colonna<DomandePerAnnoRiga>[] {
  return colonneDomandePerAnno((r, annualita) => link('elenco-anno-annualita', criteriAnnoAnnualita(r.annoRaccolta, annualita)));
}

/** Cosa sono l'anno di raccolta e le non classificate (D-09 del backend), accanto alla tabella che le mostra. */
function NotaAnnualita() {
  return (
    <p className="small mb-0">
      {
        "Anno di raccolta: la campagna della domanda, altrimenti l'anno di rilascio della domanda di sostegno. Non classificate: le domande di sostegno NO SIGC, per cui prima e altre annualità non si applicano, e quelle delle campagne senza dati di annualità."
      }
    </p>
  );
}

/** Scelta dell'anno del dettaglio, anche da tastiera (N-14): togliere la scelta non sposta il focus fuori dal controllo. */
function SceltaAnno({ id, anni, anno, onCambia }: { id: string; anni: string[]; anno: string | null; onCambia: (anno: string | null) => void }) {
  return (
    <span className="d-inline-flex align-items-center gap-2">
      <label htmlFor={id} className="small mb-0">
        Anno di raccolta
      </label>
      <select id={id} className="form-select form-select-sm w-auto" value={anno ?? ''} onChange={(e) => onCambia(e.target.value || null)}>
        <option value="">Tutti gli anni</option>
        {anni.map((a) => (
          <option key={a} value={a}>
            {a}
          </option>
        ))}
      </select>
    </span>
  );
}

const SOTTOTITOLO_PER_ANNO = "Prima annualità, altre annualità e non classificate. Clic su un anno (o scelta sopra la tabella): la tabella mostra quell'anno.";
const ELENCO_DALLE_CELLE = " Dalle celle della vista Tabella e della tabella di dettaglio si apre l'elenco operativo.";

/** Il grafico (RF008) con la sua tabella equivalente: con il grant dell'elenco, "Apri nell'elenco" su ogni cella. */
function CardDomandePerAnno({ d, filtri, link, onAnno }: { d: DomandePerAnno; filtri: Filtri; link: LinkDelReport; onAnno: (anno: string | null) => void }) {
  const righe = d.righe ?? [];
  const anni = righe.map((r) => annoDiRaccolta(r.annoRaccolta));
  const conLink = link('elenco-anno-annualita', { presentata: true }) !== null;
  return (
    <CardGrafico
      titolo={TITOLI.perAnno}
      sottotitolo={SOTTOTITOLO_PER_ANNO + (conLink ? ELENCO_DALLE_CELLE : '')}
      dati={graficoDomandePerAnno(righe)}
      fonte={`Fonte: TX-0008 · Perimetro ${d.perimetro ?? 'non indicato'}`}
      onClic={(p: ClicGrafico) => onAnno(p.name && anni.includes(p.name) ? p.name : null)}
      scaricamenti={datiDelReport(TITOLI.perAnno, 'domandePerAnno', filtri)}
      tabella={
        // la tabella equivalente con "Apri nell'elenco" su ogni cella (wireframe domande, link:elenco-anno-annualita)
        conLink ? <TabellaRighe caption="Domande per anno di raccolta" intestazione="Anno di raccolta" chiave={(r) => annoDiRaccolta(r.annoRaccolta)} colonne={colonneAnno(link)} righe={perAnno(righe)} /> : undefined
      }
    />
  );
}

/** La tabella di dettaglio per anno, con la scelta dell'anno e i file (che contengono sempre tutti gli anni). */
function DettaglioPerAnno({ d, filtri, link, anno, onAnno }: { d: DomandePerAnno; filtri: Filtri; link: LinkDelReport; anno: string | null; onAnno: (anno: string | null) => void }) {
  const id = useId();
  const anni = (d.righe ?? []).map((r) => annoDiRaccolta(r.annoRaccolta));
  const righe = (d.righe ?? []).filter((r) => anno === null || annoDiRaccolta(r.annoRaccolta) === anno);
  return (
    <Sezione
      titolo="Domande per anno: dettaglio"
      strumenti={
        <>
          <SceltaAnno id={`${id}-anno`} anni={anni} anno={anno} onCambia={onAnno} />
          <PulsantiScarica
            oggetto={anno === null ? 'la tabella Domande per anno' : `la tabella Domande per anno (tutti gli anni, non solo il ${anno})`}
            scaricamenti={datiDelReport('Domande per anno', 'domandePerAnno', filtri)}
          />
        </>
      }
    >
      {/* il backend non filtra per anno: il file ha sempre tutti gli anni (review v3 X-04) */}
      {anno !== null && <p className="ui-nota">{`I file CSV e XLSX contengono tutti gli anni di raccolta, non solo il ${anno}.`}</p>}
      <TabellaRighe caption="Domande per anno di raccolta" intestazione="Anno di raccolta" chiave={(r) => annoDiRaccolta(r.annoRaccolta)} colonne={colonneAnno(link)} righe={righe} />
      <NotaAnnualita />
    </Sezione>
  );
}

function DomandePerAnnoSezione({ filtri }: { filtri: Filtri }) {
  const stato = useDomandePerAnno(filtri);
  const link = useLinkElenco(filtri);
  // clic su un anno del grafico, o la scelta sopra la tabella: il dettaglio mostra solo quell'anno (wireframe domande).
  // L'anno sta nello state della history con i filtri: tornando indietro dall'elenco operativo si ritrova; con filtri
  // nuovi decade (una selezione nuova e' un dettaglio nuovo, N-01).
  const [annoSalvato, setAnno] = useStatoNellaHistory<string | null>('domandePerAnno', filtri);
  return (
    <VistaQuery stato={stato} eVuoto={(d) => (d.righe ?? []).length === 0} vuoto={VUOTO}>
      {(d) => {
        // un anno che non c'e' piu' fra i dati vale "tutti gli anni"
        const anni = (d.righe ?? []).map((r) => annoDiRaccolta(r.annoRaccolta));
        const anno = annoSalvato != null && anni.includes(annoSalvato) ? annoSalvato : null;
        return (
          <div>
            <CardDomandePerAnno d={d} filtri={filtri} link={link} onAnno={setAnno} />
            <DettaglioPerAnno d={d} filtri={filtri} link={link} anno={anno} onAnno={setAnno} />
          </div>
        );
      }}
    </VistaQuery>
  );
}

// ---------------------------------------------------------------- importi per anno

const COLONNE_IMPORTI: Colonna<ImportiPerAnnoRiga>[] = [
  colonnaImporto<ImportiPerAnnoRiga>('Importo stanziato', (r) => r.importoStanziato),
  colonnaImporto<ImportiPerAnnoRiga>('Importo ammesso', (r) => r.importoAmmesso),
  colonnaImporto<ImportiPerAnnoRiga>(DECRETATO, (r) => r.importoDecretato),
  ['Domande senza importo ammesso', (r) => <Numero valore={r.domandeSenzaAmmesso} />],
];

/** Colonna "Elenco operativo": per ogni riga (anno) le domande presentate dell'anno (stanziato e decretato non ci sono). */
function colonnaElenco(link: LinkDelReport): Colonna<ImportiPerAnnoRiga> {
  return [
    'Elenco operativo',
    (r) => (
      <ApriNellElenco
        indirizzo={link('elenco-anno', { presentata: true, anno: [r.annoRaccolta ?? null] })}
        descrizione={`le domande presentate ${r.annoRaccolta == null ? 'senza anno di raccolta' : `del ${r.annoRaccolta}`}`}
      />
    ),
  ];
}

/** Con il grant dell'elenco, la colonna "Elenco operativo" in fondo alla tabella di dettaglio. */
function colonneImporti(link: LinkDelReport): Colonna<ImportiPerAnnoRiga>[] {
  return link('elenco-anno', { presentata: true }) === null ? COLONNE_IMPORTI : [...COLONNE_IMPORTI, colonnaElenco(link)];
}

/**
 * La tabella equivalente del grafico Importi per anno con la colonna "Elenco operativo" (wireframe domande, link:elenco-anno):
 * stesse intestazioni e celle della tabella generata da graficoImportiPerAnno, piu' la colonna del link.
 */
function colonneImportiEquivalente(link: LinkDelReport): Colonna<ImportiPerAnnoRiga>[] {
  return [
    ['Stanziato', (r) => cellaImporto(r.importoStanziato, true)],
    ['Ammesso', (r) => cellaImporto(r.importoAmmesso)],
    ['Decretato', (r) => cellaImporto(r.importoDecretato, true)],
    ['Domande senza importo ammesso', (r) => numeroOpzionale(r.domandeSenzaAmmesso)],
    colonnaElenco(link),
  ];
}

function ImportiPerAnnoSezione({ filtri }: { filtri: Filtri }) {
  const stato = useImportiPerAnno(filtri);
  const link = useLinkElenco(filtri);
  return (
    <VistaQuery stato={stato} eVuoto={(d) => (d.righe ?? []).length === 0} vuoto={VUOTO}>
      {(d) => (
        <div>
          <CardGrafico
            titolo={TITOLI.importi}
            sottotitolo="Importo ammesso e decretato; trascina per ingrandire"
            dati={graficoImportiPerAnno(d.righe ?? [])}
            fonte={`Fonte: TX-0010 · ${DECRETATO}`}
            scaricamenti={datiDelReport(TITOLI.importi, 'importiPerAnno', filtri)}
            tabella={
              link('elenco-anno', { presentata: true }) !== null ? (
                <TabellaRighe caption="Importi per anno di raccolta: stanziato, ammesso e decretato" intestazione="Anno" chiave={(r) => annoDiRaccolta(r.annoRaccolta)} colonne={colonneImportiEquivalente(link)} righe={perAnno(d.righe ?? [])} />
              ) : undefined
            }
          />
          <Sezione titolo="Importi per anno: dettaglio" strumenti={<PulsantiScarica oggetto="la tabella Importi per anno" scaricamenti={datiDelReport('Importi per anno', 'importiPerAnno', filtri)} />}>
            <PerimetroSezione perimetro={d.perimetro} />
            <TabellaRighe caption="Importi per anno di raccolta" intestazione="Anno di raccolta" chiave={(r) => annoDiRaccolta(r.annoRaccolta)} colonne={colonneImporti(link)} righe={d.righe ?? []} />
          </Sezione>
        </div>
      )}
    </VistaQuery>
  );
}

export function DomandeReport({ filtri }: { filtri: Filtri }) {
  return (
    <>
      <ScaricaKpi grant={GRANT.totaleDomande} titolo={TITOLI.totale} report="totaleDomande" filtri={filtri} />
      <Griglia colonne={4}>
        <ConGrant grant={GRANT.totaleDomande} titolo={TITOLI.totale}>
          <KpiTotali filtri={filtri} />
        </ConGrant>
        <ConGrant grant={GRANT.importiPerAnno} titolo="Importi ammesso e stanziato">
          <KpiImporti filtri={filtri} />
        </ConGrant>
      </Griglia>
      <Griglia>
        <ConGrant grant={GRANT.domandePerAnno} titolo={TITOLI.perAnno}>
          {/* una selezione nuova e' un dettaglio nuovo: l'anno scelto prima non resta (N-01) */}
          <DomandePerAnnoSezione key={ricercaDaFiltri(filtri)} filtri={filtri} />
        </ConGrant>
        <ConGrant grant={GRANT.importiPerAnno} titolo={TITOLI.importi}>
          <ImportiPerAnnoSezione filtri={filtri} />
        </ConGrant>
      </Griglia>
    </>
  );
}
