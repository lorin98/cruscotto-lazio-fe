# Feature finanziario: step3-7 di green-fe del 30/10/2026 (riallineamento degli ambiti)

Partenza: `.claude/state/green-fe-finanziario.state.json` a `current_step` 3, HEAD `1ac2134` (step3-7 del fisico e
dell'elenco operativo gia' fatti; lo step2 aveva gia' tolto dal finanziario la verifica SMP SIGC, commit `e43aeb9`).
Fonti, in quest'ordine: i cinque flussi approvati alla radice di `wireframes/` (panoramica, riepilogo,
dotazione-avanzamento e domande col carry-over; sigc approvato il 30/10/2026 senza la pagina della verifica) e
`uiplan.json` della radice; il dossier `plan/dossier-wireframe-finanziario.md` (scelte S-1 (a) e S-2 (a) dell'utente,
"Cosa dovra' cambiare allo step6"); il resoconto dello step2. Eseguiti gli step 3-7 seguendo le skill del plugin
(`step3-api` ... `step7-test`); gate e transizioni scritti solo con `state-set.sh` e `state-transition.sh`, ogni gate
nello stesso blocco bash del suo `state-set`. La feature e' a `current_step` 8: **step8-gate e review step9 restano alla
sessione principale**. Commit su `main`, nessun push; app spenta, nessun BE o FE avviato. Lavoro in parallelo ai worktree
dell'istituzionale e del procedurale: nessun file loro toccato, nessun `git stash`.

## Step e gate

| step | gate registrati | note |
|---|---|---|
| step3-api | api_wrappers_compile, querykey_from_factory | nessun wrapper nuovo ne' da togliere: `api/index.ts` copre TX-0001..TX-0014 col client rigenerato allo step2. Gate registrato senza codice nuovo da generare |
| step4-lib | lib_pure_compile, lib_zero_react | nessuna funzione nuova; verificato che `lib/` non ha piu' nulla della verifica; commento comune di `entities/filtri/lib/programma.ts` |
| step5-ui | ui_components_compile, ui_a11y_axe | hash dei cinque flussi ricalcolati dal disco con `wireframe-hash.sh`: uguali agli `approved_hash` dello stato (panoramica `62847ef9...`, riepilogo `8d3e3739...`, dotazione-avanzamento `ead55922...`, domande `67bb6e94...`, sigc `8189d3aa...`). Nessun componente nuovo. Cross-feature verificato a parte (punto aperto 2) |
| step6-page | pages_compile, route_manifest_valid | nessuna pagina nuova; card della Home in `aree.ts`; `route-manifest.json` della RADICE riproiettato (8 route, pack 1.4.0, spec pin `f540db81...`, senza `/finanziario/sigc/verifica-smp`) e validato con jv; `fe-project-check.sh . --feature finanziario --catalog handover/authz-catalog.json` rc 0 (verdict pass) |
| step7-test | tests_generated, msw_fail_closed | REQ-must della feature: RF001..RF014 (RF015 e' dell'istituzionale), tutti con describe taggato. Il blocco della SKILL com'e' da' `msw_setup_assente` (falso negativo del plugin, punto aperto 1): registrato col blocco adattato del fisico |

Verifica finale: `npx tsc --noEmit`, `npm run lint` e `npx eslint . --max-warnings 0` verdi; `npx vitest run` verde due volte
di seguito (78 file, 1590 test; 1588 dopo l'elenco operativo). Wireframe, uiplan, dossier, `handover/`, `specs/`,
backend, plugin e stati delle altre feature non toccati (`git diff 46c9d69 -- .claude/state` tocca solo elenco operativo
e finanziario).

## Commit (in ordine)

`079237a` step3; `97ee227` codice comune (commento di entities/filtri); `1ff5021` step4; `83af935` step5; `6c82ea0` card
Finanziario della Home (aree.ts e test del catalogo); `76d0c5e` README (export del finanziario); `940f521` step6;
`009983b` step7; questo resoconto.

## Novita' implementate, per flusso

**sigc** (unico flusso cambiato: tolta la pagina della verifica SMP, OP-FE-10): le due pagine rimaste (`/finanziario/sigc`
e `/finanziario/sigc/riserva`) sono quelle approvate; nessun link verso altri ambiti (scelta S-1 (a)). Test nuovo: anche
con csr.tx-0015.read i link della pagina SIGC fuori dal finanziario portano solo all'elenco operativo e la verifica non e'
citata; la vecchia route `/finanziario/sigc/verifica-smp` apre "Pagina non trovata" e resta su quell'indirizzo (nessun
alias, A-4).

