# Judge, review step9 FULL della feature procedurale, v1 iterazione 1

Perimetro: `git diff 09a2595 099f8da`, cioe' la feature procedurale (step2-7) e gli spostamenti e le estensioni nel codice comune
fatti per lei, che toccano anche finanziario, elenco operativo, fisico e istituzionale. Intensita' FULL: e' la prima review della
feature e la feature ha authz e scoping (P4 col perimetro ADA). Ho verificato ogni finding in sola lettura sul codice HEAD
(d5f7739, 23/10/2026), con Read, grep e git show/diff, e sul backend (`cruscotto-lazio-be`) dove un finding ne dipendeva. Fra
099f8da e d5f7739 cambiano solo gli stati, i report del gate e il brief: `git diff --stat 099f8da HEAD -- src tests` e' vuoto.
Non ho lanciato npm, build o test.

Finding in ingresso: 28 (lente V 8, lente H 11, lente A 5, antagonista 4).

## Gate non declassabili (pre-Judge)

- **Fedelta' authz.** Ho rieseguito i due script in sola lettura, con `CLAUDE_PLUGIN_ROOT` del plugin green-fe e `tools/vendor`
  in testa al PATH. FAIL_AUTHZ non scatta.
  - `check-ui-authz.sh plan/procedurale/route-manifest.json plan/procedurale/uiplan.json handover`: rc 0, 8 route, 32 azioni,
    nessun failure.
  - `fe-project-check.sh . --built --feature procedurale --catalog handover/authz-catalog.json`: rc 0, pass. Lo stesso script
    senza `--feature` ora e' pass: i 9 `link_target_not_mounted` della review dell'istituzionale sono spariti con le route montate.
  - Nessuna regressione authz nelle altre feature: `check-ui-authz.sh` e' pass per finanziario (9 route, 25 azioni), fisico (2,
    3), istituzionale (3, 7) ed elenco operativo (3, 6). Lo step8 a d5f7739 e' 11/11 per tutte e cinque le feature.
  - La visibility delle otto voci di `route-table.json` e' la `roles` dello uiplan, verbatim; ogni lettura della route ha la sua
    azione hide-by-role col grant verbatim del catalogo.
  - Nel catalogo p1, p2, p3-funzionario-area-pro e p4 hanno tutti e nove i grant (TX-0024..TX-0032), gli altri profili nessuno.
    Nessuna riga CONFLICT, nessun marker `enforcement-pending` nello stato della feature.
  - Ogni lettura parte solo con `puoLeggere`, cioe' `hasGrant` col grant verbatim (`lib/grant.ts:9-36`). Lo provano
    `panoramica/page.test.tsx:148-159` (col solo TX-0026 nessun'altra lettura e TX-0025 mai letta), `interventi/page.test.tsx:193`,
    `sottofasi/page.test.tsx:96` e `procedurale-ui.test.tsx:103`.
  - TX-0025 nel dettaglio (V1, A3): la lettura parte solo con `csr.tx-0025.read` (`useCriteriNellIndirizzo.ts:36`), lo stesso hook
    provato senza grant nella panoramica, e il backend la protegge con `@RolesAllowed(CSR_TX_0025_READ)` (`ProceduraleResource`).
    Manca solo la dichiarazione nello uiplan e nel manifest della route. E' una lacuna di tracciabilita', non un allargamento ne'
    una transazione scoped senza gate: non e' FAIL_AUTHZ. E' MINORE, con la decisione D1.
  - Il perimetro del P4 lo risolve il backend dal grant (`perimetri.perimetroPer(grant)`, `ConsultaProceduraleService`): la UI
    mostra solo il perimetro della risposta e nessun parametro lo cambia.
  - I link verso l'elenco richiedono `csr.tx-0056.read` (`GRANT.elencoDomande`) e sono fail-closed su codice e chiavi di stato
    (`lib/collegamenti.ts:101-109`).
- **`contextProjection` usata come sicurezza.** Non c'e' nessun uso ne' nel procedurale ne' nel codice comune toccato. Resta solo in
  `shared/api/auth/stato.ts`, dichiarata security-inert e fuori perimetro. Nessun CRITICO imposto.
- **CSRF.** Il perimetro non tocca il mutator BFF: in `shared/api` cambia solo `mock/server.ts`.
  - `X-Requested-With` resta fisso nel mutator (`bff-mutator.ts:42`).
  - I sette export passano da `customInstance` del client generato (`generated/procedurale/procedurale/procedurale.ts:48`) e i
    test guardano l'header: `procedurale-api.test.tsx:95-100`, `ammesse/page.test.tsx:98`, `riepilogo/page.test.tsx:113`,
    `stati-sostegno/page.test.tsx:112`, `unit-amount/page.test.tsx:80`.
  - `/api/procedurale/` entra nella coda comune delle letture (`tetti-letture.ts:13`). Nessun CRITICO.
- **Regola data-access del `judge-brief.md`.** Riguarda jOOQ e CallableStatement del backend, quindi qui non si applica.
- **Nessun finding CRITICO o MAGGIORE in ingresso.**

## Valutazione Finding

### TX-0025 nel dettaglio non dichiarato: V1, A3 deduplicati

#### V1: Il dettaglio dell'intervento legge TX-0025, che la route dello uiplan, il route-manifest e il wireframe approvato non dichiarano
- **Verdetto**: ACCETTATO (assorbe A3). La correzione e' la decisione D1.
- **Motivo**: verificato.
  - Cosa fa il codice: il dettaglio usa `useCriteriDellaPagina('soloStato')` (`DettaglioIntervento.tsx:186`). Con 'soloStato'
    `conStato` e' vero, quindi col grant parte `useStatiAreaProgrammazione` (`useCriteriNellIndirizzo.ts:35-38`). Il test di
    `interventi/page.test.tsx:84` sceglie nel pannello "Revocata (stato osservato fuori catalogo)", una voce di TX-0025.
  - Cosa dichiarano gli artefatti: la route ha le transactions TX-0024 e TX-0026..TX-0032, senza TX-0025
    (`plan/procedurale/uiplan.json:157`). Lo stesso vale per le otto azioni di `route-table.json:444` e del manifest, e per la nota
    delle transazioni del wireframe (`intervento.html:69`).
  - Lo stesso wireframe pero' mostra il chip "Stato area programmazione: Ammessa" con la descrizione (`intervento.html:52`), che
    viene solo da TX-0025. Le altre pagine dello stato dichiarano TX-0025; le Unit Amount, che non hanno lo stato, no, e il codice
    non lo legge (`conStato` falso). Nell'istituzionale anche la lettura dei valori del dettaglio (TX-0060) e' fra le transactions.
  - Il privilegio non si allarga (vedi i gate). Severita' come il precedente X2 dell'istituzionale: MINORE.
- **Severita' finale**: MINORE

#### A3: Il dettaglio dell'intervento legge TX-0025, che il route-manifest e lo uiplan della route non dichiarano: l'oracolo authz non lo vede
- **Verdetto**: DUPLICATO di V1 (assorbito): stessa riga, stessa causa. La via del refresh dello uiplan proposta da A3 e' la
  raccomandazione di D1.
- **Severita' finale**: vedi V1

### Intestazione di riga nascondibile: V7, A4, H4 deduplicati

#### V7: Tabella delle Unit Amount: l'intestazione di riga (colonna 'Unit Amount') si puo' nascondere da Colonne e le righe restano senza th
- **Verdetto**: ACCETTATO (assorbe A4 e H4)
- **Motivo**: verificato.
  - `TabellaUnitAmount` passa `intestazioneRiga="ua"` (`TabellaUnitAmount.tsx:52`), ma la colonna 'ua' non e' fissa (:27) e
    compare in `SceltaColonne`.
  - Il kit usa `props.intestazioneRiga ?? visibili[0].chiave` (`TabellaInterattiva.tsx:292`): ripiega sulla prima colonna solo se
    la proprieta' manca, non se la colonna e' nascosta. Con 'ua' nascosta nessuna cella e' `th scope=row` (WCAG 1.3.1), nella
    pagina e nella scheda del dettaglio.
  - Il test del kit non copre la colonna nascosta (`tests/kit-comune-procedurale.test.tsx:100`).
  - La parte di H4 sul piede (`i === 0` a :116) e' latente: le tabelle con piede hanno la prima colonna fissa e nessuna
    `intestazioneRiga`. Entra nel fix per coerenza.
  - Serve un'azione dell'utente: MINORE.
- **Severita' finale**: MINORE

#### A4: Con 'Colonne' si puo' nascondere l'intestazione di riga delle Unit Amount: le righe restano senza th scope=row
- **Verdetto**: DUPLICATO di V7 (assorbito): stessa riga, stesso fix nel kit.
- **Severita' finale**: vedi V7

#### H4: intestazioneRiga del kit vale solo per il corpo: il piede resta sulla prima colonna e una colonna nascosta lascia le righe senza intestazione
- **Verdetto**: DUPLICATO di V7 (assorbito). La parte sul piede entra nel fix di V7.
- **Severita' finale**: vedi V7

### "nessuna domanda rilasciata" falso: A2, H7 deduplicati

#### A2: Quando il link non si puo' scrivere (chiave di stato fuori formato) la cella dice 'nessuna domanda rilasciata', che e' falso; la chiave cliccata nella panoramica va nell'indirizzo senza controllo
- **Verdetto**: ACCETTATO (assorbe H7)
- **Motivo**: verificato.
  - La cella `Elenco` (`comuni.tsx:87-92`) scrive "nessuna domanda rilasciata" per ogni indirizzo null con domande > 0.
  - L'indirizzo pero' e' null anche quando `puntoValido` scarta una chiave fuori da `CHIAVE_STATO` (`lib/collegamenti.ts:101-104`,
    `lib/criteri.ts:27`). Per le voci dell'area programmazione, che non hanno non rilasciate (`vociDellArea` mette 0), la frase e'
    sempre falsa.
  - Il backend accetta i codici osservati come sono nel database (`StatoOsservato.java:9`) e li risolve senza distinguere maiuscole
    e minuscole (`FiltroStatoArea.risolvi`, righe 57-61). Il commento di `criteri.ts:25-26` ("il backend risponderebbe 400") non
    vale per loro.
  - Nella panoramica il clic sulla barra dell'area applica la chiave senza `chiaveStatoValida` (`Panoramica.tsx:104`):
    `criteriDaRicerca` poi la scarta e la pagina si rilegge senza filtro, senza chip e senza avviso.
  - Non c'e' allargamento (fail-closed) e serve un codice con segni fuori formato: MINORE.
