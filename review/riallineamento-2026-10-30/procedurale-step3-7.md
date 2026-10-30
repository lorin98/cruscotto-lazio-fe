# Feature procedurale: step3-7 di green-fe del riallineamento degli ambiti (30/10/2026)

Partenza: `.claude/state/green-fe-procedurale.state.json` a `current_step` 3 (step0, step1 e step2 done; flussi `determine`
e `panoramica` approvati dall'utente il 30/10/2026, `stati`, `ammesse`, `sottofasi`, `riepilogo` col carry-over del
22/10/2026). Lavoro nel worktree `cruscotto-lazio-fe-wt-procedurale`, branch `riallineamento/procedurale-step3-7` partito da
`5baf660` (fine dello step2), in parallelo col fisico (main) e l'istituzionale (altro worktree): la fusione su main e' della
sessione principale. Eseguiti gli step 3-7 seguendo le skill del plugin (`step3-api` ... `step7-test`); gate e
transizioni scritti solo con `state-set.sh` e `state-transition.sh`, ogni gate nello stesso blocco bash del suo
`state-set`. La feature e' a `current_step` 8: **step8-gate e review step9 restano alla sessione principale**. Nessun
push.

## Step e gate

| step | gate registrati | note |
|---|---|---|
| step3-api | api_wrappers_compile, querykey_from_factory | nessun wrapper nuovo (useDetermine e le letture dei report c'erano dallo step2); commenti allineati al contratto: 404 uguale per inesistente e fuori perimetro, perimetro nel DTO |
| step4-lib | lib_pure_compile, lib_zero_react | `badgePerimetro`, `badgeDetermine` col perimetro, `messaggioDomandaNonTrovata`; `perimetro` nel DTO scritto a mano |
| step5-ui | ui_components_compile, ui_a11y_axe | hash dei sei flussi ricalcolati dal disco (`wireframe-hash.sh`) uguali agli `approved_hash`; nel blocco del gate anche il ricalcolo degli hash. Controllo cross-feature della SKILL inerte con `output_dir` "." (difetto noto): verificato a parte, 0 import da altre feature in 59 file di `src/features/procedurale` e `src/pages/procedurale` |
| step6-page | pages_compile, route_manifest_valid | nessuna pagina nuova; `plan/procedurale/route-manifest.json` riproiettato e validato (8 route, 31 azioni); `fe-project-check.sh . --feature procedurale --catalog handover/authz-catalog.json` rc 0, verdict pass |
| step7-test | tests_generated, msw_fail_closed | REQ-must della feature: RF020, RF024..RF029, tutti con describe taggato. Blocco senza pipefail; i due corpora MSW con lo stripper **file per file** (vedi sotto) |

Verifica finale: `npx tsc --noEmit`, `npx eslint . --max-warnings 0` e `npm run lint` verdi; `npx vitest run` 76 file, 1543
test (1533 a `5baf660`, +10), verde due volte di seguito. Wireframe, uiplan, dossier, `handover/`, `specs/`, plugin e
stati delle altre feature non toccati.

**Adattamento del self-check dello step7** (indicato dalla sessione principale): il blocco originale della SKILL da' un
falso `msw_setup_assente` (provato a secco anche qui) perche' lo stripper `_sc`/`_scstr` gira sul flusso concatenato di
tutti i file di `src/` e lo stato "dentro una stringa" passa da un file all'altro. Registrato con il blocco identico salvo
le due righe `MSWSTRIP`/`MSWHARD`, con lo stripper applicato file per file (stessi corpora, stesse regex), come
`gate-step7-perfile.sh` del fisico. Plugin non toccato.

## Commit (in ordine)

`166f1ab` step3; `ba3de97` step4; `74c672d` step5; `4402939` step6; `4d94839` step7; questo resoconto.

## Novita' implementate, per flusso

- **determine** (`/procedurale/determine/:codice?`):
  - badge del perimetro della risposta (campo `perimetro`) come quarto badge della testata, in testo: "Perimetro:
    regionale" o "Perimetro: ADA, domande della tua area" (scelta 2);
  - domanda non trovata (404 NOT_FOUND sul problem-type): "Domanda non trovata: nessuna domanda con il codice a barre N
    fra quelle che puoi consultare." in `alert alert-danger` `role="alert"` come nel wireframe (prima `alert-warning` e
    "Nessuna domanda con il codice a barre N"), lo stesso per inesistente e fuori dal perimetro del P4 (scelta 3): stesso
    testo, stato, focus (h1) e titolo, senza badge, KPI ne' tabella; "Cerca un altro codice" porta il focus al campo del modulo
    (ref del campo da `CercaDomanda`, anche da tastiera);
  - menu: la voce "Determine di una domanda" non prende i criteri dei report conservati passando dal menu
    (`ricercaConservata`): raccomandazione del dossier scelta dall'utente il 30/10/2026, la pagina non ha filtri.
