# Review step9 FULL sul delta delle card della Home — fisico, procedurale, istituzionale (26/10/2026, iterazione 1, budget 3)

Una sola passata di lenti sul delta comune, con un verdetto PER AMBITO: ogni finding dice a quale feature appartiene
(`fisico`, `procedurale`, `istituzionale`, oppure `comune` se tocca il kit, la Home o il finanziario); il Judge assegna i
finding comuni alle feature su cui ricadono e scrive un file di finding per feature.

## Riferimenti
- **Repo frontend:** `C:/Users/lorin/Desktop/Lorenzo/sian-ng/progetti/arsial/arsial-cruscotto/cruscotto-lazio-fe`.
  - Stack: React 19, Vite, React Query, orval, MSW, vitest, kit UI v2 in `src/shared/ui`, ECharts; Feature-Sliced Design.
  - Progetto multi-feature (finanziario, elenco-operativo, fisico, istituzionale, procedurale); artefatti di una feature in
    `plan/<feature>/` (uiplan, handover, route-manifest), wireframe in `wireframes/<feature>/<flusso>/`.
  - La Home e' `src/app/home.tsx` (non e' una route di nessuna feature, fuori dal manifest); il catalogo delle aree e'
    `src/app/aree.ts`.
- **Plugin green-fe:** `C:/Users/lorin/Desktop/Lorenzo/sian-ng/marangi-lab/sian-green/plugins/green-fe`. Da leggere:
  `skills/step9-review/SKILL.md` §2-§3, `_shared/references/review-checklist.md`, `antagonist-brief.md`,
  `judge-brief.md`, `references/uiplan-patterns.md`.
- **Requirements pack 1.3.0:** `../cruscotto-lazio-spec/reqpack/`.
- **Contratti:** `handover/openapi-fisico.json` (TX-0018), `handover/openapi-procedurale.json` (TX-0026, TX-0027),
  `handover/openapi-istituzionale.json` (TX-0016). **Catalogo:** `handover/authz-catalog.json`. **Scenari:**
  `handover/acceptance/<slice>-scenarios.json`.

Intensita' FULL: le tre feature hanno authz e scoping (hide-by-role, P4 con perimetro ADA nel procedurale).

## Cosa e' stato chiesto e approvato (26/10/2026)
Richiesta dell'utente: le card della Home dei tre ambiti nuovi diventano dinamiche come quella del finanziario, con dati
coerenti con quelli dell'ambito. Scelte decise dall'utente (tutte le raccomandazioni), poi wireframe approvati al gate per
flusso (dossier `plan/dossier-card-home.md`, commit 1c8c63b):
- **Fisico** (flusso superfici, `wireframes/fisico/superfici/home.html`, OP-FIS-10): i KPI della pagina Superfici per la
  campagna piu' recente della risposta di TX-0018 senza filtri: superficie ammissibile DS e DP, barra delle domande con DP
  oltre la DS sulle domande di pagamento, domande di pagamento.
- **Procedurale** (flusso panoramica, `wireframes/procedurale/panoramica/home.html`, OP-PR-10): domande ammesse e
  contributo ammesso (TX-0026), barra degli interventi attivati sul perimetro ufficiale, domande di sostegno (totale di
  TX-0027); ogni gruppo col grant della sua transazione; etichette ADA.
