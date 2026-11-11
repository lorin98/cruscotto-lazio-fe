# Review step9 FULL sul delta delle note di Leonardo del 10/11/2026, passata 2 MIRATA (verifica delle correzioni + Judge)

Stessa forma della passata 2 mirata del 04/11 (`review/delta-revisioni-2026-11-04/brief-passata2.md`): un verificatore
controlla che ogni finding della passata 1 sia chiuso davvero e che le correzioni non abbiano rotto altro; poi il Judge
ricalcola i finding e il verdetto con `review-score.sh FULL`. Valgono il brief della passata 1 (`brief-comune.md`) e le regole
che richiama.

## Ingresso
- Finding della passata 1: `review/delta-note-leonardo-2026-11-10/finanziario-findings-passata1.json` (J-01..J-15; resoconto del
  Judge in `judge-passata1.md`).
- Correzioni: `git diff 9b759da HEAD -- src tests wireframes uiplan.json route-manifest.json` (commit 886753a wireframe
  riapprovati e step1, c0b3cd9 barre impilate, 1e3578f gauge e Sankey, 8a3325d Importi per anno e avviso, 16c8e00 test; poi
  stati e report dei gate step2-8).
- Esiti gia' misurati (non rilanciarli): tsc e eslint puliti, vitest 1767/1767, step2-8 rilanciati (log
  `../../ambiente-prova/log/gate-fe-*-20261111-2.log`), verifica a vista a 390 e 1600 px del gauge, del Sankey e delle barre
  (foto nello scratchpad della sessione: gauge dentro il grafico a 390 px, etichette del Sankey su due righe non tagliate).

## Scelte dell'utente dell'11/11/2026 (NON sono finding)
- J-06: il nodo del Sankey si chiama "Pagato (lordo)" (scelta dell'utente). Etichette dei nodi su due righe (nome, importo):
  su una riga "Pagato (lordo): 135,9 M€" era tagliata a destra.
- J-09: "non valorizzato" (dato assente nella fonte) per stanziato, ammesso e decretato in tutte e due le tabelle di Importi per
  anno e nelle voci omesse del grafico (scelta dell'utente, come lo stanziato per anno del wireframe domande).
- J-08, J-04, J-06, J-09, J-10: wireframe aggiornati e RIAPPROVATI dall'utente l'11/11/2026 alle 15:35:12Z (tta 31 s).
- Gauge: al centro l'importo della dotazione con la sola parola "dotazione" (con "dotazione spesa pubblica" a 390 px il testo
  toccava l'arco); importo alla fine dell'arco corto (`importoEtichettaGauge`: "134,6 M€", "0,19 M€", "9 mila €", euro sotto
  mille), raggio al 48 %; il valore pieno e' nella tabella equivalente.
- Barra intera dei lordi in grigio ardesia (COLORI.attenuato, testo bianco 6,1:1), distinta dall'arancio delle rettifiche.

## Compito del verificatore
Per ogni J-01..J-15: chiuso / parzialmente chiuso / aperto, con file:riga e una riga di motivo; poi le regressioni nuove
introdotte dalle correzioni (solo difetti concreti, con anti-inflation). Output: `review/delta-note-leonardo-2026-11-10/
verifica-passata2.json`, array di oggetti `{"id","stato":"chiuso|parziale|aperto|nuovo","severity","file","titolo",
"evidenza","fix"}` (per i chiusi severity e fix possono mancare).
