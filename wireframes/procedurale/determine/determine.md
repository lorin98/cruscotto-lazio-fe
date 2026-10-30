# Flusso determine - wireframe v2 (feature procedurale)

> Doc del gate umano PER FLUSSO. L'approvazione e' content-addressed sull'INTERA dir
> del flusso (`wireframes/procedurale/determine/`, hash da `wireframe-hash.sh`): modificare un file qui invalida
> l'approvazione del flusso (e solo di questo flusso).

NUOVO il 30/10/2026 nella feature procedurale: riallineamento degli ambiti (MIN-20261029, A-1 e A-5: TX-0020 ha l'ambito
procedurale del suo requisito RF020). Portato dal flusso `determine` del fisico (git HEAD
`wireframes/fisico/determine/`, approvato il 22/10/2026) e adattato al contratto nuovo della slice procedurale (pack 1.4.0,
catalogo rev. 4): indirizzo `GET /api/procedurale/domande/{codice}/determina`, campo `perimetro` nella risposta, P4 sul
perimetro ADA con 404 uguale per la domanda fuori perimetro e per quella inesistente, menu e breadcrumb del procedurale.
Il vecchio indirizzo `/fisico/determine` non resta come alias (A-4). Restano come prima: nessun export, nessun ultimo dato
sincronizzato, link alla scheda della domanda nell'elenco operativo.

## Route del flusso

| route | kind | pattern | grant (verbatim dal catalogo) |
|---|---|---|---|
| /procedurale/determine/:codice? | dettaglio | dettaglio v2 (modulo di ricerca, testata, KPI, tabella) | csr.tx-0020.read |

Profili con il grant (catalogo rev. 4): p1-dirigente, p2-referente-adg, p3-funzionario-area-pro (regionali) e
p4-responsabile-procedimento-ada (SCOPED sul perimetro ADA, `territoriale-ada`). P5 non lo ha piu' (A-2), ne' il P3
dell'area fisica, P6, P7 e i P3 delle altre aree: 403 dal backend, la voce di menu non compare.

Il segmento `:codice` e' facoltativo (react-router: `:codice?`): senza codice (`/procedurale/determine`, la voce di menu) la
pagina mostra solo il modulo di ricerca e lo stato "senza codice", senza letture; con il codice legge TX-0020. Una sola
route, un solo pattern: lo stato senza codice e' lo stato vuoto del dettaglio (come approvato per il fisico il 22/10).

## Component tree (per pagina)

Vocabolario del kit UI v2 (ADR 0027 di green-fe), lo stesso della scheda della domanda dell'elenco operativo.

- /procedurale/determine/:codice?: Shell (menu Procedurale, voce "Determine di una domanda") > Breadcrumb (Home >
  Procedurale > Determine di una domanda > Domanda) > Card "Cerca le determine di una domanda" (modulo role=search: codice
  a barre, Cerca) > Testata (tipo della domanda, corrente o chiusa, numero di determine, perimetro, "Apri la scheda della
  domanda") > KPI x4 (determina corrente, determine con riga aperta, da dove vengono stato area programmazione e
  comparto) > Card tabella "Determine con riga aperta" > Stati

Niente barra dei filtri, pill "Dati al" e download: TX-0020 non ha parametri di query, non porta `ultimiDatiSincronizzati`
e non ha un endpoint di export (e' una scheda, come TX-0058 dell'elenco). Il perimetro, che nelle altre pagine del
procedurale sta nella barra dei filtri, qui e' un badge della testata, come nella scheda della domanda dell'elenco.

## Campi (provenance `spec`: `openapi-procedurale.json`)

| campo | schema | resa |
|---|---|---|
| codiceABarre, tipoDomanda, domandaChiusa | DetermineDomanda | titolo, badge del tipo, badge "Domanda chiusa" |
| perimetro (REGIONALE, ADA) | DetermineDomanda | badge "Perimetro: regionale" o "Perimetro: ADA, domande della tua area" |
| corrente.valore (codice, data), corrente.motivo | DeterminaCorrente, DeterminaDellaDomanda | KPI Determina corrente; NON_VALORIZZATO detto in testo |
| elenco[] (codice, data, fonteStatoAreaProgrammazione, fonteComparto) | DeterminaDellaDomanda | tabella, KPI "Determine con riga aperta" e i due KPI "da" |

