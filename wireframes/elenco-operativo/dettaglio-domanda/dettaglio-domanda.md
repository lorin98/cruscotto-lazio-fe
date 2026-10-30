# Flusso dettaglio-domanda - wireframe v2 (feature elenco-operativo)

> Doc del gate umano PER FLUSSO. L'approvazione e' content-addressed sull'INTERA dir
> del flusso (`wireframes/elenco-operativo/dettaglio-domanda/`; hash da `wireframe-hash.sh`): modificare un file qui
> invalida l'approvazione del flusso (e solo di questo flusso).

Rivisto il 30/10/2026 per il riallineamento degli ambiti (decisioni A-1 e A-3 dell'utente del 29/10/2026, MIN-20261029;
pack 1.4.0, catalogo rev. 4): le determine di una domanda (TX-0020) sono del procedurale. Si aggiunge un solo link, dalla
scheda Determine alla pagina "Determine di una domanda" del procedurale (OP-EO-07, gia' OP-FIS-08 del fisico); il resto
della scheda non cambia.

## Route del flusso

| route | kind | pattern | grant (verbatim dal catalogo) |
|---|---|---|---|
| /elenco-operativo/domande/:tipo/:codiceABarre | dettaglio | dettaglio v2 (testata, KPI, schede) | csr.tx-0058.read |

Scoping: `territoriale-ada`. Una domanda inesistente, chiusa o fuori dal perimetro del chiamante risponde 404 NOT_FOUND
con lo stesso corpo (D-06): la pagina non distingue i tre casi.

## Component tree (per pagina)

- /elenco-operativo/domande/:tipo/:codiceABarre: Shell > Breadcrumb (Home > Elenco operativo > Domande o Pagamenti,
  l'elenco di partenza > Domanda) > Testata di dettaglio (tipo e codice a barre,
  intervento, h1 = denominazione o codice a barre se assente, badge CUAA, stato SIAN, area programmazione, SIGC, anno e
  annualita', perimetro) > KPI x4 (richiesto, ammesso, pagato, ancora da pagare) > Schede: Sintesi (dati della domanda +
  Card dall'ammesso al pagato (cascata)) | Domande collegate | Determine | Pagamenti | Recuperi | Anomalie > Stati

Una sola lettura (TX-0058) alimenta tutte le schede; il numero fra parentesi nelle etichette delle schede e' la lunghezza
delle liste del DTO.

## Grafici del flusso

| pagina | grafico | tipo | dati (transazione) | clic | valori assenti |
|---|---|---|---|---|---|
| /elenco-operativo/domande/:tipo/:codiceABarre | Dall'ammesso al pagato | cascata | TX-0058 (domanda.ammesso, pagato, ancoraDaPagare) | nessuno | senza ammesso o pagato il grafico non si disegna: resta la tabella con il motivo |

## Link del flusso (drill-down dichiarati)

| pagina | link (id) | innesco | arrivo (feature: route) | parametri di path | query |
|---|---|---|---|---|---|
| /elenco-operativo/domande/:tipo/:codiceABarre | domanda-collegata | clic sul codice a barre nella scheda "Domande collegate" | elenco-operativo: /elenco-operativo/domande/:tipo/:codiceABarre | tipo, codiceABarre | - |
| /elenco-operativo/domande/:tipo/:codiceABarre | domande-del-beneficiario | "Altre domande del beneficiario" (testo = CUAA; assente se il CUAA manca) | elenco-operativo: /elenco-operativo/domande | - | testo |
| /elenco-operativo/domande/:tipo/:codiceABarre | torna-all-elenco | "Torna all'elenco", la briciola "Domande" o il link dell'avviso, con la scheda aperta dall'elenco delle domande (senza ricerca di partenza: l'elenco senza filtri) | elenco-operativo: /elenco-operativo/domande | - | gli url_params dell'elenco delle domande (la ricerca di partenza) |
| /elenco-operativo/domande/:tipo/:codiceABarre | torna-all-elenco-dei-pagamenti | "Torna all'elenco", la briciola "Pagamenti" o il link dell'avviso, con la scheda aperta dall'elenco dei pagamenti | elenco-operativo: /elenco-operativo/pagamenti | - | gli url_params dell'elenco dei pagamenti (la ricerca di partenza) |
| /elenco-operativo/domande/:tipo/:codiceABarre | determine-della-domanda | "Apri le determine della domanda nell'area Procedurale" sotto la tabella della scheda Determine (solo con csr.tx-0020.read) | procedurale: /procedurale/determine/:codice? | codice = codiceABarre della scheda | - |

Il link determine-della-domanda porta alle determine del codice a barre della scheda, non a un insieme da riprodurre coi
filtri. TX-0020 ha solo il codice e sceglie la domanda con la regola dell'aggancio: se lo stesso codice e' anche di una
domanda dell'altro tipo (SOSTEGNO e PAGAMENTO, scenario SC-PC_DETERMINA_TIPO) puo' mostrare quella. Per questo il link
porta il tipo della scheda nello state della navigazione (mai nell'indirizzo) e la pagina delle determine avvisa quando
la domanda mostrata e' dell'altro tipo, con il ritorno a questa scheda (decisione D1 dell'utente del 30/10/2026, review
step9 EO-01). Lo vedono i profili con csr.tx-0020.read (p1-dirigente, p2-referente-adg,
p3-funzionario-area-pro, p4-responsabile-procedimento-ada sul proprio perimetro); la scheda e' gia' nel perimetro del
P4, quindi l'arrivo non risponde 404. Finche' il flusso determine del procedurale non e' approvato il link non si rende
(OP-EO-07).

In arrivo: dalle anteprime dell'elenco delle domande (`dettaglio-domanda`) e dell'elenco dei pagamenti
(`dettaglio-domanda-del-pagamento`, solo per le domande correnti) e dalla pagina delle determine del procedurale
(`scheda-domanda`, solo per le domande non chiuse). Il ritorno porta all'elenco di partenza con la sua
query, la vista per ambito e le colonne scelte (state della cronologia, mai la cronologia stessa: solo un indirizzo dei
due elenchi); una domanda collegata aperta dalla scheda porta con se' la stessa ricerca di partenza.

## Filtri nell'URL (url_params)

Nessuno: la pagina e' identificata dai parametri di path `tipo` (SOSTEGNO, PAGAMENTO) e `codiceABarre` (cifre), gli stessi
della spec di TX-0058.

## Stati resi (obbligatori)

- vuoto: per scheda (es. "Nessuna anomalia presente per questa domanda"); la pagina non ha uno stato vuoto
- caricamento: scheletro della testata e delle card, `role="status"` + `aria-live="polite"`
- errore: `role="alert"`, discriminato sul problem-type `urn:cruscottocsr:problem:*` (404 domanda non disponibile, stesso
  messaggio per inesistente, chiusa e fuori perimetro; 400 tipo o codice a barre non validi; 403; 503 con Retry-After; 504;
  401/419 sessione); il 404 e il riferimento non valido hanno il link "Torna all'elenco" verso l'elenco di partenza. Un
  riferimento non valido nel percorso (tipo fuori contratto, codice non di sole cifre, separatori codificati anche due
  volte) non fa nessuna lettura

## Note WCAG 2.2 (residuo manuale DICHIARATO)

- Meccanizzato a valle (step7/step8): tab-order, focus sul titolo dopo il cambio di route, schede con frecce da tastiera,
  tabella equivalente del grafico, axe (deferito a step8: il lint di step1 e' statico).
- Un solo h1 (denominazione del beneficiario o, se assente, il codice a barre).
- Ogni tabella delle schede ha caption e intestazioni con scope; importi allineati a destra, assenti dichiarati col
  motivo, mai a zero.
- RESIDUO umano da verificare qui: ordine di lettura della testata, comprensibilita' dei badge di stato, contrasto della
  resa finale (il low-fi non fa fede sul colore).
- Il link alle determine dice nel testo dove porta, area compresa ("nell'area Procedurale"): scopo del link chiaro dal
  solo testo (WCAG 2.4.4) e cambio di area annunciato prima del clic.

## Punti aperti che toccano questo flusso

- OP-EO-07: link determine-della-domanda verso il procedurale, reso solo dopo l'approvazione del flusso determine del
  procedurale.
- OP-EO-04 (voce nel menu) riguarda tutta la feature.
