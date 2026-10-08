// due-parti.ts — builder PURO della ciambella "due parti di un totale" (RF004-RF007, UI v2): si disegna solo se entrambe
// le parti sono valorizzate e non negative e la somma e' positiva (altrimenti le percentuali sarebbero false); la tabella
// equivalente porta tutte le voci della sezione, con la resa degli assenti di entities/importo (mai uno zero).
import type { EChartsOption } from 'echarts';
import { descriviImporto } from '../../../entities/importo/lib/importo';
import type { ImportoLike } from '../../../entities/importo/lib/importo';
import { formatPercentuale } from '../../../shared/lib';

export interface DatiDueParti {
  opzioni: EChartsOption | null;
  motivoAssenza?: string;
  tabella: { caption: string; colonne: string[]; righe: string[][] };
  omessi: string[];
}

type Voce = [string, ImportoLike | null | undefined];

const resa = (i: ImportoLike | null | undefined, aggregato: boolean) => {
  const r = descriviImporto(i, aggregato);
  return r.nota ? `${r.testo} (${r.nota})` : r.testo;
};

/** Ciambella delle due `parti`; `voci` sono le righe della tabella equivalente (di norma il totale e le parti). */
export function graficoDueParti(titolo: string, parti: [Voce, Voce], voci: Voce[], aggregato = true): DatiDueParti {
  const tabella = { caption: titolo, colonne: ['Voce', 'Importo'], righe: voci.map(([e, i]) => [e, resa(i, aggregato)]) };
  const assenti = parti.filter(([, i]) => i?.valore == null).map(([e, i]) => `${e}: ${resa(i, aggregato)}`);
  if (assenti.length > 0) return { opzioni: null, motivoAssenza: `manca una delle due parti (${assenti.join('; ')})`, tabella, omessi: [] };
  const [[e1, i1], [e2, i2]] = parti;
  const v1 = i1?.valore as number;
  const v2 = i2?.valore as number;
  if (v1 < 0 || v2 < 0) return { opzioni: null, motivoAssenza: 'una delle due parti è negativa: le proporzioni non avrebbero senso', tabella, omessi: [] };
  if (v1 + v2 <= 0) return { opzioni: null, motivoAssenza: 'il totale è zero', tabella, omessi: [] };
  const quota = (v: number) => formatPercentuale(Math.round((v / (v1 + v2)) * 1000) / 10);
  return {
    opzioni: {
      aria: { enabled: true, label: { description: `${titolo}: ${e1} ${quota(v1)}, ${e2} ${quota(v2)}.` } },
      tooltip: { trigger: 'item' },
      legend: { bottom: 0 },
      series: [
        {
          type: 'pie',
          radius: ['52%', '78%'],
          center: ['50%', '45%'],
          itemStyle: { borderColor: '#fff', borderWidth: 3 },
          label: { formatter: '{d}%' },
          data: [
            { name: e1, value: v1 },
            { name: e2, value: v2 },
          ],
        },
      ],
    },
    tabella,
    omessi: [],
  };
}
