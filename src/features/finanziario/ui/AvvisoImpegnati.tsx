// AvvisoImpegnati — avviso sempre visibile (revisione del 04/11/2026, secondo feedback di Leonardo/Deloitte, wireframe
// riepilogo e dotazione-avanzamento) quando nella selezione l'impegnato cofinanziato FEASR differisce dall'impegnato
// cofinanziato FEASR e non: elenca gli interventi con le due quantita'. Nel Riepilogo legge le righe gia' caricate di
// TX-0011; in Dotazione e spesa le legge da TX-0011 col suo grant, senza mostrare nulla mentre carica, in errore o
// senza il grant (l'avviso accompagna il grafico, non e' una sezione).
import { formatEuro, plurale } from '../../../shared/lib';
import { hasGrant, useAuthStatus } from '../../../shared/api/auth/use-auth-status';
import { useRiepilogo } from '../api';
import type { Filtri } from '../lib/filtri';
import { impegnatiDiversi } from '../lib/impegnati';
import type { RigaImpegnati } from '../lib/impegnati';
import { GRANT } from '../lib/report';

export function AvvisoImpegnati({ righe }: { righe: readonly RigaImpegnati[] }) {
  const diversi = impegnatiDiversi(righe);
  if (diversi.length === 0) return null;
  return (
    <div className="alert alert-warning my-3" role="note">
      <strong>{`Impegnato cofinanziato FEASR diverso dall'impegnato cofinanziato FEASR e non in ${plurale(diversi.length, 'intervento', 'interventi')}.`}</strong>{' '}
      {"Il cofinanziato FEASR è riportato alla dotazione quando l'impegnato la supera: "}
      {diversi.map((d) => `${d.codice} ${formatEuro(d.feasr)} su ${formatEuro(d.feasrENon)}`).join('; ')}
      {". Negli altri interventi i due impegnati coincidono con l'impegnato di spesa pubblica."}
    </div>
  );
}

function AvvisoDaRiepilogo({ filtri }: { filtri: Filtri }) {
  const stato = useRiepilogo(filtri);
  return stato.data ? <AvvisoImpegnati righe={stato.data.righe ?? []} /> : null;
}

/** L'avviso fuori dal Riepilogo: legge TX-0011 solo con il suo grant. */
export function AvvisoImpegnatiDellaSelezione({ filtri }: { filtri: Filtri }) {
  return hasGrant(useAuthStatus().data, GRANT.riepilogo) ? <AvvisoDaRiepilogo filtri={filtri} /> : null;
}
