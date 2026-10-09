// PerimetroPill — perimetro dei dati nella barra dei filtri (wireframe v2: "Perimetro: regionale", non rimovibile).
// Il perimetro lo dichiara ogni risposta del finanziario: la pill legge quelle gia' in cache, senza letture proprie,
// attraverso il confine api/ (perimetriInCache, review N-07), e le combina con la funzione pura di lib/perimetro.ts:
// "la tua area (ADA)" se anche una sola sezione e' limitata all'area del profilo. Si aggiorna a ogni cambio della cache.
import { useCallback, useSyncExternalStore } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { perimetriInCache } from '../api';
import { PERIMETRO_ADA, perimetroBreve, perimetroCombinato } from '../lib/perimetro';

export function PerimetroPill() {
  const client = useQueryClient();
  const iscriviti = useCallback((avvisa: () => void) => client.getQueryCache().subscribe(avvisa), [client]);
  const perimetro = useSyncExternalStore(iscriviti, () => perimetroCombinato(perimetriInCache(client)));
  if (!perimetro) return null;
  return <span className={perimetro === PERIMETRO_ADA ? 'ui-pill ui-pill--evidenza' : 'ui-pill'}>{`Perimetro: ${perimetroBreve(perimetro)}`}</span>;
}
