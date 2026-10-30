# Correzioni della review step9 FULL, passata 1, gruppo PEF (30/10/2026)

Gruppo PEF del brief `ambiente-prova/strumenti-sessione-317ae849/brief-fe-correzioni-passata1.md`:
- procedurale PRO-01..PRO-05, con la decisione D2;
- elenco operativo EO-01, con la decisione D1 (codice nella scheda dell'elenco e nella pagina delle determine);
- finanziario FIN-02.

Fonti:
- `review/judge-passata1.md`;
- i finding in `review/{procedurale,elenco-operativo,finanziario}-findings-passata1.json`;
- i wireframe riapprovati in a934a29: `wireframes/procedurale/determine/determine.{md,html}` e
  `wireframes/elenco-operativo/dettaglio-domanda/dettaglio-domanda.md`.

Dove ho lavorato:
- worktree `cruscotto-lazio-fe-wt-correzioni`, branch `riallineamento/correzioni-pef` da a934a29;
- nessun push, nessun `git stash`, nessun BE o FE avviato.

Cosa non ho toccato:
- wireframe, `handover/`, `specs/`, `.claude/state/` e approvazioni;
- degli uiplan, solo il testo di OP-PR-14 (PRO-05);
- `resaAssenza` e `NON_DISPONIBILE_BREVE` del procedurale (FIS-07) e gli helper opzionali del finanziario (FIN-01):
  sono del gruppo FI.

**Esito: 7 finding su 7 corretti, nessun fix del Judge scartato.**

## Finding corretti

### PRO-03 (MINORE): percorso e grant delle determine dal contratto condiviso, un solo siNo
**Commit:** 5851b13.

Cosa e' cambiato:
- `PERCORSI.determine` e `GRANT.determine` ora vengono da `entities/domanda` (`PERCORSO_DETERMINE_DELLA_DOMANDA`,
  `GRANT_DETERMINE_DELLA_DOMANDA`).
- `percorsoDetermine(codice)` si compone su `PERCORSO_DETERMINE_DELLA_DOMANDA`.
- Resta un solo `siNo`, in `lib/formato.ts`, col testo del si' facoltativo; la pagina delle determine lo importa da li'.
  Il secondo `siNo` di `lib/determine.ts` e' tolto.

**File:**
- `src/features/procedurale/lib/{pagine,grant,determine,formato}.ts`;
- `src/features/procedurale/ui/DetermineDellaDomanda.tsx`;
- `tests/procedurale-lib.test.ts`.

**Test:**
- nuovo: voce di menu, grant e indirizzo uguali al contratto condiviso;
- l'asserzione del si' facoltativo passa al `siNo` unico.

### PRO-01 (MINORE): i test "nessuna lettura" delle determine attendono davvero
**Commit:** 552a985.

Cosa e' cambiato:
- I test senza codice e col codice non valido nell'indirizzo si chiudono con una ricerca valida dal modulo
  (54810769585 e Invio, attesa della tabella).
- Poi asseriscono `lette = ['54810769585']`, come chiede il fix del Judge.

**File:** `src/pages/procedurale/determine/page.test.tsx`.

**Test:** ho provato a mano col cablaggio rotto (`useDetermine` sul parametro grezzo): i due test falliscono, poi ho
ripristinato il codice.

### PRO-02 (MINORE, decisione D2 (a)): "Cerca un altro codice" anche per 403, 429 e 503
**Commit:** a3717de.

Cosa e' cambiato:
- L'avviso della pagina per gli errori diversi da 404 e 400 porta "Cerca un altro codice". Il link sposta il focus al
  campo del modulo, come nel 404.
- Riprova resta, secondo la politica comune.
- Il link e' un solo componente (`CercaUnAltroCodice`) per il 404 e per l'avviso.
- Kit: `AvvisoPagina` accetta `azioni` facoltative. Sono rese dopo Riprova e solo quando l'avviso c'e'.

**File:**
- `src/features/procedurale/ui/DetermineDellaDomanda.tsx`;
- `src/shared/ui/stati/AvvisoPagina.tsx` (file comune);
- `src/pages/procedurale/determine/page.test.tsx`;
- `tests/shared-ui.test.tsx` (file comune).

**Test:**
- Il test che fissava lo scostamento e' rovesciato: per 403, 429 e 503 l'avviso ha Riprova e il link verso il campo,
  mai "Domanda non trovata".
- Per il 403, focus al campo anche da tastiera e axe.
- Nel test del 503 c'e' anche il link.
- Nel kit, le azioni stanno dopo Riprova e spariscono con l'avviso.

### PRO-04 (COSMETICO): commenti con gli scenari SC-PC_DETERMINA*
**Commit:** f73314e.

Cosa e' cambiato:
- I commenti citano SC-PC_DETERMINA, _NESSUNA e _ASSENTE al posto di SC-FS_DETERMINA*.
- `DETERMINE_CHIUSA` e' citata come seconda domanda di SC-PC_DETERMINA_NESSUNA: il codice e la determina vengono dalla
  PAGAMENTO chiusa di SC-PC_DETERMINA_TIPO, e lo dico.
- Il describe del perimetro nomina SC-PC_DETERMINA_SCOPE_P4. Il tag RF020 e' invariato.

**File:**
- `src/features/procedurale/testing/{fixture,letture}.ts`;
- `src/pages/procedurale/determine/page.test.tsx`.

### EO-01 (MAGGIORE, decisione D1 (a)): link alle determine col tipo della scheda e avviso "domanda dell'altro tipo"
**Commit:**
- 9ec95fe: scheda dell'elenco e contratto condiviso;
- c9e6cf1: pagina delle determine;
- 5b47c26, correzione aggiuntiva chiesta dalla sessione principale: `scheda-di-partenza` apre la scheda
  Determine (sezione in fondo a questo finding).

**Contratto condiviso in `entities/domanda`** (chi scrive lo state e chi lo legge stanno in due feature, quindi niente
import fra feature):
- `arrivoDallaScheda(tipo)` scrive lo state `{ tipoDellaScheda }`.
- `tipoDellaSchedaDiPartenza(state)` lo legge. Lo convalida contro l'elenco chiuso SOSTEGNO, PAGAMENTO con il nuovo
  `tipoDomandaValido` di `lib/elenco.ts`, come la scheda d'arrivo delle Unit Amount del fisico.
- Senza state, o con uno state non valido, restituisce null.

**Scheda dell'elenco:**
- Il link "Apri le determine della domanda nell'area Procedurale" porta il tipo della scheda nello state della
  navigazione, mai nell'URL.
- In `lib/collegamenti.ts` lo state si costruisce con `statoDetermine`; `TabellaDetermine` riceve `statoDetermine`.

**Pagina delle determine:**
- Quando arrivi dalla scheda con un tipo diverso da `tipoDomanda` della risposta, sopra la testata compare un avviso
  `role="status"`: "Il codice a barre N è anche di una domanda di <tipo della risposta>: qui ci sono le sue determine.
  Quelle della domanda di <tipo della scheda> sono nella sua scheda."
- L'avviso ha il link `scheda-di-partenza` "Apri la scheda della domanda di <tipo della scheda>, scheda Determine"
  verso `/elenco-operativo/domande/<tipo della scheda>/<codice cercato>`, solo con csr.tx-0058.read.
- L'avviso non compare senza state, con lo stesso tipo o dopo una nuova ricerca dal modulo, che naviga senza state.
  Vale anche se si cerca lo stesso codice.
- La regione `role="status"` c'e' gia' all'arrivo, vuota e nascosta, e si riempie con la risposta. Una regione live
  inserita gia' piena non si annuncia (lezione X-08 dell'elenco).
