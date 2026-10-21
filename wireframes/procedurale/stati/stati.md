# Flusso stati - wireframe v2 (feature procedurale)

> Doc del gate umano PER FLUSSO. L'approvazione e' content-addressed sull'INTERA dir
> `wireframes/procedurale/stati/` (hash da `wireframe-hash.sh`): modificare un file qui invalida
> l'approvazione del flusso (e solo di questo flusso).

## Route del flusso

| route | kind | pattern | grant (verbatim dal catalogo) |
|---|---|---|---|
| /procedurale/stati-sostegno | lista | lista v2 (KPI, card grafico, tabella interattiva, drawer) | csr.tx-0024.read, csr.tx-0025.read, csr.tx-0027.read |
| /procedurale/stati-pagamento | lista | lista v2 (KPI, card grafico, tabella interattiva, drawer) | csr.tx-0024.read, csr.tx-0025.read, csr.tx-0028.read |

TX-0027 e TX-0028 sono EQ con ui_hint list: pattern lista, con lo scoping territoriale-ada dichiarato nella pill del
perimetro (mai rimovibile). Due route separate (una per tipo di domanda), cosi' ogni pagina ha il suo grant, la sua voce
di menu e un indirizzo condivisibile; il passaggio fra le due e' nel menu, che conserva i filtri.

## Component tree (per pagina)

- /procedurale/stati-sostegno: Shell > Barra filtri > Breadcrumb > Titolo > KPI x2 (domande di sostegno, di cui non
  rilasciate) > Card Domande di sostegno per stato (barre impilate; interruttore Grafico | Tabella, vista iniziale Grafico;
  Scarica PNG) > Tabella interattiva per intervento e stato (cerca, Colonne, ordinamento, totali dal backend, paginazione)
  > Drawer di anteprima dell'intervento > Stati
- /procedurale/stati-pagamento: come sopra con TX-0028 (cinque stati CSR-DP)

## Grafici del flusso

| pagina | grafico | tipo | dati (transazione) | clic | valori assenti |
|---|---|---|---|---|---|
| /procedurale/stati-sostegno | Domande di sostegno per stato | barre orizzontali impilate (rilasciate, non rilasciate), undici voci di SR-01 nell'ordine del backend, poi gli altri stati | TX-0027 (totale) | filtra la tabella per intervento sulla voce (chip della pagina, non nell'URL); nella tabella equivalente link:elenco-stato-sostegno (elenco-operativo: /elenco-operativo/domande) | In compilazione con FONTE_NON_ATTIVA DOMANDE_IN_COMPILAZIONE: voce omessa e dichiarata, mai 0 |
| /procedurale/stati-pagamento | Domande di pagamento per stato | barre orizzontali impilate, cinque voci CSR-DP, poi gli altri stati | TX-0028 (totale) | come sopra; link:elenco-stato-pagamento | come sopra |

