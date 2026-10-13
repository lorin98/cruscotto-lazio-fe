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

- /elenco-operativo/pagamenti: Shell > Barra filtri (chip rimovibili, perimetro) > Breadcrumb > Titolo > Pannello filtri
  (testo libero, decreto ed esito, filtri della domanda, conteggio dal vivo) > Sinottico (KPI x4 da TotaliPagamenti) >
  Tabella interattiva (ordinamento dal server, paginazione) + Totali dal server > Drawer di anteprima > Stati

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

## Filtri nell'URL (url_params)

Si applicano dal vivo (debounce, nessun "Applica"); sinottico e totali sono TotaliPagamenti sull'intero insieme filtrato;
durante l'aggiornamento restano i dati precedenti.

| pagina | parametro | fonte (operationId.parametro) | multiplo | obbligatorio |
|---|---|---|---|---|
| /elenco-operativo/pagamenti | decreto, esito | TX-0059.<parametro> | si' | no |
| /elenco-operativo/pagamenti | tipo, anno, annualita, intervento, os, og, op, azione, stato, statoProgrammazione, provincia, ente, pagamento | TX-0059.<parametro> | si' | no |
| /elenco-operativo/pagamenti | presentata, sigc, concessione, anomalie | TX-0059.<parametro> | no (true/false) | no |
| /elenco-operativo/pagamenti | richiestoDa, richiestoA, ammessoDa, ammessoA, pagatoDa, pagatoA, testo | TX-0059.<parametro> | no | no |
| /elenco-operativo/pagamenti | ordina, pagina, dimensione (1-100, predefinita 25) | TX-0059.<parametro> | no | no |

Esportazione: "Scarica CSV" e "Scarica XLSX" con gli stessi filtri e ordinamento (OP-EO-05).

## Stati resi (obbligatori)

- vuoto: messaggio azionabile con "Modifica i filtri" (mai schermo bianco)
- caricamento: scheletro di sinottico e righe, `role="status"` + `aria-live="polite"`
- aggiornamento (interrogazione): restano i dati precedenti, indicatore `role="status"`, mai la tabella vuota
- errore: `role="alert"`, discriminato sul problem-type `urn:cruscottocsr:problem:*` (400 criteri non validi con il campo;
  403; 503 con Retry-After; 504; 401/419 sessione)

## Note WCAG 2.2 (residuo manuale DICHIARATO)

- Meccanizzato a valle (step7/step8): tab-order, focus dopo route-change, focus-trap di pannello e
  drawer, axe (deferito a step8: il lint di step1 e' statico).
- Filtri dal vivo: conteggio del pannello `aria-live="polite"`; il cambio dei risultati non sposta il focus.
- Animazioni solo con classi CSS (150-700 ms), spente da `prefers-reduced-motion`.
- La riga di una domanda chiusa lo dice in testo (non solo col colore) e non offre il link al dettaglio.
- RESIDUO umano da verificare qui: ordine di lettura di sinottico, tabella e totali; etichette dei filtri; contrasto della
  resa finale (il low-fi non fa fede sul colore).

## Punti aperti che toccano questo flusso

- OP-EO-01: ultimo dato sincronizzato assente dai DTO dell'elenco.
- OP-EO-04: voce "Elenco operativo" nella Home e nel menu (layer app).
- OP-EO-05: esportazione CSV/XLSX.
