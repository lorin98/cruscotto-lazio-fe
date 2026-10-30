# Dossier del gate dei wireframe - feature procedurale

Feature `procedurale` del frontend del cruscotto CSR (green-fe, layout plan dell'ADR 0028). Step1 rifatto il 30/10/2026 per
il riallineamento degli ambiti deciso dall'utente il 29/10/2026 (`../cruscotto-lazio-spec/decisioni/MIN-20261029-riallineamento-ambiti.md`).
**Nessuna approvazione registrata**: lo stato (`.claude/state/green-fe-procedurale.state.json`) non e' stato toccato e lo
uiplan non porta piu' le approvazioni dei flussi (tutte le dir sono cambiate, gli hash approvati non valgono piu').
L'ora di presentazione, per `time_to_approve_s`, la registra chi presenta il dossier.

## Scelte dell'utente (30/10/2026) e carry-over

Scelte dell'utente del 30/10/2026, tutte le raccomandazioni: le determine come ultima voce del menu dell'area; badge del
perimetro nella testata dal campo `perimetro`; un solo messaggio per domanda inesistente e fuori perimetro ("Domanda non
trovata: nessuna domanda con il codice a barre N fra quelle che puoi consultare"); card della Home col testo nuovo e nessun
ingresso alle determine nella panoramica; scheda Unit Amount del dettaglio tolta senza link; link dalla scheda della domanda
dell'elenco operativo alle determine (OP-EO-07 dell'elenco).

Menu disegnato nei wireframe: l'utente ha deciso che le pagine che cambierebbero SOLO nel menu della shell restano come approvate
(la shell dei wireframe non e' normativa, il menu vero e' nel codice). Stati, ammesse, sottofasi e riepilogo sono quindi tornate
byte per byte alla versione approvata (FE e0f6cb7) con la loro `approval` nello uiplan, e il carry-over le ha portate avanti
(`refresh/procedurale-flows.json`): la sezione "CAMBIATI solo nel menu" qui sotto e' superata. Da approvare: determine (NUOVO,
`sha256:22068d00d0180e70251c67261ee7080336451e0c5fa09851b63a1f26d8fd25f6`) e panoramica (CAMBIATO,
`sha256:cad72afc59598c543c6e81996500de0435f50585521bffb7d3257b712044184b`). Unit-amount tolto (revocato senza dir).

## Cosa cambia per il riallineamento degli ambiti (29/10/2026)

- **Decisione**: ogni transazione sta nell'ambito del suo requisito (A-1) e ogni pagina nella feature del suo ambito (A-5),
  con indirizzi per ambito e nessun alias delle vecchie route (A-4). Per il procedurale:
  - **ESCE TX-0030** Unit Amount (RF030, ambito fisico): la porta la feature fisico (`GET /api/fisico/unit-amount`). Escono la
    route `/procedurale/unit-amount` col flusso `unit-amount` (dir `wireframes/procedurale/unit-amount/` tolta; il fisico la
    porta da git HEAD), la scheda Unit Amount del dettaglio dell'intervento, il suo export e la voce di menu.
  - **ENTRA TX-0020** determine di una domanda (RF020, ambito procedurale): nuovo flusso `determine`, route
    `/procedurale/determine/:codice?`, portato da `git show HEAD:wireframes/fisico/determine/*` (approvato il 22/10/2026) e
    adattato: `GET /api/procedurale/domande/{codice}/determina`, grant `csr.tx-0020.read` del catalogo rev. 4 (P1, P2,
    P3 dell'area procedurale; P4 SCOPED sul perimetro ADA; P5 non piu'), campo `perimetro` nella risposta, 404 uguale per
    domanda fuori perimetro e inesistente. Nessun export e nessun ultimo dato, come prima; link alla scheda della domanda
    nell'elenco operativo come prima.
