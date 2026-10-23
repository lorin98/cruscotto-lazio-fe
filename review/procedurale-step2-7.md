# Feature procedurale: step2-7 di green-fe del 23/10/2026

Partenza: `.claude/state/green-fe-procedurale.state.json` a `current_step` 2 (step0 e step1 done, sei flussi approvati
dall'utente il 22/10/2026: `panoramica` con `/procedurale` e `/procedurale/interventi/:codice`, `stati` con
`/procedurale/stati-sostegno` e `/procedurale/stati-pagamento`, `ammesse`, `sottofasi`, `unit-amount`, `riepilogo`; le otto
scelte di disegno stanno fra le deviazioni riviste dei gate). Eseguiti gli step 2-7 seguendo le skill del plugin
(`step2-codegen` ... `step7-test`); gate e transizioni scritti solo con `state-set.sh` e `state-transition.sh`, ogni gate
nello stesso blocco bash del suo `state-set`. La feature e' a `current_step` 8: **step8-gate e review step9 restano alla
sessione principale**. Commit su `main`, nessun push.

## Step e gate

| step | gate registrati | note |
|---|---|---|
| step2-codegen | codegen_compiles, orval_types, csrf_static | scaffold gia' presente (template non ricopiato); spec di `handover/` ricopiate in `specs/`, identiche a quelle pinnate del giro G3 (procedurale `sha256:22da0189...`; authz-catalog invariato); fixture di `/auth/status` rigenerate, identiche; orval deterministico; canary FSD. `npm ci` fermato da EPERM (punto aperto 2) |
| step3-api | api_wrappers_compile, querykey_from_factory | TX-0024..TX-0032 e i sette export `{formato}` csv/xlsx (D-10); mock generati del procedurale fuori dal server dei test (canarino in `tests/msw-armed.test.ts`) |
| step4-lib | lib_pure_compile, lib_zero_react | |
| step5-ui | ui_components_compile, ui_a11y_axe | hash dei sei wireframe ricalcolati dal disco con `wireframe-hash.sh`: uguali agli `approved_hash`; nessun import del generato ne' fra feature |
| step6-page | pages_compile, route_manifest_valid | `fe-project-check.sh --feature procedurale --catalog handover/authz-catalog.json` rc 0; `plan/procedurale/route-manifest.json` proiettato e validato (8 route, 32 azioni) |
| step7-test | tests_generated, msw_fail_closed | REQ-must della feature: RF024..RF029, tutti con describe taggato; describe anche per RF030..RF032 |

Verifica finale: `npx tsc --noEmit`, `npx eslint .` e `npx vitest run` verdi (75 file, 1465 test), la suite completa
due volte di seguito. Wireframe, uiplan, dossier, backend, plugin e stati delle altre feature non toccati.

## Commit (in ordine)

`02b0a27` step2; `d5ccb06` step3; `487436e`, `eedabeb`, `431d544`, `905e6b4`, `d6414b8` codice comune (tabella sotto);
`3fba1af` step4; `5293b91`, `2573875`, `def1eb9` codice comune; `e4231a4` lib (link per stato, potatura);
`9f1c5fd` letture di prova e dati d'esempio; `74eb571` step5; `998e571` coda comune delle letture; `9e56acd` step6;
`10916d9` Home e menu; `b2da5c5` dettaglio (dati di prima cambiando lo stato, nessuna attesa senza grant);
`abf2a2b` `clicSulCodice` dei test; `c79ed73` step7; questo resoconto.

## File principali

- `src/features/procedurale/api/index.ts`: `useValoriFiltri` (TX-0024: interventi senza AT001, OS, OG, OP e
  `ultimiDatiSincronizzati`) e `useStatiAreaProgrammazione` (TX-0025) della slice stessa (G2 non riguarda il procedurale);
  `useDomandeAmmesse`, `useStatiSostegno`, `useStatiPagamento`, `useRiepilogo`, `useSottofasiSostegno`,
  `useSottofasiPagamento` coi cinque filtri ripetuti (mai `azione`), `useUnitAmount` senza lo stato (D-06 Rev. 6);
  opzioni `abilitato` e `mantieniDati` (placeholderData, solo il dettaglio); `esportaReport`, `esportaUnitAmount`.
- `src/features/procedurale/lib/`: `criteri` (filtri del programma di entities/filtri piu' `stato` con le chiavi di
  TX-0025, formato validato, chip con la descrizione), `pagine` e `grant`, `collegamenti` (dettaglio col codice in
  `encodeURIComponent`, panoramica e stati coi criteri, i 18 link verso l'elenco con la query dello uiplan, fail-closed su
  codice e chiavi di stato, testi con la parte rilasciata), `stati` (voci di SR-01, altri stati per codice, In
  compilazione senza fonte = null, area programmazione con osservati e senza stato), `formato`, `kpi`, `sottofasi`,
  `unitAmount`, `riepilogo`, `intervento`, `grafici` (stati impilati col tratteggio delle non rilasciate, area,
  sottofasi, barre per intervento, Unit Amount orizzontali), `dto` (forme strutturali, verificate da `ui/contratto.ts`).