- **Severita' finale**: MINORE

#### H7: Regole del drill-down scritte nei componenti invece che in lib/collegamenti; una da' un motivo falso nel caso fail-closed
- **Verdetto**: DUPLICATO di A2 (assorbito): il motivo falso e' lo stesso. Le parti strutturali di H7 entrano nel fix di A2:
  `apreLaVoceDellArea` in lib (`Panoramica.tsx:94`, `SchedeIntervento.tsx:87`) e `codiceDellaRiga` in `SchedeIntervento.tsx:85`.
- **Severita' finale**: vedi A2

### Coda delle letture di TX-0024: V6, A5

Ho verificato nel pack e nel backend. `ConsultaProceduraleService` e' `@LetturaLimitata` a livello di classe
(`ConsultaProceduraleService.java:68`; l'annotazione ha `@Target({METHOD, TYPE})` e `@Inherited`), quindi `filtri()` (TX-0024) e
`statiAreaProgrammazione()` (TX-0025) stanno nel tetto per utente. Sono anche `@Audited` (:88, :95). Fuori dal tetto e dall'audit
c'e' solo l'ultimo dato sincronizzato, letto nella risorsa dopo il caso d'uso (`ProceduraleResource.java:97`, D-01 Rev. 2).
SC-PC_CAPACITA vale per "un endpoint GET /api/procedurale/...". La frase di SC-PC_ULTIMO_DATO e di `panoramica.md:108` parla
dell'ultimo dato sincronizzato. Il codice (`tetti-letture.ts:13`) e' giusto.

#### V6: TX-0024 e TX-0025 entrano nel tetto di due letture per utente, che per il wireframe e per SC-PC_ULTIMO_DATO vale fuori dai valori dei filtri
- **Verdetto**: RIGETTATO
- **Motivo**: la premessa e' falsa. TX-0024 e TX-0025 sono nel tetto del backend. Il fix toglierebbe dalla coda due letture che il
  backend conta, e la terza lettura in parallelo avrebbe 503 CAPACITA_ESAURITA. La parte vera di V6, i due commenti che non
  concordano, e' A5, e il commento sbagliato e' quello di `api/index.ts`.
- **Severita' finale**: nessuna

#### A5: Il commento di useValoriFiltri dice che TX-0024 e' fuori dal tetto e dall'audit del backend: e' falso, e porta a toglierla dalla coda comune
- **Verdetto**: ACCETTATO. Prende la parte di V6 sui commenti; il test proposto da V6 entra, nel verso giusto.
- **Motivo**: verificato (`api/index.ts:81-82`). Il commento contraddice il backend e il codice comune. Chi lo seguisse farebbe
  l'errore di V6.
- **Severita' finale**: COSMETICO

### Unit Amount senza pagato: V3, X3 (parti diverse, tenuti separati)

La scelta 8 approvata (`dossier-wireframe.md:50`) mette la nota unica sopra la tabella e il "non disponibile" breve nelle celle,
dove il motivo e' detto vicino (`lib/formato.ts:41`). V3 e X3 sono due punti diversi della stessa regola: dove il motivo e' detto
accanto, il testo va breve; dove non arriva, va completo.

#### V3: Unit Amount senza pagato: la tabella equivalente della card ripete il motivo completo in ogni cella, contro la scelta 8 approvata
- **Verdetto**: ACCETTATO
- **Motivo**: verificato.
  - Con `pagatoSenzaFonte` la tabella della card usa le celle di `percentuale()`, cioe' `testoMotivato`, il motivo completo in due
    colonne per riga (`lib/grafici.ts:202, 220-223`).
  - La card lo dice gia' subito sopra: "Grafico non disponibile: nessuna Unit Amount ha ancora l'importo pagato (...)"
    (`unit-amount/page.test.tsx:57`).
  - E' la ripetizione che la scelta 8 toglie. Lo scostamento non e' registrato: MINORE, come il precedente V-07 del finanziario.
- **Severita' finale**: MINORE

#### X3: Anteprima di una Unit Amount senza pagato: dentro il dialogo i tre dati sono 'non disponibile' breve, senza motivo, contro il wireframe approvato
- **Verdetto**: ACCETTATO
- **Motivo**: verificato.
  - Il drawer rende il pagato con `DatoPagato` (`UnitAmount.tsx:44-46`), che usa `assenzaPagato` e quindi la forma breve
    (`TabellaUnitAmount.tsx:19-23`, `lib/unitAmount.ts:32-34`).
  - Il drawer e' un dialogo modale (`PannelloLaterale`): chi lo legge non arriva alla nota della pagina.
  - Il wireframe approvato dell'anteprima mostra il motivo: "non disponibile (fonte non attiva: pagato per Unit Amount)"
    (`unit-amount.html:114`).
  - E' il caso reale di oggi (OP-010), e nessun test apre l'anteprima senza pagato.
- **Severita' finale**: MINORE

### Altri finding

#### X1: Dettaglio: con una lettura in errore e le altre a zero la pagina afferma 'Nessuna domanda di <codice>', uno zero dedotto da un errore
- **Verdetto**: ACCETTATO
- **Motivo**: verificato.
  - `senzaDomande` scarta i conteggi undefined (`lib/intervento.ts:53-56`). Una lettura in errore senza dati conta come assente,
    non come sconosciuta.
  - Il caso: TX-0027 a 503, TX-0026 con la riga dell'intervento a 0 ammesse (TX-0026 ha sempre una riga per intervento,
    SC-PC_AMMESSE) e TX-0028 col totale 0. `statoDelDettaglio` da' 'dati' (`shared/lib/dettaglio.ts:29-33`), e `NessunaDomanda`
    (`DettaglioIntervento.tsx:119-128`) scrive "Nessuna domanda di SRD01 nei report procedurali.". Con lo stato scelto propone
    anche "Modifica i filtri".
  - Contraddice la regola approvata delle assenze (mai uno 0 inventato).
  - Il test di :227 mette in errore TX-0026 con sostegno e pagamento a 3, quindi non prende il caso.
  - E' un percorso degradato con l'avviso della pagina presente: MINORE, come H1 dell'istituzionale.
