# Review step9 FULL — feature istituzionale, v1 iterazione 2 (budget 3)

Contesto, regole, formato di output e scelte approvate sono quelli di `review/istituzionale/v1-iter1/brief.md`: leggilo per
intero, vale anche qui. Le eccezioni sono elencate sotto.

## Cosa e' successo dall'iterazione 1 (22/10/2026)
- **Finding accettati:** 24 (18 MINORE, 6 COSMETICO), in `review/istituzionale-findings.json` e nel Judge
  `review/istituzionale/v1-iter1/judge.md`.
- **Correzioni:** commit da e072e58 a 8ab034d, resoconto `review/istituzionale/v1-iter1/correzioni.md`.
- **Decisioni dell'utente del 22/10/2026** (report `review/istituzionale-review.md`). Sono registrate nei
  `deviations_reviewed` dei gate (5c1824a), i wireframe NON cambiano, e NON sono finding:
  - D1 (V5): i chip dei filtri mostrano il codice, come nel low-fi approvato e nelle barre di finanziario e fisico;
  - D2 (X2): TX-0016 e TX-0017 si leggono all'apertura della pagina del dettaglio, non della scheda. Lo prova il test "una
    sola lettura per transazione".
- **Effetti dichiarati sulle altre feature**, che non sono finding se coerenti:
  - codice comune nuovo o spostato: `useErroreNellaPagina`/`ErroreNellaPagina`, `AvvisoAggiornamento` dall'elenco al kit,
    `useFocusSeSparisce`, `useRigheContesto`, `testoPerimetro` e `anniProposti` in `shared/lib`, `ricercaDeiSoliFiltri` e
    `usePannelloConFocus` in `entities/filtri`, `Scaricamento.oggetto` e `CardGrafico.oggettoDati` al posto di `oggetto`;
  - chiavi degli ambiti tipizzate da `ORDINE_AMBITI`;
  - il finanziario importa `ApriNellElenco` da `entities/domanda`;
  - l'elenco operativo tiene il suo `testoPerimetro`, con una resa diversa ("ADA del tuo profilo").

## Compito dell'iterazione 2
- (a) Verifica che ogni finding dell'iterazione 1 sia risolto. Se non lo e', ripresentalo citando l'id.
- (b) Cerca difetti NUOVI introdotti dalle correzioni, in particolare:
  - nel codice comune nuovo o spostato e nei suoi usi in finanziario, fisico ed elenco (nessuna regressione);
  - nel dettaglio dell'intervento (`statoDelDettaglio`, un solo proprietario dell'errore, scheda attiva nella pagina);
  - in `PaginaReport`;
  - nei test nuovi: provano davvero quello che dichiarano?
- Perimetro: `git diff 5c1824a 7ca8a0c`.
- Anti-inflation: non riproporre cio' che l'iterazione 1 ha verificato come corretto.
- Il gate step8 e' in corso: non presumerne l'esito.

Output: `review/istituzionale/v1-iter2/<lente>.json`.
