# Review step9 sul delta delle revisioni del finanziario — passata 3 MIRATA (01/11/2026, ultima del budget 3)

Scelta dell'utente del 01/11/2026: passata 3 mirata con un solo revisore, poi il giudizio nella sessione principale. Si
dichiara MIRATA nel report: non e' una FULL. Valgono `brief-comune.md` (riferimenti, regole di sola lettura, severita',
anti-inflation, formato) e `brief-passata2.md` (scelte a-i), salvo quanto scritto qui.

## Perimetro
- Correzioni della passata 2: `git diff adec6c9~6 adec6c9` (commit 5e6c102 verdetto; 9b433f0 kit; 63dbefc finanziario;
  bac8570 istituzionale; ae22cdb procedurale; adec6c9 fisico ed elenco). I messaggi dei commit dicono quale finding chiude
  ogni modifica.
- Verdetto della passata 2: `judge-passata2.md` (K-01, K-02 e i MINORE/COSMETICO accettati), finding d'origine in
  `lente-*-passata2.json` e `antagonista-passata2.json`.

## Compito
1. Per ogni finding ACCETTATO della passata 2: chiuso davvero sul codice (file e riga), senza regressioni? Un finding non
   chiuso si ripropone con l'id d'origine nel titolo (es. "K-02 non chiuso: ...").
2. Regressioni o difetti NUOVI introdotti dalle correzioni della passata 2 (solo nel perimetro sopra).
3. Non riproporre finding chiusi ne' scelte approvate; niente stile.

## Scelte prese nelle correzioni della passata 2, da valutare
j. K-01: MAX_BARRE_VISIBILI torna 12 (wireframe "zoom oltre 12"); "Dotazione e pagamenti per intervento" (dotazione e
   riepilogo del finanziario) diventa a barre orizzontali, alte quanto serve, zoom oltre 40.
k. K-02: il link della spesa erogata dell'istituzionale torna esito=PAGATA&sigc=false (URL del wireframe approvato) e si
   rende solo per gli interventi classificati NO SIGC dai valori dei filtri (TX-0060); senza classificazione nessun link.
l. Corpo non pertinente: link senza href (role=link, aria-disabled), bottoni e campi `disabled`, eventi del puntatore e
   rotella fermati senza preventDefault, paginazione e riquadri scorrevoli attivi, voci omesse fuori dal corpo, niente
   strumenti della tabella ne' interruttore della vista, sottotitoli senza le frasi "Clic ..."/"Trascina ...".
m. X-02: i link verso le domande SIGC del dettaglio del finanziario solo per un intervento classificato SIGC (OP-FE-11).
n. La soglia del grafico della riserva senza montante o quota si chiama "Riserva accumulata (montante o quota non
   disponibili)"; la nota del residuo segue CalcoloRiserva del backend.

## Output
`review/revisioni-2026-10-31/review/lente-mirata-passata3.json`: array JSON di oggetti
`{"id":"M-NN","feature","severity","file":"<path>:<riga>","titolo","evidenza","fix"}` (array vuoto se non trovi niente).
E' l'unico file che puoi scrivere.
