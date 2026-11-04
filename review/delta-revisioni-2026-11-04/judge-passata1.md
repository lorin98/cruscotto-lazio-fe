# Judge: review step9 FULL sul delta delle revisioni del 04/11/2026 (passata 1)

Perimetro: `git diff 304dc1e ff833f7` (wireframe 9f97329; codice f0e36d5 kit, a8c42f8 finanziario, 88eb799 istituzionale,
68bfc12 elenco operativo, f8bd564 test; stati e report 7d2f809, 5f4c8e4, 7daf654, ff833f7). Ho verificato il codice a HEAD
ff833f7. Nel working tree c'e' solo la cartella di questa review, non tracciata. Per i punti sul backend ho letto
`../cruscotto-lazio-be` in sola lettura.

Ingresso: lente V (10 finding), lente H (8), lente A (2), antagonista (5), in tutto 25. In ingresso non ci sono CRITICO.

- **Intensita'**: FULL su tutte e cinque le feature (`review-intensity-fe.sh`: authz e scoping).
- **Cross-model**: `cross_model_review` manca nella config, quindi e' disabled. Salto tracciato.

## 1. Gate non declassabili (prima del giudizio)

- **Data-access type-safe (jOOQ/Oracle)**: non si applica. E' una regola del backend e questo e' un delta di frontend.
- **Fedelta' dell'autorizzazione**: `check-ui-authz.sh` e `fe-project-check.sh --built --catalog` sono passati il 04/11 su
  ff833f7 per tutte e cinque le feature. Nel delta l'unica modifica alle route e' una voce nuova in `src/app/route-table.json`:
  TX-0011 hide-by-role con `csr.tx-0011.read` in /finanziario/dotazione. Il codice la rispetta: `AvvisoImpegnatiDellaSelezione`
  legge solo con `hasGrant(GRANT.riepilogo)`, cioe' `csr.tx-0011.read` (lib/report.ts:21). Nessun FAIL_AUTHZ.
- **`contextProjection` usata come sicurezza, CSRF disattivato**: il delta non tocca `src/shared/api`, il mutator, il CSRF
  ne' `contextProjection`. Non ci sono `dangerouslySetInnerHTML` nuovi.
- **Step8**: 11/11 su tutte e cinque le feature (1758 test, axe 0 su 140 run). Il gate step8 non lancia gli e2e di
  Playwright (`e2e/`): vedi J-03.

Esito: nessun CRITICO imposto dai gate.

## 2. Valutazione dei finding

Ho verificato sul codice tutti i 25 finding. Sono tutti veri, salvo parti di X-05 che ho rigettato perche' descrivono il
comportamento approvato. Unendo i duplicati restano **20 finding finali**, da J-01 a J-20, in
`review/delta-revisioni-2026-11-04-findings-passata1.json`.

### Finanziario

#### J-01: Riepilogo, anteprima e colonne in piu' fuori ordine (V-01)
- **V-01**: ACCETTATO
- **Motivo**: verificato.
  - L'anteprima rende `[...CAMPI_RF011, ...CAMPI_IN_PIU]` (RiepilogoReport.tsx:188). Dopo "Dotazione residua sui pagamenti"
    vengono "di cui stimato", "Pagamenti lordi", "Rettifiche" e "Con rettifiche".
  - Il wireframe riapprovato il 04/11 (riepilogo.html:118-128) mette lo stimato nel dd dell'impegnato FEASR e non, e lordi e
    rettifiche prima del netto. Anche riepilogo.md (R08, righe 85-88, ancora valido) vuole quelle colonne "accanto ai pagamenti
    netti" e lo stimato accanto all'impegnato.
  - La tabella accoda le quattro colonne dopo le residue (riga 126). I test fissano quest'ordine: riepilogo/page.test.tsx:83 e
    finanziario-ui.test.tsx:830.
  - A 304dc1e c'era un solo array `CAMPI` e l'ordine era giusto: e' una regressione del delta.
- **Severita' finale**: MAGGIORE. Il codice tradisce il wireframe approvato lo stesso giorno, e "di cui stimato" scritto dopo
  la dotazione residua porta a leggere male il dato.

