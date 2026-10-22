# Dossier del gate dei wireframe - feature procedurale

Feature `procedurale` del frontend del cruscotto CSR (green-fe, layout plan dell'ADR 0028). Rifatto il 22/10/2026 sui
contratti del giro G3 del backend (handover nuovo e step1 rifatto), preparato alle 08:44 UTC: l'ora di presentazione
all'utente, da usare per `time_to_approve_s`, la registra chi lo presenta. **Nessuna approvazione registrata**: ne' nello
stato (`.claude/state/green-fe-procedurale.state.json`, step1-uiplan `in_progress` senza gate) ne' nello uiplan.

## Cosa e' cambiato dal 21/10/2026

- **Handover** (step0-config §3 e §7, config invariata): copiati dal backend `handover/openapi-procedurale.json`
  (sha256 `22da0189...8ab0` = `manifest.openapi.hash`; prima `461d222b...a492`), `handover/slices/procedurale/manifest.json`
  (`534f2ce1...84fd`, risigillato col giro G3: ddl e acceptance riapprovati il 21/10) e
  `handover/acceptance/procedurale-scenarios.json` (`74cb83da...e96c`: nuovi SC-PC_SOTTOFASI_FILTRI, SC-PC_ULTIMO_DATO,
  SC-PC_ESPORTA; aggiornati SC-PC_PARAMETRO_NON_VALIDO e SC-PC_AUDIT). `handover/authz-catalog.json` identico al backend
  (`fa3d4c0b...df8`), non riscritto. `fe-handover-check.sh` rc 0, verdict pass, nessun failure, gate del backend superati ->
  `plan/procedurale/handover.json` sha256 `57fff564bdba95bf16ca6cc3ef1b522aae2549ffc3da9cec8a801ba3e6b6f003`; gate meccanico
  `handover_verified` registrato di nuovo con `state-set.sh` (approved_at 2026-10-22T08:27:09Z). Stato a `current_step` 1.
- **Contratto** (differenza con il 21/10): l'unico schema cambiato e' `FiltriProcedurali` (TX-0024), che porta
  `ultimiDatiSincronizzati` (`UltimoDatoSincronizzato`: `flusso`, `conclusoIl`); sette export `GET /api/procedurale/<report>/{formato}`
  (csv, xlsx, senza operationId) per TX-0026..TX-0032, `riepilogo/csv` invariato; il parametro `azione` non c'e' piu'
  (D-01 Rev. 1); `/sottofasi-sostegno` e `/sottofasi-pagamento` accettano intervento, os, og, op, stato (D-06 Rev. 6). I DTO
  dei report sono invariati; TX-0030 resta senza `stato` per decisione del backend.
- **Uiplan** (`uiplan-validate.sh` rc 0, `fe-project-check.sh --feature procedurale` rc 0): `spec_pins` copiati dal nuovo
  handover; `/procedurale/sottofasi` con TX-0024, TX-0025 e cinque `url_params` (`TX-0031.*`); `/procedurale/interventi/:codice`
  con TX-0031 e TX-0032 (scheda Sottofasi); 30 campi nuovi (88 in tutto): "Dati al" su tutte le 8 route, filtri e stati area
  programmazione per le sottofasi, sottofasi nel dettaglio, 17 righe di export con il puntatore al percorso della spec;
  `wcag_notes` con la pill e i download; OP-PR-01..05 chiusi (`RISOLTO il 22/10/2026`, testo originale conservato), OP-PR-08
  precisato.
- **Wireframe**: tutti e sei i flussi toccati (hash nuovi sotto): pill "Dati al gg/mm/aaaa" in ogni barra dei filtri; al posto
  dell'unico "Scarica" un pulsante per formato, PNG CSV XLSX sulle card con grafico (PNG solo per i grafici disegnati) e CSV
  XLSX sulle tabelle, come nel finanziario; il riepilogo perde "Esporta CSV" per CSV e XLSX; la pagina delle sottofasi ha la
  barra dei filtri con chip; il dettaglio dell'intervento ha la scheda Sottofasi; nessun riferimento al parametro `azione` (il
  filtro per azione portante non era previsto: e' sparita solo la nota). `wireframe-lint.sh` verde su tutti e sei (allowlist
  del kit v2, a11y statici; `wireframe.css` identico al template). **axe NON eseguito**: il lint dichiara
  `axe: deferred-to-step8`, il controllo axe vero e' bloccante nel gate 11/11 di step8.
