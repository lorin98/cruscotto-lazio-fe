# Flusso sigc - wireframe (feature finanziario)

> Doc del gate umano PER FLUSSO. L'approvazione e' content-addressed sull'INTERA dir
> `wireframes/sigc/` (hash da `wireframe-hash.sh`): modificare un file qui invalida
> l'approvazione del flusso (e solo di questo flusso).

## Route del flusso

| route | kind | pattern | file | grant (verbatim dal catalogo) |
|---|---|---|---|---|
| /finanziario/sigc | report | dettaglio.html in sola lettura | sigc.html | csr.tx-0012.read, csr.tx-0013.read |
| /finanziario/sigc/riserva | report | dettaglio.html in sola lettura | riserva.html | csr.tx-0014.read |
| /finanziario/sigc/verifica-smp | report | dettaglio.html in sola lettura | verifica-smp.html | csr.tx-0015.read |

## Component tree (per pagina)

- /finanziario/sigc: Layout > Breadcrumb > H1 > Ultimo dato sincronizzato > Filtri attivi > Perimetro > Card RF012 (voci) > Card RF013 (voci) > Altri report > Stati
- /finanziario/sigc/riserva: Layout > Breadcrumb > H1 > Ultimo dato sincronizzato > Nota "dato regionale: i filtri del finanziario non si applicano" (al posto dei Filtri attivi: TX-0014 non accetta filtri, OP-FE-03) > Selettore anno con "Mostra" > Card RF014 (fase + voci + grafico + tabella utilizzo) > Altri report > Stati (404 = vuoto)
- /finanziario/sigc/verifica-smp: Layout > Breadcrumb > H1 > Ultimo dato sincronizzato > Filtri attivi > Perimetro > Selettore esercizio > Card RF015 (voci + tabella 19 dati per intervento) > Altri report > Stati

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
- Selettori di anno (riserva) ed esercizio (verifica SMP) con label; il 404 della riserva e' uno stato vuoto spiegato, non un errore.
- Tabella della verifica SMP larga (19 dati): intestazioni di riga sul codice intervento, scorrimento orizzontale del solo contenitore della tabella.

## Note del flusso

- La riserva risponde 404 se l'anno non ha movimenti (oggi e' cosi'): reso come stato vuoto spiegato. La verifica SMP richiede l'esercizio.

## Punti aperti che toccano questo flusso

- OP-FE-04 (risolto): la data dell'ultimo dato sincronizzato (NFR-25 b) arriva con la risposta di TX-0001, una voce per flusso d'import; la riga sotto il titolo la mostra a chi ha csr.tx-0001.read.
- OP-FE-01: libreria dei grafici non nei foundation pins; la tabella e' il canale primario.
- OP-FE-03: RF001 (filtri a tutti i report) non si applica alla riserva: TX-0014 non accetta filtri; la pagina lo dichiara.
