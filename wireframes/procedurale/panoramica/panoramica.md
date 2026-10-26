# Flusso panoramica - wireframe v2 (feature procedurale)

> Doc del gate umano PER FLUSSO. L'approvazione e' content-addressed sull'INTERA dir
> `wireframes/procedurale/panoramica/` (hash da `wireframe-hash.sh`): modificare un file qui invalida
> l'approvazione del flusso (e solo di questo flusso).

## Route del flusso

| route | kind | pattern | grant (verbatim dal catalogo) |
|---|---|---|---|
| /procedurale | cruscotto | cruscotto (KPI + grafici + pannello dei filtri) | csr.tx-0024.read, csr.tx-0025.read, csr.tx-0026.read, csr.tx-0027.read, csr.tx-0028.read, csr.tx-0029.read |
| /procedurale/interventi/:codice | dettaglio | dettaglio (testata + KPI + schede) | csr.tx-0024.read, csr.tx-0026.read, csr.tx-0027.read, csr.tx-0028.read, csr.tx-0029.read, csr.tx-0030.read, csr.tx-0031.read, csr.tx-0032.read |

Profili che detengono i grant (catalogo): p1-dirigente, p2-referente-adg, p3-funzionario-area-pro, p4-responsabile-procedimento-ada
(P4 con perimetro ADA). Ogni card e ogni scheda compare solo con il grant della sua transazione (gate di UX, mai sicurezza).

Cambiato il 22/10/2026 (giro G3 del backend): pill "Dati al" da TX-0024 (ultimiDatiSincronizzati), download per formato
PNG, CSV, XLSX in ogni card (CSV e XLSX dagli export `<report>/{formato}`), scheda Sottofasi nel dettaglio (TX-0031 e
TX-0032 ora accettano intervento e stato), nessun riferimento al parametro `azione` (uscito dal contratto).

Aggiornato il 26/10/2026 con la card Procedurale della Home (`home.html`, decisione dell'utente del 26/10/2026: domande
ammesse, contributo ammesso, barra degli interventi attivati, domande di sostegno). Vedi "Card della Home".

## Component tree (per pagina)

Vocabolario del kit UI v2 (ADR 0027 di green-fe), lo stesso del finanziario (prototipo approvato `prototipo/finanziario/`).

- /procedurale: Shell > Barra filtri (bottone Filtri, chip, perimetro, pill "Dati al" con il dettaglio per flusso) >
  Breadcrumb > Titolo > KPI x4 (domande ammesse, con atto di concessione, contributo ammesso, interventi attivati) > Card
  stati DS (barre impilate) + Card stati DP (barre impilate) > Card stato area programmazione (barre) + Card importi per
  intervento (barre raggruppate); ogni card con interruttore Grafico | Tabella e i pulsanti PNG, CSV, XLSX > Pannello
  filtri (TX-0024, TX-0025) > Stati
- /procedurale/interventi/:codice: Shell > Barra filtri (stato area programmazione, perimetro, "Dati al") > Breadcrumb >
  Testata (codice, descrizione, perimetro, attivato, azioni) > KPI x4 > Schede: Stati delle domande (barre DS e DP) | Area
  programmazione (barre) | Sottofasi (tabelle DS e DP, grafico con la fonte attiva) | Unit Amount (tabella) > Stati

## Grafici del flusso

