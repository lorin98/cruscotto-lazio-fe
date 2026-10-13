# Flusso domande - wireframe v2 (feature elenco-operativo)

> Doc del gate umano PER FLUSSO. L'approvazione e' content-addressed sull'INTERA dir
> del flusso (`wireframes/elenco-operativo/domande/`; hash da `wireframe-hash.sh`): modificare un file qui
> invalida l'approvazione del flusso (e solo di questo flusso).

## Route del flusso

| route | kind | pattern | grant (verbatim dal catalogo) |
|---|---|---|---|
| /elenco-operativo/domande | interrogazione | interrogazione v2 (filtri dal vivo, sinottico sopra, tabella paginata dal server, totali sotto, anteprima) | csr.tx-0056.read, csr.tx-0057.read, csr.tx-0060.read |

Scoping: `territoriale-ada` (P4 vede solo le domande del proprio perimetro ADA, non rimovibile; la pillola del
perimetro viene da `perimetro` della risposta). Tutti i profili P1-P7 hanno i tre grant (D-7 del MIN del 12/10/2026).

## Component tree (per pagina)

Vocabolario del kit UI v2 (ADR 0027) e pattern interrogazione (ADR 0029).

- /elenco-operativo/domande: Shell > Barra filtri (chip rimovibili, perimetro) > Breadcrumb > Titolo > Viste per ambito >
  Pannello filtri (testo libero, gruppi a scomparsa, conteggio dal vivo) > Sinottico (KPI x8 + Card per stato (barre) +
  Card per intervento (barre)) > Tabella interattiva (colonne della vista, ordinamento dal server, paginazione) + Totali dal
  server > Drawer di anteprima > Stati

Viste per ambito (D-1: cambiano colonne e indicatori, non le righe; resa lato client, OP-EO-02):

| vista | colonne della tabella | indicatori del sinottico |
|---|---|---|
| generale (predefinita) | codice a barre, tipo, CUAA, denominazione, intervento, anno, stato SIAN, provincia, richiesto, ammesso, pagato | domande (sostegno/pagamento), presentate (SIGC), beneficiari, pagate/da pagare/senza importi, richiesto, ammesso, pagato, ancora da pagare |
| finanziario | codice a barre, denominazione, intervento, anno, prima annualita', SIGC, richiesto, ammesso, pagato, ancora da pagare, liquidato, recuperato | richiesto, ammesso, pagato, ancora da pagare (con le domande senza importo), liquidato, recuperato, quota pagata; card per anno di raccolta (barre) |
| procedurale | codice a barre, tipo, denominazione, intervento, stato SIAN, stato area programmazione, atto di concessione (numero e data), anomalie, ente delegato | domande, presentate, beneficiari; card per stato SIAN |
| fisico | codice a barre, denominazione, intervento, anno, superficie di sostegno, superficie di pagamento | domande, beneficiari; il DTO di sintesi non porta somme di superficie: nessun totale di superficie |
| istituzionale | codice a barre, tipo, denominazione, intervento, anno, prima annualita', provincia, ente delegato | domande, presentate, beneficiari; card per intervento |

Colonne ordinabili (elenco chiuso di TX-0056, D-04): codice a barre, tipo, CUAA, denominazione, intervento, anno, stato,
provincia, ente, richiesto, ammesso, pagato, ancora da pagare, liquidato. Le altre colonne non hanno il bottone di ordinamento.

## Grafici del flusso

| pagina | grafico | tipo | dati (transazione) | clic | valori assenti |
|---|---|---|---|---|---|
| /elenco-operativo/domande | Domande per stato SIAN | barre orizzontali | TX-0057 (perStato) | filtra l'elenco (aggiunge `stato`) | voci SENZA_STATO (domande senza stato SIAN) e ALTRI: barre a parte, nessun clic (il filtro `stato` non le accetta) |
| /elenco-operativo/domande | Domande per intervento | barre (zoom oltre 12 voci) | TX-0057 (perIntervento) | filtra l'elenco (aggiunge `intervento`) | voce ALTRI: non cliccabile |
| /elenco-operativo/domande | Domande per anno di raccolta (vista finanziario) | barre | TX-0057 (perAnno) | filtra l'elenco (aggiunge `anno`, SENZA compreso) | voce SENZA: "senza anno" |

