# Review step9 FULL sul delta delle revisioni del finanziario — cinque feature (01/11/2026, passata 1, budget 3)

Una sola review sul delta comune, con un verdetto PER FEATURE (come il 21/10, il 26/10 e il 30/10, scelta dell'utente del
19/10/2026: review sulle modifiche invece che una completa per feature; deviazione dichiarata dalla procedura green-fe). Ogni
finding dice a quale feature appartiene (`finanziario`, `elenco-operativo`, `fisico`, `istituzionale`, `procedurale`, oppure
`comune` se tocca `src/app`, `src/entities`, `src/shared`, `src/widgets` o i test comuni); il Judge assegna i finding comuni
alle feature su cui ricadono e scrive un file di finding per feature.

## Riferimenti
- **Repo frontend:** `C:/Users/lorin/Desktop/Lorenzo/sian-ng/progetti/arsial/arsial-cruscotto/cruscotto-lazio-fe` (main).
  - Stack: React 19, Vite, React Query, orval, MSW, vitest, kit UI v2 in `src/shared/ui`, ECharts 6; Feature-Sliced Design.
  - Finanziario nel layout legacy alla radice (`uiplan.json`, `route-manifest.json`, `wireframes/<flusso>/`); le altre feature
    in `plan/<feature>/` con wireframe in `wireframes/<feature>/<flusso>/`.
  - Home `src/app/home.tsx`, aree e card `src/app/aree.ts`, menu `src/app/menu.tsx`, route `src/app/route-table.json`.
- **Plugin green-fe:** `C:/Users/lorin/Desktop/Lorenzo/sian-ng/marangi-lab/sian-green/plugins/green-fe`. Da leggere:
  `skills/step9-review/SKILL.md` §2-§3, `_shared/references/review-checklist.md`, `antagonist-brief.md`, `judge-brief.md`,
  `references/uiplan-patterns.md`.
- **Revisioni richieste:** `../../revisioni_finanziario_261030.md` (R01-R22). **Decisioni dell'utente:**
  `../../analisi-2026-10-31/DECISIONI.md` (sezioni F filtro SIGC, U interfaccia, X) e il verbale
  `../cruscotto-lazio-spec/decisioni/MIN-20261031-revisioni-finanziario.md`. **Impatto sul FE:** `../../analisi-2026-10-31/E-impatto-fe.md`.
- **Requirements pack 1.5.0:** `../cruscotto-lazio-spec/reqpack/`. **Contratti:** `handover/openapi-<feature>.json` (=`specs/`),
  catalogo `handover/authz-catalog.json`. Backend gia' rivisto e chiuso: `../cruscotto-lazio-be/review/delta-revisioni-2026-10-31-review.md`.
- **Wireframe approvati il 01/11/2026** (21 flussi, "Approvo tutti"): dossier `review/revisioni-2026-10-31/dossier-wireframe.md`
  (scelte dell'utente: R13 forma B, R17 A, R18 A, testi R20, R03 3 x 2, natura delle card del procedurale, link sui pagamenti
  lordi), sezione "Revisioni del 31/10/2026" di ogni `wireframes/**/*.md`.

Intensita' FULL: tutte le feature hanno authz e scoping (hide-by-role; perimetro ADA).

## Cosa e' cambiato
Perimetro: `git diff 64ada98 HEAD -- src tests uiplan.json route-manifest.json plan specs` (64ada98 = wireframe approvati;
prima: 239d537, ultimo FE con step9 done su tutte le feature salvo lo step8/9 della card istituzionale del 31/10, assorbito qui).
Commit: dc177f1 (spec), f241933 (kit comune), e61939d (finanziario), 5ad5165 (elenco), 40ee466 (fisico), f5c532b (istituzionale),
f4f60c2 (procedurale), a8034a5 (test), c6e9dc5/4a30c79 (stati).
- **Contratti 1.5.0:** `sigc` ('true' | 'false', enum di stringhe) su 47 operazioni di report; `VoceFiltro.perimetro` (SIGC |
  NO_SIGC | null); finanziario con StimaImpegni, Rettifica, FonteRettifiche, ResiduoSuPagamentiIntervento; tolti
  percentualeContributoAmbientale, quotaStato, quotaRegione, vincoloDotazioneLeader, importoRecuperato.
