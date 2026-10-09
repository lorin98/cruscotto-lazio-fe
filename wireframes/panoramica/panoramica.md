# Flusso panoramica - wireframe v2 (feature finanziario)

> Doc del gate umano PER FLUSSO. L'approvazione e' content-addressed sull'INTERA dir
> `wireframes/panoramica/` (hash da `wireframe-hash.sh`): modificare un file qui invalida
> l'approvazione del flusso (e solo di questo flusso).

## Route del flusso

| route | kind | pattern | grant (verbatim dal catalogo) |
|---|---|---|---|
| /finanziario | cruscotto | cruscotto (KPI + grafici) | csr.tx-0001.read, csr.tx-0002.read, csr.tx-0009.read, csr.tx-0012.read, csr.tx-0013.read |
| /finanziario/interventi/:codice | dettaglio | dettaglio (testata + KPI + schede) | csr.tx-0011.read, csr.tx-0002.read, csr.tx-0008.read, csr.tx-0010.read, csr.tx-0012.read, csr.tx-0013.read |

## Component tree (per pagina)

Vocabolario del kit UI v2 (ADR 0027 di green-fe), resa approvata nel prototipo `prototipo/finanziario/`.

- /finanziario: Shell > Barra filtri (chip, perimetro, ultimo dato sincronizzato) > Breadcrumb > Titolo > KPI x4 > Card avanzamento (barre) + Card famiglie (treemap) > Card SIGC domande (imbuto) + Card SIGC importi (cascata) > Pannello filtri > Stati
- /finanziario/interventi/:codice: Shell > Barra filtri > Breadcrumb > Testata (codice, descrizione, perimetro, contributo ambientale, azioni) > KPI x4 > Schede: Sintesi (gauge, cascata) | Domande (barre impilate, linea) | SIGC (imbuto, cascata) | Tutte le voci (tabella con i motivi) > Stati

## Grafici del flusso

| pagina | grafico | tipo | dati (transazione) | clic | valori assenti |
|---|---|---|---|---|---|
| /finanziario | Avanzamento per intervento | barre | TX-0002 | dettaglio dell'intervento | interventi senza dotazione fuori dal grafico, dichiarati |
| /finanziario | Dotazione per famiglia di intervento | treemap | TX-0002 | famiglia: entra; intervento: dettaglio | dotazione assente: intervento omesso e dichiarato |
| /finanziario | Domande SIGC | imbuto | TX-0012 | pagina SIGC | nessuno (conteggi) |
| /finanziario | Importi SIGC | cascata | TX-0013 | nessuno | importo assente: passo omesso e dichiarato |
| /finanziario/interventi/:codice | Pagato sulla dotazione | gauge | TX-0002, TX-0011 | nessuno | non disegnato se manca un termine |
| /finanziario/interventi/:codice | Dalla dotazione al residuo | cascata | TX-0011 | nessuno | impegnato: fonte non attiva, dichiarato |
| /finanziario/interventi/:codice | Domande per anno | barre | TX-0008 | nessuno | riga senza anno: barra a parte |
| /finanziario/interventi/:codice | Importi ammessi e decretati | linea | TX-0010 | nessuno | stanziato: fonte non attiva, dichiarato |
| /finanziario/interventi/:codice | Domande e importi SIGC | imbuto, cascata | TX-0012, TX-0013 | nessuno | come nella panoramica |

Il pannello dei filtri (TX-0001) si apre da ogni pagina; la panoramica lo ospita nel wireframe. Il dettaglio usa le stesse transazioni dei report filtrate sull'intervento: nessuna transazione nuova. Raggruppamento per obiettivo in attesa della gerarchia dal backend (OP-FE-07).

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

- OP-FE-04: risolto (ultimo dato sincronizzato nella barra dei filtri).
- OP-FE-05: fonti diverse per il pagato SIGC, dichiarate nelle card.
- OP-FE-06: dopo un 401 il BFF riporta su / (pagina e filtri si perdono).
- OP-FE-07: gerarchia intervento-OS-OG-OP assente dai DTO (raggruppamento per famiglia nel frattempo).