- **Handover** (gia' aggiornato e verificato dal coordinatore, FE e0f6cb7): `plan/procedurale/handover.json` con il pack
  1.4.0 (`sha256:141380bd...35b7`), `handover/openapi-procedurale.json` (`sha256:2d600037...0a33` = `manifest.openapi.hash`),
  catalogo rev. 4 (`sha256:e7a2a122...f809f`). Differenze della spec con il 22/10: fuori `/api/procedurale/unit-amount` e
  `/{formato}` con `PagamentiUnitAmount`, `PagamentiUnitAmountRiga`, `QuantitaProcedurale`; dentro
  `/api/procedurale/domande/{codice}/determina` (operationId TX-0020) con `DetermineDomanda`, `DeterminaCorrente`,
  `DeterminaDellaDomanda`, `LocalDate`; in `ConteggioProcedurale` e `VoceStato` cambia solo la descrizione di `fonte` (senza
  PAGATO_PER_UNIT_AMOUNT). Gli altri DTO e i parametri dei report sono identici: nessun effetto sulle pagine dei report.
- **Uiplan** (`plan/procedurale/uiplan.json`, sha256 `41b79c57262412a1c7ebc714abea14327bfbdbb088769bc9b6c302ad4cc376ae`):
  `pack_hash` e `spec_pins` copiati dal nuovo handover; route `/procedurale/unit-amount` tolta; `/procedurale/interventi/:codice`
  senza TX-0030, RF030 e `csr.tx-0030.read`; route nuova `/procedurale/determine/:codice?` (dettaglio, TX-0020, RF020,
  `csr.tx-0020.read`, scope `territoriale-ada`, link `cerca-domanda` e `scheda-domanda`); 9 campi di TX-0030 tolti, 11 campi
  di TX-0020 aggiunti (provenance `spec`, `openapi-procedurale.json`), 94 in tutto; flusso `unit-amount` tolto, flusso
  `determine` aggiunto con le note WCAG; `approval` tolta da tutti i flussi (dir cambiate). Open point: OP-PR-03, 04, 05, 06,
  08, 10 aggiornati; OP-PR-12, 13, 14 nuovi (sotto).
- **Controlli meccanici**: `uiplan-validate.sh` rc 0 (9 transazioni attese, 8 route, 6 flussi, nessun failure);
  `fe-project-check.sh --feature procedurale` rc 0 (verdict pass, nessun failure, con le cinque feature del progetto);
  `wireframe-lint.sh` verde su tutti e sei i flussi (allowlist del kit v2, a11y statici; `wireframe.css` identico al
  template). **axe NON eseguito**: il lint dichiara `axe: deferred-to-step8`, il controllo axe vero e' bloccante nel gate
  11/11 di step8.
- **Nessun flusso resta invariato**: la voce "Unit Amount" e' nel menu di ogni pagina del procedurale (contenuto visibile),
  quindi ogni dir cambia almeno nel menu (Unit Amount esce, "Determine di una domanda" entra come ultima voce). In `stati`,
  `ammesse`, `sottofasi` e `riepilogo` il cambio e' solo questo (due righe di menu per pagina e una nota nel `.md`): la
  riapprovazione e' rapida. `panoramica` cambia anche nel dettaglio dell'intervento, nel pannello dei filtri e nella card
  della Home. Vedi la scelta 5 se si preferisce tenere il carry-over di quei quattro.
- **Slice elenco-operativo**: non serve per il flusso `determine`. Il link `scheda-domanda` va verso una route dell'elenco
  gia' approvata (`/elenco-operativo/domande/:tipo/:codiceABarre`) e i link fra feature non chiedono il pin della slice di
  arrivo (uiplan-patterns 8, `fe-project-check` lo ha verificato); la pagina non ha filtri, quindi niente valori da TX-0060
  (G2). L'handover resta con la sola slice procedurale.

## Flussi

Gli HTML si aprono nel browser direttamente dal disco. Nel menu dei wireframe le voci delle altre aree ("Fisico (presto)",
"Istituzionale (presto)") restano come approvate il 22/10 e il 26/10: il menu vero e' quello di `src/app/aree.ts` (step6).

| flusso | stato | hash della dir (wireframe-hash.sh) | hash approvato prima |
|---|---|---|---|
| panoramica | CAMBIATO | `sha256:cad72afc59598c543c6e81996500de0435f50585521bffb7d3257b712044184b` | `sha256:eec17f2e...3865` (26/10) |
| stati | CAMBIATO (solo menu) | `sha256:3edbbaef9a503eba5baddc38c1191b9a12e798721414ea942189a5085154c6cc` | `sha256:21fcddef...a294` (22/10) |
| ammesse | CAMBIATO (solo menu) | `sha256:7898d9d202ab85c734f4947f0695524cfdb8ac645e4e7c83e19517513bdd3539` | `sha256:6cbddd38...6eaf` (22/10) |
| sottofasi | CAMBIATO (solo menu) | `sha256:1a3309096ad778579bd782ee11162a6485f3604fa4a1a708039382bbf98c0e82` | `sha256:d73403d3...3b49` (22/10) |
| riepilogo | CAMBIATO (solo menu) | `sha256:702dd4040404b24fdfeff5bbcfbc37b6eb63979e9c433ce131c03b3033e6cf81` | `sha256:77f2d54b...46d1` (22/10) |
| determine | NUOVO (portato dal fisico) | `sha256:22068d00d0180e70251c67261ee7080336451e0c5fa09851b63a1f26d8fd25f6` | - (fisico: `sha256:c797793a...5d32`, 22/10) |
| unit-amount | TOLTO (va al fisico) | - | `sha256:dd0ab702...ce55` (22/10) |

### 1. determine (NUOVO)

- HTML: `C:/Users/lorin/Desktop/Lorenzo/sian-ng/progetti/arsial/arsial-cruscotto/cruscotto-lazio-fe/wireframes/procedurale/determine/determine.html`;
  doc `wireframes/procedurale/determine/determine.md`.
- Route e pattern: `/procedurale/determine/:codice?` - dettaglio v2 (modulo di ricerca role=search, testata con tipo,
  corrente o chiusa, numero di determine e **perimetro**, KPI x4, tabella delle determine con riga aperta). `:codice`
  facoltativo: senza codice (la voce di menu) il solo modulo, nessuna lettura. Grant: `csr.tx-0020.read` (p1-dirigente,
  p2-referente-adg, p3-funzionario-area-pro; p4-responsabile-procedimento-ada SCOPED, `territoriale-ada`).
- Cosa cambia rispetto al fisico approvato: menu e breadcrumb del procedurale; indirizzo e API procedurali; badge
  "Perimetro: regionale" nella testata e stato "perimetro ADA (P4)" col badge "Perimetro: ADA, domande della tua area";
  stato "domanda non trovata" separato dagli altri errori, con lo stesso messaggio per inesistente e fuori perimetro
  ("Domanda non trovata: nessuna domanda con il codice a barre ... fra quelle che puoi consultare"); nota sulla scelta della
  domanda fra quelle dell'area per il P4 (D-11); nota del menu (Procedurale, ultima voce). KPI, tabella, stati vuoto,
  domanda chiusa, caricamento come prima.
- Campi (`spec`, `openapi-procedurale.json`): `codiceABarre`, `tipoDomanda`, `domandaChiusa`, `perimetro` (DetermineDomanda);
  `corrente.motivo` (DeterminaCorrente); `corrente.valore.codice`, `corrente.valore.data`, `elenco[].codice`, `elenco[].data`,
  `elenco[].fonteStatoAreaProgrammazione`, `elenco[].fonteComparto` (DeterminaDellaDomanda). Nuovo rispetto al fisico:
  `perimetro`.
- Link: `cerca-domanda` (stessa route, `codice`); `scheda-domanda` verso elenco-operativo
  `/elenco-operativo/domande/:tipo/:codiceABarre` (tipo e codice dalla risposta; solo con `csr.tx-0058.read` e domanda non
  chiusa; per il P4 anche TX-0058 e' sul perimetro ADA, quindi la scheda della domanda trovata si apre).
- Niente filtri, pill "Dati al" e download (TX-0020 non li ha).
- WCAG (residuo dichiarato): ordine di lettura di modulo, testata, KPI e tabella; comprensibilita' di "stato area
  programmazione", "comparto" e del messaggio "fra quelle che puoi consultare"; perimetro in testo (1.4.1); 404 senza
  differenze di testo, stato o focus fra i due casi; contrasto della resa finale; axe deferito a step8.
- Open point: OP-PR-13, OP-PR-14, OP-PR-06.

### 2. panoramica (CAMBIATO)

- HTML: `C:/Users/lorin/Desktop/Lorenzo/sian-ng/progetti/arsial/arsial-cruscotto/cruscotto-lazio-fe/wireframes/procedurale/panoramica/panoramica.html`,
  `C:/Users/lorin/Desktop/Lorenzo/sian-ng/progetti/arsial/arsial-cruscotto/cruscotto-lazio-fe/wireframes/procedurale/panoramica/intervento.html`
  e `C:/Users/lorin/Desktop/Lorenzo/sian-ng/progetti/arsial/arsial-cruscotto/cruscotto-lazio-fe/wireframes/procedurale/panoramica/home.html`;
  doc `wireframes/procedurale/panoramica/panoramica.md`.
- Route e pattern: `/procedurale` - cruscotto (invariato nel contenuto); `/procedurale/interventi/:codice` - dettaglio con le
  schede Stati delle domande | Area programmazione | Sottofasi (la scheda Unit Amount esce). Grant: `/procedurale`
  `csr.tx-0024.read` ... `csr.tx-0029.read` (invariati); dettaglio `csr.tx-0024.read`, `csr.tx-0026.read`, `csr.tx-0027.read`,
  `csr.tx-0028.read`, `csr.tx-0029.read`, `csr.tx-0031.read`, `csr.tx-0032.read` (**esce `csr.tx-0030.read`**).
- Cambi: menu (Unit Amount esce, Determine di una domanda entra ultima) nelle due pagine; dettaglio: scheda e nota Unit
  Amount tolte, nota dei ruoli senza TX-0030; pannello dei filtri: "valgono per tutte le pagine dei report del procedurale,
  sottofasi comprese; le determine di una domanda si cercano per codice a barre, senza filtri" (prima la frase sulle Unit
  Amount); **card della Home** (`home.html`): testo "Stati e sottofasi delle domande di sostegno e di pagamento, domande
  ammesse con atto di concessione e contributo, riepilogo per intervento e determine di una domanda." e, senza grant,
  l'elenco con "Determine di una domanda" al posto di "Pagamenti per Unit Amount". Numeri, letture e grant della card
  invariati (TX-0026, TX-0027).
- Campi: tolti i due di TX-0030 del dettaglio (righe delle Unit Amount, export unit-amount); gli altri invariati.
- Link: invariati (nessuno portava alle Unit Amount).
- WCAG (residuo dichiarato): come approvato il 26/10 (ordine di lettura di KPI e card, segmento "non rilasciate" senza
  colore, bersagli dei link, data "meno recente" della pill, card della Home); axe deferito a step8.
- Open point: OP-PR-06, 07, 08, 10, 12, 13.

### 3. stati, 4. ammesse, 5. sottofasi, 6. riepilogo (CAMBIATI solo nel menu)

- HTML: `C:/Users/lorin/Desktop/Lorenzo/sian-ng/progetti/arsial/arsial-cruscotto/cruscotto-lazio-fe/wireframes/procedurale/stati/stati-sostegno.html`,
  `C:/Users/lorin/Desktop/Lorenzo/sian-ng/progetti/arsial/arsial-cruscotto/cruscotto-lazio-fe/wireframes/procedurale/stati/stati-pagamento.html`,
  `C:/Users/lorin/Desktop/Lorenzo/sian-ng/progetti/arsial/arsial-cruscotto/cruscotto-lazio-fe/wireframes/procedurale/ammesse/ammesse.html`,
  `C:/Users/lorin/Desktop/Lorenzo/sian-ng/progetti/arsial/arsial-cruscotto/cruscotto-lazio-fe/wireframes/procedurale/sottofasi/sottofasi.html`,
  `C:/Users/lorin/Desktop/Lorenzo/sian-ng/progetti/arsial/arsial-cruscotto/cruscotto-lazio-fe/wireframes/procedurale/riepilogo/riepilogo.html`.
- Route, pattern, grant, campi, link, filtri: invariati rispetto all'approvazione del 22/10/2026 (`/procedurale/stati-sostegno`
  e `/procedurale/stati-pagamento` lista; `/procedurale/ammesse` report; `/procedurale/sottofasi` lista; `/procedurale/riepilogo`
  report; grant `csr.tx-0024.read`, `csr.tx-0025.read` e quelli della transazione della pagina).
