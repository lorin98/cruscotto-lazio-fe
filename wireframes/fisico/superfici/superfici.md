# Flusso superfici - wireframe v2 (feature fisico)

> Doc del gate umano PER FLUSSO. L'approvazione e' content-addressed sull'INTERA dir
> del flusso (`wireframes/fisico/superfici/`, hash da `wireframe-hash.sh`): modificare un file qui invalida
> l'approvazione del flusso (e solo di questo flusso).

Rifatto il 22/10/2026 sui contratti del giro G3 del backend (TX-0018 con `ultimiDatiSincronizzati` ed export
`superficie-ammissibile/{formato}`) e sulla decisione G2 dell'utente del 21/10/2026 (valori dei filtri da TX-0060
dell'elenco operativo).

Aggiornato il 22/10/2026 con la correzione della review step9 del fisico (v1 iterazione 1): decisione D1 dell'utente sul
filtro Campagna (V1: interventi senza superfici nella campagna filtrata, stato vuoto, mini linea dell'anteprima) e focus sul
titolo dopo un comando che sparisce col report (A1). Vedi "Filtro Campagna e interventi senza superfici" e "Stati resi".

Aggiornato il 26/10/2026 con la card Fisico della Home (`home.html`, decisione dell'utente del 26/10/2026: i KPI della
pagina per la campagna piu' recente). Vedi "Card della Home".

## Route del flusso

| route | kind | pattern | grant (verbatim dal catalogo) |
|---|---|---|---|
| /fisico/superfici | report | report v2 (KPI, card grafico con Grafico, Tabella e download per formato, interruttore di pagina Grafico, Tabella, tabella interattiva, drawer, pannello dei filtri) | csr.tx-0018.read |

Profili con il grant (catalogo): p1-dirigente, p2-referente-adg, p3-funzionario-area-fis, p5-amministratore-funzionale.
P4, P6, P7 e i P3 delle altre aree non lo hanno (la SR elenca anche P6 e P7 in RF018: fa fede il catalogo approvato).

Transazioni della route: TX-0018 (il report) e TX-0060 dell'elenco operativo (solo i valori del pannello dei filtri, G2).
La visibilita' della route resta il solo csr.tx-0018.read: csr.tx-0060.read e' di tutti gli 11 profili e la visibilita' e'
"almeno un grant", quindi aggiungerlo aprirebbe la pagina a chi non legge TX-0018. La lettura di TX-0060 e' un'azione
hide-by-role con csr.tx-0060.read (step6), che tutti i profili con csr.tx-0018.read hanno.

## Component tree (per pagina)

Vocabolario del kit UI v2 (ADR 0027 di green-fe), lo stesso del finanziario (riepilogo e dotazione).

- /fisico/superfici: Shell > Barra filtri (Filtri, chip Intervento e Campagna, pill del perimetro regionale, pill "Dati al
  gg/mm/aaaa" con il dettaglio per flusso d'import) > Breadcrumb > Titolo > KPI x4 della campagna di riferimento > Card
  "Superfici per intervento e campagna" (interruttore di pagina Grafico | Tabella, vista iniziale Grafico: card barre per
  intervento + card linea per campagna + card barre della verifica incrociata, ognuna col suo interruttore Grafico | Tabella
  equivalente e i download PNG, CSV, XLSX; vista Tabella: cerca, colonne, Scarica CSV e XLSX, ordinamento, totali per
  campagna, paginazione) > Drawer di anteprima dell'intervento > Pannello dei filtri (voci da TX-0060) > Stati

## Grafici del flusso

| pagina | grafico | tipo | dati (transazione) | clic | valori assenti |
|---|---|---|---|---|---|
| /fisico/superfici | Superficie DS e DP per intervento (campagna di riferimento) | barre raggruppate, zoom oltre 12 interventi | TX-0018 (superficieDs, superficieDp) | anteprima dell'intervento (drawer, stessa pagina) | intervento con motivo NON_VALORIZZATO: fuori dal grafico, elencato sotto ("senza superfici"), mai a zero; con il filtro Campagna "nessuna superficie nella campagna N (non valorizzato)" (D1) |
| /fisico/superfici | Superficie DS e DP per campagna | linea | TX-0018 (somme degli interventi per campagna) | filtro Campagna su quell'anno (stessa pagina, chip) | con una campagna scelta la serie non si disegna e la card lo dice |
| /fisico/superfici | Verifica incrociata: differenza DP - DS per intervento | barre orizzontali con lo zero al centro (valori negativi a sinistra) | TX-0018 (differenzaDpDs, domandeDpOltreDs) | anteprima dell'intervento (drawer) | quantita' richiesta a premio: non disponibile, fonte non attiva (OP-FIS-04) |

Campagne: le superfici di campagne diverse non si sommano (D-01 del backend: un impegno pluriennale ripete la stessa
superficie DS in piu' campagne). La campagna di riferimento di KPI, barre e verifica incrociata e' quella del filtro
Campagna o, senza filtro, la piu' recente presente nella risposta; il titolo dei KPI e delle card la nomina. La linea per
campagna usa la risposta letta senza filtro Campagna. Nella tabella un totale per campagna, nessun totale generale; ordine
iniziale dalla campagna piu' recente, gli interventi senza superfici in fondo.

### Filtro Campagna e interventi senza superfici (decisione D1, review V1)

Con il filtro Campagna la risposta di TX-0018 ha le sole superfici della campagna filtrata e, per ogni altro intervento
scelto, campagne vuote e NON_VALORIZZATO anche se l'intervento ha superfici in altre campagne (SC-FS_SUPERFICIE_CAMPAGNA:
con 2023, SRB01 e SRA29 con campagne vuote). La campagna della risposta (`campagna`, null = letta senza filtro) decide il
testo, una lettura di TX-0018 per pagina (nessuna seconda lettura senza filtro):

| dove | risposta senza filtro Campagna | risposta con il filtro Campagna N |
|---|---|---|
| colonna Campagna della tabella | "nessuna superficie in nessuna campagna (non valorizzato: intervento non a superficie o non SIGC)" | "nessuna superficie nella campagna N (non valorizzato)" |
| nota degli interventi fuori dai grafici per intervento e della verifica | "SRA29: nessuna superficie in nessuna campagna (...)"; "SRB03: nessuna superficie nella campagna N" se ha superfici in altre campagne della risposta | "SRB02: nessuna superficie nella campagna N (non valorizzato)" |
| cella breve della tabella equivalente | "non valorizzato" (o "nessuna superficie") | "nessuna superficie (non valorizzato)" |
| anteprima, intervento senza superfici | "Superfici: nessuna superficie in nessuna campagna (...)" | "Superfici: nessuna superficie nella campagna N (non valorizzato)" |
| anteprima, mini linea per campagna | le campagne dell'intervento | non si disegna: "con il filtro Campagna la serie non si disegna: togli il filtro Campagna per vedere tutte le campagne"; fonte "Fonte: TX-0018 con il filtro Campagna N: l'anteprima mostra solo la campagna N." |

KPI (somme delle righe della campagna di riferimento: il report e' completo, nessuna paginazione lato server; le domande
appartengono a un solo intervento, quindi la somma fra interventi della stessa campagna non conta due volte):
superficie DS (con le domande di sostegno), superficie DP (con le domande di pagamento), differenza DP - DS, domande con DP
oltre la DS (con la quota sulle domande di pagamento). Superfici in ettari con due decimali; una superficie negativa del
file ASR2-20 entra col suo segno (D-01 Rev. 2) e si legge col segno meno.

## Ultimo dato sincronizzato ("Dati al")

Dalla risposta di TX-0018 (`ultimiDatiSincronizzati[]`: `flusso`, `conclusoIl`; D-01 Rev. 3 del backend), come il finanziario
(TX-0001) e l'elenco (TX-0057, TX-0059), con la pill del kit (`PillDatiAl`): "Dati al gg/mm/aaaa" = la conclusione meno
recente fra le voci (la data fino a cui tutti i flussi sono aggiornati); il clic apre il dettaglio con una voce per flusso
(etichetta del flusso, data e ora). Nome accessibile: "Ultimo dato sincronizzato: dati al gg/mm/aaaa per tutti i flussi.
Mostra il dettaglio per flusso". Elenco vuoto: "Ultimo dato sincronizzato: nessuna acquisizione conclusa"; TX-0018 in errore:
"Ultimo dato sincronizzato: non disponibile"; in caricamento la pill non c'e'. Ora anche il P3 dell'area fisica la vede
(non ha TX-0001). Restano fuori, come nel finanziario, il marcatore "dato non aggiornato da N giorni" (NFR-25 c).

## Download (PNG, CSV, XLSX)

Come nel finanziario (kit `PulsantiScarica`): un pulsante per formato, con icona e sigla visibili e il nome accessibile
completo ("Scarica il grafico <titolo> in PNG", "... in CSV", "... in XLSX"); nel low-fi la sigla e' scritta "Scarica PNG",
"Scarica CSV", "Scarica XLSX".

| dove | PNG | CSV e XLSX |
|---|---|---|
| card "Superficie DS e DP per intervento" | immagine del grafico (browser, intestazione NFR-50) | TX-0018 coi filtri della pagina e la campagna del grafico (campagna di riferimento) |
| card "Superficie DS e DP per campagna" | immagine del grafico | TX-0018 coi filtri della pagina (tutte le campagne, se nessun filtro Campagna) |
| card "Verifica incrociata" | immagine del grafico | come la card per intervento (campagna di riferimento) |
| vista Tabella (strumenti) | - | TX-0018 coi filtri della pagina |

CSV e XLSX: `GET /api/fisico/superficie-ammissibile/{formato}` (csv, xlsx; senza operationId come gli export del
finanziario), con X-Requested-With e gli stessi parametri della lettura; il backend scrive l'intestazione di D-08 (fonte,
filtri, perimetro, data di estrazione, profili, ultimo dato sincronizzato per flusso, uso interno) e registra il file in
AUDIT_ESPORTAZIONE (D-06 di fisico). Nel file una riga per intervento e campagna, nessun totale; un intervento senza
superfici ha la campagna vuota e NON_VALORIZZATO. Oltre 5.000 righe o 50.000 celle: 400 DATO_NON_VALIDO, il messaggio invita
a restringere i filtri; 403 RICHIESTA_NON_AMMESSA senza X-Requested-With; 503 ESPORTAZIONE_NON_REGISTRATA da riprovare. Il
PNG non e' registrato in AUDIT_ESPORTAZIONE (stesso limite di OP-FE-08 del finanziario).

## Link del flusso (drill-down dichiarati)

Nessun link che cambia pagina. Il clic su una barra o su una riga apre il drawer; dal drawer "Mostra solo <intervento>" mette
il filtro Intervento (stessa route, chip nella barra). Nessun drill-down verso l'elenco operativo: l'insieme di domande di
TX-0018 non si riproduce con i parametri di TX-0056 (OP-FIS-05).

| pagina | link (id) | innesco | arrivo (feature: route) | parametri di path | query |
|---|---|---|---|---|---|
| /fisico/superfici | nessuno | - | - | - | - |

## Filtri nell'URL (url_params)

| pagina | parametro | fonte (operationId.parametro) | multiplo | obbligatorio |
|---|---|---|---|---|
| /fisico/superfici | intervento | TX-0018.intervento | si | no |
| /fisico/superfici | os | TX-0018.os | si | no |
| /fisico/superfici | og | TX-0018.og | si | no |
| /fisico/superfici | op | TX-0018.op | si | no |
| /fisico/superfici | azione | TX-0018.azione | si | no |
| /fisico/superfici | campagna | TX-0018.campagna | no (un solo anno: ripetuto = 400) | no (assente = tutte le campagne) |

Il pannello applica i filtri con "Applica i filtri" (come il finanziario: e' un report, non un'interrogazione).

Voci del pannello (decisione G2): da TX-0060 dell'elenco operativo (`GET /api/elenco-operativo/filtri`, csr.tx-0060.read),
valori regionali per tutti i profili con csr.tx-0018.read (nessuno ha un perimetro ADA):

| gruppo | voci (TX-0060) | parametro di TX-0018 |
|---|---|---|
| Intervento | `interventi[]` (chiave e descrizione; senza AT001), con la ricerca per codice o descrizione | intervento |
| Obiettivo specifico | `obiettiviSpecifici[].chiave` (solo codice) | os |
| Obiettivo generale | `obiettiviGenerali[]` (testo della gerarchia) | og |
| Obiettivo di policy | `obiettiviPolicy[]` (testo della gerarchia) | op |
| Azione portante | `azioniPortanti[]` (chiave e descrizione); gruppo disabilitato con la spiegazione se `legameAzioniDisponibile` e' falso | azione |
| Campagna | campagne della risposta di TX-0018 (`righe[].campagne[].anno`), una sola o "Tutte le campagne" | campagna |

La descrizione dell'intervento nell'anteprima viene dalle stesse voci. Senza il grant csr.tx-0060.read o con TX-0060 in
errore (stato "valori dei filtri non disponibili"): Intervento propone i codici delle righe della risposta senza
descrizione, obiettivi e azione portante non hanno voci, i filtri gia' nell'indirizzo restano chip rimovibili e il report si
legge comunque. Campagna: aperta la pagina con una campagna nell'indirizzo, la risposta ha solo quella campagna e il gruppo
propone quella e "Tutte le campagne".

## Card della Home (decisione dell'utente del 26/10/2026, OP-FIS-10)

Pagina: `home.html` di questa dir. La Home non e' una route della feature (resta fuori dal manifest, `src/app/home.tsx`):
la card dell'area e' contenuto della feature (G1) e la monta lo step6 in `src/app/aree.ts` come `Anteprima`, accanto a
quella del finanziario (`AnteprimaFinanziario`), con la stessa forma: fascia colorata invariata (icona, stato, titolo,
descrizione), numeri chiave nel corpo, "Entra in Fisico" nel piede.

- Lettura: TX-0018 senza filtri, la stessa della pagina Superfici aperta senza filtri (stessa cache: chi ha gia' aperto
  la pagina ha gia' il dato, e viceversa). Nessuna lettura di TX-0060. Grant: csr.tx-0018.read (p1-dirigente,
  p2-referente-adg, p3-funzionario-area-fis, p5-amministratore-funzionale); senza il grant nessuna lettura e la card
  elenca i contenuti dell'area, come oggi.
- Campagna: quella di riferimento della pagina senza filtro (`campagnaDiRiferimento`: la piu' recente nella risposta),
  detta in testo sopra i numeri ("Campagna 2026"). Superfici di campagne diverse mai sommate (D-01 del backend).
- Numeri: i KPI della pagina per quella campagna, dagli stessi conti del lib (`totaliCampagna`, `quotaDpOltreDs`):

| numero | campo (provenance spec: openapi-fisico.json#/components/schemas/SuperficieAmmissibile) | resa |
|---|---|---|
| Superficie ammissibile DS | somma di righe[].campagne[anno].superficieDs | ettari, numero animato |
| Superficie ammissibile DP | somma di righe[].campagne[anno].superficieDp | ettari, numero animato |
| Domande con DP oltre la DS | somma di domandeDpOltreDs sulla somma di domandePagamento | percentuale nel testo e barra a passi del 5 % (decorativa) |
| Domande di pagamento | somma di righe[].campagne[anno].domandePagamento | intero, numero animato |

- Perimetro: con `perimetro` ADA le etichette dicono "della tua area" (oggi nessun profilo con csr.tx-0018.read e' ADA).
- Stati: caricamento (scheletro al posto dei numeri); errore ("Superfici non disponibili in questo momento.": la Home non
  si ferma, nessun avviso della pagina, la card resta l'ingresso); nessuna superficie (risposta senza campagne: "Nessuna
  superficie ammissibile nelle domande."); nessuna domanda di pagamento nella campagna (la frase del KPI della pagina al
  posto della barra, mai 0 %); profilo senza grant (contenuti dell'area).
- WCAG: numeri in una lista di definizioni (dt, dd) in un gruppo con nome ("Il fisico in cifre"); il numero animato e'
  letto solo nel valore finale e non si anima con prefers-reduced-motion (kit `NumeroAnimato`); la barra e' nascosta ai
  lettori di schermo e la percentuale e' nel testo; "DS" e "DP" come nella pagina (sciolte nei nomi accessibili). RESIDUO
  umano: ordine di lettura della card, contrasto della resa finale; axe deferito a step8.

## Stati resi (obbligatori)

- vuoto: "Nessun intervento per i filtri scelti" con "Modifica i filtri"; e, quando tutte le righe hanno motivo
  NON_VALORIZZATO (mai una pagina di zeri), con "Modifica i filtri":
  - senza filtro Campagna: "Nessuna superficie per gli interventi scelti: gli interventi non sono a superficie o non sono
    SIGC (non valorizzato).";
  - con il filtro Campagna N (decisione D1): "Nessuna superficie per gli interventi scelti nella campagna N (non
    valorizzato). Togli il filtro Campagna per vedere le altre campagne."
- valori dei filtri non disponibili: TX-0060 in errore o senza grant, il report resta (vedi sopra)
- caricamento: scheletro dei KPI e delle card, `role="status"` + `aria-live="polite"`
- errore: `role="alert"`, discriminato sul problem-type `urn:cruscottocsr:problem:*` (400 DATO_NON_VALIDO filtri non validi;
  403 ACCESSO_NEGATO o RICHIESTA_NON_AMMESSA; 429 TROPPE_RICHIESTE e 503 CAPACITA_ESAURITA o TEMPO_SCADUTO ritentati
  rispettando Retry-After; 401/419 sessione); errore di un download sotto i suoi pulsanti, `role="alert"` col motivo (es.
  oltre il limite di righe dell'export)

## Note WCAG 2.2 (residuo manuale DICHIARATO)

- Meccanizzato a valle (step7/step8): tab-order, focus sul titolo dopo il cambio di route, focus-trap di pannello e
  drawer, tabella equivalente di ogni grafico, axe (nel lint di step1: axe deferito a step8, bloccante nel gate 11/11).
- Focus dopo un comando che sparisce col report (2.4.3, review A1): "Mostra solo <intervento>" dell'anteprima, "Applica i
  filtri" del pannello aperto da "Modifica i filtri" di uno stato vuoto e il clic su un punto della serie per campagna
  portano il focus sul titolo della pagina (h1), dopo la chiusura del dialogo; aperto dal bottone Filtri della barra, il
  pannello riporta il focus al bottone.
- Download per formato: sigla visibile contenuta nel nome accessibile (2.5.3); durante la preparazione aria-disabled e focus
  sul pulsante attivato (2.4.3); esito in `role="status"`, errore in `role="alert"` col motivo (come il finanziario, V-07).
- Pill "Dati al" come pulsante col nome accessibile completo; il dettaglio per flusso e' un dialogo con nome.
- RESIDUO umano da verificare qui: ordine di lettura di KPI, card e tabella; didascalie dei grafici; comprensibilita' di
  "DS", "DP" e "differenza DP - DS" (sciolte per esteso nel sottotitolo e nei nomi accessibili dei KPI); comprensibilita'
  della differenza fra il file della card (campagna di riferimento) e quello della tabella (tutte le campagne); contrasto
  della resa finale (il low-fi non fa fede sul colore).
- Valori negativi riconoscibili senza colore (segno meno nel testo e nella tabella equivalente); assenze dette in testo
  ("non valorizzato", "non disponibile (fonte non attiva)"), mai uno zero.

## Punti aperti che toccano questo flusso

- OP-FIS-01, OP-FIS-02, OP-FIS-03: risolti il 22/10/2026 (G2: voci da TX-0060; G3: ultimo dato ed export di TX-0018).
- OP-FIS-04: quantita' richiesta a premio sempre FONTE_NON_ATTIVA (D-02 del backend), informativo.
- OP-FIS-05: nessun drill-down verso l'elenco operativo (insieme di domande non riproducibile).
- OP-FIS-06: risolto (G1: la card Fisico della Home elenca superfici e determine; la allinea lo step6).
- OP-FIS-07: voci di menu e Home nel layer app/ (step6), informativo.
- OP-FIS-09: TX-0056, TX-0057, TX-0058 e TX-0059 della slice elenco-operativo, pinnata per TX-0060, restano rese
  dall'elenco operativo (copertura per delega).
- OP-FIS-10: card della Home coi numeri chiave delle superfici (decisione dell'utente del 26/10/2026), vedi "Card della
  Home"; la monta lo step6 in `src/app/aree.ts`.
