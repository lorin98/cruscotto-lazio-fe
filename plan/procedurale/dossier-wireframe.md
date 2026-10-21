# Dossier del gate dei wireframe - feature procedurale

Feature `procedurale` del frontend del cruscotto CSR (green-fe, layout plan dell'ADR 0028). Preparato il 21/10/2026,
presentato alle 13:24 UTC (ora da usare per `time_to_approve_s`). **Nessuna approvazione registrata**: ne' nello stato
(`.claude/state/green-fe-procedurale.state.json`, step1-uiplan `in_progress` senza gate) ne' nello uiplan.

## In breve

- **Step0**: configurazione confermata dall'utente il 22/10/2026 (identica a elenco-operativo; style-guide
  `docs/decisioni/style-guide.md` con sha256 `56d70fc3...5e29` verificato). Handover della slice copiato dal backend
  (`handover/openapi-procedurale.json` sha256 `461d222b...a492` = `manifest.openapi.hash`;
  `handover/slices/procedurale/manifest.json`; `handover/acceptance/procedurale-scenarios.json`); `handover/authz-catalog.json`
  identico a quello del backend (sha256 `fa3d4c0b...f8`, non riscritto). `fe-handover-check.sh` rc 0, verdict pass, nessun
  failure, gate del backend tutti superati -> `plan/procedurale/handover.json` (sha256 `cedeb9e9...9c28`), gate meccanico
  `handover_verified` registrato, stato a `current_step` 1. Preflight: Node 24.21.0, npm 11.19.0.
- **Step1**: `plan/procedurale/uiplan.json` (8 route, 6 flussi, 9 transazioni attese e coperte) con `uiplan-validate.sh` rc 0
  e `fe-project-check.sh --feature procedurale` rc 0 (nessuna collisione di path o di dir con finanziario, elenco-operativo,
  fisico, istituzionale; tutti i link verso l'elenco operativo puntano a `/elenco-operativo/domande`, flusso approvato, con
  grant raggiungibili). `wireframe-lint.sh` verde su tutti e 6 i flussi (allowlist del kit v2, a11y statici). **axe NON e'
  stato eseguito**: il lint dichiara `axe: deferred-to-step8`, il controllo axe vero e' bloccante nel gate 11/11 di step8.

## Transazioni coperte

| transazione | requisito | cosa | route |
|---|---|---|---|
| TX-0024 | RU-00000024 (RF024) | valori dei filtri: interventi (senza AT001), OS, OG, OP | pannello dei filtri di `/procedurale`, `/procedurale/stati-*`, `/procedurale/ammesse`, `/procedurale/unit-amount`, `/procedurale/riepilogo`; descrizione dell'intervento in `/procedurale/interventi/:codice` |
| TX-0025 | RU-00000025 (RF025) | valori del filtro stato domanda area programmazione | pannello dei filtri delle pagine che accettano `stato` |
| TX-0026 | RU-00000026 (RF026) | domande ammesse, con atto di concessione, importo richiesto, contributo ammesso, interventi attivati e perimetro ufficiale | `/procedurale` (KPI, importi), `/procedurale/ammesse`, `/procedurale/interventi/:codice` |
| TX-0027 | RU-00000027 (RF027) | undici stati della domanda di sostegno, con il di cui non rilasciate | `/procedurale` (card), `/procedurale/stati-sostegno`, `/procedurale/interventi/:codice` |
| TX-0028 | RU-00000028 (RF028) | cinque stati della domanda di pagamento CSR-DP, con il di cui non rilasciate | `/procedurale` (card), `/procedurale/stati-pagamento`, `/procedurale/interventi/:codice` |
| TX-0029 | RU-00000029 (RF029) | riepilogo per intervento (anche CSV) | `/procedurale/riepilogo`; `/procedurale` e dettaglio per lo stato area programmazione |
| TX-0030 | RU-00000030 (RF030) | Unit Amount: importo pagato, percentuale, base storica | `/procedurale/unit-amount`, scheda del dettaglio |
| TX-0031 | RU-00000031 (RF031) | sottofasi di ammissibilita' della domanda di sostegno | `/procedurale/sottofasi` |
| TX-0032 | RU-00000032 (RF032) | sottofasi di ammissibilita' della domanda di pagamento | `/procedurale/sottofasi` |

Grant di tutte le route: `csr.tx-0024.read` ... `csr.tx-0032.read`, verbatim dal catalogo; li detengono p1-dirigente,
p2-referente-adg, p3-funzionario-area-pro e p4-responsabile-procedimento-ada (perimetro ADA). P3 delle altre aree, P5, P6, P7:
nessun grant (403 dal backend; la voce di menu non compare).

