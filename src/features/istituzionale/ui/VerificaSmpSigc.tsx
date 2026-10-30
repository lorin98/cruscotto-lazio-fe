// VerificaSmpSigc — pagina /istituzionale/verifica-smp-sigc (flusso verifica-smp-sigc approvato il 30/10/2026, pattern
// report v2 come la verifica SMP non SIGC, RF015, TX-0015): i dati SIGC per intervento da confrontare con SMP - Data
// Platform, per l'esercizio scelto (obbligatorio). Viene dalla pagina /finanziario/sigc/verifica-smp col riallineamento
// degli ambiti del 29/10/2026 (A-1, A-5; nessun alias della vecchia route). Barra dei filtri a chip col pannello (voci da
// TX-0060, G2), le pill del perimetro regionale, dell'esercizio coi suoi estremi e "Dati al" (ultimiDatiSincronizzati di
// TX-0015); percorso e un solo h1 col focus, con sotto la frase verso la verifica SMP non SIGC coi filtri comuni
// (link verifica-smp-non-sigc, scelta di disegno 1: non l'esercizio), resa solo col grant di TX-0016; il selettore
// dell'esercizio (2023-2030, "Mostra"; senza esercizio nessuna lettura e la pagina chiede di sceglierlo); i riferimenti
// della risposta (esercizio, anno delle domande, pagamenti senza data, perimetro), la card a barre della spesa erogata
// nella campagna precedente (zoom; clic su una barra: il dettaglio dell'intervento con l'esercizio, link
// dettaglio-intervento-smp-sigc; PNG, CSV, XLSX), la tabella dei venti dati (CSV, XLSX). Stati: esercizio non scelto,
// caricamento, vuoto con "Modifica i filtri", valori dei filtri non disponibili, errore (un solo avviso). Nessun KPI.
// L'impaginazione e' quella dei report istituzionali (PaginaReport). Classi bootstrap-italia e del kit v2; nessun
// react-aria fuori dal kit.
import { useMemo } from 'react';
import { Link, useLocation } from 'react-router';
import { filtriDaRicerca, ricercaDaFiltri } from '../../../entities/filtri';
import type { Filtri } from '../../../entities/filtri';
import { useAuthStatus } from '../../../shared/api/auth/use-auth-status';
import { CardGrafico, ContestoIntestazione, SelettoreAnno, TabellaVoci, useAnnoNellIndirizzo, useRigheContesto } from '../../../shared/ui';
import { useVerificaSmpSigc } from '../api';
import type { VerificaSmp } from '../api';
import { percorsoInterventoSigc, verificaNonSigcConFiltri } from '../lib/collegamenti';
import { PARAMETRO_ESERCIZIO, criteriVerificaSigc, eserciziProposti, testiCriteriSigc } from '../lib/criteri';
import { NESSUN_DATO_SIGC, PERIMETRO_IN_PAROLE, SCEGLI_ESERCIZIO, pillEsercizio } from '../lib/formato';
import { TITOLO_SPESA_SIGC, graficoSpesaSigc } from '../lib/grafici';
import { puoLeggere } from '../lib/grant';
import { periodoDellaRisposta, vociRiferimentiSigc } from '../lib/verificaSigc';
import { fileVerificaSigc } from './esportazioni';
import { useApriIntervento } from './navigazione';
import { PaginaReport } from './PaginaReport';
import { TabellaVerificaSigc } from './TabellaVerificaSigc';
import { useFiltriDellaPagina } from './useFiltriNellIndirizzo';

const SOTTOTITOLO = "I dati SIGC per intervento dell'esercizio scelto, da confrontare con SMP - Data Platform.";
const AIUTO_ESERCIZIO = "Obbligatorio. Esercizio n dal 16 ottobre n-1 al 15 ottobre n; le domande sono quelle dell'anno n-1. Esercizi del periodo CSR, dal 2023 al 2030, come nel finanziario.";
const SOTTOTITOLO_GRAFICO =
  "Spesa erogata nell'esercizio per le domande della campagna precedente (anno n-1), le campagne anteriori nella tabella; trascina il cursore sotto il grafico per ingrandire, clic su una barra per il dettaglio dell'intervento";

