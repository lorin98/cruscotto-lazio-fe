# Flusso panoramica - wireframe v2 (feature finanziario)

> Doc del gate umano PER FLUSSO. L'approvazione e' content-addressed sull'INTERA dir
> `wireframes/panoramica/` (hash da `wireframe-hash.sh`): modificare un file qui invalida
> l'approvazione del flusso (e solo di questo flusso).

## Route del flusso

| route | kind | pattern | grant (verbatim dal catalogo) |
|---|---|---|---|
| /finanziario | cruscotto | cruscotto (KPI + grafici) | csr.tx-0001.read, csr.tx-0002.read, csr.tx-0009.read, csr.tx-0012.read, csr.tx-0013.read |
| /finanziario/interventi/:codice | dettaglio | dettaglio (testata + KPI + schede) | csr.tx-0011.read, csr.tx-0008.read, csr.tx-0010.read, csr.tx-0012.read, csr.tx-0013.read |

## Component tree (per pagina)

Vocabolario del kit UI v2 (ADR 0027 di green-fe), resa approvata nel prototipo `prototipo/finanziario/`.

- /finanziario: Shell > Barra filtri (controllo SIGC, chip, perimetro, ultimo dato sincronizzato) > Breadcrumb > Titolo > KPI x6 (3 x 2) > Card avanzamento (barre) + Card famiglie (treemap) > Card SIGC domande (barre orizzontali) + Card SIGC importi (forma scelta per R13) > Pannello filtri > Stati
- /finanziario/interventi/:codice: Shell > Barra filtri (senza controllo SIGC: tipo dell'intervento) > Breadcrumb > Testata (codice, descrizione, perimetro, tipo SIGC / NO SIGC, azioni) > KPI x4 > Schede: Sintesi (gauge, cascata, rettifiche) | Domande (barre impilate, linea) | SIGC (barre orizzontali, importi nella forma di R13) | Tutte le voci (tabella con i motivi) > Stati

## Grafici del flusso

| pagina | grafico | tipo | dati (transazione) | clic | valori assenti |
|---|---|---|---|---|---|
| /finanziario | Avanzamento per intervento | barre | TX-0002 | dettaglio dell'intervento | interventi senza dotazione fuori dal grafico, dichiarati |
| /finanziario | Dotazione per famiglia di intervento | treemap | TX-0002 | famiglia: entra; intervento: dettaglio | dotazione assente: intervento omesso e dichiarato |
| /finanziario | Domande SIGC | barre orizzontali (presentate, pagate, da pagare, senza importi: pagate e da pagare si sovrappongono) | TX-0012 | pagina SIGC | nessuno (conteggi) |
| /finanziario | Importi SIGC | forma scelta per R13 (A barre affiancate, B barre impilate, C ponte) | TX-0013 | nessuno | importo assente: passo omesso e dichiarato |
| /finanziario/interventi/:codice | Avanzamento rispetto ai pagamenti effettuati | gauge | TX-0011 (pagamenti al netto delle rettifiche) | nessuno | non disegnato se manca un termine |
| /finanziario/interventi/:codice | Dalla dotazione al residuo | cascata | TX-0011 | nessuno | rettifiche non caricate: netto e residuo non disegnati, fonte non attiva dichiarata |
| /finanziario/interventi/:codice | Rettifiche dell'intervento | tabella | TX-0011 (rettifiche[]) | nessuno | nessuna rettifica: "Nessuna rettifica" |
| /finanziario/interventi/:codice | Domande per anno | barre | TX-0008 | link:elenco-anno-intervento (elenco-operativo: /elenco-operativo/domande) | riga senza anno: barra a parte |
| /finanziario/interventi/:codice | Importi ammessi e decretati | linea | TX-0010 | nessuno | stanziato dai bandi: non valorizzato negli anni senza bandi, dichiarato |
| /finanziario/interventi/:codice | Domande e importi SIGC | barre orizzontali, cascata | TX-0012, TX-0013 | link:elenco-sigc-intervento (elenco-operativo: /elenco-operativo/domande) | come nella panoramica |

Il pannello dei filtri (TX-0001) si apre da ogni pagina; la panoramica lo ospita nel wireframe. Il dettaglio usa le stesse transazioni dei report filtrate sull'intervento: nessuna transazione nuova. Raggruppamento per obiettivo in attesa della gerarchia dal backend (OP-FE-07).

## Link del flusso (drill-down dichiarati)

Drill-down verso l'elenco operativo (decisione D-2 dell'utente del 12/10/2026): dal livello minimo di un report si apre
l'elenco gia' filtrato, con i filtri correnti del finanziario (intervento, os, og, op, azione), e il numero di domande
coincide con quello del report (D-02 dell'elenco operativo). Solo dove l'insieme di domande del report si riproduce con i
parametri dell'elenco.

Limite noto (OP-FE-09): per un utente P4 che ha anche un profilo regionale (P3 di un'altra area, P6 o P7) il report e'
limitato alla sua ADA, mentre l'elenco aperto dal link e' regionale: li' il numero non coincide. Da chiedere ad ARSIAL se
questi profili misti esistono; se si', un parametro del backend restringera' l'elenco al perimetro del report.

| pagina | link (id) | innesco | arrivo (feature: route) | parametri di path | query |
|---|---|---|---|---|---|
| /finanziario | elenco-presentate-panoramica | KPI Domande presentate | elenco-operativo: /elenco-operativo/domande | - | presentata=true + filtri correnti |
| /finanziario/interventi/:codice | elenco-presentate-intervento | KPI Domande presentate | elenco-operativo: /elenco-operativo/domande | - | presentata=true, intervento=:codice + filtri correnti |
| /finanziario/interventi/:codice | elenco-anno-intervento | barra di Domande per anno | elenco-operativo: /elenco-operativo/domande | - | presentata=true, intervento=:codice, anno (SENZA per la barra senza anno), annualita del segmento (PRIMA, ALTRE, NON_CLASSIFICATE) + filtri correnti |
| /finanziario/interventi/:codice | elenco-sigc-intervento | passo di Domande SIGC o di Importi SIGC | elenco-operativo: /elenco-operativo/domande | - | sigc=true, intervento=:codice e, per pagate, da pagare e senza importi, pagamento=PAGATA, DA_PAGARE, SENZA_IMPORTI + filtri correnti |

Non collegati, perche' l'insieme non e' di domande: Avanzamento per intervento e Dotazione per famiglia (TX-0002, dotazione e
pagamenti per intervento), Avanzamento rispetto ai pagamenti effettuati e Dalla dotazione al residuo (TX-0011), Importi ammessi e decretati
(stanziato e decretato non sono campi dell'elenco). Sulla panoramica le card SIGC restano il passaggio alla pagina SIGC, da cui
parte il drill-down.

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

- OP-FE-04: risolto (ultimo dato sincronizzato nella barra dei filtri).
- OP-FE-05 (riscritto il 13/10/2026): pagate, da pagare e importo pagato SIGC hanno la stessa fonte, gli importi della
  domanda (flusso ASR2-20); i pagamenti totali di TX-0002 sono lordi (elenchi di liquidazione), il pagato netto di TX-0011
  ne toglie le rettifiche; il decretato viene dagli elenchi di liquidazione. Resta da confermare con ARSIAL quale fonte fa
  fede per il pagato a regime.
- OP-FE-06 (risolto in parte): dopo il login si torna alla pagina con i filtri (/auth/login?ritorno=, D-11 Rev. 9 del
  backend); si perdono solo le scelte salvate nella cronologia del browser (anno della tabella delle domande, vista
  delle card del dettaglio).
- OP-FE-09: profili misti (P4 con un profilo regionale): il report e' ADA, l'elenco aperto dal link e' regionale.
- OP-FE-07: gerarchia intervento-OS-OG-OP assente dai DTO (raggruppamento per famiglia nel frattempo).

## Revisioni del 31/10/2026 (BOZZA da approvare, MIN-20261031)

### Natura delle card col filtro SIGC

| pagina | elementi | natura |
|---|---|---|
| /finanziario | KPI dotazione, impegnato, pagato e loro percentuali, Domande presentate | misto |
| /finanziario | Avanzamento per intervento, Dotazione per famiglia | misto (per intervento) |
| /finanziario | Domande SIGC, Importi SIGC | solo SIGC: non pertinenti con NO SIGC |
| /finanziario/interventi/:codice | tutta la pagina | nessun filtro (F5): pill col tipo dell'intervento |

### Modifiche del flusso

- R03: sei box nella panoramica (impegnato e sua percentuale dalla stessa lettura di TX-0002, con "di cui stimato"), griglia
  3 x 2 a coppie per colonna.
- R13: Importi SIGC in una delle tre forme proposte (A barre affiancate con le differenze, B due barre impilate, consigliata,
  C ponte con connettori); la scelta vale per panoramica, pagina SIGC e scheda SIGC del dettaglio.
- R16: via "(flusso ASR2-20)" dalle didascalie delle card SIGC.
- Dettaglio: testata col tipo dell'intervento al posto del contributo ambientale (R14, F5), niente lettura di TX-0002; R15
  "Avanzamento rispetto ai pagamenti effettuati"; rettifiche nella Sintesi e in Tutte le voci (R08); impegnato con la parte
  stimata; stanziato dai bandi.

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