- **Kit comune:** `shared/lib/sigc.ts`; `ControlloSigc` nella `BarraFiltri` (opt-in `filtroSigc`); `sigc` in `entities/filtri`
  (lettura/scrittura, `ricercaDeiSoliFiltri`, `tipoIntervento`); menu che porta `sigc` anche fra le aree; `NonPertinente`,
  `InerteSeNonPertinente` letti da `CardGrafico`, `Sezione`, `Kpi`; `PillTipoIntervento` e `BarraRiferimenti.tipo`; R02
  (`asseCategorieOrizzontale` con interval 0, gradini `ui-grafico--righe-N`, zoom orizzontale oltre 40); R05/R06 (ciambelle con
  importo, percentuale e totale, GraphicComponent); R09 (`Kpi.valorePieno`, carattere adattivo, nowrap); R11 (barra e menu a top 0,
  scroll-padding); R12 (25 righe, riquadro alto quanto la finestra, prima colonna ferma oltre 6 colonne); R20 (subgrid della card,
  token dei numeri, unita' non separata, `NumeroArea.formatoPieno`, `ettariInteri`); griglia `ui-griglia--3` (R03).
- **Finanziario:** vedi il messaggio di e61939d (R03 sei box, R13 B, R14/R21/X3, R15, R08 lordi e rettifiche, stima R04, R16,
  R17 A, R18 A, SIGC non pertinente, pill del tipo nel dettaglio, link verso l'elenco col filtro SIGC corrente anche nell'uiplan).
- **Elenco operativo:** filtro SIGC dal pannello alla barra (per intervento, D-12 Rev.), non piu' un chip; sinottici compatti.
- **Fisico:** superfici solo SIGC (non pertinenti con NO SIGC, lette senza filtro); pill del tipo; testi R20, ettari interi.
- **Istituzionale:** verifiche SMP non pertinenti col filtro opposto; pill del tipo.
- **Procedurale:** stati, sottofasi, ammesse solo NO SIGC (non pertinenti col filtro SIGC, `criteriNoSigc`); area
  programmazione e riepilogo misti; pill del tipo; nessun filtro SIGC nelle determine.

## Punti da valutare
Sono finding solo se tradiscono un wireframe approvato, il pack, il contratto, le decisioni o le regole del progetto.
- **Filtro SIGC:** parametro mandato a tutte e sole le letture che lo prendono (mai alle determine, alla riserva, ai dettagli,
  alla Home); valori validi; conservato fra pagine e aree (menu, briciole, link, pannello "Applica"); "Togli tutti" e chip;
  tabella riportata alla prima pagina; i link verso l'elenco che portano `sigc` (uiplan aggiornato: sigc nei link coi filtri
  correnti) selezionano lo stesso insieme del dato.
- **Non pertinente (F3):** solo le card/pagine di un solo tipo e solo col valore opposto; lettura SENZA filtro e stessa cache di
  "Tutti"; corpo davvero non interattivo (nessun link, clic, drawer o download raggiungibile, anche fuori dalle card del kit);
  accessibilita' (badge e motivo in testo, tabella dei grafici leggibile, axe; contrasto del grigio da misurare: residuo
  dichiarato nel dossier); natura delle card come nelle tabelle "Natura delle card col filtro SIGC" dei wireframe.
- **Conti e testi del finanziario:** sei box (impegnato e quota dalla stessa lettura, mai somme parziali); due barre impilate
  R13 (segmenti che tornano, pagato oltre l'ammesso come nota); cascata del dettaglio coi lordi e le rettifiche (mai il lordo al
  posto del netto); rettifiche e "Con rettifiche" (null = fonte non attiva); stima e nota; riserva 5% e 2% (montante x quota,
  natura), linea a gradini con fasi e soglia; titoli R15 e testi R16; R14/R21/X3 senza residui (codice, mock, test, testi).
