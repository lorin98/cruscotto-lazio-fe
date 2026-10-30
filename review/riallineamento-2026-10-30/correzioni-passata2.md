# Correzioni della review step9 FULL, passata 2 (procedurale ed elenco operativo, 30/10/2026)

Finding accettati dal Judge della passata 2:
- procedurale PRO2-01..PRO2-06 (5 MINORE, 1 COSMETICO), con la decisione D4 dell'utente (PRO2-03);
- elenco operativo EO2-01..EO2-06 (6 COSMETICO).

Fonti:
- `review/judge-passata2.md` (verifica, motivo e fix di ogni finding);
- `review/procedurale-findings-passata2.json` e `review/elenco-operativo-findings-passata2.json`;
- il wireframe `wireframes/procedurale/determine/determine.{md,html}` riapprovato in 9698143 (D4, e "il tipo si legge
  una volta sola all'arrivo");
- `handover/acceptance/procedurale-scenarios.json` per i dati di SC-PC_DETERMINA_TIPO e SC-PC_DETERMINA_SCOPE_P4;
- le regole e il formato di commit e resoconto del brief della passata 1
  (`ambiente-prova/strumenti-sessione-317ae849/brief-fe-correzioni-passata1.md`).

Dove ho lavorato: repo principale, main, da 9698143; nessun push, nessun `git stash`, nessun BE o FE avviato.

Cosa non ho toccato:
- wireframe, `handover/`, `specs/`, `.claude/state/` e approvazioni;
- degli uiplan, solo il testo indicato dai finding: il trigger di `scheda-di-partenza` (PRO2-06) e OP-EO-07 (EO2-01,
  EO2-05).

**Esito: 12 finding su 12 corretti, in 8 commit (f38834b..8046369). Nessun fix del Judge scartato**; dove ho scelto una
forma diversa dal suggerimento lo dico nel finding.

## Procedurale

### PRO2-03 (MINORE, decisione D4): testo neutro dell'avviso "domanda dell'altro tipo"
**Commit:** f38834b.

Cosa e' cambiato: `messaggioAltroTipo` rende il testo del wireframe riapprovato: "Il codice a barre N è anche di una
domanda di <tipo della risposta>: questa pagina mostra quella domanda, non la domanda di <tipo della scheda> da cui
arrivi.". Il link "Apri la scheda della domanda di <tipo della scheda>, scheda Determine" resta, solo con
csr.tx-0058.read.

**File:**
- `src/features/procedurale/lib/determine.ts`;
- `src/features/procedurale/testing/fixture.ts` (nuova `DETERMINE_TIPO_SOSTEGNO`);
- `src/pages/procedurale/determine/page.test.tsx`, `tests/procedurale-lib.test.ts`.

**Test** (dati verificati in `procedurale-scenarios.json`, SC-PC_DETERMINA_TIPO):
- 34810063735 con lo state SOSTEGNO: risposta PAGAMENTO chiusa con G00016 (`DETERMINE_CHIUSA`). Avviso col testo neutro e
  link `scheda-di-partenza` verso `/elenco-operativo/domande/SOSTEGNO/34810063735`; niente "Apri la scheda della
  domanda", perche' la PAGAMENTO e' chiusa.
- 34810063736 con lo state PAGAMENTO: risposta SOSTEGNO con G00017. Avviso, link alla scheda PAGAMENTO di partenza,
  testata e "Apri la scheda della domanda" sulla SOSTEGNO.
- test di lib e costante `AVVISO` dei test di pagina col nuovo testo.

### PRO2-01 (MINORE, con A2-01): il tipo si legge una volta sola all'arrivo
**Commit:** b1fa8f5 (insieme a PRO2-02: stesso componente, come suggerisce il Judge).

Cosa e' cambiato, in `DetermineDellaDomanda.tsx`, nuovo hook `useTipoDiPartenza`:
- il tipo della scheda di partenza si legge dallo state della navigazione una volta sola (inizializzatore di
  `useState`) e resta nel componente insieme al codice d'arrivo; vale solo finche' la pagina mostra quel codice;
- lo state lascia subito la voce della cronologia: `navigate({ pathname, search, hash }, { replace: true, state: null })`
  in un effetto, solo se la voce porta un tipo valido. L'indirizzo non cambia e la cronologia non ha voci in piu';
- il tipo si azzera a una nuova ricerca dal modulo, anche dello stesso codice. `CercaDomanda` ha la prop `onCerca`,
  chiamata prima di navigare;
- il tipo si azzera anche quando cambia `improntaIdentita(auth.data)` senza ricarica, ma non alla prima lettura della
  sessione. L'impronta qui decide solo cosa dimenticare, mai un accesso (dottrina di `use-auth-status.ts`).

**File:**
- `src/features/procedurale/ui/DetermineDellaDomanda.tsx`, `src/features/procedurale/ui/CercaDomanda.tsx`;
- `src/pages/procedurale/determine/page.test.tsx`.

**Test** (`apri()` ora accetta un `QueryClient` e una voce precedente nella cronologia):
- **arrivo e ricarica:** dopo l'arrivo `location.state` e' null, `historyAction` e' REPLACE, l'indirizzo e' lo stesso e
  l'avviso resta. La stessa voce rimontata in un router nuovo (la ricarica: il browser rilegge la voce com'e' adesso) non
  ha l'avviso;
- **Indietro e Avanti:** con la scheda di partenza come voce precedente, Indietro porta alla scheda (non a una copia
  della pagina). Avanti torna alle determine senza avviso;
- **cambio d'identita':** a pagina montata, una nuova lettura di `/auth/status` con un altro utente toglie l'avviso. Il
  link della scheda di partenza presente prima prova che la prima lettura della sessione non azzera;
- il vecchio test "senza state (ricarica o indirizzo condiviso)" si chiama "senza state (indirizzo condiviso)";
- il test "dopo una nuova ricerca" ora attende una voce nuova della cronologia (la key cambia), non lo state null, che
  dopo il consumo sarebbe gia' vero.

Ho rotto a mano consumo e azzeramento per identita': i tre test nuovi falliscono, poi ho ripristinato.

**Effetto da sapere** (gia' nel Judge, punto 5): Indietro dalla scheda d'arrivo riporta alle determine senza l'avviso,
perche' la voce non ha piu' lo state. E' coerente col wireframe ("senza state ... Indietro o Avanti ... nessun avviso").

**Valutazione: serve lo stesso consumo per `schedaIniziale` nella scheda dell'elenco? No, l'ho lasciato nella voce.**
1. Il wireframe `dettaglio-domanda` dice solo che il link apre la scheda Determine. Nessun artefatto chiede che la
   ricarica o Indietro tornino alla Sintesi, mentre per l'avviso il flusso `determine` lo chiede esplicitamente.
2. L'avviso parla di un'altra domanda e il suo testo e' vero solo all'arrivo: dopo, e' informazione vecchia, e con un
   cambio d'utente un'informazione che il nuovo utente non dovrebbe vedere (A2-01). `schedaIniziale` sceglie solo quale
   scheda degli stessi dati di TX-0058 aprire: non dice nulla e dopo una ricarica non diventa falso.
3. Consumarlo andrebbe contro EO2-04, il cui test chiede che Indietro sulla voce con `schedaIniziale` riapra Determine.
   Servirebbe anche tenere la scheda iniziale nello stato del componente, perche' le schede ora si rimontano a ogni voce.

Quindi ricarica, Indietro e Avanti sulla voce d'arrivo riaprono Determine; l'ho scritto nell'intestazione di
`SchedaDomanda.tsx`. Se l'utente preferisce la Sintesi dopo la ricarica, la modifica e' piccola, ma va decisa insieme a
EO2-04.

### PRO2-02 (MINORE): la regione dell'avviso nasce vuota anche con TX-0020 in cache
**Commit:** b1fa8f5.

Cosa e' cambiato:
- `DomandaDellAltroTipo` monta `RegioneAltroTipo` solo con un arrivo valido;
- la regione `role="status"` nasce vuota e nascosta e si riempie dopo il montaggio: `montata` da `useState(false)`
  diventa vero in un `useEffect`. E' la prima forma suggerita dal Judge;
- la "regione sempre montata nella pagina" l'ho scartata: aggiungerebbe una regione di stato a ogni pagina delle
  determine, anche senza arrivo dalla scheda (lo stato "senza codice" ne ha oggi una sola, e il suo test lo asserisce).

`DomandaDellAltroTipo` riceve l'arrivo gia' risolto, cosi' la pagina resta sotto la soglia di complessita' di eslint.

**Test:**
- QueryClient seminato con la sessione e con TX-0020 di 34810022870: la tabella c'e' gia' al primo render;
- un `MutationObserver` registra i contenuti aggiunti a una regione `role="status"` che era gia' nel DOM, e il test
  asserisce che la regione dell'avviso e' fra queste;
- senza la correzione (`montata` vero da subito) il test fallisce: l'ho provato.

**Residuo manuale:** l'effetto riempie la regione dopo il commit. Che un lettore di schermo reale lo annunci in ogni
browser (per esempio se il browser non dipinge fra i due commit) resta da verificare a mano, come gli altri annunci.

### PRO2-04 (MINORE): i test dei link nascosti attendono la sessione
**Commit:** f084137.

Cosa e' cambiato:
- nuovo helper `sessioneLetta(client)`, come in `tests/finanziario-ui.test.tsx`: attende `/auth/status` in `success` e
  la notifica a React (timer a 0 di notifyManager);
- i due test senza csr.tx-0058.read (`scheda-domanda` della testata e `scheda-di-partenza` dell'avviso) lo chiamano
  prima di asserire l'assenza del link.

**File:** `src/pages/procedurale/determine/page.test.tsx`.

**Test:** con un gate sbagliato (`conGrantScheda = auth.data !== undefined`) entrambi falliscono; poi ho ripristinato.

### PRO2-05 (MINORE): lo state di D1 insieme al perimetro del P4
**Commit:** 8534daf.

Due casi nel describe di SC-PC_DETERMINA_SCOPE_P4:
- **D-11:** il P4 di Latina arriva dalla scheda SOSTEGNO 54810769588 e riceve la SOSTEGNO di Latina con G00005 e
  perimetro ADA (nuova fixture `DETERMINE_P4_SOSTEGNO`). Il badge dice "Perimetro: ADA, domande della tua area" e
  nessun avviso compare. La regione dell'avviso e' montata ma vuota, cosi' l'assenza non e' vacua. "Apri la scheda
  della domanda" porta alla SOSTEGNO;
- **404 con lo state SOSTEGNO:** il regionale ha la domanda inesistente (simulata sullo stesso codice), il P4 la
  54810769586 di Frosinone, fuori dal suo perimetro; i due profili hanno gli stessi grant, perche' il perimetro lo
  decide il backend. Testo, classi, focus, titolo e `innerHTML` del main sono uguali; nel main gli id di `useId`
  (`_r_N_`, che dipendono dall'ordine dei montaggi) sono normalizzati. La regione dell'avviso e' vuota in entrambi.

**File:** `src/pages/procedurale/determine/page.test.tsx`, `src/features/procedurale/testing/fixture.ts`.

### PRO2-06 (COSMETICO): il trigger di `scheda-di-partenza` dichiara il suo state
**Commit:** 4718a73.

Nello uiplan del procedurale il trigger dice anche: "porta { schedaIniziale: 'determine' } nello state della navigazione
(mai nell'URL): la scheda si apre su Determine". E' solo testo; `uiplan-validate.sh` rc 0.

## Elenco operativo

### EO2-01 ed EO2-05 (COSMETICO): OP-EO-07
**Commit:** 0852d24.

Cosa e' cambiato:
- **EO2-01:** in coda a OP-EO-07, l'arrivo da `scheda-di-partenza` del procedurale apre la scheda su Determine. Lo state
  `{ schedaIniziale }` e' convalidato contro l'elenco chiuso delle schede e non va mai nell'indirizzo; senza state o con
  uno non valido si apre la Sintesi;
- **EO2-05:** "l'arrivo non risponde 404" diventa "per il P4 la scheda e' nel suo perimetro; con TX-0058 regionale da un
  altro profilo e TX-0020 solo dal P4 l'arrivo puo' rispondere 404, col messaggio unico". Vale in OP-EO-07 e nel
  commento di `percorsoDetermine` (`lib/collegamenti.ts`).

**File:** `plan/elenco-operativo/uiplan.json`, `src/features/elenco-operativo/lib/collegamenti.ts`.

**Restano al prossimo rework del flusso:** il paragrafo "In arrivo" e la frase sul 404 del wireframe
`dettaglio-domanda`, come dice il Judge; i wireframe non li ho toccati. `uiplan-validate.sh` rc 0.

### EO2-02 ed EO2-03 (COSMETICO): un solo elenco dei tipi, id dei Tab legati, commenti
**Commit:** c790ecc.

**EO2-02:**
- in `entities/domanda/lib/elenco.ts`: `TIPI_DOMANDA = ['SOSTEGNO', 'PAGAMENTO'] as const` e
  `TipoDellaDomanda = (typeof TIPI_DOMANDA)[number]`. `tipoDomandaValido` controlla sullo stesso elenco;
  `riferimentoDomandaValido` diventa `tipoDomandaValido(tipo) && codiceABarreValido(codiceABarre)`;
- nella scheda gli id dei Tab e dei pannelli passano da `idScheda`, tipizzato su `SchedaDellaDomanda`. L'ho preferito a
  dodici `satisfies`: il controllo di tipo e' lo stesso;
- nel procedurale `tipoDiPartenzaDiverso`, `messaggioAltroTipo`, `testoSchedaDiPartenza`, `percorsoSchedaDiPartenza` e
  `TestoAltroTipo` prendono `TipoDellaDomanda` per il tipo della scheda. Il tipo della risposta resta `string`, come nel
  DTO `Determine`.

**EO2-03:**
- i commenti di `entities/domanda/lib/elenco.ts`, `lib/collegamenti.ts` e `lib/formato.ts` dell'elenco danno le
  determine al procedurale;
- l'intestazione di `elenco.ts` nomina lo state `schedaIniziale`, chi lo scrive e chi lo legge.

**File:**
- `src/entities/domanda/lib/elenco.ts`;
- `src/features/elenco-operativo/lib/{collegamenti,formato}.ts`, `src/features/elenco-operativo/ui/SchedaDomanda.tsx`;
- `src/features/procedurale/lib/determine.ts`, `src/features/procedurale/ui/DetermineDellaDomanda.tsx`.

**Test:** quelli esistenti (`tipoDomandaValido`, riferimenti, elenco chiuso delle schede) restano verdi.

### EO2-04 ed EO2-06 (COSMETICO): la scheda iniziale a ogni voce; il test da tastiera dal titolo
**Commit:** 8046369.

**EO2-04:** `useSchedaIniziale` restituisce anche la voce della cronologia (`useLocation().key`), che fa da `key` dei
`Tabs`. La scheda non naviga con replace (niente `useStatoNellaHistory`; la scelta delle colonne e' stato locale della
tabella), quindi la key non cambia finche' l'utente resta sulla voce. Ho aggiornato l'intestazione del componente.

**EO2-06:** il test "le frecce ripartono dalla scheda Determine" parte dal titolo, che ha il focus all'arrivo, e arriva
con Tab nelle schede. Asserisce che il Tab col focus e' "Determine (1)"; solo dopo, Freccia destra seleziona Pagamenti.

**File:** `src/features/elenco-operativo/ui/SchedaDomanda.tsx`, `src/pages/elenco-operativo/dettaglio-domanda/page.test.tsx`.

**Test EO2-04:**
- QueryClient seminato con la collegata 04230000001;
- arrivo con `{ schedaIniziale: 'determine' }`: si sceglie "Domande collegate" e si apre la collegata, che compare
  subito coi dati e sulla Sintesi;
- si sceglie Pagamenti, poi Indietro riapre Determine sulla voce d'arrivo;
- senza la key il test fallisce: la collegata resta su "Domande collegate".

## File comuni toccati
- `src/entities/domanda/lib/elenco.ts` (EO2-02, EO2-03): elenco `as const`, tipo derivato, `riferimentoDomandaValido` su
  `tipoDomandaValido`, intestazione. L'API pubblica del barrel non cambia (stessi nomi, stesso tipo).
- Nessuna modifica in `src/app`, `src/shared` o nei test comuni di `tests/`. Di `tests/` ho toccato solo
  `tests/procedurale-lib.test.ts` (testo di D4).
- Uiplan: `plan/procedurale/uiplan.json` (PRO2-06) e `plan/elenco-operativo/uiplan.json` (OP-EO-07), solo testo.

## Verifica finale (30/10/2026)
- `npx tsc --noEmit`, `npm run lint`, `npx eslint . --max-warnings 0`: verdi;
- `npx vitest run` due volte di seguito: 78 file, 1682 test, verdi entrambe le volte. Prima delle correzioni erano 1673:
  9 test nuovi, 8 nelle determine e 1 nella scheda;
- `fe-project-check.sh . --feature procedurale|elenco-operativo --catalog handover/authz-catalog.json`: rc 0 per tutte e
  due;
- `uiplan-validate.sh` sugli uiplan di procedurale ed elenco operativo: rc 0;
- file in LF (`git ls-files --eol`).

Lo step8 delle due feature lo rifa' la sessione principale: le modifiche invalidano le approvazioni sha256 del gate.
