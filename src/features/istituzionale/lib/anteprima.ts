// anteprima.ts — i numeri della card Istituzionale della Home come DATI (PURO, zero React; flusso verifica-smp-non-sigc
// approvato, home.html, OP-IS-11): i totali di quattro colonne della verifica SMP non SIGC letta senza filtri e senza anno,
// sommate fra gli interventi della risposta, con l'anno dell'ultimo file. Si sommano perche' ogni domanda e' una domanda di
// sostegno corrente di un solo intervento (D-02 Rev. 2 del backend) e la spesa erogata sono righe pagate non SIGC; gli
// interventi SIGC contano 0 (conteggio vero). Un dato motivato assente anche in una sola riga rende il totale non
// disponibile col motivo (totaleMotivato dell'entity importo: mai una somma parziale) e la quota che lo usa non c'e'.
// Domande e spesa sono cumulative: il riferimento lo dice, con l'anno del file (decisione D3 dell'utente del 26/10/2026).
// La pagina della verifica resta senza KPI.
// Blocco SIGC (rework 1 della card, richiesta e scelta dell'utente del 30/10/2026): i totali di quattro colonne della
// verifica SMP SIGC letta senza filtri con l'ultimo esercizio chiuso (lib/criteri), sommate fra gli interventi con la
// stessa regola: domande ricevute e finanziate (domande dell'anno n-1), domande pagate nell'esercizio, spesa pubblica
// erogata nell'esercizio = spesa della campagna precedente + quella delle campagne anteriori. Nessuna quota: la spesa
// dell'esercizio comprende campagne anteriori e non si confronta col valore delle domande dell'anno n-1.
import { totaleMotivato } from '../../../entities/importo';
import type { DatoMotivatoLike, TotaleMotivato } from '../../../entities/importo';
import { etichettaDellArea, numeroDi, percentuale, sommaSeCompleta } from '../../../shared/lib';
import type { RigaVerifica, RigaVerificaSigc, Verifica, VerificaSigc } from './dto';

export interface AnteprimaVerifica {
  domandeFinanziate: number;
  domandeRicevute: number;
  spesaErogata: TotaleMotivato;
  /** Spesa erogata sul valore delle domande finanziate (0-100, oltre 100 se la spesa lo supera), oppure il motivo. */
  quotaSpesa: TotaleMotivato;
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

/** "Non SIGC, valori cumulativi (ultimo file SMP non SIGC: 2025)"; senza file lo dice: domande e spesa restano. */
export function riferimentoAnteprima(annoRiferimento: number | null): string {
  return `Non SIGC, valori cumulativi (${annoRiferimento === null ? 'nessun file SMP non SIGC' : `ultimo file SMP non SIGC: ${annoRiferimento}`})`;
}

/** Totale di una colonna motivata: nessun intervento = zero vero; se mancano tutti per lo stesso motivo, quel motivo. */
function totaleDellaColonna(righe: readonly RigaVerifica[], dato: (r: RigaVerifica) => DatoMotivatoLike<number>): TotaleMotivato {
  return totaleMotivato(righe, dato, (r) => r.codiceIntervento, { vuoto: 'zero', conMotivo: true });
}

/** La quota solo con entrambi i totali e un valore finanziato positivo; altrimenti il motivo. */
function quotaSpesa(spesa: TotaleMotivato, finanziato: TotaleMotivato): TotaleMotivato {
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

export interface AnteprimaVerificaSigc {
  domandeFinanziate: TotaleMotivato;
  spesaErogata: TotaleMotivato;
  domandePagate: TotaleMotivato;
  domandeRicevute: TotaleMotivato;
}

const ETICHETTE_SIGC = {
  finanziate: 'Domande finanziate',
  spesa: "Spesa pubblica erogata nell'esercizio",
  pagate: "Domande pagate nell'esercizio",
  ricevute: 'Domande ricevute',
} as const;

/** Le etichette del blocco SIGC, col perimetro della risposta (ADA: "della tua area"; oggi sempre REGIONALE). */
export function etichetteAnteprimaSigc(perimetro: string | null | undefined): Record<keyof typeof ETICHETTE_SIGC, string> {
  return {
    finanziate: etichettaDellArea(ETICHETTE_SIGC.finanziate, perimetro),
    spesa: etichettaDellArea(ETICHETTE_SIGC.spesa, perimetro),
    pagate: etichettaDellArea(ETICHETTE_SIGC.pagate, perimetro),
    ricevute: etichettaDellArea(ETICHETTE_SIGC.ricevute, perimetro),
  };
}

/** Il nome del gruppo del blocco SIGC: "SIGC, esercizio 2026". */
export function nomeGruppoSigc(esercizio: number): string {
  return `SIGC, esercizio ${esercizio}`;
}

/** "SIGC, esercizio 2026 (16/10/2025 - 15/10/2026; domande dell'anno 2025)": esercizio, periodo e anno delle domande. */
export function riferimentoAnteprimaSigc(esercizio: number, annoDomande: number): string {
  return `SIGC, esercizio ${esercizio} (16/10/${esercizio - 1} - 15/10/${esercizio}; domande dell'anno ${annoDomande})`;
}

/**
 * La spesa erogata nell'esercizio di una riga: campagna precedente + campagne anteriori se ci sono entrambe; altrimenti la
 * prima assente, col suo motivo (il totale della card non e' mai una somma parziale).
 */
function spesaNellEsercizio(r: RigaVerificaSigc): DatoMotivatoLike<number> | undefined {
  const parti = [r.spesaErogataCampagnaPrecedente, r.spesaErogataCampagneAnteriori];
  const somma = sommaSeCompleta(parti.map((p) => p?.valore));
  return somma !== null ? { valore: somma } : parti.find((p) => numeroDi(p?.valore) === null);
}

const codiceSigc = (r: RigaVerificaSigc) => r.codiceIntervento ?? 'senza codice';

/** Totale di un conteggio facoltativo della spec: la somma, oppure non calcolabile con gli interventi che non lo hanno. */
function totaleConteggio(righe: readonly RigaVerificaSigc[], conteggio: (r: RigaVerificaSigc) => number | undefined): TotaleMotivato {
  return totaleMotivato(righe, (r) => ({ valore: conteggio(r) }), codiceSigc, { vuoto: 'zero' });
}

/** I numeri del blocco SIGC dalla risposta di TX-0015 (righe facoltative come nella spec: assenti = nessun intervento). */
export function anteprimaVerificaSigc(d: Pick<VerificaSigc, 'righe'>): AnteprimaVerificaSigc {
  const righe = d.righe ?? [];
  return {
    domandeFinanziate: totaleConteggio(righe, (r) => r.domandeFinanziate),
    spesaErogata: totaleMotivato(righe, spesaNellEsercizio, codiceSigc, { vuoto: 'zero', conMotivo: true }),
    domandePagate: totaleConteggio(righe, (r) => r.domandePagateEsercizio),
    domandeRicevute: totaleConteggio(righe, (r) => r.domandeRicevute),
  };
}
