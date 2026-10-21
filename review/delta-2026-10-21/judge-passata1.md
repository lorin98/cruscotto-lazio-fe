# Judge, review step9 FULL sul delta FE 14/10-21/10/2026, passata 1

Perimetro: `git diff 88f0069 HEAD -- src tests wireframes uiplan.json plan specs` (HEAD 602e80b), feature `finanziario` ed
`elenco-operativo`, intensita' FULL. Ho verificato ogni finding sul codice HEAD in sola lettura (Read, grep, git show).

Finding in ingresso: 19 (lente V 8, lente H 5, lente A 2, antagonista 4).

## Gate non declassabili (pre-Judge)

- Fedelta' authz: `check-ui-authz` e `fe-project-check --built --catalog` sono verdi (rieseguiti dalla lente A). Anche
  `fe-gate-report.json` del 21/10 da' `authz` pass. FAIL_AUTHZ non scatta.
- `contextProjection` usata come sicurezza e CSRF disattivato nel mutator BFF: il delta in `src` non tocca
  `contextProjection`, il mutator, `X-Requested-With`, `withCredentials` ne' `innerHTML` (grep sul diff). Nessun CRITICO
  imposto.
- La regola data-access del `judge-brief.md` (jOOQ/CallableStatement) riguarda il backend e qui non si applica.

## Valutazione Finding

### Previsione di pagamento si'/no (D-11): V1, H3, A2 deduplicati

#### V1: D-11: nessun test prova che la previsione di pagamento si rende come si'/no; l'asserzione aggiunta per la previsione e' vuota
- **Verdetto**: ACCETTATO (assorbe H3 e A2)
- **Motivo**: verificato. Le righe 537-539 di `tests/finanziario-casi-limite.test.tsx` passano sempre, perche'
  `getAllByText('non disponibile')` trova gia' la voce "Anno delle domande" (riga 534). Il titolo di
  `tests/finanziario-ui.test.tsx:1944` promette il si'/no ma il test controlla solo la nota della fonte, che con la resa a
  importo usciva identica. Nessuna fixture valorizza `previsionePagamentoEsercizio` (`fixture.ts:156`,
  `esempio.ts:268`: solo FONTE_NON_ATTIVA). I casi si', no e NON_VALORIZZATO di D-11, approvata dall'utente, non sono
  provati, e nessun test di interfaccia rende un "no".
- **Severita' finale**: MAGGIORE. Il brief ammette MAGGIORE per "un test che non prova cio' che dichiara", e qui sono
  due test sulla modifica centrale del delta. Le lenti H e A davano MINORE. Lo distinguo da X4 perche' quell'asserzione
  passa qualunque cosa renda la colonna. Il rischio che ne resta e' basso: la factory `siNoMotivato` e' provata su
  `includeTopUp` e il tipo del campo e' controllato in compilazione.

#### H3: L'asserzione sulla previsione di pagamento si'/no (D-11) e' vacua, e nessun test prova il ramo con il valore
- **Verdetto**: DUPLICATO di V1 (assorbito). La sua forma attesa della cella (`'non disponibilefonte previsione di pagamento non attiva'`) entra nel fix di V1.
- **Severita' finale**: vedi V1

#### A2: L'asserzione sulla previsione di pagamento (D-11) e' vuota: getAllByText('non disponibile') trova sempre altre celle
- **Verdetto**: DUPLICATO di V1 (assorbito). La sua nota e' corretta: il caso FONTE_NON_ATTIVA e' coperto da
  `verifica-smp/page.test.tsx:33`.
- **Severita' finale**: vedi V1

### Verifica SMP: resa e struttura

#### V2: Le colonne si'/no della verifica SMP sono allineate come numeri, mentre il wireframe riapprovato il 19/10 toglie ui-num proprio alla previsione
- **Verdetto**: ACCETTATO
- **Motivo**: `colonna()` (`VerificaSmpReport.tsx:31`) imposta sempre `numerica: true`, per cui `TabellaInterattiva`
  mette `ui-num` su th e td (righe 36, 65). Il diff di 2767efe su `wireframes/sigc/verifica-smp.html:95,99` toglie
  proprio `ui-num` alla colonna della previsione.
- **Severita' finale**: MINORE

