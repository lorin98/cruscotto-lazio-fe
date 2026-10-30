// TabellaVerificaSigc — la tabella dei venti dati della verifica SMP SIGC (RF015, TX-0015; la stessa della pagina
// /finanziario/sigc/verifica-smp, portata qui col riallineamento degli ambiti del 29/10/2026): TabellaInterattiva del kit
// (cerca, ordina, scegli le colonne, 20 righe per pagina), intestazione di riga sul codice intervento; i dati ASR mancanti
// sono "non disponibile" (decisione di OP-004). Avvisi e azioni attivate sono conteggi col motivo dell'assenza e il top-up
// incluso e la previsione di pagamento un si'/no col motivo (D3, D15, D-11 del backend): il valore, oppure l'assenza resa
// come quella di un importo, mai uno 0 o un "no" inventati; i si'/no sono colonne di testo. Riga apribile (clic o Invio)
// verso il dettaglio dell'intervento. Tabella HTML nativa del kit (caption, th scope, aria-sort).
import type { ReactNode } from 'react';
import { ValoreImporto, ValoreMotivato } from '../../../entities/importo';
import type { DatoMotivatoLike, ImportoLike } from '../../../entities/importo';
import { formatNumber } from '../../../shared/lib';
import { TabellaInterattiva } from '../../../shared/ui';
import type { ColonnaTabella } from '../../../shared/ui';
import type { VerificaSmpRiga } from '../api';
import { numeroOpzionale, siNo, testoOpzionale } from '../lib/formato';
import { NOTA_FILE_VERIFICA_SIGC } from './esportazioni';

type Riga = VerificaSmpRiga;
type Ordinabile = string | number | null | undefined;

/** Conteggio (numero di domande): il backend non lo rende null; un assente resta "-" del formattatore. */
export function Numero({ valore }: { valore: number | null | undefined }) {
  return <span className="font-monospace">{formatNumber(valore)}</span>;
}

/** `numerica` falso: colonna di testo (allineata a sinistra), come i si'/no nel wireframe verifica-smp riapprovato. */
function colonna(chiave: string, titolo: string, valore: (r: Riga) => Ordinabile, resa: (r: Riga) => ReactNode, { numerica = true } = {}): ColonnaTabella<Riga> {
  return { chiave, titolo, valore: (r) => valore(r) ?? null, resa, numerica };
}
const conteggio = (chiave: string, titolo: string, leggi: (r: Riga) => number | null | undefined) => colonna(chiave, titolo, leggi, (r) => <Numero valore={leggi(r)} />);
const importo = (chiave: string, titolo: string, leggi: (r: Riga) => ImportoLike | undefined) => colonna(chiave, titolo, (r) => leggi(r)?.valore, (r) => <ValoreImporto importo={leggi(r)} />);
const opzionale = (chiave: string, titolo: string, leggi: (r: Riga) => number | null | undefined) => colonna(chiave, titolo, leggi, (r) => numeroOpzionale(leggi(r)));
/**
 * Dato del backend col motivo dell'assenza (ConteggioFinanziario, SiNoFinanziario: D3, D15 del backend): il valore reso da
 * `resaValore`, oppure l'assenza come quella di un importo (ValoreMotivato), mai uno 0 o un "no" inventati. Un si'/no si
 * ordina per il suo testo ed e' una colonna di testo (TESTO).
 */
function colonnaMotivata<T extends number | boolean>(
  chiave: string,
  titolo: string,
  leggi: (r: Riga) => DatoMotivatoLike<T> | undefined,
  resaValore: (v: T) => ReactNode,
  opzioni: { numerica?: boolean } = {},
): ColonnaTabella<Riga> {
  const ordinabile = (v: T | null | undefined): Ordinabile => (typeof v === 'boolean' ? siNo(v) : v);
  return colonna(chiave, titolo, (r) => ordinabile(leggi(r)?.valore), (r) => <ValoreMotivato dato={leggi(r)} resa={resaValore} />, opzioni);
}
const numero = (v: number) => <Numero valore={v} />;
/** Colonna di testo: i si'/no non si allineano come numeri (review delta 21/10 V2 del finanziario). */
const TESTO = { numerica: false };

