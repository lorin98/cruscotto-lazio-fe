// esportazioni.ts — i file dell'interrogazione (D-09, OP-EO-05): CSV e XLSX scritti dal backend con gli stessi filtri e
// ordinamento della pagina, tutte le righe dell'insieme (senza pagina), intestazione e registrazione in
// AUDIT_ESPORTAZIONE. Oltre il limite di NFR-06 il backend risponde 400: il messaggio dice di restringere i filtri, e la
// pagina lo avvisa gia' prima del clic (review v1 V-16). L'XLSX viene per primo: tiene gli zeri iniziali di codici e CUAA.
import { formatNumber, nomeFile } from '../../../shared/lib';
import { salvaFile } from '../../../shared/ui';
import type { Scaricamento } from '../../../shared/ui';
import { LIMITE_ESPORTAZIONE, esportaDomande, esportaPagamenti, rispostaRichiestaNonValida } from '../api';
import type { FormatoEsportazione } from '../api';
import { criteriEsportazione } from '../lib/criteri';
import type { Criteri, Elenco } from '../lib/criteri';

const TITOLI: Record<Elenco, string> = {
  domande: 'Elenco operativo delle domande tx-0056',
  pagamenti: 'Elenco operativo dei pagamenti tx-0059',
};

const UNITA: Record<Elenco, string> = { domande: 'domande', pagamenti: 'righe di pagamento' };

/** Avviso prima del clic: l'insieme supera le righe di un file; null se il file si puo' produrre. */
export function avvisoLimite(elenco: Elenco, totaleRighe: number | undefined): string | null {
  const limite = LIMITE_ESPORTAZIONE[elenco];
  if (totaleRighe === undefined || totaleRighe <= limite) return null;
  return `I file contengono al più ${formatNumber(limite)} ${UNITA[elenco]}: restringi i filtri per scaricarli (ora ${formatNumber(totaleRighe)}).`;
}

/** Il 400 dell'esportazione oltre il limite, detto per esteso; gli altri errori col messaggio del problem-type. */
function messaggioLimite(elenco: Elenco, totaleRighe: number | undefined) {
  return (errore: unknown): string | null =>
    rispostaRichiestaNonValida(errore) && totaleRighe !== undefined && totaleRighe > LIMITE_ESPORTAZIONE[elenco]
      ? `Troppe righe per un file: al più ${formatNumber(LIMITE_ESPORTAZIONE[elenco])} ${UNITA[elenco]}. Restringi i filtri e riprova.`
      : null;
}

/** CSV e XLSX dell'elenco coi criteri della pagina, salvati come "<titolo>.xlsx" e "<titolo>.csv". */
export function scaricamentiElenco(elenco: Elenco, criteri: Criteri, totaleRighe?: number): Scaricamento[] {
  const filtri = criteriEsportazione(criteri);
  const esporta = (formato: FormatoEsportazione) => (elenco === 'domande' ? esportaDomande(formato, filtri) : esportaPagamenti(formato, filtri));
  return (['xlsx', 'csv'] as const).map((formato) => {
    const file = nomeFile(TITOLI[elenco], formato);
    return {
      formato: formato === 'csv' ? 'CSV' : 'XLSX',
      file,
      scarica: async () => salvaFile(await esporta(formato), file),
      messaggioErrore: messaggioLimite(elenco, totaleRighe),
    };
  });
}
