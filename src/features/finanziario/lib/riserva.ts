// riserva.ts — resa PURA della riserva al 5% (RF014) allineata al backend: la FASE e' calcolata al giorno della
// consultazione, gli IMPORTI sono quelli dell'istantanea estratta il giorno dataEstrazione (MonitoraggioRiserva).
// Congelato e residuo sono null finche' l'istantanea precede il congelamento (30/06/n+1); il residuo c'e' gia' dal
// congelamento ma diventa disponibile solo dal 01/01/n+2, se la riserva non e' utilizzata tutta entro il 31/12/n+1. Le date
// dei testi sono in gg/mm/aaaa come ogni data del cruscotto (dal 04/11/2026; prima "1/10/2025").
// Date ISO (AAAA-MM-GG): il confronto fra stringhe ISO e' cronologico.
import { centesimi, formatDate, formatEuro, maiuscolaIniziale, numeroDi } from '../../../shared/lib';
import type { RiservaLike } from './dto';

// ---------------------------------------------------------------- montante, riserva 5% e residuo 2% (R17)

/** La natura di un valore della riserva (enum della spec): previsione prima della data, consuntivo dopo. */
export const NATURA_RISERVA: Record<string, string> = { PREVISIONE: 'Previsione', CONSUNTIVO: 'Consuntivo' };

/** Il valore di una quota del montante (montante x quota) al centesimo; null se manca uno dei due. */
function quotaDelMontante(m: RiservaLike, quota: number | null | undefined): number | null {
  const [montante, q] = [numeroDi(m.montantePagamenti), numeroDi(quota)];
  return montante == null || q == null ? null : centesimi(montante * q);
}

/** La riserva del 5% del riquadro R17: montante x quotaRiserva, null senza uno dei due (niente ripieghi: review V1-09). */
export function riservaDelMontante(m: RiservaLike): number | null {
  return quotaDelMontante(m, m.quotaRiserva);
}

/**
 * La soglia del grafico dell'utilizzo col suo nome: la riserva del 5% (montante x quota) o, senza montante o quota, la
 * riserva accumulata, chiamata per quello che e' (review V1-09 e passata 2: mai "Riserva del 5%" su un altro importo).
 */
export function sogliaRiserva(m: RiservaLike): { valore: number | null; nome: string } {
  const riserva = riservaDelMontante(m);
  if (riserva != null) return { valore: riserva, nome: `Riserva del ${testoQuota(m.quotaRiserva, '5%')}` };
  const accumulato = numeroDi(m.importoAccumulato);
  return accumulato == null ? { valore: null, nome: 'Riserva del 5%' } : { valore: accumulato, nome: 'Riserva accumulata (montante o quota non disponibili)' };
}

/** Il valore della soglia del grafico dell'utilizzo (sogliaRiserva). */
export function valoreRiserva(m: RiservaLike): number | null {
  return sogliaRiserva(m).valore;
}

/** Il residuo del 2% (montante x quotaResiduo). */
export function valoreResiduo(m: RiservaLike): number | null {
  return quotaDelMontante(m, m.quotaResiduo);
}

/** "5%" dalla quota del contratto (0.05). */
export function testoQuota(quota: number | null | undefined, ripiego: string): string {
  return quota == null ? ripiego : `${Math.round(quota * 1000) / 10}%`.replace('.', ',');
}

/** Le note dei due riquadri: come si calcola il valore e da quando e' consuntivo (date del calendario dell'anno n). */
export function noteQuoteRiserva(n: number, m: RiservaLike): { riserva: string; residuo: string } {
  const c = calendarioRiserva(n);
  return {
    riserva: `= ${testoQuota(m.quotaRiserva, '5%')} x montante; congelata il ${formatDate(c.congelamento)}: da quella data il valore è consuntivo, prima è una previsione`,
    // come il backend (CalcoloRiserva): il residuo disponibile e' questo importo se la riserva non e' usata tutta, altrimenti zero (review X-07)
    residuo: `= ${testoQuota(m.quotaResiduo, '2%')} x montante; consuntivo dall'inizio della fase di residuo (${formatDate(c.inizioResiduo)}), prima è una previsione. Il residuo disponibile qui sotto vale questo importo se la riserva non è stata utilizzata tutta entro il ${formatDate(c.fineUtilizzo)}, altrimenti zero`,
  };
}

/** Fasi della riserva al 5% (enum della spec, RF014). */
export type FaseRiserva = 'NON_INIZIATA' | 'ACCUMULO' | 'UTILIZZO' | 'RESIDUO';

/** Calendario della riserva dell'anno n (date ISO): l'unica fonte delle date delle fasi. */
export function calendarioRiserva(n: number) {
  return {
    inizioAccumulo: `${n}-10-01`,
    congelamento: `${n + 1}-06-30`,
    inizioUtilizzo: `${n + 1}-07-01`,
    fineUtilizzo: `${n + 1}-12-31`,
    inizioResiduo: `${n + 2}-01-01`,
  };
}

/** Data ISO nei testi e nelle fasce della riserva, in gg/mm/aaaa come ogni data del cruscotto: 2025-10-01 -> "01/10/2025". */
export function dataBreve(iso: string): string {
  return formatDate(iso);
}

const FASI_RISERVA: Record<FaseRiserva, (n: number) => string> = {
  NON_INIZIATA: (n) => `non iniziata (l'accumulo parte il ${dataBreve(calendarioRiserva(n).inizioAccumulo)})`,
  ACCUMULO: (n) => `accumulo (dal ${dataBreve(calendarioRiserva(n).inizioAccumulo)} al ${dataBreve(calendarioRiserva(n).congelamento)})`,
  UTILIZZO: (n) => `utilizzo (fino al ${dataBreve(calendarioRiserva(n).fineUtilizzo)})`,
  RESIDUO: (n) => `residuo (2% del montante, dal ${dataBreve(calendarioRiserva(n).inizioResiduo)})`,
};