#### J-02: Importi SIGC, contrasto dell'etichetta "Pagato" (V-02, H-01, A-01)
- **V-02**: ACCETTATO, e' la base di J-02
- **H-01**: ACCETTATO, unito in J-02
- **A-01**: ACCETTATO, unito in J-02. La severita' passa da MINORE a MAGGIORE.
- **Motivo**: verificato.
  - Le etichette sono testo `COLORI.superficie` (#ffffff) su `COLORI.positivo` (#4e8a1f): sigc.ts:267 e :238. Ho rifatto il
    conto: la luminanza e' 0,199 e il contrasto 4,22:1. Col testo scuro sarebbe 3,86:1.
  - Il tema ECharts (shared/ui/grafici/echarts.ts) non fissa `fontSize` per le etichette, quindi valgono i 12 px predefiniti:
    serve 4,5:1.
  - Il commento di `Segmento.testo` (riga 193) dichiara "contrasto AA".
  - Gli altri tre segmenti passano.
- **Severita' finale**: MAGGIORE. E' una violazione misurata di NFR-70 (WCAG 1.4.3 AA) su un testo visibile, introdotta dal
  delta che fissa colore e sfondo, e il brief chiede proprio di misurare questo contrasto.
  - Ho tenuto la valutazione di V e H, non quella di A. La tabella equivalente non esenta il testo del grafico da 1.4.3.
  - axe non lo vede: il testo e' SVG di ECharts.
  - Nel fix uso #437a1b (5,2:1) o #3d6b18 (6,3:1), ricalcolati. Il colore va scurito sul segmento del solo grafico SIGC, cosi'
    il test esistente "sfondo = colore del segmento" resta vero.

#### J-03: e2e della CSP rotto dal delta (X-01)
- **X-01**: ACCETTATO
- **Motivo**: verificato.
  - e2e/csp.spec.ts:200 clicca il gruppo "Vista del riepilogo" su /finanziario/riepilogo. a8c42f8 ha tolto `InterruttoreVista`
    e `VISTA_RIEPILOGO`, e nel finanziario quel gruppo non esiste piu' (esiste solo nel procedurale). Il clic va in timeout.
  - e2e/csp.spec.ts:156 aspetta "1200" nella card della Home. Con `MIGLIAIA` la card rende "1.200", come gia' corretto in
    tests/anteprime-home.test.tsx:543.
  - Ho cercato in `e2e/` gli altri testi tolti dal delta: non ce ne sono.
- **Severita' finale**: MAGGIORE. Due test della CSP non arrivano piu' a controllare la pagina, e il gate step8 non lo vede.
  E' lo stesso schema di X1 del 21/10, accettato come MAGGIORE. Il campo `feature` e' `comune` (test comuni), ma il finding
  ricade solo sul finanziario.

#### J-04: Importi SIGC, etichetta a destra con spazio proporzionale (V-06, H-07)
- **V-06**: ACCETTATO, unito in J-04
- **H-07**: ACCETTATO, e' la base di J-04
- **Motivo**: verificato.
  - `posizioneEtichettaSegmento(true)` (riga 212) non controlla il bordo destro.
  - `massimoConSpazio` (riga 221) riserva circa un sesto dell'asse. `GRIGLIA_CON_ETICHETTE` (primitive.ts:185) conta solo le
    etichette degli assi.
  - Il taglio e' una stima delle lenti, non osservata nel browser.
  - Il fix "verificare e, se esce, ..." non era azionabile cosi': l'ho riscritto come riserva in pixel con il suo test.
- **Severita' finale**: MINORE.

#### J-05: test dell'avviso degli impegnati (V-04, H-03)
- **V-04**: DECLASSATO da MAGGIORE a MINORE, unito in J-05
- **H-03**: ACCETTATO, unito in J-05
- **Motivo**: verificato.
  - Il test del Riepilogo (page.test.tsx:86) promette "niente avviso se coincidono" ma non lo prova mai: la seconda riga ha gli
    impegnati assenti (`nd('IMPEGNI')`).
  - Il test di Dotazione (revisioni-20261104.test.tsx:38-42) controlla l'assenza della nota appena compare la tabella di
    TX-0002, senza aspettare TX-0011.
  - Nessun test fa fallire TX-0011.
  - Declasso V-04 perche' il comportamento dichiarato e' provato dove sta la regola. Il test di `impegnatiDiversi` (SRG06
    uguale, SRA14 con l'errore del virgola mobile) prova l'esclusione dei casi uguali, e `AvvisoImpegnati` con l'elenco vuoto
    rende null in una riga. Il difetto e' la qualita' dei test di pagina, non un comportamento a rischio. E' coerente con H-13
    del 01/11 ("test inerte che passa senza link", MINORE).
- **Severita' finale**: MINORE

#### J-06: perimetro ADA senza impegnato (V-05)
- **V-05**: ACCETTATO
- **Motivo**: verificato.
  - Nel ramo ADA (spesa.ts:269-271) il grafico disegna il solo pagato, e l'unico motivo dichiarato e' quello della dotazione.
  - Il wireframe (dotazione.html:76) esclude in ADA solo la dotazione.
  - Impegni e pagamenti in ADA sono entrambi dell'area (comuni.tsx:74).
  - Dei due fix proposti tengo quello coerente col wireframe: disegnare l'impegnato.
- **Severita' finale**: MINORE. Riguarda solo il profilo ADA, e il dato resta nelle tabelle della pagina.

#### J-07: "(alla dotazione)" nella cella dell'impegnato FEASR (X-02)
- **X-02**: ACCETTATO
- **Motivo**: verificato. riepilogo.html:96 e' stato aggiunto nel delta del wireframe del 04/11. La resa `colonneImporti`
  (comuni.tsx:122) e `VoceImporto` mostrano solo l'importo.
- **Severita' finale**: MINORE. L'avviso sempre visibile sopra la tabella da' gia' l'informazione; manca il segno sulla riga.

#### J-08: colonne scelte perse al ritorno nel Riepilogo (H-02)
- **H-02**: ACCETTATO
- **Motivo**: verificato.
  - `StatoTabella` (TabellaInterattiva.tsx:221-226) non porta le colonne, e `nascoste` e' stato locale (riga 275).
  - Il Riepilogo e' l'unico uso di `statoIniziale` (RiepilogoReport.tsx:240).
  - Le quattro colonne nascoste all'apertura sono nuove del 04/11, compresa quella col link all'elenco.
- **Severita' finale**: MINORE. Il fix sta nel kit (`comune`), ma l'effetto ricade solo sul finanziario.

#### J-09: testo dell'avviso diverso dal wireframe (V-08)
- **V-08**: ACCETTATO
- **Motivo**: verificato. Il codice (AvvisoImpegnati.tsx:19) scrive "dall'impegnato cofinanziato FEASR e non". riepilogo.html:70
  e dotazione.html:67 scrivono "dall'impegnato FEASR e non".
- **Severita' finale**: COSMETICO

### Istituzionale

#### J-10: stato "nessun file per l'anno scelto" irraggiungibile e pill che dice che il file c'e' (V-03)
- **V-03**: ACCETTATO
- **Motivo**: verificato anche sul backend.
  - `ConsultaIstituzionaleService.verificaSmpNonSigc` risponde con l'ultimo anno con un file solo senza anno. Con l'anno
    risponde sempre l'anno chiesto: `AnniAmmessi.verifica` controlla soltanto che sia fra 2000 e 2100.
  - Lo scenario SC-IS_SMP_NESSUN_FILE vale per una chiamata senza anno e senza alcun file. Dal 04/11 il FE non fa piu' quella
    chiamata.
  - Il wireframe approvato il 04/11 (verifica-smp-non-sigc.html:157-158) ha lo stato "nessun file SMP non SIGC per l'anno
    scelto", che il FE lega a `annoRiferimento === null` (ReportVerifica.tsx:32, SchedeIntervento.tsx:66): con il backend di
    oggi non si raggiunge mai.
  - Con un anno senza file, la pill (VerificaSmpNonSigc.tsx:67) afferma che il file e' di quell'anno.
  - Il test (verifica-smp-non-sigc/page.test.tsx:266-275) prova una risposta che il backend non da', e lo ammette nel suo
    commento.
- **Severita' finale**: MAGGIORE. Lo stato del wireframe approvato non si raggiunge, la pill da' un'informazione sbagliata e
  il test prova uno stato che in esercizio non si raggiunge.
- **Serve una scelta dell'utente e un cambio del backend** (vedi §5).
  - Il FE e' gia' coerente col significato del contratto ("null se nessun file presente"): stato e pill "nessun file" seguono
    `null`.
  - Senza toccare il backend non c'e' un modo affidabile di sapere se l'anno ha un file. Dedurlo dai campi tutti "non
    valorizzato" darebbe un falso "nessun file" quando il file c'e' ma non ha righe per gli interventi filtrati. Leggere senza
    anno per conoscere l'ultimo anno con un file violerebbe la scelta "nessuna lettura senza anno".

#### J-11: scheda non SIGC senza anno, lettura di TX-0016 non provata (V-07, A-02)
- **V-07**: ACCETTATO, unito in J-11
- **A-02**: ACCETTATO, e' la base di J-11
- **Motivo**: verificato.
  - interventi/page.test.tsx:421-428 e istituzionale-ui.test.tsx:358-364 non controllano `lette.verifica`.
  - SchedeIntervento.tsx:94 mostra "Scegli l'anno" anche senza la guardia di DettaglioIntervento.tsx:136.
  - Il fix di A-02 e' il piu' completo: dopo la scelta dell'anno controlla anche la lettura.
- **Severita' finale**: MINORE. La pagina e' provata, e la guardia della scheda e' corretta.

#### J-12: guardia dell'anno fuori dal wrapper api/ (H-04)
- **H-04**: ACCETTATO
- **Motivo**: verificato.
  - `useVerificaSmpNonSigc` (api/index.ts:64) legge con qualunque criterio.
  - Il tipo `CriteriVerifica` (riga 50) dice ancora "assente = l'ultimo con un file".
  - La guardia dell'anno sta in due componenti, mentre per TX-0015 sta nel wrapper (righe 72-79).
- **Severita' finale**: MINORE

#### J-13: rami morti e commento falso dell'anno facoltativo (H-05)
- **H-05**: ACCETTATO
- **Motivo**: verificato. `testoAnnoDiRiferimento` ha un solo chiamante, `vociRiferimenti` (verifica.ts:109), chiamato solo da
  `ReportVerifica`, che e' reso solo con l'anno. `testoAggiornamentoAnno` e' chiamato solo con l'anno (SchedeIntervento.tsx:98).
  Il doc di formato.ts:41-43 cita la card della Home, che non lo usa.
- **Severita' finale**: MINORE (complessita' evitabile e un doc falso)

#### J-14: link "Torna alla verifica SMP non SIGC" senza l'anno (X-05, accolto in parte)
- **X-05**: ACCETTATO IN PARTE. Tengo il link senza anno; rigetto il resto.
- **Motivo**: verificato.
  - Le parti rigettate sono queste:
    1. "Lo stato senza dati non si vede piu' all'apertura" e' la conseguenza approvata della scelta "nessuna lettura senza
       anno": il wireframe intervento.html vuole "Scegli l'anno" senza lettura.
    2. "Dopo l'anno toglie schede e selettore": e' lo stato "intervento senza dati" del wireframe, a livello di pagina. Le righe
       di TX-0016 sono gli interventi selezionati e non dipendono dall'anno (`PostgresReportIstituzionaleAdapter.datiSmpNonSigc`
       usa `codiciSelezionati(filtro)`): con un altro anno il vuoto resta, quindi il selettore non serve.
    3. Il test di AT001 con `conAnno` prova l'unico percorso raggiungibile.
  - Resta un difetto vero, che rientra nel punto del brief "link e indirizzi coerenti". Il link di SenzaDati
    (DettaglioIntervento.tsx:113) va a `PERCORSI.verifica` senza l'anno, che ora la verifica chiede di nuovo. Il link della
    testata della stessa pagina, invece, l'anno lo porta (riga 94).
