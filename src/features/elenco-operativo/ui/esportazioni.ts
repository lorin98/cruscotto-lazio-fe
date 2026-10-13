// esportazioni.ts — i file dell'interrogazione (D-09, OP-EO-05): CSV e XLSX scritti dal backend con gli stessi filtri e
// ordinamento della pagina, tutte le righe dell'insieme (senza pagina), intestazione e registrazione in
// AUDIT_ESPORTAZIONE. Oltre il limite di NFR-06 il backend risponde 400 e PulsantiScarica lo dice accanto ai pulsanti.
import { nomeFile } from '../../../shared/lib';
import { salvaFile } from '../../../shared/ui';
import type { Scaricamento } from '../../../shared/ui';
import { esportaDomande, esportaPagamenti } from '../api';
import type { FormatoEsportazione } from '../api';
import { criteriEsportazione } from '../lib/criteri';
import type { Criteri, Elenco } from '../lib/criteri';

const TITOLI: Record<Elenco, string> = {
  domande: 'Elenco operativo delle domande tx-0056',
  pagamenti: 'Elenco operativo dei pagamenti tx-0059',
};

/** CSV e XLSX dell'elenco coi criteri della pagina, salvati come "<titolo>.csv" e "<titolo>.xlsx". */
export function scaricamentiElenco(elenco: Elenco, criteri: Criteri): Scaricamento[] {
  const filtri = criteriEsportazione(criteri);
  const esporta = (formato: FormatoEsportazione) => (elenco === 'domande' ? esportaDomande(formato, filtri) : esportaPagamenti(formato, filtri));
  return (['xlsx', 'csv'] as const).map((formato) => {
    const file = nomeFile(TITOLI[elenco], formato);
    return { formato: formato === 'csv' ? 'CSV' : 'XLSX', file, scarica: async () => salvaFile(await esporta(formato), file) };
  });
}
