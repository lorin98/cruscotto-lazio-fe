# Flusso sigc - wireframe v2 (feature finanziario)

> Doc del gate umano PER FLUSSO. L'approvazione e' content-addressed sull'INTERA dir
> `wireframes/sigc/` (hash da `wireframe-hash.sh`): modificare un file qui invalida
> l'approvazione del flusso (e solo di questo flusso).

Rivisto il 30/10/2026 per il riallineamento degli ambiti (decisioni A-1, A-4 e A-5 dell'utente del 29/10/2026,
MIN-20261029; pack 1.4.0, catalogo rev. 4): la verifica SMP SIGC (TX-0015, RF015) e' un requisito dell'ambito
istituzionale e la rende la feature istituzionale. Escono dal flusso la pagina `verifica-smp.html`, la route
`/finanziario/sigc/verifica-smp` (nessun alias: A-4) e la voce "Verifica SMP" del menu delle due pagine rimaste. Nessun
collegamento da queste pagine verso la verifica dell'istituzionale: ci si arriva dal menu Istituzionale. Il resto delle
due pagine non cambia.

## Route del flusso

| route | kind | pattern | grant (verbatim dal catalogo) |
|---|---|---|---|
| /finanziario/sigc | report | report v2 (KPI, grafici, tabella interattiva) | csr.tx-0012.read, csr.tx-0013.read |
| /finanziario/sigc/riserva | report | report v2 (KPI, grafici, tabella interattiva) | csr.tx-0014.read |

## Component tree (per pagina)

Vocabolario del kit UI v2 (ADR 0027 di green-fe), resa approvata nel prototipo `prototipo/finanziario/`.

- /finanziario/sigc: Shell > Barra filtri > Breadcrumb > Titolo > Card domande SIGC (barre orizzontali) + Card importi SIGC (cascata) > Stati
- /finanziario/sigc/riserva: Shell (senza barra filtri: dato regionale) > Breadcrumb > Titolo > Selettore anno > Blocco del montante con riserva 5% e residuo 2% e loro natura (forma scelta per R17) > KPI x4 dei movimenti > Card utilizzo progressivo (forma scelta per R18, testo di lettura) > Stati

## Grafici del flusso

| pagina | grafico | tipo | dati (transazione) | clic | valori assenti |
|---|---|---|---|---|---|
| /finanziario/sigc | Domande SIGC | barre orizzontali (pagate e da pagare si sovrappongono) | TX-0012 | link:elenco-sigc (elenco-operativo: /elenco-operativo/domande) | nessuno (conteggi) |
| /finanziario/sigc | Importi SIGC | cascata | TX-0013 | link:elenco-sigc-importi (elenco-operativo: /elenco-operativo/domande) | importo assente: passo omesso |
| /finanziario/sigc/riserva | Montante e riserve 5% e 2% | riquadri (A) o tabella del calcolo (B) | TX-0014 | nessuno | natura PREVISIONE / CONSUNTIVO sempre dichiarata |
| /finanziario/sigc/riserva | Utilizzo progressivo cumulato | linea a gradini con fasi annotate (A) o barra delle fasi con barra dell'utilizzo (B) | TX-0014 | nessuno | punti assenti omessi e dichiarati |

La riserva e' un dato regionale: i filtri non si applicano (OP-FE-03).

## Link del flusso (drill-down dichiarati)

Drill-down verso l'elenco operativo (decisione D-2 dell'utente del 12/10/2026): dal livello minimo di un report si apre
l'elenco gia' filtrato, con i filtri correnti del finanziario (intervento, os, og, op, azione), e il numero di domande
coincide con quello del report (D-02 e SC-EO_DRILLDOWN dell'elenco operativo: sigc=true&pagamento=PAGATA riproduce le pagate
di TX-0012).

Limite noto (OP-FE-09): per un utente P4 che ha anche un profilo regionale (P3 di un'altra area, P6 o P7) il report e'
limitato alla sua ADA, mentre l'elenco aperto dal link e' regionale: li' il numero non coincide. Da chiedere ad ARSIAL se
questi profili misti esistono; se si', un parametro del backend restringera' l'elenco al perimetro del report.

| pagina | link (id) | innesco | arrivo (feature: route) | parametri di path | query |
|---|---|---|---|---|---|
| /finanziario/sigc | elenco-sigc | passo di Domande SIGC | elenco-operativo: /elenco-operativo/domande | - | sigc=true e, per pagate, da pagare e senza importi, pagamento=PAGATA, DA_PAGARE, SENZA_IMPORTI + filtri correnti |
| /finanziario/sigc | elenco-sigc-importi | Importi SIGC | elenco-operativo: /elenco-operativo/domande | - | sigc=true + filtri correnti (il sinottico dell'elenco riporta richiesto, ammesso, pagato e ancora da pagare) |

Non collegato: Utilizzo progressivo della riserva (TX-0014, dato regionale, non e' un insieme di domande). Nessun link
verso altri ambiti: la verifica SMP SIGC (TX-0015) e' dell'istituzionale (OP-FE-10).

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

- OP-FE-03: filtri non applicabili alla riserva.
- OP-FE-05 (riscritto il 13/10/2026): pagate, da pagare e importo pagato SIGC hanno la stessa fonte, gli importi della
  domanda (flusso ASR2-20); i pagamenti totali di TX-0002 sono lordi (elenchi di liquidazione), il pagato netto di TX-0011
  ne toglie le rettifiche; il decretato viene dagli elenchi di liquidazione. Resta da confermare con ARSIAL quale fonte fa
  fede per il pagato a regime.
- OP-FE-09: profili misti (P4 con un profilo regionale): il report e' ADA, l'elenco aperto dal link e' regionale.
- OP-FE-10 (nuovo, 30/10/2026): la verifica SMP SIGC esce dal finanziario; voce di menu, route-table, card della Home e
  codice della pagina li allinea lo step6.

## Revisioni del 31/10/2026 (BOZZA da approvare, MIN-20261031)

### Natura delle card col filtro SIGC

| pagina | elementi | natura |
|---|---|---|
| /finanziario/sigc | Domande SIGC, Importi SIGC e tabelle | solo SIGC: con NO SIGC tutta la pagina non pertinente |
| /finanziario/riserva | tutta la pagina | il filtro non si applica (TX-0014 non lo prende): nessuna barra dei filtri |

### Modifiche del flusso

- R16: via "(flusso ASR2-20)" e "campagne senza ASR2-20" dalle etichette (le domande senza importi restano, con
  un'etichetta neutra).
- R13: Importi SIGC nella forma scelta (alternative nella panoramica).
- R17, R18: riserva di efficacia rivista (vedi `riserva.html`).

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
