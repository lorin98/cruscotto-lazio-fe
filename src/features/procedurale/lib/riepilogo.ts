// riepilogo.ts — il riepilogo per intervento come DATI (PURO, zero React; TX-0029, flusso riepilogo approvato): le quattro
// sezioni di colonne della tabella (Domande ammesse, Area programmazione, Sostegno, Pagamento), con visibili di partenza
// i totali di ogni sezione e a scelta le voci (le dieci di RF025 con gli stati osservati, le undici di RF027, le cinque di
// RF028, gli altri stati, perimetro e attivato); il codice dell'intervento di una riga e le voci del drawer di anteprima.
// I totali sono quelli del backend (riga totale della risposta), mai sommati qui; i numeri coincidono coi report dedicati.
import { formatNumber } from '../../../shared/lib';
import type { Distribuzione, Riepilogo, RigaRiepilogo, TotaleRiepilogo, VoceStato } from './dto';
import { titoloBreve, voceDi } from './stati';

export type SezioneRiepilogo = 'ammesse' | 'area' | 'sostegno' | 'pagamento';

/** I titoli dei gruppi di colonne (intestazioni scope colgroup), nell'ordine del wireframe. */
export const TITOLI_SEZIONI: Readonly<Record<SezioneRiepilogo, string>> = { ammesse: 'Domande ammesse', area: 'Area programmazione', sostegno: 'Sostegno', pagamento: 'Pagamento' };

/** La distribuzione di una sezione per stato, in una riga o nel totale. */
export function distribuzioneDi(r: RigaRiepilogo | TotaleRiepilogo | undefined, sezione: Exclude<SezioneRiepilogo, 'ammesse'>): Distribuzione | undefined {
  if (sezione === 'area') return r?.statiAreaProgrammazione;
  return sezione === 'sostegno' ? r?.statiSostegno : r?.statiPagamento;
}

/** Una colonna di una voce di stato (a scelta): la chiave, il titolo breve, il nome completo e la voce. */
interface ColonnaVoce {
  chiave: string;
  titolo: string;
  nomeEsteso: string;
  stato: string;
}

/** Le colonne delle voci di una sezione, dalle voci del totale (le stesse in ogni riga), nell'ordine del backend. */
export function colonneVoci(totale: TotaleRiepilogo | undefined, sezione: Exclude<SezioneRiepilogo, 'ammesse'>): ColonnaVoce[] {
  return (distribuzioneDi(totale, sezione)?.voci ?? []).map((v) => ({ chiave: `${sezione}:${v.stato}`, titolo: titoloBreve(v), nomeEsteso: `${titoloBreve(v)} (${TITOLI_SEZIONI[sezione]})`, stato: v.stato }));
}

/** Le domande di una voce di una distribuzione: il numero, oppure null per la voce senza fonte o assente. */
export function domandeDellaVoce(d: Distribuzione | undefined, stato: string): number | null {
  return voceDi(d, stato)?.domande ?? null;
}

/**
 * La voce di una colonna di stato in una riga o nel totale, con domande, motivo e fonte (la voce senza fonte dice perche'
 * non ha il numero); undefined se la distribuzione non c'e' o non ha la voce.
 */
export function voceDellaColonna(r: RigaRiepilogo | TotaleRiepilogo | undefined, sezione: Exclude<SezioneRiepilogo, 'ammesse'>, stato: string): VoceStato | undefined {
  return voceDi(distribuzioneDi(r, sezione), stato);
}

/** Il codice dell'intervento di una riga (dalle misure di TX-0026 della riga). */
export function codiceDellaRiga(r: RigaRiepilogo): string {
  return r.ammesse?.codiceIntervento ?? '';
}

/** Le righe con il codice dell'intervento, nell'ordine del backend (per codice). */
export function righeRiepilogo(d: Riepilogo): RigaRiepilogo[] {
  return (d.righe ?? []).filter((r) => codiceDellaRiga(r) !== '');
}

/** "n, di cui non rilasciate n" di una distribuzione (drawer). */
export function testoConNonRilasciate(d: Distribuzione | undefined): string {
  return d ? `${formatNumber(d.totale)}, di cui non rilasciate ${formatNumber(d.domandeNonRilasciate)}` : '-';
}

/** Le domande senza stato area programmazione di una riga o del totale. */
export function senzaStatoDi(r: RigaRiepilogo | TotaleRiepilogo | undefined): number | null {
  return r?.statiAreaProgrammazione?.senzaStato ?? null;
}
