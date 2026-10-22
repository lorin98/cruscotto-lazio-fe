# Correzioni della review step9 FULL del fisico, v1 iterazione 1 (22/10/2026)

Giro di correzione dei 14 finding accettati dal Judge (`judge.md`, `../../fisico-findings.json`), con le decisioni
dell'utente D1 e D2. Base: `dcedafe` (review). Commit su `main`, uno per sottoargomento, **non pushati**. Nessuna modifica a
`.claude/state/*.state.json`, al backend, al plugin o ai wireframe di flussi diversi da superfici.

Parti CONTESTATE dal Judge, rispettate: per V1/X1 nessuna seconda lettura di TX-0018 senza filtro (una lettura per
pagina); per A2 la codifica resta un requisito e il test la prova con un codice che la richiede; il focus di A1/X2 si
sposta DOPO la chiusura del dialogo (in un effetto, non nel gestore); X3 alla riga corretta (`TabellaSuperfici.tsx:85`).

## Finding

| finding | cosa | file principali | commit |
|---|---|---|---|
| **V1** (MAGGIORE; D1; assorbe V2, X1) | La campagna della risposta (`SuperficieAmmissibile.campagna`, null = letta senza filtro) decide il testo degli interventi senza superfici: con il filtro "nessuna superficie nella campagna N (non valorizzato)" in tabella (colonna Campagna), nelle note degli omessi dei due grafici (cella breve "nessuna superficie (non valorizzato)") e nell'anteprima; `SENZA_SUPERFICI` solo senza filtro. Nell'anteprima filtrata la mini linea e' `nonDisegnabile(MOTIVO_CON_CAMPAGNA)` e la fonte dice "l'anteprima mostra solo la campagna N", senza seconda lettura. Stato vuoto con il filtro: "Nessuna superficie per gli interventi scelti nella campagna N (non valorizzato). Togli il filtro Campagna per vedere le altre campagne."; senza filtro il testo attuale (senza la campagna). Test: `superficiPer` nelle fixture risponde come il backend ai criteri (V2) ed e' usato da `servi()` dei test di pagina e da `serviSuperfici()` dei test dei componenti; test di pagina `?campagna=2024` con SRB02 solo nel 2025 (tabella, nota del grafico, anteprima di SRB02, mini linea di SRB01); test L1 di `senzaSuperfici`, `righeTabella`, builder e testi col filtro | `lib/superfici.ts`, `lib/formato.ts`, `lib/grafici.ts`, `ui/TabellaSuperfici.tsx`, `ui/AnteprimaIntervento.tsx`, `ui/SuperficiAmmissibili.tsx`, `testing/fixture.ts`, `pages/fisico/superfici/page.test.tsx`, `tests/fisico-lib.test.ts`, `tests/fisico-ui.test.tsx` | `691ad34`; wireframe `c82d051` |
| **A1** (assorbe X2) | `applicaConFocus` in SuperficiAmmissibili per "Mostra solo", il clic sulla serie per campagna e "Applica i filtri" del pannello aperto da "Modifica i filtri" dello stato vuoto: il focus va sull'h1 in un effetto dopo il render che ha chiuso il dialogo (`useFocusDopoIlCambio`, nuovo nel kit). Dal bottone Filtri della barra il focus torna al bottone (react-aria). `useFocusTitolo` e `TestaPagina` accettano il ref dell'h1 (`refTitolo`, facoltativo). Test: dopo "Mostra solo SRB01", dopo il clic sulla serie (focus prima nella card) e dopo vuoto -> Modifica i filtri -> Applica, `document.activeElement` e' l'h1 (i tre falliscono senza la correzione, provato); dalla barra torna al bottone | `shared/ui/focus.ts`, `shared/ui/pagina/Testata.tsx`, `ui/SuperficiAmmissibili.tsx`, `page.test.tsx` | `e8fe95a` |
| **V3** | Test di caricamento delle determine: TX-0020 trattenuta, scheletro `role=status` `aria-live=polite`, nessun alert ne' tabella, solo h1; poi la tabella | `pages/fisico/determine/page.test.tsx` | `8a55b6e` |
| **A2** | `useDetermine('1/../x')` deve chiamare `/api/fisico/domande/1%2F..%2Fx/determina` (un solo segmento, un solo endpoint); senza `encodeURIComponent` il test fallisce (provato) | `tests/fisico-api.test.tsx` | `1d16fa9` |
| **X3** | `ordineIniziale={{ chiave: 'campagna', verso: 'decrescente' }}`: SRB01 2025, SRB01 2024, poi SRA29; test all'ordine del wireframe con `aria-sort` | `ui/TabellaSuperfici.tsx`, `tests/fisico-ui.test.tsx` | `12c80d3` |
| **X4** | Con `senzaVoci` e nessuna voce di Intervento il gruppo dice "Nessuna voce: valori dei filtri non disponibili."; "Nessuna voce corrisponde alla ricerca." solo dopo una ricerca. Test L2: TX-0060 in errore e TX-0018 con righe [] | `entities/filtri/ui/GruppiProgramma.tsx`, `tests/fisico-ui.test.tsx` | `ef0cb2e` |
| **H1** | `Gruppo`, `Caselle` (disabilitato, segnaposto, testo della lista vuota facoltativi; etichetta o codice e descrizione) e `Scelte` (ripetibili o esclusive) in `shared/ui/filtri/ControlliPannello.tsx`, dal barrel del kit. GruppiProgramma li importa; `controlli.tsx` dell'elenco tiene i campi di testo e una `Caselle` che passa al kit "Nessun valore nel tuo perimetro."; GruppoCampagna del fisico e' `Scelte` esclusive con "Tutte le campagne" voce senza valore. `Gruppo` esce dal barrel di entities/filtri. Un solo test dei controlli, nel kit | `shared/ui/filtri/ControlliPannello.tsx`, `shared/ui/index.ts`, `entities/filtri/*`, `elenco-operativo/ui/controlli.tsx`, `elenco-operativo/ui/PannelloFiltriElenco.tsx`, `fisico/ui/PannelloFiltriSuperfici.tsx`, `tests/kit-comune.test.tsx` | `a557bf6` |
| **H2** | `useFiltriProgrammaNellIndirizzo` (leggi, scrivi, attivi, conValori, valori, nessuno -> filtri, inAttesa, chip, applica, togliTutti) e `useBozzaFiltri(aperto, applicati)` in entities/filtri/ui; `filtriNellaBarra` nel lib. Finanziario (TX-0001, parametri di pagina) e fisico (TX-0060, campagna) li compongono. Un solo test della regola X-03, nell'entity | `entities/filtri/ui/useFiltriProgrammaNellIndirizzo.ts`, `entities/filtri/lib/programma.ts`, `finanziario/ui/useFiltriNellIndirizzo.ts`, `finanziario/ui/PannelloFiltri.tsx`, `fisico/ui/useCriteriNellIndirizzo.ts`, `fisico/lib/criteri.ts`, `tests/entita-filtri-ui.test.tsx` | `cee5e26` |
| **H3** | Nel lib con test L1: `notaQuantitaPremio` (anche il ramo con un valore), `testoDomande`, `descrizioneIntervento` (formato), `campagneDellAnteprima`, `campagneProposte` (superfici), `vociDelPannello` (criteri) | `fisico/lib/*`, `tests/fisico-lib.test.ts` | `236ddd7` |
| **H4** | `lib/report.ts`: `kpiDellaCampagna` e `cardDelleSuperfici` descrivono KPI e card come dati, resi con un map (icone e toni nella UI). Report in `ui/ReportSuperfici.tsx` (nuovo); pagina con `CorpoSuperfici`; pannello con `Azioni` e `GruppiDelPannello`; `CampoCodice` in CercaDomanda; `VociRiferimento` nell'anteprima; GruppiProgramma per gruppo. Tutti i componenti del fisico e di entities/filtri sotto 30 righe (massimo 28). I criteri della regola comune sono stabili per indirizzo (`useMemo`), cosi' le card si ricalcolano solo con dati o criteri nuovi | `fisico/lib/report.ts`, `fisico/ui/*`, `entities/filtri/ui/*` | `236ddd7` |
| **H5** (D2) | Fisico: `ettari` del kit al posto di `testoSuperficie` (tolta). Elenco: `testoSuperficie` usa `ettari` e tiene "non valorizzata"; test "12,50 ha" (e "12,40 ha") | `fisico/lib/formato.ts`, `fisico/lib/report.ts`, `fisico/ui/AnteprimaIntervento.tsx`, `elenco-operativo/lib/formato.ts`, `tests/elenco-operativo-lib.test.ts`, `tests/fisico-lib.test.ts` | `c5ccabe` |
| **H6** | `TestataDettaglio` in `shared/ui/pagina` (`idTitolo`, `titolo`, `h1`, `sopratitolo?`, `badge?`, `azioni?`) usata dalle determine e dalla scheda della domanda; test nel kit. Il dettaglio dell'intervento del finanziario ha un markup diverso (nessun h1 nella hero, badge senza lista) e resta com'e' | `shared/ui/pagina/Testata.tsx`, `fisico/ui/DetermineDellaDomanda.tsx`, `elenco-operativo/ui/SchedaDomanda.tsx`, `tests/kit-comune.test.tsx` | `9de8185` |
| **H7** | `puoLeggere` = `hasGrant(status, GRANT[lettura])`, senza `PREDICATI` ne' l'import di `shared/lib/predicates.ts`; commento corretto | `fisico/lib/grant.ts` | `dd0ef53` |
| **H8** | `eProblema(errore, kind)` in `shared/api/problem/e-problema.ts`; i cinque wrapper delle tre feature restano col loro nome come una riga che lo chiama; test in `tests/problem-types.test.ts` | `shared/api/problem/e-problema.ts`, `*/api/index.ts` | `14a8729` |

