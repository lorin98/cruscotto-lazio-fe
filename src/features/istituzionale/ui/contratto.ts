// contratto.ts — controlli STATICI (solo tipi, nessun codice a runtime) fra le forme scritte a mano nei layer puri
// (lib/dto.ts) e i DTO della spec sigillata di TX-0016 e TX-0017: se la spec rinomina un campo, la compilazione fallisce
// invece di mostrare un dato assente in pagina. Sta in ui/ perche' i layer puri non importano dal confine api/.
import type { ImportoUnitarioUnitAmount, MonitoraggioOutput, MonitoraggioOutputAnno, MonitoraggioOutputRiga, VerificaSmpNonSigc, VerificaSmpNonSigcRiga } from '../api';
import type { AnnoOutput, ImportoUnitario, Output, RigaOutput, RigaVerifica, Verifica } from '../lib/dto';

type Uguali<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;
/** Il DTO si puo' passare dove serve la forma (i tipi dei campi sono compatibili). */
type Assegnabile<Dto, Forma> = [Dto] extends [Forma] ? true : false;

export const CONTRATTO_RIGA_VERIFICA: Uguali<keyof RigaVerifica, keyof VerificaSmpNonSigcRiga> = true;
export const CONTRATTO_VERIFICA: Uguali<keyof Verifica, keyof VerificaSmpNonSigc> = true;
export const CONTRATTO_ANNO: Uguali<keyof AnnoOutput, keyof MonitoraggioOutputAnno> = true;
export const CONTRATTO_IMPORTO_UNITARIO: Uguali<keyof ImportoUnitario, keyof ImportoUnitarioUnitAmount> = true;
export const CONTRATTO_RIGA_OUTPUT: Uguali<keyof RigaOutput, keyof MonitoraggioOutputRiga> = true;
export const CONTRATTO_OUTPUT: Uguali<keyof Output, keyof MonitoraggioOutput> = true;
export const ASSEGNABILE_VERIFICA: Assegnabile<VerificaSmpNonSigc, Verifica> = true;
export const ASSEGNABILE_OUTPUT: Assegnabile<MonitoraggioOutput, Output> = true;
