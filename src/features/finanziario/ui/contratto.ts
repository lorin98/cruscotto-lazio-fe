// contratto.ts — controlli STATICI (solo tipi, nessun codice a runtime) tra i tipi scritti a mano nei layer puri e i
// DTO della spec sigillata: se la spec rinomina un campo, la compilazione fallisce invece di mostrare "non disponibile"
// ovunque (review step9 H-17 e H-24). Sta in ui/ perche' i layer puri (lib, entities) non importano dal confine api/.
import type { ImportoLike } from '../../../entities/importo';
import type {
  AvanzamentoPagamenti,
  DistribuzioneDotazione,
  DomandePerAnnoRiga,
  DomandeSigc,
  Importo,
  ImportiPerAnnoRiga,
  ImportiSigc,
  MonitoraggioRiserva,
  ResiduoSuImpegni,
  ResiduoSuPagamenti,
  RiepilogoFinanziario,
  RiepilogoFinanziarioRiga,
  SpesaPerInterventoRiga,
  UtilizzoRiserva,
  VerificaSmpRiga,
} from '../api';
import type {
  AvanzamentoPagamentiLike,
  DistribuzioneDotazioneLike,
  DomandeSigcLike,
  ImportiSigcLike,
  ResiduoSuImpegniLike,
  ResiduoSuPagamentiLike,
  RigaDomandeAnno,
  RigaImportiAnno,
  RigaRiepilogo,
  RigaSmp,
  RigaSpesa,
  RiservaLike,
} from '../lib/grafici';
import type { Perimetro } from '../lib/perimetro';
import type { FaseRiserva } from '../lib/riserva';

type Uguali<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;
/** Ogni campo della forma scritta a mano esiste nel DTO (la forma puo' leggerne solo una parte). */
type Contenuta<Forma, Dto> = [Exclude<keyof Forma, keyof Dto>] extends [never] ? true : false;

export const CONTRATTO_IMPORTO: Uguali<keyof Importo, keyof ImportoLike> = true;
export const CONTRATTO_FASE: Uguali<NonNullable<MonitoraggioRiserva['fase']>, FaseRiserva> = true;
export const CONTRATTO_PERIMETRO: Uguali<NonNullable<RiepilogoFinanziario['perimetro']>, Perimetro> = true;

export const CONTRATTO_RIGA_SPESA: Contenuta<RigaSpesa, SpesaPerInterventoRiga> = true;
export const CONTRATTO_RIGA_RIEPILOGO: Contenuta<RigaRiepilogo, RiepilogoFinanziarioRiga> = true;
export const CONTRATTO_DOMANDE_ANNO: Contenuta<RigaDomandeAnno, DomandePerAnnoRiga> = true;
export const CONTRATTO_IMPORTI_ANNO: Contenuta<RigaImportiAnno, ImportiPerAnnoRiga> = true;
export const CONTRATTO_DOMANDE_SIGC: Contenuta<DomandeSigcLike, DomandeSigc> = true;
export const CONTRATTO_IMPORTI_SIGC: Contenuta<ImportiSigcLike, ImportiSigc> = true;
export const CONTRATTO_DOMANDE_SENZA: Contenuta<NonNullable<ImportiSigcLike['domandeSenza']>, NonNullable<ImportiSigc['domandeSenza']>> = true;
export const CONTRATTO_RESIDUO_IMPEGNI: Contenuta<ResiduoSuImpegniLike, ResiduoSuImpegni> = true;
export const CONTRATTO_PAGAMENTI: Contenuta<AvanzamentoPagamentiLike, AvanzamentoPagamenti> = true;
export const CONTRATTO_RESIDUO_PAGAMENTI: Contenuta<ResiduoSuPagamentiLike, ResiduoSuPagamenti> = true;
export const CONTRATTO_DISTRIBUZIONE: Contenuta<DistribuzioneDotazioneLike, DistribuzioneDotazione> = true;
export const CONTRATTO_RISERVA: Contenuta<RiservaLike, MonitoraggioRiserva> = true;
export const CONTRATTO_UTILIZZO: Contenuta<NonNullable<RiservaLike['utilizzoProgressivo']>[number], UtilizzoRiserva> = true;
export const CONTRATTO_RIGA_SMP: Contenuta<RigaSmp, VerificaSmpRiga> = true;
