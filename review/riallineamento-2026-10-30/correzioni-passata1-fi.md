# Correzioni della review step9 FULL, passata 1, gruppo FI (30/10/2026)

Gruppo FI del brief `brief-fe-correzioni-passata1.md`: fisico FIS-01..FIS-08, istituzionale IST-01..IST-10 (con la
decisione D3) e finanziario FIN-01. Fonti: il dettaglio del Judge `review/judge-passata1.md` e i finding accettati in
`review/{fisico,istituzionale,finanziario}-findings-passata1.json`.

Partenza: repo principale, `main` a `a934a29`, albero pulito. Commit su `main` (17, uno per finding o per gruppo
coerente), nessun push. Wireframe, uiplan, `handover/`, `specs/`, stati in `.claude/state/` e approvazioni non toccati;
nessun BE o FE avviato; nessun `git stash`. In parallelo il gruppo PEF lavora nel worktree `cruscotto-lazio-fe-wt-correzioni`:
non toccato.

**Esito: 19 finding su 19 corretti.** Due fix applicati con una scelta diversa dal suggerimento del Judge (FIS-02 e una
conseguenza di IST-04 su IST-06), spiegate sotto.

## Verifica finale

- `npx tsc --noEmit`, `npm run lint`, `npx eslint . --max-warnings 0`: verdi.
- `npx vitest run` verde due volte di seguito: 78 file, **1656 test** (erano 1635 a `a934a29`: +21).
- `fe-project-check.sh . --feature <f> --catalog handover/authz-catalog.json` rc 0 (verdict pass) per fisico,
  istituzionale, finanziario e procedurale (FIS-07 tocca il procedurale), con `CLAUDE_PLUGIN_ROOT` di green-fe e
  `tools/vendor` in testa al PATH.
- File in LF (`git ls-files --eol`: 55 file toccati, tutti `i/lf w/lf`).
- **Da rifare dalla sessione principale:** lo step8 delle feature toccate (fisico, istituzionale, finanziario e procedurale),
  perche' le modifiche invalidano le approvazioni sha256 del gate, poi la passata 2.

## Commit (in ordine)

| commit | finding |
|---|---|
| `2aee55e` | FIS-07 |
| `9144ab6` | IST-06, FIN-01 |
| `8aa66bc` | IST-08 |
| `123bafd` | IST-09 |
| `f8dd78d` | IST-03 (D3) |
| `4c2e8cd` | IST-04 |
| `589a158` | IST-05 |
| `35738b0` | IST-07 |
| `917dfc3` | IST-01, IST-02 |
| `41b6eee` | IST-10 |
| `a1e4612` | FIS-06 |
| `da682ad` | FIS-04 |
| `65d1006` | FIS-03 |
| `9aaf9c6` | FIS-02 |
| `358d3f7` | FIS-05 |
| `50bef92` | FIS-08 |
| `d3a8197` | FIS-01 |

## Fisico

### FIS-01 (MINORE): il test di SC-FS_UNIT_AMOUNT_AZIONE non provava il file
- **Cosa:** fix del Judge, prima strada. Nuovo caso col legame vero: TX-0030 risponde con le righe di SRD01 collegato
  all'azione 3. La lettura e' `?intervento=SRD01&azione=3`; il CSV chiesto e'
  `/api/fisico/unit-amount/csv?intervento=SRD01&azione=3` con X-Requested-With. Il caso del vuoto resta, col titolo che
  dice solo la lettura.
- **File:** `src/pages/fisico/unit-amount/page.test.tsx`.
- **Commit:** `d3a8197`.

### FIS-02 (MINORE): voce "Fisico" del percorso fissa sulle superfici
- **Cosa:** `useIngressoArea` passa da `DettaglioIntervento.tsx` al nuovo `ui/navigazione.ts`, come nell'istituzionale.
  `PaginaReport` lo usa per la voce "Fisico".
- **Scelta diversa dal Judge:** quando l'ingresso e' la pagina stessa la voce resta un link. Il Judge suggeriva "senza
  link", ma la sua stessa frase di test ammette entrambe le strade ("porta a /fisico/unit-amount, oppure non e' un
  link"). Ho seguito le superfici e i report dell'istituzionale, che fanno gia' cosi'.
- **Test:**
  - Unit Amount col profilo completo: `/fisico/superfici`.
  - Unit Amount col solo csr.tx-0030.read: `/fisico/unit-amount`.
  - Output regionale col solo csr.tx-0017.read: `/fisico/output-regionale`.
