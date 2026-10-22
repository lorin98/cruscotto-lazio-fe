// VerificaSmpNonSigc — pagina /istituzionale/verifica-smp-non-sigc (flusso verifica-smp-non-sigc approvato, pattern report
// v2 come la verifica SMP SIGC del finanziario, RF016): barra dei filtri a chip col pannello (voci da TX-0060, G2), le pill
// del perimetro regionale, dell'anno di riferimento del file e "Dati al" (ultimiDatiSincronizzati di TX-0016, G3);
// percorso e un solo h1 col focus, con sotto la frase verso la verifica SMP SIGC del finanziario resa solo a chi ha anche
// csr.tx-0015.read (decisione G4: nessun filtro portato, il finanziario non cambia); lo stato dei valori dei filtri non
// disponibili; il selettore dell'anno (facoltativo, si applica con "Mostra"); il report. UNA lettura di TX-0016 per
// pagina, coi criteri dell'indirizzo. Stati: caricamento (scheletro), errore (un solo avviso della pagina, problem-type),
// vuoto (con "Modifica i filtri": coi criteri cambiati dal pannello il focus va sull'h1), valori dei filtri non
// disponibili. Design system: classi bootstrap-italia e del kit v2; i primitivi react-aria stanno solo dentro i
// componenti del kit che li richiedono (pannello modale, popover della pill).
import { Link } from 'react-router';
import { ricercaDaFiltri } from '../../../entities/filtri';
import type { Filtri } from '../../../entities/filtri';
import { useAuthStatus } from '../../../shared/api/auth/use-auth-status';
import { AvvisoPagina, BarraFiltri, Briciole, Caricamento, ContestoIntestazione, PillDatiAl, SelettoreAnno, TestaPagina, VistaQuery, VuotoConFiltri, useAnnoNellIndirizzo } from '../../../shared/ui';
import { useVerificaSmpNonSigc } from '../api';
import { VERIFICA_SMP_SIGC } from '../lib/collegamenti';
import { PARAMETRO_ANNO, anniDiRiferimento, conFiltri, criteriVerifica, testiCriteri } from '../lib/criteri';
import type { Verifica } from '../lib/dto';
import { PILL_PERIMETRO, pillAnnoDelFile, testoVuoto } from '../lib/formato';
import { puoLeggere } from '../lib/grant';
import { ValoriNonDisponibili, useContesto } from './comuni';
import { useIngressoArea } from './navigazione';
import { PannelloFiltriIstituzionale } from './PannelloFiltriIstituzionale';
import { ReportVerifica } from './ReportVerifica';
import { useFiltriNellIndirizzo, usePannelloConFocus } from './useFiltriNellIndirizzo';

const SOTTOTITOLO = 'I dati dei file ASR non SIGC per intervento, da confrontare con SMP - Data Platform.';
const AIUTO_ANNO = "Facoltativo. Vale per indicatori, output e dati dell'avviso; domande e spesa sono cumulative (tutte le domande correnti).";

/** Perimetro (sempre regionale), anno di riferimento del file e ultimo dato sincronizzato della risposta, nella barra. */
function PillDellaBarra({ d, inErrore }: { d: Verifica | undefined; inErrore: boolean }) {
  return (
    <>
      <span className="ui-pill">{PILL_PERIMETRO}</span>
      {d && <span className="ui-pill">{pillAnnoDelFile(d.annoRiferimento)}</span>}
      <PillDatiAl voci={d?.ultimiDatiSincronizzati} inErrore={inErrore} />
    </>
  );
}

/** link:verifica-smp-sigc (G4): la frase dice l'area di arrivo; chi la rende controlla prima il grant. */
function FraseVerificaSigc() {
  return (
    <>
      {'I dati SIGC per lo stesso confronto sono nel Finanziario: '}
      <Link to={VERIFICA_SMP_SIGC}>Verifica SMP SIGC</Link>.
    </>
  );
}

type PropsCorpo = { stato: ReturnType<typeof useVerificaSmpNonSigc>; inAttesa: boolean; filtri: Filtri; anno: number | undefined; onModificaFiltri: () => void };

/** Il corpo: un solo avviso, l'attesa del legame con le azioni, la lettura di TX-0016 e il report (nuovo coi criteri nuovi). */
function CorpoVerifica({ stato, inAttesa, filtri, anno, onModificaFiltri }: PropsCorpo) {
  const contesto = useContesto(testiCriteri(filtri, anno), stato.data?.ultimiDatiSincronizzati);
  const vuoto = <VuotoConFiltri onModifica={onModificaFiltri}>{testoVuoto(conFiltri(filtri))}</VuotoConFiltri>;
  return (
    <ContestoIntestazione.Provider value={contesto}>
      <AvvisoPagina>
        {/* finche' non si sa se il filtro per azione si applica, TX-0016 non si legge (come nel finanziario, X-03) */}
        {inAttesa ? (
          <Caricamento testo="Verifica dei filtri in corso…" />
        ) : (
          <VistaQuery stato={stato} eVuoto={(d) => d.righe.length === 0} vuoto={vuoto}>
            {(d) => <ReportVerifica key={`${ricercaDaFiltri(filtri)}|${anno ?? ''}`} d={d} filtri={filtri} anno={anno} />}
          </VistaQuery>
        )}
      </AvvisoPagina>
    </ContestoIntestazione.Provider>
  );
}

export function VerificaSmpNonSigc() {
  const { filtri, inAttesa, chip, applica, togliTutti, valori } = useFiltriNellIndirizzo(true);
  const [anno, impostaAnno] = useAnnoNellIndirizzo(PARAMETRO_ANNO);
  const stato = useVerificaSmpNonSigc(criteriVerifica(filtri, anno), { abilitato: !inAttesa });
  const { h1, pannello, apri, chiudi, onApplica } = usePannelloConFocus(filtri, applica);
  const briciole = [{ etichetta: 'Istituzionale', a: useIngressoArea() }, { etichetta: 'Verifica SMP non SIGC' }];
  const nota = puoLeggere(useAuthStatus().data, 'verificaSigc') ? <FraseVerificaSigc /> : undefined;
  return (
    <>
      <BarraFiltri chip={chip} onApri={() => apri('barra')} onTogliTutti={togliTutti} vuoto="Nessun filtro: tutti gli interventi" destra={<PillDellaBarra d={stato.data} inErrore={stato.isError} />} />
      <main className="ui-pagina" id="contenuto">
        <Briciole voci={briciole} />
        <TestaPagina titolo="Istituzionale: verifica SMP non SIGC" titoloDocumento="Verifica SMP non SIGC - Istituzionale" sottotitolo={SOTTOTITOLO} nota={nota} refTitolo={h1} />
        <ValoriNonDisponibili valori={valori} h1={h1} />
        <SelettoreAnno id="f-anno-smp" etichetta="Anno di riferimento del monitoraggio SMP non SIGC" aiuto={AIUTO_ANNO} anni={anniDiRiferimento(stato.data?.annoRiferimento, anno)} voceVuota="Ultimo anno con un file (predefinito)" anno={anno} onCambia={impostaAnno} />
        <CorpoVerifica stato={stato} inAttesa={inAttesa} filtri={filtri} anno={anno} onModificaFiltri={() => apri('vuoto')} />
      </main>
      <PannelloFiltriIstituzionale aperto={pannello !== null} filtri={filtri} valori={valori} codiciRisposta={(stato.data?.righe ?? []).map((r) => r.codiceIntervento)} onApplica={onApplica} onChiudi={chiudi} />
    </>
  );
}
