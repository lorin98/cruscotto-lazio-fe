# Dossier del gate wireframe - feature fisico

Preparato il 2026-10-21T13:13:25Z (ora di presentazione per `time_to_approve_s`). Nessuna approvazione registrata: ne'
nello stato (`.claude/state/green-fe-fisico.state.json`, current_step 1) ne' nello uiplan (`plan/fisico/uiplan.json`).

## In testa

**Transazioni coperte** (slice backend `fisico`, manifest sigillato, pack 1.3.0):

| transazione | requisito | cosa | route | flusso |
|---|---|---|---|---|
| TX-0018 (EO, ui_hint report) | RU-00000018 (RF018) | superficie ammissibile DS e DP per intervento e campagna, con la verifica incrociata | /fisico/superfici | superfici |
| TX-0020 (EQ, ui_hint detail) | RU-00000020 (RF020) | codice e data delle determine da cui la domanda prende le informazioni | /fisico/determine/:codice? | determine |

Copertura 2 su 2, nessuna transazione delegata ad altre feature. `uiplan-validate.sh` rc 0, `fe-project-check.sh` rc 0
(nessuna collisione con finanziario, elenco-operativo, istituzionale, procedurale), `wireframe-lint.sh` rc 0 su entrambi i
flussi (axe: deferred-to-step8, bloccante nel gate 11/11).

**Differenze fra la card dell'ambito Fisico (`src/app/aree.ts`, AREE_FUTURE) e la slice** (da far decidere all'utente, non
risolte qui; la card la tocca lo step6): OP-FIS-06.

| voce della card Fisico | transazione | slice backend | resa da |
|---|---|---|---|
| Output programmato e realizzato dal 2023 al 2029 | TX-0017 (RF017) | istituzionale | feature istituzionale (nel suo piano in corso: /istituzionale/output-regionale); la card Istituzionale ha gia' "Output regionale per intervento" |
| Superfici ammissibili di sostegno e di pagamento | TX-0018 (RF018) | fisico | questa feature: /fisico/superfici |
| Pagamenti per Unit Amount | TX-0030 (RF030, area "F2 - Fisico" nella SR) | procedurale | feature procedurale (nel suo piano in corso: /procedurale/unit-amount); NON inclusa qui |
| (assente) | TX-0020 (RF020, area "P - Procedurale" nella SR) | fisico | questa feature: /fisico/determine; la card Procedurale cita "Determine, responsabili e ADA di riferimento" |

Domande per l'utente: (1) testo e voci della card Fisico: togliere TX-0017 e TX-0030 (rese da altre aree) o tenerle come
rimandi; (2) la pagina delle determine (TX-0020) sta nel menu Fisico, come la slice, o sotto Procedurale, come l'area del
requisito e la card Procedurale (la route resta `/fisico/...` della feature fisico in entrambi i casi).

**Open point nuovi** (tutti nello uiplan, `kind: altro`):

| id | tema | decisione chiesta |
|---|---|---|
| OP-FIS-01 | valori del pannello dei filtri (interventi con descrizione, OG, OS, OP, azioni portanti) assenti dalla slice; il P3 dell'area fisica non ha TX-0001 | (a) leggerli da TX-0060 dell'elenco (grant che hanno tutti i profili con csr.tx-0018.read); (b) campo additivo su TX-0018 (green-be); (c) solo Intervento coi codici della risposta |
| OP-FIS-02 | ultimo dato sincronizzato (NFR-25 b) assente dai DTO del fisico | accettare l'assenza; TX-0001 per chi ha il grant; o campo additivo su TX-0018 |
| OP-FIS-03 | nessun export CSV/XLSX nella spec fisico; il PNG non e' registrato in AUDIT_ESPORTAZIONE | accettare solo PNG o chiedere a green-be l'endpoint di export di TX-0018 |
| OP-FIS-04 | quantita' richiesta a premio sempre FONTE_NON_ATTIVA (D-02 del backend) | informativo: resa "non disponibile (fonte non attiva)" |
| OP-FIS-05 | nessun drill-down superfici -> elenco operativo: l'insieme di TX-0018 non si riproduce coi parametri di TX-0056 | accettare, o parametro additivo di TX-0056/TX-0059 (green-be, risigillo elenco-operativo) |
| OP-FIS-06 | card dell'ambito vs slice (tabella sopra) | vedi le due domande sopra |
| OP-FIS-07 | voci di menu e Home nel layer app/ (step6) | informativo |
| OP-FIS-08 | link dalla scheda della domanda dell'elenco verso /fisico/determine | da dichiarare nel refresh della feature elenco-operativo, se lo si vuole |

Scelte di disegno da confermare al gate (non open point):
- route `/fisico/determine/:codice?` con segmento facoltativo (una route, voce di menu senza codice); alternativa: due route
  nello stesso flusso;
- campagna di riferimento di KPI e barre: quella del filtro Campagna o, senza filtro, la piu' recente della risposta
  (le superfici di campagne diverse non si sommano, D-01); la linea per campagna le mostra tutte;
- nessun link verso l'elenco dal report delle superfici (OP-FIS-05); dalla pagina delle determine un solo link, verso la
  scheda della domanda (stessa domanda, non un insieme).

## Flusso superfici

- **HTML da aprire**: `C:/Users/lorin/Desktop/Lorenzo/sian-ng/progetti/arsial/arsial-cruscotto/cruscotto-lazio-fe/wireframes/fisico/superfici/superfici.html`
  (doc di flusso: `wireframes/fisico/superfici/superfici.md`)
