# Review step9 FULL sul delta del riallineamento degli ambiti — passata 1 (30/10/2026)

Review sul delta `e0f6cb7..6857940` (step1-7 del riallineamento delle cinque feature, decisione dell'utente del 29/10/2026),
una sola review con verdetto per feature (scelta dell'utente del 19/10/2026; deviazione dichiarata dalla procedura green-fe).
Brief `review/riallineamento-2026-10-30/review/brief-comune.md`; lenti V1 (fisico, istituzionale), V2 (procedurale,
elenco-operativo, finanziario, comune), H, A, antagonista e Judge nella stessa cartella (`*-passata1.json`,
`judge-passata1.md`). Gate non declassabili (`check-ui-authz.sh`, `fe-project-check.sh --built --catalog`): PASS su tutte e
cinque le feature (lente A e Judge). Step8 11/11 prima della review (6857940, 1635 test).

## Verdetto (review-score.sh FULL sui file di finding del Judge)

| feature | CRITICO | MAGGIORE | MINORE | COSMETICO | score | verdetto |
|---|---|---|---|---|---|---|
| finanziario | 0 | 0 | 0 | 2 | 98 | PASS |
| elenco-operativo | 0 | 1 | 0 | 0 | 85 | **FAIL** (EO-01) |
| fisico | 0 | 0 | 6 | 2 | 80 | PASS (sulla soglia) |
| istituzionale | 0 | 0 | 5 | 5 | 80 | PASS (sulla soglia) |
| procedurale | 0 | 0 | 3 | 2 | 89 | PASS, ma RIAPERTO dalla decisione D1 (a) |

Finding: `review/riallineamento-2026-10-30/review/<feature>-findings-passata1.json` (31 in ingresso, 26 accettati, 3 uniti,
2 rigettati, 6 declassati; nessun CRITICO, nessun finding contestato).

**Declassamenti da cui dipendono i PASS** (detti all'utente prima della registrazione): V1-01 -> FIS-01 da MAGGIORE a MINORE
(test che dichiara "lettura e file" ma prova solo la lettura; codice corretto); H-08 -> IST-06 da MINORE a COSMETICO (tre
funzioni di una riga copiate); A-01 -> PRO-01 da MAGGIORE a MINORE (asserzioni "nessuna lettura" sincrone). Tutti i finding
accettati vengono corretti comunque.

## Decisioni dell'utente (30/10/2026, verso le 11:42Z)
- **D1 (EO-01), raccomandata (a):** il link della scheda porta il tipo della domanda nello state della navigazione (mai
  nell'URL); se `tipoDomanda` della risposta di TX-0020 e' diverso, la pagina delle determine lo dice e rimanda alla scheda
  Determine della domanda di partenza. Solo frontend. Vanno aggiornati e RIAPPROVATI i wireframe `procedurale/determine` (e
  la frase di `elenco-operativo/dettaglio-domanda.md:48`); il procedurale ripassa in review con l'elenco operativo. Test con
  la scheda SOSTEGNO 34810022870 e la risposta PAGAMENTO (SC-PC_DETERMINA_TIPO).
- **D2 (PRO-02), raccomandata (a):** "Cerca un altro codice" (col focus sul campo) anche nell'avviso degli errori 403/429/503
  delle determine, come nel wireframe approvato; nessuna riapprovazione.
- **D3 (IST-03), raccomandata:** ultimo esercizio chiuso calcolato nel calendario italiano (Europe/Rome), test sul confine
  del 16/10.
- **Verdetto:** step9 registrato per le feature PASS non riaperte (finanziario, fisico, istituzionale), come nei giri
  precedenti; poi correzione di tutti i finding, step8 di nuovo e passata 2 per elenco-operativo e procedurale.

## Prossimi passi
1. Correzione dei 26 finding accettati e delle decisioni D1-D3 (resoconto `review/riallineamento-2026-10-30/correzioni-
   passata1.md`); wireframe di D1 da riapprovare prima del codice di EO-01.
2. Step8 11/11 sulle feature toccate.
3. Passata 2 per elenco-operativo e procedurale; step9 registrato alle PASS.

## Correzioni della passata 1 (30/10/2026)
Gruppo FI 2aee55e..1305564 (fisico, istituzionale, FIN-01; resoconto `review/riallineamento-2026-10-30/correzioni-passata1-fi.md`),
gruppo PEF 5851b13..997797f fuso in c656cf7 (procedurale, EO-01 con D1, FIN-02; `correzioni-passata1-pef.md`); wireframe di D1
riapprovati in a934a29. Step8 11/11 sulle cinque feature (79c1093, 1673 test).

## Passata 2: elenco-operativo e procedurale
Brief `review/riallineamento-2026-10-30/review/brief-passata2.md`; lenti V, H, A, antagonista e Judge `*-passata2.json`,
`judge-passata2.md`. Gate non declassabili PASS. I sei finding della passata 1 (EO-01, PRO-01..PRO-05) sono chiusi.

| feature | CRITICO | MAGGIORE | MINORE | COSMETICO | score | verdetto |
|---|---|---|---|---|---|---|
| elenco-operativo | 0 | 0 | 0 | 6 | 94 | PASS |
| procedurale | 0 | 0 | 5 | 1 | 84 | PASS |

Step9 registrato per le due feature (13:34Z): con la passata 2 le cinque feature hanno lo step9 done.

Decisioni dell'utente dopo la passata 2:
- **D4 (PRO2-03), (b) testo neutro:** quando TX-0020 da' la domanda dell'altro tipo (sceglie per prima quella con determine
  aperte), l'avviso dice "Il codice a barre N e' anche di una domanda di <tipo della risposta>: questa pagina mostra quella
  domanda, non la domanda di <tipo della scheda> da cui arrivi.", vero anche quando la scheda di partenza non ha determine
  aperte; resta il link alla scheda di partenza. Wireframe `procedurale/determine` da riapprovare.
- **Niente passata 3:** correzioni dei residui (D4; state letto una volta sola all'arrivo come dice il wireframe, PRO2-01 con
  A2-01; annuncio con dati in cache PRO2-02; test PRO2-04/PRO2-05; cosmetici), poi step8 11/11, come nei giri precedenti.
