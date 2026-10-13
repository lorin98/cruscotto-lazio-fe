// grafici.ts — builder PURI dei grafici dell'elenco operativo (contratto DatiGrafico del kit): ripartizioni del sinottico
// (domande per stato SIAN, per intervento, per anno di raccolta: TX-0057) e la cascata dall'ammesso al pagato della scheda
// (TX-0058). Il clic su una barra aggiunge il filtro corrispondente: la barra porta il valore del filtro come codice, e le
// voci che il filtro non accetta (ALTRI, e SENZA_STATO come nel wireframe approvato) non hanno codice e restano a parte.
import { ANNO_ASSENTE, ANNO_SENZA } from '../../../entities/domanda';
import type { BarSeriesOption, EChartsOption } from 'echarts';
import {
  COLORI,
  aria,
  centesimi,
  descrizioneCascata,
  nonDisegnabile,
  opzioniCascata,
  plurale,
  valoreInNumero,
  zoomSeMolti,
} from '../../../shared/lib';
import type { DatiGrafico, DatoSerie, PassoCascata, TabellaEquivalente } from '../../../shared/lib';
import type { NomeFiltro } from './criteri';
import type { Domanda, Voce } from './dto';
import { cellaImporto } from './formato';

export type Ripartizione = 'perStato' | 'perIntervento' | 'perAnno';

interface TestiRipartizione {
  titolo: string;
  caption: string;
  colonna: string;
  unita: [string, string];
  /** Filtro che il clic aggiunge. */
  filtro: NomeFiltro;
  orizzontale: boolean;
}

export const TESTI_RIPARTIZIONE: Record<Ripartizione, TestiRipartizione> = {
  perStato: { titolo: 'Domande per stato SIAN', caption: 'Domande per stato SIAN', colonna: 'Stato SIAN', unita: ['stato', 'stati'], filtro: 'stato', orizzontale: true },
  perIntervento: { titolo: 'Domande per intervento', caption: 'Domande per intervento', colonna: 'Intervento', unita: ['intervento', 'interventi'], filtro: 'intervento', orizzontale: false },
  perAnno: { titolo: 'Domande per anno di raccolta', caption: 'Domande per anno di raccolta', colonna: 'Anno di raccolta', unita: ['anno', 'anni'], filtro: 'anno', orizzontale: false },
};

/** Voci che il filtro del grafico non accetta: si mostrano, ma il clic non filtra. */
const NON_FILTRABILI: Record<Ripartizione, ReadonlySet<string>> = {
  perStato: new Set(['ALTRI', 'SENZA_STATO']),
  perIntervento: new Set(['ALTRI']),
  perAnno: new Set(['ALTRI']),
};

/** Nome della voce sul grafico e nella tabella: "SRA01", "Rilasciato", "2025", "senza anno", "altre voci (8)". */
export function nomeVoce(r: Ripartizione, v: Voce): string {
  const chiave = v.chiave ?? '';
  if (chiave === ANNO_SENZA) return ANNO_ASSENTE.breve.toLowerCase();
  if (chiave === 'SENZA_STATO') return 'senza stato SIAN';
  if (chiave === 'ALTRI') return v.descrizione ?? 'altre voci';
  if (r === 'perStato') return v.descrizione ?? chiave;
  return chiave;
}

/** Valore del filtro che il clic sulla voce aggiunge, oppure undefined se la voce non si filtra. */
export function filtroDellaVoce(r: Ripartizione, v: Voce): string | undefined {
  const chiave = v.chiave ?? '';
  return chiave && !NON_FILTRABILI[r].has(chiave) ? chiave : undefined;
}

/** Valore del filtro portato dalla barra cliccata (solo dal codice del dato: una voce senza codice non filtra mai, nemmeno
 *  col suo nome, a differenza di codiceDalClic del kit). */
export function filtroDalClic(p: { data?: unknown }): string | undefined {
  const dato = p.data;
  if (typeof dato !== 'object' || dato === null) return undefined;
  const codice: unknown = (dato as { codice?: unknown }).codice;
  return typeof codice === 'string' && codice !== '' ? codice : undefined;
}

