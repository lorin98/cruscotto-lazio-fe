# Review step9 FULL sul delta delle revisioni del 04/11/2026, passata 2 MIRATA (verifica delle correzioni + Judge)

Stessa forma della passata 2 mirata del 02/11 sul backend e della passata 3 del 01/11 sul frontend: un verificatore controlla
che ogni finding della passata 1 sia chiuso davvero e che le correzioni non abbiano rotto altro; poi il Judge ricalcola i
finding per feature e il verdetto con `review-score.sh FULL`. Valgono il brief della passata 1 (`brief-comune.md`) e le sue
regole.

## Ingresso
- Finding della passata 1: `review/delta-revisioni-2026-11-04-findings-passata1.json` (J-01..J-20; resoconto del Judge in
  `review/delta-revisioni-2026-11-04/judge-passata1.md`).
- Correzioni: `git diff 5222fae HEAD -- src tests e2e wireframes plan uiplan.json route-manifest.json` (commit b4a82df wireframe
  e step1, 38a499a finanziario, f976a28 kit ed elenco operativo, 417ea3e istituzionale, b04e2eb e2e; poi stati e report dei
  gate step2-8).
- Esiti gia' misurati (non rilanciarli): tsc e eslint puliti, vitest 1765/1765, e2e Playwright `npm run test:e2e` 8/8 (anche il
  dettaglio dell'intervento, rotto dal 31/10 per il fixture senza pagamenti lordi), step2-8 rilanciati (log
  `../../ambiente-prova/log/gate-fe-residui-20261104.out`).

## Scelte dell'utente del 04/11/2026, 22:06:16Z (NON sono finding)
- J-10: nessun cambio del backend. La pill della verifica SMP non SIGC dice "Anno di riferimento scelto: aaaa" (non che il
  file c'e') e lo stato "nessun file SMP non SIGC per l'anno scelto" esce dal wireframe (riapprovato, hash 3ee85d18...) e dal
  codice, anche dalla scheda dell'intervento; punto aperto verso il backend: annoRiferimento null se l'anno scelto non ha
  un file. La card della Home legge ancora senza anno (ultimo anno con un file) e puo' dire "nessun file SMP".
- J-20: i wireframe di pagamenti e domande dicono "Pagamenti per pagina" e "Domande per pagina" (riapprovati, hash
  b746e290... e 8d289fad...).
- J-09: il codice allineato al wireframe ("dall'impegnato FEASR e non").
- J-04: lo spazio a destra e' riservato sempre (larghezza stimata dell'etichetta piu' lunga degli ultimi segmenti, circa 7 px
  per carattere); il massimo dell'asse torna quello di ECharts.
- J-06: nel perimetro ADA il grafico per intervento ha impegnato e pagato (misure per domanda dell'area), senza dotazione.
- J-15: il detail dell'uiplan resta da correggere al prossimo giro che lo risigilla (non toccato).

## Compito del verificatore
Per ogni J-xx: `chiuso` (con file:riga della correzione e del test che la prova), `parziale` o `aperto`, con l'evidenza.
Poi i NUOVI problemi introdotti dalle correzioni (regressioni, test che non provano, testi o concordanze, accessibilita'),
con la stessa forma dei finding. Niente da riproporre di gia' deciso sopra.

Output del verificatore: JSON in `review/delta-revisioni-2026-11-04/verifica-passata2.json`:
`{"esiti":[{"id":"J-01","esito":"chiuso|parziale|aperto","evidenza":"..."}],"nuovi":[{"id":"N-01","feature","severity","file","titolo","evidenza","fix"}]}`.
E' l'unico file che puo' scrivere.