- Cambio: nel menu laterale la riga `Unit Amount` esce e `Determine di una domanda` (`../determine/determine.html`) entra dopo
  "Riepilogo per intervento"; nel `.md` una nota "Aggiornato il 30/10/2026" (nel riepilogo anche una parentesi nello storico
  di OP-PR-05). Nient'altro.
- WCAG e open point: come approvati il 22/10/2026 (OP-PR-06, 08, 09 per gli stati; OP-PR-06, 08 per ammesse e riepilogo;
  OP-PR-08 per le sottofasi).

### unit-amount (TOLTO)

Dir `wireframes/procedurale/unit-amount/` cancellata dal working tree (resta in git HEAD, da cui la porta la feature
fisico); flusso e route tolti dallo uiplan. Le scelte approvate il 22/10 che la riguardavano (scelta 8: nota unica sopra la
tabella quando manca il pagato) passano col flusso al fisico.

## Transazioni coperte

| transazione | requisito | cosa | route | export |
|---|---|---|---|---|
| TX-0020 | RU-00000020 (RF020) | codice e data delle determine da cui la domanda prende le informazioni, perimetro | `/procedurale/determine/:codice?` | nessuno |
| TX-0024 | RU-00000024 (RF024) | valori dei filtri e ultimo dato sincronizzato | pannello dei filtri e pill "Dati al" delle 7 route dei report | nessuno |
| TX-0025 | RU-00000025 (RF025) | valori del filtro stato domanda area programmazione | pannello dei filtri dei report | nessuno |
| TX-0026 | RU-00000026 (RF026) | domande ammesse, atto di concessione, importi, interventi attivati | `/procedurale`, `/procedurale/ammesse`, dettaglio | domande-ammesse/{formato} |
| TX-0027 | RU-00000027 (RF027) | stati della domanda di sostegno | `/procedurale`, `/procedurale/stati-sostegno`, dettaglio | stati-sostegno/{formato} |
| TX-0028 | RU-00000028 (RF028) | stati della domanda di pagamento | `/procedurale`, `/procedurale/stati-pagamento`, dettaglio | stati-pagamento/{formato} |
| TX-0029 | RU-00000029 (RF029) | riepilogo per intervento | `/procedurale/riepilogo`, `/procedurale`, dettaglio | riepilogo/{formato} |
| TX-0031 | RU-00000031 (RF031) | sottofasi della domanda di sostegno | `/procedurale/sottofasi`, dettaglio | sottofasi-sostegno/{formato} |
| TX-0032 | RU-00000032 (RF032) | sottofasi della domanda di pagamento | `/procedurale/sottofasi`, dettaglio | sottofasi-pagamento/{formato} |

