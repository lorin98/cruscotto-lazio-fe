# Review step9 FULL sul delta FE 14/10-21/10/2026 (feature finanziario ed elenco-operativo, passata 1, budget 3)

Come per il backend (scelta dell'utente del 19/10/2026): una sola review FULL sulle modifiche fatte dopo l'ultima review step9
delle due feature (finanziario v4 PASS score 87, elenco-operativo v1 PASS score 89, 13/10), invece di una review per feature.
Deviazione dichiarata dalla procedura green-fe, registrata nel report.

Repo frontend: `C:/Users/lorin/Desktop/Lorenzo/sian-ng/progetti/arsial/arsial-cruscotto/cruscotto-lazio-fe` (React 19, Vite,
React Query, orval, MSW, vitest, kit UI v2 in `src/shared/ui`, ECharts; Feature-Sliced Design). Feature `finanziario` nel layout
legacy alla radice (`uiplan.json`, `route-manifest.json`, `handover.json`, `wireframes/<flusso>/`), feature `elenco-operativo`
in `plan/elenco-operativo/`. Plugin green-fe: `C:/Users/lorin/Desktop/Lorenzo/sian-ng/marangi-lab/sian-green/plugins/green-fe`
(checklist e brief in `_shared/references/`: `review-checklist.md`, `antagonist-brief.md`, `judge-brief.md`; reference
`references/uiplan-patterns.md`). Requirements pack 1.3.0: `../cruscotto-lazio-spec/reqpack/`.

Intensita' FULL (obbligatoria: feature con authz/scoping). Gate step8 rifatto il 21/10 su entrambe (11/11, 991 test).

## Cosa e' cambiato (perimetro: `git diff 88f0069 HEAD -- src tests wireframes uiplan.json plan specs`)
- 19/10: e754863 handover di finanziario; 2767efe verifica SMP: previsione di pagamento si'/no in tabella, grafico della sola
  spesa erogata (D-11 del backend), wireframe sigc aggiornato e riapprovato dall'utente (261c2d7, approvazione registrata anche
  nello uiplan il 21/10); cb79f67 riepilogo per intervento: la vista iniziale e' il grafico (richiesta dell'utente del 19/10).
- 21/10 (backend in regola, contratti nuovi): 8c50643 handover e refresh (riapertura da step2); 5cb6380 codegen; df5a569
  TX-0015: avvisi e azioni attivate ConteggioFinanziario e top-up SiNoFinanziario col motivo (D3, D15 del backend); 521c025
  TX-0012: definizione di pagata (D-09 Rev. 2 del backend); c8e3791 uiplan dell'elenco (spec_pins, campo
  attoConcessioneDisponibile); a9f127d TX-0060: filtro dell'atto di concessione mostrato solo con attoConcessioneDisponibile,
  400 sul campo concessione gestito come gli altri 400 dei filtri (D11 del backend); 9ca4a51 e aee92a0 stati degli step.
  Resoconto: `review/messa-in-regola-step2-7-20261021.md`.

## Scelte gia' approvate (NON sono finding; segnala solo se il codice le tradisce)
- Le decisioni del backend citate (D3, D11, D15, D-09 Rev. 2, D-11) sono approvate dall'utente: testi in
  `../cruscotto-lazio-be/datamodel/finanziario-decisions.json` ed `elenco-operativo-decisions.json`, report
  `../cruscotto-lazio-be/review/delta-2026-10-19-review.md`.
- Vista iniziale = grafico per ogni card, anche nel riepilogo (richiesta dell'utente del 19/10).
- Le assenze (FONTE_NON_ATTIVA, NON_VALORIZZATO) si rendono come gia' fanno gli importi: mai uno 0 o un "no" inventati.
- Deviazioni e debiti gia' accettati nelle review precedenti (`review/finanziario-review.md`,
  `review/elenco-operativo-review.md`): non riproporli.

## Riferimenti
- Contratti: `handover/openapi-finanziario.json`, `handover/openapi-elenco-operativo.json`, `handover/authz-catalog.json`.
- Wireframe approvati: `wireframes/{panoramica,domande,riepilogo,sigc,dotazione-avanzamento}/` e quelli dell'elenco
  (vedi `plan/elenco-operativo/uiplan.json`, `.flows[].wireframe_dir`).

## Regole
- SOLA LETTURA: non modificare file del repo; non lanciare npm, build o test (gira un gate). Comandi read-only (grep, git show/diff).
- Ogni finding verificato sul codice (file e riga reali) e azionabile. Niente stile. Severita' della checklist; anti-inflation:
  MAGGIORE solo con un comportamento sbagliato concreto rispetto a pack/wireframe approvati/decisioni, un rischio reale o un test
  che non prova cio' che dichiara.
- Output: array JSON in `review/delta-2026-10-21/<file della consegna>` con oggetti `{"id","severity","file":"<path>:<riga>",
  "titolo","evidenza","fix"}`. E' l'unico file che puoi scrivere.
- Alla fine rispondi con un riassunto di poche righe (conteggio per severita').
