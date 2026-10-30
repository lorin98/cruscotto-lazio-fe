# Flusso intervento - wireframe v2 (feature fisico)

> Doc del gate umano PER FLUSSO. L'approvazione e' content-addressed sull'INTERA dir
> del flusso (`wireframes/fisico/intervento/`; hash da `wireframe-hash.sh`): modificare un file qui
> invalida l'approvazione del flusso (e solo di questo flusso).

Flusso NUOVO del fisico, creato il 30/10/2026 per il riallineamento degli ambiti (verbale dell'utente del 29/10/2026,
`cruscotto-lazio-spec/decisioni/MIN-20261029-riallineamento-ambiti.md`). E' la proposta della **scelta di disegno 1** del
dossier (`plan/fisico/dossier-wireframe.md`): se l'utente sceglie di non avere il dettaglio dell'intervento nel fisico,
questo flusso si sospende e i tre link che ci arrivano si tolgono (superfici, output-regionale, unit-amount).

Perche' una route di dettaglio (uiplan-patterns 6, "dettaglio dell'oggetto ricorrente"): i tre report del fisico hanno
righe dello stesso oggetto, l'intervento (TX-0017 una riga per intervento, TX-0018 una riga per intervento con le
campagne, TX-0030 una riga per Unit Amount col codice dell'intervento); il dettaglio compone gli stessi report filtrati su
`intervento = :codice`, senza transazioni nuove. E' anche l'unico posto dove l'output per anno di TX-0017 si disegna in
grande (una sola unita' di misura, OP-FIS-11): nell'istituzionale stava nel dettaglio dell'intervento di quell'area
(flusso intervento dell'istituzionale, approvato il 22/10/2026, letto da git HEAD e0f6cb7), da cui la scheda "Output per
anno" e' portata. Il percorso `/fisico/interventi/:codice` e' distinto da `/finanziario/interventi/:codice`,
`/istituzionale/interventi/:codice` e `/procedurale/interventi/:codice` (altri grant).

## Route del flusso

| route | kind | pattern | grant (verbatim dal catalogo) |
|---|---|---|---|
| /fisico/interventi/:codice | dettaglio | dettaglio v2 (testata, KPI, schede con grafico e tabelle) | csr.tx-0017.read, csr.tx-0018.read, csr.tx-0030.read |

Visibilita': almeno uno dei tre grant. Nel catalogo rev. 4 i tre hanno gli stessi profili (p1-dirigente,
p2-referente-adg, p3-funzionario-area-fis, p5-amministratore-funzionale); ogni scheda e ogni KPI resta comunque legato al
grant della sua transazione (hide-by-role, step6), cosi' un cambio futuro del catalogo non mostra dati a chi non li legge.

Letture della pagina: TX-0017, TX-0018 e TX-0030 con `intervento = :codice`, i loro export `{formato}` con lo stesso
filtro e TX-0060 dell'elenco operativo per la descrizione dell'intervento (csr.tx-0060.read, che hanno tutti i profili
con i tre grant; decisione G2). TX-0060 (RA006) e' fra le transazioni della route, con la slice elenco-operativo pinnata;
la lettura della descrizione e' un'azione col controllo di csr.tx-0060.read (step6).

## Component tree (per pagina)

Vocabolario del kit UI v2 (ADR 0027): Shell (fascia ente, barra, menu a gruppi, piede) > Barra filtri
(chip, perimetro, dati al) > Breadcrumb > Titolo | Testata di dettaglio > [KPI | Sinottico] > [Card grafico (tipo)] >
[Tabella interattiva (+ Totali dal server)] > [Drawer di anteprima] > [Schede] > Stati.

- /fisico/interventi/:codice: Shell > Barra dei riferimenti (perimetro regionale, "Dati al") > Breadcrumb (Home > Fisico
  > codice) > Testata (codice, descrizione da TX-0060, perimetro regionale, indicatore di output e unita' da TX-0017;
  pulsanti verso i tre report filtrati) > KPI x4 (target di fine periodo da TX-0017; superficie DS, superficie DP, domande
  con DP oltre la DS della campagna di riferimento da TX-0018) > Schede: "Output per anno" (card barre raggruppate +
  tabella equivalente; PNG, CSV, XLSX), "Superfici per campagna" (card linea + tabella equivalente; PNG, CSV, XLSX), "Unit
  Amount" (tabella; CSV, XLSX) > Stati

Nessun filtro nella barra (nessun pannello): il dettaglio e' gia' filtrato sull'intervento; la barra porta solo perimetro
e "Dati al" (`ultimiDatiSincronizzati` della prima risposta arrivata fra TX-0017, TX-0018 e TX-0030: lo stesso elenco,
SC-FS_ULTIMO_DATO), come la barra del dettaglio finanziario e istituzionale. La scheda attiva non e' un parametro della
spec: resta nello stato della pagina. Nessun url_param: la campagna dei KPI e' quella di riferimento (la piu' recente della
risposta), la scheda Superfici mostra tutte le campagne.

