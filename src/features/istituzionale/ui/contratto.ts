// contratto.ts — controlli STATICI (solo tipi, nessun codice a runtime) fra le forme scritte a mano nei layer puri
// (lib/dto.ts, i criteri di lib/criteri.ts e i filtri del programma) e i DTO e i parametri della spec sigillata di TX-0016
// e TX-0015: se la spec rinomina un campo o un parametro, la compilazione fallisce invece di mostrare un dato assente in
// pagina o di mandare un criterio che il backend non legge (review H10). Sta in ui/ perche' i layer puri non importano dal
// confine api/.
import type { DatoMotivatoLike } from '../../../entities/importo';
import type { CriteriVerifica, CriteriVerificaSigc, VerificaSmp, VerificaSmpNonSigc, VerificaSmpNonSigcRiga, VerificaSmpRiga } from '../api';
import type { CriteriDellaVerifica, CriteriDellaVerificaSigc } from '../lib/criteri';
import type { RigaVerifica, RigaVerificaSigc, Verifica, VerificaSigc } from '../lib/dto';

type Uguali<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;
/** Il DTO si puo' passare dove serve la forma (i tipi dei campi sono compatibili). */
type Assegnabile<Dto, Forma> = [Dto] extends [Forma] ? true : false;
/**
 * Il campo del DTO e' un dato motivato con gli stessi campi di DatoMotivatoLike e il valore del tipo atteso: i campi della
 * forma sono tutti facoltativi, quindi senza questo controllo un `motivo` rinominato nella spec passerebbe (review delta
 * 21/10 H2 del finanziario, da cui la verifica SMP SIGC viene).
 */
type DatoMotivatoDi<Campo, T> =
  Uguali<keyof NonNullable<Campo>, keyof DatoMotivatoLike<T>> extends true ? (NonNullable<Campo> extends { valore?: infer V } ? Uguali<NonNullable<V>, T> : false) : false;

export const CONTRATTO_RIGA_VERIFICA: Uguali<keyof RigaVerifica, keyof VerificaSmpNonSigcRiga> = true;
export const CONTRATTO_VERIFICA: Uguali<keyof Verifica, keyof VerificaSmpNonSigc> = true;
export const ASSEGNABILE_VERIFICA: Assegnabile<VerificaSmpNonSigc, Verifica> = true;
// TX-0015: la riga (tabella, scheda SIGC del dettaglio, grafico, card della Home) e i dati motivati (ConteggioFinanziario e
// SiNoFinanziario: D3, D15, D-11 del backend), letti con DatoMotivatoLike
export const CONTRATTO_RIGA_VERIFICA_SIGC: Uguali<keyof RigaVerificaSigc, keyof VerificaSmpRiga> = true;
export const ASSEGNABILE_RIGA_VERIFICA_SIGC: Assegnabile<VerificaSmpRiga, RigaVerificaSigc> = true;
export const CONTRATTO_VERIFICA_SIGC: Uguali<keyof VerificaSigc, keyof VerificaSmp> = true;
export const ASSEGNABILE_VERIFICA_SIGC: Assegnabile<VerificaSmp, VerificaSigc> = true;
export const CONTRATTO_SPESA_SIGC: DatoMotivatoDi<VerificaSmpRiga['spesaErogataCampagneAnteriori'], number> = true;
export const CONTRATTO_CONTEGGIO: DatoMotivatoDi<VerificaSmpRiga['avvisiAttivati'], number> = true;
export const CONTRATTO_CONTEGGIO_AZIONI: DatoMotivatoDi<VerificaSmpRiga['azioniAttivate'], number> = true;
export const CONTRATTO_SI_NO: DatoMotivatoDi<VerificaSmpRiga['includeTopUp'], boolean> = true;
export const CONTRATTO_SI_NO_PREVISIONE: DatoMotivatoDi<VerificaSmpRiga['previsionePagamentoEsercizio'], boolean> = true;
// i criteri delle letture: le chiavi scritte a mano sono i parametri della spec (con un oggetto non letterale e un tipo
// tutto facoltativo un parametro rinominato compilerebbe ancora)
export const CONTRATTO_CRITERI_VERIFICA: Uguali<keyof CriteriDellaVerifica, keyof CriteriVerifica> = true;
export const CONTRATTO_CRITERI_VERIFICA_SIGC: Uguali<keyof CriteriDellaVerificaSigc, keyof CriteriVerificaSigc> = true;
