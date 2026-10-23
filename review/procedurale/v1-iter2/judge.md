# Judge, review step9 FULL della feature procedurale, v1 iterazione 2

Perimetro: `git diff 94e1d59 07940a3`. Comprende le correzioni dei 23 finding dell'iterazione 1 (da eaf9f9f a 07940a3, resoconto
in 1415299) e il commit 947fc54 delle decisioni D1 e D2. Tocca il codice comune e i suoi usi in finanziario, fisico,
istituzionale ed elenco operativo.
- Il brief indica come base 947fc54, che pero' lascerebbe fuori eaf9f9f (X1) e 24860d2 (V4), due correzioni fatte prima di D1. Ho
  usato 94e1d59, la base del giro di correzione.
- Intensita' FULL (budget 3, questa e' la seconda iterazione).
- Ho verificato ogni finding in sola lettura sul codice HEAD (3475b38, 23/10/2026), con Read, grep e git show/diff. Fra 07940a3
  e 3475b38 cambiano solo gli stati, i report del gate, il resoconto e il brief: `git diff --stat 07940a3 HEAD -- src tests` e'
  vuoto.
- Non ho lanciato npm, build o test. Ho eseguito solo gli script read-only dei gate e `review-score.sh`.

Finding in ingresso: 9 (lente V 1, lente H 4, lente A 3, antagonista 1). Gli id sono quelli di questa iterazione: X1, V1, A2, A3,
H1, H2 e H3 qui non sono i finding con lo stesso id dell'iterazione 1.

## Gate non declassabili (pre-Judge)

- **Fedelta' authz.** Ho rieseguito gli script in sola lettura, con `CLAUDE_PLUGIN_ROOT` del plugin green-fe e `tools/vendor` in
  testa al PATH.
  - `check-ui-authz.sh plan/procedurale/route-manifest.json plan/procedurale/uiplan.json handover`: rc 0, pass, 8 route e 33
    azioni, nessun failure. Le azioni sono una in piu' dell'iterazione 1: e' `TX-0025` della route del dettaglio (D1).
  - `fe-project-check.sh . --built --feature procedurale --catalog handover/authz-catalog.json`: rc 0, pass, 5 feature, nessun
    failure. Pass anche senza `--feature`.
  - Nessuna regressione authz nelle altre feature: `check-ui-authz.sh` e' pass per finanziario (9 route, 25 azioni), fisico (2, 3),
    istituzionale (3, 7) ed elenco operativo (3, 6).
  - FAIL_AUTHZ non scatta.
  - D1 e' coerente col codice (947fc54):
    - nella route `/procedurale/interventi/:codice` lo uiplan ha `TX-0025` fra le transactions e `RF025` fra i reqs, con
      `roles` invariato;
    - la route-table e il manifest hanno l'azione `{ TX-0025, hide-by-role, csr.tx-0025.read }`;
    - la lettura parte solo col grant e il test lo prova: `interventi/page.test.tsx:94`, col profilo senza
      `csr.tx-0025.read` nessuna lettura degli stati area e il chip con la chiave.
  - Nello stato della feature nessun marker `enforcement-pending` e nessuna riga CONFLICT nel catalogo per gli endpoint della
    slice.
  - Lo step8 che il brief dava in corso e' chiuso a 3475b38: 11/11 per le cinque feature (`step8-gate` done alle 14:23Z del 23/10,
    `plan/procedurale/fe-gate-report.json` con verdict pass).
- **`contextProjection` usata come sicurezza.** Non c'e' nessun uso in `src/features`, `src/entities` e `src/pages`. Resta solo
  l'helper security-inert di `shared/api/auth/stato.ts`, che il perimetro non tocca. Nessun CRITICO imposto.
- **CSRF.** Il perimetro non tocca `src/shared/api` (diff vuoto); `tests/bff-mutator.test.ts` aggiunge solo il caso della coda di A5.
  - `X-Requested-With` resta fisso nel mutator (`bff-mutator.ts:42`).
  - Gli export del procedurale lo portano ancora: `stati-sostegno/page.test.tsx:156`. Nessun CRITICO.