Testata: occhiello "Fisico - intervento <codice>", titolo = `interventi[].descrizione` di TX-0060 per la voce con
`chiave` = codice (provenance spec: openapi-elenco-operativo.json#/components/schemas/ValoriFiltriElenco); se TX-0060
non risponde o la voce manca, il titolo e' "Intervento <codice>". Badge dell'indicatore: indicatoreOutput e unitaMisura
di TX-0017 (non valorizzato se null).

## Campi (provenance spec, openapi-fisico.json)

- TX-0017 (MonitoraggioOutput, MonitoraggioOutputRiga, MonitoraggioOutputAnno): annoInizio, annoFine, perimetro,
  realizzatoNonSigcCumulativo, righe[].codiceIntervento, indicatoreOutput, unitaMisura, targetFinePeriodo, annoTarget,
  anni[].anno, anni[].programmato, anni[].realizzatoSigc, anni[].realizzatoNonSigc. Gli importiUnitari[] di TX-0017 non
  si mostrano: la scheda Unit Amount usa TX-0030, che ha gli stessi importi unitari con output previsto e pagato
  (OP-FIS-15); restano nei file CSV e XLSX della scheda Output per anno.
- TX-0018 (SuperficieAmmissibile, SuperficieIntervento, SuperficieCampagna, QuantitaRichiestaPremio): righe[].motivo,
  righe[].campagne[].anno, domandePagamento, domandeSostegno, superficieDs, superficieDp, differenzaDpDs,
  domandeDpOltreDs, quantitaRichiestaPremio (valore, motivo, fonte).
- TX-0030 (PagamentiUnitAmountRiga, Importo, QuantitaProcedurale): righe[].codiceUnitAmount, gruppoColturale,
  esercizio, importoUnitario, outputPrevisto, importoPagato, percentualePagata, baseStorica (valore, motivo, fonte).
- Ultimo dato sincronizzato: ultimiDatiSincronizzati[].flusso e .conclusoIl (UltimoDatoSincronizzato).
- Descrizione dell'intervento: interventi[].chiave e .descrizione di TX-0060
  (openapi-elenco-operativo.json#/components/schemas/ValoriFiltriElenco).
- KPI: targetFinePeriodo con annoTarget e unitaMisura (TX-0017); superficieDs, superficieDp, domandeDpOltreDs con
  domandeSostegno e domandePagamento della campagna di riferimento (TX-0018, una sola riga: nessuna somma fra interventi).
  Nessuna quota calcolata oltre a quella della pagina Superfici (domande con DP oltre la DS sulle domande di pagamento,
  solo nel testo di supporto).

## Scaricamenti (un pulsante per formato, come nel dettaglio finanziario)

| scheda | formati | contenuto |
|---|---|---|
| Output per anno | PNG, CSV, XLSX | PNG = immagine del grafico disegnata nel browser con l'intestazione di NFR-50, non registrata in audit (limite di OP-FE-08); CSV e XLSX = `GET /api/fisico/output-regionale/{formato}?intervento=<codice>`: righe "Output dell'anno" e "Importo unitario" dell'intervento |
| Superfici per campagna | PNG, CSV, XLSX | PNG come sopra; CSV e XLSX = `GET /api/fisico/superficie-ammissibile/{formato}?intervento=<codice>`: una riga per campagna |
| Unit Amount | CSV, XLSX | `GET /api/fisico/unit-amount/{formato}?intervento=<codice>`: una riga per Unit Amount |

Ogni file CSV o XLSX e' registrato in AUDIT_ESPORTAZIONE (area A3, SC-FS_ESPORTA); errori col motivo in role=alert (403
RICHIESTA_NON_AMMESSA senza X-Requested-With, 503 ESPORTAZIONE_NON_REGISTRATA, CAPACITA_ESAURITA, TEMPO_SCADUTO, con
Retry-After).

## Grafici del flusso

| pagina | grafico | tipo | dati (transazione) | clic | valori assenti |
|---|---|---|---|---|---|
| /fisico/interventi/:codice | Output programmato e realizzato per anno | barre raggruppate per anno (programmato, realizzato SIGC, realizzato non SIGC cumulativo) con il target di fine periodo come linea di riferimento | TX-0017 (righe[].anni[], targetFinePeriodo) | nessuno | anni senza valore omessi e dichiarati sotto il grafico col motivo (non valorizzato, non attribuibile), mai a zero |
| /fisico/interventi/:codice | Superficie DS e DP per campagna | linea | TX-0018 (righe[].campagne[]) | nessuno (la pagina Superfici filtrata ha le card per campagna: link superfici-intervento) | intervento senza superfici (NON_VALORIZZATO): grafico non disegnato, detto in testo, mai a zero |

Il realizzato non SIGC e' cumulativo per anno di riferimento, quello SIGC annuale (D-04 di istituzionale): le barre non si
sommano e la didascalia lo dice. Le superfici di campagne diverse non si sommano (D-01 del fisico).

## Link del flusso (drill-down dichiarati)

| pagina | link (id) | innesco | arrivo (feature: route) | parametri di path | query |
|---|---|---|---|---|---|
| /fisico/interventi/:codice | output-regionale-intervento | pulsante della testata | fisico: /fisico/output-regionale | - | intervento = :codice |
| /fisico/interventi/:codice | superfici-intervento | pulsante della testata | fisico: /fisico/superfici | - | intervento = :codice |
| /fisico/interventi/:codice | unit-amount-intervento | pulsante della testata | fisico: /fisico/unit-amount | - | intervento = :codice |

Arrivi nel dettaglio: link:dettaglio-intervento-output (flusso output-regionale), link:dettaglio-intervento-unit-amount
(flusso unit-amount), link:dettaglio-intervento-superfici (flusso superfici). Nessun link verso l'elenco operativo: le
superfici non si riproducono coi parametri dell'elenco (OP-FIS-05), output e Unit Amount non sono insiemi di domande.
Nessun link verso i dettagli dell'intervento delle altre aree: ognuno ha i suoi grant; un collegamento fra dettagli si
deciderebbe a parte (dossier, nota per le altre feature).

## Filtri nell'URL (url_params)

Nessuno: il codice e' un segmento del percorso (`:codice`), la scheda resta nello stato della pagina.

## Stati resi (obbligatori)

- vuoto: intervento senza righe nei tre report (per esempio AT001, che i report escludono, SC-FS_FILTRI) con "Torna
  all'output regionale"; scheda Superfici vuota per un intervento non a superficie (NON_VALORIZZATO) e scheda Unit Amount
  vuota per un intervento senza Unit Amount, dichiarate in testo
- caricamento: scheletro della testata, dei KPI e della scheda aperta, `role="status"` + `aria-live="polite"`; le schede
  leggono solo quando si aprono (i KPI delle superfici leggono TX-0018 all'apertura della pagina)
- errore: `role="alert"`, discriminato sul problem-type `urn:cruscottocsr:problem:*` (400 DATO_NON_VALIDO per un codice
  non valido; 403 ACCESSO_NEGATO; 503 CAPACITA_ESAURITA o TEMPO_SCADUTO con Riprova; 401/419 sessione); l'errore di una
  scheda resta nella scheda e non ferma le altre
- file non scaricato: `role="alert"` col motivo; riuscito in `role="status"`

## Note WCAG 2.2 (residuo manuale DICHIARATO)

- Meccanizzato a valle (step7/step8): tab-order, focus sul titolo dopo il cambio di route, tablist con frecce, tabella
  equivalente di ogni grafico, axe (deferred-to-step8: il lint di step1 non ha un DOM).
- Pulsanti di scaricamento: sigla visibile contenuta nel nome accessibile completo, che dice anche l'intervento (WCAG
  2.5.3); aria-disabled col focus sul pulsante attivato durante la preparazione (WCAG 2.4.3); esito in role=status,
  errore in role=alert. Pill "Dati al" come bottone col nome accessibile completo e dettaglio per flusso.
- RESIDUO umano da verificare qui: ordine di lettura di testata, KPI e schede; didascalia del grafico dell'output
  (cumulato e annuale distinti); comprensibilita' di "DS", "DP" e "campagna di riferimento" nei KPI; contrasto della resa
  finale (il low-fi non fa fede sul colore).
- RESIDUO umano: la linea del target deve avere anche una forma testuale (riga "Target di fine periodo" della tabella
  equivalente), non solo il colore; valori negativi della differenza DP - DS col segno meno; tabella delle Unit Amount
  di otto colonne a 320 px (scorrimento della sola tabella, WCAG 1.4.10).

## Punti aperti che toccano questo flusso

- OP-FIS-11: il grafico per anno sta qui (e nel drawer dell'output regionale) perche' fra interventi le unita' sono diverse.
- OP-FIS-12: definizioni da confermare (D-03, D-04).
- OP-FIS-13: testi dei motivi FONTE_AMBIGUA e ANNO_NON_CONSERVATO, gia' nel kit.
- OP-FIS-04: quantita' richiesta a premio sempre FONTE_NON_ATTIVA.
- OP-FIS-14: pagato per Unit Amount con fonte non attiva.
- OP-FIS-15: importi unitari da TX-0030, non da TX-0017.
- OP-FIS-05: nessun drill-down verso l'elenco operativo.