- `src/features/procedurale/ui/`: `PaginaProcedurale` (su `PaginaConFiltri` del kit), `PannelloFiltriProcedurale`,
  `useCriteriNellIndirizzo` (tre forme: tutti i criteri, senza lo stato per le Unit Amount, il solo stato per il
  dettaglio), `Panoramica`, `StatiDomande` (`StatiSostegno`, `StatiPagamento`), `TabellaStatiInterventi`,
  `AnteprimaStati`, `CardDistribuzioni`, `DomandeAmmesse`, `CardAmmesse`, `TabellaAmmesse`, `Sottofasi`,
  `CardSottofasi`, `UnitAmount`, `TabellaUnitAmount`, `Riepilogo`, `TabellaRiepilogo`, `DettaglioIntervento`,
  `SchedeIntervento`, `comuni` (pill, KPI, tabella equivalente delle voci, celle delle ammesse e con atto),
  `navigazione`, `esportazioni`, `contratto`.
- `src/features/procedurale/testing/`: `fixture` (le domande degli scenari del backend; i report si calcolano coi
  parametri della query, con le varianti non rilasciate, atto e pagato) e `letture` (handler MSW che registrano cosa e'
  stato chiesto). `api/mock/esempio.ts`: le stesse letture per il dev server (con le non rilasciate di SRD01).
- `src/pages/procedurale/{panoramica,interventi,stati-sostegno,stati-pagamento,ammesse,sottofasi,unit-amount,riepilogo}/page.tsx`;
  otto voci in `src/app/route-table.json` con `visibility` = `roles` della route dello uiplan (verbatim) e un'azione
  hide-by-role col grant di lettura per ogni transazione.
- `src/app/aree.ts`: Procedurale passa da AREE_FUTURE ad AREE (sette voci di menu visibili per grant; i criteri, stato
  compreso, restano passando da una pagina all'altra col menu), card col testo del dossier ("Stati e sottofasi delle
  domande; domande ammesse con atto di concessione e contributo; riepilogo per intervento; pagamenti per Unit Amount",
  G1). AREE_FUTURE resta vuota. `src/app/tetti-letture.ts`: `/api/procedurale/` nella coda comune (SC-PC_CAPACITA).

Scelte di disegno approvate rispettate: dettaglio procedurale accanto a quello del finanziario con la scheda Sottofasi;
due pagine per gli stati, ognuna col suo grant; card dello stato area programmazione da TX-0029 (clic = filtro della
pagina per lo stato); stati: clic su una barra = filtro della tabella sulla voce col chip della pagina e l'azione esplicita
"Apri nell'elenco (n rilasciate)"; "non disponibile" per il di cui non rilasciate della voce senza fonte; CSV e XLSX di
una card = export dell'intero report; Unit Amount senza pagato = nota unica sopra la tabella e "non disponibile" breve.

## Riusi e spostamenti nel codice comune

Riusati senza modifiche: `useFiltriProgrammaNellIndirizzo`, `useBozzaFiltri`, `usePannelloConFocus`, `filtriNellaBarra`,
`descrizioneIntervento` (entities/filtri); `ApriNellElenco`, `PERCORSO_ELENCO_DOMANDE` (entities/domanda); la resa delle
assenze di entities/importo (`AssenzaMotivata`, `BadgeAssenza`, `ValoreImporto`, `ValoreMotivato`, `descriviAssenza`);
`CardGrafico` (con `oggettoDati`, `senzaPng`, `tabella`), `InterruttoreVista`, `useStatoNellaHistory`, `TabellaInterattiva`,
`TabellaStatica`, `Kpi`, `Griglia`, `Sezione`, `PannelloLaterale`, `PillDatiAl`, `TestataDettaglio`, `Briciole`,
`VistaQuery`, `AvvisoPagina`, `useErroreNellaPagina`, `AvvisoAggiornamento`, `VuotoConFiltri`, `useFocusDopoIlCambio`,
`useFocusTitolo`, `useRigheContesto`, `scaricamentiDalBackend`, `messaggioOltreIlLimite`, `PulsantiScarica`; le primitive
dei grafici e `barreRaggruppate`.

Spostati o estesi (un commit per sottoargomento; le feature di partenza riprendono i pezzi dal codice comune, stesso
comportamento e test verdi):

