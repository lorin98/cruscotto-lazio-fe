// grafici.ts — builder PURI dei grafici dell'istituzionale, dal catalogo dei tipi del kit (ADR 0027): barre per un
// confronto fra interventi, la spesa pubblica erogata non SIGC di TX-0016 e la spesa erogata nella campagna precedente di
// TX-0015 (verifica SMP SIGC, venuta dal finanziario il 29/10/2026; la previsione di pagamento e' un si'/no, D-11 del
// backend: sta nella tabella, non nel grafico), zoom oltre 12; clic: il dettaglio dell'intervento. Gli interventi senza
// valore sono omessi e dichiarati col motivo, mai a zero. L'output per anno di TX-0017 e' del fisico dal 29/10/2026.
import { descriviImporto, testoConNota } from '../../../entities/importo';
import type { ImportoLike } from '../../../entities/importo';
import { barreRaggruppate, formatEuro, numeroDi } from '../../../shared/lib';
import type { DatiGrafico, VoceRaggruppata } from '../../../shared/lib';
import type { RigaVerifica, RigaVerificaSigc } from './dto';

/** Cella della tabella equivalente di un importo: euro al centesimo, oppure l'assenza col motivo (mai uno zero). */
function cellaImporto(importo: ImportoLike): string {
  return importo.valore != null ? formatEuro(importo.valore) : testoConNota(descriviImporto(importo));
}

export const TITOLO_SPESA = 'Spesa pubblica erogata per intervento (anticipi inclusi)';

/** Barre della spesa pubblica erogata non SIGC per intervento (anticipi inclusi, al lordo dei recuperi); clic: il dettaglio. */
export function graficoSpesa(righe: readonly RigaVerifica[]): DatiGrafico {
  const voci: VoceRaggruppata[] = righe.map((r) => ({ categoria: r.codiceIntervento, codice: r.codiceIntervento, valori: [numeroDi(r.spesaErogata.valore)], celle: [cellaImporto(r.spesaErogata)] }));
  return barreRaggruppate(voci, [{ nome: 'Spesa pubblica erogata (anticipi inclusi)', soggetto: 'spesa pubblica erogata' }], {
    caption: 'Spesa pubblica erogata non SIGC per intervento (anticipi inclusi, al lordo dei recuperi)',
    colonne: ['Intervento', 'Spesa pubblica erogata (anticipi inclusi)'],
    titolo: 'Barre della spesa pubblica erogata non SIGC',
    vuoto: 'nessun intervento con la spesa erogata valorizzata',
    unita: ['intervento', 'interventi'],
  });
}

export const TITOLO_SPESA_SIGC = 'Spesa erogata nella campagna precedente per intervento';

/** Una riga senza codice (i campi di TX-0015 sono facoltativi nella spec) resta riconoscibile nelle barre e negli omessi. */
const SENZA_CODICE = 'Senza codice';

/** Barre della spesa erogata nella campagna precedente per intervento (TX-0015, verifica SMP SIGC); clic: il dettaglio. */
export function graficoSpesaSigc(righe: readonly RigaVerificaSigc[]): DatiGrafico {
  const voci: VoceRaggruppata[] = righe.map((r) => {
    const codice = r.codiceIntervento?.trim() || SENZA_CODICE;
    const spesa = r.spesaErogataCampagnaPrecedente ?? {};
    return { categoria: codice, codice, valori: [numeroDi(spesa.valore)], celle: [cellaImporto(spesa)] };
  });
  return barreRaggruppate(voci, [{ nome: 'Spesa erogata nella campagna precedente', soggetto: 'spesa erogata nella campagna precedente' }], {
    caption: 'Spesa erogata nella campagna precedente per intervento',
    colonne: ['Intervento', 'Spesa erogata nella campagna precedente'],
    titolo: 'Barre della spesa erogata nella campagna precedente',
    vuoto: 'nessun intervento con spesa erogata valorizzata',
    unita: ['intervento', 'interventi'],
  });
}
