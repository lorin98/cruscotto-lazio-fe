// impegnati.ts — i due impegnati di un intervento che differiscono (revisione del 04/11/2026, secondo feedback di
// Leonardo/Deloitte). Il backend (D-27 di acquisizione-sian, D-15 di acquisizione-prosa) scrive l'impegnato di spesa
// pubblica uguale al cofinanziato FEASR e non, e riporta il cofinanziato FEASR alla dotazione quando l'impegnato
// dell'intervento la supera (tetto per tutti gli interventi): i due valori differiscono solo li'. Funzioni pure.
import type { ImportoLike } from '../../../entities/importo';
import { valoreDi } from './importi';

export interface RigaImpegnati {
  codiceIntervento?: string;
  impegnatoCofinanziatoFeasr?: ImportoLike | null;
  impegnatoCofinanziatoFeasrENon?: ImportoLike | null;
}

export interface ImpegnatiDiversi {
  codice: string;
  feasr: number;
  feasrENon: number;
}

/** Gli interventi con i due impegnati valorizzati e diversi al centesimo, in ordine di codice. */
export function impegnatiDiversi(righe: readonly RigaImpegnati[]): ImpegnatiDiversi[] {
  return righe
    .flatMap((r) => {
      const feasr = valoreDi(r.impegnatoCofinanziatoFeasr);
      const feasrENon = valoreDi(r.impegnatoCofinanziatoFeasrENon);
      if (!r.codiceIntervento || feasr == null || feasrENon == null) return [];
      return Math.round(feasr * 100) === Math.round(feasrENon * 100) ? [] : [{ codice: r.codiceIntervento, feasr, feasrENon }];
    })
    .sort((a, b) => a.codice.localeCompare(b.codice));
}