La tabella per intervento e' il contenuto principale della lista (una riga per intervento selezionato, righe complete nel DTO:
l'ordinamento e la ricerca sul client sono ammessi; i totali vengono dal campo totale del backend, mai sommati nel browser).
Gli altri stati (codici SIAN fuori catalogo, es. SOSPESA o l'estrazione a campione) hanno una colonna per codice in Colonne.

## Link del flusso (drill-down dichiarati)

| pagina | link (id) | innesco | arrivo (feature: route) | parametri di path | query |
|---|---|---|---|---|---|
| /procedurale/stati-sostegno | elenco-stato-sostegno | Apri nell'elenco su una voce della tabella equivalente | elenco-operativo: /elenco-operativo/domande | - | statoSostegno = nome della voce o codice dell'altro stato, voceProgrammazione = filtro stato + intervento, os, og, op |
| /procedurale/stati-sostegno | elenco-stato-sostegno-riga | Apri nell'elenco su una voce del drawer di un intervento | elenco-operativo: /elenco-operativo/domande | - | statoSostegno, voceProgrammazione = filtro stato, intervento della riga |
| /procedurale/stati-sostegno | dettaglio-intervento-stati-sostegno | Apri il dettaglio dal drawer | procedurale: /procedurale/interventi/:codice | codice | stato |
| /procedurale/stati-pagamento | elenco-stato-pagamento | Apri nell'elenco su una voce della tabella equivalente | elenco-operativo: /elenco-operativo/domande | - | statoPagamento, voceProgrammazione = filtro stato + intervento, os, og, op |
| /procedurale/stati-pagamento | elenco-stato-pagamento-riga | Apri nell'elenco su una voce del drawer | elenco-operativo: /elenco-operativo/domande | - | statoPagamento, voceProgrammazione = filtro stato, intervento della riga |
| /procedurale/stati-pagamento | dettaglio-intervento-stati-pagamento | Apri il dettaglio dal drawer | procedurale: /procedurale/interventi/:codice | codice | stato |

Riproducibilita' (D-02 Rev. 4 di elenco-operativo, D-04 Rev. 5 del procedurale): `statoSostegno`/`statoPagamento` dell'elenco
selezionano le domande rilasciate che il report conta per quella chiave, quindi il link apre domande meno di cui non
rilasciate; l'etichetta lo dice ("Apri nell'elenco (n rilasciate)") e non c'e' link per una voce senza domande rilasciate o
con la fonte non attiva. Nell'elenco `statoSostegno` e `statoPagamento` valgono in alternativa a `stato`, e la voce si mostra
come chip (wireframe dell'elenco approvato).

## Filtri nell'URL (url_params)

| pagina | parametro | fonte (operationId.parametro) | multiplo | obbligatorio |
|---|---|---|---|---|
| /procedurale/stati-sostegno | intervento, os, og, op, stato | TX-0027.intervento, .os, .og, .op, .stato | si' | no |
| /procedurale/stati-pagamento | intervento, os, og, op, stato | TX-0028.intervento, .os, .og, .op, .stato | si' | no |

Con il filtro per stato area programmazione le domande non rilasciate (che non hanno quello stato) contano solo se il filtro
chiede le domande senza stato (D-04 Rev. 4): la pagina lo dice nella nota del KPI di cui non rilasciate.

## Stati resi (obbligatori)

- vuoto: "Nessuna domanda di sostegno (di pagamento CSR-DP) per i filtri scelti" con "Modifica i filtri"
- caricamento: scheletro della card e della tabella, `role="status"` + `aria-live="polite"`
- errore: `role="alert"`, discriminato sul problem-type (400 filtro non valido; 403; 503 con Retry-After; 429; 401/419)

## Note WCAG 2.2 (residuo manuale DICHIARATO)

- Meccanizzato a valle (step7/step8): tab-order, focus dopo il cambio di route, focus-trap del drawer, tabella equivalente
  del grafico, intestazioni ordinabili come bottoni con lo stato annunciato, righe apribili con Invio, axe (deferito a step8).
- RESIDUO umano: leggibilita' della tabella larga (fino a 11 voci piu' gli altri stati) a 320 px con lo scorrimento
  orizzontale della sola tabella (WCAG 1.4.10); intestazioni brevi delle colonne (es. "Autorizzazione ente") con la
  descrizione completa di SR-01 nel nome accessibile.
- RESIDUO umano: il segmento "non rilasciate" delle barre impilate distinguibile senza colore; contrasto della resa finale.
- Con la voce In compilazione assente (fonte non attiva) anche il suo "di cui non rilasciate" e' reso come non disponibile
  (il DTO porta 0, ma per una voce senza fonte non ha significato): da confermare al gate.

## Punti aperti che toccano questo flusso

- OP-PR-01: ultimo dato sincronizzato assente dai DTO procedurali.
- OP-PR-05: nessun export di TX-0027/TX-0028; PNG del grafico e CSV del riepilogo.
- OP-PR-06: profili misti: il report e' ADA, l'elenco aperto dai link e' regionale.
- OP-PR-08: regole del drill-down per stato (parte rilasciata).
- OP-PR-09: stato "PROPOSTO AL PAGAMENTO-ESTRAZ. CAMPIONE-DA ESEGUIRE" fra gli altri stati di pagamento (punto aperto del
  backend verso ARSIAL).
