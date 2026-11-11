// intervento.ts — grafico della pagina di dettaglio di un intervento (riga di TX-0011): "Dalla dotazione al residuo" in due
// barre orizzontali impilate sulla stessa scala (note di Leonardo del 10/11/2026, al posto della cascata a barre sospese):
// Dotazione = pagamenti netti + residuo sui pagamenti, Pagamenti lordi = pagamenti netti + rettifiche. I pagamenti netti
// sono il primo segmento di tutte e due le barre, allineati a sinistra. Con i valori del contratto, nessun calcolo nel
// browser (R08: senza rettifiche caricate netto e residuo non ci sono, le barre restano intere e lo dichiarano; mai il
// lordo al posto del netto). Col perimetro ADA la dotazione e' regionale e il residuo FUORI_PERIMETRO: il grafico non si
// disegna (suggerirebbe un residuo che il backend nega), la tabella delle voci resta.
import type { ImportoLike } from '../../../../entities/importo';
import { COLORI, importoBreve, nonDisegnabile, notaOmessi } from '../../../../shared/lib';
import type { DatiGrafico, TabellaEquivalente } from '../../../../shared/lib';
import type { RigaRiepilogo } from '../dto';
import { assenzaImporto, cellaImporto, codiceDi, valoreDi } from '../importi';
import { PERIMETRO_ADA, etichettaDiProgramma } from '../perimetro';
import { testoRettificato } from '../rettifiche';
import { opzioniBarreImpilate } from './barre-impilate';
import type { Segmento } from './barre-impilate';

const MOTIVO_ADA_BARRE = "perimetro ADA: la dotazione è regionale, i pagamenti sono dell'area e il residuo è fuori perimetro";

const DOTAZIONE = 'Dotazione';
const LORDI = 'Pagamenti lordi';
const NETTI = 'Pagamenti netti';
type Barra = typeof DOTAZIONE | typeof LORDI;
/** Le rettifiche: arancio scuro, testo bianco a 5,38:1 (AA per il testo di 12 px, NFR-70). */
const ARANCIO_RETTIFICHE = '#9a5c00';
/**
 * La barra intera dei lordi (senza rettifiche o senza netto): grigio ardesia, distinto dall'arancio delle rettifiche, testo
 * bianco a 6,1:1 (review step9 dell'11/11/2026, J-01: l'arancio #b26b00 col bianco arrivava a 4,20:1).
 */
const LORDI_INTERA = COLORI.attenuato;

/** Tutte le voci della riga, con le assenze dichiarate: tabella del grafico e scheda "Tutte le voci" del dettaglio. */
export function vociIntervento(riga: RigaRiepilogo, perimetro?: string | null): TabellaEquivalente {
  const programma = (nome: string) => etichettaDiProgramma(nome, perimetro);
  const voci: Array<[string, ImportoLike | null | undefined]> = [
    [programma('Dotazione di spesa pubblica'), riga.dotazioneSpesaPubblica],
    [programma('Quota FEASR'), riga.risorseQuotaFeasr],
    [programma('Stanziato (dai bandi)'), riga.importoStanziato],
    ['Impegnato FEASR', riga.impegnatoCofinanziatoFeasr],
    ['Impegnato FEASR e non FEASR', riga.impegnatoCofinanziatoFeasrENon],
    ["di cui stimato (previsione sui bandi pluriennali SIGC)", riga.impegnatoStimato],
    ['Pagamenti lordi', riga.pagamentiLordi],
    ['Rettifiche', riga.importoRettifiche],
    ['Pagamenti al netto delle rettifiche', riga.pagamentiNettoRettifiche],
    ['Residuo sugli impegni', riga.dotazioneResiduaSuImpegni],
    ['Residuo sui pagamenti', riga.dotazioneResiduaSuPagamenti],
  ];
  const righe = voci.map(([nome, importo]) => [nome, cellaImporto(importo)]);
  // l'indicatore delle rettifiche dopo le rettifiche (wireframe del dettaglio, review V1-07)
  righe.splice(8, 0, ['Con rettifiche', testoRettificato(riga.conRettifiche, (riga.rettifiche ?? []).length)]);
  return { caption: `Intervento ${codiceDi(riga)}: dalla dotazione al residuo sui pagamenti`, colonne: ['Voce', 'Importo'], righe };
}