- **File:**
  - `src/features/fisico/ui/navigazione.ts` (nuovo), `PaginaReport.tsx`, `DettaglioIntervento.tsx`.
  - Test delle pagine `unit-amount` e `output-regionale`.
- **Commit:** `9aaf9c6`.

### FIS-03 (MINORE): nessun test del dettaglio col solo csr.tx-0030.read o col solo csr.tx-0017.read
- **Solo csr.tx-0030.read:**
  - la sola scheda Unit Amount, letta subito senza aprirla;
  - nessuna lettura di TX-0017, TX-0018 e TX-0060;
  - il solo pulsante "Unit Amount di questo intervento";
  - AT001: lo stato vuoto con "Torna alle Unit Amount".
- **Solo csr.tx-0017.read:** la sola scheda Output col KPI del target. Dopo la card e un'attesa dichiarata di 50 ms,
  nessuna lettura di TX-0018 e TX-0030.
- **File:** `src/pages/fisico/interventi/page.test.tsx`.
- **Commit:** `65d1006`.

### FIS-04 (MINORE): TX-0017 e TX-0018 in errore insieme toglievano anche la scheda Unit Amount
- **Cosa:** le letture dello stato sono `[output, superfici, unitAmountAperta ? unitAmount : null]`, oppure la sola
  TX-0030 nel ramo `soloUnitAmount`.
- **Test:** arrivo con state `{ scheda: 'unitAmount' }` e TX-0017 e TX-0018 in 503:
  - la tabella Unit Amount si vede;
  - un solo avviso ("2 sezioni");
  - "Dati al" viene dalla risposta di TX-0030;
  - le schede Output e Superfici mostrano il testo statico.
- **Nota:** arrivando dal drawer, alla prima apertura la pagina aspetta anche TX-0030 prima di togliere lo scheletro (regola
  del kit: KPI e schede arrivano insieme). Se la scheda si apre dopo, la pagina resta coi dati.
- **File:** `src/features/fisico/ui/DettaglioIntervento.tsx`, `src/pages/fisico/interventi/page.test.tsx`.
- **Commit:** `da682ad`.

### FIS-05 (MINORE): `PaginaReport` del fisico ricopiava lo scheletro dell'istituzionale
- **Cosa:** `PaginaReportProgramma` generico in `entities/filtri/ui`, accanto a `PannelloFiltriProgramma` e
  `ValoriFiltriNonDisponibili`. Props: pagina, stato, briciole, testa, pill della barra, testoVuoto, senzaLettura, sopra,
  pannello, report. I due `PaginaReport` diventano adattatori.
- **Fisico:**
  - la pill del perimetro dalla risposta;
  - il vuoto coi filtri del programma;
  - le righe di contesto dei PNG intorno al report: ora `ContestoIntestazione.Provider` avvolge solo il report, che e' il
    solo a leggerlo;
  - il pannello con la nota di TX-0060.
- **Istituzionale:**
  - la pill del perimetro fissa;
  - la riga sotto il sottotitolo;
  - il selettore;
  - il testo senza lettura;
  - il suo pannello.
- **Test L2 nel kit delle entity:**
  - barra, percorso, h1, `sopra`, report, pannello fuori dal main e axe;
  - vuoto con "Modifica i filtri" e Filtri della barra (`apri('vuoto')`, `apri('barra')`);
  - senza lettura, attesa X-03, valori in errore.
  - I test delle quattro pagine restano verdi.
- **File:**
  - `src/entities/filtri/ui/PaginaReportProgramma.tsx` (nuovo), `src/entities/filtri/index.ts`;
  - `src/features/fisico/ui/PaginaReport.tsx`, `src/features/istituzionale/ui/PaginaReport.tsx`;
  - `tests/entita-filtri-ui.test.tsx`.
- **Commit:** `358d3f7`.

