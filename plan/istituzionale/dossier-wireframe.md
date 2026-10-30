# Dossier del gate wireframe - feature istituzionale (green-fe step1-uiplan)

Preparato il 30/10/2026 (06:56 UTC) per il gate umano per flusso, dopo il riallineamento degli ambiti deciso dall'utente
il 29/10/2026 (`cruscotto-lazio-spec/decisioni/MIN-20261029-riallineamento-ambiti.md`, A-1..A-7). **Nessuna
approvazione registrata** (ne' nello stato ne' nello uiplan): nello uiplan ho tolto le `approval` dei due flussi
cambiati, perche' i loro hash non valgono piu'; lo stato non l'ho toccato. Si approva flusso per flusso, sull'hash qui
sotto; ogni modifica a un file della dir del flusso cambia l'hash. Il dossier del 22/10/2026 e' nella storia di git.

## Scelte dell'utente (30/10/2026) e carry-over

Scelte dell'utente del 30/10/2026, tutte le raccomandazioni: due pagine per le verifiche SMP con link reciproci che portano i
filtri comuni (non anno ne' esercizio); dettaglio dell'intervento con TX-0016 e TX-0015 in due schede; card della Home con i
numeri di oggi e testi nuovi; menu: prima la verifica non SIGC, poi la SIGC. Nessun carry-over (`refresh/istituzionale-flows.json`):
da approvare verifica-smp-non-sigc (CAMBIATO; dopo il rework 1 della card, `sha256:50b56a897a73b49c4d196a5efdb3a96a6fd6c237280bdfdca0528bed9079c3ce`),
verifica-smp-sigc (NUOVO, `sha256:46cf705caa939048eece9f1c5fa78062f600df47739d93e1f0e54f7bd42ef218`) e intervento (CAMBIATO,
`sha256:23b9de7b0f94771300578493b9c590f0c25364dc8adf236ed775bbdfcf3fcd9c`); output-regionale tolto (revocato senza dir).

Rework 1 della card della Home (30/10/2026, al gate dei wireframe): l'utente chiede anche i dati SIGC nella card ("bisogna
avere anche i sigc") e sceglie l'ULTIMO ESERCIZIO CHIUSO (dal 16/10 di un anno quello dell'anno, prima quello dell'anno
precedente). La card ha ora due blocchi: non SIGC come prima e SIGC con TX-0015 senza filtri (domande finanziate, spesa
pubblica erogata nell'esercizio = campagna precedente + campagne anteriori, domande pagate nell'esercizio, domande ricevute;
nessuna quota), letture e stati indipendenti. Supera la scelta di disegno 3 di questo dossier ("numeri invariati") e la
nota "nessun esercizio predefinito inventato". Cambiano `home.html`, `verifica-smp-non-sigc.md` e lo uiplan (due campi
della card, testo del flusso); lint e uiplan-validate verdi.

## Cosa cambia per il riallineamento (29/10/2026)

