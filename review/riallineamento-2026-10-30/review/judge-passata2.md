# Judge: review step9 FULL sul delta del riallineamento, passata 2 di 3 (elenco-operativo e procedurale, 30/10/2026)

**Perimetro**
- Correzioni: `git diff 6857940 HEAD -- src tests plan/procedurale plan/elenco-operativo wireframes/procedurale
  wireframes/elenco-operativo`.
- Non regressione: `git diff e0f6cb7 HEAD` sugli stessi percorsi.
- Tutto verificato su HEAD 79c1093.
- Brief: `brief-comune.md` e `brief-passata2.md`. Metro: quello di `judge-passata1.md`, coi suoi precedenti.

**Ingresso:** 18 finding piu' 3 voci informative.
- Lente V: 3.
- Lente H: 6.
- Lente A: 3, piu' GATE e A2-INFO-01.
- Antagonista: 6, piu' ANT2-INFO-01.
- Nessun CRITICO in ingresso.

Ho verificato ogni finding sul codice in sola lettura (`git show`/`diff`/`log`, grep, sorgente di react-router e react-aria in
`node_modules`), senza npm, build o test.

## 1. Gate non declassabili (prima del giudizio)

Li ho rieseguiti in sola lettura su HEAD 79c1093, con `CLAUDE_PLUGIN_ROOT` del plugin green-fe e `tools/vendor` in testa
al PATH.

| feature | check-ui-authz.sh | fe-project-check.sh --built --catalog |
|---|---|---|
| elenco-operativo | pass (3 route, 6 azioni) | pass, rc 0 |
| procedurale | pass (8 route, 31 azioni) | pass, rc 0 |

Altri controlli:
- **CSRF del mutator:** il delta 6857940..HEAD non tocca `src/shared/api`.
- **`contextProjection`:** compare solo in `src/shared/api/auth/stato.ts`, che e' security-inert.
- **XSS:** nessun `dangerouslySetInnerHTML` in `src`.
- **Grant dei due link nuovi:** sono verbatim dal catalogo e uguali alla visibility della route d'arrivo.
  - `scheda-di-partenza` usa csr.tx-0058.read.
  - `determine-della-domanda` usa csr.tx-0020.read.

Esito: nessun FAIL_AUTHZ e nessun CRITICO imposto dai gate.

## 2. Finding della passata 1: chiusi

| finding | esito | prova |
|---|---|---|
| EO-01 (D1 a) | chiuso | Il link porta `{ tipoDellaScheda }` (state, mai URL). L'avviso e' `role="status"` sopra la testata, col link `scheda-di-partenza` (csr.tx-0058.read) che apre la scheda su Determine. Test SOSTEGNO 34810022870 con risposta PAGAMENTO (`determine/page.test.tsx:308`). Restano residui: PRO2-01..03, PRO2-05, EO2-* |
| PRO-01 | chiuso | I conteggi si chiudono con una ricerca valida e l'attesa della tabella (`:52-65`, `:147-160`) |
| PRO-02 (D2 a) | chiuso | "Cerca un altro codice" sta nell'avviso di 403, 429 e 503 tramite `AvvisoPagina.azioni`, col focus al campo, provato (`:239-263`) |
| PRO-03 | chiuso | `PERCORSI.determine` e `GRANT.determine` vengono da `entities/domanda`. C'e' un solo `siNo` (`lib/formato.ts:48`) |
| PRO-04 | chiuso | Nessun `SC-FS_DETERMINA` in `src` e `tests`. Il describe P4 nomina SC-PC_DETERMINA_SCOPE_P4 |
| PRO-05 | chiuso | OP-PR-14 e' aggiornato (800ff18) |

**Regressioni dal gruppo FI sulle due feature:** nessuna.
- `AvvisoPagina.azioni` la usano solo le determine.
- `statoDelDettaglio` con `decideIlVuoto` e' additivo: il procedurale non lo passa.
- `NON_DISPONIBILE_BREVE` e `resaAssenza` sono identici in `entities/importo`.
- `BarraRiferimenti` e `PaginaReportProgramma` non entrano nelle due feature.

## 3. Finding accettati per feature

### Procedurale: 5 MINORE, 1 COSMETICO

