// DomandeReport — pattern DS "report" (route /finanziario/domande, TX-0008..TX-0010/RF008-RF010, wireframe
// domande.html): totale domande, domande per anno di raccolta (barre impilate + tabella: la ripartizione del totale di
// ogni anno) e importi per anno (barre + tabella). Le domande senza campagna (annoRaccolta null) sono la riga "senza
// campagna". Ogni sezione ha il suo grant e il suo perimetro (lo stato vuoto lo dice). L'importo decretato e' quello
// degli elenchi di liquidazione, la stessa fonte dei pagamenti totali di RF005 (OP-FE-05). UI v2: KPI, card con grafici
// interattivi (barre impilate, linee con zoom) e tabella di dettaglio per anno.
import { formatNumber } from '../../../shared/lib';
import { CardGrafico, Kpi, VistaQuery } from '../../../shared/ui';
import { useDomandePerAnno, useImportiPerAnno, useTotaleDomande } from '../api';
import type { DomandePerAnnoRiga, ImportiPerAnnoRiga } from '../api';
import type { Filtri } from '../lib/filtri';
import { annoDiRaccolta } from '../lib/formato';
import { graficoDomandePerAnno, graficoImportiPerAnno } from '../lib/grafici';
import { ConGrant, Griglia, Numero, PerimetroSezione, Sezione, TabellaRighe, colonnaImporto, vuotoConPerimetro } from './comuni';
import type { Colonna } from './comuni';

const TITOLI = {
  totale: 'Totale domande presentate (RF009)',
  perAnno: 'Domande per anno di raccolta (RF008)',
  importi: 'Importi per anno di raccolta (RF010)',
};
const VUOTO = vuotoConPerimetro('Nessuna domanda per i filtri scelti. Modifica i filtri.');
const DECRETATO = 'Importo decretato (elenchi di liquidazione, come i pagamenti totali di RF005)';

function TotaleDomande({ filtri }: { filtri: Filtri }) {
  const stato = useTotaleDomande(filtri);
  return (
    <VistaQuery stato={stato}>
      {(d) => (
        <Griglia colonne={4}>
          <Kpi etichetta="Domande presentate" icona="it-files" tono="ambra" valore={formatNumber(d.presentate)} nota={`${TITOLI.totale} · Perimetro ${d.perimetro ?? 'non indicato'}`} />
          <Kpi etichetta="di cui prima annualità" icona="it-calendar" tono="blu" valore={formatNumber(d.primaAnnualita)} />
        </Griglia>
      )}
    </VistaQuery>
  );
}

const COLONNE_ANNO: Colonna<DomandePerAnnoRiga>[] = [
  ['Prima annualità', (r) => <Numero valore={r.primaAnnualita} />],
  ['Altre annualità', (r) => <Numero valore={r.altreAnnualita} />],
  ['Non classificate', (r) => <Numero valore={r.nonClassificate} />],
  ['Totale', (r) => <Numero valore={r.totali} />],
];

function DomandePerAnno({ filtri }: { filtri: Filtri }) {
  const stato = useDomandePerAnno(filtri);
  return (
    <VistaQuery stato={stato} eVuoto={(d) => (d.righe ?? []).length === 0} vuoto={VUOTO}>
      {(d) => (
        <div>
          <CardGrafico titolo={TITOLI.perAnno} sottotitolo="Prima annualità, altre annualità e non classificate" dati={graficoDomandePerAnno(d.righe ?? [])} fonte={`Fonte: TX-0008 · Perimetro ${d.perimetro ?? 'non indicato'}`} />
          <Sezione titolo="Domande per anno: dettaglio">
            <TabellaRighe caption="Domande per anno di raccolta" intestazione="Anno di raccolta" chiave={(r) => annoDiRaccolta(r.annoRaccolta)} colonne={COLONNE_ANNO} righe={d.righe ?? []} />
          </Sezione>
        </div>
      )}
    </VistaQuery>
  );
}

type RigaImporti = ImportiPerAnnoRiga;
const COLONNE_IMPORTI: Colonna<RigaImporti>[] = [
  colonnaImporto<RigaImporti>('Importo stanziato', (r) => r.importoStanziato),
  colonnaImporto<RigaImporti>('Importo ammesso', (r) => r.importoAmmesso),
  colonnaImporto<RigaImporti>(DECRETATO, (r) => r.importoDecretato),
  ['Domande senza importo ammesso', (r) => <Numero valore={r.domandeSenzaAmmesso} />],
];

function ImportiPerAnno({ filtri }: { filtri: Filtri }) {
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
      <ConGrant grant="csr.tx-0009.read" titolo={TITOLI.totale}>
        <TotaleDomande filtri={filtri} />
      </ConGrant>
      <Griglia>
        <ConGrant grant="csr.tx-0008.read" titolo={TITOLI.perAnno}>
          <DomandePerAnno filtri={filtri} />
        </ConGrant>
        <ConGrant grant="csr.tx-0010.read" titolo={TITOLI.importi}>
          <ImportiPerAnno filtri={filtri} />
        </ConGrant>
      </Griglia>
    </>
  );
}