- **Decisioni G1-G4**: G1 chiude OP-PR-04 (la card della Home la riscrive step6, non questo step: annotato nello uiplan);
  G2 e G4 non toccano il procedurale; G3 e' il giro del backend sopra.

## Scelte di disegno da far decidere all'utente

Riprese dal dossier del 21/10 quelle non risolte da G1-G4, piu' le nuove; una riga ciascuna con la raccomandazione.

1. Dettaglio procedurale dell'intervento (`/procedurale/interventi/:codice`) accanto a quello del finanziario: **raccomando si'** (stesso schema del finanziario, nessuna transazione nuova).
2. Due pagine per gli stati (sostegno, pagamento) invece di una: **raccomando due** (grant, voce di menu e indirizzo propri; i filtri passano dal menu).
3. Card "Domande per stato area programmazione" della panoramica letta dal riepilogo TX-0029: **raccomando si'** (e' l'unica transazione con quella distribuzione).
4. Stati: il clic su una barra filtra la tabella nella pagina, l'apertura nell'elenco e' l'azione esplicita "Apri nell'elenco (n rilasciate)": **raccomando si'** (come le barre del finanziario; il numero diverso dalla voce e' detto nell'etichetta).
5. "Di cui non rilasciate" della voce In compilazione senza fonte: **raccomando "non disponibile"** invece dello 0 del DTO (per una voce senza fonte lo 0 non ha significato).
6. Nuova, dal G3: scheda Sottofasi nel dettaglio dell'intervento (TX-0031 e TX-0032 con intervento=:codice): **raccomando si'**; l'alternativa e' lasciarle solo nella pagina Sottofasi (il dettaglio torna a sei transazioni).
7. Nuova: il CSV e l'XLSX di una card sono l'export dell'intero report della card (tutte le righe e colonne), non i soli valori del grafico: **raccomando si'**, come nel finanziario (il backend non ha export per singolo grafico).
8. Unit Amount con la fonte del pagato non attiva: **raccomando una nota unica sopra la tabella** e "non disponibile" breve nelle tre celle (oggi il motivo completo e' ripetuto in tre colonne per riga).

Per la Home (G1, step6): testo proposto della card Procedurale "Stati e sottofasi delle domande; domande ammesse con atto di
concessione e contributo; riepilogo per intervento; pagamenti per Unit Amount", senza "Determine, responsabili e ADA di
riferimento"; la card Fisico senza "Pagamenti per Unit Amount".

## Transazioni coperte

| transazione | requisito | cosa | route | export |
|---|---|---|---|---|
| TX-0024 | RU-00000024 (RF024) | valori dei filtri (interventi senza AT001, OS, OG, OP) e ultimo dato sincronizzato | pannello dei filtri e pill "Dati al" di tutte le 8 route | nessuno (valori dei filtri) |
| TX-0025 | RU-00000025 (RF025) | valori del filtro stato domanda area programmazione | pannello dei filtri delle pagine che accettano `stato` (tutte tranne Unit Amount) | nessuno |
| TX-0026 | RU-00000026 (RF026) | domande ammesse, con atto di concessione, importo richiesto, contributo ammesso, interventi attivati e perimetro ufficiale | `/procedurale` (KPI, importi), `/procedurale/ammesse`, `/procedurale/interventi/:codice` | domande-ammesse/{formato} |
| TX-0027 | RU-00000027 (RF027) | undici stati della domanda di sostegno, con il di cui non rilasciate | `/procedurale` (card), `/procedurale/stati-sostegno`, dettaglio | stati-sostegno/{formato} |
| TX-0028 | RU-00000028 (RF028) | cinque stati della domanda di pagamento CSR-DP, con il di cui non rilasciate | `/procedurale` (card), `/procedurale/stati-pagamento`, dettaglio | stati-pagamento/{formato} |
| TX-0029 | RU-00000029 (RF029) | riepilogo per intervento | `/procedurale/riepilogo`; `/procedurale` e dettaglio per lo stato area programmazione | riepilogo/{formato} (csv anche come riepilogo/csv) |
| TX-0030 | RU-00000030 (RF030) | Unit Amount: importo pagato, percentuale, base storica | `/procedurale/unit-amount`, scheda del dettaglio | unit-amount/{formato} |
| TX-0031 | RU-00000031 (RF031) | sottofasi di ammissibilita' della domanda di sostegno, ora con i filtri | `/procedurale/sottofasi`, scheda del dettaglio | sottofasi-sostegno/{formato} |
| TX-0032 | RU-00000032 (RF032) | sottofasi di ammissibilita' della domanda di pagamento, ora con i filtri | `/procedurale/sottofasi`, scheda del dettaglio | sottofasi-pagamento/{formato} |

Grant di tutte le route: `csr.tx-0024.read` ... `csr.tx-0032.read`, verbatim dal catalogo; li detengono p1-dirigente,
p2-referente-adg, p3-funzionario-area-pro e p4-responsabile-procedimento-ada (perimetro ADA). P3 delle altre aree, P5, P6, P7:
nessun grant (403 dal backend; la voce di menu non compare). Gli export hanno il grant della loro lettura.

## Open point

| id | stato | in breve |
|---|---|---|
| OP-PR-01 | chiuso (G3, D-01 Rev. 2) | ultimo dato sincronizzato da TX-0024: pill "Dati al" su ogni pagina; restano fuori NFR-25 (c) e (d), come nel finanziario |
| OP-PR-02 | chiuso (G3, D-01 Rev. 1) | parametro `azione` uscito dal contratto; la FE non l'ha mai esposto ne' inoltrato |
| OP-PR-03 | chiuso (G3, D-06 Rev. 6) | sottofasi con intervento, OS, OG, OP, stato; Unit Amount senza stato per decisione del backend, dichiarato in pagina |
| OP-PR-04 | chiuso (G1) | card della Home = contenuto reale della feature; Unit Amount resta nel procedurale; la riscrive step6 in `src/app/aree.ts` |
| OP-PR-05 | chiuso (G3, D-10) | CSV e XLSX di TX-0026..TX-0032, riepilogo anche XLSX, riepilogo/csv invariato; PNG del frontend non registrato in audit (come OP-FE-08) |
| OP-PR-06 | aperto (verso ARSIAL) | profili misti: il report e' ADA, l'elenco aperto dai link e' regionale |
| OP-PR-07 | aperto (informativo) | TX-0024/TX-0025 (ui_hint form) resi come pannello dei filtri, non come route form |
| OP-PR-08 | aperto (informativo) | regole del drill-down: parte rilasciata, `stato` -> `voceProgrammazione`, nessun link per importi, sottofasi, Unit Amount |
| OP-PR-09 | aperto (backend verso ARSIAL) | stato "PROPOSTO AL PAGAMENTO-ESTRAZ. CAMPIONE-DA ESEGUIRE" fra gli altri stati di pagamento |

## Flussi, nell'ordine proposto per il gate

Ogni flusso si approva da solo (hash della sua dir); il primo approvato sblocca step2. Gli HTML si aprono nel browser
direttamente dal disco (i link fra le pagine e verso l'elenco operativo e il finanziario funzionano in locale). Download in
tutti i flussi come nel finanziario: un pulsante per formato con la sigla visibile e il nome accessibile completo (WCAG 2.5.3),
aria-disabled durante la preparazione col focus sul pulsante (2.4.3), esito in role=status, errore in role=alert col motivo
(400 oltre 5.000 righe o 50.000 celle, 503 ESPORTAZIONE_NON_REGISTRATA); CSV e XLSX con gli stessi filtri della pagina e
X-Requested-With, registrati in AUDIT_ESPORTAZIONE; PNG solo dei grafici disegnati, nella vista Grafico. Pill "Dati al" in
tutti: bottone col nome accessibile completo e popover per flusso.

### 1. panoramica

- HTML: `C:/Users/lorin/Desktop/Lorenzo/sian-ng/progetti/arsial/arsial-cruscotto/cruscotto-lazio-fe/wireframes/procedurale/panoramica/panoramica.html`
  e `C:/Users/lorin/Desktop/Lorenzo/sian-ng/progetti/arsial/arsial-cruscotto/cruscotto-lazio-fe/wireframes/procedurale/panoramica/intervento.html`;
  doc del flusso `wireframes/procedurale/panoramica/panoramica.md`.
- Route e pattern:
  - `/procedurale` - cruscotto (KPI x4 di TX-0026, card stati DS e DP a barre impilate, card stato area programmazione, card
    importi per intervento, pannello dei filtri). Grant: `csr.tx-0024.read`, `csr.tx-0025.read`, `csr.tx-0026.read`,
    `csr.tx-0027.read`, `csr.tx-0028.read`, `csr.tx-0029.read`.
  - `/procedurale/interventi/:codice` - dettaglio (testata, KPI x4, schede Stati delle domande | Area programmazione |
    **Sottofasi** | Unit Amount). Grant: `csr.tx-0024.read`, `csr.tx-0026.read`, `csr.tx-0027.read`, `csr.tx-0028.read`,
    `csr.tx-0029.read`, `csr.tx-0030.read`, **`csr.tx-0031.read`, `csr.tx-0032.read`**. Nessuna transazione nuova: gli stessi
    report con `intervento=:codice` (e lo stato, tranne Unit Amount).
- Campi nuovi (`spec`): `ultimiDatiSincronizzati[].flusso`, `[].conclusoIl` (FiltriProcedurali) su entrambe le route;
  nel dettaglio SottofasiAmmissibilita (perimetro, tipoDomanda), SottofaseVoce (fase, descrizione, domande), SottofaseCensita
  (censita e altre); export: card della panoramica -> stati-sostegno, stati-pagamento, riepilogo, domande-ammesse
  `/{formato}`; schede del dettaglio -> gli stessi piu' sottofasi-sostegno, sottofasi-pagamento, unit-amount `/{formato}`.
  Gli altri campi come il 21/10 (elenco in `fields[]` dello uiplan).
- Link: invariati (`elenco-ammesse-panoramica`, `elenco-con-atto-panoramica`, `elenco-area-programmazione-panoramica`,
  `stati-sostegno-panoramica`, `stati-pagamento-panoramica`, `dettaglio-intervento-panoramica`, `panoramica-intervento`,
  `elenco-ammesse-intervento`, `elenco-con-atto-intervento`, `elenco-stato-sostegno-intervento`,
  `elenco-stato-pagamento-intervento`, `elenco-area-programmazione-intervento`); la scheda Sottofasi non ha link.
- WCAG (residuo dichiarato): ordine di lettura di KPI e card, didascalie, segmento "non rilasciate" distinguibile senza colore,
  bersagli di "Apri nell'elenco" (2.5.8), comprensibilita' della data "meno recente" della pill, contrasto della resa finale;
  axe deferito a step8.
- Open point: OP-PR-06, 07, 08.
- **Hash**: `sha256:b3871a3065288a5dc88fc789794281d7f23b827cc4907c52d0030c0a2b529d3e`

### 2. stati

- HTML: `C:/Users/lorin/Desktop/Lorenzo/sian-ng/progetti/arsial/arsial-cruscotto/cruscotto-lazio-fe/wireframes/procedurale/stati/stati-sostegno.html`
  e `C:/Users/lorin/Desktop/Lorenzo/sian-ng/progetti/arsial/arsial-cruscotto/cruscotto-lazio-fe/wireframes/procedurale/stati/stati-pagamento.html`;
  doc `wireframes/procedurale/stati/stati.md`.
- Route e pattern:
  - `/procedurale/stati-sostegno` - lista (KPI domande e di cui non rilasciate, card a barre impilate con tabella equivalente,
    tabella per intervento e stato con CSV e XLSX, drawer). Grant: `csr.tx-0024.read`, `csr.tx-0025.read`, `csr.tx-0027.read`.
  - `/procedurale/stati-pagamento` - lista, stessa struttura con i cinque stati CSR-DP. Grant: `csr.tx-0024.read`,
    `csr.tx-0025.read`, `csr.tx-0028.read`.
- Campi nuovi (`spec`): `ultimiDatiSincronizzati` (FiltriProcedurali); export `stati-sostegno/{formato}` e
  `stati-pagamento/{formato}` (una riga per intervento e stato con domande e di cui non rilasciate, poi il totale).
- Link: invariati (`elenco-stato-sostegno`, `elenco-stato-sostegno-riga`, `elenco-stato-pagamento`,
  `elenco-stato-pagamento-riga`, `dettaglio-intervento-stati-*`).
- WCAG (residuo dichiarato): tabella larga a 320 px (1.4.10), intestazioni brevi con nome accessibile completo, segmento non
  rilasciate senza colore, contrasto; axe deferito a step8.
- Open point: OP-PR-06, 08, 09.
- **Hash**: `sha256:21fcddefe1beea7d44d9de7cb1aa85faea32641771f9d196c7b636b470f1a294`

### 3. ammesse

- HTML: `C:/Users/lorin/Desktop/Lorenzo/sian-ng/progetti/arsial/arsial-cruscotto/cruscotto-lazio-fe/wireframes/procedurale/ammesse/ammesse.html`;
  doc `wireframes/procedurale/ammesse/ammesse.md`.
- Route e pattern: `/procedurale/ammesse` - report (KPI x4, due card a barre raggruppate con PNG CSV XLSX, tabella per
  intervento con totali del backend e CSV XLSX, drawer). Grant: `csr.tx-0024.read`, `csr.tx-0025.read`, `csr.tx-0026.read`.
- Campi nuovi (`spec`): `ultimiDatiSincronizzati`; export `domande-ammesse/{formato}` (una riga per intervento e la riga dei
  totali, il motivo nelle celle senza valore).
- Link: invariati (`elenco-ammesse`, `elenco-con-atto`, `elenco-ammesse-riga`, `elenco-con-atto-riga`,
  `dettaglio-intervento-ammesse`).
- WCAG (residuo dichiarato): bersagli dei link nelle celle (2.5.8), distinzione fra "non disponibile (fonte non attiva)" e
  "non valorizzato", contrasto; axe deferito a step8.
- Open point: OP-PR-06, 08.
- **Hash**: `sha256:6cbddd380343f94fc5bbbdba8b32b14f7b86eda5a7eaedf7e46caacdb3966eaf`

### 4. riepilogo

- HTML: `C:/Users/lorin/Desktop/Lorenzo/sian-ng/progetti/arsial/arsial-cruscotto/cruscotto-lazio-fe/wireframes/procedurale/riepilogo/riepilogo.html`;
  doc `wireframes/procedurale/riepilogo/riepilogo.md`.
- Route e pattern: `/procedurale/riepilogo` - report come il riepilogo del finanziario (interruttore di pagina Grafico |
  Tabella, vista iniziale Grafico; card del grafico con PNG CSV XLSX; tabella a quattro sezioni con Colonne, totali del
  backend, CSV e XLSX al posto di "Esporta CSV", drawer). Grant: `csr.tx-0024.read`, `csr.tx-0025.read`, `csr.tx-0029.read`.
- Campi nuovi (`spec`): `ultimiDatiSincronizzati`; export `riepilogo/{formato}` (per csv e' lo stesso indirizzo dello storico
  `riepilogo/csv`, che resta nel contratto con lo stesso file).
- Link: invariati (`elenco-ammesse-riepilogo`, `elenco-con-atto-riepilogo`, `dettaglio-intervento-riepilogo`).
- WCAG (residuo dichiarato): tabella a sezioni a 320 px (1.4.10), intestazioni di gruppo (scope colgroup), bersagli dei link,
  contrasto; axe deferito a step8.
- Open point: OP-PR-06, 08.
- **Hash**: `sha256:77f2d54bff90fd1378528ce1a5e081df40180c83a64aa9c3542358583e9d46d1`

### 5. sottofasi

- HTML: `C:/Users/lorin/Desktop/Lorenzo/sian-ng/progetti/arsial/arsial-cruscotto/cruscotto-lazio-fe/wireframes/procedurale/sottofasi/sottofasi.html`;
  doc `wireframes/procedurale/sottofasi/sottofasi.md`.
- Route e pattern: `/procedurale/sottofasi` - lista, ora con la barra dei filtri (bottone Filtri, chip, perimetro, "Dati al")
  e il pannello comune; card sostegno (grafico non disponibile, tabella delle voci, CSV XLSX), card pagamento (grafico a
  barre con PNG CSV XLSX, tabella equivalente, altre sottofasi). Grant: **`csr.tx-0024.read`, `csr.tx-0025.read`**,
  `csr.tx-0031.read`, `csr.tx-0032.read`.
- Filtri nell'URL (nuovi): intervento, os, og, op, stato da `TX-0031.*` (gli stessi parametri di TX-0032).
- Campi nuovi (`spec`): `ultimiDatiSincronizzati`, filtri (FiltriProcedurali), stati area programmazione
  (StatiAreaProgrammazione); export `sottofasi-sostegno/{formato}`, `sottofasi-pagamento/{formato}`.
- Regola resa (D-06 Rev. 5 e 6): la voce conta le domande DISTINTE delle sottofasi che la abbinano, la sottofase censita le
  sue sole domande, la pagina non somma; i filtri restringono le domande contate, l'anagrafica resta intera e regionale, e con
  la fonte attiva un insieme filtrato senza domande da' 0 (non "non disponibile").
- Link: nessuno (l'elenco operativo non ha un filtro per sottofase).
- WCAG (residuo dichiarato): comprensibilita' delle due colonne di domande, della nota sulle domande distinte e della frase sui
  filtri (una voce a 0 non e' una voce non censita), grafico non disponibile come testo, contrasto; axe deferito a step8.
- Open point: OP-PR-08.
- **Hash**: `sha256:d73403d3633be07461f7ea03219b6530d6d776e0a61eea7bc4e4f28c4e813b49`

### 6. unit-amount

- HTML: `C:/Users/lorin/Desktop/Lorenzo/sian-ng/progetti/arsial/arsial-cruscotto/cruscotto-lazio-fe/wireframes/procedurale/unit-amount/unit-amount.html`;
  doc `wireframes/procedurale/unit-amount/unit-amount.md`.
- Route e pattern: `/procedurale/unit-amount` - report (card grafico non disponibile finche' il pagato non arriva, con CSV e
  XLSX; tabella delle Unit Amount senza totali con CSV e XLSX; drawer). Filtri intervento, OS, OG, OP (non lo stato,
  dichiarato in testo). Grant: `csr.tx-0024.read`, `csr.tx-0030.read`. Resta nel procedurale (G1).
- Campi nuovi (`spec`): `ultimiDatiSincronizzati`; export `unit-amount/{formato}` (intervento e obiettivi, mai lo stato; una
  riga per Unit Amount).
- Link: `dettaglio-intervento-unit-amount`; nessun link verso l'elenco (non sono insiemi di domande).
- WCAG (residuo dichiarato): tabella di nove colonne a 320 px, ripetizione di "non disponibile (fonte non attiva)" in tre
  colonne (scelta 8), contrasto; axe deferito a step8.
- Open point: nessuno aperto.
- **Hash**: `sha256:dd0ab7020fdf39f25b23e6678acf9f4182ca5c788f343ad1733a32636daace55`

## Domande per il gate (budget: 8 per gate)

Le otto scelte di disegno sopra. Da girare a ARSIAL restano OP-PR-06 (profili misti) e, dal backend, OP-PR-09 (estrazione a
campione). Per ogni flusso: **Approva** / **Rework** (con note) / **Sospendi**. Rework budget: 2 giri per flusso (nessun giro
consumato: il rifacimento di oggi viene dai contratti nuovi, non da un rework chiesto al gate).
