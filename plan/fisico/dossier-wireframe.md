# Dossier del gate wireframe - feature fisico

Preparato il 2026-10-22T08:41:13Z (ora di presentazione per `time_to_approve_s`), rifatto dopo il giro G3 del backend e le
decisioni G1-G4 dell'utente del 21/10/2026. Nessuna approvazione registrata: ne' nello stato
(`.claude/state/green-fe-fisico.state.json`, current_step 1) ne' nello uiplan (`plan/fisico/uiplan.json`).

## In testa

### Cosa e' cambiato dal 21/10/2026

- **Handover nuovo** (`plan/fisico/handover.json`, rc 0, gate `handover_verified` registrato di nuovo con
  `sha256:e38f48c5801c420be018b86bf448ad4e9caa45953509109e85e468e38913459d`): spec fisico del giro G3
  (`sha256:8558e1f4d278f2e97fc873a3eebbdaffdd54d8e390d245b0c8784dd35822c861` = `openapi.hash` del manifest risigillato) e, in
  piu', la slice **elenco-operativo** (`sha256:7532fe3b...a4ca`, invariata e gia' nell'handover), pinnata per TX-0060.
- **G3, ultimo dato sincronizzato**: la pagina delle superfici ha la pill "Dati al gg/mm/aaaa" con il dettaglio per flusso,
  come il finanziario e l'elenco, da `ultimiDatiSincronizzati` di TX-0018 (D-01 Rev. 3 del backend). La pagina delle
  determine non ce l'ha: TX-0020 non lo porta.
- **G3, export**: download per formato come nel finanziario. Ogni card grafico ha PNG, CSV e XLSX; la vista Tabella ha CSV e
  XLSX. CSV e XLSX vengono da `GET /api/fisico/superficie-ammissibile/{formato}` (D-06 del backend, registrati in
  AUDIT_ESPORTAZIONE), il PNG dal browser. TX-0020 resta senza export.
- **G2, filtri**: il pannello delle superfici prende le voci (interventi con descrizione, OS, OG, OP, azioni portanti,
  legameAzioniDisponibile) da TX-0060 dell'elenco operativo. La route `/fisico/superfici` ha ora le transazioni TX-0018 e
  TX-0060 (reqs RF018, RA006). La visibilita' resta il solo `csr.tx-0018.read`. Lo stato nuovo e' "valori dei filtri non
  disponibili" (TX-0060 in errore o senza grant). Anche l'anteprima dell'intervento prende la descrizione da TX-0060.
- **G1, Home e menu**: la card Fisico descrive superfici e determine; le determine restano nel menu Fisico. La card in
  `src/app/aree.ts` e le voci di menu le allinea lo **step6** (layer app/), non questa feature.
- **Open point**: chiusi OP-FIS-01 (G2), OP-FIS-02 e OP-FIS-03 (G3), OP-FIS-06 (G1); nuovo OP-FIS-09 (copertura per delega
  delle altre transazioni della slice elenco-operativo); restano OP-FIS-04, 05, 07, 08.
- **Wireframe**: entrambi i flussi rigenerati, quindi entrambi gli hash sono nuovi. Nelle superfici sono cambiati pill,
  download, pannello, anteprima e stati; nelle determine solo una nota su ultimo dato, export e menu. `wireframe-lint.sh`
  rc 0 su entrambi, `uiplan-validate.sh` rc 0, `fe-project-check.sh --feature fisico` rc 0.

### Transazioni coperte (pack 1.3.0)

| transazione | requisito | cosa | route | flusso |
|---|---|---|---|---|
| TX-0018 (EO, report) | RU-00000018 (RF018) | superficie ammissibile DS e DP per intervento e campagna, verifica incrociata, ultimo dato, export CSV/XLSX | /fisico/superfici | superfici |
| TX-0020 (EQ, detail) | RU-00000020 (RF020) | codice e data delle determine da cui la domanda prende le informazioni | /fisico/determine/:codice? | determine |
| TX-0060 (EQ, slice elenco-operativo) | RU-00000061 (RA006) | solo valori del pannello dei filtri delle superfici (G2) | /fisico/superfici | superfici |
| TX-0056, TX-0057, TX-0058, TX-0059 | - | rese dalla feature elenco-operativo (flussi approvati) | - | OP-FIS-09, delega |

