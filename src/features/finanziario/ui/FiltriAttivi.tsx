// FiltriAttivi — riga dei filtri attivi di un report (RF001, wireframe: "Filtri attivi: ...; OS, OG, OP e Azioni
// portanti: tutti"). I valori arrivano gia' validati da filtriDaRicerca; le descrizioni (intervento, azione portante)
// vengono dai valori dei filtri del backend se disponibili, altrimenti resta il codice. Testo semplice, niente ARIA.
import type { ReactNode } from 'react';
import { hasGrant, useAuthStatus } from '../../../shared/api/auth/use-auth-status';
import { useFiltri } from '../api';
import type { VoceFiltro } from '../api';
import { CHIAVI_FILTRO } from '../lib/filtri';
import type { ChiaveFiltro, Filtri } from '../lib/filtri';

const ETICHETTE: Record<ChiaveFiltro, string> = { intervento: 'Intervento', os: 'OS', og: 'OG', op: 'OP', azione: 'Azione portante' };
const LIBERE: Record<ChiaveFiltro, string> = { intervento: 'interventi', os: 'OS', og: 'OG', op: 'OP', azione: 'azioni portanti' };

function descrizioni(voci: VoceFiltro[] | undefined): Map<string, string> {
  return new Map((voci ?? []).filter((v) => v.chiave && v.descrizione).map((v) => [v.chiave as string, v.descrizione as string]));
}


function elenco(nomi: string[]): string {
  return nomi.length <= 1 ? nomi.join('') : `${nomi.slice(0, -1).join(', ')} e ${nomi[nomi.length - 1]}`;
}

export function FiltriAttivi({ filtri, modifica }: { filtri: Filtri; modifica?: ReactNode }) {
  // le descrizioni vengono da TX-0001: senza il suo grant si mostrano i soli codici (R-09)
  const { data } = useFiltri(hasGrant(useAuthStatus().data, 'csr.tx-0001.read'));
  const testi: Partial<Record<ChiaveFiltro, Map<string, string>>> = {
    intervento: descrizioni(data?.interventi),
    azione: descrizioni(data?.azioniPortanti),
  };
  const attivi = CHIAVI_FILTRO.filter((k) => (filtri[k]?.length ?? 0) > 0);
  const liberi = CHIAVI_FILTRO.filter((k) => !attivi.includes(k)).map((k) => LIBERE[k]);
  const parti = attivi.map((k) => {
    const valori = (filtri[k] ?? []).map((v) => (testi[k]?.get(v) ? `${v} - ${testi[k]?.get(v)}` : v));
    return `${ETICHETTE[k]} ${valori.join(', ')}`;
  });
  const libero = liberi.length > 0 ? `${elenco(liberi)}: tutti` : '';
  const testo = attivi.length === 0 ? `nessuno (${libero})` : [...parti, libero].filter(Boolean).join('; ');
  return (
    <p className="mb-2">
      Filtri attivi: {testo}. {modifica}
    </p>
  );
}
