// PerimetroPill — perimetro dei dati nella barra dei filtri (wireframe v2: "Perimetro: regionale", non rimovibile).
// Il perimetro lo dichiara ogni risposta del finanziario: la pill legge quelle gia' in cache, senza letture proprie,
// e dice "la tua area (ADA)" se anche una sola sezione e' limitata all'area del profilo.
import { useSyncExternalStore } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { QueryClient } from '@tanstack/react-query';
import { perimetroBreve } from '../lib/perimetro';
import type { Perimetro } from '../lib/perimetro';

function perimetroDallaCache(client: QueryClient): Perimetro | undefined {
  const perimetri = client
    .getQueryCache()
    .findAll()
    .filter((q) => String(q.queryKey[0] ?? '').startsWith('/api/finanziario/'))
    .map((q) => (q.state.data as { perimetro?: unknown } | undefined)?.perimetro);
  if (perimetri.includes('ADA')) return 'ADA';
  return perimetri.includes('REGIONALE') ? 'REGIONALE' : undefined;
}

export function PerimetroPill() {
  const client = useQueryClient();
  const perimetro = useSyncExternalStore(
    (avvisa) => client.getQueryCache().subscribe(avvisa),
    () => perimetroDallaCache(client),
  );
  if (!perimetro) return null;
  return <span className={perimetro === 'ADA' ? 'ui-pill ui-pill--perimetro' : 'ui-pill'}>{`Perimetro: ${perimetroBreve(perimetro)}`}</span>;
}
