# Grafici dei report (OP-FE-01)

Decisione del 08/10/2026 (step5-ui della feature `finanziario`), aggiornata con la UI v2 (ADR 0027 del plugin, wireframe
v2 approvati l'08/10/2026) e con i download del 09/10/2026.

- RF002-RF008 e RF010 chiedono "un grafico e una tabella". I grafici sono **ECharts 6** con import modulari
  (`src/shared/ui/grafici/echarts.ts`, unico punto d'ingresso della libreria): barre, ciambella, linea, sankey, gauge,
  imbuto, cascata, treemap e raggiera. Le opzioni le costruiscono builder **puri** nei `lib/` (`src/shared/lib/grafici`,
  `src/features/*/lib/grafici`); il kit (`Grafico`, `CardGrafico`) gestisce solo il ciclo di vita.
- **Interazioni**: zoom delle barre oltre 12 categorie, clic su una barra o un nodo per il dettaglio dell'intervento,
  drill-down di treemap e raggiera per famiglia, legenda per nascondere una serie. Con `prefers-reduced-motion` niente
  animazioni.
- **Resa**: renderer **SVG** sullo schermo (testo selezionabile, nitido in stampa); il **canvas** solo per il PNG
  scaricato, ridisegnato fuori pagina con le opzioni, le dimensioni e la radice di vista correnti (il drill-down), sotto
  l'intestazione di NFR-50 (fonte, filtri, data e ora, ultimo dato sincronizzato, profilo, uso interno). Il PNG non e'
  registrato in audit: OP-FE-08.
- **CSP**: tooltip in `richText`, disegnati nel grafico, mai HTML (niente stili inline ne' `innerHTML`); verificato dagli
  e2e sotto la CSP del README.
- **Accessibilita'**: descrizione accessibile sull'SVG (`aria.label.description`), interruttore Grafico / Tabella; la
  **tabella resta il canale primario** (WCAG 1.1.1, 1.4.1), con gli stessi valori. Un valore assente (Importo con motivo)
  non diventa uno zero: il grafico lo omette e lo dice nella descrizione e nelle "voci non nel grafico".

## Regole di resa (review step9)

- **Barre**: i valori assenti (null) e i negativi (es. rettifiche nette) **non si disegnano**; la descrizione del
  grafico dice quanti ne sono stati omessi e perche'. Variante **impilata** (RF008, domande per anno): le parti
  (prima annualita', altre, non classificate) sono la ripartizione del totale dell'anno, e il totale e' in tabella.
- **Ciambella** (RF003-RF007): mostra le due parti di un totale. **Non si disegna** se una parte manca o e' negativa
  (le percentuali sarebbero false): al suo posto il testo "grafico non disponibile" con il motivo; le voci restano in
  tabella. Le percentuali sono nella descrizione accessibile.
- **Linea** (RF014, utilizzo cumulato): i punti assenti sono omessi e dichiarati, mai portati a zero.
- **Perimetro misto** (P4, perimetro ADA): la dotazione di programma e' regionale, impegni e pagamenti sono dell'area.
  Nel grafico per intervento di RF002 la serie della dotazione non si affianca ai pagamenti dell'area; in tabella le
  colonne di programma sono marcate "(regionale)" con una nota.
- **Importi**: in milioni da un milione in su, sotto in euro pieni (mai "0,0 M€" per un importo piccolo); i totali
  con un intervento mancante sono "non calcolabile" con gli interventi che mancano, mai una somma parziale.
- La palette e' interna ai grafici (non esportata): il colore non e' mai l'unico canale (legenda testuale + tabella).
