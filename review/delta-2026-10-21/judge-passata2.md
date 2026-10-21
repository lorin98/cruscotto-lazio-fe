# Judge, review step9 FULL sul delta FE 14/10-21/10/2026, passata 2

Perimetro: `git diff 2f73d85 8d69122` (correzioni della passata 1, commit da 78ea08e a 253790d, e riapprovazione dei
wireframe del 21/10), feature `finanziario` ed `elenco-operativo`, intensita' FULL. Ho verificato ogni finding in sola
lettura sul codice HEAD (0693448), con Read, grep, git show e git blame.

Finding in ingresso: 11 (lente V 5, lente H 4, lente A 2, antagonista 0). L'antagonista ha consegnato `[]` e una nota sulla
regola D4 del backend, che riporto in fondo.

## Gate non declassabili (pre-Judge)

- Fedelta' authz: `check-ui-authz` e `fe-project-check --built --catalog` sono verdi (rieseguiti dalla lente A), e lo
  step8 del 21/10 (0693448) e' 11/11. FAIL_AUTHZ non scatta. La lettura nuova di TX-0060 dalla scheda della domanda passa
  da `puoLeggere(auth.data, 'filtri')` (`SchedaDomanda.tsx:125`): senza `csr.tx-0060.read` non parte nessuna richiesta, come
  prova `scheda-domanda.test.tsx:132-136`. Non c'e' widening, e transazioni e grant dichiarati della route non cambiano
  (OP-EO-06).
- `contextProjection` usata come sicurezza e CSRF disattivato nel mutator BFF: il diff non tocca `contextProjection`, il
  mutator, `withCredentials` ne' `innerHTML`. Nessun CRITICO imposto.
- La regola data-access del `judge-brief.md` (jOOQ/CallableStatement) e' del backend e qui non si applica.

## (a) Finding della passata 1: tutti risolti

Ho controllato i 16 accettati sul codice HEAD. Nessuno va ripresentato.
- V1: righe tipizzate con si', no, NON_VALORIZZATO e FONTE_NON_ATTIVA (`verifica-smp/page.test.tsx:38-41`); nei casi
  limite le celle di SRA01 e SRA03 (`finanziario-casi-limite.test.tsx:540-541`).
- X1: la vista Tabella si sceglie prima del clic sulla riga (`e2e/csp.spec.ts:199`); l'e2e e' eseguito e registrato nel
  resoconto.
- X2: con la fonte non attiva l'assenza ha la fonte, nella vista procedurale e nella scheda. Il ramo principale e'
  corretto; il ripiego che resta e' il finding V1 qui sotto.
- V2: `TESTO`, con `ui-num` assente da th e td (`page.test.tsx:73-74`).
- V3: pulsante "Togli il filtro" presente; il fuoco dopo il clic e' il finding V2 qui sotto.
- V4: `/pagamenti` passa da `rifiutaConcessione` (`esempio.ts:182`).
- V5, V6, X3, X3-b (interruttore di pagina Grafico | Tabella), X4, V7 (OP-EO-06), V8 e H1 (resa unica): risolti.
- H2: `DatoMotivatoDi` copre i quattro campi.
- H4: risolto nei punti indicati. Il residuo segnalato da H4 di questa passata e' anteriore al delta (vedi sotto).

## Valutazione Finding

### Atto di concessione con TX-0060 non letto: V1, H1, A1 deduplicati