- **Hash del wireframe** (`wireframe-hash.sh`): `sha256:b44920c55f8bf43768098de014ad2877b607629fddbcdacd66b5f21e7772372c`
- **Route e pattern**: `/fisico/superfici`, kind `report`, report v2 come il riepilogo del finanziario: barra dei filtri a
  chip (Intervento, Campagna, pill del perimetro regionale), KPI x4, interruttore di pagina Grafico | Tabella con vista
  iniziale Grafico, tre card grafico (barre DS e DP per intervento, linea DS e DP per campagna, barre della verifica
  incrociata DP - DS) ognuna con Grafico | Tabella e Scarica PNG, tabella interattiva con totali per campagna, drawer di
  anteprima dell'intervento, pannello dei filtri, stati vuoto/caricamento/errore.
- **Grant per route (verbatim dal catalogo)**: `csr.tx-0018.read` (profili: p1-dirigente, p2-referente-adg,
  p3-funzionario-area-fis, p5-amministratore-funzionale). Nessuno scope: il perimetro e' sempre REGIONALE (D-04).
- **Filtri nell'URL**: intervento, os, og, op, azione (multipli), campagna (uno solo), da `TX-0018.<parametro>` in:query.
- **Campi con provenance** (tutti `spec`, `openapi-fisico.json`):

| campo | schema |
|---|---|
| campagna, perimetro | SuperficieAmmissibile |
| righe[].codiceIntervento, righe[].motivo | SuperficieIntervento |
| righe[].campagne[].anno, domandePagamento, domandeSostegno, sostegniDiscordanti, superficieDs, superficieDp, differenzaDpDs, domandeDpOltreDs | SuperficieCampagna |
| righe[].campagne[].quantitaRichiestaPremio.valore, .motivo, .fonte | QuantitaRichiestaPremio |

  Assenti dalla spec e quindi non mostrati: descrizione dell'intervento e valori dei filtri (OP-FIS-01), ultimo dato
  sincronizzato (OP-FIS-02). I KPI sono somme delle righe della campagna di riferimento (report completo, non paginato).
- **Note WCAG 2.2 (residuo dichiarato)**: un solo h1, focus sul titolo al cambio di route; ogni grafico con tabella
  equivalente e didascalia; interventi senza superfici omessi dai grafici e dichiarati in testo, mai a zero; valori
  negativi col segno meno (non solo col colore); quantita' richiesta a premio "non disponibile (fonte non attiva)".
  Residuo umano: ordine di lettura di KPI, card e tabella; comprensibilita' di DS, DP e differenza DP - DS; contrasto della
  resa finale. **axe deferito a step8** (bloccante nel gate 11/11).
- **Open point del flusso**: OP-FIS-01, 02, 03, 04, 05, 06, 07.

## Flusso determine

- **HTML da aprire**: `C:/Users/lorin/Desktop/Lorenzo/sian-ng/progetti/arsial/arsial-cruscotto/cruscotto-lazio-fe/wireframes/fisico/determine/determine.html`
  (doc di flusso: `wireframes/fisico/determine/determine.md`)
- **Hash del wireframe** (`wireframe-hash.sh`): `sha256:c64302170de0ce6514a48b7581fcb6cb8f17783804fc6e7be3e1492c747d22b5`
- **Route e pattern**: `/fisico/determine/:codice?`, kind `dettaglio`, dettaglio v2 come la scheda della domanda
  dell'elenco: modulo di ricerca per codice a barre (role=search), testata (tipo, corrente o chiusa, numero di determine,
  "Apri la scheda della domanda"), KPI x4 (determina corrente, determine con riga aperta, determina da cui vengono stato
  area programmazione e comparto), tabella delle determine con riga aperta, stati senza codice, nessuna determina, domanda
  chiusa, caricamento, errore (404, 400, 403, 429, 503).
- **Grant per route (verbatim dal catalogo)**: `csr.tx-0020.read` (profili: p1-dirigente, p2-referente-adg,
  p3-funzionario-area-fis, p5-amministratore-funzionale). Il link `scheda-domanda` verso l'elenco operativo si vede solo con
  `csr.tx-0058.read` (lo hanno tutti questi profili) e con la domanda non chiusa.
- **Link dichiarati**: `cerca-domanda` (stessa route, path `codice`); `scheda-domanda` (target_feature elenco-operativo,
  `/elenco-operativo/domande/:tipo/:codiceABarre`, tipo e codice dalla risposta; destinazione in un flusso approvato).
- **Campi con provenance** (tutti `spec`, `openapi-fisico.json`):

| campo | schema |
|---|---|
| codiceABarre, tipoDomanda, domandaChiusa | DetermineDomanda |
| corrente.motivo | DeterminaCorrente |
| corrente.valore.codice, corrente.valore.data | DeterminaDellaDomanda |
| elenco[].codice, elenco[].data, elenco[].fonteStatoAreaProgrammazione, elenco[].fonteComparto | DeterminaDellaDomanda |

- **Note WCAG 2.2 (residuo dichiarato)**: un solo h1, focus sul titolo dopo il cambio di route e dopo una ricerca; modulo con
  label esplicita, aiuto e messaggio d'errore collegati al campo; si/no e determina corrente in testo. Residuo umano: ordine
  di lettura di modulo, testata, KPI e tabella; comprensibilita' di "stato area programmazione", "comparto", "determina
  corrente"; contrasto della resa finale. **axe deferito a step8** (bloccante nel gate 11/11).
- **Open point del flusso**: OP-FIS-06 (area di menu della pagina), OP-FIS-07, OP-FIS-08.

## Dopo il gate

Per ogni flusso: Approva / Rework (con note, budget 2 giri) / Sospendi. All'approvazione si registra il gate
`wireframe_<flusso>` nello stato (approved_hash = l'hash sopra, baseline_ref `./wireframes/fisico/<flusso>`) e l'`approval`
nello uiplan, poi `uiplan-validate.sh`; col primo flusso approvato step1 passa a done e si avanza a step2.
