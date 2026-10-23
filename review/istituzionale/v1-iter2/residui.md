# Residui della review step9 FULL dell'istituzionale, v1 iterazione 2 (23/10/2026)

Correzione dei quattro residui "dopo il verdetto" del Judge (`judge.md`, PASS con score 92; finding in
`../../istituzionale-findings-iter2.json`), come per il fisico. Base: `87c282d`. Un commit su `main` per residuo,
**non pushati**. Nessuna modifica a wireframe, uiplan, dossier, `.claude/state/`, backend o plugin. Lo step8 non e' stato
lanciato.

Ogni test nuovo o cambiato e' stato provato rosso:
- togliendo la correzione con `git stash` dei soli file sorgente;
- oppure con una mutazione del codice, annullata dalla copia salvata in scratchpad.

## Residui fatti

| residuo | commit | cosa e' cambiato | test che lo prova | effetti sulle altre feature |
|---|---|---|---|---|
| **X1** (MINORE) | `835b137` | `testoAggiornamentoAnno(anno, mostrato)` in `lib/intervento.ts`: `mostrato` e' l'anno di riferimento della risposta che resta in pagina, lo stesso della didascalia (`captionVociVerifica`). Esempio: "Lettura dell'anno 2024 in corso: restano i dati dell'anno di riferimento 2025.". Con `mostrato` null "restano i dati di prima (nessun file)", con undefined (nessuna risposta, avviso spento) "restano i dati di prima". `SchedaVerifica` passa `stato.data?.annoRiferimento` | L1 in `tests/istituzionale-lib.test.ts` (indietro 2024 su 2025, avanti 2025 su 2024, ultimo anno su 2023, null, undefined) e `interventi/page.test.tsx` con la lettura del 2024 trattenuta (testo col 2025). Entrambi rossi col testo di prima. Il test di pagina e' rosso anche con la mutazione che passa l'anno chiesto al posto di quello mostrato | nessuno: solo istituzionale |
| **H1** (MINORE) | `6f371e7` | `ElencoDomande` ed `ElencoPagamenti` usano `useRigheContesto(i.filtriApplicati, <ultimi>, testoPerimetro(<perimetro>))` del kit, con `testoPerimetro` di `elenco-operativo/lib/formato` ("ADA del tuo profilo", resa invariata). Via la copia omonima da `useInterrogazione.ts` (aveva l'ordine filtri, profilo, ultimi, perimetro) con gli import rimasti senza uso. Commenti corretti: testata di `useInterrogazione.ts` e di `shared/ui/grafici/useRigheContesto.ts`, dove le copie erano quattro | `src/pages/elenco-operativo/interrogazione.test.tsx`: test nuovo col mock di `pngDelGrafico`. Il PNG della card "Domande per intervento" del sinottico, con perimetro ADA e `?intervento=SRA01`, ha "Filtri applicati: Intervento: SRA01 Produzione integrata", "Perimetro: ADA del tuo profilo", "Profilo: p1-dirigente" e l'ultimo dato. E' rosso con la mutazione che passa il perimetro senza `testoPerimetro` (esce "Perimetro: ADA"). L2 nuovo in `tests/kit-comune-istituzionale.test.tsx`: `useInterrogazione.ts` esporta solo `useInterrogazione`. E' rosso con la copia | elenco operativo: stesse righe di contesto (filtri, perimetro in parole, profilo della sessione, ultimo dato), stesso memo sul testo dei filtri. I test esistenti dell'interrogazione (`interrogazione*.test.tsx`) e della scheda della domanda (`scheda-domanda.test.tsx`, PNG) restano verdi senza modifiche |
| **V1** (COSMETICO) | `47d0402` | `CardGrafico` con `oggettoDati`: il gruppo dei pulsanti si chiama "Scarica il grafico <titolo> e <oggettoDati>" (`pulsantiDellaCard`, al posto di `fileDeiDati`). Il PNG prende come oggetto "il grafico <titolo>", altrimenti erediterebbe il nome del gruppo: il suo nome resta "Scarica il grafico <titolo> in PNG", come nel low-fi. Il fix del Judge non lo diceva, e i test che fissano i nomi del PNG lo hanno segnalato al primo giro. Senza `oggettoDati` gruppo e pulsanti hanno i nomi di sempre | L2 di `CardGrafico` in `tests/kit-comune-istituzionale.test.tsx`: nome del gruppo con `oggettoDati` (rosso senza la correzione) e senza (resta "Scarica il grafico Output per anno"). Nei test di pagina, il nome del gruppo della card: `verifica-smp-non-sigc/page.test.tsx` ("Scarica il grafico Spesa pubblica erogata per intervento (anticipi inclusi) e i dati della verifica SMP non SIGC") e `interventi/page.test.tsx` ("... e l'output e gli importi unitari dell'intervento SRA01"). Tutti rossi senza la correzione. Il test di `PulsantiScarica` resta com'e', come dice il Judge | kit: cambia solo con `oggettoDati`, che usano solo verifica e dettaglio dell'istituzionale. Finanziario, fisico ed elenco non lo passano, quindi i loro nomi non cambiano: test verdi senza modifiche. L'e2e `csp.spec.ts` cerca i pulsanti del finanziario coi nomi di sempre e non cambia (non rieseguito: e' Playwright) |
| **H2** (COSMETICO) | `aba71a7` | Tolta da `src/features/finanziario/index.ts` la riesportazione di `filtriDaRicerca` e `ricercaDaFiltri`. Resta quella dall'entity in `lib/filtri.ts`, usata dai moduli della feature | L1 nuovo in `tests/entita-filtri-domanda.test.ts`: il barrel del finanziario non espone le due funzioni, rosso con la riga di prima. `tests/entita-filtri-domanda.test.ts:82-86` (riesportazione da `lib/filtri`) e' invariato e verde. `tsc` verde. Il grep di `filtriDaRicerca` e `ricercaDaFiltri` importate da `features/finanziario` in `src`, `tests` ed `e2e` non trova nulla | finanziario: solo API pubblica, nessun consumatore. Nessun cambio di comportamento |

## Note

- **X1**: il caso undefined (nessuna risposta) non si vede, perche' l'avviso e' attivo solo con `isPlaceholderData`, cioe'
  con una risposta in pagina. Il testo c'e' per completezza del tipo di `stato.data?.annoRiferimento`.
- **V1**: nella vista Tabella il PNG non c'e', ma il gruppo dice comunque "il grafico <titolo> e <oggettoDati>", come nel
  fix accettato. Prima, nello stesso caso, il gruppo diceva "il grafico <titolo>".

## Verifica finale (23/10/2026)

Dopo i quattro commit, sul working tree pulito:

- `npx tsc --noEmit`: rc 0.
- `npx eslint .`: rc 0.
- `npx vitest run`, due volte di seguito: verde entrambe le volte, **63 file, 1284 test** (22 s circa ciascuna). Alla
  partenza erano 63 file e 1281 test: tre test nuovi, due per H1 e uno per H2. X1 e V1 cambiano test esistenti.

## Feature e strati toccati (per lo step8)

Le approvazioni sha256 del gate sono invalidate. Lo step8 (11/11) va rifatto per **istituzionale, elenco operativo,
finanziario e fisico**. Il fisico non ha file cambiati, ma usa `CardGrafico` del kit, toccato da V1, come dice il Judge.

- **Istituzionale** (X1, V1):
  - `lib/intervento.ts`, `ui/SchedeIntervento.tsx`;
  - test `tests/istituzionale-lib.test.ts`, `src/pages/istituzionale/interventi/page.test.tsx`,
    `src/pages/istituzionale/verifica-smp-non-sigc/page.test.tsx`.
- **Kit (`shared/ui`)** (H1, V1):
  - `grafici/CardGrafico.tsx` (V1);
  - `grafici/useRigheContesto.ts`, solo il commento (H1);
  - test `tests/kit-comune-istituzionale.test.tsx`.
- **Elenco operativo** (H1):
  - `ui/ElencoDomande.tsx`, `ui/ElencoPagamenti.tsx`, `ui/useInterrogazione.ts`;
  - test `src/pages/elenco-operativo/interrogazione.test.tsx`.
- **Finanziario** (H2):
  - `index.ts`, il barrel;
  - test `tests/entita-filtri-domanda.test.ts`.
- **Fisico**: nessun file. E' consumatore di `CardGrafico`, senza `oggettoDati`.
- Non toccati: wireframe, uiplan, dossier, `.claude/state/`, backend, plugin, route-manifest e grant. Nessun push.