#### V1: Atto di concessione con TX-0060 in caricamento o in errore: la vista procedurale e la scheda dicono 'nessun atto' anche con la fonte non attiva
- **Verdetto**: ACCETTATO (assorbe H1 e A1)
- **Motivo**: verificato. `attoSenzaFonte` vale solo con `fonteAttiva === false` (`formato.ts:128-129`). Con il valore
  assente, cioe' lettura in corso, errore o nessun grant, `testoAtto` (`formato.ts:140`) e `resaAtto` (`colonne.tsx:41-42`)
  scrivono "nessun atto". Lo stato ignoto viene quindi trattato come "fonte attiva".
  - Nella scheda la lettura parte solo quando `Sintesi` e' montata, dopo TX-0058 (`SchedaDomanda.tsx:123-130`). Se la
    scheda si apre da un indirizzo, a cache vuota, si legge "nessun atto" per tutta la durata di TX-0060.
  - Se TX-0060 fallisce, "nessun atto" resta per sempre, e nella scheda non compare nessun segnale.
  - I due test "con la fonte attiva" passerebbero anche se TX-0060 non rispondesse mai: `scheda-domanda.test.tsx:128-129`
    aspetta la richiesta e non la risposta, e `interrogazione-stati.test.tsx:363` accetta il primo render.

  F1 dice "con la fonte non attiva [...] mai nessun atto", e oggi la fonte non e' attiva sia nel mock sia nel DB simulato.
  Il ripiego l'ha scelto il resoconto, non l'utente, e OP-EO-06 non lo registra.
- **Severita' finale**: MINORE. Le tre lenti, indipendenti, concordano. Il caso di X2 (ogni riga, sempre, con la fonte non
  attiva) e' risolto e provato. Resta l'"ignoto = attiva" su due percorsi secondari: la finestra di attesa di una lettura
  e l'errore di TX-0060 con TX-0058 riuscita. Il caso "senza grant" non esiste nel catalogo: gli 11 profili con TX-0058
  hanno anche TX-0060. Non e' il test vacuo di V1 della passata 1, perche' i test sulla fonte non attiva falliscono se lo
  stato finale dice "nessun atto". La correzione e' comunque da fare: e' la regola delle assenze approvata (nessun "no"
  inventato) applicata allo stato ignoto, e non richiede una decisione.

#### H1: Atto di concessione: un TX-0060 non letto (in attesa o in errore) conta come fonte attiva
- **Verdetto**: DUPLICATO di V1 (assorbito)
- **Severita' finale**: vedi V1

#### A1: Atto di concessione: con TX-0060 in attesa o in errore la scheda e la vista procedurale dicono ancora 'nessun atto'
- **Verdetto**: DUPLICATO di V1 (assorbito). Due parti entrano nel fix di V1: spostare `useValoriFiltri` in `SchedaDomanda`,
  cosi' TX-0058 e TX-0060 partono insieme, e le attese corrette dei due test "con la fonte attiva".
- **Severita' finale**: vedi V1

### Pulsante "Togli il filtro Atto di concessione": V2, A2 deduplicati

#### V2: 'Togli il filtro Atto di concessione' sparisce al clic senza spostare il fuoco (WCAG 2.4.3)
- **Verdetto**: ACCETTATO (assorbe A2)
- **Motivo**: verificato. Il pulsante e' montato solo se `sel('concessione').length > 0` (`PannelloFiltriElenco.tsx:110`).
  L'`onClick` (riga 111) svuota il criterio e smonta il pulsante che ha il fuoco, e nessun codice sposta il fuoco altrove.
  Nel `Modal` di react-aria (`PannelloLaterale.tsx:28`) il fuoco finisce sul body o sul primo elemento del dialogo,
  lontano dal gruppo "Stati". La regola esiste gia' per i chip (`BarraFiltri.tsx:3-4`, review v1 X-02). Il test
  (`interrogazione-stati.test.tsx:312-314`) non controlla dove va il fuoco, e axe gira prima del clic.
- **Severita' finale**: MINORE

#### A2: 'Togli il filtro Atto di concessione' sparisce al clic e il focus finisce sul nulla
- **Verdetto**: DUPLICATO di V2 (assorbito). Il suo fix, cioe' la nota con `tabIndex={-1}` come destinazione e
  l'asserzione su `document.activeElement`, e' quello adottato.
- **Severita' finale**: vedi V2

### Altri finding