- **Regole comuni:** assi (nessuna etichetta saltata, altezza a gradini rispettosa della CSP); sinottici su una riga col valore
  pieno accessibile; 25 righe; barra a top 0 e scroll-padding (WCAG 2.4.11); card della Home allineate.
- **Grant:** nessuna lettura nuova senza il suo grant (la pill del tipo legge TX-0001/TX-0060/TX-0024 solo col grant dei
  valori dei filtri); dettaglio del finanziario senza TX-0002.
- **Test:** provano davvero cio' che dichiarano (letture senza sigc contate, inerte verificato, aria-pressed).

## Scelte gia' approvate (NON sono finding; segnala solo se il codice le tradisce)
- Revisioni R01-R22 come decise il 31/10 (DECISIONI.md F, U, X) e i 21 wireframe approvati il 01/11, comprese le scelte del
  dossier. La shell (menu) dei wireframe NON e' normativa.
- Il filtro SIGC per intervento (F1), il comportamento del backend (zero righe col valore opposto, REV-D1) e TX-0014 senza filtro (F4).
- Debiti e deviazioni gia' accettati nelle review precedenti (`review/*-review.md`, `review/delta-2026-10-21-review.md`,
  `review/riallineamento-2026-10-30/`, `review/card-istituzionale-2026-10-31/`): non riproporli.
- Il separatore delle migliaia it-IT solo da 10.000 (`formatNumber`).
- Gli step3-7 registrati con un gate unico per le cinque feature (`../ambiente-prova/strumenti-sessione-93fdeac2/gate-step3-7.sh`,
  stessi controlli delle SKILL, stripper dello step7 file per file: difetto noto del plugin): non sono finding sul codice.

## Scostamenti dichiarati dall'implementazione, NON approvati: valutali
1. Le quattro ciambelle RF004-RF007 restano quattro card (il wireframe ne disegna una card con quattro ciambelle).
2. Nel riepilogo "Si': n righe" e' testo nella cella (la riga apre l'anteprima con le righe delle rettifiche); nell'avanzamento
   e' un bottone che apre il pannello laterale.
3. Le tabelle dentro una `Sezione` non pertinente sono inerti (non lette dagli strumenti assistivi); per i grafici la tabella
   dei dati resta leggibile (nascosta alla vista).
4. La pill del tipo dei dettagli sta nella barra (BarraFiltri del procedurale e del finanziario, BarraRiferimenti di fisico e
   istituzionale); nel dettaglio del finanziario anche un badge della testata; nessuna pill se l'intervento non e' classificato.
5. Nella panoramica del procedurale le card non pertinenti col filtro SIGC sono KPI delle ammesse, stati di sostegno e di
   pagamento e importi; lo stato area programmazione e' misto (scelta dell'utente del 01/11).
6. `testoAggregato` dell'elenco e la nota "liquidato ... - recuperato" in forma compatta (R09).

## Regole
- SOLA LETTURA: non modificare file del repo e non lanciare npm, build o test.
  - Ammessi i comandi read-only (grep, git show/diff/log).
  - Sono read-only anche gli script del gate non declassabile (`check-ui-authz.sh`, `fe-project-check.sh --built --catalog`),
    con `CLAUDE_PLUGIN_ROOT` del plugin green-fe e `C:/Users/lorin/Desktop/Lorenzo/sian-ng/marangi-lab/sian-green/tools/vendor`
    in testa al PATH.
- Ogni finding va verificato sul codice (file e riga reali) e deve essere azionabile. Niente stile.
- Severita' della checklist con anti-inflation: MAGGIORE solo con un comportamento sbagliato concreto rispetto a pack,
  wireframe approvati o decisioni, un rischio reale, o un test che non prova cio' che dichiara.
- Output: array JSON in `review/revisioni-2026-10-31/review/<file della consegna>`, con oggetti
  `{"id","feature","severity","file":"<path>:<riga>","titolo","evidenza","fix"}`. E' l'unico file che puoi scrivere. Alla
  fine rispondi con un riassunto di poche righe.
