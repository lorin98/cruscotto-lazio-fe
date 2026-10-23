// StatiDomande — pagine /procedurale/stati-sostegno e /procedurale/stati-pagamento (flusso stati approvato, pattern
// lista v2, RF027 e RF028; scelta 2 approvata: due pagine, ognuna col suo grant e la sua voce di menu): barra dei filtri
// col pannello e le pill; i due KPI (domande del tipo e di cui non rilasciate, con la regola del filtro per stato); la
// card degli stati nel totale (barre impilate: scelta 4 approvata, il clic su una barra filtra la tabella per intervento
// sulla voce, con un chip della pagina e l'azione esplicita "Apri nell'elenco (n rilasciate)"; nella tabella equivalente
// "Apri nell'elenco" per ogni voce, la parte rilasciata); la tabella per intervento e stato; il drawer di anteprima. UNA
// lettura di TX-0027 o TX-0028 coi criteri dell'indirizzo. La voce scelta e la riga aperta sono stato della pagina: restano
// mentre la lettura riparte. Togliendo il chip della voce, che sparisce col suo bottone, il focus va sull'h1. Stati:
// caricamento, errore (un solo avviso della pagina), vuoto con "Modifica i filtri", valori dei filtri non disponibili.
import { useState } from 'react';
import { ApriNellElenco } from '../../../entities/domanda';
import { useAuthStatus } from '../../../shared/api/auth/use-auth-status';
import { Icona, VistaQuery, VuotoConFiltri, useFocusDopoIlCambio } from '../../../shared/ui';
import type { StatoQuery } from '../../../shared/ui';
import { useStatiPagamento, useStatiSostegno } from '../api';
import { LINK_STATO, apreLaVoce, indirizzoElenco, puntoDelloStato, testiLinkStato } from '../lib/collegamenti';
import { conFiltri, criteriDelReport } from '../lib/criteri';
import type { Stati, TipoDomanda } from '../lib/dto';
import { NOTA_SOLO_CSR_DP, testoVuoto } from '../lib/formato';
import { puoLeggere } from '../lib/grant';
import { kpiDegliStati } from '../lib/kpi';
import { righeConLaVoce, righeStati, senzaDomande, vociDegliStati } from '../lib/stati';
import type { VoceDistribuzione } from '../lib/stati';
import { AnteprimaStati } from './AnteprimaStati';
import { CardStati } from './CardDistribuzioni';
import { TessereKpi } from './comuni';
import { OGGETTO_FILE, fileReport } from './esportazioni';
import { usePuoAprireElenco } from './navigazione';
import { PaginaProcedurale } from './PaginaProcedurale';
import { TabellaStatiInterventi } from './TabellaStatiInterventi';
import { useCriteriDellaPagina } from './useCriteriNellIndirizzo';
import type { PaginaDeiCriteri } from './useCriteriNellIndirizzo';

const TESTI: Readonly<Record<TipoDomanda, { pagina: string; sottotitolo: string; card: string; tabella: string; vuoto: string; tx: string }>> = {
  SOSTEGNO: {
    pagina: 'Stati delle domande di sostegno',
    sottotitolo: "Gli undici stati della domanda di sostegno (SR-01) per intervento, con le domande non ancora rilasciate. Clic su una riga per l'anteprima dell'intervento.",
    card: 'Domande di sostegno per stato',
    tabella: 'Domande di sostegno per intervento e stato',
    vuoto: 'Nessuna domanda di sostegno',
    tx: 'TX-0027',
  },
  PAGAMENTO: {
    pagina: 'Stati delle domande di pagamento',
    sottotitolo: "I cinque stati della domanda di pagamento (SR-01, flusso CSR-DP) per intervento, con le domande non ancora rilasciate. Clic su una riga per l'anteprima dell'intervento.",
    card: 'Domande di pagamento per stato',
    tabella: 'Domande di pagamento per intervento e stato',
    vuoto: 'Nessuna domanda di pagamento CSR-DP',
    tx: 'TX-0028',
  },
};

const REPORT = { SOSTEGNO: 'statiSostegno', PAGAMENTO: 'statiPagamento' } as const;

interface PropsReport {
  tipo: TipoDomanda;
  d: Stati;
  pagina: PaginaDeiCriteri;
  voce: string | null;
  onVoce: (v: string | null) => void;
  aperto: string | null;
  onApri: (codice: string | null) => void;
}

/** Il link di una voce del totale verso l'elenco (la parte rilasciata, coi filtri della pagina); null senza. */
function useLinkVoce(tipo: TipoDomanda, pagina: PaginaDeiCriteri) {
  const conElenco = usePuoAprireElenco();
  return (v: VoceDistribuzione) => ({ indirizzo: conElenco && apreLaVoce(v) ? indirizzoElenco(LINK_STATO[tipo].pagina, pagina.filtri, puntoDelloStato(tipo, v.chiave)) : null, testi: testiLinkStato(v, tipo) });
}

