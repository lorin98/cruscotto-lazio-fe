# Review step9 FULL — feature istituzionale, v1 iterazione 1 (budget 3)

Repo frontend: `C:/Users/lorin/Desktop/Lorenzo/sian-ng/progetti/arsial/arsial-cruscotto/cruscotto-lazio-fe`.
- Stack: React 19, Vite, React Query, orval, MSW, vitest, kit UI v2 in `src/shared/ui`, ECharts; Feature-Sliced Design.
- Progetto multi-feature. La feature `istituzionale` vive in:
  - `plan/istituzionale/` (uiplan, handover, route-manifest, dossier);
  - `wireframes/istituzionale/<flusso>/`, con i flussi verifica-smp-non-sigc, output-regionale e intervento;
  - codice in `src/features/istituzionale/` e `src/pages/istituzionale/`.

Riferimenti:
- Plugin green-fe: `C:/Users/lorin/Desktop/Lorenzo/sian-ng/marangi-lab/sian-green/plugins/green-fe`. Leggi `skills/step9-review/SKILL.md` §2-§3, `_shared/references/review-checklist.md`, `antagonist-brief.md`, `judge-brief.md` e `references/uiplan-patterns.md`.
- Requirements pack 1.3.0: `../cruscotto-lazio-spec/reqpack/`.
- Contratti:
  - `handover/openapi-istituzionale.json`: TX-0016 verifica SMP non SIGC e TX-0017 output regionale, con `ultimiDatiSincronizzati` ed export `<report>/{formato}` csv|xlsx;
  - `handover/openapi-elenco-operativo.json`: TX-0060, i valori dei filtri (decisione G2);
  - catalogo `handover/authz-catalog.json`.

Intensita' FULL, obbligatoria: e' la prima review della feature e la feature ha authz e scoping. Si rivede tutta la feature,
non un delta.

## Perimetro
`git diff e3eb189 b8e9ce3` (resoconto `review/istituzionale-step2-7.md`). Comprende la feature istituzionale (step2-7) e gli
SPOSTAMENTI e le ESTENSIONI NEL CODICE COMUNE fatti per lei, che toccano anche finanziario, fisico ed elenco operativo:
- **Spostamenti:**
  - `PannelloFiltriProgramma` in `entities/filtri/ui`, dal pannello delle superfici del fisico;
  - `vociDelPannello` e `descrizioneIntervento` in `entities/filtri/lib/programma`;
  - `SelettoreAnno` e `useAnnoNellIndirizzo` in `shared/ui`, dal finanziario;
  - `ApriNellElenco` in `entities/domanda/ui`, dal finanziario;
  - `VuotoConFiltri` in `shared/ui/stati`, dal fisico;
  - `messaggioOltreIlLimite` in `shared/ui/scarica`, dal fisico.
- **Estensioni:**
  - `descriviAssenza` con ANNO_NON_CONSERVATO e FONTE_AMBIGUA (OP-IS-08);
  - `BadgeAssenza`;
  - `Interruttore` generico, su cui ora sta anche `InterruttoreVista`;
  - `TestaPagina` con `nota`;
  - `CardGrafico` con `senzaPng` e `oggetto`.
- **App:**
  - ordine fisso degli ambiti in Home e menu (`AMBITI` in `src/app/aree.ts`);
  - Istituzionale fra le aree realizzate;
  - `/api/istituzionale/` nella coda comune delle letture.

Verifica che finanziario, fisico ed elenco operativo NON regrediscano.

## Scelte approvate dall'utente (NON sono finding; segnala solo se il codice le tradisce)
- **Wireframe dei tre flussi**, approvati il 22/10/2026 con le scelte di disegno del dossier `plan/istituzionale/dossier-wireframe.md`, registrate nei gate tra le deviazioni riviste:
  - i quattro link verso l'elenco operativo restano (OP-IS-09);
  - i testi dei motivi nuovi (OP-IS-08);
  - l'output regionale e' una tabella con l'interruttore della misura e il mini grafico nel drawer, senza grafico in pagina (OP-IS-06);
  - il dettaglio dell'intervento e' il terzo flusso.
- **Decisioni G1-G4**, verbale `../cruscotto-lazio-spec/decisioni/MIN-20261022-decisioni-utente-altri-ambiti.md`:
  - G1: la card della Home = feature;
  - G2: i filtri vengono da TX-0060;
  - G4: dalla verifica SMP non SIGC una frase col link a `/finanziario/sigc/verifica-smp`, solo con `csr.tx-0015.read` e senza filtri portati; il finanziario non cambia.
- **Assenze** (FONTE_NON_ATTIVA, NON_VALORIZZATO, ANNO_NON_CONSERVATO, FONTE_AMBIGUA): rese come nel kit (`entities/importo`), mai uno 0 o un "no" inventati.
- **OP-IS-07**: le definizioni da confermare restano note fisse. E' aperto verso green-spec/green-be: non e' un finding.
- **Debiti e deviazioni gia' accettati** nelle review di finanziario, elenco e fisico (`review/finanziario-review.md`, `review/elenco-operativo-review.md`, `review/delta-2026-10-21-review.md`, `review/fisico-review.md`): non riproporli.

## Punti dichiarati dal resoconto, da valutare
Verifica questi punti contro wireframe, uiplan e pack. Sono finding solo se tradiscono un artefatto approvato o il pack.
- La tabella della verifica e' ordinata per codice.
- Le quantita' dell'output regionale hanno l'unita' in ogni cella.
- I chip mostrano il codice dell'intervento.
- I nomi accessibili dei pulsanti di scaricamento seguono il kit.
- Il titolo del drawer e' "Anteprima: <codice>".
- Gli anni proposti dal selettore.
- TX-0016 e TX-0017 si leggono all'apertura della pagina del dettaglio, non della scheda.
- Il test del pannello chiuso con Esc e' risultato instabile.

## Regole
- SOLA LETTURA: non modificare file del repo e non lanciare npm, build o test, perche' gira un gate.
  - Sono ammessi i comandi read-only (grep, git show/diff).
  - Sono read-only anche gli script del gate non declassabile (`check-ui-authz.sh`, `fe-project-check.sh --built --catalog`).
- Ogni finding e' verificato sul codice (file e riga reali) ed e' azionabile. Niente stile.
- Severita' della checklist, con l'anti-inflation: MAGGIORE solo con
  - un comportamento sbagliato concreto rispetto a pack, wireframe approvati o decisioni;
  - un rischio reale;
  - oppure un test che non prova cio' che dichiara.
- Output: array JSON in `review/istituzionale/v1-iter1/<file della consegna>`, con oggetti `{"id","severity","file":"<path>:<riga>","titolo","evidenza","fix"}`. E' l'unico file che puoi scrivere. Alla fine rispondi con un riassunto di poche righe.
