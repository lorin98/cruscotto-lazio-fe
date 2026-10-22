// TabellaOutput — la tabella dell'output regionale (flusso output-regionale approvato, RF017; OP-IS-06: report tabellare):
// TabellaInterattiva del kit (cerca, ordina, colonne, paginazione) con l'intervento come intestazione di riga, indicatore,
// unita' di misura, target di fine periodo e anno del target, poi una colonna per anno del periodo della risposta coi
// valori della misura scelta dall'interruttore (la didascalia dice quale). Ogni quantita' ha accanto la sua unita' di
// misura e ogni assenza il suo motivo in badge (non valorizzato, non attribuibile), mai uno zero. Riga apribile (clic o
// Invio) verso l'anteprima; CSV e XLSX negli strumenti. Nessun totale: le unita' degli interventi sono diverse. Tabella
// HTML nativa del kit: nessuna griglia react-aria, che qui non serve.
import { AssenzaMotivata, BadgeAssenza, ValoreMotivato } from '../../../entities/importo';
import type { DatoMotivatoLike } from '../../../entities/importo';
import { PulsantiScarica, TabellaInterattiva } from '../../../shared/ui';
import type { ColonnaTabella, Scaricamento } from '../../../shared/ui';
import type { Output, RigaOutput } from '../lib/dto';
import { ANNO_TARGET_ASSENTE, TESTO_ASSENTE, quantita } from '../lib/formato';
import { anniDelPeriodo, captionOutput, datoDellAnno, ordinabileDellAnno, testoRicercaOutput } from '../lib/output';
import type { Misura } from '../lib/output';

/** Una quantita' con l'unita' dell'indicatore accanto, oppure la sua assenza col motivo. */
function Quantita({ dato, unita }: { dato: DatoMotivatoLike<number>; unita: string | null }) {
  return <ValoreMotivato dato={dato} resa={(v) => quantita(v, unita)} />;
}

/** Un testo che il contratto puo' dare null (indicatore, unita' di misura): null e' "non valorizzato". */
function TestoOAssente({ testo }: { testo: string | null }) {
  return testo ?? <AssenzaMotivata dato={TESTO_ASSENTE} />;
}

const FISSE: ColonnaTabella<RigaOutput>[] = [
  { chiave: 'codiceIntervento', titolo: 'Intervento', valore: (r) => r.codiceIntervento, fissa: true },
  { chiave: 'indicatoreOutput', titolo: 'Indicatore di output', valore: (r) => r.indicatoreOutput, resa: (r) => <TestoOAssente testo={r.indicatoreOutput} /> },
  { chiave: 'unitaMisura', titolo: 'Unità di misura', valore: (r) => r.unitaMisura, resa: (r) => <TestoOAssente testo={r.unitaMisura} /> },
  { chiave: 'target', titolo: 'Target di fine periodo', valore: (r) => r.targetFinePeriodo.valore ?? null, resa: (r) => <Quantita dato={r.targetFinePeriodo} unita={r.unitaMisura} />, numerica: true },
  { chiave: 'annoTarget', titolo: 'Anno del target', valore: (r) => r.annoTarget, resa: (r) => (r.annoTarget === null ? <BadgeAssenza resa={ANNO_TARGET_ASSENTE} /> : String(r.annoTarget)), numerica: true },
];

/** Le colonne fisse e una per anno del periodo della risposta, coi valori della misura scelta. */
function colonne(d: Pick<Output, 'annoInizio' | 'annoFine'>, misura: Misura): ColonnaTabella<RigaOutput>[] {
  const anni = anniDelPeriodo(d).map((anno) => ({
    chiave: `anno-${anno}`,
    titolo: String(anno),
    valore: (r: RigaOutput) => ordinabileDellAnno(r, anno, misura),
    resa: (r: RigaOutput) => <Quantita dato={datoDellAnno(r, anno, misura)} unita={r.unitaMisura} />,
    numerica: true,
  }));
  return [...FISSE, ...anni];
}

export function TabellaOutput({ d, misura, scaricamenti, onRiga }: { d: Output; misura: Misura; scaricamenti: readonly Scaricamento[]; onRiga: (codice: string) => void }) {
  return (
    <TabellaInterattiva
      caption={captionOutput(misura, d.realizzatoNonSigcCumulativo)}
      righe={d.righe}
      colonne={colonne(d, misura)}
      chiaveRiga={(r) => r.codiceIntervento}
      testoRicerca={testoRicercaOutput}
      segnapostoRicerca="Cerca per codice, indicatore o unità di misura"
      etichettaRiga={(r) => `Apri l'anteprima dell'intervento ${r.codiceIntervento}`}
      onRiga={(r) => onRiga(r.codiceIntervento)}
      strumenti={<PulsantiScarica oggetto="i dati dell'output regionale" scaricamenti={scaricamenti} />}
    />
  );
}
