# Review step9 FULL — feature finanziario, v4 iterazione 1 (budget 3)

Repo frontend: `C:/Users/lorin/Desktop/Lorenzo/sian-ng/progetti/arsial/arsial-cruscotto/cruscotto-lazio-fe` (React 19, Vite,
React Query, orval, kit UI v2 in `src/shared/ui`, ECharts; Feature-Sliced Design). Feature `finanziario` nel layout legacy alla
radice (`uiplan.json`, `route-manifest.json`, `handover.json`, `wireframes/<flusso>/`). Plugin: green-fe dal worktree
`C:/Users/lorin/Desktop/Lorenzo/sian-ng/marangi-lab/sian-green-wt-fe/plugins/green-fe` (checklist e brief condivisi in
`_shared/references/`: `review-checklist.md`, `antagonist-brief.md`, `judge-brief.md`; reference `references/uiplan-patterns.md`).
Requirements pack 1.3.0: `../cruscotto-lazio-spec/reqpack/`. Decisioni dell'utente sull'elenco operativo:
`../cruscotto-lazio-spec/decisioni/MIN-20261012-decisioni-utente-elenco-operativo.md` (D-2 = drill-down dai report).

Intensita' FULL (obbligatoria: feature con authz/scoping). Gate step8 11/11 sul commit b19ac02 (839 test, axe 0 violazioni su 49
run, authz con catalogo OK, 5 wireframe approvati as-built). Gate non declassabili: check-ui-authz e fe-project-check --built
--catalog verdi (nessun FAIL_AUTHZ).

## Cosa e' cambiato dall'ultima review (v3 PASS, score 85, report `review/finanziario-review.md`)
Perimetro: `git diff 258c55d b19ac02` ristretto a cio' che tocca il finanziario e il codice condiviso:
- a3e9579 allineamento ai dati reali (SIGC dall'ASR2-20, lordo e netto, etichette) ed e19d25f Home (quattro ambiti), MAI
  rivisti da una step9;
- 4c93d65 refresh sul pack 1.3.0 e 12 link di drill-down verso l'elenco operativo nello uiplan e nei flusso.md (5 flussi
  riapprovati dall'utente il 13/10/2026); 59c1574 step2-5 (helper puro `lib/link-elenco.ts`); 63f8ca0 step6 (link nei
  componenti, `ui/LinkElenco.tsx`, slot azione nel KPI, nome della serie nel clic dei grafici); e6fbe26 step7 (test);
  b19ac02 (link nella tabella equivalente del dettaglio dell'intervento, `ui/colonneAnno.tsx`, prop `tabella` di CardGrafico);
- codice condiviso toccato dalla feature elenco-operativo (commit 5c03266..e52faf9): `src/shared/ui` (TabellaServer,
  Paginazione, tema.css), `src/shared/lib` ("Dati al" spostato con riesportazione dal finanziario), menu e Home ("Strumenti"),
  route-table, test del finanziario e della shell limitati alle route /finanziario. Verifica che il finanziario non regredisca.

## Scelte gia' approvate (NON sono finding; segnala solo se il codice le tradisce)
- Link verso l'elenco solo dove l'insieme di domande del report e' riproducibile coi parametri di TX-0056/TX-0059; dotazione,
  impegni, riserva e verifica SMP non collegati (dichiarato nei flusso.md).
- Pagina domande: il clic sulle barre di 'Domande per anno' FILTRA in pagina come prima; l'elenco si apre con 'Apri nell'elenco'
  da KPI e celle (scelta dell'utente del 13/10).
- Riepilogo: il link dalla cella del netto porta all'elenco dei pagamenti (importi LORDI) con l'etichetta "righe di pagamento,
  importi lordi" e la nota sui recuperi (scelta dell'utente).
- Link visibili solo col grant della destinazione (TX-0056 domande, TX-0059 pagamenti); filtri correnti riportati, l'intervento
  della riga sostituisce il filtro.
- Deviazioni gia' riviste: V-22 (pulsante "Applica i filtri"), V-07 (download per formato, PNG non registrato: OP-FE-08).
- Debiti gia' accettati nelle review precedenti (vedi `review/finanziario-review.md`): non riproporli.

## Riferimenti
- uiplan del finanziario (`uiplan.json`, `links[]` con target_feature elenco-operativo) e uiplan dell'elenco
  (`plan/elenco-operativo/uiplan.json`, url_params delle destinazioni); `handover/openapi-elenco-operativo.json` (parametri
  di query di TX-0056/TX-0059) e `handover/openapi-finanziario.json`; `handover/authz-catalog.json`.
- Wireframe approvati: `wireframes/{panoramica,domande,riepilogo,sigc,dotazione-avanzamento}/` (html + flusso.md).

## Regole
- SOLA LETTURA: non modificare file del repo; non lanciare npm o build. Comandi read-only (grep, git show/diff).
- Ogni finding verificato sul codice (file e riga reali) e azionabile. Niente stile. Severita' della checklist; anti-inflation:
  MAGGIORE solo con un comportamento sbagliato concreto rispetto a pack/wireframe approvati/decisioni, un rischio reale o un test
  che non prova cio' che dichiara.
- Output: array JSON in `review/v4-iter1/<file della consegna>` con oggetti `{"id","severity","file":"<path>:<riga>","titolo",
  "evidenza","fix"}` (stesso formato di `review/v3-iter1/*.json`). E' l'unico file che puoi scrivere.
- Alla fine rispondi con un riassunto di poche righe (conteggio per severita').
