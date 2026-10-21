// ValoreMotivato — contenuto di una cella o voce con un dato col motivo dell'assenza (conteggio, si'/no, atto...): il valore
// reso dal chiamante, oppure l'assenza come quella di un importo (badge + spiegazione: motivo e fonte attesa), mai uno zero
// ne' un "no" inventati (review delta 21/10 H1). Classi bootstrap-italia (badge), nessun ARIA complesso.
import type { ReactNode } from 'react';
import { descriviAssenza } from '../lib/importo';
import type { DatoMotivatoLike } from '../lib/importo';

/** L'assenza di un dato motivato: lo stato in un badge e la spiegazione accanto. */
export function AssenzaMotivata({ dato, aggregato = false }: { dato: Pick<DatoMotivatoLike<unknown>, 'motivo' | 'fonte'> | null | undefined; aggregato?: boolean }) {
  const r = descriviAssenza(dato, aggregato);
  return (
    <span>
      <span className="badge bg-secondary me-1">{r.testo}</span>
      {r.nota && <span className="small">{r.nota}</span>}
    </span>
  );
}

/** `resa`: come si mostra il valore presente; `aggregato`: totale su piu' interventi o domande (vedi descriviAssenza). */
export function ValoreMotivato<T>({ dato, resa, aggregato = false }: { dato: DatoMotivatoLike<T> | null | undefined; resa: (valore: T) => ReactNode; aggregato?: boolean }) {
  if (dato?.valore != null) return <>{resa(dato.valore)}</>;
  return <AssenzaMotivata dato={dato} aggregato={aggregato} />;
}
