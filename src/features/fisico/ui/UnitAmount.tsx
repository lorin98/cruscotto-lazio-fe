// UnitAmount — pagina /fisico/unit-amount (RF030, TX-0030; dalla pagina /procedurale/unit-amount col riallineamento degli
// ambiti del 29/10/2026, A-1, A-5, nessun alias della vecchia route; flusso unit-amount approvato il 30/10/2026, pattern
// report v2): barra dei filtri col pannello (i cinque filtri dei report fisici, azione portante compresa:
// SC-FS_UNIT_AMOUNT_AZIONE; voci da TX-0060 dell'elenco operativo, G2), le pill del perimetro regionale dei dati di
// programma e "Dati al" (dalla risposta di TX-0030); la card della percentuale pagata e della base storica (barre
// orizzontali raggruppate; senza la fonte del pagato il grafico non e' disponibile e la card lo dice; clic su una barra:
// l'anteprima della riga); la tabella delle Unit Amount con la nota unica del pagato (scelta 8 approvata) e il drawer di
// anteprima con la descrizione dell'intervento (TX-0060) e "Apri il dettaglio dell'intervento" (link
// dettaglio-intervento-unit-amount: il dettaglio del fisico sulla scheda Unit Amount, che la pagina d'arrivo riceve nello
// state della navigazione, mai nell'indirizzo; solo col grant di una delle letture del dettaglio). UNA lettura di TX-0030
// coi filtri della pagina. Stati: caricamento, errore (un solo avviso), vuoto con "Modifica i filtri", valori dei filtri
// non disponibili.
import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { descrizioneIntervento } from '../../../entities/filtri';
import type { Filtri } from '../../../entities/filtri';
import { ValoreImporto, ValoreMotivato } from '../../../entities/importo';
import { useAuthStatus } from '../../../shared/api/auth/use-auth-status';
import { codiceDalClic, formatNumber } from '../../../shared/lib';
import { CardGrafico, PannelloLaterale, Sezione } from '../../../shared/ui';
import { useUnitAmount } from '../api';
import { percorsoIntervento } from '../lib/collegamenti';
import type { RigaUnitAmount, UnitAmount as DatiUnitAmount } from '../lib/dto';
import { NOTA_UNIT_AMOUNT, testoVuotoUnitAmount } from '../lib/formato';
import { graficoUnitAmount } from '../lib/grafici';
import { puoAprireIntervento, puoLeggere } from '../lib/grant';
import type { IdScheda } from '../lib/intervento';
import { CAMPI_PAGATO, TITOLI_PAGATO, chiaveUnitAmount, etichettaUnitAmount } from '../lib/unitAmount';
import { OGGETTO_FILE_UNIT_AMOUNT, fileUnitAmount } from './esportazioni';
import { PaginaReport } from './PaginaReport';
import { DatoPagato, TabellaUnitAmount } from './TabellaUnitAmount';
import { useFiltriDellaPagina } from './useFiltriNellIndirizzo';

const SOTTOTITOLO = 'Per ogni Unit Amount (gruppo colturale) degli interventi selezionati: importo unitario, output previsto, importo pagato, percentuale pagata sul richiesto e base storica per la previsione.';
const TITOLO_CARD = 'Percentuale pagata per Unit Amount';
const TITOLO_TABELLA = 'Unit Amount degli interventi selezionati';

/** Lo state del link verso il dettaglio: la scheda Unit Amount (wireframe unit-amount approvato). */
const ARRIVO_UNIT_AMOUNT: { scheda: IdScheda } = { scheda: 'unitAmount' };

/** "SRD01 - descrizione" dalle voci di TX-0060; senza, il solo codice (come l'anteprima delle superfici). */
function testoIntervento(codice: string, descrizione: string | undefined): string {
  return descrizione ? `${codice} - ${descrizione}` : codice;
}

interface PropsAnteprima {
  riga: RigaUnitAmount | null;
  /** La descrizione dell'intervento della riga dalle voci di TX-0060, se lette. */
  descrizione: string | undefined;
  onChiudi: () => void;
}

/**
 * Il drawer di anteprima di una Unit Amount: l'intervento con la descrizione, i dati della riga, le assenze col motivo (il
 * dialogo non arriva alla nota della tabella), e il dettaglio dell'intervento sulla scheda Unit Amount (un link vero: il
 * focus va sul titolo del dettaglio dopo il cambio di route).
 */
