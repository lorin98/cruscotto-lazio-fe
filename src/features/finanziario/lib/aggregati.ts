// aggregati.ts — totali e indicatori calcolati dal frontend, funzioni PURE (zero React). Regola unica, come quella del
// backend per i totali (SC-FI_DISTRIBUZIONE): niente somme parziali. Se manca anche un solo valore il totale non e'
// calcolabile e lo si dice con gli interventi che mancano; la quota pagata sulla dotazione e' la stessa media
// ponderata del grafico dell'avanzamento (stessi interventi inclusi ed esclusi).
import type { ImportoLike } from '../../../entities/importo';
import { centesimi, formatEuro, formatNumber, plurale } from '../../../shared/lib';
import { avanzamentoPonderato } from './avanzamento';
import type { RigaImportiAnno, RigaSpesa } from './dto';
import { assenzaImporto, codiceDi, valoreDi } from './importi';
import { PERIMETRO_ADA } from './perimetro';

/** Un totale o un indicatore: il valore, oppure null con il motivo (frase completa, con l'iniziale maiuscola). */
export interface Aggregato {
  valore: number | null;
  motivo?: string;
  /** Precisazione sul valore (es. su quanti interventi e' calcolato). */
  nota?: string;
}

/** Somma di numeri solo se ognuno e' noto: con anche un solo assente il risultato e' null. */
export function sommaSeCompleta(valori: ReadonlyArray<number | null | undefined>): number | null {
  return valori.every((v): v is number => typeof v === 'number' && Number.isFinite(v)) ? centesimi(valori.reduce((a, v) => a + v, 0)) : null;
}

/** Totale di un Importo per intervento: "non calcolabile" con gli interventi senza valore, mai una somma parziale. */
export function totaleImporti<T extends { codiceIntervento?: string }>(righe: readonly T[], importo: (r: T) => ImportoLike | null | undefined): Aggregato {
  if (righe.length === 0) return { valore: null, motivo: 'Non calcolabile: nessun intervento nella selezione' };
  const mancanti = righe.filter((r) => valoreDi(importo(r)) == null).map(codiceDi);
  if (mancanti.length > 0) {
    const elenco = mancanti.length <= 3 ? ` (${mancanti.join(', ')})` : '';
    return { valore: null, motivo: `Non calcolabile: manca per ${plurale(mancanti.length, 'intervento', 'interventi')}${elenco}` };
  }
  return { valore: sommaSeCompleta(righe.map((r) => valoreDi(importo(r)))) };
}

/** Quota pagata sulla dotazione (0-100): la media ponderata del grafico; col perimetro ADA non confrontabile. */
export function quotaPagata(righe: readonly RigaSpesa[], perimetro?: string | null): Aggregato {
  if (perimetro === PERIMETRO_ADA) return { valore: null, motivo: "Non confrontabile: dotazione regionale e pagamenti dell'area (perimetro ADA)" };
  const a = avanzamentoPonderato(righe);
  if (a.media == null) return { valore: null, motivo: 'Non calcolabile: nessun intervento con dotazione positiva e pagato valorizzato' };
  const nota = a.omessi.length > 0 ? `media ponderata su ${a.incluse.length} di ${plurale(righe.length, 'intervento', 'interventi')}` : 'media ponderata degli interventi';
  return { valore: a.media, nota };
}

export interface KpiSpesa {
  dotazione: Aggregato;
  pagato: Aggregato;
  quota: Aggregato;
}

/** Indicatori della panoramica dalle righe di TX-0002. */
export function kpiSpesa(righe: readonly RigaSpesa[], perimetro?: string | null): KpiSpesa {
  return {
    dotazione: totaleImporti(righe, (r) => r.dotazioneSpesaPubblica),
    pagato: totaleImporti(righe, (r) => r.pagamentiTotali),
    quota: quotaPagata(righe, perimetro),
  };
}

/**
 * Cella di un totale di colonna: la somma se ogni riga ha il valore; se nessuna riga lo ha e tutte hanno lo stesso motivo
 * (fonte non attiva, fuori perimetro) quel motivo; altrimenti "non calcolabile" (un dato manca per alcuni interventi).
 */
export function cellaTotale<T>(righe: readonly T[], importo: (r: T) => ImportoLike | null | undefined): string {
  const somma = sommaSeCompleta(righe.map((r) => valoreDi(importo(r))));
  if (somma !== null) return formatEuro(somma);
  const assenti = righe.map(importo);
  const motivi = new Set(assenti.map((i) => i?.motivo ?? null));
  const unico = assenti.every((i) => valoreDi(i) == null) && motivi.size === 1 && !motivi.has('NON_VALORIZZATO') && !motivi.has(null);
  return unico ? assenzaImporto(assenti[0], true) : 'non calcolabile';
}

export interface KpiImportiPerAnno {
  ammesso: Aggregato;
  stanziato: Aggregato & { importo?: ImportoLike | null };
}

/** Nota sulle domande senza importo ammesso: quante sono (non entrano nella somma) o che il conteggio manca. */
export function notaSenzaAmmesso(righe: readonly RigaImportiAnno[]): string {
  const senza = sommaSeCompleta(righe.map((r) => r.domandeSenzaAmmesso));
  if (senza === null) return 'domande senza importo ammesso: conteggio non disponibile per almeno un anno';
  if (senza === 0) return 'somma degli anni di raccolta';
  return `${formatNumber(senza)} ${senza === 1 ? 'domanda senza importo ammesso: non entra' : 'domande senza importo ammesso: non entrano'} nella somma`;
}

/** KPI della pagina Domande da TX-0010: ammesso e stanziato come somme degli anni, mai parziali. */
export function kpiImportiPerAnno(righe: readonly RigaImportiAnno[]): KpiImportiPerAnno {
  const ammesso = sommaSeCompleta(righe.map((r) => valoreDi(r.importoAmmesso)));
  const stanziato = sommaSeCompleta(righe.map((r) => valoreDi(r.importoStanziato)));
  return {
    ammesso: ammesso === null ? { valore: null, motivo: 'Non calcolabile: manca per almeno un anno di raccolta', nota: notaSenzaAmmesso(righe) } : { valore: ammesso, nota: notaSenzaAmmesso(righe) },
    // senza somma lo stanziato porta l'Importo del primo anno che manca: la tessera ne dice il motivo (fonte non attiva)
    stanziato: stanziato === null ? { valore: null, importo: righe.find((r) => valoreDi(r.importoStanziato) == null)?.importoStanziato } : { valore: stanziato, nota: 'somma degli anni di raccolta' },
  };
}
