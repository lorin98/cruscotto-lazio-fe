// ValoriFiltriNonDisponibili — lo stato "valori dei filtri non disponibili" della pagina: le letture dei valori dei
// filtri fatte col grant e in errore, in role=status col messaggio del problem-type e "Riprova" (le rilegge tutte); i chip
// dell'indirizzo restano e il report si legge lo stesso. Riuscito il nuovo tentativo lo stato sparisce col suo bottone:
// il focus va sul titolo della pagina (WCAG 2.4.3, useFocusSeSparisce del kit). Prima nei mattoni dell'istituzionale
// (TX-0060); il procedurale ci passa TX-0024 e TX-0025. Classi bootstrap-italia, nessun react-aria.
import type { RefObject } from 'react';
import { getErrorMessage } from '../../../shared/lib';
import { useFocusSeSparisce } from '../../../shared/ui';
import type { StatoQuery } from '../../../shared/ui';

/** `letture`: le letture dei valori dei filtri della pagina; null = non fatta (senza il grant). */
export function ValoriFiltriNonDisponibili({ letture, h1 }: { letture: readonly (StatoQuery<unknown> | null)[]; h1: RefObject<HTMLHeadingElement | null> }) {
  const inErrore = letture.filter((l): l is StatoQuery<unknown> => l !== null && l.isError && l.data === undefined);
  useFocusSeSparisce(inErrore.length > 0, h1);
  if (inErrore.length === 0) return null;
  return (
    <div className="alert alert-warning my-3" role="status">
      <span className="me-2">{`Valori dei filtri non disponibili: ${getErrorMessage(inErrore[0].error)} I filtri dell'indirizzo restano applicati come chip rimovibili e il report si legge lo stesso.`}</span>
      <button type="button" className="btn btn-outline-primary btn-sm" onClick={() => inErrore.forEach((l) => void l.refetch())}>
        Riprova
      </button>
    </div>
  );
}
