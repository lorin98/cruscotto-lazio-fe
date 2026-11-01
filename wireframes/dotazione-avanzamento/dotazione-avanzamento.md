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

- /finanziario/dotazione: Shell > Barra filtri (controllo SIGC) > Breadcrumb > Titolo > Card dotazione e pagamenti (barre) + Card quota FEASR (ciambella con importi e totale) > Stati
- /finanziario/avanzamento: Shell > Barra filtri (controllo SIGC) > Breadcrumb > Titolo > KPI x4 (stanziato dai bandi, impegnato con la parte stimata, pagato lordo, dotazione residua sui pagamenti) > Card dove va la dotazione (sankey) + Card avanzamento rispetto ai pagamenti effettuati (gauge) > Nota di lettura dell'impegnato > Card RF004-RF007 (quattro ciambelle) > Card residuo sui pagamenti per intervento con le rettifiche (tabella, pannello laterale del dettaglio) > Stati

## Grafici del flusso

| pagina | grafico | tipo | dati (transazione) | clic | valori assenti |
|---|---|---|---|---|---|
| /finanziario/dotazione | Dotazione e pagamenti per intervento | barre | TX-0002 | dettaglio dell'intervento | perimetro ADA: dotazione regionale non affiancata |
| /finanziario/dotazione | Quota FEASR e non FEASR | ciambella (importo e percentuale nelle etichette, totale al centro) | TX-0003 | nessuno | 'grafico non disponibile' con il motivo |
| /finanziario/avanzamento | Dove va la dotazione | sankey | TX-0005, TX-0006, TX-0007 | nessuno | ramo con fonte assente non disegnato, dichiarato |
| /finanziario/avanzamento | Avanzamento rispetto ai pagamenti effettuati | gauge | TX-0007 (pagamenti al netto delle rettifiche) | nessuno | non disegnato se manca un termine |
| /finanziario/avanzamento | Stanziato, impegnato, pagato e residui | 4 ciambelle (importo e percentuale, totale al centro) | TX-0004..TX-0007 | nessuno | ciambella con un termine assente non disegnata, motivo |
| /finanziario/avanzamento | Dotazione residua sui pagamenti per intervento | tabella | TX-0007 (interventi[], fonteRettifiche) | "Si': n righe" apre il dettaglio delle rettifiche | rettifiche non caricate: fonte non attiva |

Stanziato (dai bandi), impegnato (dagli import, con la parte stimata) e rettifiche hanno ora una fonte; se manca, le card lo dicono con il motivo, mai uno zero. Quote Stato e Regione e vincolo LEADER non esistono piu' (R21, X3).

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

## Revisioni del 31/10/2026 (BOZZA da approvare, MIN-20261031)

### Natura delle card col filtro SIGC

| pagina | elementi | natura |
|---|---|---|
| /finanziario/dotazione | Dotazione e pagamenti per intervento, Quota FEASR e non FEASR, tabella della spesa pubblica | misto (per intervento) |
| /finanziario/avanzamento | KPI, Dove va la dotazione, Avanzamento rispetto ai pagamenti effettuati, ciambelle RF004-RF007 | misto |

### Modifiche del flusso

- R14, R21, X3: via la card del contributo ambientale e le colonne contributo, quota Stato, quota Regione e vincolo LEADER.
- R05, R06: ciambelle con importo e percentuale nelle etichette e il totale al centro (quota FEASR, RF004-RF007).
- R15: "Pagato netto sulla dotazione" diventa "Avanzamento rispetto ai pagamenti effettuati".
- R08: residuo sui pagamenti per intervento con pagato lordo, rettifiche, netto, indicatore e dettaglio; documento e data
  delle rettifiche nella card.
- Stanziato dai bandi; impegnato con la parte stimata e la nota di lettura.

### Regole comuni (kit, tutte le aree)

- **Filtro SIGC (R01, F1-F5)**: controllo "Tutti | SIGC | NO SIGC" sempre visibile nella barra dei filtri (parametro `sigc`,
  assente = tutti), conservato fra le pagine e fra le aree; filtra gli **interventi** per classificazione della
  programmazione (gli interventi non classificati restano fuori da SIGC e da NO SIGC). Ogni card dichiara la sua natura:
  **misto** (si ricalcola), **solo SIGC** / **solo NO SIGC** (col valore opposto: **non pertinente**), **il filtro non si
  applica** (dato non scomponibile: visibile normale).
- **Card non pertinente**: titolo e badge "Non pertinente al filtro NO SIGC" (o SIGC) con il motivo leggibile ("Riguarda solo
  le domande SIGC"); corpo in grigio, non interattivo, senza interruttore Grafico/Tabella e senza Scarica; il dato e' quello
  **senza** filtro (il backend col valore opposto risponde zero righe). La tabella equivalente resta leggibile dagli
  strumenti assistivi.
- **Assi (R02)**: nessuna etichetta saltata; barre orizzontali alte quanto serve al numero di categorie; zoom solo oltre una
  soglia alta; verifica a 1680, 1100 e 390 px.
- **Sinottici (R09)**: valore su una riga (carattere adattivo, formato compatto con il valore pieno accessibile), unita' non
  separabile dal numero.
- **Barra dei filtri (R11)**: attaccata al bordo superiore scorrendo (e il menu laterale con lei).
- **Tabelle medio-grandi (R12)**: intestazione ferma scorrendo, riquadro alto quanto la finestra, 25 righe per pagina,
  prima colonna ferma nelle tabelle larghe.
- **Ciambelle (R05, R06)**: importo e percentuale nelle etichette, totale al centro.