### FIS-06 (MINORE): regole del dettaglio ricopiate, con l'ultimo dato della prima scheda invece che della prima risposta
- **Cosa:**
  - In `shared/lib/dettaglio.ts`: `ultimiDelDettaglio(letture)` (la prima arrivata per `dataUpdatedAt`, fra quelle che hanno
    l'elenco), `perimetroDelDettaglio(letture)` con la stessa regola, e `ultimoDatoInErrore`.
  - In `shared/ui/pagina/Dettaglio.tsx`: `BarraRiferimenti({ perimetro, ultimi, inErrore })`, dove `perimetro` e' il testo
    della pill.
  - Fisico e istituzionale li usano (il fisico passa le letture, non i soli data); le copie sono tolte.
- **Test:**
  - L1 in `tests/lib.test.ts`, con due letture arrivate in ordine inverso a quello delle schede.
  - L2 della barra in `tests/kit-comune.test.tsx`.
  - Tolti i test delle copie da `fisico-lib` e `istituzionale-lib`.
- **Residuo fuori dal fix:** `titoloIntervento` (una riga, identica) resta copiato in fisico, istituzionale e procedurale.
  Il Judge lo cita nell'evidenza ma non nel fix, e la copia del procedurale e' nell'area del gruppo PEF.
- **Commit:** `a1e4612`.

### FIS-07 (COSMETICO): `NON_DISPONIBILE_BREVE` e `resaAssenza` copiati dal procedurale
- **Cosa:** esportati da `entities/importo` accanto a `descriviAssenza`. Tolte le copie del fisico e del procedurale, che
  li importano dall'entity:
  - procedurale: `lib/formato.ts`, `lib/grafici.ts`, `ui/CardSottofasi.tsx`, `ui/comuni.tsx`;
  - fisico: `lib/formato.ts`, `lib/grafici.ts`, `lib/unitAmount.ts`.
- **Test:** un solo L1 in `tests/lib.test.ts`. Tolte le asserzioni copiate da `procedurale-lib`; `fisico-lib` importa la
  costante dall'entity.
- **Commit:** `2aee55e`.

### FIS-08 (COSMETICO): residuo `onRiga` facoltativo e colonne ricopiate nella scheda
- **Cosa:**
  - `onRiga` e' obbligatorio: tolti i due rami e corretto il commento.
  - Le otto colonne con titolo, cella e valore sono esportate come `COLONNE_UNIT_AMOUNT`: la pagina ci aggiunge
    l'Intervento, la scheda del dettaglio le passa alla sua `TabellaStatica`.
- **Test** (`tests/fisico-ui.test.tsx`):
  - la scheda ha i titoli della pagina senza l'Intervento e le stesse celle, riga per riga;
  - ogni riga della pagina si apre.
- **File:** `src/features/fisico/ui/TabellaUnitAmount.tsx`, `SchedeIntervento.tsx`, `tests/fisico-ui.test.tsx`.
- **Commit:** `50bef92`.

## Istituzionale

### IST-01 (MINORE): l'errore dell'unica lettura partita nascondeva schede e selettore
- **Cosa:** `statoDellaPagina`, con almeno una scheda visibile, da' `'dati'` anche quando le letture partite sono in
  errore. La scheda mostra il testo statico col suo selettore; l'avviso della pagina tiene Riprova.
- **Test:**
  - Errore di TX-0015: corretto, ora verifica tablist, selettore dell'esercizio e testo statico nella scheda SIGC (una
    sola volta).
  - Nuovo: l'errore si ripete (`TEMPO_SCADUTO`) e dal selettore della scheda si sceglie e si legge un altro esercizio.
  - Nuovo, caso speculare: TX-0016 in errore con `?anno`; restano selettore dell'anno e testo statico, la scheda SIGC si
    apre e chiede l'esercizio.
  - L1 in `istituzionale-lib`.
- **Nota:** con Riprova o con un altro esercizio dopo l'errore torna lo scheletro della pagina finche' la lettura non
  risponde. E' la regola del kit (`statoDelDettaglio`: nessuna lettura coi dati e una in corso), non toccata.
- **File:** `src/features/istituzionale/lib/intervento.ts`, `ui/DettaglioIntervento.tsx` (commento), test della pagina
  `interventi`, `tests/istituzionale-lib.test.ts`.
- **Commit:** `917dfc3`.

### IST-02 (MINORE): conteggio senza attesa nel test col solo grant di TX-0015
- **Cosa:** il test chiude scegliendo l'esercizio con Mostra e conta dopo la tabella SIGC: `verifica = []`,
  `verificaSigc = ['?intervento=SRA01&esercizio=2025']`.
- **File:** `src/pages/istituzionale/interventi/page.test.tsx`.
- **Commit:** `917dfc3`.

### IST-03 (MINORE, decisione D3): ultimo esercizio chiuso nel fuso del browser
- **Cosa:** `esercizioUltimoChiuso` ricava giorno, mese e anno nel fuso Europe/Rome
  (`Intl.DateTimeFormat('it-IT', { timeZone: 'Europe/Rome', ... }).formatToParts`) prima della regola del 16/10.
