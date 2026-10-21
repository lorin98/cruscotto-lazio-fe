# Flusso ammesse - wireframe v2 (feature procedurale)

> Doc del gate umano PER FLUSSO. L'approvazione e' content-addressed sull'INTERA dir
> `wireframes/procedurale/ammesse/` (hash da `wireframe-hash.sh`): modificare un file qui invalida
> l'approvazione del flusso (e solo di questo flusso).

## Route del flusso

| route | kind | pattern | grant (verbatim dal catalogo) |
|---|---|---|---|
| /procedurale/ammesse | report | report v2 (KPI, grafici, tabella interattiva, drawer) | csr.tx-0024.read, csr.tx-0025.read, csr.tx-0026.read |

## Component tree (per pagina)

- /procedurale/ammesse: Shell > Barra filtri > Breadcrumb > Titolo > KPI x4 (domande ammesse, con atto di concessione,
  contributo ammesso con il richiesto, interventi attivati sul perimetro ufficiale) > Card importi per intervento (barre
  raggruppate) + Card domande ammesse e con atto per intervento (barre raggruppate) > Tabella interattiva per intervento
  (cerca, Colonne, ordinamento, totali dal backend, paginazione) > Drawer di anteprima > Stati

## Grafici del flusso

| pagina | grafico | tipo | dati (transazione) | clic | valori assenti |
|---|---|---|---|---|---|
| /procedurale/ammesse | Importo richiesto e contributo ammesso per intervento | barre raggruppate, zoom oltre 12 | TX-0026 (righe) | link:dettaglio-intervento-ammesse (/procedurale/interventi/:codice) | NON_VALORIZZATO: barra omessa e dichiarata |
| /procedurale/ammesse | Domande ammesse e con atto di concessione per intervento | barre raggruppate, zoom oltre 12 | TX-0026 (righe) | link:dettaglio-intervento-ammesse; nella tabella equivalente link:elenco-ammesse-riga (elenco-operativo: /elenco-operativo/domande) | con atto FONTE_NON_ATTIVA ATTO_CONCESSIONE: serie omessa e dichiarata, mai 0 |

Regole del dato (D-03 del backend, Rev. 1-4): domanda ammessa = domanda corrente di qualunque tipo con stato area
programmazione Ammessa; importo richiesto e contributo ammesso per campo dalla determina corrente (la riga aperta piu' recente
che lo valorizza), altrimenti dagli scarichi SIAN della domanda; un importo nullo non entra nella somma e, se nessuna riga lo
valorizza, la misura e' "non valorizzato". Con atto di concessione = domande di sostegno con numero o data dell'atto nel report
CSR-DS (senza richiedere lo stato Ammessa); senza alcun atto nel database e' FONTE_NON_ATTIVA, per riga e nel totale. Interventi
attivati = interventi con almeno una domanda di sostegno corrente; perimetro ufficiale = interventi selezionati (AT001 esclusa).

## Link del flusso (drill-down dichiarati)

| pagina | link (id) | innesco | arrivo (feature: route) | parametri di path | query |
|---|---|---|---|---|---|
| /procedurale/ammesse | elenco-ammesse | Apri nell'elenco del KPI Domande ammesse | elenco-operativo: /elenco-operativo/domande | - | voceProgrammazione=AMMESSA + intervento, os, og, op (solo se il filtro stato e' vuoto o comprende AMMESSA) |
| /procedurale/ammesse | elenco-con-atto | Apri nell'elenco del KPI Con atto di concessione (solo con la fonte attiva) | elenco-operativo: /elenco-operativo/domande | - | concessione=true, tipo=SOSTEGNO, voceProgrammazione = filtro stato + intervento, os, og, op |
| /procedurale/ammesse | elenco-ammesse-riga | Apri nell'elenco nella cella Domande ammesse (o nel drawer) | elenco-operativo: /elenco-operativo/domande | - | voceProgrammazione=AMMESSA, intervento della riga |
| /procedurale/ammesse | elenco-con-atto-riga | Apri nell'elenco nella cella Con atto di concessione (o nel drawer), fonte attiva | elenco-operativo: /elenco-operativo/domande | - | concessione=true, tipo=SOSTEGNO, voceProgrammazione = filtro stato, intervento della riga |
| /procedurale/ammesse | dettaglio-intervento-ammesse | barra dei grafici o Apri il dettaglio dal drawer | procedurale: /procedurale/interventi/:codice | codice | stato |

Riproducibilita': `voceProgrammazione` dell'elenco "vale per le domande di ogni tipo con quello stato, come TX-0026"; le
domande non rilasciate non hanno stato area programmazione, quindi il numero coincide. Il filtro `concessione` dell'elenco usa
la stessa definizione dell'atto di TX-0026 e con la fonte non attiva risponde 400: in quel caso il link non c'e' (nell'elenco
la nota "Atto di concessione non disponibile", OP-EO-06). Importi non collegati (l'elenco ha gli importi della domanda, non
della determina corrente).

## Filtri nell'URL (url_params)

| pagina | parametro | fonte (operationId.parametro) | multiplo | obbligatorio |
|---|---|---|---|---|
| /procedurale/ammesse | intervento, os, og, op, stato | TX-0026.intervento, .os, .og, .op, .stato | si' | no |

## Stati resi (obbligatori)

- vuoto: "Nessun intervento per i filtri scelti" con "Modifica i filtri"
- caricamento: scheletro delle card, `role="status"` + `aria-live="polite"`
- errore: `role="alert"`, discriminato sul problem-type (400; 403; 503 con Retry-After; 429; 401/419)

## Note WCAG 2.2 (residuo manuale DICHIARATO)

- Meccanizzato a valle (step7/step8): tab-order, focus dopo il cambio di route, focus-trap del drawer, tabella equivalente
  di ogni grafico, axe (deferito a step8).
- RESIDUO umano: dimensione dei bersagli (WCAG 2.5.8) dei link "Apri nell'elenco" nelle celle e loro allineamento nelle
  celle numeriche; comprensibilita' di "non disponibile (fonte non attiva)" contro "non valorizzato".
- RESIDUO umano: contrasto della resa finale (il low-fi non fa fede sul colore).

## Punti aperti che toccano questo flusso

- OP-PR-01: ultimo dato sincronizzato assente dai DTO procedurali.
- OP-PR-04 (a): la card dell'ambito promette "Determine, responsabili e ADA di riferimento", che questa pagina non ha
  (la determina e' solo la fonte degli importi).
- OP-PR-05: nessun export di TX-0026; PNG e CSV del riepilogo.
- OP-PR-06: profili misti: il report e' ADA, l'elenco aperto dai link e' regionale.
- OP-PR-08: regole del drill-down.