- **Severita' finale**: MINORE

#### V2: Pagine degli stati: il filtro della tabella sulla voce (scelta 4) si attiva solo col clic del mouse su una barra
- **Verdetto**: ACCETTATO
- **Motivo**: verificato.
  - Il clic imposta la voce (`StatiDomande.tsx:103`), filtra la tabella (:106) e mostra il chip (:111).
  - La tabella equivalente, che lo uiplan chiama "il canale accessibile" (`uiplan.json:1300`) e il kit "il percorso da tastiera
    del clic" (`CardGrafico.tsx:121-124`), ha solo "Apri nell'elenco" (`comuni.tsx:95-104`). Senza `csr.tx-0056.read` e' quella
    generata, senza azioni (`CardDistribuzioni.tsx:51`).
  - Da tastiera la scelta 4 approvata non si ottiene (WCAG 2.1.1, NFR-70).
  - Nella panoramica il percorso da tastiera c'e': il link "Apri gli stati ..." della card e il pannello per lo stato.
  - Resta l'ordinamento per colonna come alternativa parziale: MINORE.
- **Severita' finale**: MINORE

#### X2: Pagine degli stati: la voce scelta dal grafico resta nello stato quando sparisce dalla risposta; chip e filtro della tabella scompaiono senza avviso e poi ricompaiono da soli
- **Verdetto**: ACCETTATO
- **Motivo**: verificato.
  - La voce e' stato di `PaginaStati` (`StatiDomande.tsx:119`) e torna a null solo col bottone del chip.
  - `ReportStati` la cerca fra le voci del totale (:92). Gli altri stati ci sono solo con domande (`lib/stati.ts:41`, fixture :170),
    quindi con un altro filtro `scelta` diventa undefined: chip e filtro spariscono senza che la pagina lo dica.
  - Tornando ai filtri di prima ricompaiono senza un'azione dell'utente.
  - Il test di `stati-sostegno/page.test.tsx:66` usa una voce di SR-01, che non sparisce mai.
