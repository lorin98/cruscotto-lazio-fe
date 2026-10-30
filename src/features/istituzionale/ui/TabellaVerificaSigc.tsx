// TabellaVerificaSigc — la card "Dati per intervento" della verifica SMP SIGC (flusso verifica-smp-sigc approvato il
// 30/10/2026, RF015, TX-0015; la stessa tabella della pagina /finanziario/sigc/verifica-smp, portata qui col riallineamento
// degli ambiti del 29/10/2026 e resa come quella della verifica non SIGC): TabellaInterattiva del kit (cerca, ordina,
// colonne, 20 righe per pagina) coi venti dati di lib/verificaSigc nell'ordine e coi titoli della pagina del finanziario,
// l'intervento come intestazione di riga, visibili di partenza le colonne del low-fi (le altre da "Colonne"), i si'/no e
// gli indicatori come colonne di testo; ogni dato mancante dice il motivo, mai uno 0 o un "no" inventati. Riga apribile
// (clic o Invio) verso il dettaglio dell'intervento; CSV e XLSX negli strumenti con la nota sui file; sotto, le definizioni
// del backend (OP-IS-07). Tabella HTML nativa del kit (caption, th scope, aria-sort).
import { PulsantiScarica, Sezione, TabellaInterattiva } from '../../../shared/ui';
import type { ColonnaTabella, Scaricamento } from '../../../shared/ui';
import type { RigaVerificaSigc } from '../lib/dto';
import { DEFINIZIONI_VERIFICA_SIGC } from '../lib/formato';
import { DATI_VERIFICA_SIGC, testoRicercaSigc, valoreOrdinabileSigc } from '../lib/verificaSigc';
import type { TipoDatoSigc } from '../lib/verificaSigc';
import { ValoreDelDatoSigc } from './comuni';
import { NOTA_FILE_VERIFICA } from './esportazioni';

const TITOLO_TABELLA = 'Dati per intervento';
/** Colonne di testo: i si'/no e gli indicatori non si allineano come numeri (review delta 21/10 V2 del finanziario). */
const DI_TESTO: ReadonlySet<TipoDatoSigc> = new Set(['siNo', 'testo']);
const INTERVENTO: ColonnaTabella<RigaVerificaSigc> = { chiave: 'codiceIntervento', titolo: 'Intervento', valore: (r) => r.codiceIntervento ?? null, fissa: true };

/** Le colonne dai dati di lib/verificaSigc: l'intervento, poi i venti dati col loro titolo, ordinamento e resa. */
const COLONNE: ColonnaTabella<RigaVerificaSigc>[] = [
  INTERVENTO,
  ...DATI_VERIFICA_SIGC.map((d) => ({
    chiave: d.campo,
    titolo: d.colonna,
    valore: (r: RigaVerificaSigc) => valoreOrdinabileSigc(r, d),
    resa: (r: RigaVerificaSigc) => <ValoreDelDatoSigc r={r} d={d} />,
    numerica: !DI_TESTO.has(d.tipo),
    nascosta: d.nascosta,
  })),
];

interface PropsTabella {
  righe: readonly RigaVerificaSigc[];
  esercizio: number;
  scaricamenti: readonly Scaricamento[];
  /** Completa "Scarica …" nei pulsanti dei file (dice l'esercizio). */
  oggetto: string;
  onRiga: (codice: string) => void;
}

export function TabellaVerificaSigc({ righe, esercizio, scaricamenti, oggetto, onRiga }: PropsTabella) {
  return (
    <Sezione titolo={TITOLO_TABELLA}>
      <p className="ui-nota">{NOTA_FILE_VERIFICA}</p>
      <TabellaInterattiva
        caption={`Verifica SMP SIGC, esercizio ${esercizio}: l'intervento è l'intestazione di riga, un dato mancante dice il motivo (mai uno 0 o un "no" inventati)`}
        righe={righe}
        colonne={COLONNE}
        chiaveRiga={(r) => r.codiceIntervento ?? ''}
        testoRicerca={testoRicercaSigc}
        segnapostoRicerca="Cerca per codice o indicatore"
        // la riga apre il dettaglio anche da tastiera (Invio), come il clic sulla barra del grafico
        etichettaRiga={(r) => `Apri il dettaglio dell'intervento ${r.codiceIntervento ?? ''}`}
        onRiga={(r) => r.codiceIntervento && onRiga(r.codiceIntervento)}
        perPagina={20}
        strumenti={<PulsantiScarica oggetto={oggetto} scaricamenti={scaricamenti} />}
      />
      <p className="ui-fonte">{DEFINIZIONI_VERIFICA_SIGC}</p>
    </Sezione>
  );
}