/** Il filtro della tabella sulla voce scelta dal grafico: il chip della pagina e "Apri nell'elenco (n rilasciate)". */
function FiltroDellaVoce({ tipo, v, pagina, onTogli }: { tipo: TipoDomanda; v: VoceDistribuzione; pagina: PaginaDeiCriteri; onTogli: () => void }) {
  const { indirizzo, testi } = useLinkVoce(tipo, pagina)(v);
  return (
    <div className="ui-strumenti" role="group" aria-label="Filtro della tabella dal grafico">
      <span className="ui-chip">
        <b>Voce</b> {v.etichetta}
        <button type="button" onClick={onTogli} aria-label={`Togli il filtro Voce ${v.etichetta}`}>
          <Icona nome="it-close" />
        </button>
      </span>
      <ApriNellElenco indirizzo={indirizzo} {...testi} />
    </div>
  );
}

function ReportStati({ tipo, d, pagina, voce, onVoce, aperto, onApri }: PropsReport) {
  const testi = TESTI[tipo];
  const conLink = usePuoAprireElenco();
  const link = useLinkVoce(tipo, pagina);
  const togli = useFocusDopoIlCambio(pagina.h1);
  const scelta = vociDegliStati(d.totale).find((v) => v.chiave === voce);
  const righe = righeStati(d);
  const file = fileReport(REPORT[tipo], testi.card, pagina.filtri);
  // il chip sparisce col suo bottone: il focus va sull'h1
  const togliLaVoce = () => {
    onVoce(null);
    togli();
  };
  return (
    <>
      <TessereKpi kpi={kpiDegliStati(d.totale, tipo, (pagina.filtri.stato ?? []).length > 0)} criteri={pagina.filtri} colonne={2} />
      <CardStati tipo={tipo} d={d.totale} titolo={testi.card} sottotitolo="Clic su una barra: la tabella per intervento resta con gli interventi che hanno domande in quella voce." fonte={`Fonte: ${testi.tx} (totale). PNG: l'immagine del grafico con l'intestazione, non registrata in audit; CSV e XLSX: l'export del report coi filtri della pagina, una riga per intervento e stato, poi il totale.`} onVoce={onVoce} link={conLink ? link : undefined} scaricamenti={file} oggettoDati={OGGETTO_FILE[REPORT[tipo]]} />
      <TabellaStatiInterventi
        titolo={testi.tabella}
        righe={scelta ? righeConLaVoce(righe, scelta.chiave) : righe}
        totale={d.totale}
        valori={pagina.valori?.data}
        scaricamenti={file}
        onRiga={onApri}
        sopra={scelta && <FiltroDellaVoce tipo={tipo} v={scelta} pagina={pagina} onTogli={togliLaVoce} />}
      />
      <AnteprimaStati tipo={tipo} riga={righe.find((r) => r.codiceIntervento === aperto) ?? null} criteri={pagina.filtri} onChiudi={() => onApri(null)} />
    </>
  );
}

function PaginaStati({ tipo, stato, pagina }: { tipo: TipoDomanda; stato: StatoQuery<Stati>; pagina: PaginaDeiCriteri }) {
  const [voce, setVoce] = useState<string | null>(null);
  const [aperto, setAperto] = useState<string | null>(null);
  const testi = TESTI[tipo];
  const vuoto = (d: Stati) => <VuotoConFiltri onModifica={() => pagina.apri('vuoto')}>{testoVuoto(testi.vuoto, conFiltri(pagina.filtri), d.perimetro)}</VuotoConFiltri>;
  return (
    <PaginaProcedurale pagina={pagina} briciola={testi.pagina} titolo={`Procedurale: ${testi.pagina.toLowerCase()}`} titoloDocumento={`${testi.pagina} - Procedurale`} sottotitolo={testi.sottotitolo} nota={tipo === 'PAGAMENTO' ? NOTA_SOLO_CSR_DP : undefined} perimetro={stato.data?.perimetro} tipoPerimetro="domande" codiciRisposta={righeStati(stato.data ?? {}).map((r) => r.codiceIntervento)}>
      <VistaQuery stato={stato} eVuoto={senzaDomande} vuoto={vuoto}>
        {(d) => <ReportStati tipo={tipo} d={d} pagina={pagina} voce={voce} onVoce={setVoce} aperto={aperto} onApri={setAperto} />}
      </VistaQuery>
    </PaginaProcedurale>
  );
}

/** /procedurale/stati-sostegno: TX-0027 col suo grant. */
export function StatiSostegno() {
  const pagina = useCriteriDellaPagina('tutti');
  const stato = useStatiSostegno(criteriDelReport(pagina.filtri), { abilitato: puoLeggere(useAuthStatus().data, 'statiSostegno') });
  return <PaginaStati tipo="SOSTEGNO" stato={stato} pagina={pagina} />;
}

/** /procedurale/stati-pagamento: TX-0028 col suo grant. */
export function StatiPagamento() {
  const pagina = useCriteriDellaPagina('tutti');
  const stato = useStatiPagamento(criteriDelReport(pagina.filtri), { abilitato: puoLeggere(useAuthStatus().data, 'statiPagamento') });
  return <PaginaStati tipo="PAGAMENTO" stato={stato} pagina={pagina} />;
}