/** La fonte della card del grafico: la transazione e l'esercizio, la tabella equivalente, cosa contengono i file. */
const fonte = (esercizio: number) =>
  `Fonte: TX-0015, esercizio ${esercizio}. La tabella equivalente mostra gli stessi valori, con i valori assenti dichiarati. PNG: l'immagine del grafico con l'intestazione, non registrata in audit come nel finanziario; CSV e XLSX: i dati del report scritti dal backend con gli stessi filtri e lo stesso esercizio.`;

/**
 * link:verifica-smp-non-sigc: la frase dice la pagina di arrivo e che porta i filtri; chi la rende controlla prima il
 * grant. I filtri sono quelli dell'indirizzo, come nel menu: l'azione portante resta anche quando qui non si applica
 * (review del riallineamento IST-10).
 */
function FraseVerificaNonSigc() {
  const filtri = filtriDaRicerca(useLocation().search);
  return (
    <>
      {'La stessa verifica per i dati ASR non SIGC, con gli stessi filtri: '}
      <Link to={verificaNonSigcConFiltri(filtri)}>Verifica SMP non SIGC</Link>.
    </>
  );
}

/** Il report dell'esercizio: riferimenti della risposta, barre della spesa erogata e tabella dei venti dati, coi file. */
function ReportVerificaSigc({ d, filtri, esercizio }: { d: VerificaSmp; filtri: Filtri; esercizio: number }) {
  const { apri, dalClic } = useApriIntervento((codice) => percorsoInterventoSigc(codice, esercizio));
  const righe = useMemo(() => d.righe ?? [], [d.righe]);
  const dati = useMemo(() => graficoSpesaSigc(righe), [righe]);
  const file = fileVerificaSigc(`Verifica SMP SIGC esercizio ${esercizio}`, criteriVerificaSigc(filtri, esercizio));
  const oggetto = `i dati della verifica SMP SIGC, esercizio ${esercizio}`;
  const contesto = useRigheContesto(testiCriteriSigc(filtri, esercizio), d.ultimiDatiSincronizzati, PERIMETRO_IN_PAROLE);
  return (
    <ContestoIntestazione.Provider value={contesto}>
      <TabellaVoci caption="Riferimenti della risposta" voci={vociRiferimentiSigc(d, esercizio)} />
      <CardGrafico titolo={TITOLO_SPESA_SIGC} sottotitolo={SOTTOTITOLO_GRAFICO} dati={dati} fonte={fonte(periodoDellaRisposta(d, esercizio).esercizio)} livello={2} altezza="alto" onClic={dalClic} scaricamenti={file} oggettoDati={oggetto} />
      <TabellaVerificaSigc righe={righe} esercizio={esercizio} scaricamenti={file} oggetto={oggetto} onRiga={apri} />
    </ContestoIntestazione.Provider>
  );
}

export function VerificaSmpSigc() {
  const pagina = useFiltriDellaPagina(PARAMETRO_ESERCIZIO);
  const [esercizio, impostaEsercizio] = useAnnoNellIndirizzo(PARAMETRO_ESERCIZIO);
  const stato = useVerificaSmpSigc(pagina.filtri, esercizio, { abilitato: !pagina.inAttesa });
  const nota = puoLeggere(useAuthStatus().data, 'verifica') ? <FraseVerificaNonSigc /> : undefined;
  const selettore = <SelettoreAnno id="f-esercizio" etichetta="Esercizio finanziario" aiuto={AIUTO_ESERCIZIO} anni={eserciziProposti(esercizio)} voceVuota="Scegli un anno" anno={esercizio} onCambia={impostaEsercizio} />;
  return (
    <PaginaReport
      pagina={pagina}
      stato={stato}
      briciola="Verifica SMP SIGC"
      titolo="Istituzionale: verifica SMP SIGC"
      titoloDocumento="Verifica SMP SIGC - Istituzionale"
      sottotitolo={SOTTOTITOLO}
      nota={nota}
      senzaLettura={esercizio === undefined ? SCEGLI_ESERCIZIO : undefined}
      testoDelVuoto={NESSUN_DATO_SIGC}
      pill={(d) => pillEsercizio(d.esercizio ?? esercizio)}
      sopra={selettore}
    >
      {(d) => esercizio !== undefined && <ReportVerificaSigc key={`${ricercaDaFiltri(pagina.filtri)}|${esercizio}`} d={d} filtri={pagina.filtri} esercizio={esercizio} />}
    </PaginaReport>
  );
}