- **Istituzionale** (flusso verifica-smp-non-sigc, `wireframes/istituzionale/verifica-smp-non-sigc/home.html`, OP-IS-11):
  totali della verifica SMP non SIGC (TX-0016 senza filtri ne' anno) sommati fra gli interventi: domande finanziate, spesa
  pubblica erogata, barra della spesa sul valore delle domande finanziate, domande ricevute, con l'anno di riferimento; mai
  una somma parziale; nessuna lettura di TX-0017.
- Regole comuni: letture senza filtri (stessa cache della pagina d'ingresso), solo coi grant; senza grant i contenuti
  dell'area come prima; un errore non ferma la Home (una frase, nessun avviso); assenze col motivo, mai uno 0.
- La sezione "Card della Home" del doc di ogni flusso (`superfici.md`, `panoramica.md`, `verifica-smp-non-sigc.md`) e'
  parte del wireframe approvato.

## Perimetro
`git diff d1dfd4b add8b46` (d1dfd4b = FE pushato il 23/10, quattro ambiti chiusi con step9 done). Commit:
- 1c8c63b step1 (wireframe, uiplan, dossier, approvazioni registrate);
- bf40cd8 kit: `src/shared/ui/anteprima/AnteprimaArea.tsx` (pezzi della card presi da `AnteprimaFinanziario`, che ora li
  usa), `intero`, `sommaSeCompleta` ed `etichettaDellArea` in `shared/lib` (le ultime due spostate dal finanziario, che le
  riesporta), `tema.css`;
- 685b97b fisico, 5477e25 procedurale, e161f69 istituzionale: `lib/anteprima.ts`, `ui/Anteprima<Area>.tsx`, barrel,
  costanti di etichette condivise fra pagine e card (`TESTI_KPI` del fisico, `ETICHETTE_KPI` del procedurale), test L1;
- add8b46 Home: `aree.ts`, `tests/anteprime-home.test.tsx` (L2 con axe), `tests/app-aree.test.tsx` aggiornato.

Verifica anche che il finanziario (card della Home rifatta sui pezzi del kit) e le pagine di fisico e procedurale (etichette
dei KPI ora da costanti) NON regrediscano.

## Punti da valutare
Sono finding solo se tradiscono un wireframe approvato, il pack, il contratto o le regole del progetto.
- **Coerenza dei numeri con le pagine**: la card del fisico usa gli stessi conti dei KPI della pagina? quella del
  procedurale gli stessi totali della panoramica? l'istituzionale somma le colonne giuste e rispetta "mai una somma
  parziale"?
- **Grant**: ogni lettura parte solo col grant della sua transazione (verbatim dal catalogo)? Nessuna lettura per chi non
  ha il grant (p3 di altre aree, p4 per fisico e istituzionale, p5 col solo TX-0018)?
- **Cambio di comportamento nella card del finanziario**: con TX-0009 in errore ma un dato vecchio in cache, prima si
  vedeva il numero con la nota "non disponibile", ora "non disponibile" con la nota. Dichiarato, da valutare.
- **Testo del motivo** dei totali dell'istituzionale (`lib/anteprima.ts`: "Non calcolabile: manca per N interventi (...);
  <motivo>") e della quota ("non calcolabile: manca il totale ..."; "nessun valore finanziato").
- **A11y**: lista di definizioni nel gruppo con nome, spiegazione delle sigle in `visually-hidden` nel `dt`, barra
  `aria-hidden` col valore nel testo, nessuna regione live per gli errori (come la card del finanziario).
- **Cache condivisa**: le query della card hanno la stessa chiave di quelle della pagina senza filtri?
- **Test**: provano davvero cio' che dichiarano (letture senza parametri, nessuna lettura senza grant, motivi)?

## Scelte gia' approvate (NON sono finding)
- Le scelte di disegno e i wireframe sopra; la decisione G1 (card della Home = feature, monta lo step6 in `aree.ts`).
- Il separatore delle migliaia it-IT solo da 10.000 (`formatNumber`, convenzione di tutta l'app: "3295", "14.558").
- Debiti e deviazioni gia' accettati nelle review precedenti (`review/*-review.md`): non riproporli.

## Regole
- SOLA LETTURA: non modificare file del repo e non lanciare npm, build o test.
  - Ammessi i comandi read-only (grep, git show/diff/log).
  - Sono read-only anche gli script del gate non declassabile (`check-ui-authz.sh`, `fe-project-check.sh --built --catalog`),
    con `CLAUDE_PLUGIN_ROOT` del plugin green-fe e `C:/Users/lorin/Desktop/Lorenzo/sian-ng/marangi-lab/sian-green/tools/vendor`
    in testa al PATH.
- Ogni finding va verificato sul codice (file e riga reali) e deve essere azionabile. Niente stile.
- Severita' della checklist con anti-inflation: MAGGIORE solo con un comportamento sbagliato concreto rispetto a pack,
  wireframe approvati o decisioni, un rischio reale, o un test che non prova cio' che dichiara.
- Output: array JSON in `review/card-home-2026-10-26/<file della consegna>`, con oggetti
  `{"id","feature","severity","file":"<path>:<riga>","titolo","evidenza","fix"}` (`feature` = fisico | procedurale |
  istituzionale | comune). E' l'unico file che puoi scrivere. Alla fine rispondi con un riassunto di poche righe.
