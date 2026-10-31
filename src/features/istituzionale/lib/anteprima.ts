// anteprima.ts — i numeri della card Istituzionale della Home come DATI (PURO, zero React; flusso verifica-smp-non-sigc
// approvato, home.html, OP-IS-11): i totali di quattro colonne della verifica SMP non SIGC letta senza filtri e senza anno,
// sommate fra gli interventi della risposta, con l'anno dell'ultimo file. Si sommano perche' ogni domanda e' una domanda di
// sostegno corrente di un solo intervento (D-02 Rev. 2 del backend) e la spesa erogata sono righe pagate non SIGC; gli
// interventi SIGC contano 0 (conteggio vero). Un dato motivato assente anche in una sola riga rende il totale non
// disponibile col motivo (totaleMotivato dell'entity importo: mai una somma parziale) e la quota che lo usa non c'e'.
// Domande e spesa sono cumulative: lo dicono la colonna e la nota, con l'anno del file (decisione D3 del 26/10/2026).
// La pagina della verifica resta senza KPI.
// Blocco SIGC (rework 1 della card, richiesta e scelta dell'utente del 30/10/2026): i totali di quattro colonne della
// verifica SMP SIGC letta senza filtri con l'ultimo esercizio chiuso (lib/criteri), sommate fra gli interventi con la
// stessa regola: domande ricevute e finanziate (domande dell'anno n-1), domande pagate nell'esercizio, spesa pubblica
// erogata nell'esercizio = spesa della campagna precedente + quella delle campagne anteriori. Nessuna quota: la spesa
// dell'esercizio comprende campagne anteriori e non si confronta col valore delle domande dell'anno n-1.
// Tabella a confronto (rework 2 della card, richiesta e scelta dell'utente del 31/10/2026: la card coi due blocchi era
// molto piu' alta delle altre tre): un'etichetta per riga e una colonna per verifica, coi totali di prima; le colonne si
// affiancano, non si sommano (cumulativi contro esercizio). Intestazioni e nota dei riferimenti dicono a cosa si riferisce
// ogni colonna.
import { totaleMotivato } from '../../../entities/importo';
import type { DatoMotivatoLike, TotaleMotivato } from '../../../entities/importo';
import { etichettaDellArea, importoBreve, intero, numeroDi, percentuale, sommaSeCompleta } from '../../../shared/lib';
import type { RigaVerifica, RigaVerificaSigc, Verifica, VerificaSigc } from './dto';
import { periodoEsercizio } from './formato';

