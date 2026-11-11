// intervento.ts — grafico della pagina di dettaglio di un intervento (riga di TX-0011): "Dalla dotazione al residuo" in due
// barre orizzontali impilate sulla stessa scala (note di Leonardo del 10/11/2026, al posto della cascata a barre sospese):
// Dotazione = pagamenti netti + residuo sui pagamenti, Pagamenti lordi = pagamenti netti + rettifiche. I pagamenti netti
// sono il primo segmento di tutte e due le barre, allineati a sinistra. Con i valori del contratto, nessun calcolo nel
// browser (R08: senza rettifiche caricate netto e residuo non ci sono, le barre restano intere e lo dichiarano; mai il
// lordo al posto del netto). Col perimetro ADA la dotazione e' regionale e il residuo FUORI_PERIMETRO: il grafico non si
// disegna (suggerirebbe un residuo che il backend nega), la tabella delle voci resta.
import type { EChartsOption } from 'echarts';
import type { ImportoLike } from '../../../../entities/importo';
import { COLORI, GRIGLIA_CON_ETICHETTE, aria, asseCategorieOrizzontale, asseImporti, importoBreve, nonDisegnabile, notaOmessi, tooltipDettaglio } from '../../../../shared/lib';
import type { DatiGrafico, TabellaEquivalente } from '../../../../shared/lib';
import type { RigaRiepilogo } from '../dto';
import { assenzaImporto, cellaImporto, codiceDi, valoreDi } from '../importi';
import { PERIMETRO_ADA, etichettaDiProgramma } from '../perimetro';
import { testoRettificato } from '../rettifiche';
import { larghezzaEtichetta, serieSegmento, testoEtichetta } from './sigc';
import type { Segmento } from './sigc';

const MOTIVO_ADA_BARRE = "perimetro ADA: la dotazione è regionale, i pagamenti sono dell'area e il residuo è fuori perimetro";

const DOTAZIONE = 'Dotazione';
const LORDI = 'Pagamenti lordi';
const NETTI = 'Pagamenti netti';
/** Le rettifiche: arancio scuro, testo bianco con contrasto AA. */
const ARANCIO_RETTIFICHE = '#9a5c00';

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

function segmento(nome: string, barra: string, valore: number, totale: number, colore: string, testo: string, ultimo: boolean): Segmento {
  return { nome, barra, valore, totale, colore, testo, ultimo };
}

/**
 * I segmenti delle due barre: la dotazione divisa in pagamenti netti e residuo se ci sono tutti e due, i lordi divisi in
 * pagamenti netti e rettifiche se ci sono tutti e due; altrimenti la barra resta intera.
 */
function segmentiIntervento(riga: RigaRiepilogo, dotazione: number, lordi: number): Segmento[] {
  const [rettifiche, netti, residuo] = [riga.importoRettifiche, riga.pagamentiNettoRettifiche, riga.dotazioneResiduaSuPagamenti].map(valoreDi);
  const sopra =
    netti != null && residuo != null
      ? [segmento(NETTI, DOTAZIONE, netti, dotazione, COLORI.primario, COLORI.superficie, false), segmento('Residuo sui pagamenti', DOTAZIONE, residuo, dotazione, COLORI.neutro, COLORI.testo, true)]
      : [segmento(DOTAZIONE, DOTAZIONE, dotazione, dotazione, COLORI.scuro, COLORI.superficie, true)];
  const sotto =
    netti != null && rettifiche != null
      ? [segmento(NETTI, LORDI, netti, lordi, COLORI.primario, COLORI.superficie, false), segmento('Rettifiche', LORDI, rettifiche, lordi, ARANCIO_RETTIFICHE, COLORI.superficie, true)]
      : [segmento(LORDI, LORDI, lordi, lordi, COLORI.attenzione, COLORI.superficie, true)];
  return [...sopra, ...sotto];
}

/** "dotazione 10,0 M€ = pagamenti netti 2,0 M€ + residuo sui pagamenti 8,0 M€" (o la sola barra se intera). */
function descrizioneBarra(barra: string, totale: number, segmenti: readonly Segmento[]): string {
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
  const barre = [DOTAZIONE, LORDI];
  const descrizione = `Due barre impilate dell'intervento ${codice}: ${descrizioneBarra(DOTAZIONE, dotazione, segmenti)}; ${descrizioneBarra(LORDI, lordi, segmenti)}.${notaOmessi(omessi)}`;
  const opzioni: EChartsOption = {
    aria: aria(descrizione),
    tooltip: { trigger: 'item', formatter: tooltipDettaglio },
    legend: { bottom: 0 },
    // a destra lo spazio per l'etichetta piu' lunga degli ultimi segmenti, se non entra nel suo (come Importi SIGC)
    grid: { ...GRIGLIA_CON_ETICHETTE, right: Math.max(...segmenti.filter((s) => s.ultimo).map((s) => larghezzaEtichetta(testoEtichetta(s)))) },
    xAxis: { type: 'value', splitNumber: 3, axisLabel: { formatter: asseImporti, hideOverlap: true } },
    yAxis: asseCategorieOrizzontale(barre),
    series: segmenti.map((s) => serieSegmento(s, barre)),
  };
  return { opzioni, tabella, omessi };
}
