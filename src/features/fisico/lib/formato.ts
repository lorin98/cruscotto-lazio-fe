// formato.ts — testi PURI del fisico (zero React): la superficie si scrive con la resa unica del kit (ettari di shared/lib:
// due decimali e il segno meno scritto, D-01 Rev. 2; review H5), qui le differenze col segno, le celle senza unita', assenze dette con la resa unica
// dell'entity importo (mai uno zero), etichette dei campi di TX-0018, conteggi delle domande e nota della quantita' a
// premio (review H3: prima nei componenti; la descrizione dell'intervento dalle voci dei filtri ora e' di entities/filtri,
// comune con l'istituzionale). I testi sono quelli dei wireframe approvati.
import { descriviAssenza, testoConNota } from '../../../entities/importo';
import type { DatoMotivatoLike } from '../../../entities/importo';
import { formatEttari, formatNumber, formatPercentuale } from '../../../shared/lib';
import type { InterventoSuperficie } from './dto';
import { campagnaDi } from './superfici';

/** Differenza DP - DS col segno: "+0,70 ha", "-0,50 ha", "0,00 ha". */
export function testoDifferenza(v: number): string {
  return `${formatEttari(v, { segno: true })} ha`;
}

/** La cella numerica di una superficie (senza unita': l'intestazione della colonna dice "ha"). */
export function cellaSuperficie(v: number): string {
  return formatEttari(v);
}

/** La cella di una differenza (senza unita'), col segno. */
export function cellaDifferenza(v: number): string {
  return formatEttari(v, { segno: true });
}

/**
 * Quantita' richiesta a premio (OP-FIS-04): il valore, oppure la sua assenza con la resa unica delle assenze (oggi sempre
 * "non disponibile (fonte quantità richiesta a premio non attiva)", D-02 del backend).
 */
export function testoQuantitaPremio(q: DatoMotivatoLike<number> | null | undefined): string {
  if (q?.valore != null) return formatNumber(q.valore);
  return testoConNota(descriviAssenza(q));
}

/**
 * Motivo di una riga senza superfici nella risposta letta SENZA il filtro Campagna (NON_VALORIZZATO): intervento non a
 * superficie o non SIGC (D-01 del backend). Con il filtro vale testoNonNellaCampagnaFiltrata.
 */
export const SENZA_SUPERFICI = 'nessuna superficie in nessuna campagna (non valorizzato: intervento non a superficie o non SIGC)';

/** "nessuna superficie nella campagna 2025" per un intervento che ha superfici solo in altre campagne della risposta. */
export function testoNonInCampagna(anno: number): string {
  return `nessuna superficie nella campagna ${anno}`;
}

/**
 * "nessuna superficie nella campagna 2024 (non valorizzato)": con il filtro Campagna la risposta dice NON_VALORIZZATO anche
 * per un intervento che ha superfici in altre campagne (SC-FS_SUPERFICIE_CAMPAGNA), quindi mai "in nessuna campagna" (D1).
 */
export function testoNonNellaCampagnaFiltrata(anno: number): string {
  return `${testoNonInCampagna(anno)} (non valorizzato)`;
}

/** Un intervento senza superfici nella risposta: in nessuna campagna (letta senza filtro) o nella campagna filtrata. */
export function testoSenzaSuperfici(campagnaRisposta: number | null): string {
  return campagnaRisposta === null ? SENZA_SUPERFICI : testoNonNellaCampagnaFiltrata(campagnaRisposta);
}

/**
 * Lo stato vuoto "nessuna superficie" (decisione D1 del 22/10/2026): senza filtro gli interventi non sono a superficie o
 * non sono SIGC; con il filtro Campagna la risposta dice solo di quella campagna, e la frase dice come vedere le altre.
 */
export function testoNessunaSuperficie(campagnaRisposta: number | null): string {
  if (campagnaRisposta === null) return 'Nessuna superficie per gli interventi scelti: gli interventi non sono a superficie o non sono SIGC (non valorizzato).';
  return `Nessuna superficie per gli interventi scelti nella campagna ${campagnaRisposta} (non valorizzato). Togli il filtro Campagna per vedere le altre campagne.`;
}

/** La fonte della mini linea dell'anteprima: con il filtro Campagna l'anteprima mostra solo la campagna filtrata, e lo dice. */
export function fonteLineaIntervento(campagnaRisposta: number | null): string {
  if (campagnaRisposta === null) return "Fonte: TX-0018, superfici dell'intervento campagna per campagna (le campagne non si sommano).";
  return `Fonte: TX-0018 con il filtro Campagna ${campagnaRisposta}: l'anteprima mostra solo la campagna ${campagnaRisposta}.`;
}

/** "su 3 domande di pagamento: 33,3 %", oppure "nessuna domanda di pagamento" (la quota non si calcola). */
export function testoQuotaOltreDs(pagamento: number, quota: number | null): string {
  if (quota === null) return 'nessuna domanda di pagamento';
  return `su ${formatNumber(pagamento)} ${pagamento === 1 ? 'domanda' : 'domande'} di pagamento: ${formatPercentuale(quota)}`;
}

/** "1 domanda di sostegno", "3 domande di pagamento". */
export function testoDomande(n: number, tipo: 'sostegno' | 'pagamento'): string {
  return `${formatNumber(n)} ${n === 1 ? 'domanda' : 'domande'} di ${tipo}`;
}

/**
 * La nota della verifica incrociata sulla quantita' richiesta a premio della campagna (OP-FIS-04): se manca in tutte le
 * righe della campagna, la sua assenza con la resa unica (oggi sempre "fonte non attiva"); altrimenti il rimando alla
 * tabella equivalente, che ha il valore di ogni intervento.
 */
export function notaQuantitaPremio(righe: readonly InterventoSuperficie[], campagna: number): string {
  const campagne = righe.flatMap((r) => {
    const c = campagnaDi(r, campagna);
    return c ? [c] : [];
  });
  const assenti = campagne.filter((c) => c.quantitaRichiestaPremio.valore == null);
  if (assenti.length === campagne.length && assenti[0]) return `Quantità richiesta a premio: ${testoQuantitaPremio(assenti[0].quantitaRichiestaPremio)}.`;
  return 'Quantità richiesta a premio nella tabella equivalente.';
}

/** Etichette dei campi di TX-0018: le stesse in tabella, KPI, anteprima e tabelle equivalenti dei grafici. */
export const ETICHETTE = {
  intervento: 'Intervento',
  campagna: 'Campagna',
  domandePagamento: 'Domande di pagamento',
  domandeSostegno: 'Domande di sostegno',
  superficieDs: 'Superficie DS (ha)',
  superficieDp: 'Superficie DP (ha)',
  differenzaDpDs: 'Differenza DP - DS (ha)',
  domandeDpOltreDs: 'Domande con DP oltre la DS',
  sostegniDiscordanti: 'Sostegni con DS discordanti',
  quantitaRichiestaPremio: "Quantità richiesta a premio",
} as const;
