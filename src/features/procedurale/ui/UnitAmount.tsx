// UnitAmount — pagina /procedurale/unit-amount (flusso unit-amount approvato, pattern report v2, RF030; resta nel
// procedurale per la decisione G1): barra dei filtri col pannello (intervento e obiettivi: TX-0030 non accetta lo stato,
// che la barra dichiara non applicato in una pill e resta nell'indirizzo per le altre pagine), le pill del perimetro
// regionale dei dati di programma e "Dati al"; la card della percentuale pagata e della base storica (barre orizzontali
// raggruppate; senza la fonte del pagato il grafico non e' disponibile e la card lo dice; clic su una barra: l'anteprima
// della riga); la tabella delle Unit Amount con la nota unica del pagato (scelta 8 approvata) e il drawer di anteprima con
// "Apri il dettaglio dell'intervento". UNA lettura di TX-0030 coi soli intervento e obiettivi. Stati: caricamento, errore
// (un solo avviso), vuoto con "Modifica i filtri", valori dei filtri non disponibili.
import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { ValoreImporto, ValoreMotivato } from '../../../entities/importo';
import { useAuthStatus } from '../../../shared/api/auth/use-auth-status';
import { codiceDalClic, formatNumber } from '../../../shared/lib';
import { CardGrafico, PannelloLaterale, Sezione, VistaQuery, VuotoConFiltri } from '../../../shared/ui';
import { useUnitAmount } from '../api';
import { percorsoIntervento } from '../lib/collegamenti';
import { conFiltri, criteriUnitAmount } from '../lib/criteri';
import type { RigaUnitAmount, UnitAmount as DatiUnitAmount } from '../lib/dto';
import { NOTA_UNIT_AMOUNT } from '../lib/formato';
import { graficoUnitAmount } from '../lib/grafici';
import { puoLeggere } from '../lib/grant';
import { CAMPI_PAGATO, chiaveUnitAmount, etichettaUnitAmount } from '../lib/unitAmount';
import { OGGETTO_FILE, fileUnitAmount } from './esportazioni';
import { PaginaProcedurale } from './PaginaProcedurale';
import { DatoPagato, TabellaUnitAmount } from './TabellaUnitAmount';
import { useCriteriDellaPagina } from './useCriteriNellIndirizzo';
import type { PaginaDeiCriteri } from './useCriteriNellIndirizzo';

const SOTTOTITOLO = 'Per ogni Unit Amount (gruppo colturale) degli interventi selezionati: importo unitario, output previsto, importo pagato, percentuale pagata sul richiesto e base storica per la previsione.';
const TITOLO_CARD = 'Percentuale pagata per Unit Amount';
const TITOLO_TABELLA = 'Unit Amount degli interventi selezionati';
const ETICHETTE_PAGATO = { importoPagato: 'Importo pagato', percentualePagata: 'Pagato sul richiesto', baseStorica: 'Base storica' } as const;

/** Il drawer di anteprima di una Unit Amount: i dati della riga e il dettaglio dell'intervento (link senza lo stato). */
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
              <div key={campo}><dt>{ETICHETTE_PAGATO[campo]}</dt><dd><DatoPagato r={riga} campo={campo} /></dd></div>
            ))}
          </dl>
          {riga.codiceIntervento && (
            <Link className="btn btn-primary mt-3 w-100" to={percorsoIntervento(riga.codiceIntervento)}>
              {"Apri il dettaglio dell'intervento"}
            </Link>
          )}
        </>
      )}
    </PannelloLaterale>
  );
}

function ReportUnitAmount({ d, pagina, aperto, onApri }: { d: DatiUnitAmount; pagina: PaginaDeiCriteri; aperto: string | null; onApri: (chiave: string | null) => void }) {
  const righe = d.righe ?? [];
  const dati = useMemo(() => graficoUnitAmount(righe, TITOLO_CARD), [righe]);
  return (
    <>
      <CardGrafico
        titolo={TITOLO_CARD}
        sottotitolo="Percentuale pagata sul richiesto dell'esercizio e base storica (esercizio precedente); clic su una barra: l'anteprima della riga."
        dati={dati}
        fonte="Fonte: TX-0030. PNG: l'immagine del grafico, solo quando c'è; CSV e XLSX: l'export di TX-0030 con intervento e obiettivi della pagina, senza lo stato, una riga per Unit Amount."
        onClic={(p) => onApri(codiceDalClic(p) ?? null)}
        scaricamenti={fileUnitAmount(TITOLO_CARD, pagina.filtri)}
        oggettoDati={OGGETTO_FILE.unitAmount}
      />
      <Sezione titolo={TITOLO_TABELLA}>
        <TabellaUnitAmount titolo={TITOLO_TABELLA} righe={righe} scaricamenti={fileUnitAmount(TITOLO_TABELLA, pagina.filtri)} onRiga={onApri} />
        <p className="ui-fonte">{NOTA_UNIT_AMOUNT}</p>
      </Sezione>
      <AnteprimaUnitAmount riga={righe.find((r) => chiaveUnitAmount(r) === aperto) ?? null} onChiudi={() => onApri(null)} />
    </>
  );
}

export function UnitAmount() {
  const pagina = useCriteriDellaPagina('senzaStato');
  const stato = useUnitAmount(criteriUnitAmount(pagina.filtri), { abilitato: puoLeggere(useAuthStatus().data, 'unitAmount') });
  const [aperto, setAperto] = useState<string | null>(null);
  const vuoto = <VuotoConFiltri onModifica={() => pagina.apri('vuoto')}>{conFiltri(criteriUnitAmount(pagina.filtri)) ? 'Nessuna Unit Amount per gli interventi scelti.' : 'Nessuna Unit Amount.'}</VuotoConFiltri>;
  return (
    <PaginaProcedurale pagina={pagina} briciola="Unit Amount" titolo="Procedurale: pagamenti per Unit Amount" titoloDocumento="Unit Amount - Procedurale" sottotitolo={SOTTOTITOLO} perimetro="REGIONALE" tipoPerimetro="programma" codiciRisposta={[...new Set((stato.data?.righe ?? []).flatMap((r) => (r.codiceIntervento ? [r.codiceIntervento] : [])))]}>
      <VistaQuery stato={stato} eVuoto={(d) => (d.righe ?? []).length === 0} vuoto={vuoto}>
        {(d) => <ReportUnitAmount d={d} pagina={pagina} aperto={aperto} onApri={setAperto} />}
      </VistaQuery>
    </PaginaProcedurale>
  );
}