- **Severita' finale**: MINORE

#### X4: Riepilogo in vista Tabella: le colonne di una voce senza fonte (In compilazione) dicono 'non disponibile' e nessun punto della pagina dice perche'
- **Verdetto**: ACCETTATO
- **Motivo**: verificato.
  - Le colonne delle voci rendono `domandeDellaVoce` con `numero()` (`TabellaRiepilogo.tsx:26, 53`). `domandeDellaVoce` scarta
    motivo e fonte (`lib/riepilogo.ts:35-37`), quindi ogni cella e il piede dicono solo "non disponibile".
  - Il wireframe approvato vuole "Valori assenti in testo col motivo" (`riepilogo.md:34`, `riepilogo.html:126`), e nella vista
    Tabella nessun testo lo dice.
  - La colonna e' a scelta da Colonne: MINORE.
- **Severita' finale**: MINORE

#### V4: Stato vuoto 'Nessun intervento nella tua area (perimetro ADA)': gli interventi sono dati di programma; il test lo prova con una risposta che il backend non produce
- **Verdetto**: ACCETTATO
- **Motivo**: verificato.
  - `testoVuoto` aggiunge il suffisso ADA a qualunque soggetto (`lib/formato.ts:32-34`), anche a "Nessun intervento"
    (`Panoramica.tsx:117`, `DomandeAmmesse.tsx:50`, `Riepilogo.tsx:91`).
  - Per SC-PC_SCOPE_P4 il P4 vede gli interventi del perimetro ufficiale e le sole domande della sua ADA. Le righe vuote nascono
    solo dai filtri, e allora il testo attribuisce l'assenza al perimetro.
  - I wireframe approvati dicono "Nessun intervento per i filtri scelti." (`panoramica.html:198`, `ammesse.html:162`,
    `riepilogo.html:145`).
  - Il test di `panoramica/page.test.tsx:249-256` usa `{ perimetro: 'ADA', righe: [] }`, che il backend non produce. Il caso reale
    del P4 (righe a zero) non ha un test di pagina.
- **Severita' finale**: MINORE