### Scelte di disegno da far decidere all'utente (con la mia raccomandazione)

1. **File CSV/XLSX delle card della campagna di riferimento** (barre per intervento e verifica incrociata): con la campagna
   della card, cioe' il file contiene quello che il grafico mostra (fatto cosi'), oppure coi soli filtri della pagina come
   nel finanziario (tutte le campagne senza filtro Campagna). **Raccomando: con la campagna della card.**
2. **Campagna di riferimento di KPI e barre**: quella del filtro Campagna o, senza filtro, la piu' recente della risposta
   (le superfici di campagne diverse non si sommano, D-01). La serie per campagna le mostra tutte. **Raccomando di tenerla.**
3. **Route delle determine** `/fisico/determine/:codice?`: una route con il segmento facoltativo (fatto cosi'), oppure due
   route nello stesso flusso. **Raccomando una route.**
4. **Drill-down dalle superfici all'elenco operativo** (OP-FIS-05): oggi nessuno, perche' l'insieme di TX-0018 non si
   riproduce coi parametri di TX-0056. **Raccomando di accettarlo**; se serve, si fa con un parametro additivo
   dell'elenco in un giro green-be successivo.
5. **Ingresso alle determine dalla scheda della domanda dell'elenco** (OP-FIS-08). **Raccomando di si'**, con il refresh
   della feature elenco-operativo dopo l'approvazione del flusso determine (target_feature fisico).
6. **Campagne del pannello con una campagna gia' nell'indirizzo**: il pannello propone la campagna scelta e "Tutte le
   campagne", senza una seconda lettura di TX-0018. **Raccomando di accettarlo**: una lettura per pagina, come oggi.

Questioni del 21/10 chiuse da G1-G4: testo della card Fisico e area di menu delle determine (G1), fonte dei valori dei
filtri (G2), ultimo dato ed export (G3). G4 non tocca questa feature.

### Nota tecnica per la sessione principale (non e' una scelta dell'utente)

Per G2 la slice elenco-operativo e' **pinnata** in handover e `spec_pins`, e TX-0060 e' fra le transazioni della route
delle superfici. Cosi' step6 puo' dichiarare la lettura come azione hide-by-role con `csr.tx-0060.read`: check-ui-authz la
risolve solo per le slice pinnate e darebbe `operation_unknown` altrimenti. Inoltre `refresh` segnala un cambio del
contratto dell'elenco anche per fisico. Le altre transazioni di quella slice sono coperte per delega (OP-FIS-09, verificato
da fe-project-check).

La visibilita' della route resta `csr.tx-0018.read`. Il motivo: la visibilita' e' "almeno un grant" e `csr.tx-0060.read`
e' di tutti gli 11 profili, quindi aggiungerlo aprirebbe la pagina a chi non legge TX-0018.

L'istituzionale, nel suo uiplan in corso, cita TX-0060 solo nei `fields` (source_ref verso `openapi-elenco-operativo.json`,
senza pin). Le due feature vanno allineate su una delle due forme. Io raccomando questa, che il gate 11/11 puo' verificare.

## Flusso superfici

- **HTML da aprire**: `C:/Users/lorin/Desktop/Lorenzo/sian-ng/progetti/arsial/arsial-cruscotto/cruscotto-lazio-fe/wireframes/fisico/superfici/superfici.html`
  (doc di flusso: `wireframes/fisico/superfici/superfici.md`)
- **Hash del wireframe** (`wireframe-hash.sh`): `sha256:b3825903e66f4c1db6ac3462fccc2b492b3c4e2d72e22350910f1b1e099640e6`
- **Route e pattern**: `/fisico/superfici`, kind `report`, report v2 come il riepilogo del finanziario. Barra dei filtri a
  chip (Intervento, Campagna, pill del perimetro regionale, pill "Dati al"), KPI x4, interruttore di pagina Grafico | Tabella
  con vista iniziale Grafico. Tre card grafico (barre DS e DP per intervento, linea DS e DP per campagna, barre della
  verifica incrociata DP - DS), ognuna con Grafico | Tabella e i download PNG, CSV e XLSX. Tabella interattiva con totali
  per campagna, Scarica CSV e XLSX. Drawer di anteprima dell'intervento, pannello dei filtri con le voci di TX-0060. Stati:
  valori dei filtri non disponibili, vuoto, caricamento, errore (anche di un download).
