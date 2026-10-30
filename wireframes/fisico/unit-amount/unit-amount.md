# Flusso unit-amount - wireframe v2 (feature fisico)

> Doc del gate umano PER FLUSSO. L'approvazione e' content-addressed sull'INTERA dir
> `wireframes/fisico/unit-amount/` (hash da `wireframe-hash.sh`): modificare un file qui invalida
> l'approvazione del flusso (e solo di questo flusso).

Flusso NUOVO del fisico, creato il 30/10/2026 per il riallineamento degli ambiti (verbale dell'utente del 29/10/2026,
`cruscotto-lazio-spec/decisioni/MIN-20261029-riallineamento-ambiti.md`, A-1 e A-5: TX-0030, requisito RF030, e'
dell'ambito fisico). Portato dal flusso unit-amount del procedurale approvato il 22/10/2026 (letto da git HEAD e0f6cb7) e
adattato al contratto nuovo (spec fisico sha256:189c634c..., pack 1.4.0, catalogo rev. 4). Card, tabella, drawer, download
e note WCAG restano quelli approvati.

Cosa cambia rispetto all'originale procedurale:

- route `/fisico/unit-amount` (era `/procedurale/unit-amount`, nessun alias: A-4); API `GET /api/fisico/unit-amount` e
  `/{formato}` (il vecchio indirizzo risponde 404, SC-FS_UNIT_AMOUNT);
- grant `csr.tx-0030.read` con i profili del catalogo rev. 4: p1-dirigente, p2-referente-adg, p3-funzionario-area-fis,
  p5-amministratore-funzionale (P4 e il P3 dell'area procedurale non lo hanno piu': A-2);
- filtri dei report fisici CON l'azione portante (`azione`, SC-FS_UNIT_AMOUNT_AZIONE: e' FiltriQuery come le superfici,
  non piu' il 400 dei report procedurali), valori da TX-0060 dell'elenco operativo (G2) invece che da TX-0024 del
  procedurale; il pannello e' nella pagina (nel procedurale stava nella panoramica);
- tolta la pill "il filtro per stato area programmazione non si applica": nel fisico nessun report ha quel filtro;
- "Dati al" dalla risposta di TX-0030 stessa (`PagamentiUnitAmount.ultimiDatiSincronizzati`, SC-FS_ULTIMO_DATO), non piu'
  da TX-0024;
- menu Fisico, breadcrumb Home > Fisico, titolo "Fisico: ...", "Apri il dettaglio dell'intervento" verso il dettaglio del
  fisico (`/fisico/interventi/:codice`, scheda Unit Amount); stati "valori dei filtri non disponibili" e "file non
  scaricato" come nelle superfici.

## Route del flusso

| route | kind | pattern | grant (verbatim dal catalogo) |
|---|---|---|---|
| /fisico/unit-amount | report | report v2 (card grafico, tabella interattiva, drawer, pannello dei filtri) | csr.tx-0030.read |

Letture della pagina: TX-0030 (report), il suo export `GET /api/fisico/unit-amount/{formato}` (csv, xlsx; stesso grant,
senza operationId, con X-Requested-With) e TX-0060 dell'elenco operativo per le voci del pannello (csr.tx-0060.read, che
hanno tutti i profili con csr.tx-0030.read). TX-0060 (RA006) e' fra le transazioni della route; la visibilita' resta il
solo csr.tx-0030.read e la lettura dei valori e' un'azione col controllo di csr.tx-0060.read (step6), come le superfici.

## Component tree (per pagina)

- /fisico/unit-amount: Shell > Barra filtri (Filtri, chip intervento, OS, OG, OP, azione; perimetro regionale; pill "Dati
  al") > Breadcrumb > Titolo > Card Percentuale pagata per Unit Amount (grafico non disponibile con il motivo, finche' la
  fonte non e' attiva; CSV, XLSX, e PNG col grafico) > Tabella interattiva delle Unit Amount (cerca, Colonne, CSV, XLSX,
  ordinamento, paginazione, nessun totale) > Drawer di anteprima della riga > Pannello dei filtri (voci da TX-0060) > Stati

