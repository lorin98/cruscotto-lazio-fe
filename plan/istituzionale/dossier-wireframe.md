# Dossier del gate wireframe - feature istituzionale (green-fe step1-uiplan)

Preparato il 22/10/2026 (08:45 UTC) per il gate umano per flusso, dopo il giro G3 del backend e le decisioni dell'utente
G1-G4 del 21/10/2026. **Nessuna approvazione registrata** (ne' nello stato ne' nello uiplan): si approva flusso per
flusso, sull'hash qui sotto; ogni modifica a un file della dir del flusso cambia l'hash e richiede di ripresentarlo. Gli
hash del 21/10 non valgono piu'.

## Cosa e' cambiato dal 21/10/2026

- **Handover nuovo**: spec istituzionale del giro G3 (sha256:b0c069cf...; prima 061d52ef...), manifest e scenari della
  slice ricopiati dal backend; per la decisione G2 l'handover pinna anche la slice **elenco-operativo** (spec
  sha256:7532fe3b..., identica al backend, non ricopiata), come il fisico. `fe-handover-check.sh` rc 0 sulle due slice.
- **Ultimo dato sincronizzato (G3)**: TX-0016 e TX-0017 portano `ultimiDatiSincronizzati`; ogni pagina ha la pill
  "Dati al" come il finanziario (la conclusione meno recente, popover per flusso). Il dettaglio ha ora una barra con
  perimetro e "Dati al", come il dettaglio finanziario.
- **Export (G3)**: `verifica-smp-non-sigc/{formato}` e `output-regionale/{formato}` (csv, xlsx). Un pulsante per formato
  come nel finanziario: PNG solo per i grafici (card della verifica, scheda Output per anno del dettaglio), CSV e XLSX
  nelle card dei grafici e delle tabelle; l'output regionale, senza grafico in pagina, ha solo CSV e XLSX.
- **Filtri da TX-0060 (G2)**: il pannello ha le voci dell'elenco operativo (interventi con descrizione, OS, OG, OP,
  azioni portanti con `legameAzioniDisponibile`), come il finanziario; la testata del dettaglio mostra la descrizione
  dell'intervento. TX-0060 (RA006) e' fra le transazioni delle tre route; la visibilita' resta csr.tx-0016.read e
  csr.tx-0017.read (csr.tx-0060.read e' di tutti i profili: la lettura e' un'azione col controllo del grant, step6).
  Le altre transazioni dell'elenco (TX-0056..TX-0059) restano della feature elenco-operativo (OP-IS-10).
- **Link alla verifica SMP SIGC (G4)**: dalla verifica SMP non SIGC una frase con il link a `/finanziario/sigc/verifica-smp`,
  resa solo a chi ha anche csr.tx-0015.read (p1, p2), senza filtri portati; il finanziario non cambia.
- **Card della Home (G1)**: la tocca lo step6 in `src/app/aree.ts`, non questa feature (annotato in OP-IS-05).
- Chiusi OP-IS-01, 02, 03, 04, 05; aperto OP-IS-10 (delega informativa); restano aperti OP-IS-06, 07, 08, 09.

## Scelte di disegno da far decidere all'utente (una riga ciascuna, con la mia raccomandazione)

1. **Link verso l'elenco operativo (OP-IS-09)**: tenere i quattro link (ricevute -> `tipo=SOSTEGNO`, spesa ->
   `esito=PAGATA&sigc=false`) o bloccarli finche' green-be non estende SC-EO_DRILLDOWN. **Raccomando: tenerli**, la
   coincidenza vale per definizione (D-05, stessi predicati), con richiesta non bloccante a green-be per lo scenario.
2. **Testi dei motivi nuovi (OP-IS-08)**: "non disponibile per l'anno scelto (l'avviso porta i dati del file piu'
   recente)" e "non attribuibile (riga presente sia nel monitoraggio SIGC sia nel non SIGC)". **Raccomando: approvarli**.
3. **Output regionale (OP-IS-06)**: tabella con interruttore della misura e mini grafico nel drawer, senza grafico in
   pagina, oppure tutte le misure in colonne raggruppate per anno. **Raccomando l'interruttore** (12 colonne invece di
   21-24; il confronto programmato-realizzato sta nel drawer e nel dettaglio).
4. **Dettaglio dell'intervento come terzo flusso** (`/istituzionale/interventi/:codice`): approvarlo o toglierlo (allora
   il clic su barre e righe non porterebbe a nessuna pagina). **Raccomando: approvarlo**, e' l'unico posto dove l'output
   per anno si disegna con una sola unita' di misura.

OP-IS-07 (definizioni da confermare e marcatore "da consolidare") non e' una scelta di disegno: va a green-spec e green-be;
nel frattempo le definizioni restano note fisse accanto alle colonne.