- Funzioni pure in `lib/determine.ts`: `tipoDiPartenzaDiverso`, `messaggioAltroTipo`, `testoSchedaDiPartenza`,
  `percorsoSchedaDiPartenza`.
- Fixture `DETERMINE_TIPO`: 34810022870, PAGAMENTO, G00011. La data della determina non e' nello scenario.

**File:**
- `src/entities/domanda/{index.ts,lib/determine.ts,lib/elenco.ts}` (file comuni);
- `src/features/elenco-operativo/lib/collegamenti.ts` e `ui/{SchedaDomanda,TabelleScheda}.tsx`;
- `src/features/procedurale/lib/determine.ts`, `ui/DetermineDellaDomanda.tsx` e `testing/fixture.ts`;
- `src/pages/elenco-operativo/dettaglio-domanda/page.test.tsx`;
- `src/pages/procedurale/determine/page.test.tsx`;
- `tests/elenco-operativo-lib.test.ts`;
- `tests/elenco-operativo-ui.test.tsx`;
- `tests/procedurale-lib.test.ts`.

**Test (quelli chiesti da D1 ci sono tutti):**
- Scheda SOSTEGNO 34810022870:
  - il link porta `{ tipoDellaScheda: 'SOSTEGNO' }`, senza tipo nell'indirizzo;
  - la pagina con la risposta PAGAMENTO (SC-PC_DETERMINA_TIPO) mostra l'avviso col testo esatto, il link e la sua
    destinazione;
  - l'avviso sta prima dell'h1;
  - la testata apre la scheda PAGAMENTO;
  - axe senza violazioni;
  - il clic porta a `/elenco-operativo/domande/SOSTEGNO/34810022870`.
- Altri casi senza avviso: stesso tipo, senza state, state non validi ('ALTRO', minuscolo, array, chiave diversa,
  stringa, null).
