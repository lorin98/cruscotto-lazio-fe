# Feature fisico: step2-7 di green-fe del 22/10/2026

Partenza: `.claude/state/green-fe-fisico.state.json` a `current_step` 2 (step0 e step1 done, flussi `superfici` e
`determine` approvati dall'utente il 22/10/2026 con le scelte di disegno registrate fra le deviazioni riviste dei gate).
Eseguiti gli step 2-7 seguendo le skill del plugin (`step2-codegen` ... `step7-test`); gate e transizioni scritti solo
con `state-set.sh` e `state-transition.sh`, ogni gate nello stesso blocco bash del suo `state-set`. La feature e' a
`current_step` 8: **step8-gate e review step9 restano alla sessione principale**. Nessun push.

## Step e gate

| step | gate registrati | note |
|---|---|---|
| step2-codegen | codegen_compiles, orval_types, csrf_static | scaffold gia' presente (template non ricopiato); spec dell'handover copiate in `specs/` come dice la skill (`openapi-*.json` di `handover/`: fisico `sha256:8558e1f4...`, e anche istituzionale e procedurale); fixture di `/auth/status` rigenerate, identiche; orval deterministico (due run, stesso hash); canary FSD |
| step3-api | api_wrappers_compile, querykey_from_factory | TX-0018, TX-0020 ed export D-06 nella spec; TX-0060 dalla slice elenco-operativo pinnata |
| step4-lib | lib_pure_compile, lib_zero_react | |
| step5-ui | ui_components_compile, ui_a11y_axe | hash dei due wireframe ricalcolati dal disco con `wireframe-hash.sh`: uguali agli `approved_hash` (`b3825903...` superfici, `c797793a...` determine) |
| step6-page | pages_compile, route_manifest_valid | `fe-project-check.sh --feature fisico` rc 0; `plan/fisico/route-manifest.json` proiettato e validato |
| step7-test | tests_generated, msw_fail_closed | REQ-must della feature: RA006, RF018, RF020, tutti con describe taggato |

Verifica finale: `npx tsc --noEmit`, `npx eslint .`, `npx vitest run` verdi (55 file, 1105 test). Wireframe, uiplan,
backend e plugin non toccati.

## File principali

- `src/features/fisico/api/index.ts`: `useSuperfici` (TX-0018, filtri ripetuti e campagna), `useDetermine` (TX-0020,
  codice convalidato da chi chiama e codificato nel percorso), `useValoriFiltri` riesportato da `entities/filtri`,
  `esportaSuperfici` (CSV e XLSX, D-06), `rispostaDomandaAssente` e `rispostaDatoNonValido` sul problem-type.
- `src/features/fisico/lib/`: `criteri` (filtri del programma e una sola campagna 2000-2100 nell'indirizzo),
  `superfici` (campagne presenti, campagna di riferimento = filtro o la piu' recente, totali dentro la campagna e mai fra
  campagne, righe per intervento e campagna, interventi senza superfici), `formato` (ettari con due decimali e segno,
  quantita' a premio con la resa unica delle assenze), `grafici` (barre DS e DP, linea per campagna, verifica DP - DS
  con lo zero al centro, mini linea dell'anteprima), `determine` (codice del percorso e del modulo, link cerca-domanda e
  scheda-domanda, testi), `grant` (con `makeRolePredicate`), `pagine`, `dto` (forme strutturali; `ui/contratto.ts` le
  verifica a compilazione contro i DTO generati).
- `src/features/fisico/ui/`: `SuperficiAmmissibili` (pagina delle superfici), `PannelloFiltriSuperfici`,
  `AnteprimaIntervento`, `TabellaSuperfici`, `useCriteriNellIndirizzo`, `esportazioni`, `DetermineDellaDomanda`,
  `CercaDomanda`.
- `src/pages/fisico/superfici/page.tsx`, `src/pages/fisico/determine/page.tsx`; due voci in `src/app/route-table.json`:
  `/fisico/superfici` (visibility `csr.tx-0018.read`, azioni hide-by-role TX-0018 e TX-0060 con `csr.tx-0060.read`) e
  `/fisico/determine/:codice?` (visibility e azione `csr.tx-0020.read`).
- `src/app/aree.ts`: Fisico passa da AREE_FUTURE ad AREE (Superfici ammissibili, Determine di una domanda, visibili per
  grant); card Fisico secondo G1 (superfici e determine, senza output programmato e realizzato ne' Unit Amount); card
  future di Procedurale e Istituzionale riscritte secondo G1, non attivate. `src/app/menu.tsx`: una voce puo' restare
  corrente nei sottopercorsi (`conSottopercorsi`, per `/fisico/determine/<codice>`).
- `src/app/tetti-letture.ts`: `/api/fisico/` nella coda comune delle letture (SC-FS_CAPACITA: il tetto per utente del
  backend conta insieme finanziario, elenco e fisico, anche TX-0020).
- `src/shared/api/mock/server.ts`: i mock generati del fisico, come quelli dell'elenco, restano fuori dal server dei test
  (ogni test dichiara le sue letture). `src/features/fisico/api/mock/esempio.ts`: dati d'esempio per il dev server.

Scelte di disegno approvate rispettate: CSV e XLSX delle card della campagna di riferimento con la campagna della card
(barre per intervento e verifica), coi filtri della pagina nella serie per campagna e nella tabella; campagna di
riferimento = filtro o la piu' recente; una sola route `/fisico/determine/:codice?`; nessun drill-down verso l'elenco
(OP-FIS-05); il pannello, con una campagna nell'indirizzo, propone quella e "Tutte le campagne" senza una seconda lettura.

## Riusi e spostamenti nel codice comune

Ogni spostamento ha un commit suo; le feature di partenza riprendono i pezzi dal codice comune (riesportazioni o
wrapper sottili), con lo stesso comportamento e gli stessi test.

| pezzo | da | a | chi lo usa |
|---|---|---|---|
| lettura di TX-0060 (`useValoriFiltri`, stessa query-key e cache) | `features/elenco-operativo/api` | `entities/filtri/api` | elenco (riesportata), fisico; pronta per l'istituzionale (G2) |
| filtri del programma (formato, lettura e scrittura nell'indirizzo, etichette, chip, azione non applicata) | `features/finanziario/lib/filtri` | `entities/filtri/lib/programma` | finanziario (riesportati), fisico |
| gruppi del pannello del programma (intervento, OS, OG, OP, azione) | `features/finanziario/ui/PannelloFiltri` | `entities/filtri/ui/GruppiProgramma` | finanziario, fisico (con `senzaVoci` per i valori assenti) |
| codice a barre, riferimento e percorso della scheda della domanda, etichette del tipo | `features/elenco-operativo/lib` | `entities/domanda` | elenco (stessi nomi), fisico (link scheda-domanda, TX-0020) |
| anno di un parametro 2000-2100 | `features/finanziario/lib/filtri` | `shared/lib/anni` | finanziario (riserva, esercizio), fisico (campagna) |
| Briciole e TestaPagina | widget del finanziario, testata dell'elenco | `shared/ui/pagina/Testata` | finanziario, elenco, fisico |
| file CSV/XLSX del backend (`scaricamentiDalBackend`) | esportazioni del finanziario e dell'elenco | `shared/ui/scarica/scaricamenti` | finanziario, elenco, fisico |

Estensioni del kit, senza effetti sulle altre aree: `formatEttari`, `ettari`/`valoreEttari`/`asseEttari` e la misura
facoltativa di `barreRaggruppate` (`MISURA_ETTARI`, default euro); piu' righe di totali in `TabellaInterattiva`;
`nomeAccessibile` facoltativo del `Kpi` (scioglie DS e DP e contiene l'etichetta visibile, WCAG 2.5.3). Riusati senza
modifiche: CardGrafico con vista iniziale Grafico e `InterruttoreVista`, `PulsantiScarica`, `PillDatiAl`, `BarraFiltri`,
`PannelloLaterale`, `VistaQuery`/`AvvisoPagina`, `TabellaStatica` e la resa delle assenze di `entities/importo`
(`descriviAssenza`, `testoConNota`, `ValoreMotivato`).

## Test

- `tests/fisico-api.test.tsx`: wrapper su MSW (criteri ripetuti, enabled guard, codice nel percorso, 404 e 400 sul
  problem-type, cache comune di TX-0060 con l'elenco, export e 400 dal Blob d'errore), mock di esempio.
- `tests/fisico-lib.test.ts`: L1 di tutte le funzioni pure del fisico.
- `tests/entita-filtri-domanda.test.ts`, `tests/kit-comune.test.tsx`, aggiunte in `tests/lib.test.ts` e
  `tests/shared-grafici.test.ts`: il codice comune spostato o esteso, e l'identita' delle riesportazioni.
- `tests/fisico-ui.test.tsx`: L2 su MSW e axe per ogni componente.
- `src/pages/fisico/superfici/page.test.tsx` (describe RF018 e RA006) e `src/pages/fisico/determine/page.test.tsx`
  (describe RF020, con la ricerca da tastiera, il focus sul titolo e l'errore collegato al campo): stati vuoto,
  caricamento ed errore distinti, axe sulle pagine.
- Aggiornati `tests/app-aree.test.tsx` (pagine con segmento facoltativo, card G1, menu del Fisico, voce corrente col
  codice), `tests/shell.test.tsx` (Fisico non piu' "presto"), `tests/bff-mutator.test.ts` (coda comune col fisico).

Copertura v8 dei file del fisico e del codice comune nuovo: 95,7 % istruzioni, 88,7 % rami (misura locale; le soglie le
applica step8).

## Punti aperti

1. **Gate e review**: step8 e step9 del fisico; poiche' il codice comune e' stato spostato da finanziario ed elenco
   operativo (tabella sopra), anche il loro step8 va rifatto prima del push (i report del gate sono di prima).
2. **Istituzionale** (in step2): il suo uiplan ha gia' TX-0060 fra le transazioni delle route e la slice elenco-operativo
   in `spec_pins`, nella stessa forma del fisico; per i filtri puo' usare `entities/filtri` (lettura di TX-0060 e gruppi
   del pannello) invece di scriverne una copia.
3. **OP-FIS-08**: il link dalla scheda della domanda dell'elenco verso `/fisico/determine/:codice?` resta da dichiarare
   nel refresh della feature elenco-operativo (target_feature fisico).
4. **Testi rispetto al low-fi** (da guardare in review, nessun wireframe toccato): la quantita' richiesta a premio dice
   "non disponibile (fonte quantità richiesta a premio non attiva)", la resa unica delle assenze, invece di "non
   disponibile (fonte non attiva)"; OG, OS e OP sono tre gruppi del pannello come nel finanziario (il low-fi li mostra in
   un gruppo); il drawer ha titolo il codice e sopratitolo "Anteprima dell'intervento", come il riepilogo del finanziario;
   nel modulo delle determine l'h2 "Cerca le determine di una domanda" precede l'h1, come nel wireframe.
5. **Test instabile**: una sola esecuzione con la copertura v8 ha dato un fallimento non identificato su una pagina con
   barra dei filtri e download; non si e' riprodotto in cinque esecuzioni successive (con e senza copertura).
6. **OP-FIS-04** resta informativo: la quantita' richiesta a premio e' sempre FONTE_NON_ATTIVA; quando arrivera', la
   verifica incrociata la mostra nella tabella equivalente senza cambiare il layout.