| pezzo | da | a | chi lo usa | effetto sulle altre feature |
|---|---|---|---|---|
| `codiceDelPercorso` (codice del percorso e delle risposte nel formato del filtro) | `features/istituzionale/lib/criteri` | `entities/filtri/lib/programma` | istituzionale, procedurale | nessuno |
| `testoPerimetro` con il perimetro ADA ("ADA del tuo profilo") | copia in `features/elenco-operativo/lib/formato` | `shared/lib/intestazione` | elenco operativo, procedurale (pill e PNG) | elenco: stessa resa; fisico e istituzionale sempre regionali |
| `assenzaInFrase`, `testoMotivato` | `features/istituzionale/lib/formato` (e una copia nei KPI del finanziario) | `entities/importo` | istituzionale, finanziario, procedurale | stessi testi |
| barre raggruppate orizzontali, `MISURA_NUMERI`, `MISURA_PERCENTUALI` | (nuovo) | `shared/lib/grafici` | procedurale | di default nulla cambia |
| `statoDelDettaglio`, `tutteRisposte`, `rigaDellIntervento`, `useStatoDelDettaglio` | `features/istituzionale` | `shared/lib/dettaglio`, `shared/ui/pagina` | istituzionale, procedurale | stesso comportamento |
| pannello senza l'azione portante (`senzaAzione`), `ValoriFiltriNonDisponibili` (piu' letture) | `features/istituzionale/ui/comuni` | `entities/filtri` | istituzionale, procedurale | istituzionale: stessi testi e focus; fisico e finanziario invariati |
| `PaginaConFiltri` (barra, percorso, h1, sopra, avviso unico, pannello) | `features/istituzionale/ui/PaginaReport` | `shared/ui/pagina` | istituzionale, procedurale | istituzionale: stesso DOM |
| `TabellaInterattiva`: `gruppo` (intestazioni colgroup), `nomeEsteso`, `intestazioneRiga` | (nuovo, facoltativo) | `shared/ui/tabella` | procedurale | senza le proprieta' nulla cambia |
| `clicSulCodice` (test) | (nuovo) | `shared/testing/grafico-finto` | test del procedurale | nessuno |

