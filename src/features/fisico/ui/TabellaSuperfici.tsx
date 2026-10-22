// TabellaSuperfici — vista Tabella delle superfici (flusso superfici approvato): TabellaInterattiva del kit (cerca, ordina,
// colonne, paginazione), una riga per intervento e campagna con tutte le campagne della risposta, un intervento senza
// superfici in una riga sola col motivo (mai zeri), un totale per campagna nel piede calcolato sulle righe trovate e nessun
// totale generale (le campagne non si sommano, D-01), CSV e XLSX di TX-0018 coi filtri della pagina negli strumenti, riga
// apribile (clic o Invio) verso l'anteprima dell'intervento. Tabella HTML nativa del kit (caption, th scope, aria-sort):
// nessuna griglia react-aria, che qui non serve (niente selezione ne' modifica di celle).
import { useMemo } from 'react';
import { ValoreMotivato } from '../../../entities/importo';
import { formatNumber, plurale } from '../../../shared/lib';
import { PulsantiScarica, TabellaInterattiva } from '../../../shared/ui';
import type { ColonnaTabella, RigaPiede } from '../../../shared/ui';
import type { CriteriSuperfici } from '../api';
import type { InterventoSuperficie } from '../lib/dto';
import { ETICHETTE, SENZA_SUPERFICI, cellaDifferenza, cellaSuperficie } from '../lib/formato';
import { interventiDelleRighe, righeTabella, totaliPerCampagna } from '../lib/superfici';
import type { RigaSuperficie, TotaliCampagna } from '../lib/superfici';
import { scaricamentiSuperfici } from './esportazioni';

export const TITOLO_TABELLA = 'Superfici per intervento e campagna';

type CampoNumero = 'domandePagamento' | 'domandeSostegno' | 'domandeDpOltreDs' | 'sostegniDiscordanti';
type CampoEttari = 'superficieDs' | 'superficieDp' | 'differenzaDpDs';

const numero = (chiave: CampoNumero): ColonnaTabella<RigaSuperficie> => ({
  chiave,
  titolo: ETICHETTE[chiave],
  valore: (r) => r.campagna?.[chiave] ?? null,
  resa: (r) => (r.campagna ? formatNumber(r.campagna[chiave]) : ''),
  numerica: true,
});

const ettari = (chiave: CampoEttari): ColonnaTabella<RigaSuperficie> => ({
  chiave,
  titolo: ETICHETTE[chiave],
  valore: (r) => r.campagna?.[chiave] ?? null,
  resa: (r) => (r.campagna ? (chiave === 'differenzaDpDs' ? cellaDifferenza(r.campagna[chiave]) : cellaSuperficie(r.campagna[chiave])) : ''),
  numerica: true,
});

const COLONNE: ColonnaTabella<RigaSuperficie>[] = [
  { chiave: 'intervento', titolo: ETICHETTE.intervento, valore: (r) => r.codiceIntervento, fissa: true },
  { chiave: 'campagna', titolo: ETICHETTE.campagna, valore: (r) => r.campagna?.anno ?? null, resa: (r) => (r.campagna ? String(r.campagna.anno) : SENZA_SUPERFICI) },
  numero('domandePagamento'),
  numero('domandeSostegno'),
  ettari('superficieDs'),
  ettari('superficieDp'),
  ettari('differenzaDpDs'),
  numero('domandeDpOltreDs'),
  numero('sostegniDiscordanti'),
  {
    chiave: 'quantitaRichiestaPremio',
    titolo: ETICHETTE.quantitaRichiestaPremio,
    valore: (r) => r.campagna?.quantitaRichiestaPremio.valore ?? null,
    resa: (r) => (r.campagna ? <ValoreMotivato dato={r.campagna.quantitaRichiestaPremio} resa={(v) => formatNumber(v)} /> : ''),
  },
];

/** Riga del piede di una campagna: le somme dentro la campagna, sulle righe trovate. */
function rigaTotale(t: TotaliCampagna): RigaPiede {
  return {
    intervento: `Totale campagna ${t.anno} (${plurale(t.interventi, 'intervento con superfici', 'interventi con superfici')})`,
    campagna: String(t.anno),
    domandePagamento: formatNumber(t.domandePagamento),
    domandeSostegno: formatNumber(t.domandeSostegno),
    superficieDs: cellaSuperficie(t.superficieDs),
    superficieDp: cellaSuperficie(t.superficieDp),
    differenzaDpDs: cellaDifferenza(t.differenzaDpDs),
    domandeDpOltreDs: formatNumber(t.domandeDpOltreDs),
    sostegniDiscordanti: formatNumber(t.sostegniDiscordanti),
    quantitaRichiestaPremio: '',
  };
}

/** Un totale per campagna, dalla piu' recente; nessun totale generale. */
function totali(righe: readonly RigaSuperficie[]): RigaPiede[] {
  return totaliPerCampagna(interventiDelleRighe(righe), 'decrescente').map(rigaTotale);
}

const testoRicerca = (r: RigaSuperficie) => `${r.codiceIntervento} ${r.campagna?.anno ?? ''}`;

export function TabellaSuperfici({ righe, criteri, onRiga }: { righe: readonly InterventoSuperficie[]; criteri: CriteriSuperfici; onRiga: (codice: string) => void }) {
  const righeDellaTabella = useMemo(() => righeTabella(righe), [righe]);
  return (
    <>
      <TabellaInterattiva
        caption="Superficie ammissibile DS e DP per intervento e campagna, con la verifica incrociata"
        righe={righeDellaTabella}
        colonne={COLONNE}
        chiaveRiga={(r) => r.chiave}
        testoRicerca={testoRicerca}
        segnapostoRicerca="Cerca per codice dell'intervento o campagna"
        notaRicerca="I file CSV e XLSX contengono tutti gli interventi dei filtri, non solo quelli trovati dalla ricerca."
        etichettaRiga={(r) => `Apri l'anteprima dell'intervento ${r.codiceIntervento}${r.campagna ? `, campagna ${r.campagna.anno}` : ''}`}
        onRiga={(r) => onRiga(r.codiceIntervento)}
        totali={totali}
        strumenti={<PulsantiScarica oggetto={`la tabella ${TITOLO_TABELLA}`} scaricamenti={scaricamentiSuperfici(TITOLO_TABELLA, criteri)} />}
      />
      <p className="small mt-2 mb-0">
        {
          'Un totale per campagna, nessun totale generale: le campagne non si sommano. "Sostegni con DS discordanti": domande di sostegno riportate dalle domande di pagamento con superfici DS diverse, di cui si è preso il massimo. I totali per campagna stanno solo nella pagina: il file CSV o XLSX non li ha.'
        }
      </p>
    </>
  );
}