- **Entra TX-0015, verifica SMP SIGC (RF015)**: dal finanziario all'istituzionale (A-1). Flusso nuovo
  `verifica-smp-sigc`, route `/istituzionale/verifica-smp-sigc`, portato da `wireframes/sigc/verifica-smp.html` di HEAD
  (e0f6cb7) e reso come la verifica non SIGC della stessa area. API `GET /api/istituzionale/verifica-smp-sigc` e
  `/{formato}`; "Dati al" da `ultimiDatiSincronizzati` di TX-0015 (non piu' TX-0001); filtri intervento, OS, OG, OP,
  azione con le voci da TX-0060 (G2) ed esercizio obbligatorio; perimetro sempre REGIONALE; grant `csr.tx-0015.read`
  (p1-dirigente, p2-referente-adg, p3-funzionario-area-ist: catalogo rev. 4, P4 e P5 non lo hanno piu').
- **Esce TX-0017, output regionale (RF017)**: passa al fisico (A-1). Tolti il flusso `output-regionale` (dir e voce dello
  uiplan), la route `/istituzionale/output-regionale`, i suoi campi e il link `dettaglio-intervento-output`. La porta il
  fisico da git HEAD.
- **Dettaglio dell'intervento ricomposto** senza TX-0017: due schede, "Verifica SMP non SIGC" (TX-0016, invariata) e
  "Verifica SMP SIGC" (TX-0015, nuova), KPI per scheda, nessun grafico (scelta 2).
- **Verifica SMP non SIGC**: il link G4 verso `/finanziario/sigc/verifica-smp` (decisione superata dal verbale) diventa
  un link intra-feature verso la verifica SIGC coi filtri comuni, con lo speculare dalla pagina SIGC (scelta 1); menu
  dell'area con le due verifiche (scelta 4); card della Home con descrizione e contenuti nuovi, numeri invariati (scelta 3).
- **Handover e uiplan**: `pack_hash` del pack 1.4.0 (sha256:141380bd...), `spec_pins` copiati da `plan/istituzionale/handover.json`
  (istituzionale sha256:e29f8ac4..., elenco-operativo sha256:7532fe3b... invariata). Uiplan: 3 route, 126 campi tutti con
  provenance `spec`, 3 flussi, 12 open point.
- **Open point**: superati o chiusi OP-IS-04 (G4), OP-IS-06 (passa al fisico); aggiornati OP-IS-01, 02, 03, 05, 07, 08, 11;
  aperto OP-IS-12 (unita' di misura dell'output). Restano aperti OP-IS-07, 08, 09; OP-IS-10 informativo.

## Esito dei controlli meccanici

- `uiplan-validate.sh plan/istituzionale/uiplan.json handover/slices handover/authz-catalog.json`: **rc 0** (7
  transazioni attese: TX-0015, TX-0016 della slice istituzionale e TX-0056..TX-0060 dell'elenco; 3 route, 3 flussi).
- `fe-project-check.sh . --feature istituzionale --catalog handover/authz-catalog.json`: **rc 0** (nessuna collisione di
  path o di dir, link verso l'elenco raggiungibili, delega OP-IS-10 risolta). Il controllo e' sullo stato di adesso delle
  altre feature, che altri agenti stanno cambiando in parallelo: va ripetuto prima del gate.
- `wireframe-lint.sh` (template v2) **rc 0** sui tre flussi. **axe: deferred-to-step8** (il lint di step1 non ha un DOM;
  axe vero e' bloccante nel gate 11/11).

## Flussi

| flusso | esito | hash da approvare | hash approvato prima |
|---|---|---|---|
| verifica-smp-non-sigc | CAMBIATO | `sha256:a947ba1b2995bf6641cbf41291b8d56d925acd87bfe8cd07fb370b5460d3e49b` | sha256:dcb8a4bd... (26/10) |
| verifica-smp-sigc | NUOVO | `sha256:46cf705caa939048eece9f1c5fa78062f600df47739d93e1f0e54f7bd42ef218` | - (era il flusso sigc del finanziario, sha256:bff0fa0c...) |
| intervento | CAMBIATO | `sha256:23b9de7b0f94771300578493b9c590f0c25364dc8adf236ed775bbdfcf3fcd9c` | sha256:1932cee7... (22/10) |
| output-regionale | TOLTO (al fisico) | - | sha256:4b7342bf... (22/10) |

Nessun flusso INVARIATO: nell'istituzionale non c'e' carry-over.

### Flusso verifica-smp-non-sigc - CAMBIATO

- **Da aprire nel browser**:
  `C:\Users\lorin\Desktop\Lorenzo\sian-ng\progetti\arsial\arsial-cruscotto\cruscotto-lazio-fe\wireframes\istituzionale\verifica-smp-non-sigc\verifica-smp-non-sigc.html`
  e `...\verifica-smp-non-sigc\home.html` (doc: `...\verifica-smp-non-sigc\verifica-smp-non-sigc.md`)
- **Hash**: `sha256:a947ba1b2995bf6641cbf41291b8d56d925acd87bfe8cd07fb370b5460d3e49b`
- **Route e pattern**: `/istituzionale/verifica-smp-non-sigc`, kind `report`, report v2 (selettore dell'anno, barre,
  tabella delle 21 colonne), invariato.
- **Cosa cambia**: la frase sotto il titolo porta a `/istituzionale/verifica-smp-sigc` ("La stessa verifica per i dati
  SIGC, per esercizio finanziario e con gli stessi filtri") al posto del finanziario; il menu dell'area ha "Verifica SMP
  non SIGC" e "Verifica SMP SIGC" (non piu' "Output regionale") e le altre aree attive (non piu' "presto"); in
  `home.html` descrizione "Dati ASR SIGC e non SIGC per intervento, da confrontare con SMP - Data Platform." e contenuti
  senza grant "Verifica SMP dei dati ASR non SIGC", "Verifica SMP dei dati ASR SIGC per esercizio finanziario"; note
  aggiornate (nessuna lettura di TX-0015 nella card). Non cambiano TX-0016, colonne, grafico, filtri, numeri della card.
- **Grant (verbatim)**: visibilita' `csr.tx-0016.read`; valori dei filtri `csr.tx-0060.read`; frase verso la verifica
  SIGC `csr.tx-0015.read` (nel catalogo rev. 4 lo hanno tutti i profili della pagina: oggi la vedono tutti).
  Transazioni: TX-0016, TX-0060.
- **Campi**: invariati (36, provenance spec: VerificaSmpNonSigc, ValoriFiltriElenco; due voci per la card della Home).
- **url_params** (invariati): anno, intervento, os, og, op, azione (TX-0016.*).
- **Link**: `dettaglio-intervento-smp`, `elenco-ricevute-riga`, `elenco-spesa-riga` invariati; `verifica-smp-sigc` ora
  intra-feature verso `/istituzionale/verifica-smp-sigc` con query intervento, os, og, op, azione (prima: finanziario,
  query vuota, solo con csr.tx-0015.read).
- **Note WCAG** (residuo dichiarato): come il 26/10; la frase dice che porta i filtri e non l'anno. Residuo umano: ordine
  di lettura, note sulle definizioni, bersagli dei link nelle celle (24 px), testi lunghi delle assenze, contrasto. axe
  rinviato allo step8.
- **Open point**: OP-IS-07, 08, 09, 10, 11; OP-IS-04 superato, OP-IS-05 aggiornato.

### Flusso verifica-smp-sigc - NUOVO

- **Da aprire nel browser**:
  `C:\Users\lorin\Desktop\Lorenzo\sian-ng\progetti\arsial\arsial-cruscotto\cruscotto-lazio-fe\wireframes\istituzionale\verifica-smp-sigc\verifica-smp-sigc.html`
  (doc: `...\verifica-smp-sigc\verifica-smp-sigc.md`)
- **Hash**: `sha256:46cf705caa939048eece9f1c5fa78062f600df47739d93e1f0e54f7bd42ef218`
- **Route e pattern**: `/istituzionale/verifica-smp-sigc`, kind `report`, report v2 come la verifica non SIGC: barra
  filtri (chip, perimetro regionale, esercizio, "Dati al"), titolo con la frase verso la verifica non SIGC, pannello dei
  filtri da TX-0060, selettore dell'esercizio (obbligatorio, Mostra; esercizi 2023-2030 come nel finanziario),
  riferimenti della risposta (esercizio, anno delle domande, pagamenti senza data, perimetro), card "Spesa erogata nella
  campagna precedente per intervento" (barre con zoom; PNG, CSV, XLSX), tabella delle 21 colonne (cerca, colonne,
  ordinamento; CSV, XLSX) con le definizioni; stati esercizio non scelto, caricamento, vuoto, valori dei filtri non
  disponibili, errore, file non scaricato.
- **Grant (verbatim)**: visibilita' `csr.tx-0015.read`; valori dei filtri `csr.tx-0060.read`; frase verso la verifica non
  SIGC `csr.tx-0016.read`. Transazioni: TX-0015, TX-0060. Nessun `scope_filters` (perimetro sempre REGIONALE).
- **Campi (35, provenance spec)**: `esercizio`, `annoDomande`, `pagamentiSenzaData`, `perimetro`, `righe[]` (codice e 20
  dati), `ultimiDatiSincronizzati[].flusso`/`.conclusoIl` (`openapi-istituzionale.json#/components/schemas/VerificaSmp`);
  le otto voci di TX-0060 (`ValoriFiltriElenco`).
- **url_params**: esercizio (TX-0015.esercizio, non `required` per la route: senza, la pagina chiede di sceglierlo e non
  legge), intervento, os, og, op, azione (TX-0015.*, multipli). Prima la route del finanziario non ne dichiarava.
- **Link**: `dettaglio-intervento-smp-sigc` (barra o riga -> `/istituzionale/interventi/:codice?esercizio=`, scheda SIGC),
  `verifica-smp-non-sigc` (frase -> `/istituzionale/verifica-smp-non-sigc` coi filtri). Nessun link verso l'elenco, come
  nel finanziario.
- **Scaricamenti**: `GET /api/istituzionale/verifica-smp-sigc/{formato}` con esercizio e filtri (AUDIT_ESPORTAZIONE); PNG
  del grafico dal browser.
- **Note WCAG** (residuo dichiarato): tabella equivalente del grafico; assenze testuali col motivo e la fonte attesa;
  tabella larga con intestazione di riga e righe apribili con Invio; selettore con aiuto collegato; pulsanti per formato
  col nome che dice l'esercizio (2.5.3, 2.4.3); pill "Dati al"; frase resa solo col grant. Residuo umano: ordine di
  lettura, definizioni, testi lunghi delle assenze, contrasto. axe rinviato allo step8.
- **Open point**: OP-IS-07 (definizioni di TX-0015), OP-IS-10.

### Flusso intervento - CAMBIATO

- **Da aprire nel browser**:
  `C:\Users\lorin\Desktop\Lorenzo\sian-ng\progetti\arsial\arsial-cruscotto\cruscotto-lazio-fe\wireframes\istituzionale\intervento\intervento.html`
  (doc: `...\intervento\intervento.md`)
- **Hash**: `sha256:23b9de7b0f94771300578493b9c590f0c25364dc8adf236ed775bbdfcf3fcd9c`
- **Route e pattern**: `/istituzionale/interventi/:codice`, kind `dettaglio`: barra (perimetro, "Dati al" dalla prima
  risposta fra TX-0016 e TX-0015), testata (codice, descrizione da TX-0060, pulsanti verso le due verifiche filtrate),
  schede "Verifica SMP non SIGC" (anno, KPI x3 cumulative, 20 voci; CSV, XLSX) e "Verifica SMP SIGC" (esercizio, KPI x3
  della campagna n-1, riferimenti e 20 voci; CSV, XLSX). Scheda iniziale = quella della pagina di partenza (con
  l'esercizio e senza l'anno, la SIGC). Tolti: scheda Output per anno (grafico e target), scheda Importi unitari, KPI del
  target, pulsante verso l'output regionale, unita' di misura (OP-IS-12).
- **Grant (verbatim)**: visibilita' `csr.tx-0016.read`, `csr.tx-0015.read` (ogni scheda col grant della sua transazione;
  oggi li hanno insieme p1, p2, p3-ist); descrizione `csr.tx-0060.read`. Transazioni: TX-0016, TX-0015, TX-0060.
- **Campi (55, provenance spec)**: i 24 di TX-0016 e i 2 di ultimo dato (VerificaSmpNonSigc), invariati; nuovi i 25 di
  TX-0015 e i 2 di ultimo dato (VerificaSmp); descrizione da TX-0060 (2). Tolti i 19 di MonitoraggioOutput (17 dati e 2 di ultimo dato).
- **url_params**: anno (TX-0016.anno, invariato), esercizio (TX-0015.esercizio, nuovo).
- **Link**: `verifica-smp-intervento`, `elenco-ricevute-intervento`, `elenco-spesa-intervento` invariati (salvo il testo
  dell'innesco); nuovo `verifica-smp-sigc-intervento` (query intervento, esercizio); tolto `output-regionale-intervento`.
- **Note WCAG** (residuo dichiarato): tablist con frecce; voci come tabelle con intestazione di riga e caption col periodo;
  KPI col periodo nel testo; selettori con aiuto collegato; pulsanti per formato col nome che dice intervento ed
  esercizio; pill "Dati al". Residuo umano: ordine di lettura, differenza di periodo fra le schede, etichette lunghe,
  contrasto. axe rinviato allo step8.
- **Open point**: OP-IS-07, 08, 09, 10, 12.

### Flusso output-regionale - TOLTO

- Dir `wireframes/istituzionale/output-regionale/` cancellata dal working tree (resta in git HEAD per il fisico), flusso,
  route, 23 campi e link `dettaglio-intervento-output` tolti dallo uiplan. Era approvato il 22/10/2026
  (sha256:4b7342bf...). Il clic del drawer verso il dettaglio dell'intervento lo decide il fisico (puo' puntare al suo
  dettaglio o, come link cross-feature, a `/istituzionale/interventi/:codice`: in quel caso solo per chi ha anche
  csr.tx-0015.read o csr.tx-0016.read, cioe' p1 e p2, non p3-funzionario-area-fis ne' P5).

## Transazioni coperte

| transazione | requisito | route | flusso |
|---|---|---|---|
| TX-0015 - dati SIGC per il confronto con SMP, con export CSV/XLSX | RF015 (RU-00000015) | /istituzionale/verifica-smp-sigc, /istituzionale/interventi/:codice | verifica-smp-sigc, intervento |
| TX-0016 - dati di verifica SMP non SIGC, con export CSV/XLSX | RF016 (RU-00000016) | /istituzionale/verifica-smp-non-sigc, /istituzionale/interventi/:codice | verifica-smp-non-sigc, intervento |
| TX-0060 - valori dei filtri (slice elenco-operativo) | RA006 | le tre route (pannello e descrizione dell'intervento) | tutti |
| TX-0056..TX-0059 (slice elenco-operativo) | - | delegate alla feature elenco-operativo (OP-IS-10) | - |

Visibilita' dal catalogo rev. 4: p1-dirigente, p2-referente-adg e p3-funzionario-area-ist hanno csr.tx-0015.read,
csr.tx-0016.read e csr.tx-0060.read; gli altri profili non hanno i grant dei due report (SC-IS_DENY: 403). Le due verifiche
hanno quindi lo stesso pubblico. Perimetro sempre regionale.

## Punti aperti (in uiplan.json)

| id | stato | verso | in breve |
|---|---|---|---|
| OP-IS-01 | chiuso (G2), aggiornato | - | valori dei filtri e descrizione da TX-0060, ora anche per TX-0015 |
| OP-IS-02 | chiuso (G3), aggiornato | - | "Dati al" da ultimiDatiSincronizzati, ora anche di TX-0015 (non piu' TX-0001) |
| OP-IS-03 | chiuso (G3), aggiornato | - | export CSV e XLSX, ora verifica-smp-sigc/{formato}; quello dell'output al fisico |
| OP-IS-04 | superato (29/10) | - | link G4 verso il finanziario sostituito dai link reciproci (scelta 1) |
| OP-IS-05 | chiuso (G1), aggiornato | step6 | card e menu dell'area = le due verifiche; cosa cambia a step6 (sotto) |
| OP-IS-06 | chiuso qui | fisico | grafico dell'output fra interventi: segue TX-0017 nel fisico |
| OP-IS-07 | aperto, aggiornato | green-spec / green-be | marcatore "da consolidare" e definizioni (D-02, D-04 e quelle di TX-0015) |
| OP-IS-08 | aperto | utente (step4-lib) | testi dei motivi ANNO_NON_CONSERVATO e FONTE_AMBIGUA (solo TX-0016) |
| OP-IS-09 | aperto | utente / green-be | link verso l'elenco senza scenario di coincidenza |
| OP-IS-10 | delega (informativo) | elenco-operativo | TX-0056..TX-0059 restano dell'elenco |
| OP-IS-11 | aggiornato | step6 | card della Home: numeri invariati, testi nuovi, nessuna lettura di TX-0015 |
| OP-IS-12 | **nuovo**, aperto | green-be (non bloccante) | unita' di misura dell'output assente dalle due verifiche (prima da TX-0017) |

## Cosa dovra' cambiare a step6 (non toccato qui)

- `src/app/aree.ts`, card Istituzionale: descrizione "Dati ASR SIGC e non SIGC per intervento, da confrontare con SMP -
  Data Platform."; contenuti "Verifica SMP dei dati ASR non SIGC", "Verifica SMP dei dati ASR SIGC per esercizio
  finanziario"; commento G1 (niente piu' TX-0017). `Anteprima` invariata (TX-0016).
- Menu dell'area (`features/istituzionale/lib/pagine.ts`, `grant.ts`): voci "Verifica SMP non SIGC" (ingresso) e
  "Verifica SMP SIGC", al posto di "Output regionale"; `GRANT_DETTAGLIO` = csr.tx-0016.read, csr.tx-0015.read;
  `ricercaConservata` invariata. Il finanziario perde la voce "Verifica SMP" (sua feature).
- `src/app/route-table.json`: aggiungere `/istituzionale/verifica-smp-sigc` (flusso verifica-smp-sigc, csr.tx-0015.read);
  togliere `/istituzionale/output-regionale` (la riporta il fisico col suo path); roles del dettaglio =
  csr.tx-0016.read, csr.tx-0015.read. `/finanziario/sigc/verifica-smp` la toglie il finanziario. Nessun alias (A-4).
- Link: `verifica-smp-sigc` intra-feature coi filtri; nuovi `verifica-smp-non-sigc`, `dettaglio-intervento-smp-sigc`,
  `verifica-smp-sigc-intervento`; tolti `output-regionale-intervento` e l'arrivo `dettaglio-intervento-output`.
- `plan/istituzionale/route-manifest.json` rigenerato allo step6.

## Scelte di disegno da far decidere all'utente

1. **Presentazione delle due verifiche SMP.**
   (a) Due pagine, due route e due flussi, con una frase sotto il titolo di ciascuna che porta all'altra coi filtri
   comuni (non l'anno ne' l'esercizio, che non si traducono); (b) una pagina "Verifica SMP" con due schede (non SIGC |
   SIGC) sulla stessa route; (c) due pagine collegate solo dal menu (che gia' conserva i filtri).
   **Raccomando (a)**: resta il pattern report del kit (le schede in un report sarebbero un layout nuovo e una route con
   due periodi diversi), ogni verifica ha il suo indirizzo, e la frase dice la relazione fra le due meta' del confronto
   con SMP; le due pagine hanno lo stesso pubblico, quindi i link non si nascondono mai.
2. **Composizione del dettaglio dell'intervento.**
   (a) TX-0016 + TX-0015 filtrati sull'intervento, una scheda per verifica col suo periodo e i suoi KPI, nessun grafico;
   (b) solo TX-0016 (la scheda non SIGC di oggi); (c) togliere il dettaglio (barre e righe senza destinazione).
   **Raccomando (a)**: i due report dell'area hanno righe dello stesso oggetto (uiplan-patterns 6), il clic di entrambe
   le pagine porta qui, e i 20 dati si leggono meglio in verticale che nella tabella a 21 colonne; con (b) il clic dalla
   verifica SIGC non avrebbe dove andare. Seguito non bloccante: quando il fisico avra' approvato la sua route
   dell'output regionale, un pulsante "Output dell'intervento nel Fisico" (solo con csr.tx-0017.read: p1, p2) al posto
   del grafico per anno tolto.
3. **Card Istituzionale della Home.**
   (a) Numeri invariati (TX-0016: domande finanziate, spesa erogata, quota, domande ricevute) e testi nuovi (le due
   verifiche); (b) aggiungere numeri SIGC da TX-0015 per un esercizio predefinito (per esempio quello in corso calcolato
   dalla data); (c) card solo testuale.
   **Raccomando (a)**: TX-0015 vuole l'esercizio obbligatorio e il contratto non ne da' uno predefinito, che il frontend
   dovrebbe inventare; mettere in una card dati cumulativi e dati di un esercizio confonde i periodi; nessuna lettura in
   piu' sulla Home.
4. **Voci di menu dell'area.**
   (a) "Verifica SMP non SIGC" e poi "Verifica SMP SIGC"; (b) l'ordine dei requisiti, prima SIGC (RF015) e poi non SIGC
   (RF016); (c) una sola voce "Verifica SMP" che apre la non SIGC, con la SIGC raggiungibile dalla frase.
   **Raccomando (a)**: la prima voce e' l'ingresso dalla Home e la non SIGC mostra subito i dati (anno facoltativo) ed e'
   la stessa lettura della card; con (b) dalla Home si entrerebbe in una pagina che chiede l'esercizio prima di mostrare
   qualcosa; con (c) una pagina resterebbe senza voce di menu.

Non e' una scelta ma va detto: la verifica SIGC non ha un esercizio predefinito, come oggi nel finanziario (senza
esercizio chiede di sceglierlo). OP-IS-07 (definizioni e marcatore "da consolidare") resta verso green-spec e green-be.

## Dopo il gate

Per ogni flusso approvato lo stato riceve `steps["step1-uiplan"].gates["wireframe_<flusso>"]` con l'hash qui sopra e lo
uiplan la `flows[].approval` corrispondente (lo fa la sessione che raccoglie la decisione, via `state-set.sh`); il gate
`wireframe_output-regionale` dello stato va tolto, perche' il flusso non e' piu' di questa feature. Una scelta di disegno
diversa dalla raccomandazione rigenera il flusso, lo rilinta e lo ripresenta col nuovo hash.
