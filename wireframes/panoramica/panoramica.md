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

- /finanziario: Shell > Barra filtri (chip, perimetro, ultimo dato sincronizzato) > Breadcrumb > Titolo > KPI x4 > Card avanzamento (barre) + Card famiglie (treemap) > Card SIGC domande (barre orizzontali) + Card SIGC importi (cascata) > Pannello filtri > Stati
- /finanziario/interventi/:codice: Shell > Barra filtri > Breadcrumb > Testata (codice, descrizione, perimetro, contributo ambientale, azioni) > KPI x4 > Schede: Sintesi (gauge, cascata) | Domande (barre impilate, linea) | SIGC (barre orizzontali, cascata) | Tutte le voci (tabella con i motivi) > Stati

## Grafici del flusso

| pagina | grafico | tipo | dati (transazione) | clic | valori assenti |
|---|---|---|---|---|---|
| /finanziario | Avanzamento per intervento | barre | TX-0002 | dettaglio dell'intervento | interventi senza dotazione fuori dal grafico, dichiarati |
| /finanziario | Dotazione per famiglia di intervento | treemap | TX-0002 | famiglia: entra; intervento: dettaglio | dotazione assente: intervento omesso e dichiarato |
| /finanziario | Domande SIGC | barre orizzontali (presentate, pagate, da pagare, senza importi: pagate e da pagare si sovrappongono) | TX-0012 | pagina SIGC | nessuno (conteggi) |
| /finanziario | Importi SIGC | cascata | TX-0013 | nessuno | importo assente: passo omesso e dichiarato |
| /finanziario/interventi/:codice | Pagato netto sulla dotazione | gauge | TX-0011 (pagamenti al netto delle rettifiche) | nessuno | non disegnato se manca un termine |
| /finanziario/interventi/:codice | Dalla dotazione al residuo | cascata | TX-0011 | nessuno | impegnato: fonte non attiva, dichiarato |
| /finanziario/interventi/:codice | Domande per anno | barre | TX-0008 | link:elenco-anno-intervento (elenco-operativo: /elenco-operativo/domande) | riga senza anno: barra a parte |
| /finanziario/interventi/:codice | Importi ammessi e decretati | linea | TX-0010 | nessuno | stanziato: fonte non attiva, dichiarato |
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
pagamenti per intervento), Pagato netto sulla dotazione e Dalla dotazione al residuo (TX-0011), Importi ammessi e decretati
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
- RESIDUO umano: dimensione dei bersagli (WCAG 2.5.8) dei link "Apri nell'elenco" nelle celle (minimo 24 px nel kit).

## Punti aperti che toccano questo flusso

- OP-FE-04: risolto (ultimo dato sincronizzato nella barra dei filtri).
- OP-FE-05 (riscritto il 13/10/2026): pagate, da pagare e importo pagato SIGC hanno la stessa fonte, gli importi della
  domanda (flusso ASR2-20); i pagamenti totali di TX-0002 sono lordi (elenchi di liquidazione), il pagato netto di TX-0011
  ne toglie le rettifiche; il decretato viene dagli elenchi di liquidazione. Resta da confermare con ARSIAL quale fonte fa
  fede per il pagato a regime.
- OP-FE-06: dopo un 401 il BFF riporta su / (pagina e filtri si perdono).
- OP-FE-09: profili misti (P4 con un profilo regionale): il report e' ADA, l'elenco aperto dal link e' regionale.
- OP-FE-07: gerarchia intervento-OS-OG-OP assente dai DTO (raggruppamento per famiglia nel frattempo).
