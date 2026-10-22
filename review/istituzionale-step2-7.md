# Feature istituzionale: step2-7 di green-fe del 22/10/2026

Partenza: `.claude/state/green-fe-istituzionale.state.json` a `current_step` 2 (step0 e step1 done, flussi
`verifica-smp-non-sigc`, `output-regionale` e `intervento` approvati dall'utente il 22/10/2026 con le scelte di disegno
registrate fra le deviazioni riviste dei gate: link verso l'elenco tenuti, OP-IS-09; testi dei motivi, OP-IS-08;
interruttore della misura, OP-IS-06; dettaglio come terzo flusso). Eseguiti gli step 2-7 seguendo le skill del plugin
(`step2-codegen` ... `step7-test`); gate e transizioni scritti solo con `state-set.sh` e `state-transition.sh`, ogni gate
nello stesso blocco bash del suo `state-set`. La feature e' a `current_step` 8: **step8-gate e review step9 restano alla
sessione principale**. Nessun push.

## Step e gate

| step | gate registrati | note |
|---|---|---|
| step2-codegen | codegen_compiles, orval_types, csrf_static | scaffold gia' presente (template non ricopiato); spec di `handover/` ricopiate in `specs/`, identiche a quelle pinnate (istituzionale `sha256:b0c069cf...`, elenco operativo `sha256:7532fe3b...`; authz-catalog invariato); fixture di `/auth/status` rigenerate, identiche; orval deterministico (due run, stesso hash); canary FSD |
| step3-api | api_wrappers_compile, querykey_from_factory | TX-0016, TX-0017 ed export `{formato}` csv/xlsx nella spec; TX-0060 dalla slice elenco-operativo pinnata (entities/filtri) |
| step4-lib | lib_pure_compile, lib_zero_react | |
| step5-ui | ui_components_compile, ui_a11y_axe | hash dei tre wireframe ricalcolati dal disco con `wireframe-hash.sh`: uguali agli `approved_hash` (`4a53048a...` verifica-smp-non-sigc, `4b7342bf...` output-regionale, `1932cee7...` intervento); nessun import del generato ne' fra feature |
| step6-page | pages_compile, route_manifest_valid | `fe-project-check.sh --feature istituzionale --catalog` rc 0; `plan/istituzionale/route-manifest.json` proiettato e validato |
| step7-test | tests_generated, msw_fail_closed | REQ-must della feature: RA006, RF016, RF017, tutti con describe taggato |

Verifica finale: `npx tsc --noEmit`, `npx eslint .` e `npx vitest run` verdi (63 file, 1254 test; erano 1133 alla
partenza), la suite completa due volte di seguito. Wireframe, uiplan, dossier, backend, plugin e stati delle altre
feature non toccati.

## File principali

