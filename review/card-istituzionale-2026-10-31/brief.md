# Review step9 FULL sul delta della card Istituzionale della Home — tabella a confronto (31/10/2026, iterazione 1, budget 3)

Una sola passata di lenti sul delta, con un verdetto per l'istituzionale e uno per il kit comune: ogni finding dice a
quale feature appartiene (`istituzionale`, oppure `comune` se tocca il kit `src/shared/ui`, `tema.css` o le card delle
altre aree); il Judge assegna i finding comuni alle feature su cui ricadono.

## Riferimenti
- **Repo frontend:** `C:/Users/lorin/Desktop/Lorenzo/sian-ng/progetti/arsial/arsial-cruscotto/cruscotto-lazio-fe`.
  - Stack: React 19, Vite, React Query, orval, MSW, vitest, kit UI v2 in `src/shared/ui`; Feature-Sliced Design.
  - Progetto multi-feature (finanziario, elenco-operativo, fisico, istituzionale, procedurale); artefatti di una feature in
    `plan/<feature>/` (uiplan, handover, route-manifest), wireframe in `wireframes/<feature>/<flusso>/`.
  - La Home e' `src/app/home.tsx` (non e' una route, fuori dal manifest); il catalogo delle aree e' `src/app/aree.ts`, che
    monta `AnteprimaIstituzionale` come card dell'area (decisione G1).
- **Plugin green-fe:** `C:/Users/lorin/Desktop/Lorenzo/sian-ng/marangi-lab/sian-green/plugins/green-fe`. Da leggere:
  `skills/step9-review/SKILL.md` §2-§3, `_shared/references/review-checklist.md`, `antagonist-brief.md`,
  `judge-brief.md`, `references/uiplan-patterns.md`.
- **Requirements pack 1.4.0:** `../cruscotto-lazio-spec/reqpack/`.
- **Contratto:** `handover/openapi-istituzionale.json` (TX-0016 verifica SMP non SIGC, TX-0015 verifica SMP SIGC).
  **Catalogo:** `handover/authz-catalog.json`. **Scenari:** `handover/acceptance/istituzionale-scenarios.json`.
- Review precedenti della stessa card: `review/card-home-2026-10-26/` (brief, judge con le decisioni D1-D4 dell'utente) e
  `review/riallineamento-2026-10-30-review.md` (rework 1, blocco SIGC).

Intensita' FULL obbligatoria: l'istituzionale ha route con RequireGrant (`review-intensity-fe.sh`).

## Cosa e' stato chiesto e approvato (31/10/2026)
Richiesta dell'utente dall'app accesa: la card Istituzionale era molto piu' alta delle altre tre (due blocchi in colonna,
8 numeri contro 3-4). Fra tabella a confronto, due colonne affiancate e interruttore Non SIGC / SIGC l'utente ha scelto la
tabella. Wireframe aggiornato e riapprovato al gate del flusso verifica-smp-non-sigc (2026-10-31T07:56:49Z, tta 88 s,
rework 2; commit 5938404):
- `wireframes/istituzionale/verifica-smp-non-sigc/home.html` e la sezione "Card della Home" > "Tabella a confronto" di
  `verifica-smp-non-sigc.md` (parte del wireframe approvato); `plan/istituzionale/dossier-wireframe.md` (rework 2);
  `plan/istituzionale/uiplan.json` (nota WCAG della card, OP-IS-11).
