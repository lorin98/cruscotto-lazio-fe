# Judge: review step9 FULL sul delta del riallineamento degli ambiti (30/10/2026, passata 1 di 3)

**Perimetro**
- `git diff e0f6cb7 HEAD -- src tests wireframes uiplan.json route-manifest.json plan specs README.md`, verificato su HEAD
  6857940.
- Brief: `brief-comune.md`. Verdetto per feature.

**Prerequisiti**
- `step8-gate` done su tutte e cinque le feature, budget 3.
- `cross_model_review` assente nello stato delle cinque feature, quindi disabled (salto tracciato).

**Ingresso:** 31 finding.
- Lente V1: 6.
- Lente V2: 3.
- Lente H: 14.
- Lente A: 3, piu' 2 voci INFO.
- Antagonista: 5.
- Nessun CRITICO in ingresso.

Ho verificato ogni finding sul codice (file e riga reali, `git show`, grep), in sola lettura.

## 1. Gate non declassabili (prima del giudizio)

Li ho rieseguiti in sola lettura, con `CLAUDE_PLUGIN_ROOT` del plugin green-fe e `tools/vendor` in testa al PATH.

| feature | check-ui-authz.sh | fe-project-check.sh --built --catalog |
|---|---|---|
| finanziario | pass (8 route, 24 azioni) | pass, rc 0 |
| elenco-operativo | pass (3 route, 6 azioni) | pass, rc 0 |
| fisico | pass (4 route, 10 azioni) | pass, rc 0 |
| istituzionale | pass (3 route, 7 azioni) | pass, rc 0 |
| procedurale | pass (8 route, 31 azioni) | pass, rc 0 |

- **`contextProjection` come sicurezza:** nessun uso. Compare solo in `src/shared/api/auth/stato.ts`, dichiarata
  security-inert, e il delta non la tocca.
- **CSRF del mutator:** il delta di `src/shared/api` tocca solo il mock `auth-status.json` (profili allineati al catalogo
  rev. 4), non `mutator/bff-mutator.ts`.
- **Residui delle vecchie collocazioni:** nessuno nel codice, solo commenti che dicono lo spostamento.
  - Il finanziario non ha piu' la verifica SMP: il test `sigc/page.test.tsx:104-115` ne verifica l'assenza.
  - Il fisico non ha piu' le determine.
  - Il procedurale non ha piu' le Unit Amount.
  - L'istituzionale non ha piu' TX-0017.

Esito: nessun FAIL_AUTHZ e nessun CRITICO imposto dai gate.

## 2. Finding accettati per feature

### Finanziario: 2 COSMETICO
- **FIN-01** (H-09, declassato da MINORE a COSMETICO): `siNo` e `annoOpzionale` non hanno consumatori di produzione,
  restano solo i test (`finanziario/lib/formato.ts:12`). Codice morto senza effetti, come H2/H3 dell'istituzionale e H1
  delle card (precedenti: COSMETICO).
- **FIN-02** (H-10): `tipo: 'riserva'` e' rimasto con un solo valore (`lib/filtri.ts:30`). Lo scostamento era dichiarato
  e rimandato a dopo la fusione, che c'e' stata.

