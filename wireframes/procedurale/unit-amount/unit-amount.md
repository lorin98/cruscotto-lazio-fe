# Flusso unit-amount - wireframe v2 (feature procedurale)

> Doc del gate umano PER FLUSSO. L'approvazione e' content-addressed sull'INTERA dir
> `wireframes/procedurale/unit-amount/` (hash da `wireframe-hash.sh`): modificare un file qui invalida
> l'approvazione del flusso (e solo di questo flusso).

## Route del flusso

| route | kind | pattern | grant (verbatim dal catalogo) |
|---|---|---|---|
| /procedurale/unit-amount | report | report v2 (card grafico, tabella interattiva, drawer) | csr.tx-0024.read, csr.tx-0030.read |

Flusso a se' perche' la collocazione e' da decidere (OP-PR-04 b): nel pack RF030 e' dell'area fisica e la card Fisico della
Home cita "Pagamenti per Unit Amount", ma TX-0030 e' della slice procedurale e csr.tx-0030.read e' concesso a P1, P2, P3
dell'area procedurale e P4, non al P3 dell'area fisica. Si puo' approvare o sospendere senza toccare gli altri flussi.

## Component tree (per pagina)

- /procedurale/unit-amount: Shell > Barra filtri (intervento, OS, OG, OP; perimetro regionale; "stato non si applica") >
  Breadcrumb > Titolo > Card Percentuale pagata per Unit Amount (grafico non disponibile con il motivo, finche' la fonte non
  e' attiva) > Tabella interattiva delle Unit Amount (cerca, Colonne, ordinamento, paginazione, nessun totale) > Drawer >
  Stati

Nessun KPI: il DTO di TX-0030 non porta totali (la pagina non somma le righe).

## Grafici del flusso

| pagina | grafico | tipo | dati (transazione) | clic | valori assenti |
|---|---|---|---|---|---|
| /procedurale/unit-amount | Percentuale pagata per Unit Amount | barre orizzontali raggruppate (percentuale dell'esercizio, base storica dell'esercizio precedente) | TX-0030 (righe) | apre l'anteprima della riga nella tabella (drawer); dal drawer link:dettaglio-intervento-unit-amount | FONTE_NON_ATTIVA PAGATO_PER_UNIT_AMOUNT (nessuna Unit Amount ha il pagato: oggi il caso reale): grafico non disponibile, detto in testo, vista Tabella; NON_VALORIZZATO: barra omessa e dichiarata |

Regole del dato (D-06 Rev. 2 del backend): anagrafica UNITAMOUNT degli interventi selezionati (codice, gruppo colturale,
esercizio, importo unitario, output previsto; dati di programma dall'import CSR-UA, regionali per tutti); importo pagato e
percentuale pagata sul richiesto dalla riga; base storica = percentuale pagata della stessa Unit Amount dell'intervento
nell'esercizio precedente. Mai l'Assistenza tecnica.

## Link del flusso (drill-down dichiarati)

| pagina | link (id) | innesco | arrivo (feature: route) | parametri di path | query |
|---|---|---|---|---|---|
| /procedurale/unit-amount | dettaglio-intervento-unit-amount | Apri il dettaglio dell'intervento dal drawer | procedurale: /procedurale/interventi/:codice | codice | - |

Nessun link verso l'elenco operativo: le Unit Amount non sono insiemi di domande.

## Filtri nell'URL (url_params)

| pagina | parametro | fonte (operationId.parametro) | multiplo | obbligatorio |
|---|---|---|---|---|
| /procedurale/unit-amount | intervento, os, og, op | TX-0030.intervento, .os, .og, .op | si' | no |

TX-0030 non accetta `stato`: la barra lo dice in testo e uno stato arrivato dall'indirizzo non parte verso il backend
(OP-PR-03).

## Stati resi (obbligatori)

- vuoto: "Nessuna Unit Amount per gli interventi scelti" con "Modifica i filtri"
- caricamento: scheletro della card e della tabella, `role="status"` + `aria-live="polite"`
- errore: `role="alert"`, discriminato sul problem-type (400; 403; 503 con Retry-After; 429; 401/419)

## Note WCAG 2.2 (residuo manuale DICHIARATO)

- Meccanizzato a valle (step7/step8): tab-order, focus dopo il cambio di route, focus-trap del drawer, tabella equivalente,
  axe (deferito a step8).
- RESIDUO umano: tabella di nove colonne a 320 px (scorrimento della sola tabella, WCAG 1.4.10); ripetizione di "non
  disponibile (fonte non attiva)" in tre colonne per riga: valutare al gate una nota unica sopra la tabella piu' il testo
  breve nelle celle.
- RESIDUO umano: contrasto della resa finale.

## Punti aperti che toccano questo flusso

- OP-PR-01: ultimo dato sincronizzato assente dai DTO procedurali.
- OP-PR-03: TX-0030 non accetta il filtro per stato area programmazione.
- OP-PR-04 (b): collocazione della pagina Unit Amount (procedurale o fisico) e testo delle card della Home.
- OP-PR-05: nessun export di TX-0030 (non e' nel CSV del riepilogo): solo il PNG del grafico, quando c'e'.
