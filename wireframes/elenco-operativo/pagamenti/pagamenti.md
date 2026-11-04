# Flusso pagamenti - wireframe v2 (feature elenco-operativo)

> Doc del gate umano PER FLUSSO. L'approvazione e' content-addressed sull'INTERA dir
> del flusso (`wireframes/elenco-operativo/pagamenti/`; hash da `wireframe-hash.sh`): modificare un file qui
> invalida l'approvazione del flusso (e solo di questo flusso).

## Route del flusso

| route | kind | pattern | grant (verbatim dal catalogo) |
|---|---|---|---|
| /elenco-operativo/pagamenti | interrogazione | interrogazione v2 (filtri dal vivo, sinottico sopra, tabella paginata dal server, totali sotto, anteprima) | csr.tx-0059.read, csr.tx-0060.read |

Scoping: `territoriale-ada`. Una riga per ogni riga corrente degli elenchi di liquidazione (esito PAGATA o ESCLUSA) delle
domande nel perimetro, anche se la domanda e' chiusa (D-07).

## Component tree (per pagina)

- /elenco-operativo/pagamenti: Shell > Barra filtri (chip rimovibili, perimetro, pill "Dati al gg/mm/aaaa" con il
  dettaglio per flusso d'import) > Breadcrumb > Titolo > Pannello filtri
  (testo libero, decreto ed esito, filtri della domanda, conteggio dal vivo) > Sinottico (KPI x4 da TotaliPagamenti) >
  Tabella interattiva (ordinamento dal server, paginazione) + Totali dal server > Drawer di anteprima > Stati

Comandi della pagina (come costruita, gli stessi dell'elenco delle domande): nel pannello "Azzera" e "Chiudi" con
l'avviso d'errore delle letture dentro il pannello aperto; sopra la tabella l'ordinamento attivo in testo con "Ordine
predefinito", "Scarica CSV", "Scarica XLSX" e "Colonne"; sotto la paginazione con "Righe per pagina" (10, 25, 50, 100);
"Vai all'ultima pagina" quando la pagina chiesta e' oltre l'ultima. Il focus dopo i comandi che spariscono col proprio
clic va sul titolo della sezione delle righe. Le colonne scelte restano tornando dalla scheda della domanda.

Colonne: decreto, data di autorizzazione, codice a barre, CUAA, denominazione, intervento, esito (con "domanda chiusa" in
testo quando `domandaCorrente` e' falso), decretato, pagato; a scelta dal bottone Colonne: protocollo, tipologia di elenco e
di pagamento, tipo di domanda, quote FEASR, nazionale e regionale, motivi di esclusione. Ordinabili (D-04): decreto, data di
autorizzazione, codice a barre, denominazione, intervento, pagato, decretato.

## Grafici del flusso

Nessun grafico: il sinottico e' fatto di quattro indicatori (righe pagate ed escluse, decretato con le righe senza importo,
pagato, quote di finanziamento).

| pagina | grafico | tipo | dati (transazione) | clic | valori assenti |
|---|---|---|---|---|---|
| /elenco-operativo/pagamenti | - | - | - | - | importi assenti dichiarati col motivo, mai a zero |

## Link del flusso (drill-down dichiarati)

| pagina | link (id) | innesco | arrivo (feature: route) | parametri di path | query |
|---|---|---|---|---|---|
| /elenco-operativo/pagamenti | dettaglio-domanda-del-pagamento | "Apri la domanda" nell'anteprima, solo se `domandaCorrente` e' vero | elenco-operativo: /elenco-operativo/domande/:tipo/:codiceABarre | tipo (= tipoDomanda), codiceABarre | - |
| /elenco-operativo/pagamenti | domande-dei-pagamenti | "Vedi le domande di questi pagamenti" | elenco-operativo: /elenco-operativo/domande | - | i 27 filtri della domanda comuni ai due elenchi |

In arrivo dalla scheda della domanda aperta da questa pagina (flusso dettaglio-domanda, link
`torna-all-elenco-dei-pagamenti`): "Torna all'elenco", la briciola "Pagamenti" e il link dell'avviso riportano qui con la
ricerca di partenza (tutti gli url_params) e le colonne scelte.

## Filtri nell'URL (url_params)

Si applicano dal vivo (debounce, nessun "Applica"); sinottico e totali sono TotaliPagamenti sull'intero insieme filtrato;
durante l'aggiornamento restano i dati precedenti.

| pagina | parametro | fonte (operationId.parametro) | multiplo | obbligatorio |
|---|---|---|---|---|
| /elenco-operativo/pagamenti | decreto, esito | TX-0059.<parametro> | si' | no |
| /elenco-operativo/pagamenti | tipo, anno, annualita, intervento, os, og, op, azione, stato, statoProgrammazione, provincia, ente, pagamento | TX-0059.<parametro> | si' | no |
| /elenco-operativo/pagamenti | statoSostegno, statoPagamento, voceProgrammazione (drill-down dai report procedurali: solo chip, nessun controllo nel pannello; statoSostegno e statoPagamento in alternativa a stato, voceProgrammazione a statoProgrammazione) | TX-0059.<parametro> | si' | no |
| /elenco-operativo/pagamenti | presentata, sigc, concessione, anomalie | TX-0059.<parametro> | no (true/false) | no |
| /elenco-operativo/pagamenti | richiestoDa, richiestoA, ammessoDa, ammessoA, pagatoDa, pagatoA, testo | TX-0059.<parametro> | no | no |
| /elenco-operativo/pagamenti | ordina, pagina, dimensione (10, 25, 50 o 100: le scelte di "Righe per pagina"; predefinita 25) | TX-0059.<parametro> | no | no |

Oltre a decreto ed esito, i 27 filtri della domanda (le righe sopra tranne decreto, esito, ordina, pagina e dimensione),
gli stessi dei link fra i due elenchi. Importi scritti all'italiana (10.000, 1.500,50), il campo resta come scritto; un
valore non valido lo dice accanto al campo e non parte.

Esportazione: "Scarica CSV" e "Scarica XLSX" con gli stessi filtri e ordinamento (OP-EO-05).

## Stati resi (obbligatori)

- vuoto: messaggio azionabile con "Modifica i filtri" (mai schermo bianco)
- caricamento: scheletro di sinottico e righe, `role="status"` + `aria-live="polite"`
- aggiornamento (interrogazione): restano i dati precedenti, indicatore `role="status"`, mai la tabella vuota; il
  sinottico (stessa lettura delle righe) e la card delle righe con `aria-busy`, il conteggio del pannello "Conteggio in
  corso..." finche' non e' dei filtri correnti
- pagina oltre l'ultima: lo dice al posto della tabella, con "Vai all'ultima pagina"
- errore: `role="alert"`, discriminato sul problem-type `urn:cruscottocsr:problem:*` (400 criteri non validi con il campo;
  403; 503 con Retry-After; 504; 401/419 sessione); un solo avviso per la pagina, i chip restano; col pannello aperto
  l'avviso e' anche nel pannello

## Note WCAG 2.2 (residuo manuale DICHIARATO)

- Meccanizzato a valle (step7/step8): tab-order, focus dopo route-change, focus-trap di pannello e
  drawer, axe (deferito a step8: il lint di step1 e' statico).
- Filtri dal vivo: conteggio del pannello `aria-live="polite"`; il cambio dei risultati non sposta il focus.
- Il focus non finisce mai sul body: "Ordine predefinito", "Vai all'ultima pagina" e il cambio di pagina lo portano
  sull'h2 della sezione delle righe; "Righe per pagina" non sposta il focus dalla select.
- Animazioni solo con classi CSS (150-700 ms), spente da `prefers-reduced-motion`.
- La riga di una domanda chiusa lo dice in testo (non solo col colore) e non offre il link al dettaglio.
- RESIDUO umano da verificare qui: ordine di lettura di sinottico, tabella e totali; etichette dei filtri; contrasto della
  resa finale (il low-fi non fa fede sul colore).

## Punti aperti che toccano questo flusso

- OP-EO-04: voce "Elenco operativo" nella Home e nel menu (layer app).
- OP-EO-05: esportazione CSV/XLSX.

## Revisioni del 31/10/2026 (MIN-20261031, scelte dell'utente del 01/11/2026)

### Natura delle card col filtro SIGC

| pagina | elementi | natura |
|---|---|---|
| /elenco-operativo/pagamenti | sinottico e tabella | misto, come le domande |

### Modifiche del flusso

- Filtro SIGC: dal pannello ("Solo SIGC") alla barra comune "Tutti | SIGC | NO SIGC" (stesso parametro `sigc`, ora per
  intervento, D-12 del backend).
- R09: importi del sinottico in formato compatto su una riga.

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

- Nei testi non si usa "riga/righe" per i pagamenti: "pagamenti" ed "Elenco dei pagamenti" (titolo della sezione, sinottico "Pagamenti: pagati / esclusi", conteggi, totale, "Pagamenti per pagina", anteprima, nota dei file, filtro vuoto).
- "Ordinati per Pagato, decrescente" (concordato con "pagamenti"), aggiunta dopo l'approvazione delle 14:36Z: flusso da riapprovare.