### Elenco operativo: 1 MAGGIORE
- **EO-01** (ANT-01, MAGGIORE, serve la decisione D1). Il link "Apri le determine della domanda nell'area Procedurale"
  (`SchedaDomanda.tsx:197`) passa solo il codice a barre.
  - **Verifica:**
    - Il contratto di TX-0020 (`openapi-procedurale.json`) ha solo `{codice}` nel path. Sceglie la domanda con la regola
      dell'aggancio (D-03 Rev. 1-3 di fisico) e la dichiara in `tipoDomanda`.
    - Il backend ammette lo stesso codice per due tipi (indice `UQ_DOMANDA_BARCODE_TIPO`).
    - Gli scenari approvati lo prevedono. In SC-PC_DETERMINA_TIPO il codice 34810022870 e' SOSTEGNO con G00010 e PAGAMENTO
      con G00011, e TX-0020 risponde con la PAGAMENTO. In SC-PC_DETERMINA_SCOPE_P4, per il P1, il codice 54810769588 da' la
      PAGAMENTO di Frosinone.
    - Dalla scheda SOSTEGNO, quindi, l'utente arriva alle determine dell'altra domanda, e "Apri la scheda della domanda"
      lo porta alla scheda PAGAMENTO.
    - Il wireframe approvato dice invece "Il link determine-della-domanda porta alla stessa domanda (il codice a barre
      della scheda)" (`dettaglio-domanda.md:48`). Il flusso determine del procedurale (`determine.md:85-86`) sa che un
      codice puo' essere di due domande, ma ne parla solo per il P4.
    - Nessun test usa un codice condiviso: le fixture della scheda sono PAGAMENTO/54230000001.
  - **Severita':**
    - Il codice rispetta la tabella dei parametri del wireframe (`codice = codiceABarre della scheda`), ma tradisce la
      promessa esplicita dello stesso wireframe in un caso modellato dal pack. Mostra le determine di un'altra domanda
      sotto l'etichetta "le determine della domanda".
    - La pagina d'arrivo dice il tipo nel badge ("Domanda di pagamento"), ma niente avvisa che non e' la domanda di
      partenza.
    - Il frontend potrebbe accorgersene: la scheda conosce il suo tipo e la risposta porta `tipoDomanda`. Non e' quindi
      solo un limite del contratto.
    - Comportamento sbagliato concreto rispetto a un wireframe approvato: resta MAGGIORE. E' diverso da X2 delle card
      (26/10), dove il frontend rendeva esattamente lo scenario del pack.

### Fisico: 6 MINORE, 2 COSMETICO
- **FIS-01** (V1-01, declassato da MAGGIORE a MINORE). Il test di SC-FS_UNIT_AMOUNT_AZIONE dichiara "alla lettura e al
  file", ma prova solo la lettura (`unit-amount/page.test.tsx:127`). Nessun test porta l'azione all'export.
  - Il codice e' corretto: lettura e file ricevono lo stesso `pagina.filtri` (`UnitAmount.tsx:105`, `:109`, `:119`), e
    la lettura con l'azione e' provata. Il rischio di regressione e' basso.
  - Precedenti: A-01 delle card (26/10) e A4 dell'istituzionale, cioe' test che dichiarano piu' di quanto provano con
    il codice corretto, classificati MINORE.
  - Con la lettura letterale del brief ("un test che non prova cio' che dichiara") sarebbe MAGGIORE, e il fisico
    sarebbe FAIL.
- **FIS-02** (V1-03 + A-02 + H-02, uniti, MINORE): la voce "Fisico" del percorso e' fissa su `/fisico/superfici`
  (`PaginaReport.tsx:87`), senza il grant della destinazione. Prima dello spostamento seguiva il grant, e il dettaglio
  della stessa feature lo fa ancora. Col catalogo rev. 4 l'effetto non si vede.
- **FIS-03** (V1-04 + A-03, uniti, MINORE): nessun test di pagina per il ramo `soloUnitAmount` del dettaglio ne' per il
  solo csr.tx-0017.read (`DettaglioIntervento.tsx:57`).
- **FIS-04** (ANT-02, MINORE): se TX-0017 e TX-0018 falliscono insieme, la pagina nasconde anche la scheda Unit Amount
  gia' letta (`DettaglioIntervento.tsx:187`). Il wireframe `intervento.md:128-129` dice "non ferma le altre". Caso raro
  (due 503 insieme), ma reale arrivando dal drawer.
- **FIS-05** (H-01, MINORE): `PaginaReport` del fisico ricopia lo scheletro dell'istituzionale, circa 35 righe, sopra la
  soglia di 15 della checklist.
- **FIS-06** (H-04, MINORE): `ultimiDelDettaglio`, `ultimoDatoInErrore`, `titoloIntervento` e `BarraRiferimenti` sono
  ricopiati dall'istituzionale, con un algoritmo gia' diverso: ordine delle schede contro prima risposta arrivata
  (`lib/intervento.ts:107`). Oggi l'effetto non si vede (SC-FS_ULTIMO_DATO: stesso elenco), ma la testata del componente
  descrive la regola dell'altra copia.
