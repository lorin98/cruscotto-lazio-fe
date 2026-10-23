# Review step9 FULL — feature procedurale, v1 iterazione 1 (budget 3)

## Riferimenti
- **Repo frontend:** `C:/Users/lorin/Desktop/Lorenzo/sian-ng/progetti/arsial/arsial-cruscotto/cruscotto-lazio-fe`.
  - Stack: React 19, Vite, React Query, orval, MSW, vitest, kit UI v2 in `src/shared/ui`, ECharts; Feature-Sliced Design.
  - Progetto multi-feature. La feature `procedurale` vive in `plan/procedurale/` (uiplan, handover, route-manifest,
    dossier) e in `wireframes/procedurale/<flusso>/`.
  - Flussi: panoramica, stati, ammesse, sottofasi, unit-amount, riepilogo; 8 route.
  - Codice in `src/features/procedurale/` e `src/pages/procedurale/`.
- **Plugin green-fe:** `C:/Users/lorin/Desktop/Lorenzo/sian-ng/marangi-lab/sian-green/plugins/green-fe`. Da leggere:
  `skills/step9-review/SKILL.md` §2-§3, `_shared/references/review-checklist.md`, `antagonist-brief.md`,
  `judge-brief.md`, `references/uiplan-patterns.md`.
- **Requirements pack 1.3.0:** `../cruscotto-lazio-spec/reqpack/`.
- **Contratto:** `handover/openapi-procedurale.json`.
  - Valori dei filtri: TX-0024 (con `ultimiDatiSincronizzati`) e TX-0025.
  - Report: TX-0026..TX-0032.
  - Export: `<report>/{formato}` csv|xlsx; `riepilogo/csv` invariato.
- **Scenari:** `handover/acceptance/procedurale-scenarios.json`. **Catalogo:** `handover/authz-catalog.json`.
- I valori dei filtri del procedurale vengono dalla sua slice: G2 (TX-0060) NON lo riguarda.

Intensita' FULL, obbligatoria: e' la prima review della feature e la feature ha authz e scoping (P4 con perimetro ADA).
Si rivede tutta la feature, non un delta.

## Perimetro
`git diff 09a2595 099f8da`, resoconto `review/procedurale-step2-7.md`. Comprende la feature procedurale (step2-7) e gli
SPOSTAMENTI e le ESTENSIONI NEL CODICE COMUNE fatti per lei, che toccano anche le altre feature.
- Spostamenti:
  - `codiceDelPercorso` in `entities/filtri`;
  - `testoPerimetro` col perimetro ADA in `shared/lib`, una resa sola con l'elenco operativo;
  - `assenzaInFrase` e `testoMotivato` in `entities/importo`;
  - `statoDelDettaglio`, `tutteRisposte`, `rigaDellIntervento` e `useStatoDelDettaglio` nel kit, dall'istituzionale;
  - il pannello senza l'azione portante e `ValoriFiltriNonDisponibili` con piu' letture in `entities/filtri`;
  - `PaginaConFiltri` nel kit, dalla `PaginaReport` dell'istituzionale.
- Estensioni:
  - barre raggruppate orizzontali e `MISURA_NUMERI`/`MISURA_PERCENTUALI`;
  - `TabellaInterattiva` con `gruppo`, `nomeEsteso` e `intestazioneRiga`;
  - `clicSulCodice` nel grafico finto dei test.
- App:
  - Procedurale fra le aree realizzate, con `AREE_FUTURE` ora vuota;
  - `/api/procedurale/` nella coda comune delle letture.

Verifica che finanziario, elenco operativo, fisico e istituzionale NON regrediscano.

## Scelte approvate dall'utente (NON sono finding; segnala solo se il codice le tradisce)
- **Wireframe dei sei flussi**, approvati il 22/10/2026 con le scelte di disegno del dossier
  `plan/procedurale/dossier-wireframe.md`, registrate nei gate tra le deviazioni riviste:
  - il dettaglio procedurale dell'intervento;
  - due pagine per gli stati;
  - la card per stato area programmazione da TX-0029;
  - il clic sulla barra filtra la tabella, con "Apri nell'elenco (n rilasciate)";
  - "non disponibile" per il "di cui non rilasciate" senza fonte;
  - la scheda Sottofasi nel dettaglio;
  - CSV e XLSX sono l'export del report intero;
  - la nota unica di Unit Amount senza pagato.
- **Decisione G1** (card della Home = feature), dal verbale
  `../cruscotto-lazio-spec/decisioni/MIN-20261022-decisioni-utente-altri-ambiti.md`.
- **Assenze:** rese come nel kit (`entities/importo`), mai uno 0 o un "no" inventati.
- **Open point informativi dello uiplan:** OP-PR-06, OP-PR-07, OP-PR-08, OP-PR-09.
- **Debiti e deviazioni gia' accettati** nelle review di finanziario, elenco, fisico e istituzionale (`review/*-review.md`):
  non riproporli.

## Punti dichiarati dal resoconto, da valutare
Sono finding solo se tradiscono un artefatto approvato o il pack.
- **Pagine senza letture dei report.** La `visibility` comprende TX-0024 e TX-0025, quindi un profilo coi soli valori dei
  filtri vedrebbe pagine senza sezioni. Nel catalogo nessun profilo ha TX-0024/TX-0025 senza i sette report (p1, p2,
  p3-pro e p4 li hanno tutti): valuta il rischio reale con questo dato.
- **`AREE_FUTURE` vuota**, col meccanismo "presto" ancora presente.
- **Rese del punto 5 del resoconto:**
  - i nomi accessibili dei link con le non rilasciate;
  - i PNG delle schede senza "di <codice>";
  - le voci fuori catalogo e gli stati osservati;
  - le intestazioni brevi delle colonne degli stati;
  - il clic sulla barra solo del mouse, con la tabella equivalente da tastiera;
  - la tabella equivalente delle Unit Amount col motivo in ogni cella;
  - i file scaricati da card e tabella.
- **Letture del dettaglio:** TX-0026, TX-0027 e TX-0028 partono all'apertura della pagina, le schede Area, Sottofasi e
  Unit Amount quando si aprono. Il resoconto dichiara due correzioni fatte allo step7 (b2da5c5).
- **Dev server con le letture di prova** di `api/mock`.

## Regole
- SOLA LETTURA: non modificare file del repo e non lanciare npm, build o test, perche' gira un gate.
  - Ammessi i comandi read-only (grep, git show/diff).
  - Sono read-only anche gli script del gate non declassabile (`check-ui-authz.sh`, `fe-project-check.sh --built --catalog`).
- Ogni finding va verificato sul codice (file e riga reali) e deve essere azionabile. Niente stile.
- Severita' della checklist con anti-inflation: MAGGIORE solo con
  - un comportamento sbagliato concreto rispetto a pack, wireframe approvati o decisioni;
  - un rischio reale;
  - un test che non prova cio' che dichiara.
- Output: array JSON in `review/procedurale/v1-iter1/<file della consegna>`, con oggetti `{"id","severity","file":"<path>:<riga>","titolo","evidenza","fix"}`.
  E' l'unico file che puoi scrivere. Alla fine rispondi con un riassunto di poche righe.