## Grafici del flusso

Nessun grafico: la risposta e' un elenco breve di determine (codice, data e due indicatori si/no), che la tabella rende
meglio di qualunque tipo del catalogo; i KPI riassumono la corrente e la fonte dei due campi.

| pagina | grafico | tipo | dati (transazione) | clic | valori assenti |
|---|---|---|---|---|---|
| /procedurale/determine/:codice? | nessuno | - | TX-0020 | - | determina corrente assente: motivo NON_VALORIZZATO detto in testo, elenco vuoto |

## Link del flusso (drill-down dichiarati)

| pagina | link (id) | innesco | arrivo (feature: route) | parametri di path | query |
|---|---|---|---|---|---|
| /procedurale/determine/:codice? | cerca-domanda | Cerca nel modulo (anche dallo stato senza codice) | procedurale: /procedurale/determine/:codice? | codice (sole cifre del testo scritto) | - |
| /procedurale/determine/:codice? | scheda-domanda | "Apri la scheda della domanda" nella testata | elenco-operativo: /elenco-operativo/domande/:tipo/:codiceABarre | tipo = tipoDomanda, codiceABarre = codiceABarre della risposta | - |
| /procedurale/determine/:codice? | scheda-di-partenza | "Apri la scheda della domanda di <tipo>, scheda Determine" nell'avviso "domanda dell'altro tipo" | elenco-operativo: /elenco-operativo/domande/:tipo/:codiceABarre | tipo = tipo portato dal link della scheda (state), codiceABarre = codice cercato | - |

`scheda-domanda` si vede solo con il grant csr.tx-0058.read (gate di UX: tutti i profili con csr.tx-0020.read lo hanno; per
il P4 anche TX-0058 e' sul perimetro ADA, quindi la scheda della domanda trovata qui si apre) e con la domanda non chiusa
(`domandaChiusa` falso): la scheda dell'elenco risponde 404 per le domande chiuse. Il passaggio inverso, dalla scheda
dell'elenco a questa pagina, lo dichiara la feature elenco-operativo (`determine-della-domanda`, OP-EO-07).

In arrivo da `determine-della-domanda` (decisione D1 dell'utente del 30/10/2026, review step9 EO-01): il link porta il tipo
della scheda nello state della navigazione, mai nell'indirizzo. TX-0020 ha solo il codice a barre e sceglie la domanda con
la regola dell'aggancio (per prima la domanda con determine aperte), quindi un codice di due domande (SOSTEGNO e PAGAMENTO,
scenario SC-PC_DETERMINA_TIPO) puo' dare la domanda dell'altro tipo, anche quando la domanda di partenza non ha determine
aperte: se `tipoDomanda` della risposta e' diverso dal tipo portato dal link, la pagina lo dice in un avviso
`role="status"` sopra la testata, con un testo vero in ogni caso (decisione D4 dell'utente del 30/10/2026, review step9
passata 2), e offre il link `scheda-di-partenza` alla scheda della domanda di partenza aperta sulla scheda Determine
(elenco-operativo: /elenco-operativo/domande/:tipo/:codiceABarre, tipo = tipo portato dal link, codiceABarre = codice
cercato; visibile con csr.tx-0058.read). Il tipo si legge una volta sola all'arrivo: senza state (ricarica, Indietro o
Avanti del browser, indirizzo condiviso, ricerca dal modulo) o dopo un cambio d'utente nessun avviso.

## Filtri nell'URL (url_params)

Nessun parametro di query: TX-0020 ha solo il codice a barre, nel path.

| pagina | parametro | fonte (operationId.parametro) | multiplo | obbligatorio |
|---|---|---|---|---|
| /procedurale/determine/:codice? | nessuno (codice nel path) | - | - | - |

## Perimetro e domanda non trovata (P4)

- La risposta dichiara `perimetro`: REGIONALE per P1, P2, P3 dell'area procedurale e per chi ha anche uno di questi
  profili; ADA per il solo P4. La testata lo dice in un badge di testo (scelta di disegno 2 del dossier).