- **panoramica**:
  - card Procedurale della Home (`src/app/aree.ts`, dalla `home.html` approvata): descrizione "Stati e sottofasi delle
    domande di sostegno e di pagamento, domande ammesse con atto di concessione e contributo, riepilogo per intervento e
    determine di una domanda." e contenuti senza grant con "Determine di una domanda" al posto di "Pagamenti per Unit
    Amount"; commento G1 aggiornato; `AnteprimaProcedurale` (numeri, letture, grant) invariata;
  - pannello dei filtri dei report: la nota del wireframe ("valgono per tutte le pagine dei report del procedurale,
    sottofasi comprese; le determine di una domanda si cercano per codice a barre, senza filtri");
  - dettaglio dell'intervento senza la scheda Unit Amount: gia' fatto allo step2, verificato (tre schede, test esistente).
- **stati, ammesse, sottofasi, riepilogo**: nessuna novita' (approvati il 22/10, cambiati solo nel menu dei wireframe, che
  non e' normativo).
- **Codice morto tolto** (Unit Amount uscite allo step2): forma `senzaStato` dei criteri, pill "Il filtro per stato area
  programmazione non si applica alle Unit Amount" (`STATO_NON_APPLICATO`), perimetro `programma` di `pillPerimetro`,
  `nessunFiltro` (ora `nessuno={{}}` come nelle altre feature), parametro `conLoStato` di `criteriNellaBarra` e
  `testiCriteri`, tipo `Contenuta` del controllo statico (il DTO delle determine ha ora le stesse chiavi di
  `DetermineDomanda`); commenti che citavano quelle forme.

## File condivisi toccati

| file | dove | cosa |
|---|---|---|
| `src/app/aree.ts` | interfaccia `PaginaArea`, dopo `conSottopercorsi` | campo facoltativo `senzaRicercaConservata` (2 righe) |
| `src/app/aree.ts` | card `procedurale` di `AREE` | commento G1, `descrizione`, `contenuti` |
| `src/app/menu.tsx` | commento di testa (righe 3-4 e 8) e `NavLink` di `GruppoArea` | la voce con `senzaRicercaConservata` non prende la query; percorso d'esempio `/procedurale/determine/<codice>` (era `/fisico/...`) |
| `tests/app-aree.test.tsx` | `it('card della Home dal contenuto reale ...')`, righe del procedurale | contenuti nuovi e descrizione |
| `tests/app-aree.test.tsx` | dopo `it('la voce "Determine di una domanda" ...')` | due `it` nuovi (menu delle determine senza criteri e senza grant; card col solo csr.tx-0020.read) |

Non toccati: `src/app/route-table.json` (le voci del procedurale erano gia' giuste dallo step2), `src/app/routes.tsx`, le
voci delle altre aree, `route-manifest.json` della radice.

## Test

- `tests/procedurale-lib.test.ts`: badge col perimetro (regionale, ADA), `badgePerimetro`, `messaggioDomandaNonTrovata`
  (non nomina il perimetro); tolti i casi del codice morto.
- `tests/procedurale-ui.test.tsx`: perimetro ADA nella testata e 404 con focus al campo (L2 e axe), nota del pannello.
- `src/pages/procedurale/determine/page.test.tsx` (16): P4 col perimetro ADA e la scheda; 404 fuori perimetro e
  inesistente indistinguibili; "Cerca un altro codice" da tastiera; 403 non e' il messaggio della domanda non trovata;
  axe sugli stati nuovi.
- `tests/app-aree.test.tsx`: link del menu verso le determine visibile col grant e assente senza, senza i criteri dei
  report; card col solo csr.tx-0020.read (contenuti, nessuna lettura, ingresso alle determine).

## Scelte prese in autonomia

1. Criteri non portati alle determine con un campo facoltativo della voce di menu (`senzaRicercaConservata` in
   `PaginaArea` e in `lib/pagine.ts`, condizione nel `NavLink`) invece di farli arrivare e ignorarli: e' l'unico modo
   senza cambiare la firma di `ricercaConservata`, che non conosce la destinazione; le altre aree non lo usano.
2. "Cerca un altro codice" porta il focus col ref del campo (e `preventDefault`), senza contare sulla navigazione al
   frammento del browser; l'`href="#codice-domanda"` resta.
3. Nota del pannello: la frase del wireframe seguita da "Voci da TX-0024 e TX-0025 (dati di programma, regionali)." come
   prima; "Voci dello stesso filtro in alternativa (O); filtri diversi insieme (E)" la dice gia' il gruppo del kit.
4. Il profilo P4 dei test ha csr.tx-0020.read e csr.tx-0058.read (catalogo rev. 4: TX-0058 sullo stesso perimetro ADA).

## Contraddizioni e scostamenti

- Nessuna contraddizione fra wireframe, uiplan e dossier sulle novita'. Il menu dei wireframe `stati`, `ammesse`,
  `sottofasi` e `riepilogo` mostra ancora "Unit Amount" (carry-over del 22/10): vale la decisione dell'utente riportata
  nel dossier (la shell dei wireframe non e' normativa), il menu vero segue uiplan e dossier.
- "Cosa dovra' cambiare allo step6" del dossier (route, pagina, menu, uscita delle Unit Amount) era gia' fatto dallo step2;
  qui restavano card, criteri del menu, route-manifest e codice morto.
- Stato "errore" del wireframe delle determine: mostra "Cerca un altro codice" anche per 403/429/503. Il codice tiene
  l'avviso della pagina con Riprova, come la pagina del fisico approvata e rivista prima (stato non cambiato dal
  riallineamento): da guardare in review se serve il link anche li'.

## Punti aperti

1. **Gate e review**: step8 e step9 del procedurale alla sessione principale, dopo la fusione con fisico e
   istituzionale (conflitti attesi solo in `src/app/aree.ts` e `tests/app-aree.test.tsx`, righe vicine alle card).
2. **Test a tempo sotto carico**: in due delle sei esecuzioni della suite intera e' caduto un test di `tests/shell.test.tsx`
   (menu su schermo piccolo; filtri dell'elenco nei link del finanziario) per il timeout di 1 s di `findBy`/`waitFor`,
   con altri due agenti che facevano girare le loro suite; da solo `shell.test.tsx` e' verde 7 volte su 7 e la suite
   intera e' verde due volte di seguito. Non toccano codice di questa feature.
3. **Self-check dello step7 e controllo cross-feature dello step5** del plugin: i due difetti noti restano (falso
   `msw_setup_assente` sul flusso concatenato; controllo cross-feature inerte con `output_dir` "."), da correggere nel
   plugin.
4. **Restano nello uiplan** OP-PR-06 (profili misti: per TX-0020 la pagina mostra il perimetro della risposta),
   OP-PR-08, OP-PR-14 (link dalla scheda della domanda dell'elenco verso le determine: feature elenco-operativo).