Nessun KPI: il DTO di TX-0030 non porta totali (la pagina non somma le righe).

## Campi (provenance spec: openapi-fisico.json)

| colonna / voce | campo | schema |
|---|---|---|
| Intervento | righe[].codiceIntervento | PagamentiUnitAmountRiga |
| Unit Amount | righe[].codiceUnitAmount | PagamentiUnitAmountRiga |
| Gruppo colturale | righe[].gruppoColturale | PagamentiUnitAmountRiga |
| Esercizio | righe[].esercizio | PagamentiUnitAmountRiga |
| Importo unitario | righe[].importoUnitario (valore, motivo, fonte) | Importo |
| Output previsto | righe[].outputPrevisto (valore, motivo, fonte) | QuantitaProcedurale |
| Importo pagato | righe[].importoPagato (valore, motivo, fonte) | Importo |
| Pagato sul richiesto | righe[].percentualePagata (valore, motivo, fonte) | QuantitaProcedurale |
| Base storica | righe[].baseStorica (valore, motivo, fonte) | QuantitaProcedurale |
| pill del perimetro | perimetro (sempre REGIONALE) | PagamentiUnitAmount |
| pill "Dati al" | ultimiDatiSincronizzati[].flusso, ultimiDatiSincronizzati[].conclusoIl | UltimoDatoSincronizzato |
| pannello, descrizione nell'anteprima | filtri.interventi[] (chiave, descrizione), obiettiviSpecifici[].chiave, obiettiviGenerali[], obiettiviPolicy[], azioniPortanti[] (chiave, descrizione), legameAzioniDisponibile | openapi-elenco-operativo.json ValoriFiltriElenco (TX-0060) |

## Grafici del flusso

| pagina | grafico | tipo | dati (transazione) | clic | valori assenti |
|---|---|---|---|---|---|
| /fisico/unit-amount | Percentuale pagata per Unit Amount | barre orizzontali raggruppate (percentuale dell'esercizio, base storica dell'esercizio precedente) | TX-0030 (righe) | apre l'anteprima della riga nella tabella (drawer); dal drawer link:dettaglio-intervento-unit-amount | FONTE_NON_ATTIVA PAGATO_PER_UNIT_AMOUNT (nessuna Unit Amount ha il pagato: oggi il caso reale, OP-FIS-14): grafico non disponibile, detto in testo, vista Tabella; NON_VALORIZZATO: barra omessa e dichiarata |

Regole del dato (D-06 Rev. 2 di procedurale, ripresa da D-07 del fisico): anagrafica UNITAMOUNT degli interventi
selezionati (codice, gruppo colturale, esercizio, importo unitario, output previsto; dati di programma dall'import CSR-UA,
regionali per tutti); importo pagato e percentuale pagata sul richiesto dalla riga; base storica = percentuale pagata della
stessa Unit Amount dell'intervento nell'esercizio precedente. Mai l'Assistenza tecnica (SC-FS_FILTRI).

## Download (come nel finanziario)

| dove | formati | file |
|---|---|---|
| card Percentuale pagata per Unit Amount | CSV, XLSX; PNG solo col grafico disegnato (fonte attiva, vista Grafico) | GET /api/fisico/unit-amount/{formato} |
| tabella Unit Amount degli interventi selezionati | CSV, XLSX | lo stesso file: una riga per Unit Amount, con il motivo nelle celle senza valore |

Parametri: intervento, os, og, op, azione, header X-Requested-With, registrati in AUDIT_ESPORTAZIONE (area A3,
SC-FS_ESPORTA); intestazione con perimetro REGIONALE, filtri applicati (azione compresa) e ultimo dato sincronizzato per
flusso. Errori col motivo in role=alert: 400 oltre 5.000 righe o 50.000 celle, 403 RICHIESTA_NON_AMMESSA senza
X-Requested-With, 503 ESPORTAZIONE_NON_REGISTRATA o CAPACITA_ESAURITA (Retry-After).

## Link del flusso (drill-down dichiarati)