- **Regola data-access del `judge-brief.md`.** Riguarda jOOQ e CallableStatement del backend, quindi qui non si applica.
- **Nessun finding CRITICO o MAGGIORE in ingresso.** La sezione dei CRITICO rigettati e' vuota per costruzione.

## Verifica dei finding dell'iterazione 1

I 21 finding da correggere hanno tutti la loro correzione, e V1 e V5 sono chiusi dalle decisioni D1 e D2. Tre correzioni lasciano
pero' un residuo, che le lenti ripresentano e che valuto sotto:
- X1 dell'iterazione 1 e' risolto solo per lo stato d'errore: e' X1 di questa iterazione;
- A2 e' risolto per il clic sulla barra, non per il pannello: e' A3 di questa iterazione;
- H10 lascia una forma delle letture nella scheda Sottofasi: e' H1 di questa iterazione.

| id | verifica sul codice HEAD |
|---|---|
| X1 | Guardia `some(senzaRisposta)` in `NessunaDomanda` (`DettaglioIntervento.tsx:101`), test `interventi/page.test.tsx:273`. Copre la lettura in errore, non quella in corso senza dati: residuo X1 sotto. |
| V4 | `testoNessunIntervento(conFiltri)` (`lib/formato.ts:48`) in `Panoramica.tsx:55`, `DomandeAmmesse.tsx:50`, `Riepilogo.tsx:91`; test SC-PC_SCOPE_P4 e ADA con filtri (`panoramica/page.test.tsx:266, 288`). |
| A1 | `testoNessunaDomanda(codice, conStato, perimetro)` e `testoSenzaStato` (`lib/intervento.ts:63-71`), test `interventi/page.test.tsx:283`. |
| A2 (assorbe H7) | `motivoSenzaLink` (`lib/collegamenti.ts:147-152`) nella cella `Elenco` (`comuni.tsx:100-105`); il clic sulla barra dell'area filtra solo con `chiaveStatoValida` (`Panoramica.tsx:99`); `apreLaVoceDellArea` (`collegamenti.ts:138`) in panoramica e scheda Area. Il pannello resta: residuo A3 sotto. |
| X2 | Voce tolta nel render (`StatiDomande.tsx:124`), test `stati-sostegno/page.test.tsx:82`. Il silenzio dell'azione e' parte di V1 sotto. |
| V2 | Colonna "Tabella per intervento" con `Filtra` (`comuni.tsx:111-119, 127`); `CardStati` con `onFiltra` anche senza link (`CardDistribuzioni.tsx:64`); la passa solo `ReportStati` (`StatiDomande.tsx:104`); test `stati-sostegno/page.test.tsx:114`. Il riscontro manca: V1 sotto. |
| X3 | `DatoPagato` con `breve` solo nelle colonne (`TabellaUnitAmount.tsx:20-22, 34`), il drawer senza (`UnitAmount.tsx:47`); test `unit-amount/page.test.tsx:64`. |
| V3 | `percentualeBreve` con `resaAssenza(d, true)` quando il pagato e' senza fonte (`lib/grafici.ts:205, 224`); test `unit-amount/page.test.tsx:51`. |
| X4 | `voceDellaColonna` (`lib/riepilogo.ts:43`) e `DomandeDellaVoce` con `AssenzaMotivata` (`TabellaRiepilogo.tsx:29-31, 59`), anche nel piede; test `riepilogo/page.test.tsx:74`. |
| V7 (assorbe A4, H4) | Intestazione effettiva una volta (`TabellaInterattiva.tsx:264`), il piede con `c.chiave === intestazione` (:117); colonna `ua` fissa (`TabellaUnitAmount.tsx:29`). |
| H5 | `.ui-tabella thead` sticky con lo sfondo (`tema.css:222`), misurato in Chromium dal resoconto. Ha un effetto nuovo sul focus: A2 sotto. |
| V8 | `oggettoPng` (`CardGrafico.tsx:71-75, 145`) dalle schede Stati e Area (`SchedeIntervento.tsx:79, 93`) e da `CardSottofasi.tsx:92`. |
| H2 | `rigaDellIntervento` in `entities/filtri/lib/programma.ts:158`, esportata dal barrel (`index.ts:20`); `shared/lib/dettaglio.ts` non la ha piu'. |
| H1 | `IntestazioneNonValida`, `ErroriDelleLetture` e `CorpoDelDettaglio` in `shared/ui/pagina/Dettaglio.tsx:25, 49, 60`, usati dai due dettagli. Il testo di dominio del primo e' H2 sotto. |
| H6 | `barreRaggruppate(voci, definizioni, testi, { omessi, misura, orizzontale })` (`forme.ts:152`); `asseCategorieOrizzontale` e `GRIGLIA_CON_ETICHETTE` (`primitive.ts:120-125`) nelle barre del procedurale (`lib/grafici.ts:86-99`); nessun `containLabel`. |
| H10 | `NumeroONonDisponibile` (`comuni.tsx:55`) nelle tre tabelle; `TITOLI_PAGATO` (`lib/unitAmount.ts:25`); `useLettureColGrant` (`navigazione.ts:41-46`) in panoramica, sottofasi e dettaglio. Il residuo e' H1 sotto. |
| H11 | `PANNELLI` e un solo `schede.map` (`SchedeIntervento.tsx:150-175`); test delle 30 righe in `tests/eslint-regole.test.ts:97-100`. |
| H8 | Via `AREE_FUTURE`, `CardAreaFutura`, `AreaFutura` e gli stili "presto" (`src/app/aree.ts:5`, `tema.css`). |
| V5 (D2) | Deviazione nei `deviations_reviewed` di `wireframe_panoramica` (947fc54); test facoltativo del 400 (`interventi/page.test.tsx:300`). |
| A5 | Commento di `useValoriFiltri` corretto (`api/index.ts:81-83`); test della coda in `tests/bff-mutator.test.ts`. |
| H3 | `senzaAzione` nel hook comune (`useFiltriProgrammaNellIndirizzo.ts:44-51, 66-68`); finanziario passa ancora `conValori` e `valori` (`useFiltriNellIndirizzo.ts:19`). Il ramo morto e' H3 sotto. |
| H9 | `perimetroDellaRisposta` (`elenco-operativo/lib/formato.ts:50`), senza l'alias. |
| V1 (D1) | Vedi i gate. |