function motivoBarre(codice: string, dotazione: number | null, lordi: number | null, riga: RigaRiepilogo): string | null {
  if (dotazione == null || lordi == null) {
    const mancanti = [dotazione == null ? `dotazione: ${assenzaImporto(riga.dotazioneSpesaPubblica)}` : null, lordi == null ? `pagamenti lordi: ${assenzaImporto(riga.pagamentiLordi)}` : null];
    return `il grafico di ${codice} richiede dotazione e pagamenti lordi; ${mancanti.filter(Boolean).join('; ')}`;
  }
  const altri = [riga.importoRettifiche, riga.pagamentiNettoRettifiche, riga.dotazioneResiduaSuPagamenti].map(valoreDi);
  return dotazione < 0 || lordi < 0 || altri.some((v) => v != null && v < 0) ? `importi negativi per ${codice}: il grafico non si può disegnare` : null;
}

/** Le voci fuori dal grafico: l'impegnato assente, le rettifiche assenti (netto e residuo non si disegnano), netto e residuo. */
function omessiBarre(riga: RigaRiepilogo): string[] {
  const conRettifiche = valoreDi(riga.importoRettifiche) != null;
  return [
    valoreDi(riga.impegnatoCofinanziatoFeasrENon) == null ? `Impegnato FEASR e non FEASR ${assenzaImporto(riga.impegnatoCofinanziatoFeasrENon)}` : null,
    conRettifiche ? null : `Rettifiche ${assenzaImporto(riga.importoRettifiche)}: pagamenti netti e residuo non si disegnano`,
    conRettifiche && valoreDi(riga.pagamentiNettoRettifiche) == null ? `Pagamenti netti ${assenzaImporto(riga.pagamentiNettoRettifiche)}` : null,
    conRettifiche && valoreDi(riga.dotazioneResiduaSuPagamenti) == null ? `Residuo sui pagamenti ${assenzaImporto(riga.dotazioneResiduaSuPagamenti)}` : null,
  ].filter((x): x is string => x != null);
}

function segmento(nome: string, barra: Barra, valore: number, totale: number, colore: string, testo: string, ultimo: boolean): Segmento<Barra> {
  return { nome, barra, valore, totale, colore, testo, ultimo };
}

/** Una barra di un solo segmento: niente quota nell'etichetta (sarebbe 100 %), suggerimento col solo importo (J-14). */
function intera(barra: Barra, valore: number, colore: string): Segmento<Barra> {
  return { ...segmento(barra, barra, valore, valore, colore, COLORI.superficie, true), intera: true };
}

/** Le due barre sono divise (dotazione in netti e residuo, lordi in netti e rettifiche) o restano intere. */
function divisioni(riga: RigaRiepilogo): { dotazione: boolean; lordi: boolean } {
  const [rettifiche, netti, residuo] = [riga.importoRettifiche, riga.pagamentiNettoRettifiche, riga.dotazioneResiduaSuPagamenti].map(valoreDi);
  return { dotazione: netti != null && residuo != null, lordi: netti != null && rettifiche != null };
}

/**
 * I segmenti delle due barre: la dotazione divisa in pagamenti netti e residuo se ci sono tutti e due, i lordi divisi in
 * pagamenti netti e rettifiche se ci sono tutti e due; altrimenti la barra resta intera.
 */
