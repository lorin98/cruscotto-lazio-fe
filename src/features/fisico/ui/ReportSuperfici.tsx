// ReportSuperfici — il report delle superfici della campagna di riferimento (flusso superfici approvato, RF018): i quattro
// KPI, la card "Superfici per intervento e campagna" con l'interruttore di pagina Grafico | Tabella (vista iniziale
// Grafico: tre card grafico, ognuna con Grafico | Tabella e i download PNG, CSV, XLSX; oppure la tabella interattiva coi
// totali per campagna) e l'anteprima dell'intervento nel drawer; senza superfici nella campagna, lo stato vuoto (mai una
// pagina di zeri; con il filtro Campagna detto di quella campagna, D1). KPI e card sono dati del lib (lib/report, review
// H3 e H4): qui l'aspetto (icone, toni) e i gestori dei clic. Classi bootstrap-italia e del kit v2 (card, KPI,
// interruttore con aria-pressed); react-aria solo dentro il drawer del kit.
import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { codiceDalClic } from '../../../shared/lib';
import { CardGrafico, Griglia, InterruttoreVista, Kpi, Sezione, Vuoto } from '../../../shared/ui';
import type { ClicGrafico, NomeIcona, TonoKpi, VistaGrafico } from '../../../shared/ui';
import type { SuperficieAmmissibile } from '../api';
import type { InterventoSuperficie } from '../lib/dto';
import { campagnaDaTesto, conCampagna, soloIntervento } from '../lib/criteri';
import type { Criteri } from '../lib/criteri';
import { testoNessunaSuperficie } from '../lib/formato';
import { cardDelleSuperfici, kpiDellaCampagna } from '../lib/report';
import type { CardSuperfici, ChiaveKpi } from '../lib/report';
import { esitoSuperfici } from '../lib/superfici';
import { AnteprimaIntervento } from './AnteprimaIntervento';
import { TITOLO_TABELLA, TabellaSuperfici } from './TabellaSuperfici';
import { scaricamentiSuperfici } from './esportazioni';

/** Stato vuoto con "Modifica i filtri", che apre il pannello. */
export function VuotoConFiltri({ children, onModifica }: { children: ReactNode; onModifica: () => void }) {
  return (
    <>
      <span>{children}</span>
      <button type="button" className="btn btn-outline-primary btn-sm ms-2" onClick={onModifica}>
        Modifica i filtri
      </button>
    </>
  );
}

const ASPETTO_KPI: Record<ChiaveKpi, { icona: NomeIcona; tono?: TonoKpi }> = {
  ds: { icona: 'it-map-marker', tono: 'scuro' },
  dp: { icona: 'it-card' },
  differenza: { icona: 'it-chart-line', tono: 'ambra' },
  oltre: { icona: 'it-warning-circle', tono: 'verde' },
};

/** I quattro KPI della campagna di riferimento (somme delle righe della campagna: il report e' completo). */
function KpiCampagna({ righe, campagna }: { righe: readonly InterventoSuperficie[]; campagna: number }) {
  const kpi = kpiDellaCampagna(righe, campagna);
  if (!kpi) return null;
  return (
    <section className="my-3" aria-labelledby="t-totali-campagna">
      <h2 id="t-totali-campagna">{`Totali della campagna ${campagna}`}</h2>
      <Griglia colonne={4}>
        {kpi.map((k) => (
          <Kpi key={k.chiave} etichetta={k.etichetta} nomeAccessibile={k.nomeAccessibile} valore={k.valore} nota={k.nota} quota={k.quota} {...ASPETTO_KPI[k.chiave]} />
        ))}
      </Griglia>
    </section>
  );
}

interface PropsGrafici {
  d: SuperficieAmmissibile;
  criteri: Criteri;
  campagna: number;
  onIntervento: (codice: string) => void;
  onCampagna: (anno: number) => void;
}

