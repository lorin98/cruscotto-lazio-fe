// contratto.ts — controlli STATICI (solo tipi, nessun codice a runtime) fra le forme scritte a mano nei layer puri
// (lib/dto.ts) e i DTO della spec sigillata di TX-0018, TX-0017 e TX-0030 (le ultime due dal 29/10/2026): se la spec
// rinomina un campo, la compilazione fallisce invece di mostrare un dato assente in pagina. Sta in ui/ perche' i layer
// puri non importano dal confine api/.
import type { Filtri } from '../../../entities/filtri';
import type {
  CriteriOutput,
  CriteriUnitAmount,
  ImportoUnitarioUnitAmount,
  MonitoraggioOutput,
  MonitoraggioOutputAnno,
  MonitoraggioOutputRiga,
  PagamentiUnitAmount,
  PagamentiUnitAmountRiga,
  SuperficieAmmissibile,
  SuperficieCampagna,
  SuperficieIntervento,
} from '../api';
import type { AnnoOutput, CampagnaSuperficie, ImportoUnitario, InterventoSuperficie, Output, RigaOutput, RigaUnitAmount, Superfici, UnitAmount } from '../lib/dto';

type Uguali<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;
/** Il DTO si puo' passare dove serve la forma (i tipi dei campi sono compatibili). */
type Assegnabile<Dto, Forma> = [Dto] extends [Forma] ? true : false;

export const CONTRATTO_CAMPAGNA: Uguali<keyof CampagnaSuperficie, keyof SuperficieCampagna> = true;
export const CONTRATTO_INTERVENTO: Uguali<keyof InterventoSuperficie, keyof SuperficieIntervento> = true;
export const CONTRATTO_SUPERFICI: Uguali<keyof Superfici, keyof SuperficieAmmissibile> = true;
export const ASSEGNABILE_SUPERFICI: Assegnabile<SuperficieAmmissibile, Superfici> = true;
// TX-0017 (output regionale)
export const CONTRATTO_ANNO: Uguali<keyof AnnoOutput, keyof MonitoraggioOutputAnno> = true;
export const CONTRATTO_IMPORTO_UNITARIO: Uguali<keyof ImportoUnitario, keyof ImportoUnitarioUnitAmount> = true;
export const CONTRATTO_RIGA_OUTPUT: Uguali<keyof RigaOutput, keyof MonitoraggioOutputRiga> = true;
export const CONTRATTO_OUTPUT: Uguali<keyof Output, keyof MonitoraggioOutput> = true;
export const ASSEGNABILE_OUTPUT: Assegnabile<MonitoraggioOutput, Output> = true;
// TX-0030 (Unit Amount)
export const CONTRATTO_RIGA_UNIT_AMOUNT: Uguali<keyof RigaUnitAmount, keyof PagamentiUnitAmountRiga> = true;
export const CONTRATTO_UNIT_AMOUNT: Uguali<keyof UnitAmount, keyof PagamentiUnitAmount> = true;
export const ASSEGNABILE_UNIT_AMOUNT: Assegnabile<PagamentiUnitAmount, UnitAmount> = true;
// i criteri delle letture: le chiavi dei filtri del programma sono i parametri della spec (TX-0030 ha anche l'azione,
// che la pagina delle Unit Amount per ora non manda)
export const CONTRATTO_CRITERI_OUTPUT: Uguali<keyof Filtri, keyof CriteriOutput> = true;
export const CONTRATTO_CRITERI_UNIT_AMOUNT: Uguali<keyof Filtri, keyof CriteriUnitAmount> = true;