Grant verbatim dal catalogo rev. 4: li detengono p1-dirigente, p2-referente-adg, p3-funzionario-area-pro e
p4-responsabile-procedimento-ada (perimetro ADA). P5, P6, P7 e i P3 delle altre aree: nessun grant del procedurale (403,
SC-PC_DENY; la voce di menu non compare). TX-0030 non e' piu' di questa slice.

## Open point

| id | stato | in breve |
|---|---|---|
| OP-PR-01 | chiuso (G3) | ultimo dato sincronizzato da TX-0024 (invariato) |
| OP-PR-02 | chiuso (G3) | parametro `azione` uscito dal contratto (invariato) |
| OP-PR-03 | chiuso, aggiornato | sottofasi con i filtri; la parte su TX-0030 rimanda a OP-PR-12 |
| OP-PR-04 | chiuso, **superato in parte** dal verbale del 29/10 | "Unit Amount resta nel procedurale" non vale piu'; G1 resta: card = contenuto reale (ora con le determine) |
| OP-PR-05 | chiuso, aggiornato | l'export unit-amount/{formato} e' uscito con TX-0030; TX-0020 non ha export |
| OP-PR-06 | aperto (verso ARSIAL), aggiornato | profili misti; per TX-0020 il backend da' il perimetro regionale a chi ha il grant anche da un profilo non scoped |
| OP-PR-07 | aperto (informativo) | TX-0024/TX-0025 resi come pannello dei filtri (invariato) |
| OP-PR-08 | aperto (informativo), aggiornato | regole del drill-down: fuori le Unit Amount; la pagina delle determine porta alla scheda della domanda, non all'elenco |
| OP-PR-09 | aperto (backend verso ARSIAL) | stato "PROPOSTO AL PAGAMENTO-ESTRAZ. CAMPIONE-DA ESEGUIRE" (invariato) |
| OP-PR-10 | aperto (step6), aggiornato | card della Home dinamica: testo con "determine di una domanda" |
| OP-PR-11 | aperto (verso green-be) | conteggio delle domande ammesse senza contributo (invariato) |
| OP-PR-12 | **nuovo** (step6) | TX-0030 esce: route, flusso, scheda del dettaglio, voce di menu, export; cosa togliere nel codice |
| OP-PR-13 | **nuovo** (step6) | TX-0020 entra: route `/procedurale/determine/:codice?`, voce di menu, card della Home |
| OP-PR-14 | **nuovo** (verso la feature elenco-operativo) | link dalla scheda della domanda dell'elenco verso le determine (era OP-FIS-08 del fisico) |

