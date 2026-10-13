// Colonne della tabella Domande per anno di raccolta (TX-0008): ogni cella, anno per annualita' e totale dell'anno, porta
// il link all'elenco operativo con quell'anno e quell'annualita' (wireframe domande; nel dettaglio dell'intervento e' la
// tabella equivalente del grafico, percorso da tastiera del clic sui segmenti). Senza il grant dell'elenco restano i numeri.
import type { Colonna } from '../../../shared/ui';
import type { DomandePerAnnoRiga } from '../api';
import type { Annualita } from '../lib/link-elenco';
import { Numero } from './comuni';
import { ApriNellElenco } from './LinkElenco';

const CELLE_ANNO: { titolo: string; campo: 'primaAnnualita' | 'altreAnnualita' | 'nonClassificate' | 'totali'; annualita?: Annualita }[] = [
  { titolo: 'Prima annualità', campo: 'primaAnnualita', annualita: 'PRIMA' },
  { titolo: 'Altre annualità', campo: 'altreAnnualita', annualita: 'ALTRE' },
  { titolo: 'Non classificate', campo: 'nonClassificate', annualita: 'NON_CLASSIFICATE' },
  { titolo: 'Totale', campo: 'totali' },
];

/** Indirizzo dell'elenco per la riga e l'annualita' della cella (assente = tutto l'anno); null senza il grant. */
export type IndirizzoCellaAnno = (riga: DomandePerAnnoRiga, annualita?: Annualita) => string | null;

/** `oggetto` completa la descrizione accessibile del link (es. " dell'intervento SRA01"). */
export function colonneDomandePerAnno(indirizzo: IndirizzoCellaAnno, oggetto = ''): Colonna<DomandePerAnnoRiga>[] {
  return CELLE_ANNO.map((c) => [
    c.titolo,
    (r) => (
      <>
        <Numero valore={r[c.campo]} />
        <ApriNellElenco
          variante="testo"
          indirizzo={indirizzo(r, c.annualita)}
          descrizione={`le domande${oggetto} ${r.annoRaccolta == null ? 'senza anno di raccolta' : `del ${r.annoRaccolta}`}${c.annualita ? `, ${c.titolo.toLowerCase()}` : ''}`}
        />
      </>
    ),
  ]);
}
