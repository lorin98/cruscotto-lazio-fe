# Dossier del gate wireframe - feature elenco-operativo

Preparato il 30/10/2026 (step1 rifatto per il riallineamento degli ambiti; brief
`ambiente-prova/strumenti-sessione-317ae849/brief-fe-step1-ambiti.md`). Nessuna approvazione registrata: ne' nello stato
(`.claude/state/green-fe-elenco-operativo.state.json`, non toccato) ne' nello uiplan. Il carry-over lo fa la sessione
principale con `refresh-fe-carryover.sh`.

## Scelte dell'utente (30/10/2026) e carry-over

Scelta dell'utente del 30/10/2026: S-3 (b) APPLICATA, link "Apri le determine della domanda nell'area Procedurale" sotto la tabella
della scheda Determine, verso `/procedurale/determine/:codice?`, visibile solo con csr.tx-0020.read (variante copiata in
`wireframes/elenco-operativo/dettaglio-domanda/` ed `eo-uiplan-variante.jq` applicato allo uiplan; sorgenti conservate in
`ambiente-prova/strumenti-sessione-317ae849/variante-link-determine/`). Carry-over di domande e pagamenti
(`refresh/elenco-operativo-flows.json`); da approvare dettaglio-domanda (CAMBIATO,
`sha256:dc32487d566419c1ad5c67940fb25fe2166ada677fa5ae718b894234a229ed12`) insieme al flusso determine del procedurale (link
reciproci: finche' uno dei due non e' approvato fe-project-check segnala `link_target_not_approved` / `delegation_unresolved`).

## In testa: cosa cambia per il riallineamento (29/10/2026)

- **Decisioni**: verbale `cruscotto-lazio-spec/decisioni/MIN-20261029-riallineamento-ambiti.md`, A-1 e A-3 (TX-0020 determine
  di una domanda passa dal fisico al procedurale), A-4 (indirizzi per ambito, nessun alias), A-5 (pagine del FE per ambito).
- **Contratto**: la slice elenco-operativo non cambia (`refresh/elenco-operativo-detect.json`: `changed_slices` vuoto).
  `handover/openapi-elenco-operativo.json` resta `sha256:7532fe3b3708398d1448238ef2fe4df9e3d1037b096325bc23435cb9dc39a4ca`.
  La feature e' STALE solo per il pack 1.4.0.
- **Catalogo rev. 4**: i titolari di csr.tx-0056..0060.read non cambiano. La scheda della domanda (csr.tx-0058.read) resta
  visibile a tutti gli 11 profili.
- **Nessun riferimento alle transazioni spostate**: nei tre flussi non compaiono TX-0015, 0017, 0019, 0020, 0030 ne' le
  route di fisico, procedurale e istituzionale. Le viste per ambito dell'elenco delle domande gia' mettono "stato area
  programmazione" nella vista procedurale, quindi sono coerenti con A-3.
- **Il link alle determine non c'e'**. Il brief dice che il flusso `dettaglio-domanda` ha un link verso
  `/fisico/determine/:codice`, ma non risulta: non c'e' nel wireframe (`dettaglio-domanda.html` e `.md`), ne' nello uiplan
  (`links` della route della scheda), ne' nel codice (`src/features/elenco-operativo`, `src/pages/elenco-operativo`). Era
  solo una proposta del fisico (OP-FIS-08, "lo dichiarerebbe la feature elenco-operativo nel suo refresh"), mai fatta. La
  scheda Determine mostra le determine da TX-0058 senza link. Esiste solo il passaggio inverso: il link `scheda-domanda`
  della pagina delle determine, che ora e' del procedurale. Per questo non c'e' un link da spostare e il flusso resta
  identico. Aggiungere il link e' la scelta S-3 qui sotto, con la variante gia' pronta.
- **Route del procedurale**: l'agente del procedurale ha scritto nel suo uiplan `/procedurale/determine/:codice?`, con il
  segmento facoltativo come nel fisico, non `/procedurale/determine/:codice`. Un link deve usare il path esatto
  (uiplan-patterns 8), quindi la variante usa `/procedurale/determine/:codice?` con `path_params: ["codice"]`.
