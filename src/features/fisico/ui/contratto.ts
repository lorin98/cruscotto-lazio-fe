// contratto.ts — controlli STATICI (solo tipi, nessun codice a runtime) fra le forme scritte a mano nei layer puri
// (lib/dto.ts) e i DTO della spec sigillata di TX-0018 e TX-0020: se la spec rinomina un campo, la compilazione fallisce
// invece di mostrare un dato assente in pagina. Sta in ui/ perche' i layer puri non importano dal confine api/.
import type { DeterminaDellaDomanda, DetermineDomanda, SuperficieAmmissibile, SuperficieCampagna, SuperficieIntervento } from '../api';
import type { CampagnaSuperficie, Determina, Determine, InterventoSuperficie, Superfici } from '../lib/dto';

type Uguali<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;
/** Ogni campo della forma scritta a mano esiste nel DTO. */
type Contenuta<Forma, Dto> = [Exclude<keyof Forma, keyof Dto>] extends [never] ? true : false;
/** Il DTO si puo' passare dove serve la forma (i tipi dei campi sono compatibili). */
type Assegnabile<Dto, Forma> = [Dto] extends [Forma] ? true : false;

export const CONTRATTO_CAMPAGNA: Uguali<keyof CampagnaSuperficie, keyof SuperficieCampagna> = true;
export const CONTRATTO_INTERVENTO: Uguali<keyof InterventoSuperficie, keyof SuperficieIntervento> = true;
export const CONTRATTO_SUPERFICI: Uguali<keyof Superfici, keyof SuperficieAmmissibile> = true;
export const CONTRATTO_DETERMINA: Uguali<keyof Determina, keyof DeterminaDellaDomanda> = true;
export const CONTRATTO_DETERMINE: Contenuta<Determine, DetermineDomanda> = true;
export const ASSEGNABILE_SUPERFICI: Assegnabile<SuperficieAmmissibile, Superfici> = true;
export const ASSEGNABILE_DETERMINE: Assegnabile<DetermineDomanda, Determine> = true;
