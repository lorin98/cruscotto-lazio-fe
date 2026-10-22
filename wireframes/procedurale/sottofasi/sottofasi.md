# Flusso sottofasi - wireframe v2 (feature procedurale)

> Doc del gate umano PER FLUSSO. L'approvazione e' content-addressed sull'INTERA dir
> `wireframes/procedurale/sottofasi/` (hash da `wireframe-hash.sh`): modificare un file qui invalida
> l'approvazione del flusso (e solo di questo flusso).

## Route del flusso

| route | kind | pattern | grant (verbatim dal catalogo) |
|---|---|---|---|
| /procedurale/sottofasi | lista | lista v2 (barra dei filtri, due card con grafico e tabella) | csr.tx-0024.read, csr.tx-0025.read, csr.tx-0031.read, csr.tx-0032.read |

TX-0031 e TX-0032 sono EQ con ui_hint list. Una sola pagina per i due tipi di domanda: le liste sono corte (sei e sette voci
piu' le altre sottofasi); ogni card compare solo col grant della sua transazione.

Cambiato il 22/10/2026 (giro G3 del backend, D-06 Rev. 6): TX-0031 e TX-0032 accettano intervento, OS, OG, OP e stato area
programmazione come i report per domanda, quindi la pagina ha la barra dei filtri con chip e il pannello comune (TX-0024,
TX-0025) e la pill "Dati al"; download CSV e XLSX (GET /api/procedurale/sottofasi-sostegno/{formato} e
sottofasi-pagamento/{formato}) e PNG del grafico quando c'e'.

## Component tree (per pagina)

- /procedurale/sottofasi: Shell > Barra filtri (bottone Filtri, chip, perimetro, pill "Dati al") > Breadcrumb > Titolo >
  Card sostegno (interruttore Grafico | Tabella; grafico non disponibile con il motivo, tabella delle voci; CSV, XLSX) > Card
  pagamento (grafico a barre con PNG, CSV, XLSX; tabella equivalente delle voci; tabella delle altre sottofasi) > Stati

## Grafici del flusso

| pagina | grafico | tipo | dati (transazione) | clic | valori assenti |
|---|---|---|---|---|---|
| /procedurale/sottofasi | Domande di sostegno per sottofase di ammissibilita' | barre orizzontali, sei voci di SR-01 | TX-0031 (voci) | nessuno (l'elenco operativo non ha un filtro per sottofase) | FONTE_NON_ATTIVA SOTTOFASI_DOMANDA: grafico non disponibile, detto in testo, vista Tabella; voce non censita NON_VALORIZZATO: omessa e dichiarata |
| /procedurale/sottofasi | Domande di pagamento per sottofase di ammissibilita' | barre orizzontali, sette voci di SR-01 | TX-0032 (voci) | nessuno | come sopra |

Regole del dato (D-06 del backend, Rev. 1-6): ogni voce di SR-01 dice se e' censita nell'anagrafica (codice, descrizione,
esito della prima sottofase per codice che la abbina) e quante domande correnti vi si trovano; con la fonte attiva la voce
conta le domande DISTINTE di tutte le sottofasi che la abbinano (una domanda in due sottofasi equivalenti conta una volta),
mentre la sottofase censita mostra le sue sole domande: la voce puo' essere minore della somma, e la pagina non somma. Le
sottofasi che nessuna voce prende (codice libero) stanno nella tabella "Altre sottofasi", ciascuna con le sue domande.
Domande di pagamento solo con presenza CSR-DP aperta, mai l'Assistenza tecnica; perimetro ADA per il P4, anagrafica regionale.
Con i filtri (Rev. 6): le domande contate sono quelle degli interventi selezionati e dello stato area programmazione scelto;
l'anagrafica resta intera (tutte le voci e tutte le sottofasi del tipo, anche senza domande nell'insieme filtrato) e la
sonda della fonte resta per tipo: con la fonte attiva un insieme filtrato senza domande da' 0, non FONTE_NON_ATTIVA; senza
la fonte (oggi il caso del sostegno) le voci restano "non disponibile" anche con i filtri.