/** Le tre card grafico della vista Grafico: le prime due affiancate, poi la verifica incrociata. */
function Grafici({ d, criteri, campagna, onIntervento, onCampagna }: PropsGrafici) {
  const carte = useMemo(() => cardDelleSuperfici(d, criteri, campagna), [d, criteri, campagna]);
  const clic: Record<CardSuperfici['clic'], (p: ClicGrafico) => void> = {
    intervento: (p) => {
      const codice = codiceDalClic(p);
      if (codice) onIntervento(codice);
    },
    campagna: (p) => {
      const anno = campagnaDaTesto(codiceDalClic(p));
      if (anno !== undefined) onCampagna(anno);
    },
  };
  const card = (c: CardSuperfici) => (
    <CardGrafico key={c.chiave} titolo={c.titolo} sottotitolo={c.sottotitolo} livello={3} dati={c.dati} fonte={c.fonte} onClic={clic[c.clic]} scaricamenti={scaricamentiSuperfici(c.titolo, c.criteriFile)} />
  );
  return (
    <>
      <Griglia colonne={2}>{carte.slice(0, 2).map(card)}</Griglia>
      {carte.slice(2).map(card)}
    </>
  );
}

export interface PropsReport {
  d: SuperficieAmmissibile;
  criteri: Criteri;
  vista: VistaGrafico;
  onVista: (v: VistaGrafico) => void;
  /** Applica criteri nuovi da un comando che sparisce col report (focus sul titolo della pagina). */
  applica: (c: Criteri) => void;
  onModificaFiltri: () => void;
  descrizioneDi: (codice: string) => string | undefined;
}

/** Nessuna superficie per gli interventi scelti: in nessuna campagna, o nella campagna filtrata (D1); mai una pagina di zeri. */
function NessunaSuperficie({ campagna, onModifica }: { campagna: number | null; onModifica: () => void }) {
  return (
    <Vuoto>
      <VuotoConFiltri onModifica={onModifica}>{testoNessunaSuperficie(campagna)}</VuotoConFiltri>
    </Vuoto>
  );
}

/** Il report della campagna di riferimento: KPI, card con le due viste, anteprima; senza superfici lo stato vuoto. */
export function Report({ d, criteri, vista, onVista, applica, onModificaFiltri, descrizioneDi }: PropsReport) {
  const [aperto, setAperto] = useState<string | null>(null);
  const esito = esitoSuperfici(d.righe, criteri.campagna);
  if (esito.tipo !== 'dati') return <NessunaSuperficie campagna={esito.tipo === 'senza-superfici' ? esito.campagna : null} onModifica={onModificaFiltri} />;
  const riga = aperto === null ? null : (d.righe.find((r) => r.codiceIntervento === aperto) ?? null);
  const mostraSolo = (codice: string) => {
    setAperto(null);
    applica(soloIntervento(criteri, codice));
  };
  return (
    <>
      <KpiCampagna righe={d.righe} campagna={esito.campagna} />
      <Sezione titolo={TITOLO_TABELLA}>
        {/* interruttore di pagina: quello del kit, nello stesso ordine Grafico | Tabella di ogni card */}
        <InterruttoreVista etichetta="Vista delle superfici" vista={vista} onVista={onVista} className="mb-3" />
        {vista === 'tabella' ? (
          <TabellaSuperfici righe={d.righe} campagnaRisposta={d.campagna} criteri={criteri} onRiga={setAperto} />
        ) : (
          <Grafici d={d} criteri={criteri} campagna={esito.campagna} onIntervento={setAperto} onCampagna={(anno) => applica(conCampagna(criteri, anno))} />
        )}
      </Sezione>
      <AnteprimaIntervento riga={riga} campagna={esito.campagna} campagnaRisposta={d.campagna} descrizione={riga ? descrizioneDi(riga.codiceIntervento) : undefined} onChiudi={() => setAperto(null)} onMostraSolo={mostraSolo} />
    </>
  );
}