- **FIS-07** (H-03, declassato da MINORE a COSMETICO): `NON_DISPONIBILE_BREVE` e `resaAssenza` sono copiati identici dal
  procedurale (`lib/formato.ts:154`). Una costante e una funzione di due righe, senza divergenze: COSMETICO come H1 delle
  card.
- **FIS-08** (H-05, COSMETICO): residuo `onRiga` facoltativo e colonne ricopiate in `TabellaUnitAmount.tsx:41`.

### Istituzionale: 5 MINORE, 5 COSMETICO
- **IST-01** (ANT-03, MINORE). Con le letture per scheda, l'errore dell'unica lettura partita nasconde tablist, l'altra
  scheda e il selettore (`lib/intervento.ts:112`). L'utente non puo' scegliere un altro esercizio, ha solo Riprova sulla
  stessa lettura (con TEMPO_SCADUTO puo' ripetersi). Il test `interventi/page.test.tsx:339` dichiara "la scheda dice il
  testo statico", ma la scheda in quello stato non c'e'.
- **IST-02** (ANT-04, MINORE): conteggio delle letture senza attendere nel test col solo grant di TX-0015
  (`interventi/page.test.tsx:384`). E' lo stesso difetto di PRO-01 (A-01): un finding per feature, perche' i file sono
  diversi. MINORE come A-01 delle card (gate di UX, il backend risponde 403).
- **IST-03** (V1-05, MINORE): l'ultimo esercizio chiuso della card si calcola nel fuso del browser
  (`lib/criteri.ts:68`). L'errore riguarda poche ore l'anno e solo fusi diversi da Europe/Rome, ma il brief chiede di
  valutare "fuso orario, data del browser", e il test della card ricalcola l'atteso con la stessa funzione.
- **IST-04** (H-07, MINORE): la regola del periodo SIGC e' sparsa fra componenti e lib, con copie gia' divergenti. La
  scheda SIGC dice "domande dell'anno n-1" nella caption e "non disponibile" nella voce quando `annoDomande` manca, che
  il contratto ammette.
- **IST-05** (H-11, MINORE): `ValoreDelDatoSigc` usa cast non verificati (`ui/comuni.tsx:33`). Lo spostamento ha perso
  il controllo a compilazione che il finanziario aveva. Stessa classe di H2 della review delta del 21/10 (MINORE).
- **IST-06** (H-08, declassato da MINORE a COSMETICO): tre funzioni di una riga copiate identiche dal finanziario
  (`lib/formato.ts:80`), senza divergenze, come H1 delle card.
- **IST-07** (H-12, COSMETICO): `lettureDelloStato` impacchetta la risposta SIGC in `righe` per aggirare la regola del
  vuoto del kit.
- **IST-08** (H-13, COSMETICO): `VERIFICA_SMP_SIGC` e `ricercaConAnno` restano senza consumatori di produzione.
- **IST-09** (V1-06, COSMETICO): il suggerimento della pagina del codice non valido nomina solo la verifica non SIGC.
- **IST-10** (ANT-05, COSMETICO): senza il legame interventi-azioni, la frase reciproca fra le verifiche perde `azione`,
  mentre il menu la porta. L'azione non si applica comunque in nessuna delle due pagine: nessun dato diverso.

### Procedurale: 3 MINORE, 2 COSMETICO
- **PRO-01** (A-01, declassato da MAGGIORE a MINORE). In `determine/page.test.tsx:48` e `:140` l'asserzione
  `lette = []` e' sincrona e non puo' vedere una lettura.
  - La verifica conferma: l'handler MSW registra dopo, e col codice non valido nemmeno il DOM la rivelerebbe.
  - Una lettura spuria qui produrrebbe un 400 dal backend, senza perimetro coinvolto. Il 404 indistinguibile del P4 e'
    provato con attese vere (`:186-204`).
  - Precedente: A-01 delle card (MINORE).
  - Il test era gia' cosi' nel fisico (e0f6cb7, righe 45 e 136) ed e' entrato nel delta con lo spostamento.
- **PRO-02** (V2-01, MINORE, serve la decisione D2): lo stato d'errore 403/429/503 non ha "Cerca un altro codice",
  mentre il wireframe approvato il 30/10 lo prevede (`determine.html:141`).
  - Lo scostamento era gia' nel fisico (wireframe del 22/10 con lo stesso link) e non e' mai stato registrato come
    deviazione.
  - Il modulo di ricerca resta sopra l'avviso, quindi l'impatto e' basso.
- **PRO-03** (H-14, MINORE): percorso e grant delle determine sono riscritti come letterali (`lib/pagine.ts:19`,
  `lib/grant.ts:23`) invece di usare il contratto condiviso di `entities/domanda`, creato in questo delta proprio per
  quello. Basta cambiare un solo posto per separare la voce di menu dal link dell'elenco.
- **PRO-04** (V2-02, declassato da MINORE a COSMETICO): commenti con gli ID di scenario SC-FS_DETERMINA*, che non ci
  sono piu'. La tracciabilita' richiesta dal gate per vitest e' il tag del REQ (RF020), che c'e'. Il `test_tag` degli
  scenari e' obbligatorio solo negli e2e (step10). Restano commenti: COSMETICO.
- **PRO-05** (V2-03, COSMETICO): OP-PR-14 dello uiplan non e' aggiornato dopo la chiusura di OP-EO-07.

## 3. Finding rigettati, uniti o declassati

### Rigettati (2)
- **V1-02** (MINORE, fisico): pill del perimetro delle Unit Amount senza "dati di programma, uguali per ogni profilo",
  mostrata solo a risposta arrivata.
  - **Motivo: conforme al wireframe approvato.** `unit-amount.md:62` dichiara "pill del perimetro | perimetro (sempre
    REGIONALE) | PagamentiUnitAmount", cioe' il campo della risposta.
  - Nei wireframe del fisico il testo "Perimetro: regionale, sempre (...)" e' un'annotazione, come per le superfici, che
    rendono "Perimetro: regionale" dalla risposta (`SuperficiAmmissibili.tsx:39`, gia' rivisto).
  - Per l'output regionale il dossier del fisico elenca "pill del perimetro" fra i cambi approvati.
  - L'informazione "dati di programma, regionali per ogni profilo" resta nella nota della pagina (il test lo verifica in
    `unit-amount/page.test.tsx:67`).
