# Review step9 sul delta delle revisioni del finanziario — tre passate (01/11/2026)

Review sul delta `64ada98..adec6c9` (revisioni R01-R22 del 31/10/2026 nelle cinque feature, wireframe approvati il 01/11),
una sola review con verdetto per feature (scelta dell'utente del 19/10/2026; deviazione dichiarata dalla procedura green-fe).
Tutto in `review/revisioni-2026-10-31/review/`.

| passata | tipo | esito | correzioni |
|---|---|---|---|
| 1 | FULL: lenti V1, V2, H, A, antagonista, Judge (`brief-comune.md`, `judge-passata1.md`) | FAIL: 12 MAGGIORE, 31 MINORE, 6 COSMETICO; 2 contestati | 840ae50..df61c8d |
| 2 | FULL, stesse lenti (`brief-passata2.md`, `judge-passata2.md`) | FAIL: 2 MAGGIORE (K-01, K-02), 22 MINORE, 6 COSMETICO | 5e6c102..adec6c9 |
| 3 | MIRATA per scelta dell'utente: un revisore sulle correzioni della passata 2 (`brief-passata3.md`, `judge-passata3.md`) | PASS: 0 MAGGIORE, 5 MINORE, 5 COSMETICO | dopo la registrazione |

Gate non declassabili (`check-ui-authz.sh`, `fe-project-check.sh --built --catalog`): PASS su tutte e cinque le feature.

## Verdetto finale (review-score.sh FULL sui file `<feature>-findings-passata3.json`)

| feature | CRITICO | MAGGIORE | MINORE | COSMETICO | score | verdetto |
|---|---|---|---|---|---|---|
| finanziario | 0 | 0 | 1 | 3 | 94 | PASS |
| elenco-operativo | 0 | 0 | 0 | 2 | 98 | PASS |
| fisico | 0 | 0 | 5 | 1 | 84 | PASS |
| istituzionale | 0 | 0 | 3 | 2 | 89 | PASS |
| procedurale | 0 | 0 | 4 | 2 | 86 | PASS |

Step9 registrato done per le cinque feature. Nessun declassamento da cui dipenda un PASS.

## Scelte prese durante le correzioni (dette all'utente)
- Corpo delle card non pertinenti leggibile e non attivabile, senza `inert` (lo scostamento 3 della passata 1 e' ritirato).
- Link della spesa erogata dell'istituzionale: l'URL del wireframe (sigc=false) solo per gli interventi classificati NO SIGC
  (OP-IS-09); link SIGC del dettaglio del finanziario solo per gli interventi SIGC (OP-FE-11).
- "Dotazione e pagamenti per intervento" in barre orizzontali; le barre verticali restano con lo zoom oltre 12.
- Procedurale: i link di programma verso l'elenco portano sigc come la lettura della card (OP-PR-08).

## Residui (finding della passata 3), da correggere prima dello step8
M-01..M-05 (MINORE) e M-06..M-10 (COSMETICO), vedi `judge-passata3.md`.
