// ValoreImporto — contenuto di una cella o voce con un Importo dei report: l'euro formattato, oppure lo stato
// dell'assenza come testo (badge + spiegazione), mai uno zero. Classi bootstrap-italia (badge), nessun ARIA complesso.
import { descriviImporto } from '../lib/importo';
import type { ImportoLike } from '../lib/importo';

/** `aggregato`: totale su piu' interventi o domande (cambia la resa di NON_VALORIZZATO, vedi descriviImporto). */
export function ValoreImporto({ importo, aggregato = false }: { importo: ImportoLike | null | undefined; aggregato?: boolean }) {
  const r = descriviImporto(importo, aggregato);
  if (r.disponibile) return <span className="font-monospace">{r.testo}</span>;
  return (
    <span>
      <span className="badge bg-secondary me-1">{r.testo}</span>
      {r.nota && <span className="small">{r.nota}</span>}
    </span>
  );
}