- **Grant per route (verbatim dal catalogo)**: `csr.tx-0018.read` (profili p1-dirigente, p2-referente-adg,
  p3-funzionario-area-fis, p5-amministratore-funzionale). Il pannello legge TX-0060 con `csr.tx-0060.read`, che hanno tutti
  questi profili, nessuno con perimetro ADA. Nessuno scope: il perimetro e' sempre REGIONALE (D-04). Export:
  `csr.tx-0018.read` e X-Requested-With.
- **Filtri nell'URL**: intervento, os, og, op, azione (multipli) e campagna (uno solo), da `TX-0018.<parametro>` in:query
  (invariati). L'export usa gli stessi parametri.
- **Campi nuovi con provenance** (tutti `spec`):

| campo | schema |
|---|---|
| ultimiDatiSincronizzati[].flusso, ultimiDatiSincronizzati[].conclusoIl | `openapi-fisico.json` UltimoDatoSincronizzato (TX-0018) |
| filtri.interventi[].chiave, filtri.interventi[].descrizione | `openapi-elenco-operativo.json` ValoriFiltriElenco (TX-0060) |
| filtri.obiettiviSpecifici[].chiave, filtri.obiettiviGenerali[], filtri.obiettiviPolicy[] | `openapi-elenco-operativo.json` ValoriFiltriElenco (TX-0060) |
| filtri.azioniPortanti[].chiave, filtri.azioniPortanti[].descrizione, filtri.legameAzioniDisponibile | `openapi-elenco-operativo.json` ValoriFiltriElenco (TX-0060) |

  Restano i campi del 21/10, tutti da `openapi-fisico.json`: campagna, perimetro (SuperficieAmmissibile); righe[].codiceIntervento e
  righe[].motivo (SuperficieIntervento); righe[].campagne[].anno, domandePagamento, domandeSostegno, sostegniDiscordanti,
  superficieDs, superficieDp, differenzaDpDs, domandeDpOltreDs (SuperficieCampagna); quantitaRichiestaPremio.valore,
  .motivo, .fonte (QuantitaRichiestaPremio). Il file CSV/XLSX non e' un campo: lo scrive il backend (una riga per intervento
  e campagna, nessun totale).
- **Note WCAG 2.2 (residuo dichiarato)**:
  - un solo h1, focus sul titolo al cambio di route;
  - ogni grafico ha la tabella equivalente e la didascalia;
  - gli interventi senza superfici sono omessi dai grafici e dichiarati in testo, mai a zero; i valori negativi hanno il
    segno meno; la quantita' richiesta a premio dice "non disponibile (fonte non attiva)";
  - download per formato con la sigla nel nome accessibile (2.5.3), aria-disabled e focus sul pulsante durante la
    preparazione (2.4.3), esito in status ed errore in alert;
  - pill "Dati al" come pulsante col nome completo;
  - le voci di TX-0060 assenti sono dette in testo.
  - Residuo umano: ordine di lettura di KPI, card e tabella; comprensibilita' di DS, DP e differenza DP - DS; differenza fra
    il file di una card (campagna di riferimento) e quello della tabella (tutte le campagne); contrasto della resa finale.
  - **axe deferito a step8** (bloccante nel gate 11/11).
- **Open point del flusso**: OP-FIS-04, 05, 07, 09 (aperti o informativi); OP-FIS-01, 02, 03, 06 chiusi.

## Flusso determine

- **HTML da aprire**: `C:/Users/lorin/Desktop/Lorenzo/sian-ng/progetti/arsial/arsial-cruscotto/cruscotto-lazio-fe/wireframes/fisico/determine/determine.html`
  (doc di flusso: `wireframes/fisico/determine/determine.md`)