- **Severita' finale**: MINORE, ridotto al solo link.

#### J-15: "stessa cache della pagina" non vale piu' (V-09)
- **V-09**: ACCETTATO
- **Motivo**: verificato in criteri.ts:107, AnteprimaIstituzionale.tsx:7-8 e plan/istituzionale/uiplan.json:1184. Il
  comportamento e' quello approvato; sono sbagliati solo i testi.
  - Ho spostato la correzione dell'uiplan al prossimo giro che lo risigilla: cambiarlo ora invalida i pin degli step.
- **Severita' finale**: COSMETICO

### Elenco operativo (e kit usato solo dall'elenco)

#### J-16: card della Home con "Righe degli elenchi di liquidazione" (X-03)
- **X-03**: ACCETTATO
- **Motivo**: verificato in aree.ts:150 e home.tsx:53: STRUMENTI non ha Anteprima, quindi i contenuti si vedono sempre.
  - Non e' una didascalia generica del kit, che la scelta del 04/11 lascia fuori perimetro: descrive proprio i pagamenti
    dell'elenco operativo.
  - Il campo `feature` e' `comune` (src/app), ma il finding ricade solo sull'elenco operativo.
- **Severita' finale**: MINORE. E' un testo visibile contrario alla decisione dell'utente.

#### J-17: "1 pagamenti", "1 domande" nella paginazione (X-04)
- **X-04**: ACCETTATO
- **Motivo**: verificato in Paginazione.tsx:29. Il kit `Paginazione` e' usato solo da elenco-operativo/ui/interrogazione.tsx:131,
  perche' TabellaInterattiva ha la sua. Il difetto c'era gia' con "righe" ("1 righe"), ma il delta ha riscritto proprio quel
  testo e il brief chiede le concordanze.