## Cosa dovra' cambiare allo step6 (non toccato qui: `src/`, route-table, menu)

- `src/features/procedurale/lib/pagine.ts` (voci del menu Procedurale lette da `src/app/aree.ts`): togliere
  `{ percorso: '/procedurale/unit-amount', voceMenu: 'Unit Amount' }` e aggiungere come ultima voce
  `{ percorso: '/procedurale/determine', voceMenu: 'Determine di una domanda', grant: ['csr.tx-0020.read'] }`, corrente
  anche nei sottopercorsi (`/procedurale/determine/<codice>`, come `conSottopercorsi` del fisico). La pagina non ha filtri:
  i criteri dei report conservati passando dal menu (`ricercaConservata`) non le servono (o le arrivano e li ignora: da
  decidere allo step6, raccomandato non portarli).
- `src/app/aree.ts`, area Procedurale: commento, `descrizione` "Stati e sottofasi delle domande di sostegno e di pagamento,
  domande ammesse con atto di concessione e contributo, riepilogo per intervento e determine di una domanda." e
  `contenuti` con "Determine di una domanda" al posto di "Pagamenti per Unit Amount". `AnteprimaProcedurale` (numeri)
  invariata. L'area Fisico perde "Determine da cui una domanda prende le informazioni" e prende le Unit Amount (feature fisico).