/** Grafico a barre di una ripartizione del sinottico; la tabella equivalente porta tutte le voci, anche le non filtrabili. */
export function graficoRipartizione(r: Ripartizione, voci: readonly Voce[] | undefined): DatiGrafico {
  const t = TESTI_RIPARTIZIONE[r];
  const elenco = voci ?? [];
  const tabella: TabellaEquivalente = {
    caption: t.caption,
    colonne: [t.colonna, 'Domande'],
    righe: elenco.map((v) => [r === 'perIntervento' && v.descrizione && v.chiave !== 'ALTRI' ? `${v.chiave} ${v.descrizione}` : nomeVoce(r, v), valoreInNumero(v.domande ?? 0)]),
  };
  if (elenco.length === 0) return nonDisegnabile('nessuna domanda con questi filtri', tabella, []);
  const categorie = elenco.map((v) => nomeVoce(r, v));
  const dati = elenco.map(
    (v, k): DatoSerie => ({
      value: v.domande ?? 0,
      name: categorie[k],
      codice: filtroDellaVoce(r, v),
      dettaglio: `${categorie[k]}: ${plurale(v.domande ?? 0, 'domanda', 'domande')}`,
      ...(filtroDellaVoce(r, v) ? {} : { itemStyle: { color: COLORI.neutro } }),
    }),
  );
  const totale = elenco.reduce((s, v) => s + (v.domande ?? 0), 0);
  const descrizione = `${t.titolo}: ${plurale(elenco.length, t.unita[0], t.unita[1])}, ${plurale(totale, 'domanda', 'domande')} in tutto.`;
  const serie: BarSeriesOption = { type: 'bar', name: 'Domande', data: dati };
  const asseCategorie = { type: 'category' as const, data: categorie, ...(t.orizzontale ? { inverse: true } : { axisLabel: { interval: 0, rotate: categorie.length > 8 ? 45 : 0 } }) };
  const opzioni: EChartsOption = {
    aria: aria(descrizione),
    tooltip: { trigger: 'item', valueFormatter: valoreInNumero },
    ...(t.orizzontale ? {} : zoomSeMolti(categorie.length)),
    xAxis: t.orizzontale ? { type: 'value' } : asseCategorie,
    yAxis: t.orizzontale ? asseCategorie : { type: 'value' },
    series: [serie],
  };
  return { opzioni, tabella, omessi: [] };
}

function tabellaAmmessoPagato(d: Domanda): TabellaEquivalente {
  return {
    caption: "Dall'ammesso al pagato",
    colonne: ['Voce', 'Importo'],
    righe: [
      ['Ammesso', cellaImporto(d.ammesso)],
      ['Pagato', cellaImporto(d.pagato)],
      ['Ancora da pagare', cellaImporto(d.ancoraDaPagare)],
    ],
  };
}

/** Perche' la cascata non si disegna (ammesso o pagato assenti, importi negativi), null se si disegna. */
function motivoSenzaCascata(d: Domanda, ammesso: number | null, pagato: number | null): string | null {
  if (ammesso == null || pagato == null) {
    const mancanti = [ammesso == null ? `ammesso ${cellaImporto(d.ammesso)}` : null, pagato == null ? `pagato ${cellaImporto(d.pagato)}` : null];
    return `la cascata richiede ammesso e pagato; ${mancanti.filter(Boolean).join(', ')}`;
  }
  return ammesso < 0 || pagato < 0 ? 'importi negativi: la cascata non si può disegnare' : null;
}

const valoreDi = (importo: Domanda['ammesso']): number | null => importo?.valore ?? null;

function passiCascata(ammesso: number, pagato: number, residuo: number | null): PassoCascata[] {
  const passi: PassoCascata[] = [
    { nome: 'Ammesso', valore: ammesso, base: 0, colore: COLORI.scuro },
    // pagato oltre l'ammesso: la barra parte da zero (non c'e' una base negativa)
    { nome: 'Pagato', valore: pagato, base: pagato <= ammesso ? centesimi(ammesso - pagato) : 0, colore: COLORI.positivo },
  ];
  if (residuo != null) passi.push({ nome: 'Ancora da pagare', valore: residuo, base: 0, colore: COLORI.attenzione });
  return passi;
}

/** Cascata della scheda: ammesso -> pagato -> ancora da pagare. Senza ammesso o pagato resta la tabella con il motivo. */
export function graficoAmmessoPagato(d: Domanda): DatiGrafico {
  const tabella = tabellaAmmessoPagato(d);
  const ammesso = valoreDi(d.ammesso);
  const pagato = valoreDi(d.pagato);
  const motivo = motivoSenzaCascata(d, ammesso, pagato);
  if (motivo !== null || ammesso == null || pagato == null) return nonDisegnabile(motivo ?? 'la cascata non si può disegnare', tabella, []);
  const passi = passiCascata(ammesso, pagato, valoreDi(d.ancoraDaPagare));
  return { opzioni: opzioniCascata(passi, descrizioneCascata("Dall'ammesso al pagato", passi, [])), tabella, omessi: [] };
}
