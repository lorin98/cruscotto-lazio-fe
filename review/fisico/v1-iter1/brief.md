# Review step9 FULL — feature fisico, v1 iterazione 1 (budget 3)

Repo frontend: `C:/Users/lorin/Desktop/Lorenzo/sian-ng/progetti/arsial/arsial-cruscotto/cruscotto-lazio-fe` (React 19, Vite,
React Query, orval, MSW, vitest, kit UI v2 in `src/shared/ui`, ECharts; Feature-Sliced Design). Progetto multi-feature: la
feature `fisico` vive in `plan/fisico/` (uiplan, handover, route-manifest, dossier) e `wireframes/fisico/<flusso>/`; codice in
`src/features/fisico/`, `src/pages/fisico/`. Plugin green-fe: `C:/Users/lorin/Desktop/Lorenzo/sian-ng/marangi-lab/sian-green/plugins/green-fe`
(`skills/step9-review/SKILL.md` §2-§3, `_shared/references/review-checklist.md`, `antagonist-brief.md`, `judge-brief.md`,
`references/uiplan-patterns.md`). Requirements pack 1.3.0: `../cruscotto-lazio-spec/reqpack/`. Contratti: `handover/openapi-fisico.json`
(TX-0018 superfici ammissibili con `ultimiDatiSincronizzati` ed export `superficie-ammissibile/{formato}`; TX-0020 determine) e
`handover/openapi-elenco-operativo.json` (TX-0060, valori dei filtri: decisione G2); catalogo `handover/authz-catalog.json`.

Intensita' FULL (obbligatoria: prima review della feature, feature con authz/scoping). Prima review della feature: si rivede
tutta la feature, non un delta.

## Perimetro
`git diff 96cb36a 06794b5` (resoconto `review/fisico-step2-7.md`): la feature fisico (step2-7) e gli SPOSTAMENTI NEL CODICE
COMUNE fatti per lei, che toccano anche finanziario ed elenco operativo: TX-0060 da `features/elenco-operativo/api` a
`entities/filtri/api`; filtri del programma da lib del finanziario a `entities/filtri/lib/programma`; gruppi del pannello in
`entities/filtri/ui/GruppiProgramma`; codice a barre, scheda della domanda ed etichette del tipo in `entities/domanda`; anni
2000-2100 in `shared/lib/anni`; briciole e TestaPagina in `shared/ui/pagina`; scaricamenti CSV/XLSX in `shared/ui/scarica`;
estensioni del kit (barreRaggruppate in ettari, totali su piu' righe in TabellaInterattiva, nomeAccessibile dei KPI); menu con
voce corrente nei sottopercorsi; `/api/fisico/` nella coda comune delle letture (SC-FS_CAPACITA); Home e menu (`src/app/aree.ts`)
con l'ambito Fisico attivo e le card secondo G1. Verifica che finanziario ed elenco operativo NON regrediscano.

## Scelte approvate dall'utente (NON sono finding; segnala solo se il codice le tradisce)
- Wireframe superfici e determine approvati il 22/10/2026 con le scelte di disegno del dossier `plan/fisico/dossier-wireframe.md`
  (registrate nei gate tra le deviazioni riviste): CSV/XLSX delle card legate a una campagna = campagna della card; campagna di
  riferimento = filtro o la piu' recente; una sola route `/fisico/determine/:codice?`; nessun drill-down superfici->elenco
  (OP-FIS-05); link dalla scheda dell'elenco alle determine rimandato (OP-FIS-08); campagne del pannello con campagna
  nell'indirizzo = quella o tutte.
- Decisioni G1 (card della Home = feature), G2 (filtri da TX-0060), verbale `../cruscotto-lazio-spec/decisioni/MIN-20261022-decisioni-utente-altri-ambiti.md`.
- Assenze (FONTE_NON_ATTIVA, NON_VALORIZZATO) rese come nel kit (`entities/importo`): mai uno 0 o un "no" inventati; la
  quantita' richiesta a premio resta "fonte non attiva" (OP-FIS-04, scelta di ARSIAL).
- Debiti e deviazioni gia' accettati nelle review di finanziario ed elenco (`review/finanziario-review.md`,
  `review/elenco-operativo-review.md`, `review/delta-2026-10-21-review.md`): non riproporli.

## Regole
- SOLA LETTURA: non modificare file del repo; non lanciare npm, build o test (gira un gate). Comandi read-only (grep, git show/diff);
  gli script del gate non declassabile (`check-ui-authz.sh`, `fe-project-check.sh --built --catalog`) sono read-only.
- Ogni finding verificato sul codice (file e riga reali) e azionabile. Niente stile. Severita' della checklist; anti-inflation:
  MAGGIORE solo con un comportamento sbagliato concreto rispetto a pack/wireframe approvati/decisioni, un rischio reale o un test
  che non prova cio' che dichiara.
- Output: array JSON in `review/fisico/v1-iter1/<file della consegna>` con oggetti `{"id","severity","file":"<path>:<riga>",
  "titolo","evidenza","fix"}`. E' l'unico file che puoi scrivere. Alla fine rispondi con un riassunto di poche righe.
