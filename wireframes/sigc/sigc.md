# Flusso sigc - wireframe v2 (feature finanziario)

> Doc del gate umano PER FLUSSO. L'approvazione e' content-addressed sull'INTERA dir
> `wireframes/sigc/` (hash da `wireframe-hash.sh`): modificare un file qui invalida
> l'approvazione del flusso (e solo di questo flusso).

## Route del flusso

| route | kind | pattern | grant (verbatim dal catalogo) |
|---|---|---|---|
| /finanziario/sigc | report | report v2 (KPI, grafici, tabella interattiva) | csr.tx-0012.read, csr.tx-0013.read |
| /finanziario/sigc/riserva | report | report v2 (KPI, grafici, tabella interattiva) | csr.tx-0014.read |
| /finanziario/sigc/verifica-smp | report | report v2 (KPI, grafici, tabella interattiva) | csr.tx-0015.read |

## Component tree (per pagina)

Vocabolario del kit UI v2 (ADR 0027 di green-fe), resa approvata nel prototipo `prototipo/finanziario/`.

- /finanziario/sigc: Shell > Barra filtri > Breadcrumb > Titolo > Card domande SIGC (imbuto) + Card importi SIGC (cascata) > Stati
- /finanziario/sigc/riserva: Shell (senza barra filtri: dato regionale) > Breadcrumb > Titolo > Selettore anno > KPI x4 > Card utilizzo progressivo (linea con zoom) > Stati
- /finanziario/sigc/verifica-smp: Shell > Barra filtri > Breadcrumb > Titolo > Selettore esercizio > Card previsione e spesa (barre) > Card tabella 20 dati (cerca, colonne) > Stati

## Grafici del flusso

| pagina | grafico | tipo | dati (transazione) | clic | valori assenti |
|---|---|---|---|---|---|
| /finanziario/sigc | Domande SIGC | imbuto | TX-0012 | link:elenco-sigc (elenco-operativo: /elenco-operativo/domande) | nessuno (conteggi) |
| /finanziario/sigc | Importi SIGC | cascata | TX-0013 | link:elenco-sigc-importi (elenco-operativo: /elenco-operativo/domande) | importo assente: passo omesso |
| /finanziario/sigc/riserva | Utilizzo progressivo della riserva | linea | TX-0014 | nessuno | punti assenti omessi e dichiarati |
| /finanziario/sigc/verifica-smp | Previsione di pagamento e spesa erogata | barre | TX-0015 | dettaglio dell'intervento | 'non disponibile' in tabella |

La riserva e' un dato regionale: i filtri non si applicano (OP-FE-03).

## Link del flusso (drill-down dichiarati)

Drill-down verso l'elenco operativo (decisione D-2 dell'utente del 12/10/2026): dal livello minimo di un report si apre
l'elenco gia' filtrato, con i filtri correnti del finanziario (intervento, os, og, op, azione), e il numero di domande
coincide con quello del report (D-02 e SC-EO_DRILLDOWN dell'elenco operativo: sigc=true&pagamento=PAGATA riproduce le pagate
di TX-0012).

| pagina | link (id) | innesco | arrivo (feature: route) | parametri di path | query |
|---|---|---|---|---|---|
| /finanziario/sigc | elenco-sigc | passo di Domande SIGC | elenco-operativo: /elenco-operativo/domande | - | sigc=true e, per pagate, da pagare e senza importi, pagamento=PAGATA, DA_PAGARE, SENZA_IMPORTI + filtri correnti |
| /finanziario/sigc | elenco-sigc-importi | Importi SIGC | elenco-operativo: /elenco-operativo/domande | - | sigc=true + filtri correnti (il sinottico dell'elenco riporta richiesto, ammesso, pagato e ancora da pagare) |

Non collegati: Utilizzo progressivo della riserva (TX-0014, dato regionale, non e' un insieme di domande) e Previsione di
pagamento e spesa erogata (TX-0015, per intervento ed esercizio).

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

## Punti aperti che toccano questo flusso

- OP-FE-03: filtri non applicabili alla riserva.
- OP-FE-05: fonti diverse per il pagato SIGC.
