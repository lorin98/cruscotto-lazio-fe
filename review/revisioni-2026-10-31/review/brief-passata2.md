# Review step9 FULL sul delta delle revisioni del finanziario — passata 2 (01/11/2026, budget 3)

Vale tutto `brief-comune.md` (riferimenti, perimetro, punti da valutare, scelte approvate, regole, formato dell'output), salvo
quanto scritto qui.

## Perimetro
- Delta completo: `git diff 64ada98 HEAD -- src tests uiplan.json route-manifest.json plan specs`.
- Solo le correzioni della passata 1: `git diff 1a75ef8 HEAD` (commit 840ae50 verdetto e lenti; b7c12c8 kit comune; cea894e
  finanziario; db5d002 elenco operativo; b142066 procedurale; d0e7a91 istituzionale; df61c8d fisico). I messaggi dei commit
  dicono quale finding chiude ogni modifica.

## Passata 1
- Verdetto: `judge-passata1.md` (FAIL: 12 MAGGIORE J-01..J-12, 31 MINORE e 6 COSMETICO accettati, 2 contestati).
- Finding d'origine: `lente-V1-passata1.json`, `lente-V2-passata1.json`, `lente-H-passata1.json`, `lente-A-passata1.json`,
  `antagonista-passata1.json`.

## Compito
1. Verifica che ogni finding ACCETTATO della passata 1 sia chiuso davvero, sul codice (file e riga), senza regressioni. Un
   finding non chiuso o chiuso a meta' si ripropone con lo stesso id d'origine nel campo `titolo` (es. "J-04 non chiuso: ...").
2. Cerca problemi nuovi nel delta completo, in particolare nel codice delle correzioni.
3. Non riproporre i contestati (X-14; X-03 come MAGGIORE) ne' i finding chiusi.

## Scelte prese nelle correzioni, NON approvate dall'utente: valutale
a. Lo scostamento 3 della passata 1 e' ritirato. Il corpo non pertinente non e' piu' `inert`: resta leggibile dagli strumenti
   assistivi; i controlli prendono `tabindex=-1` e `aria-disabled=true` (anche quelli montati dopo, MutationObserver); clic,
   mousedown, Invio e spazio si fermano in cattura. Il motivo si dice una volta sola (ContestoMotivoDetto).
b. J-05: i link della spesa erogata dell'istituzionale non portano piu' `sigc=false`; l'elenco mostra tutte le righe PAGATA
   dell'intervento, comprese quelle SIGC. Per gli interventi con pagamenti SIGC la coincidenza dei numeri non vale piu': lo
   dice OP-IS-09.
c. J-06: nel procedurale i link a livello di programma portano `sigc`:
   - quelli dei dati di soli NO SIGC (ammesse, con atto, stati) come la lettura della card: `sigc=false` si', `sigc=true` no;
   - quello dello stato area programmazione sempre;
   - i link per riga o per intervento mai.
d. J-09: `MAX_BARRE_VISIBILI` vale 40 per tutti i grafici a barre del kit, anche quelli dell'istituzionale.
e. J-04: il controllo SIGC dell'elenco scrive con `useCriteri` (replace, con lo state). Nelle altre aree il controllo naviga
   da se'.
f. V1-08: nell'uiplan la provenance della stima sta sulla dotazione e non piu' su panoramica e dettaglio.
g. V1-09: il riquadro della riserva del 5% e' solo montante x quota (altrimenti l'assenza col motivo); la soglia del grafico
   dell'utilizzo ripiega sull'accumulato.
h. V2-19: la voce dell'area nelle briciole porta il `sigc` dell'indirizzo corrente; nelle superfici il link punta alla pagina
   stessa.
i. H-06: `letturaDelTipo` nel kit decide insieme la non pertinenza e i criteri della lettura.

## Output
`review/revisioni-2026-10-31/review/<file della consegna>` con lo stesso formato della passata 1. Se non trovi niente, scrivi
un array vuoto.
