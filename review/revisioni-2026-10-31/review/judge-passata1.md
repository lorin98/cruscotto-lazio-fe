# Judge, passata 1 — review step9 FULL sul delta delle revisioni del finanziario (01/11/2026)

Pool: 85 finding da V1 (16), V2 (21), H (16), A (13) e antagonista (19). Gate non declassabili (check-ui-authz,
fe-project-check --built): PASS per tutte e cinque le feature (lente A). Dopo la deduplica: 12 MAGGIORE, 31 MINORE, 6 COSMETICO
accettati; 2 contestati. Verdetto: **FAIL** per tutte le feature (MAGGIORE presenti). Correzioni nella sessione principale,
poi passata 2.

## MAGGIORE accettati

| id | feature | finding (origine) | decisione |
|---|---|---|---|
| J-01 | comune (fisico, istituzionale, procedurale, finanziario) | la Sezione non pertinente rende inerti le tabelle (non lette dagli strumenti assistivi) e, nelle superfici, anche le tabelle dei grafici annidati; badge ripetuto (X-06, A-05, A-02, H-03, V2-05) | lo scostamento 3 non regge: corpo leggibile ma non attivabile (niente inert), motivo una volta sola |
| J-02 | comune | tabella nascosta della card grafico non pertinente raggiungibile col Tab (A-01) | |
| J-03 | comune | intestazione dei PNG senza il filtro SIGC fuori dal finanziario; regressione nell'elenco (X-05, A-04, H-02, V2-04) | |
| J-04 | elenco-operativo | il controllo SIGC scavalca useCriteri: push senza state (vista e colonne perse), corsa col debounce, regole di lettura diverse (H-01, V2-01, A-07, A-06) | |
| J-05 | istituzionale | link della spesa non SIGC con sigc=false (semantica per domanda, ora per intervento: D-12 Rev., verificato in PostgresElencoOperativoAdapter.perSigc) (X-01, V2-02, A-09) | |
| J-06 | procedurale | link verso l'elenco senza sigc (X-02, A-03, V2-03) | |
| J-07 | finanziario | R18: fasce delle fasi mai disegnate (MarkArea non registrato) e fuori dall'asse (X-04) | |
| J-08 | finanziario, procedurale, istituzionale | R09: sinottici compatti senza il valore pieno accessibile (H-04, V1-01, X-12, V2-14, V2-15) | |
| J-09 | finanziario | "Dotazione e pagamenti per intervento" ancora con lo zoom oltre 12 (V1-02) | |
| J-10 | comune (fisico) | prima colonna ferma sbagliata quando l'intestazione di riga non e' la prima colonna (V2-06) | |
| J-11 | elenco-operativo | TabellaServer senza prima colonna ferma (V2-07) | |
| J-12 | procedurale | filtro SIGC e natura delle card provati solo sugli stati di sostegno (H-05, V2-16) | |

## MINORE e COSMETICO accettati

Comuni: barra "Nessun filtro" col SIGC attivo (X-07, A-13, V2-11); "Togli tutti" e "Azzera" tolgono il SIGC (X-08, V1-10);
SIGC perso nelle briciole di fisico e istituzionale (V2-19, parte di X-09); card non pertinente con vuoto o errore senza motivo
(X-10, V1-05); prima pagina non garantita (X-11, V2-18); scroll-padding fisso (A-11, V2-12); decisione ricopiata nelle pagine
(H-06); CardNonPertinente senza voci omesse (H-08); Kpi.valorePieno senza unita' (H-09, V2-21); gradino 8 senza classe (H-12);
test del menu fra le aree (V2-17); mock MSW col vecchio sigc (A-10, V2-10). COSMETICO: H-14, H-15, H-16, V2-20.
Finanziario: R13 segmento "Pagato" (X-13, V1-04); dettaglio che porta il sigc nascosto nei link (A-08, V1-03); regola delle
rettifiche ricopiata e "Si'" (H-07, X-19, A-12, V1-15: un solo finding); replace sul motivo (H-10); StimaImpegniLike senza
controllo (H-11); test inerte che passa senza link (H-13); avviso in piu' con la selezione vuota (V1-06); "Con rettifiche" in
Tutte le voci (V1-07); provenance della stima nell'uiplan (V1-08); riserva 5% che ripiega sull'accumulato (V1-09); residui dei
test (X-17, V1-11, V1-12, V1-13, V1-14); R17 residuo 2% vs residuo disponibile (X-03, declassato: il riquadro e' "= 2% x montante"
come da wireframe, si chiarisce la nota). COSMETICO: V1-16.
Elenco: piede finanziario compatto (V2-08); quote dei pagamenti non compatte (V2-09); "di cui SIGC" per domanda accanto al
controllo per intervento (X-16: chiarire il testo, il wireframe approvato lo prevede).
Istituzionale: tabella SIGC a 20 righe (X-15, V2-13). Fisico: interval delle campagne (X-18, COSMETICO).

## Contestati (non accettati)

- X-14 (quota impegnata non confrontabile in perimetro ADA): la regola e' la stessa della quota pagata (U2: impegnato e pagato
  dalla stessa lettura di TX-0002, misure per domanda nel perimetro del profilo); nessun comportamento sbagliato provato.
- X-03 come MAGGIORE: declassato a MINORE (vedi sopra).
