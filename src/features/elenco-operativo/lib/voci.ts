// voci.ts — testi PURI delle schede di sola lettura (zero React): voci delle anteprime di una riga, badge e sopratitolo
// della testata della scheda, dati della sintesi. I componenti li rendono come liste di definizioni senza logica.
import { formatDate } from '../../../shared/lib';
import type { Domanda, Pagamento } from './dto';
import {
  cellaImporto,
  etichettaEsito,
  etichettaTipo,
  importoConNota,
  testoAnnualita,
  testoAnno,
  testoAtto,
  testoPerimetro,
  testoSuperficie,
} from './formato';

export type VoceTesto = readonly [termine: string, valore: string];

/** "AZIENDA AGRICOLA ROSSI (RSSMRA80A01H501U)", con la denominazione mancante dichiarata. */
export function testoBeneficiario(r: { denominazione?: string | null; cuaa?: string | null }): string {
  const nome = r.denominazione ?? 'denominazione non valorizzata';
  return r.cuaa ? `${nome} (${r.cuaa})` : nome;
}

/** Stato SIAN in parole (descrizione dell'anagrafica, altrimenti il codice), "senza stato" se manca. */
export function testoStatoSian(d: Pick<Domanda, 'statoDescrizione' | 'statoCodice'>): string {
  return d.statoDescrizione ?? d.statoCodice ?? 'senza stato';
}

export function testoStatoProgrammazione(d: Pick<Domanda, 'statoProgrammazione'>): string {
  return d.statoProgrammazione ?? 'senza stato';
}

/** Voci dell'anteprima di una domanda (drawer della riga). */
export function vociAnteprimaDomanda(d: Domanda): VoceTesto[] {
  return [
    ['Tipo', etichettaTipo(d.tipo)],
    ['Beneficiario', testoBeneficiario(d)],
    ['Intervento e anno', `${d.codiceIntervento ?? ''} - ${testoAnno(d.annoRaccolta)}, ${testoAnnualita(d.primaAnnualita)}`],
    ['Stato SIAN e area programmazione', `${testoStatoSian(d)} - ${testoStatoProgrammazione(d)}`],
    ['Ammesso', cellaImporto(d.ammesso)],
    ['Pagato', cellaImporto(d.pagato)],
    ['Ancora da pagare', cellaImporto(d.ancoraDaPagare)],
    ['Anomalie', d.anomalie ? String(d.anomalie) : 'nessuna'],
  ];
}

/** Voci dell'anteprima di una riga di pagamento; l'esito dice in testo se la domanda e' chiusa. */
export function vociAnteprimaPagamento(p: Pagamento): VoceTesto[] {
  const voci: VoceTesto[] = [
    ['Beneficiario', testoBeneficiario(p)],
    ['Domanda', `${etichettaTipo(p.tipoDomanda)} ${p.codiceABarre ?? ''}, intervento ${p.codiceIntervento ?? ''}`],
    ['Esito', etichettaEsito(p.esito, p.domandaCorrente !== false)],
    ['Data di autorizzazione', formatDate(p.dataAutorizzazione) || 'non indicata'],
    ['Elenco di liquidazione', `${p.decreto ?? ''}, protocollo ${p.protocollo ?? 'non indicato'}, tipologia ${testoTipologia(p)}`],
    ['Decretato', cellaImporto(p.importoDecretato)],
    ['Pagato', cellaImporto(p.importoPagato)],
    ['Quote FEASR, nazionale, regionale', `${cellaImporto(p.quotaFeasr)} - ${cellaImporto(p.quotaNazionale)} - ${cellaImporto(p.quotaRegionale)}`],
  ];
  const motivi = p.motiviEsclusione ?? [];
  return motivi.length > 0 ? [...voci, ['Motivi di esclusione', motivi.join(', ')]] : voci;
}

/** Tipologia dell'elenco e del pagamento della riga, oppure "non indicata" (wireframe dell'anteprima: "tipologia saldo"). */
function testoTipologia(p: Pick<Pagamento, 'tipologiaElenco' | 'tipologiaPagamento'>): string {
  const t = [p.tipologiaElenco, p.tipologiaPagamento].filter(Boolean);
  return t.length > 0 ? t.join(', ') : 'non indicata';
}

/** Badge della testata della scheda (in testo: il colore non e' mai l'unico canale). Il perimetro solo se la risposta lo
 *  porta: mai uno dichiarato per difetto (review v1 A-08). */
export function badgeDellaDomanda(d: Domanda, perimetro: string | null | undefined): string[] {
  const p = testoPerimetro(perimetro);
  return [
    d.cuaa ? `CUAA ${d.cuaa}` : 'CUAA non valorizzato',
    `Stato SIAN: ${testoStatoSian(d)}`,
    `Area programmazione: ${testoStatoProgrammazione(d)}`,
    d.sigc ? 'SIGC' : 'non SIGC',
    `Anno ${testoAnno(d.annoRaccolta)}, ${testoAnnualita(d.primaAnnualita)}`,
    ...(p ? [`Perimetro: ${p}`] : []),
  ];
}

/** "Domanda di pagamento 54230000001 - SRA01 Produzione integrata". */
export function sopratitoloDomanda(d: Domanda, descrizioneIntervento: string | null | undefined): string {
  return `Domanda di ${etichettaTipo(d.tipo).toLowerCase()} ${d.codiceABarre ?? ''} - ${d.codiceIntervento ?? ''} ${descrizioneIntervento ?? ''}`.trim();
}

/**
 * Dati della sintesi della scheda, esclusa la domanda di sostegno (che e' un link). `attoConcessioneDisponibile` di TX-0060:
 * "nessun atto" solo se vero; falso, l'assenza con la fonte (review delta 21/10 X2, F1); assente (TX-0060 non letto) "non
 * disponibile" (passata 2 V1). Vedi testoAtto.
 */
export function vociSintesi(
  d: Domanda,
  scheda: { descrizioneIntervento?: string | null; compartoCodice?: string | null; compartoDescrizione?: string | null; aggregatoComparti?: string | null },
  { attoConcessioneDisponibile }: { attoConcessioneDisponibile?: boolean } = {},
): VoceTesto[] {
  return [
    ['Intervento', `${d.codiceIntervento ?? ''} - ${scheda.descrizioneIntervento ?? 'descrizione non disponibile'}`],
    ['Comparto', scheda.compartoCodice ? `${scheda.compartoCodice} - ${scheda.compartoDescrizione ?? ''}`.trim() : 'non indicato'],
    ['Aggregato dei comparti', scheda.aggregatoComparti ?? 'non indicato'],
    ['Provincia ed ente delegato', `${d.provincia ?? 'non indicata'} - ${d.enteDelegato ?? 'non indicato'}`],
    ['Atto di concessione', testoAtto(d.attoConcessioneNumero, d.attoConcessioneData, attoConcessioneDisponibile)],
    ['Superficie (sostegno / pagamento)', `${testoSuperficie(d.superficieSostegno)} / ${testoSuperficie(d.superficiePagamento)}`],
    ['Importi della domanda', `richiesto ${importoConNota(d.richiesto)}; ammesso ${importoConNota(d.ammesso)}`],
  ];
}