- **Severita' finale**: MINORE

#### J-18: booleano `maschile` e nome dell'elenco ripetuto (H-06)
- **H-06**: ACCETTATO
- **Motivo**: verificato in criteri.ts:292, interrogazione.tsx:102, ElencoPagamenti.tsx:30, :59, :89, :151, esportazioni.ts:18
  e ElencoDomande.tsx:55, :134, :209. Conviene correggerlo insieme a J-17: la tabella dei nomi da' anche il singolare.
- **Severita' finale**: MINORE (duplicazione sotto soglia, accoppiamento grammaticale nella ui)

#### J-19: `maiuscolaIniziale` riscritta in linea (H-08)
- **H-08**: ACCETTATO
- **Motivo**: verificato in Paginazione.tsx:47 e primitive.ts:78. `maiuscolaIniziale` e' esportata da `shared/lib`, come mostra
  l'import di finanziario/lib/riserva.ts:7.
- **Severita' finale**: COSMETICO

#### J-20: wireframe con "Righe per pagina" (V-10)
- **V-10**: ACCETTATO
- **Motivo**: verificato in pagamenti.html:151 e domande.html:249. Ho allargato l'evidenza: anche pagamenti.md:25, :66, :92 e
  domande.md:84, :112 dicono ancora "Righe per pagina". Il codice segue le note della revisione.