- Senza csr.tx-0058.read: l'avviso c'e', senza link.
- Nuova ricerca dal modulo, anche dello stesso codice: niente avviso.
- La regione e' presente gia' in caricamento.
- Unita' delle funzioni pure e convalida dello state.

Ho provato a mano il default del tipo forzato: i test senza state, con state non valido e con la nuova ricerca
falliscono.

**Scheda Determine (correzione aggiuntiva chiesta dalla sessione principale):** il testo approvato del link
`scheda-di-partenza` promette "scheda Determine", quindi la scheda dell'elenco ora si apre su Determine quando ci si
arriva da quel link.
- Prima della correzione la scheda dell'elenco (Tabs di react-aria non controllati) non sceglieva la scheda iniziale, e
  il link apriva la Sintesi.
- Contratto in `entities/domanda/lib/elenco.ts`:
  - `SCHEDE_DELLA_DOMANDA` e' l'elenco chiuso degli identificativi dei Tab;
  - `arrivoSullaScheda(scheda)` scrive lo state `{ schedaIniziale }`;
  - `schedaInizialeDalloState(state)` lo legge e lo convalida contro l'elenco; con un valore assente o non valido
    restituisce null.
- `SchedaDomanda` passa a `Tabs` `defaultSelectedKey` = la scheda dello state, oppure `'sintesi'`.
- Il link `scheda-di-partenza` porta `ARRIVO_SU_DETERMINE` (= `{ schedaIniziale: 'determine' }`, in
  `procedurale/lib/determine.ts`).
- Nessun parametro nell'URL, nessun cambio di wireframe.
- Focus e annuncio: il kit non annuncia il cambio di scheda. All'arrivo il focus va sull'h1, come in ogni arrivo
  (`useFocusTitolo`). La scheda Determine risulta selezionata (`aria-selected`) col suo pannello, e le frecce ripartono
  da li'.

**Test della correzione aggiuntiva:**
- Con `{ schedaIniziale: 'determine' }` la scheda si apre su Determine:
  - si vede la tabella delle determine;
  - l'indirizzo non cambia;
  - il focus e' sull'h1;
  - axe senza violazioni;
  - Freccia destra porta a Pagamenti.
