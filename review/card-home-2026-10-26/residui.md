# Residui della review step9 FULL sul delta delle card della Home (26/10/2026)

Verdetto: PASS per fisico (83), procedurale (81), istituzionale (80), `judge.md`. Decisioni dell'utente del 26/10/2026: D1 (a2),
D2 (b), D3 (b), D4 (a). D1 e D3 hanno cambiato i flussi panoramica e verifica-smp-non-sigc, riapprovati alle 10:21:19Z
(e11fbbf); D2 e' registrata nei `deviations_reviewed` dei gate di superfici, panoramica e verifica.

| finding | correzione |
|---|---|
| A-01 (+V-01) | I test "nessuna lettura" contano le letture e asseriscono zero (`anteprime-home.test.tsx`: fisico senza grant, procedurale senza grant e col solo TX-0027 con filtri, stati area, pagamento e riepilogo, istituzionale col solo TX-0017 e output mai letto; `app-aree.test.tsx`: profilo col solo output). Nuovi test della Home coi grant del catalogo di p4-responsabile-procedimento-ada (legge finanziario e procedurale, mai superfici, verifica, output) e p5-amministratore-funzionale (legge finanziario e fisico, mai procedurale e verifica), con la lettura attesa come controllo positivo. |
| A-02 (+V-02), D4 | `AttesaArea` con `role="status"` e "Caricamento in corso…" nascosto, come `Caricamento` del kit (anche nella card del finanziario); "Nessuna superficie ammissibile nelle domande." con `role="status"` (`NotaArea stato`). Test della lettura trattenuta e dello stato vuoto. |
| H1 | `NON_DISPONIBILE` e `numeroDi` dal kit di `shared/lib`; tolta la copia e la riesportazione da `shared/ui`. |
| H2 | La prop di `AvanzamentoArea` e' `percentuale` (0-100), nei quattro chiamanti. |
| H3 | `criteriSenzaFiltri` (fisico, procedurale) e `criteriVerificaSenzaFiltri` (istituzionale) nei `lib/criteri` dalle stesse funzioni delle pagine; le card li usano. Test in `app-aree.test.tsx`: dalla Home alla pagina d'ingresso senza filtri, a lettura finita, una sola lettura di TX-0018, TX-0026, TX-0027, TX-0016. |
| H4 | `totaleMotivato` in `entities/importo` con l'insieme vuoto deciso da chi chiama; `totaleImporti` del finanziario (non calcolabile) e la card dell'istituzionale (zero vero, motivo unico) lo usano. Test in `lib.test.ts`. |
| X1, D2 | Nessun codice: deviazione "stessa cache a lettura finita" nei tre gate e nei doc di panoramica e verifica. |
| X2, D1 | `interventiSenzaContributo` e `testoSenzaContributo` in `procedurale/lib/kpi.ts`: il KPI Contributo della panoramica (nota) e la card (nota sotto il valore) dicono "manca il contributo di n interventi (codici)". OP-PR-11 verso green-be per le mancanze dentro un intervento. Test di lib, della card e della pagina (`panoramica/page.test.tsx`). |
| D3 | `riferimentoAnteprima`: "Non SIGC, valori cumulativi (ultimo file SMP non SIGC: aaaa)", senza file "(nessun file SMP non SIGC)". |
| V-04 | Esempi del dossier con una cifra decimale; segnaposto del wireframe della verifica "n,n %". Il segnaposto del fisico resta "n,nn %" fino alla prossima riapprovazione del flusso superfici. |
| V-03 (finanziario) | Test degli stati d'errore della card del finanziario: dotazione e pagamenti in errore (la frase, le domande restano), domande in errore (non disponibile col motivo) e domande in errore dopo un primo dato in cache ("non disponibile", mai il numero vecchio). |

Verifiche: typecheck e lint rc 0; suite completa 1545 test verdi; Home vera controllata con screenshot (p1.dirigente, DB
locale). Poi: step8 delle cinque feature (codice comune toccato) e registrazione.
