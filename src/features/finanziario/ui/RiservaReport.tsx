// RiservaReport — pattern DS "report" (route /finanziario/sigc/riserva, TX-0014/RF014, wireframe riserva.html): fase e
// valori della riserva al 5% dell'anno n con le date dell'anno scelto, utilizzo progressivo (linea + tabella). Il dato
// e' regionale e l'endpoint non accetta i filtri del finanziario (OP-FE-03): la pagina lo dice invece di mostrare filtri
// che non si applicano. Il 404 NOT_FOUND (anno senza movimenti) e' uno stato vuoto spiegato, non un errore. Come nel
// backend la fase e' calcolata al giorno della consultazione, gli importi sono quelli dell'istantanea alla data di
// estrazione: la tabella lo dichiara e avvisa se l'istantanea precede la fase attuale (lib/riserva.ts). UI v2 (wireframe
// riserva v2): quattro KPI (accumulato, congelato, utilizzato, residuo), linea dell'utilizzo cumulato con zoom e la
// riserva accumulata come riferimento, voci di contorno in tabella.
import { ValoreImporto } from '../../../entities/importo';
import { formatDate, importoKpi } from '../../../shared/lib';
import { CardGrafico, Griglia, Kpi, Sezione, TabellaRighe, TabellaVoci, VistaQuery, Vuoto } from '../../../shared/ui';
import type { Colonna } from '../../../shared/ui';
import { rispostaRiservaAssente, useRiserva } from '../api';
import type { MonitoraggioRiserva, UtilizzoRiserva } from '../api';
import { euroOpzionale, testoOpzionale } from '../lib/formato';
import { graficoUtilizzoRiserva } from '../lib/grafici';
import { aiutoRiserva, calendarioRiserva, dataBreve, etichettaFaseRiserva, istantaneaAnteriore, testoCongelato, testoResiduo, utilizzoOltreRiserva } from '../lib/riserva';
import { PerimetroSezione } from './comuni';
import { SelettoreAnno } from './SelettoreAnno';

/** Data di oggi (locale) in forma ISO AAAA-MM-GG, confrontabile con le date del contratto. */
function oggiIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const COLONNE_UTILIZZO: Colonna<UtilizzoRiserva>[] = [
  ['Importo', (u) => euroOpzionale(u.importo)],
  ['Cumulato', (u) => euroOpzionale(u.cumulato)],
];

const maiuscola = (t: string) => `${t.charAt(0).toUpperCase()}${t.slice(1)}`;

/** I quattro valori della riserva come KPI; un valore che non c'e' ancora dice quando ci sara' (lib/riserva). */
function KpiRiserva({ d, anno }: { d: MonitoraggioRiserva; anno: number }) {
  const estrazione = d.dataEstrazione;
  const oltre = utilizzoOltreRiserva(d);
  const residuoPrevisto = d.importoResiduoDisponibile != null && oggiIso() < calendarioRiserva(anno).inizioResiduo;
  return (
    <Griglia colonne={4}>
      <Kpi etichetta="Importo accumulato" icona="it-card" tono="scuro" valore={d.importoAccumulato == null ? undefined : importoKpi(d.importoAccumulato)} assente={d.importoAccumulato == null ? 'Non disponibile' : undefined} nota={`Fase: ${etichettaFaseRiserva(d.fase, anno)}`} />
      <Kpi etichetta="Importo congelato" icona="it-presentation" tono="blu" valore={d.importoCongelato == null ? undefined : importoKpi(d.importoCongelato)} assente={d.importoCongelato == null ? maiuscola(testoCongelato(null, anno, estrazione)) : undefined} />
      <Kpi
        etichetta="Importo utilizzato"
        icona="it-chart-line"
        tono={oltre ? 'ambra' : 'verde'}
        valore={d.importoUtilizzato == null ? undefined : importoKpi(d.importoUtilizzato)}
        assente={d.importoUtilizzato == null ? 'Non disponibile' : undefined}
        nota={oltre ? 'Supera la riserva di questa estrazione' : undefined}
      />
      <Kpi
        etichetta="Residuo disponibile"
        icona="it-calendar"
        tono="ambra"
        valore={d.importoResiduoDisponibile == null ? undefined : importoKpi(d.importoResiduoDisponibile)}
        assente={d.importoResiduoDisponibile == null ? maiuscola(testoResiduo(null, anno, estrazione, oggiIso())) : undefined}
        nota={residuoPrevisto ? `Previsto: disponibile dal ${dataBreve(calendarioRiserva(anno).inizioResiduo)}` : undefined}
      />
    </Griglia>
  );
}

