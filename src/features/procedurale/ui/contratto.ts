// contratto.ts — controlli STATICI (solo tipi, nessun codice a runtime) fra le forme scritte a mano nei layer puri
// (lib/dto.ts e i criteri di lib/criteri.ts) e i DTO e i parametri della spec sigillata di TX-0024..TX-0032: se la spec
// rinomina un campo o un parametro, la compilazione fallisce invece di mostrare un dato assente in pagina o di mandare un
// criterio che il backend non legge (come nell'istituzionale, review H10). Sta in ui/ perche' i layer puri non importano
// dal confine api/.
import type { Filtri } from '../../../entities/filtri';
import type {
  AltroStato,
  CriteriReport,
  CriteriUnitAmount,
  DistribuzioneStati,
  DomandeAmmesse,
  DomandeAmmesseRiga,
  DomandeAmmesseTotale,
  FiltriProcedurali,
  PagamentiUnitAmount,
  PagamentiUnitAmountRiga,
  RiepilogoProcedurale,
  RiepilogoProceduraleRiga,
  RiepilogoProceduraleTotale,
  SottofaseCensita,
  SottofaseVoce,
  SottofasiAmmissibilita,
  StatiAreaProgrammazione,
  StatiDomande,
  StatiDomandeRiga,
  StatoAreaProgrammazione,
  VoceStato,
} from '../api';
import type { CriteriProcedurali } from '../lib/criteri';
import type * as Dto from '../lib/dto';

type Uguali<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;
/** Il DTO si puo' passare dove serve la forma (i tipi dei campi sono compatibili). */
type Assegnabile<Generato, Forma> = [Generato] extends [Forma] ? true : false;

export const CONTRATTO_VOCE_STATO: Uguali<keyof Dto.VoceStato, keyof VoceStato> = true;
export const CONTRATTO_ALTRO_STATO: Uguali<keyof Dto.AltroStato, keyof AltroStato> = true;
export const CONTRATTO_DISTRIBUZIONE: Uguali<keyof Dto.Distribuzione, keyof DistribuzioneStati> = true;
export const CONTRATTO_RIGA_STATI: Uguali<keyof Dto.RigaStati, keyof StatiDomandeRiga> = true;
export const CONTRATTO_STATI: Uguali<keyof Dto.Stati, keyof StatiDomande> = true;
export const CONTRATTO_RIGA_AMMESSE: Uguali<keyof Dto.RigaAmmesse, keyof DomandeAmmesseRiga> = true;
export const CONTRATTO_TOTALE_AMMESSE: Uguali<keyof Dto.TotaleAmmesse, keyof DomandeAmmesseTotale> = true;
export const CONTRATTO_AMMESSE: Uguali<keyof Dto.Ammesse, keyof DomandeAmmesse> = true;
export const CONTRATTO_RIGA_RIEPILOGO: Uguali<keyof Dto.RigaRiepilogo, keyof RiepilogoProceduraleRiga> = true;
export const CONTRATTO_TOTALE_RIEPILOGO: Uguali<keyof Dto.TotaleRiepilogo, keyof RiepilogoProceduraleTotale> = true;
export const CONTRATTO_RIEPILOGO: Uguali<keyof Dto.Riepilogo, keyof RiepilogoProcedurale> = true;
export const CONTRATTO_CENSITA: Uguali<keyof Dto.SottofaseCensita, keyof SottofaseCensita> = true;
export const CONTRATTO_VOCE_SOTTOFASE: Uguali<keyof Dto.VoceSottofase, keyof SottofaseVoce> = true;
export const CONTRATTO_SOTTOFASI: Uguali<keyof Dto.Sottofasi, keyof SottofasiAmmissibilita> = true;
export const CONTRATTO_RIGA_UNIT_AMOUNT: Uguali<keyof Dto.RigaUnitAmount, keyof PagamentiUnitAmountRiga> = true;
export const CONTRATTO_UNIT_AMOUNT: Uguali<keyof Dto.UnitAmount, keyof PagamentiUnitAmount> = true;
export const CONTRATTO_STATO_AREA: Uguali<keyof Dto.StatoArea, keyof StatoAreaProgrammazione> = true;
export const CONTRATTO_VALORI_STATI_AREA: Uguali<keyof Dto.ValoriStatiArea, keyof StatiAreaProgrammazione> = true;
export const CONTRATTO_VALORI_FILTRI: Uguali<keyof Dto.ValoriFiltri, keyof FiltriProcedurali> = true;
export const ASSEGNABILE_STATI: Assegnabile<StatiDomande, Dto.Stati> = true;
export const ASSEGNABILE_AMMESSE: Assegnabile<DomandeAmmesse, Dto.Ammesse> = true;
export const ASSEGNABILE_RIEPILOGO: Assegnabile<RiepilogoProcedurale, Dto.Riepilogo> = true;
export const ASSEGNABILE_SOTTOFASI: Assegnabile<SottofasiAmmissibilita, Dto.Sottofasi> = true;
export const ASSEGNABILE_UNIT_AMOUNT: Assegnabile<PagamentiUnitAmount, Dto.UnitAmount> = true;
export const ASSEGNABILE_STATI_AREA: Assegnabile<StatiAreaProgrammazione, Dto.ValoriStatiArea> = true;
export const ASSEGNABILE_VALORI_FILTRI: Assegnabile<FiltriProcedurali, Dto.ValoriFiltri> = true;
// i criteri delle letture: le chiavi scritte a mano (senza l'azione portante, che il procedurale non manda) sono i
// parametri della spec, cinque per i report per domanda e quattro per le Unit Amount
export const CONTRATTO_CRITERI_REPORT: Uguali<Exclude<keyof CriteriProcedurali, 'azione'>, keyof CriteriReport> = true;
export const CONTRATTO_CRITERI_UNIT_AMOUNT: Uguali<Exclude<keyof Filtri, 'azione'>, keyof CriteriUnitAmount> = true;
