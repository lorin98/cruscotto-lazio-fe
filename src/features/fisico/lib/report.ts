// report.ts — il report delle superfici come DATI (PURO, zero React; review del fisico H3 e H4): i quattro KPI della
// campagna di riferimento (somme delle righe della campagna: il report e' completo) e le tre card della vista Grafico
// (titolo, sottotitolo, fonte, dati, criteri dei file CSV e XLSX, cosa fa il clic). I componenti li rendono con un map;
// l'aspetto (icona, tono) e i gestori dei clic restano nella UI. I testi sono quelli del wireframe approvato.
import { ettari, formatNumber } from '../../../shared/lib';
import type { DatiGrafico } from '../../../shared/lib';
import { conCampagna } from './criteri';
import type { Criteri } from './criteri';
import type { InterventoSuperficie, Superfici } from './dto';
import { notaQuantitaPremio, testoDifferenza, testoDomande, testoQuotaOltreDs } from './formato';
import { graficoPerCampagna, graficoPerIntervento, graficoVerifica } from './grafici';
import { quotaDpOltreDs, totaliCampagna, totaliPerCampagna } from './superfici';

export type ChiaveKpi = 'ds' | 'dp' | 'differenza' | 'oltre';

/** Etichetta visibile e spiegazione (le sigle sciolte) dei KPI della campagna: le stesse nella pagina e nella card della Home. */
export const TESTI_KPI = {
  ds: { etichetta: 'Superficie ammissibile DS', spiegazione: 'superficie delle domande di sostegno' },
  dp: { etichetta: 'Superficie ammissibile DP', spiegazione: 'superficie delle domande di pagamento' },
  oltre: { etichetta: 'Domande con DP oltre la DS', spiegazione: 'domande di pagamento con superficie oltre quella di sostegno' },
} as const satisfies Partial<Record<ChiaveKpi, { etichetta: string; spiegazione: string }>>;

/** Nome accessibile di un KPI: l'etichetta, la spiegazione e la campagna. */
function nomeKpi(chiave: keyof typeof TESTI_KPI, campagna: number): string {
  const t = TESTI_KPI[chiave];
  return `${t.etichetta}: ${t.spiegazione}, campagna ${campagna}`;
}

/** Un KPI della campagna: etichetta visibile, nome accessibile con le sigle sciolte, valore, nota e quota della barra. */
export interface KpiSuperfici {
  chiave: ChiaveKpi;
  etichetta: string;
  nomeAccessibile: string;
  valore: string;
  nota: string;
  /** Quota della barra (0-1) delle domande con DP oltre la DS; null senza domande di pagamento; assente negli altri. */
  quota?: number | null;
}

/** I quattro KPI della campagna `campagna`; null se nessun intervento ha superfici in quella campagna. */
export function kpiDellaCampagna(righe: readonly InterventoSuperficie[], campagna: number): KpiSuperfici[] | null {
  const t = totaliCampagna(righe, campagna);
  if (!t) return null;
  const quota = quotaDpOltreDs(t);
  return [
    {
      chiave: 'ds',
      etichetta: TESTI_KPI.ds.etichetta,
      nomeAccessibile: nomeKpi('ds', campagna),
      valore: ettari(t.superficieDs),
      nota: `${testoDomande(t.domandeSostegno, 'sostegno')} (la DS si conta una volta per domanda di sostegno)`,
    },
    {
      chiave: 'dp',
      etichetta: TESTI_KPI.dp.etichetta,
      nomeAccessibile: nomeKpi('dp', campagna),
      valore: ettari(t.superficieDp),
      nota: testoDomande(t.domandePagamento, 'pagamento'),
    },
    {
      chiave: 'differenza',
      etichetta: 'Differenza DP - DS',
      nomeAccessibile: `Differenza DP - DS: superficie di pagamento meno superficie di sostegno, campagna ${campagna}`,
      valore: testoDifferenza(t.differenzaDpDs),
      nota: 'negativa se la DP è minore della DS',
    },
    {
      chiave: 'oltre',
      etichetta: TESTI_KPI.oltre.etichetta,
      nomeAccessibile: nomeKpi('oltre', campagna),
      valore: formatNumber(t.domandeDpOltreDs),
      nota: testoQuotaOltreDs(t.domandePagamento, quota),
      quota: quota === null ? null : quota / 100,
    },
  ];
}

/** Una card della vista Grafico. */
export interface CardSuperfici {
  chiave: 'per-intervento' | 'per-campagna' | 'verifica';
  titolo: string;
  sottotitolo: string;
  dati: DatiGrafico;
  fonte: string;
  /** I criteri dei file CSV e XLSX: quelli della pagina, con la campagna della card nelle card della campagna di riferimento. */
  criteriFile: Criteri;
  /** Il clic su un dato: l'anteprima dell'intervento, oppure il filtro Campagna su quell'anno. */
  clic: 'intervento' | 'campagna';
}

type DatiDelReport = Pick<Superfici, 'campagna' | 'righe'>;

function cardPerIntervento(d: DatiDelReport, criteri: Criteri, campagna: number): CardSuperfici {
  return {
    chiave: 'per-intervento',
    titolo: `Superficie DS e DP per intervento, campagna ${campagna}`,
    sottotitolo: "Clic su una barra per l'anteprima dell'intervento",
    dati: graficoPerIntervento(d.righe, campagna, d.campagna),
    fonte: `Fonte: TX-0018, campagna ${campagna}. CSV e XLSX: la tabella di TX-0018 della campagna ${campagna} con i filtri della pagina, come il grafico.`,
    criteriFile: conCampagna(criteri, campagna),
    clic: 'intervento',
  };
}

function cardPerCampagna(d: DatiDelReport, criteri: Criteri): CardSuperfici {
  return {
    chiave: 'per-campagna',
    titolo: 'Superficie DS e DP per campagna',
    sottotitolo: 'Somma degli interventi dentro ogni campagna, mai fra campagne; clic su un punto per scegliere la campagna',
    dati: graficoPerCampagna(totaliPerCampagna(d.righe), criteri.campagna),
    fonte:
      criteri.campagna !== undefined
        ? `Fonte: TX-0018 con il filtro Campagna ${criteri.campagna}. CSV e XLSX: la tabella di TX-0018 coi filtri della pagina.`
        : 'Fonte: TX-0018, tutte le campagne della risposta. CSV e XLSX: la tabella di TX-0018 coi filtri della pagina, tutte le campagne.',
    criteriFile: criteri,
    clic: 'campagna',
  };
}

function cardVerifica(d: DatiDelReport, criteri: Criteri, campagna: number): CardSuperfici {
  return {
    chiave: 'verifica',
    titolo: `Verifica incrociata: differenza DP - DS per intervento, campagna ${campagna}`,
    sottotitolo: "A destra dello zero la DP supera la DS, a sinistra è minore; clic su una barra per l'anteprima",
    dati: graficoVerifica(d.righe, campagna, d.campagna),
    fonte: `Fonte: TX-0018 (differenza DP - DS, domande con DP oltre la DS). ${notaQuantitaPremio(d.righe, campagna)} CSV e XLSX: come il grafico per intervento, campagna ${campagna}.`,
    criteriFile: conCampagna(criteri, campagna),
    clic: 'intervento',
  };
}

/** Le tre card della vista Grafico nell'ordine della pagina: per intervento e per campagna (affiancate), poi la verifica. */
export function cardDelleSuperfici(d: DatiDelReport, criteri: Criteri, campagna: number): CardSuperfici[] {
  return [cardPerIntervento(d, criteri, campagna), cardPerCampagna(d, criteri), cardVerifica(d, criteri, campagna)];
}