Non ho trovato regressioni di comportamento in finanziario, fisico, istituzionale ed elenco operativo, e le lenti non ne
segnalano:
- `TabellaInterattiva` senza `intestazioneRiga` ha l'intestazione e il piede sulla prima colonna visibile, come prima;
- `barreRaggruppate` cambia solo la forma della chiamata (`spesa.ts:287`, `fisico/lib/grafici.ts:73`,
  `istituzionale/lib/grafici.ts:79`), con `orizzontale` falso di default;
- `CardGrafico` senza `oggettoPng` ha i nomi di prima;
- il dettaglio dell'istituzionale usa le parti del kit con lo stesso DOM.

Gli effetti dichiarati nel brief sono coerenti col codice e non sono finding. Lo sono solo due conseguenze che il brief non
dichiara:
- "Filtra la tabella" non da' riscontro a chi non vede la tabella (V1);
- il thead su due righe nasconde il focus (A2).

## Valutazione Finding

### Dettaglio dell'intervento: X1

#### X1: Residuo di X1 dell'iterazione 1: con Riprova, o cambiando lo stato dopo l'errore, la lettura riparte senza dati e la pagina dice di nuovo 'Nessuna domanda di SRD01 per lo stato area programmazione scelto' con 'Modifica i filtri', mentre l'avviso sparisce
- **Verdetto**: ACCETTATO
- **Motivo**: verificato.
  - La guardia di `NessunaDomanda` esclude solo `senzaRisposta`, cioe' `isError && data === undefined` (`DettaglioIntervento.tsx:101`,
    `shared/lib/dettaglio.ts:21-23`). Il commento di :96-98 dice invece "solo se tutte le letture fatte hanno risposto".
  - Con Riprova la query senza dati torna `status: 'pending'` con `error: null` (`fetchState`, query-core 5.101.3,
    `build/modern/query.js:411-420`). `keepPreviousData` non da' un segnaposto, perche' la lettura non ha mai avuto dati.
  - Per tutto il nuovo tentativo:
    - l'avviso perde l'errore (`ErroreDellaLettura`, `shared/ui/pagina/Dettaglio.tsx:40`);
    - lo stato resta 'dati' (`giaRisposte` vero, due letture coi dati);
    - `senzaDomande` scarta il conto undefined (`lib/intervento.ts:54-56`) e la pagina afferma il vuoto.
  - In esercizio `soloTransitori` riprova un 503 CAPACITA_ESAURITA fino a tre volte, con Retry-After (`nuovi-tentativi.ts:9, 15-28`).
    Il vuoto puo' durare secondi.
  - Cambiando lo stato dopo l'errore, TX-0026 e TX-0028 tengono il segnaposto dello stato di prima e TX-0027 riparte senza: il
    vuoto si dice per lo stato nuovo con dati vecchi.
  - Il test del fix (`interventi/page.test.tsx:273`) prova solo lo stato d'errore, col client di test senza retry.
  - E' la regola che il fix accettato dichiarava ("Il vuoto si dice solo se tutte le letture fatte hanno risposto coi dati"), ma lo
    snippet del fix la scriveva piu' stretta. Il difetto e' del fix, non della sua esecuzione.
  - E' un percorso transitorio con l'avviso che ricompare se il tentativo fallisce: MINORE, come X1 dell'iterazione 1.