- Tabella in un gruppo con nome "L'istituzionale in cifre": righe Domande ricevute, Domande finanziate, Domande pagate,
  Spesa pubblica erogata; colonne "Non SIGC (cumulativi)" (TX-0016 senza filtri ne' anno, csr.tx-0016.read) e "SIGC
  (esercizio aaaa)" (TX-0015 senza filtri con l'ultimo esercizio chiuso, csr.tx-0015.read). Stessi totali di prima
  (`anteprimaVerifica`, `anteprimaVerificaSigc` invariati).
- "Domande pagate" solo SIGC: trattino nella colonna non SIGC con "dato non previsto nella verifica non SIGC" per i
  lettori di schermo; senza il grant SIGC la riga non c'e'. Con un solo grant la sola sua colonna.
- Colonne indipendenti: scheletro nelle celle e un solo `role="status"`; errore: celle "non disponibile" e la frase di
  prima sotto la tabella; motivi delle celle mancanti sotto la tabella con riga e colonna.
- Sotto la tabella la barra "Spesa non SIGC sul valore finanziato" (stessa quota di prima) e la nota "Non SIGC: ultimo
  file SMP aaaa. SIGC: dal 16/10/aaaa-1 al 15/10/aaaa, domande dell'anno aaaa-1." (senza file "Non SIGC: nessun file
  SMP."), che sostituisce i due riferimenti di prima e conserva cio' che diceva D3 del 26/10.
- Perimetro ADA: l'intestazione di colonna dice "della tua area".

## Perimetro
`git diff dbdd81c a382562` (dbdd81c = FE pushato il 30/10, cinque feature con step9 done). Commit:
- 5938404 step1 (wireframe, doc del flusso, uiplan, dossier, approvazione nello stato e nello uiplan);
- 9621d56 kit: `ConfrontoArea` in `src/shared/ui/anteprima/AnteprimaArea.tsx` (+ export in `src/shared/ui/index.ts`),
  stili in `src/shared/ui/tema.css` (tabella, container query sotto 15,5rem, interlinea 1,4 di `.ui-ambito__nota` dentro
  le anteprime e di `.ui-ambito__avanzamento p` in tutte le card), test in `tests/kit-comune.test.tsx`;
- a753678 istituzionale: `src/features/istituzionale/lib/anteprima.ts` (righe, celle, intestazioni, nota; tolte le
  etichette e i riferimenti dei due blocchi), `src/features/istituzionale/ui/AnteprimaIstituzionale.tsx`, test in
  `tests/istituzionale-lib.test.ts`, `tests/anteprime-home.test.tsx`, `tests/app-aree.test.tsx`;
- a382562 istituzionale: una rilettura fallita vince sul dato in cache (come la card di prima e quella del finanziario).

Verifica anche che le card di finanziario, fisico e procedurale NON regrediscano per l'interlinea del kit.

## Punti da valutare
Sono finding solo se tradiscono il wireframe approvato, il pack, il contratto o le regole del progetto.
- **Fedelta' al wireframe**: righe, colonne, trattino, barra, nota, stati (attesa, errore, assenze, nessun file, ADA,
  un solo grant) come in `home.html` e nella sezione "Tabella a confronto".
- **Grant e letture**: le due query passano da `useVerificaSmpNonSigc`/`useVerificaSmpSigc` con `abilitato` = grant. Senza
  il grant nessuna richiesta (prima gli hook stavano in figli montati solo col grant: e' un cambio di meccanismo). Stessa
  chiave di cache della pagina senza filtri (D2)?
- **A11y**: tabella con `caption` nascosta, `th scope=col/row`, cella vuota d'angolo come `td`, trattino `aria-hidden` col
  testo in `visually-hidden`, numero animato, `role="status"` solo durante l'attesa, nessuna regione live per gli errori.
  Nome accessibile delle intestazioni ("SIGC (esercizio 2026)").
- **Testi**: motivi "Spesa pubblica erogata, Non SIGC: ..." e la nota; coerenza coi testi della pagina.
- **CSS**: container query, `white-space: nowrap` dei valori, resa a 4 card per riga a circa 1440 px (le foto della Home
  vera a 1680/1440/1100/390 px le ha guardate l'utente); interlinea comune.
- **Test**: provano davvero cio' che dichiarano (nessuna lettura senza grant, cella per riga e colonna, attesa, errore con
  cache)?

## Scelte gia' approvate (NON sono finding)
- La tabella e i testi del wireframe sopra; la decisione G1; le decisioni D1-D4 del 26/10 (D3 riformulata dalla nota,
  approvata col wireframe); il blocco SIGC sull'ultimo esercizio chiuso (rework 1).
- Il separatore delle migliaia it-IT solo da 10.000 (`formatNumber`, convenzione di tutta l'app: "3150", "20.098").
- Debiti e deviazioni gia' accettati nelle review precedenti (`review/*-review.md`, `review/card-home-2026-10-26/`):
  non riproporli.

## Regole
- SOLA LETTURA: non modificare file del repo e non lanciare npm, build o test (gira lo step8 in parallelo).
  - Ammessi i comandi read-only (grep, git show/diff/log).
  - Sono read-only anche gli script del gate non declassabile (`check-ui-authz.sh`, `fe-project-check.sh --built --catalog`),
    con `CLAUDE_PLUGIN_ROOT` del plugin green-fe e `C:/Users/lorin/Desktop/Lorenzo/sian-ng/marangi-lab/sian-green/tools/vendor`
    in testa al PATH.
- Ogni finding va verificato sul codice (file e riga reali) e deve essere azionabile. Niente stile.
- Severita' della checklist con anti-inflation: MAGGIORE solo con un comportamento sbagliato concreto rispetto a pack,
  wireframe approvati o decisioni, un rischio reale, o un test che non prova cio' che dichiara.
- Output: array JSON in `review/card-istituzionale-2026-10-31/<file della consegna>`, con oggetti
  `{"id","feature","severity","file":"<path>:<riga>","titolo","evidenza","fix"}` (`feature` = istituzionale | comune).
  E' l'unico file che puoi scrivere. Alla fine rispondi con un riassunto di poche righe.