#### A1: Dettaglio dell'intervento: col perimetro ADA (P4) i testi del vuoto e della barra parlano di tutte le domande, senza dire l'ADA
- **Verdetto**: ACCETTATO
- **Motivo**: verificato.
  - `NessunaDomanda` (`DettaglioIntervento.tsx:119-128`) non guarda il perimetro, che pure c'e' (:192). Al P4 dice "Nessuna domanda
    di SRD01 nei report procedurali." anche quando l'intervento ha domande in altre ADA.
  - Le pagine dei report usano la regola di `testoVuoto` col perimetro. Nessun test del dettaglio usa una risposta ADA.
  - La pill ADA in evidenza attenua: MINORE.
  - E' complementare a V4 e ha la stessa regola: il suffisso ADA solo e sempre per i soggetti che contano domande.
- **Severita' finale**: MINORE

#### V8: Schede del dettaglio: il nome accessibile del PNG non dice l'intervento, a differenza del wireframe approvato
- **Verdetto**: ACCETTATO
- **Motivo**: verificato.
  - Nelle schede Stati e Area il titolo della card non ha il codice (`SchedeIntervento.tsx:73, 88`) e `pulsantiDellaCard` chiama il
    PNG "il grafico <titolo>" (`CardGrafico.tsx:66-73`). CSV e XLSX dicono "... di SRD01" (`oggettoDati`).
  - Il wireframe approvato vuole "Scarica il grafico Domande di sostegno per stato di SRD01 in PNG" (`intervento.html:103, 114`).
  - La scheda Sottofasi ha la stessa forma (`CardSottofasi.tsx:78`).
  - Il precedente e' X3 dell'istituzionale, WCAG 2.4.6: MINORE.
- **Severita' finale**: MINORE

#### V5: Dettaglio: AT001 e un intervento fuori dal CSR resi come 'senza dati', mentre il wireframe approvato prevede il 400 reso come errore; il test simula un 200 vuoto
- **Verdetto**: ACCETTATO, con la correzione cambiata. La correzione e' la decisione D2.
- **Motivo**: verificato, ma il codice e' quello giusto.
  - Il wireframe dice "Intervento fuori dal CSR o AT001: 400 del backend" (`intervento.html:70`).
  - Il backend invece risponde 200 senza righe. Per AT001 vale "nessun filtro la seleziona, neanche col suo codice"
    (`FiltroFinanziario.java:18-19`, `ConsultaFinanziarioServiceTest.java:203-204`). Per un codice sconosciuto `CriteriValidi.filtro`
    non controlla l'esistenza, e `r.interventi(...)` non trova righe.
  - Quindi `SENZA_DATI` con la nota su AT001 (`lib/intervento.ts:59`) e il test col 200 vuoto (`interventi/page.test.tsx:256`)
    seguono il contratto del pack.
  - Il fix proposto da V5 (togliere AT001 dal testo o allinearlo al wireframe) andrebbe nel verso sbagliato. Resta una deviazione
    obbligata dal wireframe approvato, non registrata: come X2 dell'istituzionale, MINORE.
  - Un 400 del dettaglio (per esempio `?stato=` sconosciuto) e' reso come errore della pagina, ma senza un test dedicato.
- **Severita' finale**: MINORE

