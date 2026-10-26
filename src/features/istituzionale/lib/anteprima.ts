// anteprima.ts — i numeri della card Istituzionale della Home come DATI (PURO, zero React; flusso verifica-smp-non-sigc
// approvato, home.html, OP-IS-11): i totali di quattro colonne della verifica SMP non SIGC letta senza filtri e senza anno,
// sommate fra gli interventi della risposta, con l'anno di riferimento del file. Si sommano perche' ogni domanda e' una
// domanda di sostegno corrente di un solo intervento (D-02 Rev. 2 del backend) e la spesa erogata sono righe pagate non
// SIGC; gli interventi SIGC contano 0 (conteggio vero). Un dato motivato assente anche in una sola riga rende il totale non
// disponibile col motivo (mai una somma parziale) e la quota che lo usa non c'e'. La pagina della verifica resta senza KPI.
import { descriviAssenza, testoConNota } from '../../../entities/importo';
import type { DatoMotivatoLike } from '../../../entities/importo';
import { etichettaDellArea, percentuale, plurale, sommaSeCompleta } from '../../../shared/lib';
import type { RigaVerifica, Verifica } from './dto';

/** Un totale della card: il valore, oppure null col motivo in parole. */
export interface TotaleCard {
  valore: number | null;
  motivo?: string;
}

export interface AnteprimaVerifica {
  domandeFinanziate: number;
  domandeRicevute: number;
  spesaErogata: TotaleCard;
  /** Spesa erogata sul valore delle domande finanziate (0-100, oltre 100 se la spesa lo supera), oppure il motivo. */
  quotaSpesa: TotaleCard;
}

const ETICHETTE = {
  finanziate: 'Domande finanziate',
  spesa: 'Spesa pubblica erogata',
  quota: 'Spesa erogata sul valore delle domande finanziate',
  ricevute: 'Domande ricevute',
} as const;

/** Le etichette della card, col perimetro della risposta (ADA: "della tua area"). */
export function etichetteAnteprima(perimetro: string | null | undefined): Record<keyof typeof ETICHETTE, string> {
  return {
    finanziate: etichettaDellArea(ETICHETTE.finanziate, perimetro),
    spesa: etichettaDellArea(ETICHETTE.spesa, perimetro),
    quota: ETICHETTE.quota,
    ricevute: etichettaDellArea(ETICHETTE.ricevute, perimetro),
  };
}

/** "Non SIGC, anno di riferimento 2025"; senza anno (nessun file) lo dice: domande e spesa vengono dalle pratiche. */
export function riferimentoAnteprima(annoRiferimento: number | null): string {
  return annoRiferimento === null ? 'Non SIGC, nessun file SMP non SIGC' : `Non SIGC, anno di riferimento ${annoRiferimento}`;
}

/**
 * Totale di una colonna motivata: la somma se ogni riga ha il valore; altrimenti quanti interventi non lo hanno (fino a
 * tre per codice) e, se mancano tutti per lo stesso motivo, quel motivo.
 */
function totaleDellaColonna(righe: readonly RigaVerifica[], dato: (r: RigaVerifica) => DatoMotivatoLike<number>): TotaleCard {
  const somma = sommaSeCompleta(righe.map((r) => dato(r).valore));
  if (somma !== null) return { valore: somma };
  const mancanti = righe.filter((r) => dato(r).valore == null);
  const codici = mancanti.length <= 3 ? ` (${mancanti.map((r) => r.codiceIntervento).join(', ')})` : '';
  const motivi = new Set(mancanti.map((r) => dato(r).motivo ?? null));
  const motivo = motivi.size === 1 ? `; ${testoConNota(descriviAssenza(dato(mancanti[0])))}` : '';
  return { valore: null, motivo: `Non calcolabile: manca per ${plurale(mancanti.length, 'intervento', 'interventi')}${codici}${motivo}` };
}

/** La quota solo con entrambi i totali e un valore finanziato positivo; altrimenti il motivo. */
function quotaSpesa(spesa: TotaleCard, finanziato: TotaleCard): TotaleCard {
  if (spesa.valore === null || finanziato.valore === null) {
    const mancanti = [spesa.valore === null ? 'della spesa' : null, finanziato.valore === null ? 'del valore finanziato' : null].filter((m) => m !== null);
    return { valore: null, motivo: `non calcolabile: manca il totale ${mancanti.join(' e ')}` };
  }
  if (finanziato.valore <= 0) return { valore: null, motivo: 'nessun valore finanziato' };
  return { valore: percentuale(spesa.valore, finanziato.valore) };
}

/** I numeri della card dalla risposta di TX-0016. */
export function anteprimaVerifica(d: Pick<Verifica, 'righe'>): AnteprimaVerifica {
  const spesaErogata = totaleDellaColonna(d.righe, (r) => r.spesaErogata);
  const valoreFinanziato = totaleDellaColonna(d.righe, (r) => r.valoreDomandeFinanziate);
  return {
    domandeFinanziate: d.righe.reduce((n, r) => n + r.domandeFinanziate, 0),
    domandeRicevute: d.righe.reduce((n, r) => n + r.domandeRicevute, 0),
    spesaErogata,
    quotaSpesa: quotaSpesa(spesaErogata, valoreFinanziato),
  };
}
