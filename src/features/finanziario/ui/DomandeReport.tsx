// DomandeReport — pattern DS "report" (route /finanziario/domande, TX-0008..TX-0010/RF008-RF010, wireframe domande v2):
// quattro KPI (domande presentate e di prima annualita' TX-0009; importo ammesso, somma degli anni, e importo stanziato
// TX-0010), domande per anno di raccolta (barre impilate; clic su un anno, o la scelta da tastiera sopra la tabella:
// la tabella di dettaglio mostra quell'anno) e
// importi per anno (linee + tabella). Le domande senza campagna sono la riga "senza campagna". Ogni sezione ha il suo
// grant e il suo perimetro. L'importo decretato e' quello degli elenchi di liquidazione, la stessa fonte dei pagamenti
// totali di RF005 (OP-FE-05).
import { useId, useState } from 'react';
import { formatNumber, importoKpi } from '../../../shared/lib';
import { CardGrafico, Griglia, Kpi, PulsantiScarica, Sezione, TabellaRighe, VistaQuery } from '../../../shared/ui';
import type { ClicGrafico, Colonna } from '../../../shared/ui';
import { useDomandePerAnno, useImportiPerAnno, useTotaleDomande } from '../api';
import type { DomandePerAnnoRiga, ImportiPerAnno, ImportiPerAnnoRiga } from '../api';
import { datiDelReport } from './esportazioni';
import { kpiImportiPerAnno } from '../lib/aggregati';
import { ricercaDaFiltri } from '../lib/filtri';
import type { Filtri } from '../lib/filtri';
import { annoDiRaccolta } from '../lib/formato';
import { graficoDomandePerAnno, graficoImportiPerAnno } from '../lib/grafici';
import { GRANT } from '../lib/report';
import { ConGrant, KpiImporto, Numero, PerimetroSezione, colonnaImporto, erroreGiaMostrato, vuotoConPerimetro } from './comuni';

const TITOLI = {
  totale: 'Totale domande presentate (RF009)',
  perAnno: 'Domande per anno di raccolta (RF008)',
  importi: 'Importi per anno di raccolta (RF010)',
};
const VUOTO = vuotoConPerimetro('Nessuna domanda per i filtri scelti.');
const DECRETATO = 'Importo decretato (elenchi di liquidazione, come i pagamenti totali di RF005)';

// ---------------------------------------------------------------- KPI

function KpiTotali({ filtri }: { filtri: Filtri }) {
  return (
    <VistaQuery stato={useTotaleDomande(filtri)}>
      {(d) => (
        <>
          <Kpi etichetta="Domande presentate" icona="it-files" tono="ambra" valore={formatNumber(d.presentate)} nota={`${TITOLI.totale} · Perimetro ${d.perimetro ?? 'non indicato'}`} />
          <Kpi etichetta="di cui prima annualità" icona="it-calendar" tono="blu" valore={formatNumber(d.primaAnnualita)} />
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
      <Kpi etichetta="Importo ammesso" icona="it-card" tono="verde" valore={ammesso.valore === null ? undefined : importoKpi(ammesso.valore)} assente={ammesso.motivo} nota={ammesso.nota} />
      {stanziato.valore === null ? (
        <KpiImporto etichetta="Importo stanziato" importo={stanziato.importo} icona="it-presentation" tono="scuro" />
      ) : (
        <Kpi etichetta="Importo stanziato" icona="it-presentation" tono="scuro" valore={importoKpi(stanziato.valore)} nota={stanziato.nota} />
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

const COLONNE_ANNO: Colonna<DomandePerAnnoRiga>[] = [
  ['Prima annualità', (r) => <Numero valore={r.primaAnnualita} />],
  ['Altre annualità', (r) => <Numero valore={r.altreAnnualita} />],
  ['Non classificate', (r) => <Numero valore={r.nonClassificate} />],
  ['Totale', (r) => <Numero valore={r.totali} />],
];

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

function DomandePerAnno({ filtri }: { filtri: Filtri }) {
  const stato = useDomandePerAnno(filtri);
  const id = useId();
  // clic su un anno del grafico, o la scelta sopra la tabella: il dettaglio mostra solo quell'anno (wireframe domande)
  const [anno, setAnno] = useState<string | null>(null);
  return (
    <VistaQuery stato={stato} eVuoto={(d) => (d.righe ?? []).length === 0} vuoto={VUOTO}>
      {(d) => {
        const anni = (d.righe ?? []).map((r) => annoDiRaccolta(r.annoRaccolta));
        const righe = (d.righe ?? []).filter((r) => anno === null || annoDiRaccolta(r.annoRaccolta) === anno);
        return (
          <div>
            <CardGrafico
              titolo={TITOLI.perAnno}
              sottotitolo="Prima annualità, altre annualità e non classificate. Clic su un anno (o scelta sopra la tabella): la tabella mostra quell'anno."
              dati={graficoDomandePerAnno(d.righe ?? [])}
              fonte={`Fonte: TX-0008 · Perimetro ${d.perimetro ?? 'non indicato'}`}
              onClic={(p: ClicGrafico) => setAnno(p.name && anni.includes(p.name) ? p.name : null)}
              scaricamenti={datiDelReport(TITOLI.perAnno, 'domandePerAnno', filtri)}
            />
            <Sezione
              titolo="Domande per anno: dettaglio"
              strumenti={
                <>
                  <SceltaAnno id={`${id}-anno`} anni={anni} anno={anno} onCambia={setAnno} />
                  <PulsantiScarica oggetto="la tabella Domande per anno" scaricamenti={datiDelReport('Domande per anno', 'domandePerAnno', filtri)} />
                </>
              }
            >
              <TabellaRighe caption="Domande per anno di raccolta" intestazione="Anno di raccolta" chiave={(r) => annoDiRaccolta(r.annoRaccolta)} colonne={COLONNE_ANNO} righe={righe} />
            </Sezione>
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

function ImportiPerAnnoSezione({ filtri }: { filtri: Filtri }) {
  const stato = useImportiPerAnno(filtri);
  return (
    <VistaQuery stato={stato} eVuoto={(d) => (d.righe ?? []).length === 0} vuoto={VUOTO}>
      {(d) => (
        <div>
          <CardGrafico titolo={TITOLI.importi} sottotitolo="Importo ammesso e decretato; trascina per ingrandire" dati={graficoImportiPerAnno(d.righe ?? [])} fonte={`Fonte: TX-0010 · ${DECRETATO}`} scaricamenti={datiDelReport(TITOLI.importi, 'importiPerAnno', filtri)} />
          <Sezione titolo="Importi per anno: dettaglio" strumenti={<PulsantiScarica oggetto="la tabella Importi per anno" scaricamenti={datiDelReport('Importi per anno', 'importiPerAnno', filtri)} />}>
            <PerimetroSezione perimetro={d.perimetro} />
            <TabellaRighe caption="Importi per anno di raccolta" intestazione="Anno di raccolta" chiave={(r) => annoDiRaccolta(r.annoRaccolta)} colonne={COLONNE_IMPORTI} righe={d.righe ?? []} />
          </Sezione>
        </div>
      )}
    </VistaQuery>
  );
}

export function DomandeReport({ filtri }: { filtri: Filtri }) {
  return (
    <>
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
          <DomandePerAnno key={ricercaDaFiltri(filtri)} filtri={filtri} />
        </ConGrant>
        <ConGrant grant={GRANT.importiPerAnno} titolo={TITOLI.importi}>
          <ImportiPerAnnoSezione filtri={filtri} />
        </ConGrant>
      </Griglia>
    </>
  );
}
