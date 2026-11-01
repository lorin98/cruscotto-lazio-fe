// stima.ts — funzioni PURE della stima dell'impegnato (revisioni del 31/10/2026, R04, I1): l'impegnato SIGC dei bandi
// pluriennali ha una parte stimata (media delle annualita' rilevate per bando moltiplicata per gli anni residui fino
// all'orizzonte del CSR), calcolata dal backend; i report la dicono accanto all'impegnato ("di cui stimato") e con una nota
// di lettura dal blocco stimaImpegni (TX-0002, TX-0005, TX-0006, TX-0011), che manca se nessun intervento ha parte stimata.
import { formatDate, importoBreve } from '../../../shared/lib';
import type { ImportoLike } from '../../../entities/importo';

/** StimaImpegni del contratto, quanto basta alla nota (forma strutturale: i layer puri non importano dal confine api/). */
export interface StimaImpegniLike {
  metodo?: string;
  orizzonte?: number;
  ultimaCampagnaRilevata?: number | null;
  calcolatoIl?: string | null;
  quotaDaRichiesto?: ImportoLike | null;
}

/** La nota di lettura dell'impegnato con la parte stimata (testo del wireframe dotazione-avanzamento). */
export function testoStima(s: StimaImpegniLike): string {
  const orizzonte = s.orizzonte == null ? "all'orizzonte del CSR" : `al ${s.orizzonte}`;
  const campagna = s.ultimaCampagnaRilevata == null ? 'nessuna campagna rilevata' : `ultima campagna rilevata ${s.ultimaCampagnaRilevata}`;
  const giorno = s.calcolatoIl ? `calcolato il ${formatDate(s.calcolatoIl)}` : 'data del calcolo non indicata';
  const richiesto = s.quotaDaRichiesto?.valore != null && s.quotaDaRichiesto.valore !== 0 ? ` Dell'impegnato rilevato, ${importoBreve(s.quotaDaRichiesto.valore)} vengono dal richiesto delle domande ancora in istruttoria: valore provvisorio.` : '';
  return `La parte stimata è la media delle annualità rilevate per bando moltiplicata per gli anni residui fino ${orizzonte}; ${campagna}; ${giorno}.${richiesto}`;
}

/** "di cui stimato 1,2 M€ (previsione sui bandi pluriennali SIGC)", o niente senza parte stimata. */
export function notaDiCuiStimato(stimato: ImportoLike | null | undefined): string | undefined {
  const v = stimato?.valore;
  return v == null || v === 0 ? undefined : `di cui stimato ${importoBreve(v)} (previsione sui bandi pluriennali SIGC)`;
}