## Wireframe del flusso superfici: da far riapprovare

Commit `c82d051`. `wireframe-lint.sh` verde. L'approvazione **non** e' registrata: l'hash del flusso passa da
`b3825903e66f4c1db6ac3462fccc2b492b3c4e2d72e22350910f1b1e099640e6` a
`f803b5cf0cdee87bcce162b1d9d3d8a4a3eea8fcd7763ab25a2fb4bfa9dac6bd` (`wireframe-hash.sh wireframes/fisico/superfici`).
Cosa e' cambiato:

- **Stato vuoto "nessuna superficie" (D1)**, html e md: due forme. Senza filtro: "Nessuna superficie per gli interventi
  scelti: gli interventi non sono a superficie o non sono SIGC (non valorizzato)." Con il filtro Campagna (prima era
  questa sola, con la seconda meta' falsa): "Nessuna superficie per gli interventi scelti nella campagna 2025 (non
  valorizzato). Togli il filtro Campagna per vedere le altre campagne.", con "Modifica i filtri".
- **Interventi senza superfici con il filtro Campagna (V1)**: nel md la sezione nuova "Filtro Campagna e interventi senza
  superfici" con la tabella dei testi senza e con il filtro (colonna Campagna, note degli omessi, cella breve, anteprima,
  mini linea); nell'html la "Vista: Tabella con il filtro Campagna" (esempio 2024: SRB01 con superfici, SRB02 "nessuna
  superficie nella campagna 2024 (non valorizzato)") e una nota che la tabella principale e' quella senza filtro. Nella
  tabella "Grafici del flusso" del md, valori assenti del grafico per intervento: aggiunto il testo con il filtro.