function AnteprimaUnitAmount({ riga, descrizione, onChiudi }: PropsAnteprima) {
  const conDettaglio = puoAprireIntervento(useAuthStatus().data);
  const codice = riga?.codiceIntervento;
  return (
    <PannelloLaterale aperto={riga !== null} onChiudi={onChiudi} titolo={`Anteprima: ${riga ? etichettaUnitAmount(riga) : ''}`} stretto>
      {riga && (
        <>
          {codice && <p>{testoIntervento(codice, descrizione)}</p>}
          <dl className="ui-dl">
            <div><dt>Gruppo colturale</dt><dd>{riga.gruppoColturale}</dd></div>
            <div><dt>Importo unitario</dt><dd><ValoreImporto importo={riga.importoUnitario} /></dd></div>
            <div><dt>Output previsto</dt><dd><ValoreMotivato dato={riga.outputPrevisto} resa={formatNumber} /></dd></div>
            {CAMPI_PAGATO.map((campo) => (
              <div key={campo}><dt>{TITOLI_PAGATO[campo]}</dt><dd><DatoPagato r={riga} campo={campo} /></dd></div>
            ))}
          </dl>
          {codice && conDettaglio && (
            <Link className="btn btn-primary mt-3 w-100" to={percorsoIntervento(codice)} state={ARRIVO_UNIT_AMOUNT}>
              {"Apri il dettaglio dell'intervento"}
            </Link>
          )}
        </>
      )}
    </PannelloLaterale>
  );
}

interface PropsReport {
  d: DatiUnitAmount;
  filtri: Filtri;
  aperto: string | null;
  onApri: (chiave: string | null) => void;
  descrizioneDi: (codice: string) => string | undefined;
}

function ReportUnitAmount({ d, filtri, aperto, onApri, descrizioneDi }: PropsReport) {
  const righe = d.righe ?? [];
  const riga = righe.find((r) => chiaveUnitAmount(r) === aperto) ?? null;
  const dati = useMemo(() => graficoUnitAmount(righe, TITOLO_CARD), [righe]);
  return (
    <>
      <CardGrafico
        titolo={TITOLO_CARD}
        sottotitolo="Percentuale pagata sul richiesto dell'esercizio e base storica (esercizio precedente); clic su una barra: l'anteprima della riga."
        dati={dati}
        fonte="Fonte: TX-0030. PNG: l'immagine del grafico, solo quando c'è; CSV e XLSX: l'export di TX-0030 con intervento, obiettivi e azione portante della pagina, una riga per Unit Amount."
        onClic={(p) => onApri(codiceDalClic(p) ?? null)}
        scaricamenti={fileUnitAmount(TITOLO_CARD, filtri)}
        oggettoDati={OGGETTO_FILE_UNIT_AMOUNT}
      />
      <Sezione titolo={TITOLO_TABELLA}>
        <TabellaUnitAmount titolo={TITOLO_TABELLA} righe={righe} scaricamenti={fileUnitAmount(TITOLO_TABELLA, filtri)} onRiga={onApri} />
        <p className="ui-fonte">{NOTA_UNIT_AMOUNT}</p>
      </Sezione>
      <AnteprimaUnitAmount riga={riga} descrizione={riga?.codiceIntervento ? descrizioneDi(riga.codiceIntervento) : undefined} onChiudi={() => onApri(null)} />
    </>
  );
}

export function UnitAmount() {
  const pagina = useFiltriDellaPagina();
  const stato = useUnitAmount(pagina.filtri, { abilitato: puoLeggere(useAuthStatus().data, 'unitAmount') && !pagina.inAttesa });
  const [aperto, setAperto] = useState<string | null>(null);
  return (
    <PaginaReport
      pagina={pagina}
      stato={stato}
      briciola="Unit Amount"
      titolo="Fisico: pagamenti per Unit Amount"
      titoloDocumento="Unit Amount - Fisico"
      sottotitolo={SOTTOTITOLO}
      titoloPannello="Filtri dei report fisici"
      testoVuoto={testoVuotoUnitAmount}
      codiciRisposta={[...new Set((stato.data?.righe ?? []).flatMap((r) => (r.codiceIntervento ? [r.codiceIntervento] : [])))]}
    >
      {(d) => <ReportUnitAmount d={d} filtri={pagina.filtri} aperto={aperto} onApri={setAperto} descrizioneDi={(codice) => descrizioneIntervento(pagina.valori?.data?.interventi, codice)} />}
    </PaginaReport>
  );
}
