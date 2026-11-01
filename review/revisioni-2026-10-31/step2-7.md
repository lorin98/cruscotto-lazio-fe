# Revisioni del finanziario (MIN-20261031): resoconto degli step2-7 delle cinque feature (01/11/2026)

Lavoro fatto nella sessione principale (niente agenti), dopo l'approvazione dei 21 wireframe (64ada98).

## Step e gate

| step | feature | esito | come |
|---|---|---|---|
| step2-codegen | tutte e cinque | pass | spec dell'handover in `specs/`, fixture di /auth/status, `npm ci`, orval; gate SKILL §6 (typecheck, build, 1685 test, lint, orval deterministico, canary) e registrazione nello stesso blocco (c6e9dc5) |
| step3-7 | tutte e cinque | pass | gate unico `../ambiente-prova/strumenti-sessione-93fdeac2/gate-step3-7.sh`: controlli di progetto una volta (npm, query-key, lib senza React, import dal generato e fra feature, pagine, MSW fail-closed, coverage summary), per feature hash dei wireframe approvati, route-manifest proiettato e validato, fe-project-check, REQ-must nei describe; poi step3 -> 8 per ognuna (4a30c79) |
| step8-gate | tutte e cinque | 11/11 | primo giro: finanziario 10/11, `authz` rosso per il drift della route del dettaglio (TX-0002 ancora nella route-table): corretto in 1017ca1; secondo giro 11/11 per tutte (1706 test, axe 0 violazioni su 139 run), feature a step9 (7637a3a) |

## Commit (main, non pushati)

dc177f1 contratti 1.5.0; f241933 kit comune; e61939d finanziario; c6e9dc5 stati dello step2; 5ad5165 elenco operativo;
40ee466 fisico; f5c532b istituzionale; f4f60c2 procedurale; a8034a5 test; 4a30c79 stati degli step3-7; 1017ca1 grant del
dettaglio del finanziario.

## Novita' per revisione

| revisione | dove |
|---|---|
| R01 filtro SIGC (F1-F5) | `shared/lib/sigc.ts`, `shared/ui/filtri/ControlloSigc.tsx` (barra opt-in `filtroSigc`), `entities/filtri/lib/programma.ts` (sigc nei filtri), `app/menu.tsx` (conservato fra le aree), report di tutte le aree; mai nei dettagli, nella riserva, nelle determine, nella Home |
| F3 non pertinente | `shared/ui/card/NonPertinente.tsx` letto da CardGrafico, Sezione, Kpi; pagine e card di un solo tipo: SIGC e card SIGC della panoramica (finanziario), superfici (fisico), verifiche SMP (istituzionale), stati, sottofasi, ammesse e card della panoramica (procedurale); letture senza `sigc` |
| F5 tipo nei dettagli | `PillTipoIntervento`, `BarraRiferimenti.tipo`, `tipoIntervento` da VoceFiltro.perimetro (TX-0001, TX-0060, TX-0024) |
| R02 assi | `asseCategorieOrizzontale` (interval 0), gradini `ui-grafico--righe-N` in Grafico.tsx, zoom orizzontale oltre 40; cascata e barre verticali con interval 0 |
| R03 sei box | `Panoramica.tsx` + `kpiSpesa` (impegnato, di cui stimato, quota impegnata), `ui-griglia--3` |
| R04 stima | `lib/stima.ts`, `NotaStima`, "di cui stimato" in dotazione, avanzamento, riepilogo, dettaglio; ramo stimato del sankey |
| R05/R06 ciambelle | `graficoDueParti` (importo, percentuale, totale al centro) |
| R08 rettifiche | `ui/rettifiche.tsx` (fonte, righe, residuo per intervento col pannello), riepilogo (lordi col link, rettifiche, Con rettifiche, anteprima), cascata e scheda del dettaglio |
| R09 sinottici | `.ui-kpi__valore` nowrap e carattere adattivo, `Kpi.valorePieno`; elenco operativo in forma compatta |
| R11, R12 | `tema.css` (top 0, scroll-padding, riquadro, prima colonna), `TabellaInterattiva` 25 righe |
| R13 B | `graficoImportiSigc` (panoramica, pagina SIGC, scheda del dettaglio) |
| R14, R21, X3 | via contributo ambientale, quote Stato e Regione, vincolo LEADER (dotazione, dettaglio, mock, fonti attese) |
| R15, R16 | titoli "Avanzamento rispetto ai pagamenti effettuati"; via "flusso ASR2-20" dai testi |
| R17 A, R18 A | `RiservaReport.tsx` (MontanteERiserve, badge della natura), `lib/grafici/riserva.ts` (linea a gradini, fasi, soglia, ultimo punto), testo di lettura |
| R20 | testi delle card Fisico e Procedurale, subgrid della card, token dei numeri, ettari interi col valore pieno |

## Scelte prese in autonomia (da valutare nella review)

1. Le quattro ciambelle RF004-RF007 restano quattro card come prima (il wireframe ne disegna una card con quattro).
2. Riepilogo: "Si': n righe" e' testo nella cella (la riga apre l'anteprima con le righe); nell'avanzamento e' un bottone.
3. Le tabelle dentro una `Sezione` non pertinente sono inerti e quindi non lette dagli strumenti assistivi; per i grafici la
   tabella dei dati resta leggibile (nascosta alla vista).
4. La pill del tipo: nella barra dei dettagli (e un badge nella testata del finanziario); nessuna pill se non classificato.
5. Link verso l'elenco operativo coi filtri correnti: portano anche `sigc` (uiplan aggiornato, 7 link), cosi' l'elenco mostra
   lo stesso insieme del dato.
6. Il controllo SIGC azzera il parametro `pagina` (la tabella riparte dalla prima pagina) e naviga con push, come i chip.
7. Il pagato oltre l'ammesso degli importi SIGC e' una voce fra le "non nel grafico" (nota sotto), come chiede il wireframe.

## Punti aperti

- Verifica a vista nell'app locale: serve il DB locale a V28 e la simulazione allineata (V25-V28 sul PG locale solo con l'ok
  dell'utente).
- Contrasto del corpo in grigio delle card non pertinenti: axe allo step8 e a vista (residuo dichiarato nel dossier).
