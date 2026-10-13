# Review step9 FULL — feature elenco-operativo, v1 iterazione 2 (budget 3)

Repo frontend: `C:/Users/lorin/Desktop/Lorenzo/sian-ng/progetti/arsial/arsial-cruscotto/cruscotto-lazio-fe` (React 19, Vite,
React Query, orval, kit UI v2 in `src/shared/ui`, ECharts; Feature-Sliced Design). Feature `elenco-operativo` nel layout
multi-feature (ADR 0028 del plugin): `plan/elenco-operativo/{uiplan,route-manifest,handover}.json`, wireframe in
`wireframes/elenco-operativo/<flusso>/`, codice in `src/features/elenco-operativo`, pagine in `src/pages/elenco-operativo`.
Plugin green-fe dal worktree `C:/Users/lorin/Desktop/Lorenzo/sian-ng/marangi-lab/sian-green-wt-fe/plugins/green-fe`:
`_shared/references/{review-checklist,antagonist-brief,judge-brief}.md`, `references/uiplan-patterns.md` (§6-§9: grafici,
multi-feature, url_params e link, pattern interrogazione) e ADR 0029 (`docs/adr/0029-*.md`, regole di movimento).
Requirements pack 1.3.0: `../cruscotto-lazio-spec/reqpack/` (RA002..RA006 = TX-0056..TX-0060). Decisioni dell'utente:
`../cruscotto-lazio-spec/decisioni/MIN-20261012-decisioni-utente-elenco-operativo.md` (D-1..D-7). Contratto e decisioni del
backend: `handover/openapi-elenco-operativo.json`, `../cruscotto-lazio-be/datamodel/elenco-operativo-decisions.json`
(D-01..D-11 con Rev. 1 e 2), scenari `handover/acceptance/elenco-operativo-scenarios.json`.

Prima review di questa feature. Intensita' FULL (obbligatoria: authz/scoping, perimetro P4). Gate step8 11/11 sul commit b74b7a2
(843 test, axe 0 violazioni su 49 run, authz con catalogo OK, 3 wireframe approvati as-built). Gate non declassabili verdi.

## Perimetro
`git diff 2915486 b74b7a2` ristretto alla feature e al codice condiviso che ha toccato: commit 5c03266..e52faf9 (step2-7),
feb32b6..b74b7a2 (refresh sul contratto finale con voceProgrammazione/statoSostegno/statoPagamento, gate). Codice condiviso
toccato: `src/shared/ui` (TabellaServer, Paginazione, tema.css), `src/shared/lib` ("Dati al" spostato), menu e Home
(sezione "Strumenti"), route-table, test di shell.

## Scelte gia' approvate (NON sono finding; segnala solo se il codice le tradisce)
- Tre flussi approvati il 13/10/2026: domande e pagamenti come `interrogazione` (filtri a chip nel link, pannello dei filtri dal
  vivo, sinottico sopra, totali sotto calcolati dal server, tabella ordinata e paginata dal server, export CSV/XLSX), dettaglio
  della domanda con schede. CUAA e denominazione in chiaro a tutti i profili (OP-033, D-7): NON e' un finding.
- Viste per ambito solo lato client (OP-EO-02): un link condiviso apre la vista generale.
- "Dati al" da ultimiDatiSincronizzati (OP-EO-01 chiuso). Il responsabile del procedimento arriva dal backend come
  {valore, motivo} (NON_ESPOSTO per i profili senza area procedurale, OP-008).
- voceProgrammazione/statoSostegno/statoPagamento sono parametri di drill-down: nessun controllo nel pannello dei filtri, solo
  chip leggibili.
- Gli export senza operationId (OP-EO-05), come nel finanziario.

## Regole
- SOLA LETTURA: non modificare file del repo; niente npm o build. Comandi read-only (grep, git show/diff).
- Ogni finding verificato sul codice (file e riga reali) e azionabile. Niente stile. Severita' della checklist; anti-inflation:
  MAGGIORE solo con un comportamento sbagliato concreto rispetto a pack/wireframe approvati/decisioni/contratto, un rischio reale
  o un test che non prova cio' che dichiara.
- Output: array JSON in `review/elenco-operativo/v1-iter2/<file della consegna>` con oggetti
  `{"id","severity","file":"<path>:<riga>","titolo","evidenza","fix"}`. E' l'unico file che puoi scrivere.
- Alla fine rispondi con un riassunto di poche righe (conteggio per severita').

## Iterazione 2

Iterazione 1: FAIL (1 C, 7 M, 29 m, 1 c); accettati in `review/elenco-operativo/v1-iter1/findings-accettati.json`, decisioni
in `review/elenco-operativo/v1-iter1/judge.json`. Correzioni in b2dea89 (refresh sul contratto finale del backend), eb89f21,
3a191ec, 1fb80b2, bce8112, 074bd29, 6bd8890, a8ce584, 5a8e6bc (V-08), bc02c20 (X-06); wireframe domande e pagamenti
riapprovati (b835b40). Decisioni dell'utente del 13/10/2026 (NON finding): A-01 tenuto CRITICO e corretto; bottone
"Colonne" con la vista come colonne di partenza (V-01); campi della scheda come colonne a scelta (V-02); ordinamento
dichiarato e vista conservata al ritorno (X-04); ritorno al link dopo il login col parametro `ritorno` del BFF (X-06,
backend aac4579 con convalida anti open-redirect lato server); barra "Senza stato" cliccabile e 27 filtri (V-08).
Gate step8 11/11 su bb877d4 (944 test).

Compito: (a) verifica che ogni finding dell'iterazione 1 sia risolto (cita l'id se no), in particolare A-01 (convalida e
codifica dei segmenti della scheda, test negativi, README); (b) difetti nuovi: `git diff b74b7a2 bb877d4` (filtra su
src/features/elenco-operativo, src/pages/elenco-operativo, src/shared, src/app, src/entities, tests, plan/elenco-operativo,
wireframes/elenco-operativo, README). Non riproporre cio' che l'iterazione 1 ha verificato.
