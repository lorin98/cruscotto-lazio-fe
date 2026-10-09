# Flusso domande - wireframe v2 (feature finanziario)

> Doc del gate umano PER FLUSSO. L'approvazione e' content-addressed sull'INTERA dir
> `wireframes/domande/` (hash da `wireframe-hash.sh`): modificare un file qui invalida
> l'approvazione del flusso (e solo di questo flusso).

## Route del flusso

| route | kind | pattern | grant (verbatim dal catalogo) |
|---|---|---|---|
| /finanziario/domande | report | report v2 (KPI, grafici, tabella interattiva) | csr.tx-0008.read, csr.tx-0009.read, csr.tx-0010.read |

## Component tree (per pagina)

Vocabolario del kit UI v2 (ADR 0027 di green-fe), resa approvata nel prototipo `prototipo/finanziario/`.

- /finanziario/domande: Shell > Barra filtri > Breadcrumb > Titolo > KPI x4 > Card domande per anno (barre impilate) + Card importi per anno (linea) > Stati

## Grafici del flusso

| pagina | grafico | tipo | dati (transazione) | clic | valori assenti |
|---|---|---|---|---|---|
| /finanziario/domande | Domande per anno di raccolta | barre | TX-0008 | filtra la tabella sull'anno | riga senza anno: barra a parte |
| /finanziario/domande | Importi ammessi e decretati per anno | linea | TX-0010 | nessuno | stanziato: fonte non attiva |

Il decretato e' calcolato dai pagamenti totali (OP-FE-05).

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

- OP-FE-05: significato del decretato da confermare con ARSIAL.
