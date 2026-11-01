# Judge, passata 3 MIRATA — review step9 sul delta delle revisioni del finanziario (01/11/2026)

Passata 3, ultima del budget, MIRATA per scelta dell'utente del 01/11/2026: un solo revisore sulle correzioni della passata 2
(5e6c102..adec6c9) e sui finding accettati della passata 2 (brief `brief-passata3.md`, finding `lente-mirata-passata3.json`).
Non e' una FULL: le passate FULL sono la 1 e la 2. Gate non declassabili PASS per le cinque feature (lente A della passata 2,
nessuna modifica successiva a grant, route o uiplan che li riguardi oltre ai link verificati qui).

Chiusi: K-01 e K-02 (MAGGIORE) e i MINORE della passata 2 salvo quelli riproposti sotto. Accettati tutti i 10 finding della
passata 3, nessuno contestato: 0 CRITICO, 0 MAGGIORE, 5 MINORE, 5 COSMETICO.

| id | severita' | finding | feature |
|---|---|---|---|
| M-01 | MINORE | X-04 nelle card annidate: voci omesse dei grafici dentro una Sezione non pertinente (superfici) non apribili | fisico |
| M-02 | MINORE | X-05: nel corpo non pertinente il riquadro scorrevole di TabellaInterattiva non ha piu' niente di focalizzabile | fisico, istituzionale, procedurale |
| M-03 | MINORE | H-02: al tocco legenda e cursore dello zoom dei grafici non pertinenti restano attivi | finanziario, fisico, istituzionale, procedurale |
| M-04 | MINORE | H-08/A-06: istruzioni d'uso residue (sottotitolo di CardAmmesseConAtto, didascalia "Clic o Invio su una riga") | procedurale, fisico, istituzionale |
| M-05 | MINORE | X-10: vuoto "Nessuna superficie" senza motivo; errore delle sottofasi senza motivo | fisico, procedurale |
| M-06 | COSMETICO | etichetta lunga della soglia di ripiego; testo di lettura senza soglia | finanziario |
| M-07 | COSMETICO | dotazione orizzontale alta affiancata alla quota FEASR | finanziario |
| M-08 | COSMETICO | BOOLEANI.sigc codice morto, commento inesatto | elenco-operativo |
| M-09 | COSMETICO | commento di ControlloSigc e titolo di un test sulla "prima pagina" | comune (tutte) |
| M-10 | COSMETICO | valore pieno delle card della Home senza test; tipo di righeCard senza formatoPieno | istituzionale, procedurale |

## Verdetto (review-score.sh FULL, soglia 80)

| feature | CRITICO | MAGGIORE | MINORE | COSMETICO | score | esito |
|---|---|---|---|---|---|---|
| finanziario | 0 | 0 | 1 | 3 | 94 | PASS |
| elenco-operativo | 0 | 0 | 0 | 2 | 98 | PASS |
| fisico | 0 | 0 | 5 | 1 | 84 | PASS |
| istituzionale | 0 | 0 | 3 | 2 | 89 | PASS |
| procedurale | 0 | 0 | 4 | 2 | 86 | PASS |

Step9 registrato done per le cinque feature. I residui si correggono dopo la registrazione, poi lo step8 si rifa' (come
nel giro del 30/10).
