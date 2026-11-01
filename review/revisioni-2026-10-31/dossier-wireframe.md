# Dossier del gate wireframe - revisioni del finanziario (MIN-20261031), cinque feature

Preparato il 01/11/2026. Le cinque feature sono STALE col pack 1.5.0 (`refresh/1.5.0-impact.json`): handover dai manifest
risigillati del backend (b65343b), fe-handover-check pass, riapertura da step1. Carry-over: i 21 flussi REVOCATI (ogni
cartella e' cambiata); nessuna approvazione registrata ne' negli stati ne' negli uiplan (tolte le `approval` revocate).
Fonti: `cruscotto-lazio-spec/decisioni/MIN-20261031-revisioni-finanziario.md`, analisi
`analisi-2026-10-31/E-impatto-fe.md`, bozze `analisi-2026-10-31/wireframe-bozze/` (copiate in `wireframes/`).

## Scelte dell'utente (01/11/2026)

| punto | scelta |
|---|---|
| R13 Importi SIGC (panoramica, pagina SIGC, scheda SIGC del dettaglio) | B: due barre impilate (richiesto = ammesso + non ammesso; ammesso = pagato + ancora da pagare) |
| R17 Montante e riserve 5% e 2% | A: montante in alto e due riquadri col badge Consuntivo o Previsione |
| R18 Utilizzo progressivo cumulato | A: linea a gradini con le fasi annotate, soglia della riserva e testo di lettura |
| R20 Testi delle card della Home | Fisico "Output regionale, superfici ammissibili e pagamenti per Unit Amount, per intervento."; Procedurale "Stati, sottofasi e domande ammesse, con riepilogo per intervento e determine." |
| R03 Sei box della panoramica | griglia 3 x 2 a coppie per colonna |
| Natura delle card del procedurale | solo NO SIGC, tranne "Domande per stato area programmazione" (si ricalcola) |
| Link dei pagamenti del riepilogo | sulla cella nuova Pagamenti lordi (stesso importo dell'elenco) |

Le alternative scartate sono state tolte dai wireframe; restano nella storia di git (3fd457d).

## Cosa cambia, per feature

| feature | flussi | modifiche |
|---|---|---|
| finanziario | panoramica (+ dettaglio), riepilogo, dotazione-avanzamento, domande, sigc (+ riserva) | controllo Tutti/SIGC/NO SIGC nella barra dei filtri; R03 sei box con l'impegnato e "di cui stimato"; R13 B; R16; dettaglio col tipo dell'intervento al posto del contributo ambientale (niente TX-0002), R15, rettifiche (R08), stanziato dai bandi; riepilogo con pagamenti lordi, rettifiche, con rettifiche, di cui stimato (R08, R12); dotazione senza contributo ambientale, quote Stato/Regione e vincolo LEADER (R14, R21, X3), ciambelle con importi e totale (R05, R06); avanzamento con stanziato e impegnato attivi, nota della stima, residuo sui pagamenti per intervento con le rettifiche; riserva R17 A e R18 A senza filtri (F4) |
| elenco-operativo | domande, dettaglio-domanda, pagamenti | controllo SIGC spostato dal pannello alla barra, ora per intervento (D-12 Rev.); R09 sui sinottici |
| fisico | superfici, output-regionale, unit-amount, intervento | controllo SIGC (superfici solo SIGC: non pertinenti con NO SIGC); R20 nella card della Home; dettaglio col tipo dell'intervento |
| istituzionale | verifica-smp-non-sigc, verifica-smp-sigc, intervento | controllo SIGC (ognuna di un solo tipo: non pertinente col filtro opposto); dettaglio col tipo |
| procedurale | panoramica, stati, ammesse, sottofasi, riepilogo, determine | controllo SIGC (pagine NO SIGC, tranne la card degli stati area programmazione); RF027 nell'ordine di Utilities SIAN; R20 nella card della Home; determine senza filtro |

In ogni `.md` la sezione "Revisioni del 31/10/2026" dice la natura di ogni card col filtro SIGC e le regole comuni del kit
(assi R02, sinottici su una riga R09, barra dei filtri attaccata al bordo R11, tabelle con intestazione ferma R12, ciambelle
con importi e totale R05 e R06, card non pertinenti F3).

## Route, grant e campi (uiplan)

- Grant: catalogo dell'handover invariato (cambia solo il pin del pack). Unica modifica: `/finanziario/interventi/:codice`
  senza TX-0002, `csr.tx-0002.read` e RF002 (il contributo ambientale non c'e' piu'; i pagamenti vengono da TX-0011).
- Finanziario: tolti 7 campi (quotaStato, quotaRegione, vincoloDotazioneLeader, percentualeContributoAmbientale in dotazione
  e dettaglio, importoRecuperato, pagamenti di TX-0002 nel dettaglio); aggiunti 67 campi con provenance spec (impegnato
  di spesa pubblica e stimato, stimaImpegni, pagamenti lordi, rettifiche e loro righe, fonte delle rettifiche, residuo sui
  pagamenti per intervento, quote e natura della riserva, perimetro dell'intervento).
- Fisico, istituzionale, procedurale: `url_params` `sigc` (dalla spec pinnata, `<TX>.sigc`) sulle route di report; nessuno
  sui dettagli (F5) ne' sulle determine; campo del tipo dell'intervento nel dettaglio (interventi[].perimetro di TX-0060 o
  TX-0024). Elenco operativo: `sigc` gia' presente, cambia la semantica (per intervento).
- `uiplan-validate.sh` e `fe-project-check.sh`: rc 0 per le cinque feature.

## WCAG e residuo dichiarato

- `wireframe-lint.sh` (template v2): esito per cartella nella tabella sotto (classi, tag, a11y statici). **axe:
  deferred-to-step8** (serve il DOM): e' bloccante nel gate 11/11 dello step8.
- Controllo SIGC: gruppo di tre bottoni con `aria-pressed` e `aria-label` "Interventi SIGC o NO SIGC"; il cambio di filtro
  si annuncia come gli altri chip.
- Card non pertinenti: motivo in testo (badge e frase), corpo non interattivo, tabella equivalente leggibile dagli strumenti
  assistivi. RESIDUO umano: contrasto del corpo in grigio da misurare con axe allo step8 e a vista.
- Dettagli: pill "Tipo di intervento: SIGC / NO SIGC" in testo, non solo colore.

## Open point

Nessun open point nuovo. Restano: OP-FE-03 (riserva senza filtri, ora anche senza filtro SIGC: F4) e quelli dei flussi
gia' approvati, invariati.

## Flussi da approvare (21)

Aprire nel browser i file HTML della cartella (`wireframes/<cartella>/`). Hash canonico della cartella con
`wireframe-hash.sh`, calcolato prima della presentazione.

| feature | flusso | cartella | file da aprire | lint | hash |
|---|---|---|---|---|---|
| finanziario | panoramica | `wireframes/panoramica` | intervento.html, panoramica.html | pass | `sha256:7831bc3f2e835b39fcd7d1dfcd4fe1cc72cfa0f4512e0baa77000360099912f6` |
| finanziario | riepilogo | `wireframes/riepilogo` | riepilogo.html | pass | `sha256:79a25c749adb1022552c787a6b068f16d0e2ec1271068295277957ce0c2975ef` |
| finanziario | dotazione-avanzamento | `wireframes/dotazione-avanzamento` | avanzamento.html, dotazione.html | pass | `sha256:95b817b2e07c1f9b1dae17d21182629ecce678fa7929e2f34b8597877ab9821e` |
| finanziario | domande | `wireframes/domande` | domande.html | pass | `sha256:078555864f049b03fae3723801d1abe0755caaabcf727741a1f1ff6c81ba642e` |
| finanziario | sigc | `wireframes/sigc` | riserva.html, sigc.html | pass | `sha256:eab1ffa893b6696e2313e217459c5c1033230eb01a05dc6b8107b63fa3bf0cf2` |
| elenco-operativo | domande | `wireframes/elenco-operativo/domande` | domande.html | pass | `sha256:7d56aed4a5aea1177abd6d4755ff9e1123369ef1b837a327d230655d28ad8acb` |
| elenco-operativo | dettaglio-domanda | `wireframes/elenco-operativo/dettaglio-domanda` | dettaglio-domanda.html | pass | `sha256:4555d1e5508ddb3923d617adaf7079635f38d2e5b030ea8e4f585a85fecf77b2` |
| elenco-operativo | pagamenti | `wireframes/elenco-operativo/pagamenti` | pagamenti.html | pass | `sha256:327903337fe2e2b69e6c0d6f8d842e7be28f24c85a049ba268cad72cdb4bae1a` |
| fisico | superfici | `wireframes/fisico/superfici` | home.html, superfici.html | pass | `sha256:d642ae588608d0c35430670e46efb4a3f3c6cd49c64b9fb0f6e154269f187921` |
| fisico | output-regionale | `wireframes/fisico/output-regionale` | output-regionale.html | pass | `sha256:5d85c16182cbc222b548723b50266d7d7c54cfc10cccb3131b9452219a4e88ff` |
| fisico | unit-amount | `wireframes/fisico/unit-amount` | unit-amount.html | pass | `sha256:a55975764e3a33d49bffa6230ffadcba6e4c66f08ad1bd09ae6527bf8c38862a` |
| fisico | intervento | `wireframes/fisico/intervento` | intervento.html | pass | `sha256:8912ef454802da00f68e89757c502b5042a1e3a803cb146c310874ee02c5fea7` |
| istituzionale | verifica-smp-non-sigc | `wireframes/istituzionale/verifica-smp-non-sigc` | home.html, verifica-smp-non-sigc.html | pass | `sha256:f1a61879d14a841ba5e70663aadc391d47293777e0c82a42d5c87271c3a00cff` |
| istituzionale | verifica-smp-sigc | `wireframes/istituzionale/verifica-smp-sigc` | verifica-smp-sigc.html | pass | `sha256:d0af0beb1dc3e14ba71f476259c652db72acafea83269ed43c034f89ff9b9fe4` |
| istituzionale | intervento | `wireframes/istituzionale/intervento` | intervento.html | pass | `sha256:1e5a767887afd3187aa19e07ebd7d76e991e684df40e3a710342fcb714137d3b` |
| procedurale | panoramica | `wireframes/procedurale/panoramica` | home.html, intervento.html, panoramica.html | pass | `sha256:7bab43374ff4be639b25c2024b3d296880f6db4d600c599be734199b74960127` |
| procedurale | stati | `wireframes/procedurale/stati` | stati-pagamento.html, stati-sostegno.html | pass | `sha256:666e4d185c54a994578478820d4d0eea9debab8e05c46b1e1482bfd5a3791322` |
| procedurale | ammesse | `wireframes/procedurale/ammesse` | ammesse.html | pass | `sha256:6b0e18fe836095b1a8fc5b52a36c85c999f8a52749e6edaa8bfb9ccb845432a7` |
| procedurale | sottofasi | `wireframes/procedurale/sottofasi` | sottofasi.html | pass | `sha256:327ee4626afe3d6cd89214142139a3f9bb38542462262484c067c1b0b5f9f028` |
| procedurale | riepilogo | `wireframes/procedurale/riepilogo` | riepilogo.html | pass | `sha256:229cc5b96bac06ffda3a72cad7e8dd9ae5ef8ac8d7933c0d2ff2deab069e17f5` |
| procedurale | determine | `wireframes/procedurale/determine` | determine.html | pass | `sha256:e61fb80a776b464c8060a283da8b9d44c791083fc348b56eb565a9cffade87ee` |
