# Flusso determine - wireframe v2 (feature fisico)

> Doc del gate umano PER FLUSSO. L'approvazione e' content-addressed sull'INTERA dir
> del flusso (`wireframes/fisico/determine/`, hash da `wireframe-hash.sh`): modificare un file qui invalida
> l'approvazione del flusso (e solo di questo flusso).

Rivisto il 22/10/2026: contratto del giro G3 del backend (TX-0020 invariata: niente export ne' ultimo dato sincronizzato,
D-01 Rev. 3 e D-06 di fisico) e decisione G1 dell'utente del 21/10/2026 (la card Fisico della Home elenca superfici e
determine; la pagina resta nella feature della sua slice, nel menu Fisico).

## Route del flusso

| route | kind | pattern | grant (verbatim dal catalogo) |
|---|---|---|---|
| /fisico/determine/:codice? | dettaglio | dettaglio v2 (modulo di ricerca, testata, KPI, tabella) | csr.tx-0020.read |

Profili con il grant (catalogo): p1-dirigente, p2-referente-adg, p3-funzionario-area-fis, p5-amministratore-funzionale.
P4, P6, P7 e i P3 delle altre aree non lo hanno (la SR elenca anche P6 e P7 in RF020: fa fede il catalogo approvato).

Il segmento `:codice` e' facoltativo (react-router: `:codice?`): senza codice (`/fisico/determine`, la voce di menu) la pagina
mostra solo il modulo di ricerca e lo stato "senza codice", senza letture; con il codice legge TX-0020
(`GET /api/fisico/domande/{codice}/determina`). Una sola route, un solo pattern: lo stato senza codice e' lo stato vuoto del
dettaglio. Alternativa, se si preferisce: due route (`/fisico/determine` e `/fisico/determine/:codice`) nello stesso flusso.

## Component tree (per pagina)

Vocabolario del kit UI v2 (ADR 0027 di green-fe), lo stesso della scheda della domanda dell'elenco operativo.

- /fisico/determine/:codice?: Shell > Breadcrumb > Card "Cerca le determine di una domanda" (modulo role=search: codice a
  barre, Cerca) > Testata (tipo della domanda, corrente o chiusa, numero di determine, "Apri la scheda della domanda") >
  KPI x4 (determina corrente, determine con riga aperta, da dove vengono stato area programmazione e comparto) > Card
  tabella "Determine con riga aperta" > Stati

Niente barra dei filtri, pill "Dati al" e download: TX-0020 non ha parametri di query, non porta `ultimiDatiSincronizzati`
e non ha un endpoint di export (il backend li ha dati ai soli report: TX-0020 e' una scheda, come TX-0058 dell'elenco, che
non porta l'ultimo dato). Nessun campo nuovo rispetto al 21/10.

## Grafici del flusso

Nessun grafico: la risposta e' un elenco breve di determine (codice, data e due indicatori si/no), che la tabella rende
meglio di qualunque tipo del catalogo; i KPI riassumono la corrente e la fonte dei due campi.

| pagina | grafico | tipo | dati (transazione) | clic | valori assenti |
|---|---|---|---|---|---|
| /fisico/determine/:codice? | nessuno | - | TX-0020 | - | determina corrente assente: motivo NON_VALORIZZATO detto in testo, elenco vuoto |

## Link del flusso (drill-down dichiarati)

| pagina | link (id) | innesco | arrivo (feature: route) | parametri di path | query |
|---|---|---|---|---|---|
| /fisico/determine/:codice? | cerca-domanda | Cerca nel modulo (anche dallo stato senza codice) | fisico: /fisico/determine/:codice? | codice (sole cifre del testo scritto) | - |
| /fisico/determine/:codice? | scheda-domanda | "Apri la scheda della domanda" nella testata | elenco-operativo: /elenco-operativo/domande/:tipo/:codiceABarre | tipo = tipoDomanda, codiceABarre = codiceABarre della risposta | - |

`scheda-domanda` si vede solo con il grant csr.tx-0058.read (gate di UX: tutti i profili con csr.tx-0020.read lo hanno) e
con la domanda non chiusa (`domandaChiusa` falso): la scheda dell'elenco risponde 404 per le domande chiuse. La domanda e'
la stessa (tipo e codice dalla risposta), non un insieme da riprodurre coi filtri. Il passaggio inverso, dalla scheda
dell'elenco a questa pagina, lo dichiarerebbe la feature elenco-operativo (OP-FIS-08).

## Filtri nell'URL (url_params)

Nessun parametro di query: TX-0020 ha solo il codice a barre, nel path.

| pagina | parametro | fonte (operationId.parametro) | multiplo | obbligatorio |
|---|---|---|---|---|
| /fisico/determine/:codice? | nessuno (codice nel path) | - | - | - |

## Stati resi (obbligatori)

- senza codice (vuoto iniziale): "Scrivi il codice a barre di una domanda..." e il solo modulo, nessuna lettura
- vuoto: determina corrente null con motivo NON_VALORIZZATO ed elenco vuoto: "Nessuna determina aperta per la domanda ...
  (non valorizzato)", mai una tabella vuota senza spiegazione
- domanda chiusa: badge in testo "Domanda chiusa: non e' piu' nelle fonti SIAN", niente link alla scheda; determine visibili
- caricamento: scheletro di testata, riquadri e tabella, `role="status"` + `aria-live="polite"`
- errore: `role="alert"`, discriminato sul problem-type `urn:cruscottocsr:problem:*` (404 NOT_FOUND nessuna domanda con quel
  codice; 400 DATO_NON_VALIDO codice senza cifre, detto sotto il campo; 403 ACCESSO_NEGATO; 429 TROPPE_RICHIESTE e 503
  CAPACITA_ESAURITA o TEMPO_SCADUTO ritentati rispettando Retry-After; 401/419 sessione)

## Note WCAG 2.2 (residuo manuale DICHIARATO)

- Meccanizzato a valle (step7/step8): tab-order, focus sul titolo dopo il cambio di route e dopo una ricerca, axe (nel lint
  di step1: axe deferito a step8, bloccante nel gate 11/11).
- Modulo di ricerca con role=search, label esplicita, aiuto collegato (aria-describedby) e messaggio d'errore collegato al
  campo per un codice senza cifre.
- RESIDUO umano da verificare qui: ordine di lettura di modulo, testata, KPI e tabella; comprensibilita' di "stato area
  programmazione", "comparto" e "determina corrente"; contrasto della resa finale (il low-fi non fa fede sul colore).
- Le colonne si/no e la determina corrente sono dette in testo, non solo con icone o colore.

## Punti aperti che toccano questo flusso

- OP-FIS-06: risolto il 22/10/2026 con G1: la pagina sta nel menu Fisico e nella card Fisico della Home (la card
  Procedurale non cita piu' le determine); lo allinea lo step6.
- OP-FIS-07: voce di menu "Determine di una domanda" (/fisico/determine) nel layer app/ allo step6.
- OP-FIS-08: link dalla scheda della domanda dell'elenco operativo verso questa pagina (refresh della feature elenco-operativo).
- Audit (D-04 del backend, informativo): il registro conserva chi, quando ed esito della lettura, non quale domanda (il
  codice a barre e' sostituito dal segnaposto della regola comune NFR-84).