- **Hash del wireframe** (`wireframe-hash.sh`): `sha256:c797793a40a02c16b021bf98496a77e808dd8072184e3ab4847e8581da535d32`
- **Route e pattern**: `/fisico/determine/:codice?`, kind `dettaglio`, dettaglio v2 come la scheda della domanda
  dell'elenco. Modulo di ricerca per codice a barre (role=search). Testata con tipo, corrente o chiusa, numero di determine e
  "Apri la scheda della domanda". KPI x4: determina corrente, determine con riga aperta, determina da cui vengono stato area
  programmazione e comparto. Tabella delle determine con riga aperta. Stati: senza codice, nessuna determina, domanda chiusa,
  caricamento, errore (404, 400, 403, 429, 503). Niente pill "Dati al" e niente download: TX-0020 non li ha (G3). La pagina
  sta nel menu Fisico (G1).
- **Grant per route (verbatim dal catalogo)**: `csr.tx-0020.read` (profili p1-dirigente, p2-referente-adg,
  p3-funzionario-area-fis, p5-amministratore-funzionale). Il link `scheda-domanda` verso l'elenco operativo si vede solo con
  `csr.tx-0058.read` (lo hanno tutti questi profili) e con la domanda non chiusa.
- **Link dichiarati** (invariati):
  - `cerca-domanda`: stessa route, path `codice`;
  - `scheda-domanda`: target_feature elenco-operativo, `/elenco-operativo/domande/:tipo/:codiceABarre`, tipo e codice dalla
    risposta; la destinazione e' in un flusso approvato.
- **Campi con provenance** (tutti `spec`, `openapi-fisico.json`, invariati, nessun campo nuovo):

| campo | schema |
|---|---|
| codiceABarre, tipoDomanda, domandaChiusa | DetermineDomanda |
| corrente.motivo | DeterminaCorrente |
| corrente.valore.codice, corrente.valore.data | DeterminaDellaDomanda |
| elenco[].codice, elenco[].data, elenco[].fonteStatoAreaProgrammazione, elenco[].fonteComparto | DeterminaDellaDomanda |

- **Note WCAG 2.2 (residuo dichiarato)**:
  - un solo h1, focus sul titolo dopo il cambio di route e dopo una ricerca;
  - il modulo ha label esplicita, aiuto e messaggio d'errore collegati al campo;
  - si/no e determina corrente sono in testo;
  - senza ultimo dato ed export non c'e' nulla da annunciare.
  - Residuo umano: ordine di lettura di modulo, testata, KPI e tabella; comprensibilita' di "stato area programmazione",
    "comparto" e "determina corrente"; contrasto della resa finale.
  - **axe deferito a step8** (bloccante nel gate 11/11).
- **Open point del flusso**: OP-FIS-07, OP-FIS-08 (aperti o informativi); OP-FIS-06 chiuso (G1).

## Open point

| id | stato | tema |
|---|---|---|
| OP-FIS-01 | chiuso (G2) | voci del pannello dei filtri da TX-0060 dell'elenco operativo |
| OP-FIS-02 | chiuso (G3, D-01 Rev. 3) | ultimo dato sincronizzato in TX-0018, pill "Dati al"; TX-0020 senza |
| OP-FIS-03 | chiuso (G3, D-06) | export CSV/XLSX di TX-0018; il PNG resta del browser, non in AUDIT_ESPORTAZIONE (come OP-FE-08) |
| OP-FIS-04 | informativo | quantita' richiesta a premio sempre FONTE_NON_ATTIVA (D-02 del backend) |
| OP-FIS-05 | aperto (scelta 4) | nessun drill-down superfici -> elenco operativo |
| OP-FIS-06 | chiuso (G1) | card Fisico = superfici e determine; determine nel menu Fisico; la allinea lo step6 |
| OP-FIS-07 | informativo | voci di menu e Home nel layer app/ allo step6 |
| OP-FIS-08 | aperto (scelta 5) | link dalla scheda della domanda dell'elenco verso /fisico/determine |
| OP-FIS-09 | delega (nuovo) | TX-0056..TX-0059 della slice elenco-operativo, pinnata per TX-0060, rese dall'elenco operativo |

## Dopo il gate

Per ogni flusso: Approva / Rework (con note, budget 2 giri) / Sospendi. All'approvazione si registra il gate
`wireframe_<flusso>` nello stato (approved_hash = l'hash sopra, baseline_ref `./wireframes/fisico/<flusso>`) e l'`approval`
nello uiplan, poi `uiplan-validate.sh`. Col primo flusso approvato step1 passa a done e si avanza a step2.
