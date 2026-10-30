// UnitAmount — pagina /fisico/unit-amount (RF030, TX-0030; dalla pagina /procedurale/unit-amount col riallineamento degli
// ambiti del 29/10/2026, A-1, A-5, nessun alias della vecchia route, con lo stesso comportamento; pattern report v2):
// barra dei filtri col pannello (intervento e obiettivi, voci da TX-0060 dell'elenco operativo, G2: le voci di TX-0024 del
// procedurale non sono del fisico; il filtro per azione portante e' dei passi successivi), le pill del perimetro regionale
// dei dati di programma e "Dati al" (dalla risposta di TX-0030: TX-0024 non e' leggibile dai profili del fisico); la card
// della percentuale pagata e della base storica (barre orizzontali raggruppate; senza la fonte del pagato il grafico non e'
// disponibile e la card lo dice; clic su una barra: l'anteprima della riga); la tabella delle Unit Amount con la nota
// unica del pagato (scelta 8 approvata) e il drawer di anteprima. "Apri il dettaglio dell'intervento" del drawer portava
// al dettaglio del procedurale: il dettaglio dell'intervento del fisico e il suo link sono dei passi successivi. UNA
// lettura di TX-0030 coi soli intervento e obiettivi. Stati: caricamento, errore (un solo avviso), vuoto con "Modifica i
// filtri", valori dei filtri non disponibili.
import { useMemo, useState } from 'react';
import type { Filtri } from '../../../entities/filtri';
import { ValoreImporto, ValoreMotivato } from '../../../entities/importo';
import { useAuthStatus } from '../../../shared/api/auth/use-auth-status';
import { codiceDalClic, formatNumber } from '../../../shared/lib';
import { CardGrafico, PannelloLaterale, Sezione } from '../../../shared/ui';
import { useUnitAmount } from '../api';
import type { RigaUnitAmount, UnitAmount as DatiUnitAmount } from '../lib/dto';
import { NOTA_UNIT_AMOUNT, testoVuotoUnitAmount } from '../lib/formato';
import { graficoUnitAmount } from '../lib/grafici';
import { puoLeggere } from '../lib/grant';
import { CAMPI_PAGATO, TITOLI_PAGATO, chiaveUnitAmount, etichettaUnitAmount } from '../lib/unitAmount';
import { OGGETTO_FILE_UNIT_AMOUNT, fileUnitAmount } from './esportazioni';
import { PaginaReport } from './PaginaReport';
import { DatoPagato, TabellaUnitAmount } from './TabellaUnitAmount';
import { useFiltriDellaPagina } from './useFiltriNellIndirizzo';

const SOTTOTITOLO = 'Per ogni Unit Amount (gruppo colturale) degli interventi selezionati: importo unitario, output previsto, importo pagato, percentuale pagata sul richiesto e base storica per la previsione.';
const TITOLO_CARD = 'Percentuale pagata per Unit Amount';
const TITOLO_TABELLA = 'Unit Amount degli interventi selezionati';

/** Il drawer di anteprima di una Unit Amount: i dati della riga, le assenze col motivo (il dialogo non arriva alla nota della tabella). */
function AnteprimaUnitAmount({ riga, onChiudi }: { riga: RigaUnitAmount | null; onChiudi: () => void }) {
  return (
    <PannelloLaterale aperto={riga !== null} onChiudi={onChiudi} titolo={`Anteprima: ${riga ? etichettaUnitAmount(riga) : ''}`} stretto>
      {riga && (
        <>
          <dl className="ui-dl">
            <div><dt>Gruppo colturale</dt><dd>{riga.gruppoColturale}</dd></div>
            <div><dt>Importo unitario</dt><dd><ValoreImporto importo={riga.importoUnitario} /></dd></div>
            <div><dt>Output previsto</dt><dd><ValoreMotivato dato={riga.outputPrevisto} resa={formatNumber} /></dd></div>
            {CAMPI_PAGATO.map((campo) => (
              <div key={campo}><dt>{TITOLI_PAGATO[campo]}</dt><dd><DatoPagato r={riga} campo={campo} /></dd></div>
            ))}
          </dl>
        </>
      )}
    </PannelloLaterale>
  );
}

function ReportUnitAmount({ d, filtri, aperto, onApri }: { d: DatiUnitAmount; filtri: Filtri; aperto: string | null; onApri: (chiave: string | null) => void }) {
  const righe = d.righe ?? [];
  const dati = useMemo(() => graficoUnitAmount(righe, TITOLO_CARD), [righe]);
  return (
    <>
      <CardGrafico
        titolo={TITOLO_CARD}
        sottotitolo="Percentuale pagata sul richiesto dell'esercizio e base storica (esercizio precedente); clic su una barra: l'anteprima della riga."
        dati={dati}
        fonte="Fonte: TX-0030. PNG: l'immagine del grafico, solo quando c'è; CSV e XLSX: l'export di TX-0030 con intervento e obiettivi della pagina, una riga per Unit Amount."
        onClic={(p) => onApri(codiceDalClic(p) ?? null)}
        scaricamenti={fileUnitAmount(TITOLO_CARD, filtri)}
        oggettoDati={OGGETTO_FILE_UNIT_AMOUNT}
      />
      <Sezione titolo={TITOLO_TABELLA}>
        <TabellaUnitAmount titolo={TITOLO_TABELLA} righe={righe} scaricamenti={fileUnitAmount(TITOLO_TABELLA, filtri)} onRiga={onApri} />
        <p className="ui-fonte">{NOTA_UNIT_AMOUNT}</p>
      </Sezione>
      <AnteprimaUnitAmount riga={righe.find((r) => chiaveUnitAmount(r) === aperto) ?? null} onChiudi={() => onApri(null)} />
    </>
  );
}

export function UnitAmount() {
  const pagina = useFiltriDellaPagina(true);
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
      titoloPannello="Filtri delle Unit Amount"
      testoVuoto={testoVuotoUnitAmount}
      codiciRisposta={[...new Set((stato.data?.righe ?? []).flatMap((r) => (r.codiceIntervento ? [r.codiceIntervento] : [])))]}
    >
      {(d) => <ReportUnitAmount d={d} filtri={pagina.filtri} aperto={aperto} onApri={setAperto} />}
    </PaginaReport>
  );
}