- **Rapporto con X-04**: V-10 e X-04 non sono duplicati. Il primo riguarda il testo del wireframe, il secondo la concordanza
  nel codice.
- **Severita' finale**: COSMETICO

### Difetti evidenti mancati

Nessuno. Ho controllato questi punti del brief:
- **Separatore delle migliaia**: nessun `value={formatNumber(...)}` nei campi di input e nessun CSV prodotto dal FE con numeri
  formattati (l'unico testo di file del FE e' l'intestazione del PNG). La card della Home e i test sono gia' aggiornati, salvo
  l'e2e di J-03.
- **Avviso in Dotazione**:
  - si vede solo col grant;
  - in errore non mostra nulla;
  - usa la stessa query (`useRiepilogo(filtri)`) del Riepilogo, quindi con gli stessi filtri non legge due volte;
  - sta sopra il grafico, come nel wireframe.
- **Ritorno al Riepilogo**: lo state della history non porta piu' la vista. Le chiavi validate da `statoTabellaValido`
  coprono anche le colonne nascoste.
- **Anno obbligatorio nella pagina**: nessuna lettura senza anno, e c'e' un test (verifica-smp-non-sigc/page.test.tsx:47). La
  card della Home resta sull'ultimo anno con un file (app-aree.test.tsx:487).

## 3. Riepilogo
- **Accettati**: 25 su 25 in ingresso, uniti in 20 finding finali: 4 MAGGIORE, 12 MINORE, 4 COSMETICO.
- **Rigettati**: nessun finding per intero. Di X-05 ho rigettato tre parti su quattro: due descrivono il comportamento
  approvato e la terza un test corretto.
- **Declassati**: V-04, da MAGGIORE a MINORE.
- **Severita' dei duplicati**: A-01 (MINORE) e' unito al MAGGIORE di V-02 e H-01.

| feature | MAGGIORE | MINORE | COSMETICO | punteggio FULL | verdetto atteso |
|---|---|---|---|---|---|
| finanziario | 3 (J-01, J-02, J-03) | 5 (J-04 ... J-08) | 1 (J-09) | 100 - 45 - 15 - 1 = 39 | FAIL |
| istituzionale | 1 (J-10) | 4 (J-11 ... J-14) | 1 (J-15) | 100 - 15 - 12 - 1 = 72 | FAIL |
| elenco-operativo | 0 | 3 (J-16, J-17, J-18) | 2 (J-19, J-20) | 100 - 9 - 2 = 89 | PASS |
| fisico | 0 | 0 | 0 | 100 | PASS |
| procedurale | 0 | 0 | 0 | 100 | PASS |

Il verdetto lo calcola `review-score.sh FULL` sul file di ogni feature
(`review/delta-revisioni-2026-11-04/<feature>-findings-passata1.json`).
- **Fisico e procedurale**: il delta li tocca solo attraverso il kit (separatore delle migliaia, `forme.ts`, `echarts.ts`), e
  nessun finding ricade su di loro.
- **Finding `comune`**: ricadono ciascuno su una sola feature.
  - J-03 (e2e) e J-08 (TabellaInterattiva) sul finanziario.
  - J-16 (card della Home), J-17 e J-19 (Paginazione) sull'elenco operativo.

## 4. Finding contestati (CRITICO rigettati)
Nessuno: in ingresso non c'erano CRITICO. Per trasparenza, le parti di X-05 rigettate sono motivate in J-14.

## 5. Scelte dell'utente e backend

Un finding chiede una decisione dell'utente e un cambio del backend: **J-10** (V-03). Le alternative sono due.
- **(a) Coerente col wireframe approvato**: si apre un punto per il backend perche' TX-0016, con un anno senza file NOSIGC,
  risponda `annoRiferimento: null`, come gia' dice il contratto ("null se nessun file presente").
  - Il FE resta com'e': stato, pill "nessun file" e didascalia sono gia' legati a `null`.
  - Si riscrive solo il test, su anno=2029 con risposta null.
- **(b) Senza cambiare il backend**: la pill dice l'anno scelto senza affermare che il file c'e' (per esempio "Anno di
  riferimento scelto: aaaa").
  - Lo stato "nessun file SMP non SIGC per l'anno scelto" esce dal wireframe, che va riapprovato.
  - Il test va intitolato su cio' che prova davvero (una risposta null).

Nessun altro finding chiede di cambiare cio' che l'utente ha approvato il 04/11.
- **J-02**: scurisce il verde del solo segmento del grafico SIGC.
- **J-01, J-06, J-07, J-09, J-20**: riportano il codice ai wireframe riapprovati, oppure i wireframe al codice per J-09 e J-20,
  a scelta al prossimo giro di approvazione.
- **J-14**: aggiunge l'anno a un link.
- **Scelte confermate**: restano il tetto D-27 per tutti gli interventi e il limite NFR-06.

## 6. Ordine di correzione consigliato
1. **J-10**: serve prima la scelta (a) o (b), perche' decide se si apre un punto per il backend.
2. **MAGGIORE del finanziario**: J-01 (ordine, coi test), J-02 (colore e test del contrasto), J-03 (e2e, poi `npm run
   test:e2e` registrato).
3. **Insieme nel finanziario**:
   - J-07 con J-09 (cella e testo dell'avviso);
   - J-05 (test dell'avviso);
   - J-04 e J-06 (grafici);
   - J-08 (kit).
4. **Istituzionale**: J-12 con J-13 (stesso refactor dell'anno), J-11, J-14, J-15.
5. **Elenco operativo**: J-18 con J-17 (tabella dei nomi, poi la pill), J-16, J-19, J-20 (wireframe al prossimo giro).

Dopo le correzioni servono lo step8 11/11 sul commit finale, gli e2e della CSP e la verifica nel browser di J-02 e J-04, a
360 px e nel PNG.
