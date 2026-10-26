# Judge: review step9 FULL sul delta delle card della Home (26/10/2026, iterazione 1 di 3)

Perimetro: `git diff d1dfd4b add8b46` (card della Home di fisico, procedurale e istituzionale, kit `AnteprimaArea`,
card del finanziario rifatta sul kit). Codice verificato a HEAD 47dd22f, che rispetto ad add8b46 cambia solo stati, report
del gate e brief. Ingresso: lente V (4 finding), lente H (4), lente A (2), antagonista (3). Nessun CRITICO in ingresso.
Cross-model: `cross_model_review` assente nello stato delle tre feature, quindi disabled (salto tracciato).
Prerequisito: `step8-gate` done per tutte e tre (completed_at 2026-10-26T09:26:22Z), con 11/11 nei report del gate di
tutte e cinque le feature.

## 1. Gate non declassabili (prima del giudizio)

| feature | check-ui-authz.sh | fe-project-check.sh --built --catalog |
|---|---|---|
| fisico | pass (2 route, 3 azioni), rc 0 | pass, rc 0 |
| procedurale | pass (8 route, 33 azioni), rc 0 | pass, rc 0 |
| istituzionale | pass (3 route, 7 azioni), rc 0 | pass, rc 0 |

- **`contextProjection` come sicurezza**: nessun uso. Compare solo in `src/shared/api/auth/stato.ts`, dichiarata
  security-inert, e `projection()` non ha chiamanti. Il delta non la tocca.
- **CSRF del mutator BFF**: il delta non tocca `src/shared/api`. `bff-mutator.ts:37-42` resta armato con
  `withCredentials`, `xsrfCookieName`/`xsrfHeaderName` e `X-Requested-With: XMLHttpRequest`.
- **Grant delle card**: verbatim dal catalogo. Fisico `csr.tx-0018.read`, procedurale `csr.tx-0026.read` e
  `csr.tx-0027.read`, istituzionale `csr.tx-0016.read` (`lib/grant.ts` delle tre feature). Gli hook stanno solo nei figli
  montati dopo `puoLeggere`. Il catalogo conferma che p4 ha TX-0026 e TX-0027 ma non TX-0016 ne' TX-0018, e che p5 ha
  TX-0018 ma non TX-0016, TX-0026 ne' TX-0027.

Esito: nessun FAIL_AUTHZ, nessun CRITICO imposto.

## 2. Verifica dei finding