#### V3: La scheda della domanda rende attoConcessioneDisponibile di TX-0060, ma la provenienza del campo non e' tracciata
- **Verdetto**: ACCETTATO
- **Motivo**: verificato. Fra i field della route `/elenco-operativo/domande/:tipo/:codiceABarre` ci sono gli atti di
  `DomandaElenco` (`uiplan.json:1075-1084`), ma non `filtri.attoConcessioneDisponibile`, che e' tracciato solo per
  `/domande` (riga 889) e `/pagamenti` (riga 1519). La nota della fonte della sintesi dice ancora "Fonte: TX-0058"
  (`SchedaDomanda.tsx:136`), ma "fonte atto di concessione non attiva" viene da TX-0060. OP-EO-06 registra la lettura, non
  la provenienza per campo, che e' un controllo della lente V.
- **Severita' finale**: MINORE

#### V4: Vista procedurale: l'atto senza la fonte e' l'unica assenza in badge in una tabella dove le altre assenze sono testo
- **Verdetto**: ACCETTATO
- **Motivo**: verificato. Nella stessa tabella `resaAtto` rende `AssenzaMotivata` (badge piu' nota, `colonne.tsx:42`),
  mentre importi, CUAA e superfici sono testo (`colonne.tsx:18, 30-37`). Anche il wireframe approvato scrive l'assenza in
  cella come testo (`domande.html:240`). La scheda usa gia' il testo con la nota fra parentesi (`formato.ts:140`).
- **Severita' finale**: COSMETICO

#### V5: Il flusso riepilogo riapprovato rimanda al prototipo, ma il prototipo apre ancora il riepilogo sulla tabella
- **Verdetto**: ACCETTATO, col fix spostato fuori dal flusso approvato
- **Motivo**: verificato. `riepilogo.md:18` e `:64` rimandano al prototipo per la resa, e `prototipo.js:568-569` ha il
  sottotitolo vecchio e "Tabella | Grafico" con la tabella visibile. Il codice segue il flusso riapprovato, che e' l'ultima
  approvazione del contenuto. Il prototipo serviva ad approvare il linguaggio visivo (`prototipo/finanziario/README.md`).
  Il fix proposto dalla lente in alternativa tocca `riepilogo.md` e invaliderebbe l'hash appena riapprovato. Il fix
  accettato e' una nota nel README del prototipo, che non e' sotto hash; riallineare `prototipo.js` resta possibile, ma
  solo con l'ok dell'utente.
- **Severita' finale**: COSMETICO

#### H2: L'interruttore di pagina del riepilogo (SceltaVista) copia a mano l'InterruttoreVista del kit
- **Verdetto**: ACCETTATO
- **Motivo**: verificato. `SceltaVista` (`RiepilogoReport.tsx:174-185`) ripete `InterruttoreVista`
  (`CardGrafico.tsx:27-38`, non esportato): cambiano solo `aria-label` e `mb-3`. L'ordine uguale chiesto da X3-b dipende
  quindi da una convenzione fra due copie. E' una duplicazione sotto soglia, cioe' MINORE per la checklist, e non c'e'
  regressione.
- **Severita' finale**: MINORE

#### H3: Resa unica dei dati motivati, due residui: 'testo (nota)' ricopiata e tipo ValoreMotivato<T> omonimo del componente
- **Verdetto**: ACCETTATO
- **Motivo**: verificato.
  - `conNota` (`formato.ts:16`), estratta in questo delta, ha lo stesso corpo della coda di `assenzaImporto`
    (`finanziario/lib/importi.ts:17-18`).
  - Il tipo `ValoreMotivato<T>` di `elenco-operativo/lib/dto.ts:9` ha lo stesso nome del componente nuovo dell'entity
    (`entities/importo/index.ts:5`). Non c'e' conflitto di compilazione: si confonde chi legge.
- **Severita' finale**: COSMETICO

#### H4: Costruttori dei dati di prova unificati solo in parte
- **Verdetto**: ACCETTATO IN PARTE (solo il commento); la parte sulla duplicazione e' contestata
- **Motivo**: con `git blame`, `euro` (`finanziario-casi-limite.test.tsx:35` e `finanziario-ui.test.tsx:47`, 08/10),
  `NON_VALORIZZATO` (`casi-limite:56`, 09/10) e `nv` (`interventi/page.test.tsx:216`, 13/10) sono anteriori al perimetro
  del delta. H4 della passata 1 e' risolto nei punti indicati, e riproporre quei residui contraddice l'anti-inflation del
  brief. Resta il commento nuovo `testing/fixture.ts:7-8` ("un solo insieme di costruttori per fixture e test"), che
  promette piu' di quanto il codice fa.
- **Severita' finale**: COSMETICO (sul commento)

## Riepilogo

- Finding in ingresso: 11. Accettati: 8, cioe' 0 CRITICO, 0 MAGGIORE, 4 MINORE e 4 COSMETICO.
  - MINORE: V1, V2, V3, H2
  - COSMETICO: V4, V5, H3, H4
- Duplicati assorbiti: 3 (H1 e A1 in V1; A2 in V2).
- Declassati: 0. Rigettati: 0. Contestati in parte: 1 (H4). Il fix di V5 e' spostato fuori dal flusso approvato.
- Score: 100 - (4 x 3 + 4 x 1) = 84, quindi la FULL passa: 0 CRITICO, 0 MAGGIORE e score >= 80. Il verdetto lo da'
  `review-score.sh` su `../delta-2026-10-21-findings-passata2.json`.
- Raccomandazione: correggere V1 prima di chiudere. Il gate passa anche senza, ma oggi, con la fonte non attiva, il
  ripiego contraddice F1 sulla scheda aperta da un indirizzo. Gli altri sette si possono correggere nello stesso giro o
  tracciare come debito.

## Finding contestati

Nessun CRITICO rigettato. Contestazioni parziali, per trasparenza verso il dev:
- **H4, duplicazione di `euro`, `NON_VALORIZZATO` e `nv` nei test**: e' anteriore al delta (08-13/10, prima di 88f0069) e
  H4 della passata 1 e' risolto nei punti che indicava. Entra solo il commento della fixture.
- **V5, fix alternativo su `riepilogo.md`**: non adottato, perche' invaliderebbe l'hash del flusso riapprovato il 21/10.
- **V1, "caso senza grant da decidere con l'utente"** (fix di V1 e H1): non e' una decisione necessaria. Il caso non
  esiste nel catalogo, e lo stato ignoto si rende con l'assenza neutra della regola gia' approvata.

## Decisioni da chiedere all'utente

Nessuna decisione bloccante: gli 8 accettati hanno un fix che discende da decisioni e regole gia' approvate (F1, la regola
delle assenze, X-02, OP-EO-06). Due punti da far confermare all'utente, senza fermare il lavoro:
- **V1, testo dello stato ignoto**: con TX-0060 non letto (in attesa, in errore o senza grant), "non disponibile" senza
  nota (`descriviAssenza(undefined)`), al posto di "nessun atto". **Raccomandazione: si'**. E' il testo gia' usato per
  ogni assenza senza motivo. L'alternativa, cioe' tenere "nessun atto" come ripiego e registrarlo in OP-EO-06, contraddice
  F1 proprio con la fonte non attiva di oggi.
- **V5, prototipo**: nota nel `README.md` del prototipo (raccomandata, nessun artefatto approvato toccato) oppure
  riallineamento di `/riepilogo` in `prototipo.js`, che si fa solo se l'utente lo vuole.

## Nota dell'antagonista sulla regola D4 del backend (non e' un finding FE)

`attoConcessioneDisponibile` e il 400 sul filtro `concessione` vengono dalla stessa sonda sull'intero database, non sul
perimetro del profilo (D4 e `elenco-operativo-decisions.json`, D-02 Rev. 5-6). Il frontend la consuma correttamente:
con la fonte attiva una domanda senza l'atto non ha davvero l'atto, e "nessun atto" e' vero anche per un profilo ADA
nelle cui domande non ce n'e' nessuno. La conseguenza da far sapere all'utente sta nel backend: basta una sola domanda
con l'atto perche' la fonte risulti attiva, e allora ogni domanda senza l'atto dice "nessun atto", anche se la fonte fosse
caricata solo in parte. E' una scelta approvata (D4) e non richiede azioni sul frontend. Se l'utente prevede caricamenti
parziali della fonte dell'atto, va riconsiderata nel backend, non qui.
