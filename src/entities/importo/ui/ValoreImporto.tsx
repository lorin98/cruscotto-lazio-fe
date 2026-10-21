// ValoreImporto — contenuto di una cella o voce con un Importo dei report: l'euro formattato, oppure lo stato
// dell'assenza come testo (badge + spiegazione), mai uno zero. E' il ValoreMotivato di un importo.
import { formatEuro } from '../../../shared/lib';
import type { ImportoLike } from '../lib/importo';
import { ValoreMotivato } from './ValoreMotivato';

const euro = (valore: number) => <span className="font-monospace">{formatEuro(valore)}</span>;

/** `aggregato`: totale su piu' interventi o domande (cambia la resa di NON_VALORIZZATO, vedi descriviAssenza). */
export function ValoreImporto({ importo, aggregato = false }: { importo: ImportoLike | null | undefined; aggregato?: boolean }) {
  return <ValoreMotivato dato={importo} resa={euro} aggregato={aggregato} />;
}
