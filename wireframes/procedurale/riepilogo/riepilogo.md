# Flusso riepilogo - wireframe v2 (feature procedurale)

> Doc del gate umano PER FLUSSO. L'approvazione e' content-addressed sull'INTERA dir
> `wireframes/procedurale/riepilogo/` (hash da `wireframe-hash.sh`): modificare un file qui invalida
> l'approvazione del flusso (e solo di questo flusso).

## Route del flusso

| route | kind | pattern | grant (verbatim dal catalogo) |
|---|---|---|---|
| /procedurale/riepilogo | report | report v2 (interruttore di pagina Grafico / Tabella, card grafico, tabella interattiva, export CSV e XLSX, drawer) | csr.tx-0024.read, csr.tx-0025.read, csr.tx-0029.read |

Stessa resa del riepilogo del finanziario (riapprovato il 21/10/2026, vista iniziale Grafico).

Cambiato il 22/10/2026 (giro G3 del backend): pill "Dati al" da TX-0024; CSV e XLSX con un pulsante per formato
(GET /api/procedurale/riepilogo/{formato}) al posto di "Esporta CSV"; PNG, CSV, XLSX sulla card del grafico.

## Component tree (per pagina)

- /procedurale/riepilogo: Shell > Barra filtri (con la pill "Dati al") > Breadcrumb > Titolo > Card riepilogo per
  intervento (interruttore di pagina "Vista del riepilogo" Grafico | Tabella; vista Grafico: card del grafico a barre con il
  suo interruttore Grafico | Tabella equivalente e i pulsanti PNG, CSV, XLSX; vista Tabella: cerca, Colonne per sezione, CSV,
  XLSX, ordinamento, intestazioni di gruppo, totali dal backend, paginazione) > Drawer di anteprima > Stati

## Grafici del flusso

| pagina | grafico | tipo | dati (transazione) | clic | valori assenti |
|---|---|---|---|---|---|
| /procedurale/riepilogo | Domande per intervento | barre raggruppate (sostegno, pagamento CSR-DP, ammesse), zoom oltre 12 | TX-0029 (righe) | link:dettaglio-intervento-riepilogo (/procedurale/interventi/:codice) | nessuno per i conteggi; In compilazione senza fonte non entra nei totali (D-04) |

La tabella del riepilogo (vista Tabella) ha quattro sezioni di colonne: Domande ammesse (le misure di TX-0026, con perimetro e
attivato), Area programmazione (voci di RF025, stati osservati, senza stato, totale), Stati della domanda di sostegno (undici
voci, altri stati, totale, di cui non rilasciate), Stati della domanda di pagamento (cinque voci, altri stati, totale, di cui
non rilasciate). Predefinite: i totali di ogni sezione; Colonne aggiunge le voci. Valori assenti in testo col motivo.

## Link del flusso (drill-down dichiarati)

| pagina | link (id) | innesco | arrivo (feature: route) | parametri di path | query |
|---|---|---|---|---|---|
| /procedurale/riepilogo | elenco-ammesse-riepilogo | Apri nell'elenco nella cella Domande ammesse (vista Tabella) o nel drawer | elenco-operativo: /elenco-operativo/domande | - | voceProgrammazione=AMMESSA, intervento della riga |
| /procedurale/riepilogo | elenco-con-atto-riepilogo | Apri nell'elenco nella cella Con atto (fonte attiva) o nel drawer | elenco-operativo: /elenco-operativo/domande | - | concessione=true, tipo=SOSTEGNO, voceProgrammazione = filtro stato, intervento della riga |
| /procedurale/riepilogo | dettaglio-intervento-riepilogo | barra del grafico o Apri il dettaglio dal drawer | procedurale: /procedurale/interventi/:codice | codice | stato |

Le celle degli stati non hanno link (sarebbero decine per riga): il drill-down per stato sta nelle pagine degli stati e nel
dettaglio dell'intervento. Importi non collegati.

## Filtri nell'URL (url_params)

| pagina | parametro | fonte (operationId.parametro) | multiplo | obbligatorio |
|---|---|---|---|---|
| /procedurale/riepilogo | intervento, os, og, op, stato | TX-0029.intervento, .os, .og, .op, .stato | si' | no |

## Download (come nel finanziario)

CSV e XLSX: GET /api/procedurale/riepilogo/{formato} (senza operationId, come gli export del finanziario e dell'elenco; D-10
del backend) con gli stessi filtri e l'header X-Requested-With. Per csv l'indirizzo e' lo stesso dello storico
GET /api/procedurale/riepilogo/csv, che resta nel contratto (anche in quello di nfr-conformance) con lo stesso file. CSV
UTF-8 con BOM e punto e virgola, XLSX un foglio con i numeri come numeri; intestazione con fonte, filtri, perimetro, data di
estrazione, profili, ultimo dato sincronizzato per flusso e uso interno; tutte le sezioni e le voci, per sezione la colonna
"di cui non rilasciate"; registrato in AUDIT_ESPORTAZIONE col formato. Oltre 5.000 righe o 50.000 celle: 400
DATO_NON_VALIDO, il messaggio invita a restringere i filtri. La card del grafico offre anche il PNG (nel browser, con
l'intestazione di NFR-50, non registrato in audit) e, come dati, lo stesso file del riepilogo.

## Stati resi (obbligatori)

- vuoto: "Nessun intervento per i filtri scelti" con "Modifica i filtri"
- caricamento: scheletro della card, `role="status"` + `aria-live="polite"`
- errore: `role="alert"`, discriminato sul problem-type (400 filtro non valido o export oltre il limite; 403; 503 con
  Retry-After, anche ESPORTAZIONE_NON_REGISTRATA per l'export; 429; 401/419)

## Note WCAG 2.2 (residuo manuale DICHIARATO)

- Meccanizzato a valle (step7/step8): tab-order, focus dopo il cambio di route, focus-trap del drawer, tabella equivalente
  del grafico, axe (deferito a step8).
- RESIDUO umano: tabella larga a sezioni a 320 px (scorrimento della sola tabella, WCAG 1.4.10); intestazioni di gruppo
  (scope colgroup) lette correttamente dai lettori di schermo.
- RESIDUO umano: dimensione dei bersagli dei link nelle celle (WCAG 2.5.8); contrasto della resa finale.
- Download: un pulsante per formato con la sigla visibile e il nome accessibile completo (WCAG 2.5.3), aria-disabled
  durante la preparazione col focus sul pulsante (WCAG 2.4.3), esito in role=status, errore in role=alert col motivo.

## Punti aperti che toccano questo flusso

- OP-PR-06: profili misti: il riepilogo e' ADA, l'elenco aperto dai link e' regionale.
- OP-PR-08: regole del drill-down.
- Chiusi col giro G3 (22/10/2026): OP-PR-01 (pill "Dati al" da TX-0024), OP-PR-05 (riepilogo anche in XLSX; sottofasi e
  Unit Amount hanno ora i loro export, nelle loro pagine).

## Revisioni del 31/10/2026 (BOZZA da approvare, MIN-20261031)

### Natura delle card col filtro SIGC

| pagina | elementi | natura |
|---|---|---|
| /procedurale/riepilogo | grafico e tabella per intervento | misto (per intervento: con SIGC restano gli interventi SIGC, con le sole colonne dell'area valorizzate) |

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