**PRO2-01** (V-P2-01 + H2-01 + A2-01, uniti, MINORE): l'avviso D1 resta dopo una ricarica, contro il wireframe
riapprovato.
- L'avviso rilegge lo state a ogni montaggio (`DetermineDellaDomanda.tsx:96`).
- `createBrowserRouter` (`src/app/routes.tsx:69`) a una ricarica rilegge `history.state.usr`
  (`createBrowserLocation` di react-router). Lo stesso vale per Indietro e per una nuova identita' nello stesso browser.
- Il flusso `determine` riapprovato dice il contrario (`determine.md:80`, `determine.html:132`): "Senza state (ricarica,
  ...) nessun avviso".
- Il test `:358`, "senza state (ricarica o indirizzo condiviso)", monta un indirizzo senza state in `createMemoryRouter`.
- Lo scostamento non e' registrato nello uiplan, ma solo nel resoconto (`correzioni-passata1-pef.md:231-236`).
- Comportamento diverso dal wireframe approvato, con un test che dichiara il contrario del reale: MINORE, come FIS-01
  e PRO-01 della passata 1. Il punto 5 dice cosa chiude la correzione.
- *Origine:* la frase del wireframe viene dalla descrizione di D1 nel Judge della passata 1 ("Senza state, per esempio
  dopo un ricarica ..., l'avviso non c'e'"), che dava per perso alla ricarica uno state che il browser invece conserva.

**PRO2-02** (V-P2-02, MINORE): con TX-0020 gia' in cache (staleTime 5 minuti) la regione `role="status"` nasce gia' piena e
non si annuncia (`:100`).
- Succede col giro scheda -> determine -> scheda-di-partenza -> di nuovo le determine, oppure con Indietro.
- Smentisce il commento di `:89-94` e la regola X-08 del progetto, che in elenco-operativo v1 era MINORE.
- Il focus va sull'h1, che nel DOM viene dopo l'avviso.

**PRO2-03** (ANT2-01, MINORE, serve la decisione D4).
- **Verifica:**
  - Il contratto sceglie "prima quella con determine agganciate (righe aperte), a parita' prima l'aperta e fra le aperte
    la PAGAMENTO" (`openapi-procedurale.json:151`).
  - Lo scenario approvato SC-PC_DETERMINA_TIPO ha due casi in cui la domanda di partenza non ha righe:
    - 34810063735: la PAGAMENTO chiusa ha G00016, la SOSTEGNO aperta non ha righe;
    - 34810063736: la SOSTEGNO ha G00017, la PAGAMENTO aperta non ha righe.
  - Dalla scheda senza righe l'avviso compare quindi sempre, e dice "Quelle della domanda di <tipo> sono nella sua
    scheda". Il link porta a una scheda Determine che dice "Nessuna determina per questa domanda.": un giro chiuso.
  - Si smentisce anche la nota approvata `dettaglio-domanda.html:123` ("Anche con la scheda vuota il link resta: la
    pagina del procedurale dice il motivo").
  - Se nessuna delle due domande ha righe (a parita' vince la PAGAMENTO), "qui ci sono le sue determine" sta accanto a
    "Nessuna determina aperta". Questo caso non e' nel G/W/T.
- **Severita':** il codice rende esattamente il testo approvato (`determine.md:104-106`), quindi il difetto e' del testo.
  Non e' MAGGIORE come EO-01: li' l'utente vedeva le determine di un'altra domanda senza nessun avviso. Qui l'avviso c'e'
  e dice correttamente di chi sono le determine mostrate. Resta falsa solo la seconda frase, in un caso del pack:
  MINORE.

**PRO2-04** (A2-02, MINORE): i test dei link nascosti senza csr.tx-0058.read asseriscono l'assenza senza aspettare
`/auth/status`.
- Sono due: `:377` (nuovo) e `:123` (entrato nel delta con lo spostamento).
- TX-0020 parte prima della sessione (`:231-232`), e `puoLeggere` resta falso finche' la sessione non e' letta.
- Stessa classe di PRO-01 e IST-02 della passata 1 (MINORE).

**PRO2-05** (A2-03, MINORE): nessun test unisce lo state di D1 e il P4.
- Mancano il caso D-11 (P4 Latina, scheda SOSTEGNO 54810769588, risposta SOSTEGNO ADA, nessun avviso) e il 404 con lo
  state, uguale per la domanda inesistente e per quella fuori perimetro.
- Il codice e' corretto, perche' l'avviso non legge il perimetro. Pero' e' il punto che il brief chiede di garantire.
- Manca il test di un ramo: MINORE come FIS-03.

**PRO2-06** (H2-03, parte procedurale, COSMETICO): il trigger di `scheda-di-partenza` (`plan/procedurale/uiplan.json:748`)
non dichiara lo state `{ schedaIniziale: 'determine' }` (uiplan-patterns §8).

### Elenco operativo: 6 COSMETICO

- **EO2-01** (V-P2-03 + H2-03, parte elenco): l'arrivo su Determine dallo state `schedaIniziale` non e' scritto in
  OP-EO-07, ne' nella route della scheda, ne' nel paragrafo "In arrivo" di `dettaglio-domanda.md`.
- **EO2-02** (H2-02, declassato da MINORE): `TIPI_DOMANDA` (Set) e `TipoDellaDomanda` (unione) sono due elenchi separati.
  Gli id dei Tab non sono legati a `SchedaDellaDomanda`, e il procedurale riporta il tipo a `string`.
- **EO2-03** (H2-04): tre commenti danno ancora al fisico le determine (`elenco.ts:3`, `collegamenti.ts:25`,
  `formato.ts:59`).
- **EO2-04** (ANT2-03, declassato da MINORE): i Tabs non controllati applicano `schedaIniziale` solo al montaggio.
  - Con TX-0058 in cache, Indietro su una voce con lo state non riapre Determine.
  - Il commento riscritto da 5b47c26 promette di piu'.
- **EO2-05** (ANT2-04): "l'arrivo non risponde 404" (`collegamenti.ts:44`, OP-EO-07, wireframe) e' falso per chi ha
  TX-0058 regionale da un P3 fin/ist/fis/pil, P5 o P6, e TX-0020 solo dal P4.
  - Il backend risolve il perimetro grant per grant (`approvazioni-ambiti-2026-10-29.md:196`).
  - Il comportamento e' corretto: e' sbagliata l'assunzione scritta.
- **EO2-06** (ANT2-05): il test delle frecce porta il focus a mano sul Tab Determine.
  - Con l'attivazione automatica di react-aria il focus seleziona, quindi passerebbe con qualunque scheda iniziale
    (`page.test.tsx:161`).

## 4. Rigettati, uniti, declassati

### Rigettati (4)
- **H2-05** (COSMETICO, procedurale): `numeroOpzionale` riscritto in `grafici.ts:29` e `:164`, e due costanti per
  "non disponibile".
  - **Motivo:** espressioni di una riga gia' presenti prima di questo delta, che tocca solo l'import. Il letterale
    "non disponibile" compare anche altrove in `importo.ts`.
  - Sotto ogni soglia, e' stile: stesso metro di H-06 della passata 1.
- **H2-06** (COSMETICO, comune): lettura di un campo dallo state ricopiata in piu' punti.
  - **Motivo:** espressione di una riga, come H-06 della passata 1.
- **ANT2-02** (MINORE, elenco-operativo): il giro scheda -> determine -> scheda-di-partenza perde la ricerca di partenza.
  - **Motivo: conforme al wireframe approvato.** In `dettaglio-domanda.md` un arrivo che non viene da un elenco torna
    all'elenco senza filtri (riga `torna-all-elenco`: "senza ricerca di partenza: l'elenco senza filtri"). Lo stesso vale
    gia' per `scheda-domanda` delle determine, rivisto in passata 1.
  - D1 promette la scheda di partenza sulla scheda Determine, non il suo contesto di ritorno.
  - Indietro del browser riporta comunque alla voce originale con la sua ricerca.
  - Resta come proposta facoltativa (punto 6).
- **ANT2-06** (COSMETICO, elenco-operativo): titolo e briciola "Domanda N" senza il tipo.
  - **Motivo: fuori perimetro.** L'etichetta c'era gia' a e0f6cb7 (`SchedaDomanda.tsx:276`), quindi non e' una
    regressione. WCAG 2.4.2 non chiede titoli unici, e il tipo e' nel sopratitolo e nei badge.
  - Resta come proposta facoltativa.

### Uniti
- H2-01 e A2-01 in V-P2-01 (PRO2-01): stessa causa e stessa correzione.
  - A2-01 non resta un finding a se'. L'informazione che rivelerebbe al P4 (una PAGAMENTO con quel codice) e' gia' nella
    cronologia della stessa scheda del browser: la voce precedente e' `/elenco-operativo/domande/PAGAMENTO/<codice>`, col
    tipo nel path.
  - Il suo caso concreto entra nell'evidenza e nel fix di PRO2-01.
- H2-03 e' diviso fra le due feature, perche' sono due uiplan: la parte del procedurale in PRO2-06, quella dell'elenco
  unita a V-P2-03 in EO2-01.
  - Stesso metro di PRO-01 e IST-02: stesso difetto in due feature, due finding.

### Declassati (2)
| finding | da | a | motivo |
|---|---|---|---|
| H2-02 | MINORE | COSMETICO | Elenco di due valori adiacenti nello stesso file, nessuna divergenza. Gli id dei Tab sono allineati da un test che scorre l'elenco chiuso. Un tipo mancante nel Set toglie solo l'avviso (fail-safe). Copie minime come H1 delle card e H-03/H-08 della passata 1 |
| ANT2-03 | MINORE | COSMETICO | Il percorso di D1 funziona: `scheda-di-partenza` arriva sempre da un'altra route, quindi monta la scheda. L'effetto riguarda solo Indietro/Avanti fra voci della scheda con la risposta in cache, dove "la scheda giusta" non e' stabilita da nessun artefatto. La parte delle collegate c'era gia' prima del delta. Effetto trascurabile, come IST-10 della passata 1 |

**Non alzato:** ANT2-01 resta MINORE. Il motivo e' al punto 3 (l'avviso c'e' ed e' giusto su di chi sono le determine).

### Finding contestati (CRITICO rigettati)
Nessuno: in ingresso non c'era nessun CRITICO, e i gate non ne impongono.

## 5. Ricarica e state (PRO2-01): consumare lo state all'arrivo basta?

La correzione e' quella del wireframe approvato:
- leggere lo state una sola volta e tenere il tipo nello stato del componente, insieme al codice;
- toglierlo dalla voce con `navigate(pathname, { replace: true, state: null })`;
- azzerarlo a una nuova ricerca dal modulo.

Cosa chiude:
- **V-P2-01 e H2-01: chiusi.** Dopo una ricarica la voce non ha piu' state, quindi non c'e' avviso, come dice
  `determine.md:80`. Il test si puo' scrivere in modo vero: state null dopo l'arrivo, pagina rimontata sulla stessa voce
  senza avviso.
- **A2-01: chiuso in quasi tutti i casi, non in uno.**
  - Chiusi: ricarica, Indietro/Avanti, nuovo accesso in un'altra scheda del browser seguito da ricarica o Indietro.
  - Resta aperto il caso della pagina che resta montata mentre l'identita' cambia senza ricarica.
    `utente-della-sessione.ts` svuota la cache e rilegge, ma lo stato del componente sopravvive.
  - Serve quindi anche l'azzeramento quando cambia `improntaIdentita(auth.data)`: una riga, gia' nel fix di PRO2-01.
    Con quella, tutti e tre sono chiusi.
- **Effetto collaterale da dire all'utente:** Indietro dalla scheda d'arrivo riporta alle determine senza l'avviso, perche'
  la voce non ha piu' lo state. E' coerente col wireframe ("senza state nessun avviso"). Sparisce anche il caso "Indietro"
  di PRO2-02; resta quello del giro.

**Decisione o allineamento?** E' l'allineamento al wireframe approvato, come D2 (a): non serve una decisione e non c'e'
nessun wireframe da riapprovare. La decisione serve solo se l'utente preferisce che l'avviso resti dopo la ricarica.
In quel caso:
- si cambia la frase di `determine.md:80` e `determine.html:132`, e si riapprova il flusso `determine`;
- si registra la scelta nello uiplan del procedurale;
- si accetta il residuo di A2-01 come rischio.

## 6. Decisioni per l'utente

### D4 (PRO2-03): testo dell'avviso D1 quando la domanda di partenza non ha determine con riga aperta
Le tre strade:
- **(a) Secondo testo, con un dato in piu' nello state.**
  - Il link della scheda porta anche se la scheda Determine e' vuota: un booleano dalla lunghezza di
    `scheda.determine` di TX-0058, convalidato in `entities/domanda`.
  - Con la scheda vuota l'avviso dice per esempio: "La domanda di sostegno con il codice a barre N non ha determine con
    riga aperta. Il codice e' anche di una domanda di pagamento: qui ci sono le sue determine." Il link diventa "Torna
    alla scheda della domanda di sostegno".
  - Pro: e' il testo piu' preciso.
  - Contro: il contratto dello state cresce e i testi diventano due. Vanno riapprovati `determine` e
    `dettaglio-domanda`. Il caso di due domande senza righe resta da scrivere a parte.
- **(b) Un solo testo neutro, vero in ogni caso.**
  - Per esempio: "Il codice a barre N e' anche di una domanda di pagamento: questa pagina mostra quella domanda, non la
    domanda di sostegno da cui arrivi." Il link resta "Apri la scheda della domanda di sostegno, scheda Determine".
  - Pro: e' solo testo, lo state non cambia. E' vero anche con due domande senza righe e per i profili misti di EO2-05.
    Si riapprova solo `determine`.
  - Contro: non dice in modo esplicito che la domanda di partenza non ha determine. Pero' la scheda lo diceva gia'
    sopra il link ("Nessuna determina per questa domanda.").
- **(c) Il link `determine-della-domanda` solo con la scheda Determine non vuota.**
  - Con la regola di TX-0020, l'altra domanda si sceglie solo a parita' di righe aperte. Se la partenza ha righe, quando
    l'avviso compare le hanno tutte e due: il testo approvato di D1 diventa sempre vero e il giro chiuso sparisce.
  - Pro: la pagina delle determine non cambia, il cambio e' una condizione nell'elenco.
  - Contro: cambia una scelta approvata di `dettaglio-domanda` ("Anche con la scheda vuota il link resta"), che va
    riapprovato. Toglie a tutte le domande senza righe il passaggio al procedurale (che direbbe solo "Nessuna determina
    aperta ... (non valorizzato)"). Coi profili misti di EO2-05 il testo puo' restare impreciso.

In ogni caso servono i test di pagina:
- DETERMINE_CHIUSA (34810063735) con lo state SOSTEGNO;
- la SOSTEGNO 34810063736 con lo state PAGAMENTO.

**Raccomandata: (b).** E' la correzione piu' locale e l'unica vera in tutti i casi, compresi quelli fuori dal G/W/T. Non
tocca il contratto dello state e chiede una sola riapprovazione, del flusso appena riapprovato per D1. Valuterei (c) solo
se l'utente vuole eliminare del tutto il giro dalla scheda vuota.

### PRO2-01: nessuna decisione necessaria
Si allinea al wireframe consumando lo state (punto 5). La decisione serve solo se l'utente vuole tenere l'avviso dopo la
ricarica.

### Proposte facoltative (non sono finding, non incidono sul verdetto)
- **ANT2-02:** portare il contesto di ritorno all'elenco attraverso le determine, come campo opaco nello state, per
  ritrovare filtri e briciola dopo `scheda-di-partenza`. Cambia il contratto fra le due feature e va dichiarato in
  `dettaglio-domanda`. **Raccomandazione: non ora.** Indietro del browser copre gia' il caso.
- **ANT2-06:** mettere il tipo nel titolo e nella briciola della scheda ("Domanda di sostegno N"). Va valutato alla
  prossima review completa dell'elenco operativo.

## 7. Stima dello score FULL per feature (100 - 3*MINORE - 1*COSMETICO)

`review-score.sh FULL` sui due file di finding: entrambi pass, rc 0.

| feature | CRITICO | MAGGIORE | MINORE | COSMETICO | score | verdetto atteso |
|---|---|---|---|---|---|---|
| elenco-operativo | 0 | 0 | 0 | 6 | 94 | PASS (EO-01 chiuso) |
| procedurale | 0 | 0 | 5 | 1 | 84 | PASS |

### Note sul verdetto
- **Sensibilita' del procedurale:**
  - con A2-01 come finding a se' (MINORE), lo score e' 81: ancora PASS;
  - con anche H2-02 MINORE attribuito al procedurale, e' 78: FAIL;
  - con ANT2-01 MAGGIORE, e' FAIL. Il motivo per cui resta MINORE e' al punto 3.
- **Correzioni:** i finding accettati restano da correggere in commit per sottoargomento, come dopo la passata 1.
  - PRO2-01 e PRO2-02 toccano lo stesso componente: conviene farli insieme.
  - PRO2-03 si fa dopo la decisione D4, con la riapprovazione del flusso `determine` se la scelta e' (b).
  - Poi va rifatto lo step8 delle due feature: ogni modifica invalida le approvazioni sha256 del gate.
  - La decisione D4 va registrata.
- **Budget:** questa e' la passata 2 di 3, e il verdetto non chiede una passata 3. Resta nel budget se l'utente vuole far
  verificare le correzioni della pagina delle determine (D4, PRO2-01 e PRO2-02), che toccano di nuovo il comportamento
  di D1.
