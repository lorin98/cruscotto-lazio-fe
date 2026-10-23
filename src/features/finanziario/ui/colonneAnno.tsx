// Colonne della tabella Domande per anno di raccolta (TX-0008): ogni cella, anno per annualita' e totale dell'anno, porta
// il link all'elenco operativo con quell'anno e quell'annualita' (wireframe domande; nel dettaglio dell'intervento e' la
// tabella equivalente del grafico, percorso da tastiera del clic sui segmenti). Senza il grant dell'elenco restano i numeri.
// Titoli e formato delle celle sono quelli della tabella equivalente del grafico (ANNUALITA_DOMANDE, numeroOpzionale): con o
// senza il grant la vista Tabella ha le stesse intestazioni e gli stessi testi, link a parte.
import { ApriNellElenco } from '../../../entities/domanda';
import type { Colonna } from '../../../shared/ui';
import type { DomandePerAnnoRiga } from '../api';
import { annoDiRaccolta, numeroOpzionale } from '../lib/formato';
import { ANNUALITA_DOMANDE } from '../lib/grafici';
import type { Annualita } from '../../../entities/domanda';

const CELLE_ANNO: { titolo: string; campo: 'primaAnnualita' | 'altreAnnualita' | 'nonClassificate' | 'totali'; annualita?: Annualita }[] = [
  ...ANNUALITA_DOMANDE.map((a) => ({ titolo: a.nome, campo: a.campo, annualita: a.codice })),
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
        <span className="font-monospace">{numeroOpzionale(r[c.campo])}</span>
        <ApriNellElenco
          variante="testo"
          indirizzo={indirizzo(r, c.annualita)}
          descrizione={`le domande${oggetto} ${r.annoRaccolta == null ? annoDiRaccolta(null) : `del ${r.annoRaccolta}`}${c.annualita ? `, ${c.titolo.toLowerCase()}` : ''}`}
        />
      </>
    ),
  ]);
}