- **Severita' finale**: MINORE

### Pagine degli stati: V1 e A1 deduplicati

#### V1: Pagine degli stati: 'Filtra la tabella', il percorso da tastiera introdotto dal fix V2, cambia la tabella per intervento sotto la card senza dirlo; anche la voce tolta dal fix X2 sparisce in silenzio
- **Verdetto**: ACCETTATO (assorbe A1)
- **Motivo**: verificato.
  - `Filtra` chiama solo `onFiltra(chiave)` (`comuni.tsx:111-119`), che e' `onVoce` (`StatiDomande.tsx:104`). L'esito e' altrove:
    - il chip nel gruppo "Filtro della tabella dal grafico", un `role=group` senza regione live (:76);
    - le righe filtrate della tabella per intervento, dopo la card (:105-113).
  - Il focus resta sul pulsante. Nel procedurale e nel kit della tabella non c'e' nessuna regione `role=status` o `aria-live`
    (grep su `src/features/procedurale` e `src/shared/ui/tabella`).
  - Il reset di X2 (:124) toglie chip e filtro senza avviso.
  - Il progetto ha gia' la regola per la stessa interazione: `useFiltroDalGrafico` (`ElencoDomande.tsx:88-107`), nata da V-18
    dell'elenco, accettato MINORE.
  - Il test del fix (`stati-sostegno/page.test.tsx:114`) controlla il DOM, non il riscontro. Lo chiedeva il fix di V2
    dell'iterazione 1, che fissava solo il gruppo e le righe.
  - WCAG 4.1.3 (NFR-70, i test axe sono `wcag22aa`). Il mouse vede il chip; da tastiera e col lettore di schermo il canale nuovo
    non dice nulla. Lo stesso filtro resta col clic, e l'ordinamento e' un'alternativa parziale: MINORE, come V-18.
- **Ritocco del fix.** La regione sta in `PaginaStati`, sempre montata fuori da `VistaQuery`, e il testo sta in `lib/stati`.
  - Dice la voce e quante righe restano.
  - Col chip tolto si svuota, perche' il focus va gia' sull'h1.
  - Col reset di X2 dice che il filtro della voce e' tolto.
- **Severita' finale**: MINORE

#### A1: "Filtra la tabella" (fix di V2) filtra una tabella lontana senza un messaggio di stato e con il focus fermo sul pulsante; anche la voce tolta da sola (fix di X2) sparisce senza avviso
- **Verdetto**: DUPLICATO di V1 (assorbito): stessa riga, stessa causa, stesso modello dell'elenco. L'annuncio del reset di X2 entra
  nel fix di V1. Non accolgo `aria-pressed` (vedi "Finding contestati").
- **Severita' finale**: vedi V1

### Kit della tabella: A2