function ValoriRiserva({ d, anno }: { d: MonitoraggioRiserva; anno: number }) {
  const estrazione = d.dataEstrazione;
  return (
    <>
      {istantaneaAnteriore(d.fase, anno, estrazione) && (
        <p className="small mb-2">
          {`Gli importi sono dell'estrazione del ${formatDate(estrazione)}, precedente all'inizio della fase attuale: non la rappresentano ancora.`}
        </p>
      )}
      {utilizzoOltreRiserva(d) && (
        <div className="alert alert-warning my-2">{"L'importo utilizzato supera la riserva (congelata o, prima del congelamento, accumulata) di questa estrazione."}</div>
      )}
      <KpiRiserva d={d} anno={anno} />
      <TabellaVoci
        caption={estrazione ? `Riserva dell'anno ${anno}: valori all'estrazione del ${formatDate(estrazione)}` : `Riserva dell'anno ${anno}`}
        voci={[
          { etichetta: 'Fase (calcolata al giorno della consultazione)', valore: etichettaFaseRiserva(d.fase, anno) },
          { etichetta: 'Data di estrazione', valore: testoOpzionale(formatDate(estrazione)) },
          { etichetta: 'Data di congelamento', valore: testoOpzionale(formatDate(d.dataCongelamento)) },
          { etichetta: 'Montante dei pagamenti', valore: euroOpzionale(d.montantePagamenti) },
          { etichetta: 'Importo accumulato', valore: euroOpzionale(d.importoAccumulato) },
          { etichetta: 'Importo congelato', valore: testoCongelato(d.importoCongelato, anno, estrazione) },
          { etichetta: 'Importo utilizzato', valore: euroOpzionale(d.importoUtilizzato) },
          { etichetta: 'Residuo disponibile', valore: testoResiduo(d.importoResiduoDisponibile, anno, estrazione, oggiIso()) },
          { etichetta: 'Regola n+2', valore: <ValoreImporto importo={d.regolaN2} /> },
        ]}
      />
    </>
  );
}

function UtilizzoProgressivo({ d }: { d: MonitoraggioRiserva }) {
  const utilizzi = d.utilizzoProgressivo ?? [];
  if (utilizzi.length === 0) return <p>Nessun utilizzo registrato.</p>;
  return (
    <>
      <CardGrafico
        titolo="Utilizzo progressivo cumulato della riserva"
        sottotitolo="La linea orizzontale è la riserva accumulata; trascina per ingrandire"
        dati={graficoUtilizzoRiserva(d)}
        fonte="Fonte: TX-0014, movimenti della riserva"
        livello={3}
      />
      <TabellaRighe caption="Utilizzo progressivo" intestazione="Data" chiave={(u) => formatDate(u.data) || 'senza data'} colonne={COLONNE_UTILIZZO} righe={utilizzi} />
    </>
  );
}

function Riserva({ anno }: { anno: number }) {
  const stato = useRiserva(anno);
  const assente = (e: unknown) =>
    rispostaRiservaAssente(e) ? <Vuoto>{`Nessuna riserva calcolata per il ${anno}. Scegli un altro anno.`}</Vuoto> : null;
  return (
    <Sezione titolo={`Riserva di efficacia (5%) dell'anno ${anno} (RF014)`}>
      <VistaQuery stato={stato} errorePersonalizzato={assente}>
        {(d) => (
          <>
            <PerimetroSezione perimetro={d.perimetro} />
            <ValoriRiserva d={d} anno={anno} />
            <UtilizzoProgressivo d={d} />
          </>
        )}
      </VistaQuery>
    </Sezione>
  );
}

export function RiservaReport({ anno, onCambiaAnno }: { anno: number | undefined; onCambiaAnno: (anno: number | undefined) => void }) {
  return (
    <>
      <p className="mb-2">Dato regionale: i filtri del finanziario non si applicano alla riserva.</p>
      <SelettoreAnno id="f-anno-riserva" etichetta="Anno di riferimento (anno n)" aiuto={aiutoRiserva(anno)} tipo="riserva" anno={anno} onCambia={onCambiaAnno} />
      {anno === undefined ? <Vuoto>{"Scegli l'anno della riserva da consultare."}</Vuoto> : <Riserva anno={anno} />}
    </>
  );
}