- **H-06** (COSMETICO, fisico): l'espressione "codice - descrizione" e' scritta in tre drawer.
  - **Motivo:** e' un'espressione di una riga, sotto ogni soglia, e non viola nessuna regola. E' stile, che il brief
    esclude ("Niente stile").

### Uniti (3 assorbiti)
- A-02 e H-02 in V1-03 (FIS-02).
- A-03 in V1-04 (FIS-03).
- A-01 e ANT-04 sono lo stesso difetto (conteggio senza attesa) in due feature e due file: restano due finding,
  PRO-01 e IST-02, con riferimento incrociato.

### Declassati (6)
| finding | da | a | motivo |
|---|---|---|---|
| V1-01 | MAGGIORE | MINORE | codice corretto e titolo che promette troppo |
| A-01 | MAGGIORE | MINORE | gate di UX, 400 dal backend, nessun perimetro coinvolto; precedente A-01 delle card |
| H-03 | MINORE | COSMETICO | copie minime identiche, come H1 delle card |
| H-08 | MINORE | COSMETICO | copie minime identiche, come H1 delle card |
| H-09 | MINORE | COSMETICO | codice morto, come i precedenti dell'istituzionale |
| V2-02 | MINORE | COSMETICO | solo commenti |

### Finding contestati (CRITICO rigettati)
Nessuno: in ingresso non c'era nessun CRITICO, e i gate non ne impongono.

## 4. Decisioni che servono all'utente

### D1 (EO-01, elenco operativo): link alle determine con un codice a barre condiviso fra SOSTEGNO e PAGAMENTO
Le tre strade:
- **(a) Avviso sulla pagina d'arrivo.** Il link porta il tipo della scheda nello state della navigazione, mai
  nell'URL, come la scheda d'arrivo delle Unit Amount. Se `tipoDomanda` della risposta e' diverso, la pagina delle
  determine lo dice in role=status, per esempio: "Il codice a barre 34810022870 e' anche di una domanda di pagamento:
  qui le sue determine; quelle della domanda di sostegno sono nella sua scheda, scheda Determine".
  - Solo frontend.
  - Tocca la pagina del procedurale: va riapprovato il flusso `determine` e il procedurale ripassa in review.
  - Senza state, per esempio dopo un ricarica o con un indirizzo condiviso, l'avviso non c'e'.