#### A2: Riepilogo: con l'intestazione sticky su due righe (fix di H5) una riga col focus puo' finire tutta sotto il thead del contenitore che scorre, perche' manca lo scroll-padding (WCAG 2.4.11)
- **Verdetto**: ACCETTATO
- **Motivo**: la misura e' fondata nei dati che si leggono; l'effetto sul focus non si verifica in sola lettura.
  - **Cosa si legge.**
    - Il contenitore scorre (`tema.css:216`, `overflow: auto`, `max-height: 560px`) e dopo H5 il thead intero e' sticky a
      `top: 0` (:222).
    - Nel riepilogo, l'unica tabella con i gruppi, il resoconto ha misurato le due righe dell'intestazione a 9-46 e 46-83 px
      (`correzioni.md:34`): una banda di 74 px.
    - Una riga del corpo e' alta circa 43 px: padding di .65rem sopra e sotto, testo di .9rem (:227). E' focalizzabile, perche'
      `TabellaRiepilogo` passa `onRiga` (`TabellaRiepilogo.tsx:99`) e `Riga` mette `tabIndex=0` (`TabellaInterattiva.tsx:98`).
      Nelle celle ci sono anche i link verso l'elenco.
    - In `src` non c'e' nessuno `scroll-padding` ne' `scroll-margin`.
  - **Perche' il focus si nasconde.** Lo scorrimento del focus non sposta un elemento che sta gia' nella scrollport, anche se un
    elemento sticky lo copre. Risalendo con Maiusc+Tab, l'elemento si allinea al bordo alto, cioe' sotto il thead. Una riga piu'
    bassa della banda resta cosi' coperta per intero.
    - Prima di H5 la banda era di 37 px, meno alta di una riga: la riga restava visibile in parte e il minimo AA era rispettato.
    - E' il caso dei sticky header che l'Understanding di 2.4.11 descrive; la tecnica sufficiente e' C43 (`scroll-padding`).
  - **Severita'.**
    - E' un difetto nuovo, prodotto da un fix accettato.
    - Vale per una sola tabella, e solo risalendo o dopo uno scorrimento col mouse.
    - Il test di H5 controlla la regola del tema, che e' cio' che dichiara.
    - MINORE, come gli altri difetti WCAG di questa feature (V2 e V7 dell'iterazione 1).
  - **Stesso meccanismo, gia' prima.** Un link di una cella (circa 21 px) puo' sparire anche sotto una sola riga d'intestazione
    (37 px): finanziario, elenco e la tabella equivalente degli stati, dove ora ci sono anche i "Filtra la tabella" di V2. Non e'
    nel perimetro come finding a se', ma il fix sul contenitore lo copre, e la verifica lo include.
- **Come verificarlo.**
  - Lo strumento e' la misura in Chromium headless del resoconto di H5 (Playwright con `executablePath` della 1208, tema con
    `addStyleTag`).
  - Il caso: riepilogo con 10 righe e piede, contenitore scorso cosi' che una riga stia sotto il thead, poi il focus da tastiera
    su quella riga. Si prova anche Maiusc+Tab risalendo dall'ultima riga.
  - Col tema di HEAD la riga deve risultare coperta per intero (il suo `bottom` non oltre quello del thead). Se non lo e', il
    finding cade: va registrato nel resoconto.
  - Col tema corretto la riga resta visibile almeno in parte.
  - Se lo scorrimento del focus non applica lo `scroll-padding`, il fix ripiega su `scroll-margin-top` sugli elementi
    focalizzabili del corpo.
- **Severita' finale**: MINORE

### Pannello dello stato: A3