- **Anteprima con il filtro Campagna (V1)**, html: nessuna altra campagna, mini linea non disegnata col motivo ("con il
  filtro Campagna la serie non si disegna: togli il filtro Campagna per vedere tutte le campagne") e la fonte "Fonte:
  TX-0018 con il filtro Campagna 2024: l'anteprima mostra solo la campagna 2024."; nessuna seconda lettura.
- **Focus (A1)**: dopo "Mostra solo", la serie per campagna e "Applica i filtri" dallo stato vuoto il focus va sul titolo
  della pagina (nota WCAG del md, testo sotto l'anteprima e sotto gli stati vuoti dell'html).
- **Ordine della tabella (X3)**: detto in testo (dalla campagna piu' recente, gli interventi senza superfici in fondo),
  com'era gia' disegnato.
- Intestazioni (commento dell'html, paragrafo iniziale del md) con la data e il motivo dell'aggiornamento.

## Effetti su finanziario ed elenco operativo

Nessun test di finanziario ed elenco e' cambiato, salvo quello di D2. In dettaglio:

- **Finanziario**: `useFiltriNellIndirizzo` e la bozza di `PannelloFiltri` compongono gli hook di entities/filtri (H2), i
  gruppi usano i controlli del kit (H1), `rispostaRiservaAssente` chiama `eProblema` (H8): stesso comportamento. Unica
  differenza visibile (X4/H1): una lista di caselle vuota senza ricerca (es. azioni portanti senza voci) non scrive piu'
  "Nessuna voce corrisponde alla ricerca."; resta la nota "Non disponibile finche'...". I criteri ora sono stabili per
  indirizzo (`useMemo`): meno ricalcoli, nessun effetto funzionale.
- **Elenco operativo**: superfici in "12,50 ha" (D2; colonne superficie di sostegno e di pagamento, sintesi della scheda);
  controlli del pannello dal kit (stessi testi: segnaposto "Cerca", "Nessun valore nel tuo perimetro."); testata della
  scheda con `TestataDettaglio` (stesso markup); `rispostaDomandaAssente` e `rispostaRiferimentoNonValido` con
  `eProblema`.
- **Fisico, differenza di comportamento**: nel gruppo Campagna del pannello un secondo clic sulla campagna scelta torna a
  "Tutte le campagne" (Scelte esclusive del kit: ri-clic toglie); prima la campagna restava scelta.

## Esito

- `npx tsc --noEmit`: verde.
- `npx eslint .`: verde.
- `npx vitest run`: verde, 56 file, 1133 test (prima 55 file, 1105 test). Un primo giro completo ha avuto un fallimento
  isolato in `src/pages/finanziario/dotazione/page.test.tsx` (drill-down su una route lazy sotto carico, il test stesso lo
  dichiara sensibile al carico): passa da solo e in due giri completi successivi.
- `check-ui-authz.sh` del fisico (sola lettura): pass, 2 route e 3 azioni.

Da fare nella sessione principale: riapprovazione del flusso superfici da parte dell'utente, poi step8 (11/11) di
fisico, finanziario ed elenco operativo (le approvazioni sha256 sono invalidate dalle modifiche), poi l'iterazione 2.