- `src/app/route-table.json` e `plan/procedurale/route-manifest.json`: fuori `/procedurale/unit-amount`, dentro
  `/procedurale/determine/:codice?` (visibility `csr.tx-0020.read`); `/procedurale/interventi/:codice` senza
  `csr.tx-0030.read`. `/fisico/determine/:codice?` esce dalla feature fisico. Nessun alias delle vecchie route (A-4).
- Pagine e feature: fuori `src/pages/procedurale/unit-amount/`, `src/features/procedurale/lib/unitAmount.ts` e le letture,
  i mock, le fixture e i test di TX-0030 (api, lib, ui, esportazioni, grant); la scheda Unit Amount di
  `DettaglioIntervento.tsx`; la frase del pannello dei filtri. Dentro la pagina delle determine in `src/pages/procedurale/`
  con la lettura di TX-0020 dalla spec procedurale (client orval rigenerato allo step2) e il badge del perimetro; si puo'
  partire dal codice del fisico (`src/pages/fisico/determine/`, `src/features/fisico/lib/determine.ts`) cambiando indirizzo,
  API, menu e il messaggio del 404.

## Scelte di disegno da far decidere all'utente

1. **Collocazione della pagina delle determine nel menu dell'area Procedurale.**
   (a) Ultima voce, dopo "Riepilogo per intervento" (applicata nei wireframe); (b) subito dopo "Domande ammesse", vicino ai
   dati che vengono dalle determine (stato area programmazione, contributo); (c) sotto "Strumenti", accanto all'elenco
   operativo. **Raccomando (a)**: e' una ricerca per codice di una sola domanda, non un report coi filtri condivisi delle
   altre voci; in fondo non sposta le voci approvate e resta nell'ambito della sua transazione (A-5), cosa che (c) non fa.