- **Test:**
  - L1 con istanti espliciti.
  - Al confine (15/10 23:30 e 16/10 00:30 ora italiana) col fuso del processo in UTC, New York, Kiritimati e Roma.
  - Card della Home con l'orologio finto (solo `Date`) e `TZ=UTC`: alle 21:30Z esercizio 2025, alle 22:30Z esercizio
    2026, nel nome del gruppo e nella query di TX-0015.
  - I test che usavano date locali (`new Date(2026, 9, 15, 23, 59)`) ora usano istanti in UTC: col fuso del processo in UTC
    avrebbero dato un altro esercizio.
- **File:** `src/features/istituzionale/lib/criteri.ts`, `ui/AnteprimaIstituzionale.tsx` (commento),
  `tests/istituzionale-lib.test.ts`, `tests/anteprime-home.test.tsx`.
- **Commit:** `f8dd78d`.

### IST-04 (MINORE): la regola del periodo SIGC sparsa e divergente
- **Cosa:**
  - `periodoDellaRisposta(d, chiesto)` in `lib/verificaSigc.ts`: l'esercizio della risposta o quello chiesto, l'anno delle
    domande della risposta o n-1, come dice la spec di TX-0015.
  - La usano la card della Home, la scheda SIGC del dettaglio (KPI, didascalia, file), la fonte della card della pagina e
    le voci dei riferimenti. La voce "Anno delle domande" ora dice n-1 come la didascalia, non "non disponibile".
  - `estremiEsercizio(n)` in `lib/formato.ts`, usata da `periodoEsercizio` e da `riferimentoAnteprimaSigc`.
- **Conseguenza su IST-06:** con l'ultimo consumatore e' uscito `annoOpzionale`, appena portato in `shared/lib` da IST-06.
  L'ho tolto col suo test, per non lasciare un helper morto nel kit (la stessa regola di FIN-01).