**panoramica, riepilogo, dotazione-avanzamento, domande**: invariati (carry-over). La voce "Verifica SMP" che resta nel menu
dei loro low-fi e' la shell del 13/10, non normativa (scelta S-2 (a)): il menu vero e' di sette voci (Panoramica, Riepilogo
per intervento, Dotazione e spesa, Avanzamento, Domande e importi, SIGC, Riserva di efficacia), gia' dallo step2.

**Home** (`src/app/aree.ts`, voce finanziario): `contenuti` 'SIGC, riserva di efficacia e verifica SMP' diventa 'SIGC e
riserva di efficacia', con un commento; descrizione, `AnteprimaFinanziario` e ricerca conservata invariate.

**Cosa resta della verifica SMP nel finanziario** (verificato su codice, test, fixture, mock e `entities/filtri`): nessun
codice. Restano solo commenti che dicono che TX-0015 e' dell'istituzionale (`lib/filtri.ts`, `lib/grafici/sigc.ts`,
`testing/fixture.ts`, `entities/filtri/lib/programma.ts`) e test che provano che non c'e' (menu di sette voci, nessuna voce
per `/finanziario/sigc/verifica-smp`, nessuna route nella route-table, `esercizio` non e' piu' un parametro di pagina).

## Scelte prese in autonomia

1. **Parametro `tipo: 'riserva'`** di `anniSelezionabili` e di `ui/SelettoreAnno`: resta. Prima distingueva riserva ed
   esercizio della verifica; ora ha un solo valore. Toglierlo obbliga a cambiare `tests/kit-comune-istituzionale.test.tsx`
   (passa `tipo="riserva"`), un test comune su cui lavora il worktree dell'istituzionale: rimandato (punto aperto 4).
2. **Commento comune di `entities/filtri/lib/programma.ts`**: i cinque filtri sono dei report del finanziario
   (TX-0002..TX-0014) e delle superfici del fisico; la verifica SMP SIGC li usa dall'istituzionale. Solo il commento.
3. **README**: corretta solo la sezione dell'export del finanziario (TX-0002..TX-0014, niente `esportaVerificaSmp`). La
   frase generale sui test della suite ("RF001-RF015") resta: RF015 e' ancora provato, nell'istituzionale.
4. **Test del "nessun alias"** in `tests/finanziario-pagine.test.tsx` e non accanto alla pagina SIGC: serve `appRoutes`
   (layer app), che le pagine non importano.
5. Nella card della Home un commento sopra `contenuti` (perche' la verifica non c'e' piu'), nello stile delle voci vicine.

## Contraddizioni fra le fonti

Nessuna. L'unica differenza nota e' voluta: la voce "Verifica SMP" nel menu dei low-fi dei quattro flussi invariati, che
il dossier (S-2 a) e `sigc.md` (OP-FE-10) dichiarano non normativa; vale il menu del codice, di sette voci.

## Punti aperti

1. **Difetto del plugin nel self-check di step7** (lo stesso del fisico e dell'elenco operativo, plugin non toccato):
   `msw_setup_assente` e' un falso negativo (stripper sul flusso concatenato di tutti i file di `src/`). Registrato con
   `ambiente-prova/strumenti-sessione-317ae849/gate-fe-step5-7/gate-step7-perfile.sh` (cambiano solo le righe
   MSWSTRIP/MSWHARD, stripper file per file; stessi corpora e regex; pipefail non attivo), argomento `finanziario`.
2. **Controllo cross-feature di step5 con `output_dir` = "."**: non scatta (difetto del plugin). Verificato a parte
   risolvendo ogni import relativo: la feature importa solo da `shared/`, `entities/` e dai suoi file.
3. **Step8 e step9** del finanziario alla sessione principale. File condivisi toccati: `src/app/aree.ts` (solo la voce
   finanziario: `contenuti` e una riga di commento), `tests/app-aree.test.tsx` (tre righe nel test "profilo col solo
   riepilogo", card Finanziario), `src/entities/filtri/lib/programma.ts` (righe 3-6 del commento di testa), `README.md`
   (sezione "Export dal backend"). Non toccati `src/app/route-table.json` e `src/app/routes.tsx` (gia' senza la verifica
   dallo step2).
4. **Pulizia rimandata**: il parametro `tipo` a un solo valore di `anniSelezionabili`/`SelettoreAnno` (scelta 1), da togliere
   dopo la fusione insieme a `tests/kit-comune-istituzionale.test.tsx`.
5. Le pagine non sono state provate nel browser (app spenta).