| pagina | grafico | tipo | dati (transazione) | clic | valori assenti |
|---|---|---|---|---|---|
| /procedurale | Domande di sostegno per stato | barre orizzontali impilate (rilasciate, non rilasciate) | TX-0027 (totale) | link:stati-sostegno-panoramica (/procedurale/stati-sostegno) | In compilazione con FONTE_NON_ATTIVA: voce omessa e dichiarata, mai 0 |
| /procedurale | Domande di pagamento per stato | barre orizzontali impilate | TX-0028 (totale) | link:stati-pagamento-panoramica (/procedurale/stati-pagamento) | come sopra |
| /procedurale | Domande per stato area programmazione | barre orizzontali | TX-0029 (totale.statiAreaProgrammazione) | filtra la pagina (aggiunge il chip stato); nella tabella equivalente link:elenco-area-programmazione-panoramica (elenco-operativo: /elenco-operativo/domande) | nessuno (conteggi; senza stato e' una voce) |
| /procedurale | Importo richiesto e contributo ammesso per intervento | barre raggruppate, zoom oltre 12 | TX-0026 (righe) | link:dettaglio-intervento-panoramica (/procedurale/interventi/:codice) | NON_VALORIZZATO: barra omessa e dichiarata |
| /procedurale/interventi/:codice | Domande di sostegno per stato | barre orizzontali impilate | TX-0027 (riga) | link:elenco-stato-sostegno-intervento (elenco-operativo: /elenco-operativo/domande) | In compilazione senza fonte: omessa, nessun link |
| /procedurale/interventi/:codice | Domande di pagamento per stato | barre orizzontali impilate | TX-0028 (riga) | link:elenco-stato-pagamento-intervento (elenco-operativo: /elenco-operativo/domande) | come sopra |
| /procedurale/interventi/:codice | Domande per stato area programmazione | barre orizzontali | TX-0029 (riga) | link:elenco-area-programmazione-intervento (elenco-operativo: /elenco-operativo/domande) | nessuno |
| /procedurale/interventi/:codice | Domande di sostegno / di pagamento per sottofase | barre orizzontali delle voci di SR-01 | TX-0031, TX-0032 (voci, con intervento=:codice) | nessuno (l'elenco non ha un filtro per sottofase) | FONTE_NON_ATTIVA SOTTOFASI_DOMANDA: grafico non disponibile, detto in testo, tabella; voce non censita: omessa e dichiarata |

KPI: totali del DTO di TX-0026 (domandeAmmesse, conAttoConcessione, contributoAmmesso con importoRichiesto,
interventiAttivati su interventiPerimetroUfficiale); la quota del contributo sul richiesto solo se entrambi valorizzati.
Il KPI con atto di concessione con FONTE_NON_ATTIVA ATTO_CONCESSIONE (nessun atto nel database: oggi e' il caso reale) e'
"non disponibile" col motivo, senza link. Il "di cui non rilasciate" e' testo e colonna della tabella equivalente, non solo
un segmento colorato.

## Download (come nel finanziario)

Ogni card con un grafico ha un pulsante per formato: PNG (immagine del grafico disegnata nel browser con l'intestazione di
NFR-50, solo nella vista Grafico, non registrata in audit come OP-FE-08 del finanziario), CSV e XLSX (file del backend,
registrati in AUDIT_ESPORTAZIONE, con gli stessi filtri della pagina e l'header X-Requested-With). Il file di una card e'
l'export del report da cui viene:

| card | CSV e XLSX |
|---|---|
| Domande di sostegno per stato | GET /api/procedurale/stati-sostegno/{formato} (TX-0027) |
| Domande di pagamento per stato | GET /api/procedurale/stati-pagamento/{formato} (TX-0028) |
| Domande per stato area programmazione | GET /api/procedurale/riepilogo/{formato} (TX-0029; per csv e' lo stesso indirizzo storico riepilogo/csv) |
| Importo richiesto e contributo ammesso per intervento | GET /api/procedurale/domande-ammesse/{formato} (TX-0026) |
| dettaglio: schede Stati, Area programmazione, Sottofasi, Unit Amount | gli stessi export con intervento=:codice (e lo stato, tranne Unit Amount): stati-sostegno, stati-pagamento, riepilogo, sottofasi-sostegno, sottofasi-pagamento, unit-amount |

Un file alla volta; esito in `role="status"`, errore in `role="alert"` col motivo (400 oltre 5.000 righe o 50.000 celle:
restringere i filtri; 503 ESPORTAZIONE_NON_REGISTRATA o capacita': riprovare). I KPI non hanno download.

## Link del flusso (drill-down dichiarati)

Drill-down verso l'elenco operativo (stessa regola del finanziario: solo dove l'insieme di domande del report si riproduce
con i parametri dell'elenco, D-02 di elenco-operativo). Il filtro per stato area programmazione (`stato`, chiavi di TX-0025)
passa all'elenco come `voceProgrammazione`; le azioni portanti non sono un filtro del procedurale (RF024; il parametro
`azione` e' uscito dal contratto col giro G3, D-01 Rev. 1 del backend).

| pagina | link (id) | innesco | arrivo (feature: route) | parametri di path | query |
|---|---|---|---|---|---|
| /procedurale | elenco-ammesse-panoramica | Apri nell'elenco del KPI Domande ammesse | elenco-operativo: /elenco-operativo/domande | - | voceProgrammazione=AMMESSA + intervento, os, og, op (solo se il filtro stato e' vuoto o comprende AMMESSA) |
| /procedurale | elenco-con-atto-panoramica | Apri nell'elenco del KPI Con atto di concessione (solo con la fonte attiva) | elenco-operativo: /elenco-operativo/domande | - | concessione=true, tipo=SOSTEGNO, voceProgrammazione = filtro stato + intervento, os, og, op |
| /procedurale | elenco-area-programmazione-panoramica | Apri nell'elenco su una voce della tabella equivalente dello stato area programmazione | elenco-operativo: /elenco-operativo/domande | - | voceProgrammazione = chiave della voce (codice osservato, SENZA_STATO) + intervento, os, og, op |
| /procedurale | stati-sostegno-panoramica | clic sulla card (o una barra) Domande di sostegno per stato | procedurale: /procedurale/stati-sostegno | - | intervento, os, og, op, stato |
| /procedurale | stati-pagamento-panoramica | clic sulla card (o una barra) Domande di pagamento per stato | procedurale: /procedurale/stati-pagamento | - | intervento, os, og, op, stato |
| /procedurale | dettaglio-intervento-panoramica | barra di Importo richiesto e contributo ammesso | procedurale: /procedurale/interventi/:codice | codice | stato |
| /procedurale/interventi/:codice | panoramica-intervento | bottone "Filtra i report procedurali su questo intervento" | procedurale: /procedurale | - | intervento=:codice, stato |
| /procedurale/interventi/:codice | elenco-ammesse-intervento | Apri nell'elenco del KPI Domande ammesse | elenco-operativo: /elenco-operativo/domande | - | voceProgrammazione=AMMESSA, intervento=:codice |
| /procedurale/interventi/:codice | elenco-con-atto-intervento | Apri nell'elenco del KPI Con atto di concessione (fonte attiva) | elenco-operativo: /elenco-operativo/domande | - | concessione=true, tipo=SOSTEGNO, voceProgrammazione = filtro stato, intervento=:codice |
| /procedurale/interventi/:codice | elenco-stato-sostegno-intervento | barra (o tabella equivalente) degli stati DS | elenco-operativo: /elenco-operativo/domande | - | statoSostegno = voce o codice, voceProgrammazione = filtro stato, intervento=:codice |
| /procedurale/interventi/:codice | elenco-stato-pagamento-intervento | barra (o tabella equivalente) degli stati DP | elenco-operativo: /elenco-operativo/domande | - | statoPagamento = voce o codice, voceProgrammazione = filtro stato, intervento=:codice |
| /procedurale/interventi/:codice | elenco-area-programmazione-intervento | barra (o tabella equivalente) dello stato area programmazione | elenco-operativo: /elenco-operativo/domande | - | voceProgrammazione = chiave della voce, intervento=:codice |

I link per stato aprono la parte rilasciata della voce (domande meno di cui non rilasciate, D-04 Rev. 5 e decisione D1 del
backend): l'etichetta lo dice ("Apri nell'elenco (n rilasciate)") quando la voce ha domande non rilasciate, e il link non c'e'
per una voce senza domande rilasciate. Non collegati: importi (l'elenco ha gli importi della domanda, non quelli della
determina corrente), interventi attivati e perimetro ufficiale (non sono insiemi di domande), Unit Amount.

## Filtri nell'URL (url_params)

| pagina | parametro | fonte (operationId.parametro) | multiplo | obbligatorio |
|---|---|---|---|---|
| /procedurale | intervento, os, og, op, stato | TX-0026.intervento, TX-0026.os, TX-0026.og, TX-0026.op, TX-0026.stato (gli stessi parametri di TX-0027, TX-0028, TX-0029) | si' | no |
| /procedurale/interventi/:codice | stato | TX-0026.stato (l'intervento e' il segmento :codice, mandato come intervento=:codice; lo stato va anche a TX-0027, TX-0028, TX-0029, TX-0031, TX-0032, non a TX-0030) | si' | no |

Il pannello dei filtri (TX-0024: interventi senza AT001, OS, OG, OP; TX-0025: dieci voci di RF025, stati osservati, senza stato)
si apre da ogni pagina; la panoramica lo ospita nel wireframe. Bottone "Applica i filtri" (nessun conteggio dal vivo: il
contratto non ha un conteggio dei risultati, come nel finanziario). TX-0024 porta anche ultimiDatiSincronizzati, la pill
"Dati al" di ogni pagina: una lettura per pagina, fuori dal tetto delle letture e dall'audit (D-01 Rev. 2 del backend).

## Card della Home (decisione dell'utente del 26/10/2026, OP-PR-10)

Pagina: `home.html` di questa dir. La Home non e' una route della feature (resta fuori dal manifest, `src/app/home.tsx`):
la card dell'area e' contenuto della feature (G1, OP-PR-04) e la monta lo step6 in `src/app/aree.ts` come `Anteprima`,
accanto a quella del finanziario (`AnteprimaFinanziario`), con la stessa forma: fascia colorata invariata (icona, stato,
titolo, descrizione), numeri chiave nel corpo, "Entra in Procedurale" nel piede.

- Letture: TX-0026 e TX-0027 senza filtri, le stesse della panoramica aperta senza filtri (stessa cache). Ognuna col suo
  grant: csr.tx-0026.read per domande ammesse, contributo e interventi attivati; csr.tx-0027.read per le domande di
  sostegno (p1-dirigente, p2-referente-adg, p3-funzionario-area-pro, p4-responsabile-procedimento-ada hanno entrambi).
  Senza nessuno dei due nessuna lettura e la card elenca i contenuti dell'area, come oggi. Nessuna lettura di TX-0024,
  TX-0025, TX-0028, TX-0029.
- Numeri: quelli della panoramica senza filtri, dagli stessi DTO:

| numero | campo (provenance spec: openapi-procedurale.json) | resa |
|---|---|---|
| Domande ammesse | DomandeAmmesse.totale.domandeAmmesse | intero, numero animato (come il KPI della panoramica) |
| Contributo ammesso | DomandeAmmesse.totale.contributoAmmesso (Importo motivato) | importo breve, numero animato; assente: "non disponibile" col motivo, mai 0 |
| Interventi attivati | totale.interventiAttivati su totale.interventiPerimetroUfficiale | "n su m" e percentuale nel testo, barra a passi del 5 % (decorativa); con m = 0 il solo testo |
| Domande di sostegno | StatiDomande.totale.totale di TX-0027 (voci, altri stati e non rilasciate comprese) | intero, numero animato (come il KPI della pagina degli stati) |

- Perimetro ADA (P4): col perimetro ADA della risposta le etichette lo dicono ("Domande ammesse della tua area",
  "Contributo ammesso della tua area", "Domande di sostegno della tua area", "Interventi attivati con domande della tua
  area"), come la card del finanziario; il perimetro ufficiale degli interventi resta quello del programma.
- Stati: caricamento (uno scheletro per lettura); errore di una lettura (la sua frase, l'altra resta: "Domande ammesse e
  contributo non disponibili in questo momento.", "Conteggio delle domande di sostegno non disponibile in questo
  momento."; la Home non si ferma, nessun avviso della pagina); risposta di TX-0026 senza totale (la frase dell'errore);
  contributo senza fonte (assenza motivata); nessun intervento nel perimetro ufficiale (testo senza barra); profilo senza
  grant (contenuti dell'area); un solo grant (il solo gruppo di numeri di quella lettura).
- Nessun link verso l'elenco dalla card: l'ingresso e' "Entra in Procedurale" (i link dei KPI restano nella panoramica).
- WCAG: numeri in una lista di definizioni (dt, dd) in un gruppo con nome ("Il procedurale in cifre"); il numero animato
  e' letto solo nel valore finale e non si anima con prefers-reduced-motion (kit `NumeroAnimato`); la barra e' nascosta ai
  lettori di schermo e numeri e percentuale sono nel testo. RESIDUO umano: ordine di lettura della card, contrasto della
  resa finale; axe deferito a step8.

## Stati resi (obbligatori)

- vuoto: messaggio azionabile con "Modifica i filtri" (mai schermo bianco); nel dettaglio "nessuna domanda dell'intervento"
- caricamento: scheletro delle card, `role="status"` + `aria-live="polite"`; letture al piu' due alla volta
- errore: `role="alert"`, discriminato sul problem-type `urn:cruscottocsr:problem:*` (400 DATO_NON_VALIDO filtro non valido;
  403 accesso negato; 503 CAPACITA_ESAURITA o TEMPO_SCADUTO, ritentata rispettando Retry-After; 429; 401/419 sessione);
  per un download l'errore resta accanto ai pulsanti ("File XLSX non scaricato." col motivo: 400 oltre il limite
  dell'export sincrono, 503 ESPORTAZIONE_NON_REGISTRATA)

## Note WCAG 2.2 (residuo manuale DICHIARATO)

- Meccanizzato a valle (step7/step8): tab-order, focus sul titolo dopo il cambio di route, focus-trap di pannello e
  drawer, tabella equivalente di ogni grafico, axe (deferito al gate 11/11 di step8: il lint di oggi e' statico).
- RESIDUO umano da verificare qui: ordine di lettura di KPI e card, didascalie dei grafici, etichette comprensibili,
  contrasto della resa finale (il low-fi non fa fede sul colore; fa fede il prototipo).
- RESIDUO umano: il segmento "non rilasciate" delle barre impilate deve distinguersi anche senza colore (motivo o etichetta).
- RESIDUO umano: dimensione dei bersagli (WCAG 2.5.8) dei link "Apri nell'elenco" nei KPI e nelle tabelle (minimo 24 px nel kit).
- Download: un pulsante per formato con la sigla visibile e il nome accessibile completo che la contiene (WCAG 2.5.3);
  durante la preparazione aria-disabled, il focus resta sul pulsante attivato (WCAG 2.4.3); esito in role=status, errore in
  role=alert col motivo (come la deviazione V-07 del finanziario).
- Pill "Dati al": bottone con nome accessibile completo ("Ultimo dato sincronizzato: dati al ... per tutti i flussi. Mostra
  il dettaglio per flusso") e popover con una voce per flusso; RESIDUO umano: comprensibilita' della data "meno recente".

## Punti aperti che toccano questo flusso

- OP-PR-06: profili misti (P4 con un profilo regionale): il report e' ADA, l'elenco aperto dai link e' regionale.
- OP-PR-07: TX-0024 e TX-0025 (ui_hint form) resi come pannello dei filtri, non come route form.
- OP-PR-08: regole del drill-down (parte rilasciata, voceProgrammazione, cosa non si collega).
- OP-PR-10: card della Home coi numeri chiave della panoramica (decisione dell'utente del 26/10/2026), vedi "Card della
  Home"; la monta lo step6 in `src/app/aree.ts`.
- Chiusi col giro G3 e con G1 (22/10/2026): OP-PR-01 (ultimo dato sincronizzato da TX-0024), OP-PR-02 (parametro `azione`
  uscito dal contratto), OP-PR-03 (sottofasi con i filtri; Unit Amount senza lo stato per decisione del backend), OP-PR-04
  (card della Home = contenuto reale della feature, la riscrive step6), OP-PR-05 (export CSV e XLSX di TX-0026..TX-0032).
