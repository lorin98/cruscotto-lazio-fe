# Review step9 FULL sul delta del riallineamento — passata 2: elenco-operativo e procedurale (30/10/2026, budget 3)

Seconda passata per le due feature senza step9 registrato dopo la passata 1: **elenco-operativo** (FAIL per EO-01) e
**procedurale** (PASS 89, riaperto dalla decisione D1 che cambia la pagina delle determine). Finanziario, fisico e
istituzionale hanno lo step9 registrato alla passata 1 e sono fuori da questa passata, salvo regressioni che le correzioni
comuni portano nelle due feature in esame.

Vale tutto il brief della passata 1, `review/riallineamento-2026-10-30/review/brief-comune.md` (riferimenti, novita'
approvate, scelte gia' approvate, regole, formato dell'output): leggilo per primo. Qui cambiano solo perimetro e punti.

## Passata 1 e decisioni
- Report `review/riallineamento-2026-10-30-review.md`, Judge `review/riallineamento-2026-10-30/review/judge-passata1.md`,
  finding accettati `review/riallineamento-2026-10-30/review/{elenco-operativo,procedurale}-findings-passata1.json`
  (EO-01; PRO-01..PRO-05).
- Decisioni dell'utente del 30/10/2026: **D1 (a)** il link della scheda dell'elenco porta il tipo della scheda nello state
  della navigazione (mai nell'URL); la pagina delle determine avvisa (`role="status"`) quando `tipoDomanda` della risposta e'
  diverso, con il link `scheda-di-partenza` (solo con csr.tx-0058.read) che riapre la scheda di partenza sulla scheda
  Determine (state `schedaIniziale`). Wireframe `wireframes/procedurale/determine/` e
  `wireframes/elenco-operativo/dettaglio-domanda/` aggiornati e RIAPPROVATI dall'utente (a934a29): sono la fonte.
  **D2 (a)** "Cerca un altro codice" (focus al campo) anche nell'avviso degli errori 403/429/503 delle determine.
- Correzioni: resoconti `review/riallineamento-2026-10-30/correzioni-passata1-pef.md` (procedurale, EO-01, FIN-02) e
  `correzioni-passata1-fi.md` (fisico, istituzionale, FIN-01: tocca anche codice comune usato dal procedurale, per esempio
  `entities/importo` per FIS-07).
- Scostamento dichiarato, da valutare: il wireframe delle determine dice che dopo una ricarica l'avviso non c'e', ma il
  browser conserva lo state della navigazione alla ricarica, quindi l'avviso resta (la domanda mostrata e' ancora
  dell'altro tipo).

## Perimetro
- Correzioni: `git diff 6857940 HEAD -- src tests plan/procedurale plan/elenco-operativo wireframes/procedurale
  wireframes/elenco-operativo` (6857940 = step8 prima della review), guardando in particolare cio' che tocca le due feature e
  il codice comune che usano.
- Delta completo delle due feature per la verifica di non regressione: `git diff e0f6cb7 HEAD` sugli stessi percorsi.

## Punti da valutare
- I sei finding della passata 1 sono risolti davvero (codice e test), senza effetti collaterali?
- D1: avviso solo nei casi del wireframe (tipo diverso; mai con lo stesso tipo, senza state, con state non valido, dopo una
  nuova ricerca dal modulo); testo con i tipi giusti; link `scheda-di-partenza` col suo grant, indirizzo e state convalidati;
  la scheda dell'elenco che si apre su Determine solo con lo state valido; nessun dato nell'URL; nessuna informazione sul
  perimetro del P4 rivelata dall'avviso (per il P4 la domanda dell'altro tipo puo' essere fuori area: cosa vede?).
- D2: stesso comportamento del 404 per il link e il focus; Riprova secondo la politica comune.
- Regressioni nelle due feature dalle correzioni comuni del gruppo FI (`entities/importo`, `entities/filtri`, `shared/lib`,
  `shared/ui`, `AvvisoPagina` con la prop `azioni`).
- Test che provano cio' che dichiarano.

## Output
Come nella passata 1, con il suffisso `-passata2`: lenti `lente-V-passata2.json`, `lente-H-passata2.json`,
`lente-A-passata2.json`, `antagonista-passata2.json`; Judge `elenco-operativo-findings-passata2.json`,
`procedurale-findings-passata2.json` e `judge-passata2.md`. Campo `feature` = elenco-operativo | procedurale | comune.
