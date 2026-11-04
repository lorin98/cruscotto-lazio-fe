# Flusso riepilogo - wireframe v2 (feature finanziario)

> Doc del gate umano PER FLUSSO. L'approvazione e' content-addressed sull'INTERA dir
> `wireframes/riepilogo/` (hash da `wireframe-hash.sh`): modificare un file qui invalida
> l'approvazione del flusso (e solo di questo flusso).
>
> Aggiornamento del 21/10/2026 (decisione F2 dell'utente, review sul delta FE X3, X3-b e V6): la pagina si apre sulla
> vista Grafico, con l'interruttore di pagina Grafico | Tabella e il sottotitolo della vista iniziale.

## Route del flusso

| route | kind | pattern | grant (verbatim dal catalogo) |
|---|---|---|---|
| /finanziario/riepilogo | report | report v2 (KPI, grafici, tabella interattiva) | csr.tx-0011.read |

## Component tree (per pagina)

Vocabolario del kit UI v2 (ADR 0027 di green-fe), resa approvata nel prototipo `prototipo/finanziario/`.

- /finanziario/riepilogo: Shell > Barra filtri > Breadcrumb > Titolo > Card riepilogo per intervento (interruttore di pagina Grafico | Tabella; vista iniziale Grafico: card del grafico a barre, col suo interruttore Grafico | Tabella equivalente e Scarica; vista Tabella: cerca, colonne, esporta CSV, ordinamento, totali, riga AT, paginazione) > Drawer di anteprima > Stati

## Grafici del flusso

| pagina | grafico | tipo | dati (transazione) | clic | valori assenti |
|---|---|---|---|---|---|
| /finanziario/riepilogo | Dotazione e pagamenti per intervento | barre | TX-0011 | dettaglio dell'intervento | valore assente: barra omessa, dichiarata |

La pagina si apre sulla vista Grafico, come ogni card (richiesta dell'utente del 19/10/2026). L'interruttore di pagina
"Vista del riepilogo", Grafico | Tabella nello stesso ordine dell'interruttore delle card, sceglie fra il grafico e la
tabella del riepilogo; la scelta resta tornando dal dettaglio dell'intervento o dall'elenco operativo (cronologia del
browser). L'interruttore della card del grafico mostra invece la sua tabella equivalente, con i soli valori del grafico
(intervento, dotazione, pagamenti netti): e' il canale accessibile del grafico. Totali, dotazione dell'Assistenza tecnica
(AT001, intero programma: non dipende dai filtri) e link all'elenco operativo stanno nella tabella del riepilogo (vista
Tabella), come nel flusso approvato il 13/10/2026.

Nella vista Tabella la riga apre il drawer di anteprima; dal drawer si passa al dettaglio dell'intervento. Export CSV con gli stessi filtri e X-Requested-With.

## Link del flusso (drill-down dichiarati)

Drill-down verso l'elenco operativo (decisione D-2 dell'utente del 12/10/2026) dalle celle della tabella (vista Tabella) e dal drawer.

| pagina | link (id) | innesco | arrivo (feature: route) | parametri di path | query |
|---|---|---|---|---|---|
| /finanziario/riepilogo | elenco-presentate-riga | cella Domande presentate di una riga, o del drawer | elenco-operativo: /elenco-operativo/domande | - | presentata=true, intervento della riga |
| /finanziario/riepilogo | elenco-pagamenti-riga | cella Pagamenti lordi di una riga, o del drawer (R08, prima sulla cella dei pagamenti netti) | elenco-operativo: /elenco-operativo/pagamenti | - | esito=PAGATA, intervento della riga |

La riga dell'Assistenza tecnica non ha link (AT001 non e' selezionabile nell'elenco). Il link dei pagamenti sta sulla cella
Pagamenti lordi (R08): l'elenco dei pagamenti mostra il pagato lordo delle righe PAGATA, lo stesso valore della colonna;
le rettifiche hanno la loro colonna e il dettaglio nell'anteprima. Prima della colonna dei lordi il link stava sui pagamenti netti
con l'etichetta "righe di pagamento, importi lordi" (decisione dell'utente del 13/10/2026).
Dotazione, risorse FEASR, stanziato, impegnato e residui non sono collegati (non sono insiemi di domande).

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
- RESIDUO umano: dimensione dei bersagli (WCAG 2.5.8) dei link "Apri nell'elenco" nelle celle (minimo 24 px nel kit) e loro allineamento a destra nelle celle numeriche.

## Punti aperti che toccano questo flusso

- OP-FE-06 (risolto in parte): dopo il login si torna al riepilogo con i filtri (/auth/login?ritorno=, D-11 Rev. 9 del
  backend); ricerca, ordine, pagina e vista della tabella, salvate nella cronologia del browser, ripartono da capo.
- OP-FE-09: profili misti (P4 con un profilo regionale): il riepilogo e' ADA, l'elenco aperto dai link della riga e' regionale.

## Revisioni del 31/10/2026 (MIN-20261031, scelte dell'utente del 01/11/2026)

### Natura delle card col filtro SIGC

| pagina | elementi | natura |
|---|---|---|
| /finanziario/riepilogo | tabella, grafico e anteprima per intervento | misto (per intervento) |
| /finanziario/riepilogo | riga Assistenza tecnica | il filtro non si applica |

### Modifiche del flusso

- R08: colonne Pagamenti lordi, Rettifiche, Con rettifiche (indicatore con il dettaglio nell'anteprima) accanto ai
  pagamenti netti; export CSV con le stesse colonne. Il link ai pagamenti dell'elenco passa sulla cella Pagamenti lordi
  (stesso importo dell'elenco), senza piu' l'etichetta "importi lordi" sui netti.
- Impegnato con la colonna "di cui stimato" e la nota di lettura (stimaImpegni).
- R12: intestazione ferma, 25 righe per pagina, prima colonna ferma.

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

## Revisioni del 04/11/2026 (secondo feedback di Leonardo/Deloitte, decisioni dell'utente)

- Tutto RF011 in questa pagina, senza interruttore di pagina: prima la "Tabella di riepilogo per intervento (RF011)" con i nove campi nell'ordine del requisito (dotazione, quota FEASR, stanziato, domande presentate, impegnato cofinanziato FEASR, impegnato cofinanziato FEASR e non, pagamenti al netto delle rettifiche, dotazione residua sugli impegni e sui pagamenti); di cui stimato, pagamenti lordi, rettifiche e con rettifiche nel selettore Colonne, nascoste all'apertura (l'anteprima e il CSV le hanno tutte).
- Avviso sempre visibile sopra la tabella quando nella selezione i due impegnati differiscono (cofinanziato FEASR riportato alla dotazione): elenca intervento, cofinanziato FEASR e FEASR e non. Regola del tetto invariata (tutti gli interventi). Nel wireframe e' un `alert` con `role="note"` (vocabolario dei template); nel codice il kit lo rende come avviso di attenzione (giallo) con la prima frase in grassetto.
- Sotto la tabella il grafico "Dotazione, impegnato e pagamenti per intervento" (tre barre); l'asse parte dal valore piu' basso vero.
- "Si': n rettifiche" al posto di "Si': n righe"; il link ai pagamenti dice "elenco dei pagamenti".