Effetti su finanziario, elenco, fisico e istituzionale: nessun cambiamento visibile; i loro test sono verdi, con gli import
spostati in `tests/istituzionale-*.test.ts*`, `tests/finanziario-lib.test.ts`, `tests/lib.test.ts` e le aree in
`tests/app-aree.test.tsx` e `tests/shell.test.tsx` (nessuna area piu' "presto"; nel menu due voci "Panoramica" e due
"Riepilogo per intervento", cercate dentro il gruppo dell'area).

## Test

- `tests/procedurale-api.test.tsx` (12): wrapper su MSW (filtri ripetuti e stato, Unit Amount senza stato, nessuna
  lettura non abilitata, 400 sul problem-type, i sette export con X-Requested-With e il 400 dal Blob d'errore), mock di
  esempio del dev server.
- `tests/procedurale-lib.test.ts` (32): L1 delle funzioni pure e della fixture che calcola come il backend.
- `tests/procedurale-ui.test.tsx` (29): L2 su MSW e axe per componente (impaginazione e pannello nelle tre forme,
  valori non disponibili, KPI con e senza grant dell'elenco, tabella delle voci, card, tabelle e drawer degli stati,
  ammesse, sottofasi, Unit Amount, riepilogo, dettaglio e schede).
- `tests/kit-comune-procedurale.test.tsx` (4) e aggiunte in `tests/entita-filtri-*.test.*`, `tests/lib.test.ts`,
  `tests/shared-grafici.test.ts`, `tests/msw-armed.test.ts`, `tests/bff-mutator.test.ts` (coda comune), `tests/app-aree.test.tsx`.
- `src/pages/procedurale/*/page.test.tsx` (93: panoramica 17, interventi 16, stati-sostegno 11, stati-pagamento 8,
  ammesse 11, sottofasi 9, unit-amount 9, riepilogo 12), describe RF024..RF032. Per ogni pagina: caricamento
  (`role=status`, `aria-live=polite`), errore (un solo avviso col problem-type e Riprova), vuoto con "Modifica i filtri",
  valori dei filtri non disponibili (TX-0024, e TX-0025 col chip della chiave); totali dal backend con risposte il cui
  totale differisce dalla somma delle righe; link verso l'elenco con e senza `csr.tx-0056.read`; nessuna lettura senza il
  grant della transazione; codice con '/' nel dettaglio senza richieste; CSV e XLSX con nome, criteri e X-Requested-With;
  focus con `document.activeElement`: sull'h1 dopo "Applica i filtri" con criteri cambiati dallo stato vuoto, sul bottone
  Filtri dalla barra, sull'h1 quando spariscono il chip della voce o lo stato dei valori dopo Riprova, sulla riga dopo Esc
  del drawer; schede da tastiera (frecce); dati di prima con l'avviso cambiando lo stato nel dettaglio; vista del
  riepilogo ritrovata tornando indietro.

Copertura v8 di `src/features/procedurale/**` (misura locale sui test della feature): 94,5 % istruzioni, 86,5 % rami,
94,8 % funzioni, 96,1 % righe (le soglie le applica step8).

## Punti aperti

1. **Gate e review**: step8 e step9 del procedurale. Il codice comune e' stato spostato o esteso da istituzionale,
   finanziario, elenco operativo e app (tabella sopra) e il kit della tabella e dei filtri vale anche per il fisico: lo
   step8 di finanziario, elenco operativo, fisico e istituzionale va rifatto prima del push (le approvazioni sha256 dei
   loro gate sono di prima).
2. **`npm ci` dello step2**: EPERM sul binding di rolldown (`node_modules/@rolldown/binding-win32-x64-msvc`), tenuto aperto
   da un `vite --mode be` avviato da `cruscotto-lazio-fe-prova` (il suo `node_modules` e' una junction verso quello di
   questo repo). `node_modules` ripristinato con `npm install --prefer-offline`, `package-lock.json` invariato; i processi
   non sono stati fermati: quel dev server potrebbe essere da riavviare.
3. **Pagine senza le letture dei report**: la `visibility` delle route e' quella dello uiplan (anche TX-0024 e TX-0025),
   quindi un profilo coi soli valori dei filtri apre per esempio `/procedurale` e vede barra e titolo senza sezioni ne'
   un testo che lo dica (il menu non gliela propone). Nel dettaglio un profilo con le sole schede (per esempio le
   sottofasi) vede subito le sue schede (corretto in `b2da5c5`). Da decidere in review se serve uno stato "nessun report
   per il tuo profilo" o una visibility piu' stretta (che cambierebbe lo uiplan approvato).
4. **AREE_FUTURE vuota**: il meccanismo "presto" di Home e menu resta senza aree; da decidere se toglierlo.
5. **Rese da guardare in review, nessun wireframe toccato**: con domande non rilasciate il nome del link e' "Apri
   nell'elenco (1 rilasciata): apri nell'elenco operativo la domanda di sostegno rilasciata di SRD01 nello stato Stampato"
   (il testo visibile apre il nome); i PNG delle schede del dettaglio si chiamano "il grafico <titolo>" senza "di SRD01",
   CSV e XLSX dicono "di SRD01"; le voci fuori catalogo sono "Altro stato: CODICE (codice SIAN fuori catalogo)" e gli
   stati osservati "Revocata (stato osservato fuori catalogo)"; intestazioni brevi delle colonne degli stati col nome
   completo nel bottone ("In istruttoria" / "In istruttoria presso ente competente"); il clic su una barra (filtro della
   tabella o della pagina) e' del mouse, da tastiera c'e' la tabella equivalente con "Apri nell'elenco" e il pannello per
   lo stato; nella panoramica il "clic sulla card degli stati" e' il link "Apri gli stati delle domande di ..." negli
   strumenti della card; la card delle Unit Amount senza pagato mostra la tabella equivalente generata dal kit col motivo
   in ogni cella (la tabella della pagina ha la nota unica); nelle sottofasi la voce senza fonte ha il motivo completo e
   la sottofase censita il "non disponibile" breve; card e tabella degli stati scaricano lo stesso file
   (`domande-di-sostegno-per-stato-tx-0027.*`, l'intero report), il riepilogo `domande-per-intervento-tx-0029.*` dal
   grafico e `riepilogo-per-intervento-tx-0029.*` dalla tabella.
6. **Letture del dettaglio**: TX-0026, TX-0027 e TX-0028 partono all'apertura (KPI, badge e la prima scheda), le schede
   Area, Sottofasi e Unit Amount quando si aprono; cambiando lo stato i dati di prima restano con l'avviso
   dell'aggiornamento, come il cambio d'anno del dettaglio dell'istituzionale.
7. **Dati di prova**: fixture e dati d'esempio sono le domande degli scenari di accettazione del backend; la variante
   delle non rilasciate (due in compilazione, quattro stampate di cui tre non rilasciate) e' derivata da
   SC-PC_IN_COMPILAZIONE; il perimetro dell'intervento e' un testo d'esempio ("SIGC sì"/"SIGC no"), i valori reali di
   INTERVENTO.PERIMETRO non sono nella spec. Il dev server usa le stesse letture di prova (eslint lo consente ad
   `api/mock`), invece di dati inventati a parte come le altre feature.
8. **Restano nello uiplan** OP-PR-06 (profili misti e drill-down), OP-PR-07 (TX-0024 e TX-0025 con ui_hint form, rese
   come pannello), OP-PR-08 (l'elenco ha le sole rilasciate: link della parte rilasciata, nessun link per sottofase) e
   OP-PR-09 (stato "PROPOSTO AL PAGAMENTO-ESTRAZ. CAMPIONE-DA ESEGUIRE" fra gli altri stati), informativi.
