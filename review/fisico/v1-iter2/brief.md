# Review step9 FULL — feature fisico, v1 iterazione 2 (budget 3)

Contesto, regole, formato di output e scelte approvate: come in `review/fisico/v1-iter1/brief.md` (leggilo per intero: vale
anche qui), salvo quanto segue.

Dall'iterazione 1 (22/10/2026): 14 finding accettati (`review/fisico-findings.json`, Judge `review/fisico/v1-iter1/judge.md`:
1 MAGGIORE, 11 MINORE, 2 COSMETICO), corretti nei commit da 691ad34 a 88ed136 (resoconto `review/fisico/v1-iter1/correzioni.md`).
Decisioni dell'utente D1 (testo dello stato vuoto con il filtro Campagna) e D2 (ettari dell'elenco con la resa unica del kit):
report `review/fisico-review.md`. Wireframe superfici RIAPPROVATO dall'utente il 22/10/2026 (ed992a5, entrambi i canali): NON e'
un finding, segnala solo se il codice lo tradisce. Parti contestate dal Judge e NON applicate: nessuna seconda lettura di TX-0018
senza filtro (una lettura per pagina). Effetti dichiarati su finanziario ed elenco (non sono finding se coerenti): una lista di
caselle vuota senza ricerca non scrive piu' "Nessuna voce corrisponde alla ricerca."; ettari dell'elenco "12,50 ha"; nel pannello
del fisico un secondo clic sulla campagna scelta torna a "Tutte le campagne".

Compito dell'iterazione 2: (a) verifica che ogni finding dell'iterazione 1 sia risolto (se no, ripresentalo citando l'id); (b)
cerca difetti NUOVI introdotti dalle correzioni, in particolare nel codice comune nuovo o spostato (`shared/ui/filtri/ControlliPannello`,
`useFocusDopoIlCambio`, `entities/filtri` con `useFiltriProgrammaNellIndirizzo` e `useBozzaFiltri`, `TestataDettaglio`,
`shared/api/problem/e-problema.ts`, `ettari` del kit) e nei suoi usi in finanziario ed elenco (nessuna regressione), nei test
nuovi (provano davvero?), in `lib/report.ts` e `ui/ReportSuperfici.tsx`. Perimetro: `git diff dcedafe ed992a5`. Anti-inflation:
non riproporre cio' che l'iterazione 1 ha verificato come corretto. Gate step8 in corso (non presumerne l'esito).
Output: `review/fisico/v1-iter2/<lente>.json`.
