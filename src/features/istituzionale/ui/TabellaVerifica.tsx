// TabellaVerifica — la card "Dati per intervento" della verifica SMP non SIGC (flusso verifica-smp-non-sigc approvato,
// RF016): TabellaInterattiva del kit (cerca, ordina, colonne, paginazione) coi ventuno dati di TX-0016 nell'ordine del
// wireframe, l'intervento come intestazione di riga, visibili di partenza le colonne del low-fi (le altre da "Colonne"),
// i si'/no e gli indicatori come colonne di testo; ogni dato mancante dice il motivo (mai uno 0 o un "no" inventati), le
// celle Domande ricevute e Spesa erogata portano "Apri nell'elenco" e "Apri nei pagamenti" verso l'elenco operativo (solo
// con un valore maggiore di 0 e col grant della destinazione: OP-IS-09). Riga apribile (clic o Invio) verso il dettaglio
// dell'intervento; CSV e XLSX negli strumenti; sotto, le definizioni del backend (OP-IS-07). Tabella HTML nativa del kit
// (caption, th scope, aria-sort): nessuna griglia react-aria, che qui non serve (niente selezione ne' modifica di celle).
import { PulsantiScarica, Sezione, TabellaInterattiva } from '../../../shared/ui';
import type { ColonnaTabella, Scaricamento } from '../../../shared/ui';
import type { RigaVerifica, Verifica } from '../lib/dto';
import { DEFINIZIONI_VERIFICA } from '../lib/formato';
import { DATI_VERIFICA, testoRicerca, titoloDato, valoreOrdinabile } from '../lib/verifica';
import type { LinkDato, TipoDato } from '../lib/verifica';
import { CellaDato } from './comuni';
import { NOTA_FILE_VERIFICA, OGGETTO_FILE_VERIFICA } from './esportazioni';

import { usePuoAprireElenco } from './navigazione';

const TITOLO_TABELLA_VERIFICA = 'Dati per intervento';
const CAPTION = 'Verifica SMP non SIGC: l\'intervento è l\'intestazione di riga, un dato mancante dice il motivo (mai uno 0 o un "no" inventati)';
const DI_TESTO: ReadonlySet<TipoDato> = new Set(['siNo', 'testo']);
const INTERVENTO: ColonnaTabella<RigaVerifica> = { chiave: 'codiceIntervento', titolo: 'Intervento', valore: (r) => r.codiceIntervento, fissa: true };

/** Le colonne dai dati di lib/verifica: l'intervento, poi i ventuno dati col loro titolo, ordinamento e resa. */
function colonne(cumulativo: boolean, puo: (l: LinkDato) => boolean): ColonnaTabella<RigaVerifica>[] {
  return [
    INTERVENTO,
    ...DATI_VERIFICA.map((d) => ({
      chiave: d.campo,
      titolo: titoloDato(d, 'colonna', cumulativo),
      valore: (r: RigaVerifica) => valoreOrdinabile(r, d),
      resa: (r: RigaVerifica) => <CellaDato r={r} d={d} puo={puo} />,
      numerica: !DI_TESTO.has(d.tipo),
      nascosta: d.nascosta,
    })),
  ];
}

export function TabellaVerifica({ d, scaricamenti, onRiga }: { d: Verifica; scaricamenti: readonly Scaricamento[]; onRiga: (codice: string) => void }) {
  const puo = usePuoAprireElenco();
  return (
    <Sezione titolo={TITOLO_TABELLA_VERIFICA}>
      <p className="ui-nota">{NOTA_FILE_VERIFICA}</p>
      <TabellaInterattiva
        caption={CAPTION}
        righe={d.righe}
        colonne={colonne(d.outputCumulativo, puo)}
        chiaveRiga={(r) => r.codiceIntervento}
        testoRicerca={testoRicerca}
        segnapostoRicerca="Cerca per codice o indicatore"
        etichettaRiga={(r) => `Apri il dettaglio dell'intervento ${r.codiceIntervento}`}
        onRiga={(r) => onRiga(r.codiceIntervento)}
        strumenti={<PulsantiScarica oggetto={OGGETTO_FILE_VERIFICA} scaricamenti={scaricamenti} />}
      />
      <p className="ui-fonte">{DEFINIZIONI_VERIFICA}</p>
    </Sezione>
  );
}