- `src/features/istituzionale/api/index.ts`: `useVerificaSmpNonSigc` (TX-0016: filtri ripetuti e anno di riferimento del
  file; `mantieniDati` per il dettaglio, placeholderData come gli elenchi dell'elenco operativo), `useOutputRegionale`
  (TX-0017), `useValoriFiltri` riesportato da `entities/filtri` (G2, stessa cache di elenco e fisico),
  `esportaVerificaSmpNonSigc` e `esportaOutputRegionale` (D-07), `rispostaDatoNonValido` sul problem-type.
- `src/features/istituzionale/lib/`: `grant` (`puoLeggere` con `hasGrant`, come il fisico), `pagine` (menu, grant del
  dettaglio, filtri conservati fra i due report senza l'anno), `criteri` (filtri del programma da entities/filtri, anno come
  parametro di pagina che resta al cambio dei filtri, anni proposti, codice del percorso del dettaglio), `collegamenti` (i
  link dello uiplan: dettaglio col codice in `encodeURIComponent`, report filtrati, domande `tipo=SOSTEGNO` e pagamenti
  `esito=PAGATA&sigc=false` dell'elenco, verifica SMP SIGC senza parametri), `formato` (perimetro, anno, periodo, quantita'
  con l'unita' accanto, si'/no, target, assenze con la resa unica, definizioni del backend come note fisse: OP-IS-07),
  `verifica` (i ventuno campi di TX-0016, l'intervento e venti dati, come dati: ordine, titoli di colonna e di voce, colonne visibili del wireframe, link
  solo col valore positivo e col grant), `output` (misure dell'interruttore, anni del periodo dalla risposta, didascalia,
  voci del drawer, importi in ordine di esercizio e codice), `intervento` (titolo, badge, KPI, stato delle letture, schede
  per grant, "Dati al" della prima risposta), `grafici` (barre della spesa per intervento; barre per anno delle tre misure
  col target come linea di riferimento, riga della tabella equivalente e descrizione accessibile), `dto` (forme
  strutturali; `ui/contratto.ts` le verifica a compilazione contro i DTO generati).
- `src/features/istituzionale/ui/`: `VerificaSmpNonSigc`, `ReportVerifica`, `TabellaVerifica` (pagina della verifica),
  `OutputRegionale`, `TabellaOutput`, `AnteprimaOutput` (output regionale), `DettaglioIntervento`, `SchedeIntervento`
  (dettaglio), `PannelloFiltriIstituzionale`, `useFiltriNellIndirizzo` (filtri nell'indirizzo, TX-0060 col grant, pannello
  e focus dopo "Applica i filtri"), `navigazione` (ingresso dell'area, dettaglio dal clic, link verso l'elenco per grant),
  `comuni` (stato dei valori dei filtri non disponibili con Riprova e focus sul titolo quando sparisce, cella di un dato
  col suo link, contesto del PNG), `esportazioni`.
- `src/pages/istituzionale/{verifica-smp-non-sigc,output-regionale,interventi}/page.tsx`; tre voci in
  `src/app/route-table.json`: `/istituzionale/verifica-smp-non-sigc` (visibility `csr.tx-0016.read`; azioni hide-by-role
  TX-0016 e TX-0060 con `csr.tx-0060.read`), `/istituzionale/output-regionale` (`csr.tx-0017.read`; TX-0017 e TX-0060),
  `/istituzionale/interventi/:codice` (`csr.tx-0016.read` o `csr.tx-0017.read`; TX-0016, TX-0017, TX-0060).
- `src/app/aree.ts`: Istituzionale passa da AREE_FUTURE ad AREE (Verifica SMP non SIGC, Output regionale, visibili per
  grant; i filtri del programma restano passando dall'uno all'altro report col menu, come nel finanziario), card secondo
  G1 (gia' scritta col fisico, invariata); `AMBITI`: Home (`home.tsx`) e menu (`menu.tsx`) iterano i quattro ambiti
  nell'ordine fisso del catalogo, cosi' Procedurale "presto" resta fra Fisico e Istituzionale come nei wireframe. La card
  del Procedurale non cambia.
- `src/app/tetti-letture.ts`: `/api/istituzionale/` nella coda comune delle letture (SC-IS_CAPACITA: "condiviso con i
  report finanziari").
- `src/shared/api/mock/server.ts`: i mock generati dell'istituzionale, come quelli di elenco e fisico, restano fuori dal
  server dei test (canarino in `tests/msw-armed.test.ts`). `src/features/istituzionale/api/mock/esempio.ts`: dati
  d'esempio per il dev server, filtrati come il backend.

Scelte di disegno approvate rispettate: i quattro link verso l'elenco (ricevute e spesa erogata, nella tabella e nella
scheda della verifica del dettaglio) solo con un valore maggiore di 0 e col grant della pagina di arrivo (TX-0056,
TX-0059); i testi di ANNO_NON_CONSERVATO e FONTE_AMBIGUA nella resa unica delle assenze; l'output regionale tabellare con
l'interruttore della misura (stato della pagina, non dell'indirizzo; il cambio non sposta il focus) e il mini grafico per
anno nel drawer senza scaricamento; il dettaglio come terzo flusso, che compone TX-0016 e TX-0017 filtrate sull'intervento
(nessuna transazione nuova). Decisione G4: la frase "I dati SIGC per lo stesso confronto sono nel Finanziario: Verifica
SMP SIGC." solo con `csr.tx-0015.read`, link a `/finanziario/sigc/verifica-smp` senza filtri; il finanziario non cambia.

## Riusi e spostamenti nel codice comune

Riusati senza modifiche: TX-0060 `useValoriFiltri`, `ValoriProgramma`, `GruppiProgramma`,
`useFiltriProgrammaNellIndirizzo` con la regola dell'azione senza legame e `useBozzaFiltri` (entities/filtri); i
controlli del pannello del kit; `useFocusDopoIlCambio` e `useFocusTitolo`; `TestataDettaglio`, `Briciole`,
`TestaPagina`; `scaricamentiDalBackend` e `PulsantiScarica`; `PillDatiAl`; `eProblema`; la resa delle assenze di
`entities/importo` (`ValoreImporto`, `ValoreMotivato`, `AssenzaMotivata`, `testoConNota`); `CardGrafico` con
`InterruttoreVista`; `TabellaInterattiva`, `TabellaVoci`, `TabellaStatica`; `barreRaggruppate` e le primitive dei
grafici; `formatNumber`, `formatEuro`, `formatDate`, `importoBreve`.

Spostati (un commit per spostamento; le feature di partenza riprendono i pezzi dal codice comune, con lo stesso
comportamento e i loro test verdi):

| pezzo | da | a | chi lo usa | effetto sulle feature di partenza |
|---|---|---|---|---|
| pannello dei filtri del programma con le voci di TX-0060 (gruppi, stato senza voci coi codici della risposta, Azzera e Applica senza l'azione senza legame) | `features/fisico/ui/PannelloFiltriSuperfici` | `entities/filtri/ui/PannelloFiltriProgramma` (generico sui criteri, coi gruppi della pagina dopo quelli del programma) | fisico (con la campagna), istituzionale | fisico: stessi testi e comportamento |
| `vociDelPannello`, `descrizioneIntervento` | `features/fisico/lib/{criteri,formato}` | `entities/filtri/lib/programma` | fisico, istituzionale, finanziario (`useDescrizioneIntervento`) | nessuno; i test L1 passano in `tests/entita-filtri-domanda` |
| `SelettoreAnno` (select con "Mostra") e `useAnnoNellIndirizzo` | `features/finanziario/ui` | `shared/ui` (anni proposti e voce senza anno decisi da chi li usa) | finanziario (involucro sottile con gli anni del periodo CSR e "Scegli un anno"; le pagine della riserva e della verifica SMP prendono l'anno dal kit), istituzionale | nessuno |
| `ApriNellElenco` | `features/finanziario/ui/LinkElenco` | `entities/domanda/ui` | finanziario (riesportato da LinkElenco), istituzionale | nessuno |
| `VuotoConFiltri` | `features/fisico/ui/ReportSuperfici` | `shared/ui/stati` | fisico, istituzionale | nessuno |
| messaggio del file oltre il limite dell'export (`messaggioOltreIlLimite`) | `features/fisico/ui/esportazioni` | `shared/ui/scarica/scaricamenti` | fisico, istituzionale | stesso testo |

Estensioni additive del kit e delle entity: `descriviAssenza` conosce ANNO_NON_CONSERVATO e FONTE_AMBIGUA (OP-IS-08; le
altre feature non ricevono questi motivi); `BadgeAssenza` (la forma a badge di `AssenzaMotivata` per una resa data:
"non valorizzato - nessun target"); `Interruttore` generico a piu' scelte con `aria-pressed`, su cui ora sta anche
`InterruttoreVista` (stesso markup); `TestaPagina` con `nota` sotto il sottotitolo; `CardGrafico` con `senzaPng` e
`oggetto` (nome accessibile dei pulsanti), con la vista in un hook proprio per restare sotto la soglia di complessita'.
App: ordine fisso degli ambiti in Home e menu (`AMBITI`, `eRealizzata`).

Effetti su finanziario, elenco e fisico: nessun cambiamento visibile; i loro test (pagine, componenti, lib) sono verdi
senza modifiche, salvo gli import spostati in `tests/fisico-lib.test.ts` e i test dell'ordine degli ambiti in
`tests/app-aree.test.tsx`.

## Test

- `tests/istituzionale-api.test.tsx` (9): wrapper su MSW (filtri ripetuti e anno, enabled guard, 400 sul problem-type,
  cache comune di TX-0060 col fisico, export con X-Requested-With e 400 dal Blob d'errore, `mantieniDati`), mock di
  esempio.
- `tests/istituzionale-lib.test.ts` (26): L1 di tutte le funzioni pure della feature e della fixture che filtra come il
  backend (intervento, obiettivi in E e O, azione senza legame, anno con ANNO_NON_CONSERVATO).
- `tests/istituzionale-ui.test.tsx` (14): L2 su MSW e axe per ogni componente (pagine, tabella dei venti dati e celle,
  pannello, stato dei valori non disponibili col focus sul titolo, tabella e drawer dell'output, dettaglio e schede).
- `src/pages/istituzionale/verifica-smp-non-sigc/page.test.tsx` (23, describe RF016 e RA006),
  `output-regionale/page.test.tsx` (15, RF017 e RA006), `interventi/page.test.tsx` (17, RF017, RF016 e RA006): letture
  che rispondono ai parametri della query (`testing/letture.ts`, mai lo stesso corpo per ogni query); per ogni pagina
  caricamento (`role=status` con `aria-live=polite`), errore (un solo avviso col problem-type e Riprova), vuoto e valori
  dei filtri non disponibili; G4 con e senza `csr.tx-0015.read`; nessuna lettura di TX-0060 senza il suo grant; link
  verso l'elenco con e senza i grant; codice con '/' nel percorso del dettaglio (nessuna richiesta); focus sull'h1 dopo
  "Applica i filtri" con criteri cambiati dallo stato vuoto, sul bottone che resta con criteri invariati o dalla barra,
  su "Mostra" dopo il cambio d'anno, sul titolo quando lo stato dei valori sparisce dopo Riprova (tutti con
  `document.activeElement`); schede da tastiera; Esc di pannello e drawer.
- `tests/kit-comune-istituzionale.test.tsx` (9): il codice comune spostato o esteso per l'istituzionale; aggiunte in
  `tests/entita-filtri-ui.test.tsx` (pannello comune), `tests/entita-filtri-domanda.test.ts`, `tests/finanziario-lib.test.ts`
  (motivi nuovi), `tests/msw-armed.test.ts`, `tests/app-aree.test.tsx` (card, menu e ordine degli ambiti, filtri
  conservati dal menu), `tests/bff-mutator.test.ts` (coda comune con l'istituzionale).

Copertura v8 dei file dell'istituzionale e del codice comune nuovo (misura locale sui test della feature): 96,6 %
istruzioni, 94,4 % rami, 97,3 % righe (le soglie le applica step8).

## Punti aperti

1. **Gate e review**: step8 e step9 dell'istituzionale; poiche' il codice comune e' stato spostato o esteso da
   finanziario, fisico e app (tabella sopra), anche lo step8 di finanziario, elenco operativo e fisico va rifatto prima
   del push: i loro report del gate sono di prima.
2. **Ordine iniziale della tabella della verifica**: per codice dell'intervento crescente, l'ordine della risposta del
   backend ("in ordine di codice"); le righe d'esempio del low-fi (SRD01, SRA01, SRD04, SRA16) mostrano i casi e non
   seguono un ordine, e il doc del flusso non ne dichiara uno. Output regionale (codice) e importi unitari (esercizio,
   poi codice) seguono il wireframe.
3. **Rese da guardare in review, nessun wireframe toccato**: le quantita' dell'output regionale hanno l'unita' in ogni
   cella ("1500 ettari", nota WCAG dello uiplan "unita' sempre accanto al valore"), il low-fi mostra il solo numero con la
   colonna dell'unita'; i chip della barra hanno il codice ("Intervento SRD01") come nel low-fi e nel finanziario, il doc
   del flusso parla di "voce leggibile da TX-0060"; i nomi dei pulsanti della card del grafico seguono il kit ("Scarica il
   grafico <titolo> in CSV") e quelli della scheda Output per anno dicono l'intervento ("il grafico e i dati dell'output
   dell'intervento SRA01"), mentre il low-fi da' nomi diversi a PNG e CSV; il drawer dell'output ha il titolo del low-fi
   ("Anteprima: SRA01"), senza il sopratitolo del fisico; lo stato "valori dei filtri non disponibili" c'e' nella pagina
   (col motivo e Riprova, come il low-fi) e nel pannello (come il fisico); gli anni proposti dal selettore sono il
   periodo CSR 2023-2029 piu' l'anno della risposta e quello scelto (la spec non elenca gli anni dei file).
4. **Letture del dettaglio**: TX-0016 e TX-0017 partono all'apertura della pagina, non all'apertura della scheda come
   dice il doc del flusso, perche' KPI e badge della testata le usano; le schede leggono dalla stessa cache, nessuna
   lettura in piu'. "Dati al" viene da TX-0016 se c'e', altrimenti da TX-0017 (lo stesso elenco, SC-IS_ULTIMO_DATO).
5. **Restano aperti nello uiplan** OP-IS-06 (grafico fra interventi: servirebbe una grandezza senza unita' dal backend),
   OP-IS-07 (marcatore "da consolidare" di NFR-25 d e definizioni D-02, D-03, D-04 da confermare: oggi note fisse) e
   OP-IS-09 (richiesta non bloccante a green-be di uno scenario di coincidenza per i link verso l'elenco); OP-IS-10 e'
   informativo.
6. **Test instabile**: in una suite completa il test del pannello chiuso con Esc ha trovato il focus su BODY (react-aria
   lo riporta dopo la chiusura): corretto con un `waitFor`, poi la suite completa e' verde due volte di seguito. Un
   fallimento non identificato e' comparso anche in una delle quattro esecuzioni con la copertura v8, non riprodotto;
   il test omologo del fisico ha la stessa asserzione senza `waitFor` (forse il suo punto aperto 5).