#### H1: La resa di ConteggioFinanziario e SiNoFinanziario sta nel componente del report, con un tipo locale e un Importo finto, invece che nell'entity importo
- **Verdetto**: ACCETTATO
- **Motivo**: verificato. Il tipo `Motivato<T>` (riga 27) e `assenza` (riga 37) costruiscono un Importo fittizio, e le
  due factory (righe 39-49) ripetono lo stesso ramo. E' la terza forma a mano di {valore, motivo, fonte}, dopo
  `ImportoLike` e `ValoreMotivato<T>`. Si tratta di duplicazione sotto soglia, non di un errore di resa: riusare la resa
  dell'importo assente e' la regola approvata.
- **Severita' finale**: MINORE

#### H2: Nessun controllo statico fra la forma scritta a mano dei dati motivati e ConteggioFinanziario/SiNoFinanziario della spec
- **Verdetto**: ACCETTATO
- **Motivo**: verificato. `ui/contratto.ts` del finanziario non ha voci per i due tipi nuovi, mentre l'elenco ha
  `CONTRATTO_SUPERFICIE` e `CONTRATTO_RESPONSABILE`. `Motivato<T>` ha tutti i campi facoltativi: se la spec rinominasse
  `motivo`, il DTO generato (`ConteggioFinanziario` con fonte, motivo e valore obbligatori nullable) resterebbe
  assegnabile grazie agli altri campi. E' la guardia gia' stabilita da H-17 e H-24, che manca sui campi nuovi.
- **Severita' finale**: MINORE

#### H4: Costruttori dei dati motivati ricopiati fra mock, fixture e test
- **Verdetto**: ACCETTATO
- **Motivo**: `dato` e `nv` compaiono in `testing/fixture.ts:8-9`, poi di nuovo in `verifica-smp/page.test.tsx:36-37` e
  scritti in linea in `finanziario-casi-limite.test.tsx:524`. Il mock ha `euro` e `dato` paralleli (`esempio.ts:21,25`).
  La duplicazione riguarda solo i test.
- **Severita' finale**: COSMETICO

#### V8: Nel wireframe sigc riapprovato restano due menzioni della 'previsione e spesa' come grafico
- **Verdetto**: ACCETTATO
- **Motivo**: `sigc.md:21` ("Card previsione e spesa (barre)") e `sigc.md:50-51` contraddicono la riga 30 e l'HTML.
  Il codice segue l'HTML. Si corregge alla prossima riapprovazione del flusso, perche' una modifica adesso invaliderebbe
  l'hash.
- **Severita' finale**: COSMETICO

### Riepilogo per intervento aperto sul grafico (cb79f67)

#### X1: La verifica e2e della CSP si rompe con il riepilogo che parte dal grafico: cerca la riga della tabella appena aperta la pagina
- **Verdetto**: ACCETTATO
- **Motivo**: verificato staticamente. `e2e/csp.spec.ts:198-199` apre `/finanziario/riepilogo` senza state nella history
  e clicca subito la riga "Apri l'anteprima dell'intervento SRA01". Con `salvata ?? 'grafico'` (`RiepilogoReport.tsx:163`)
  la tabella non e' montata, il clic attende fino al timeout di 60 s (`playwright.config.ts:17`) e il controllo CSP
  sull'anteprima (review v2 N-25) non si esegue. Il README (sezione Deploy: header di sicurezza) indica questo test come
  la verifica della CSP del contenitore. `e2e/` e' fuori dal perimetro del delta e dal gate step8, e l'ultimo cambio del
  file e' anteriore al 19/10. Non ho potuto eseguire l'e2e (sola lettura).
- **Severita' finale**: MAGGIORE (test che non prova piu' cio' che dichiara, su una verifica di sicurezza documentata)

#### X3: Riepilogo aperto sul grafico: dotazione dell'Assistenza tecnica e totali non compaiono finche' non si sceglie la Tabella; wireframe e uiplan non registrano il cambio
- **Verdetto**: ACCETTATO IN PARTE, diviso in X3 (MINORE, decisione D2) e X3-b (MINORE); la parte sulla "scomparsa della
  dotazione AT" e' contestata (vedi sotto).
- **Motivo**: il flusso approvato il 13/10 (`riepilogo.md:17`, `riepilogo.html:66-105`) disegna all'apertura la card
  della tabella, con i totali e la riga AT, e sotto la card del grafico. La pagina oggi si apre sul solo grafico, con
  l'interruttore di pagina. Il flusso non e' stato aggiornato ne' riapprovato (approved_at 2026-10-13 in `uiplan.json`)
  e non c'e' una deviazione registrata, mentre per il sigc si e' riapprovato. Che dotazione AT, totali e link RA003 stiano
  nella sola vista Tabella non e' un difetto nuovo. Il piede della tabella e' dove li mette il wireframe approvato,
  l'interruttore Tabella|Grafico c'era gia' alla review v4 e la vista iniziale a grafico l'ha chiesta l'utente. Resta
  da decidere come allineare il wireframe (D2).
  X3-b: dopo il cambio, all'apertura si vedono insieme l'interruttore di pagina "Tabella | Grafico"
  (`RiepilogoReport.tsx:191-198`) e quello della card "Grafico | Tabella" (`CardGrafico.tsx:30-35`): due bottoni
  "Tabella" in ordine inverso, che aprono tabelle diverse. Prima del 19/10, all'apertura c'era solo il primo.
