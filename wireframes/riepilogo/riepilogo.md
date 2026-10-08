# Flusso riepilogo - wireframe (feature finanziario)

> Doc del gate umano PER FLUSSO. L'approvazione e' content-addressed sull'INTERA dir
> `wireframes/riepilogo/` (hash da `wireframe-hash.sh`): modificare un file qui invalida
> l'approvazione del flusso (e solo di questo flusso).

## Route del flusso

| route | kind | pattern | file | grant (verbatim dal catalogo) |
|---|---|---|---|---|
| /finanziario | form | form.html (form guidata) | filtri.html | csr.tx-0001.read |
| /finanziario/riepilogo | report | dettaglio.html in sola lettura | riepilogo.html | csr.tx-0011.read |

## Component tree (per pagina)

- /finanziario: Layout > Breadcrumb > H1 > Ultimo dato sincronizzato > Form filtri (Intervento, OS, OG, OP multipli; Azioni portanti disabilitate senza legame) > Link ai report > Stati
- /finanziario/riepilogo: Layout > Breadcrumb > H1 > Ultimo dato sincronizzato > Filtri attivi + Modifica > Perimetro > Card(Tabella 10 colonne + Assistenza tecnica) > Esporta CSV > Altri report > Stati

## Stati resi (obbligatori)

- vuoto: messaggio azionabile (mai schermo bianco)
- caricamento: `role="status"` + `aria-live="polite"`
- errore: `role="alert"`, discriminato sul problem-type RFC 9457 (401 sessione; 403 accesso negato, anche
  per perimetro ADA; 429 troppe richieste; 503 servizio non disponibile)
- dato non disponibile: un importo con `motivo` FONTE_NON_ATTIVA si mostra come testo con la fonte attesa,
  mai come zero

## Note WCAG 2.2 (residuo manuale DICHIARATO)

- Meccanizzato a valle (step7/step8): tab-order, focus dopo route-change, focus-trap, axe (deferito a step8).
- RESIDUO umano da verificare qui: ordine di lettura, testi alternativi sensati, etichette
  comprensibili, contrasto della resa finale (il low-fi non fa fede sul colore).
- Ogni grafico ha la tabella equivalente subito sotto (canale primario, WCAG 1.1.1 e 1.4.1): il grafico e' un complemento.
- Importi non disponibili resi come testo (motivo e fonte attesa dalla spec), mai come cella vuota o zero.
- Perimetro (REGIONALE o ADA) dichiarato in testa alla pagina con testo, non solo con colore.
- Filtri a selezione multipla con label esplicite; il filtro azioni portanti e' disabilitato con spiegazione testuale quando legameAzioniDisponibile e' falso.
- Esportazione CSV: pulsante con testo esplicito del formato; esito annunciato in role=status.

## Note del flusso

- I filtri sono una pagina propria (ui_hint form di TX-0001) e viaggiano nell'indirizzo: ogni report li mostra e li fa modificare. L'esportazione CSV del backend vuole l'header X-Requested-With (OP-FE-02).

## Punti aperti che toccano questo flusso

- OP-FE-04 (risolto): la data dell'ultimo dato sincronizzato (NFR-25 b) arriva con la risposta di TX-0001, una voce per flusso d'import; la riga sotto il titolo la mostra a chi ha csr.tx-0001.read.
- OP-FE-02: runtime BFF del backend (X-Requested-With per l'esportazione CSV; /auth/status senza 'profile').
- OP-FE-01: libreria dei grafici non nei foundation pins; la tabella e' il canale primario.
