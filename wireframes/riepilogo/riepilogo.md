# Flusso riepilogo - wireframe v2 (feature finanziario)

> Doc del gate umano PER FLUSSO. L'approvazione e' content-addressed sull'INTERA dir
> `wireframes/riepilogo/` (hash da `wireframe-hash.sh`): modificare un file qui invalida
> l'approvazione del flusso (e solo di questo flusso).
>
> Aggiornamento del 21/10/2026 (decisione F2 dell'utente, review sul delta FE X3, X3-b e V6): la pagina si apre sulla
> vista Grafico, con l'interruttore di pagina Grafico | Tabella e il sottotitolo della vista iniziale.

## Route del flusso

| route | kind | pattern | grant (verbatim dal catalogo) |
|---|---|---|---|
| /finanziario/riepilogo | report | report v2 (KPI, grafici, tabella interattiva) | csr.tx-0011.read |

## Component tree (per pagina)

Vocabolario del kit UI v2 (ADR 0027 di green-fe), resa approvata nel prototipo `prototipo/finanziario/`.

- /finanziario/riepilogo: Shell > Barra filtri > Breadcrumb > Titolo > Card riepilogo per intervento (interruttore di pagina Grafico | Tabella; vista iniziale Grafico: card del grafico a barre, col suo interruttore Grafico | Tabella equivalente e Scarica; vista Tabella: cerca, colonne, esporta CSV, ordinamento, totali, riga AT, paginazione) > Drawer di anteprima > Stati

## Grafici del flusso

| pagina | grafico | tipo | dati (transazione) | clic | valori assenti |
|---|---|---|---|---|---|
| /finanziario/riepilogo | Dotazione e pagamenti per intervento | barre | TX-0011 | dettaglio dell'intervento | valore assente: barra omessa, dichiarata |

La pagina si apre sulla vista Grafico, come ogni card (richiesta dell'utente del 19/10/2026). L'interruttore di pagina
"Vista del riepilogo", Grafico | Tabella nello stesso ordine dell'interruttore delle card, sceglie fra il grafico e la
tabella del riepilogo; la scelta resta tornando dal dettaglio dell'intervento o dall'elenco operativo (cronologia del
browser). L'interruttore della card del grafico mostra invece la sua tabella equivalente, con i soli valori del grafico
(intervento, dotazione, pagamenti netti): e' il canale accessibile del grafico. Totali, dotazione dell'Assistenza tecnica
(AT001, intero programma: non dipende dai filtri) e link all'elenco operativo stanno nella tabella del riepilogo (vista
Tabella), come nel flusso approvato il 13/10/2026.

Nella vista Tabella la riga apre il drawer di anteprima; dal drawer si passa al dettaglio dell'intervento. Export CSV con gli stessi filtri e X-Requested-With.

## Link del flusso (drill-down dichiarati)

Drill-down verso l'elenco operativo (decisione D-2 dell'utente del 12/10/2026) dalle celle della tabella (vista Tabella) e dal drawer.

| pagina | link (id) | innesco | arrivo (feature: route) | parametri di path | query |
|---|---|---|---|---|---|
| /finanziario/riepilogo | elenco-presentate-riga | cella Domande presentate di una riga, o del drawer | elenco-operativo: /elenco-operativo/domande | - | presentata=true, intervento della riga |
| /finanziario/riepilogo | elenco-pagamenti-riga | cella Pagamenti al netto delle rettifiche di una riga, o del drawer, con l'etichetta "righe di pagamento, importi lordi" | elenco-operativo: /elenco-operativo/pagamenti | - | esito=PAGATA, intervento della riga |

La riga dell'Assistenza tecnica non ha link (AT001 non e' selezionabile nell'elenco). Il link dei pagamenti porta l'etichetta
"righe di pagamento, importi lordi": l'elenco dei pagamenti mostra il pagato lordo delle righe PAGATA, il report il netto delle
rettifiche; la differenza sono i recuperi, che stanno nella scheda della domanda (decisione dell'utente del 13/10/2026).
Dotazione, risorse FEASR, stanziato, impegnato e residui non sono collegati (non sono insiemi di domande).

## Stati resi (obbligatori)

- vuoto: messaggio azionabile con "Modifica i filtri" (mai schermo bianco)
- caricamento: scheletro delle card, `role="status"` + `aria-live="polite"`; letture al piu' due alla volta
- errore: `role="alert"`, discriminato sul problem-type `urn:cruscottocsr:problem:*` (403 accesso negato; 503 capacita'
  esaurita, ritentata rispettando Retry-After; 504 tempo scaduto; 401/419 sessione)

## Note WCAG 2.2 (residuo manuale DICHIARATO)

- Meccanizzato a valle (step7/step8): tab-order, focus sul titolo dopo il cambio di route, focus-trap di pannello e
  drawer, tabella equivalente di ogni grafico, axe.
- RESIDUO umano da verificare qui: ordine di lettura, didascalie dei grafici, etichette comprensibili, contrasto della
  resa finale (il low-fi non fa fede sul colore; fa fede il prototipo approvato).
- RESIDUO umano: dimensione dei bersagli (WCAG 2.5.8) dei link "Apri nell'elenco" nelle celle (minimo 24 px nel kit) e loro allineamento a destra nelle celle numeriche.

## Punti aperti che toccano questo flusso

- OP-FE-06 (risolto in parte): dopo il login si torna al riepilogo con i filtri (/auth/login?ritorno=, D-11 Rev. 9 del
  backend); ricerca, ordine, pagina e vista della tabella, salvate nella cronologia del browser, ripartono da capo.
- OP-FE-09: profili misti (P4 con un profilo regionale): il riepilogo e' ADA, l'elenco aperto dai link della riga e' regionale.