- **Severita' finale**: X3 MINORE (decisione dell'utente); X3-b MINORE

#### V6: Il sottotitolo del riepilogo descrive la tabella, ma la pagina ora si apre sul grafico
- **Verdetto**: ACCETTATO
- **Motivo**: `report.ts:83` dice "Cerca, ordina, scegli le colonne; clic su una riga per l'anteprima", e all'apertura
  non ci sono ne' ricerca ne' righe. Il testo coincide con `riepilogo.html:63`, quindi va allineato anche il wireframe
  insieme a D2.
- **Severita' finale**: MINORE

#### V5: Riepilogo: i controlli axe passano tutti alla vista Tabella prima di partire, la vista iniziale Grafico non e' mai verificata
- **Verdetto**: ACCETTATO
- **Motivo**: `page.test.tsx:134`, `finanziario-pagine.test.tsx:142` e `finanziario-ui.test.tsx:1039` scelgono la Tabella
  prima di axe, e `shell.test.tsx:419` scansiona col menu aperto. La pagina com'e' all'apertura (gruppo "Vista del
  riepilogo" e CardGrafico) non passa da axe. Il rischio e' basso, perche' CardGrafico e' verificata da axe su altre
  pagine.
- **Severita' finale**: MINORE

#### X4: Il test di regressione di X-01 (ritorno sulla vista Grafico) e' diventato vacuo con il grafico come vista predefinita
- **Verdetto**: DECLASSATO
- **Motivo**: il test non e' vacuo. Sceglie prima la Tabella (riga 344, che la salva) e poi il Grafico: se la scelta
  Grafico non sostituisse quella salvata, il ritorno mostrerebbe la Tabella e il test fallirebbe. I casi che X4 elenca
  (lo state non trasportato da "Torna al riepilogo", `salva()` che non scrive) li coglie il test X-04 (`ritrovato()`,
  righe 323-329), perche' la Tabella si ritrova solo dallo state. Restano un titolo e un commento che promettono piu' di
  quanto il test isoli. X-01 era COSMETICO.
- **Severita' finale**: COSMETICO (da MINORE)

### Elenco operativo: atto di concessione (a9f127d) e mock

