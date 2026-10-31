# Judge: review step9 FULL sul delta della card Istituzionale della Home, tabella a confronto (31/10/2026, iterazione 1 di 3)

Perimetro: `git diff dbdd81c a382562`. Sono quattro commit: 5938404 (step1, wireframe riapprovato), 9621d56 (kit
`ConfrontoArea` e interlinea), a753678 e a382562 (istituzionale). Ho verificato il codice a HEAD a382562. Nel working tree
cambia solo `plan/istituzionale/fe-gate-report.json`, cioe' lo step8 di questo giro.

Ingresso: lente V (5 finding), lente H (5), lente A (3), antagonista (5 piu' la contestazione X-C1). In ingresso non ci sono
CRITICO ne' MAGGIORE.

- **Cross-model**: `cross_model_review` manca nella config dello stato dell'istituzionale (e delle altre quattro feature),
  quindi e' disabled. Salto tracciato.
- **Intensita'**: FULL, perche' l'istituzionale ha route con RequireGrant. Il budget della review e' 3 e questa e'
  l'iterazione 1.

## 0. Prerequisito step8 (aperto)

- **Stato attuale.** Nello stato `step8-gate` risulta done con completed_at 2026-10-30T14:13:29Z. E' lo step8 del giro
  precedente (dbdd81c), non di questo delta.
- **Step8 di questo giro, su a382562.** E' caduto:
  - il report nel working tree (`plan/istituzionale/fe-gate-report.json`) ha verdict `fail`, con il solo check `test` in
    fail; gli altri 10 sono pass, compresi `authz` e `wireframe_approved`;
  - secondo il coordinatore sono caduti 4 file di pagine fuori dal delta (`src/pages/finanziario/domande`,
    `finanziario/riepilogo`, `procedurale/interventi`, `procedurale/stati-sostegno`), per attese scadute mentre giravano le
    tre lenti;
  - rilanciati da soli passano 66/66, e la suite completa su a753678 era verde (78 file, 1686 test);
  - non ho rieseguito i test (sola lettura).
- **Prerequisito da chiudere prima di registrare lo step9.** Serve lo step8 11/11 sul commit finale, dopo le correzioni,
  registrato con state-set. Il verdetto della sezione 6 e' quello del punteggio: fino ad allora lo step9 non va segnato done.

## 1. Gate non declassabili (prima del giudizio)

Li ho rieseguiti in sola lettura, con `CLAUDE_PLUGIN_ROOT` del plugin green-fe e `tools/vendor` in testa al PATH. Gli esiti
sono gli stessi del coordinatore.

| feature | check-ui-authz.sh | fe-project-check.sh --built --feature --catalog |
|---|---|---|
| istituzionale | pass (3 route, 7 azioni, 0 failure), rc 0 | pass (5 feature, 0 failure), rc 0 |

- **`contextProjection` come sicurezza**: nessun uso. Compare solo in `src/shared/api/auth/stato.ts:9` e `:33-37`, dove e'
  dichiarata security-inert e fail-open. `projection()` non ha chiamanti in `src`. Il delta non tocca ne' `src/shared/api`
  ne' `src/app`.
- **CSRF del mutator BFF**: invariato. In `src/shared/api/mutator/bff-mutator.ts:37-42` restano `withCredentials`,
  `xsrfCookieName`/`xsrfHeaderName` e `X-Requested-With: XMLHttpRequest`.
- **Grant delle letture**: verbatim dal catalogo, `csr.tx-0016.read` (`lib/grant.ts:10`) e `csr.tx-0015.read` (`:21`).
- **Cambio di meccanismo.** Gli hook sono sempre montati in `Confronto`, con `abilitato` uguale al grant
  (`AnteprimaIstituzionale.tsx:71-72`, `api/index.ts:65` e `:79`).
  - In query-core 5.101.3 una query disabilitata non parte ne' al montaggio ne' con `refetchQueries`/`invalidateQueries`
    (`queryClient.js:171`, `query.js:102`).
  - In `src` non c'e' nessuna rilettura globale, solo le invalidazioni di `/auth/status`.
  - Che non ci siano letture senza grant lo provano i test, che contano le richieste (`anteprime-home.test.tsx:255-271`,
    `:296-309`, `:311-318`).
  - Il punto debole e' il gate di UX delle parti derivate dalle letture (A-02). Non e' sicurezza: il backend ridecide ogni
    lettura con un 403.

Esito: nessun FAIL_AUTHZ, nessun CRITICO imposto.

## 2. Verifica dei finding

### A-01 (A, MINORE): importi sotto il milione tagliati nella colonna SIGC
Assorbe V-03 (V, MINORE), H-01 (H, MINORE), X-02 (antagonista, COSMETICO) e la contestazione X-C1.

- **Verdetto**: ACCETTATO, MINORE. Il finding e' `comune` e ricade sull'istituzionale, l'unica card che usa
  `ConfrontoArea` e le classi `.ui-ambito__confronto*`.
- **Verifica sul codice**: `tema.css:397` (`white-space: nowrap` dei td), `:391` (`container-type: inline-size`), `:352`
  (`overflow: hidden` della card), `:348` (`minmax(0, 1fr)`), `primitive.ts:81` (sotto 1.000.000 `importoBreve` usa
  `formatEuro` coi centesimi).
- **Misura nel browser** (coordinatore), con le spese divise per 200:
  - a 1440 px la tabella misura 243 px in 219 px;
  - a 1380 px misura 243 px in 204 px;
  - a 1680 px ci sta (279/279).

  Il corpo della card ha 20 px di padding, quindi a 1440 px vengono tagliati circa 4 px, a 1380 px circa 19 px: il simbolo
  € e l'ultima cifra.
- **Correzioni alle evidenze delle lenti**:
  - A-01 stimava 12 px persi a 1680 px: la misura dice che ci sta.
  - Lo spazio prima di € e' U+00A0 (verificato con Intl it-IT). Quindi `white-space: normal` da solo, che e' il fix di
    V-03, non manda a capo l'importo.
  - Sulla fascia di larghezze hanno ragione X-C1 e X-02. Le card stanno quattro per riga solo da circa 1376 px (a 1380 px
    il coordinatore ha misurato 204 px); a 1300 px stanno due per riga. Il residuo di `verifica-smp-non-sigc.md:269`
    ("quattro card per riga sotto i 1300 px circa") e' sbagliato, e X-02 lo assorbe A-01: la correzione del residuo fa
    parte della chiusura del taglio.
  - La seconda fascia di X-02 (992-1010 px, corpo di circa 276 px) secondo le misure starebbe nel padding, senza taglio.
    Non e' provata.
  - Stima mia, ricavata dalle misure. Subito sopra la soglia della container query (15,5rem = 248 px, circa 1556 px) i td
    tornano a 1,15rem e la tabella vuole circa 277 px: il taglio e' probabile fra circa 1556 e 1590 px. Va controllato
    nella stessa verifica.
- **Severita'**: MINORE, come per le tre lenti. Un numero tagliato senza segnale e' un numero letto male, ma succede solo
  con totali sotto il milione:
  - coi dati veri, che sono in milioni, oggi non succede;
  - succede coi dati d'esempio del dev server, e succederebbe con un perimetro ADA (oggi nessun profilo lo ha).

  E' un rischio latente, non un comportamento sbagliato coi dati di oggi: non e' MAGGIORE.

### A-02 (A, MINORE): le parti derivate dalle letture non sono legate al grant
Assorbe A-03 (A, MINORE).

- **Verdetto**: ACCETTATO, MINORE. Feature: istituzionale. Ho accorpato A-03 perche' nasce dallo stesso cambio di
  meccanismo e chiede lo stesso test.
- **Verifica**:
  - le colonne sono filtrate per grant (`AnteprimaIstituzionale.tsx:73`);
  - invece `nonSigcLetta`, `sigcLetta` e la nota (`:74-76`) vengono dalle query anche quando sono disabilitate;
  - `ErroreDellaLettura` (`:80-81`) legge `isError` senza il grant, e da `nonSigcLetta` dipende `Quota` (`:82`);
  - con `enabled: false`, `useQuery` restituisce lo stato in cache della chiave;
  - oggi a impedire il caso c'e' solo lo svuotamento della cache al cambio d'impronta, ruoli compresi
    (`utente-della-sessione.ts:33`, `stato.ts:27-31`);
  - prima del rework (dbdd81c) il blocco era un figlio montato solo col grant.

  Su A-03: il codice e' corretto, ma nessun test prova che una rilettura globale salti la query disabilitata.
- **Severita'**: MINORE, come A-01 del 26/10. E' un gate di UX, il backend risponde 403 e oggi non c'e' nessuna fuga.

### H-02 (H, MINORE): in `ConfrontoArea` lo stato della colonna dipende da undefined o null
- **Verdetto**: ACCETTATO, MINORE. Il finding e' `comune` e ricade sull'istituzionale, l'unico chiamante.
- **Verifica**: in `AnteprimaArea.tsx:106-110` `celle` undefined vuol dire attesa e null vuol dire errore. Negli stessi
  tipi pero' undefined vuol dire "non disponibile": `valore` undefined (`:96`) e il valore di `NumeroArea` (`:35`).
  L'attesa porta lo scheletro (`:124`) e il `role="status"` (`:178`). L'unico chiamante usa l'API in modo corretto
  (`AnteprimaIstituzionale.tsx:47-50`), ma il pezzo e' esportato dal kit (`index.ts`).
- **Severita'**: MINORE. E' la stessa classe di H2 del 26/10 (quota con due unita' nel kit).

### V-01 (V, MINORE): il trattino dice "dato non previsto nella verifica non SIGC"
- **Verdetto**: ACCETTATO, MINORE, con la decisione D1. Feature: istituzionale.
- **Verifica**: il testo e' in `lib/anteprima.ts:120`. Pack e contratto dicono il contrario:
  - nel pack TX-0016 ha "Numero domande pagate (solo saldate al 100%)" (`transactions.json`, io_dets);
  - nel contratto `domandeSaldate` e' fra i campi obbligatori di `VerificaSmpNonSigcRiga`;
  - la pagina offre il dato come colonna "Domande pagate (solo saldate)" (`lib/verifica.ts:43`).
- **Perche' e' un finding anche se il testo e' approvato** (`home.html:111`, md `:252-253`): per il brief un testo
  approvato e' un finding se tradisce pack o contratto, e questo li tradisce. X3 del 26/10 fu respinto proprio perche' non
  contraddiceva il contratto.
- Il trattino in se' resta legittimo: le due misure non si confrontano.
- **Severita'**: MINORE. E' un testo per i soli lettori di schermo, nessun numero sbagliato.

### V-02 (V, MINORE): "Non SIGC" maiuscolo nel motivo sotto la tabella
- **Verdetto**: ACCETTATO, DECLASSATO a COSMETICO. Feature: istituzionale.
- **Verifica**: `AnteprimaArea.tsx:139` compone il motivo col titolo della colonna ('Non SIGC', `lib/anteprima.ts:124`), e
  il test `anteprime-home.test.tsx:424` fissa quel testo. Il wireframe scrive "non SIGC" (`home.html:146`, md `:257-258`).
- **Severita'**: stesse parole e stesso senso, cambia la maiuscola di una lettera. E' formattazione del testo, cioe'
  COSMETICO secondo la checklist.

### H-03 (H, MINORE): regola dell'errore e calcoli ripetuti nel componente
- **Verdetto**: ACCETTATO, DECLASSATO a COSMETICO. Feature: istituzionale.
- **Verifica**:
  - due controlli di `isError` coerenti fra loro (`AnteprimaIstituzionale.tsx:42-44` e `:47-50`);
  - `anteprimaVerifica` gira a `:53` e a `:82`, `periodoDellaRisposta` a `:59` e a `:76`.
- **Severita'**: COSMETICO, come H1 del 26/10. Sono due righe duplicate, oggi coerenti. Il test di a382562
  (`anteprime-home.test.tsx:429-448`) guarda celle, frase, barra e nota, quindi una divergenza lo farebbe fallire. Il costo
  del doppio calcolo e' trascurabile.

### X-03 (antagonista, COSMETICO): numero animato in una tabella a layout automatico
- **Verdetto**: ACCETTATO, COSMETICO. Il finding e' `comune` e ricade sull'istituzionale.
- **Verifica**:
  - durante l'animazione `NumeroAnimato.tsx:44-52` mostra il valore intermedio; il valore finale e' in uno span
    visually-hidden, che non riserva larghezza;
  - la tabella e' a layout automatico con td nowrap (`tema.css:392` e `:397`), e `importoBreve` passa dai centesimi a M€
    (`primitive.ts:80-82`);
  - il calcolo regge: con un totale finale di 1,5 M€ l'uscita cubica resta sotto il milione per p < 0,307, cioe' circa
    215 ms dei 700.

  Nessuno l'ha visto in un browser. L'effetto e' transitorio e non c'e' con prefers-reduced-motion.

### X-04 (antagonista, COSMETICO): con un solo grant la didascalia nomina due verifiche
- **Verdetto**: ACCETTATO, COSMETICO. Feature: istituzionale.
- **Verifica**: la didascalia e' fissa (`AnteprimaIstituzionale.tsx:79`), mentre le colonne seguono i grant (`:73`). I test
  la fissano anche col solo grant SIGC (`anteprime-home.test.tsx:227`, `:243` e `:296`). Con il catalogo rev. 4 lo stato
  oggi non si raggiunge, ma la didascalia nomina una colonna che non c'e'.

### X-05 (antagonista, COSMETICO): due affermazioni dei test non discriminano
- **Verdetto**: ACCETTATO, COSMETICO. Feature: istituzionale.
- **Verifica**:
  - nessun test guarda la classe visually-hidden di `AnteprimaArea.tsx:120`: non `anteprime-home.test.tsx:287-289`, non
    `kit-comune.test.tsx:255`, `:267` e `:269`;
  - il commento di `AnteprimaIstituzionale.tsx:56` dice che l'esercizio dell'intestazione viene dalla risposta, ma la
    fixture `verificaSigcPer` (`testing/fixture.ts:202-205`) rimanda sempre l'esercizio chiesto, quindi nessun test vede la
    differenza.

### H-04 (H, COSMETICO): commenti rimasti ai due blocchi
- **Verdetto**: ACCETTATO, COSMETICO. Feature: istituzionale. Ho controllato `src/app/aree.ts:123` e
  `lib/anteprima.ts:83`.

### V-05 (V, COSMETICO): provenance della card nello uiplan non aggiornata
- **Verdetto**: ACCETTATO, COSMETICO. Feature: istituzionale.
- **Verifica**: ho controllato `uiplan.json:1017`, `:1023` e `:1029`. Il perimetro di TX-0015 e' usato
  nell'intestazione SIGC (`AnteprimaIstituzionale.tsx:60`) ma manca nella provenance.

### X-01 (antagonista, MINORE): la nota SIGC e le domande pagate
- **Verdetto**: RESPINTO come finding. Torna come decisione D2, fuori punteggio.
- **Verifica**:
  - le etichette sono in `lib/anteprima.ts:100` e la nota in `:143`; prima del rework la riga era "Domande pagate
    nell'esercizio" (`ETICHETTE_SIGC` in dbdd81c);
  - nel pack TX-0015 dice "Numero domande pagate nell'esercizio finanziario n";
  - per SC-IS_SMP_SIGC le domande pagate sono "solo le domande correnti delle campagne della spesa", cioe' la campagna n-1
    e le anteriori;
  - la pagina scrive "Domande pagate nell'esercizio" (`lib/verificaSigc.ts:69`, `lib/formato.ts:87`).

  Il rischio di lettura e' vero. La nota ("dal ... al ..., domande dell'anno 2025") non dice a quali righe vale ciascuna
  parte, e chi legge puo' riferire "domande dell'anno 2025" anche alle pagate, che comprendono le campagne anteriori.
- **Motivo del rigetto**:
  - il codice rende esattamente i testi approvati (`home.html:110` e `:122`, md `:262`);
  - la nota dice due cose vere, il periodo dell'esercizio e l'anno delle domande;
  - "Domande pagate" sotto "SIGC (esercizio aaaa)" e' la definizione del pack (pagate nell'esercizio);
  - e' lo stesso caso di X3 del 26/10 (testo approvato vero, rischio di comprensione), non di X2 (codice contro una regola
    approvata);
  - il brief esclude i testi approvati se non tradiscono pack o contratto, e alla lettera qui non li tradiscono.

  La domanda resta all'utente.

