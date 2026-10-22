# Flusso unit-amount - wireframe v2 (feature procedurale)

> Doc del gate umano PER FLUSSO. L'approvazione e' content-addressed sull'INTERA dir
> `wireframes/procedurale/unit-amount/` (hash da `wireframe-hash.sh`): modificare un file qui invalida
> l'approvazione del flusso (e solo di questo flusso).

## Route del flusso

| route | kind | pattern | grant (verbatim dal catalogo) |
|---|---|---|---|
| /procedurale/unit-amount | report | report v2 (card grafico, tabella interattiva, drawer) | csr.tx-0024.read, csr.tx-0030.read |

Flusso a se' (si approva o si sospende senza toccare gli altri). Collocazione decisa con G1 (21/10/2026): la pagina resta
nel procedurale, la feature della sua slice (TX-0030, csr.tx-0030.read di P1, P2, P3 dell'area procedurale e P4); la card
Procedurale della Home citera' i pagamenti per Unit Amount e quella del Fisico non piu' (la Home la riscrive step6).

Cambiato il 22/10/2026 (giro G3 del backend): pill "Dati al" da TX-0024; download CSV e XLSX
(GET /api/procedurale/unit-amount/{formato}) della card e della tabella, PNG quando il grafico c'e'; il filtro per stato
resta non applicabile per decisione del backend (D-06 Rev. 6).

## Component tree (per pagina)

- /procedurale/unit-amount: Shell > Barra filtri (intervento, OS, OG, OP; perimetro regionale; "stato non si applica";
  pill "Dati al") > Breadcrumb > Titolo > Card Percentuale pagata per Unit Amount (grafico non disponibile con il motivo,
  finche' la fonte non e' attiva; CSV, XLSX, e PNG col grafico) > Tabella interattiva delle Unit Amount (cerca, Colonne,
  CSV, XLSX, ordinamento, paginazione, nessun totale) > Drawer > Stati

Nessun KPI: il DTO di TX-0030 non porta totali (la pagina non somma le righe).

## Grafici del flusso

| pagina | grafico | tipo | dati (transazione) | clic | valori assenti |
|---|---|---|---|---|---|
| /procedurale/unit-amount | Percentuale pagata per Unit Amount | barre orizzontali raggruppate (percentuale dell'esercizio, base storica dell'esercizio precedente) | TX-0030 (righe) | apre l'anteprima della riga nella tabella (drawer); dal drawer link:dettaglio-intervento-unit-amount | FONTE_NON_ATTIVA PAGATO_PER_UNIT_AMOUNT (nessuna Unit Amount ha il pagato: oggi il caso reale): grafico non disponibile, detto in testo, vista Tabella; NON_VALORIZZATO: barra omessa e dichiarata |

Regole del dato (D-06 Rev. 2 del backend): anagrafica UNITAMOUNT degli interventi selezionati (codice, gruppo colturale,
esercizio, importo unitario, output previsto; dati di programma dall'import CSR-UA, regionali per tutti); importo pagato e
percentuale pagata sul richiesto dalla riga; base storica = percentuale pagata della stessa Unit Amount dell'intervento
nell'esercizio precedente. Mai l'Assistenza tecnica.

## Download (come nel finanziario)

| dove | formati | file |
|---|---|---|
| card Percentuale pagata per Unit Amount | CSV, XLSX; PNG solo col grafico disegnato (fonte attiva, vista Grafico) | GET /api/procedurale/unit-amount/{formato} |
| tabella Unit Amount degli interventi selezionati | CSV, XLSX | lo stesso file: una riga per Unit Amount, con il motivo nelle celle senza valore |

Parametri: intervento, os, og, op (mai lo stato), header X-Requested-With, registrati in AUDIT_ESPORTAZIONE; intestazione
con perimetro REGIONALE e ultimo dato sincronizzato per flusso.

## Link del flusso (drill-down dichiarati)

| pagina | link (id) | innesco | arrivo (feature: route) | parametri di path | query |
|---|---|---|---|---|---|
| /procedurale/unit-amount | dettaglio-intervento-unit-amount | Apri il dettaglio dell'intervento dal drawer | procedurale: /procedurale/interventi/:codice | codice | - |

Nessun link verso l'elenco operativo: le Unit Amount non sono insiemi di domande.

## Filtri nell'URL (url_params)

| pagina | parametro | fonte (operationId.parametro) | multiplo | obbligatorio |
|---|---|---|---|---|
| /procedurale/unit-amount | intervento, os, og, op | TX-0030.intervento, .os, .og, .op | si' | no |

TX-0030 non accetta `stato` (D-06 Rev. 6 del backend: RF030 e' dell'area F2 - Fisico nel pack e le Unit Amount sono dati di
programma senza domande): la barra lo dice in testo e uno stato arrivato dall'indirizzo non parte verso il backend ne'
verso l'export, ma resta nell'indirizzo per le altre pagine.

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
- Download: un pulsante per formato con la sigla visibile e il nome accessibile completo (WCAG 2.5.3), aria-disabled
  durante la preparazione col focus sul pulsante (WCAG 2.4.3), esito in role=status, errore in role=alert col motivo.

## Punti aperti che toccano questo flusso

- Nessuno aperto. Chiusi col giro G3 e con G1 (22/10/2026): OP-PR-01 (pill "Dati al" da TX-0024), OP-PR-03 (lo stato non
  si applica alle Unit Amount per decisione del backend, D-06 Rev. 6: la pagina lo dichiara), OP-PR-04 (la pagina resta nel
  procedurale, G1), OP-PR-05 (CSV e XLSX di TX-0030).