- Il P4 trova solo le domande della sua area; se lo stesso codice a barre e' di due domande, la scelta si fa fra quelle
  della sua area (D-11 del backend).
- Una domanda fuori dal perimetro del P4 risponde 404 NOT_FOUND con lo stesso corpo di una domanda inesistente (anche il
  P4 senza gruppi ADA riceve 404, mai 403): la pagina mostra lo stesso messaggio nei due casi, "Domanda non trovata:
  nessuna domanda con il codice a barre ... fra quelle che puoi consultare", e non distingue i casi in nessun modo
  (testo, stato, focus, tempi), cosi' non rivela l'esistenza di domande di altre aree.

## Stati resi (obbligatori)

- senza codice (vuoto iniziale): "Scrivi il codice a barre di una domanda..." e il solo modulo, nessuna lettura
- domanda dell'altro tipo (solo in arrivo dalla scheda dell'elenco con un tipo diverso da `tipoDomanda`): `role="status"`,
  "Il codice a barre N e' anche di una domanda di <tipo della risposta>: questa pagina mostra quella domanda, non la domanda
  di <tipo della scheda> da cui arrivi." con il link alla scheda di partenza
- vuoto: determina corrente null con motivo NON_VALORIZZATO ed elenco vuoto: "Nessuna determina aperta per la domanda ...
  (non valorizzato)", mai una tabella vuota senza spiegazione
- domanda chiusa: badge in testo "Domanda chiusa: non e' piu' nelle fonti SIAN", niente link alla scheda; determine visibili
- perimetro ADA: badge "Perimetro: ADA, domande della tua area" nella testata
- caricamento: scheletro di testata, riquadri e tabella, `role="status"` + `aria-live="polite"`
- domanda non trovata: 404 NOT_FOUND, `role="alert"`, stesso messaggio per inesistente e fuori perimetro, con "Cerca un
  altro codice" che porta il focus al campo
- errore: `role="alert"`, discriminato sul problem-type `urn:cruscottocsr:problem:*` (400 DATO_NON_VALIDO codice senza
  cifre o oltre 30, detto sotto il campo; 403 ACCESSO_NEGATO; 429 TROPPE_RICHIESTE e 503 CAPACITA_ESAURITA o TEMPO_SCADUTO
  ritentati rispettando Retry-After; 401/419 sessione)

## Note WCAG 2.2 (residuo manuale DICHIARATO)

- Meccanizzato a valle (step7/step8): tab-order, focus sul titolo dopo il cambio di route e dopo una ricerca, axe (nel lint
  di step1: axe deferito a step8, bloccante nel gate 11/11).
- Modulo di ricerca con role=search, label esplicita, aiuto collegato (aria-describedby) e messaggio d'errore collegato al
  campo per un codice senza cifre.
- Il perimetro e' un badge di testo ("Perimetro: ADA, domande della tua area"), non solo un colore (WCAG 1.4.1).
- RESIDUO umano da verificare qui: ordine di lettura di modulo, testata, KPI e tabella; comprensibilita' di "stato area
  programmazione", "comparto", "determina corrente" e del messaggio "fra quelle che puoi consultare"; contrasto della resa
  finale (il low-fi non fa fede sul colore).
- Le colonne si/no e la determina corrente sono dette in testo, non solo con icone o colore.

## Punti aperti che toccano questo flusso

- OP-PR-13: TX-0020 entra nel procedurale (riallineamento degli ambiti): voce di menu "Determine di una domanda"
  (/procedurale/determine, grant csr.tx-0020.read) e card Procedurale della Home allo step6; la route /fisico/determine
  esce senza alias.
- OP-PR-14: link dalla scheda della domanda dell'elenco operativo verso questa pagina (refresh della feature
  elenco-operativo, ex OP-FIS-08).
- OP-PR-06: profili misti; per TX-0020 il backend da' il perimetro regionale a chi ha anche un profilo non scoped col grant.
- Audit (informativo): il registro conserva chi, quando ed esito della lettura, non quale domanda (il codice a barre e'
  sostituito dal segnaposto della regola comune NFR-84); i 404 fuori perimetro e inesistente sono registrati uguali.