#### X2: Atto di concessione: con attoConcessioneDisponibile falso la colonna e la scheda dicono 'nessun atto' per ogni domanda, cioe' un 'no' inventato su una fonte non attiva
- **Verdetto**: ACCETTATO (con decisione dell'utente D1)
- **Motivo**: verificato. `testoAtto` restituisce "nessun atto" (`formato.ts:119`), e lo usano la colonna della vista
  procedurale (`colonne.tsx:24`, visibile per `viste.ts:76`) e la sintesi della scheda (`voci.ts:99`). Il flag e' usato
  solo per il filtro (`PannelloFiltriElenco.tsx:106`). La regola comune D4 del backend (19/10, approvata) dice che senza
  alcun atto nel DB vale FONTE_NON_ATTIVA ATTO_CONCESSIONE; D-02 Rev. 5 rifiuta "senza l'atto" con 400 per non far
  sembrare un dato un elenco vuoto o completo. La scelta approvata del brief vieta il "no" inventato. La pagina pero'
  afferma "nessun atto" riga per riga, e lo si vede nel mock di sviluppo, dove il flag e' falso
  (`esempio.ts:161`). Nel codice "nessun atto" c'era gia' prima del delta, ma il problema nasce dal contratto del 21/10
  (D4, Rev. 5-6) che il delta consuma solo in parte. La scheda non legge TX-0060 e `DomandaElenco` porta l'atto senza
  motivo: correggerla del tutto richiede un campo nuovo nel contratto del backend, quindi una scelta dell'utente.
- **Severita' finale**: MAGGIORE (comportamento concreto contro una decisione approvata e contro la regola delle assenze)

#### V3: Concessione arrivata dall'indirizzo con attoConcessioneDisponibile falso: il pannello la conta e la rimanda, ma non offre un modo per toglierla
- **Verdetto**: ACCETTATO
- **Motivo**: verificato. `conta` include `concessione` (riga 95), `imposta` parte dai criteri che la contengono
  (riga 152) e nel ramo della nota (righe 106-107) non c'e' un controllo per toglierla. Il commento delle righe 104-105
  ("il pannello non manda mai concessione") non vale per un indirizzo che la porta gia'. Il chip si toglie dalla barra
  "Filtri attivi", fuori dal dialogo. Il caso e' di nicchia: un indirizzo condiviso o scritto a mano.
- **Severita' finale**: MINORE

#### V7: Lo stato 'Atto di concessione non disponibile' del pannello non e' nei wireframe approvati di domande e pagamenti
- **Verdetto**: ACCETTATO (con decisione dell'utente D3)
- **Motivo**: `domande.html:110` mostra solo il controllo, `pagamenti.html:88` lo cita fra i filtri, e ne' la nota ne'
  l'analoga delle azioni portanti sono disegnate. Il resoconto `messa-in-regola-step2-7-20261021.md` lo lascia "da
  valutare con l'utente", senza deviazione registrata.
- **Severita' finale**: MINORE

#### V4: Il mock di sviluppo rifiuta concessione su domande e sinottico ma non su pagamenti, contro il contratto e contro il suo stesso commento
- **Verdetto**: ACCETTATO (assorbe A1 e H5)
- **Motivo**: verificato. `rifiutaConcessione` e' applicata alle righe 173 e 177, e l'handler di `/pagamenti`
  (righe 179-181) risponde 200 qualunque sia la query, mentre il commento delle righe 26-27, D-02 Rev. 5 e il backend
  danno 400. Riguarda solo il dev server: i test montano il 400 con `server.use`, quindi il gate non ne e' falsato.
- **Severita' finale**: MINORE

#### A1: Mock di esempio dei pagamenti: ignora concessione e risponde 200, mentre il backend risponde 400
- **Verdetto**: DUPLICATO di V4 (assorbito)
- **Severita' finale**: vedi V4

#### H5: Il mock di esempio scrive a mano il problem-type del 400 sulla concessione e lo applica solo a domande e sinottico
- **Verdetto**: DUPLICATO di V4 per la parte sui pagamenti (assorbito). La parte sull'URN scritto a mano
  (`esempio.ts:29` invece di `PROBLEM_TYPES.DATO_NON_VALIDO`) e' cosmetica, perche' il valore e' identico, ed entra nel
  fix di V4.
- **Severita' finale**: vedi V4

## Riepilogo

- Finding in ingresso: 19. Accettati: 16 voci (X3 diviso in X3 e X3-b), cioe' 3 MAGGIORE, 10 MINORE e 3 COSMETICO.
  - MAGGIORE: V1, X1, X2
  - MINORE: V2, V3, V4, V5, V6, V7, H1, H2, X3, X3-b
  - COSMETICO: V8, H4, X4
- Duplicati assorbiti: 4 (H3 e A2 in V1; A1 e H5 in V4).
- Declassati: 1 (X4, da MINORE a COSMETICO).
- Rigettati: 0. Contestati in parte: 1 (X3).
- Con 3 MAGGIORE il gate di convergenza FALLISCE: servono 0 CRITICO e 0 MAGGIORE (e score >= 80). La passata 2 va
  fatta dopo le correzioni e le decisioni D1-D3 (budget 3).

## Finding contestati

Nessun CRITICO rigettato. Contestazioni parziali, trasparenti per il dev:

- **X3, parte "la pagina si apre senza la dotazione AT, senza totali e senza i link RA003"**: contestata come difetto.
  E' l'effetto diretto della vista iniziale a grafico, chiesta dall'utente il 19/10 e approvata. Dotazione AT e totali
  stanno nel piede della tabella, esattamente dove li disegna il wireframe approvato (`riepilogo.html:89-92`, D-08).
  L'interruttore Tabella|Grafico, con il grafico che non mostra AT001, c'era gia' alla review v4 (PASS). Cio' che il
  wireframe promette e la pagina non mostra all'apertura e' la card della tabella, e la sua assenza e' proprio la scelta
  approvata. Il resto di X3 e' accettato: wireframe non allineato (D2) e doppio interruttore (X3-b). Mostrare la
  dotazione AT anche nella vista Grafico resta un'opzione di D2, non una correzione dovuta.
- **X4, "diventato vacuo"**: inesatto (vedi sopra). Declassato a COSMETICO, non rigettato.
- **X1, proposta di processo** ("includere e2e/ nel perimetro di ogni modifica che cambia la vista iniziale"): e' una
  raccomandazione, non un fix su file. Non entra nel fix di X1, che resta la correzione della riga 199 con l'esecuzione
  dell'e2e.

## Decisioni da chiedere all'utente

### D1 (X2): "nessun atto" quando la fonte dell'atto di concessione non e' attiva
Oggi la vista procedurale e la scheda della domanda dicono "nessun atto" per ogni domanda anche quando nel DB nessuna
domanda ha l'atto (fonte ATTO_CONCESSIONE non attiva, D4 e D-02 Rev. 5-6).
- **(a) Contratto del backend**: `DomandaElenco` porta l'atto col motivo dell'assenza (FONTE_NON_ATTIVA con fonte
  ATTO_CONCESSIONE, oppure NON_VALORIZZATO), come ConteggioFinanziario e SiNoFinanziario di D3 e D15 del 21/10. E'
  un'estensione di D-02 o D4 da far approvare, poi codegen, e il frontend rende colonna e scheda come l'assenza di un
  importo. Costo: riaprire la slice elenco-operativo in green-be (decisione, contratto, test, handover).
- **(b) Solo frontend**: nella vista procedurale, con TX-0060 letto e `attoConcessioneDisponibile === false`, la cella
  dice "non disponibile" con la nota "fonte atto di concessione non attiva". Senza il grant di TX-0060 e nella scheda,
  che non legge TX-0060, resta "nessun atto", con una deviazione registrata in `plan/elenco-operativo/uiplan.json`.
  Copertura parziale.
- **(c) Lasciare "nessun atto"**: si registra la deviazione accettata (nel DB l'atto non c'e' davvero) e X2 si chiude
  senza codice. Resta pero' in contrasto col filtro, che rifiuta "senza l'atto" con 400.
- **Raccomandazione: (a)**. E' l'unica soluzione coerente ovunque (lista, scheda, profili senza TX-0060) con la regola
  comune D4 e con il precedente di D3 e D15. Se ora non si vuole riaprire il backend, (b) come passo provvisorio, con la
  deviazione per la scheda.

### D2 (X3, insieme a V6): wireframe del riepilogo dopo la vista iniziale a grafico
Il flusso `riepilogo` approvato il 13/10 disegna all'apertura la tabella (con totali e riga AT) e poi il grafico. La
pagina oggi si apre sul solo grafico, con un interruttore di pagina che il wireframe non disegna.
- **(a) Aggiornare e riapprovare il flusso**: in `riepilogo.md` (albero dei componenti) e `riepilogo.html`, la vista
  iniziale Grafico con l'interruttore di pagina, totali e riga AT nella vista Tabella e il sottotitolo nuovo di V6. Poi
  riapprovazione dell'utente, come per il sigc il 19/10 (si puo' fare nella stessa sessione di V8).
- **(b) Registrare la deviazione** in `uiplan.json` (vista iniziale Grafico per richiesta dell'utente del 19/10) senza
  toccare il wireframe.
- Opzione aggiuntiva, ortogonale ad (a) e (b): mostrare la dotazione dell'Assistenza tecnica anche nella vista Grafico,
  con una nota sotto l'interruttore. Oggi sta nel solo piede della tabella, come nel wireframe.
- **Raccomandazione: (a), senza l'opzione aggiuntiva**. Il wireframe approvato non descrive piu' cio' che la pagina
  mostra all'apertura, e il canale d'audit usato per il sigc e' la riapprovazione. La dotazione AT resta dove il
  wireframe approvato la mette, a un clic, senza nuovo design. Se l'utente la vuole visibile all'apertura, la si
  aggiunge nella stessa riapprovazione.

### D3 (V7): stato "Atto di concessione non disponibile" nei wireframe di domande e pagamenti
- **(a) Disegnarlo**: in `domande.md` e `pagamenti.md` (o nell'HTML), insieme all'analoga nota delle azioni portanti, e
  riapprovare i due flussi.
- **(b) Registrare la deviazione accettata** in `plan/elenco-operativo/uiplan.json` per le due note condizionali del
  pannello (azioni portanti e atto di concessione).
- **Raccomandazione: (b)**. E' uno stato secondario e condizionale dentro il pannello dei filtri, con lo stesso
  trattamento dell'analoga nota delle azioni portanti, che non e' mai stata disegnata. Riapprovare due flussi per una
  nota costa piu' di quanto informi. Se pero' si sceglie (a) in D2 e l'utente preferisce wireframe completi, la si puo'
  disegnare nella stessa sessione.
