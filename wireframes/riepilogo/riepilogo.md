# Flusso riepilogo - wireframe v2 (feature finanziario)

> Doc del gate umano PER FLUSSO. L'approvazione e' content-addressed sull'INTERA dir
> `wireframes/riepilogo/` (hash da `wireframe-hash.sh`): modificare un file qui invalida
> l'approvazione del flusso (e solo di questo flusso).

## Route del flusso

| route | kind | pattern | grant (verbatim dal catalogo) |
|---|---|---|---|
| /finanziario/riepilogo | report | report v2 (KPI, grafici, tabella interattiva) | csr.tx-0011.read |

## Component tree (per pagina)

Vocabolario del kit UI v2 (ADR 0027 di green-fe), resa approvata nel prototipo `prototipo/finanziario/`.

- /finanziario/riepilogo: Shell > Barra filtri > Breadcrumb > Titolo > Card tabella (cerca, colonne, esporta CSV, ordinamento, totali, riga AT, paginazione) > Card vista grafico (barre) > Drawer di anteprima > Stati

## Grafici del flusso

| pagina | grafico | tipo | dati (transazione) | clic | valori assenti |
|---|---|---|---|---|---|
| /finanziario/riepilogo | Dotazione e pagamenti per intervento | barre | TX-0011 | dettaglio dell'intervento | valore assente: barra omessa, dichiarata |

La riga apre il drawer di anteprima; dal drawer si passa al dettaglio dell'intervento. Export CSV con gli stessi filtri e X-Requested-With.

## Stati resi (obbligatori)

- vuoto: messaggio azionabile con "Modifica i filtri" (mai schermo bianco)
- caricamento: scheletro delle card, `role="status"` + `aria-live="polite"`; letture al piu' due alla volta
- errore: `role="alert"`, discriminato sul problem-type `urn:cruscottocsr:problem:*` (403 accesso negato; 503 capacita'
  esaurita, ritentata rispettando Retry-After; 504 tempo scaduto; 401/419 sessione)

## Note WCAG 2.2 (residuo manuale DICHIARATO)

- Meccanizzato a valle (step7/step8): tab-order, focus sul titolo dopo il cambio di route, focus-trap di pannello e
  drawer, tabella equivalente di ogni grafico, axe.
- RESIDUO umano da verificare qui: ordine di lettura, didascalie dei grafici, etichette comprensibili, contrasto della
  resa finale (il low-fi non fa fede sul colore; fa fede il prototipo approvato).

## Punti aperti che toccano questo flusso

- OP-FE-06: ritorno alla pagina dopo un 401 (limite accettato).