#### A3: Residuo di A2 dell'iterazione 1: il pannello propone le voci di TX-0025 con un codice che l'indirizzo non esprime, poi la pagina le scarta in silenzio
- **Verdetto**: ACCETTATO
- **Motivo**: verificato.
  - `VociDelloStato` fa le opzioni con tutte le voci di TX-0025 (`PannelloFiltriProcedurale.tsx:34`), senza `chiaveStatoValida`.
  - "Applica i filtri" scrive lo stato com'e' (`ricercaDaCriteri`, `criteri.ts:52-54`, `scriviRipetuti` senza controllo).
  - L'indirizzo letto lo scarta (`criteriDaRicerca`, :48): la pagina si rilegge senza filtro, senza chip e senza avviso. Riaprendo
    il pannello la casella e' spenta.
  - Il backend accetta i codici osservati come sono nel database. L'ha verificato il Judge dell'iterazione 1 (`StatoOsservato`), e
    il commento di `criteri.ts:26-28` lo ripete.
  - E' lo stesso difetto che A2 dell'iterazione 1 descriveva per il clic sulla barra ("la chiave ... va nell'indirizzo senza
    controllo", poi scartata in silenzio), sul percorso gemello. Il fix ha chiuso il clic (`Panoramica.tsx:99`), non il pannello,
    che vale per i report e per il dettaglio (stesso `GruppoStato`).
  - L'iterazione 1 aveva lasciato facoltativo l'allineamento di `CHIAVE_STATO` al backend perche' cambia la validazione
    dell'indirizzo. L'esclusione dal pannello non la cambia, e non era stata valutata.
  - Serve un codice osservato con lettere accentate o segni come ':', '&', '+'. Non c'e' allargamento (fail-closed) e la barra non
    mostra un filtro falso: MINORE, come A2 dell'iterazione 1.
- **Severita' finale**: MINORE

### Codice comune e struttura dopo le correzioni: H1, H2, H3, H4

#### H1: Residuo di H10: nella scheda Sottofasi del dettaglio e nella scelta delle schede le letture col grant hanno ancora la forma che useLettureColGrant doveva togliere
- **Verdetto**: ACCETTATO
- **Motivo**: verificato.
  - `SottofasiDellIntervento` usa `useAuthStatus` e quattro `puoLeggere` (`SchedeIntervento.tsx:100-107`). `SchedeIntervento`
    ricostruisce il predicato a mano (:163-164).
  - `useLettureColGrant` si dichiara "una forma sola per panoramica, sottofasi e dettaglio" (`navigazione.ts:37-41`).
  - Il fix di H10 nominava tre file, quindi e' un residuo, non un'esecuzione mancata. Sotto soglia e senza effetto sul
    comportamento: COSMETICO, come H2 dell'iterazione 2 dell'istituzionale.
- **Severita' finale**: COSMETICO

#### H2: IntestazioneNonValida del kit ha il dominio scritto dentro: 'Intervento', 'codice di intervento' e l'id 't-intervento', copia delle costanti ID_TITOLO delle due feature
- **Verdetto**: ACCETTATO, con il fix scelto fra le due vie
- **Motivo**: verificato.
  - Il componente scrive "Intervento" nelle briciole (`shared/ui/pagina/Dettaglio.tsx:29`), il titolo "Intervento non valido" con
    l'id `t-intervento` (:30) e "non è un codice di intervento" (:32).
  - L'id ripete `ID_TITOLO` di `procedurale/ui/DettaglioIntervento.tsx:40` e `istituzionale/ui/DettaglioIntervento.tsx:34`.
  - Con grep e' l'unico codice di `shared/ui` e `shared/lib` con un oggetto di business nel testo.
  - Le props sono quelle del fix di H1 dell'iterazione 1: la scelta del layer viene da quel fix.
  - E' lo stesso metro di H2 dell'iterazione 1 (`rigaDellIntervento` fuori da `shared/lib`, MINORE). Qui pero' e' solo testo e un
    id locale alla pagina, che non rompe nulla se diverge: COSMETICO, come dichiara la lente.
- **Fix scelto.** Il componente va in `entities/filtri/ui`, accanto a `codiceDelPercorso`, con una costante `ID_TITOLO_INTERVENTO`
  esportata e usata dai due dettagli. E' la via (2) della lente, la stessa scelta di H2 dell'iterazione 1. La via (1), props
  generiche nel kit, sposterebbe i testi "Intervento" nelle due feature, di nuovo duplicati.
- **Severita' finale**: COSMETICO

#### H3: Il ramo senzaAzione di legameIgnoto e' irraggiungibile: inAttesa esclude senzaAzione prima di chiamarlo, e la regola e' scritta due volte
- **Verdetto**: ACCETTATO
- **Motivo**: verificato.
  - `legameIgnoto` ha `if (p.senzaAzione) return profiloIgnoto` (`useFiltriProgrammaNellIndirizzo.ts:55`). L'unica chiamata e'
    dopo `!p.senzaAzione &&` (:68), quindi il ramo non gira mai.
  - Il comportamento e' giusto e il test L2 di H3 resta valido: e' codice morto, COSMETICO.
  - Delle due vie della lente scelgo la prima: tolgo il ramo e restringo il tipo a `ConAzione`. TypeScript restringe gia' `p` dopo
    `!p.senzaAzione` (:66).
- **Severita' finale**: COSMETICO

#### H4: Dopo V2 la prop link delle card ricopia il tipo LinkDellaVoce appena esportato da ui/comuni, e il suo doc non vale piu' per CardStati con onFiltra
- **Verdetto**: ACCETTATO
- **Motivo**: verificato.
  - `PropsCardDistribuzione.link` scrive a mano la firma (`CardDistribuzioni.tsx:29`) del tipo `LinkDellaVoce` (`comuni.tsx:84`).
  - Il doc di :28 dice che senza link c'e' la tabella generata, ma `CardStati` con `onFiltra` ha `TabellaVoci` anche senza link
    (:64).
  - La testata del file (:4-7) lega "Filtra la tabella" al grant dell'elenco.
  - E' doc e tipo: COSMETICO. Nel fix aggiungo la testata del file.
- **Severita' finale**: COSMETICO

## Riepilogo

- Accettati: 8 finding distinti.
  - MINORE 4: X1, V1, A2, A3.
  - COSMETICO 4: H1, H2, H3, H4.
- Assorbiti come duplicati: 1 (A1 in V1).
- Rigettati: 0.
- Declassati: 0. Tre fix sono ritoccati o scelti fra piu' vie (V1, H2, H3); A2 ha il metodo di verifica e il ripiego.
- Punteggio (`review-score.sh FULL review/procedurale-findings-iter2.json`, eseguito): 100 - 4x3 - 4x1 = **84**, con 0 CRITICO e 0
  MAGGIORE. Il verdetto e' **PASS** (soglia FULL 80).
- I finding accettati sono **residui da correggere dopo il verdetto**, non da chiudere cosi'. Il PASS non li assorbe: vanno fatti
  tutti, come per fisico e istituzionale.

## Finding contestati

**CRITICO rigettati**: nessuno, perche' non c'erano finding CRITICO in ingresso.

Parti di finding che non accolgo, o che toccano scelte gia' fatte:
- **A1, `aria-pressed` su "Filtra la tabella".** Non lo accolgo: il pulsante non e' un interruttore, e premerlo di nuovo non toglie
  il filtro. `aria-pressed=true` annuncerebbe uno stato che il clic non inverte. La voce attiva la dicono il chip e la regione di
  stato del fix di V1.
- **V1, l'annuncio col chip tolto.** Col chip tolto la regione si svuota e basta: il focus va gia' sull'h1 (`togliLaVoce`), che
  dice la pagina.
- **A2, il valore.** La misura non si verifica in sola lettura. La severita' MINORE e' mia, con la verifica e il ripiego su
  `scroll-margin-top` scritti nel fix. Se la misura col tema di HEAD non mostra la riga coperta per intero, il finding cade.
- **A3, l'alternativa di `CHIAVE_STATO`.** Resta facoltativa, come nell'iterazione 1: cambia la validazione dell'indirizzo.
- **H2, la via (1).** Non la scelgo: rimetterebbe i testi dell'intervento nelle due feature.
- **X1 e V1, la provenienza.** X1 nasce dallo snippet del fix di X1 dell'iterazione 1, piu' stretto della regola che dichiarava.
  V1 nasce dal test che il fix di V2 chiedeva, che guardava solo il DOM. Sono difetti dei fix, non delle correzioni.
- **D1, D2 e gli effetti dichiarati nel brief.** Nessun finding li contesta, e il codice resta coerente con le registrazioni.

## Decisioni da chiedere all'utente

Nessuna. Il verdetto e' meccanico (PASS, score 84), e gli otto finding accettati sono residui da correggere dopo il verdetto.
- Non c'e' una scelta fra artefatti approvati in conflitto.
- Nessun fix tocca wireframe, uiplan, route-table, route-manifest o deviazioni registrate.
- La regione di stato di V1 attua la nota WCAG gia' approvata del flusso stati (tabella equivalente come canale accessibile), e
  non cambia il wireframe.
- Lo `scroll-padding` di A2 cambia solo dove si ferma lo scorrimento del focus, in tutte le tabelle.

## Residui da correggere dopo il verdetto

In commit separati, uno per finding, su `main`. Dettagli dei fix in `review/procedurale-findings-iter2.json`; ogni test nuovo o
cambiato va provato rosso senza la correzione.
1. **X1** (MINORE): la guardia del vuoto del dettaglio su ogni lettura senza dati, con il test di Riprova trattenuto e la variante
   col cambio di stato. File: `src/features/procedurale/ui/DettaglioIntervento.tsx:96-103`,
   `src/pages/procedurale/interventi/page.test.tsx`.
2. **V1** (MINORE): la regione di stato delle pagine degli stati, per la voce scelta e per quella tolta. File:
   `src/features/procedurale/ui/StatiDomande.tsx:119-134`, `lib/stati.ts`, `tests/procedurale-lib.test.ts`,
   `src/pages/procedurale/stati-sostegno/page.test.tsx:82, 114`.
3. **A3** (MINORE): il pannello senza le voci non esprimibili, con la nota. File: `lib/criteri.ts`,
   `src/features/procedurale/ui/PannelloFiltriProcedurale.tsx:30-42`, `tests/procedurale-lib.test.ts`, `tests/procedurale-ui.test.tsx`.
4. **A2** (MINORE): lo `scroll-padding-top` dei contenitori, con la misura in Chromium prima e dopo. File:
   `src/shared/ui/tema.css:216`, `tests/kit-comune-procedurale.test.tsx`.
5. **H1** (COSMETICO): `useLettureColGrant` nella scheda Sottofasi e nella scelta delle schede. File:
   `src/features/procedurale/ui/SchedeIntervento.tsx:99-110, 163-164`.
6. **H2** (COSMETICO): `InterventoNonValido` in `entities/filtri/ui` con `ID_TITOLO_INTERVENTO`, usato dai due dettagli. File:
   `src/shared/ui/pagina/Dettaglio.tsx`, `src/shared/ui/index.ts`, `src/entities/filtri`, i due `DettaglioIntervento.tsx`, i test.
7. **H3** (COSMETICO): via il ramo morto di `legameIgnoto`. File: `src/entities/filtri/ui/useFiltriProgrammaNellIndirizzo.ts:53-57`.
8. **H4** (COSMETICO): `link?: LinkDellaVoce` e i doc delle card. File: `src/features/procedurale/ui/CardDistribuzioni.tsx:4-7, 28-29`.

## Note per il giro di correzione

- Nessun wireframe da riapprovare, nessuna modifica a uiplan, route-table, route-manifest, stato, backend o plugin.
- Le approvazioni sha256 sono invalidate, quindi dopo i fix va rieseguito lo step8 (11/11):
  - procedurale per tutti i finding;
  - **tutte e cinque le feature** per A2, che tocca il tema del kit;
  - anche istituzionale per H2 (dettaglio dell'intervento);
  - anche finanziario per H3 (hook comune dei filtri).
- Devono restare verdi:
  - per A2, i test del tema di H5 e quelli delle tabelle di tutte le feature (cambia solo lo scorrimento del focus);
  - per H2, i test dei due dettagli senza modifiche (stesso DOM, stesso id del titolo);
  - per H3, il test L2 di H3 in `tests/entita-filtri-ui.test.tsx` e i test X-03 del finanziario;
  - per H1, i test delle schede e quello delle 30 righe di `tests/eslint-regole.test.ts`;
  - per V1, i test di `stati-sostegno` e `stati-pagamento`, compreso axe (la regione e' `visually-hidden`).
- Lo stato dello step9 lo registra la sessione principale con `state-set.sh`, dopo `review-score.sh`; questo Judge non lo tocca.
