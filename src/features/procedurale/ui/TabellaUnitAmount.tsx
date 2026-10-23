// TabellaUnitAmount — la tabella delle Unit Amount (flusso unit-amount approvato, RF030; scheda Unit Amount del
// dettaglio): TabellaInterattiva del kit con le nove colonne del wireframe (la Unit Amount e' l'intestazione di riga, nella
// seconda colonna), nell'ordine del backend (intervento, esercizio, codice), nessun totale (il DTO non lo porta e la
// pagina non somma). Con la fonte del pagato non attiva (oggi il caso reale) la nota unica sopra la tabella dice il motivo
// e le tre celle sono "non disponibile" in breve (scelta 8 approvata); le altre assenze col motivo completo. Riga
// apribile verso l'anteprima solo nella pagina. CSV e XLSX dell'export di TX-0030 negli strumenti.
import { BadgeAssenza, ValoreImporto, ValoreMotivato } from '../../../entities/importo';
import { formatNumber, formatPercentuale } from '../../../shared/lib';
import { PulsantiScarica, TabellaInterattiva } from '../../../shared/ui';
import type { ColonnaTabella, Scaricamento } from '../../../shared/ui';
import type { RigaUnitAmount } from '../lib/dto';
import { NOTA_FILE } from '../lib/formato';
import { CAMPI_PAGATO, assenzaPagato, chiaveUnitAmount, notaPagato, valoreDi } from '../lib/unitAmount';
import type { CampoPagato } from '../lib/unitAmount';

const TITOLI_PAGATO: Readonly<Record<CampoPagato, string>> = { importoPagato: 'Importo pagato', percentualePagata: 'Pagato sul richiesto', baseStorica: 'Base storica' };

/**
 * Un dato del pagato: l'euro o la percentuale, oppure l'assenza: `breve` nelle celle della tabella (la nota sopra dice il
 * motivo della fonte non attiva), col motivo altrove (il drawer di anteprima, come nel wireframe approvato).
 */
export function DatoPagato({ r, campo, breve = false }: { r: RigaUnitAmount; campo: CampoPagato; breve?: boolean }) {
  const d = r[campo];
  if (d?.valore == null) return <BadgeAssenza resa={assenzaPagato(r, campo, breve)} />;
  return campo === 'importoPagato' ? <ValoreImporto importo={d} /> : <span className="font-monospace">{formatPercentuale(d.valore)}</span>;
}

const COLONNE: ColonnaTabella<RigaUnitAmount>[] = [
  { chiave: 'intervento', titolo: 'Intervento', valore: (r) => r.codiceIntervento ?? null, fissa: true },
  // l'intestazione di riga del wireframe: sempre visibile (non si nasconde da "Colonne")
  { chiave: 'ua', titolo: 'Unit Amount', valore: (r) => r.codiceUnitAmount ?? null, fissa: true },
  { chiave: 'gruppo', titolo: 'Gruppo colturale', valore: (r) => r.gruppoColturale ?? null },
  { chiave: 'esercizio', titolo: 'Esercizio', valore: (r) => r.esercizio ?? null, numerica: true },
  { chiave: 'unitario', titolo: 'Importo unitario', valore: (r) => valoreDi(r.importoUnitario), resa: (r) => <ValoreImporto importo={r.importoUnitario} />, numerica: true },
  { chiave: 'output', titolo: 'Output previsto', valore: (r) => valoreDi(r.outputPrevisto), resa: (r) => <ValoreMotivato dato={r.outputPrevisto} resa={formatNumber} />, numerica: true },
  ...CAMPI_PAGATO.map((campo) => ({ chiave: campo, titolo: TITOLI_PAGATO[campo], valore: (r: RigaUnitAmount) => valoreDi(r[campo]), resa: (r: RigaUnitAmount) => <DatoPagato r={r} campo={campo} breve />, numerica: true })),
];

interface PropsTabella {
  titolo: string;
  righe: readonly RigaUnitAmount[];
  scaricamenti: readonly Scaricamento[];
  /** L'anteprima della riga (la pagina); assente nella scheda del dettaglio. */
  onRiga?: (chiave: string) => void;
}

export function TabellaUnitAmount({ titolo, righe, scaricamenti, onRiga }: PropsTabella) {
  const nota = notaPagato(righe);
  return (
    <>
      {nota && <p className="ui-nota">{nota}</p>}
      <TabellaInterattiva
        caption={`${titolo}: Unit Amount per intervento, esercizio e codice; la Unit Amount è l'intestazione di riga`}
        righe={righe}
        colonne={COLONNE}
        intestazioneRiga="ua"
        chiaveRiga={chiaveUnitAmount}
        testoRicerca={(r) => `${r.codiceIntervento ?? ''} ${r.codiceUnitAmount ?? ''} ${r.gruppoColturale ?? ''}`}
        segnapostoRicerca="Cerca per intervento, Unit Amount o gruppo colturale"
        notaRicerca={NOTA_FILE}
        etichettaRiga={onRiga ? (r) => `Apri l'anteprima della Unit Amount ${r.codiceUnitAmount ?? ''} di ${r.codiceIntervento ?? ''}, esercizio ${r.esercizio ?? ''}` : undefined}
        onRiga={onRiga ? (r) => onRiga(chiaveUnitAmount(r)) : undefined}
        strumenti={<PulsantiScarica oggetto={`la tabella ${titolo}`} scaricamenti={scaricamenti} />}
      />
    </>
  );
}