#### H5: La riga delle intestazioni di gruppo (colgroup) e quella delle colonne sono entrambe sticky a top: 0 e si sovrappongono quando la tabella scorre
- **Verdetto**: ACCETTATO
- **Motivo**: verificato.
  - `.ui-tabella thead th` e' sticky a `top: 0` (`tema.css:222`) e ora vale per le due righe del thead (`TabellaInterattiva.tsx:48,
    66-68`). La regola nuova di :221 non cambia `top`.
  - Nel contenitore di 560px (:218) la riga delle colonne copre i gruppi, e i `td` vuoti della riga dei gruppi scorrono via.
  - Succede nel riepilogo (10 righe per pagina, link e piede). E' un difetto visivo nuovo di un'estensione del kit: MINORE.
- **Severita' finale**: MINORE

#### H8: Il meccanismo 'presto' e' codice irraggiungibile e i suoi test passano a vuoto
- **Verdetto**: ACCETTATO
- **Motivo**: verificato.
  - Con `AREE_FUTURE = []` (`aree.ts:118`) sono irraggiungibili `CardAreaFutura` (`home.tsx:70`), `AreaFutura` (`menu.tsx:43`) e gli
    stili `presto` (`tema.css:83-84, 361`).
  - `tests/app-aree.test.tsx:130-132` filtra una lista vuota e il ciclo di :152 non itera.
  - Il resoconto (punto 4) lascia la scelta aperta. Gli ambiti sono quattro e chiusi (`ChiaveAmbito`), quindi raccomando di
    togliere il meccanismo.
  - Il precedente del test che non prova cio' che dichiara, senza rischio, e' MINORE (A2 del fisico).
- **Severita' finale**: MINORE

#### H1: Lo scheletro del dettaglio dell'intervento e' ricopiato dall'istituzionale; PaginaConFiltri non accetta una testata di dettaglio
- **Verdetto**: ACCETTATO, con il fix ristretto
- **Motivo**: verificato.
  - Le parti ripetute:
    - `InterventoNonValido`: procedurale :60-72, istituzionale :50-61;
    - `senzaRisposta`: :91 e :129;
    - `ErroriDelleLetture`: :94-99 e :135-139;
    - lo switch di `CorpoDettaglio`: :147-150 e :153-157;
    - il wrapper con `codiceDelPercorso`: :214-218 e :190-194.
  - Sono circa 20 righe quasi uguali, fra le soglie di 15 e 30: MINORE, come H6 dell'istituzionale.
  - Lo slot testata di `PaginaConFiltri` "nei due dettagli" non vale per l'istituzionale, che non ha `BarraFiltri` ne' pannello
    (`BarraRiferimenti`): resta facoltativo e solo per il procedurale.
- **Severita' finale**: MINORE

#### H2: rigaDellIntervento, che lavora sul campo di dominio codiceIntervento, e' finito in shared/lib
- **Verdetto**: ACCETTATO
- **Motivo**: verificato (`shared/lib/dettaglio.ts:37-39`). Con grep e' l'unica funzione di `shared/lib` e `shared/ui` che conosce un
  campo di business. Cinque import nell'istituzionale e nel procedurale, e il test in `tests/istituzionale-lib.test.ts:252-253`.
  Il layer sbagliato e' lo stesso metro di H5 dell'istituzionale: MINORE.
- **Severita' finale**: MINORE

#### H6: barreRaggruppate ha ora sei parametri posizionali (soglia 5) e il procedurale ha due rese diverse delle barre orizzontali
- **Verdetto**: ACCETTATO
- **Motivo**: verificato.
  - La funzione ha sei parametri (`shared/lib/grafici/forme.ts:145-152`) e chiamate con `[]` di riempimento
    (`procedurale/lib/grafici.ts:224`).
  - `graficoStati` e `barreOrizzontali` scrivono a mano l'asse con `axisLabel { width: 180, overflow: 'break' }` e
    `grid.containLabel` (:86-88, :99-101), deprecato in ECharts 6.1.0 (`@deprecated Use grid.outerBounds`, versione installata
    6.1.0). `assiBarre` non manda a capo le etichette (:118-122).
  - La soglia dei parametri vale MINORE.
- **Severita' finale**: MINORE

#### H10: Piccole copie nella feature: cella numerica con l'assenza, etichette del pagato, letture col grant, pulsanti del pannello
- **Verdetto**: ACCETTATO, con il fix ristretto
- **Motivo**: verificato.
  - La cella numerica e' scritta tre volte con due regole: `n === null` in `TabellaStatiInterventi.tsx:19` (una distribuzione
    assente scrive "-"), `n == null` in `TabellaRiepilogo.tsx:26` (il badge), e `comuni.tsx:70-72`.
  - `ETICHETTE_PAGATO` (`UnitAmount.tsx:32`) e `TITOLI_PAGATO` (`TabellaUnitAmount.tsx:16`) sono la stessa mappa.
  - Tre `useLetture` hanno tre forme (`Panoramica.tsx:37-47`, `Sottofasi.tsx:29`, `DettaglioIntervento.tsx:47-55`).
  - Ognuna e' sotto soglia: MINORE, come H7 dell'istituzionale.
  - `PannelloDelloStato` (`PannelloFiltriProcedurale.tsx:69`) non e' una copia esatta: `Azioni` di `entities/filtri` porta anche la
    regola dell'azione portante, che con `valori` assente e' inerte. Resta facoltativo.
- **Severita' finale**: MINORE

#### H11: SchedeIntervento supera la soglia di 30 righe (32)
- **Verdetto**: ACCETTATO
- **Motivo**: verificato (`SchedeIntervento.tsx:144-175`, 32 righe, quattro volte lo schema `schede.includes(id) && <TabPanel>`).
  La soglia di 30 righe vale MINORE, come H4 del fisico. Il limite di eslint e' 60 (`eslint.config.js:385`).
- **Severita' finale**: MINORE

#### H3: Il procedurale spegne la regola dell'azione portante dando un falso conValori al hook comune: l'estensione senzaAzione non arriva al hook
- **Verdetto**: DECLASSATO
- **Motivo**: verificato.
  - `conValori: false` e `valori: SENZA_LEGAME` sono costruiti a mano (`useCriteriNellIndirizzo.ts:29, 41`) contro il contratto del
    parametro (`useFiltriProgrammaNellIndirizzo.ts:30-31`). Il doc di `valori` dice ancora TX-0060 (`PannelloFiltriProgramma.tsx:69`).
  - Il comportamento pero' e' giusto: i criteri del procedurale non hanno mai `azione` (`soloProgramma`, `lib/criteri.ts:35-39`),
    quindi `inAttesa` e il legame sono inerti.
  - Resta un contratto aggirato e un doc da correggere: COSMETICO.
- **Severita' finale**: COSMETICO (da MINORE)

#### H9: Dopo lo spostamento resta un testoPerimetro omonimo nell'elenco con un contratto diverso da quello del kit
- **Verdetto**: DECLASSATO
- **Motivo**: verificato.
  - C'e' un adattatore omonimo (`elenco-operativo/lib/formato.ts:46-48`) con l'alias `testoPerimetroDelKit` (:7) e cinque usi
    (`pill.tsx`, `voci.ts`, `ElencoDomande`, `ElencoPagamenti`, `SchedaDomanda`).
  - Per ADA e REGIONALE i due danno lo stesso testo. TypeScript ferma la maggior parte degli scambi: il kit rifiuta null,
    l'adattatore risponde `string | null`.
  - E' il residuo di uno spostamento: COSMETICO, come H2 dell'istituzionale.
- **Severita' finale**: COSMETICO (da MINORE)

## Punti dichiarati dal resoconto

- **Pagine senza letture dei report.** Il catalogo e' tutto o niente: p1, p2, p3-pro e p4 hanno i nove grant, gli altri nessuno.
  Nessun profilo vede una pagina senza sezioni, e il menu non la propone. Stringere la visibility cambierebbe lo uiplan approvato
  senza un caso reale. Non e' un finding. Se un profilo nuovo avesse i soli valori dei filtri, servirebbe uno stato "nessun report
  per il tuo profilo".
- **`AREE_FUTURE` vuota.** E' H8: raccomando di togliere il meccanismo.
- **Rese del punto 5.**
  - Nomi dei link con le non rilasciate: il testo visibile apre il nome accessibile (`collegamenti.ts:156-163`; test
    `stati-sostegno/page.test.tsx:60-63`), come vuole `stati.md:65`. Non e' un finding.
  - PNG delle schede senza "di <codice>": e' V8.
  - Voci fuori catalogo e stati osservati (`lib/stati.ts:41, 50`; pannello `lib/criteri.ts:97-101`): coerenti con OP-PR-09. Non e'
    un finding.
  - Intestazioni brevi col nome completo nel bottone (`lib/stati.ts:66-79`, `TabellaInterattiva.tsx:74`): sono il residuo
    dichiarato da `stati.md:90-91`. Non e' un finding.
  - Clic sulla barra solo del mouse: nelle pagine degli stati e' V2; nella panoramica il percorso da tastiera c'e'.
  - Tabella equivalente delle Unit Amount col motivo in ogni cella: e' V3. Il drawer, il caso opposto, e' X3.
  - File da card e tabella: e' l'intero report (scelta 7). Nel riepilogo lo stesso file ha due nomi (`domande-per-intervento-tx-0029`
    dal grafico, `riepilogo-per-intervento-tx-0029` dalla tabella), dal titolo della card o della tabella come nel finanziario. Non
    e' un finding.
- **Letture del dettaglio.**
  - TX-0026..TX-0028 servono a testata, KPI e prima scheda, che e' aperta all'apertura della pagina. Area, Sottofasi e Unit Amount
    leggono quando si aprono (react-aria monta solo il pannello scelto; test `interventi/page.test.tsx:147, 170, 182`). Il "le schede
    caricano i dati solo quando si aprono" di `intervento.html:69` e' rispettato. Non e' il caso di X2 dell'istituzionale, dove si
    leggevano all'apertura anche le schede non iniziali.
  - Le due correzioni di b2da5c5 ci sono: i dati di prima con l'avviso (`mantieniDati`, :51-53, 154-155; test :68), e nessuna
    attesa senza i grant della pagina (`useStatoDelCorpo`, :168-172; test :193).
- **Dev server con le letture di prova.** Il worker parte solo in DEV e fuori dal mode `be` (`app/main.tsx:23-24`), ed eslint lo
  consente ad `api/mock`. I dati sono quelli degli scenari: non e' un finding.
- **OP-PR-06..OP-PR-09**: informativi, come da brief.

## Riepilogo

- Accettati: 23 finding distinti, di cui 21 senza cambi di severita' e 2 declassati. Fra i 21, V5 ha la correzione cambiata, H1 e
  H10 quella ristretta.
  - MINORE 20: X1, V1, V2, A2, X2, V7, X3, X4, V3, V4, A1, V8, V5, H5, H8, H1, H2, H6, H10, H11.
  - COSMETICO 3: A5, H3, H9.
- Assorbiti come duplicati: 4 (A3 in V1, A4 e H4 in V7, H7 in A2).
- Rigettati: 1 (V6).
- Declassati: 2 (H3 e H9 da MINORE a COSMETICO).
- Punteggio atteso (`review-score.sh FULL`): 100 - 60 - 3 = **37**. Il verdetto e' **FAIL** per lo score sotto 80. Non restano
  CRITICO ne' MAGGIORE.
- Per convergere, con i 3 COSMETICO ancora aperti si possono lasciare al piu' 5 MINORE (score 82). Chiudendo anche i COSMETICO se ne
  possono lasciare 6 (score 82).
  - V1 e V5 si chiudono con la decisione dell'utente (D1 e D2): V5 senza cambiare il codice.

## Finding contestati

**CRITICO rigettati**: nessuno, perche' non c'erano finding CRITICO in ingresso.

Parti di finding che non accolgo o che ho corretto:
- **V6**, rigettato per intero. La premessa e' smentita dal backend: TX-0024 e TX-0025 sono `@LetturaLimitata` e `@Audited`. Il fix
  porterebbe al 503 CAPACITA_ESAURITA. Il commento sbagliato e' A5.
- **V5**, il verso del fix. Il testo su AT001 e il 200 vuoto seguono il backend; si registra la deviazione dal wireframe (D2).
- **H3, H9**, declassati a COSMETICO con i motivi sopra.
- **H4**, la parte sul piede. E' latente, ma entra nel fix di V7 per coerenza.
- **H1**, lo slot testata di `PaginaConFiltri` "nei due dettagli". Non vale per l'istituzionale: resta facoltativo, solo per il
  procedurale.
- **H10**, la parte su `PannelloDelloStato`. Non e' una copia esatta: resta facoltativa.
- **A2**, l'allineamento di `CHIAVE_STATO` al dominio del backend. E' la correzione alla radice, ma cambia la validazione
  dell'indirizzo: resta facoltativa accanto al fail-closed col motivo giusto.

## Decisioni da chiedere all'utente

- **D1, TX-0025 nel dettaglio dell'intervento** (V1, assorbe A3; `useCriteriNellIndirizzo.ts:36`; flusso panoramica).
  - Il problema: il dettaglio legge TX-0025 col suo grant per il chip con la descrizione e per le voci del pannello. E' la resa del
    wireframe approvato (`intervento.html:52`), ma lo uiplan (`uiplan.json:157`), il route-table e il manifest della route non la
    dichiarano. Lo uiplan e' un artefatto approvato.
  - **Raccomandazione**: aggiornare lo uiplan dal canale del plugin (`green-fe:refresh`, oppure lo step1 per la sola route), con
    TX-0025 e RF025 fra le transactions di `/procedurale/interventi/:codice` e la `roles` invariata. Cosi' la visibility non si
    allarga: un profilo coi soli valori dei filtri non vede il dettaglio.
    - Poi in `route-table.json` l'azione `{ operationId: 'TX-0025', gating: 'hide-by-role', grant: 'csr.tx-0025.read' }`, il
      manifest riproiettato con lo step6 e `check-ui-authz.sh` rieseguito.
    - Lo uiplan non ha un hash d'approvazione nello stato (i gate dello step1 sono i sei `wireframe_*`). Il wireframe non cambia,
      perche' mostra gia' il chip da TX-0025: non serve riapprovarlo.
  - Alternativa: il dettaglio non legge TX-0025 (`conStatiArea` falso per 'soloStato'). Il chip mostrerebbe la chiave
    ("AMMESSA") e il pannello le sole voci dell'indirizzo, contro il chip "Ammessa" e il pannello del wireframe approvato. Non la
    raccomando.
- **D2, AT001 e interventi fuori dal CSR nel dettaglio** (V5; `lib/intervento.ts:59`; flusso panoramica).
  - Il problema: il wireframe approvato dice "400 del backend, reso come errore" (`intervento.html:70`). Il backend risponde 200
    senza righe (`FiltroFinanziario.java:18-19`) e la pagina dice "senza dati" con la nota su AT001: e' il comportamento giusto, ma
    la deviazione non e' registrata.
  - **Raccomandazione**: registrare con `state-set.sh` nei `deviations_reviewed` del gate `wireframe_panoramica` la voce: "AT001 o
    un intervento fuori dal CSR: il backend risponde 200 senza righe (D-08 del finanziario), non 400; il dettaglio lo dice come
    senza dati con la nota su AT001; un 400 del backend resta un errore col messaggio del problem-type".
    - Il codice non cambia e non serve riapprovare il wireframe.
    - Non correggere `intervento.html`: cambierebbe l'hash e il flusso andrebbe riapprovato.
    - Facoltativo: un test del dettaglio con le tre letture a 400 DATO_NON_VALIDO.

## Note per il giro di correzione

- Ordine consigliato:
  1. X1, A1 e V4: i testi del vuoto e le assenze, nel dettaglio e nelle pagine (stessa regola del perimetro ADA);
  2. A2 con le parti di H7, X2 e V2: stati e link;
  3. X3, V3 e X4: le assenze delle Unit Amount e del riepilogo;
  4. V7 e H5, nella tabella del kit;
  5. V8, in `CardGrafico`;
  6. la struttura: H1, H2, H6, H10, H11;
  7. H8, il meccanismo "presto";
  8. D1 e D2 dopo la scelta dell'utente;
  9. per ultimi i COSMETICO: A5, H3, H9.
- Ogni modifica invalida le approvazioni sha256 del gate. Prima della iterazione 2 bisogna rieseguire lo step8 (11/11) del
  procedurale. Con D1 servono anche lo step6 (`route_manifest_valid`) e `check-ui-authz.sh`.
- Alcuni fix toccano il codice comune o le altre feature, e allora va rifatto anche lo step8 di finanziario, fisico, istituzionale
  ed elenco operativo:
  - V7: `TabellaInterattiva` del kit, usata da tutte;
  - H5: `tema.css`;
  - V8: `CardGrafico` del kit;
  - H1 e H2: `shared/ui/pagina`, `entities/filtri` e il dettaglio dell'istituzionale;
  - H3: il hook comune dei filtri di `entities/filtri`, usato da finanziario, fisico e istituzionale;
  - H6: `barreRaggruppate`, chiamata da finanziario, fisico e istituzionale;
  - H8: Home, menu, `tema.css` e `tests/app-aree.test.tsx`;
  - H9: l'elenco operativo.

  I loro test devono restare verdi.
- Nessun fix tocca i file dei wireframe. D2 cambia solo i `deviations_reviewed`. D1 cambia lo uiplan e il route-table, non i
  wireframe.
- Regressioni di finanziario, fisico, istituzionale ed elenco operativo: nessuna lente ne ha segnalate, e le mie verifiche non ne
  mostrano.
  - `TabellaInterattiva` senza `gruppo`, `nomeEsteso` e `intestazioneRiga` rende come prima.
  - `barreRaggruppate` ha l'orizzontale facoltativo, falso di default.
  - L'authz delle quattro feature e' pass e lo step8 e' 11/11 a d5f7739.