### A-01 (lente A, MAGGIORE) assorbe V-01 (lente V, MAGGIORE): test "nessuna lettura" senza grant
- **Verdetto**: ACCETTATO, DECLASSATO a MINORE. Feature: comune, quindi in tutti e tre.
- **Verifica**: `tests/anteprime-home.test.tsx:67-72`, `:142-146` e `:205-209` non registrano le richieste e controllano
  solo `altrimenti`. `setup.ts:18` usa `onUnhandledRequest: 'error'`, ma una richiesta non dichiarata viene solo
  rifiutata (`tests/msw-armed.test.ts:19`): la query va in errore e il test resta verde. Il titolo di :67 ("MSW la
  rifiuterebbe") promette quindi una garanzia che non c'e'. Nessun test prova "nessuna lettura di TX-0017": il test di
  :190 da' anche `csr.tx-0017.read` e non registra output-regionale. Lo stesso vale per `tests/app-aree.test.tsx:283-291`.
  Oggi il codice e' corretto: gli hook sono nei figli montati solo col grant.
- **Severita'**: il brief ammette MAGGIORE per un "test che non prova cio' che dichiara". Il precedente piu' vicino
  pero' e' A4 dell'istituzionale (`review/istituzionale/v1-iter1/judge.md:313-321`): era un test di grant che dichiarava
  piu' di quanto provava, su un gate di UX che il backend ridecide con un 403, e fu MINORE. Qui vale lo stesso: senza
  grant il backend risponde 403, non c'e' fuga di dati e il codice e' corretto. MINORE per coerenza. Il fix resta
  obbligatorio, perche' la Home e' fuori dal manifest e questi test sono l'unico controllo.

### A-02 (lente A, MINORE) assorbe V-02 (lente V, MINORE): attesa senza annuncio
- **Verdetto**: ACCETTATO, MINORE. Feature: comune.
- **Verifica**: `AnteprimaArea.tsx:85-87` rende uno scheletro `aria-hidden` senza testo. I tre `home.html` approvati
  (fisico :101, procedurale :100, istituzionale :101) vogliono `role="status"` col testo "Caricamento in corso". Anche
  "Nessuna superficie ammissibile nelle domande." e' `role="status"` nel wireframe (fisico :106), mentre il codice rende un
  `<p>` (`AnteprimaFisico.tsx:21`). La scelta "nessuna regione live" approvata riguarda solo gli errori. Nessun dato
  sbagliato: e' una difformita' a11y dal wireframe, MINORE come A3 dell'istituzionale.

### H1 (lente H, MINORE): NON_DISPONIBILE e numeroDi ridefiniti nel kit
- **Verdetto**: ACCETTATO, DECLASSATO a COSMETICO. Feature: comune.
- **Verifica**: `AnteprimaArea.tsx:10` dichiara lo stesso valore di `shared/lib/grafici/primitive.ts:6`.
  `shared/ui/index.ts:51` lo riesporta, ma fuori dal kit nessuno lo importa. `:43` riscrive `numeroDi`
  (`primitive.ts:12-14`). E' una duplicazione di una riga con una riesportazione senza consumatori: COSMETICO, come H9
  (due fonti dell'ordine degli ambiti) e H2/H3 (riesportazioni e codice senza consumatori) dell'istituzionale.

### H2 (lente H, MINORE): `quota` con due unita' nel kit
- **Verdetto**: ACCETTATO, MINORE. Feature: comune.
- **Verifica**: `AnteprimaArea.tsx:59-60` vuole 0-100, `Kpi.tsx:25-26` vuole 0-1, e il fisico divide per 100 solo per
  il Kpi (`lib/report.ts:73`). Oggi nessun bug. Il nome e' ambiguo su un pezzo del kit usato da quattro card: MINORE come
  H10 dell'istituzionale (stesso nome, significati diversi).

### H3 (lente H, MINORE): cache comune solo per coincidenza dei letterali
- **Verdetto**: ACCETTATO, MINORE. Feature: comune (tocca le tre card).
- **Verifica**: le card passano `{}` (`AnteprimaFisico.tsx:17`, `AnteprimaProcedurale.tsx:16` e `:38`,
  `AnteprimaIstituzionale.tsx:17`). Senza filtri le pagine ottengono oggi `{}` dalle loro pipeline: `filtriDaRicerca`
  aggiunge solo chiavi con valori e `criteriVerifica({}, undefined)` restituisce i filtri. La chiave quindi coincide. I
  test asseriscono solo `query = ['']`, cioe' l'URL e non la chiave. La promessa "stessa cache" dei wireframe e' vera ma
  non protetta.

### X1 (antagonista, MAGGIORE): lettura annullata e rifatta entrando nell'area
- **Verdetto**: ACCETTATO, DECLASSATO a MINORE, con decisione D2. Feature: comune.
- **Verifica**: il meccanismo e' reale.
  - L'hook generato consuma il segnale (`generated/fisico/fisico/fisico.ts:180`).
  - In query-core 5.101.3 una query senza osservatori che ha consumato il segnale fa `cancel({ revert: true })`
    (`query.js:156-166`).
  - Il mutator rifiuta subito il chiamante, ma lascia finire l'HTTP e tiene il posto (`bff-mutator.ts:98-100`, `:241-263`).
  - La coda e' unica e da 2 (`tetti-letture.ts:13`).
  - Effetto: entrando nell'area mentre la lettura della card e' in corso, la pagina rilegge la stessa chiave dietro le
    letture abbandonate.
- **Severita'**: il comportamento del mutator e' una scelta gia' rivista (testata del mutator: review X-02, N-11, N-13)
  e c'era gia' per la card del finanziario. L'effetto e' un'attesa piu' lunga e un calcolo doppio sul backend in una
  finestra di tempo, non un dato sbagliato. La promessa del wireframe ("chi ha gia' aperto la pagina ha gia' il dato, e
  viceversa", `superfici.md:157-158`) vale a lettura finita. Il fix vero tocca il mutator condiviso e ha un costo: senza
  la corsia a bassa priorita', uscendo dalla Home le letture delle card in coda passerebbero davanti a quelle della
  pagina. MINORE, con la scelta fra (a) e (b) all'utente.

### X2 (antagonista, MINORE): contributo ammesso come somma parziale del backend
- **Verdetto**: ACCETTATO, MINORE, con decisione D1. Feature: procedurale.
- **Verifica**: `procedurale/lib/anteprima.ts:35` mostra `totale.contributoAmmesso` quando c'e'.
  - SC-PC_AMMESSE definisce quel totale senza i valori mancanti ("contributo ammesso 800.00 (il valore mancante di S2 non
    entra nella somma)"; SRA01 null NON_VALORIZZATO; "totali: ... ammesso 800.00").
  - Il test `anteprime-home.test.tsx:123` asserisce proprio 800.
  - Il codice e' fedele al pack e alla tabella approvata della card (`panoramica.md`, "Card della Home").
  - Contraddice pero' la regola comune approvata del dossier (`plan/dossier-card-home.md:17-18`: "un'assenza dice il suo
    motivo, mai uno 0 o una somma parziale").
  - Sulla stessa Home le card del finanziario e dell'istituzionale seguono la regola opposta.
- **Severita'**: non e' un errore rispetto al pack (diverso da X-02 del finanziario, dove la somma parziale la calcolava
  il frontend contro SC-FI_DISTRIBUZIONE). E' un conflitto fra due testi approvati, quindi MINORE e la decisione spetta
  all'utente.

### H4 (lente H, MINORE): regola del totale copiata dal finanziario
- **Verdetto**: ACCETTATO, MINORE. Feature: istituzionale.
- **Verifica**: `istituzionale/lib/anteprima.ts:52-70` riscrive `finanziario/lib/aggregati.ts:24-32` (stesso testo,
  `<= 3` in entrambe) e le copie divergono gia'. Con l'insieme vuoto l'istituzionale da' 0 e il finanziario "Non
  calcolabile: nessun intervento nella selezione"; il motivo unico c'e' in una copia sola. Copia di circa 10 righe, sotto
  soglia: MINORE come H7 dell'istituzionale.

### V-04 (lente V, COSMETICO): esempi del dossier con due decimali
- **Verdetto**: ACCETTATO, COSMETICO. Feature: fisico (dossier :38) e istituzionale (dossier :73).
- **Verifica**: `percentuale` arrotonda a un decimale da 1 % in su (`primitive.ts:28-37`), quindi la card mostra "8,1 %"
  e "2,6 %", come il KPI della pagina. Il dossier e i segnaposto "n,nn %" (`home.html:77` del fisico, `:91`
  dell'istituzionale) dicono due decimali. La coerenza con l'ambito e' rispettata e cambia solo il documento.

### X3 (antagonista, MINORE): "anno di riferimento 2025" sopra numeri cumulativi
- **Verdetto**: RIGETTATO (scelta approvata), riportato come decisione facoltativa D3.
- **Motivo**: il codice rende esattamente il testo approvato (`home.html:84`; `verifica-smp-non-sigc.md`, "Card della
  Home": "Riferimento: 'Non SIGC, anno di riferimento aaaa' dall'annoRiferimento della risposta (l'ultimo anno con un
  file)"). La comprensibilita' dell'anno e' gia' dichiarata come RESIDUO umano nello stesso doc. Il testo non contraddice
  il contratto: `annoRiferimento` e' l'anno di riferimento del monitoraggio SMP non SIGC. Per il brief le scelte
  approvate non sono finding. Il rischio di lettura resta una domanda per l'utente (D3).

### V-03 (lente V, MINORE): card del finanziario senza test degli stati d'errore
- **Verdetto**: ACCETTATO, MINORE, come **residuo del finanziario**: tocca solo il finanziario e non entra nei tre file.
- **Verifica**: in tutto il repo nessun test cerca "Dotazione e pagamenti non disponibili in questo momento." o
  "Conteggio non disponibile in questo momento.". Il cambio dichiarato (`AnteprimaFinanziario.tsx:46`: TX-0009 in errore
  con un dato in cache ora da' "non disponibile" con la nota) e' coerente con Spesa (`:26`), con la regola "un errore
  dice che il numero non e' disponibile" e con DomandeSostegno del procedurale. Il comportamento e' accettato, il buco di
  test no.

### Regressioni del finanziario e delle pagine
Nessuna regressione trovata:
- le etichette dei KPI del fisico (`TESTI_KPI`) e del procedurale (`ETICHETTE_KPI`) hanno gli stessi testi di prima
  (diff di `lib/report.ts` e `lib/kpi.ts`);
- `sommaSeCompleta` ed `etichettaDellArea` sono riesportate dal finanziario;
- lo step8 e' 11/11 su tutte e cinque le feature.

## 3. Riepilogo del Judge

- Finding in ingresso: 13. Accettati: 11, di cui uno (V-03) residuo del finanziario. Duplicati assorbiti: 2 (V-01 in
  A-01, V-02 in A-02). Rigettati: 1 (X3).
- Declassati: 3. A-01 e X1 da MAGGIORE a MINORE, H1 da MINORE a COSMETICO.
- Finding contestati (CRITICO rigettati): **nessuno**. In ingresso non c'era nessun CRITICO.

| finding | severita' finale | fisico | procedurale | istituzionale |
|---|---|---|---|---|
| A-01 (+V-01) | MINORE | x | x | x |
| A-02 (+V-02) | MINORE | x | x | x |
| H1 | COSMETICO | x | x | x |
| H2 | MINORE | x | x | x |
| H3 | MINORE | x | x | x |
| X1 | MINORE (D2) | x | x | x |
| X2 | MINORE (D1) | | x | |
| H4 | MINORE | | | x |
| V-04 | COSMETICO | x (:38) | | x (:73) |

## 4. Decisioni per l'utente

- **D1 (X2, procedurale): contributo ammesso con un intervento senza contributo.**
  - (a) Applicare la regola del dossier. La card e il KPI della panoramica dicono quanti interventi con domande ammesse
    non hanno il contributo. Due rese possibili: (a1) "Non calcolabile: manca per N interventi (codici)", come
    l'istituzionale; (a2) il valore del pack con la nota "manca per N interventi". Test sulla fixture SRA01 e open point a
    green-be per le mancanze dentro un intervento (S2), che il frontend non vede.
  - (b) Accettare il totale del pack (SC-PC_AMMESSE). Correggere la frase del dossier (fuori dall'hash) e registrare
    nei `deviations_reviewed` del gate wireframe della panoramica "contributo = somma dei contributi valorizzati".
  - Raccomandata: (a2). Card e panoramica restano uguali al pack e l'assenza si dice; va adattata anche la frase del
    dossier.
- **D2 (X1, comune): lettura della card annullata entrando nell'area.**
  - (a) Le letture delle card non consumano il segnale, con una corsia a bassa priorita' nel mutator e un test L2 con
    trattenuta(). Tocca il mutator condiviso, quindi poi servono lo step8 e la review di tutte e cinque le feature.
  - (b) Accettare il limite ("stessa cache a lettura finita"): registrarlo nei `deviations_reviewed` dei tre gate
    wireframe, oppure togliere "e viceversa" da `superfici.md` alla prossima riapprovazione.
  - Raccomandata: (b) ora, con (a) come miglioramento separato se il ritardo si vede in prova.
- **D3 (X3, istituzionale, facoltativa, fuori punteggio): "Non SIGC, anno di riferimento 2025" sopra numeri cumulativi.**
  - (a) Tenere il testo approvato e chiudere il residuo umano.
  - (b) Un testo nuovo, per esempio "Non SIGC, valori cumulativi (ultimo file SMP non SIGC: 2025)". Va riapprovato il
    flusso verifica-smp-non-sigc (`home.html:84` e il doc) e vanno aggiornati i test `istituzionale-lib.test.ts:431`,
    `anteprime-home.test.tsx:195` e `app-aree.test.tsx:270`.
  - Raccomandata: (b), da fare insieme alla riapprovazione per V-04.
- **D4 (A-02, comune, alternativa minore).**
  - (a) Applicare il wireframe (role=status e testo nascosto): raccomandata, costa poco.
  - (b) Tenere la forma della card del finanziario e registrare la deviazione nei tre gate wireframe.

## 5. Residui del finanziario (fuori dai tre verdetti)

- **V-03** (MINORE) Card del finanziario senza test degli stati d'errore e del cambio dichiarato
  (`src/features/finanziario/ui/AnteprimaFinanziario.tsx:46`). Fix: in `tests/anteprime-home.test.tsx` o in
  `app-aree.test.tsx` i casi TX-0002 in errore (la frase, Domande resta), TX-0009 in errore ("non disponibile" e la nota)
  e TX-0009 in errore dopo un primo dato in cache (stesso QueryClient, refetch con 503: "non disponibile", non il numero
  vecchio).
- I fix comuni A-02, H1, H2 e X1 (con D2 a) cambiano anche la card del finanziario. Dopo le correzioni serve lo step8
  anche del finanziario.

## 6. Verdetti (`review-score.sh FULL review/<f>-findings-card-home.json`)

| feature | CRITICO | MAGGIORE | MINORE | COSMETICO | score | rc | verdetto |
|---|---|---|---|---|---|---|---|
| fisico | 0 | 0 | 5 | 2 | 83 | 0 | PASS |
| procedurale | 0 | 0 | 6 | 1 | 81 | 0 | PASS |
| istituzionale | 0 | 0 | 6 | 2 | 80 | 0 | PASS (sulla soglia) |

Note sul verdetto:
- I tre PASS dipendono dal declassamento di A-01 e di X1 (motivati sopra). Con A-01 MAGGIORE, lettura letterale del
  brief, tutte e tre le feature sarebbero FAIL.
- L'istituzionale e' esattamente sulla soglia di 80.
- I finding accettati restano da correggere dopo il verdetto, come i residui delle review precedenti, in commit
  separati. Poi servono lo step8 di tutte le feature toccate, perche' ogni modifica invalida le approvazioni sha256 del
  gate, e le registrazioni delle decisioni D1, D2 e D4 con state-set.
