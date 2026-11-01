// intervento.ts — grafico della pagina di dettaglio di un intervento (riga di TX-0011): cascata dalla dotazione ai
// pagamenti lordi, alle rettifiche, ai pagamenti netti e al residuo sui pagamenti (revisioni del 31/10/2026, R08: senza
// rettifiche caricate netto e residuo non ci sono e la cascata si ferma al lordo, dichiarandolo; mai il lordo al posto del
// netto). Col perimetro ADA la dotazione e' regionale e il residuo FUORI_PERIMETRO: la cascata non si disegna (suggerirebbe
// un residuo che il backend nega), la tabella delle voci resta.
import type { ImportoLike } from '../../../../entities/importo';
import { COLORI, centesimi, descrizioneCascata, nonDisegnabile, opzioniCascata } from '../../../../shared/lib';
import type { DatiGrafico, PassoCascata, TabellaEquivalente } from '../../../../shared/lib';
import type { RigaRiepilogo } from '../dto';
import { assenzaImporto, cellaImporto, codiceDi, valoreDi } from '../importi';
import { PERIMETRO_ADA, etichettaDiProgramma } from '../perimetro';
import { testoRettificato } from '../rettifiche';

const MOTIVO_ADA_CASCATA = "perimetro ADA: la dotazione è regionale, i pagamenti sono dell'area e il residuo è fuori perimetro";

/** Tutte le voci della riga, con le assenze dichiarate: tabella della cascata e scheda "Tutte le voci" del dettaglio. */
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

function motivoCascata(codice: string, dotazione: number | null, lordi: number | null, riga: RigaRiepilogo): string | null {
  if (dotazione == null || lordi == null) {
    const mancanti = [dotazione == null ? `dotazione: ${assenzaImporto(riga.dotazioneSpesaPubblica)}` : null, lordi == null ? `pagamenti lordi: ${assenzaImporto(riga.pagamentiLordi)}` : null];
    return `la cascata di ${codice} richiede dotazione e pagamenti lordi; ${mancanti.filter(Boolean).join('; ')}`;
  }
  const altri = [riga.importoRettifiche, riga.pagamentiNettoRettifiche, riga.dotazioneResiduaSuPagamenti].map(valoreDi);
  if (dotazione < 0 || lordi < 0 || altri.some((v) => v != null && v < 0)) return `importi negativi per ${codice}: la cascata non si può disegnare`;
  return lordi > dotazione ? `i pagamenti lordi di ${codice} superano la dotazione: la cascata non si può disegnare` : null;
}

/**
 * Cascata di un intervento: dotazione -> pagamenti lordi -> rettifiche (tornano nella dotazione) -> pagamenti netti ->
 * residuo sui pagamenti; senza rettifiche (fonte non attiva) si ferma ai lordi e lo dichiara. Tabella con tutta la riga.
 */
export function graficoCascataIntervento(riga: RigaRiepilogo, perimetro?: string | null): DatiGrafico {
  const codice = codiceDi(riga);
  const tabella = vociIntervento(riga, perimetro);
  if (perimetro === PERIMETRO_ADA) return nonDisegnabile(MOTIVO_ADA_CASCATA, tabella, []);
  const [dotazione, lordi] = [valoreDi(riga.dotazioneSpesaPubblica), valoreDi(riga.pagamentiLordi)];
  const omessi = omessiCascata(riga);
  const motivo = motivoCascata(codice, dotazione, lordi, riga);
  if (motivo || dotazione == null || lordi == null) return nonDisegnabile(motivo ?? 'la cascata non si può disegnare', tabella, omessi);
  const passi = passiCascata(riga, dotazione, lordi);
  return { opzioni: opzioniCascata(passi, descrizioneCascata(`Cascata dell'intervento ${codice}`, passi, omessi)), tabella, omessi };
}

/** Le voci fuori dalla cascata: l'impegnato assente, le rettifiche assenti (netto e residuo non si disegnano), netto e residuo. */
function omessiCascata(riga: RigaRiepilogo): string[] {
  const conRettifiche = valoreDi(riga.importoRettifiche) != null;
  return [
    valoreDi(riga.impegnatoCofinanziatoFeasrENon) == null ? `Impegnato FEASR e non FEASR ${assenzaImporto(riga.impegnatoCofinanziatoFeasrENon)}` : null,
    conRettifiche ? null : `Rettifiche ${assenzaImporto(riga.importoRettifiche)}: pagamenti netti e residuo non si disegnano`,
    conRettifiche && valoreDi(riga.pagamentiNettoRettifiche) == null ? `Pagamenti netti ${assenzaImporto(riga.pagamentiNettoRettifiche)}` : null,
    conRettifiche && valoreDi(riga.dotazioneResiduaSuPagamenti) == null ? `Residuo sui pagamenti ${assenzaImporto(riga.dotazioneResiduaSuPagamenti)}` : null,
  ].filter((x): x is string => x != null);
}

/** I passi: dotazione e lordi sempre; con le rettifiche anche rettifiche, netti e residuo (quelli valorizzati). */
function passiCascata(riga: RigaRiepilogo, dotazione: number, lordi: number): PassoCascata[] {
  const dopoLordi = centesimi(dotazione - lordi);
  const passi: PassoCascata[] = [
    { nome: 'Dotazione', valore: dotazione, base: 0, colore: COLORI.scuro },
    { nome: 'Pagamenti lordi', valore: lordi, base: dopoLordi, colore: COLORI.attenzione },
  ];
  const [rettifiche, netti, residuo] = [riga.importoRettifiche, riga.pagamentiNettoRettifiche, riga.dotazioneResiduaSuPagamenti].map(valoreDi);
  if (rettifiche == null) return passi;
  passi.push({ nome: 'Rettifiche', valore: rettifiche, base: dopoLordi, colore: COLORI.positivo });
  if (netti != null) passi.push({ nome: 'Pagamenti netti', valore: netti, base: centesimi(dotazione - netti), colore: COLORI.attenzione });
  if (residuo != null) passi.push({ nome: 'Residuo sui pagamenti', valore: residuo, base: 0, colore: COLORI.primario });
  return passi;
}
