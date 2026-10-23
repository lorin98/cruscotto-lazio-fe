# Correzioni della review step9 FULL del procedurale, v1 iterazione 1 (23/10/2026)

Giro di correzione dei finding accettati dal Judge (`judge.md`, `../../procedurale-findings.json`: 20 MINORE e 3
COSMETICO, score 37), nell'ordine consigliato dalle "Note per il giro di correzione". Base: `94e1d59` (review). Commit su
`main`, uno per finding, **non pushati**. Nessuna modifica a `.claude/state/`, wireframe, uiplan, route-table, route-manifest,
dossier, backend o plugin; lo step8 non e' stato lanciato (lo fa la sessione principale).

- **V1 e V5** dipendono da D1 e D2. Le ha fatte la sessione principale nel commit `947fc54`, arrivato durante il giro fra V4 e
  A1: TX-0025 nello uiplan, nella route-table e nel manifest della route del dettaglio; la deviazione D2 nei
  `deviations_reviewed` del gate `wireframe_panoramica`. Qui ci sono solo i due test: quello di V1 previsto dal fix
  accettato e quello facoltativo di V5. Nessuna registrazione nello stato.
- I miei commit aggiungono i file per nome. Il working tree conteneva le modifiche ancora non committate di D1, che non sono
  entrate nei miei commit.

Per ogni correzione il test nuovo o adattato e' stato provato rosso togliendo temporaneamente la correzione: i sorgenti
tornavano alla versione di HEAD, con uno script in scratchpad che poi rimetteva la copia salvata. Per i finding di soli
test (V1, V5) e per le parti che lo chiedevano (V7, A5, H3) la prova e' stata una mutazione del codice. Poi il test e'
stato provato verde con la correzione.

## Finding fatti

