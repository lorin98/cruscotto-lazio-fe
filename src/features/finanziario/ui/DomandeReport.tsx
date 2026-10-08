// DomandeReport — pattern DS "report" (route /finanziario/domande, TX-0008..TX-0010/RF008-RF010, wireframe
// domande.html): totale domande, domande per anno di raccolta (barre impilate + tabella: la ripartizione del totale di
// ogni anno) e importi per anno (barre + tabella). Le domande senza campagna (annoRaccolta null) sono la riga "senza
// campagna". Ogni sezione ha il suo grant e il suo perimetro (lo stato vuoto lo dice). L'importo decretato e' quello
// degli elenchi di liquidazione, la stessa fonte dei pagamenti totali di RF005 (OP-FE-05). Grafici SVG propri, classi
// bootstrap-italia.
import { formatEuro, formatNumber } from '../../../shared/lib';
import { GraficoBarre, VistaQuery } from '../../../shared/ui';
import { useDomandePerAnno, useImportiPerAnno, useTotaleDomande } from '../api';
import type { DomandePerAnnoRiga, ImportiPerAnnoRiga } from '../api';
import type { Filtri } from '../lib/filtri';
import { annoDiRaccolta } from '../lib/formato';
import { ConGrant, Numero, PerimetroSezione, Sezione, TabellaRighe, TabellaVoci, colonnaImporto, vuotoConPerimetro } from './comuni';
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
    <Sezione titolo={TITOLI.totale}>
      <VistaQuery stato={stato}>
        {(d) => (
          <>
            <PerimetroSezione perimetro={d.perimetro} />
            <TabellaVoci
              caption="Domande presentate (di sostegno o SIGC)"
              voci={[
                { etichetta: 'Domande presentate', valore: <Numero valore={d.presentate} /> },
                { etichetta: "di cui prima annualità", valore: <Numero valore={d.primaAnnualita} /> },
              ]}
            />
          </>
        )}
      </VistaQuery>
    </Sezione>
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
    <Sezione titolo={TITOLI.perAnno}>
      <VistaQuery stato={stato} eVuoto={(d) => (d.righe ?? []).length === 0} vuoto={VUOTO}>
        {(d) => {
          const righe = d.righe ?? [];
          return (
            <>
              <PerimetroSezione perimetro={d.perimetro} />
              <GraficoBarre
                titolo="Domande per anno di raccolta"
                impilato
                categorie={righe.map((r) => annoDiRaccolta(r.annoRaccolta))}
                serie={[
                  { nome: 'Prima annualità', valori: righe.map((r) => r.primaAnnualita ?? null) },
                  { nome: 'Altre annualità', valori: righe.map((r) => r.altreAnnualita ?? null) },
                  { nome: 'Non classificate', valori: righe.map((r) => r.nonClassificate ?? null) },
                ]}
                formatta={formatNumber}
              />
              <TabellaRighe caption="Domande per anno di raccolta" intestazione="Anno di raccolta" chiave={(r) => annoDiRaccolta(r.annoRaccolta)} colonne={COLONNE_ANNO} righe={righe} />
            </>
          );
        }}
      </VistaQuery>
    </Sezione>
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
    <Sezione titolo={TITOLI.importi}>
      <VistaQuery stato={stato} eVuoto={(d) => (d.righe ?? []).length === 0} vuoto={VUOTO}>
        {(d) => {
          const righe = d.righe ?? [];
          return (
            <>
              <PerimetroSezione perimetro={d.perimetro} />
              <GraficoBarre
                titolo="Importi stanziato, ammesso e decretato per anno"
                categorie={righe.map((r) => annoDiRaccolta(r.annoRaccolta))}
                serie={[
                  { nome: 'Importo stanziato', valori: righe.map((r) => r.importoStanziato?.valore ?? null) },
                  { nome: 'Importo ammesso', valori: righe.map((r) => r.importoAmmesso?.valore ?? null) },
                  { nome: 'Importo decretato (elenchi di liquidazione)', valori: righe.map((r) => r.importoDecretato?.valore ?? null) },
                ]}
                formatta={formatEuro}
              />
              <TabellaRighe caption="Importi per anno di raccolta" intestazione="Anno di raccolta" chiave={(r) => annoDiRaccolta(r.annoRaccolta)} colonne={COLONNE_IMPORTI} righe={righe} />
            </>
          );
        }}
      </VistaQuery>
    </Sezione>
  );
}

export function DomandeReport({ filtri }: { filtri: Filtri }) {
  return (
    <>
      <ConGrant grant="csr.tx-0009.read" titolo={TITOLI.totale}>
        <TotaleDomande filtri={filtri} />
      </ConGrant>
      <ConGrant grant="csr.tx-0008.read" titolo={TITOLI.perAnno}>
        <DomandePerAnno filtri={filtri} />
      </ConGrant>
      <ConGrant grant="csr.tx-0010.read" titolo={TITOLI.importi}>
        <ImportiPerAnno filtri={filtri} />
      </ConGrant>
    </>
  );
}