- **Uiplan** (`plan/elenco-operativo/uiplan.json`): `pack_hash` 1.4.0 (`sha256:141380bd...5b7`) e `spec_pins` copiati da
  `plan/elenco-operativo/handover.json` (stesso sha della spec). Nuovo OP-EO-07 per il link alle determine (proposta, decide
  l'utente). Route, campi, flussi, link e approvazioni non cambiano.
- **Controlli meccanici**: `uiplan-validate.sh` rc 0 (5 transazioni, 3 route, 3 flussi). `fe-project-check.sh . --feature
  elenco-operativo --catalog` rc 0. Nessun flusso cambiato, quindi nessun lint obbligatorio. Ho comunque passato il lint
  sulla variante di S-3: rc 0.

## Flussi

| flusso | esito | hash (`wireframe-hash.sh`) |
|---|---|---|
| domande | INVARIATO (atteso carry-over) | `sha256:c8a117471712ad00e67e456b346e6eda3f752b0f373c014cca4105b8d3d52fcd` |
| dettaglio-domanda | INVARIATO (atteso carry-over), salvo S-3 (b) | `sha256:563cfad178758ac266d88972435957233494418368e98a1da7ec73d41a343376` |
| pagamenti | INVARIATO (atteso carry-over) | `sha256:e9639ac808de662d2456e707d8d2a0872bcd41328ae4f3133a2ac8f6afdc1f55` |

Gli hash coincidono con gli `approved_hash` dello uiplan. Le dir sono byte per byte quelle di HEAD (e0f6cb7).

### Flusso domande (INVARIATO)

- HTML: `wireframes/elenco-operativo/domande/domande.html`. Route: `/elenco-operativo/domande` (interrogazione,
  csr.tx-0056.read, csr.tx-0057.read e csr.tx-0060.read, territoriale-ada). Campi: 64 (DomandaElenco, PaginaDomande,
  SinotticoElenco, ValoriFiltriElenco). Note WCAG: 6, invariate.

### Flusso dettaglio-domanda (INVARIATO; CAMBIATO solo con S-3 (b))

- HTML: `wireframes/elenco-operativo/dettaglio-domanda/dettaglio-domanda.html`. Route:
  `/elenco-operativo/domande/:tipo/:codiceABarre` (dettaglio, csr.tx-0058.read, territoriale-ada). Campi: 64 (DettaglioDomanda
  e liste). Note WCAG: 4, invariate.
- **Variante S-3 (b), pronta ma non applicata** (nello scratchpad della sessione:
  `C:\Users\lorin\AppData\Local\Temp\claude\C--Users-lorin-Desktop-Lorenzo-sian-ng-progetti-arsial\317ae849-4377-42eb-a51b-7faf8c4c65d4\scratchpad\fin-elenco\variante-link-determine\`):
  - `dettaglio-domanda/`: la dir del flusso con il link. `wireframe-lint.sh` v2 rc 0, hash
    `sha256:dc32487d566419c1ad5c67940fb25fe2166ada677fa5ae718b894234a229ed12`. HTML da aprire: `dettaglio-domanda.html`
    di quella cartella, scheda Determine.
  - `eo-uiplan-variante.jq`: aggiunge allo uiplan il link `determine-della-domanda` (target_feature procedurale, target
    `/procedurale/determine/:codice?`, path_params `codice`, query vuota), una nota WCAG (scopo del link dal solo testo,
    2.4.4), `blocks: ["link:determine-della-domanda"]` su OP-EO-07 (il link non si rende finche' il flusso del procedurale
    non e' approvato) e toglie l'`approval` del flusso. Provato su una copia: `uiplan-validate` rc 0, `fe-project-check
    --feature elenco-operativo` rc 0.
  - Per applicarla:
    1. copiare `dettaglio-domanda/` su `wireframes/elenco-operativo/dettaglio-domanda/`;
    2. `jq -f eo-uiplan-variante.jq plan/elenco-operativo/uiplan.json > tmp && mv tmp plan/elenco-operativo/uiplan.json`;
    3. rifare validate, project-check e hash.
  - **Attenzione all'ordine**: con la variante applicata il flusso dettaglio-domanda non e' piu' approvato fino al nuovo
    gate. Nel frattempo il `fe-project-check --feature procedurale` fallisce con `link_target_not_approved` sul link
    `scheda-domanda` delle determine (l'ho verificato su una copia). Conviene riapprovare dettaglio-domanda nella stessa
    sessione del flusso determine del procedurale. In alternativa il procedurale blocca `link:scheda-domanda` con un
    open point.

### Flusso pagamenti (INVARIATO)

- HTML: `wireframes/elenco-operativo/pagamenti/pagamenti.html`. Route: `/elenco-operativo/pagamenti` (interrogazione,
  csr.tx-0059.read e csr.tx-0060.read, territoriale-ada). Campi: 46 (PagamentoElenco, PaginaPagamenti, TotaliPagamenti,
  ValoriFiltriElenco). Note WCAG: 6, invariate.

Per tutti i flussi **axe e' rimandato allo step8**, bloccante nel gate 11/11.

## Open point

| id | stato | tema |
|---|---|---|
| OP-EO-02..06 | invariati | viste per ambito, drill-down dai report, menu e Home nel layer app/, export, atto di concessione |
| OP-EO-07 | nuovo | link dalla scheda della domanda alla pagina delle determine del procedurale (eredita OP-FIS-08): proposta S-3 |

OP-FIS-08 del fisico sparisce con il flusso determine che lascia il fisico: se ne occupa questa feature con OP-EO-07.

## Cosa dovra' cambiare allo step6

- Menu e Home: niente. La sezione "Strumenti" con Elenco operativo (OP-EO-04) non dipende dagli ambiti.
- Solo con S-3 (b):
  - in `SchedaDomanda`/`TabelleScheda`, sotto la tabella della scheda Determine, il link "Apri le determine della domanda
    nell'area Procedurale", visibile con csr.tx-0020.read (gate di UX);
  - l'indirizzo `/procedurale/determine/<codiceABarre>` passa solo dall'URL, senza import dalla feature procedurale
    (uiplan-patterns 7). Un percorso condiviso puo' stare in `entities/domanda`, come gia' `percorsoSchedaDomanda`;
  - un test per il link visibile e uno per quello nascosto senza grant.

## Scelte di disegno da far decidere all'utente (con la mia raccomandazione)

**S-3. Link dalla scheda della domanda alle determine del procedurale: si', e con quale testo?**

- (a) Nessun link. La scheda resta com'e' e i tre flussi passano col carry-over. Alla pagina delle determine si arriva dal
  menu Procedurale scrivendo il codice a barre.
- (b) Link sotto la tabella della scheda Determine (variante pronta). Etichetta: **"Apri le determine della domanda
  nell'area Procedurale"**, seguita da ": la determina corrente e quella da cui vengono stato area programmazione e
  comparto". Porta a `/procedurale/determine/<codice a barre della scheda>`. E' visibile solo con csr.tx-0020.read
  (p1-dirigente, p2-referente-adg, p3-funzionario-area-pro, p4-responsabile-procedimento-ada; non piu' p5). Per il P4 la
  scheda e' gia' nel suo perimetro, quindi l'arrivo non risponde 404.
- (c) Come (b), ma come pulsante nella testata accanto a "Altre domande del beneficiario", con etichetta piu' corta
  "Determine nel Procedurale".

**Raccomando (b).**

- Il verbale dice (A-3) che le determine di una domanda si consultano nel procedurale con TX-0020. Dalla scheda ci si
  arriva con un clic invece di riscrivere il codice, e la navigazione diventa reciproca con il link `scheda-domanda` del
  procedurale.
- Era gia' la raccomandazione del 22/10 (OP-FIS-08), rimasta in sospeso.
- Stare nella scheda Determine lo tiene nel contesto giusto e non affolla la testata, che ha gia' le due azioni
  principali.
- L'etichetta dice dove porta, area compresa: lo scopo e' chiaro dal solo testo (WCAG 2.4.4) e il cambio di menu e'
  annunciato prima del clic.
- Il costo e' basso: l'elenco e' comunque riaperto da step1 e ripassa da step2-9. La differenza e' un flusso da
  riapprovare e un link con due test.
