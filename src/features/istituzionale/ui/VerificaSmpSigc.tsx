// VerificaSmpSigc — pagina /istituzionale/verifica-smp-sigc (RF015, TX-0015): i dati SIGC per intervento da confrontare
// con SMP - Data Platform, per l'esercizio scelto (obbligatorio). Viene dalla pagina /finanziario/sigc/verifica-smp col
// riallineamento degli ambiti del 29/10/2026 (A-1, A-5; nessun alias della vecchia route) e ne tiene il comportamento:
// selettore dell'esercizio (2023-2030, "Mostra"; senza esercizio nessuna lettura e la pagina chiede di sceglierlo), i
// riferimenti della risposta (esercizio, anno delle domande, pagamenti senza data), le barre della spesa erogata nella
// campagna precedente con zoom (clic su una barra: il dettaglio dell'intervento), la tabella dei venti dati
// (TabellaVerificaSigc) e i file CSV e XLSX del backend coi filtri e l'esercizio. L'impaginazione e' quella dei report
// istituzionali (PaginaReport: barra dei filtri a chip col pannello e le voci di TX-0060, perimetro regionale, esercizio e
// "Dati al" della risposta, un solo h1 col focus, un solo avviso d'errore, vuoto con "Modifica i filtri"). Le novita' del
// wireframe verifica-smp-sigc (frase verso la verifica non SIGC coi filtri, dettaglio con la scheda SIGC) sono dei passi
// successivi. Classi bootstrap-italia e del kit v2; nessun react-aria fuori dal kit.
import { useMemo } from 'react';
import { ricercaDaFiltri } from '../../../entities/filtri';
import type { Filtri } from '../../../entities/filtri';
import { CardGrafico, ContestoIntestazione, PulsantiScarica, SelettoreAnno, Sezione, TabellaVoci, useAnnoNellIndirizzo, useRigheContesto } from '../../../shared/ui';
import { useVerificaSmpSigc } from '../api';
import type { VerificaSmp } from '../api';
import { PARAMETRO_ESERCIZIO, criteriVerificaSigc, eserciziProposti, testiCriteriSigc } from '../lib/criteri';
import { NESSUN_DATO_SIGC, PERIMETRO_IN_PAROLE, SCEGLI_ESERCIZIO, annoOpzionale, pillEsercizio } from '../lib/formato';
import { TITOLO_SPESA_SIGC, graficoSpesaSigc } from '../lib/grafici';
import { fileVerificaSigc } from './esportazioni';
import { useApriIntervento } from './navigazione';
import { PaginaReport } from './PaginaReport';
import { Numero, TabellaVerificaSigc } from './TabellaVerificaSigc';
import { useFiltriDellaPagina } from './useFiltriNellIndirizzo';

const SOTTOTITOLO = "Venti dati per intervento per l'esercizio scelto, da confrontare con SMP - Data Platform.";
const AIUTO_ESERCIZIO = "Obbligatorio. Esercizio n dal 16 ottobre n-1 al 15 ottobre n; le domande sono quelle dell'anno n-1.";

/** Il report dell'esercizio: riferimenti della risposta, barre della spesa erogata e tabella dei venti dati, coi file. */
function ReportVerificaSigc({ d, filtri, esercizio }: { d: VerificaSmp; filtri: Filtri; esercizio: number }) {
  const { apri, dalClic } = useApriIntervento();
  const righe = d.righe ?? [];
  const dati = useMemo(() => graficoSpesaSigc(righe), [righe]);
  const file = fileVerificaSigc(`Verifica SMP SIGC esercizio ${esercizio}`, criteriVerificaSigc(filtri, esercizio));
  const contesto = useRigheContesto(testiCriteriSigc(filtri, esercizio), d.ultimiDatiSincronizzati, PERIMETRO_IN_PAROLE);
  return (
    <ContestoIntestazione.Provider value={contesto}>
      <Sezione titolo={`Dati SIGC per il confronto con SMP, esercizio ${esercizio} (RF015)`} strumenti={<PulsantiScarica oggetto={`i dati SIGC per il confronto con SMP, esercizio ${esercizio}`} scaricamenti={file} />}>
        <TabellaVoci
          caption="Esercizio"
          voci={[
            { etichetta: 'Esercizio', valore: String(d.esercizio ?? esercizio) },
            { etichetta: 'Anno delle domande', valore: annoOpzionale(d.annoDomande) },
            { etichetta: 'Pagamenti senza data di autorizzazione (esclusi)', valore: <Numero valore={d.pagamentiSenzaData} /> },
          ]}
        />
        <CardGrafico
          titolo={TITOLO_SPESA_SIGC}
          sottotitolo="Trascina il cursore sotto il grafico per ingrandire; clic su una barra per il dettaglio dell'intervento"
          dati={dati}
          fonte={`Fonte: TX-0015, esercizio ${d.esercizio ?? esercizio}`}
          livello={3}
          altezza="alto"
          onClic={dalClic}
          scaricamenti={file}
        />
        <TabellaVerificaSigc righe={righe} onRiga={apri} />
      </Sezione>
    </ContestoIntestazione.Provider>
  );
}

export function VerificaSmpSigc() {
  const pagina = useFiltriDellaPagina(PARAMETRO_ESERCIZIO);
  const [esercizio, impostaEsercizio] = useAnnoNellIndirizzo(PARAMETRO_ESERCIZIO);
  const stato = useVerificaSmpSigc(pagina.filtri, esercizio, { abilitato: !pagina.inAttesa });
  const selettore = <SelettoreAnno id="f-esercizio" etichetta="Esercizio finanziario" aiuto={AIUTO_ESERCIZIO} anni={eserciziProposti(esercizio)} voceVuota="Scegli un anno" anno={esercizio} onCambia={impostaEsercizio} />;
  return (
    <PaginaReport
      pagina={pagina}
      stato={stato}
      briciola="Verifica SMP SIGC"
      titolo="Istituzionale: verifica SMP SIGC"
      titoloDocumento="Verifica SMP SIGC - Istituzionale"
      sottotitolo={SOTTOTITOLO}
      senzaLettura={esercizio === undefined ? SCEGLI_ESERCIZIO : undefined}
      testoDelVuoto={NESSUN_DATO_SIGC}
      pill={(d) => pillEsercizio(d.esercizio ?? esercizio)}
      sopra={selettore}
    >
      {(d) => esercizio !== undefined && <ReportVerificaSigc key={`${ricercaDaFiltri(pagina.filtri)}|${esercizio}`} d={d} filtri={pagina.filtri} esercizio={esercizio} />}
    </PaginaReport>
  );
}
