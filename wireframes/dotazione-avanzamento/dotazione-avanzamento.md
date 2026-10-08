# Flusso dotazione-avanzamento - wireframe v2 (feature finanziario)

> Doc del gate umano PER FLUSSO. L'approvazione e' content-addressed sull'INTERA dir
> `wireframes/dotazione-avanzamento/` (hash da `wireframe-hash.sh`): modificare un file qui invalida
> l'approvazione del flusso (e solo di questo flusso).

## Route del flusso

| route | kind | pattern | grant (verbatim dal catalogo) |
|---|---|---|---|
| /finanziario/dotazione | report | report v2 (KPI, grafici, tabella interattiva) | csr.tx-0002.read, csr.tx-0003.read |
| /finanziario/avanzamento | report | report v2 (KPI, grafici, tabella interattiva) | csr.tx-0004.read, csr.tx-0005.read, csr.tx-0006.read, csr.tx-0007.read |

## Component tree (per pagina)

Vocabolario del kit UI v2 (ADR 0027 di green-fe), resa approvata nel prototipo `prototipo/finanziario/`.

- /finanziario/dotazione: Shell > Barra filtri > Breadcrumb > Titolo > Card dotazione e pagamenti (barre) + Card quota FEASR (ciambella) > Card contributo ambientale (barre) > Stati
- /finanziario/avanzamento: Shell > Barra filtri > Breadcrumb > Titolo > KPI x4 (con fonte non attiva dichiarata) > Card dove va la dotazione (sankey) + Card pagato sulla dotazione (gauge) > Stati

## Grafici del flusso

| pagina | grafico | tipo | dati (transazione) | clic | valori assenti |
|---|---|---|---|---|---|
| /finanziario/dotazione | Dotazione e pagamenti per intervento | barre | TX-0002 | dettaglio dell'intervento | perimetro ADA: dotazione regionale non affiancata |
| /finanziario/dotazione | Quota FEASR e non FEASR | ciambella | TX-0003 | nessuno | 'grafico non disponibile' con il motivo |
| /finanziario/dotazione | Contributo ambientale | barre | TX-0002 | dettaglio dell'intervento | percentuale assente: omessa |
| /finanziario/avanzamento | Dove va la dotazione | sankey | TX-0005, TX-0006, TX-0007 | nessuno | ramo impegnato non disegnato (fonte non attiva), dichiarato |
| /finanziario/avanzamento | Pagato sulla dotazione | gauge | TX-0007 | nessuno | non disegnato se manca un termine |

Stanziato, impegnato, quote Stato e Regione e vincolo LEADER hanno fonte non attiva nel backend: le card lo dicono con il motivo, mai uno zero.

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

- Nessuno specifico del flusso.
