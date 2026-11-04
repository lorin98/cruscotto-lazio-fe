// VerificaSmpNonSigc — pagina /istituzionale/verifica-smp-non-sigc (flusso verifica-smp-non-sigc approvato, pattern report
// v2 come la verifica SMP SIGC della stessa area, RF016): barra dei filtri a chip col pannello (voci da TX-0060, G2), le
// pill del perimetro regionale, dell'anno di riferimento scelto e "Dati al" (ultimiDatiSincronizzati di TX-0016, G3);
// percorso e un solo h1 col focus, con sotto la frase verso la verifica SMP SIGC coi filtri comuni e senza l'anno (link
// verifica-smp-sigc, scelta di disegno 1 del 30/10/2026, al posto della decisione G4), resa solo col grant di TX-0015; lo
// stato dei valori dei filtri non disponibili; il selettore dell'anno (obbligatorio dal 04/11/2026, come l'esercizio della
// verifica SIGC: senza anno nessuna lettura e "Scegli l'anno di riferimento da consultare."; si applica con "Mostra"); il
// report. UNA lettura di TX-0016 per pagina, coi criteri dell'indirizzo. Stati: caricamento (scheletro), errore (un solo avviso della pagina, problem-type),
// vuoto (con "Modifica i filtri": coi criteri cambiati dal pannello il focus va sull'h1), valori dei filtri non
// disponibili. Design system: classi bootstrap-italia e del kit v2; i primitivi react-aria stanno solo dentro i
// componenti del kit che li richiedono (pannello modale, popover della pill). Barra, testata, stati e pannello sono
// l'impaginazione comune dei due report (PaginaReport, review H6).
import { Link, useLocation } from 'react-router';
import { filtriDaRicerca, ricercaDaFiltri } from '../../../entities/filtri';
import { useAuthStatus } from '../../../shared/api/auth/use-auth-status';
import { letturaDelTipo } from '../../../shared/lib';
import { SelettoreAnno, useAnnoNellIndirizzo } from '../../../shared/ui';
import { useVerificaSmpNonSigc } from '../api';
import { verificaSigcConFiltri } from '../lib/collegamenti';
import { PARAMETRO_ANNO, anniDiRiferimento } from '../lib/criteri';
import { SCEGLI_ANNO, pillAnnoScelto } from '../lib/formato';
import { puoLeggere } from '../lib/grant';
import { PaginaReport } from './PaginaReport';
import { ReportVerifica } from './ReportVerifica';
import { useFiltriDellaPagina } from './useFiltriNellIndirizzo';

const SOTTOTITOLO = 'I dati dei file ASR non SIGC per intervento, da confrontare con SMP - Data Platform.';
const AIUTO_ANNO = "Obbligatorio. Vale per indicatori, output e dati dell'avviso; domande e spesa sono cumulative (tutte le domande correnti).";

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

/** Il motivo della non pertinenza col filtro SIGC (wireframe verifica-smp-non-sigc, revisioni del 31/10/2026, F3). */
const MOTIVO_SOLO_NO_SIGC = 'Riguarda solo gli interventi NO SIGC';

export function VerificaSmpNonSigc() {
  const pagina = useFiltriDellaPagina(PARAMETRO_ANNO);
  const [anno, impostaAnno] = useAnnoNellIndirizzo(PARAMETRO_ANNO);
  // solo NO SIGC (TX-0016): col filtro SIGC il report e' non pertinente, letto senza filtro (il dato reale, in grigio)
  const { np, criteri: lettura } = letturaDelTipo(pagina.filtri, 'nosigc', MOTIVO_SOLO_NO_SIGC);
  const stato = useVerificaSmpNonSigc(lettura, anno, { abilitato: !pagina.inAttesa });
  const nota = puoLeggere(useAuthStatus().data, 'verificaSigc') ? <FraseVerificaSigc /> : undefined;
  const selettore = <SelettoreAnno id="f-anno-smp" etichetta="Anno di riferimento del monitoraggio SMP non SIGC" aiuto={AIUTO_ANNO} anni={anniDiRiferimento(stato.data?.annoRiferimento, anno)} voceVuota="Scegli un anno" anno={anno} onCambia={impostaAnno} />;
  return (
    <PaginaReport
      pagina={pagina}
      stato={stato}
      briciola="Verifica SMP non SIGC"
      titolo="Istituzionale: verifica SMP non SIGC"
      titoloDocumento="Verifica SMP non SIGC - Istituzionale"
      sottotitolo={SOTTOTITOLO}
      nota={nota}
      senzaLettura={anno === undefined ? SCEGLI_ANNO : undefined}
      pill={() => pillAnnoScelto(anno)}
      sopra={selettore}
      np={np}
    >
      {(d) => anno !== undefined && <ReportVerifica key={`${ricercaDaFiltri(pagina.filtri)}|${anno}`} d={d} filtri={pagina.filtri} anno={anno} />}
    </PaginaReport>
  );
}
