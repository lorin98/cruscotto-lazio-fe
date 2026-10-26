// anteprima.ts — i numeri della card Fisico della Home come DATI (PURO, zero React; flusso superfici approvato, home.html,
// OP-FIS-10): i KPI della pagina Superfici per la campagna di riferimento senza filtro, cioe' la piu' recente della risposta
// di TX-0018 letta senza filtri, dagli stessi conti della pagina (totaliCampagna, quotaDpOltreDs). Le superfici di campagne
// diverse non si sommano mai (D-01 del backend).
import { campagnaDiRiferimento, quotaDpOltreDs, totaliCampagna } from './superfici';
import type { Superfici } from './dto';

export interface AnteprimaSuperfici {
  campagna: number;
  superficieDs: number;
  superficieDp: number;
  domandePagamento: number;
  /** Domande con DP oltre la DS sulle domande di pagamento (0-100); null senza domande di pagamento. */
  quotaOltreDs: number | null;
}

/** I numeri della campagna piu' recente della risposta; null se nessun intervento ha superfici. */
export function anteprimaSuperfici(d: Pick<Superfici, 'righe'>): AnteprimaSuperfici | null {
  const campagna = campagnaDiRiferimento(d.righe, undefined);
  const t = campagna === null ? null : totaliCampagna(d.righe, campagna);
  if (campagna === null || !t) return null;
  return { campagna, superficieDs: t.superficieDs, superficieDp: t.superficieDp, domandePagamento: t.domandePagamento, quotaOltreDs: quotaDpOltreDs(t) };
}
