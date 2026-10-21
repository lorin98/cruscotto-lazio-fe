# Flusso sottofasi - wireframe v2 (feature procedurale)

> Doc del gate umano PER FLUSSO. L'approvazione e' content-addressed sull'INTERA dir
> `wireframes/procedurale/sottofasi/` (hash da `wireframe-hash.sh`): modificare un file qui invalida
> l'approvazione del flusso (e solo di questo flusso).

## Route del flusso

| route | kind | pattern | grant (verbatim dal catalogo) |
|---|---|---|---|
| /procedurale/sottofasi | lista | lista v2 (due card con grafico e tabella) | csr.tx-0031.read, csr.tx-0032.read |

TX-0031 e TX-0032 sono EQ con ui_hint list. Una sola pagina per i due tipi di domanda: le liste sono corte (sei e sette voci
piu' le altre sottofasi) e senza filtri; ogni card compare solo col grant della sua transazione.

## Component tree (per pagina)

- /procedurale/sottofasi: Shell > Barra del perimetro (pill, senza bottone Filtri) > Breadcrumb > Titolo > Card sostegno
  (interruttore Grafico | Tabella; grafico non disponibile con il motivo, tabella delle voci) > Card pagamento (grafico a
  barre, tabella equivalente delle voci, tabella delle altre sottofasi) > Stati

## Grafici del flusso

| pagina | grafico | tipo | dati (transazione) | clic | valori assenti |
|---|---|---|---|---|---|
| /procedurale/sottofasi | Domande di sostegno per sottofase di ammissibilita' | barre orizzontali, sei voci di SR-01 | TX-0031 (voci) | nessuno (l'elenco operativo non ha un filtro per sottofase) | FONTE_NON_ATTIVA SOTTOFASI_DOMANDA: grafico non disponibile, detto in testo, vista Tabella; voce non censita NON_VALORIZZATO: omessa e dichiarata |
| /procedurale/sottofasi | Domande di pagamento per sottofase di ammissibilita' | barre orizzontali, sette voci di SR-01 | TX-0032 (voci) | nessuno | come sopra |

Regole del dato (D-06 del backend, Rev. 1-5): ogni voce di SR-01 dice se e' censita nell'anagrafica (codice, descrizione,
esito della prima sottofase per codice che la abbina) e quante domande correnti vi si trovano; con la fonte attiva la voce
conta le domande DISTINTE di tutte le sottofasi che la abbinano (una domanda in due sottofasi equivalenti conta una volta),
mentre la sottofase censita mostra le sue sole domande: la voce puo' essere minore della somma, e la pagina non somma. Le
sottofasi che nessuna voce prende (codice libero) stanno nella tabella "Altre sottofasi", ciascuna con le sue domande.
Domande di pagamento solo con presenza CSR-DP aperta, mai l'Assistenza tecnica; perimetro ADA per il P4, anagrafica regionale.

## Link del flusso (drill-down dichiarati)

Nessun link: le sottofasi non hanno un parametro corrispondente nell'elenco operativo e non sono per intervento (OP-PR-08).

## Filtri nell'URL (url_params)

Nessuno: TX-0031 e TX-0032 non accettano parametri. La barra lo dice ("I filtri dei report procedurali non si applicano
alle sottofasi"), senza bottone Filtri e senza chip (OP-PR-03); i filtri degli altri report restano nell'indirizzo delle
altre pagine.

## Stati resi (obbligatori)

- vuoto: anagrafica vuota = tutte le voci non censite, detto in testo (nessun errore, come lo scenario del backend)
- caricamento: scheletro delle due card, `role="status"` + `aria-live="polite"`
- errore: `role="alert"`, discriminato sul problem-type (403; 503 con Retry-After; 429; 401/419)

## Note WCAG 2.2 (residuo manuale DICHIARATO)

- Meccanizzato a valle (step7/step8): tab-order, focus dopo il cambio di route, tabella equivalente, axe (deferito a step8).
- RESIDUO umano: comprensibilita' delle colonne "Domande della voce" e "Domande della sottofase censita" e della nota sulle
  domande distinte; il grafico non disponibile deve essere annunciato come testo, non come area vuota.
- RESIDUO umano: contrasto della resa finale.

## Punti aperti che toccano questo flusso

- OP-PR-01: ultimo dato sincronizzato assente dai DTO procedurali.
- OP-PR-03: RF024 chiede i filtri su tutto l'ambito, ma TX-0031/TX-0032 non accettano parametri.
- OP-PR-05: nessun export di TX-0031/TX-0032 (non sono nemmeno nel CSV del riepilogo): solo il PNG del grafico.
- OP-PR-08: nessun drill-down verso l'elenco per le sottofasi.
