// contratto.ts — controlli STATICI (solo tipi, nessun codice a runtime) tra le forme scritte a mano nei layer puri
// (lib/dto.ts) e i DTO della spec sigillata di TX-0056..TX-0060: se la spec rinomina un campo, la compilazione fallisce
// invece di mostrare "non disponibile" ovunque. Sta in ui/ perche' i layer puri non importano dal confine api/.
import type {
  DomandaElenco,
  PagamentoElenco,
  ResponsabileProcedimento,
  SinotticoElenco,
  SommaElenco,
  SuperficieElenco,
  TotaliPagamenti,
  ValoriFiltriElenco,
  VoceFiltro,
  VoceRipartizione,
} from '../api';
import type { DatoSenzaFonte, Domanda, Pagamento, Sinottico, Somma, Totali, Valori, Voce, VoceValore } from '../lib/dto';

type Uguali<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;
/** Ogni campo della forma scritta a mano esiste nel DTO (la forma puo' leggerne solo una parte). */
type Contenuta<Forma, Dto> = [Exclude<keyof Forma, keyof Dto>] extends [never] ? true : false;

export const CONTRATTO_DOMANDA: Contenuta<Domanda, DomandaElenco> = true;
export const CONTRATTO_PAGAMENTO: Contenuta<Pagamento, PagamentoElenco> = true;
export const CONTRATTO_SINOTTICO: Contenuta<Sinottico, SinotticoElenco> = true;
export const CONTRATTO_SOMMA: Contenuta<Somma, SommaElenco> = true;
export const CONTRATTO_TOTALI: Contenuta<Totali, TotaliPagamenti> = true;
export const CONTRATTO_VOCE: Contenuta<Voce, VoceRipartizione> = true;
export const CONTRATTO_VALORI: Contenuta<Valori, ValoriFiltriElenco> = true;
export const CONTRATTO_VOCE_FILTRO: Contenuta<VoceFiltro, VoceValore> = true;
export const CONTRATTO_SUPERFICIE: Uguali<keyof SuperficieElenco, keyof DatoSenzaFonte<number>> = true;
export const CONTRATTO_RESPONSABILE: Uguali<keyof ResponsabileProcedimento, keyof DatoSenzaFonte<string>> = true;