2. **Come la pagina segnala al P4 il perimetro.**
   (a) Badge di testo nella testata dal campo `perimetro` della risposta, "Perimetro: regionale" o "Perimetro: ADA, domande
   della tua area", come la scheda della domanda dell'elenco operativo (applicata); (b) come (a) piu' una frase fissa sotto
   il campo di ricerca, per tutti i profili: "Col profilo ADA la ricerca trova solo le domande della tua area"; (c) un avviso
   prima della ricerca solo per il P4, dedotto dai gruppi del token. **Raccomando (a)**: nessuna lettura in piu' e lo stesso
   schema gia' approvato nell'elenco; (b) spiega prima della ricerca ma la leggono anche i profili regionali; (c) obbliga il
   frontend a leggere i profili dal token, mentre oggi decide coi soli grant e prende il perimetro dalle risposte.
3. **Testo del 404 (uguale per domanda inesistente e fuori perimetro).**
   (a) "Domanda non trovata: nessuna domanda con il codice a barre N fra quelle che puoi consultare." (applicata); (b) come la
   scheda dell'elenco: "Domanda non disponibile: non esiste o e' fuori dal tuo perimetro"; (c) quello del fisico: "Nessuna
   domanda con il codice a barre N". **Raccomando (a)**: vale per tutti i profili e non distingue i due casi; (b) nomina il
   perimetro anche ai profili regionali, per cui il caso non esiste; (c) al P4 fa credere che la domanda non esista.
4. **Panoramica e card della Home.**
   (a) Card della Home con "determine di una domanda" al posto di "pagamenti per Unit Amount" nel testo e nell'elenco senza
   grant, numeri invariati; panoramica senza ingresso alle determine, che si aprono dal menu (applicata); (b) come (a) piu'
   una piccola card "Cerca le determine di una domanda" (campo del codice a barre) nella panoramica, con un link
   `cerca-domanda` dalla panoramica; (c) card della Home senza citare le determine. **Raccomando (a)**: TX-0020 e' per una
   domanda e non ha un numero da mettere nella card ne' un aggregato per la panoramica; (b) e' un ingresso in piu' utile ma
   aggiunge una card estranea ai report; (c) contraddice G1 (la card descrive il contenuto reale dell'area).
5. **Flussi che cambiano solo nel menu (stati, ammesse, sottofasi, riepilogo).**
   (a) Menu aggiornato e quattro flussi da riapprovare, con un diff di due righe per pagina (applicata); (b) lasciarli byte
   per byte com'erano per portare avanti l'approvazione per hash: nel low-fi resterebbero la voce Unit Amount (verso una dir
   che non c'e' piu') e l'assenza delle determine fino al prossimo giro. **Raccomando (a)**: il menu e' contenuto visibile e
   cita Unit Amount, quindi va cambiato; il costo e' una riapprovazione rapida.
6. **Dettaglio dell'intervento senza la scheda Unit Amount.**
   (a) Scheda tolta, nessun link (applicata); (b) al posto della scheda un link "Unit Amount dell'intervento (Fisico)" verso
   la pagina delle Unit Amount del fisico filtrata sull'intervento, visibile solo con `csr.tx-0030.read` (P1, P2; non il P3
   dell'area procedurale ne' il P4), bloccato da un open point finche' il flusso del fisico non e' approvato.
   **Raccomando (a)**: le Unit Amount sono dati di programma dell'ambito fisico, i profili tipici del procedurale non le
   vedono e il link si puo' aggiungere dopo, quando il fisico avra' approvato la sua pagina.

## Domande per il gate (budget: 8 per gate)

Le sei scelte sopra. Per ogni flusso: **Approva** / **Rework** (con note) / **Sospendi**. Rework budget: 2 giri per flusso
(il rifacimento di oggi viene dal verbale del 29/10, non da un rework chiesto al gate). Ordine proposto: determine,
panoramica, poi i quattro flussi cambiati solo nel menu.