- **Test:** L1 del ripiego n-1 (anche partendo dall'esercizio della risposta), degli estremi e del testo del riferimento;
  le voci dei riferimenti senza esercizio e anno.
- **Commit:** `4c2e8cd`.

### IST-05 (MINORE): cast non verificati in `ValoreDelDatoSigc`
- **Cosa:** `DatoVerificaSigc` e' un'unione per campo (`{ [C in CampoVerificaSigc]: ... }[CampoVerificaSigc]`). Il tipo
  ammesso (`TipiDelCampo`) e' ricavato dalla forma del campo nel DTO:
  - testo;
  - conteggio sempre valorizzato;
  - quantita' o numero facoltativo;
  - si'/no col motivo;
  - conteggio col motivo o importo.
- `DATI_VERIFICA_SIGC` non compila con un tipo sbagliato (provato anche cambiando a mano una voce). Le conversioni in
  `ui/comuni.tsx` restano, ma ora sono garantite dalla tabella: il commento lo dice.
- **Test:** quattro `@ts-expect-error` controllati da `tsc` e, a runtime, la forma dei valori della riga di prova per ogni
  tipo dichiarato.
- **Commit:** `589a158`.

### IST-06 (COSMETICO) e FIN-01 (COSMETICO): helper facoltativi copiati, helper morti nel finanziario
- **Cosa:**
  - `numeroOpzionale` e `testoOpzionale` (e `annoOpzionale`, poi tolto con IST-04) in `shared/lib/grafici/primitive.ts`,
    accanto a `NON_DISPONIBILE`, esportati dal barrel.
  - Finanziario e istituzionale li importano dal kit e le copie sono tolte.
  - Dal finanziario tolti anche `siNo` e `annoOpzionale`, senza consumatori di produzione.
- **Test:** un solo L1 in `tests/lib.test.ts`. Tolte le asserzioni dei tre helper da `finanziario-lib` (anche quelle di
  `siNo`) e da `istituzionale-lib`.
- **File:**
  - finanziario: `lib/formato.ts`, `lib/grafici/domande.ts`, `lib/grafici/sigc.ts`, `ui/colonneAnno.tsx`,
    `ui/RiservaReport.tsx` (solo la riga d'import);
  - istituzionale: `lib/formato.ts`, `lib/verificaSigc.ts`, `ui/comuni.tsx`.
- **Commit:** `9144ab6`.

### IST-07 (COSMETICO): risposta SIGC impacchettata per aggirare la regola del vuoto
- **Cosa:** `LetturaDettaglio` del kit ha il campo facoltativo `decideIlVuoto?: false`, rispettato da `statoDelDettaglio`.
  `lettureDelloStato` passa la lettura di TX-0015 com'e', con quell'opzione.
- **Test:** L1 nel kit (vuoto, dati, errore e attesa con l'opzione) e in `istituzionale-lib`.
- **Commit:** `35738b0`.

### IST-08 (COSMETICO): residui senza consumatori
- **Cosa:** tolti `VERIFICA_SMP_SIGC` e `ricercaConAnno`. I test usano `PERCORSI.verificaSigc` (`app-aree`) e
  `ricercaConParametro(PARAMETRO_ANNO)` (`istituzionale-lib`); tolta l'asserzione sul letterale.
- **Commit:** `8aa66bc`.

### IST-09 (COSMETICO): il suggerimento del codice non valido nominava solo la verifica non SIGC
- **Cosa:** il testo e' ora "Scegli l'intervento dalla verifica SMP non SIGC o dalla verifica SMP SIGC.", testo fisso come
  quello del fisico.
- **Test:** il testo, e nessuna lettura nemmeno di TX-0015. Il test usa `endsWith` con una stringa, non un'espressione
  regolare con l'apostrofo, per lo stripper del self-check di step7.
- **Commit:** `123bafd`.

### IST-10 (COSMETICO): la frase reciproca perdeva l'azione portante
- **Cosa:** le due frasi costruiscono il link dai criteri dell'indirizzo (`filtriDaRicerca(useLocation().search)`), come il
  menu, invece che da `pagina.filtri`.
- **Test** nelle due pagine, con `?intervento=...&azione=3` e legame assente: la lettura e' senza l'azione, l'href della
  frase la contiene.
- **Commit:** `41b6eee`.

## File comuni toccati e dove

Ho fatto modifiche locali, senza riordini.

### Codice
- **`src/entities/importo`:**
  - `lib/importo.ts`: `NON_DISPONIBILE_BREVE` e `resaAssenza`, prima di `testoConNota`;
  - `index.ts`: una riga di export.
- **`src/entities/filtri`:**
  - `ui/PaginaReportProgramma.tsx` (nuovo);
  - `index.ts`: due righe di export e il commento in testa.
- **`src/shared/lib`:**
  - `dettaglio.ts`: `decideIlVuoto` in `LetturaDettaglio` e in `statoDelDettaglio`; in coda le regole della barra dei
    riferimenti; il commento in testa;
  - `grafici/primitive.ts`: `numeroOpzionale` e `testoOpzionale`, dopo `valorePercentuale`.
- **`src/shared/ui`:**
  - `pagina/Dettaglio.tsx`: `BarraRiferimenti` in coda, due import, il commento in testa;
  - `index.ts`: l'export della riga di `Dettaglio`.
- **Procedurale (FIS-07):** `lib/formato.ts` (tolte la costante e la funzione, gli import, il commento in testa),
  `lib/grafici.ts`, `ui/CardSottofasi.tsx` e `ui/comuni.tsx` (solo le righe d'import).
- **Finanziario (IST-06, FIN-01):** i file elencati sopra. In `RiservaReport.tsx` solo le righe 10 e 16, lontane dalla riga
  123 di FIN-02.

### Test
- `tests/lib.test.ts`: import; nel describe `lib/dettaglio`, due casi; in coda due describe.
- `tests/kit-comune.test.tsx`: import; un describe in coda.
- `tests/entita-filtri-ui.test.tsx`: import e commento in testa; un describe in coda.
- `tests/app-aree.test.tsx`: righe 30-32 (import) e 112-113.
- `tests/anteprime-home.test.tsx`: import di `vi`; un caso nel describe della card Istituzionale.
- `tests/procedurale-lib.test.ts`: riga 46 (import) e il caso "si e no" (righe 398-402).
- `tests/finanziario-lib.test.ts`: import del formato (righe 20-28); describe "formato dei campi facoltativi" (righe 259-277).
- `tests/fisico-lib.test.ts`, `tests/istituzionale-lib.test.ts`, `tests/fisico-ui.test.tsx`: file delle feature del
  gruppo FI.

### Possibili conflitti nella fusione col gruppo PEF
- **`tests/finanziario-lib.test.ts`:** FIN-02 cambia l'import di `anniSelezionabili` (riga 11) e il caso delle righe
  251-254. I miei blocchi sono separati da righe invariate (12-19 e 255-258), quindi la fusione dovrebbe essere pulita.
- **`tests/app-aree.test.tsx`:** ho cambiato le righe 30 e 32. Se il gruppo PEF tocca la riga 31 (import di
  `PAGINE_PROCEDURALE`, PRO-03), git segnala un conflitto banale: tenere entrambe le righe.
- **Procedurale:** tocco solo le righe d'import e il commento in testa di `lib/formato.ts`. Non ho toccato i file delle
  determine, `lib/pagine.ts` ne' `lib/grant.ts`.