| finding | commit | cosa e' cambiato | test che lo prova | effetti sul codice comune e sulle altre feature |
|---|---|---|---|---|
| **X1** | `eaf9f9f` | `NessunaDomanda` del dettaglio tace se una delle letture della pagina (TX-0026..TX-0028) non ha risposto (`senzaRisposta`): una lettura in errore non conta come zero | `interventi/page.test.tsx`: TX-0027 a 503 con `?stato=DECADENZA_TOTALE` (riga di SRD01 a 0 ammesse, TX-0028 col totale 0): un solo avviso, nessun "Nessuna domanda di SRD01" | nessuno |
| **V4** | `24860d2` | `testoVuoto` resta per i soggetti che contano domande, con `nellaTuaArea(perimetro)`; per gli interventi `testoNessunIntervento(conFiltri)` ("Nessun intervento [per i filtri scelti].", il testo dei wireframe) in panoramica, domande ammesse e riepilogo | `panoramica/page.test.tsx`: il test con una risposta ADA senza righe (che il backend non produce) diventa il caso di SC-PC_SCOPE_P4 (righe degli interventi a zero domande, KPI a 0, "0 su 3", pill in evidenza, vuoti delle domande con l'area, nessun "Nessun intervento" ne' avviso); nuovo test col perimetro ADA e `?os=OS9`: "Nessun intervento per i filtri scelti.", rosso senza la correzione; L1 dei due testi | nessuno |
| **A1** | `8a324fc` | `testoNessunaDomanda(codice, conStato, perimetro)` (lib/intervento) con la regola di V4: col perimetro ADA "Nessuna domanda di SRD01 nella tua area (perimetro ADA)." (anche con lo stato scelto). Fatta anche la parte facoltativa: il chip della barra senza stato dice "... tutte le domande dell'intervento nella tua ADA" (`testoSenzaStato`) | `interventi/page.test.tsx`: le tre letture ADA a zero domande per SRD01 (pill in evidenza, vuoto e chip della barra con l'ADA, nessun "nei report procedurali"); L1 dei due testi | nessuno |
| **A2** (assorbe H7) | `539164a` | `motivoSenzaLink(voce, conRilasciate)` in lib/collegamenti: "nessun link (fonte non attiva)", "nessuna domanda", "nessuna domanda rilasciata" (solo per gli stati della domanda), "non apribile nell'elenco (codice di stato non esprimibile)". La cella "Elenco operativo" rende quel testo. Il clic sulla barra dell'area nella panoramica filtra solo con `chiaveStatoValida`. Parti di H7: `apreLaVoceDellArea` in lib (panoramica e scheda Area) e `codiceDellaRiga` nella scheda Area. Commento di `CHIAVE_STATO` corretto. **Non fatta** la parte facoltativa 4 (`CHIAVE_STATO` col dominio del backend): cambierebbe la validazione dell'indirizzo | L1: il motivo per voce, un codice osservato accentato (`REVOCATÀ`) senza link e "non apribile", nessuna voce dell'area con "nessuna domanda rilasciata". `panoramica/page.test.tsx` con un riepilogo che porta `REVOCATÀ`: il clic sulla barra non cambia l'indirizzo, la cella dice "non apribile...". Provati rossi anche separatamente (solo `comuni.tsx`: la cella diceva "nessuna domanda rilasciata"; solo `Panoramica.tsx`: l'indirizzo prendeva `stato=REVOCAT%C3%80`) | nessuno |
| **X2** | `c477e4c` | In `PaginaStati` la voce scelta che non e' piu' fra quelle del totale torna a null nel render (stato derivato): chip e filtro della tabella non ricompaiono da soli | `stati-sostegno/page.test.tsx`: clic su SOSPESA (SRA01), poi `?intervento=SRD01`, poi Indietro del router: nessun gruppo "Filtro della tabella dal grafico" e la tabella con le tre righe | nessuno |
| **V2** | `57f6d45` | `TabellaVoci` ha la colonna facoltativa "Tabella per intervento" con "Filtra la tabella" (nome accessibile "Filtra la tabella su <voce>", `aria-label` che comincia col testo visibile) per ogni voce con domande; la colonna dell'elenco c'e' solo col link. `CardStati` con `onFiltra` usa la tabella equivalente anche senza il grant dell'elenco; la passa solo `ReportStati` (pagine degli stati) | `stati-sostegno/page.test.tsx` col profilo senza `csr.tx-0056.read`: vista Tabella della card, i pulsanti delle sole voci con domande, Invio su SOSPESA: il chip della voce e la tabella col solo SRA01. Adattata la riga attesa di "In compilazione" (ora col pulsante) | nessuno: solo le pagine degli stati del procedurale (panoramica e dettaglio senza `onFiltra`) |
| **X3** | `7ca2cb4` | `DatoPagato` ha la prop `breve`, vera solo nelle colonne della tabella (sotto la nota unica); il drawer rende i tre dati del pagato col motivo ("non disponibile" + "fonte pagato per Unit Amount non attiva"), come il wireframe dell'anteprima. `assenzaPagato(r, campo, breve)` | `unit-amount/page.test.tsx`: senza pagato, Invio sulla riga di UA1 2025: il dialogo dice il motivo per importo pagato, pagato sul richiesto e base storica; L1 di `assenzaPagato` breve e completa | nessuno |
| **V3** | `5e993e7` | In `graficoUnitAmount` con la fonte del pagato non attiva le celle della tabella equivalente sono in breve (`resaAssenza(d, true)`: "non disponibile"; un'altra assenza resta col motivo); il motivo lo dice una volta il testo della card | L1 della tabella (tre righe "non disponibile", una base storica NON_VALORIZZATO col motivo); `unit-amount/page.test.tsx`: la riga di UA1 2025 nella tabella della card | nessuno |
| **X4** | `1dbfa8f` | `voceDellaColonna(riga, sezione, stato)` (lib/riepilogo) restituisce la voce con motivo e fonte; le colonne delle voci la rendono con `AssenzaMotivata` quando le domande sono null, nelle righe e nel piede del totale | `riepilogo/page.test.tsx`: vista Tabella, da Colonne "In compilazione" del Pagamento: la cella di SRD01 e quella del piede dicono "non disponibile" + "fonte domande in compilazione non attiva"; L1 di `voceDellaColonna` | nessuno |
| **V7** (assorbe A4 e H4) | `f999151` | `TabellaInterattiva` calcola una volta l'intestazione di riga: la colonna data se visibile, altrimenti la prima visibile; il piede mette il th nella stessa colonna (non piu' `i === 0`). Fatta la parte facoltativa: la colonna Unit Amount del procedurale e' `fissa` | L2 del kit in `tests/kit-comune-procedurale.test.tsx`: piede col th nella colonna `ua`; nascosta `ua` da Colonne, ogni riga del corpo e il piede hanno ancora il rowheader; axe. Provato rosso senza la correzione (piede) e con la mutazione che lascia al corpo la regola di prima (righe senza th) | kit: senza `intestazioneRiga` l'intestazione resta la prima colonna visibile e il piede uguale: le tabelle di finanziario, fisico, istituzionale ed elenco non cambiano (suite verde senza modifiche ai loro test) |
| **H5** | `105c0a3` | Nel tema la regola sticky passa da `.ui-tabella thead th` a `.ui-tabella thead`, con lo sfondo (che copre anche le celle vuote della riga dei gruppi) | Misura in Chromium headless (Playwright, contenitore da 560px scorso di 300px, script in scratchpad): con il tema di HEAD la riga dei gruppi e quella delle colonne stanno entrambe a 9-46px, cioe' si coprono, e la cella vuota dei gruppi scorre via (-266px); col tema corretto 9-46 e 46-83, cella vuota a 9, sfondo `rgb(247, 249, 252)`. Una tabella a una riga d'intestazione resta in vista (571px su 570) con tutti e due i temi. Test di regressione sulla regola del tema in `tests/kit-comune-procedurale.test.tsx` (jsdom non misura), rosso col tema di prima | kit: tutte le tabelle `.ui-tabella`. Con una sola riga d'intestazione (tutte le altre feature) la resa misurata e' la stessa |
| **V8** | `1012cb7` | `CardGrafico` ha la prop facoltativa `oggettoPng` (default "il grafico <titolo>"). Le schede Stati e Area del dettaglio e la card delle sottofasi col codice danno "il grafico <titolo> di SRD01", come CSV e XLSX | `interventi/page.test.tsx`: nomi dei pulsanti della card degli stati di pagamento (PNG "... per stato di SRD01 in PNG"), della card dell'area e di quella delle sottofasi di pagamento; L2 del kit (con `oggettoPng`, con `oggettoDati`, senza: il nome di sempre) | kit: senza `oggettoPng` i nomi dei pulsanti sono quelli di prima: finanziario, fisico, istituzionale ed elenco non cambiano |
| **H2** | `3106883` | `rigaDellIntervento` passa da `shared/lib/dettaglio` a `entities/filtri/lib/programma` (accanto a `codiceDelPercorso`), esportata dal barrel. Import aggiornati nell'istituzionale (DettaglioIntervento, OutputRegionale, SchedeIntervento) e nel procedurale | L1 in `tests/entita-filtri-domanda.test.ts` (dal barrel dell'entity); in `tests/lib.test.ts` un test che `shared/lib` non la esporta; tolte le due asserzioni di `tests/istituzionale-lib.test.ts` e quelle di `tests/lib.test.ts` | istituzionale: solo import, stessa funzione |
| **H1** | `16913c3` | In `shared/ui/pagina/Dettaglio.tsx` del kit: `IntestazioneNonValida` (area, ingresso, suggerimento, titolo del documento); `ErroriDelleLetture` (un figlio per lettura, ognuno col suo `useErroreNellaPagina`: niente hook in un ciclo) con `senzaRisposta`, ora pura in `shared/lib/dettaglio`; `CorpoDelDettaglio` (scheletro, errore, vuoto dato, dati). I due dettagli li usano. **Non fatte** le parti facoltative (wrapper col codice del percorso in `entities/filtri`, slot della testata in `PaginaConFiltri`) | L2 del kit: pagina del codice non valido (percorso, h1 col focus, titolo del documento, avviso, axe), un solo avviso per le sole letture senza risposta con Riprova, le quattro rese del corpo; `senzaRisposta`. Verdi senza modifiche i test dei due dettagli | istituzionale: `DettaglioIntervento` usa le tre parti del kit, stesso DOM (stesso id del titolo, stessi testi), i suoi test verdi senza modifiche |
| **H6** | `de0da93` | `barreRaggruppate(voci, definizioni, testi, { omessi, misura, orizzontale })`. Chiamate aggiornate in finanziario (`spesa.ts`), fisico, istituzionale e procedurale; `sigc.ts` e l'altra chiamata di `spesa.ts` non passavano opzioni. `asseCategorieOrizzontale` (category, inverse, etichette a capo a 180) e `GRIGLIA_CON_ETICHETTE` (`outerBoundsMode: 'same'`, `outerBoundsContain: 'axisLabel'`, l'equivalente di `containLabel` secondo i tipi di ECharts 6.1) in `shared/lib/grafici`. Li usano le barre raggruppate orizzontali e le barre degli stati, dell'area e delle sottofasi del procedurale | L1 in `tests/shared-grafici.test.ts` (primitiva, griglia senza `containLabel`, asse e griglia delle orizzontali, verticali senza griglia; chiamate con le opzioni per nome) e in `tests/procedurale-lib.test.ts` (asse e griglia di `graficoStati` e `graficoArea`) | finanziario, fisico, istituzionale: solo la forma della chiamata, stessi grafici (verticali, nessuna griglia aggiunta); i loro test verdi senza modifiche |
| **H10** | `57d72b9` | `NumeroONonDisponibile` in `ui/comuni` (regola `== null`) per `TabellaStatiInterventi`, `TabellaRiepilogo` e il "di cui non rilasciate" della tabella delle voci: una distribuzione assente ora dice "non disponibile" anche nella tabella degli stati, dove prima diceva "-". `TITOLI_PAGATO` in lib/unitAmount (prima due mappe uguali). `useLettureColGrant` in `ui/navigazione` (`puo`, `conGrant`) per le letture di panoramica, sottofasi e dettaglio. **Non fatta** la parte facoltativa su `PannelloDelloStato` | L2: `TabellaStatiInterventi` con una riga senza la distribuzione (nessun "-"); L2 di `useLettureColGrant` col solo `csr.tx-0026.read`; L1 di `TITOLI_PAGATO` | nessuno: solo procedurale |
| **H11** | `c3774f5` | `SchedeIntervento`: una mappa `PANNELLI` (id della scheda e contenuto) e un solo `schede.map` con un `TabPanel` per scheda; la scheda Stati riceve le letture della pagina | `tests/eslint-regole.test.ts`: `max-lines-per-function` a 30 (la soglia della review) sul file, rosso con la versione di prima (32 righe). Verdi senza modifiche i test delle schede | nessuno |
| **H8** | `40a09cd` | Tolti `AREE_FUTURE` ed `eRealizzata` (aree.ts), `CardAreaFutura` (Home), `AreaFutura` (menu) coi loro rami e gli stili `.ui-menu__presto` e `.ui-ambito--presto`; `AMBITI` sono le `AREE` nell'ordine fisso. Scelta la via raccomandata (togliere), non l'alternativa del parametro | `tests/app-aree.test.tsx`: tolte le asserzioni su una lista vuota e il ciclo che non iterava; nuovo test che il catalogo non esporta il meccanismo e che il tema non ne ha gli stili, rosso con la versione di prima | app: Home e menu con le stesse quattro aree di prima; test della shell verdi senza modifiche |
| **V5** (D2) | `62e00fe` | Solo test, il codice non cambia (D2: AT001 e un intervento fuori dal CSR sono 200 senza righe, resi come senza dati) | Il test facoltativo del judge in `interventi/page.test.tsx`: le tre letture a 400 DATO_NON_VALIDO danno un solo avviso ("Richiesta non valida: stato non valido...", "3 sezioni...") e niente stato senza dati ne' schede. Provato rosso con la mutazione che rende "vuoto" un dettaglio con tutte le letture in errore | nessuno |
| **A5** | `5f6708c` | Il commento di `useValoriFiltri` (api/index.ts) dice che TX-0024 sta nel tetto (SC-PC_CAPACITA) e nell'audit senza parametri (SC-PC_AUDIT); fuori c'e' solo l'ultimo dato sincronizzato (D-01 Rev. 2) | Test facoltativo in `tests/bff-mutator.test.ts`: TX-0024 e TX-0025 occupano la coda comune insieme a un report (al piu' due in corso). Provato rosso con la mutazione che toglie i filtri dal prefisso della coda | nessuno: `tetti-letture.ts` invariato |
| **H3** | `d614671` | `ParametriFiltriNellIndirizzo` distingue i report con l'azione portante (`conValori` e `valori`, obbligatori come prima) da quelli senza (`senzaAzione: true`, nessuna lettura dei valori, `inAttesa` sempre falso, nessun legame da togliere). Il procedurale passa `senzaAzione` e perde `SENZA_LEGAME`. Corretto il doc di `PropsPannelloProgramma.valori` (TX-0060 o TX-0024) | L2 in `tests/entita-filtri-ui.test.tsx`: con `senzaAzione` e `azione=3` nell'indirizzo, profilo in caricamento: niente attesa, chip e Togli tutti come sempre. Provato rosso senza la correzione e con la mutazione che ignora `senzaAzione` nell'attesa | entities/filtri: il hook comune ha la variante in piu'. Finanziario, fisico e istituzionale passano ancora `conValori` e `valori` (il tipo li richiede): stesso comportamento, test X-03 verdi senza modifiche |
| **H9** | `a47c253` | L'adattatore di `elenco-operativo/lib/formato` si chiama `perimetroDellaRisposta` e chiama `testoPerimetro` del kit senza alias. Aggiornati i cinque usi (pill, voci, ElencoDomande, ElencoPagamenti, SchedaDomanda) e il commento di `useInterrogazione` | `tests/elenco-operativo-lib.test.ts` col nome nuovo (anche null, undefined e un perimetro sconosciuto) e il controllo che il formato non esporti piu' `testoPerimetro`, rosso con la versione di prima | elenco operativo: solo il nome, stessi testi; i suoi test di pagina verdi senza modifiche |
| **V1** (D1) | `07940a3` | Solo test. La dichiarazione di TX-0025 nella route del dettaglio e' della sessione principale (`947fc54`) | `interventi/page.test.tsx`: col profilo senza `csr.tx-0025.read` il dettaglio non legge gli stati area programmazione (`lette.statiArea` 0) e il chip dello stato mostra la chiave. Provato rosso con la mutazione che legge TX-0025 senza il grant | nessuno |

Rigettato dal Judge e non fatto: V6. Assorbiti: A3 in V1, A4 e H4 in V7, H7 in A2.

## Effetti sul codice comune e sulle altre feature

Nessun fix cambia il comportamento visibile di finanziario, fisico, istituzionale o elenco operativo, e nessun finding e'
stato fermato per questo vincolo. Nessun fix ha richiesto di cambiare un wireframe approvato.

- **Kit (`shared/ui`)**:
  - `TabellaInterattiva`: intestazione di riga effettiva e piede, V7 (senza `intestazioneRiga` come prima);
  - tema, sticky sul `thead`, H5 (misurato);
  - `CardGrafico.oggettoPng`, V8, facoltativa;
  - `pagina/Dettaglio.tsx` con `IntestazioneNonValida`, `ErroriDelleLetture` e `CorpoDelDettaglio`, H1;
  - nel tema tolti gli stili "presto", H8.
- **`shared/lib`**:
  - `senzaRisposta` e `LetturaConErrore` in `dettaglio`, H1;
  - `rigaDellIntervento` tolta, H2;
  - `asseCategorieOrizzontale`, `GRIGLIA_CON_ETICHETTE` e `barreRaggruppate` con le opzioni per nome, H6.
- **`entities/filtri`**: `rigaDellIntervento` (H2); `senzaAzione` nel hook dei filtri nell'indirizzo e il doc del
  pannello (H3).
- **App**: aree, Home e menu senza il meccanismo "presto" (H8).
- **Finanziario**: `lib/grafici/spesa.ts`, una chiamata con `{ omessi }` (H6).
- **Fisico**: `lib/grafici.ts`, una chiamata con `{ omessi, misura }` (H6).
- **Istituzionale**: `ui/DettaglioIntervento.tsx` sulle parti del kit (H1); import di `rigaDellIntervento` da
  `entities/filtri` in `DettaglioIntervento`, `OutputRegionale` e `SchedeIntervento` (H2); `lib/grafici.ts`, una chiamata
  con `{ misura }` (H6).
- **Elenco operativo**: `perimetroDellaRisposta` (H9).
- **Procedurale, cambiamenti visibili dichiarati dai fix**:
  - testi del vuoto col perimetro ADA (V4, A1);
  - motivi della voce senza link (A2);
  - "Filtra la tabella" nelle pagine degli stati (V2);
  - assenze delle Unit Amount (X3, V3) e del riepilogo (X4);
  - colonna Unit Amount fissa (V7);
  - nome del PNG delle schede (V8);
  - "non disponibile" al posto di "-" per una distribuzione assente (H10).
- **Test delle altre feature e della shell cambiati**:
  - `tests/istituzionale-lib.test.ts` e `tests/lib.test.ts`: le asserzioni di `rigaDellIntervento` spostate (H2);
  - `tests/elenco-operativo-lib.test.ts` (H9);
  - `tests/app-aree.test.tsx` (H8);
  - `tests/shared-grafici.test.ts` (H6);
  - `tests/entita-filtri-domanda.test.ts` (H2) e `tests/entita-filtri-ui.test.tsx` (H3);
  - `tests/bff-mutator.test.ts` (A5);
  - `tests/eslint-regole.test.ts` (H11).

  Nessun test di pagina di finanziario, fisico, istituzionale ed elenco operativo e' stato cambiato.

## Verifica finale (23/10/2026)

Dopo l'ultimo commit di codice (`07940a3`):

- `npx tsc --noEmit`: rc 0.
- `npx eslint .`: rc 0.
- `npx vitest run`, due volte di seguito: verde entrambe le volte, **75 file e 1492 test** (23 s circa ciascuna). Alla partenza
  del giro erano 75 file e 1465 test.

Il working tree e' pulito dopo il commit di questo resoconto.

## Feature e strati toccati (per lo step8)

Le approvazioni sha256 dei gate sono invalidate. Lo step8 (11/11) va rifatto per **procedurale, finanziario, fisico,
istituzionale ed elenco operativo**. Il kit della tabella, il tema, `CardGrafico` e i grafici comuni valgono per tutte; il
hook dei filtri vale per finanziario, fisico e istituzionale. Per il procedurale, con D1 (`947fc54`, della sessione
principale), servono anche lo step6 (`route_manifest_valid`) e `check-ui-authz.sh`.

- **Procedurale**:
  - `api` (`index.ts`, solo il commento);
  - `lib` (`collegamenti`, `criteri`, `formato`, `grafici`, `intervento`, `riepilogo`, `unitAmount`);
  - `ui` (`CardDistribuzioni`, `CardSottofasi`, `DettaglioIntervento`, `DomandeAmmesse`, `Panoramica`, `Riepilogo`,
    `SchedeIntervento`, `Sottofasi`, `StatiDomande`, `TabellaRiepilogo`, `TabellaStatiInterventi`, `TabellaUnitAmount`,
    `UnitAmount`, `comuni`, `navigazione`, `useCriteriNellIndirizzo`);
  - i test di pagina di interventi, panoramica, riepilogo, stati-sostegno e unit-amount;
  - `tests/procedurale-lib.test.ts`, `tests/procedurale-ui.test.tsx`, `tests/kit-comune-procedurale.test.tsx`.
- **Kit e `shared/lib`**:
  - `shared/ui`: `tabella/TabellaInterattiva.tsx`, `tema.css`, `grafici/CardGrafico.tsx`, `pagina/Dettaglio.tsx` (nuovo),
    `index.ts`;
  - `shared/lib`: `dettaglio.ts`, `grafici/forme.ts`, `grafici/primitive.ts`.
- **Entities**: `entities/filtri` (`index.ts`, `lib/programma.ts`, `ui/useFiltriProgrammaNellIndirizzo.ts`,
  `ui/PannelloFiltriProgramma.tsx`).
- **App**: `src/app/aree.ts`, `home.tsx`, `menu.tsx`. `route-table.json` e' cambiato nel commit D1 della sessione principale,
  non in questo giro.
- **Finanziario**: `lib/grafici/spesa.ts`.
- **Fisico**: `lib/grafici.ts`.
- **Istituzionale**: `lib/grafici.ts`, `ui/DettaglioIntervento.tsx`, `ui/OutputRegionale.tsx`, `ui/SchedeIntervento.tsx`.
- **Elenco operativo**: `lib/formato.ts`, `lib/voci.ts`, `ui/ElencoDomande.tsx`, `ui/ElencoPagamenti.tsx`,
  `ui/SchedaDomanda.tsx`, `ui/pill.tsx`, `ui/useInterrogazione.ts` (solo il commento).
- Non toccati: wireframe, uiplan, route-manifest, dossier, `.claude/state/`, backend, plugin. Nessun push.

## Appunti

- **Nomi diversi da quelli del fix.**
  - `NumeroONonDisponibile` invece di `NumeroODisponibile` (H10, probabilmente un refuso del fix).
  - `useLettureColGrant` per l'aiuto `conGrant` (H10).
  - `ErroriDelleLetture` e' un componente, non `useErroriDelleLetture`: un hook per lettura in un ciclo violerebbe le
    regole degli hook (H1).
- **V2, il nome accessibile.** Uno span `visually-hidden` con " su <voce>" perdeva lo spazio nel calcolo del nome
  accessibile ("Filtra la tabellasu ..."). Ho usato `aria-label`, come `ApriNellElenco`.
- **H5, la misura in Chromium.** Il Playwright del repo cerca `chromium_headless_shell-1194`, ma sulla macchina c'e' la
  1208: la misura passa `executablePath`. Il tema si inietta con `addStyleTag`, perche' con `setContent` un foglio
  `file://` non si carica.
- **H11, la soglia.** La soglia delle 30 righe e' piu' stretta del limite di eslint (60). Il test la controlla con
  `ESLint.overrideConfig` sul solo file delle schede.
- **Lavoro in parallelo.** La sessione principale ha committato D1 e D2 durante il giro. Con un altro lavoro nello
  stesso working tree conviene aggiungere ai commit solo i file per nome, mai `git add -A`.