## Da segnalare all'utente: card dell'ambito in `src/app/aree.ts` contro le transazioni della slice (OP-PR-04)

Non risolto qui (la card la tocca step6, e solo su tua decisione):

1. **"Determine, responsabili e ADA di riferimento"** (card Procedurale): nessuna transazione della slice lo rende. In TX-0026 la
   determina corrente e' solo la fonte di importo richiesto e contributo ammesso (D-03); determine e responsabile del
   procedimento per domanda sono nella scheda della domanda dell'elenco operativo (TX-0058), codice e data determina in TX-0020
   (slice fisico); TX-0021..TX-0023 sono import PROSA (acquisizione-prosa, nessuna interfaccia). L'ADA compare solo come
   perimetro P4 dichiarato da ogni risposta. Proposta da decidere: riscrivere la voce (es. "Domande ammesse per intervento e
   stato area programmazione") oppure indicare che determine e responsabili si leggono nella scheda della domanda.
2. **"Pagamenti per Unit Amount"** sta nella card **Fisico**, ma e' TX-0030 di questa slice. Nel pack RU-00000030 ha area
   "F2 - Fisico", la transazione pero' e' nello slice-group A4 Procedurale e `csr.tx-0030.read` e' concesso a P1, P2, P3
   dell'area procedurale e P4, **non al P3 dell'area fisica**: in una pagina del fisico il P3 fisico non la vedrebbe. Nei
   wireframe la pagina e' `/procedurale/unit-amount`, in un flusso a se' (`unit-amount`) che puoi approvare o sospendere senza
   toccare gli altri. Da decidere: lasciarla nel procedurale (e togliere la voce dalla card Fisico, o farla puntare qui) oppure
   chiedere al backend il grant per il P3 fisico.
3. Le altre due voci della card Procedurale ("Stati e sottofasi delle domande", "Domande con atto di concessione e contributo
   ammesso") corrispondono a TX-0027/TX-0028/TX-0031/TX-0032 e a TX-0026. Nota: oggi l'atto di concessione e' FONTE_NON_ATTIVA
   (nessun atto nel database), quindi la pagina mostra "non disponibile" al posto del numero.

## Open point nuovi (nello uiplan)

| id | tipo | in breve |
|---|---|---|
| OP-PR-01 | campo-assente-dalla-spec | ultimo dato sincronizzato (NFR-25 b) assente dai DTO procedurali; TX-0001 non riusabile (altra slice, il P3 procedurale non ha `csr.tx-0001.read`); richiesta additiva a green-be su TX-0024 |
| OP-PR-02 | altro | parametro `azione` nel contratto di TX-0026..TX-0030 ma rifiutato con 400 (D-01, scenario dei filtri): la FE non lo usa; contratto da allineare in green-be |
| OP-PR-03 | altro | RF024 chiede i filtri su tutto l'ambito, ma TX-0030 non accetta `stato` e TX-0031/TX-0032 nessun parametro: le pagine lo dichiarano |
| OP-PR-04 | altro | card dell'ambito non allineata alla slice (sopra) |
| OP-PR-05 | altro | export: solo il CSV di TX-0029 (niente XLSX, niente export dei singoli report); sottofasi e Unit Amount non sono nel riepilogo |
| OP-PR-06 | altro | profili misti (come OP-FE-09): il report e' ADA, l'elenco aperto dai link e' regionale |
| OP-PR-07 | altro | TX-0024/TX-0025 (ui_hint form) resi come pannello dei filtri, non come route form (come TX-0001 nel finanziario) |
| OP-PR-08 | altro | regole del drill-down: parte rilasciata (D1), `stato` -> `voceProgrammazione`, cosa non si collega |
| OP-PR-09 | altro | stato SIAN "PROPOSTO AL PAGAMENTO-ESTRAZ. CAMPIONE-DA ESEGUIRE" fra gli altri stati (punto aperto del backend verso ARSIAL) |

## Flussi, nell'ordine proposto per il gate

Ogni flusso si approva da solo (hash della sua dir); il primo approvato sblocca step2. Gli HTML si aprono nel browser
direttamente dal disco (i link fra le pagine e verso l'elenco operativo e il finanziario funzionano in locale).

### 1. panoramica

- HTML: `C:/Users/lorin/Desktop/Lorenzo/sian-ng/progetti/arsial/arsial-cruscotto/cruscotto-lazio-fe/wireframes/procedurale/panoramica/panoramica.html`
  e `C:/Users/lorin/Desktop/Lorenzo/sian-ng/progetti/arsial/arsial-cruscotto/cruscotto-lazio-fe/wireframes/procedurale/panoramica/intervento.html`;
  doc del flusso `wireframes/procedurale/panoramica/panoramica.md`.
- Route e pattern:
  - `/procedurale` - cruscotto (KPI x4 di TX-0026, card stati DS e DP a barre impilate, card stato area programmazione, card
    importi per intervento, pannello dei filtri). Grant: `csr.tx-0024.read`, `csr.tx-0025.read`, `csr.tx-0026.read`,
    `csr.tx-0027.read`, `csr.tx-0028.read`, `csr.tx-0029.read`.
  - `/procedurale/interventi/:codice` - dettaglio (testata, KPI x4, schede Stati delle domande | Area programmazione | Unit
    Amount). Grant: `csr.tx-0024.read`, `csr.tx-0026.read`, `csr.tx-0027.read`, `csr.tx-0028.read`, `csr.tx-0029.read`,
    `csr.tx-0030.read`. E' il dettaglio dell'oggetto ricorrente dei report (l'intervento), come `/finanziario/interventi/:codice`:
    nessuna transazione nuova, gli stessi report con `intervento=:codice`.
- Campi (tutti provenance `spec`, `openapi-procedurale.json`): FiltriProcedurali (interventi, OS, OG, OP), StatiAreaProgrammazione
  (chiave, descrizione, origine), DomandeAmmesse/DomandeAmmesseTotale (perimetro, domandeAmmesse, conAttoConcessione,
  importoRichiesto, contributoAmmesso, interventiAttivati, interventiPerimetroUfficiale; per riga codiceIntervento,
  perimetroIntervento, attivato), StatiDomande/DistribuzioneStati (voci con stato, descrizione, domande, domandeNonRilasciate,
  motivo, fonte; altriStati; totale), RiepilogoProceduraleTotale/Riga (statiAreaProgrammazione), PagamentiUnitAmountRiga
  (scheda Unit Amount). Elenco puntuale in `fields[]` dello uiplan.
- Link: verso l'elenco `elenco-ammesse-panoramica`, `elenco-con-atto-panoramica` (solo con la fonte attiva),
  `elenco-area-programmazione-panoramica`, e dal dettaglio `elenco-ammesse-intervento`, `elenco-con-atto-intervento`,
  `elenco-stato-sostegno-intervento`, `elenco-stato-pagamento-intervento`, `elenco-area-programmazione-intervento`; interni
  `stati-sostegno-panoramica`, `stati-pagamento-panoramica`, `dettaglio-intervento-panoramica`, `panoramica-intervento`.
- WCAG (residuo dichiarato): ordine di lettura di KPI e card, didascalie, segmento "non rilasciate" distinguibile senza colore,
  bersagli di "Apri nell'elenco" (2.5.8), contrasto della resa finale; axe deferito a step8.
- Open point: OP-PR-01, 02, 04, 05, 06, 07, 08.
- **Hash**: `sha256:f8b3d8a289a619b216a055543a6fe3e02cb936b0a2613092113b92100d13ce6f`

### 2. stati

- HTML: `C:/Users/lorin/Desktop/Lorenzo/sian-ng/progetti/arsial/arsial-cruscotto/cruscotto-lazio-fe/wireframes/procedurale/stati/stati-sostegno.html`
  e `C:/Users/lorin/Desktop/Lorenzo/sian-ng/progetti/arsial/arsial-cruscotto/cruscotto-lazio-fe/wireframes/procedurale/stati/stati-pagamento.html`;
  doc `wireframes/procedurale/stati/stati.md`.
- Route e pattern:
  - `/procedurale/stati-sostegno` - lista (KPI domande e di cui non rilasciate, card a barre impilate con tabella equivalente,
    tabella per intervento e stato, drawer). Grant: `csr.tx-0024.read`, `csr.tx-0025.read`, `csr.tx-0027.read`.
  - `/procedurale/stati-pagamento` - lista, stessa struttura con i cinque stati CSR-DP. Grant: `csr.tx-0024.read`,
    `csr.tx-0025.read`, `csr.tx-0028.read`.
- Campi (`spec`): StatiDomande (perimetro, tipoDomanda), StatiDomandeRiga (codiceIntervento), VoceStato, AltroStato,
  DistribuzioneStati (totale, domandeNonRilasciate), FiltriProcedurali, StatiAreaProgrammazione.
- Link: `elenco-stato-sostegno`, `elenco-stato-sostegno-riga`, `elenco-stato-pagamento`, `elenco-stato-pagamento-riga` (verso
  `/elenco-operativo/domande` con `statoSostegno`/`statoPagamento`, `voceProgrammazione` e i filtri: aprono la parte
  rilasciata, domande meno di cui non rilasciate, e l'etichetta lo dice); `dettaglio-intervento-stati-*`.
- WCAG (residuo dichiarato): tabella larga a 320 px (1.4.10), intestazioni brevi con nome accessibile completo, segmento non
  rilasciate senza colore, contrasto; axe deferito a step8.
- Open point: OP-PR-01, 05, 06, 08, 09.
- **Hash**: `sha256:b430714a0473671b40ccc283208c3f90a0c229aab40e268538405c74a885bb9a`

### 3. ammesse

- HTML: `C:/Users/lorin/Desktop/Lorenzo/sian-ng/progetti/arsial/arsial-cruscotto/cruscotto-lazio-fe/wireframes/procedurale/ammesse/ammesse.html`;
  doc `wireframes/procedurale/ammesse/ammesse.md`.
- Route e pattern: `/procedurale/ammesse` - report (KPI x4, due card a barre raggruppate, tabella per intervento con totali
  del backend, drawer). Grant: `csr.tx-0024.read`, `csr.tx-0025.read`, `csr.tx-0026.read`.
- Campi (`spec`): DomandeAmmesse (perimetro), DomandeAmmesseRiga (codiceIntervento, perimetroIntervento, attivato,
  domandeAmmesse, conAttoConcessione, importoRichiesto, contributoAmmesso con valore, motivo, fonte), DomandeAmmesseTotale.
- Link: `elenco-ammesse`, `elenco-con-atto`, `elenco-ammesse-riga`, `elenco-con-atto-riga` (verso l'elenco; quelli dell'atto
  solo con la fonte attiva, perche' altrimenti l'elenco risponde 400), `dettaglio-intervento-ammesse`.
- WCAG (residuo dichiarato): bersagli dei link nelle celle (2.5.8), distinzione fra "non disponibile (fonte non attiva)" e
  "non valorizzato", contrasto; axe deferito a step8.
- Open point: OP-PR-01, 04, 05, 06, 08.
- **Hash**: `sha256:2875040815d08bdfe1e54eea36dce437d8a1fbbdc67748905a6e674defcd26ce`

### 4. riepilogo

- HTML: `C:/Users/lorin/Desktop/Lorenzo/sian-ng/progetti/arsial/arsial-cruscotto/cruscotto-lazio-fe/wireframes/procedurale/riepilogo/riepilogo.html`;
  doc `wireframes/procedurale/riepilogo/riepilogo.md`.
- Route e pattern: `/procedurale/riepilogo` - report come il riepilogo del finanziario (interruttore di pagina Grafico |
  Tabella, vista iniziale Grafico; tabella a quattro sezioni con Colonne, totali del backend, Esporta CSV, drawer). Grant:
  `csr.tx-0024.read`, `csr.tx-0025.read`, `csr.tx-0029.read`.
- Campi (`spec`): RiepilogoProcedurale (perimetro), RiepilogoProceduraleRiga (ammesse, statiAreaProgrammazione, statiSostegno,
  statiPagamento), RiepilogoProceduraleTotale; export `GET /api/procedurale/riepilogo/csv` (senza operationId).
- Link: `elenco-ammesse-riepilogo`, `elenco-con-atto-riepilogo`, `dettaglio-intervento-riepilogo`; le celle degli stati non
  hanno link (il drill-down per stato sta nelle pagine degli stati e nel dettaglio).
- WCAG (residuo dichiarato): tabella a sezioni a 320 px (1.4.10), intestazioni di gruppo (scope colgroup), bersagli dei link,
  pulsante Esporta CSV con sigla visibile e nome completo (2.5.3), contrasto; axe deferito a step8.
- Open point: OP-PR-01, 05, 06, 08.
- **Hash**: `sha256:3bbaf52efb4bcc9ebcae6882f4a7ac8539675327d9f6aedec773bf3865989a0a`

### 5. sottofasi

- HTML: `C:/Users/lorin/Desktop/Lorenzo/sian-ng/progetti/arsial/arsial-cruscotto/cruscotto-lazio-fe/wireframes/procedurale/sottofasi/sottofasi.html`;
  doc `wireframes/procedurale/sottofasi/sottofasi.md`.
- Route e pattern: `/procedurale/sottofasi` - lista (card sostegno con il grafico non disponibile e la tabella delle voci;
  card pagamento con grafico a barre, tabella equivalente e tabella delle altre sottofasi). Nessun filtro (gli endpoint non
  ne accettano). Grant: `csr.tx-0031.read`, `csr.tx-0032.read`.
- Campi (`spec`): SottofasiAmmissibilita (perimetro, tipoDomanda), SottofaseVoce (fase, descrizione, domande), SottofaseCensita
  (codice, descrizione, esito, domande) per `censita` e `altre`.
- Link: nessuno (l'elenco operativo non ha un filtro per sottofase).
- Regola resa: la voce conta le domande DISTINTE delle sottofasi che la abbinano (D-06 Rev. 5), la sottofase censita le sue
  sole domande; la pagina non somma e lo dice.
- WCAG (residuo dichiarato): comprensibilita' delle due colonne di domande e della nota sulle domande distinte, grafico non
  disponibile come testo, contrasto; axe deferito a step8.
- Open point: OP-PR-01, 03, 05, 08.
- **Hash**: `sha256:81137b89553c64684591e58922aba39fc0dae8f6ae751435c500238a5648ffcd`

### 6. unit-amount

- HTML: `C:/Users/lorin/Desktop/Lorenzo/sian-ng/progetti/arsial/arsial-cruscotto/cruscotto-lazio-fe/wireframes/procedurale/unit-amount/unit-amount.html`;
  doc `wireframes/procedurale/unit-amount/unit-amount.md`.
- Route e pattern: `/procedurale/unit-amount` - report (card grafico non disponibile finche' il pagato non arriva, tabella delle
  Unit Amount senza totali, drawer). Filtri intervento, OS, OG, OP (non lo stato). Grant: `csr.tx-0024.read`, `csr.tx-0030.read`.
- Campi (`spec`): PagamentiUnitAmount (perimetro), PagamentiUnitAmountRiga (codiceIntervento, codiceUnitAmount, gruppoColturale,
  esercizio, importoUnitario, outputPrevisto, importoPagato, percentualePagata, baseStorica con valore, motivo, fonte).
- Link: `dettaglio-intervento-unit-amount`; nessun link verso l'elenco (non sono insiemi di domande).
- WCAG (residuo dichiarato): tabella di nove colonne a 320 px, ripetizione di "non disponibile (fonte non attiva)" in tre
  colonne (valutare una nota unica), contrasto; axe deferito a step8.
- Open point: OP-PR-01, 03, 04 (collocazione), 05.
- **Hash**: `sha256:05c61ca577768711047f95b2c4c9a012f72a58de10d9992ad4cf109a10a0fa8b`

## Domande per il gate (budget: 8 per gate)

1. Card dell'ambito (OP-PR-04): come riscrivere "Determine, responsabili e ADA di riferimento" e dove collocare la pagina
   Unit Amount (procedurale, come nei wireframe, o fisico con un grant nuovo per il P3 fisico)?
2. Struttura: va bene un dettaglio procedurale dell'intervento (`/procedurale/interventi/:codice`) accanto a quello del
   finanziario, e due pagine separate per gli stati di sostegno e di pagamento (invece di una sola)?
3. Panoramica: va bene la card "Domande per stato area programmazione" letta dal riepilogo (TX-0029 e' l'unica transazione
   che porta quella distribuzione)?
4. Stati: il clic su una barra filtra la tabella per intervento nella pagina (come le barre del finanziario), e l'apertura
   nell'elenco e' l'azione esplicita "Apri nell'elenco (n rilasciate)" nelle tabelle e nel drawer: confermi?
5. Con la voce In compilazione senza fonte, il suo "di cui non rilasciate" va reso "non disponibile" (come nei wireframe) o
   come lo 0 del DTO?
6. Export (OP-PR-05): basta il CSV del riepilogo, o si chiede al backend l'export dei singoli report e/o di sottofasi e Unit
   Amount (che il riepilogo non contiene)?
7. Da girare al backend: OP-PR-01 (ultimo dato sincronizzato su TX-0024), OP-PR-02 (parametro `azione` da togliere o
   documentare), OP-PR-03 (filtri non applicabili a Unit Amount e sottofasi: eccezione di RF024?).

Per ogni flusso: **Approva** / **Rework** (con note) / **Sospendi**. Rework budget: 2 giri per flusso.
