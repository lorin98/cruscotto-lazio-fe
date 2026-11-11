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
| /finanziario/domande | Domande per anno di raccolta | barre | TX-0008 | filtra la tabella sull'anno; nella tabella equivalente "Apri nell'elenco" su ogni cella = link:elenco-anno-annualita (elenco-operativo: /elenco-operativo/domande) | riga senza anno: barra a parte |
| /finanziario/domande | Importi ammessi e decretati per anno | linea | TX-0010 | nessuno; nella tabella equivalente "Apri nell'elenco" su ogni riga = link:elenco-anno (elenco-operativo: /elenco-operativo/domande) | stanziato: fonte non attiva |

Il decretato viene dagli elenchi di liquidazione, come dice la fonte della card (OP-FE-05).

## Link del flusso (drill-down dichiarati)

Drill-down verso l'elenco operativo (decisione D-2 dell'utente del 12/10/2026): dal livello minimo di un report si apre
l'elenco gia' filtrato, con i filtri correnti del finanziario (intervento, os, og, op, azione), e il numero di domande
coincide con quello del report (D-02 e SC-EO_DRILLDOWN dell'elenco operativo: presentata=true&anno=2025&annualita=PRIMA
riproduce la prima annualita' del 2025 di TX-0008).

Limite noto (OP-FE-09): per un utente P4 che ha anche un profilo regionale (P3 di un'altra area, P6 o P7) il report e'
limitato alla sua ADA, mentre l'elenco aperto dal link e' regionale: li' il numero non coincide. Da chiedere ad ARSIAL se
questi profili misti esistono; se si', un parametro del backend restringera' l'elenco al perimetro del report.

| pagina | link (id) | innesco | arrivo (feature: route) | parametri di path | query |
|---|---|---|---|---|---|
| /finanziario/domande | elenco-presentate-domande | azione "Apri nell'elenco" del KPI Domande presentate | elenco-operativo: /elenco-operativo/domande | - | presentata=true + filtri correnti |
| /finanziario/domande | elenco-prima-annualita | azione "Apri nell'elenco" del KPI Di cui prima annualita' | elenco-operativo: /elenco-operativo/domande | - | presentata=true, annualita=PRIMA + filtri correnti |
| /finanziario/domande | elenco-anno-annualita | azione "Apri nell'elenco" su una cella (anno per annualita') della tabella equivalente di Domande per anno di raccolta | elenco-operativo: /elenco-operativo/domande | - | presentata=true, anno (SENZA per la riga senza anno), annualita della colonna (PRIMA, ALTRE, NON_CLASSIFICATE) + filtri correnti |
| /finanziario/domande | elenco-anno | azione "Apri nell'elenco" su una riga (anno) della tabella equivalente di Importi ammessi e decretati per anno | elenco-operativo: /elenco-operativo/domande | - | presentata=true, anno + filtri correnti |

Il clic sulle barre resta quello approvato (filtra la tabella in pagina): l'apertura nell'elenco e' un'azione esplicita
"Apri nell'elenco" sulle celle delle tabelle equivalenti e sui due KPI di conteggio (decisione dell'utente del 13/10/2026).
L'elenco riporta richiesto, ammesso e pagato delle domande dell'anno; stanziato e decretato non sono campi dell'elenco. I KPI
Importo ammesso e Importo stanziato non hanno l'azione (il secondo ha fonte non attiva).

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

- OP-FE-05 (riscritto il 13/10/2026): pagate, da pagare e importo pagato SIGC hanno la stessa fonte, gli importi della
  domanda (flusso ASR2-20); i pagamenti totali di TX-0002 sono lordi (elenchi di liquidazione), il pagato netto di TX-0011
  ne toglie le rettifiche; il decretato viene dagli elenchi di liquidazione. Resta da confermare con ARSIAL quale fonte fa
  fede per il pagato a regime.
- OP-FE-09: profili misti (P4 con un profilo regionale): il report e' ADA, l'elenco aperto dal link e' regionale.

## Revisioni del 31/10/2026 (MIN-20261031, scelte dell'utente del 01/11/2026)

### Natura delle card col filtro SIGC

| pagina | elementi | natura |
|---|---|---|
| /finanziario/domande | KPI, Domande per anno di raccolta, Importi per anno | misto |

### Modifiche del flusso

- Stanziato dai bandi (quadro sinottico); per anno "non valorizzato" col motivo finche' i bandi non danno l'importo
  annuo (P2).
- Revisione dell'11/11/2026 (note di Leonardo del 10/11/2026): la vista Tabella di Importi per anno ha le intestazioni della
  tabella di dettaglio (Anno di raccolta, Importo stanziato, Importo ammesso, Importo decretato (elenchi di liquidazione),
  Domande senza importo ammesso, Elenco operativo); le due sezioni stanno una sotto l'altra a tutta larghezza e le tabelle
  della pagina sono compatte (intestazioni su piu' righe, meno spazio fra le colonne): nessuno scorrimento orizzontale da
  1366 px in su (misurato: con le due sezioni affiancate le tabelle degli importi scorrevano anche compatte).

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
