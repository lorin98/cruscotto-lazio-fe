# Flusso verifica-smp-non-sigc - wireframe v2 (feature istituzionale)

> Doc del gate umano PER FLUSSO. L'approvazione e' content-addressed sull'INTERA dir
> del flusso (`wireframes/istituzionale/verifica-smp-non-sigc/`; hash da `wireframe-hash.sh`): modificare un file qui
> invalida l'approvazione del flusso (e solo di questo flusso).

Rework del 22/10/2026 sui contratti del giro G3 (spec sha256:b0c069cf...): ultimo dato sincronizzato, export CSV e XLSX,
valori dei filtri da TX-0060 (decisione G2), link alla verifica SMP SIGC del finanziario (decisione G4).

Aggiornato il 26/10/2026 con la card Istituzionale della Home (`home.html`, decisione dell'utente del 26/10/2026: totali
della verifica SMP non SIGC). La pagina della verifica non cambia. Vedi "Card della Home".

Aggiornato il 26/10/2026 con le decisioni dell'utente sulla review della card (`review/card-home-2026-10-26/judge.md`):
D3, il riferimento dice che i valori sono cumulativi e l'anno e' quello dell'ultimo file; D2, la cache condivisa fra card e
pagina vale a lettura finita.

Aggiornato il 30/10/2026 per il riallineamento degli ambiti (decisione dell'utente del 29/10/2026,
`cruscotto-lazio-spec/decisioni/MIN-20261029-riallineamento-ambiti.md`; pack 1.4.0, spec sha256:e29f8ac4..., catalogo
rev. 4). TX-0015 (verifica SMP SIGC) e' ora di questa feature (flusso verifica-smp-sigc) e TX-0017 (output regionale) e'
passato al fisico. Cambia: la frase sotto il titolo porta alla verifica SMP SIGC della stessa area, coi filtri comuni
(link:verifica-smp-sigc, intra-feature; la decisione G4 del 21/10 e' superata); il menu dell'area ha le voci "Verifica
SMP non SIGC" e "Verifica SMP SIGC" (non piu' "Output regionale"), e le altre aree sono voci attive (non piu' "presto");
la card della Home ha descrizione e contenuti nuovi (le due verifiche), con gli stessi numeri. Non cambiano TX-0016, le
colonne, il grafico, i filtri, i link verso il dettaglio e verso l'elenco.

Rework 2 del 31/10/2026 (richiesta e scelta dell'utente): la card della Home mette i numeri non SIGC e SIGC in una tabella
a confronto, per portarla all'altezza delle altre tre; stessi numeri. Vedi "Tabella a confronto" in "Card della Home". La
pagina della verifica non cambia.

## Route del flusso

| route | kind | pattern | grant (verbatim dal catalogo) |
|---|---|---|---|
| /istituzionale/verifica-smp-non-sigc | report | report v2 (selettore, grafico a barre, tabella interattiva), come /istituzionale/verifica-smp-sigc | csr.tx-0016.read |

Letture della pagina: TX-0016 (report), il suo export `GET /api/istituzionale/verifica-smp-non-sigc/{formato}` (csv,
xlsx; stesso grant, senza operationId, con X-Requested-With) e TX-0060 dell'elenco operativo per le voci del pannello
(`GET /api/elenco-operativo/filtri`, csr.tx-0060.read: lo hanno p1, p2 e p3-funzionario-area-ist, cioe' tutti i profili
con csr.tx-0016.read; decisione G2, nessun campo nuovo nel contratto istituzionale). Come nel fisico, TX-0060 (RA006) e'
fra le transazioni della route e la slice elenco-operativo e' pinnata nell'handover; la visibilita' della route resta il
solo csr.tx-0016.read e la lettura dei valori e' un'azione col controllo di csr.tx-0060.read (step6).

## Component tree (per pagina)

Vocabolario del kit UI v2 (ADR 0027): Shell (fascia ente, barra, menu a gruppi, piede) > Barra filtri
(chip, perimetro, dati al) > Breadcrumb > Titolo | Testata di dettaglio > [KPI | Sinottico] > [Card grafico (tipo)] >
[Tabella interattiva (+ Totali dal server)] > [Drawer di anteprima] > [Schede] > Stati.

- /istituzionale/verifica-smp-non-sigc: Shell > Barra filtri (chip, perimetro regionale, anno di riferimento del file,
  "Dati al") > Breadcrumb > Titolo (con la frase verso la verifica SMP SIGC, coi filtri correnti) > Pannello filtri
  (valori da TX-0060) > Selettore dell'anno di riferimento (facoltativo, pulsante Mostra) > Riferimenti della risposta
  (anno, output cumulativo, perimetro) > Card spesa pubblica erogata per intervento (barre; PNG, CSV, XLSX) > Card tabella
  dei 21 dati (cerca, colonne, ordinamento; CSV, XLSX) con le note sulle definizioni > Stati

Stessa resa della verifica SMP SIGC (TX-0015, flusso verifica-smp-sigc di questa feature, prima nel finanziario):
nessun KPI (i dati sono per intervento), selettore d'anno con Mostra, una card a barre, la tabella dei dati con
l'intervento come intestazione di riga, i si'/no come colonne di testo, il clic su barra o riga che apre il dettaglio
dell'intervento, un pulsante per formato. Differenze dovute al contratto: l'anno di TX-0016 e' facoltativo (assente = l'ultimo anno con un file), e' l'anno di riferimento del
file SMP non SIGC e non l'esercizio finanziario; domande e spesa sono cumulative.

## Barra dei filtri e "Dati al"

- "Dati al gg/mm/aaaa": campo `ultimiDatiSincronizzati[]` (flusso, conclusoIl) della risposta di TX-0016, provenance spec
  (`openapi-istituzionale.json#/components/schemas/VerificaSmpNonSigc`), stessa pill del finanziario e dell'elenco
  (`PillDatiAl`): la data fino a cui tutti i flussi sono aggiornati (la conclusione meno recente) e nel popover una voce
  per flusso d'import con data e ora. Elenco vuoto (nessuna acquisizione conclusa): "Ultimo dato sincronizzato: nessuna
  acquisizione conclusa". In caricamento non si mostra; con la lettura in errore "non disponibile". La stessa data e'
  nell'intestazione dei file CSV e XLSX.
- Chip dei filtri attivi con la voce leggibile da TX-0060 (descrizione dell'intervento, testo dell'obiettivo o
  dell'azione); perimetro regionale fisso; anno di riferimento del file (annoRiferimento della risposta).

## Pannello dei filtri (valori da TX-0060, decisione G2)

| gruppo | parametro della route | voci (provenance spec: openapi-elenco-operativo.json#/components/schemas/ValoriFiltriElenco) |
|---|---|---|
| Intervento | intervento | interventi[].chiave + interventi[].descrizione (senza AT001), ricerca per codice o descrizione |
| Obiettivo specifico | os | obiettiviSpecifici[].chiave (solo codice: descrizione null) |
| Obiettivo generale | og | obiettiviGenerali[] (testo della gerarchia) |
| Obiettivo di policy | op | obiettiviPolicy[] (testo della gerarchia) |
| Azione portante | azione | azioniPortanti[].chiave (id numerico) + descrizione; con legameAzioniDisponibile = falso il gruppo dice che non e' disponibile |

Stesse regole dei report del finanziario: voci dello stesso filtro in alternativa (O), filtri diversi insieme (E), filtri
nell'indirizzo. TX-0060 e' dell'elenco operativo: la pagina non importa nulla da quella feature (uiplan-patterns 7), usa
il client generato dalla spec sigillata dell'elenco (shared). Se TX-0060 non risponde, i filtri dell'indirizzo restano
chip rimovibili e il report si legge lo stesso (stato "valori dei filtri non disponibili").

## Colonne della tabella (21, provenance spec: openapi-istituzionale.json#/components/schemas/VerificaSmpNonSigc)

| colonna | campo | resa |
|---|---|---|
| Intervento | righe[].codiceIntervento | intestazione di riga, fissa |
| Avvisi attivati | righe[].avvisiAttivati | conteggio col motivo |
| Avvisi chiusi | righe[].avvisiChiusi | conteggio col motivo |
| Azioni attivate | righe[].azioniAttivate | conteggio col motivo |
| Dotazione avvisi | righe[].dotazioneAvvisi | importo col motivo |
| Chiusura ultimo avviso aperto | righe[].chiusuraUltimoAvvisoAperto | data col motivo |
| Domande ricevute | righe[].domandeRicevute | conteggio (sempre valorizzato); link:elenco-ricevute-riga se maggiore di 0 |
| Domande ricevute senza richiesto | righe[].domandeRicevuteSenzaRichiesto | conteggio (escluse dal valore) |
| Valore domande ricevute | righe[].valoreDomandeRicevute | importo col motivo |
| Domande finanziate | righe[].domandeFinanziate | conteggio |
| Valore domande finanziate | righe[].valoreDomandeFinanziate | importo col motivo |
| Domande pagate (solo saldate) | righe[].domandeSaldate | conteggio; nota "definizione da confermare con ARSIAL" (D-02) |
| Anticipi erogati | righe[].anticipiErogati | importo col motivo |
| Spesa erogata (anticipi inclusi) | righe[].spesaErogata | importo col motivo; link:elenco-spesa-riga se maggiore di 0 |
| Concessioni previste senza impegni | righe[].concessioniPreviste | si'/no col motivo, colonna di testo |
| Include top-up | righe[].includeTopUp | si'/no col motivo, colonna di testo |
| Importo top-up | righe[].importoTopUp | importo col motivo |
| Output atteso delle finanziate | righe[].outputAttesoFinanziate | quantita' col motivo |
| Output erogato (cumulativo) | righe[].outputErogato | quantita' col motivo |
| Indicatore di output | righe[].indicatoreOutput | testo col motivo |
| Indicatore di risultato | righe[].indicatoreRisultato | testo col motivo |

Testa della risposta: annoRiferimento (barra filtri e riferimenti; null = nessun file), perimetro (sempre REGIONALE),
outputCumulativo (dichiarato nei riferimenti), ultimiDatiSincronizzati (pill "Dati al").

Resa delle assenze (kit `descriviAssenza`/`testoConNota`, una sola forma per tutte le feature; i due motivi nuovi
sono la proposta di OP-IS-08):

| motivo | testo |
|---|---|
| NON_VALORIZZATO | non valorizzato (il dato non e' presente nella fonte) |
| ANNO_NON_CONSERVATO | non disponibile per l'anno scelto (l'avviso porta i dati del file piu' recente) |
| FONTE_AMBIGUA | non attribuibile (riga presente sia nel monitoraggio SIGC sia nel non SIGC) |
| FONTE_NON_ATTIVA | non disponibile (fonte ... non attiva): oggi nessun campo di TX-0016 (D-01 Rev. 2) |

Nelle celle della tabella il kit mostra il testo come badge e la nota piccola accanto (`AssenzaMotivata`); la forma fra
parentesi e' quella delle voci e dei motivi dei grafici (`testoConNota`).

Uno 0 nelle colonne Domande ricevute, finanziate, pagate o in Spesa erogata e' un conteggio vero del backend (per esempio
un intervento SIGC come SRA01 non ha domande non SIGC), non un'assenza.

## Scaricamenti (un pulsante per formato, come nel finanziario)

| dove | formati | contenuto |
|---|---|---|
| card del grafico | PNG, CSV, XLSX | PNG = immagine del grafico disegnata nel browser con l'intestazione di NFR-50 (fonte, filtri, data di estrazione, ultimo dato sincronizzato, profilo, uso interno), non registrata in AUDIT_ESPORTAZIONE (stesso limite di OP-FE-08 del finanziario); CSV e XLSX = i dati del report |
| card della tabella | CSV, XLSX | `GET /api/istituzionale/verifica-smp-non-sigc/{formato}` con gli stessi filtri e lo stesso anno: una riga per intervento con i 21 dati e i motivi delle assenze, intestazione con anno di riferimento, filtri, perimetro, ultimo dato sincronizzato per flusso, uso interno; una riga di AUDIT_ESPORTAZIONE per file (SC-IS_ESPORTA) |

I file contengono tutti gli interventi dei filtri e tutte le colonne, non solo quelli trovati dalla ricerca o le colonne
scelte (la nota lo dice sotto gli strumenti). Pulsanti nascosti se la risposta non ha righe. Errori col motivo in
role=alert: 400 oltre 5.000 righe o 50.000 celle (restringere i filtri), 503 ESPORTAZIONE_NON_REGISTRATA, CAPACITA_ESAURITA
o TEMPO_SCADUTO (riprovare dopo Retry-After).

## Grafici del flusso

| pagina | grafico | tipo | dati (transazione) | clic | valori assenti |
|---|---|---|---|---|---|
| /istituzionale/verifica-smp-non-sigc | Spesa pubblica erogata per intervento (anticipi inclusi) | barre con zoom (oltre 12 interventi) | TX-0016 (righe[].spesaErogata) | link:dettaglio-intervento-smp (/istituzionale/interventi/:codice) | omessi ed elencati sotto il grafico col motivo, mai a zero |

## Link del flusso (drill-down dichiarati)

| pagina | link (id) | innesco | arrivo (feature: route) | parametri di path | query |
|---|---|---|---|---|---|
| /istituzionale/verifica-smp-non-sigc | dettaglio-intervento-smp | barra del grafico, clic o Invio su una riga | istituzionale: /istituzionale/interventi/:codice | codice | anno (se scelto) |
| /istituzionale/verifica-smp-non-sigc | elenco-ricevute-riga | "Apri nell'elenco" nella cella Domande ricevute | elenco-operativo: /elenco-operativo/domande | - | tipo=SOSTEGNO, intervento della riga |
| /istituzionale/verifica-smp-non-sigc | elenco-spesa-riga | "Apri nei pagamenti" nella cella Spesa erogata | elenco-operativo: /elenco-operativo/pagamenti | - | esito=PAGATA, sigc=false, intervento della riga |
| /istituzionale/verifica-smp-non-sigc | verifica-smp-sigc | link "Verifica SMP SIGC" nella frase sotto il titolo (con csr.tx-0015.read) | istituzionale: /istituzionale/verifica-smp-sigc | - | intervento, os, og, op, azione (i filtri correnti; non l'anno, che non si traduce nell'esercizio) |

I due link verso l'elenco valgono per definizione (D-05 del backend), senza uno scenario che lo verifichi: OP-IS-09.
Non collegati: finanziate, pagate (saldate) e anticipi, che l'elenco non riproduce. Il link verso la verifica SIGC ha
il suo speculare (link:verifica-smp-non-sigc del flusso verifica-smp-sigc, scelta di disegno 1): le due verifiche
stanno nella stessa area e hanno gli stessi filtri (FiltriQuery). L'anno di riferimento del file SMP non SIGC non si
traduce nell'esercizio finanziario di TX-0015 (obbligatorio): la verifica SIGC si apre coi filtri e chiede l'esercizio.
La frase si rende con csr.tx-0015.read; nel catalogo rev. 4 lo hanno tutti i profili con csr.tx-0016.read
(p1-dirigente, p2-referente-adg, p3-funzionario-area-ist), quindi oggi la vedono tutti; il controllo resta come gate di
UX (il backend negherebbe TX-0015 con 403). Il vecchio link verso `/finanziario/sigc/verifica-smp` non c'e' piu': quella
route non esiste (A-4, nessun alias).

## Filtri nell'URL (url_params)

| pagina | parametro | fonte (operationId.parametro) | multiplo | obbligatorio |
|---|---|---|---|---|
| /istituzionale/verifica-smp-non-sigc | anno | TX-0016.anno | no | no |
| /istituzionale/verifica-smp-non-sigc | intervento | TX-0016.intervento | si' | no |
| /istituzionale/verifica-smp-non-sigc | os | TX-0016.os | si' | no |
| /istituzionale/verifica-smp-non-sigc | og | TX-0016.og | si' | no |
| /istituzionale/verifica-smp-non-sigc | op | TX-0016.op | si' | no |
| /istituzionale/verifica-smp-non-sigc | azione | TX-0016.azione | si' | no |

Gli stessi parametri vanno all'export `{formato}` (stessi nomi nella spec).

## Card della Home (decisione dell'utente del 26/10/2026, OP-IS-11)

Pagina: `home.html` di questa dir. La Home non e' una route della feature (resta fuori dal manifest, `src/app/home.tsx`):
la card dell'area e' contenuto della feature (G1, OP-IS-05) e la monta lo step6 in `src/app/aree.ts` come `Anteprima`,
accanto a quella del finanziario (`AnteprimaFinanziario`), con la stessa forma: fascia colorata invariata (icona, stato,
titolo, descrizione), numeri chiave nel corpo, "Entra in Istituzionale" nel piede.

- Lettura: TX-0016 senza filtri e senza anno, la stessa della pagina aperta senza filtri (stessa cache, a lettura finita:
  se si entra nell'area mentre la card sta ancora leggendo, la pagina rifa' la lettura; decisione D2). Grant:
  csr.tx-0016.read (p1-dirigente, p2-referente-adg, p3-funzionario-area-ist); senza il grant nessuna lettura e la card
  elenca i contenuti dell'area, come oggi. Con csr.tx-0015.read la card legge anche TX-0015 senza filtri con l'ULTIMO
  ESERCIZIO CHIUSO (richiesta e scelta dell'utente del 30/10/2026: l'esercizio n va dal 16/10/n-1 al 15/10/n, quindi dal
  16/10 di un anno l'ultimo chiuso e' quello dell'anno, prima e' quello dell'anno precedente; la stessa lettura della
  pagina Verifica SMP SIGC aperta con quell'esercizio). Nessuna lettura di TX-0060. TX-0017 (output regionale) e' passato
  al fisico il 29/10/2026.
- Testi della fascia (aggiornati il 30/10/2026, riallineamento): descrizione "Dati ASR SIGC e non SIGC per intervento,
  da confrontare con SMP - Data Platform."; contenuti (senza il grant) "Verifica SMP dei dati ASR non SIGC" e "Verifica
  SMP dei dati ASR SIGC per esercizio finanziario" (prima: non SIGC e output regionale). Li applica lo step6 in
  `src/app/aree.ts`.
- Riferimento (decisione D3 del 26/10/2026): "Non SIGC, valori cumulativi (ultimo file SMP non SIGC: aaaa)" con
  l'annoRiferimento della risposta (l'ultimo anno con un file): domande e spesa sono cumulative, l'anno e' quello del
  file, non dei numeri. Senza file "Non SIGC, valori cumulativi (nessun file SMP non SIGC)", e i numeri restano (domande e
  spesa vengono dalle pratiche).
- Numeri: totali di quattro colonne della tabella, sommate fra gli interventi della risposta. Si sommano perche' ogni
  domanda e' una domanda di sostegno corrente di un solo intervento (D-02 Rev. 2) e la spesa erogata sono righe pagate
  non SIGC; gli interventi SIGC contano 0 (conteggio vero, vedi sopra). La pagina resta senza KPI.

| numero | campo (provenance spec: openapi-istituzionale.json#/components/schemas/VerificaSmpNonSigc) | resa |
|---|---|---|
| Domande finanziate | somma di righe[].domandeFinanziate (sempre valorizzato) | intero, numero animato |
| Spesa pubblica erogata | somma di righe[].spesaErogata (importo motivato) | importo breve, numero animato; un'assenza in una riga: "non disponibile" col motivo, mai una somma parziale |
| Spesa erogata sul valore delle domande finanziate | somma di spesaErogata sulla somma di righe[].valoreDomandeFinanziate | percentuale nel testo, barra a passi del 5 % (decorativa, si ferma al 100 %); solo con entrambi i totali completi e il valore finanziato maggiore di 0 |
| Domande ricevute | somma di righe[].domandeRicevute (sempre valorizzato) | intero, numero animato |

- Blocco SIGC (30/10/2026), sotto il blocco non SIGC, in un gruppo con nome "SIGC, esercizio aaaa"; riferimento "SIGC,
  esercizio aaaa (16/10/aaaa-1 - 15/10/aaaa; domande dell'anno aaaa-1)". Totali sommati fra gli interventi con la stessa
  regola (ogni domanda e' di un solo intervento; un dato motivato assente in una riga: "non disponibile" col motivo, mai una
  somma parziale). Nessuna quota: la spesa dell'esercizio comprende campagne anteriori e non si confronta col valore delle
  domande dell'anno n-1.

| numero | campo (provenance spec: openapi-istituzionale.json#/components/schemas/VerificaSmpRiga) | resa |
|---|---|---|
| Domande finanziate | somma di righe[].domandeFinanziate | intero, numero animato |
| Spesa pubblica erogata nell'esercizio | somma di righe[].spesaErogataCampagnaPrecedente + righe[].spesaErogataCampagneAnteriori (importi motivati) | importo breve; un'assenza in una riga: "non disponibile" col motivo |
| Domande pagate nell'esercizio | somma di righe[].domandePagateEsercizio | intero, numero animato |
| Domande ricevute | somma di righe[].domandeRicevute | intero, numero animato |

- I due blocchi leggono e falliscono in modo indipendente (scheletro e messaggio di errore per blocco: "Dati della verifica
  SMP SIGC non disponibili in questo momento."); con un solo dei due grant si vede solo il suo blocco (oggi i profili sono
  gli stessi).
- Perimetro: con `perimetro` ADA le etichette dicono "della tua area" (oggi la risposta e' sempre REGIONALE).
- Stati: caricamento (scheletro al posto dei numeri); errore ("Dati della verifica SMP non SIGC non disponibili in questo
  momento.": la Home non si ferma, nessun avviso della pagina); nessun file SMP non SIGC (riferimento senza anno, numeri
  presenti); dato motivato assente in una riga (totale non disponibile col motivo, quota assente); profilo senza
  csr.tx-0016.read (contenuti dell'area; nel catalogo rev. 4 nessun profilo ha csr.tx-0015.read senza csr.tx-0016.read).
- WCAG: numeri in una lista di definizioni (dt, dd) in un gruppo con nome ("L'istituzionale in cifre"); il numero
  animato e' letto solo nel valore finale e non si anima con prefers-reduced-motion (kit `NumeroAnimato`); la barra e'
  nascosta ai lettori di schermo e la percentuale e' nel testo. RESIDUO umano: ordine di lettura della card, comprensibilita'
  di "non SIGC" e dell'anno di riferimento, contrasto della resa finale; axe deferito a step8.

### Tabella a confronto (rework 2 del 31/10/2026, richiesta e scelta dell'utente)

La card coi due blocchi in colonna era molto piu' alta delle altre tre (8 numeri contro 3-4). L'utente ha scelto, fra
tabella a confronto, due colonne affiancate e interruttore Non SIGC / SIGC, la tabella. Supera la resa dei due blocchi
descritta sopra; letture, somme, motivi, grant, stati e perimetro restano quelli sopra.

- Un gruppo con nome "L'istituzionale in cifre" con una tabella (caption nascosta "L'istituzionale in cifre: verifica SMP
  non SIGC e SIGC"): righe Domande ricevute, Domande finanziate, Domande pagate, Spesa pubblica erogata (`th scope=row`),
  colonne "Non SIGC (cumulativi)" e "SIGC (esercizio aaaa)" (`th scope=col`). Le celle sono i totali di prima: per il SIGC
  domande pagate e spesa sono quelle dell'esercizio, ricevute e finanziate quelle delle domande dell'anno n-1.
- "Domande pagate" c'e' solo nella verifica SIGC: nella colonna non SIGC un trattino, ai lettori di schermo "dato non
  previsto nella verifica non SIGC". Senza il grant SIGC la riga non c'e'.
- Le colonne restano letture indipendenti: in attesa le celle della colonna hanno lo scheletro (con un solo
  `role="status"` "Caricamento in corso"); in errore dicono "non disponibile" e sotto la tabella va la frase di prima
  ("Dati della verifica SMP SIGC non disponibili in questo momento."). Con un solo grant la tabella ha la sola sua colonna.
- Un totale non disponibile: la cella dice "non disponibile" e sotto la tabella il motivo con riga e colonna ("Spesa
  pubblica erogata, non SIGC: <motivo>").
- Sotto la tabella la barra della spesa non SIGC sul valore finanziato ("Spesa non SIGC sul valore finanziato", stessa
  regola di prima; senza quota "Spesa non SIGC sul valore finanziato: <motivo>"), poi la nota dei riferimenti, che
  sostituisce i due riferimenti di prima e conserva cio' che diceva D3 (valori cumulativi nella colonna, anno dell'ultimo
  file nella nota): "Non SIGC: ultimo file SMP aaaa. SIGC: dal 16/10/aaaa-1 al 15/10/aaaa, domande dell'anno aaaa-1."
  (senza file "Non SIGC: nessun file SMP.").
- Perimetro ADA: l'intestazione della colonna dice "della tua area" ("Non SIGC (cumulativi della tua area)").
- Le due colonne si leggono una accanto all'altra ma non si sommano: cumulativi contro esercizio, come dicono intestazioni
  e nota.
- WCAG: tabella di dati con intestazioni di riga e di colonna (ogni cella si legge con la sua riga e la sua colonna); numero
  animato e barra come sopra. RESIDUO umano: lettura della tabella con un lettore di schermo reale, resa alle larghezze
  strette (quattro card per riga sotto i 1300 px circa); axe allo step8.

## Stati resi (obbligatori)

- vuoto: "Nessun intervento per i filtri scelti" con "Modifica i filtri" (mai schermo bianco); nessun file SMP non SIGC
  (annoRiferimento null): stato dichiarato, i dati di programma sono non valorizzati e domande e spesa restano
- caricamento: scheletro delle card, `role="status"` + `aria-live="polite"`; letture al piu' due alla volta
- valori dei filtri non disponibili (TX-0060 in errore): `role="status"`, chip dell'indirizzo invariati, Riprova
- errore: `role="alert"`, discriminato sul problem-type `urn:cruscottocsr:problem:*` (400 DATO_NON_VALIDO col nome del
  filtro; 403 ACCESSO_NEGATO; 503 CAPACITA_ESAURITA ritentata rispettando Retry-After; 503 TEMPO_SCADUTO; 401/419 sessione)
- file non scaricato: `role="alert"` col motivo; riuscito: "File CSV scaricato." in `role="status"`

## Note WCAG 2.2 (residuo manuale DICHIARATO)

- Meccanizzato a valle (step7/step8): tab-order, focus dopo route-change, focus-trap del pannello, tabella equivalente
  del grafico, axe (deferred-to-step8: il lint di step1 non ha un DOM).
- Pulsanti di scaricamento: sigla visibile (PNG, CSV, XLSX) contenuta nel nome accessibile completo (WCAG 2.5.3); durante
  la preparazione aria-disabled col focus sul pulsante attivato (WCAG 2.4.3); esito in role=status, errore in role=alert.
- Pill "Dati al": bottone col nome accessibile completo ("Ultimo dato sincronizzato: dati al ... per tutti i flussi.
  Mostra il dettaglio per flusso") e popover con le voci per flusso.
- RESIDUO umano da verificare qui: ordine di lettura (filtri, titolo con la frase verso la verifica SIGC, anno, riferimenti,
  grafico, tabella), didascalia del grafico, comprensibilita' delle etichette delle colonne e delle note sulle definizioni,
  contrasto della resa finale (il low-fi non fa fede sul colore).
- RESIDUO umano: bersagli dei link "Apri nell'elenco" e "Apri nei pagamenti" nelle celle (minimo 24 px, WCAG 2.5.8) e
  loro allineamento nelle celle numeriche; testi lunghi delle assenze nelle celle (a capo, larghezza delle colonne); la
  frase con il link "Verifica SMP SIGC" deve dire che e' la stessa verifica per i dati SIGC e che porta i filtri, non
  l'anno.

## Punti aperti che toccano questo flusso

- OP-IS-07: definizioni da confermare (D-02 pagate solo saldate, D-04 output cumulativo) e marcatore "da consolidare".
- OP-IS-08: testi dei motivi ANNO_NON_CONSERVATO e FONTE_AMBIGUA.
- OP-IS-09: link verso l'elenco senza scenario di coincidenza.
- OP-IS-10 (informativo): TX-0056..TX-0059 della slice elenco-operativo, pinnata per TX-0060, restano dell'elenco.
- OP-IS-11: card della Home coi totali della verifica SMP non SIGC (decisione dell'utente del 26/10/2026), vedi "Card
  della Home"; la monta lo step6 in `src/app/aree.ts`.
- Chiusi il 22/10/2026: OP-IS-01 (G2, valori da TX-0060), OP-IS-02 (G3, ultimiDatiSincronizzati), OP-IS-03 (G3, export
  CSV e XLSX). OP-IS-04 (G4, link verso la verifica SMP SIGC del finanziario) superato il 29/10/2026 dal riallineamento:
  link reciproci fra le due verifiche dell'area. OP-IS-05 (G1) aggiornato: card e menu dell'area = le due verifiche.
