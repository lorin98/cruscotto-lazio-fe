# Review step9 FULL sul delta delle note di Leonardo del 10/11/2026 (giro dell'11/11/2026), passata 1

Stessa forma della review FULL sul delta del 04/11 (`review/delta-revisioni-2026-11-04/brief-comune.md`, che rimanda alle
sezioni "Riferimenti" e "Regole" di `review/revisioni-2026-10-31/review/brief-comune.md`): valgono anche qui salvo perimetro,
cartella di output e scelte sotto. Intensita' FULL obbligatoria (`review-intensity-fe.sh`: feature con authz e scoping).
Solo la feature finanziario: il kit cambia in modo additivo (Griglia a una colonna, classe CSS delle tabelle compatte usata
solo da Domande e importi); le altre quattro feature hanno rifatto lo step8 dopo l'ultimo commit di codice.

## Cosa e' cambiato (perimetro: `git diff 0d928a6 HEAD`, a meno dei soli stati e report dei gate)
- Wireframe (bozze approvate dall'utente l'11/11/2026 alle 14:06:24Z, tta 19 s; fuori dal repo in
  `../../analisi-2026-11-11/wireframe-bozze/`): finanziario dotazione-avanzamento, domande, panoramica (dettaglio
  dell'intervento), riepilogo; sigc portato avanti. Lint del plugin (`templates/wireframe-v2`) pass x4. Commit 93168fe.
- Codice: a6ebec1 (kit: `shared/ui/card/Sezione.tsx` Griglia `colonne={1}`, `shared/ui/tema.css` `.ui-griglia--1` e
  `.ui-tabelle-compatte`), b2a746d (Avanzamento: `lib/grafici/avanzamento.ts` sottotitolo del flusso, Sankey
  `layoutIterations: 0`, gauge `graficoPagatoNetto` con `puntoFineArco`, `serieGaugeConDotazione`, `tabellaPagatoNetto`;
  `ui/AvanzamentoReport.tsx` titoli e sottotitoli), e43f7f9 (dettaglio: `lib/grafici/intervento.ts` `graficoBarreIntervento`
  al posto di `graficoCascataIntervento`, `lib/grafici/sigc.ts` segmenti esportati, `ui/DettaglioIntervento.tsx`),
  e33b69e (Domande: `lib/grafici/domande.ts` intestazioni della vista Tabella, `ui/DomandeReport.tsx` sezioni a tutta
  larghezza e tabelle compatte), 74e119a (`ui/AvvisoImpegnati.tsx`: da dove viene l'impegnato), 872c35d (test).

## Scelte approvate dall'utente (11/11/2026), NON sono finding (segnala solo se il codice le tradisce)
- Titoli e sottotitoli dei sei grafici di Avanzamento come nelle note di Leonardo; i codici RF restano nei titoli.
- Sankey: il pagato sopra il da pagare (ordine fisso dei nodi).
- Gauge tenuto anche se simile alla ciambella RF007: dotazione al centro, percentuale e importo dei pagamenti NETTI alla fine
  dell'arco (il mock di Leonardo aveva il lordo, 135,9 M€: scelta del netto, coerente col 23,2 %). Stesso gauge nel dettaglio.
- "Dalla dotazione al residuo": due barre impilate, Dotazione = pagamenti netti + residuo sui pagamenti, Pagamenti lordi =
  pagamenti netti + rettifiche (il disegno di Leonardo, lordi + residuo, supererebbe la dotazione delle rettifiche). Valori
  del contratto (TX-0011), nessun calcolo nel browser; lordi oltre la dotazione ora disegnabili, importi negativi no.
- Domande e importi: vista Tabella di Importi per anno con le intestazioni della tabella di dettaglio; sezioni una sotto
  l'altra e tabelle compatte (nessuno scorrimento orizzontale da 1366 px; sul telefono le tabelle scorrono ancora).
- Avviso degli impegnati: dice da dove viene l'impegnato (ASR2-20 per gli interventi SIGC con ammesso o richiesto secondo lo
  stato e la stima dei pluriennali; contributo ammesso PROSA per i NO SIGC). Impegnato oltre la dotazione: nessun cambio,
  domanda aperta per ARSIAL.
- Tessera dell'elenco operativo (pagate/da pagare/senza importi): solo spiegazione, nessun cambio.

## Punti da valutare
- Gauge: posizione dell'etichetta per valori estremi (0, ~5 %, 50 %, 100 %, oltre 100 %), larghezze strette (390 px) e PNG;
  testo accessibile (aria) e tabella equivalente con le assenze; perimetro ADA invariato (non confrontabile).
- Barre dell'intervento: segmenti, percentuali delle etichette, legenda coi due "Pagamenti netti", casi senza rettifiche,
  residuo assente, importi negativi (SRD11), lordi oltre la dotazione; contrasto del colore delle rettifiche.
- Sankey: `layoutIterations: 0` non rompe il flusso senza impegni (dalla dotazione ai pagamenti netti) ne' i rami omessi.
- Domande: la classe compatta tocca solo questa pagina; intestazioni coerenti fra vista Tabella (con e senza il grant
  dell'elenco) e dettaglio; esportazioni invariate.
- Avviso: testo esatto e veritiero rispetto al backend (`AlgoritmoRichiestoAmmesso`, `RicalcoloImpegnatoNoSigc`).