function segmentiIntervento(riga: RigaRiepilogo, dotazione: number, lordi: number): Segmento<Barra>[] {
  const [rettifiche, netti, residuo] = [riga.importoRettifiche, riga.pagamentiNettoRettifiche, riga.dotazioneResiduaSuPagamenti].map(valoreDi);
  const divise = divisioni(riga);
  const sopra =
    divise.dotazione && netti != null && residuo != null
      ? [segmento(NETTI, DOTAZIONE, netti, dotazione, COLORI.primario, COLORI.superficie, false), segmento('Residuo sui pagamenti', DOTAZIONE, residuo, dotazione, COLORI.neutro, COLORI.testo, true)]
      : [intera(DOTAZIONE, dotazione, COLORI.scuro)];
  const sotto =
    divise.lordi && netti != null && rettifiche != null
      ? [segmento(NETTI, LORDI, netti, lordi, COLORI.primario, COLORI.superficie, false), segmento('Rettifiche', LORDI, rettifiche, lordi, ARANCIO_RETTIFICHE, COLORI.superficie, true)]
      : [intera(LORDI, lordi, LORDI_INTERA)];
  return [...sopra, ...sotto];
}

/**
 * Il sottotitolo di "Dalla dotazione al residuo": dice come sono fatte le barre disegnate (review step9 dell'11/11/2026, J-03,
 * regola N-18); null se il grafico non si disegna (il motivo lo dice il grafico).
 */
export function sottotitoloBarreIntervento(riga: RigaRiepilogo, perimetro?: string | null): string | null {
  const disegnabile = perimetro !== PERIMETRO_ADA && motivoBarre(codiceDi(riga), valoreDi(riga.dotazioneSpesaPubblica), valoreDi(riga.pagamentiLordi), riga) == null;
  if (!disegnabile) return null;
  const divise = divisioni(riga);
  const parti = [
    divise.dotazione ? 'dotazione: pagamenti netti e residuo sui pagamenti' : 'dotazione',
    divise.lordi ? 'pagamenti lordi: pagamenti netti e rettifiche' : 'pagamenti lordi',
  ];
  const testo = parti.join('; ');
  return testo.charAt(0).toUpperCase() + testo.slice(1);
}

/** "dotazione 10,0 M€ = pagamenti netti 2,0 M€ + residuo sui pagamenti 8,0 M€" (o la sola barra se intera). */
function descrizioneBarra(barra: Barra, totale: number, segmenti: readonly Segmento<Barra>[]): string {
  const suoi = segmenti.filter((s) => s.barra === barra);
  const testa = `${barra.toLowerCase()} ${importoBreve(totale)}`;
  return suoi.length > 1 ? `${testa} = ${suoi.map((s) => `${s.nome.toLowerCase()} ${importoBreve(s.valore)}`).join(' + ')}` : testa;
}

/**
 * "Dalla dotazione al residuo" di un intervento: due barre orizzontali impilate sulla stessa scala, "Dotazione" (pagamenti
 * netti + residuo sui pagamenti) sopra e "Pagamenti lordi" (pagamenti netti + rettifiche) sotto. Le etichette hanno
 * l'importo e la quota della barra; la tabella ha tutta la riga.
 */
export function graficoBarreIntervento(riga: RigaRiepilogo, perimetro?: string | null): DatiGrafico {
  const codice = codiceDi(riga);
  const tabella = vociIntervento(riga, perimetro);
  if (perimetro === PERIMETRO_ADA) return nonDisegnabile(MOTIVO_ADA_BARRE, tabella, []);
  const [dotazione, lordi] = [valoreDi(riga.dotazioneSpesaPubblica), valoreDi(riga.pagamentiLordi)];
  const omessi = omessiBarre(riga);
  const motivo = motivoBarre(codice, dotazione, lordi, riga);
  if (motivo || dotazione == null || lordi == null) return nonDisegnabile(motivo ?? 'il grafico non si può disegnare', tabella, omessi);
  const segmenti = segmentiIntervento(riga, dotazione, lordi);
  const barre: Barra[] = [DOTAZIONE, LORDI];
  const descrizione = `Due barre impilate dell'intervento ${codice}: ${descrizioneBarra(DOTAZIONE, dotazione, segmenti)}; ${descrizioneBarra(LORDI, lordi, segmenti)}.${notaOmessi(omessi)}`;
  const opzioni = opzioniBarreImpilate(segmenti, barre, descrizione);
  return { opzioni, tabella, omessi };
}