## Download (come nel finanziario)

| dove | formati | file |
|---|---|---|
| card sostegno | CSV, XLSX (PNG solo con il grafico disegnato, quindi non con la fonte non attiva) | GET /api/procedurale/sottofasi-sostegno/{formato} |
| card pagamento | PNG (vista Grafico), CSV, XLSX | PNG nel browser con l'intestazione di NFR-50 (non in audit); CSV e XLSX = GET /api/procedurale/sottofasi-pagamento/{formato} |

Il file ha una riga per voce di SR-01 con la sottofase censita (codice, descrizione, esito, domande sue) e le domande della
voce, poi una riga per sottofase fuori catalogo; tipo di domanda e filtri nell'intestazione; un dato assente porta il motivo
(FONTE_NON_ATTIVA SOTTOFASI_DOMANDA, NON_VALORIZZATO). Stessi filtri della pagina, header X-Requested-With, registrati in
AUDIT_ESPORTAZIONE.

## Link del flusso (drill-down dichiarati)

Nessun link: le sottofasi non hanno un parametro corrispondente nell'elenco operativo e le righe sono voci, non interventi
(OP-PR-08). Le sottofasi di un singolo intervento si leggono anche nella scheda Sottofasi del suo dettaglio (flusso
panoramica).

## Filtri nell'URL (url_params)

| pagina | parametro | fonte (operationId.parametro) | multiplo | obbligatorio |
|---|---|---|---|---|
| /procedurale/sottofasi | intervento, os, og, op, stato | TX-0031.intervento, .os, .og, .op, .stato (gli stessi parametri di TX-0032) | si' | no |

Gli stessi filtri delle altre pagine del procedurale (pannello comune, valori da TX-0024 e TX-0025): passando dal menu i
filtri restano. Valori vuoti, fuori dominio o oltre 100 per dimensione: 400 DATO_NON_VALIDO dal backend, reso come errore.

## Stati resi (obbligatori)

- vuoto: anagrafica vuota = tutte le voci non censite, detto in testo (nessun errore, come lo scenario del backend); con i
  filtri e la fonte attiva, nessuna domanda nell'insieme = voci a 0 con "Modifica i filtri"
- caricamento: scheletro delle due card, `role="status"` + `aria-live="polite"`
- errore: `role="alert"`, discriminato sul problem-type (400 filtro non valido; 403; 503 con Retry-After; 429; 401/419)

## Note WCAG 2.2 (residuo manuale DICHIARATO)

- Meccanizzato a valle (step7/step8): tab-order, focus dopo il cambio di route, focus-trap del pannello dei filtri, tabella
  equivalente, axe (deferito a step8).
- RESIDUO umano: comprensibilita' delle colonne "Domande della voce" e "Domande della sottofase censita" e della nota sulle
  domande distinte; il grafico non disponibile deve essere annunciato come testo, non come area vuota.
- RESIDUO umano: comprensibilita' della frase "i filtri restringono le domande contate; l'elenco delle sottofasi resta
  intero" (una voce a 0 con i filtri non e' una voce non censita).
- Download: un pulsante per formato con la sigla visibile e il nome accessibile completo (WCAG 2.5.3), aria-disabled
  durante la preparazione col focus sul pulsante (WCAG 2.4.3), esito in role=status, errore in role=alert col motivo.
- RESIDUO umano: contrasto della resa finale.

## Punti aperti che toccano questo flusso

- OP-PR-08: nessun drill-down verso l'elenco per le sottofasi.
- Chiusi col giro G3 (22/10/2026): OP-PR-01 (pill "Dati al" da TX-0024), OP-PR-03 (le sottofasi accettano i filtri di
  RF024), OP-PR-05 (CSV e XLSX di TX-0031 e TX-0032).
