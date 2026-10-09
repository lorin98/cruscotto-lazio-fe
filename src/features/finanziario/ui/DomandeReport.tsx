// DomandeReport — pattern DS "report" (route /finanziario/domande, TX-0008..TX-0010/RF008-RF010, wireframe domande v2):
// quattro KPI (domande presentate e di prima annualita' TX-0009; importo ammesso, somma degli anni, e importo stanziato
// TX-0010), domande per anno di raccolta (barre impilate; clic su un anno: la tabella di dettaglio mostra quell'anno) e
// importi per anno (linee + tabella). Le domande senza campagna sono la riga "senza campagna". Ogni sezione ha il suo
// grant e il suo perimetro. L'importo decretato e' quello degli elenchi di liquidazione, la stessa fonte dei pagamenti
// totali di RF005 (OP-FE-05).
import { useState } from 'react';
import { formatEuro, formatNumber } from '../../../shared/lib';
import { CardGrafico, Griglia, Kpi, Sezione, TabellaRighe, VistaQuery } from '../../../shared/ui';
import type { ClicGrafico, Colonna } from '../../../shared/ui';
import { useDomandePerAnno, useImportiPerAnno, useTotaleDomande } from '../api';
import type { DomandePerAnnoRiga, ImportiPerAnno, ImportiPerAnnoRiga } from '../api';
import { sommaSeCompleta } from '../lib/aggregati';
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

/** Importo ammesso di tutti gli anni: la somma solo se ogni anno e' valorizzato, con le domande senza ammesso dichiarate. */
function KpiAmmesso({ d }: { d: ImportiPerAnno }) {
  const righe = d.righe ?? [];
  const somma = sommaSeCompleta(righe.map((r) => r.importoAmmesso?.valore));
  const senza = sommaSeCompleta(righe.map((r) => r.domandeSenzaAmmesso));
  const nota =
    senza === null
      ? 'domande senza importo ammesso: conteggio non disponibile per almeno un anno'
      : senza > 0
        ? `${formatNumber(senza)} ${senza === 1 ? 'domanda senza importo ammesso: non entra' : 'domande senza importo ammesso: non entrano'} nella somma`
        : 'somma degli anni di raccolta';
  return (
    <Kpi
      etichetta="Importo ammesso"
      icona="it-card"
      tono="verde"
      valore={somma === null ? undefined : formatEuro(somma)}
      assente={somma === null ? 'Non calcolabile: manca per almeno un anno di raccolta' : undefined}
      nota={nota}
    />
  );
}

/** Importo stanziato: oggi da fonte non attiva per ogni anno, quindi si dichiara con il motivo del primo anno. */
function KpiStanziato({ d }: { d: ImportiPerAnno }) {
  const righe = d.righe ?? [];
  const somma = sommaSeCompleta(righe.map((r) => r.importoStanziato?.valore));
  if (somma !== null && righe.length > 0) return <Kpi etichetta="Importo stanziato" icona="it-presentation" tono="scuro" valore={formatEuro(somma)} nota="somma degli anni di raccolta" />;
  return <KpiImporto etichetta="Importo stanziato" importo={righe.find((r) => r.importoStanziato?.valore == null)?.importoStanziato} icona="it-presentation" tono="scuro" />;
}

function KpiImporti({ filtri }: { filtri: Filtri }) {
  return (
    // senza anni le tessere non compaiono: lo stato vuoto lo dice la sezione degli importi
    <VistaQuery stato={useImportiPerAnno(filtri)} errorePersonalizzato={erroreGiaMostrato}>
      {(d) =>
        (d.righe ?? []).length === 0 ? null : (
          <>
            <KpiAmmesso d={d} />
            <KpiStanziato d={d} />
          </>
        )
      }
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

function DomandePerAnno({ filtri }: { filtri: Filtri }) {
  const stato = useDomandePerAnno(filtri);
  // clic su un anno del grafico: la tabella di dettaglio mostra solo quell'anno (wireframe domande)
  const [anno, setAnno] = useState<string | null>(null);
  return (
    <VistaQuery stato={stato} eVuoto={(d) => (d.righe ?? []).length === 0} vuoto={VUOTO}>
      {(d) => {
        const righe = (d.righe ?? []).filter((r) => anno === null || annoDiRaccolta(r.annoRaccolta) === anno);
        return (
          <div>
            <CardGrafico
              titolo={TITOLI.perAnno}
              sottotitolo="Prima annualità, altre annualità e non classificate. Clic su un anno: la tabella mostra quell'anno."
              dati={graficoDomandePerAnno(d.righe ?? [])}
              fonte={`Fonte: TX-0008 · Perimetro ${d.perimetro ?? 'non indicato'}`}
              onClic={(p: ClicGrafico) => setAnno(p.name ?? null)}
            />
            <Sezione
              titolo="Domande per anno: dettaglio"
              strumenti={
                anno !== null && (
                  <button type="button" className="btn btn-outline-primary btn-sm" onClick={() => setAnno(null)}>
                    {`Mostra tutti gli anni (ora: ${anno})`}
                  </button>
                )
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
          <CardGrafico titolo={TITOLI.importi} sottotitolo="Importo ammesso e decretato; trascina per ingrandire" dati={graficoImportiPerAnno(d.righe ?? [])} fonte={`Fonte: TX-0010 · ${DECRETATO}`} />
          <Sezione titolo="Importi per anno: dettaglio">
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
          <DomandePerAnno filtri={filtri} />
        </ConGrant>
        <ConGrant grant={GRANT.importiPerAnno} titolo={TITOLI.importi}>
          <ImportiPerAnnoSezione filtri={filtri} />
        </ConGrant>
      </Griglia>
    </>
  );
}
