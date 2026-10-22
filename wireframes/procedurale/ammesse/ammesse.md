# Flusso ammesse - wireframe v2 (feature procedurale)

> Doc del gate umano PER FLUSSO. L'approvazione e' content-addressed sull'INTERA dir
> `wireframes/procedurale/ammesse/` (hash da `wireframe-hash.sh`): modificare un file qui invalida
> l'approvazione del flusso (e solo di questo flusso).

## Route del flusso

| route | kind | pattern | grant (verbatim dal catalogo) |
|---|---|---|---|
| /procedurale/ammesse | report | report v2 (KPI, grafici, tabella interattiva, drawer) | csr.tx-0024.read, csr.tx-0025.read, csr.tx-0026.read |

Cambiato il 22/10/2026 (giro G3 del backend): pill "Dati al" da TX-0024, download PNG, CSV, XLSX delle card e CSV, XLSX
della tabella (GET /api/procedurale/domande-ammesse/{formato}); la voce della Home "Domande ammesse con atto e contributo"
punta qui (G1, la scrive step6).

## Component tree (per pagina)

- /procedurale/ammesse: Shell > Barra filtri (con la pill "Dati al") > Breadcrumb > Titolo > KPI x4 (domande ammesse, con
  atto di concessione, contributo ammesso con il richiesto, interventi attivati sul perimetro ufficiale) > Card importi per
  intervento (barre raggruppate) + Card domande ammesse e con atto per intervento (barre raggruppate), con i pulsanti PNG,
  CSV, XLSX > Tabella interattiva per intervento (cerca, Colonne, CSV, XLSX, ordinamento, totali dal backend, paginazione) >
  Drawer di anteprima > Stati

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

## Download (come nel finanziario)

| dove | formati | file |
|---|---|---|
| card Importo richiesto e contributo ammesso per intervento | PNG (vista Grafico), CSV, XLSX | PNG nel browser con l'intestazione di NFR-50 (non in audit); CSV e XLSX = GET /api/procedurale/domande-ammesse/{formato} |
| card Domande ammesse e con atto di concessione per intervento | PNG, CSV, XLSX | come sopra |
| tabella Domande ammesse per intervento | CSV, XLSX | lo stesso file: una riga per intervento (perimetro, attivato, ammesse, con atto, richiesto, ammesso) e la riga dei totali |

Stessi filtri della pagina, header X-Requested-With, registrati in AUDIT_ESPORTAZIONE; un dato assente porta nella cella il
motivo e la fonte attesa (FONTE_NON_ATTIVA ATTO_CONCESSIONE, NON_VALORIZZATO).

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
- Download: un pulsante per formato con la sigla visibile e il nome accessibile completo (WCAG 2.5.3), aria-disabled
  durante la preparazione col focus sul pulsante (WCAG 2.4.3), esito in role=status, errore in role=alert col motivo.

## Punti aperti che toccano questo flusso

- OP-PR-06: profili misti: il report e' ADA, l'elenco aperto dai link e' regionale.
- OP-PR-08: regole del drill-down.
- Chiusi col giro G3 e con G1 (22/10/2026): OP-PR-01 (pill "Dati al"), OP-PR-04 (la card della Home dira' "domande
  ammesse con atto e contributo", non piu' "determine, responsabili e ADA"), OP-PR-05 (CSV e XLSX di TX-0026).
