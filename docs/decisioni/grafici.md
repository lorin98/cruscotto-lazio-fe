# Grafici dei report (OP-FE-01)

Decisione del 08/10/2026 (step5-ui della feature `finanziario`).

- RF002-RF008 e RF010 chiedono "un grafico e una tabella". I grafici sono **componenti SVG propri, senza libreria**
  (`src/shared/ui/grafici/`): barre, ciambella e linea, non interattivi.
- Motivo: nessuna dipendenza nuova da ricercare e pinnare nei foundation pins; accessibilita' controllata
  (`<figure>`, `svg role="img"` con `<title>` e `<desc>`, legenda testuale).
- La **tabella resta il canale primario** (WCAG 1.1.1, 1.4.1): ogni grafico ha sotto la tabella con gli stessi valori.
  Un valore assente (Importo con motivo) non diventa uno zero: il grafico lo omette e lo dice nella descrizione.
- Se in futuro servono grafici interattivi, la libreria va scelta e pinnata con un ADR e i wireframe ri-approvati.

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
- La palette e' interna ai grafici (non esportata): il colore non e' mai l'unico canale (legenda testuale + tabella).
