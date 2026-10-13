# Review step9 v4 FULL (13/10/2026): PASS all'iterazione 3, score 87

Perimetro: link di drill-down verso l'elenco operativo (D-2 di MIN-20261012), refresh sul pack 1.3.0, allineamento ai dati reali
(a3e9579) e Home (e19d25f) mai rivisti prima, codice condiviso con l'elenco operativo.
- Iterazione 1 (b19ac02): FAIL, 0 C, 2 M, 15 m, 5 c, score 20 (review/v4-iter1). Decisioni dell'utente: wireframe allineati
  all'interfaccia e riapprovati; profili misti = OP-FE-09 (da chiedere ad ARSIAL); link nella vista Tabella delle card.
- Iterazione 2 (1680b4c): FAIL, 0 C, 1 M, 8 m, 7 c, score 54 (review/v4-iter2). Decisioni: testi come costruito riapprovati;
  "Torna al riepilogo" ritrova ordine e pagina.
- Iterazione 3 (bb877d4): PASS, 0 C, 0 M, 2 m, 7 c, score 87 (review/v4-iter3). Residui da correggere dopo il verdetto:
  - **V-01** (MINORE) OP-FE-06 e i flussi panoramica e riepilogo, riapprovati alle 18:01 del 13/10, dicono ancora che dopo un 401 il BFF riporta su / e che pagina e filtri si perdono; da bc02c20 (18:08) si torna al link con la query — `uiplan.json:1527`.
  - **H-01** (MINORE) Il ritorno al riepilogo dal dettaglio (scelta X-04) e' provato solo senza navigazioni interne del dettaglio e senza cambiare l'ordine; il hook del kit non ha test — `src/pages/finanziario/riepilogo/page.test.tsx:277`.
  - **X-01** (COSMETICO) Chi apre il dettaglio dalla vista Grafico del riepilogo torna sulla vista Tabella, mentre il commento promette il ritorno anche 'dal grafico' — `src/features/finanziario/ui/RiepilogoReport.tsx:167`.
  - **A-01** (COSMETICO) Il 'Ctrl+clic' del test sul link nella riga e' un clic semplice: le API dirette di user-event non tengono premuto Ctrl fra una chiamata e l'altra — `src/pages/finanziario/riepilogo/page.test.tsx:179`.
  - **A-02** (COSMETICO) Il hook del kit dichiara la convalida dello state della history ma `valido` e' facoltativo, e il commento cita come utente l'elenco operativo, che ne ha una copia a mano — `src/shared/ui/useStatoNellaHistory.ts:15`.
  - **H-02** (COSMETICO) Il mutator naviga all'URL di una funzione iniettata qualsiasi e il suo commento attribuisce a resolveLoginPath una convalida che non fa: la proprieta' anti open-redirect non e' piu' incapsulata in shared — `src/shared/api/mutator/bff-mutator.ts:14`.
  - **H-04** (COSMETICO) Residuo di V-06: nel dettaglio caption e prima intestazione della tabella con i link di 'Domande per anno' sono ancora letterali, e le celle della tabella generata non derivano da ANNUALITA_DOMANDE — `src/features/finanziario/ui/DettaglioIntervento.tsx:145`.
  - **H-05** (COSMETICO) Residuo di H-01: i confronti con e senza grant tolgono ancora tutti i link a mano invece di usare senzaLinkElenco — `src/pages/finanziario/interventi/page.test.tsx:171`.
  - **V-02** (COSMETICO) Residuo di X-03: l'allineamento a destra dei link 'Apri nell'elenco' nelle celle numeriche e' nel residuo umano di panoramica e riepilogo, non in quello di domande e SIGC, che hanno gli stessi link — `wireframes/domande/domande.md:64`.

# Review step9 della feature finanziario (green-fe)

## Review v3: download ed export (PASS, score 85, 12/10/2026)

Intensita' **FULL** (obbligatoria: authz e perimetro). Riaperta dopo download per formato, export CSV e XLSX dal
backend, selettore dell'anno e card nella griglia (commit `dea8e63`, `9a5ed12`). Copre tutta la feature, non solo il
delta.

### Iterazione 1 (12/10/2026): FAIL

Commit verificato: `25cd45b`. Verdetto meccanico (`review-score.sh FULL review/finanziario-findings.json`): **FAIL**,
0 CRITICO, 5 MAGGIORE, 16 MINORE, 0 COSMETICO, score 0 (soglia 80).

