# Flusso dotazione-avanzamento - wireframe (feature finanziario)

> Doc del gate umano PER FLUSSO. L'approvazione e' content-addressed sull'INTERA dir
> `wireframes/dotazione-avanzamento/` (hash da `wireframe-hash.sh`): modificare un file qui invalida
> l'approvazione del flusso (e solo di questo flusso).

## Route del flusso

| route | kind | pattern | file | grant (verbatim dal catalogo) |
|---|---|---|---|---|
| /finanziario/dotazione | report | dettaglio.html in sola lettura | dotazione.html | csr.tx-0002.read, csr.tx-0003.read |
| /finanziario/avanzamento | report | dettaglio.html in sola lettura | avanzamento.html | csr.tx-0004.read .. csr.tx-0007.read |

## Component tree (per pagina)

- /finanziario/dotazione: Layout > Breadcrumb > H1 > Ultimo dato sincronizzato > Filtri attivi > Perimetro > Card RF002 (grafico + tabella per intervento) > Card RF003 (grafico + voci) > Altri report > Stati
- /finanziario/avanzamento: Layout > Breadcrumb > H1 > Ultimo dato sincronizzato > Filtri attivi > Perimetro > 4 Card RF004-RF007 (grafico + voci) > Altri report > Stati

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

## Note del flusso

- Con i dati attuali molti valori sono 'non disponibile' (fonti IMPEGNI e QUADRO_SINOTTICO non attive): la pagina deve restare leggibile anche cosi'.

## Punti aperti che toccano questo flusso

- OP-FE-04 (risolto): la data dell'ultimo dato sincronizzato (NFR-25 b) arriva con la risposta di TX-0001, una voce per flusso d'import; la riga sotto il titolo la mostra a chi ha csr.tx-0001.read.
- OP-FE-01: libreria dei grafici non nei foundation pins; la tabella e' il canale primario.