/** Etichetta della fase con le date dell'anno n della riserva. */
export function etichettaFaseRiserva(fase: FaseRiserva | null | undefined, anno: number): string {
  // una fase che il contratto non conosce (nuovo valore dell'enum) resta "non disponibile", non un errore
  return fase && Object.hasOwn(FASI_RISERVA, fase) ? FASI_RISERVA[fase](anno) : 'non disponibile';
}

/** Testo d'aiuto del selettore dell'anno: le fasi in generale o con le date dell'anno scelto. */
export function aiutoRiserva(n?: number): string {
  if (n === undefined) return 'Accumulo dal 1 ottobre n al 30 giugno n+1, utilizzo fino al 31 dicembre n+1, residuo dal 1 gennaio n+2.';
  const c = calendarioRiserva(n);
  return `Per il ${n}: accumulo dal ${dataBreve(c.inizioAccumulo)} al ${dataBreve(c.congelamento)}, utilizzo fino al ${dataBreve(c.fineUtilizzo)}, residuo dal ${dataBreve(c.inizioResiduo)}.`;
}

/** Primo giorno della fase per l'anno n della riserva (null per NON_INIZIATA). */
export function inizioFase(fase: FaseRiserva | null | undefined, n: number): string | null {
  const c = calendarioRiserva(n);
  const inizi: Partial<Record<FaseRiserva, string>> = { ACCUMULO: c.inizioAccumulo, UTILIZZO: c.inizioUtilizzo, RESIDUO: c.inizioResiduo };
  return (fase && inizi[fase]) ?? null;
}

/** Vero se l'istantanea e' stata estratta prima dell'inizio della fase attuale (i suoi valori sono di una fase precedente). */
export function istantaneaAnteriore(fase: FaseRiserva | null | undefined, n: number, dataEstrazione: string | null | undefined): boolean {
  const inizio = inizioFase(fase, n);
  return !!inizio && !!dataEstrazione && dataEstrazione < inizio;
}

const alla = (dataEstrazione: string | null | undefined) => (dataEstrazione ? `all'estrazione del ${formatDate(dataEstrazione)}` : "nell'istantanea");

export function testoCongelato(v: number | null | undefined, n: number, dataEstrazione: string | null | undefined): string {
  return v == null ? `non ancora congelato ${alla(dataEstrazione)}: si congela al ${dataBreve(calendarioRiserva(n).congelamento)}` : formatEuro(v);
}

export function testoResiduo(v: number | null | undefined, n: number, dataEstrazione: string | null | undefined, oggi: string): string {
  const c = calendarioRiserva(n);
  if (v == null) return `non ancora calcolato ${alla(dataEstrazione)}: si calcola al congelamento del ${dataBreve(c.congelamento)}`;
  if (oggi < c.inizioResiduo) {
    return `${formatEuro(v)} previsto: disponibile dal ${dataBreve(c.inizioResiduo)} se la riserva non è utilizzata completamente entro il ${dataBreve(c.fineUtilizzo)}`;
  }
  return formatEuro(v);
}

/** Vero se l'utilizzato supera la riserva (congelato, o accumulato prima del congelamento). */
export function utilizzoOltreRiserva(d: { importoUtilizzato?: number | null; importoCongelato?: number | null; importoAccumulato?: number | null }): boolean {
  const riserva = d.importoCongelato ?? d.importoAccumulato;
  return d.importoUtilizzato != null && riserva != null && d.importoUtilizzato > riserva;
}

export interface ValoreKpiRiserva {
  valore: number | null;
  /** Assenza gia' composta (frase con l'iniziale maiuscola), se il valore manca. */
  assente?: string;
  nota?: string;
}

export interface KpiRiserva {
  accumulato: ValoreKpiRiserva;
  congelato: ValoreKpiRiserva;
  utilizzato: ValoreKpiRiserva & { oltreRiserva: boolean };
  residuo: ValoreKpiRiserva;
}

function valoreKpi(valore: number | null | undefined, assente: () => string, nota?: string): ValoreKpiRiserva {
  return valore == null ? { valore: null, assente: assente(), nota } : { valore, nota };
}

/** I quattro KPI della riserva dell'anno n: valori, assenze spiegate (quando ci saranno) e residuo "previsto" fino al 1/1/n+2. */
export function kpiRiserva(
  d: { fase?: FaseRiserva | null; dataEstrazione?: string | null; importoAccumulato?: number | null; importoCongelato?: number | null; importoUtilizzato?: number | null; importoResiduoDisponibile?: number | null },
  anno: number,
  oggi: string,
): KpiRiserva {
  const inizioResiduo = calendarioRiserva(anno).inizioResiduo;
  const oltreRiserva = utilizzoOltreRiserva(d);
  const previsto = d.importoResiduoDisponibile != null && oggi < inizioResiduo;
  return {
    accumulato: valoreKpi(d.importoAccumulato, () => 'Non disponibile', `Fase: ${etichettaFaseRiserva(d.fase, anno)}`),
    congelato: valoreKpi(d.importoCongelato, () => maiuscolaIniziale(testoCongelato(null, anno, d.dataEstrazione))),
    utilizzato: { ...valoreKpi(d.importoUtilizzato, () => 'Non disponibile', oltreRiserva ? 'Supera la riserva di questa estrazione' : undefined), oltreRiserva },
    residuo: valoreKpi(d.importoResiduoDisponibile, () => maiuscolaIniziale(testoResiduo(null, anno, d.dataEstrazione, oggi)), previsto ? `Previsto: disponibile dal ${dataBreve(inizioResiduo)}` : undefined),
  };
}