## Link del flusso (drill-down dichiarati)

| pagina | link (id) | innesco | arrivo (feature: route) | parametri di path | query |
|---|---|---|---|---|---|
| /elenco-operativo/domande | dettaglio-domanda | "Apri il dettaglio" nell'anteprima della riga | elenco-operativo: /elenco-operativo/domande/:tipo/:codiceABarre | tipo, codiceABarre | - |
| /elenco-operativo/domande | pagamenti-delle-domande | "Vedi i pagamenti di queste domande" | elenco-operativo: /elenco-operativo/pagamenti | - | i 24 filtri della domanda comuni ai due elenchi (tutti tranne pagina, dimensione, ordina) |

In arrivo da altre feature (RA003, D-3): i report del finanziario apriranno questa pagina con i loro filtri (OP-EO-03).

## Filtri nell'URL (url_params)

Si applicano dal vivo (debounce, nessun "Applica"); sinottico e totali sono di SinotticoElenco sull'intero insieme
filtrato; durante l'aggiornamento restano i dati precedenti.

| pagina | parametro | fonte (operationId.parametro) | multiplo | obbligatorio |
|---|---|---|---|---|
| /elenco-operativo/domande | tipo, anno, annualita, intervento, os, og, op, azione, stato, statoProgrammazione, provincia, ente, pagamento | TX-0056.<parametro> | si' | no |
| /elenco-operativo/domande | presentata, sigc, concessione, anomalie | TX-0056.<parametro> | no (true/false) | no |
| /elenco-operativo/domande | richiestoDa, richiestoA, ammessoDa, ammessoA, pagatoDa, pagatoA | TX-0056.<parametro> | no | no |
| /elenco-operativo/domande | testo (3-100 caratteri: codice a barre o CUAA per inizio, denominazione per contenuto) | TX-0056.testo | no | no |
| /elenco-operativo/domande | ordina, pagina, dimensione (1-100, predefinita 25) | TX-0056.<parametro> | no | no |

Esportazione: "Scarica CSV" e "Scarica XLSX" con gli stessi filtri e ordinamento, tutte le righe (OP-EO-05; oltre il limite
di NFR-06 il backend rifiuta e il messaggio invita a restringere i filtri).

## Stati resi (obbligatori)

- vuoto: messaggio azionabile con "Modifica i filtri" (mai schermo bianco)
- caricamento: scheletro di sinottico e righe, `role="status"` + `aria-live="polite"`
- aggiornamento (interrogazione): restano i dati precedenti, indicatore `role="status"`, mai la tabella vuota
- errore: `role="alert"`, discriminato sul problem-type `urn:cruscottocsr:problem:*` (400 criteri non validi con il campo;
  403 accesso negato; 503 capacita' esaurita, ritentata rispettando Retry-After; 504 tempo scaduto; 401/419 sessione)

## Note WCAG 2.2 (residuo manuale DICHIARATO)

- Meccanizzato a valle (step7/step8): tab-order, focus dopo route-change, focus-trap di pannello e
  drawer, tabella equivalente di ogni grafico, axe (deferito a step8: il lint di step1 e' statico).
- Filtri dal vivo: il conteggio del pannello e' `aria-live="polite"`; il cambio dei risultati non sposta il focus.
- Animazioni solo con classi CSS (150-700 ms), spente da `prefers-reduced-motion`; i numeri che scorrono espongono
  subito il valore finale al lettore di schermo.
- Intestazioni ordinabili come bottoni con lo stato dell'ordinamento annunciato; righe apribili con Invio oltre che col clic.
- RESIDUO umano da verificare qui: ordine di lettura di sinottico, tabella e totali; didascalie dei grafici; etichette
  comprensibili dei filtri; contrasto della resa finale (il low-fi non fa fede sul colore).

## Punti aperti che toccano questo flusso

- OP-EO-01: ultimo dato sincronizzato assente dai DTO dell'elenco (campo additivo proposto verso il backend).
- OP-EO-02: la vista per ambito non entra nell'indirizzo (nessun parametro nella spec).
- OP-EO-03: i link dai report del finanziario arrivano col refresh di quella feature.
- OP-EO-04: voce "Elenco operativo" nella Home e nel menu (layer app).
- OP-EO-05: esportazione CSV/XLSX.
