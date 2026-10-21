# Flusso panoramica - wireframe v2 (feature procedurale)

> Doc del gate umano PER FLUSSO. L'approvazione e' content-addressed sull'INTERA dir
> `wireframes/procedurale/panoramica/` (hash da `wireframe-hash.sh`): modificare un file qui invalida
> l'approvazione del flusso (e solo di questo flusso).

## Route del flusso

| route | kind | pattern | grant (verbatim dal catalogo) |
|---|---|---|---|
| /procedurale | cruscotto | cruscotto (KPI + grafici + pannello dei filtri) | csr.tx-0024.read, csr.tx-0025.read, csr.tx-0026.read, csr.tx-0027.read, csr.tx-0028.read, csr.tx-0029.read |
| /procedurale/interventi/:codice | dettaglio | dettaglio (testata + KPI + schede) | csr.tx-0024.read, csr.tx-0026.read, csr.tx-0027.read, csr.tx-0028.read, csr.tx-0029.read, csr.tx-0030.read |

Profili che detengono i grant (catalogo): p1-dirigente, p2-referente-adg, p3-funzionario-area-pro, p4-responsabile-procedimento-ada
(P4 con perimetro ADA). Ogni card e ogni scheda compare solo con il grant della sua transazione (gate di UX, mai sicurezza).

## Component tree (per pagina)

Vocabolario del kit UI v2 (ADR 0027 di green-fe), lo stesso del finanziario (prototipo approvato `prototipo/finanziario/`).

- /procedurale: Shell > Barra filtri (bottone Filtri, chip, perimetro) > Breadcrumb > Titolo > KPI x4 (domande ammesse,
  con atto di concessione, contributo ammesso, interventi attivati) > Card stati DS (barre impilate) + Card stati DP (barre
  impilate) > Card stato area programmazione (barre) + Card importi per intervento (barre raggruppate) > Pannello filtri
  (TX-0024, TX-0025) > Stati
- /procedurale/interventi/:codice: Shell > Barra filtri (stato area programmazione, perimetro) > Breadcrumb > Testata
  (codice, descrizione, perimetro, attivato, azioni) > KPI x4 > Schede: Stati delle domande (barre DS e DP) | Area
  programmazione (barre) | Unit Amount (tabella) > Stati

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

KPI: totali del DTO di TX-0026 (domandeAmmesse, conAttoConcessione, contributoAmmesso con importoRichiesto,
interventiAttivati su interventiPerimetroUfficiale); la quota del contributo sul richiesto solo se entrambi valorizzati.
Il KPI con atto di concessione con FONTE_NON_ATTIVA ATTO_CONCESSIONE (nessun atto nel database: oggi e' il caso reale) e'
"non disponibile" col motivo, senza link. Il "di cui non rilasciate" e' testo e colonna della tabella equivalente, non solo
un segmento colorato.

## Link del flusso (drill-down dichiarati)

Drill-down verso l'elenco operativo (stessa regola del finanziario: solo dove l'insieme di domande del report si riproduce
con i parametri dell'elenco, D-02 di elenco-operativo). Il filtro per stato area programmazione (`stato`, chiavi di TX-0025)
passa all'elenco come `voceProgrammazione`; le azioni portanti non sono un filtro del procedurale (OP-PR-02).

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
| /procedurale/interventi/:codice | stato | TX-0026.stato (l'intervento e' il segmento :codice, mandato come intervento=:codice) | si' | no |

Il pannello dei filtri (TX-0024: interventi senza AT001, OS, OG, OP; TX-0025: dieci voci di RF025, stati osservati, senza stato)
si apre da ogni pagina; la panoramica lo ospita nel wireframe. Bottone "Applica i filtri" (nessun conteggio dal vivo: il
contratto non ha un conteggio dei risultati, come nel finanziario).

## Stati resi (obbligatori)

- vuoto: messaggio azionabile con "Modifica i filtri" (mai schermo bianco); nel dettaglio "nessuna domanda dell'intervento"
- caricamento: scheletro delle card, `role="status"` + `aria-live="polite"`; letture al piu' due alla volta
- errore: `role="alert"`, discriminato sul problem-type `urn:cruscottocsr:problem:*` (400 DATO_NON_VALIDO filtro non valido;
  403 accesso negato; 503 CAPACITA_ESAURITA o TEMPO_SCADUTO, ritentata rispettando Retry-After; 429; 401/419 sessione)

## Note WCAG 2.2 (residuo manuale DICHIARATO)

- Meccanizzato a valle (step7/step8): tab-order, focus sul titolo dopo il cambio di route, focus-trap di pannello e
  drawer, tabella equivalente di ogni grafico, axe (deferito al gate 11/11 di step8: il lint di oggi e' statico).
- RESIDUO umano da verificare qui: ordine di lettura di KPI e card, didascalie dei grafici, etichette comprensibili,
  contrasto della resa finale (il low-fi non fa fede sul colore; fa fede il prototipo).
- RESIDUO umano: il segmento "non rilasciate" delle barre impilate deve distinguersi anche senza colore (motivo o etichetta).
- RESIDUO umano: dimensione dei bersagli (WCAG 2.5.8) dei link "Apri nell'elenco" nei KPI e nelle tabelle (minimo 24 px nel kit).

## Punti aperti che toccano questo flusso

- OP-PR-01: ultimo dato sincronizzato assente dai DTO procedurali (pill assente finche' green-be non lo aggiunge a TX-0024).
- OP-PR-02: parametro `azione` nel contratto ma rifiutato dal backend; la FE non lo usa.
- OP-PR-04: card dell'ambito in `src/app/aree.ts` non allineata alla slice (determine, responsabili e ADA; Unit Amount nel fisico).
- OP-PR-05: nessun export dei singoli report (solo il CSV del riepilogo); le card offrono il PNG.
- OP-PR-06: profili misti (P4 con un profilo regionale): il report e' ADA, l'elenco aperto dai link e' regionale.
- OP-PR-07: TX-0024 e TX-0025 (ui_hint form) resi come pannello dei filtri, non come route form.
- OP-PR-08: regole del drill-down (parte rilasciata, voceProgrammazione, cosa non si collega).
