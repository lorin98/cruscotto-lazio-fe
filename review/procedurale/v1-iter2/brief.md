# Review step9 FULL — feature procedurale, v1 iterazione 2 (budget 3)

Contesto, regole, formato di output e scelte approvate sono quelli di `review/procedurale/v1-iter1/brief.md`: leggilo per
intero, vale anche qui. Le differenze sono elencate sotto.

## Cosa e' successo dall'iterazione 1 (23/10/2026)
- **Finding accettati:** 23 (20 MINORE, 3 COSMETICO), in `review/procedurale-findings.json`; Judge in
  `review/procedurale/v1-iter1/judge.md`.
- **Correzioni:** commit da eaf9f9f a 07940a3, resoconto `review/procedurale/v1-iter1/correzioni.md`.
- **Decisioni dell'utente del 23/10/2026** (report `review/procedurale-review.md`, commit 947fc54). NON sono finding:
  - D1 (V1): TX-0025 e RF025 dichiarati nello uiplan per `/procedurale/interventi/:codice`, con roles invariati;
    l'azione hide-by-role `csr.tx-0025.read` e' nella route-table e il route-manifest e' riproiettato.
  - D2 (V5): AT001 o un intervento fuori dal CSR resi come "senza dati", perche' il backend risponde 200 senza righe.
    La deviazione e' registrata nel gate `wireframe_panoramica`.
- **Cambiamenti visibili dichiarati nel procedurale**, chiesti dai fix (non sono finding se coerenti):
  - testi del vuoto col perimetro ADA;
  - motivo della voce senza link;
  - pulsante "Filtra la tabella" nelle pagine degli stati;
  - motivo delle assenze nell'anteprima delle Unit Amount e nel riepilogo;
  - colonna Unit Amount non nascondibile;
  - PNG delle schede "di <codice>";
  - "non disponibile" al posto di "-".
- **Effetti sulle altre feature:** il resoconto dichiara che nessun fix cambia cio' che si vede in finanziario, fisico,
  istituzionale ed elenco operativo. Il codice comune toccato e' elencato nel resoconto: kit della tabella, tema (H5,
  intestazioni sticky su due righe), `CardGrafico`, grafici comuni (H6), hook dei filtri (H3), "presto" tolto (H8),
  `testoPerimetro` unico (H9).
- **Parti facoltative non fatte** (non sono finding): formato delle chiavi di stato (A2), wrapper e slot della testata in
  `PaginaConFiltri` (H1), `PannelloDelloStato` (H10).

## Compito dell'iterazione 2
- (a) Verifica che ogni finding dell'iterazione 1 sia risolto. Se non lo e', ripresentalo citando l'id.
- (b) Cerca difetti NUOVI introdotti dalle correzioni, in particolare:
  - nel codice comune e nei suoi usi in finanziario, fisico, istituzionale ed elenco (nessuna regressione), compresi il
    tema delle tabelle e il "presto" tolto da Home e menu;
  - nel dettaglio dell'intervento;
  - nelle pagine degli stati;
  - nei test nuovi: provano davvero quello che dichiarano?
- Perimetro: `git diff 947fc54 07940a3` per il codice; il resoconto e' in 1415299.
- Anti-inflation: non riproporre cio' che l'iterazione 1 ha verificato come corretto.
- Il gate step8 e' in corso: non presumerne l'esito.

Output: `review/procedurale/v1-iter2/<lente>.json`.
