// contratto.ts — controlli STATICI (solo tipi, nessun codice a runtime) tra i tipi scritti a mano nei layer puri e i
// DTO della spec sigillata: se la spec rinomina un campo dell'Importo o aggiunge una fase/un perimetro, la compilazione
// fallisce invece di mostrare "non disponibile" ovunque (review step9 H-17). Sta in ui/ perche' i layer puri (lib,
// entities) non importano dal confine api/.
import type { ImportoLike } from '../../../entities/importo';
import type { Importo, MonitoraggioRiserva, RiepilogoFinanziario } from '../api';
import type { FaseRiserva, Perimetro } from '../lib/filtri';

type Uguali<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;

export const CONTRATTO_IMPORTO: Uguali<keyof Importo, keyof ImportoLike> = true;
export const CONTRATTO_FASE: Uguali<NonNullable<MonitoraggioRiserva['fase']>, FaseRiserva> = true;
export const CONTRATTO_PERIMETRO: Uguali<NonNullable<RiepilogoFinanziario['perimetro']>, Perimetro> = true;
