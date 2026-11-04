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

- /elenco-operativo/domande: Shell > Barra filtri (chip rimovibili, perimetro, pill "Dati al gg/mm/aaaa" con il
  dettaglio per flusso d'import) > Breadcrumb > Titolo > Viste per ambito >
  Pannello filtri (testo libero, gruppi a scomparsa, conteggio dal vivo) > Sinottico (KPI x8 + Card per stato (barre) +
  Card per intervento (barre)) > Tabella interattiva (colonne della vista, ordinamento dal server, paginazione) + Totali dal
  server > Drawer di anteprima > Stati

Comandi della pagina (come costruita): nel pannello "Azzera" e "Chiudi" (Chiudi o Esc applicano subito la scelta in
attesa), con l'avviso d'errore delle letture dentro il pannello aperto; nelle card dei grafici "Filtra per <voce>" per
voce nella vista Tabella; sopra la tabella l'ordinamento attivo in testo con "Ordine predefinito" (solo fuori
dall'ordine predefinito), "Scarica CSV", "Scarica XLSX" e "Colonne"; sotto la tabella la paginazione con "Righe per
pagina" (10, 25, 50, 100); "Vai all'ultima pagina" quando la pagina chiesta e' oltre l'ultima. I comandi che spariscono
col proprio clic ("Ordine predefinito", "Vai all'ultima pagina") e il cambio di pagina portano il focus sul titolo della
sezione dei risultati. Vista e colonne scelte restano tornando dalla scheda della domanda (non nell'indirizzo: OP-EO-02).

Viste per ambito (D-1: cambiano colonne e indicatori, non le righe; resa lato client, OP-EO-02):

| vista | colonne della tabella | indicatori del sinottico |
|---|---|---|
| generale (predefinita) | codice a barre, tipo, CUAA, denominazione, intervento, anno, stato SIAN, provincia, richiesto, ammesso, pagato | domande (sostegno/pagamento), presentate (SIGC), beneficiari, pagate/da pagare/senza importi, richiesto, ammesso, pagato, ancora da pagare |
| finanziario | codice a barre, denominazione, intervento, anno, prima annualita', SIGC, richiesto, ammesso, pagato, ancora da pagare, liquidato, recuperato | richiesto, ammesso, pagato, ancora da pagare (con le domande senza importo), liquidato, recuperato, quota pagata; card per anno di raccolta (barre) |
| procedurale | codice a barre, tipo, denominazione, intervento, stato SIAN, stato area programmazione, atto di concessione (numero e data), anomalie, ente delegato | domande, presentate, beneficiari; card per stato SIAN |
| fisico | codice a barre, denominazione, intervento, anno, superficie di sostegno, superficie di pagamento | domande, beneficiari; il DTO di sintesi non porta somme di superficie: nessun totale di superficie |
| istituzionale | codice a barre, tipo, denominazione, intervento, anno, prima annualita', provincia, ente delegato | domande, presentate, beneficiari; card per intervento |

La tessera "Pagate / da pagare / senza importi" mostra i tre numeri uno per riga, ciascuno con la sua voce ("36.846 pagate",
"31.595 da pagare", "3.191 senza importi"), anche con numeri grandi: mai su una riga sola che esce dalla tessera (richiesta
dell'utente del 02/11/2026). Sotto i numeri la nota "una domanda pagata in parte e' tra le pagate e tra le da pagare": i due
insiemi si sovrappongono (D-09 del backend, come nel finanziario) e non vanno sommati (decisione dell'utente del 02/11/2026).

Colonne ordinabili (elenco chiuso di TX-0056, D-04): codice a barre, tipo, CUAA, denominazione, intervento, anno, stato,
provincia, ente, richiesto, ammesso, pagato, ancora da pagare, liquidato. Le altre colonne non hanno il bottone di ordinamento.

## Grafici del flusso

| pagina | grafico | tipo | dati (transazione) | clic | valori assenti |
|---|---|---|---|---|---|
| /elenco-operativo/domande | Domande per stato SIAN | barre orizzontali | TX-0057 (perStato) | filtra l'elenco (aggiunge `stato`), anche la voce SENZA_STATO (domande senza stato SIAN: `stato=SENZA_STATO`); con `statoSostegno` o `statoPagamento` attivi nessun clic ne' "Filtra per" (in alternativa a `stato` allargherebbero l'insieme), e la card lo dice | ALTRI: barra a parte, nessun clic (il filtro `stato` non la accetta) |
| /elenco-operativo/domande | Domande per intervento | barre (zoom oltre 12 voci) | TX-0057 (perIntervento) | filtra l'elenco (aggiunge `intervento`) | voce ALTRI: non cliccabile |
| /elenco-operativo/domande | Domande per anno di raccolta (vista finanziario) | barre | TX-0057 (perAnno) | filtra l'elenco (aggiunge `anno`, SENZA compreso) | voce SENZA: "senza anno" |

## Link del flusso (drill-down dichiarati)

| pagina | link (id) | innesco | arrivo (feature: route) | parametri di path | query |
|---|---|---|---|---|---|
| /elenco-operativo/domande | dettaglio-domanda | "Apri il dettaglio" nell'anteprima della riga | elenco-operativo: /elenco-operativo/domande/:tipo/:codiceABarre | tipo, codiceABarre | - |
| /elenco-operativo/domande | pagamenti-delle-domande | "Vedi i pagamenti di queste domande" | elenco-operativo: /elenco-operativo/pagamenti | - | i 27 filtri della domanda comuni ai due elenchi (tutti tranne pagina, dimensione, ordina) |

In arrivo dalla scheda della domanda (flusso dettaglio-domanda, link `torna-all-elenco`): "Torna all'elenco", la
briciola "Domande" e il link dell'avviso riportano qui con la ricerca di partenza (tutti gli url_params), la vista e le
colonne scelte. In arrivo da altre feature (RA003, D-3): i report del finanziario apriranno questa pagina con i loro
filtri (OP-EO-03).

## Filtri nell'URL (url_params)

Si applicano dal vivo (debounce, nessun "Applica"); sinottico e totali sono di SinotticoElenco sull'intero insieme
filtrato; durante l'aggiornamento restano i dati precedenti.

| pagina | parametro | fonte (operationId.parametro) | multiplo | obbligatorio |
|---|---|---|---|---|
| /elenco-operativo/domande | tipo, anno, annualita, intervento, os, og, op, azione, stato, statoProgrammazione, provincia, ente, pagamento | TX-0056.<parametro> | si' | no |
| /elenco-operativo/domande | statoSostegno, statoPagamento, voceProgrammazione (drill-down dai report procedurali: solo chip, nessun controllo nel pannello; statoSostegno e statoPagamento in alternativa a stato, voceProgrammazione a statoProgrammazione) | TX-0056.<parametro> | si' | no |
| /elenco-operativo/domande | presentata, sigc, concessione, anomalie | TX-0056.<parametro> | no (true/false) | no |
| /elenco-operativo/domande | richiestoDa, richiestoA, ammessoDa, ammessoA, pagatoDa, pagatoA | TX-0056.<parametro> | no | no |
| /elenco-operativo/domande | testo (3-100 caratteri: codice a barre o CUAA per inizio, denominazione per contenuto) | TX-0056.testo | no | no |
| /elenco-operativo/domande | ordina, pagina, dimensione (10, 25, 50 o 100: le scelte di "Domande per pagina"; predefinita 25) | TX-0056.<parametro> | no | no |

In tutto 27 filtri della domanda (le righe sopra tranne ordina, pagina e dimensione), gli stessi dei link fra i due
elenchi. Gli importi si scrivono all'italiana (10.000, 1.500,50) e il campo resta come scritto; un valore non valido
(testo sotto i 3 caratteri, importo non leggibile, "Fino a" minore di "Da") lo dice accanto al campo e non parte.

Esportazione: "Scarica CSV" e "Scarica XLSX" con gli stessi filtri e ordinamento, tutte le righe (OP-EO-05; oltre il limite
di NFR-06 il backend rifiuta e il messaggio invita a restringere i filtri).

## Stati resi (obbligatori)

- vuoto: messaggio azionabile con "Modifica i filtri" (mai schermo bianco)
- caricamento: scheletro di sinottico e righe, `role="status"` + `aria-live="polite"`
- aggiornamento (interrogazione): restano i dati precedenti, indicatore `role="status"`, mai la tabella vuota; sinottico
  e tabella con `aria-busy`, il piede senza le somme dei criteri precedenti, il conteggio del pannello "Conteggio in
  corso..." finche' non e' dei filtri correnti
- pagina oltre l'ultima: lo dice al posto della tabella, con "Vai all'ultima pagina"
- errore: `role="alert"`, discriminato sul problem-type `urn:cruscottocsr:problem:*` (400 criteri non validi con il campo;
  403 accesso negato; 503 capacita' esaurita, ritentata rispettando Retry-After; 504 tempo scaduto; 401/419 sessione); un
  solo avviso per la pagina, i chip restano; col pannello aperto l'avviso e' anche nel pannello

## Note WCAG 2.2 (residuo manuale DICHIARATO)

- Meccanizzato a valle (step7/step8): tab-order, focus dopo route-change, focus-trap di pannello e
  drawer, tabella equivalente di ogni grafico, axe (deferito a step8: il lint di step1 e' statico).
- Filtri dal vivo: il conteggio del pannello e' `aria-live="polite"`; il cambio dei risultati non sposta il focus.
- Il focus non finisce mai sul body: "Ordine predefinito", "Vai all'ultima pagina" e il cambio di pagina lo portano
  sull'h2 della sezione dei risultati; la riga della tabella di un grafico ha la chiave della voce (dopo "Filtra per" il
  focus resta sul comando); "Domande per pagina" non sposta il focus dalla select.
- Il filtro aggiunto da un grafico si annuncia in una regione `role="status"`, anche ripetuto, e l'annuncio si spegne
  quando il chip si toglie.
- Animazioni solo con classi CSS (150-700 ms), spente da `prefers-reduced-motion`; i numeri che scorrono espongono
  subito il valore finale al lettore di schermo.
- Intestazioni ordinabili come bottoni con lo stato dell'ordinamento annunciato; righe apribili con Invio oltre che col clic.
- RESIDUO umano da verificare qui: ordine di lettura di sinottico, tabella e totali; didascalie dei grafici; etichette
  comprensibili dei filtri; contrasto della resa finale (il low-fi non fa fede sul colore).

## Punti aperti che toccano questo flusso

- OP-EO-02: la vista per ambito non entra nell'indirizzo (nessun parametro nella spec); tornando dalla scheda vista e
  colonne scelte restano (state della cronologia).
- OP-EO-03: i link dai report del finanziario arrivano col refresh di quella feature.
- OP-EO-04: voce "Elenco operativo" nella Home e nel menu (layer app).
- OP-EO-05: esportazione CSV/XLSX.

## Revisioni del 31/10/2026 (MIN-20261031, scelte dell'utente del 01/11/2026)

### Natura delle card col filtro SIGC

| pagina | elementi | natura |
|---|---|---|
| /elenco-operativo/domande | sinottico, grafici e tabella | misto: il filtro c'era gia'; ora seleziona le domande degli interventi SIGC o NO SIGC (D-12 del backend), la colonna SIGC della domanda resta per domanda |

### Modifiche del flusso

- Filtro SIGC: dal pannello ("Solo SIGC", "Non SIGC") alla barra comune "Tutti | SIGC | NO SIGC", con lo stesso parametro
  `sigc`; ora seleziona le domande degli interventi classificati SIGC o NO SIGC (D-12 del backend). La colonna SIGC della
  riga e il "di cui SIGC" del sinottico restano per domanda (presenza ASR2-08/ASR2-20): i due numeri possono differire.
- R09: sinottici con importi in formato compatto su una riga (oggi euro pieni). R02: tutte le etichette degli stati SIAN.

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
- **Tabelle medio-grandi (R12)**: intestazione ferma scorrendo, riquadro alto quanto la finestra, 25 domande per pagina,
  prima colonna ferma nelle tabelle larghe.
- **Ciambelle (R05, R06)**: importo e percentuale nelle etichette, totale al centro.

## Revisioni del 04/11/2026 (secondo feedback di Leonardo/Deloitte, decisioni dell'utente)

- "Domande per pagina" e "Clic o Invio su una domanda", come nell'elenco dei pagamenti.
- Paginazione: "Domande per pagina" anche nel wireframe (prima "Righe per pagina") e il totale al singolare con un solo risultato ("1 domanda"): review step9 del 04/11/2026 (J-17, J-20).
