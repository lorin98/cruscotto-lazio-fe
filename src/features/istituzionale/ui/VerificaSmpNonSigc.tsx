// VerificaSmpNonSigc — pagina /istituzionale/verifica-smp-non-sigc (flusso verifica-smp-non-sigc approvato, pattern report
// v2 come la verifica SMP SIGC del finanziario, RF016): barra dei filtri a chip col pannello (voci da TX-0060, G2), le pill
// del perimetro regionale, dell'anno di riferimento del file e "Dati al" (ultimiDatiSincronizzati di TX-0016, G3);
// percorso e un solo h1 col focus, con sotto la frase verso la verifica SMP SIGC resa solo a chi ha anche csr.tx-0015.read
// (decisione G4, nessun filtro portato; dal 29/10/2026 la pagina e' nella stessa area, i filtri comuni li porta lo step6); lo
// stato dei valori dei filtri non
// disponibili; il selettore dell'anno (facoltativo, si applica con "Mostra"); il report. UNA lettura di TX-0016 per
// pagina, coi criteri dell'indirizzo. Stati: caricamento (scheletro), errore (un solo avviso della pagina, problem-type),
// vuoto (con "Modifica i filtri": coi criteri cambiati dal pannello il focus va sull'h1), valori dei filtri non
// disponibili. Design system: classi bootstrap-italia e del kit v2; i primitivi react-aria stanno solo dentro i
// componenti del kit che li richiedono (pannello modale, popover della pill). Barra, testata, stati e pannello sono
// l'impaginazione comune dei due report (PaginaReport, review H6).
import { Link } from 'react-router';
import { ricercaDaFiltri } from '../../../entities/filtri';
import { useAuthStatus } from '../../../shared/api/auth/use-auth-status';
import { SelettoreAnno, useAnnoNellIndirizzo } from '../../../shared/ui';
import { useVerificaSmpNonSigc } from '../api';
import { VERIFICA_SMP_SIGC } from '../lib/collegamenti';
import { PARAMETRO_ANNO, anniDiRiferimento, criteriVerifica } from '../lib/criteri';
import { pillAnnoDelFile } from '../lib/formato';
import { puoLeggere } from '../lib/grant';
import { PaginaReport } from './PaginaReport';
import { ReportVerifica } from './ReportVerifica';
import { useFiltriDellaPagina } from './useFiltriNellIndirizzo';

const SOTTOTITOLO = 'I dati dei file ASR non SIGC per intervento, da confrontare con SMP - Data Platform.';
const AIUTO_ANNO = "Facoltativo. Vale per indicatori, output e dati dell'avviso; domande e spesa sono cumulative (tutte le domande correnti).";

/** link:verifica-smp-sigc (G4): la frase dice la pagina di arrivo, nella stessa area; chi la rende controlla prima il grant. */
function FraseVerificaSigc() {
  return (
    <>
      {'I dati SIGC per lo stesso confronto sono nella pagina '}
      <Link to={VERIFICA_SMP_SIGC}>Verifica SMP SIGC</Link>.
    </>
  );
}

export function VerificaSmpNonSigc() {
  const pagina = useFiltriDellaPagina(PARAMETRO_ANNO);
  const [anno, impostaAnno] = useAnnoNellIndirizzo(PARAMETRO_ANNO);
  const stato = useVerificaSmpNonSigc(criteriVerifica(pagina.filtri, anno), { abilitato: !pagina.inAttesa });
  const nota = puoLeggere(useAuthStatus().data, 'verificaSigc') ? <FraseVerificaSigc /> : undefined;
  const selettore = <SelettoreAnno id="f-anno-smp" etichetta="Anno di riferimento del monitoraggio SMP non SIGC" aiuto={AIUTO_ANNO} anni={anniDiRiferimento(stato.data?.annoRiferimento, anno)} voceVuota="Ultimo anno con un file (predefinito)" anno={anno} onCambia={impostaAnno} />;
  return (
    <PaginaReport pagina={pagina} stato={stato} briciola="Verifica SMP non SIGC" titolo="Istituzionale: verifica SMP non SIGC" titoloDocumento="Verifica SMP non SIGC - Istituzionale" sottotitolo={SOTTOTITOLO} nota={nota} pill={(d) => pillAnnoDelFile(d.annoRiferimento)} sopra={selettore}>
      {(d) => <ReportVerifica key={`${ricercaDaFiltri(pagina.filtri)}|${anno ?? ''}`} d={d} filtri={pagina.filtri} anno={anno} />}
    </PaginaReport>
  );
}
