// intervento.ts — grafico della pagina di dettaglio di un intervento (riga di TX-0011): cascata dalla dotazione ai
// pagamenti netti e al residuo sui pagamenti. Col perimetro ADA la dotazione e' regionale e il residuo FUORI_PERIMETRO:
// la cascata non si disegna (suggerirebbe un residuo che il backend nega), la tabella delle voci resta.
import type { ImportoLike } from '../../../../entities/importo';
import { COLORI, centesimi, descrizioneCascata, nonDisegnabile, opzioniCascata } from '../../../../shared/lib';
import type { DatiGrafico, PassoCascata, TabellaEquivalente } from '../../../../shared/lib';
import type { RigaRiepilogo } from '../dto';
import { assenzaImporto, cellaImporto, codiceDi, valoreDi } from '../importi';
import { PERIMETRO_ADA, etichettaDiProgramma } from '../perimetro';

const MOTIVO_ADA_CASCATA = "perimetro ADA: la dotazione è regionale, i pagamenti sono dell'area e il residuo è fuori perimetro";

/** Tutte le voci della riga, con le assenze dichiarate: tabella della cascata e scheda "Tutte le voci" del dettaglio. */
export function vociIntervento(riga: RigaRiepilogo, perimetro?: string | null): TabellaEquivalente {
  const programma = (nome: string) => etichettaDiProgramma(nome, perimetro);
  const voci: Array<[string, ImportoLike | null | undefined]> = [
    [programma('Dotazione di spesa pubblica'), riga.dotazioneSpesaPubblica],
    [programma('Quota FEASR'), riga.risorseQuotaFeasr],
    [programma('Stanziato'), riga.importoStanziato],
    ['Impegnato FEASR', riga.impegnatoCofinanziatoFeasr],
    ['Impegnato FEASR e non FEASR', riga.impegnatoCofinanziatoFeasrENon],
    ['Pagamenti al netto delle rettifiche', riga.pagamentiNettoRettifiche],
    ['Residuo sugli impegni', riga.dotazioneResiduaSuImpegni],
    ['Residuo sui pagamenti', riga.dotazioneResiduaSuPagamenti],
  ];
  return { caption: `Intervento ${codiceDi(riga)}: dalla dotazione al residuo sui pagamenti`, colonne: ['Voce', 'Importo'], righe: voci.map(([nome, importo]) => [nome, cellaImporto(importo)]) };
}

function motivoCascata(codice: string, dotazione: number | null, pagamenti: number | null, residuo: number | null, riga: RigaRiepilogo): string | null {
  if (dotazione == null || pagamenti == null) {
    const mancanti = [dotazione == null ? `dotazione: ${assenzaImporto(riga.dotazioneSpesaPubblica)}` : null, pagamenti == null ? `pagamenti netti: ${assenzaImporto(riga.pagamentiNettoRettifiche)}` : null];
    return `la cascata di ${codice} richiede dotazione e pagamenti netti; ${mancanti.filter(Boolean).join('; ')}`;
  }
  if (dotazione < 0 || pagamenti < 0 || (residuo != null && residuo < 0)) return `importi negativi per ${codice}: la cascata non si può disegnare`;
  return pagamenti > dotazione ? `i pagamenti netti di ${codice} superano la dotazione: la cascata non si può disegnare` : null;
}

/** Cascata di un intervento: dotazione -> pagamenti netti -> residuo sui pagamenti; tabella con tutta la riga. */
export function graficoCascataIntervento(riga: RigaRiepilogo, perimetro?: string | null): DatiGrafico {
  const codice = codiceDi(riga);
  const tabella = vociIntervento(riga, perimetro);
  if (perimetro === PERIMETRO_ADA) return nonDisegnabile(MOTIVO_ADA_CASCATA, tabella, []);
  const [dotazione, pagamenti, residuo] = [valoreDi(riga.dotazioneSpesaPubblica), valoreDi(riga.pagamentiNettoRettifiche), valoreDi(riga.dotazioneResiduaSuPagamenti)];
  const omessi = [
    valoreDi(riga.impegnatoCofinanziatoFeasrENon) == null ? `Impegnato FEASR e non FEASR ${assenzaImporto(riga.impegnatoCofinanziatoFeasrENon)}` : null,
    residuo == null ? `Residuo sui pagamenti ${assenzaImporto(riga.dotazioneResiduaSuPagamenti)}` : null,
  ].filter((x): x is string => x != null);
  const motivo = motivoCascata(codice, dotazione, pagamenti, residuo, riga);
  if (motivo || dotazione == null || pagamenti == null) return nonDisegnabile(motivo ?? 'la cascata non si può disegnare', tabella, omessi);
  const passi: PassoCascata[] = [
    { nome: 'Dotazione', valore: dotazione, base: 0, colore: COLORI.scuro },
    { nome: 'Pagamenti netti', valore: pagamenti, base: centesimi(dotazione - pagamenti), colore: COLORI.attenzione },
  ];
  if (residuo != null) passi.push({ nome: 'Residuo sui pagamenti', valore: residuo, base: 0, colore: COLORI.primario });
  return { opzioni: opzioniCascata(passi, descrizioneCascata(`Cascata dell'intervento ${codice}`, passi, omessi)), tabella, omessi };
}
