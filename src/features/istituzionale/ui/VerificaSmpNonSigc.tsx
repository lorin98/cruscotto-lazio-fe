// VerificaSmpNonSigc — pagina /istituzionale/verifica-smp-non-sigc (flusso verifica-smp-non-sigc approvato, pattern report
// v2 come la verifica SMP SIGC della stessa area, RF016): barra dei filtri a chip col pannello (voci da TX-0060, G2), le
// pill del perimetro regionale, dell'anno di riferimento del file e "Dati al" (ultimiDatiSincronizzati di TX-0016, G3);
// percorso e un solo h1 col focus, con sotto la frase verso la verifica SMP SIGC coi filtri comuni e senza l'anno (link
// verifica-smp-sigc, scelta di disegno 1 del 30/10/2026, al posto della decisione G4), resa solo col grant di TX-0015; lo
// stato dei valori dei filtri non disponibili; il selettore dell'anno (facoltativo, si applica con "Mostra"); il report.
// UNA lettura di TX-0016 per pagina, coi criteri dell'indirizzo. Stati: caricamento (scheletro), errore (un solo avviso della pagina, problem-type),
// vuoto (con "Modifica i filtri": coi criteri cambiati dal pannello il focus va sull'h1), valori dei filtri non
// disponibili. Design system: classi bootstrap-italia e del kit v2; i primitivi react-aria stanno solo dentro i
// componenti del kit che li richiedono (pannello modale, popover della pill). Barra, testata, stati e pannello sono
// l'impaginazione comune dei due report (PaginaReport, review H6).
import { Link, useLocation } from 'react-router';
import { filtriDaRicerca, ricercaDaFiltri } from '../../../entities/filtri';
import { useAuthStatus } from '../../../shared/api/auth/use-auth-status';
import { SelettoreAnno, useAnnoNellIndirizzo } from '../../../shared/ui';
import { useVerificaSmpNonSigc } from '../api';
import { verificaSigcConFiltri } from '../lib/collegamenti';
import { PARAMETRO_ANNO, anniDiRiferimento, criteriVerifica } from '../lib/criteri';
import { pillAnnoDelFile } from '../lib/formato';
import { puoLeggere } from '../lib/grant';
import { PaginaReport } from './PaginaReport';
import { ReportVerifica } from './ReportVerifica';
import { useFiltriDellaPagina } from './useFiltriNellIndirizzo';

const SOTTOTITOLO = 'I dati dei file ASR non SIGC per intervento, da confrontare con SMP - Data Platform.';
const AIUTO_ANNO = "Facoltativo. Vale per indicatori, output e dati dell'avviso; domande e spesa sono cumulative (tutte le domande correnti).";

/**
 * link:verifica-smp-sigc: la frase dice che e' la stessa verifica per i dati SIGC e che porta i filtri, non l'anno (non si
 * traduce nell'esercizio, che la verifica SIGC chiede col suo selettore); chi la rende controlla prima il grant. I filtri
 * sono quelli dell'indirizzo, come nel menu: l'azione portante resta anche quando qui non si applica (senza il legame con
 * gli interventi), cosi' frase e menu portano gli stessi cinque filtri (review del riallineamento IST-10).
 */
function FraseVerificaSigc() {
  const filtri = filtriDaRicerca(useLocation().search);
  return (
    <>
      {'La stessa verifica per i dati SIGC, per esercizio finanziario e con gli stessi filtri: '}
      <Link to={verificaSigcConFiltri(filtri)}>Verifica SMP SIGC</Link>.
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