| pagina | link (id) | innesco | arrivo (feature: route) | parametri di path | query |
|---|---|---|---|---|---|
| /fisico/unit-amount | dettaglio-intervento-unit-amount | Apri il dettaglio dell'intervento dal drawer | fisico: /fisico/interventi/:codice | codice | - |

Nessun link verso l'elenco operativo: le Unit Amount non sono insiemi di domande. Se l'utente non vuole il dettaglio
dell'intervento del fisico (scelta di disegno 1 del dossier, opzione B), il link si toglie e il drawer resta la sola
anteprima.

## Filtri nell'URL (url_params)

| pagina | parametro | fonte (operationId.parametro) | multiplo | obbligatorio |
|---|---|---|---|---|
| /fisico/unit-amount | intervento | TX-0030.intervento | si' | no |
| /fisico/unit-amount | os | TX-0030.os | si' | no |
| /fisico/unit-amount | og | TX-0030.og | si' | no |
| /fisico/unit-amount | op | TX-0030.op | si' | no |
| /fisico/unit-amount | azione | TX-0030.azione | si' | no |

Stessi parametri all'export `{formato}`. Voci dello stesso filtro in OR, filtri diversi in AND (SC-FS_FILTRI); un'azione
non numerica e' un 400 DATO_NON_VALIDO col nome del parametro.

## Stati resi (obbligatori)

- vuoto: "Nessuna Unit Amount per i filtri scelti" con "Modifica i filtri" (per esempio un'azione portante senza interventi
  collegati, SC-FS_UNIT_AMOUNT_AZIONE)
- caricamento: scheletro della card e della tabella, `role="status"` + `aria-live="polite"`
- valori dei filtri non disponibili (TX-0060 in errore o senza grant): `role="status"`, il report resta leggibile
- errore: `role="alert"`, discriminato sul problem-type (400 col nome del parametro; 403; 503 con Retry-After; 429;
  401/419)
- file non scaricato: `role="alert"` col motivo; riuscito: "File CSV scaricato." in `role="status"`

## Note WCAG 2.2 (residuo manuale DICHIARATO)

- Meccanizzato a valle (step7/step8): tab-order, focus dopo il cambio di route, focus-trap del drawer e del pannello,
  tabella equivalente, axe (deferito a step8: il lint di step1 non ha un DOM).
- RESIDUO umano: tabella di nove colonne a 320 px (scorrimento della sola tabella, WCAG 1.4.10); ripetizione di "non
  disponibile (fonte non attiva)" in tre colonne per riga: valutare al gate una nota unica sopra la tabella piu' il testo
  breve nelle celle.
- RESIDUO umano: contrasto della resa finale.
- Download: un pulsante per formato con la sigla visibile e il nome accessibile completo (WCAG 2.5.3), aria-disabled
  durante la preparazione col focus sul pulsante (WCAG 2.4.3), esito in role=status, errore in role=alert col motivo.
- Pill "Dati al" come pulsante col nome accessibile completo; il dettaglio per flusso e' un dialogo con nome.

## Punti aperti che toccano questo flusso

- OP-FIS-14: pagato per Unit Amount con fonte non attiva (PAGATO_PER_UNIT_AMOUNT), informativo.
- OP-FIS-15: importi unitari mostrati da TX-0030 (anche quelli che TX-0017 porta nei suoi file), informativo.
- OP-FIS-01, OP-FIS-02, OP-FIS-03: chiusi il 22/10/2026 per le superfici, estesi a questa pagina (voci da TX-0060,
  ultimo dato ed export di TX-0030).
- OP-FIS-07: voce di menu "Unit Amount" nell'area Fisico, da montare allo step6.
- Chiusi nel procedurale e superati qui: OP-PR-01 (pill "Dati al" da TX-0024: ora da TX-0030), OP-PR-03 (lo stato non si
  applica: nel fisico non c'e' il filtro), OP-PR-04 (la pagina restava nel procedurale: superato dal verbale del
  29/10/2026), OP-PR-05 (export, ora `/api/fisico/unit-amount/{formato}`).