## Stato

- **step0 (handover rifatto)**: `plan/istituzionale/handover.json` = slice istituzionale (spec sha256:b0c069cf... =
  manifest.openapi.hash, gate del backend superati) + elenco-operativo (sha256:7532fe3b..., gate superati), pack 1.3.0,
  authz-catalog invariato (sha256:fa3d4c0b...), style-guide invariata. `fe-handover-check.sh` rc 0. Gate meccanico
  `handover_verified` registrato di nuovo con `state-set.sh`:
  sha256:7328f8b2b6eaeba2620fcb7c132c367c784c0338c4264248569835256a601286. Configurazione invariata, step corrente 1.
- **step1 al gate umano**: `plan/istituzionale/uiplan.json` (3 route, 104 campi tutti con provenance `spec`, 3 flussi,
  10 open point di cui 5 chiusi). Controlli meccanici: `uiplan-validate.sh` rc 0 (7 transazioni attese: TX-0016, TX-0017
  e le cinque dell'elenco), `fe-project-check.sh --feature istituzionale --catalog` rc 0 (link verso il finanziario e
  verso l'elenco raggiungibili, destinazioni in flussi approvati, delega OP-IS-10 risolta), `wireframe-lint.sh` rc 0 sui
  tre flussi. **axe: deferred-to-step8** (il lint di step1 non ha un DOM; axe vero e' bloccante nel gate 11/11).

## Transazioni coperte

| transazione | requisito | route | flusso |
|---|---|---|---|
| TX-0016 - dati di verifica SMP per APR (non SIGC), con export CSV/XLSX | RF016 (RU-00000016) | /istituzionale/verifica-smp-non-sigc, /istituzionale/interventi/:codice | verifica-smp-non-sigc, intervento |
| TX-0017 - output regionale realizzato e programmato, con export CSV/XLSX | RF017 (RU-00000017) | /istituzionale/output-regionale, /istituzionale/interventi/:codice | output-regionale, intervento |
| TX-0060 - valori dei filtri (slice elenco-operativo) | RA006 (RU-00000061) | le tre route (pannello e descrizione dell'intervento) | tutti |
| TX-0056..TX-0059 (slice elenco-operativo) | - | delegate alla feature elenco-operativo (OP-IS-10) | - |

Visibilita' dal catalogo: p1-dirigente, p2-referente-adg e p3-funzionario-area-ist hanno csr.tx-0016.read,
csr.tx-0017.read e csr.tx-0060.read; p3 delle altre aree, p4, p5, p6 e p7 non hanno i grant dei report (SC-IS_DENY: 403).
Perimetro sempre regionale. Il link G4 lo vedono solo p1 e p2 (csr.tx-0015.read).

## Punti aperti (in uiplan.json)

| id | stato | verso | in breve |
|---|---|---|---|
| OP-IS-01 | chiuso (G2) | - | voci dei filtri e descrizione dell'intervento da TX-0060; slice elenco-operativo pinnata come nel fisico |
| OP-IS-02 | chiuso (G3) | - | ultimiDatiSincronizzati su TX-0016 e TX-0017: pill "Dati al" su ogni pagina |
| OP-IS-03 | chiuso (G3) | - | export CSV e XLSX dal backend; PNG dei grafici come nel finanziario (non in audit, limite di OP-FE-08) |
| OP-IS-04 | chiuso (G4) | - | link verifica-smp-sigc verso il finanziario, solo con csr.tx-0015.read, senza filtri |
| OP-IS-05 | chiuso (G1) | step6 | card della Home: Istituzionale = verifica SMP non SIGC e output regionale; la applica lo step6 in aree.ts |
| OP-IS-06 | aperto | utente / green-be | nessun grafico fra interventi per l'output (unita' diverse): scelta 3 |
| OP-IS-07 | aperto | green-spec / green-be | marcatore "da consolidare" di NFR-25 (d) assente; definizioni D-02, D-03, D-04 come note fisse |
| OP-IS-08 | aperto | utente (step4-lib) | testi dei motivi ANNO_NON_CONSERVATO e FONTE_AMBIGUA: scelta 2 |
| OP-IS-09 | aperto | utente / green-be | link verso l'elenco senza scenario di coincidenza: scelta 1 |
| OP-IS-10 | delega (informativo) | elenco-operativo | TX-0056..TX-0059 della slice pinnata per TX-0060 restano dell'elenco (come OP-FIS-09) |

## Flusso 1 - verifica-smp-non-sigc

- **Da aprire nel browser**:
  `C:\Users\lorin\Desktop\Lorenzo\sian-ng\progetti\arsial\arsial-cruscotto\cruscotto-lazio-fe\wireframes\istituzionale\verifica-smp-non-sigc\verifica-smp-non-sigc.html`
  (doc del flusso: `...\verifica-smp-non-sigc\verifica-smp-non-sigc.md`)
- **Hash del wireframe**: `sha256:4a53048a290b2708318e4d74613ba4e82eb9b7bc02484ddafb2d4e2c4af91909`
  (21/10: sha256:d6b1435e..., non piu' valido)
- **Route e pattern**: `/istituzionale/verifica-smp-non-sigc`, kind `report`, pattern report v2 come
  `/finanziario/sigc/verifica-smp`: barra filtri (chip, perimetro, anno del file, "Dati al"), titolo con la frase verso la
  verifica SMP SIGC, pannello dei filtri da TX-0060, selettore d'anno con Mostra, card a barre (Grafico | Tabella; PNG,
  CSV, XLSX), tabella dei 21 dati con cerca, colonne, ordinamento e CSV, XLSX; nessun KPI, come nel finanziario.
- **Grant (verbatim)**: visibilita' `csr.tx-0016.read`; lettura dei valori dei filtri con `csr.tx-0060.read`; frase e
  link G4 con `csr.tx-0015.read`. Transazioni della route: TX-0016, TX-0060.
- **Campi nuovi (provenance spec)**: `ultimiDatiSincronizzati[].flusso`, `ultimiDatiSincronizzati[].conclusoIl`
  (`openapi-istituzionale.json#/components/schemas/VerificaSmpNonSigc`); `interventi[].chiave`, `interventi[].descrizione`,
  `obiettiviSpecifici[].chiave`, `obiettiviGenerali[]`, `obiettiviPolicy[]`, `azioniPortanti[].chiave`,
  `azioniPortanti[].descrizione`, `legameAzioniDisponibile` (`openapi-elenco-operativo.json#/components/schemas/ValoriFiltriElenco`).
  Invariati i 24 campi del 21/10 (testa e 21 colonne).
- **Scaricamenti**: export `GET /api/istituzionale/verifica-smp-non-sigc/{formato}` con gli stessi filtri e anno (una
  riga per intervento con i 21 dati, intestazione con ultimo dato per flusso, AUDIT_ESPORTAZIONE); PNG del grafico dal
  browser. I file contengono tutti gli interventi dei filtri, non solo la ricerca.
- **url_params** (invariati): anno (TX-0016.anno), intervento, os, og, op, azione (TX-0016.*, multipli).
- **Link**: `dettaglio-intervento-smp`, `elenco-ricevute-riga`, `elenco-spesa-riga` (invariati); nuovo
  `verifica-smp-sigc` (finanziario: /finanziario/sigc/verifica-smp, query vuota, solo con csr.tx-0015.read).
- **Note WCAG** (residuo dichiarato): tabella equivalente del grafico a un clic; assenze sempre testuali; righe apribili
  con Invio; selettore con aiuto collegato; pulsanti per formato con la sigla nel nome accessibile (2.5.3) e focus
  tenuto durante la preparazione (2.4.3); pill "Dati al" come bottone col nome completo; frase G4 resa solo col grant.
  Residuo umano: ordine di lettura, note sulle definizioni, bersagli dei link nelle celle (24 px), testi lunghi delle
  assenze, testo del link verso un'altra area, contrasto della resa finale. axe rinviato allo step8.
- **Open point**: OP-IS-07, 08, 09, 10 (chiusi qui: 01, 02, 03, 04).

## Flusso 2 - output-regionale

- **Da aprire nel browser**:
  `C:\Users\lorin\Desktop\Lorenzo\sian-ng\progetti\arsial\arsial-cruscotto\cruscotto-lazio-fe\wireframes\istituzionale\output-regionale\output-regionale.html`
  (doc del flusso: `...\output-regionale\output-regionale.md`)
- **Hash del wireframe**: `sha256:4b7342bfd3870e169d098ff86e16b94921f91bde4782a1bddeb9e565fa90f302`
  (21/10: sha256:66836187..., non piu' valido)
- **Route e pattern**: `/istituzionale/output-regionale`, kind `report`, pattern report tabellare v2 (`lista-filtri`:
  barra a chip con periodo e "Dati al", pannello da TX-0060, tabella interattiva con interruttore Programmato |
  Realizzato SIGC | Realizzato non SIGC (cumulativo) e CSV, XLSX, drawer di anteprima col mini grafico per anno). Nessuna
  card grafico in pagina (OP-IS-06), quindi nessun PNG.
- **Grant (verbatim)**: visibilita' `csr.tx-0017.read`; lettura dei valori dei filtri con `csr.tx-0060.read`.
  Transazioni della route: TX-0017, TX-0060.
- **Campi nuovi (provenance spec)**: `ultimiDatiSincronizzati[].flusso`, `ultimiDatiSincronizzati[].conclusoIl`
  (`MonitoraggioOutput`); le otto voci di TX-0060 come nel flusso 1 (`ValoriFiltriElenco`). Invariati i 13 campi del 21/10.
- **Scaricamenti**: export `GET /api/istituzionale/output-regionale/{formato}`: per intervento una riga "Output dell'anno"
  per anno (le tre misure, qualunque sia quella mostrata) e una riga "Importo unitario" per Unit Amount, periodo
  nell'intestazione, AUDIT_ESPORTAZIONE.
- **url_params** (invariati): intervento, os, og, op, azione (TX-0017.*, multipli). La misura dell'interruttore e' stato
  della pagina.
- **Link**: `dettaglio-intervento-output` (invariato).
- **Note WCAG** (residuo dichiarato): interruttore con aria-pressed e didascalia che dice la misura; drawer con
  focus-trap; unita' sempre accanto ai valori; pulsanti CSV e XLSX con la sigla nel nome accessibile; pill "Dati al".
  Residuo umano: tabella larga a 320 px (WCAG 1.4.10), ordine di lettura, contrasto. axe rinviato allo step8.
- **Open point**: OP-IS-06, 07, 08 (chiusi qui: 01, 02, 03, 05).

## Flusso 3 - intervento

- **Da aprire nel browser**:
  `C:\Users\lorin\Desktop\Lorenzo\sian-ng\progetti\arsial\arsial-cruscotto\cruscotto-lazio-fe\wireframes\istituzionale\intervento\intervento.html`
  (doc del flusso: `...\intervento\intervento.md`)
- **Hash del wireframe**: `sha256:1932cee77819cb6b6333e61f8e65b1c45c2f22393985d85fd427c4b56ee79a1b`
  (21/10: sha256:550a15bc..., non piu' valido)
- **Route e pattern**: `/istituzionale/interventi/:codice`, kind `dettaglio`, pattern dettaglio v2 (barra con perimetro
  e "Dati al", testata con codice e descrizione da TX-0060, KPI x4, schede "Output per anno" con barre raggruppate,
  target come riferimento e PNG, CSV, XLSX, "Verifica SMP non SIGC" con selettore d'anno, le 21 voci e CSV, XLSX,
  "Importi unitari"). Compone TX-0016 e TX-0017 filtrate sull'intervento, nessuna transazione nuova del report.
- **Grant (verbatim)**: visibilita' `csr.tx-0016.read`, `csr.tx-0017.read` (ogni scheda col grant della sua
  transazione); descrizione con `csr.tx-0060.read`. Transazioni della route: TX-0016, TX-0017, TX-0060.
- **Campi nuovi (provenance spec)**: `ultimiDatiSincronizzati[].flusso` e `.conclusoIl` (VerificaSmpNonSigc e
  MonitoraggioOutput); `interventi[].chiave`, `interventi[].descrizione` (ValoriFiltriElenco). Invariati i 41 campi del 21/10.
- **Scaricamenti**: CSV e XLSX di TX-0017 con `intervento = :codice` (output per anno e importi unitari) e di TX-0016
  con l'intervento e l'anno scelto; PNG del grafico per anno.
- **url_params** (invariati): anno (TX-0016.anno).
- **Link** (invariati): `verifica-smp-intervento`, `output-regionale-intervento`, `elenco-ricevute-intervento`,
  `elenco-spesa-intervento`. Nessun link verso il finanziario da qui (G4 lo limita alla verifica SMP non SIGC).
- **Note WCAG** (residuo dichiarato): tablist con frecce; grafico con tabella equivalente e target anche come riga di
  testo; voci come tabella con intestazione di riga; pulsanti per formato col nome accessibile che dice l'intervento;
  pill "Dati al". Residuo umano: ordine di lettura di barra, testata, KPI e schede; etichette lunghe; contrasto. axe
  rinviato allo step8.
- **Open point**: OP-IS-06, 07, 08, 09, 10 (chiusi qui: 01, 02, 03).

## Dopo il gate

Per ogni flusso approvato lo stato riceve `steps["step1-uiplan"].gates["wireframe_<flusso>"]` con l'hash qui sopra e lo
uiplan la `flows[].approval` corrispondente (lo fa la sessione che raccoglie la tua decisione, via `state-set.sh`); il
primo flusso approvato chiude lo step1 e sblocca lo step2. Un rework rigenera, rilinta e ripresenta col nuovo hash
(budget di rework: 2; il rifacimento del 22/10 sui contratti nuovi non e' un rework chiesto al gate).
