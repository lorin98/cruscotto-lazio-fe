// aggregati.ts — totali e indicatori calcolati dal frontend, funzioni PURE (zero React). Regola unica, come quella del
// backend per i totali (SC-FI_DISTRIBUZIONE): niente somme parziali. Se manca anche un solo valore il totale non e'
// calcolabile e lo si dice con gli interventi che mancano; la quota pagata sulla dotazione e' la stessa media
// ponderata del grafico dell'avanzamento (stessi interventi inclusi ed esclusi).
import type { ImportoLike } from '../../../entities/importo';
import { centesimi, plurale } from '../../../shared/lib';
import { avanzamentoPonderato } from './grafici/spesa';
import type { RigaSpesa } from './grafici/dto';
import { codiceDi, valoreDi } from './grafici/resa';

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
  if (perimetro === 'ADA') return { valore: null, motivo: "Non confrontabile: dotazione regionale e pagamenti dell'area (perimetro ADA)" };
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