const COLONNE: ColonnaTabella<Riga>[] = [
  { chiave: 'codice', titolo: 'Intervento', valore: (r) => r.codiceIntervento ?? null, fissa: true },
  colonnaMotivata<number>('avvisi', 'Avvisi attivati', (r) => r.avvisiAttivati, numero),
  colonnaMotivata<number>('azioni', 'Azioni attivate', (r) => r.azioniAttivate, numero),
  conteggio('ricevute', 'Domande ricevute', (r) => r.domandeRicevute),
  conteggio('senzaRichiesto', 'Domande ricevute senza richiesto', (r) => r.domandeRicevuteSenzaRichiesto),
  importo('valoreRicevute', 'Valore domande ricevute', (r) => r.valoreDomandeRicevute),
  conteggio('finanziate', 'Domande finanziate', (r) => r.domandeFinanziate),
  importo('valoreFinanziate', 'Valore domande finanziate', (r) => r.valoreDomandeFinanziate),
  importo('dotazionePrecedente', 'Dotazione anno precedente', (r) => r.dotazioneAnnoPrecedente),
  importo('dotazioneImpegno', 'Dotazione periodo di impegno', (r) => r.dotazionePeriodoImpegno),
  conteggio('pagate', "Domande pagate nell'esercizio", (r) => r.domandePagateEsercizio),
  importo('spesaPrecedente', 'Spesa erogata campagna precedente', (r) => r.spesaErogataCampagnaPrecedente),
  importo('spesaAnteriori', 'Spesa erogata campagne anteriori', (r) => r.spesaErogataCampagneAnteriori),
  colonnaMotivata<boolean>('previsione', "Si prevede di pagare nell'esercizio", (r) => r.previsionePagamentoEsercizio, siNo, TESTO),
  importo('topUp', 'Importo top-up', (r) => r.importoTopUp),
  colonnaMotivata<boolean>('includeTopUp', 'Include top-up', (r) => r.includeTopUp, siNo, TESTO),
  opzionale('ettari', 'Ettari o UBA richiesti', (r) => r.ettariUbaRichiesti),
  opzionale('outputAtteso', 'Output atteso delle finanziate', (r) => r.outputAttesoFinanziate),
  opzionale('outputErogato', "Output erogato nell'esercizio", (r) => r.outputErogatoEsercizio),
  colonna('indicatoreOutput', 'Indicatore di output', (r) => r.indicatoreOutput, (r) => testoOpzionale(r.indicatoreOutput)),
  colonna('indicatoreRisultato', 'Indicatore di risultato', (r) => r.indicatoreRisultato, (r) => testoOpzionale(r.indicatoreRisultato)),
];

export function TabellaVerificaSigc({ righe, onRiga }: { righe: readonly Riga[]; onRiga: (codice: string) => void }) {
  return (
    <TabellaInterattiva
      caption="I dati ASR per intervento da confrontare con SMP"
      righe={righe}
      colonne={COLONNE}
      chiaveRiga={(r) => r.codiceIntervento ?? ''}
      testoRicerca={(r) => `${r.codiceIntervento ?? ''} ${r.indicatoreOutput ?? ''} ${r.indicatoreRisultato ?? ''}`}
      segnapostoRicerca="Cerca per codice o indicatore"
      notaRicerca={NOTA_FILE_VERIFICA_SIGC}
      // la riga apre il dettaglio anche da tastiera (Invio), come il clic sulla barra del grafico
      etichettaRiga={(r) => `Apri il dettaglio dell'intervento ${r.codiceIntervento ?? ''}`}
      onRiga={(r) => r.codiceIntervento && onRiga(r.codiceIntervento)}
      perPagina={20}
    />
  );
}