export interface AnteprimaVerifica {
  domandeFinanziate: number;
  domandeRicevute: number;
  spesaErogata: TotaleMotivato;
  /** Spesa erogata sul valore delle domande finanziate (0-100, oltre 100 se la spesa lo supera), oppure il motivo. */
  quotaSpesa: TotaleMotivato;
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

/** I totali della colonna SIGC dalla risposta di TX-0015 (righe facoltative come nella spec: assenti = nessun intervento). */
export function anteprimaVerificaSigc(d: Pick<VerificaSigc, 'righe'>): AnteprimaVerificaSigc {
  const righe = d.righe ?? [];
  return {
    domandeFinanziate: totaleConteggio(righe, (r) => r.domandeFinanziate),
    spesaErogata: totaleMotivato(righe, spesaNellEsercizio, codiceSigc, { vuoto: 'zero', conMotivo: true }),
    domandePagate: totaleConteggio(righe, (r) => r.domandePagateEsercizio),
    domandeRicevute: totaleConteggio(righe, (r) => r.domandeRicevute),
  };
}

/** Le righe della tabella a confronto della card (rework 2), dalle domande ricevute alla spesa. */
export type RigaCard = 'ricevute' | 'finanziate' | 'pagate' | 'spesa';

const RIGHE_CARD: readonly { chiave: RigaCard; etichetta: string; formato: (v: number) => string }[] = [
  { chiave: 'ricevute', etichetta: 'Domande ricevute', formato: intero },
  { chiave: 'finanziate', etichetta: 'Domande finanziate', formato: intero },
  { chiave: 'pagate', etichetta: 'Domande pagate', formato: intero },
  { chiave: 'spesa', etichetta: 'Spesa pubblica erogata', formato: importoBreve },
];

/** Le righe della tabella: "Domande pagate" e' solo della verifica SIGC, quindi c'e' solo con la sua colonna. */
export function righeCard(conSigc: boolean): { chiave: RigaCard; etichetta: string; formato: (v: number) => string }[] {
  return RIGHE_CARD.filter((r) => conSigc || r.chiave !== 'pagate');
}

/** Le celle della colonna non SIGC: le domande pagate non ci sono (SENZA_DATO_NON_SIGC). */
export function celleNonSigc(a: AnteprimaVerifica): Record<Exclude<RigaCard, 'pagate'>, TotaleMotivato> {
  return { ricevute: { valore: a.domandeRicevute }, finanziate: { valore: a.domandeFinanziate }, spesa: a.spesaErogata };
}

/** Le celle della colonna SIGC: domande pagate e spesa dell'esercizio, ricevute e finanziate delle domande dell'anno n-1. */
export function celleSigc(a: AnteprimaVerificaSigc): Record<RigaCard, TotaleMotivato> {
  return { ricevute: a.domandeRicevute, finanziate: a.domandeFinanziate, pagate: a.domandePagate, spesa: a.spesaErogata };
}

/**
 * La riga che la colonna non SIGC non confronta: un trattino, e ai lettori di schermo perche'. TX-0016 ha le domande pagate
 * solo saldate al 100% (domandeSaldate), che non sono le pagate nell'esercizio della SIGC (review V-01, decisione D1
 * dell'utente del 31/10/2026: testo nuovo nel codice, deviazione registrata nel gate del flusso).
 */
export const SENZA_DATO_NON_SIGC = { righe: ['pagate'], testo: 'dato non confrontabile: la verifica non SIGC conta solo le domande saldate al 100%' } as const;

interface Intestazione {
  titolo: string;
  nomeNelTesto: string;
  dettaglio: string;
}

/** Intestazione della colonna non SIGC: "Non SIGC (cumulativi)", "non SIGC" nelle frasi; col perimetro ADA "(cumulativi della tua area)". */
export function intestazioneNonSigc(perimetro: string | null | undefined): Intestazione {
  return { titolo: 'Non SIGC', nomeNelTesto: 'non SIGC', dettaglio: etichettaDellArea('cumulativi', perimetro) };
}

/** Intestazione della colonna SIGC: "SIGC (esercizio 2026)"; col perimetro ADA "(esercizio 2026 della tua area)". */
export function intestazioneSigc(esercizio: number, perimetro: string | null | undefined): Intestazione {
  return { titolo: 'SIGC', nomeNelTesto: 'SIGC', dettaglio: etichettaDellArea(`esercizio ${esercizio}`, perimetro) };
}

/** La didascalia della tabella con le sole verifiche delle colonne presenti (review X-04). */
export function titoloTabella(conVerifica: boolean, conSigc: boolean): string {
  const verifiche = [conVerifica && 'non SIGC', conSigc && 'SIGC'].filter((v) => v).join(' e ');
  return `L'istituzionale in cifre: verifica SMP ${verifiche}`;
}

/** L'etichetta della barra sotto la tabella: la quota c'e' solo per la verifica non SIGC. */
export const QUOTA_NON_SIGC = 'Spesa non SIGC sul valore finanziato';

/**
 * La nota dei riferimenti sotto la tabella (al posto dei due riferimenti di prima; conserva cio' che diceva D3: valori
 * cumulativi nella colonna, anno dell'ultimo file qui): "Non SIGC: ultimo file SMP 2025. SIGC: pagate e spesa dal
 * 16/10/2025 al 15/10/2026; ricevute e finanziate, domande dell'anno 2025.". La parte SIGC dice a quali righe valgono il
 * periodo e l'anno delle domande (review X-01, decisione D2 dell'utente del 31/10/2026: testo nuovo nel codice, deviazione
 * registrata nel gate del flusso). Ogni parte c'e' solo con la risposta della sua colonna.
 */
export function notaRiferimenti(nonSigc: { annoRiferimento: number | null } | undefined, sigc: { esercizio: number; annoDomande: number } | undefined): string {
  const parti = [
    nonSigc && `Non SIGC: ${nonSigc.annoRiferimento === null ? 'nessun file SMP' : `ultimo file SMP ${nonSigc.annoRiferimento}`}.`,
    sigc && `SIGC: pagate e spesa ${periodoEsercizio(sigc.esercizio)}; ricevute e finanziate, domande dell'anno ${sigc.annoDomande}.`,
  ];
  return parti.filter((p) => p).join(' ');
}