- Ogni valore dell'elenco chiuso seleziona il suo Tab: gli identificativi coincidono.
- State non valido ('Determine', 'altro', array, chiave diversa, stringa, null) e arrivo di sempre (state con la
  ricerca dell'elenco, o nessuno state): Sintesi.
- Il clic su `scheda-di-partenza` porta `{ schedaIniziale: 'determine' }`.
- Unita' del contratto.

Ho provato a mano il codice senza `defaultSelectedKey`: i test dell'arrivo su Determine e dell'elenco chiuso falliscono.

**File della correzione aggiuntiva:**
- `src/entities/domanda/{lib/elenco.ts,index.ts}` (file comuni);
- `src/features/elenco-operativo/ui/SchedaDomanda.tsx`;
- `src/features/procedurale/lib/determine.ts` e `ui/DetermineDellaDomanda.tsx`;
- `src/pages/elenco-operativo/dettaglio-domanda/page.test.tsx`;
- `src/pages/procedurale/determine/page.test.tsx`;
- `tests/elenco-operativo-lib.test.ts`;
- `tests/procedurale-lib.test.ts`.

### PRO-05 (COSMETICO): OP-PR-14 chiuso nello uiplan del procedurale
**Commit:** 800ff18.

Cosa e' cambiato:
- In coda al detail di OP-PR-14, come per OP-EO-07, ho aggiunto: "Chiuso il 30/10/2026: link determine-della-domanda
  dell'elenco operativo (OP-EO-07), visibile con csr.tx-0020.read". Segue il tipo della scheda nello state e il link
  `scheda-di-partenza` di questa pagina, visibile con csr.tx-0058.read (decisione D1).
- Solo testo dell'open point.

**File:** `plan/procedurale/uiplan.json`.

`uiplan-validate.sh plan/procedurale/uiplan.json handover/slices handover/authz-catalog.json`: rc 0.

### FIN-02 (COSMETICO): il parametro `tipo` a un solo valore
**Commit:** ddfbf00.

Cosa e' cambiato:
- `anniSelezionabili(tipo, corrente?)` diventa `anniDellaRiserva(corrente?)`, con `ULTIMO_ANNO_RISERVA`.
- Il `SelettoreAnno` del finanziario non ha piu' la prop `tipo`.
- `RiservaReport` e' aggiornato. Il comportamento resta uguale: 2023-2029 piu' l'anno valido gia' scelto.

**File:**
- `src/features/finanziario/lib/filtri.ts`;
- `src/features/finanziario/ui/{SelettoreAnno,RiservaReport}.tsx`;
- `tests/finanziario-lib.test.ts`;
- `tests/kit-comune-istituzionale.test.tsx` (file comune, riga del selettore del finanziario).

## Fix non applicati
Nessuno: i fix del Judge sono applicati come scritti, con le decisioni D1 (a) e D2 (a).

Una nota che non e' un fix mancato:
- **EO-01, ricarica:** il wireframe dice "Senza state (ricarica, indirizzo condiviso, ricerca dal modulo) nessun
  avviso". Con il router del browser pero' una ricarica conserva `history.state`, quindi dopo una ricarica l'avviso
  resta. Resta comunque vero, perche' la domanda mostrata e' ancora dell'altro tipo rispetto alla scheda di partenza.
  - Indirizzo condiviso e ricerca dal modulo non hanno state: per loro l'avviso non compare, e i test lo provano.
  - Nei test la ricarica si simula con l'indirizzo senza state.
  - Non ho toccato il wireframe. La sessione principale lo segnala all'utente.

## File comuni toccati
Modifiche locali, senza riordini:

| file | dove | cosa |
|---|---|---|
| `src/shared/ui/stati/AvvisoPagina.tsx` | `ElencoErrori` e firma di `AvvisoPagina` | prop facoltativa `azioni` dopo Riprova (PRO-02) |
| `src/entities/domanda/lib/elenco.ts` | dopo `CODICE_A_BARRE`, prima di `codiceABarreValido` | tipo `TipoDellaDomanda` e predicato `tipoDomandaValido` (EO-01); `riferimentoDomandaValido` invariato |
| `src/entities/domanda/lib/elenco.ts` | coda del file | `SCHEDE_DELLA_DOMANDA`, `ArrivoSullaScheda`, `arrivoSullaScheda`, `schedaInizialeDalloState` (EO-01, scheda iniziale) |
| `src/entities/domanda/lib/determine.ts` | commento di testa e coda del file | `ArrivoDallaScheda`, `arrivoDallaScheda`, `tipoDellaSchedaDiPartenza` (EO-01) |
| `src/entities/domanda/index.ts` | export di `lib/elenco` e `lib/determine` | nuovi export (EO-01) |
| `tests/shared-ui.test.tsx` | coda del describe di `AvvisoPagina` | un test delle `azioni` (PRO-02) |
| `tests/kit-comune-istituzionale.test.tsx` | riga 49 | tolto `tipo="riserva"` (FIN-02) |

**Possibili conflitti nella fusione col gruppo FI:**
- `src/features/procedurale/lib/formato.ts`:
  - io ho cambiato `siNo` alle righe 48-51;
  - FIS-07 toglie `NON_DISPONIBILE_BREVE` e `resaAssenza` subito sotto, dalla riga 53;
  - fra le due modifiche restano due righe invariate.
- `tests/procedurale-lib.test.ts`:
  - io ho toccato l'import di `lib/determine`, il test dei grant e pagine e il test delle determine;
  - non ho toccato l'import di `lib/formato` (riga 47) ne' il test "si e no, e le assenze", che FIS-07 probabilmente
    cambia.
- `tests/finanziario-lib.test.ts`:
  - io ho toccato l'import di `lib/filtri` (riga 11) e le righe 250-254;
  - FIN-01 tocca l'import di `lib/formato` (righe 20-28) e le righe 263-277.

## Verifica finale
- `npx tsc --noEmit`, `npm run lint` e `npx eslint . --max-warnings 0`: verdi.
- `npx vitest run`, due volte di seguito: 78 file, 1648 test verdi. A a934a29 erano 1635: 13 nuovi.
- Dopo la correzione aggiuntiva (scheda iniziale), rifatte `tsc`, `npm run lint` ed `eslint .`: verdi.
- `npx vitest run`, di nuovo due volte di seguito: 78 file, 1652 test verdi.
- `fe-project-check.sh . --feature <f> --catalog handover/authz-catalog.json`, anche con `--built`: rc 0 per
  procedurale, elenco-operativo e finanziario. Dopo la correzione aggiuntiva, rifatto per elenco-operativo e
  procedurale: rc 0.
- `check-ui-authz.sh`: rc 0 per le tre feature.
- Plugin `CLAUDE_PLUGIN_ROOT=.../sian-green/plugins/green-fe` con `tools/vendor` in testa al PATH.
- File in LF: `git ls-files --eol` su tutti i file toccati.

**Resta alla sessione principale:**
- fusione col gruppo FI;
- step8 di procedurale, elenco-operativo e finanziario, perche' le modifiche invalidano le approvazioni sha256 del
  gate;
- passata 2, col procedurale incluso per D1;
- registrazione delle decisioni D1 e D2.