- **(b) Etichetta onesta.** Il link diventa "Apri le determine del codice a barre nell'area Procedurale" e la frase di
  `dettaglio-domanda.md:48` si corregge.
  - Va riapprovato `dettaglio-domanda`.
  - Costa poco, ma l'utente arriva lo stesso alle determine dell'altra domanda senza un avviso esplicito.
- **(c) Parametro del backend.** Un parametro facoltativo `tipo` di TX-0020, con open point a green-be.
  - E' la soluzione esatta.
  - Cambia il contratto e il backend gia' chiuso: nuova review del backend e refresh del frontend.

In ogni caso serve un test con la scheda SOSTEGNO 34810022870 e la risposta PAGAMENTO.

**Raccomandata: (a).** Si resta nel frontend, l'utente e' avvisato proprio nel caso che conta, e la pagina resta
indirizzabile col solo codice. Va valutata (c) se ARSIAL conferma che i codici condivisi sono frequenti nei dati reali.

### D2 (PRO-02, procedurale): stato d'errore 403/429/503 delle determine
- **(a) Allineare il codice al wireframe approvato.** "Cerca un altro codice" anche nell'avviso degli errori diversi da
  404/400, col focus al campo; Riprova resta secondo la politica comune. Nessun wireframe da riapprovare.
- **(b) Accettare l'avviso con Riprova come deviazione.** La deviazione si registra nello uiplan del procedurale
  (open point o `deviations_reviewed`), e il test `:217` dice che e' la deviazione approvata.

**Raccomandata: (a).** Costa poco ed e' quello che l'utente ha approvato il 30/10.

### D3 (IST-03, facoltativa, il finding resta comunque): ultimo esercizio chiuso e fuso orario
Fra le due correzioni:
- calcolo nel fuso Europe/Rome con `Intl.DateTimeFormat` e un test a cavallo del confine (raccomandata);
- limite dichiarato in OP-IS-11.

## 5. Stima dello score FULL per feature (100 - 3*MINORE - 1*COSMETICO)

| feature | CRITICO | MAGGIORE | MINORE | COSMETICO | score | verdetto atteso |
|---|---|---|---|---|---|---|
| finanziario | 0 | 0 | 0 | 2 | 98 | PASS |
| elenco-operativo | 0 | 1 | 0 | 0 | 100 | **FAIL** (MAGGIORE EO-01) |
| fisico | 0 | 0 | 6 | 2 | 80 | PASS (sulla soglia) |
| istituzionale | 0 | 0 | 5 | 5 | 80 | PASS (sulla soglia) |
| procedurale | 0 | 0 | 3 | 2 | 89 | PASS |

### Note sul verdetto
- **Fisico e istituzionale sono esattamente sulla soglia di 80.**
  - Il PASS del fisico dipende dal declassamento di V1-01. Con V1-01 MAGGIORE, oppure con un solo MINORE in piu', e'
    FAIL.
  - Il PASS dell'istituzionale dipende da IST-06 (H-08) come COSMETICO. Con H-08 MINORE, letto come "duplicazione sotto
    soglia" secondo la definizione della checklist, lo score e' 78 e il verdetto FAIL.
  - Il PASS del procedurale dipende dal declassamento di A-01.
- **L'elenco operativo e' FAIL per EO-01.** Si chiude solo con la decisione D1 e la sua attuazione, poi una passata 2.
  - Se l'utente sceglie (a), la passata 2 deve includere anche il procedurale, perche' cambia la pagina delle
    determine e va riapprovato il flusso `determine`.
- **Correzioni e passata 2.** I finding accettati delle feature in PASS restano da correggere, come i residui delle
  review precedenti, in commit per sottoargomento.
  - Le correzioni comuni toccano piu' feature: FIS-05 e FIS-06 toccano anche l'istituzionale, FIS-07 il procedurale,
    IST-06 il finanziario.
  - Dopo le correzioni va rifatto lo step8 delle feature toccate, perche' ogni modifica invalida le approvazioni
    sha256 del gate.
  - Le decisioni D1 e D2 vanno registrate.