### V-04 (V, COSMETICO): interlinea delle note dd nelle card di finanziario, fisico e procedurale
- **Verdetto**: RESPINTO.
- **Verifica**: la specificita' e' come dice la lente: `tema.css:390` batte `:386`, e le note dd passano da 1,15 a 1,4.
- **Motivo del rigetto**:
  - il commit 9621d56 dichiara "Note e barre delle card con interlinea 1,4", e il perimetro del brief "interlinea 1,4 di
    `.ui-ambito__nota` dentro le anteprime": l'effetto sui dd sta nel cambio dichiarato e rende uniforme l'interlinea di
    tutte le note;
  - non c'e' nessuna regressione di contenuto o di struttura;
  - il fix e' condizionato ("se non e' voluto");
  - `regolaDelTema` non e' una convenzione per ogni regola del tema: lo usano solo le regole sticky
    (`kit-comune-procedurale.test.tsx:171-178`).

### H-05 (H, COSMETICO): `estremiEsercizio` esportata solo per i test
- **Verdetto**: RESPINTO.
- **Motivo**: la funzione ha un consumatore (`periodoEsercizio`, `formato.ts:31`) e un test diretto
  (`istituzionale-lib.test.ts:485`), e il JSDoc resta vero. Un helper puro esportato e testato non e' codice morto: e' un
  caso diverso dalle riesportazioni senza consumatori (H2 e H3 dell'istituzionale).

### X-C1 (antagonista): contestazione di V-03
- **Verdetto**: ACCOLTA. La fascia di verifica del fix di V-03 (1300-1440 px) e' sbagliata. Il fix di A-01 usa le fasce
  corrette e la mia stima sopra la soglia della container query. Per la seconda parte della contestazione vale X-03.

### Regressioni delle card di finanziario, fisico e procedurale
Non ne ho trovate:
- `ConfrontoArea` e le classi `.ui-ambito__confronto*` le usa solo l'istituzionale (grep su `src` e `tests`);
- le altre tre card usano `NumeroArea`, `NotaArea` e `AvanzamentoArea`, che il delta non cambia nel markup;
- l'unico effetto su di loro e' l'interlinea delle note e delle barre, dichiarata (V-04 respinto).

## 3. Riepilogo del Judge

- **Finding in ingresso**: 18, piu' una contestazione. Lente V 5, lente H 5, lente A 3, antagonista 5, piu' X-C1.
- **Accettati**: 11.
- **Accorpati**: 4. V-03, H-01 e X-02 in A-01; A-03 in A-02. X-C1 e' accolta nel fix di A-01.
- **Respinti**: 3. X-01 (diventa la decisione D2), V-04 e H-05.
- **Declassati**: 2, V-02 e H-03, da MINORE a COSMETICO.
- **Finding contestati** (CRITICO rigettati): **nessuno**. In ingresso non c'era nessun CRITICO.

| finding | severita' finale | origine | istituzionale | altre feature |
|---|---|---|---|---|
| A-01 (+V-03, H-01, X-02, X-C1) | MINORE | comune | x | |
| A-02 (+A-03) | MINORE | istituzionale | x | |
| H-02 | MINORE | comune | x | |
| V-01 | MINORE (D1) | istituzionale | x | |
| V-02 | COSMETICO (da MINORE) | istituzionale | x | |
| H-03 | COSMETICO (da MINORE) | istituzionale | x | |
| X-03 | COSMETICO | comune | x | |
| X-04 | COSMETICO | istituzionale | x | |
| X-05 | COSMETICO | istituzionale | x | |
| H-04 | COSMETICO | istituzionale | x | |
| V-05 | COSMETICO | istituzionale | x | |

Il fix di ciascun finding e' in `review/istituzionale-findings-card-tabella.json`. I punti chiave:
- **A-01**:
  - nella container query stretta i td vanno a capo (`white-space: normal; overflow-wrap: anywhere`, come i dd di `:386`);
    in alternativa il contenitore scorrevole del kit, con tabIndex, role=region e nome;
  - va rivista anche la soglia dei 15,5rem;
  - verifica nel browser a 1380, 1440, 1560-1600 e circa 1000 px;
  - la fascia corretta del residuo va subito nel dossier (fuori dall'hash) e in md `:269` alla prossima riapprovazione.
- **A-02**: le parti derivate passano dal grant, con un test che pre-popola la cache e lancia refetch e invalidate.
- **H-02**: lo stato della colonna diventa un'unione discriminata.
- **V-01**: secondo la decisione D1.

## 4. Decisioni per l'utente

**Vincolo da conoscere prima di scegliere.** Il flusso verifica-smp-non-sigc ha `rework_rounds` 2 (approval nello uiplan),
pari al `rework_budget` 2 della config. Una nuova riapprovazione sarebbe il terzo rework, oltre il budget: per la skill
step1 ci si ferma e si chiede, e non si approva mai da soli. Ogni opzione (a) qui sotto richiede quindi il via esplicito
dell'utente al terzo rework. Conviene farne uno solo per D1, D2 e la fascia del residuo di A-01.

- **D1 (V-01, conta nel punteggio): testo del trattino delle domande pagate non SIGC.**
  - (a) Un testo vero, per esempio "dato non confrontabile: la verifica non SIGC conta solo le domande saldate al 100%".
    Cambiano `lib/anteprima.ts:120`, `home.html:111` e md `:252-253`, con la riapprovazione del flusso; poi i test
    `anteprime-home.test.tsx:288` e `:355` e `istituzionale-lib.test.ts:619`.
  - (b) Tenere il testo e registrare la contraddizione col pack nei `deviations_reviewed` del gate
    `wireframe_verifica-smp-non-sigc` (state-set). L'hash non cambia e il finding si chiude con la registrazione.
  - (c) Mostrare `domandeSaldate` nella cella non SIGC. Non la raccomando: la definizione e' da confermare con ARSIAL
    (D-02) e la card non l'ha mai mostrata.
  - **Raccomandata: (a)**. Il testo e' falso e cambiarlo costa una riga; va fatto nello stesso rework di D2 (a).
- **D2 (X-01, fuori punteggio): la nota SIGC non dice a quali righe valgono periodo e anno delle domande.**
  - (a) La parte SIGC della nota distingue le righe, per esempio "SIGC: pagate e spesa dal 16/10/2025 al 15/10/2026;
    ricevute e finanziate, domande dell'anno 2025.". Cambiano `lib/anteprima.ts:143`, `home.html:122` e `:134`, md `:262`;
    poi `NOTA_SIGC` (`anteprime-home.test.tsx:228`), `:371` e `istituzionale-lib.test.ts:487` e `:626`.
  - (b) Rimettere l'etichetta "Domande pagate nell'esercizio". La riga esiste solo con la colonna SIGC e nella colonna non
    SIGC ha il trattino, quindi l'etichetta resta vera. La spesa pero' resta senza qualificatore, perche' la sua riga vale
    anche per i cumulativi non SIGC.
  - (c) Tenere il testo approvato e dichiarare la comprensibilita' della nota come RESIDUO umano, da controllare nella
    prova interna.
  - **Raccomandata: (a)**, nello stesso rework di D1 (a). E' l'unica opzione che copre sia le pagate sia la spesa.
- **Nota su V-02**: non serve una decisione. Il wireframe e' chiaro ("non SIGC") e si corregge il codice.

## 5. Altre feature (finanziario, fisico, procedurale, elenco operativo)

- Nessun finding comune accettato ricade su di loro. Tutti quelli accettati riguardano `ConfrontoArea` e le classi
  `.ui-ambito__confronto*`, che usa solo l'istituzionale; l'unico che le toccava (V-04) e' respinto.
- Per questo non ho scritto file `review/<feature>-findings-card-tabella.json` per loro, e i loro step9 del 30/10 restano
  validi.
- I fix di A-01, H-02, X-03 e V-02 toccano pero' `src/shared/ui/tema.css` e `src/shared/ui/anteprima/AnteprimaArea.tsx`,
  file del kit importati anche dalle card di finanziario, fisico e procedurale. Dopo le correzioni bisogna rifare lo step8
  delle feature le cui approvazioni del gate coprono quei file, non solo dell'istituzionale.

## 6. Verdetto (`review-score.sh FULL review/istituzionale-findings-card-tabella.json`)

| feature | CRITICO | MAGGIORE | MINORE | COSMETICO | score | rc | verdetto |
|---|---|---|---|---|---|---|---|
| istituzionale | 0 | 0 | 4 | 7 | 81 | 0 | PASS del punteggio; registrazione sospesa (prerequisito step8) |

Note sul verdetto:
- **Il PASS e' di un punto sopra la soglia di 80** e dipende da due scelte motivate sopra:
  - il declassamento di V-02: con V-02 MINORE il punteggio sarebbe 79, FAIL;
  - il rigetto di X-01, trattato come X3 del 26/10: con X-01 MINORE sarebbe 78, FAIL.
- **I finding accettati vanno corretti comunque**, in commit per sottoargomento, come i residui delle review precedenti.
- **Ordine per chiudere lo step9**:
  1. scelta di D1 e D2, con l'eventuale via al terzo rework, riapprovazione del flusso e registrazione con state-set;
     oppure, per D1 (b), la registrazione nei `deviations_reviewed`;
  2. correzioni;
  3. step8 11/11 sul commit finale, per l'istituzionale e per le feature che il gate chiede per il kit;
  4. solo allora state-set di `step9-review` done con `gates={review:"pass"}`.