| Chi | Finding |
|---|---|
| Lente V (fedelta' al pack e ai wireframe) | 8: 2 MAGGIORE, 6 MINORE |
| Lente H (confini FSD, SRP, soglie, test) | 8: 2 MAGGIORE, 6 MINORE |
| Lente A (red-team UI) | 4 MINORE |
| Antagonista (punti ciechi) | 5: 2 MAGGIORE, 3 MINORE |
| Judge | 21 accettati, 4 rigettati (tutti duplicati: V-03 di A-03, V-08 di H-06, H-02 di V-02, H-07 di V-04), 0 declassati |

Gate non declassabili (FE): `check-ui-authz` pass (9 route, 25 azioni, nessun allargamento dei grant); nessun finding
su `contextProjection` o CSRF. La lente A ha verificato anche, senza trovare difetti: ogni export sta sotto il grant
della sua transazione, passa dal mutator con `X-Requested-With`, i parametri dell'indirizzo sono validati e codificati,
nessun `innerHTML`, nessuna violazione della CSP nel download, errori 400/403/502 senza testo tecnico e senza file,
export mai ripetuti dal retry. Review cross-model: non configurata (skip).

Finding delle lenti, dell'antagonista e verdetti del Judge in `review/v3-iter1/`.

#### Finding accettati

##### MAGGIORE

- **V-01** `src/shared/ui/grafici/CardGrafico.tsx:58`: Il PNG del grafico e' un file esportato senza l'intestazione di NFR-50 e senza registrazione in audit (NFR-34), e l'eccezione non e' registrata
  - Fix proposto: In echarts.ts registrare TitleComponent e dare a pngDelGrafico un parametro `intestazione: string`, reso sulla copia come `title` (con `grid.top` maggiorato). CardGrafico riceve dal chiamante le voci di NFR-50 (fonte, filtri attivi, data e ora, ultimo dato sincronizzato, profilo, 'Uso interno') e le passa a riga 58. Registrare in uiplan.json OP-FE-08: il PNG non scrive AUDIT_ESPORTAZIONE; richiesta al backend di un endpoint d'audit, oppure deroga esplicita dell'utente.
- **V-02** `src/features/finanziario/api/index.ts:157`: CSV e XLSX di TX-0002..TX-0010 senza alcun test: la mappatura card -> report e i filtri dell'export non sono verificati
  - Fix proposto: In tests/finanziario-api.test.tsx un it.each sulle 12 chiavi di ESPORTA col percorso atteso (es. ['residuoImpegni', '/api/finanziario/residuo-impegni/csv']): MSW su `*/api/finanziario/*` registra pathname, query e X-Requested-With di esportaReport(chiave, 'csv', { intervento: ['SRA01'] }). In tests/finanziario-ui.test.tsx un test per pagina (Dotazione, Avanzamento, Domande, Panoramica, Dettaglio) clicca il CSV di ogni card e verifica il percorso della sua TX e il nome del file.
- **H-01** `src/shared/ui/grafici/CardGrafico.tsx:21`: CardGrafico oltre soglia (101 righe, complessita' 16): il PNG e' orchestrato dentro la card del kit
  - Fix proposto: Estrarre in shared/ui/grafici un hook usePngDelGrafico(titolo, attivo) che possiede il ref e restituisce { onIstanza, png: Scaricamento[] }. Estrarre InterruttoreVista e VociOmesse come sottocomponenti. CardGrafico resta composizione: sotto 60 righe e complessita' 10.
- **X-01** `src/features/finanziario/ui/DettaglioIntervento.tsx:97`: Dettaglio, scheda SIGC: per un intervento senza domande SIGC la card Importi SIGC disegna una cascata di zeri
  - Fix proposto: In ImportiSigc (DettaglioIntervento.tsx:96) leggere `const segnale = useSelezioneSenzaDomandeSigc(filtri)` e passare a VistaQuery `inAttesa={segnale === 'in-attesa'} eVuoto={() => segnale === 'vuota'} vuoto={vuotoConPerimetro('Nessuna domanda SIGC per questo intervento.')}`, come SigcReport.tsx:57-61. Test: dettaglio con sigc/domande presentate 0 e sigc/importi a zero; la scheda SIGC dichiara il vuoto e graficiVivi() non contiene 'Importi SIGC'.
- **X-02** `src/features/finanziario/lib/grafici/spesa.ts:172`: 'Totale della famiglia' e' una somma parziale: gli interventi senza dotazione escono dal totale, che resta chiamato totale
  - Fix proposto: In raggruppaFamiglie tenere per famiglia gli interventi scartati (`mancanti: string[]`). Riga 172: con f.mancanti non vuoto la cella diventa `non calcolabile (manca per ${f.mancanti.join(', ')})`. Nodo (righe 156-158): etichetta e dettaglio dicono 'somma parziale, manca SRA03'; il valore resta solo come area del riquadro. Aggiornare l'attesa di tests/finanziario-grafici.test.ts:351.

##### MINORE

- **V-04** `src/features/finanziario/api/index.ts:165`: TX-0009 (totale domande, RF009) non si scarica da nessuna pagina: la voce di ESPORTA e' codice morto e il README dice il contrario
  - Fix proposto: In DomandeReport.tsx, prima della Griglia dei KPI (riga 168), aggiungere per chi ha GRANT.totaleDomande `<PulsantiScarica oggetto="il totale delle domande presentate (RF009)" scaricamenti={datiDelReport('Totale domande presentate', 'totaleDomande', filtri)} />`. In alternativa togliere la voce da ESPORTA (api/index.ts:165), correggere README.md:70-71 e registrare l'eccezione a NFR-75.
- **V-05** `src/features/finanziario/lib/aggregati.ts:56`: KPI 'Pagato sulla dotazione' mostrato anche quando i totali accanto non sono calcolabili, contro il wireframe panoramica
  - Fix proposto: In kpiSpesa (aggregati.ts:52-57) calcolare `dotazione` e `pagato` prima e restituire `quota: dotazione.valore === null || pagato.valore === null ? { valore: null, motivo: 'Non calcolabile: manca il totale della dotazione o dei pagamenti' } : quotaPagata(righe, perimetro)`. Aggiornare l'attesa in tests/finanziario-aggregati.test.ts:154.
- **V-06** `src/features/finanziario/ui/DotazioneReport.tsx:52`: Pagina Dotazione: card in un ordine diverso dal wireframe approvato (quota FEASR in fondo, contributo accanto alla dotazione)
  - Fix proposto: In DotazioneReport (righe 112-124) comporre `<Griglia>` con la card della dotazione (ConGrant TX-0002) e Distribuzione (ConGrant TX-0003), poi la card del contributo e la tabella RF002. Per farlo, spostare le due CardGrafico di SpesaPerInterventoSezione (righe 53-70) in componenti che leggono useSpesaPerIntervento(filtri), con la stessa chiave di cache e quindi senza letture in piu'.
- **V-07** `src/features/finanziario/ui/RiepilogoReport.tsx:60`: Download per formato (PNG, CSV, XLSX) diverso dai wireframe approvati, senza deviazione registrata
  - Fix proposto: Aggiungere in `deviations_reviewed` dei cinque flussi una voce sul download per formato (PNG, CSV e XLSX dal backend, richiesta dell'utente del 09/10/2026), come per V-22. Aggiornare le wcag_notes di uiplan.json (righe 1206 e 1226) in 'Download CSV e XLSX: un pulsante per formato con la sigla visibile; esito in role=status'.
- **H-03** `eslint.config.js:293`: La purezza di lib/ si aggira con un import relativo di ui/ o api/
  - Fix proposto: Aggiungere ai patterns del blocco un gruppo che vieti **/ui, **/ui/*, il barrel '../api' e '../../api' della feature, **/api/mutator/* e **/api/auth/* (resta ammesso shared/api/problem, puro). Prima di armarla spostare hasGrant in un modulo puro che non importi il mutator.
- **H-04** `eslint.config.js:264`: Nessuna regola vieta fetch o un'istanza axios propria fuori dal mutator BFF
  - Fix proposto: Nei selettori dei consumatori (righe 264 e 277) aggiungere CallExpression[callee.name='fetch'], CallExpression[callee.property.name='fetch'] e ImportDeclaration[source.value='axios'] > :matches(ImportDefaultSpecifier, ImportNamespaceSpecifier). Resta ammesso import { isAxiosError } from 'axios'.
- **H-05** `eslint.config.js:274`: Il barrel-only non copre app/: la shell puo' importare dall'interno della feature
  - Fix proposto: Aggiungere 'src/app/**/*.{ts,tsx}' ai files del blocco a riga 274. Il blocco di src/app/main.tsx e dei test di app (riga 336) resta dopo e riapre solo i moduli di prova.
- **H-06** `src/features/finanziario/ui/esportazioni.ts:14`: Il nome del file viene dal titolo della card, non dal report: stesso nome per dati diversi
  - Fix proposto: In scaricamentiDati/datiDelReport comporre il nome anche dal report (es. nomeFile(`${titolo} ${TX[report]}`, 'csv') con TX: Record<ReportEsportabile, string> = { spesaPerIntervento: 'tx0002', ... }). In alternativa distinguere i titoli col codice RF, come gia' 'Domande SIGC (RF012)'.
- **H-08** `docs/decisioni/grafici.md:5`: La decisione sui grafici descrive ancora SVG propri, senza libreria e non interattivi
  - Fix proposto: Aggiornare grafici.md: ECharts 6 con import modulari (ADR 0027), renderer SVG a schermo e canvas solo per il PNG scaricato, interazioni (zoom, drill-down). Togliere 'senza libreria'/'non interattivi' e il rinvio della riga 11; le regole di resa restano.
- **A-01** `src/shared/ui/grafici/Grafico.tsx:49`: Il ResizeObserver chiama resize() sul contenitore gia' staccato: TypeError non gestito nel sankey a ogni uscita dalla pagina Avanzamento
  - Fix proposto: Nel callback ignorare i bersagli staccati o a dimensione zero: `new ResizeObserver(([v]) => { if (v?.target.isConnected && v.contentRect.width > 0 && v.contentRect.height > 0) c.resize(); })`. Aggiungere un test L2 col grafico finto: un'osservazione su un contenitore staccato non chiama resize.
- **A-02** `src/shared/ui/scarica/PulsantiScarica.tsx:57`: Il pulsante di download si disabilita mentre ha il focus: il focus finisce su BODY durante e dopo il download
  - Fix proposto: Al posto di disabled: `const occupato = stato?.esito === 'in-corso'`, poi `aria-disabled={occupato}` e `onClick={() => { if (!occupato) void avvia(s); }}`. In tema.css lo stile passa da `:disabled` a `[aria-disabled='true']`. Aggiungere un test: durante e dopo il download il focus resta sul pulsante attivato.
- **A-03** `src/shared/ui/grafici/echarts.ts:46`: Il PNG non e' il grafico come si vede: perde il drill-down del treemap e della raggiera
  - Fix proposto: In Grafico conservare l'ultima azione di radice ricevuta dagli eventi `treemapzoomtonode`, `treemaproottonode` e `sunburstroottonode` e passarla a pngDelGrafico, che dopo setOption la riapplica alla copia con `copia.dispatchAction({ type, seriesIndex: 0, targetNodeId })`. Aggiungere un test (e2e, o ECharts vero con renderer svg e ssr): dopo il clic su una famiglia, il PNG contiene gli interventi della famiglia.
- **A-04** `e2e/csp.spec.ts:90`: Gli e2e sotto CSP non scaricano mai un CSV o un XLSX: gli export ricevono 404
  - Fix proposto: Aggiungere in e2e/csp.spec.ts due test. Il primo serve `/api/finanziario/spesa-per-intervento/csv` (text/csv) e verifica nome e contenuto del download, l'header X-Requested-With e zero violazioni. Il secondo risponde 400 problem+json e verifica l'avviso 'File XLSX non scaricato' e l'assenza di eventi download.
- **X-03** `src/shared/lib/grafici/primitive.ts:54`: Importi sotto i 50.000 € resi '0,0 M€' in etichette, tooltip, assi e descrizioni accessibili dei grafici
  - Fix proposto: Rendere milioni() adattiva come importoKpi: `Math.abs(v) >= 1_000_000 ? <milioni> : formatEuro(v)` per etichette, tooltip e aria. Per gli assi (asseMilioni) tenere la scala in milioni con due decimali sotto 1 M€. Aggiornare finanziario-grafici.test.ts:276 e aggiungere un test: 300 € non produce '0,0 M€'.
- **X-04** `src/features/finanziario/ui/DomandeReport.tsx:126`: Il download della tabella 'Domande per anno: dettaglio' ignora l'anno scelto accanto al pulsante
  - Fix proposto: Il backend non filtra per anno: dirlo nel controllo e accanto. Con anno !== null: `oggetto={`la tabella Domande per anno (tutti gli anni, non solo il ${anno})`}` e una nota 'Il file contiene tutti gli anni'. In TabellaInterattiva, con una ricerca attiva, nota analoga sotto gli strumenti ('il file contiene tutte le righe dei filtri').
- **X-05** `src/shared/ui/kpi/Kpi.tsx:48`: La barra del KPI 'Pagato sulla dotazione' annuncia '100%' quando il valore e' oltre il 100%
  - Fix proposto: Separare larghezza e testo: la classe ui-barra__N usa `Math.min(100, quota * 100)`, l'aria-label il valore vero (`quota * 100`). In alternativa `aria-hidden="true"` sulla barra, che ripete il valore gia' scritto nella tessera. Test in shared-ui-kit: Kpi con quota 1.3 non espone '100%'.

#### Finding contestati (CRITICO rigettati)

Nessuno.

### Iterazione 2 (12/10/2026): FAIL

Commit verificato: `40ce48e` (correzioni dei 21 finding). Revisore di convergenza: 17 risolti, 4 parziali, 0 non
risolti; 4 nuovi (1 MAGGIORE, 3 MINORE). Verdetto meccanico sui residui (`review/v3-iter2/residui.json`): **FAIL**,
0 CRITICO, 1 MAGGIORE, 7 MINORE, score 64 (soglia 80). Esiti per finding in `review/v3-iter2/`.

Verificati anche, sulla build sotto la CSP in Chrome e Firefox: A-01 (nessun errore del sankey all'uscita), A-02 (focus
sul pulsante durante e dopo il download), V-01 (tutte le voci di NFR-50 nel PNG); H-01 (con le soglie forzate su tutto
`src` restano solo `Layout`, `useInattivita`, `Home` e l'interceptor del mutator, pre-esistenti e fuori dal perimetro).

#### Residui

##### MAGGIORE

- **N-01** `src/features/finanziario/lib/grafici/spesa.ts:147`: Regressione di X-02: raggruppaFamiglie mette in `mancanti` anche una dotazione presente ma 0,00 o negativa, e la famiglia diventa 'non calcolabile (manca per SRA05)' in tabella (accanto alla riga 'SRA05 0,00 €'), nel nodo e nella descrizione, mentre il KPI della dotazione accanto somma 30.000.000 (sonda CONV/sonda-famiglia-zero.test.ts). Nessun test copre il caso, che il codice dichiara reale (selezione.ts:4).
  - Fix proposto: In raggruppaFamiglie mettere in mancantiPer solo le righe con `valoreDi(r.dotazioneSpesaPubblica) == null`; per 0 e negativi, fuori dal grafico, sommare il valore in un campo `fuoriGrafico` della famiglia. totaleFamiglia, etichetta e descrizione usano `f.totale + f.fuoriGrafico` quando `mancanti` e' vuoto. Test in finanziario-grafici.test.ts: SRA01 20 M€ e SRA05 0,00 danno 'Totale della famiglia 20.000.000,00 €'.

##### MINORE

- **H-03** `eslint.config.js:327`: Residuo di H-03 (PARZIALE): da src/features/*/lib/ il barrel della feature ('..', '../index', che riesporta ui/ e i wrapper api/) e '../api/' con la barra finale passano ESLint con 0 errori (sonde --stdin), quindi la purezza di lib/ si aggira ancora con un import relativo.
  - Fix proposto: Estendere la regex della riga 327 a `^(\.\./){1,2}api/?(index(\.tsx?)?)?$` e aggiungere un pattern per il barrel della feature: `^\.\.(/\.\.)?/?(index(\.tsx?)?)?$`. Aggiungere in tests/eslint-regole.test.ts i casi '..', '../index' e '../api/' fra quelli che devono scattare.
- **H-04** `eslint.config.js:23`: Residuo di H-04 (PARZIALE): `import { default as http } from 'axios'` e `import('axios')` passano ESLint con 0 errori in features/*/ui (sonde --stdin): un'istanza axios propria fuori dal mutator resta possibile con forme d'import standard.
  - Fix proposto: Aggiungere a httpFuoriDalMutatorSelectors `ImportDeclaration[source.value='axios'] > ImportSpecifier[imported.name='default']`, `ImportExpression[source.value='axios']` e `CallExpression[callee.name='require'][arguments.0.value='axios']`. Aggiungere le due forme alla canary di tests/eslint-regole.test.ts:183.
- **A-03** `src/shared/ui/grafici/echarts.ts:87`: Residuo di A-03 (PARZIALE): la copia del PNG riapplica la radice di vista ma, disegnata con animation:false, conserva le etichette del livello precedente: dopo il clic su SRA il PNG mostra '▶ SRD' e '▶ SRB' sopra la vista di SRA, che a schermo non ci sono (CONV/treemap-png-scaricato.png, sonda-ghost.mjs). tests/grafici-vista.test.ts:43 confronta due istanze con lo stesso difetto e cerca 'SRD01', che non compare mai.
  - Fix proposto: In pngDelGrafico usare `animationDuration: 0, animationDurationUpdate: 0` al posto di `animation: false` e, dopo i dispatchAction, attendere l'evento 'finished' della copia prima di renderToCanvas (pngDelGrafico async; scarica di usePngDelGrafico restituisce la Promise). Con la sonda restano solo SRA01, SRA03, SRA14 e la briciola. Nel test, attendere che la copia non contenga '▶ SRD'.
- **X-04** `src/features/finanziario/ui/VerificaSmpReport.tsx:90`: Residuo di X-04 (PARZIALE): la nota sulla ricerca e' opt-in e la TabellaInterattiva della Verifica SMP, con ricerca per codice o indicatore e i CSV/XLSX di TX-0015 nella stessa sezione, non la riceve: il file resta completo senza che la pagina lo dica.
  - Fix proposto: Passare alla TabellaInterattiva di VerificaSmpReport.tsx:90 `notaRicerca="I file CSV e XLSX contengono tutti gli interventi dei filtri, non solo quelli trovati dalla ricerca."`, come in Riepilogo e Dotazione. In alternativa rendere la nota predefinita in TabellaInterattiva quando la pagina offre i file.
- **N-02** `src/features/finanziario/ui/RiservaReport.tsx:89`: Il PNG del grafico della riserva non dice l'anno: la pagina ha conBarraFiltri={false}, quindi l'intestazione scrive 'Filtri applicati: nessuno' (PaginaFinanziario.tsx:93), e titolo e fonte della card non hanno l'anno. Il CSV della stessa card, scritto dal backend, dichiara 'Filtri applicati: anno=2025' (CriterioRiserva); il PNG da solo non dice di quale riserva e'.
  - Fix proposto: Passare l'anno a UtilizzoProgressivo e scriverlo nella fonte: `fonte={`Fonte: TX-0014, movimenti della riserva dell'anno ${anno}`}`. In alternativa dare a PaginaFinanziario un prop `parametri` (es. ['anno=2025']) che useRigheIntestazione aggiunge ai filtri applicati, come il backend. Test: il PNG della riserva 2025 riceve un'intestazione che contiene 2025.
- **N-03** `src/features/finanziario/ui/DettaglioIntervento.tsx:24`: Il vuoto aggiunto per X-01 dice 'Nessuna domanda SIGC per questo intervento. Modifica i filtri.', ma nel dettaglio non ci sono filtri da modificare: la barra ha il solo chip fisso dell'intervento e nessun pannello (PaginaFinanziario.tsx:90, ContestoFiltri nullo), per questo vuotoConPerimetro accoda l'invito come testo (comuni.tsx:40). Il test casi-limite.test.tsx:177 fissa la frase.
  - Fix proposto: In DettaglioIntervento.tsx:24 non usare vuotoConPerimetro: `const SENZA_SIGC = (d: { perimetro?: Perimetro | null }) => <><PerimetroSezione perimetro={d.perimetro} />Nessuna domanda SIGC per questo intervento.</>`. Aggiornare l'attesa di tests/finanziario-casi-limite.test.tsx:177.
- **N-04** `src/features/finanziario/ui/comuni.tsx:150`: I pulsanti di TX-0009 (V-04) stanno sopra l'intera fila dei KPI con il solo 'CSV' e 'XLSX' visibili: in panoramica la fila ha tre tessere di TX-0002 e una di TX-0009 (nella pagina Domande due di TX-0010), e il file contiene solo le domande (sonda CONV/esito-scarica-kpi.txt, scarica-kpi.png). In panoramica restano anche con la selezione vuota, quando la tessera delle domande non c'e' (Panoramica.tsx:170).
  - Fix proposto: In ScaricaKpi rendere visibile l'oggetto accanto ai pulsanti (es. `<span className="ui-nota">{titolo}</span>` prima di PulsantiScarica), oppure portare i pulsanti nella tessera di TX-0009. In Panoramica montare ScaricaKpi dentro KpiDomande, cosi' sparisce con il segnale 'vuota'.

### Iterazione 3 (12/10/2026): PASS

Commit verificato: `3269d53` (correzioni dei residui dell'iterazione 2). Revisore di convergenza: 6 risolti (N-01, A-03,
X-04, N-02, N-03, N-04), 2 parziali (H-03, H-04), 0 non risolti; 3 nuovi, tutti MINORE. Verdetto meccanico sui residui
(`review/v3-iter3/residui.json`): **PASS**, 0 CRITICO, 0 MAGGIORE, 5 MINORE, score **85** (soglia 80). Budget: 3
iterazioni, usate tutte.

A-03 verificato nel browser vero (build sotto la CSP, canvas su un contenitore staccato, Chrome e Firefox): dopo il
drill-down il PNG di treemap e raggiera ha solo il livello scelto, come a schermo.

#### Residui al verdetto

- **H-03** [MINORE] `eslint.config.js:336`: Residuo di H-03 (PARZIALE): la regex sul testo dell'import blocca '..', '../index', '../api/' e '../..', ma da src/features/finanziario/lib/ passano con 0 errori '../../finanziario', '../../finanziario/index' e '../../finanziario/api' (e '../../../finanziario/api' da lib/grafici/): sono lo stesso barrel e gli stessi wrapper React Query, quindi la purezza di lib/ si aggira ancora con un import relativo.
  - Fix proposto: Usare una regola sul file risolto invece della regex sul testo dell'import: in boundaries/dependencies, dopo le regole allow, aggiungere `{ from: { element: { type: 'features', fileInternalPath: 'lib/**' } }, disallow: { to: { element: { type: 'features', fileInternalPath: ['api/**', 'ui/**', 'index.{ts,tsx}'] } } } }`, e una regola analoga per entities. Aggiungere le canary '../../finanziario' e '../../finanziario/api' in tests/eslint-regole.test.ts.
- **H-04** [MINORE] `eslint.config.js:32`: Residuo di H-04 (PARZIALE): `{ default as x }`, `import()` e `require` di axios ora scattano, ma `export { default as http } from 'axios'` e `export * as ax from 'axios'` passano con 0 errori, anche in shared/lib: un modulo che riesporta l'istanza di default la rende importabile ovunque con un nome locale, fuori dal mutator.
  - Fix proposto: In ogni blocco aggiungere a no-restricted-imports `paths: [{ name: 'axios', importNames: ['default', 'Axios'] }]`: la regola copre import, export-from ed export *, come verificato con ESLint (1 errore per ogni forma, 0 per isAxiosError). In alternativa aggiungere i selettori `ExportNamedDeclaration[source.value='axios'] > ExportSpecifier[local.name=/^(default|Axios)$/]` e `ExportAllDeclaration[source.value='axios']`. Aggiungere alle canary le due forme e il require.
- **M-01** [MINORE] `src/features/finanziario/lib/grafici/spesa.ts:185`: Con una dotazione negativa fuori dal grafico, etichetta e dettaglio della famiglia riportano la dotazione della famiglia, ma l'area del riquadro resta la somma delle sole foglie positive. Con SRA01 20 M€, SRA05 -15 M€ e SRB01 10 M€ il riquadro 'SRA 5,0 M€' è il doppio di 'SRB 10,0 M€', contiene 'SRA01 20,0 M€', e il dettaglio dice 'Famiglia SRA: 1 intervento, dotazione 5,0 M€' (CONV3/sonda-famiglie.test.ts); il test in finanziario-grafici.test.ts:384 fissa la frase contraddittoria.
  - Fix proposto: In nodoFamiglia, quando `f.fuoriGrafico !== 0`, usare un dettaglio esplicito, ad esempio `Famiglia SRA: dotazione 5,0 M€; 1 intervento nel grafico, 20,0 M€; 1 fuori dal grafico (dotazione zero o negativa), -15,0 M€`, e l'etichetta `SRA\n5,0 M€ (nel grafico 20,0 M€)`. Aggiornare l'attesa di finanziario-grafici.test.ts:384 e aggiungere il caso con il negativo grande.
- **M-02** [MINORE] `src/features/finanziario/lib/grafici/spesa.ts:161`: Le famiglie si costruiscono solo da perFamiglia: una famiglia con soli interventi a dotazione zero, negativa o assente non ha la riga 'Totale della famiglia' e resta fuori dalla descrizione. Con SRD01 a -5 M€ le famiglie sommano 20 M€ mentre il KPI della dotazione dice 15 M€; con SRD01 assente la descrizione afferma 'la famiglia con la dotazione maggiore è SRA (20,0 M€)' mentre il KPI dice 'Non calcolabile: manca per 1 intervento (SRD01)' (CONV3/sonda-famiglie.test.ts).
  - Fix proposto: Costruire `famiglie` dall'unione delle chiavi di perFamiglia, fuoriPer e mancantiPer, con foglie vuote dove serve: la tabella dà a ogni famiglia la riga 'Totale della famiglia', e `parziali` e il confronto le considerano tutte. A serieFamiglie passare solo le famiglie che hanno foglie. Test: SRA01 20 M€ + SRD01 -5 M€ dà 'SRD | Totale della famiglia | -5.000.000,00 €'; SRA01 20 M€ + SRD01 assente dà 'dotazione non calcolabile per SRD (manca per SRD01)'.
- **M-03** [MINORE] `eslint.config.js:336`: La nuova regex del barrel vale per ogni src/**/lib/**. Da src/shared/lib/grafici/ blocca quindi anche `import { formatEuro } from '..'` e `'../index'`, che puntano al barrel puro src/shared/lib/index.ts, con il messaggio 'niente barrel della feature (riesporta ui/ e api/)', lì falso (sonde --stdin, CONV3/eslint-h03-h04.txt).
  - Fix proposto: Applicare la regex del barrel solo a `src/features/*/lib/**` e `src/entities/*/lib/**`, in un blocco che ripete gli altri pattern di no-restricted-imports, oppure eliminarla con la regola di boundaries proposta per il residuo di H-03. Canary in tests/eslint-regole.test.ts: da src/shared/lib/grafici/ l'import '..' non deve scattare.

#### Correzioni dopo il verdetto (12/10/2026)

Applicate dopo il PASS, senza cambiare il verdetto (che resta quello di `3269d53`). Gate di step8 rieseguito in sola
verifica: 11/11, 729 test verdi, 7 e2e verdi.

| Residuo | Esito | Dove |
|---|---|---|
| H-03 | Risolto. Nei `lib/` di feature ed entity vietati anche lo slice per nome (`'../../finanziario'`, `'../../finanziario/api'`, da `lib/` e da `lib/<sotto>/`); i nomi dei layer (`shared`, `entities`, ...) restano ammessi. Una regola di `boundaries` sul file risolto non scattava (`fileInternalPath` su `from` non supportato): regex sullo specificatore. Canary. | `eslint.config.js`, `tests/eslint-regole.test.ts` |
| H-04 | Risolto. Vietate anche le riesportazioni di axios (`export { default as x } from`, `export * from`, `export * as`). Canary, anche per `require`. | `eslint.config.js`, `tests/eslint-regole.test.ts` |
| M-01 | Risolto. Con dotazioni zero o negative la famiglia dice la sua dotazione e la parte disegnata ("SRA 19,0 M€ (nel grafico 20,0 M€)"); il dettaglio conta gli interventi fuori dal grafico. | `src/features/finanziario/lib/grafici/spesa.ts` |
| M-02 | Risolto. Ogni famiglia ha la riga "Totale della famiglia", anche senza interventi disegnati, e il confronto della descrizione le considera tutte; nel grafico solo le famiglie con foglie. | `src/features/finanziario/lib/grafici/spesa.ts` |
| M-03 | Risolto. Le regex del barrel valgono solo per i `lib/` di feature ed entity: in `shared/lib` `'..'` e `'../index'` (il barrel puro) sono ammessi. Canary. | `eslint.config.js` |

#### Punti aperti e limiti

- OP-FE-08: il PNG non ha la riga di AUDIT_ESPORTAZIONE (scelta dell'utente del 12/10/2026); serve un endpoint del
  backend per registrarlo.
- Fuori dal perimetro della review e non toccate: `Layout`, `useInattivita`, `Home` (src/app) e l'interceptor del
  mutator superano le soglie della checklist; erano gia' cosi' alla review v2 e restano fuori dal blocco ESLint delle
  soglie.
- Restano quelli della review v2: OP-FE-03, OP-FE-05, OP-FE-06, OP-FE-07; profilo WebKit mobile degli e2e mai eseguito.

---

## Review v2: UI v2 (PASS, score 88, 09/10/2026)

Intensita' **FULL**. Verdetto meccanico (`review-score.sh FULL review/finanziario-findings.json`): **PASS**, score
**88** (soglia 80), 0 CRITICO, 0 MAGGIORE, 3 MINORE, 3 COSMETICO. Commit verificato: `d9c427f`. Budget: 3 iterazioni,
usate tutte.

La UI v2 (richiesta dell'utente dell'08/10/2026, ADR 0027 del plugin) ha rifatto la catena da step1: ECharts, kit
dell'interfaccia riusabile in `src/shared/ui` e `src/shared/lib/grafici`, panoramica, dettaglio dell'intervento,
pannello dei filtri. La review della UI v1 (score 82, commit `57cd812`) resta nella storia di git.

### Percorso

| Iterazione | Commit | Chi | Esito |
|---|---|---|---|
| 1 | `dadc66c` | lenti V (fedelta'), H (FSD e SRP), A (red-team), antagonista, Judge | 65 finding, 62 accettati: 1 CRITICO, 10 MAGGIORE, 47 MINORE, 4 COSMETICO |
| 2 | `11d0711` | revisore di convergenza | 49 risolti, 12 parziali, 1 non risolto; 25 nuovi (15 MINORE, 10 COSMETICO); residui 20 MINORE, 18 COSMETICO (score 22: FAIL) |
| 3 | `d9c427f` | revisore di convergenza | 35 risolti, 2 parziali, 1 non risolto; 3 nuovi (MINORE); residui 3 MINORE, 3 COSMETICO (score 88: PASS) |

Dettaglio di ogni iterazione in `review/v2-iter1/`, `review/v2-iter2/`, `review/v2-iter3/`: finding delle lenti,
verdetti del Judge, esiti della convergenza, nuovi finding, residui.

Gate non declassabili (FE): `contextProjection` mai usata come controllo di sicurezza (l'impronta dell'identita' serve
solo a svuotare la cache), CSRF invariato, nessun allargamento dei grant (`check-ui-authz`: deny-by-default e
anti-widening, 9 route). Gate meccanico di step8 11/11 dopo ogni giro di correzioni; 642 test, 4 e2e sulla build di
produzione con la CSP del README.

Temi principali corretti nelle iterazioni 1 e 2:
- aggregati dei KPI in lib, mai somme parziali (il CRITICO H-01), e regole uniche su importi, avanzamento e perimetro ADA;
- grafici: opzioni memoizzate, primitive nel kit, perimetro ADA in cascata e sankey, tooltip `richText` per la CSP
  (verificata da un e2e);
- shell: pagina d'errore e pagina non trovata dentro la shell, titolo e focus del dettaglio in ogni stato;
- dettaglio dell'intervento: dati del solo intervento, con la selezione dell'utente conservata nell'indirizzo;
- un solo avviso d'errore per pagina; attesa del legame interventi - azioni prima di applicare il filtro azione;
- coda delle letture coordinata fra le schede (tetti dell'app, primo lock libero, guardia dall'invio), lettura pura
  della sessione con l'impronta dell'identita';
- confini: fixture ed esempi MSW nella feature, vietati nel codice di produzione; canary del lint per soglie e barrel.

### Finding accettati (residui)

#### MINORE

- **M-01** `src/shared/api/mutator/bff-mutator.ts:130`: il timeout della guardia (ETIMEDOUT senza risposta) e'
  trattato da `soloTransitori` come rete assente e riprovato 3 volte; una lettura appesa da' l'errore dopo circa 8
  minuti invece che alla guardia.
  - Fix proposto: in `soloTransitori`, `if (errore.code === AxiosError.ETIMEDOUT) return false;`, con un test.
- **M-02** `src/shared/ui/stati/AvvisoPagina.tsx:40`: dopo un "Riprova" riuscito l'avviso si smonta insieme al
  pulsante che ha il focus, che finisce su BODY (WCAG 2.4.3).
  - Fix proposto: un contenitore sempre montato con `tabIndex=-1` che riceve il focus quando gli errori tornano a zero.
- **M-03** `eslint.config.js:259`: il divieto dei moduli di prova (Z-02) non copre `src/features/*/api/**`, che il
  blocco dei consumatori ignora: `api/index.ts` potrebbe importare `./mock/esempio` o `../testing/fixture`.
  - Fix proposto: un blocco per `src/features/*/api/**` (escluso `api/mock/**`) con il gruppo dei moduli di prova, piu'
    una canary da `api/`.

#### COSMETICO

- **V-22** `src/features/finanziario/ui/PannelloFiltri.tsx:134`: il pulsante del pannello e' "Applica i filtri", il
  wireframe dice "Mostra n interventi". Il conteggio n richiede il legame intervento - OG/OS/OP, che TX-0001 non
  espone. Accettato dall'utente il 09/10/2026 come deviazione rivista del wireframe panoramica (stato di step1,
  `deviations_reviewed`; uiplan, OP-FE-07).
- **N-08** `src/features/finanziario/lib/grafici/domande.ts:99`: la nota sulle domande senza importo ammesso e'
  scritta due volte con testi diversi ("nella somma" in `aggregati.ts`, "nelle somme" nel builder).
- **N-24** `src/pages/finanziario/panoramica/page.tsx:7`: la pagina passa un sottotitolo identico a quello del
  catalogo.

### Finding contestati (CRITICO rigettati)

Nessuno. Il Judge dell'iterazione 1 ha rigettato 3 finding, tutti duplicati (V-02 e V-13 di H-01, A-06 di H-04).

### Limiti accettati e punti aperti

- Ritorno alla pagina dopo un 401: limite noto accettato dall'utente (OP-FE-06).
- Gerarchia intervento - OS - OG - OP dal backend (OP-FE-07), fonte del pagato SIGC (OP-FE-05), filtri della riserva
  (OP-FE-03).
- Il profilo WebKit mobile degli e2e (`E2E_WEBKIT=1`) non e' mai stato eseguito: WebKit non e' installato sulle
  postazioni di sviluppo.
- Una lettura gia' in attesa resta legata al lock del proprio posto anche se se ne libera un altro; l'attesa e'
  limitata dalla guardia (120 s).

### Correzioni dopo la review (09/10/2026)

Applicate dopo il PASS, senza cambiare il verdetto (che resta quello di `d9c427f`). Gate di step8 rieseguito in sola
verifica: 11/11, 650 test verdi, 4 e2e verdi.

| Residuo | Esito | Dove |
|---|---|---|
| M-01 | Risolto. La lettura chiusa dalla guardia (ETIMEDOUT) non si riprova: l'errore arriva alla guardia. Test L1. | `src/shared/api/retry/nuovi-tentativi.ts`, `tests/query-client.test.ts` |
| M-02 | Risolto. Il contenuto della pagina sta in un contenitore con `tabIndex=-1`, che riceve il focus quando l'avviso sparisce dopo un "Riprova" riuscito e il focus era finito su BODY. Test L2. | `src/shared/ui/stati/AvvisoPagina.tsx`, `tests/shared-ui.test.tsx` |
| M-03 | Risolto, e piu' largo del finding: `no-restricted-imports` confronta lo specificatore scritto, quindi i percorsi relativi dentro lo slice (`../testing/fixture`, `./mock/esempio`) passavano anche da `ui/` e `lib/`. Il gruppo Z-02 ora li comprende, e un blocco nuovo lo applica ai wrapper `api/`. Canary da `api/`, `ui/` e `lib/`; prova di mutazione: con il gruppo precedente 4 canary falliscono. | `eslint.config.js`, `tests/eslint-regole.test.ts` |
| N-08 | Risolto. Una sola frase (`testoSenzaAmmesso`) per la nota del KPI e per le voci omesse del grafico. | `src/features/finanziario/lib/aggregati.ts`, `lib/grafici/domande.ts` |
| N-24 | Risolto. La panoramica usa il sottotitolo del catalogo. | `src/pages/finanziario/panoramica/page.tsx` |
| V-22 | Accettato dall'utente (09/10/2026): resta "Applica i filtri" finche' il backend non espone il legame intervento-OS-OG-OP (OP-FE-07). Deviazione rivista registrata. | `.claude/state/`, `uiplan.json` |

### Dipendenze (09/10/2026)

axios portato da 1.19.0 a 1.20.0 (advisory alte sulla 1.19.0, fra cui gadget di prototype pollution e header injection),
su richiesta dell'utente. Verifiche: 650 test, 4 e2e, gate di step8 11/11. Resta nell'audit di produzione
`@xmldom/xmldom` 0.8.13 (bootstrap-italia -> video.js -> mpd-parser): l'app importa di bootstrap-italia solo il CSS e
gli sprite SVG, quindi il pacchetto non entra nel bundle.
